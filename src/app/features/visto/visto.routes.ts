import { Routes } from '@angular/router';
import { VistoList } from './visto-list/visto-list';
import { VistoStepper } from './visto-stepper/visto-stepper';

export const VISTO_ROUTES: Routes = [
  { path: '', component: VistoList },
  { path: 'new', component: VistoStepper },
  { path: ':id/edit', component: VistoStepper },
];
