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
import { MatRadioModule } from '@angular/material/radio';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatListModule } from '@angular/material/list';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { STEPPER_GLOBAL_OPTIONS } from '@angular/cdk/stepper';
import { switchMap } from 'rxjs/operators';
import { of } from 'rxjs';
import { VistoService } from '../../../core/services/visto.service';
import { CidadaoService } from '../../../core/services/cidadao.service';
import { AuthService } from '../../../core/services/auth.service';
import { CitizenContextService } from '../../../core/services/citizen-context.service';
import { Cidadao } from '../../../core/models/cidadao.model';
import {
  Visto, VistoCreate, TipoVisto, VistoFee, VistoChecklist,
  TIPO_VISTO_VALUES,
} from '../../../core/models/visto.model';
import { LoadingSpinner } from '../../../shared/components/loading-spinner/loading-spinner';

@Component({
  selector: 'sgc-visto-stepper',
  standalone: true,
  imports: [
    ReactiveFormsModule, CurrencyPipe, DatePipe,
    MatStepperModule, MatCardModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatButtonModule, MatIconModule, MatRadioModule,
    MatDatepickerModule, MatNativeDateModule,
    MatCheckboxModule, MatListModule, MatChipsModule,
    MatAutocompleteModule, MatProgressSpinnerModule,
    TranslateModule,
    LoadingSpinner,
  ],
  providers: [
    { provide: STEPPER_GLOBAL_OPTIONS, useValue: { showError: true } },
  ],
  templateUrl: './visto-stepper.html',
  styleUrl: './visto-stepper.scss',
})
export class VistoStepper implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly vistoService = inject(VistoService);
  private readonly cidadaoService = inject(CidadaoService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly snackBar = inject(MatSnackBar);
  private readonly translate = inject(TranslateService);
  private readonly authService = inject(AuthService);
  private readonly citizenContext = inject(CitizenContextService);

  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly cidadaos = signal<Cidadao[]>([]);
  readonly selectedCidadao = signal<Cidadao | null>(null);
  readonly fee = signal<VistoFee | null>(null);
  readonly checklist = signal<VistoChecklist | null>(null);
  readonly tipoValues = TIPO_VISTO_VALUES;
  readonly isCitizenOnly = this.authService.isCitizenOnly();

  cidadaoForm!: FormGroup;
  tipoForm!: FormGroup;
  travelForm!: FormGroup;
  documentsForm!: FormGroup;

  isEdit = false;
  editId: string | null = null;
  private existingVisto: Visto | null = null;

  ngOnInit(): void {
    this.cidadaoForm = this.fb.group({
      cidadaoId: ['', Validators.required],
    });

    this.tipoForm = this.fb.group({
      tipo: ['', Validators.required],
    });

    this.travelForm = this.fb.group({
      nacionalidadePassaporte: [''],
      motivoViagem: [''],
      dataEntrada: [null],
      dataSaida: [null],
      localAlojamento: [''],
      entidadeConvite: [''],
      observacoes: [''],
    });

    this.documentsForm = this.fb.group({
      taxaPaga: [false],
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
      this.vistoService.getById(id).subscribe({
        next: (visto) => {
          this.existingVisto = visto;
          this.cidadaoForm.patchValue({ cidadaoId: visto.cidadaoId });
          this.tipoForm.patchValue({ tipo: visto.tipo });
          this.travelForm.patchValue({
            nacionalidadePassaporte: visto.nacionalidadePassaporte ?? '',
            motivoViagem: visto.motivoViagem ?? '',
            dataEntrada: visto.dataEntrada ? new Date(visto.dataEntrada) : null,
            dataSaida: visto.dataSaida ? new Date(visto.dataSaida) : null,
            localAlojamento: visto.localAlojamento ?? '',
            entidadeConvite: visto.entidadeConvite ?? '',
            observacoes: visto.observacoes ?? '',
          });
          this.documentsForm.patchValue({ taxaPaga: visto.taxaPaga });
          this.onTipoChange(visto.tipo);
          this.onCidadaoSelect(visto.cidadaoId);
          this.loading.set(false);
        },
        error: () => {
          this.snackBar.open(this.translate.instant('common.error.loadFailed'), '', { duration: 3000 });
          this.router.navigate(['/vistos']);
        },
      });
    } else {
      this.loading.set(false);
    }
  }

  onCidadaoSelect(cidadaoId: string): void {
    const cidadao = this.cidadaos().find((c) => c.id === cidadaoId) ?? null;
    this.selectedCidadao.set(cidadao);
    if (cidadao?.nacionalidade) {
      this.travelForm.patchValue({ nacionalidadePassaporte: cidadao.nacionalidade });
    }
  }

  onTipoChange(tipo: TipoVisto): void {
    this.fee.set(null);
    this.checklist.set(null);
    if (!tipo) return;
    this.vistoService.getFee(tipo).subscribe({
      next: (f) => this.fee.set(f),
      error: () => {},
    });
    this.vistoService.getChecklist(tipo).subscribe({
      next: (c) => this.checklist.set(c),
      error: () => {},
    });
  }

  getCidadaoName(cidadaoId: string): string {
    return this.cidadaos().find((c) => c.id === cidadaoId)?.nomeCompleto ?? '';
  }

  saveDraft(): void {
    this.submitVisa(false);
  }

  submitVisa(submit: boolean): void {
    if (this.cidadaoForm.invalid || this.tipoForm.invalid) return;
    this.saving.set(true);

    const travel = this.travelForm.getRawValue();
    const payload: VistoCreate = {
      cidadaoId: this.cidadaoForm.value.cidadaoId,
      tipo: this.tipoForm.value.tipo,
      ...(travel.nacionalidadePassaporte && { nacionalidadePassaporte: travel.nacionalidadePassaporte }),
      ...(travel.motivoViagem && { motivoViagem: travel.motivoViagem }),
      ...(travel.dataEntrada && { dataEntrada: this.formatDate(travel.dataEntrada) }),
      ...(travel.dataSaida && { dataSaida: this.formatDate(travel.dataSaida) }),
      ...(travel.localAlojamento && { localAlojamento: travel.localAlojamento }),
      ...(travel.entidadeConvite && { entidadeConvite: travel.entidadeConvite }),
      ...(travel.observacoes && { observacoes: travel.observacoes }),
    };

    const create$ = this.isEdit
      ? this.vistoService.update(this.editId!, {
          motivoViagem: travel.motivoViagem || undefined,
          dataEntrada: travel.dataEntrada ? this.formatDate(travel.dataEntrada) : undefined,
          dataSaida: travel.dataSaida ? this.formatDate(travel.dataSaida) : undefined,
          localAlojamento: travel.localAlojamento || undefined,
          entidadeConvite: travel.entidadeConvite || undefined,
          observacoes: travel.observacoes || undefined,
        })
      : this.vistoService.create(payload);

    create$.pipe(
      switchMap((visto) => {
        if (submit && visto.estado === 'RASCUNHO') {
          return this.vistoService.updateEstado(visto.id, 'SUBMETIDO');
        }
        return of(visto);
      }),
    ).subscribe({
      next: () => {
        this.saving.set(false);
        this.snackBar.open(
          submit ? this.translate.instant('common.success.submitted') : this.translate.instant('common.success.saved'),
          '', { duration: 3000 },
        );
        this.router.navigate(['/vistos']);
      },
      error: () => {
        this.saving.set(false);
        this.snackBar.open(this.translate.instant('common.error.saveFailed'), '', { duration: 3000 });
      },
    });
  }

  goBack(): void {
    this.router.navigate(['/vistos']);
  }

  private formatDate(date: Date | string): string {
    if (typeof date === 'string') return date;
    return date.toISOString().split('T')[0];
  }
}
