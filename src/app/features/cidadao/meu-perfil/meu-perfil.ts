import { Component, inject, signal, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { CidadaoService } from '../../../core/services/cidadao.service';
import { CitizenContextService } from '../../../core/services/citizen-context.service';
import { Cidadao } from '../../../core/models/cidadao.model';
import { LoadingSpinner } from '../../../shared/components/loading-spinner/loading-spinner';
import { StatusBadge } from '../../../shared/components/status-badge/status-badge';
import { CidadaoFormDialog } from '../cidadao-form/cidadao-form';

@Component({
  selector: 'sgc-meu-perfil',
  standalone: true,
  imports: [
    DatePipe,
    MatCardModule, MatButtonModule, MatIconModule, MatChipsModule,
    TranslateModule,
    LoadingSpinner, StatusBadge,
  ],
  template: `
    <div class="profile-page">
      <div class="page-header">
        <h1 class="page-title">{{ 'nav.meuPerfil' | translate }}</h1>
      </div>

      @if (loading()) {
        <sgc-loading-spinner />
      } @else if (notLinked()) {
        <mat-card>
          <mat-card-content class="not-linked">
            <mat-icon class="not-linked-icon">link_off</mat-icon>
            <p>{{ 'dashboard.notLinked' | translate }}</p>
          </mat-card-content>
        </mat-card>
      } @else if (cidadao()) {
        <mat-card>
          <mat-card-header>
            <mat-icon mat-card-avatar>person</mat-icon>
            <mat-card-title>{{ cidadao()!.nomeCompleto }}</mat-card-title>
            <mat-card-subtitle>{{ cidadao()!.numeroPassaporte }}</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
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
          </mat-card-content>
          <mat-card-actions align="end">
            <button mat-stroked-button (click)="onEdit()">
              <mat-icon>edit</mat-icon>
              {{ 'common.edit' | translate }}
            </button>
          </mat-card-actions>
        </mat-card>
      }
    </div>
  `,
  styles: `
    .profile-page {
      max-width: 720px;
      margin: 0 auto;
    }
    .page-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 24px;
    }
    .page-title {
      font-size: 1.5rem;
      font-weight: 500;
      margin: 0;
    }
    .detail-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-top: 16px;
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
    .not-linked {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      padding: 48px 24px;
      text-align: center;
    }
    .not-linked-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      opacity: 0.5;
    }
    @media (max-width: 600px) {
      .detail-grid {
        grid-template-columns: 1fr;
      }
    }
  `,
})
export class MeuPerfil implements OnInit {
  private readonly cidadaoService = inject(CidadaoService);
  private readonly citizenContext = inject(CitizenContextService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly translate = inject(TranslateService);

  readonly loading = signal(true);
  readonly cidadao = signal<Cidadao | null>(null);
  readonly notLinked = signal(false);

  ngOnInit(): void {
    if (this.citizenContext.notLinked()) {
      this.notLinked.set(true);
      this.loading.set(false);
      return;
    }

    const cidadaoId = this.citizenContext.cidadaoId();
    if (!cidadaoId) {
      this.notLinked.set(true);
      this.loading.set(false);
      return;
    }

    this.loadProfile(cidadaoId);
  }

  onEdit(): void {
    const ref = this.dialog.open(CidadaoFormDialog, {
      width: 'min(640px, 95vw)',
      data: { cidadao: this.cidadao() },
    });
    ref.afterClosed().subscribe((result) => {
      if (result) {
        const cidadaoId = this.citizenContext.cidadaoId();
        if (cidadaoId) {
          this.loadProfile(cidadaoId);
        }
      }
    });
  }

  private loadProfile(cidadaoId: string): void {
    this.cidadaoService.getById(cidadaoId).subscribe({
      next: (c) => {
        this.cidadao.set(c);
        this.loading.set(false);
      },
      error: () => {
        this.notLinked.set(true);
        this.loading.set(false);
      },
    });
  }
}
