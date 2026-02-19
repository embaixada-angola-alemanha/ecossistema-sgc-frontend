import { Component, inject } from '@angular/core';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';

export interface ConfirmDialogData {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  warn?: boolean;
}

@Component({
  selector: 'sgc-confirm-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, MatIconModule, TranslateModule],
  template: `
    <h2 mat-dialog-title>
      <mat-icon [class.warn]="data.warn">{{ data.warn ? 'warning' : 'help_outline' }}</mat-icon>
      {{ data.title }}
    </h2>
    <mat-dialog-content>
      <p>{{ data.message }}</p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>{{ data.cancelLabel || ('common.cancel' | translate) }}</button>
      <button mat-flat-button
              [color]="data.warn ? 'warn' : 'primary'"
              [mat-dialog-close]="true">
        {{ data.confirmLabel || ('common.confirm' | translate) }}
      </button>
    </mat-dialog-actions>
  `,
  styles: `
    h2 {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .warn {
      color: #ef5350;
    }
    p {
      font-size: 0.95rem;
      line-height: 1.5;
    }
    mat-dialog-actions {
      gap: 8px;
    }
  `,
})
export class ConfirmDialog {
  readonly data = inject<ConfirmDialogData>(MAT_DIALOG_DATA);
}
