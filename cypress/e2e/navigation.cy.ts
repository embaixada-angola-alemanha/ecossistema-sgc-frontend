describe('Navigation & Layout', () => {
  beforeEach(() => {
    cy.login('ADMIN');
  });

  it('should display sidebar with embassy branding', () => {
    cy.visit('/');
    cy.get('.brand-title').should('contain', 'Embaixada de Angola');
    cy.get('.emblem').should('contain', 'EA');
  });

  it('should redirect to dashboard by default', () => {
    cy.visit('/');
    cy.url().should('include', '/dashboard');
  });

  it('should navigate to citizens page', () => {
    cy.visit('/');
    cy.get('.nav-item').contains('Cidadaos').click();
    cy.url().should('include', '/cidadaos');
  });

  it('should toggle sidebar', () => {
    cy.visit('/');
    cy.get('.app-sidenav').should('be.visible');
    cy.get('.menu-toggle').click();
    cy.get('.app-sidenav').should('not.be.visible');
    cy.get('.menu-toggle').click();
    cy.get('.app-sidenav').should('be.visible');
  });

  it('should have skip link for accessibility', () => {
    cy.visit('/');
    cy.get('.skip-link').should('exist');
    cy.get('.skip-link').focus().should('be.visible');
  });

  it('should show language switcher with active language', () => {
    cy.visit('/');
    cy.get('.lang-btn').should('exist');
    cy.get('.lang-code').should('contain', 'PT');
  });
});
