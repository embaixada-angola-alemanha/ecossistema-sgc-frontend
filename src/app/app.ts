import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { KeycloakService } from 'keycloak-angular';

interface NavItem {
  icon: string;
  labelKey: string;
  route: string;
  roles: string[];
}

interface NavSection {
  label: string;
  items: NavItem[];
  pushToBottom?: boolean;
}

@Component({
  selector: 'sgc-root',
  standalone: true,
  imports: [
    RouterOutlet, RouterLink, RouterLinkActive,
    MatToolbarModule, MatSidenavModule, MatListModule,
    MatIconModule, MatButtonModule, MatMenuModule,
    TranslateModule,
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements OnInit {
  private readonly translate = inject(TranslateService);
  private readonly keycloak = inject(KeycloakService);

  readonly username = signal('');
  readonly userRoles = signal<string[]>([]);

  readonly userInitials = computed(() => {
    const name = this.username();
    if (!name) return 'U';
    const parts = name.split(/[\s.]+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  });

  readonly navSections: NavSection[] = [
    {
      label: 'Principal',
      items: [
        { icon: 'dashboard', labelKey: 'nav.dashboard', route: '/dashboard', roles: [] },
        { icon: 'people', labelKey: 'nav.cidadaos', route: '/cidadaos', roles: ['ADMIN', 'CONSUL', 'OFFICER', 'VIEWER'] },
        { icon: 'flight', labelKey: 'nav.vistos', route: '/vistos', roles: ['ADMIN', 'CONSUL', 'OFFICER', 'VIEWER'] },
        { icon: 'event', labelKey: 'nav.agendamentos', route: '/agendamentos', roles: ['ADMIN', 'CONSUL', 'OFFICER', 'VIEWER'] },
      ],
    },
    {
      label: 'Operações',
      items: [
        { icon: 'article', labelKey: 'nav.registosCivis', route: '/registos-civis', roles: ['ADMIN', 'CONSUL', 'OFFICER', 'VIEWER'] },
        { icon: 'gavel', labelKey: 'nav.servicosNotariais', route: '/servicos-notariais', roles: ['ADMIN', 'CONSUL', 'OFFICER', 'VIEWER'] },
      ],
    },
    {
      label: 'Sistema',
      pushToBottom: true,
      items: [
        { icon: 'assessment', labelKey: 'nav.relatorios', route: '/relatorios', roles: ['ADMIN', 'CONSUL'] },
        { icon: 'notifications', labelKey: 'nav.notificacoes', route: '/notificacoes', roles: ['ADMIN', 'CONSUL', 'OFFICER'] },
      ],
    },
  ];

  constructor() {
    this.translate.setDefaultLang('pt');
    this.translate.use('pt');
  }

  ngOnInit(): void {
    this.username.set(this.keycloak.getUsername());
    this.userRoles.set(this.keycloak.getUserRoles());
  }

  isVisible(item: NavItem): boolean {
    if (item.roles.length === 0) return true;
    return item.roles.some((role) => this.userRoles().includes(role));
  }

  hasSectionItems(section: NavSection): boolean {
    return section.items.some((item) => this.isVisible(item));
  }

  switchLang(lang: string): void {
    this.translate.use(lang);
  }

  logout(): void {
    this.keycloak.logout();
  }
}
