import { Component, inject, signal, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { DatePipe } from '@angular/common';
import { MatDialogModule, MatDialogRef, MatDialog, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { RegistoCivilService } from '../../../core/services/registo-civil.service';
import { AuthService } from '../../../core/services/auth.service';
import {
  RegistoCivil, RegistoCivilHistorico, EstadoRegistoCivil,
  REGISTO_CIVIL_TRANSITIONS, REGISTO_CIVIL_WORKFLOW_STEPS,
} from '../../../core/models/registo-civil.model';
import { LoadingSpinner } from '../../../shared/components/loading-spinner/loading-spinner';
import { StatusBadge } from '../../../shared/components/status-badge/status-badge';
import { WorkflowStepper } from '../../../shared/components/workflow-stepper/workflow-stepper';
import { ConfirmDialog, ConfirmDialogData } from '../../../shared/components/confirm-dialog/confirm-dialog';

interface DialogData {
  registoId: string;
}

@Component({
  selector: 'sgc-registo-civil-detail',
  standalone: true,
  imports: [
    DatePipe,
    MatDialogModule, MatButtonModule, MatIconModule,
    MatChipsModule, MatMenuModule, MatDividerModule,
    TranslateModule,
    LoadingSpinner, StatusBadge, WorkflowStepper,
  ],
  template: `
    @if (loading()) {
      <sgc-loading-spinner />
    } @else if (registo()) {
      <h2 mat-dialog-title>
        {{ 'registoCivil.details' | translate }}
        @if (registo()!.numeroRegisto) {
          <span class="registo-number">{{ registo()!.numeroRegisto }}</span>
        }
      </h2>
      <mat-dialog-content>
        <sgc-workflow-stepper
          [steps]="workflowSteps"
          [currentStatus]="registo()!.estado"
          translationPrefix="registoCivil.estado."
          [isTerminal]="registo()!.estado === 'REJEITADO' || registo()!.estado === 'CANCELADO'" />

        <div class="detail-grid">
          <div class="detail-row">
            <span class="label">{{ 'registoCivil.cidadaoNome' | translate }}</span>
            <span class="value">{{ registo()!.cidadaoNome }}</span>
          </div>
          <div class="detail-row">
            <span class="label">{{ 'common.status' | translate }}</span>
            <span class="value"><sgc-status-badge [status]="registo()!.estado" /></span>
          </div>
          <div class="detail-row">
            <span class="label">{{ 'common.type' | translate }}</span>
            <span class="value">{{ 'registoCivil.tipo.' + registo()!.tipo | translate }}</span>
          </div>
          <div class="detail-row">
            <span class="label">{{ 'registoCivil.dataEvento' | translate }}</span>
            <span class="value">{{ registo()!.dataEvento ? (registo()!.dataEvento | date:'dd/MM/yyyy') : '—' }}</span>
          </div>
          <div class="detail-row">
            <span class="label">{{ 'registoCivil.localEvento' | translate }}</span>
            <span class="value">{{ registo()!.localEvento ?? '—' }}</span>
          </div>
          <div class="detail-row">
            <span class="label">{{ 'registoCivil.responsavel' | translate }}</span>
            <span class="value">{{ registo()!.responsavel ?? '—' }}</span>
          </div>

          <!-- Birth-specific fields -->
          @if (registo()!.tipo === 'NASCIMENTO') {
            <div class="detail-row">
              <span class="label">{{ 'registoCivil.nomePai' | translate }}</span>
              <span class="value">{{ registo()!.nomePai ?? '—' }}</span>
            </div>
            <div class="detail-row">
              <span class="label">{{ 'registoCivil.nomeMae' | translate }}</span>
              <span class="value">{{ registo()!.nomeMae ?? '—' }}</span>
            </div>
            <div class="detail-row">
              <span class="label">{{ 'registoCivil.localNascimento' | translate }}</span>
              <span class="value">{{ registo()!.localNascimento ?? '—' }}</span>
            </div>
          }

          <!-- Marriage-specific fields -->
          @if (registo()!.tipo === 'CASAMENTO') {
            <div class="detail-row">
              <span class="label">{{ 'registoCivil.nomeConjuge1' | translate }}</span>
              <span class="value">{{ registo()!.nomeConjuge1 ?? '—' }}</span>
            </div>
            <div class="detail-row">
              <span class="label">{{ 'registoCivil.nomeConjuge2' | translate }}</span>
              <span class="value">{{ registo()!.nomeConjuge2 ?? '—' }}</span>
            </div>
            <div class="detail-row">
              <span class="label">{{ 'registoCivil.regimeCasamento' | translate }}</span>
              <span class="value">{{ registo()!.regimeCasamento ?? '—' }}</span>
            </div>
          }

          <!-- Death-specific fields -->
          @if (registo()!.tipo === 'OBITO') {
            <div class="detail-row full">
              <span class="label">{{ 'registoCivil.causaObito' | translate }}</span>
              <span class="value">{{ registo()!.causaObito ?? '—' }}</span>
            </div>
            <div class="detail-row">
              <span class="label">{{ 'registoCivil.localObito' | translate }}</span>
              <span class="value">{{ registo()!.localObito ?? '—' }}</span>
            </div>
            <div class="detail-row">
              <span class="label">{{ 'registoCivil.dataObito' | translate }}</span>
              <span class="value">{{ registo()!.dataObito ? (registo()!.dataObito | date:'dd/MM/yyyy') : '—' }}</span>
            </div>
          }

          @if (registo()!.motivoRejeicao) {
            <div class="detail-row full rejection">
              <span class="label">{{ 'registoCivil.motivoRejeicao' | translate }}</span>
              <span class="value">{{ registo()!.motivoRejeicao }}</span>
            </div>
          }
          @if (registo()!.observacoes) {
            <div class="detail-row full">
              <span class="label">{{ 'registoCivil.observacoes' | translate }}</span>
              <span class="value">{{ registo()!.observacoes }}</span>
            </div>
          }
          <div class="detail-row">
            <span class="label">{{ 'registoCivil.dataSubmissao' | translate }}</span>
            <span class="value">{{ registo()!.dataSubmissao ? (registo()!.dataSubmissao | date:'dd/MM/yyyy HH:mm') : '—' }}</span>
          </div>
          <div class="detail-row">
            <span class="label">{{ 'cidadao.documentos' | translate }}</span>
            <mat-chip>{{ registo()!.documentoCount }}</mat-chip>
          </div>
        </div>

        @if (historico().length > 0) {
          <mat-divider />
          <h3 class="history-title">{{ 'registoCivil.history' | translate }}</h3>
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
        @if (registo()!.certificadoUrl) {
          <button mat-stroked-button (click)="downloadCertificado()">
            <mat-icon>download</mat-icon>
            {{ 'registoCivil.downloadCertificado' | translate }}
          </button>
        }
        @if (canDelete) {
          <button mat-button color="warn" (click)="onDelete()">
            <mat-icon>delete</mat-icon>
            {{ 'common.delete' | translate }}
          </button>
        }
        @if (canEdit && registo()!.estado === 'RASCUNHO') {
          <button mat-stroked-button (click)="onEdit()">
            <mat-icon>edit</mat-icon>
            {{ 'common.edit' | translate }}
          </button>
        }
        @if (canChangeStatus && getAllowedTransitions().length > 0) {
          <button mat-stroked-button [matMenuTriggerFor]="statusMenu">
            <mat-icon>swap_horiz</mat-icon>
            {{ 'registoCivil.changeStatus' | translate }}
          </button>
          <mat-menu #statusMenu="matMenu">
            @for (transition of getAllowedTransitions(); track transition) {
              <button mat-menu-item (click)="changeEstado(transition)">
                {{ 'registoCivil.estado.' + transition | translate }}
              </button>
            }
          </mat-menu>
        }
        <button mat-raised-button [mat-dialog-close]="changed">{{ 'common.back' | translate }}</button>
      </mat-dialog-actions>
    }
  `,
  styles: `
    .registo-number {
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
export class RegistoCivilDetailDialog implements OnInit {
  private readonly registoService = inject(RegistoCivilService);
  private readonly authService = inject(AuthService);
  private readonly dialogRef = inject(MatDialogRef<RegistoCivilDetailDialog>);
  private readonly dialog = inject(MatDialog);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);
  private readonly translate = inject(TranslateService);
  private readonly data: DialogData = inject(MAT_DIALOG_DATA);

  readonly loading = signal(true);
  readonly registo = signal<RegistoCivil | null>(null);
  readonly historico = signal<RegistoCivilHistorico[]>([]);
  readonly workflowSteps = REGISTO_CIVIL_WORKFLOW_STEPS;

  readonly canEdit = this.authService.hasAnyRole('ADMIN', 'CONSUL', 'OFFICER');
  readonly canChangeStatus = this.authService.hasAnyRole('ADMIN', 'CONSUL');
  readonly canDelete = this.authService.isAdmin();

  changed = false;

  ngOnInit(): void {
    this.loadRegisto();
    this.loadHistorico();
  }

  getAllowedTransitions(): EstadoRegistoCivil[] {
    const r = this.registo();
    if (!r) return [];
    return REGISTO_CIVIL_TRANSITIONS[r.estado] ?? [];
  }

  changeEstado(estado: EstadoRegistoCivil): void {
    const r = this.registo();
    if (!r) return;
    this.registoService.updateEstado(r.id, estado).subscribe({
      next: () => {
        this.changed = true;
        this.loadRegisto();
        this.loadHistorico();
      },
      error: () => this.snackBar.open('Erro ao alterar estado', '', { duration: 3000 }),
    });
  }

  downloadCertificado(): void {
    const r = this.registo();
    if (!r) return;
    this.registoService.downloadCertificado(r.id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `certificado-${r.tipo.toLowerCase()}-${r.numeroRegisto ?? r.id}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: () => this.snackBar.open('Erro ao descarregar certificado', '', { duration: 3000 }),
    });
  }

  onEdit(): void {
    this.dialogRef.close(true);
    this.router.navigate(['/registos-civis', this.data.registoId, 'edit']);
  }

  onDelete(): void {
    const r = this.registo();
    if (!r) return;
    const confirmRef = this.dialog.open(ConfirmDialog, {
      width: 'min(400px, 90vw)',
      data: {
        title: this.translate.instant('common.confirm.title'),
        message: this.translate.instant('common.confirm.delete', { name: r.numeroRegisto ?? r.id }),
        warn: true,
      } as ConfirmDialogData,
    });
    confirmRef.afterClosed().subscribe(confirmed => {
      if (!confirmed) return;
      this.registoService.delete(r.id).subscribe({
        next: () => this.dialogRef.close(true),
        error: () => this.snackBar.open('Erro ao eliminar', '', { duration: 3000 }),
      });
    });
  }

  private loadRegisto(): void {
    this.registoService.getById(this.data.registoId).subscribe((r) => {
      this.registo.set(r);
      this.loading.set(false);
    });
  }

  private loadHistorico(): void {
    this.registoService.getHistorico(this.data.registoId, 0, 50).subscribe((data) => {
      this.historico.set(data.content);
    });
  }
}
