import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ApiResponse, PagedData } from '../models/api-response.model';
import {
  RegistoCivil, RegistoCivilCreate, RegistoCivilUpdate,
  RegistoCivilHistorico, EstadoRegistoCivil, TipoRegistoCivil,
} from '../models/registo-civil.model';

@Injectable({ providedIn: 'root' })
export class RegistoCivilService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/registos-civis`;

  getAll(
    page = 0,
    size = 20,
    cidadaoId?: string,
    estado?: EstadoRegistoCivil,
    tipo?: TipoRegistoCivil,
  ): Observable<PagedData<RegistoCivil>> {
    let params = new HttpParams().set('page', page).set('size', size);
    if (cidadaoId) params = params.set('cidadaoId', cidadaoId);
    if (estado) params = params.set('estado', estado);
    if (tipo) params = params.set('tipo', tipo);
    return this.http
      .get<ApiResponse<PagedData<RegistoCivil>>>(this.baseUrl, { params })
      .pipe(map((r) => r.data));
  }

  getById(id: string): Observable<RegistoCivil> {
    return this.http
      .get<ApiResponse<RegistoCivil>>(`${this.baseUrl}/${id}`)
      .pipe(map((r) => r.data));
  }

  create(registo: RegistoCivilCreate): Observable<RegistoCivil> {
    return this.http
      .post<ApiResponse<RegistoCivil>>(this.baseUrl, registo)
      .pipe(map((r) => r.data));
  }

  update(id: string, registo: RegistoCivilUpdate): Observable<RegistoCivil> {
    return this.http
      .put<ApiResponse<RegistoCivil>>(`${this.baseUrl}/${id}`, registo)
      .pipe(map((r) => r.data));
  }

  updateEstado(id: string, estado: EstadoRegistoCivil, comentario?: string): Observable<RegistoCivil> {
    return this.http
      .patch<ApiResponse<RegistoCivil>>(`${this.baseUrl}/${id}/estado`, { estado, comentario })
      .pipe(map((r) => r.data));
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  getHistorico(id: string, page = 0, size = 20): Observable<PagedData<RegistoCivilHistorico>> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http
      .get<ApiResponse<PagedData<RegistoCivilHistorico>>>(`${this.baseUrl}/${id}/historico`, { params })
      .pipe(map((r) => r.data));
  }

  downloadCertificado(id: string): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/${id}/certificado`, {
      responseType: 'blob',
    });
  }
}
