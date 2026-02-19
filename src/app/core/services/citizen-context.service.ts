import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { Cidadao } from '../models/cidadao.model';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class CitizenContextService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly baseUrl = `${environment.apiBaseUrl}/cidadaos`;

  readonly cidadaoId = signal<string | null>(null);
  readonly cidadaoProfile = signal<Cidadao | null>(null);
  readonly loaded = signal(false);
  readonly notLinked = signal(false);

  init(): void {
    if (!this.authService.isCitizenOnly()) {
      this.loaded.set(true);
      return;
    }

    this.http
      .get<ApiResponse<Cidadao>>(`${this.baseUrl}/me`)
      .subscribe({
        next: (response) => {
          this.cidadaoId.set(response.data.id);
          this.cidadaoProfile.set(response.data);
          this.loaded.set(true);
        },
        error: () => {
          this.notLinked.set(true);
          this.loaded.set(true);
        },
      });
  }
}
