import { Routes } from '@angular/router';
import { AgendamentoList } from './agendamento-list/agendamento-list';
import { AgendamentoForm } from './agendamento-form/agendamento-form';

export const AGENDAMENTO_ROUTES: Routes = [
  { path: '', component: AgendamentoList },
  { path: 'new', component: AgendamentoForm },
  { path: ':id/edit', component: AgendamentoForm },
];
