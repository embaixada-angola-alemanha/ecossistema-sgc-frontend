import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'sgc-relatorio-home',
  standalone: true,
  imports: [MatCardModule, MatIconModule, TranslateModule],
  templateUrl: './relatorio-home.html',
})
export class RelatorioHome {}
