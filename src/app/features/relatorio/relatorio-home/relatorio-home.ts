import { Component, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatMenuModule } from '@angular/material/menu';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateModule } from '@ngx-translate/core';
import { DatePipe } from '@angular/common';
import { RelatorioService } from '../../../core/services/relatorio.service';
import { AuthService } from '../../../core/services/auth.service';
import { DashboardResumo, ModuloResumo, AuditEvent } from '../../../core/models/relatorio.model';
import { LoadingSpinner } from '../../../shared/components/loading-spinner/loading-spinner';

@Component({
  selector: 'sgc-relatorio-home',
  standalone: true,
  imports: [
    FormsModule, DatePipe,
    MatCardModule, MatIconModule, MatButtonModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatTableModule, MatPaginatorModule,
    MatMenuModule, MatTabsModule,
    TranslateModule,
    LoadingSpinner,
  ],
  templateUrl: './relatorio-home.html',
  styleUrl: './relatorio-home.scss',
})
export class RelatorioHome implements OnInit {
  private readonly relatorioService = inject(RelatorioService);
  private readonly authService = inject(AuthService);
  private readonly snackBar = inject(MatSnackBar);

  readonly loading = signal(true);
  readonly dashboard = signal<DashboardResumo | null>(null);
  readonly auditEvents = signal<AuditEvent[]>([]);
  readonly auditTotal = signal(0);

  readonly isAdmin = this.authService.isAdmin();
  readonly auditColumns = ['action', 'entityType', 'username', 'details', 'timestamp'];

  dataInicio = '';
  dataFim = '';
  auditPage = 0;
  auditPageSize = 20;

  readonly modules: { key: string; icon: string; label: string }[] = [
    { key: 'visas', icon: 'flight', label: 'relatorio.modulo.visas' },
    { key: 'processos', icon: 'assignment', label: 'relatorio.modulo.processos' },
    { key: 'registosCivis', icon: 'how_to_reg', label: 'relatorio.modulo.registosCivis' },
    { key: 'servicosNotariais', icon: 'gavel', label: 'relatorio.modulo.servicosNotariais' },
    { key: 'agendamentos', icon: 'event', label: 'relatorio.modulo.agendamentos' },
  ];

  ngOnInit(): void {
    this.loadDashboard();
    if (this.isAdmin) {
      this.loadAudit();
    }
  }

  applyFilter(): void {
    this.loadDashboard();
    if (this.isAdmin) {
      this.auditPage = 0;
      this.loadAudit();
    }
  }

  clearFilter(): void {
    this.dataInicio = '';
    this.dataFim = '';
    this.applyFilter();
  }

  getModuleData(key: string): ModuloResumo | null {
    const d = this.dashboard();
    if (!d) return null;
    return (d as unknown as Record<string, ModuloResumo>)[key] ?? null;
  }

  getTopEntries(data: Record<string, number>, limit = 5): { key: string; value: number }[] {
    return Object.entries(data)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([key, value]) => ({ key, value }));
  }

  getMaxValue(data: Record<string, number>): number {
    const values = Object.values(data);
    return values.length > 0 ? Math.max(...values) : 1;
  }

  barWidth(value: number, max: number): string {
    return Math.max((value / max) * 100, 2) + '%';
  }

  onAuditPageChange(event: PageEvent): void {
    this.auditPage = event.pageIndex;
    this.auditPageSize = event.pageSize;
    this.loadAudit();
  }

  exportCsv(modulo: string): void {
    this.relatorioService.exportCsv(modulo, this.dataInicio || undefined, this.dataFim || undefined).subscribe({
      next: (blob) => this.downloadBlob(blob, `relatorio_${modulo}.csv`),
      error: () => this.snackBar.open('Erro ao exportar CSV', '', { duration: 3000 }),
    });
  }

  exportPdfDashboard(): void {
    this.relatorioService.exportPdfDashboard(this.dataInicio || undefined, this.dataFim || undefined).subscribe({
      next: (blob) => this.downloadBlob(blob, 'dashboard.pdf'),
      error: () => this.snackBar.open('Erro ao exportar PDF', '', { duration: 3000 }),
    });
  }

  exportPdfModulo(modulo: string): void {
    this.relatorioService.exportPdfModulo(modulo, this.dataInicio || undefined, this.dataFim || undefined).subscribe({
      next: (blob) => this.downloadBlob(blob, `relatorio_${modulo}.pdf`),
      error: () => this.snackBar.open('Erro ao exportar PDF', '', { duration: 3000 }),
    });
  }

  readonly Object = Object;

  private loadDashboard(): void {
    this.loading.set(true);
    this.relatorioService.getDashboard(
      this.dataInicio || undefined,
      this.dataFim || undefined,
    ).subscribe({
      next: (data) => {
        this.dashboard.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.snackBar.open('Erro ao carregar relatorios', '', { duration: 3000 });
      },
    });
  }

  private loadAudit(): void {
    this.relatorioService.getAuditEvents(
      this.auditPage,
      this.auditPageSize,
      undefined,
      this.dataInicio || undefined,
      this.dataFim || undefined,
    ).subscribe({
      next: (data) => {
        this.auditEvents.set(data.content);
        this.auditTotal.set(data.totalElements);
      },
    });
  }

  private downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }
}
