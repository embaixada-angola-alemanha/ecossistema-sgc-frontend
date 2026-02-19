describe('Documento Module', () => {
  beforeEach(() => {
    cy.login('ADMIN');
    cy.fixture('documento').then((data) => {
      cy.intercept('GET', '**/api/v1/documentos?*', data.list).as('getDocumentos');
    });
    cy.fixture('cidadao').then((data) => {
      cy.intercept('GET', '**/api/v1/cidadaos?*', data.list).as('getCidadaos');
    });
  });

  it('should display document list', () => {
    cy.visit('/documentos');
    cy.wait('@getDocumentos');
    cy.get('table').should('exist');
    cy.contains('DOC-001').should('be.visible');
  });

  it('should filter documents by type', () => {
    cy.visit('/documentos');
    cy.wait('@getDocumentos');
    cy.get('mat-select').first().click();
    cy.get('mat-option').contains('Passaporte').click();
  });

  it('should show error on API failure', () => {
    cy.intercept('GET', '**/api/v1/documentos?*', { statusCode: 500 }).as('getDocumentosFail');
    cy.visit('/documentos');
    cy.wait('@getDocumentosFail');
    cy.get('.mat-mdc-snack-bar-container').should('be.visible');
  });
});
