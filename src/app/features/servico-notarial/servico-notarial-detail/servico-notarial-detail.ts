import { Component, inject, signal, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { DatePipe, CurrencyPipe } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateModule } from '@ngx-translate/core';
import { ServicoNotarialService } from '../../../core/services/servico-notarial.service';
import { AuthService } from '../../../core/services/auth.service';
import {
  ServicoNotarial, ServicoNotarialHistorico, EstadoServicoNotarial,
  SERVICO_NOTARIAL_TRANSITIONS, SERVICO_NOTARIAL_WORKFLOW_STEPS,
} from '../../../core/models/servico-notarial.model';
import { LoadingSpinner } from '../../../shared/components/loading-spinner/loading-spinner';
import { StatusBadge } from '../../../shared/components/status-badge/status-badge';
import { WorkflowStepper } from '../../../shared/components/workflow-stepper/workflow-stepper';

interface DialogData {
  servicoId: string;
}

@Component({
  selector: 'sgc-servico-notarial-detail',
  standalone: true,
  imports: [
    DatePipe, CurrencyPipe,
    MatDialogModule, MatButtonModule, MatIconModule,
    MatChipsModule, MatMenuModule, MatDividerModule,
    TranslateModule,
    LoadingSpinner, StatusBadge, WorkflowStepper,
  ],
  template: `
    @if (loading()) {
      <sgc-loading-spinner />
    } @else if (servico()) {
      <h2 mat-dialog-title>
        {{ 'servicoNotarial.details' | translate }}
        @if (servico()!.numeroServico) {
          <span class="servico-number">{{ servico()!.numeroServico }}</span>
        }
      </h2>
      <mat-dialog-content>
        <sgc-workflow-stepper
          [steps]="workflowSteps"
          [currentStatus]="servico()!.estado"
          translationPrefix="servicoNotarial.estado."
          [isTerminal]="servico()!.estado === 'REJEITADO' || servico()!.estado === 'CANCELADO'" />

        <div class="detail-grid">
          <div class="detail-row">
            <span class="label">{{ 'servicoNotarial.cidadaoNome' | translate }}</span>
            <span class="value">{{ servico()!.cidadaoNome }}</span>
          </div>
          <div class="detail-row">
            <span class="label">{{ 'common.status' | translate }}</span>
            <span class="value"><sgc-status-badge [status]="servico()!.estado" /></span>
          </div>
          <div class="detail-row">
            <span class="label">{{ 'common.type' | translate }}</span>
            <span class="value">{{ 'servicoNotarial.tipo.' + servico()!.tipo | translate }}</span>
          </div>
          <div class="detail-row">
            <span class="label">{{ 'servicoNotarial.valorTaxa' | translate }}</span>
            <span class="value fee-value">
              {{ servico()!.valorTaxa | currency:'EUR' }}
              @if (servico()!.taxaPaga) {
                <mat-icon class="paid-icon">check_circle</mat-icon>
              } @else {
                <mat-icon class="unpaid-icon">pending</mat-icon>
              }
            </span>
          </div>
          <div class="detail-row">
            <span class="label">{{ 'servicoNotarial.responsavel' | translate }}</span>
            <span class="value">{{ servico()!.responsavel ?? '—' }}</span>
          </div>
          <div class="detail-row">
            <span class="label">{{ 'servicoNotarial.dataSubmissao' | translate }}</span>
            <span class="value">{{ servico()!.dataSubmissao ? (servico()!.dataSubmissao | date:'dd/MM/yyyy HH:mm') : '—' }}</span>
          </div>

          @if (servico()!.descricao) {
            <div class="detail-row full">
              <span class="label">{{ 'servicoNotarial.descricao' | translate }}</span>
              <span class="value">{{ servico()!.descricao }}</span>
            </div>
          }

          <!-- Power of Attorney fields -->
          @if (servico()!.tipo === 'PROCURACAO') {
            <div class="detail-row">
              <span class="label">{{ 'servicoNotarial.outorgante' | translate }}</span>
              <span class="value">{{ servico()!.outorgante ?? '—' }}</span>
            </div>
            <div class="detail-row">
              <span class="label">{{ 'servicoNotarial.outorgado' | translate }}</span>
              <span class="value">{{ servico()!.outorgado ?? '—' }}</span>
            </div>
            @if (servico()!.finalidadeProcuracao) {
              <div class="detail-row full">
                <span class="label">{{ 'servicoNotarial.finalidadeProcuracao' | translate }}</span>
                <span class="value">{{ servico()!.finalidadeProcuracao }}</span>
              </div>
            }
          }

          <!-- Legalization fields -->
          @if (servico()!.tipo === 'LEGALIZACAO') {
            <div class="detail-row">
              <span class="label">{{ 'servicoNotarial.documentoOrigem' | translate }}</span>
              <span class="value">{{ servico()!.documentoOrigem ?? '—' }}</span>
            </div>
            <div class="detail-row">
              <span class="label">{{ 'servicoNotarial.paisOrigem' | translate }}</span>
              <span class="value">{{ servico()!.paisOrigem ?? '—' }}</span>
            </div>
            <div class="detail-row">
              <span class="label">{{ 'servicoNotarial.entidadeEmissora' | translate }}</span>
              <span class="value">{{ servico()!.entidadeEmissora ?? '—' }}</span>
            </div>
          }

          <!-- Apostille fields -->
          @if (servico()!.tipo === 'APOSTILA') {
            <div class="detail-row">
              <span class="label">{{ 'servicoNotarial.documentoApostilado' | translate }}</span>
              <span class="value">{{ servico()!.documentoApostilado ?? '—' }}</span>
            </div>
            <div class="detail-row">
              <span class="label">{{ 'servicoNotarial.paisDestino' | translate }}</span>
              <span class="value">{{ servico()!.paisDestino ?? '—' }}</span>
            </div>
          }

          <!-- Certified Copy fields -->
          @if (servico()!.tipo === 'COPIA_CERTIFICADA') {
            <div class="detail-row">
              <span class="label">{{ 'servicoNotarial.documentoOriginalRef' | translate }}</span>
              <span class="value">{{ servico()!.documentoOriginalRef ?? '—' }}</span>
            </div>
            <div class="detail-row">
              <span class="label">{{ 'servicoNotarial.numeroCopias' | translate }}</span>
              <span class="value">{{ servico()!.numeroCopias ?? 1 }}</span>
            </div>
          }

          @if (servico()!.motivoRejeicao) {
            <div class="detail-row full rejection">
              <span class="label">{{ 'servicoNotarial.motivoRejeicao' | translate }}</span>
              <span class="value">{{ servico()!.motivoRejeicao }}</span>
            </div>
          }
          @if (servico()!.observacoes) {
            <div class="detail-row full">
              <span class="label">{{ 'servicoNotarial.observacoes' | translate }}</span>
              <span class="value">{{ servico()!.observacoes }}</span>
            </div>
          }
          <div class="detail-row">
            <span class="label">{{ 'cidadao.documentos' | translate }}</span>
            <mat-chip>{{ servico()!.documentoCount }}</mat-chip>
          </div>
        </div>

        @if (historico().length > 0) {
          <mat-divider />
          <h3 class="history-title">{{ 'servicoNotarial.history' | translate }}</h3>
          <div class="history-list">
            @for (h of historico(); track h.id) {
              <div class="history-item">
                <div class="history-header">
                  <span class="history-user">{{ h.alteradoPor }}</span>
                  <span class="history-date">{{ h.createdAt | date:'dd/MM/yyyy HH:mm' }}</span>
                </div>
                <div class="history-transition">
                  @if (h.estadoAnterior) {
                    <sgc-status-badge [status]="h.estadoAnterior" />
                    <mat-icon>arrow_forward</mat-icon>
                  }
                  <sgc-status-badge [status]="h.estadoNovo" />
                </div>
                @if (h.comentario) {
                  <div class="history-comment">{{ h.comentario }}</div>
                }
              </div>
            }
          </div>
        }
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        @if (servico()!.certificadoUrl) {
          <button mat-stroked-button (click)="downloadCertificado()">
            <mat-icon>download</mat-icon>
            {{ 'servicoNotarial.downloadCertificado' | translate }}
          </button>
        }
        @if (canChangeStatus && !servico()!.taxaPaga) {
          <button mat-stroked-button color="primary" (click)="markPaid()">
            <mat-icon>payment</mat-icon>
            {{ 'servicoNotarial.markPaid' | translate }}
          </button>
        }
        @if (canDelete) {
          <button mat-button color="warn" (click)="onDelete()">
            <mat-icon>delete</mat-icon>
            {{ 'common.delete' | translate }}
          </button>
        }
        @if (canEdit && servico()!.estado === 'RASCUNHO') {
          <button mat-stroked-button (click)="onEdit()">
            <mat-icon>edit</mat-icon>
            {{ 'common.edit' | translate }}
          </button>
        }
        @if (canChangeStatus && getAllowedTransitions().length > 0) {
          <button mat-stroked-button [matMenuTriggerFor]="statusMenu">
            <mat-icon>swap_horiz</mat-icon>
            {{ 'servicoNotarial.changeStatus' | translate }}
          </button>
          <mat-menu #statusMenu="matMenu">
            @for (transition of getAllowedTransitions(); track transition) {
              <button mat-menu-item (click)="changeEstado(transition)">
                {{ 'servicoNotarial.estado.' + transition | translate }}
              </button>
            }
          </mat-menu>
        }
        <button mat-raised-button [mat-dialog-close]="changed">{{ 'common.back' | translate }}</button>
      </mat-dialog-actions>
    }
  `,
  styles: `
    .servico-number {
      font-family: 'DM Sans', monospace;
      font-size: 0.85rem;
      color: var(--text-dim, rgba(224, 232, 240, 0.65));
      margin-left: 8px;
      letter-spacing: 0.05em;
    }
    .detail-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      min-width: 550px;
    }
    .detail-row {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .detail-row.full { grid-column: 1 / -1; }
    .detail-row.rejection .value { color: #f44336; }
    .label {
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-dim, rgba(224, 232, 240, 0.65));
    }
    .value { font-size: 0.95rem; }
    .fee-value {
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .paid-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      color: #4caf50;
    }
    .unpaid-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      color: #ff9800;
    }

    mat-divider { margin: 20px 0 12px; }

    .history-title {
      margin: 0 0 12px;
      font-weight: 500;
      font-size: 0.95rem;
    }
    .history-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .history-item {
      padding: 8px 12px;
      border-radius: 8px;
      background: var(--surface2, #151d2c);
    }
    .history-header {
      display: flex;
      justify-content: space-between;
      font-size: 0.8rem;
      color: var(--text-dim, rgba(224, 232, 240, 0.65));
      margin-bottom: 4px;
    }
    .history-transition {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .history-comment {
      margin-top: 4px;
      font-size: 0.85rem;
      font-style: italic;
    }
    mat-dialog-content { max-height: 70vh; }
  `,
})
export class ServicoNotarialDetailDialog implements OnInit {
  private readonly servicoService = inject(ServicoNotarialService);
  private readonly authService = inject(AuthService);
  private readonly dialogRef = inject(MatDialogRef<ServicoNotarialDetailDialog>);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);
  private readonly data: DialogData = inject(MAT_DIALOG_DATA);

  readonly loading = signal(true);
  readonly servico = signal<ServicoNotarial | null>(null);
  readonly historico = signal<ServicoNotarialHistorico[]>([]);
  readonly workflowSteps = SERVICO_NOTARIAL_WORKFLOW_STEPS;

  readonly canEdit = this.authService.hasAnyRole('ADMIN', 'CONSUL', 'OFFICER');
  readonly canChangeStatus = this.authService.hasAnyRole('ADMIN', 'CONSUL');
  readonly canDelete = this.authService.isAdmin();

  changed = false;

  ngOnInit(): void {
    this.loadServico();
    this.loadHistorico();
  }

  getAllowedTransitions(): EstadoServicoNotarial[] {
    const s = this.servico();
    if (!s) return [];
    return SERVICO_NOTARIAL_TRANSITIONS[s.estado] ?? [];
  }

  changeEstado(estado: EstadoServicoNotarial): void {
    const s = this.servico();
    if (!s) return;
    this.servicoService.updateEstado(s.id, estado).subscribe({
      next: () => {
        this.changed = true;
        this.loadServico();
        this.loadHistorico();
      },
      error: () => this.snackBar.open('Erro ao alterar estado', '', { duration: 3000 }),
    });
  }

  markPaid(): void {
    const s = this.servico();
    if (!s) return;
    this.servicoService.markPaid(s.id).subscribe({
      next: () => {
        this.changed = true;
        this.loadServico();
      },
      error: () => this.snackBar.open('Erro ao marcar pagamento', '', { duration: 3000 }),
    });
  }

  downloadCertificado(): void {
    const s = this.servico();
    if (!s) return;
    this.servicoService.downloadCertificado(s.id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `certificado-${s.tipo.toLowerCase()}-${s.numeroServico ?? s.id}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: () => this.snackBar.open('Erro ao descarregar certificado', '', { duration: 3000 }),
    });
  }

  onEdit(): void {
    this.dialogRef.close(true);
    this.router.navigate(['/servicos-notariais', this.data.servicoId, 'edit']);
  }

  onDelete(): void {
    const s = this.servico();
    if (!s || !confirm(`Eliminar serviço ${s.numeroServico ?? s.id}?`)) return;
    this.servicoService.delete(s.id).subscribe({
      next: () => this.dialogRef.close(true),
      error: () => this.snackBar.open('Erro ao eliminar', '', { duration: 3000 }),
    });
  }

  private loadServico(): void {
    this.servicoService.getById(this.data.servicoId).subscribe((s) => {
      this.servico.set(s);
      this.loading.set(false);
    });
  }

  private loadHistorico(): void {
    this.servicoService.getHistorico(this.data.servicoId, 0, 50).subscribe((data) => {
      this.historico.set(data.content);
    });
  }
}
