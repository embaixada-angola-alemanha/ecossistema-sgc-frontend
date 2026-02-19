describe('Cidadão Module', () => {
  beforeEach(() => {
    cy.login('ADMIN');
    cy.fixture('cidadao').then((data) => {
      cy.intercept('GET', '**/api/v1/cidadaos?*', data.list).as('getCidadaos');
      cy.intercept('GET', '**/api/v1/cidadaos/c1', data.single).as('getCidadao');
    });
  });

  it('should display citizen list with data', () => {
    cy.visit('/cidadaos');
    cy.wait('@getCidadaos');
    cy.get('table').should('exist');
    cy.get('mat-row').should('have.length.greaterThan', 0);
    cy.contains('João Silva').should('be.visible');
    cy.contains('Maria Santos').should('be.visible');
  });

  it('should filter citizens by search', () => {
    cy.visit('/cidadaos');
    cy.wait('@getCidadaos');
    cy.get('input[matInput]').first().type('João');
    // debounce triggers new request
    cy.wait('@getCidadaos');
  });

  it('should open citizen detail dialog', () => {
    cy.visit('/cidadaos');
    cy.wait('@getCidadaos');
    cy.contains('João Silva').click();
    cy.wait('@getCidadao');
    cy.get('mat-dialog-container').should('be.visible');
    cy.contains('N1234567').should('be.visible');
  });

  it('should navigate to create citizen form', () => {
    cy.visit('/cidadaos');
    cy.wait('@getCidadaos');
    cy.contains('button', 'Novo').click();
    cy.url().should('include', '/cidadaos/new');
  });

  it('should show error on API failure', () => {
    cy.intercept('GET', '**/api/v1/cidadaos?*', { statusCode: 500 }).as('getCidadaosFail');
    cy.visit('/cidadaos');
    cy.wait('@getCidadaosFail');
    cy.get('.mat-mdc-snack-bar-container').should('be.visible');
  });
});
