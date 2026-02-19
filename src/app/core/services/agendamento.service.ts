import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ApiResponse, PagedData } from '../models/api-response.model';
import {
  Agendamento, AgendamentoCreate, AgendamentoUpdate,
  AgendamentoHistorico, SlotDisponivel,
  EstadoAgendamento, TipoAgendamento,
} from '../models/agendamento.model';

@Injectable({ providedIn: 'root' })
export class AgendamentoService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/agendamentos`;

  getAll(
    page = 0,
    size = 20,
    cidadaoId?: string,
    estado?: EstadoAgendamento,
    tipo?: TipoAgendamento,
    dataInicio?: string,
    dataFim?: string,
  ): Observable<PagedData<Agendamento>> {
    let params = new HttpParams().set('page', page).set('size', size);
    if (cidadaoId) params = params.set('cidadaoId', cidadaoId);
    if (estado) params = params.set('estado', estado);
    if (tipo) params = params.set('tipo', tipo);
    if (dataInicio) params = params.set('dataInicio', dataInicio);
    if (dataFim) params = params.set('dataFim', dataFim);
    return this.http
      .get<ApiResponse<PagedData<Agendamento>>>(this.baseUrl, { params })
      .pipe(map((r) => r.data));
  }

  getById(id: string): Observable<Agendamento> {
    return this.http
      .get<ApiResponse<Agendamento>>(`${this.baseUrl}/${id}`)
      .pipe(map((r) => r.data));
  }

  create(agendamento: AgendamentoCreate): Observable<Agendamento> {
    return this.http
      .post<ApiResponse<Agendamento>>(this.baseUrl, agendamento)
      .pipe(map((r) => r.data));
  }

  reschedule(id: string, update: AgendamentoUpdate): Observable<Agendamento> {
    return this.http
      .put<ApiResponse<Agendamento>>(`${this.baseUrl}/${id}`, update)
      .pipe(map((r) => r.data));
  }

  updateEstado(id: string, estado: EstadoAgendamento, comentario?: string): Observable<Agendamento> {
    return this.http
      .patch<ApiResponse<Agendamento>>(`${this.baseUrl}/${id}/estado`, { estado, comentario })
      .pipe(map((r) => r.data));
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  getHistorico(id: string, page = 0, size = 50): Observable<PagedData<AgendamentoHistorico>> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http
      .get<ApiResponse<PagedData<AgendamentoHistorico>>>(`${this.baseUrl}/${id}/historico`, { params })
      .pipe(map((r) => r.data));
  }

  getAvailableSlots(tipo: TipoAgendamento, data: string): Observable<SlotDisponivel[]> {
    const params = new HttpParams().set('tipo', tipo).set('data', data);
    return this.http
      .get<ApiResponse<SlotDisponivel[]>>(`${this.baseUrl}/slots`, { params })
      .pipe(map((r) => r.data));
  }
}
