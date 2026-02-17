import { Component, input } from '@angular/core';
import { MatChipsModule } from '@angular/material/chips';

@Component({
  selector: 'sgc-status-badge',
  standalone: true,
  imports: [MatChipsModule],
  template: `<mat-chip [class]="'status-' + status().toLowerCase()">{{ status() }}</mat-chip>`,
  styles: `
    .status-pendente, .status-rascunho { background-color: #9e9e9e; color: white; }
    .status-em_analise, .status-submetido { background-color: #2196f3; color: white; }
    .status-aprovado, .status-concluido { background-color: #4caf50; color: white; }
    .status-rejeitado, .status-cancelado { background-color: #f44336; color: white; }
    .status-em_processamento { background-color: #ff9800; color: white; }
  `,
})
export class StatusBadge {
  readonly status = input.required<string>();
}
