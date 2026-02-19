import { Component, inject, signal, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { TranslateModule } from '@ngx-translate/core';
import { DocumentoService } from '../../../core/services/documento.service';
import { Documento, DocumentoVersion } from '../../../core/models/documento.model';
import { LoadingSpinner } from '../../../shared/components/loading-spinner/loading-spinner';
import { StatusBadge } from '../../../shared/components/status-badge/status-badge';

@Component({
  selector: 'sgc-documento-detail',
  standalone: true,
  imports: [
    DatePipe,
    MatDialogModule, MatButtonModule, MatIconModule,
    MatDividerModule, MatProgressBarModule,
    TranslateModule,
    LoadingSpinner, StatusBadge,
  ],
  template: `
    <h2 mat-dialog-title>
      <mat-icon>description</mat-icon>
      {{ 'documento.details' | translate }}
    </h2>
    <mat-dialog-content>
      @if (loading()) {
        <sgc-loading-spinner />
      } @else if (documento()) {
        <div class="detail-grid">
          <div class="detail-row">
            <span class="label">{{ 'common.type' | translate }}</span>
            <span class="value">{{ 'documento.tipo.' + documento()!.tipo | translate }}</span>
          </div>
          <div class="detail-row">
            <span class="label">{{ 'common.status' | translate }}</span>
            <sgc-status-badge [status]="documento()!.estado" />
          </div>
          @if (documento()!.numero) {
            <div class="detail-row">
              <span class="label">{{ 'documento.numero' | translate }}</span>
              <span class="value mono">{{ documento()!.numero }}</span>
            </div>
          }
          @if (documento()!.dataEmissao) {
            <div class="detail-row">
              <span class="label">{{ 'documento.dataEmissao' | translate }}</span>
              <span class="value">{{ documento()!.dataEmissao | date:'dd/MM/yyyy' }}</span>
            </div>
          }
          @if (documento()!.dataValidade) {
            <div class="detail-row">
              <span class="label">{{ 'documento.dataValidade' | translate }}</span>
              <span class="value">{{ documento()!.dataValidade | date:'dd/MM/yyyy' }}</span>
            </div>
          }
          <div class="detail-row">
            <span class="label">{{ 'documento.versao' | translate }}</span>
            <span class="value mono">v{{ documento()!.versao ?? 1 }}</span>
          </div>
        </div>

        @if (documento()!.ficheiroUrl) {
          <mat-divider style="margin: 16px 0" />
          <div class="file-preview">
            <div class="file-info-row">
              <mat-icon>attach_file</mat-icon>
              <div class="file-meta">
                <span class="file-name">{{ documento()!.ficheiroNome }}</span>
                <span class="file-type">{{ documento()!.ficheiroTipo }} &mdash; {{ formatSize(documento()!.ficheiroTamanho) }}</span>
              </div>
              <button mat-icon-button (click)="download()" matTooltip="Download">
                <mat-icon>download</mat-icon>
              </button>
            </div>

            @if (isPreviewable()) {
              <div class="preview-container">
                @if (isImage()) {
                  <img [src]="previewUrl" alt="Preview" class="preview-image" />
                }
              </div>
            }
          </div>
        }

        @if (versions().length > 1) {
          <mat-divider style="margin: 16px 0" />
          <h4>{{ 'documento.versionHistory' | translate }}</h4>
          <div class="version-list">
            @for (v of versions(); track v.id) {
              <div class="version-item">
                <span class="version-badge">v{{ v.versao }}</span>
                <span class="version-name">{{ v.ficheiroNome }}</span>
                <span class="version-meta">{{ v.createdBy }} &mdash; {{ v.createdAt | date:'dd/MM/yyyy HH:mm' }}</span>
                <sgc-status-badge [status]="v.estado" />
              </div>
            }
          </div>
        }

        <div class="new-version-section">
          <mat-divider style="margin: 16px 0" />
          <button mat-stroked-button (click)="fileInput.click()">
            <mat-icon>add</mat-icon>
            {{ 'documento.newVersion' | translate }}
          </button>
          <input #fileInput type="file" hidden (change)="uploadNewVersion($event)">
          @if (uploadingVersion()) {
            <mat-progress-bar mode="indeterminate"></mat-progress-bar>
          }
        </div>
      }
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>{{ 'common.back' | translate }}</button>
    </mat-dialog-actions>
  `,
  styles: [`
    mat-dialog-content { min-width: 500px; }
    .detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .detail-row { display: flex; flex-direction: column; gap: 2px; }
    .label { font-size: 12px; color: var(--text-dim); text-transform: uppercase; letter-spacing: 0.05em; }
    .value { font-size: 14px; }
    .mono { font-family: 'DM Sans', monospace; letter-spacing: 0.05em; }
    h4 { margin: 0 0 8px; color: var(--gold-light); font-family: 'Playfair Display', serif; }
    .file-info-row { display: flex; align-items: center; gap: 12px; }
    .file-meta { flex: 1; display: flex; flex-direction: column; }
    .file-name { font-weight: 500; }
    .file-type { font-size: 12px; color: var(--text-dim); }
    .preview-container { margin-top: 12px; text-align: center; }
    .preview-image { max-width: 100%; max-height: 300px; border-radius: 8px; border: 1px solid var(--border); }
    .version-list { display: flex; flex-direction: column; gap: 8px; }
    .version-item {
      display: flex; align-items: center; gap: 8px;
      padding: 8px; background: var(--surface2); border-radius: 6px;
    }
    .version-badge {
      background: var(--gold-dim); color: var(--gold); padding: 2px 8px;
      border-radius: 4px; font-size: 12px; font-weight: 600;
    }
    .version-name { flex: 1; font-size: 13px; }
    .version-meta { font-size: 11px; color: var(--text-dim); }
    .new-version-section { margin-top: 8px; }
  `],
})
export class DocumentoDetailDialog implements OnInit {
  private readonly documentoService = inject(DocumentoService);
  private readonly dialogRef = inject(MatDialogRef<DocumentoDetailDialog>);
  private readonly snackBar = inject(MatSnackBar);
  private readonly data = inject<{ cidadaoId: string; documentoId: string }>(MAT_DIALOG_DATA);

  readonly loading = signal(true);
  readonly uploadingVersion = signal(false);
  readonly documento = signal<Documento | null>(null);
  readonly versions = signal<DocumentoVersion[]>([]);

  previewUrl = '';

  ngOnInit(): void {
    this.documentoService.getById(this.data.cidadaoId, this.data.documentoId).subscribe({
      next: (doc) => {
        this.documento.set(doc);
        this.loading.set(false);
        if (doc.ficheiroUrl && this.isImage()) {
          this.previewUrl = doc.ficheiroUrl;
        }
      },
      error: () => this.loading.set(false),
    });

    this.documentoService.getVersions(this.data.cidadaoId, this.data.documentoId).subscribe({
      next: (versions) => this.versions.set(versions),
    });
  }

  isPreviewable(): boolean {
    const doc = this.documento();
    if (!doc?.ficheiroTipo) return false;
    return doc.ficheiroTipo.startsWith('image/');
  }

  isImage(): boolean {
    const doc = this.documento();
    if (!doc?.ficheiroTipo) return false;
    return doc.ficheiroTipo.startsWith('image/');
  }

  formatSize(bytes: number | null): string {
    if (!bytes) return '—';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  }

  download(): void {
    this.documentoService.downloadFicheiro(this.data.cidadaoId, this.data.documentoId).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = this.documento()?.ficheiroNome ?? 'documento';
        a.click();
        URL.revokeObjectURL(url);
      },
      error: () => this.snackBar.open('Erro ao descarregar', '', { duration: 3000 }),
    });
  }

  uploadNewVersion(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.uploadingVersion.set(true);
    this.documentoService.createNewVersion(this.data.cidadaoId, this.data.documentoId, file).subscribe({
      next: () => {
        this.uploadingVersion.set(false);
        this.snackBar.open('Nova versao criada', '', { duration: 3000 });
        this.dialogRef.close(true);
      },
      error: () => {
        this.uploadingVersion.set(false);
        this.snackBar.open('Erro ao criar versao', '', { duration: 3000 });
      },
    });
  }
}
