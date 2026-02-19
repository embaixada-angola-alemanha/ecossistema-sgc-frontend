import { Component, inject, signal, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateModule } from '@ngx-translate/core';
import { AgendamentoService } from '../../../core/services/agendamento.service';
import { Agendamento, AgendamentoHistorico, AGENDAMENTO_TRANSITIONS, EstadoAgendamento } from '../../../core/models/agendamento.model';
import { LoadingSpinner } from '../../../shared/components/loading-spinner/loading-spinner';
import { StatusBadge } from '../../../shared/components/status-badge/status-badge';

@Component({
  selector: 'sgc-agendamento-detail',
  standalone: true,
  imports: [
    DatePipe,
    MatDialogModule, MatButtonModule, MatIconModule,
    MatDividerModule, MatChipsModule,
    TranslateModule,
    LoadingSpinner, StatusBadge,
  ],
  template: `
    <h2 mat-dialog-title>
      <mat-icon>event</mat-icon>
      {{ 'agendamento.details' | translate }}
    </h2>
    <mat-dialog-content>
      @if (loading()) {
        <sgc-loading-spinner />
      } @else if (agendamento()) {
        <div class="detail-grid">
          <div class="detail-row">
            <span class="label">{{ 'agendamento.cidadaoNome' | translate }}</span>
            <span class="value gold">{{ agendamento()!.cidadaoNome }}</span>
          </div>
          <div class="detail-row">
            <span class="label">{{ 'agendamento.numero' | translate }}</span>
            <span class="value mono">{{ agendamento()!.numeroAgendamento }}</span>
          </div>
          <div class="detail-row">
            <span class="label">{{ 'common.type' | translate }}</span>
            <span class="value">{{ 'agendamento.tipo.' + agendamento()!.tipo | translate }}</span>
          </div>
          <div class="detail-row">
            <span class="label">{{ 'common.status' | translate }}</span>
            <sgc-status-badge [status]="agendamento()!.estado" />
          </div>
          <div class="detail-row">
            <span class="label">{{ 'agendamento.dataHora' | translate }}</span>
            <span class="value">{{ agendamento()!.dataHora | date:'dd/MM/yyyy HH:mm' }}</span>
          </div>
          <div class="detail-row">
            <span class="label">{{ 'agendamento.duracao' | translate }}</span>
            <span class="value">{{ agendamento()!.duracaoMinutos }} min</span>
          </div>
          @if (agendamento()!.notas) {
            <div class="detail-row full">
              <span class="label">{{ 'agendamento.notas' | translate }}</span>
              <span class="value">{{ agendamento()!.notas }}</span>
            </div>
          }
          @if (agendamento()!.motivoCancelamento) {
            <div class="detail-row full">
              <span class="label">{{ 'agendamento.motivoCancelamento' | translate }}</span>
              <span class="value" style="color: var(--red)">{{ agendamento()!.motivoCancelamento }}</span>
            </div>
          }
        </div>

        @if (historico().length > 0) {
          <mat-divider style="margin: 16px 0" />
          <h4>{{ 'agendamento.historico' | translate }}</h4>
          <div class="history-list">
            @for (h of historico(); track h.id) {
              <div class="history-item">
                <div class="history-transition">
                  @if (h.estadoAnterior) {
                    <sgc-status-badge [status]="h.estadoAnterior" />
                    <mat-icon>arrow_forward</mat-icon>
                  }
                  <sgc-status-badge [status]="h.estadoNovo" />
                </div>
                <div class="history-meta">
                  <span>{{ h.alteradoPor }} &mdash; {{ h.createdAt | date:'dd/MM/yyyy HH:mm' }}</span>
                  @if (h.comentario) {
                    <span class="history-comment">{{ h.comentario }}</span>
                  }
                </div>
              </div>
            }
          </div>
        }
      }
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      @if (agendamento()) {
        @for (transition of getAllowedTransitions(); track transition) {
          <button mat-stroked-button (click)="changeEstado(transition)">
            {{ 'agendamento.estado.' + transition | translate }}
          </button>
        }
      }
      <button mat-button mat-dialog-close>{{ 'common.back' | translate }}</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .detail-row { display: flex; flex-direction: column; gap: 2px; }
    .detail-row.full { grid-column: 1 / -1; }
    .label { font-size: 12px; color: var(--text-dim); text-transform: uppercase; letter-spacing: 0.05em; }
    .value { font-size: 14px; }
    .gold { color: var(--gold); font-weight: 500; }
    .mono { font-family: 'DM Sans', monospace; letter-spacing: 0.05em; }
    h4 { margin: 0 0 8px; color: var(--gold-light); font-family: 'Playfair Display', serif; }
    .history-list { display: flex; flex-direction: column; gap: 8px; }
    .history-item { padding: 8px; background: var(--surface2); border-radius: 6px; }
    .history-transition { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
    .history-meta { font-size: 12px; color: var(--text-dim); }
    .history-comment { display: block; margin-top: 4px; font-style: italic; }
    mat-dialog-content { min-width: 400px; }
  `],
})
export class AgendamentoDetailDialog implements OnInit {
  private readonly agendamentoService = inject(AgendamentoService);
  private readonly dialogRef = inject(MatDialogRef<AgendamentoDetailDialog>);
  private readonly snackBar = inject(MatSnackBar);
  private readonly data = inject<{ agendamentoId: string }>(MAT_DIALOG_DATA);

  readonly loading = signal(true);
  readonly agendamento = signal<Agendamento | null>(null);
  readonly historico = signal<AgendamentoHistorico[]>([]);

  ngOnInit(): void {
    this.agendamentoService.getById(this.data.agendamentoId).subscribe({
      next: (a) => {
        this.agendamento.set(a);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });

    this.agendamentoService.getHistorico(this.data.agendamentoId).subscribe({
      next: (data) => this.historico.set(data.content),
    });
  }

  getAllowedTransitions(): EstadoAgendamento[] {
    const a = this.agendamento();
    if (!a) return [];
    return AGENDAMENTO_TRANSITIONS[a.estado] ?? [];
  }

  changeEstado(estado: EstadoAgendamento): void {
    const a = this.agendamento();
    if (!a) return;
    this.agendamentoService.updateEstado(a.id, estado).subscribe({
      next: (updated) => {
        this.agendamento.set(updated);
        this.dialogRef.close(true);
      },
      error: () => this.snackBar.open('Erro ao alterar estado', '', { duration: 3000 }),
    });
  }
}
