describe('Authorization & Access Control', () => {
  it('should redirect to unauthorized page for restricted routes', () => {
    cy.login('VIEWER');
    cy.visit('/workflow-admin');
    cy.url().should('include', '/unauthorized');
  });

  it('should show unauthorized message', () => {
    cy.login('VIEWER');
    cy.visit('/unauthorized');
    cy.contains('Acesso Negado').should('be.visible');
  });

  it('should allow ADMIN to access all pages', () => {
    cy.login('ADMIN');
    cy.visit('/cidadaos');
    cy.url().should('include', '/cidadaos');
  });

  it('should hide admin nav items for non-admin users', () => {
    cy.login('VIEWER');
    cy.visit('/');
    cy.get('.nav-item').contains('Utilizadores').should('not.exist');
  });

  it('should show admin nav items for ADMIN users', () => {
    cy.login('ADMIN');
    cy.visit('/');
    cy.get('.nav-item').contains('Workflow').should('be.visible');
  });
});
