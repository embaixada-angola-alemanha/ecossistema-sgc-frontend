import { Component, inject, signal, OnInit, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateModule } from '@ngx-translate/core';
import { DatePipe } from '@angular/common';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { AgendamentoService } from '../../../core/services/agendamento.service';
import { AuthService } from '../../../core/services/auth.service';
import {
  Agendamento, EstadoAgendamento, TipoAgendamento,
  TIPO_AGENDAMENTO_VALUES, ESTADO_AGENDAMENTO_VALUES, AGENDAMENTO_TRANSITIONS,
} from '../../../core/models/agendamento.model';
import { LoadingSpinner } from '../../../shared/components/loading-spinner/loading-spinner';
import { StatusBadge } from '../../../shared/components/status-badge/status-badge';
import { AgendamentoDetailDialog } from '../agendamento-detail/agendamento-detail';

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  isWeekend: boolean;
  events: Agendamento[];
}

@Component({
  selector: 'sgc-agendamento-list',
  standalone: true,
  imports: [
    FormsModule, DatePipe,
    MatCardModule, MatIconModule, MatButtonModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatTableModule, MatPaginatorModule, MatSortModule,
    MatMenuModule, MatButtonToggleModule, MatTooltipModule,
    TranslateModule,
    LoadingSpinner, StatusBadge,
  ],
  templateUrl: './agendamento-list.html',
  styleUrl: './agendamento-list.scss',
})
export class AgendamentoList implements OnInit {
  private readonly agendamentoService = inject(AgendamentoService);
  private readonly authService = inject(AuthService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly loading = signal(true);
  readonly agendamentos = signal<Agendamento[]>([]);
  readonly totalElements = signal(0);
  readonly calendarDays = signal<CalendarDay[]>([]);
  readonly currentMonthLabel = signal('');

  readonly displayedColumns = ['cidadaoNome', 'numeroAgendamento', 'tipo', 'dataHora', 'estado', 'actions'];
  readonly tipoValues = TIPO_AGENDAMENTO_VALUES;
  readonly estadoValues = ESTADO_AGENDAMENTO_VALUES;
  readonly weekDays = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab', 'Dom'];

  viewMode: 'calendar' | 'table' = 'calendar';
  page = 0;
  pageSize = 20;
  search = '';
  estadoFilter: EstadoAgendamento | '' = '';
  tipoFilter: TipoAgendamento | '' = '';

  currentMonth = new Date();

  private readonly searchSubject = new Subject<string>();

  readonly canCreate = this.authService.hasAnyRole('ADMIN', 'CONSUL', 'OFFICER');
  readonly canEdit = this.authService.hasAnyRole('ADMIN', 'CONSUL', 'OFFICER');
  readonly canChangeStatus = this.authService.hasAnyRole('ADMIN', 'CONSUL', 'OFFICER');
  readonly canDelete = this.authService.isAdmin();

  ngOnInit(): void {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(() => {
      this.page = 0;
      this.loadData();
    });

    this.loadData();
  }

  onSearchInput(value: string): void {
    this.search = value;
    this.searchSubject.next(value);
  }

  onFilterChange(): void {
    this.page = 0;
    this.loadData();
  }

  onPageChange(event: PageEvent): void {
    this.page = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadData();
  }

  onSort(_sort: Sort): void {
    this.loadData();
  }

  openCreate(): void {
    this.router.navigate(['/agendamentos/new']);
  }

  openDetail(agendamento: Agendamento): void {
    const ref = this.dialog.open(AgendamentoDetailDialog, {
      width: '600px',
      data: { agendamentoId: agendamento.id },
    });
    ref.afterClosed().subscribe((result) => {
      if (result) this.loadData();
    });
  }

  openReschedule(agendamento: Agendamento): void {
    this.router.navigate(['/agendamentos', agendamento.id, 'edit']);
  }

  changeEstado(agendamento: Agendamento, estado: EstadoAgendamento): void {
    this.agendamentoService.updateEstado(agendamento.id, estado).subscribe({
      next: () => this.loadData(),
      error: () => this.snackBar.open('Erro ao alterar estado', '', { duration: 3000 }),
    });
  }

  getAllowedTransitions(agendamento: Agendamento): EstadoAgendamento[] {
    return AGENDAMENTO_TRANSITIONS[agendamento.estado] ?? [];
  }

  deleteAgendamento(agendamento: Agendamento): void {
    if (!confirm(`Eliminar agendamento ${agendamento.numeroAgendamento}?`)) return;
    this.agendamentoService.delete(agendamento.id).subscribe({
      next: () => this.loadData(),
      error: () => this.snackBar.open('Erro ao eliminar', '', { duration: 3000 }),
    });
  }

  prevMonth(): void {
    this.currentMonth = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() - 1, 1);
    this.loadData();
  }

  nextMonth(): void {
    this.currentMonth = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() + 1, 1);
    this.loadData();
  }

  goToToday(): void {
    this.currentMonth = new Date();
    this.loadData();
  }

  private loadData(): void {
    this.loading.set(true);

    if (this.viewMode === 'calendar') {
      this.loadCalendarData();
    } else {
      this.loadTableData();
    }
  }

  private loadCalendarData(): void {
    const year = this.currentMonth.getFullYear();
    const month = this.currentMonth.getMonth();

    const monthNames = [
      'Janeiro', 'Fevereiro', 'Marco', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
    ];
    this.currentMonthLabel.set(`${monthNames[month]} ${year}`);

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    // Start from Monday before first day
    let startOffset = firstDay.getDay() - 1;
    if (startOffset < 0) startOffset = 6;
    const calStart = new Date(year, month, 1 - startOffset);

    // End on Sunday after last day
    let endOffset = 7 - lastDay.getDay();
    if (endOffset === 7) endOffset = 0;
    const calEnd = new Date(year, month + 1, endOffset);

    const dataInicio = calStart.toISOString();
    const dataFim = calEnd.toISOString();

    this.agendamentoService.getAll(0, 500, undefined,
      this.estadoFilter || undefined,
      this.tipoFilter || undefined,
      dataInicio, dataFim,
    ).subscribe({
      next: (data) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const days: CalendarDay[] = [];
        const current = new Date(calStart);

        while (current <= calEnd) {
          const dayDate = new Date(current);
          const dayStr = dayDate.toISOString().slice(0, 10);
          const dayEvents = data.content.filter((a) => a.dataHora.startsWith(dayStr));

          days.push({
            date: dayDate,
            isCurrentMonth: dayDate.getMonth() === month,
            isToday: dayDate.getTime() === today.getTime(),
            isWeekend: dayDate.getDay() === 0 || dayDate.getDay() === 6,
            events: dayEvents,
          });

          current.setDate(current.getDate() + 1);
        }

        this.calendarDays.set(days);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.snackBar.open('Erro ao carregar agendamentos', '', { duration: 3000 });
      },
    });
  }

  private loadTableData(): void {
    this.agendamentoService.getAll(
      this.page,
      this.pageSize,
      undefined,
      this.estadoFilter || undefined,
      this.tipoFilter || undefined,
    ).subscribe({
      next: (data) => {
        this.agendamentos.set(data.content);
        this.totalElements.set(data.totalElements);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.snackBar.open('Erro ao carregar agendamentos', '', { duration: 3000 });
      },
    });
  }

  onViewChange(): void {
    this.loadData();
  }
}
