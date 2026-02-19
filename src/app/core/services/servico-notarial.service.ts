import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ApiResponse, PagedData } from '../models/api-response.model';
import {
  ServicoNotarial, ServicoNotarialCreate, ServicoNotarialUpdate,
  ServicoNotarialHistorico, EstadoServicoNotarial, TipoServicoNotarial,
  NotarialFee,
} from '../models/servico-notarial.model';

@Injectable({ providedIn: 'root' })
export class ServicoNotarialService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/servicos-notariais`;

  getAll(
    page = 0,
    size = 20,
    cidadaoId?: string,
    estado?: EstadoServicoNotarial,
    tipo?: TipoServicoNotarial,
  ): Observable<PagedData<ServicoNotarial>> {
    let params = new HttpParams().set('page', page).set('size', size);
    if (cidadaoId) params = params.set('cidadaoId', cidadaoId);
    if (estado) params = params.set('estado', estado);
    if (tipo) params = params.set('tipo', tipo);
    return this.http
      .get<ApiResponse<PagedData<ServicoNotarial>>>(this.baseUrl, { params })
      .pipe(map((r) => r.data));
  }

  getById(id: string): Observable<ServicoNotarial> {
    return this.http
      .get<ApiResponse<ServicoNotarial>>(`${this.baseUrl}/${id}`)
      .pipe(map((r) => r.data));
  }

  create(servico: ServicoNotarialCreate): Observable<ServicoNotarial> {
    return this.http
      .post<ApiResponse<ServicoNotarial>>(this.baseUrl, servico)
      .pipe(map((r) => r.data));
  }

  update(id: string, servico: ServicoNotarialUpdate): Observable<ServicoNotarial> {
    return this.http
      .put<ApiResponse<ServicoNotarial>>(`${this.baseUrl}/${id}`, servico)
      .pipe(map((r) => r.data));
  }

  updateEstado(id: string, estado: EstadoServicoNotarial, comentario?: string): Observable<ServicoNotarial> {
    return this.http
      .patch<ApiResponse<ServicoNotarial>>(`${this.baseUrl}/${id}/estado`, { estado, comentario })
      .pipe(map((r) => r.data));
  }

  markPaid(id: string): Observable<ServicoNotarial> {
    return this.http
      .patch<ApiResponse<ServicoNotarial>>(`${this.baseUrl}/${id}/pagamento`, {})
      .pipe(map((r) => r.data));
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  getHistorico(id: string, page = 0, size = 20): Observable<PagedData<ServicoNotarialHistorico>> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http
      .get<ApiResponse<PagedData<ServicoNotarialHistorico>>>(`${this.baseUrl}/${id}/historico`, { params })
      .pipe(map((r) => r.data));
  }

  getFee(tipo: TipoServicoNotarial): Observable<NotarialFee> {
    const params = new HttpParams().set('tipo', tipo);
    return this.http
      .get<ApiResponse<NotarialFee>>(`${this.baseUrl}/fees`, { params })
      .pipe(map((r) => r.data));
  }

  downloadCertificado(id: string): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/${id}/certificado`, {
      responseType: 'blob',
    });
  }
}
