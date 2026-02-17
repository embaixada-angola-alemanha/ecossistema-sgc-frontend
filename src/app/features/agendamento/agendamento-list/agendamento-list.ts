import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'sgc-agendamento-list',
  standalone: true,
  imports: [MatCardModule, MatIconModule, TranslateModule],
  templateUrl: './agendamento-list.html',
})
export class AgendamentoList {}
