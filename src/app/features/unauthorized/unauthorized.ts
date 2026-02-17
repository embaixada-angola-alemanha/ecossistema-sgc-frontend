import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'sgc-unauthorized',
  standalone: true,
  imports: [MatCardModule, MatIconModule, TranslateModule],
  templateUrl: './unauthorized.html',
})
export class Unauthorized {}
