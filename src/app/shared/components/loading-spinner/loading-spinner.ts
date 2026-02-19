import { Component } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'sgc-loading-spinner',
  standalone: true,
  imports: [MatProgressSpinnerModule],
  template: `
    <div class="spinner-container" role="status" aria-live="polite" aria-label="Loading">
      <mat-spinner diameter="48"></mat-spinner>
    </div>
  `,
  styles: `
    .spinner-container {
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 48px;
    }
  `,
})
export class LoadingSpinner {}
