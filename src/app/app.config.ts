import { ApplicationConfig, APP_INITIALIZER, importProvidersFrom, LOCALE_ID } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { registerLocaleData } from '@angular/common';
import localePt from '@angular/common/locales/pt';
import localeDe from '@angular/common/locales/de';
import localeEn from '@angular/common/locales/en';
import localeCs from '@angular/common/locales/cs';
import { KeycloakAngularModule, KeycloakService } from 'keycloak-angular';
import { TranslateModule } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';
import { routes } from './app.routes';
import { initializeKeycloak } from './core/auth/keycloak.init';
import { authInterceptor } from './core/auth/auth.interceptor';

registerLocaleData(localePt, 'pt');
registerLocaleData(localeDe, 'de');
registerLocaleData(localeEn, 'en');
registerLocaleData(localeCs, 'cs');

function getInitialLocale(): string {
  const saved = localStorage.getItem('sgc-lang');
  const map: Record<string, string> = { pt: 'pt', de: 'de', en: 'en', cs: 'cs' };
  return map[saved ?? 'pt'] ?? 'pt';
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideAnimationsAsync(),
    importProvidersFrom(
      KeycloakAngularModule,
      TranslateModule.forRoot({
        fallbackLang: 'pt',
      }),
    ),
    provideTranslateHttpLoader({ prefix: './assets/i18n/', suffix: '.json' }),
    { provide: LOCALE_ID, useFactory: getInitialLocale },
    KeycloakService,
    {
      provide: APP_INITIALIZER,
      useFactory: initializeKeycloak,
      multi: true,
      deps: [KeycloakService],
    },
  ],
};
