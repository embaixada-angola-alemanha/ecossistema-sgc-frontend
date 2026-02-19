# ecossistema-sgc-frontend

**SGC -- Sistema de Gestao Consular (Frontend)**

Parte do [Ecossistema Digital da Embaixada de Angola na Alemanha](https://github.com/embaixada-angola-alemanha/ecossistema-project).

Interface web para gestao consular com tema "Diplomacia Classica" (dark + gold). Suporta gestao de cidadaos, processamento de vistos, agendamentos, registo civil, servicos notariais, gestao documental, notificacoes e relatorios -- com self-service para cidadaos (Meu Perfil).

---

## Stack Tecnologica

| Camada | Tecnologia |
|---|---|
| Framework | Angular 21 (standalone components) |
| UI Library | Angular Material 21 + Angular CDK |
| Linguagem | TypeScript 5.9 |
| Estilos | SCSS (tema personalizado "Diplomacia Classica") |
| Autenticacao | Keycloak Angular 21 + Keycloak JS 26 |
| i18n | ngx-translate (PT / EN / DE / CS) |
| Estado | RxJS 7.8 |
| Testes E2E | Cypress 15 |
| Testes Unitarios | Vitest 4 |
| Build | Angular CLI 21 |
| Container | Docker (Nginx 1.25 Alpine) |
| Porta (dev) | 3001 |

---

## Estrutura do Projecto

```
src/
  main.ts                           # Bootstrap da aplicacao
  styles.scss                       # Estilos globais (tema Diplomacia Classica)
  assets/
    i18n/
      pt.json                       # Portugues (idioma principal)
      en.json                       # Ingles
      de.json                       # Alemao
      cs.json                       # Checo
  environments/
    environment.ts                  # Desenvolvimento
    environment.staging.ts          # Staging
    environment.prod.ts             # Producao
  app/
    app.ts                          # Componente raiz
    app.routes.ts                   # Rotas da aplicacao (lazy loading)
    app.config.ts                   # Configuracao de providers
    core/                           # Modulo core (singleton)
      auth/
        auth.guard.ts               #   Guard de autenticacao
        auth.interceptor.ts         #   Interceptor de tokens JWT
        keycloak.init.ts            #   Inicializacao do Keycloak
        role.guard.ts               #   Guard de autorizacao por role
      models/                       # Interfaces e modelos (10 modelos)
        cidadao.model.ts            #   Modelo de cidadao
        visto.model.ts              #   Modelo de visto
        agendamento.model.ts        #   Modelo de agendamento
        documento.model.ts          #   Modelo de documento
        registo-civil.model.ts      #   Modelo de registo civil
        servico-notarial.model.ts   #   Modelo de servico notarial
        relatorio.model.ts          #   Modelo de relatorios
        workflow.model.ts           #   Modelo de workflow
        user-admin.model.ts         #   Modelo de gestao de utilizadores
        api-response.model.ts       #   Modelo generico de resposta API
      services/                     # Servicos HTTP (11 servicos)
        auth.service.ts             #   Autenticacao e sessao
        cidadao.service.ts          #   API de cidadaos
        visto.service.ts            #   API de vistos
        agendamento.service.ts      #   API de agendamentos
        documento.service.ts        #   API de documentos
        registo-civil.service.ts    #   API de registo civil
        servico-notarial.service.ts #   API de servicos notariais
        relatorio.service.ts        #   API de relatorios
        workflow.service.ts         #   API de workflow
        citizen-context.service.ts  #   Contexto do cidadao autenticado
        user-admin.service.ts       #   Gestao de utilizadores
    features/                       # Modulos de funcionalidades (lazy loaded)
      dashboard/                    #   Dashboard principal (resumo e KPIs)
        dashboard-home/
      cidadao/                      #   Gestao de cidadaos
        cidadao-list/               #     Lista com filtros e paginacao
        cidadao-form/               #     Formulario de criacao/edicao
        cidadao-detail/             #     Detalhe do cidadao
        meu-perfil/                 #     Self-service do cidadao
      visto/                        #   Processamento de vistos
      agendamento/                  #   Agendamentos consulares
        agendamento-list/           #     Lista de agendamentos
        agendamento-form/           #     Formulario de agendamento
        agendamento-detail/         #     Detalhe do agendamento
      documento/                    #   Gestao de documentos
        documento-list/             #     Lista de documentos
        documento-upload/           #     Upload de documentos
        documento-detail/           #     Detalhe do documento
      registo-civil/                #   Registo civil (nascimento/casamento/obito)
      servico-notarial/             #   Servicos notariais
      relatorio/                    #   Relatorios (dashboard, PDF, CSV)
      notificacao/                  #   Gestao de notificacoes
      workflow-admin/               #   Administracao de workflows (ADMIN/CONSUL)
      user-admin/                   #   Gestao de utilizadores (ADMIN/CONSUL)
      unauthorized/                 #   Pagina de acesso negado
    shared/                         # Componentes partilhados
      components/
        confirm-dialog/             #   Dialogo de confirmacao
        loading-spinner/            #   Indicador de carregamento
        status-badge/               #   Badge de estado (workflow)
        workflow-stepper/           #   Stepper de progresso do workflow
      styles/
        _mixins.scss                #   Mixins SCSS reutilizaveis

cypress/                            # Testes E2E
  e2e/
    auth.cy.ts                      #   Testes de autenticacao
    cidadao.cy.ts                   #   Testes de cidadaos
    visto.cy.ts                     #   Testes de vistos
    agendamento.cy.ts               #   Testes de agendamentos
    documento.cy.ts                 #   Testes de documentos
    navigation.cy.ts                #   Testes de navegacao
    i18n.cy.ts                      #   Testes de internacionalizacao
```

---

## Funcionalidades Principais

### Rotas e Navegacao

| Rota | Modulo | Acesso |
|---|---|---|
| `/dashboard` | Dashboard | Todos os utilizadores autenticados |
| `/cidadaos` | Cidadaos | Todos os utilizadores autenticados |
| `/vistos` | Vistos | Todos os utilizadores autenticados |
| `/agendamentos` | Agendamentos | Todos os utilizadores autenticados |
| `/documentos` | Documentos | Todos os utilizadores autenticados |
| `/registos-civis` | Registo Civil | Todos os utilizadores autenticados |
| `/servicos-notariais` | Servicos Notariais | Todos os utilizadores autenticados |
| `/workflow-admin` | Admin Workflows | ADMIN, CONSUL |
| `/user-admin` | Admin Utilizadores | ADMIN, CONSUL |
| `/relatorios` | Relatorios | ADMIN, CONSUL |
| `/notificacoes` | Notificacoes | ADMIN, CONSUL, OFFICER |

### Tema "Diplomacia Classica"

Tema escuro com acentos em dourado, inspirado na identidade visual diplomatica angolana.

### Internacionalizacao (i18n)

Suporte completo para 4 idiomas:
- **PT** -- Portugues (idioma principal)
- **EN** -- Ingles
- **DE** -- Alemao
- **CS** -- Checo

### Self-Service do Cidadao

Cidadaos autenticados podem aceder ao **Meu Perfil** para:
- Consultar dados pessoais
- Acompanhar processos
- Gerir documentos
- Marcar agendamentos

---

## Como Executar

### Pre-requisitos

- Node.js 20+
- npm 11+
- Angular CLI 21

### Desenvolvimento Local

```bash
# Clonar o repositorio
git clone https://github.com/embaixada-angola-alemanha/ecossistema-sgc-frontend.git
cd ecossistema-sgc-frontend

# Instalar dependencias
npm install

# Iniciar servidor de desenvolvimento (porta 3001)
npm start

# A aplicacao fica disponivel em http://localhost:3001
```

### Testes

```bash
# Testes unitarios (Vitest)
npm test

# Testes E2E com Cypress (interactivo)
npm run cy:open

# Testes E2E com Cypress (headless, Chrome)
npm run e2e
```

### Build para Producao

```bash
# Build de producao
npm run build

# Build de staging
npx ng build --configuration=staging

# Docker
docker build -t ecossistema-sgc-frontend .
docker run -p 80:80 ecossistema-sgc-frontend
```

---

## Configuracao de Ambiente

### Ficheiros de Ambiente

| Ficheiro | Uso |
|---|---|
| `src/environments/environment.ts` | Desenvolvimento local |
| `src/environments/environment.staging.ts` | Staging |
| `src/environments/environment.prod.ts` | Producao |

### Configuracao do Proxy (Dev)

O ficheiro `src/proxy.conf.json` redireciona chamadas `/api` para o backend local em `http://localhost:8081`.

### URLs de Producao

- **Frontend:** `https://sgc.embaixada-angola.site`
- **Backend API:** `https://sgc-api.embaixada-angola.site`
- **Keycloak:** `https://auth.embaixada-angola.site`

### Configuracoes do Build

| Configuracao | Descricao |
|---|---|
| `development` | Sem optimizacao, source maps activos |
| `staging` | Optimizado, hashing, environment de staging |
| `production` | Optimizado, hashing, environment de producao |

**Budget limits (producao):**
- Bundle inicial: max 2MB (warning a 1MB)
- Estilo por componente: max 8kB (warning a 6kB)

---

## Seguranca

- **Keycloak Angular** para autenticacao OIDC
- **Auth Guard** protege todas as rotas
- **Role Guard** restringe rotas administrativas (`ADMIN`, `CONSUL`)
- **Interceptor HTTP** adiciona token JWT a todos os pedidos
- **Navegacao baseada em roles** -- menus adaptam-se ao perfil do utilizador

---

## Projecto Principal

Este repositorio faz parte do **Ecossistema Digital da Embaixada de Angola na Alemanha**.

Repositorio principal: https://github.com/embaixada-angola-alemanha/ecossistema-project
