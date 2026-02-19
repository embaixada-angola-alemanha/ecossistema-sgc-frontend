describe('i18n - Language Switching', () => {
  beforeEach(() => {
    cy.login('ADMIN');
  });

  it('should default to Portuguese', () => {
    cy.visit('/');
    cy.get('.lang-code').should('contain', 'PT');
    cy.get('.brand-title').should('contain', 'Embaixada de Angola');
  });

  it('should switch to English', () => {
    cy.visit('/');
    cy.get('.lang-btn').click();
    cy.contains('English').click();
    cy.get('.lang-code').should('contain', 'EN');
  });

  it('should switch to German', () => {
    cy.visit('/');
    cy.get('.lang-btn').click();
    cy.contains('Deutsch').click();
    cy.get('.lang-code').should('contain', 'DE');
  });

  it('should persist language preference', () => {
    cy.visit('/');
    cy.get('.lang-btn').click();
    cy.contains('English').click();
    cy.reload();
    cy.get('.lang-code').should('contain', 'EN');
  });
});
