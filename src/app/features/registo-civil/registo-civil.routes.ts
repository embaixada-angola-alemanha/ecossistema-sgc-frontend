import { Routes } from '@angular/router';
import { RegistoCivilList } from './registo-civil-list/registo-civil-list';
import { RegistoCivilForm } from './registo-civil-form/registo-civil-form';

export const REGISTO_CIVIL_ROUTES: Routes = [
  { path: '', component: RegistoCivilList },
  { path: 'new', component: RegistoCivilForm },
  { path: ':id/edit', component: RegistoCivilForm },
];
