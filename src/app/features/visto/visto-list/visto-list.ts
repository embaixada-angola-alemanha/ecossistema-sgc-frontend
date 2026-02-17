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
import { TranslateModule } from '@ngx-translate/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { VistoService } from '../../../core/services/visto.service';
import { AuthService } from '../../../core/services/auth.service';
import { Visto, EstadoVisto, TipoVisto, TIPO_VISTO_VALUES, ESTADO_VISTO_VALUES, ALLOWED_TRANSITIONS } from '../../../core/models/visto.model';
import { LoadingSpinner } from '../../../shared/components/loading-spinner/loading-spinner';
import { StatusBadge } from '../../../shared/components/status-badge/status-badge';
import { VistoDetailDialog } from '../visto-detail/visto-detail';

@Component({
  selector: 'sgc-visto-list',
  standalone: true,
  imports: [
    FormsModule, CurrencyPipe, DatePipe,
    MatCardModule, MatIconModule, MatButtonModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatTableModule, MatPaginatorModule, MatSortModule,
    MatMenuModule,
    TranslateModule,
    LoadingSpinner, StatusBadge,
  ],
  templateUrl: './visto-list.html',
  styleUrl: './visto-list.scss',
})
export class VistoList implements OnInit {
  private readonly vistoService = inject(VistoService);
  private readonly authService = inject(AuthService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly loading = signal(true);
  readonly vistos = signal<Visto[]>([]);
  readonly totalElements = signal(0);

  readonly displayedColumns = ['cidadaoNome', 'numeroVisto', 'tipo', 'estado', 'valorTaxa', 'dataSubmissao', 'actions'];
  readonly tipoValues = TIPO_VISTO_VALUES;
  readonly estadoValues = ESTADO_VISTO_VALUES;

  page = 0;
  pageSize = 20;
  search = '';
  estadoFilter: EstadoVisto | '' = '';
  tipoFilter: TipoVisto | '' = '';

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
    this.router.navigate(['/vistos/new']);
  }

  openDetail(visto: Visto): void {
    const ref = this.dialog.open(VistoDetailDialog, {
      width: '700px',
      data: { vistoId: visto.id },
    });
    ref.afterClosed().subscribe((result) => {
      if (result) this.loadData();
    });
  }

  openEdit(visto: Visto): void {
    this.router.navigate(['/vistos', visto.id, 'edit']);
  }

  changeEstado(visto: Visto, estado: EstadoVisto): void {
    this.vistoService.updateEstado(visto.id, estado).subscribe({
      next: () => this.loadData(),
      error: () => this.snackBar.open('Erro ao alterar estado', '', { duration: 3000 }),
    });
  }

  getAllowedTransitions(visto: Visto): EstadoVisto[] {
    return ALLOWED_TRANSITIONS[visto.estado] ?? [];
  }

  deleteVisto(visto: Visto): void {
    if (!confirm(`Eliminar visto ${visto.numeroVisto ?? visto.id}?`)) return;
    this.vistoService.delete(visto.id).subscribe({
      next: () => this.loadData(),
      error: () => this.snackBar.open('Erro ao eliminar', '', { duration: 3000 }),
    });
  }

  private loadData(): void {
    this.loading.set(true);
    this.vistoService.getAll(
      this.page,
      this.pageSize,
      undefined,
      this.estadoFilter || undefined,
      this.tipoFilter || undefined,
    ).subscribe({
      next: (data) => {
        this.vistos.set(data.content);
        this.totalElements.set(data.totalElements);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.snackBar.open('Erro ao carregar vistos', '', { duration: 3000 });
      },
    });
  }
}
