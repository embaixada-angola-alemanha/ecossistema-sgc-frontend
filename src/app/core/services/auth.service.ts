import { Injectable, inject } from '@angular/core';
import { KeycloakService } from 'keycloak-angular';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly keycloak = inject(KeycloakService);

  getUsername(): string {
    const tokenParsed = this.keycloak.getKeycloakInstance()?.tokenParsed as Record<string, string> | undefined;
    return tokenParsed?.['preferred_username'] ?? 'User';
  }

  getUserRoles(): string[] {
    return this.keycloak.getUserRoles();
  }

  hasRole(role: string): boolean {
    return this.keycloak.getUserRoles().includes(role);
  }

  hasAnyRole(...roles: string[]): boolean {
    const userRoles = this.keycloak.getUserRoles();
    return roles.some((role) => userRoles.includes(role));
  }

  isAdmin(): boolean {
    return this.hasRole('ADMIN');
  }

  isConsul(): boolean {
    return this.hasRole('CONSUL');
  }

  async getToken(): Promise<string> {
    return this.keycloak.getToken();
  }

  logout(): void {
    this.keycloak.logout();
  }
}
