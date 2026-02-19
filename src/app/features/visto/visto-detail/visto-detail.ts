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
import { VistoService } from '../../../core/services/visto.service';
import { AuthService } from '../../../core/services/auth.service';
import { Visto, VistoHistorico, EstadoVisto, ALLOWED_TRANSITIONS } from '../../../core/models/visto.model';
import { LoadingSpinner } from '../../../shared/components/loading-spinner/loading-spinner';
import { StatusBadge } from '../../../shared/components/status-badge/status-badge';

interface DialogData {
  vistoId: string;
}

@Component({
  selector: 'sgc-visto-detail',
  standalone: true,
  imports: [
    DatePipe, CurrencyPipe,
    MatDialogModule, MatButtonModule, MatIconModule,
    MatChipsModule, MatMenuModule, MatDividerModule,
    TranslateModule,
    LoadingSpinner, StatusBadge,
  ],
  template: `
    @if (loading()) {
      <sgc-loading-spinner />
    } @else if (visto()) {
      <h2 mat-dialog-title>
        {{ 'visto.visaDetails' | translate }}
        @if (visto()!.numeroVisto) {
          <span class="visa-number">{{ visto()!.numeroVisto }}</span>
        }
      </h2>
      <mat-dialog-content>
        <div class="detail-grid">
          <div class="detail-row">
            <span class="label">{{ 'visto.cidadaoNome' | translate }}</span>
            <span class="value">{{ visto()!.cidadaoNome }}</span>
          </div>
          <div class="detail-row">
            <span class="label">{{ 'common.status' | translate }}</span>
            <span class="value"><sgc-status-badge [status]="visto()!.estado" /></span>
          </div>
          <div class="detail-row">
            <span class="label">{{ 'common.type' | translate }}</span>
            <span class="value">{{ 'visto.tipo.' + visto()!.tipo | translate }}</span>
          </div>
          <div class="detail-row">
            <span class="label">{{ 'visto.valorTaxa' | translate }}</span>
            <span class="value">{{ visto()!.valorTaxa != null ? (visto()!.valorTaxa | currency:'EUR') : '—' }}</span>
          </div>
          <div class="detail-row">
            <span class="label">{{ 'visto.taxaPaga' | translate }}</span>
            <span class="value">{{ visto()!.taxaPaga ? ('common.yes' | translate) : ('common.no' | translate) }}</span>
          </div>
          <div class="detail-row">
            <span class="label">{{ 'visto.nacionalidadePassaporte' | translate }}</span>
            <span class="value">{{ visto()!.nacionalidadePassaporte ?? '—' }}</span>
          </div>
          <div class="detail-row full">
            <span class="label">{{ 'visto.motivoViagem' | translate }}</span>
            <span class="value">{{ visto()!.motivoViagem ?? '—' }}</span>
          </div>
          <div class="detail-row">
            <span class="label">{{ 'visto.dataEntrada' | translate }}</span>
            <span class="value">{{ visto()!.dataEntrada ? (visto()!.dataEntrada | date:'dd/MM/yyyy') : '—' }}</span>
          </div>
          <div class="detail-row">
            <span class="label">{{ 'visto.dataSaida' | translate }}</span>
            <span class="value">{{ visto()!.dataSaida ? (visto()!.dataSaida | date:'dd/MM/yyyy') : '—' }}</span>
          </div>
          <div class="detail-row">
            <span class="label">{{ 'visto.localAlojamento' | translate }}</span>
            <span class="value">{{ visto()!.localAlojamento ?? '—' }}</span>
          </div>
          <div class="detail-row">
            <span class="label">{{ 'visto.entidadeConvite' | translate }}</span>
            <span class="value">{{ visto()!.entidadeConvite ?? '—' }}</span>
          </div>
          <div class="detail-row">
            <span class="label">{{ 'visto.responsavel' | translate }}</span>
            <span class="value">{{ visto()!.responsavel ?? '—' }}</span>
          </div>
          <div class="detail-row">
            <span class="label">{{ 'visto.dataSubmissao' | translate }}</span>
            <span class="value">{{ visto()!.dataSubmissao ? (visto()!.dataSubmissao | date:'dd/MM/yyyy HH:mm') : '—' }}</span>
          </div>
          <div class="detail-row">
            <span class="label">{{ 'visto.dataDecisao' | translate }}</span>
            <span class="value">{{ visto()!.dataDecisao ? (visto()!.dataDecisao | date:'dd/MM/yyyy HH:mm') : '—' }}</span>
          </div>
          @if (visto()!.motivoRejeicao) {
            <div class="detail-row full rejection">
              <span class="label">{{ 'visto.motivoRejeicao' | translate }}</span>
              <span class="value">{{ visto()!.motivoRejeicao }}</span>
            </div>
          }
          @if (visto()!.observacoes) {
            <div class="detail-row full">
              <span class="label">{{ 'visto.observacoes' | translate }}</span>
              <span class="value">{{ visto()!.observacoes }}</span>
            </div>
          }
          <div class="detail-row">
            <span class="label">{{ 'cidadao.documentos' | translate }}</span>
            <mat-chip>{{ visto()!.documentoCount }}</mat-chip>
          </div>
        </div>

        @if (historico().length > 0) {
          <mat-divider />
          <h3 class="history-title">{{ 'visto.history' | translate }}</h3>
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
        @if (canDelete) {
          <button mat-button color="warn" (click)="onDelete()">
            <mat-icon>delete</mat-icon>
            {{ 'common.delete' | translate }}
          </button>
        }
        @if (canEdit && visto()!.estado === 'RASCUNHO') {
          <button mat-stroked-button (click)="onEdit()">
            <mat-icon>edit</mat-icon>
            {{ 'common.edit' | translate }}
          </button>
        }
        @if (canChangeStatus && getAllowedTransitions().length > 0) {
          <button mat-stroked-button [matMenuTriggerFor]="statusMenu">
            <mat-icon>swap_horiz</mat-icon>
            {{ 'visto.changeStatus' | translate }}
          </button>
          <mat-menu #statusMenu="matMenu">
            @for (transition of getAllowedTransitions(); track transition) {
              <button mat-menu-item (click)="changeEstado(transition)">
                {{ 'visto.estado.' + transition | translate }}
              </button>
            }
          </mat-menu>
        }
        <button mat-raised-button [mat-dialog-close]="changed">{{ 'common.back' | translate }}</button>
      </mat-dialog-actions>
    }
  `,
  styles: `
    .visa-number {
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
export class VistoDetailDialog implements OnInit {
  private readonly vistoService = inject(VistoService);
  private readonly authService = inject(AuthService);
  private readonly dialogRef = inject(MatDialogRef<VistoDetailDialog>);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);
  private readonly data: DialogData = inject(MAT_DIALOG_DATA);

  readonly loading = signal(true);
  readonly visto = signal<Visto | null>(null);
  readonly historico = signal<VistoHistorico[]>([]);

  readonly canEdit = this.authService.hasAnyRole('ADMIN', 'CONSUL', 'OFFICER');
  readonly canChangeStatus = this.authService.hasAnyRole('ADMIN', 'CONSUL');
  readonly canDelete = this.authService.isAdmin();

  changed = false;

  ngOnInit(): void {
    this.loadVisto();
    this.loadHistorico();
  }

  getAllowedTransitions(): EstadoVisto[] {
    const v = this.visto();
    if (!v) return [];
    return ALLOWED_TRANSITIONS[v.estado] ?? [];
  }

  changeEstado(estado: EstadoVisto): void {
    const v = this.visto();
    if (!v) return;
    this.vistoService.updateEstado(v.id, estado).subscribe({
      next: () => {
        this.changed = true;
        this.loadVisto();
        this.loadHistorico();
      },
      error: () => this.snackBar.open('Erro ao alterar estado', '', { duration: 3000 }),
    });
  }

  onEdit(): void {
    this.dialogRef.close(true);
    this.router.navigate(['/vistos', this.data.vistoId, 'edit']);
  }

  onDelete(): void {
    const v = this.visto();
    if (!v || !confirm(`Eliminar visto ${v.numeroVisto ?? v.id}?`)) return;
    this.vistoService.delete(v.id).subscribe({
      next: () => this.dialogRef.close(true),
      error: () => this.snackBar.open('Erro ao eliminar', '', { duration: 3000 }),
    });
  }

  private loadVisto(): void {
    this.vistoService.getById(this.data.vistoId).subscribe((v) => {
      this.visto.set(v);
      this.loading.set(false);
    });
  }

  private loadHistorico(): void {
    this.vistoService.getHistorico(this.data.vistoId, 0, 50).subscribe((data) => {
      this.historico.set(data.content);
    });
  }
}
