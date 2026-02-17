import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'sgc-registo-civil-list',
  standalone: true,
  imports: [MatCardModule, MatIconModule, TranslateModule],
  templateUrl: './registo-civil-list.html',
})
export class RegistoCivilList {}
