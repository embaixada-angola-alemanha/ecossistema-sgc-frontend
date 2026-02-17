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
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateModule } from '@ngx-translate/core';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { CidadaoService } from '../../../core/services/cidadao.service';
import { AuthService } from '../../../core/services/auth.service';
import { Cidadao, EstadoCidadao, Sexo } from '../../../core/models/cidadao.model';
import { LoadingSpinner } from '../../../shared/components/loading-spinner/loading-spinner';
import { StatusBadge } from '../../../shared/components/status-badge/status-badge';
import { CidadaoFormDialog } from '../cidadao-form/cidadao-form';
import { CidadaoDetailDialog } from '../cidadao-detail/cidadao-detail';

@Component({
  selector: 'sgc-cidadao-list',
  standalone: true,
  imports: [
    FormsModule,
    MatCardModule, MatIconModule, MatButtonModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatTableModule, MatPaginatorModule, MatSortModule,
    MatMenuModule,
    TranslateModule,
    LoadingSpinner, StatusBadge,
  ],
  templateUrl: './cidadao-list.html',
  styleUrl: './cidadao-list.scss',
})
export class CidadaoList implements OnInit {
  private readonly cidadaoService = inject(CidadaoService);
  private readonly authService = inject(AuthService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);

  readonly loading = signal(true);
  readonly cidadaos = signal<Cidadao[]>([]);
  readonly totalElements = signal(0);

  readonly displayedColumns = ['nomeCompleto', 'numeroPassaporte', 'nacionalidade', 'sexo', 'estado', 'actions'];

  page = 0;
  pageSize = 20;
  search = '';
  estadoFilter: EstadoCidadao | '' = '';
  sexoFilter: Sexo | '' = '';

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

  onSort(sort: Sort): void {
    this.loadData();
  }

  openCreate(): void {
    const ref = this.dialog.open(CidadaoFormDialog, {
      width: '640px',
      data: {},
    });
    ref.afterClosed().subscribe((result) => {
      if (result) this.loadData();
    });
  }

  openDetail(cidadao: Cidadao): void {
    const ref = this.dialog.open(CidadaoDetailDialog, {
      width: '600px',
      data: { cidadaoId: cidadao.id },
    });
    ref.afterClosed().subscribe((result) => {
      if (result) this.loadData();
    });
  }

  openEdit(cidadao: Cidadao): void {
    const ref = this.dialog.open(CidadaoFormDialog, {
      width: '640px',
      data: { cidadao },
    });
    ref.afterClosed().subscribe((result) => {
      if (result) this.loadData();
    });
  }

  changeEstado(cidadao: Cidadao, estado: EstadoCidadao): void {
    this.cidadaoService.updateEstado(cidadao.id, estado).subscribe({
      next: () => this.loadData(),
      error: () => this.snackBar.open('Erro ao alterar estado', '', { duration: 3000 }),
    });
  }

  deleteCidadao(cidadao: Cidadao): void {
    if (!confirm(`Eliminar ${cidadao.nomeCompleto}?`)) return;
    this.cidadaoService.delete(cidadao.id).subscribe({
      next: () => this.loadData(),
      error: () => this.snackBar.open('Erro ao eliminar', '', { duration: 3000 }),
    });
  }

  private loadData(): void {
    this.loading.set(true);
    this.cidadaoService.getAll(
      this.page,
      this.pageSize,
      this.search || undefined,
      this.estadoFilter || undefined,
      this.sexoFilter || undefined,
    ).subscribe({
      next: (data) => {
        this.cidadaos.set(data.content);
        this.totalElements.set(data.totalElements);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.snackBar.open('Erro ao carregar cidadaos', '', { duration: 3000 });
      },
    });
  }
}
