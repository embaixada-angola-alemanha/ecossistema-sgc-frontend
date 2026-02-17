import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'sgc-dashboard-home',
  standalone: true,
  imports: [MatCardModule, MatIconModule, TranslateModule],
  templateUrl: './dashboard-home.html',
})
export class DashboardHome {}
