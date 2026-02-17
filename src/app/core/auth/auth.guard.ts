import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { KeycloakService } from 'keycloak-angular';

export const authGuard: CanActivateFn = () => {
  const keycloak = inject(KeycloakService);

  if (keycloak.isLoggedIn()) {
    return true;
  }

  keycloak.login();
  return false;
};
