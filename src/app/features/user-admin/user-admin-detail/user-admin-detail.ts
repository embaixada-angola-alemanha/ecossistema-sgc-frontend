import { Component, inject, signal, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatTabsModule } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatListModule } from '@angular/material/list';
import { MatTableModule } from '@angular/material/table';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';
import { forkJoin } from 'rxjs';
import { UserAdminService } from '../../../core/services/user-admin.service';
import { AuthService } from '../../../core/services/auth.service';
import {
  UserWithRoles,
  KeycloakRole,
  KeycloakSession,
  ASSIGNABLE_ROLES,
  ROLE_ICONS,
  ROLE_COLORS,
  ROLE_DESCRIPTIONS,
} from '../../../core/models/user-admin.model';
import { AuditEvent } from '../../../core/models/relatorio.model';
import { LoadingSpinner } from '../../../shared/components/loading-spinner/loading-spinner';

@Component({
  selector: 'sgc-user-admin-detail',
  standalone: true,
  imports: [
    DatePipe,
    MatDialogModule, MatTabsModule, MatIconModule,
    MatButtonModule, MatChipsModule, MatListModule,
    MatTableModule, MatTooltipModule,
    TranslateModule,
    LoadingSpinner,
  ],
  template: `
    <h2 mat-dialog-title>
      <div class="dialog-title-row">
        <div class="user-avatar" [style.background-color]="avatarColor()">
          {{ userInitials() }}
        </div>
        <div class="title-info">
          <span class="username">{{ user()?.username ?? '...' }}</span>
          <span class="user-fullname">{{ (user()?.firstName ?? '') + ' ' + (user()?.lastName ?? '') }}</span>
        </div>
        <span class="status-indicator" [class.active]="user()?.enabled" [class.inactive]="!user()?.enabled">
          {{ user()?.enabled ? ('userAdmin.active' | translate) : ('userAdmin.inactive' | translate) }}
        </span>
      </div>
    </h2>

    <mat-dialog-content>
      @if (loading()) {
        <sgc-loading-spinner />
      } @else {
        <mat-tab-group>
          <!-- Info Tab -->
          <mat-tab>
            <ng-template mat-tab-label>
              <mat-icon>person</mat-icon>
              {{ 'userAdmin.info' | translate }}
            </ng-template>
            <div class="tab-content">
              <div class="info-grid">
                <div class="info-item">
                  <span class="info-label">{{ 'userAdmin.username' | translate }}</span>
                  <span class="info-value">{{ user()?.username }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">{{ 'userAdmin.email' | translate }}</span>
                  <span class="info-value">
                    {{ user()?.email ?? '—' }}
                    @if (user()?.emailVerified) {
                      <mat-icon class="verified" inline>verified</mat-icon>
                    }
                  </span>
                </div>
                <div class="info-item">
                  <span class="info-label">{{ 'userAdmin.firstName' | translate }}</span>
                  <span class="info-value">{{ user()?.firstName ?? '—' }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">{{ 'userAdmin.lastName' | translate }}</span>
                  <span class="info-value">{{ user()?.lastName ?? '—' }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">{{ 'userAdmin.created' | translate }}</span>
                  <span class="info-value">{{ user()?.createdTimestamp | date:'dd/MM/yyyy HH:mm' }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">{{ 'userAdmin.status' | translate }}</span>
                  <span class="info-value">
                    {{ user()?.enabled ? ('userAdmin.active' | translate) : ('userAdmin.inactive' | translate) }}
                  </span>
                </div>
              </div>
            </div>
          </mat-tab>

          <!-- Roles Tab -->
          <mat-tab>
            <ng-template mat-tab-label>
              <mat-icon>security</mat-icon>
              {{ 'userAdmin.roles' | translate }}
            </ng-template>
            <div class="tab-content">
              <div class="roles-grid">
                @for (role of assignableRoles; track role) {
                  <div class="role-card" [class.assigned]="hasRole(role)" (click)="toggleRole(role)">
                    <div class="role-header">
                      <mat-icon [style.color]="roleColors[role]">{{ roleIcons[role] }}</mat-icon>
                      <span class="role-name">{{ role }}</span>
                      @if (hasRole(role)) {
                        <mat-icon class="check-icon">check_circle</mat-icon>
                      }
                    </div>
                    <p class="role-desc">{{ roleDescriptions[role] | translate }}</p>
                  </div>
                }
              </div>
            </div>
          </mat-tab>

          <!-- Activity Tab -->
          <mat-tab>
            <ng-template mat-tab-label>
              <mat-icon>history</mat-icon>
              {{ 'userAdmin.activity' | translate }}
            </ng-template>
            <div class="tab-content">
              @if (auditEvents().length === 0) {
                <div class="no-data-tab">
                  <mat-icon>event_busy</mat-icon>
                  <span>{{ 'userAdmin.noActivity' | translate }}</span>
                </div>
              } @else {
                <div class="activity-timeline">
                  @for (event of auditEvents(); track event.id) {
                    <div class="activity-item">
                      <div class="activity-dot"></div>
                      <div class="activity-content">
                        <span class="activity-action">{{ event.acao }}</span>
                        <span class="activity-detail">{{ event.modulo }} — {{ event.entidade }}</span>
                        <span class="activity-time">{{ event.dataHora | date:'dd/MM/yyyy HH:mm' }}</span>
                      </div>
                    </div>
                  }
                </div>
              }
            </div>
          </mat-tab>

          <!-- Sessions Tab -->
          <mat-tab>
            <ng-template mat-tab-label>
              <mat-icon>devices</mat-icon>
              {{ 'userAdmin.sessions' | translate }}
            </ng-template>
            <div class="tab-content">
              <div class="sessions-header">
                <span class="session-count">{{ sessions().length }} {{ 'userAdmin.activeSessions' | translate }}</span>
                @if (sessions().length > 0 && canManage) {
                  <button mat-stroked-button color="warn" (click)="terminateAll()">
                    <mat-icon>logout</mat-icon>
                    {{ 'userAdmin.terminateAll' | translate }}
                  </button>
                }
              </div>
              @if (sessions().length === 0) {
                <div class="no-data-tab">
                  <mat-icon>devices_off</mat-icon>
                  <span>{{ 'userAdmin.noSessions' | translate }}</span>
                </div>
              } @else {
                <table mat-table [dataSource]="sessions()">
                  <ng-container matColumnDef="ipAddress">
                    <th mat-header-cell *matHeaderCellDef>IP</th>
                    <td mat-cell *matCellDef="let s">{{ s.ipAddress }}</td>
                  </ng-container>
                  <ng-container matColumnDef="start">
                    <th mat-header-cell *matHeaderCellDef>{{ 'userAdmin.sessionStart' | translate }}</th>
                    <td mat-cell *matCellDef="let s">{{ s.start | date:'dd/MM/yyyy HH:mm' }}</td>
                  </ng-container>
                  <ng-container matColumnDef="lastAccess">
                    <th mat-header-cell *matHeaderCellDef>{{ 'userAdmin.lastAccess' | translate }}</th>
                    <td mat-cell *matCellDef="let s">{{ s.lastAccess | date:'dd/MM/yyyy HH:mm' }}</td>
                  </ng-container>
                  <ng-container matColumnDef="actions">
                    <th mat-header-cell *matHeaderCellDef></th>
                    <td mat-cell *matCellDef="let s">
                      @if (canManage) {
                        <button mat-icon-button color="warn" (click)="terminateSession(s.id)"
                                [matTooltip]="'userAdmin.terminateSession' | translate">
                          <mat-icon>close</mat-icon>
                        </button>
                      }
                    </td>
                  </ng-container>
                  <tr mat-header-row *matHeaderRowDef="sessionColumns"></tr>
                  <tr mat-row *matRowDef="let row; columns: sessionColumns"></tr>
                </table>
              }
            </div>
          </mat-tab>
        </mat-tab-group>
      }
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>{{ 'common.close' | translate }}</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .dialog-title-row {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .user-avatar {
      width: 42px;
      height: 42px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 16px;
      color: #fff;
    }

    .title-info {
      display: flex;
      flex-direction: column;
    }

    .username {
      font-size: 18px;
      font-weight: 600;
      color: var(--gold, #c9a84c);
    }

    .user-fullname {
      font-size: 13px;
      opacity: 0.6;
    }

    .status-indicator {
      margin-left: auto;
      padding: 3px 10px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 500;

      &.active {
        background: rgba(76, 175, 80, 0.15);
        color: #4caf50;
      }

      &.inactive {
        background: rgba(244, 67, 54, 0.15);
        color: #f44336;
      }
    }

    mat-dialog-content {
      min-height: 400px;
    }

    .tab-content {
      padding: 16px 0;
    }

    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }

    .info-item {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .info-label {
      font-size: 12px;
      opacity: 0.5;
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }

    .info-value {
      font-size: 14px;
      font-weight: 500;
    }

    .verified {
      color: #4caf50;
      font-size: 16px;
      margin-left: 4px;
    }

    .roles-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }

    .role-card {
      border: 1px solid rgba(201, 168, 76, 0.12);
      border-radius: 8px;
      padding: 12px;
      cursor: pointer;
      transition: all 0.2s;

      &:hover {
        border-color: rgba(201, 168, 76, 0.3);
      }

      &.assigned {
        border-color: var(--gold, #c9a84c);
        background: rgba(201, 168, 76, 0.06);
      }
    }

    .role-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 4px;
    }

    .role-name {
      font-weight: 600;
      font-size: 14px;
    }

    .check-icon {
      margin-left: auto;
      color: #4caf50;
    }

    .role-desc {
      font-size: 12px;
      opacity: 0.6;
      margin: 0;
    }

    .activity-timeline {
      display: flex;
      flex-direction: column;
      gap: 0;
    }

    .activity-item {
      display: flex;
      gap: 12px;
      padding: 10px 0;
      border-left: 2px solid rgba(201, 168, 76, 0.15);
      padding-left: 16px;
      position: relative;
    }

    .activity-dot {
      position: absolute;
      left: -5px;
      top: 14px;
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--gold, #c9a84c);
    }

    .activity-content {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .activity-action {
      font-weight: 600;
      font-size: 13px;
    }

    .activity-detail {
      font-size: 12px;
      opacity: 0.6;
    }

    .activity-time {
      font-size: 11px;
      opacity: 0.4;
    }

    .sessions-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }

    .session-count {
      font-weight: 500;
      font-size: 14px;
    }

    .no-data-tab {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      padding: 32px;
      color: var(--text-dim, rgba(224, 232, 240, 0.65));

      mat-icon {
        font-size: 40px;
        width: 40px;
        height: 40px;
      }
    }

    table {
      width: 100%;
    }
  `],
})
export class UserAdminDetailDialog implements OnInit {
  private readonly userService = inject(UserAdminService);
  private readonly authService = inject(AuthService);
  private readonly dialogRef = inject(MatDialogRef<UserAdminDetailDialog>);
  private readonly data = inject<{ userId: string }>(MAT_DIALOG_DATA);
  private readonly snackBar = inject(MatSnackBar);

  readonly loading = signal(true);
  readonly user = signal<UserWithRoles | null>(null);
  readonly allRoles = signal<KeycloakRole[]>([]);
  readonly sessions = signal<KeycloakSession[]>([]);
  readonly auditEvents = signal<AuditEvent[]>([]);
  readonly changed = signal(false);

  readonly assignableRoles = ASSIGNABLE_ROLES;
  readonly roleIcons = ROLE_ICONS;
  readonly roleColors = ROLE_COLORS;
  readonly roleDescriptions = ROLE_DESCRIPTIONS;
  readonly sessionColumns = ['ipAddress', 'start', 'lastAccess', 'actions'];

  readonly canManage = this.authService.hasAnyRole('ADMIN', 'CONSUL');

  readonly userInitials = signal('U');
  readonly avatarColor = signal('#c9a84c');

  ngOnInit(): void {
    this.loadUser();
  }

  hasRole(roleName: string): boolean {
    return this.user()?.roles.includes(roleName) ?? false;
  }

  toggleRole(roleName: string): void {
    if (!this.canManage) return;
    const u = this.user();
    if (!u) return;

    const allRoles = this.allRoles();
    const keycloakRole = allRoles.find((r) => r.name === roleName);
    if (!keycloakRole) return;

    const action = this.hasRole(roleName)
      ? this.userService.removeRoles(u.id, [keycloakRole])
      : this.userService.assignRoles(u.id, [keycloakRole]);

    action.subscribe({
      next: () => {
        this.changed.set(true);
        this.loadUser();
        this.snackBar.open(
          this.hasRole(roleName) ? `Role ${roleName} removida` : `Role ${roleName} atribuída`,
          '', { duration: 2000 },
        );
      },
      error: () => this.snackBar.open('Erro ao alterar roles', '', { duration: 3000 }),
    });
  }

  terminateSession(sessionId: string): void {
    this.userService.terminateSession(sessionId).subscribe({
      next: () => {
        this.loadSessions();
        this.snackBar.open('Sessão terminada', '', { duration: 2000 });
      },
      error: () => this.snackBar.open('Erro ao terminar sessão', '', { duration: 3000 }),
    });
  }

  terminateAll(): void {
    const u = this.user();
    if (!u) return;
    this.userService.terminateAllSessions(u.id).subscribe({
      next: () => {
        this.sessions.set([]);
        this.snackBar.open('Todas as sessões terminadas', '', { duration: 2000 });
      },
      error: () => this.snackBar.open('Erro ao terminar sessões', '', { duration: 3000 }),
    });
  }

  private loadUser(): void {
    this.loading.set(true);
    forkJoin({
      user: this.userService.getUserWithRoles(this.data.userId),
      roles: this.userService.getRealmRoles(),
    }).subscribe({
      next: ({ user, roles }) => {
        this.user.set(user);
        this.allRoles.set(roles);
        this.computeAvatar(user);
        this.loading.set(false);
        this.loadSessions();
        this.loadAudit();
      },
      error: () => {
        this.loading.set(false);
        this.snackBar.open('Erro ao carregar utilizador', '', { duration: 3000 });
      },
    });
  }

  private loadSessions(): void {
    this.userService.getUserSessions(this.data.userId).subscribe({
      next: (sessions) => this.sessions.set(sessions),
    });
  }

  private loadAudit(): void {
    const username = this.user()?.username;
    if (!username) return;
    this.userService.getAuditEvents(0, 50, username).subscribe({
      next: (data) => this.auditEvents.set(data.content),
    });
  }

  private computeAvatar(user: UserWithRoles): void {
    const name = `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || user.username;
    const parts = name.split(/[\s.]+/).filter(Boolean);
    this.userInitials.set(
      parts.length >= 2
        ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
        : name.substring(0, 2).toUpperCase(),
    );
    const colors = ['#f44336', '#e91e63', '#9c27b0', '#2196f3', '#009688', '#4caf50', '#ff9800'];
    const hash = name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    this.avatarColor.set(colors[hash % colors.length]);
  }
}
