import { Routes } from '@angular/router';
import { CidadaoList } from './cidadao-list/cidadao-list';
import { MeuPerfil } from './meu-perfil/meu-perfil';

export const CIDADAO_ROUTES: Routes = [
  { path: 'me', component: MeuPerfil },
  { path: '', component: CidadaoList },
];
