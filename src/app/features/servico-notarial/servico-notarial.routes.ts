import { Routes } from '@angular/router';
import { ServicoNotarialList } from './servico-notarial-list/servico-notarial-list';
import { ServicoNotarialForm } from './servico-notarial-form/servico-notarial-form';

export const SERVICO_NOTARIAL_ROUTES: Routes = [
  { path: '', component: ServicoNotarialList },
  { path: 'new', component: ServicoNotarialForm },
  { path: ':id/edit', component: ServicoNotarialForm },
];
