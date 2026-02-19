import { Component, Input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'sgc-workflow-stepper',
  standalone: true,
  imports: [MatIconModule, TranslateModule],
  template: `
    <div class="workflow-stepper">
      @for (step of steps; track step; let i = $index; let last = $last) {
        <div class="step" [class.completed]="getStepIndex() > i"
             [class.active]="getStepIndex() === i"
             [class.rejected]="isTerminal && getStepIndex() === i">
          <div class="step-indicator">
            @if (getStepIndex() > i) {
              <mat-icon class="step-icon done">check_circle</mat-icon>
            } @else if (getStepIndex() === i && isTerminal) {
              <mat-icon class="step-icon terminal">cancel</mat-icon>
            } @else if (getStepIndex() === i) {
              <div class="step-dot active"></div>
            } @else {
              <div class="step-dot"></div>
            }
          </div>
          <span class="step-label">{{ translationPrefix + step | translate }}</span>
          @if (!last) {
            <div class="step-connector" [class.completed]="getStepIndex() > i"></div>
          }
        </div>
      }
    </div>
  `,
  styles: `
    .workflow-stepper {
      display: flex;
      align-items: flex-start;
      gap: 0;
      padding: 12px 0;
      overflow-x: auto;
    }
    .step {
      display: flex;
      flex-direction: column;
      align-items: center;
      position: relative;
      min-width: 100px;
      flex: 1;
    }
    .step-indicator {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
    }
    .step-icon {
      font-size: 28px;
      width: 28px;
      height: 28px;
    }
    .step-icon.done { color: #4caf50; }
    .step-icon.terminal { color: #f44336; }
    .step-dot {
      width: 14px;
      height: 14px;
      border-radius: 50%;
      background: var(--border, rgba(201, 168, 76, 0.15));
      border: 2px solid var(--border, rgba(201, 168, 76, 0.15));
    }
    .step-dot.active {
      background: var(--gold, #c9a84c);
      border-color: var(--gold, #c9a84c);
      box-shadow: 0 0 0 4px rgba(201, 168, 76, 0.2);
    }
    .step-label {
      margin-top: 6px;
      font-size: 0.7rem;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      text-align: center;
      color: var(--text-dim, rgba(224, 232, 240, 0.4));
      max-width: 110px;
    }
    .step.completed .step-label,
    .step.active .step-label {
      color: var(--text, #e0e8f0);
    }
    .step.rejected .step-label { color: #f44336; }
    .step-connector {
      position: absolute;
      top: 16px;
      left: calc(50% + 16px);
      right: calc(-50% + 16px);
      height: 2px;
      background: var(--border, rgba(201, 168, 76, 0.15));
    }
    .step-connector.completed { background: #4caf50; }
  `,
})
export class WorkflowStepper {
  @Input() steps: string[] = [];
  @Input() currentStatus = '';
  @Input() translationPrefix = '';
  @Input() isTerminal = false;

  getStepIndex(): number {
    const idx = this.steps.indexOf(this.currentStatus);
    return idx >= 0 ? idx : -1;
  }
}
