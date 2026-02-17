import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ApiResponse, PagedData } from '../models/api-response.model';
import {
  Visto, VistoCreate, VistoUpdate, VistoHistorico,
  VistoFee, VistoChecklist, EstadoVisto, TipoVisto,
} from '../models/visto.model';

@Injectable({ providedIn: 'root' })
export class VistoService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/visas`;

  getAll(
    page = 0,
    size = 20,
    cidadaoId?: string,
    estado?: EstadoVisto,
    tipo?: TipoVisto,
  ): Observable<PagedData<Visto>> {
    let params = new HttpParams().set('page', page).set('size', size);
    if (cidadaoId) params = params.set('cidadaoId', cidadaoId);
    if (estado) params = params.set('estado', estado);
    if (tipo) params = params.set('tipo', tipo);
    return this.http
      .get<ApiResponse<PagedData<Visto>>>(this.baseUrl, { params })
      .pipe(map((r) => r.data));
  }

  getById(id: string): Observable<Visto> {
    return this.http
      .get<ApiResponse<Visto>>(`${this.baseUrl}/${id}`)
      .pipe(map((r) => r.data));
  }

  create(visto: VistoCreate): Observable<Visto> {
    return this.http
      .post<ApiResponse<Visto>>(this.baseUrl, visto)
      .pipe(map((r) => r.data));
  }

  update(id: string, visto: VistoUpdate): Observable<Visto> {
    return this.http
      .put<ApiResponse<Visto>>(`${this.baseUrl}/${id}`, visto)
      .pipe(map((r) => r.data));
  }

  updateEstado(id: string, estado: EstadoVisto, comentario?: string): Observable<Visto> {
    return this.http
      .patch<ApiResponse<Visto>>(`${this.baseUrl}/${id}/estado`, { estado, comentario })
      .pipe(map((r) => r.data));
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  getHistorico(id: string, page = 0, size = 20): Observable<PagedData<VistoHistorico>> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http
      .get<ApiResponse<PagedData<VistoHistorico>>>(`${this.baseUrl}/${id}/historico`, { params })
      .pipe(map((r) => r.data));
  }

  getFee(tipo: TipoVisto): Observable<VistoFee> {
    const params = new HttpParams().set('tipo', tipo);
    return this.http
      .get<ApiResponse<VistoFee>>(`${this.baseUrl}/fees`, { params })
      .pipe(map((r) => r.data));
  }

  getChecklist(tipo: TipoVisto): Observable<VistoChecklist> {
    const params = new HttpParams().set('tipo', tipo);
    return this.http
      .get<ApiResponse<VistoChecklist>>(`${this.baseUrl}/checklist`, { params })
      .pipe(map((r) => r.data));
  }
}
