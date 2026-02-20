import { Component, inject, signal, computed, OnInit, ViewChild } from '@angular/core';
import { Router, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule, MatSidenav } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { KeycloakService } from 'keycloak-angular';
import { BreakpointObserver } from '@angular/cdk/layout';
import { CitizenContextService } from './core/services/citizen-context.service';
import { RelatorioService } from './core/services/relatorio.service';

interface NavItem {
  icon: string;
  labelKey: string;
  route: string;
  roles: string[];
  badgeKey?: string;
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
  private readonly breakpointObserver = inject(BreakpointObserver);
  private readonly citizenContext = inject(CitizenContextService);
  private readonly router = inject(Router);
  private readonly relatorioService = inject(RelatorioService);

  @ViewChild('sidenav') sidenav!: MatSidenav;

  private static readonly LANG_KEY = 'sgc-lang';

  readonly username = signal('');
  readonly userRoles = signal<string[]>([]);
  readonly currentLang = signal('pt');
  readonly sidenavMode = signal<'side' | 'over'>('side');
  readonly sidenavOpened = signal(true);

  readonly navBadges = signal<Record<string, number>>({});

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
        { icon: 'person', labelKey: 'nav.meuPerfil', route: '/cidadaos/me', roles: ['CITIZEN'] },
        { icon: 'people', labelKey: 'nav.cidadaos', route: '/cidadaos', roles: ['ADMIN', 'CONSUL', 'OFFICER', 'VIEWER'], badgeKey: 'cidadaos' },
        { icon: 'flight', labelKey: 'nav.vistos', route: '/vistos', roles: ['ADMIN', 'CONSUL', 'OFFICER', 'CITIZEN', 'VIEWER'], badgeKey: 'vistos' },
        { icon: 'event', labelKey: 'nav.agendamentos', route: '/agendamentos', roles: ['ADMIN', 'CONSUL', 'OFFICER', 'CITIZEN', 'VIEWER'] },
      ],
    },
    {
      label: 'Operações',
      items: [
        { icon: 'article', labelKey: 'nav.registosCivis', route: '/registos-civis', roles: ['ADMIN', 'CONSUL', 'OFFICER', 'CITIZEN', 'VIEWER'] },
        { icon: 'gavel', labelKey: 'nav.servicosNotariais', route: '/servicos-notariais', roles: ['ADMIN', 'CONSUL', 'OFFICER', 'CITIZEN', 'VIEWER'] },
        { icon: 'folder', labelKey: 'nav.documentos', route: '/documentos', roles: ['ADMIN', 'CONSUL', 'OFFICER', 'CITIZEN', 'VIEWER'] },
      ],
    },
    {
      label: 'Sistema',
      pushToBottom: true,
      items: [
        { icon: 'account_tree', labelKey: 'nav.workflowAdmin', route: '/workflow-admin', roles: ['ADMIN', 'CONSUL'] },
        { icon: 'manage_accounts', labelKey: 'nav.userAdmin', route: '/user-admin', roles: ['ADMIN', 'CONSUL'] },
        { icon: 'assessment', labelKey: 'nav.relatorios', route: '/relatorios', roles: ['ADMIN', 'CONSUL'] },
        { icon: 'notifications', labelKey: 'nav.notificacoes', route: '/notificacoes', roles: ['ADMIN', 'CONSUL', 'OFFICER'] },
      ],
    },
  ];

  constructor() {
    this.translate.setDefaultLang('pt');
    const saved = localStorage.getItem(App.LANG_KEY);
    const lang = saved && ['pt', 'en', 'de', 'cs'].includes(saved) ? saved : 'pt';
    this.currentLang.set(lang);
    this.translate.use(lang);
  }

  ngOnInit(): void {
    const tokenParsed = this.keycloak.getKeycloakInstance()?.tokenParsed as Record<string, string> | undefined;
    this.username.set(tokenParsed?.['preferred_username'] ?? 'User');
    this.userRoles.set(this.keycloak.getUserRoles());
    this.citizenContext.init();

    this.loadNavBadges();

    this.breakpointObserver.observe(['(max-width: 768px)']).subscribe(result => {
      if (result.matches) {
        this.sidenavMode.set('over');
        this.sidenavOpened.set(false);
      } else {
        this.sidenavMode.set('side');
        this.sidenavOpened.set(true);
      }
    });
  }

  toggleSidenav(): void {
    this.sidenav.toggle();
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
    this.currentLang.set(lang);
    localStorage.setItem(App.LANG_KEY, lang);
    document.documentElement.lang = lang;
  }

  private loadNavBadges(): void {
    this.relatorioService.getDashboard().subscribe({
      next: (d) => {
        const badges: Record<string, number> = {};
        if (d.totalGeral) badges['cidadaos'] = d.totalGeral;
        const pendingVisas = ['SUBMETIDO', 'EM_ANALISE', 'DOCUMENTOS_PENDENTES']
          .reduce((sum, s) => sum + (d.visas?.porEstado?.[s] ?? 0), 0);
        if (pendingVisas) badges['vistos'] = pendingVisas;
        this.navBadges.set(badges);
      },
    });
  }

  getBadge(item: NavItem): number {
    if (!item.badgeKey) return 0;
    return this.navBadges()[item.badgeKey] ?? 0;
  }

  onSearch(event: Event): void {
    const value = (event.target as HTMLInputElement).value?.trim();
    if (value) {
      this.router.navigate(['/cidadaos'], { queryParams: { q: value } });
    }
  }

  logout(): void {
    this.keycloak.logout();
  }
}
