import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, forkJoin, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ApiResponse, PagedData } from '../models/api-response.model';
import {
  WorkflowModule, WorkflowItem, ModulePipeline, WORKFLOW_MODULES,
  MODULE_TRANSITIONS, PIPELINE_STATES,
} from '../models/workflow.model';
import { DashboardResumo } from '../models/relatorio.model';
import { RelatorioService } from './relatorio.service';

@Injectable({ providedIn: 'root' })
export class WorkflowService {
  private readonly http = inject(HttpClient);
  private readonly relatorioService = inject(RelatorioService);
  private readonly apiBase = environment.apiBaseUrl;

  getPipelineData(): Observable<{ dashboard: DashboardResumo; pipelines: ModulePipeline[] }> {
    return this.relatorioService.getDashboard().pipe(
      map((dashboard) => {
        const pipelines: ModulePipeline[] = WORKFLOW_MODULES.map((mod) => {
          const resumo = dashboard[mod.key as keyof DashboardResumo];
          if (typeof resumo === 'number') {
            return { module: mod.key, label: mod.label, icon: mod.icon, stages: [], total: 0 };
          }
          const moduleResumo = resumo as { total: number; porEstado: Record<string, number> };
          const stages = (PIPELINE_STATES[mod.key] ?? []).map((estado) => ({
            estado,
            count: moduleResumo.porEstado[estado] ?? 0,
            items: [],
          }));
          return {
            module: mod.key,
            label: mod.label,
            icon: mod.icon,
            stages,
            total: moduleResumo.total,
          };
        });
        return { dashboard, pipelines };
      }),
    );
  }

  getQueueItems(
    module: WorkflowModule,
    estado?: string,
    page = 0,
    size = 20,
  ): Observable<PagedData<WorkflowItem>> {
    const mod = WORKFLOW_MODULES.find((m) => m.key === module);
    if (!mod) return of({ content: [], page: 0, size: 20, totalElements: 0, totalPages: 0, last: true });

    let params = new HttpParams().set('page', page).set('size', size);
    if (estado) params = params.set('estado', estado);

    return this.http
      .get<ApiResponse<PagedData<any>>>(`${this.apiBase}/${mod.apiPath}`, { params })
      .pipe(
        map((r) => {
          const data = r.data;
          return {
            ...data,
            content: data.content.map((item: any) => this.mapToWorkflowItem(module, item)),
          };
        }),
      );
  }

  updateEstado(
    module: WorkflowModule,
    id: string,
    estado: string,
    comentario?: string,
  ): Observable<any> {
    const mod = WORKFLOW_MODULES.find((m) => m.key === module);
    if (!mod) return of(null);

    return this.http
      .patch<ApiResponse<any>>(`${this.apiBase}/${mod.apiPath}/${id}/estado`, { estado, comentario })
      .pipe(map((r) => r.data));
  }

  bulkUpdateEstado(
    module: WorkflowModule,
    ids: string[],
    estado: string,
    comentario?: string,
  ): Observable<{ success: string[]; failed: string[] }> {
    const requests = ids.map((id) =>
      this.updateEstado(module, id, estado, comentario).pipe(
        map(() => ({ id, ok: true })),
        catchError(() => of({ id, ok: false })),
      ),
    );

    return forkJoin(requests).pipe(
      map((results) => ({
        success: results.filter((r) => r.ok).map((r) => r.id),
        failed: results.filter((r) => !r.ok).map((r) => r.id),
      })),
    );
  }

  getTransitions(module: WorkflowModule, estado: string): string[] {
    return MODULE_TRANSITIONS[module]?.[estado] ?? [];
  }

  private mapToWorkflowItem(module: WorkflowModule, item: any): WorkflowItem {
    const numero = item.numeroVisto ?? item.numeroRegisto ?? item.numeroServico
      ?? item.numeroAgendamento ?? item.numero ?? null;

    return {
      id: item.id,
      module,
      cidadaoNome: item.cidadaoNome ?? '—',
      numero,
      tipo: item.tipo ?? '—',
      estado: item.estado,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt ?? item.createdAt,
      allowedTransitions: this.getTransitions(module, item.estado),
    };
  }
}
