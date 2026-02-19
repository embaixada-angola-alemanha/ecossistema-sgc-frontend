import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, from, switchMap, map, forkJoin } from 'rxjs';
import { KeycloakService } from 'keycloak-angular';
import { environment } from '../../../environments/environment';
import { PagedData } from '../models/api-response.model';
import { AuditEvent } from '../models/relatorio.model';
import {
  KeycloakUser,
  KeycloakUserCreate,
  KeycloakUserUpdate,
  KeycloakRole,
  KeycloakSession,
  UserWithRoles,
} from '../models/user-admin.model';

@Injectable({ providedIn: 'root' })
export class UserAdminService {
  private readonly http = inject(HttpClient);
  private readonly keycloak = inject(KeycloakService);
  private readonly keycloakUrl = environment.keycloak.url;
  private readonly realm = environment.keycloak.realm;
  private readonly adminBase = `${this.keycloakUrl}/admin/realms/${this.realm}`;
  private readonly apiBase = environment.apiBaseUrl;

  private authHeaders(): Observable<{ headers: Record<string, string> }> {
    return from(this.keycloak.getToken()).pipe(
      map((token) => ({
        headers: { Authorization: `Bearer ${token}` },
      })),
    );
  }

  // ── User CRUD ──

  getUsers(search?: string, first = 0, max = 20): Observable<KeycloakUser[]> {
    return this.authHeaders().pipe(
      switchMap((opts) => {
        let params = new HttpParams().set('first', first).set('max', max);
        if (search) params = params.set('search', search);
        return this.http.get<KeycloakUser[]>(`${this.adminBase}/users`, { ...opts, params });
      }),
    );
  }

  getUserCount(search?: string): Observable<number> {
    return this.authHeaders().pipe(
      switchMap((opts) => {
        let params = new HttpParams();
        if (search) params = params.set('search', search);
        return this.http.get<number>(`${this.adminBase}/users/count`, { ...opts, params });
      }),
    );
  }

  getUser(userId: string): Observable<KeycloakUser> {
    return this.authHeaders().pipe(
      switchMap((opts) => this.http.get<KeycloakUser>(`${this.adminBase}/users/${userId}`, opts)),
    );
  }

  createUser(user: KeycloakUserCreate): Observable<void> {
    return this.authHeaders().pipe(
      switchMap((opts) => this.http.post<void>(`${this.adminBase}/users`, user, opts)),
    );
  }

  updateUser(userId: string, user: KeycloakUserUpdate): Observable<void> {
    return this.authHeaders().pipe(
      switchMap((opts) => this.http.put<void>(`${this.adminBase}/users/${userId}`, user, opts)),
    );
  }

  deleteUser(userId: string): Observable<void> {
    return this.authHeaders().pipe(
      switchMap((opts) => this.http.delete<void>(`${this.adminBase}/users/${userId}`, opts)),
    );
  }

  // ── User with Roles (composite) ──

  getUserWithRoles(userId: string): Observable<UserWithRoles> {
    return this.authHeaders().pipe(
      switchMap((opts) =>
        forkJoin({
          user: this.http.get<KeycloakUser>(`${this.adminBase}/users/${userId}`, opts),
          roles: this.http.get<KeycloakRole[]>(
            `${this.adminBase}/users/${userId}/role-mappings/realm`,
            opts,
          ),
        }),
      ),
      map(({ user, roles }) => ({
        ...user,
        roles: roles.map((r) => r.name),
      })),
    );
  }

  getUsersWithRoles(search?: string, first = 0, max = 20): Observable<UserWithRoles[]> {
    return this.getUsers(search, first, max).pipe(
      switchMap((users) => {
        if (users.length === 0) return [[] as UserWithRoles[]];
        return this.authHeaders().pipe(
          switchMap((opts) =>
            forkJoin(
              users.map((user) =>
                this.http
                  .get<KeycloakRole[]>(
                    `${this.adminBase}/users/${user.id}/role-mappings/realm`,
                    opts,
                  )
                  .pipe(map((roles) => ({ ...user, roles: roles.map((r) => r.name) }))),
              ),
            ),
          ),
        );
      }),
    );
  }

  // ── Role Management ──

  getRealmRoles(): Observable<KeycloakRole[]> {
    return this.authHeaders().pipe(
      switchMap((opts) => this.http.get<KeycloakRole[]>(`${this.adminBase}/roles`, opts)),
    );
  }

  getUserRoles(userId: string): Observable<KeycloakRole[]> {
    return this.authHeaders().pipe(
      switchMap((opts) =>
        this.http.get<KeycloakRole[]>(
          `${this.adminBase}/users/${userId}/role-mappings/realm`,
          opts,
        ),
      ),
    );
  }

  assignRoles(userId: string, roles: KeycloakRole[]): Observable<void> {
    return this.authHeaders().pipe(
      switchMap((opts) =>
        this.http.post<void>(
          `${this.adminBase}/users/${userId}/role-mappings/realm`,
          roles,
          opts,
        ),
      ),
    );
  }

  removeRoles(userId: string, roles: KeycloakRole[]): Observable<void> {
    return this.authHeaders().pipe(
      switchMap((opts) =>
        this.http.request<void>(
          'DELETE',
          `${this.adminBase}/users/${userId}/role-mappings/realm`,
          { ...opts, body: roles },
        ),
      ),
    );
  }

  // ── Password Management ──

  resetPassword(userId: string, password: string, temporary = true): Observable<void> {
    return this.authHeaders().pipe(
      switchMap((opts) =>
        this.http.put<void>(`${this.adminBase}/users/${userId}/reset-password`, {
          type: 'password',
          value: password,
          temporary,
        }, opts),
      ),
    );
  }

  // ── Session Management ──

  getUserSessions(userId: string): Observable<KeycloakSession[]> {
    return this.authHeaders().pipe(
      switchMap((opts) =>
        this.http.get<KeycloakSession[]>(`${this.adminBase}/users/${userId}/sessions`, opts),
      ),
    );
  }

  terminateSession(sessionId: string): Observable<void> {
    return this.authHeaders().pipe(
      switchMap((opts) =>
        this.http.delete<void>(`${this.adminBase}/sessions/${sessionId}`, opts),
      ),
    );
  }

  terminateAllSessions(userId: string): Observable<void> {
    return this.authHeaders().pipe(
      switchMap((opts) =>
        this.http.post<void>(`${this.adminBase}/users/${userId}/logout`, {}, opts),
      ),
    );
  }

  // ── Activity Log (via backend audit) ──

  getAuditEvents(
    page = 0,
    size = 20,
    username?: string,
  ): Observable<PagedData<AuditEvent>> {
    let params = new HttpParams().set('page', page).set('size', size);
    if (username) params = params.set('username', username);
    return this.http.get<PagedData<AuditEvent>>(`${this.apiBase}/relatorios/audit`, { params });
  }

  // ── Enable/Disable ──

  toggleUserEnabled(userId: string, enabled: boolean): Observable<void> {
    return this.updateUser(userId, { enabled });
  }
}
