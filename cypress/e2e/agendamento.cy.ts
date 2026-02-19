describe('Agendamento Module', () => {
  beforeEach(() => {
    cy.login('ADMIN');
    cy.fixture('agendamento').then((data) => {
      cy.intercept('GET', '**/api/v1/agendamentos?*', data.list).as('getAgendamentos');
    });
  });

  it('should display appointment list', () => {
    cy.visit('/agendamentos');
    cy.wait('@getAgendamentos');
    cy.contains('João Silva').should('be.visible');
    cy.contains('AG-2026-001').should('be.visible');
  });

  it('should navigate to create appointment', () => {
    cy.visit('/agendamentos');
    cy.wait('@getAgendamentos');
    cy.contains('button', 'Novo').click();
    cy.url().should('include', '/agendamentos/new');
  });

  it('should show error on API failure', () => {
    cy.intercept('GET', '**/api/v1/agendamentos?*', { statusCode: 500 }).as('getAgendamentosFail');
    cy.visit('/agendamentos');
    cy.wait('@getAgendamentosFail');
    cy.get('.mat-mdc-snack-bar-container').should('be.visible');
  });
});
