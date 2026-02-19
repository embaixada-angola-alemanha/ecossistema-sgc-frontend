import { Component, inject, signal, computed, OnInit, DestroyRef, ElementRef } from '@angular/core';
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
import { TranslateModule, TranslateService } from '@ngx-translate/core';
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
import { ConfirmDialog, ConfirmDialogData } from '../../../shared/components/confirm-dialog/confirm-dialog';

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
  private readonly translate = inject(TranslateService);
  private readonly elementRef = inject(ElementRef);

  readonly loading = signal(true);
  readonly agendamentos = signal<Agendamento[]>([]);
  readonly totalElements = signal(0);
  readonly calendarDays = signal<CalendarDay[]>([]);
  readonly currentMonthLabel = signal('');

  /** Group flat calendarDays into rows of 7 for the table layout */
  readonly calendarWeeks = computed<CalendarDay[][]>(() => {
    const days = this.calendarDays();
    const weeks: CalendarDay[][] = [];
    for (let i = 0; i < days.length; i += 7) {
      weeks.push(days.slice(i, i + 7));
    }
    return weeks;
  });

  readonly displayedColumns = ['cidadaoNome', 'numeroAgendamento', 'tipo', 'dataHora', 'estado', 'actions'];
  readonly tipoValues = TIPO_AGENDAMENTO_VALUES;
  readonly estadoValues = ESTADO_AGENDAMENTO_VALUES;
  get weekDays(): string[] {
    return [
      this.translate.instant('calendar.mon'),
      this.translate.instant('calendar.tue'),
      this.translate.instant('calendar.wed'),
      this.translate.instant('calendar.thu'),
      this.translate.instant('calendar.fri'),
      this.translate.instant('calendar.sat'),
      this.translate.instant('calendar.sun'),
    ];
  }

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
      error: () => this.snackBar.open(this.translate.instant('common.error.statusChange'), '', { duration: 3000 }),
    });
  }

  getAllowedTransitions(agendamento: Agendamento): EstadoAgendamento[] {
    return AGENDAMENTO_TRANSITIONS[agendamento.estado] ?? [];
  }

  deleteAgendamento(agendamento: Agendamento): void {
    const dialogRef = this.dialog.open(ConfirmDialog, {
      width: 'min(400px, 90vw)',
      data: {
        title: this.translate.instant('common.confirm.title'),
        message: this.translate.instant('common.confirm.delete', { name: agendamento.numeroAgendamento }),
        warn: true,
      } as ConfirmDialogData,
    });
    dialogRef.afterClosed().subscribe(confirmed => {
      if (!confirmed) return;
      this.agendamentoService.delete(agendamento.id).subscribe({
        next: () => this.loadData(),
        error: () => this.snackBar.open(this.translate.instant('common.error.deleteFailed'), '', { duration: 3000 }),
      });
    });
  }

  /** Handle Enter/Space on a calendar day cell - open first event or do nothing */
  onDayActivate(day: CalendarDay): void {
    if (day.events.length > 0) {
      this.openDetail(day.events[0]);
    }
  }

  /** Arrow key navigation within the calendar grid */
  onCalendarDayKeydown(event: KeyboardEvent, currentDay: CalendarDay): void {
    const days = this.calendarDays();
    const currentIndex = days.findIndex(d => d.date.getTime() === currentDay.date.getTime());
    if (currentIndex === -1) return;

    let targetIndex = -1;

    switch (event.key) {
      case 'ArrowRight':
        targetIndex = currentIndex + 1;
        break;
      case 'ArrowLeft':
        targetIndex = currentIndex - 1;
        break;
      case 'ArrowDown':
        targetIndex = currentIndex + 7;
        break;
      case 'ArrowUp':
        targetIndex = currentIndex - 7;
        break;
      case 'Home':
        // Move to start of the week row
        targetIndex = currentIndex - (currentIndex % 7);
        break;
      case 'End':
        // Move to end of the week row
        targetIndex = currentIndex - (currentIndex % 7) + 6;
        break;
      default:
        return; // Don't prevent default for non-navigation keys
    }

    event.preventDefault();

    if (targetIndex >= 0 && targetIndex < days.length) {
      this.focusCalendarDay(targetIndex);
    } else if (targetIndex < 0) {
      // Navigate to previous month
      this.prevMonth();
    } else if (targetIndex >= days.length) {
      // Navigate to next month
      this.nextMonth();
    }
  }

  /** Focus a specific calendar day cell by index */
  private focusCalendarDay(index: number): void {
    const gridCells = this.elementRef.nativeElement.querySelectorAll('td.calendar-day');
    if (gridCells[index]) {
      (gridCells[index] as HTMLElement).focus();
    }
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

    const monthKeys = [
      'calendar.january', 'calendar.february', 'calendar.march', 'calendar.april',
      'calendar.may', 'calendar.june', 'calendar.july', 'calendar.august',
      'calendar.september', 'calendar.october', 'calendar.november', 'calendar.december',
    ];
    this.currentMonthLabel.set(`${this.translate.instant(monthKeys[month])} ${year}`);

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
        this.snackBar.open(this.translate.instant('common.error.loadFailed'), '', { duration: 3000 });
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
        this.snackBar.open(this.translate.instant('common.error.loadFailed'), '', { duration: 3000 });
      },
    });
  }

  onViewChange(): void {
    this.loadData();
  }
}
