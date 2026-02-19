import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PagedData } from '../models/api-response.model';
import { DashboardResumo, Estatisticas, AuditEvent } from '../models/relatorio.model';

@Injectable({ providedIn: 'root' })
export class RelatorioService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/relatorios`;

  getDashboard(dataInicio?: string, dataFim?: string): Observable<DashboardResumo> {
    let params = new HttpParams();
    if (dataInicio) params = params.set('dataInicio', dataInicio);
    if (dataFim) params = params.set('dataFim', dataFim);
    return this.http.get<DashboardResumo>(`${this.baseUrl}/dashboard`, { params });
  }

  getEstatisticas(modulo?: string, dataInicio?: string, dataFim?: string,
                  tipo?: string, estado?: string): Observable<Estatisticas> {
    let params = new HttpParams();
    if (modulo) params = params.set('modulo', modulo);
    if (dataInicio) params = params.set('dataInicio', dataInicio);
    if (dataFim) params = params.set('dataFim', dataFim);
    if (tipo) params = params.set('tipo', tipo);
    if (estado) params = params.set('estado', estado);
    return this.http.get<Estatisticas>(`${this.baseUrl}/estatisticas`, { params });
  }

  getAuditEvents(page = 0, size = 20, modulo?: string,
                 dataInicio?: string, dataFim?: string): Observable<PagedData<AuditEvent>> {
    let params = new HttpParams().set('page', page).set('size', size);
    if (modulo) params = params.set('modulo', modulo);
    if (dataInicio) params = params.set('dataInicio', dataInicio);
    if (dataFim) params = params.set('dataFim', dataFim);
    return this.http.get<PagedData<AuditEvent>>(`${this.baseUrl}/audit`, { params });
  }

  exportCsv(modulo: string, dataInicio?: string, dataFim?: string): Observable<Blob> {
    let params = new HttpParams();
    if (dataInicio) params = params.set('dataInicio', dataInicio);
    if (dataFim) params = params.set('dataFim', dataFim);
    return this.http.get(`${this.baseUrl}/export/csv/${modulo}`, {
      params,
      responseType: 'blob',
    });
  }

  exportPdfDashboard(dataInicio?: string, dataFim?: string): Observable<Blob> {
    let params = new HttpParams();
    if (dataInicio) params = params.set('dataInicio', dataInicio);
    if (dataFim) params = params.set('dataFim', dataFim);
    return this.http.get(`${this.baseUrl}/export/pdf/dashboard`, {
      params,
      responseType: 'blob',
    });
  }

  exportPdfModulo(modulo: string, dataInicio?: string, dataFim?: string): Observable<Blob> {
    let params = new HttpParams();
    if (dataInicio) params = params.set('dataInicio', dataInicio);
    if (dataFim) params = params.set('dataFim', dataFim);
    return this.http.get(`${this.baseUrl}/export/pdf/${modulo}`, {
      params,
      responseType: 'blob',
    });
  }
}
