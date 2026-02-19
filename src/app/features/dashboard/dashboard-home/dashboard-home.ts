import { Component, inject, signal, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
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
import { DashboardResumo } from '../../../core/models/relatorio.model';
import { LoadingSpinner } from '../../../shared/components/loading-spinner/loading-spinner';

@Component({
  selector: 'sgc-dashboard-home',
  standalone: true,
  imports: [
    DatePipe,
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
    }).subscribe({
      next: ({ dashboard, cidadaos, recentVisas, todayAppointments, upcomingAppointments }) => {
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

        this.loading.set(false);
      },
      error: (err) => {
        console.error('Dashboard load error:', err);
        this.error.set('common.error');
        this.loading.set(false);
      },
    });
  }

  private countPendingVisas(dashboard: DashboardResumo): number {
    const pendingStates = ['SUBMETIDO', 'EM_ANALISE', 'DOCUMENTOS_PENDENTES'];
    if (!dashboard.visas?.porEstado) return 0;
    return pendingStates.reduce(
      (sum, estado) => sum + (dashboard.visas.porEstado[estado] ?? 0),
      0,
    );
  }

  navigateTo(path: string): void {
    this.router.navigate([path]);
  }

  refresh(): void {
    this.loadData();
  }
}
