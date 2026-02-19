/// <reference types="cypress" />

declare namespace Cypress {
  interface Chainable {
    /** Bypass Keycloak login by setting a mock token */
    login(role?: string): Chainable<void>;
    /** Get element by data-cy attribute */
    getByCy(selector: string): Chainable<JQuery<HTMLElement>>;
    /** Wait for loading spinner to disappear */
    waitForLoad(): Chainable<void>;
  }
}

// Bypass Keycloak by intercepting the init call and providing mock token/roles
Cypress.Commands.add('login', (role: string = 'ADMIN') => {
  const roles = [role];

  // Intercept Keycloak token endpoint
  cy.intercept('POST', '**/realms/ecossistema/protocol/openid-connect/token', {
    statusCode: 200,
    body: {
      access_token: 'mock-access-token',
      token_type: 'Bearer',
      expires_in: 3600,
      refresh_token: 'mock-refresh-token',
    },
  }).as('keycloakToken');

  // Intercept Keycloak userinfo
  cy.intercept('GET', '**/realms/ecossistema/protocol/openid-connect/userinfo', {
    statusCode: 200,
    body: {
      sub: 'mock-user-id',
      preferred_username: 'test.admin',
      email: 'admin@embassy.ao',
      realm_access: { roles },
    },
  }).as('keycloakUserinfo');

  // Set mock auth state in localStorage/sessionStorage
  window.localStorage.setItem('sgc-lang', 'pt');
});

Cypress.Commands.add('getByCy', (selector: string) => {
  return cy.get(`[data-cy="${selector}"]`);
});

Cypress.Commands.add('waitForLoad', () => {
  cy.get('sgc-loading-spinner', { timeout: 1000 }).should('not.exist');
});
