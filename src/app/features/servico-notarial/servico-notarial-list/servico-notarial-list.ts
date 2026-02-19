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
import { ServicoNotarialService } from '../../../core/services/servico-notarial.service';
import { AuthService } from '../../../core/services/auth.service';
import {
  ServicoNotarial, EstadoServicoNotarial, TipoServicoNotarial,
  TIPO_SERVICO_NOTARIAL_VALUES, ESTADO_SERVICO_NOTARIAL_VALUES, SERVICO_NOTARIAL_TRANSITIONS,
} from '../../../core/models/servico-notarial.model';
import { LoadingSpinner } from '../../../shared/components/loading-spinner/loading-spinner';
import { StatusBadge } from '../../../shared/components/status-badge/status-badge';
import { ServicoNotarialDetailDialog } from '../servico-notarial-detail/servico-notarial-detail';

@Component({
  selector: 'sgc-servico-notarial-list',
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
  templateUrl: './servico-notarial-list.html',
  styleUrl: './servico-notarial-list.scss',
})
export class ServicoNotarialList implements OnInit {
  private readonly servicoService = inject(ServicoNotarialService);
  private readonly authService = inject(AuthService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly loading = signal(true);
  readonly servicos = signal<ServicoNotarial[]>([]);
  readonly totalElements = signal(0);

  readonly displayedColumns = ['cidadaoNome', 'numeroServico', 'tipo', 'estado', 'valorTaxa', 'createdAt', 'actions'];
  readonly tipoValues = TIPO_SERVICO_NOTARIAL_VALUES;
  readonly estadoValues = ESTADO_SERVICO_NOTARIAL_VALUES;

  page = 0;
  pageSize = 20;
  search = '';
  estadoFilter: EstadoServicoNotarial | '' = '';
  tipoFilter: TipoServicoNotarial | '' = '';

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
    this.router.navigate(['/servicos-notariais/new']);
  }

  openDetail(servico: ServicoNotarial): void {
    const ref = this.dialog.open(ServicoNotarialDetailDialog, {
      width: '750px',
      data: { servicoId: servico.id },
    });
    ref.afterClosed().subscribe((result) => {
      if (result) this.loadData();
    });
  }

  openEdit(servico: ServicoNotarial): void {
    this.router.navigate(['/servicos-notariais', servico.id, 'edit']);
  }

  changeEstado(servico: ServicoNotarial, estado: EstadoServicoNotarial): void {
    this.servicoService.updateEstado(servico.id, estado).subscribe({
      next: () => this.loadData(),
      error: () => this.snackBar.open('Erro ao alterar estado', '', { duration: 3000 }),
    });
  }

  getAllowedTransitions(servico: ServicoNotarial): EstadoServicoNotarial[] {
    return SERVICO_NOTARIAL_TRANSITIONS[servico.estado] ?? [];
  }

  deleteServico(servico: ServicoNotarial): void {
    if (!confirm(`Eliminar serviço ${servico.numeroServico ?? servico.id}?`)) return;
    this.servicoService.delete(servico.id).subscribe({
      next: () => this.loadData(),
      error: () => this.snackBar.open('Erro ao eliminar', '', { duration: 3000 }),
    });
  }

  private loadData(): void {
    this.loading.set(true);
    this.servicoService.getAll(
      this.page,
      this.pageSize,
      undefined,
      this.estadoFilter || undefined,
      this.tipoFilter || undefined,
    ).subscribe({
      next: (data) => {
        this.servicos.set(data.content);
        this.totalElements.set(data.totalElements);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.snackBar.open('Erro ao carregar serviços notariais', '', { duration: 3000 });
      },
    });
  }
}
