describe('Visto Module', () => {
  beforeEach(() => {
    cy.login('ADMIN');
    cy.fixture('visto').then((data) => {
      cy.intercept('GET', '**/api/v1/vistos?*', data.list).as('getVistos');
    });
    cy.fixture('cidadao').then((data) => {
      cy.intercept('GET', '**/api/v1/cidadaos?*', data.list).as('getCidadaos');
    });
  });

  it('should display visa list with columns', () => {
    cy.visit('/vistos');
    cy.wait('@getVistos');
    cy.get('table').should('exist');
    cy.contains('João Silva').should('be.visible');
    cy.contains('VT-2026-001').should('be.visible');
    cy.get('sgc-status-badge').should('have.length.greaterThan', 0);
  });

  it('should filter by tipo', () => {
    cy.visit('/vistos');
    cy.wait('@getVistos');
    cy.get('mat-select').eq(1).click();
    cy.get('mat-option').contains('Turista').click();
    cy.wait('@getVistos');
  });

  it('should filter by estado', () => {
    cy.visit('/vistos');
    cy.wait('@getVistos');
    cy.get('mat-select').first().click();
    cy.get('mat-option').contains('Submetido').click();
    cy.wait('@getVistos');
  });

  it('should open visa detail dialog', () => {
    cy.fixture('visto').then((data) => {
      cy.intercept('GET', '**/api/v1/vistos/v1', {
        success: true,
        data: data.list.data.content[0],
      }).as('getVisto');
    });
    cy.visit('/vistos');
    cy.wait('@getVistos');
    cy.contains('João Silva').click();
    cy.wait('@getVisto');
    cy.get('mat-dialog-container').should('be.visible');
  });

  it('should navigate to create visa form', () => {
    cy.visit('/vistos');
    cy.wait('@getVistos');
    cy.contains('button', 'Novo').click();
    cy.url().should('include', '/vistos/new');
  });

  it('should show actions menu with state transitions', () => {
    cy.visit('/vistos');
    cy.wait('@getVistos');
    cy.get('button[mat-icon-button]').first().click();
    cy.get('mat-menu').should('be.visible');
    cy.contains('Detalhes').should('be.visible');
  });

  it('should handle empty results', () => {
    cy.intercept('GET', '**/api/v1/vistos?*', {
      success: true,
      data: { content: [], page: 0, size: 20, totalElements: 0, totalPages: 0, last: true },
    }).as('getVistosEmpty');
    cy.visit('/vistos');
    cy.wait('@getVistosEmpty');
    cy.get('.no-data').should('be.visible');
  });
});
