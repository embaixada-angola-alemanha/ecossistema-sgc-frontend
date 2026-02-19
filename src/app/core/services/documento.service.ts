import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ApiResponse, PagedData } from '../models/api-response.model';
import {
  Documento, DocumentoCreate, DocumentoUpdate,
  DocumentoVersion, DocumentoUpload, EstadoDocumento,
} from '../models/documento.model';

@Injectable({ providedIn: 'root' })
export class DocumentoService {
  private readonly http = inject(HttpClient);
  private readonly apiBase = environment.apiBaseUrl;

  private cidadaoUrl(cidadaoId: string): string {
    return `${this.apiBase}/cidadaos/${cidadaoId}/documentos`;
  }

  getAll(cidadaoId: string, page = 0, size = 20): Observable<PagedData<Documento>> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http
      .get<ApiResponse<PagedData<Documento>>>(this.cidadaoUrl(cidadaoId), { params })
      .pipe(map((r) => r.data));
  }

  getById(cidadaoId: string, id: string): Observable<Documento> {
    return this.http
      .get<ApiResponse<Documento>>(`${this.cidadaoUrl(cidadaoId)}/${id}`)
      .pipe(map((r) => r.data));
  }

  create(cidadaoId: string, doc: DocumentoCreate): Observable<Documento> {
    return this.http
      .post<ApiResponse<Documento>>(this.cidadaoUrl(cidadaoId), doc)
      .pipe(map((r) => r.data));
  }

  update(cidadaoId: string, id: string, doc: DocumentoUpdate): Observable<Documento> {
    return this.http
      .put<ApiResponse<Documento>>(`${this.cidadaoUrl(cidadaoId)}/${id}`, doc)
      .pipe(map((r) => r.data));
  }

  updateEstado(cidadaoId: string, id: string, estado: EstadoDocumento): Observable<Documento> {
    return this.http
      .patch<ApiResponse<Documento>>(`${this.cidadaoUrl(cidadaoId)}/${id}/estado`, { estado })
      .pipe(map((r) => r.data));
  }

  delete(cidadaoId: string, id: string): Observable<void> {
    return this.http.delete<void>(`${this.cidadaoUrl(cidadaoId)}/${id}`);
  }

  uploadFicheiro(cidadaoId: string, id: string, file: File): Observable<DocumentoUpload> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http
      .post<ApiResponse<DocumentoUpload>>(`${this.cidadaoUrl(cidadaoId)}/${id}/ficheiro`, formData)
      .pipe(map((r) => r.data));
  }

  downloadFicheiro(cidadaoId: string, id: string): Observable<Blob> {
    return this.http.get(`${this.cidadaoUrl(cidadaoId)}/${id}/ficheiro`, {
      responseType: 'blob',
    });
  }

  createNewVersion(cidadaoId: string, id: string, file: File): Observable<DocumentoUpload> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http
      .post<ApiResponse<DocumentoUpload>>(`${this.cidadaoUrl(cidadaoId)}/${id}/versoes`, formData)
      .pipe(map((r) => r.data));
  }

  getVersions(cidadaoId: string, id: string): Observable<DocumentoVersion[]> {
    return this.http
      .get<ApiResponse<DocumentoVersion[]>>(`${this.cidadaoUrl(cidadaoId)}/${id}/versoes`)
      .pipe(map((r) => r.data));
  }
}
