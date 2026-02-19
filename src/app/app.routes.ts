import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';
import { roleGuard } from './core/auth/role.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  {
    path: 'dashboard',
    loadChildren: () => import('./features/dashboard/dashboard.routes').then((m) => m.DASHBOARD_ROUTES),
    canActivate: [authGuard],
  },
  {
    path: 'cidadaos',
    loadChildren: () => import('./features/cidadao/cidadao.routes').then((m) => m.CIDADAO_ROUTES),
    canActivate: [authGuard],
  },
  {
    path: 'vistos',
    loadChildren: () => import('./features/visto/visto.routes').then((m) => m.VISTO_ROUTES),
    canActivate: [authGuard],
  },
  {
    path: 'agendamentos',
    loadChildren: () => import('./features/agendamento/agendamento.routes').then((m) => m.AGENDAMENTO_ROUTES),
    canActivate: [authGuard],
  },
  {
    path: 'documentos',
    loadChildren: () => import('./features/documento/documento.routes').then((m) => m.DOCUMENTO_ROUTES),
    canActivate: [authGuard],
  },
  {
    path: 'registos-civis',
    loadChildren: () => import('./features/registo-civil/registo-civil.routes').then((m) => m.REGISTO_CIVIL_ROUTES),
    canActivate: [authGuard],
  },
  {
    path: 'servicos-notariais',
    loadChildren: () => import('./features/servico-notarial/servico-notarial.routes').then((m) => m.SERVICO_NOTARIAL_ROUTES),
    canActivate: [authGuard],
  },
  {
    path: 'workflow-admin',
    loadChildren: () => import('./features/workflow-admin/workflow-admin.routes').then((m) => m.WORKFLOW_ADMIN_ROUTES),
    canActivate: [authGuard, roleGuard],
    data: { roles: ['ADMIN', 'CONSUL'] },
  },
  {
    path: 'user-admin',
    loadChildren: () => import('./features/user-admin/user-admin.routes').then((m) => m.USER_ADMIN_ROUTES),
    canActivate: [authGuard, roleGuard],
    data: { roles: ['ADMIN', 'CONSUL'] },
  },
  {
    path: 'relatorios',
    loadChildren: () => import('./features/relatorio/relatorio.routes').then((m) => m.RELATORIO_ROUTES),
    canActivate: [authGuard, roleGuard],
    data: { roles: ['ADMIN', 'CONSUL'] },
  },
  {
    path: 'notificacoes',
    loadChildren: () => import('./features/notificacao/notificacao.routes').then((m) => m.NOTIFICACAO_ROUTES),
    canActivate: [authGuard],
  },
  {
    path: 'unauthorized',
    loadComponent: () => import('./features/unauthorized/unauthorized').then((m) => m.Unauthorized),
  },
  { path: '**', redirectTo: 'dashboard' },
];
