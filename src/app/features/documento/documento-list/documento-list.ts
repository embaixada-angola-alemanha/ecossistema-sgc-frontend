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
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateModule } from '@ngx-translate/core';
import { DatePipe } from '@angular/common';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { DocumentoService } from '../../../core/services/documento.service';
import { CidadaoService } from '../../../core/services/cidadao.service';
import { AuthService } from '../../../core/services/auth.service';
import { Cidadao } from '../../../core/models/cidadao.model';
import {
  Documento, EstadoDocumento, TipoDocumento,
  TIPO_DOCUMENTO_VALUES, ESTADO_DOCUMENTO_VALUES,
} from '../../../core/models/documento.model';
import { LoadingSpinner } from '../../../shared/components/loading-spinner/loading-spinner';
import { StatusBadge } from '../../../shared/components/status-badge/status-badge';
import { DocumentoDetailDialog } from '../documento-detail/documento-detail';
import { DocumentoUploadDialog } from '../documento-upload/documento-upload';

@Component({
  selector: 'sgc-documento-list',
  standalone: true,
  imports: [
    FormsModule, DatePipe,
    MatCardModule, MatIconModule, MatButtonModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatTableModule, MatPaginatorModule,
    MatMenuModule, MatTooltipModule,
    TranslateModule,
    LoadingSpinner, StatusBadge,
  ],
  templateUrl: './documento-list.html',
  styleUrl: './documento-list.scss',
})
export class DocumentoList implements OnInit {
  private readonly documentoService = inject(DocumentoService);
  private readonly cidadaoService = inject(CidadaoService);
  private readonly authService = inject(AuthService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);

  readonly loading = signal(false);
  readonly cidadaos = signal<Cidadao[]>([]);
  readonly documentos = signal<Documento[]>([]);
  readonly totalElements = signal(0);
  readonly selectedCidadao = signal<Cidadao | null>(null);

  readonly displayedColumns = ['tipo', 'numero', 'ficheiroNome', 'estado', 'dataValidade', 'versao', 'actions'];
  readonly tipoValues = TIPO_DOCUMENTO_VALUES;
  readonly estadoValues = ESTADO_DOCUMENTO_VALUES;

  cidadaoId = '';
  page = 0;
  pageSize = 20;

  private readonly searchSubject = new Subject<string>();
  cidadaoSearch = '';

  readonly canCreate = this.authService.hasAnyRole('ADMIN', 'CONSUL', 'OFFICER');
  readonly canEdit = this.authService.hasAnyRole('ADMIN', 'CONSUL', 'OFFICER');
  readonly canDelete = this.authService.hasAnyRole('ADMIN', 'CONSUL');

  ngOnInit(): void {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe((search) => {
      this.cidadaoService.getAll(0, 50, search).subscribe({
        next: (data) => this.cidadaos.set(data.content),
      });
    });

    this.cidadaoService.getAll(0, 50).subscribe({
      next: (data) => this.cidadaos.set(data.content),
    });
  }

  onCidadaoSearch(value: string): void {
    this.cidadaoSearch = value;
    this.searchSubject.next(value);
  }

  onCidadaoSelect(): void {
    const c = this.cidadaos().find((c) => c.id === this.cidadaoId);
    this.selectedCidadao.set(c ?? null);
    this.page = 0;
    this.loadDocuments();
  }

  onPageChange(event: PageEvent): void {
    this.page = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadDocuments();
  }

  openUpload(): void {
    if (!this.cidadaoId) return;
    const ref = this.dialog.open(DocumentoUploadDialog, {
      width: '600px',
      data: { cidadaoId: this.cidadaoId },
    });
    ref.afterClosed().subscribe((result) => {
      if (result) this.loadDocuments();
    });
  }

  openDetail(doc: Documento): void {
    const ref = this.dialog.open(DocumentoDetailDialog, {
      width: '700px',
      data: { cidadaoId: this.cidadaoId, documentoId: doc.id },
    });
    ref.afterClosed().subscribe((result) => {
      if (result) this.loadDocuments();
    });
  }

  changeEstado(doc: Documento, estado: EstadoDocumento): void {
    this.documentoService.updateEstado(this.cidadaoId, doc.id, estado).subscribe({
      next: () => this.loadDocuments(),
      error: () => this.snackBar.open('Erro ao alterar estado', '', { duration: 3000 }),
    });
  }

  downloadFicheiro(doc: Documento): void {
    this.documentoService.downloadFicheiro(this.cidadaoId, doc.id).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = doc.ficheiroNome ?? 'documento';
        a.click();
        URL.revokeObjectURL(url);
      },
      error: () => this.snackBar.open('Erro ao descarregar ficheiro', '', { duration: 3000 }),
    });
  }

  deleteDocumento(doc: Documento): void {
    if (!confirm(`Eliminar documento ${doc.ficheiroNome ?? doc.id}?`)) return;
    this.documentoService.delete(this.cidadaoId, doc.id).subscribe({
      next: () => this.loadDocuments(),
      error: () => this.snackBar.open('Erro ao eliminar', '', { duration: 3000 }),
    });
  }

  formatFileSize(bytes: number | null): string {
    if (!bytes) return '—';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  }

  getDocIcon(tipo: TipoDocumento): string {
    const icons: Record<TipoDocumento, string> = {
      PASSAPORTE: 'badge',
      BILHETE_IDENTIDADE: 'credit_card',
      CERTIDAO_NASCIMENTO: 'child_care',
      CERTIDAO_CASAMENTO: 'favorite',
      PROCURACAO: 'gavel',
      DECLARACAO: 'description',
      OUTRO: 'insert_drive_file',
    };
    return icons[tipo] ?? 'insert_drive_file';
  }

  isExpired(dateStr: string): boolean {
    return new Date(dateStr) < new Date();
  }

  private loadDocuments(): void {
    if (!this.cidadaoId) return;
    this.loading.set(true);
    this.documentoService.getAll(this.cidadaoId, this.page, this.pageSize).subscribe({
      next: (data) => {
        this.documentos.set(data.content);
        this.totalElements.set(data.totalElements);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.snackBar.open('Erro ao carregar documentos', '', { duration: 3000 });
      },
    });
  }
}
