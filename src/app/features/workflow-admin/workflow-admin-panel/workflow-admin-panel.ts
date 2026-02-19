import { Component, inject, signal, OnInit, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatMenuModule } from '@angular/material/menu';
import { MatTabsModule } from '@angular/material/tabs';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateModule } from '@ngx-translate/core';
import { DatePipe } from '@angular/common';
import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { WorkflowService } from '../../../core/services/workflow.service';
import { AuthService } from '../../../core/services/auth.service';
import {
  WorkflowModule, WorkflowItem, ModulePipeline,
  WORKFLOW_MODULES, ACTIONABLE_STATES, PIPELINE_STATES,
} from '../../../core/models/workflow.model';
import { LoadingSpinner } from '../../../shared/components/loading-spinner/loading-spinner';
import { StatusBadge } from '../../../shared/components/status-badge/status-badge';

@Component({
  selector: 'sgc-workflow-admin-panel',
  standalone: true,
  imports: [
    FormsModule, DatePipe,
    MatCardModule, MatIconModule, MatButtonModule,
    MatFormFieldModule, MatSelectModule,
    MatTableModule, MatPaginatorModule,
    MatCheckboxModule, MatMenuModule, MatTabsModule,
    MatChipsModule, MatProgressBarModule, MatTooltipModule,
    MatDividerModule,
    TranslateModule,
    LoadingSpinner, StatusBadge,
  ],
  templateUrl: './workflow-admin-panel.html',
  styleUrl: './workflow-admin-panel.scss',
})
export class WorkflowAdminPanel implements OnInit {
  private readonly workflowService = inject(WorkflowService);
  private readonly authService = inject(AuthService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);

  readonly loadingPipeline = signal(true);
  readonly loadingQueue = signal(false);
  readonly processingBulk = signal(false);
  readonly pipelines = signal<ModulePipeline[]>([]);
  readonly queueItems = signal<WorkflowItem[]>([]);
  readonly totalQueueItems = signal(0);
  readonly selectedItems = signal<Set<string>>(new Set());
  readonly modules = WORKFLOW_MODULES;

  readonly displayedColumns = ['select', 'numero', 'cidadaoNome', 'tipo', 'estado', 'createdAt', 'actions'];

  selectedModule: WorkflowModule = 'visas';
  selectedEstado = '';
  queuePage = 0;
  queuePageSize = 20;

  private readonly refreshSubject = new Subject<void>();

  readonly canApprove = this.authService.hasAnyRole('ADMIN', 'CONSUL');
  readonly canReject = this.authService.hasAnyRole('ADMIN', 'CONSUL');

  clearSelection(): void {
    this.selectedItems.set(new Set());
  }

  get actionableStates(): string[] {
    return ACTIONABLE_STATES[this.selectedModule] ?? [];
  }

  get pipelineStates(): string[] {
    return PIPELINE_STATES[this.selectedModule] ?? [];
  }

  get currentPipeline(): ModulePipeline | null {
    return this.pipelines().find((p) => p.module === this.selectedModule) ?? null;
  }

  get hasSelection(): boolean {
    return this.selectedItems().size > 0;
  }

  get selectionCount(): number {
    return this.selectedItems().size;
  }

  get commonTransitions(): string[] {
    const items = this.queueItems().filter((i) => this.selectedItems().has(i.id));
    if (items.length === 0) return [];
    let common = [...items[0].allowedTransitions];
    for (const item of items.slice(1)) {
      common = common.filter((t) => item.allowedTransitions.includes(t));
    }
    return common;
  }

  ngOnInit(): void {
    this.refreshSubject.pipe(
      debounceTime(200),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(() => {
      this.loadPipeline();
      this.loadQueue();
    });

    this.loadPipeline();
    this.loadQueue();
  }

  onModuleChange(): void {
    this.selectedEstado = '';
    this.queuePage = 0;
    this.selectedItems.set(new Set());
    this.refreshSubject.next();
  }

  onEstadoFilterChange(): void {
    this.queuePage = 0;
    this.selectedItems.set(new Set());
    this.loadQueue();
  }

  onPageChange(event: PageEvent): void {
    this.queuePage = event.pageIndex;
    this.queuePageSize = event.pageSize;
    this.selectedItems.set(new Set());
    this.loadQueue();
  }

  onPipelineStageClick(estado: string): void {
    this.selectedEstado = estado;
    this.queuePage = 0;
    this.selectedItems.set(new Set());
    this.loadQueue();
  }

  toggleItem(id: string): void {
    const current = new Set(this.selectedItems());
    if (current.has(id)) {
      current.delete(id);
    } else {
      current.add(id);
    }
    this.selectedItems.set(current);
  }

  isSelected(id: string): boolean {
    return this.selectedItems().has(id);
  }

  toggleAll(): void {
    const items = this.queueItems();
    const current = this.selectedItems();
    if (current.size === items.length) {
      this.selectedItems.set(new Set());
    } else {
      this.selectedItems.set(new Set(items.map((i) => i.id)));
    }
  }

  get allSelected(): boolean {
    const items = this.queueItems();
    return items.length > 0 && this.selectedItems().size === items.length;
  }

  get someSelected(): boolean {
    const s = this.selectedItems().size;
    return s > 0 && s < this.queueItems().length;
  }

  changeEstado(item: WorkflowItem, estado: string): void {
    this.workflowService.updateEstado(item.module, item.id, estado).subscribe({
      next: () => {
        this.snackBar.open('Estado alterado', '', { duration: 2000 });
        this.refreshSubject.next();
      },
      error: () => this.snackBar.open('Erro ao alterar estado', '', { duration: 3000 }),
    });
  }

  bulkAction(estado: string): void {
    const ids = Array.from(this.selectedItems());
    if (ids.length === 0) return;

    if (!confirm(`Alterar ${ids.length} item(s) para ${estado}?`)) return;

    this.processingBulk.set(true);
    this.workflowService.bulkUpdateEstado(this.selectedModule, ids, estado).subscribe({
      next: (result) => {
        this.processingBulk.set(false);
        const msg = result.failed.length > 0
          ? `${result.success.length} alterado(s), ${result.failed.length} falha(s)`
          : `${result.success.length} item(s) alterado(s)`;
        this.snackBar.open(msg, '', { duration: 3000 });
        this.selectedItems.set(new Set());
        this.refreshSubject.next();
      },
      error: () => {
        this.processingBulk.set(false);
        this.snackBar.open('Erro na operação em massa', '', { duration: 3000 });
      },
    });
  }

  getStageWidth(count: number, total: number): number {
    if (total === 0) return 0;
    return Math.max((count / total) * 100, 2);
  }

  refreshAll(): void {
    this.refreshSubject.next();
  }

  private loadPipeline(): void {
    this.loadingPipeline.set(true);
    this.workflowService.getPipelineData().subscribe({
      next: ({ pipelines }) => {
        this.pipelines.set(pipelines);
        this.loadingPipeline.set(false);
      },
      error: () => {
        this.loadingPipeline.set(false);
        this.snackBar.open('Erro ao carregar pipeline', '', { duration: 3000 });
      },
    });
  }

  private loadQueue(): void {
    this.loadingQueue.set(true);
    this.workflowService.getQueueItems(
      this.selectedModule,
      this.selectedEstado || undefined,
      this.queuePage,
      this.queuePageSize,
    ).subscribe({
      next: (data) => {
        this.queueItems.set(data.content);
        this.totalQueueItems.set(data.totalElements);
        this.loadingQueue.set(false);
      },
      error: () => {
        this.loadingQueue.set(false);
        this.snackBar.open('Erro ao carregar fila', '', { duration: 3000 });
      },
    });
  }
}
