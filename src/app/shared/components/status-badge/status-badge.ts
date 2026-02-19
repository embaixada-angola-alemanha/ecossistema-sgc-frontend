import { Component, input } from '@angular/core';
import { MatChipsModule } from '@angular/material/chips';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'sgc-status-badge',
  standalone: true,
  imports: [MatChipsModule, TranslateModule],
  template: `<mat-chip [class]="'status-' + status().toLowerCase()" [attr.aria-label]="'Status: ' + status()">{{ 'status.' + status() | translate }}</mat-chip>`,
  styles: `
    .status-pendente, .status-rascunho { background-color: #757575; color: white; }
    .status-em_analise, .status-submetido { background-color: #1976d2; color: white; }
    .status-aprovado, .status-concluido { background-color: #2e7d32; color: white; }
    .status-rejeitado, .status-cancelado { background-color: #c62828; color: white; }
    .status-documentos_pendentes, .status-em_processamento { background-color: #e65100; color: white; }
    .status-emitido { background-color: #1b5e20; color: white; }
    .status-activo { background-color: #2e7d32; color: white; }
    .status-inactivo { background-color: #757575; color: white; }
    .status-suspenso { background-color: #e65100; color: white; }
    .status-em_verificacao { background-color: #1565c0; color: white; }
    .status-verificado { background-color: #2e7d32; color: white; }
    .status-certificado_emitido { background-color: #1b5e20; color: white; }
    .status-entregue { background-color: #00695c; color: white; }
    .status-confirmado { background-color: #1565c0; color: white; }
    .status-reagendado { background-color: #4527a0; color: white; }
    .status-completado { background-color: #1b5e20; color: white; }
    .status-nao_compareceu { background-color: #c62828; color: white; }
    .status-expirado { background-color: #757575; color: white; }
  `,
})
export class StatusBadge {
  readonly status = input.required<string>();
}
