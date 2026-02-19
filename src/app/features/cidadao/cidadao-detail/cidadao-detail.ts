import { Component, inject, signal, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatDialogModule, MatDialogRef, MatDialog, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateModule } from '@ngx-translate/core';
import { CidadaoService } from '../../../core/services/cidadao.service';
import { AuthService } from '../../../core/services/auth.service';
import { Cidadao } from '../../../core/models/cidadao.model';
import { LoadingSpinner } from '../../../shared/components/loading-spinner/loading-spinner';
import { StatusBadge } from '../../../shared/components/status-badge/status-badge';
import { CidadaoFormDialog } from '../cidadao-form/cidadao-form';

interface DialogData {
  cidadaoId: string;
}

@Component({
  selector: 'sgc-cidadao-detail',
  standalone: true,
  imports: [
    DatePipe,
    MatDialogModule, MatButtonModule, MatIconModule, MatChipsModule,
    TranslateModule,
    LoadingSpinner, StatusBadge,
  ],
  template: `
    @if (loading()) {
      <sgc-loading-spinner />
    } @else if (cidadao()) {
      <h2 mat-dialog-title>{{ cidadao()!.nomeCompleto }}</h2>
      <mat-dialog-content>
        <div class="detail-grid">
          <div class="detail-row">
            <span class="label">{{ 'cidadao.numeroPassaporte' | translate }}</span>
            <span class="value mono">{{ cidadao()!.numeroPassaporte }}</span>
          </div>
          <div class="detail-row">
            <span class="label">{{ 'common.status' | translate }}</span>
            <span class="value"><sgc-status-badge [status]="cidadao()!.estado" /></span>
          </div>
          <div class="detail-row">
            <span class="label">{{ 'cidadao.nacionalidade' | translate }}</span>
            <span class="value">{{ cidadao()!.nacionalidade ?? '—' }}</span>
          </div>
          <div class="detail-row">
            <span class="label">{{ 'cidadao.sexo' | translate }}</span>
            <span class="value">{{ cidadao()!.sexo ? ('cidadao.sexo.' + cidadao()!.sexo | translate) : '—' }}</span>
          </div>
          <div class="detail-row">
            <span class="label">{{ 'cidadao.dataNascimento' | translate }}</span>
            <span class="value">{{ cidadao()!.dataNascimento ? (cidadao()!.dataNascimento | date:'dd/MM/yyyy') : '—' }}</span>
          </div>
          <div class="detail-row">
            <span class="label">{{ 'cidadao.estadoCivil' | translate }}</span>
            <span class="value">{{ cidadao()!.estadoCivil ? ('cidadao.estadoCivil.' + cidadao()!.estadoCivil | translate) : '—' }}</span>
          </div>
          <div class="detail-row">
            <span class="label">{{ 'cidadao.email' | translate }}</span>
            <span class="value">{{ cidadao()!.email ?? '—' }}</span>
          </div>
          <div class="detail-row">
            <span class="label">{{ 'cidadao.telefone' | translate }}</span>
            <span class="value">{{ cidadao()!.telefone ?? '—' }}</span>
          </div>
          <div class="detail-row full">
            <span class="label">{{ 'cidadao.enderecoAngola' | translate }}</span>
            <span class="value">{{ cidadao()!.enderecoAngola ?? '—' }}</span>
          </div>
          <div class="detail-row full">
            <span class="label">{{ 'cidadao.enderecoAlemanha' | translate }}</span>
            <span class="value">{{ cidadao()!.enderecoAlemanha ?? '—' }}</span>
          </div>
          <div class="detail-row">
            <span class="label">{{ 'cidadao.documentos' | translate }}</span>
            <mat-chip>{{ cidadao()!.documentoCount }}</mat-chip>
          </div>
          <div class="detail-row">
            <span class="label">{{ 'cidadao.processos' | translate }}</span>
            <mat-chip>{{ cidadao()!.processoCount }}</mat-chip>
          </div>
        </div>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        @if (canDelete) {
          <button mat-button color="warn" (click)="onDelete()">
            <mat-icon>delete</mat-icon>
            {{ 'common.delete' | translate }}
          </button>
        }
        @if (canEdit) {
          <button mat-stroked-button (click)="onEdit()">
            <mat-icon>edit</mat-icon>
            {{ 'common.edit' | translate }}
          </button>
        }
        <button mat-raised-button mat-dialog-close>{{ 'common.back' | translate }}</button>
      </mat-dialog-actions>
    }
  `,
  styles: `
    .detail-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      min-width: 460px;
    }
    .detail-row {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .detail-row.full { grid-column: 1 / -1; }
    .label {
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-dim, rgba(224, 232, 240, 0.65));
    }
    .value {
      font-size: 0.95rem;
    }
    .mono {
      font-family: 'DM Sans', monospace;
      letter-spacing: 0.05em;
    }
  `,
})
export class CidadaoDetailDialog implements OnInit {
  private readonly cidadaoService = inject(CidadaoService);
  private readonly authService = inject(AuthService);
  private readonly dialogRef = inject(MatDialogRef<CidadaoDetailDialog>);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly data: DialogData = inject(MAT_DIALOG_DATA);

  readonly loading = signal(true);
  readonly cidadao = signal<Cidadao | null>(null);

  readonly canEdit = this.authService.hasAnyRole('ADMIN', 'CONSUL', 'OFFICER');
  readonly canDelete = this.authService.isAdmin();

  private changed = false;

  ngOnInit(): void {
    this.cidadaoService.getById(this.data.cidadaoId).subscribe((c) => {
      this.cidadao.set(c);
      this.loading.set(false);
    });
  }

  onEdit(): void {
    const ref = this.dialog.open(CidadaoFormDialog, {
      width: '640px',
      data: { cidadao: this.cidadao() },
    });
    ref.afterClosed().subscribe((result) => {
      if (result) {
        this.changed = true;
        this.cidadaoService.getById(this.data.cidadaoId).subscribe((c) => this.cidadao.set(c));
      }
    });
  }

  onDelete(): void {
    const c = this.cidadao();
    if (!c || !confirm(`Eliminar ${c.nomeCompleto}?`)) return;
    this.cidadaoService.delete(c.id).subscribe({
      next: () => this.dialogRef.close(true),
      error: () => this.snackBar.open('Erro ao eliminar', '', { duration: 3000 }),
    });
  }
}
