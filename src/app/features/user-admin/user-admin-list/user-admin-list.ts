import { Component, inject, signal, OnInit, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatMenuModule } from '@angular/material/menu';
import { MatChipsModule } from '@angular/material/chips';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { DatePipe } from '@angular/common';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { UserAdminService } from '../../../core/services/user-admin.service';
import { AuthService } from '../../../core/services/auth.service';
import {
  UserWithRoles,
  ASSIGNABLE_ROLES,
  ROLE_ICONS,
  ROLE_COLORS,
} from '../../../core/models/user-admin.model';
import { LoadingSpinner } from '../../../shared/components/loading-spinner/loading-spinner';
import { UserAdminDetailDialog } from '../user-admin-detail/user-admin-detail';
import { UserAdminFormDialog } from '../user-admin-form/user-admin-form';
import { ConfirmDialog, ConfirmDialogData } from '../../../shared/components/confirm-dialog/confirm-dialog';

@Component({
  selector: 'sgc-user-admin-list',
  standalone: true,
  imports: [
    FormsModule, DatePipe,
    MatCardModule, MatIconModule, MatButtonModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatTableModule, MatPaginatorModule,
    MatMenuModule, MatChipsModule, MatSlideToggleModule,
    TranslateModule,
    LoadingSpinner,
  ],
  templateUrl: './user-admin-list.html',
  styleUrl: './user-admin-list.scss',
})
export class UserAdminList implements OnInit {
  private readonly userService = inject(UserAdminService);
  private readonly authService = inject(AuthService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly translate = inject(TranslateService);
  private readonly destroyRef = inject(DestroyRef);

  readonly loading = signal(true);
  readonly users = signal<UserWithRoles[]>([]);
  readonly totalElements = signal(0);

  readonly displayedColumns = ['username', 'name', 'email', 'roles', 'enabled', 'created', 'actions'];
  readonly assignableRoles = ASSIGNABLE_ROLES;
  readonly roleIcons = ROLE_ICONS;
  readonly roleColors = ROLE_COLORS;

  page = 0;
  pageSize = 20;
  search = '';
  roleFilter = '';

  private readonly searchSubject = new Subject<string>();

  readonly isAdmin = this.authService.isAdmin();
  readonly canManage = this.authService.hasAnyRole('ADMIN', 'CONSUL');

  ngOnInit(): void {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(() => {
      this.page = 0;
      this.loadData();
    });

    this.loadData();
  }

  onSearchInput(value: string): void {
    this.search = value;
    this.searchSubject.next(value);
  }

  onFilterChange(): void {
    this.page = 0;
    this.loadData();
  }

  onPageChange(event: PageEvent): void {
    this.page = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadData();
  }

  openCreate(): void {
    const ref = this.dialog.open(UserAdminFormDialog, {
      width: '600px',
      data: { mode: 'create' },
    });
    ref.afterClosed().subscribe((result) => {
      if (result) this.loadData();
    });
  }

  openDetail(user: UserWithRoles): void {
    const ref = this.dialog.open(UserAdminDetailDialog, {
      width: '800px',
      data: { userId: user.id },
    });
    ref.afterClosed().subscribe((result) => {
      if (result) this.loadData();
    });
  }

  openEdit(user: UserWithRoles): void {
    const ref = this.dialog.open(UserAdminFormDialog, {
      width: '600px',
      data: { mode: 'edit', userId: user.id },
    });
    ref.afterClosed().subscribe((result) => {
      if (result) this.loadData();
    });
  }

  toggleEnabled(user: UserWithRoles): void {
    this.userService.toggleUserEnabled(user.id, !user.enabled).subscribe({
      next: () => {
        this.loadData();
        this.snackBar.open(
          user.enabled ? 'Utilizador desactivado' : 'Utilizador activado',
          '', { duration: 3000 },
        );
      },
      error: () => this.snackBar.open('Erro ao alterar estado', '', { duration: 3000 }),
    });
  }

  deleteUser(user: UserWithRoles): void {
    const dialogRef = this.dialog.open(ConfirmDialog, {
      width: 'min(400px, 90vw)',
      data: {
        title: this.translate.instant('common.confirm.title'),
        message: this.translate.instant('common.confirm.delete', { name: user.username }),
        warn: true,
      } as ConfirmDialogData,
    });
    dialogRef.afterClosed().subscribe(confirmed => {
      if (!confirmed) return;
      this.userService.deleteUser(user.id).subscribe({
        next: () => {
          this.loadData();
          this.snackBar.open('Utilizador eliminado', '', { duration: 3000 });
        },
        error: () => this.snackBar.open('Erro ao eliminar', '', { duration: 3000 }),
      });
    });
  }

  getRoleColor(role: string): string {
    return this.roleColors[role] ?? '#9e9e9e';
  }

  getRoleIcon(role: string): string {
    return this.roleIcons[role] ?? 'person';
  }

  private loadData(): void {
    this.loading.set(true);
    this.userService.getUsersWithRoles(
      this.search || undefined,
      this.page * this.pageSize,
      this.pageSize,
    ).subscribe({
      next: (users) => {
        const filtered = this.roleFilter
          ? users.filter((u) => u.roles.includes(this.roleFilter))
          : users;
        this.users.set(filtered);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.snackBar.open('Erro ao carregar utilizadores', '', { duration: 3000 });
      },
    });

    this.userService.getUserCount(this.search || undefined).subscribe({
      next: (count) => this.totalElements.set(count),
    });
  }
}
