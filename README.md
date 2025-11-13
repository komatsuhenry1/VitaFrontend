# Vita App - Frontend (Next.js)

[![Next.js](https://img.shields.io/badge/Next.js-14%2B-black.svg)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-18%2B-blue.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-blue.svg)](https://www.typescriptlang.org/)
[![Vercel](https://img.shields.io/badge/deploy-Vercel-black.svg)](https://vercel.com/)

## 📖 Visão Geral

Este é o repositório do frontend da **Vita API**, a interface de usuário construída com **Next.js** e o **App Router**. Esta aplicação consome a [API de backend Vita (Go/Gin)](https://github.com/seu-usuario/vita_backend) e fornece os portais para Pacientes, Enfermeiros e Administradores.

## 🚀 Funcionalidades Principais

* **Portais Baseados em Rota:** Arquitetura moderna usando o App Router do Next.js para separar as lógicas de `auth`, `dashboard`, `patient`, `nurse-profile`, etc.
* **Portal do Paciente:** Permite ao paciente se cadastrar, buscar enfermeiros (com filtro de mapa usando **Leaflet**), agendar visitas (agendadas e imediatas), gerenciar seu histórico e conversar em tempo real.
* **Portal do Enfermeiro:** Permite ao enfermeiro gerenciar seu perfil, ficar online/offline, aceitar/rejeitar visitas, preencher prontuários e realizar o onboarding de pagamentos via **Stripe Connect**.
* **Portal do Admin:** Dashboard para aprovação de cadastros de enfermeiros, gerenciamento de usuários (`users-management`) e visualização de métricas da plataforma.
* **Chat em Tempo Real:** Interface de chat que se conecta ao backend via **WebSocket** para mensagens instantâneas.
* **Fluxo de Pagamento:** Integração com **Stripe.js** para coletar dados de pagamento e processar o `PaymentIntent` criado pelo backend.

---

## 💻 Stack Tecnológica

* **Framework:** Next.js (com App Router)
* **Linguagem:** TypeScript
* **UI:** React
* **Mapas:** Leaflet e React-Leaflet
* **Pagamentos:** Stripe.js
* **Comunicação (API):** Axios (ou Fetch) para chamadas REST
* **Comunicação (Chat):** `socket.io-client` (ou WebSocket nativo)
* **Gerenciamento de Estado:** React Context (baseado na pasta `/context`)
* **Hooks:** Hooks customizados (`/hooks`) para encapsular lógicas (ex: `useAuth`).

---

## 🏁 Começando (Guia para Novos Desenvolvedores)

Siga estas instruções para configurar e executar o projeto localmente.

### Pré-requisitos

* **Node.js**: Versão 18.x ou superior.
* **npm** ou **yarn** (ou `pnpm`).
* **Backend Rodando:** A [API de backend (Go/Gin)](https://github.com/seu-usuario/vita_backend) **deve** estar rodando localmente (ex: em `http://localhost:8081`).

### Instalação e Execução

1.  **Clone o repositório:**
    ```bash
    git clone https://github.com/komatsuhenry1/VitaFrontend
    cd vita_frontend
    ```

2.  **Instale as dependências:**
    ```bash
    npm install
    # ou
    yarn install
    ```

3.  **Configure suas Variáveis de Ambiente:**
    * Crie uma cópia do arquivo de exemplo `.env.example` (se houver) e renomeie para `.env.local`.
    * Preencha as variáveis necessárias (veja a seção abaixo).

4.  **Execute o servidor de desenvolvimento:**
    ```bash
    npm run dev
    # ou
    yarn dev
    ```

O servidor será iniciado e estará disponível em **[http://localhost:3000](http://localhost:3000)**.

---

## 🔒 Variáveis de Ambiente

Para rodar a aplicação, crie um arquivo `.env.local` na raiz do projeto.

```dotenv
# OBRIGATÓRIO: URL base da sua API backend
NEXT_PUBLIC_API_URL=http://localhost:8081/api/v1

# OBRIGATÓRIO: URL do seu servidor WebSocket
NEXT_PUBLIC_WS_URL=ws://localhost:8081/ws/chat

# OBRIGATÓRIO: Chave publicável do Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# (Adicione quaisquer outras chaves públicas necessárias)