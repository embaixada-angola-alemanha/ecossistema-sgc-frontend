import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ApiResponse, PagedData } from '../models/api-response.model';
import { Cidadao, CidadaoCreate, CidadaoUpdate, EstadoCidadao, Sexo } from '../models/cidadao.model';

@Injectable({ providedIn: 'root' })
export class CidadaoService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/cidadaos`;

  getAll(
    page = 0,
    size = 20,
    search?: string,
    estado?: EstadoCidadao,
    sexo?: Sexo,
    nacionalidade?: string,
  ): Observable<PagedData<Cidadao>> {
    let params = new HttpParams().set('page', page).set('size', size);
    if (search) params = params.set('search', search);
    if (estado) params = params.set('estado', estado);
    if (sexo) params = params.set('sexo', sexo);
    if (nacionalidade) params = params.set('nacionalidade', nacionalidade);
    return this.http
      .get<ApiResponse<PagedData<Cidadao>>>(this.baseUrl, { params })
      .pipe(map((r) => r.data));
  }

  getById(id: string): Observable<Cidadao> {
    return this.http
      .get<ApiResponse<Cidadao>>(`${this.baseUrl}/${id}`)
      .pipe(map((r) => r.data));
  }

  create(cidadao: CidadaoCreate): Observable<Cidadao> {
    return this.http
      .post<ApiResponse<Cidadao>>(this.baseUrl, cidadao)
      .pipe(map((r) => r.data));
  }

  update(id: string, cidadao: CidadaoUpdate): Observable<Cidadao> {
    return this.http
      .put<ApiResponse<Cidadao>>(`${this.baseUrl}/${id}`, cidadao)
      .pipe(map((r) => r.data));
  }

  updateEstado(id: string, estado: EstadoCidadao): Observable<Cidadao> {
    return this.http
      .patch<ApiResponse<Cidadao>>(`${this.baseUrl}/${id}/estado`, { estado })
      .pipe(map((r) => r.data));
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
