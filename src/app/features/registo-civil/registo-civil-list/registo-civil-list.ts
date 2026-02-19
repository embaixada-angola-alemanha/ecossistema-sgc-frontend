import { Component, inject, signal, OnInit, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { DatePipe } from '@angular/common';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { RegistoCivilService } from '../../../core/services/registo-civil.service';
import { AuthService } from '../../../core/services/auth.service';
import {
  RegistoCivil, EstadoRegistoCivil, TipoRegistoCivil,
  TIPO_REGISTO_CIVIL_VALUES, ESTADO_REGISTO_CIVIL_VALUES, REGISTO_CIVIL_TRANSITIONS,
} from '../../../core/models/registo-civil.model';
import { LoadingSpinner } from '../../../shared/components/loading-spinner/loading-spinner';
import { StatusBadge } from '../../../shared/components/status-badge/status-badge';
import { RegistoCivilDetailDialog } from '../registo-civil-detail/registo-civil-detail';
import { ConfirmDialog, ConfirmDialogData } from '../../../shared/components/confirm-dialog/confirm-dialog';

@Component({
  selector: 'sgc-registo-civil-list',
  standalone: true,
  imports: [
    FormsModule, DatePipe,
    MatCardModule, MatIconModule, MatButtonModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatTableModule, MatPaginatorModule, MatSortModule,
    MatMenuModule,
    TranslateModule,
    LoadingSpinner, StatusBadge,
  ],
  templateUrl: './registo-civil-list.html',
  styleUrl: './registo-civil-list.scss',
})
export class RegistoCivilList implements OnInit {
  private readonly registoService = inject(RegistoCivilService);
  private readonly authService = inject(AuthService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly translate = inject(TranslateService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly loading = signal(true);
  readonly registos = signal<RegistoCivil[]>([]);
  readonly totalElements = signal(0);

  readonly displayedColumns = ['cidadaoNome', 'numeroRegisto', 'tipo', 'estado', 'dataEvento', 'createdAt', 'actions'];
  readonly tipoValues = TIPO_REGISTO_CIVIL_VALUES;
  readonly estadoValues = ESTADO_REGISTO_CIVIL_VALUES;

  page = 0;
  pageSize = 20;
  search = '';
  estadoFilter: EstadoRegistoCivil | '' = '';
  tipoFilter: TipoRegistoCivil | '' = '';

  private readonly searchSubject = new Subject<string>();

  readonly canCreate = this.authService.hasAnyRole('ADMIN', 'CONSUL', 'OFFICER');
  readonly canEdit = this.authService.hasAnyRole('ADMIN', 'CONSUL', 'OFFICER');
  readonly canChangeStatus = this.authService.hasAnyRole('ADMIN', 'CONSUL');
  readonly canDelete = this.authService.isAdmin();

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

  onSort(_sort: Sort): void {
    this.loadData();
  }

  openCreate(): void {
    this.router.navigate(['/registos-civis/new']);
  }

  openDetail(registo: RegistoCivil): void {
    const ref = this.dialog.open(RegistoCivilDetailDialog, {
      width: '750px',
      data: { registoId: registo.id },
    });
    ref.afterClosed().subscribe((result) => {
      if (result) this.loadData();
    });
  }

  openEdit(registo: RegistoCivil): void {
    this.router.navigate(['/registos-civis', registo.id, 'edit']);
  }

  changeEstado(registo: RegistoCivil, estado: EstadoRegistoCivil): void {
    this.registoService.updateEstado(registo.id, estado).subscribe({
      next: () => this.loadData(),
      error: () => this.snackBar.open('Erro ao alterar estado', '', { duration: 3000 }),
    });
  }

  getAllowedTransitions(registo: RegistoCivil): EstadoRegistoCivil[] {
    return REGISTO_CIVIL_TRANSITIONS[registo.estado] ?? [];
  }

  deleteRegisto(registo: RegistoCivil): void {
    const dialogRef = this.dialog.open(ConfirmDialog, {
      width: 'min(400px, 90vw)',
      data: {
        title: this.translate.instant('common.confirm.title'),
        message: this.translate.instant('common.confirm.delete', { name: registo.numeroRegisto ?? registo.id }),
        warn: true,
      } as ConfirmDialogData,
    });
    dialogRef.afterClosed().subscribe(confirmed => {
      if (!confirmed) return;
      this.registoService.delete(registo.id).subscribe({
        next: () => this.loadData(),
        error: () => this.snackBar.open('Erro ao eliminar', '', { duration: 3000 }),
      });
    });
  }

  private loadData(): void {
    this.loading.set(true);
    this.registoService.getAll(
      this.page,
      this.pageSize,
      undefined,
      this.estadoFilter || undefined,
      this.tipoFilter || undefined,
    ).subscribe({
      next: (data) => {
        this.registos.set(data.content);
        this.totalElements.set(data.totalElements);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.snackBar.open('Erro ao carregar registos civis', '', { duration: 3000 });
      },
    });
  }
}
