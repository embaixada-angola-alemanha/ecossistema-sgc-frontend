import { Component, inject, signal, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MatStepperModule } from '@angular/material/stepper';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CurrencyPipe } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { STEPPER_GLOBAL_OPTIONS } from '@angular/cdk/stepper';
import { switchMap } from 'rxjs/operators';
import { of } from 'rxjs';
import { ServicoNotarialService } from '../../../core/services/servico-notarial.service';
import { CidadaoService } from '../../../core/services/cidadao.service';
import { AuthService } from '../../../core/services/auth.service';
import { CitizenContextService } from '../../../core/services/citizen-context.service';
import { Cidadao } from '../../../core/models/cidadao.model';
import {
  ServicoNotarial, ServicoNotarialCreate, TipoServicoNotarial,
  NotarialFee, TIPO_SERVICO_NOTARIAL_VALUES,
} from '../../../core/models/servico-notarial.model';
import { LoadingSpinner } from '../../../shared/components/loading-spinner/loading-spinner';

@Component({
  selector: 'sgc-servico-notarial-form',
  standalone: true,
  imports: [
    ReactiveFormsModule, CurrencyPipe,
    MatStepperModule, MatCardModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatButtonModule, MatIconModule,
    TranslateModule,
    LoadingSpinner,
  ],
  providers: [
    { provide: STEPPER_GLOBAL_OPTIONS, useValue: { showError: true } },
  ],
  templateUrl: './servico-notarial-form.html',
  styleUrl: './servico-notarial-form.scss',
})
export class ServicoNotarialForm implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly servicoService = inject(ServicoNotarialService);
  private readonly cidadaoService = inject(CidadaoService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly snackBar = inject(MatSnackBar);
  private readonly authService = inject(AuthService);
  private readonly citizenContext = inject(CitizenContextService);

  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly cidadaos = signal<Cidadao[]>([]);
  readonly selectedCidadao = signal<Cidadao | null>(null);
  readonly fee = signal<NotarialFee | null>(null);
  readonly tipoValues = TIPO_SERVICO_NOTARIAL_VALUES;
  readonly isCitizenOnly = this.authService.isCitizenOnly();

  cidadaoForm!: FormGroup;
  tipoForm!: FormGroup;
  descForm!: FormGroup;
  specificForm!: FormGroup;

  isEdit = false;
  editId: string | null = null;
  private existingServico: ServicoNotarial | null = null;

  get selectedTipo(): TipoServicoNotarial | null {
    return this.tipoForm?.get('tipo')?.value || null;
  }

  ngOnInit(): void {
    this.cidadaoForm = this.fb.group({
      cidadaoId: ['', Validators.required],
    });

    this.tipoForm = this.fb.group({
      tipo: ['', Validators.required],
    });

    this.descForm = this.fb.group({
      descricao: [''],
      observacoes: [''],
    });

    this.specificForm = this.fb.group({
      // Power of Attorney
      outorgante: [''],
      outorgado: [''],
      finalidadeProcuracao: [''],
      // Legalization
      documentoOrigem: [''],
      paisOrigem: [''],
      entidadeEmissora: [''],
      // Apostille
      documentoApostilado: [''],
      paisDestino: [''],
      // Certified Copy
      documentoOriginalRef: [''],
      numeroCopias: [1],
    });

    if (this.isCitizenOnly) {
      const cid = this.citizenContext.cidadaoId();
      if (cid) {
        this.cidadaoForm.patchValue({ cidadaoId: cid });
        this.onCidadaoSelect(cid);
      }
    } else {
      this.cidadaoService.getAll(0, 200).subscribe((data) => {
        this.cidadaos.set(data.content);
      });
    }

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEdit = true;
      this.editId = id;
      this.servicoService.getById(id).subscribe({
        next: (servico) => {
          this.existingServico = servico;
          this.cidadaoForm.patchValue({ cidadaoId: servico.cidadaoId });
          this.tipoForm.patchValue({ tipo: servico.tipo });
          this.descForm.patchValue({
            descricao: servico.descricao ?? '',
            observacoes: servico.observacoes ?? '',
          });
          this.specificForm.patchValue({
            outorgante: servico.outorgante ?? '',
            outorgado: servico.outorgado ?? '',
            finalidadeProcuracao: servico.finalidadeProcuracao ?? '',
            documentoOrigem: servico.documentoOrigem ?? '',
            paisOrigem: servico.paisOrigem ?? '',
            entidadeEmissora: servico.entidadeEmissora ?? '',
            documentoApostilado: servico.documentoApostilado ?? '',
            paisDestino: servico.paisDestino ?? '',
            documentoOriginalRef: servico.documentoOriginalRef ?? '',
            numeroCopias: servico.numeroCopias ?? 1,
          });
          this.onCidadaoSelect(servico.cidadaoId);
          this.onTipoChange(servico.tipo);
          this.loading.set(false);
        },
        error: () => {
          this.snackBar.open('Erro ao carregar serviço', '', { duration: 3000 });
          this.router.navigate(['/servicos-notariais']);
        },
      });
    } else {
      this.loading.set(false);
    }
  }

  onCidadaoSelect(cidadaoId: string): void {
    const cidadao = this.cidadaos().find((c) => c.id === cidadaoId) ?? null;
    this.selectedCidadao.set(cidadao);
  }

  onTipoChange(tipo: TipoServicoNotarial): void {
    this.fee.set(null);
    if (!tipo) return;
    this.servicoService.getFee(tipo).subscribe({
      next: (f) => this.fee.set(f),
      error: () => {},
    });
  }

  getCidadaoName(cidadaoId: string): string {
    return this.cidadaos().find((c) => c.id === cidadaoId)?.nomeCompleto ?? '';
  }

  saveDraft(): void {
    this.submitServico(false);
  }

  submitServico(submit: boolean): void {
    if (this.cidadaoForm.invalid || this.tipoForm.invalid) return;
    this.saving.set(true);

    const desc = this.descForm.getRawValue();
    const specific = this.specificForm.getRawValue();
    const tipo = this.tipoForm.value.tipo as TipoServicoNotarial;

    const payload: ServicoNotarialCreate = {
      cidadaoId: this.cidadaoForm.value.cidadaoId,
      tipo,
      ...(desc.descricao && { descricao: desc.descricao }),
      ...(desc.observacoes && { observacoes: desc.observacoes }),
      // Power of Attorney
      ...(tipo === 'PROCURACAO' && specific.outorgante && { outorgante: specific.outorgante }),
      ...(tipo === 'PROCURACAO' && specific.outorgado && { outorgado: specific.outorgado }),
      ...(tipo === 'PROCURACAO' && specific.finalidadeProcuracao && { finalidadeProcuracao: specific.finalidadeProcuracao }),
      // Legalization
      ...(tipo === 'LEGALIZACAO' && specific.documentoOrigem && { documentoOrigem: specific.documentoOrigem }),
      ...(tipo === 'LEGALIZACAO' && specific.paisOrigem && { paisOrigem: specific.paisOrigem }),
      ...(tipo === 'LEGALIZACAO' && specific.entidadeEmissora && { entidadeEmissora: specific.entidadeEmissora }),
      // Apostille
      ...(tipo === 'APOSTILA' && specific.documentoApostilado && { documentoApostilado: specific.documentoApostilado }),
      ...(tipo === 'APOSTILA' && specific.paisDestino && { paisDestino: specific.paisDestino }),
      // Certified Copy
      ...(tipo === 'COPIA_CERTIFICADA' && specific.documentoOriginalRef && { documentoOriginalRef: specific.documentoOriginalRef }),
      ...(tipo === 'COPIA_CERTIFICADA' && specific.numeroCopias && { numeroCopias: specific.numeroCopias }),
    };

    const create$ = this.isEdit
      ? this.servicoService.update(this.editId!, {
          descricao: desc.descricao || undefined,
          observacoes: desc.observacoes || undefined,
          outorgante: tipo === 'PROCURACAO' ? specific.outorgante || undefined : undefined,
          outorgado: tipo === 'PROCURACAO' ? specific.outorgado || undefined : undefined,
          finalidadeProcuracao: tipo === 'PROCURACAO' ? specific.finalidadeProcuracao || undefined : undefined,
          documentoOrigem: tipo === 'LEGALIZACAO' ? specific.documentoOrigem || undefined : undefined,
          paisOrigem: tipo === 'LEGALIZACAO' ? specific.paisOrigem || undefined : undefined,
          entidadeEmissora: tipo === 'LEGALIZACAO' ? specific.entidadeEmissora || undefined : undefined,
          documentoApostilado: tipo === 'APOSTILA' ? specific.documentoApostilado || undefined : undefined,
          paisDestino: tipo === 'APOSTILA' ? specific.paisDestino || undefined : undefined,
          documentoOriginalRef: tipo === 'COPIA_CERTIFICADA' ? specific.documentoOriginalRef || undefined : undefined,
          numeroCopias: tipo === 'COPIA_CERTIFICADA' ? specific.numeroCopias || undefined : undefined,
        })
      : this.servicoService.create(payload);

    create$.pipe(
      switchMap((servico) => {
        if (submit && servico.estado === 'RASCUNHO') {
          return this.servicoService.updateEstado(servico.id, 'SUBMETIDO');
        }
        return of(servico);
      }),
    ).subscribe({
      next: () => {
        this.saving.set(false);
        this.snackBar.open(
          submit ? 'Serviço submetido com sucesso' : 'Rascunho guardado',
          '', { duration: 3000 },
        );
        this.router.navigate(['/servicos-notariais']);
      },
      error: () => {
        this.saving.set(false);
        this.snackBar.open('Erro ao guardar serviço', '', { duration: 3000 });
      },
    });
  }

  goBack(): void {
    this.router.navigate(['/servicos-notariais']);
  }
}
