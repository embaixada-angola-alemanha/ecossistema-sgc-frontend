import { Component, inject, signal, OnInit } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { TranslateModule } from '@ngx-translate/core';
import { forkJoin } from 'rxjs';

import { AuthService } from '../../../core/services/auth.service';
import { CidadaoService } from '../../../core/services/cidadao.service';
import { VistoService } from '../../../core/services/visto.service';
import { AgendamentoService } from '../../../core/services/agendamento.service';
import { RelatorioService } from '../../../core/services/relatorio.service';
import { CitizenContextService } from '../../../core/services/citizen-context.service';
import { Visto } from '../../../core/models/visto.model';
import { Agendamento } from '../../../core/models/agendamento.model';
import { AuditEvent, DashboardResumo } from '../../../core/models/relatorio.model';
import { LoadingSpinner } from '../../../shared/components/loading-spinner/loading-spinner';

export interface MonthlyBar {
  label: string;
  height: number;
}

@Component({
  selector: 'sgc-dashboard-home',
  standalone: true,
  imports: [
    DatePipe,
    DecimalPipe,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    TranslateModule,
    LoadingSpinner,
  ],
  templateUrl: './dashboard-home.html',
  styleUrl: './dashboard-home.scss',
})
export class DashboardHome implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly cidadaoService = inject(CidadaoService);
  private readonly vistoService = inject(VistoService);
  private readonly agendamentoService = inject(AgendamentoService);
  private readonly relatorioService = inject(RelatorioService);
  private readonly citizenContext = inject(CitizenContextService);
  private readonly router = inject(Router);

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly isCitizenOnly = this.authService.isCitizenOnly();

  readonly totalCitizens = signal(0);
  readonly pendingVisas = signal(0);
  readonly todayAppointments = signal(0);
  readonly pendingDocuments = signal(0);

  readonly recentVisas = signal<Visto[]>([]);
  readonly upcomingAppointments = signal<Agendamento[]>([]);
  readonly recentActivity = signal<AuditEvent[]>([]);
  readonly monthlyBars = signal<MonthlyBar[]>([]);

  readonly monthLabels = ['JAN','FEV','MAR','ABR','MAI','JUN','JUL','AGO','SET','OUT','NOV','DEZ'];

  ngOnInit(): void {
    this.loadData();
  }

  private loadData(): void {
    this.loading.set(true);
    this.error.set(null);

    const cidadaoId = this.isCitizenOnly ? this.citizenContext.cidadaoId() ?? undefined : undefined;

    const today = new Date().toISOString().split('T')[0];
    const todayStart = `${today}T00:00:00`;
    const todayEnd = `${today}T23:59:59`;

    forkJoin({
      dashboard: this.relatorioService.getDashboard(),
      cidadaos: this.cidadaoService.getAll(0, 1),
      recentVisas: this.vistoService.getAll(0, 5, cidadaoId),
      todayAppointments: this.agendamentoService.getAll(0, 5, cidadaoId, undefined, undefined, todayStart, todayEnd),
      upcomingAppointments: this.agendamentoService.getAll(0, 5, cidadaoId, 'PENDENTE'),
      audit: this.relatorioService.getAuditEvents(0, 5),
    }).subscribe({
      next: ({ dashboard, cidadaos, recentVisas, todayAppointments, upcomingAppointments, audit }) => {
        if (this.isCitizenOnly) {
          this.totalCitizens.set(dashboard.totalGeral);
        } else {
          this.totalCitizens.set(cidadaos.totalElements);
        }

        const pendingVisaCount = this.countPendingVisas(dashboard);
        this.pendingVisas.set(pendingVisaCount);

        this.todayAppointments.set(todayAppointments.totalElements);

        const pendingDocsCount = (dashboard.visas?.porEstado?.['DOCUMENTOS_PENDENTES'] ?? 0);
        this.pendingDocuments.set(pendingDocsCount);

        this.recentVisas.set(recentVisas.content.slice(0, 5));
        this.upcomingAppointments.set(upcomingAppointments.content.slice(0, 5));
        this.recentActivity.set(audit.content.slice(0, 5));

        this.buildMonthlyChart(dashboard);

        this.loading.set(false);
      },
      error: (err) => {
        console.error('Dashboard load error:', err);
        this.error.set('common.error');
        this.loading.set(false);
      },
    });
  }

  private buildMonthlyChart(dashboard: DashboardResumo): void {
    const porTipo = dashboard.processos?.porTipo ?? {};
    const values: number[] = this.monthLabels.map((_, i) => {
      const key = String(i + 1).padStart(2, '0');
      return porTipo[key] ?? 0;
    });
    const max = Math.max(...values, 1);
    this.monthlyBars.set(
      values.map((v, i) => ({
        label: this.monthLabels[i],
        height: Math.max((v / max) * 100, 8),
      })),
    );
  }

  private countPendingVisas(dashboard: DashboardResumo): number {
    const pendingStates = ['SUBMETIDO', 'EM_ANALISE', 'DOCUMENTOS_PENDENTES'];
    if (!dashboard.visas?.porEstado) return 0;
    return pendingStates.reduce(
      (sum, estado) => sum + (dashboard.visas.porEstado[estado] ?? 0),
      0,
    );
  }

  activityColor(event: AuditEvent): string {
    const action = (event.action || event.acao || '').toUpperCase();
    if (action.includes('DELETE') || action.includes('CANCEL')) return 'var(--red)';
    if (action.includes('APPROV') || action.includes('EMIT') || action.includes('CREATE')) return 'var(--green)';
    return 'var(--gold)';
  }

  activityText(event: AuditEvent): string {
    return event.details || `${event.action ?? event.acao} — ${event.entityType ?? event.modulo}`;
  }

  activityTime(event: AuditEvent): string {
    const ts = event.timestamp || event.dataHora;
    if (!ts) return '';
    const diff = Date.now() - new Date(ts).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'agora';
    if (mins < 60) return `há ${mins} min`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `há ${hours}h`;
    return `há ${Math.floor(hours / 24)}d`;
  }

  navigateTo(path: string): void {
    this.router.navigate([path]);
  }

  refresh(): void {
    this.loadData();
  }
}
