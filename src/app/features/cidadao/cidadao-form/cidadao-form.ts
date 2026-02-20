import { Component, inject, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateModule } from '@ngx-translate/core';
import { CidadaoService } from '../../../core/services/cidadao.service';
import { Cidadao, EstadoCivil, Sexo } from '../../../core/models/cidadao.model';

interface DialogData {
  cidadao?: Cidadao;
}

@Component({
  selector: 'sgc-cidadao-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule, MatFormFieldModule, MatInputModule,
    MatSelectModule, MatButtonModule, MatDatepickerModule,
    MatNativeDateModule, MatIconModule,
    TranslateModule,
  ],
  template: `
    <h2 mat-dialog-title>
      {{ (isEdit ? 'cidadao.editCitizen' : 'cidadao.newCitizen') | translate }}
    </h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="form-grid">
        @if (!isEdit) {
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>{{ 'cidadao.numeroPassaporte' | translate }}</mat-label>
            <input matInput formControlName="numeroPassaporte">
            @if (form.get('numeroPassaporte')?.hasError('required')) {
              <mat-error>{{ 'validation.required' | translate }}</mat-error>
            }
            @if (form.get('numeroPassaporte')?.hasError('pattern')) {
              <mat-error>{{ 'cidadao.errors.passaporteFormat' | translate }}</mat-error>
            }
          </mat-form-field>
        }

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>{{ 'cidadao.nomeCompleto' | translate }}</mat-label>
          <input matInput formControlName="nomeCompleto">
          @if (form.get('nomeCompleto')?.hasError('required')) {
            <mat-error>{{ 'validation.required' | translate }}</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>{{ 'cidadao.dataNascimento' | translate }} *</mat-label>
          <input matInput [matDatepicker]="picker" formControlName="dataNascimento">
          <mat-datepicker-toggle matSuffix [for]="picker" />
          <mat-datepicker #picker />
          @if (form.get('dataNascimento')?.hasError('required')) {
            <mat-error>{{ 'validation.required' | translate }}</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>{{ 'cidadao.sexo' | translate }} *</mat-label>
          <mat-select formControlName="sexo">
            @for (s of sexos; track s) {
              <mat-option [value]="s">{{ 'cidadao.sexo.' + s | translate }}</mat-option>
            }
          </mat-select>
          @if (form.get('sexo')?.hasError('required')) {
            <mat-error>{{ 'validation.required' | translate }}</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>{{ 'cidadao.nacionalidade' | translate }} *</mat-label>
          <input matInput formControlName="nacionalidade">
          @if (form.get('nacionalidade')?.hasError('required')) {
            <mat-error>{{ 'validation.required' | translate }}</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>{{ 'cidadao.estadoCivil' | translate }} *</mat-label>
          <mat-select formControlName="estadoCivil">
            @for (ec of estadosCivis; track ec) {
              <mat-option [value]="ec">{{ 'cidadao.estadoCivil.' + ec | translate }}</mat-option>
            }
          </mat-select>
          @if (form.get('estadoCivil')?.hasError('required')) {
            <mat-error>{{ 'validation.required' | translate }}</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>{{ 'cidadao.email' | translate }} *</mat-label>
          <input matInput formControlName="email" type="email">
          @if (form.get('email')?.hasError('required')) {
            <mat-error>{{ 'validation.required' | translate }}</mat-error>
          }
          @if (form.get('email')?.hasError('email')) {
            <mat-error>{{ 'validation.email' | translate }}</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>{{ 'cidadao.telefone' | translate }}</mat-label>
          <input matInput formControlName="telefone">
          @if (form.get('telefone')?.hasError('pattern')) {
            <mat-error>{{ 'validation.phone' | translate }}</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>{{ 'cidadao.enderecoAngola' | translate }}</mat-label>
          <textarea matInput formControlName="enderecoAngola" rows="2"></textarea>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>{{ 'cidadao.enderecoAlemanha' | translate }} *</mat-label>
          <textarea matInput formControlName="enderecoAlemanha" rows="2"></textarea>
          @if (form.get('enderecoAlemanha')?.hasError('required')) {
            <mat-error>{{ 'validation.required' | translate }}</mat-error>
          }
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>{{ 'common.cancel' | translate }}</button>
      <button mat-raised-button color="primary" [disabled]="form.invalid || saving" (click)="save()">
        {{ 'common.save' | translate }}
      </button>
    </mat-dialog-actions>
  `,
  styles: `
    .form-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px 16px;
      padding: 8px 0;
      min-width: min(500px, 90vw);
    }
    .full-width { grid-column: 1 / -1; }
    mat-dialog-content { max-height: 70vh; }
  `,
})
export class CidadaoFormDialog implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly cidadaoService = inject(CidadaoService);
  private readonly dialogRef = inject(MatDialogRef<CidadaoFormDialog>);
  private readonly snackBar = inject(MatSnackBar);
  readonly data: DialogData = inject(MAT_DIALOG_DATA);

  readonly isEdit = !!this.data.cidadao;
  saving = false;

  readonly sexos: Sexo[] = ['MASCULINO', 'FEMININO'];
  readonly estadosCivis: EstadoCivil[] = ['SOLTEIRO', 'CASADO', 'DIVORCIADO', 'VIUVO', 'UNIAO_FACTO'];

  form!: FormGroup;

  ngOnInit(): void {
    const c = this.data.cidadao;
    this.form = this.fb.group({
      numeroPassaporte: [c?.numeroPassaporte ?? '', this.isEdit ? [] : [Validators.required, Validators.maxLength(50), Validators.pattern(/^[A-Za-z0-9\-]+$/)]],
      nomeCompleto: [c?.nomeCompleto ?? '', [Validators.required, Validators.maxLength(255)]],
      dataNascimento: [c?.dataNascimento ? new Date(c.dataNascimento) : null, [Validators.required]],
      sexo: [c?.sexo ?? null, [Validators.required]],
      nacionalidade: [c?.nacionalidade ?? 'Angolana', [Validators.required, Validators.maxLength(100)]],
      estadoCivil: [c?.estadoCivil ?? null, [Validators.required]],
      email: [c?.email ?? '', [Validators.required, Validators.email]],
      telefone: [c?.telefone ?? '', [Validators.maxLength(50), Validators.pattern(/^[+]?[0-9\s\-()]*$/)]],
      enderecoAngola: [c?.enderecoAngola ?? '', [Validators.maxLength(500)]],
      enderecoAlemanha: [c?.enderecoAlemanha ?? '', [Validators.required, Validators.maxLength(500)]],
    });
  }

  save(): void {
    if (this.form.invalid) return;
    this.saving = true;

    const raw = this.form.getRawValue();
    const payload: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(raw)) {
      if (this.isEdit && key === 'numeroPassaporte') continue;
      if (value instanceof Date) {
        payload[key] = value.toISOString().split('T')[0];
      } else if (value !== null && value !== '') {
        payload[key] = value;
      }
    }

    const obs = this.isEdit
      ? this.cidadaoService.update(this.data.cidadao!.id, payload)
      : this.cidadaoService.create(payload as any);

    obs.subscribe({
      next: () => this.dialogRef.close(true),
      error: () => {
        this.saving = false;
        this.snackBar.open('Erro ao guardar', '', { duration: 3000 });
      },
    });
  }
}
