import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { TranslateModule } from '@ngx-translate/core';
import { DocumentoService } from '../../../core/services/documento.service';
import { DocumentoCreate, TipoDocumento, TIPO_DOCUMENTO_VALUES } from '../../../core/models/documento.model';
import { switchMap } from 'rxjs/operators';

@Component({
  selector: 'sgc-documento-upload',
  standalone: true,
  imports: [
    FormsModule,
    MatDialogModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatProgressBarModule,
    TranslateModule,
  ],
  template: `
    <h2 mat-dialog-title>
      <mat-icon>upload_file</mat-icon>
      {{ 'documento.upload' | translate }}
    </h2>
    <mat-dialog-content>
      <div class="upload-form">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>{{ 'common.type' | translate }}</mat-label>
          <mat-select [(ngModel)]="tipo" required>
            @for (t of tipoValues; track t) {
              <mat-option [value]="t">{{ 'documento.tipo.' + t | translate }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>{{ 'documento.numero' | translate }}</mat-label>
          <input matInput [(ngModel)]="numero">
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>{{ 'documento.dataEmissao' | translate }}</mat-label>
          <input matInput type="date" [(ngModel)]="dataEmissao">
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>{{ 'documento.dataValidade' | translate }}</mat-label>
          <input matInput type="date" [(ngModel)]="dataValidade">
        </mat-form-field>

        <div class="drop-zone full-width"
             [class.drag-over]="isDragOver"
             (dragover)="onDragOver($event)"
             (dragleave)="isDragOver = false"
             (drop)="onDrop($event)"
             (click)="fileInput.click()">
          <input #fileInput type="file" hidden (change)="onFileSelect($event)"
                 accept=".pdf,.jpg,.jpeg,.png,.doc,.docx">
          @if (selectedFile) {
            <div class="selected-file">
              <mat-icon>insert_drive_file</mat-icon>
              <div class="file-info">
                <span class="file-name">{{ selectedFile.name }}</span>
                <span class="file-size">{{ formatSize(selectedFile.size) }}</span>
              </div>
              <button mat-icon-button (click)="removeFile($event)">
                <mat-icon>close</mat-icon>
              </button>
            </div>
          } @else {
            <mat-icon class="drop-icon">cloud_upload</mat-icon>
            <span>{{ 'documento.dropHere' | translate }}</span>
            <span class="drop-hint">PDF, JPG, PNG, DOC (max 10MB)</span>
          }
        </div>

        @if (uploading()) {
          <mat-progress-bar mode="indeterminate" class="full-width"></mat-progress-bar>
        }
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>{{ 'common.cancel' | translate }}</button>
      <button mat-raised-button color="primary" [disabled]="!canSubmit || uploading()" (click)="submit()">
        <mat-icon>upload</mat-icon>
        {{ 'documento.upload' | translate }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .upload-form { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; min-width: 450px; }
    .full-width { grid-column: 1 / -1; }
    .drop-zone {
      border: 2px dashed var(--border, rgba(201, 168, 76, 0.2));
      border-radius: 12px;
      padding: 32px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      transition: all 0.2s;
      color: var(--text-dim);

      &:hover, &.drag-over {
        border-color: var(--gold, #c9a84c);
        background: var(--gold-dim, rgba(201, 168, 76, 0.08));
      }
    }
    .drop-icon { font-size: 40px; width: 40px; height: 40px; color: var(--gold); }
    .drop-hint { font-size: 11px; opacity: 0.6; }
    .selected-file {
      display: flex;
      align-items: center;
      gap: 12px;
      width: 100%;

      mat-icon:first-child { color: var(--gold); font-size: 32px; width: 32px; height: 32px; }
    }
    .file-info { flex: 1; display: flex; flex-direction: column; }
    .file-name { font-weight: 500; color: var(--text); }
    .file-size { font-size: 12px; color: var(--text-dim); }
  `],
})
export class DocumentoUploadDialog {
  private readonly documentoService = inject(DocumentoService);
  private readonly dialogRef = inject(MatDialogRef<DocumentoUploadDialog>);
  private readonly snackBar = inject(MatSnackBar);
  private readonly data = inject<{ cidadaoId: string }>(MAT_DIALOG_DATA);

  readonly tipoValues = TIPO_DOCUMENTO_VALUES;
  readonly uploading = signal(false);

  tipo: TipoDocumento | '' = '';
  numero = '';
  dataEmissao = '';
  dataValidade = '';
  selectedFile: File | null = null;
  isDragOver = false;

  get canSubmit(): boolean {
    return !!this.tipo && !!this.selectedFile;
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = true;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = false;
    const file = event.dataTransfer?.files[0];
    if (file) this.setFile(file);
  }

  onFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) this.setFile(file);
  }

  removeFile(event: Event): void {
    event.stopPropagation();
    this.selectedFile = null;
  }

  formatSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  }

  submit(): void {
    if (!this.canSubmit || !this.selectedFile) return;
    this.uploading.set(true);

    const request: DocumentoCreate = {
      tipo: this.tipo as TipoDocumento,
      numero: this.numero || undefined,
      dataEmissao: this.dataEmissao || undefined,
      dataValidade: this.dataValidade || undefined,
    };

    const file = this.selectedFile;
    this.documentoService.create(this.data.cidadaoId, request).pipe(
      switchMap((doc) => this.documentoService.uploadFicheiro(this.data.cidadaoId, doc.id, file)),
    ).subscribe({
      next: () => {
        this.snackBar.open('Documento carregado', '', { duration: 3000 });
        this.dialogRef.close(true);
      },
      error: () => {
        this.uploading.set(false);
        this.snackBar.open('Erro ao carregar documento', '', { duration: 3000 });
      },
    });
  }

  private setFile(file: File): void {
    if (file.size > 10 * 1024 * 1024) {
      this.snackBar.open('Ficheiro demasiado grande (max 10MB)', '', { duration: 3000 });
      return;
    }
    this.selectedFile = file;
  }
}
