import { Component, inject, signal, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateModule } from '@ngx-translate/core';
import { UserAdminService } from '../../../core/services/user-admin.service';
import {
  KeycloakUser,
  KeycloakRole,
  ASSIGNABLE_ROLES,
  ROLE_ICONS,
  ROLE_COLORS,
} from '../../../core/models/user-admin.model';
import { LoadingSpinner } from '../../../shared/components/loading-spinner/loading-spinner';
import { forkJoin } from 'rxjs';

interface FormDialogData {
  mode: 'create' | 'edit';
  userId?: string;
}

@Component({
  selector: 'sgc-user-admin-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule, MatFormFieldModule, MatInputModule,
    MatIconModule, MatButtonModule, MatCheckboxModule,
    MatSelectModule, MatSlideToggleModule,
    TranslateModule,
    LoadingSpinner,
  ],
  template: `
    <h2 mat-dialog-title>
      <mat-icon>{{ isCreate ? 'person_add' : 'edit' }}</mat-icon>
      {{ (isCreate ? 'userAdmin.createTitle' : 'userAdmin.editTitle') | translate }}
    </h2>

    <mat-dialog-content>
      @if (loading()) {
        <sgc-loading-spinner />
      } @else {
        <form [formGroup]="form" class="user-form">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>{{ 'userAdmin.username' | translate }}</mat-label>
            <input matInput formControlName="username" [readonly]="!isCreate">
            <mat-icon matPrefix>person</mat-icon>
            @if (form.get('username')?.hasError('required')) {
              <mat-error>{{ 'validation.required' | translate }}</mat-error>
            }
          </mat-form-field>

          <div class="form-row">
            <mat-form-field appearance="outline">
              <mat-label>{{ 'userAdmin.firstName' | translate }}</mat-label>
              <input matInput formControlName="firstName">
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>{{ 'userAdmin.lastName' | translate }}</mat-label>
              <input matInput formControlName="lastName">
            </mat-form-field>
          </div>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>{{ 'userAdmin.email' | translate }}</mat-label>
            <input matInput formControlName="email" type="email">
            <mat-icon matPrefix>email</mat-icon>
            @if (form.get('email')?.hasError('email')) {
              <mat-error>{{ 'validation.email' | translate }}</mat-error>
            }
          </mat-form-field>

          <div class="toggle-row">
            <mat-slide-toggle formControlName="enabled" color="primary">
              {{ 'userAdmin.enabled' | translate }}
            </mat-slide-toggle>

            <mat-slide-toggle formControlName="emailVerified" color="primary">
              {{ 'userAdmin.emailVerified' | translate }}
            </mat-slide-toggle>
          </div>

          @if (isCreate) {
            <h3 class="section-title">{{ 'userAdmin.password' | translate }}</h3>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>{{ 'userAdmin.password' | translate }}</mat-label>
              <input matInput formControlName="password" [type]="showPassword() ? 'text' : 'password'">
              <mat-icon matPrefix>lock</mat-icon>
              <button mat-icon-button matSuffix type="button" (click)="showPassword.set(!showPassword())">
                <mat-icon>{{ showPassword() ? 'visibility_off' : 'visibility' }}</mat-icon>
              </button>
              @if (form.get('password')?.hasError('required')) {
                <mat-error>{{ 'validation.required' | translate }}</mat-error>
              }
              @if (form.get('password')?.hasError('minlength')) {
                <mat-error>{{ 'validation.minLength' | translate: { min: 8 } }}</mat-error>
              }
            </mat-form-field>

            <mat-checkbox formControlName="temporaryPassword">
              {{ 'userAdmin.temporaryPassword' | translate }}
            </mat-checkbox>
          }

          @if (isCreate) {
            <h3 class="section-title">{{ 'userAdmin.roles' | translate }}</h3>
            <div class="roles-select">
              @for (role of assignableRoles; track role) {
                <div class="role-option" (click)="toggleSelectedRole(role)"
                     [class.selected]="selectedRoles().includes(role)">
                  <mat-icon [style.color]="roleColors[role]">{{ roleIcons[role] }}</mat-icon>
                  <span>{{ role }}</span>
                  @if (selectedRoles().includes(role)) {
                    <mat-icon class="check">check</mat-icon>
                  }
                </div>
              }
            </div>
          }
        </form>
      }
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>{{ 'common.cancel' | translate }}</button>
      <button mat-flat-button color="primary" (click)="save()" [disabled]="saving() || form.invalid">
        @if (saving()) {
          <mat-icon class="spin">sync</mat-icon>
        }
        {{ (isCreate ? 'common.create' : 'common.save') | translate }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    h2[mat-dialog-title] {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    mat-dialog-content {
      min-width: 480px;
    }

    .user-form {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .full-width {
      width: 100%;
    }

    .form-row {
      display: flex;
      gap: 12px;

      mat-form-field {
        flex: 1;
      }
    }

    .toggle-row {
      display: flex;
      gap: 24px;
      margin: 8px 0 16px;
    }

    .section-title {
      font-size: 14px;
      font-weight: 600;
      margin: 8px 0 4px;
      color: var(--gold, #c9a84c);
    }

    .roles-select {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin: 8px 0;
    }

    .role-option {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 6px 12px;
      border: 1px solid rgba(201, 168, 76, 0.15);
      border-radius: 8px;
      cursor: pointer;
      font-size: 13px;
      font-weight: 500;
      transition: all 0.2s;

      &:hover {
        border-color: rgba(201, 168, 76, 0.3);
      }

      &.selected {
        border-color: var(--gold, #c9a84c);
        background: rgba(201, 168, 76, 0.08);
      }

      .check {
        color: #4caf50;
        font-size: 18px;
        width: 18px;
        height: 18px;
      }
    }

    .spin {
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      100% { transform: rotate(360deg); }
    }
  `],
})
export class UserAdminFormDialog implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly userService = inject(UserAdminService);
  private readonly dialogRef = inject(MatDialogRef<UserAdminFormDialog>);
  private readonly data = inject<FormDialogData>(MAT_DIALOG_DATA);
  private readonly snackBar = inject(MatSnackBar);

  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly showPassword = signal(false);
  readonly selectedRoles = signal<string[]>([]);
  readonly allKeycloakRoles = signal<KeycloakRole[]>([]);

  readonly isCreate = this.data.mode === 'create';
  readonly assignableRoles = ASSIGNABLE_ROLES;
  readonly roleIcons = ROLE_ICONS;
  readonly roleColors = ROLE_COLORS;

  form: FormGroup = this.fb.group({
    username: ['', Validators.required],
    firstName: [''],
    lastName: [''],
    email: ['', Validators.email],
    enabled: [true],
    emailVerified: [false],
    password: [''],
    temporaryPassword: [true],
  });

  ngOnInit(): void {
    if (this.isCreate) {
      this.form.get('password')?.setValidators([Validators.required, Validators.minLength(8)]);
      this.form.get('password')?.updateValueAndValidity();
    }

    if (!this.isCreate && this.data.userId) {
      this.loading.set(true);
      forkJoin({
        user: this.userService.getUser(this.data.userId),
        roles: this.userService.getRealmRoles(),
      }).subscribe({
        next: ({ user, roles }) => {
          this.allKeycloakRoles.set(roles);
          this.form.patchValue({
            username: user.username,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            enabled: user.enabled,
            emailVerified: user.emailVerified,
          });
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
          this.snackBar.open('Erro ao carregar utilizador', '', { duration: 3000 });
        },
      });
    } else {
      this.userService.getRealmRoles().subscribe({
        next: (roles) => this.allKeycloakRoles.set(roles),
      });
    }
  }

  toggleSelectedRole(role: string): void {
    const current = this.selectedRoles();
    if (current.includes(role)) {
      this.selectedRoles.set(current.filter((r) => r !== role));
    } else {
      this.selectedRoles.set([...current, role]);
    }
  }

  save(): void {
    if (this.form.invalid) return;
    this.saving.set(true);

    if (this.isCreate) {
      this.createUser();
    } else {
      this.updateUser();
    }
  }

  private createUser(): void {
    const val = this.form.value;
    this.userService.createUser({
      username: val.username,
      firstName: val.firstName || undefined,
      lastName: val.lastName || undefined,
      email: val.email || undefined,
      emailVerified: val.emailVerified,
      enabled: val.enabled,
      credentials: [{
        type: 'password',
        value: val.password,
        temporary: val.temporaryPassword,
      }],
    }).subscribe({
      next: () => {
        if (this.selectedRoles().length > 0) {
          this.assignSelectedRoles();
        } else {
          this.saving.set(false);
          this.dialogRef.close(true);
          this.snackBar.open('Utilizador criado com sucesso', '', { duration: 3000 });
        }
      },
      error: () => {
        this.saving.set(false);
        this.snackBar.open('Erro ao criar utilizador', '', { duration: 3000 });
      },
    });
  }

  private assignSelectedRoles(): void {
    // After user creation, we need to find the new user to assign roles
    this.userService.getUsers(this.form.value.username, 0, 1).subscribe({
      next: (users) => {
        if (users.length === 0) {
          this.saving.set(false);
          this.dialogRef.close(true);
          return;
        }
        const userId = users[0].id;
        const rolesToAssign = this.allKeycloakRoles()
          .filter((r) => this.selectedRoles().includes(r.name));

        if (rolesToAssign.length === 0) {
          this.saving.set(false);
          this.dialogRef.close(true);
          return;
        }

        this.userService.assignRoles(userId, rolesToAssign).subscribe({
          next: () => {
            this.saving.set(false);
            this.dialogRef.close(true);
            this.snackBar.open('Utilizador criado com sucesso', '', { duration: 3000 });
          },
          error: () => {
            this.saving.set(false);
            this.dialogRef.close(true);
            this.snackBar.open('Utilizador criado, mas erro ao atribuir roles', '', { duration: 4000 });
          },
        });
      },
    });
  }

  private updateUser(): void {
    const val = this.form.value;
    this.userService.updateUser(this.data.userId!, {
      firstName: val.firstName || undefined,
      lastName: val.lastName || undefined,
      email: val.email || undefined,
      emailVerified: val.emailVerified,
      enabled: val.enabled,
    }).subscribe({
      next: () => {
        this.saving.set(false);
        this.dialogRef.close(true);
        this.snackBar.open('Utilizador actualizado', '', { duration: 3000 });
      },
      error: () => {
        this.saving.set(false);
        this.snackBar.open('Erro ao actualizar', '', { duration: 3000 });
      },
    });
  }
}
