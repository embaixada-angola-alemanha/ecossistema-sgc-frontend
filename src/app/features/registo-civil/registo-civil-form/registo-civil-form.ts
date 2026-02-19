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
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DatePipe } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { STEPPER_GLOBAL_OPTIONS } from '@angular/cdk/stepper';
import { switchMap } from 'rxjs/operators';
import { of } from 'rxjs';
import { RegistoCivilService } from '../../../core/services/registo-civil.service';
import { CidadaoService } from '../../../core/services/cidadao.service';
import { AuthService } from '../../../core/services/auth.service';
import { CitizenContextService } from '../../../core/services/citizen-context.service';
import { Cidadao } from '../../../core/models/cidadao.model';
import {
  RegistoCivil, RegistoCivilCreate, TipoRegistoCivil,
  TIPO_REGISTO_CIVIL_VALUES,
} from '../../../core/models/registo-civil.model';
import { LoadingSpinner } from '../../../shared/components/loading-spinner/loading-spinner';

@Component({
  selector: 'sgc-registo-civil-form',
  standalone: true,
  imports: [
    ReactiveFormsModule, DatePipe,
    MatStepperModule, MatCardModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatButtonModule, MatIconModule,
    MatDatepickerModule, MatNativeDateModule,
    TranslateModule,
    LoadingSpinner,
  ],
  providers: [
    { provide: STEPPER_GLOBAL_OPTIONS, useValue: { showError: true } },
  ],
  templateUrl: './registo-civil-form.html',
  styleUrl: './registo-civil-form.scss',
})
export class RegistoCivilForm implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly registoService = inject(RegistoCivilService);
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
  readonly tipoValues = TIPO_REGISTO_CIVIL_VALUES;
  readonly isCitizenOnly = this.authService.isCitizenOnly();

  cidadaoForm!: FormGroup;
  tipoForm!: FormGroup;
  eventForm!: FormGroup;
  specificForm!: FormGroup;

  isEdit = false;
  editId: string | null = null;
  private existingRegisto: RegistoCivil | null = null;

  get selectedTipo(): TipoRegistoCivil | null {
    return this.tipoForm?.get('tipo')?.value || null;
  }

  ngOnInit(): void {
    this.cidadaoForm = this.fb.group({
      cidadaoId: ['', Validators.required],
    });

    this.tipoForm = this.fb.group({
      tipo: ['', Validators.required],
    });

    this.eventForm = this.fb.group({
      dataEvento: [null],
      localEvento: [''],
      observacoes: [''],
    });

    this.specificForm = this.fb.group({
      // Birth
      nomePai: [''],
      nomeMae: [''],
      localNascimento: [''],
      // Marriage
      nomeConjuge1: [''],
      nomeConjuge2: [''],
      regimeCasamento: [''],
      // Death
      causaObito: [''],
      localObito: [''],
      dataObito: [null],
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
      this.registoService.getById(id).subscribe({
        next: (registo) => {
          this.existingRegisto = registo;
          this.cidadaoForm.patchValue({ cidadaoId: registo.cidadaoId });
          this.tipoForm.patchValue({ tipo: registo.tipo });
          this.eventForm.patchValue({
            dataEvento: registo.dataEvento ? new Date(registo.dataEvento) : null,
            localEvento: registo.localEvento ?? '',
            observacoes: registo.observacoes ?? '',
          });
          this.specificForm.patchValue({
            nomePai: registo.nomePai ?? '',
            nomeMae: registo.nomeMae ?? '',
            localNascimento: registo.localNascimento ?? '',
            nomeConjuge1: registo.nomeConjuge1 ?? '',
            nomeConjuge2: registo.nomeConjuge2 ?? '',
            regimeCasamento: registo.regimeCasamento ?? '',
            causaObito: registo.causaObito ?? '',
            localObito: registo.localObito ?? '',
            dataObito: registo.dataObito ? new Date(registo.dataObito) : null,
          });
          this.onCidadaoSelect(registo.cidadaoId);
          this.loading.set(false);
        },
        error: () => {
          this.snackBar.open('Erro ao carregar registo', '', { duration: 3000 });
          this.router.navigate(['/registos-civis']);
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

  getCidadaoName(cidadaoId: string): string {
    return this.cidadaos().find((c) => c.id === cidadaoId)?.nomeCompleto ?? '';
  }

  saveDraft(): void {
    this.submitRegisto(false);
  }

  submitRegisto(submit: boolean): void {
    if (this.cidadaoForm.invalid || this.tipoForm.invalid) return;
    this.saving.set(true);

    const event = this.eventForm.getRawValue();
    const specific = this.specificForm.getRawValue();
    const tipo = this.tipoForm.value.tipo as TipoRegistoCivil;

    const payload: RegistoCivilCreate = {
      cidadaoId: this.cidadaoForm.value.cidadaoId,
      tipo,
      ...(event.dataEvento && { dataEvento: this.formatDate(event.dataEvento) }),
      ...(event.localEvento && { localEvento: event.localEvento }),
      ...(event.observacoes && { observacoes: event.observacoes }),
      // Birth-specific
      ...(tipo === 'NASCIMENTO' && specific.nomePai && { nomePai: specific.nomePai }),
      ...(tipo === 'NASCIMENTO' && specific.nomeMae && { nomeMae: specific.nomeMae }),
      ...(tipo === 'NASCIMENTO' && specific.localNascimento && { localNascimento: specific.localNascimento }),
      // Marriage-specific
      ...(tipo === 'CASAMENTO' && specific.nomeConjuge1 && { nomeConjuge1: specific.nomeConjuge1 }),
      ...(tipo === 'CASAMENTO' && specific.nomeConjuge2 && { nomeConjuge2: specific.nomeConjuge2 }),
      ...(tipo === 'CASAMENTO' && specific.regimeCasamento && { regimeCasamento: specific.regimeCasamento }),
      // Death-specific
      ...(tipo === 'OBITO' && specific.causaObito && { causaObito: specific.causaObito }),
      ...(tipo === 'OBITO' && specific.localObito && { localObito: specific.localObito }),
      ...(tipo === 'OBITO' && specific.dataObito && { dataObito: this.formatDate(specific.dataObito) }),
    };

    const create$ = this.isEdit
      ? this.registoService.update(this.editId!, {
          dataEvento: event.dataEvento ? this.formatDate(event.dataEvento) : undefined,
          localEvento: event.localEvento || undefined,
          observacoes: event.observacoes || undefined,
          nomePai: tipo === 'NASCIMENTO' ? specific.nomePai || undefined : undefined,
          nomeMae: tipo === 'NASCIMENTO' ? specific.nomeMae || undefined : undefined,
          localNascimento: tipo === 'NASCIMENTO' ? specific.localNascimento || undefined : undefined,
          nomeConjuge1: tipo === 'CASAMENTO' ? specific.nomeConjuge1 || undefined : undefined,
          nomeConjuge2: tipo === 'CASAMENTO' ? specific.nomeConjuge2 || undefined : undefined,
          regimeCasamento: tipo === 'CASAMENTO' ? specific.regimeCasamento || undefined : undefined,
          causaObito: tipo === 'OBITO' ? specific.causaObito || undefined : undefined,
          localObito: tipo === 'OBITO' ? specific.localObito || undefined : undefined,
          dataObito: tipo === 'OBITO' && specific.dataObito ? this.formatDate(specific.dataObito) : undefined,
        })
      : this.registoService.create(payload);

    create$.pipe(
      switchMap((registo) => {
        if (submit && registo.estado === 'RASCUNHO') {
          return this.registoService.updateEstado(registo.id, 'SUBMETIDO');
        }
        return of(registo);
      }),
    ).subscribe({
      next: () => {
        this.saving.set(false);
        this.snackBar.open(
          submit ? 'Registo submetido com sucesso' : 'Rascunho guardado',
          '', { duration: 3000 },
        );
        this.router.navigate(['/registos-civis']);
      },
      error: () => {
        this.saving.set(false);
        this.snackBar.open('Erro ao guardar registo', '', { duration: 3000 });
      },
    });
  }

  goBack(): void {
    this.router.navigate(['/registos-civis']);
  }

  private formatDate(date: Date | string): string {
    if (typeof date === 'string') return date;
    return date.toISOString().split('T')[0];
  }
}
