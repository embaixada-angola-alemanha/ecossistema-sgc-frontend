import { Component, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateModule } from '@ngx-translate/core';
import { DatePipe } from '@angular/common';
import { AgendamentoService } from '../../../core/services/agendamento.service';
import { CidadaoService } from '../../../core/services/cidadao.service';
import { AuthService } from '../../../core/services/auth.service';
import { CitizenContextService } from '../../../core/services/citizen-context.service';
import { Cidadao } from '../../../core/models/cidadao.model';
import {
  Agendamento, AgendamentoCreate, SlotDisponivel,
  TipoAgendamento, TIPO_AGENDAMENTO_VALUES,
} from '../../../core/models/agendamento.model';
import { LoadingSpinner } from '../../../shared/components/loading-spinner/loading-spinner';

@Component({
  selector: 'sgc-agendamento-form',
  standalone: true,
  imports: [
    FormsModule, DatePipe,
    MatCardModule, MatFormFieldModule, MatInputModule,
    MatSelectModule, MatButtonModule, MatIconModule,
    MatDatepickerModule, MatNativeDateModule, MatChipsModule,
    TranslateModule,
    LoadingSpinner,
  ],
  templateUrl: './agendamento-form.html',
  styleUrl: './agendamento-form.scss',
})
export class AgendamentoForm implements OnInit {
  private readonly agendamentoService = inject(AgendamentoService);
  private readonly cidadaoService = inject(CidadaoService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly snackBar = inject(MatSnackBar);
  private readonly authService = inject(AuthService);
  private readonly citizenContext = inject(CitizenContextService);

  readonly loading = signal(false);
  readonly loadingSlots = signal(false);
  readonly cidadaos = signal<Cidadao[]>([]);
  readonly slots = signal<SlotDisponivel[]>([]);
  readonly isEdit = signal(false);

  readonly tipoValues = TIPO_AGENDAMENTO_VALUES;

  cidadaoId = '';
  tipo: TipoAgendamento | '' = '';
  selectedDate: Date | null = null;
  selectedSlot: SlotDisponivel | null = null;
  notas = '';
  editId = '';
  today = new Date();
  readonly isCitizenOnly = this.authService.isCitizenOnly();

  private existingAgendamento: Agendamento | null = null;

  ngOnInit(): void {
    if (this.isCitizenOnly) {
      const cid = this.citizenContext.cidadaoId();
      if (cid) {
        this.cidadaoId = cid;
      }
    } else {
      this.cidadaoService.getAll(0, 200).subscribe({
        next: (data) => this.cidadaos.set(data.content),
      });
    }

    const id = this.route.snapshot.params['id'];
    if (id) {
      this.isEdit.set(true);
      this.editId = id;
      this.loading.set(true);
      this.agendamentoService.getById(id).subscribe({
        next: (a) => {
          this.existingAgendamento = a;
          this.cidadaoId = a.cidadaoId;
          this.tipo = a.tipo;
          this.selectedDate = new Date(a.dataHora);
          this.notas = a.notas ?? '';
          this.loading.set(false);
          this.loadSlots();
        },
        error: () => {
          this.loading.set(false);
          this.router.navigate(['/agendamentos']);
        },
      });
    }
  }

  onDateChange(): void {
    this.selectedSlot = null;
    if (this.selectedDate && this.tipo) {
      this.loadSlots();
    }
  }

  onTipoChange(): void {
    this.selectedSlot = null;
    if (this.selectedDate && this.tipo) {
      this.loadSlots();
    }
  }

  selectSlot(slot: SlotDisponivel): void {
    this.selectedSlot = slot;
  }

  private loadSlots(): void {
    if (!this.selectedDate || !this.tipo) return;
    this.loadingSlots.set(true);

    const dateStr = this.selectedDate.toISOString().slice(0, 10);
    this.agendamentoService.getAvailableSlots(this.tipo as TipoAgendamento, dateStr).subscribe({
      next: (slots) => {
        this.slots.set(slots);
        this.loadingSlots.set(false);
      },
      error: () => {
        this.slots.set([]);
        this.loadingSlots.set(false);
      },
    });
  }

  weekdayFilter = (d: Date | null): boolean => {
    if (!d) return false;
    const day = d.getDay();
    return day !== 0 && day !== 6;
  };

  get canSubmit(): boolean {
    if (this.isEdit()) {
      return !!this.selectedSlot;
    }
    return !!this.cidadaoId && !!this.tipo && !!this.selectedSlot;
  }

  submit(): void {
    if (!this.selectedSlot) return;
    this.loading.set(true);

    if (this.isEdit()) {
      this.agendamentoService.reschedule(this.editId, {
        dataHora: this.selectedSlot.dataHora,
        notas: this.notas || undefined,
      }).subscribe({
        next: () => {
          this.snackBar.open('Agendamento reagendado', '', { duration: 3000 });
          this.router.navigate(['/agendamentos']);
        },
        error: () => {
          this.loading.set(false);
          this.snackBar.open('Erro ao reagendar', '', { duration: 3000 });
        },
      });
    } else {
      const request: AgendamentoCreate = {
        cidadaoId: this.cidadaoId,
        tipo: this.tipo as TipoAgendamento,
        dataHora: this.selectedSlot.dataHora,
        notas: this.notas || undefined,
      };

      this.agendamentoService.create(request).subscribe({
        next: () => {
          this.snackBar.open('Agendamento criado', '', { duration: 3000 });
          this.router.navigate(['/agendamentos']);
        },
        error: (err) => {
          this.loading.set(false);
          const msg = err.status === 409 ? 'Conflito de horario' : 'Erro ao criar agendamento';
          this.snackBar.open(msg, '', { duration: 3000 });
        },
      });
    }
  }

  goBack(): void {
    this.router.navigate(['/agendamentos']);
  }
}
