# 🎓 University Access — Backend

> Sistema IoT de controle de acesso universitário com QR Code dinâmico, registro acadêmico e painel administrativo em tempo real.

**Projeto Acadêmico SENAC · Equipe Backend · 2026**  
Stack: `Node.js` · `TypeScript` · `Express` · `Prisma` · `PostgreSQL` · `MQTT` · `JWT` · `Zod`

---
## Links de Acesso
- 📄 Documentação (PDF): https://drive.google.com/drive/folders/1lfU03CTqzepUgFVrY8skikwuAItdE72g
- 💻 Backend: https://github.com/ViniciusMLAraujo/ProjetoPIBack/tree/feat/roni-foundations
- 📱 Frontend: https://github.com/isabel-vit309/Front-Smart-Campus

## Sumário

- [Visão geral](#visão-geral)
- [Arquitetura](#arquitetura)
- [Pré-requisitos](#pré-requisitos)
- [Configuração do ambiente](#configuração-do-ambiente)
- [Banco de dados](#banco-de-dados)
- [Rodando o servidor](#rodando-o-servidor)
- [Testes](#testes)
- [Estrutura do projeto](#estrutura-do-projeto)
- [Endpoints disponíveis](#endpoints-disponíveis)
- [Autenticação](#autenticação)
- [Fluxo do QR Code](#fluxo-do-qr-code)
- [Divisão de responsabilidades](#divisão-de-responsabilidades)
- [Padrão de commits](#padrão-de-commits)
- [Variáveis de ambiente](#variáveis-de-ambiente)

---

## Visão geral

O sistema substitui o crachá físico universitário por um **QR Code dinâmico** gerado no app mobile. O aluno aponta o QR para a catraca, o ESP32 lê e publica via MQTT, o backend valida e responde com `OPEN` ou `DENY`. Em paralelo, professores lançam presença e conceitos pelo painel — fluxo completamente independente do acesso físico.

### O que cada perfil faz

| Perfil | Ação |
|---|---|
| **Aluno** | Gera QR Code, acessa o prédio, consulta presenças e conceitos |
| **Professor** | Lança presença e conceito por aula |
| **Admin** | Vê quem está no prédio agora, relatórios de fluxo, gestão de usuários |

---

## Arquitetura

```
┌─────────────────┐     MQTT      ┌──────────────────────┐     REST/JSON    ┌──────────────────┐
│  ESP32 + Câmera │ ────────────► │  Backend Node.js      │ ◄─────────────── │  App React Native │
│  (catraca)      │ ◄──────────── │  (este repositório)   │                  │  (outra equipe)  │
└─────────────────┘  OPEN / DENY  └──────────────────────┘                  └──────────────────┘
                                           │
                                           ▼
                                   ┌──────────────┐
                                   │  PostgreSQL   │
                                   └──────────────┘
```

**Dois protocolos, dois propósitos:**
- **MQTT** — comunicação leve com o hardware (ESP32 → backend → catraca)
- **REST/HTTP** — comunicação estruturada com o app mobile (JWT + JSON)

---

## Pré-requisitos

- [Node.js](https://nodejs.org/) v20+
- [Docker](https://www.docker.com/) e Docker Compose
- [npm](https://www.npmjs.com/) v9+

---

## Configuração do ambiente

### 1. Clonar o repositório

```bash
git clone https://github.com/ViniciusMLAraujo/ProjetoPIBack.git
cd university-access
```

### 2. Instalar dependências

```bash
npm install
```

### 3. Configurar variáveis de ambiente

```bash
cp .env.example .env
```

Edite o `.env` com suas credenciais. Veja a seção [Variáveis de ambiente](#variáveis-de-ambiente) para detalhes.

---

## Banco de dados

### Subir o PostgreSQL via Docker

```bash
docker-compose up -d
```

### Rodar as migrations

```bash
npx prisma migrate dev
```

### Gerar o cliente Prisma (após qualquer mudança no schema)

```bash
npx prisma generate
```

### Popular o banco com dados iniciais (seed)

```bash
npm run db:seed
```

Cria um usuário admin padrão:
- **Email:** `admin@teste.com`
- **Senha:** `123456`

> ⚠️ Use apenas em desenvolvimento. Nunca rode o seed em produção.

### Visualizar o banco no navegador

```bash
npm run db:studio
# Abre em http://localhost:5555
```

---

## Rodando o servidor

```bash
# Desenvolvimento (hot reload)
npm run dev

# Produção
npm run build
npm start
```

O servidor sobe em `http://localhost:3000` (ou na porta definida em `PORT` no `.env`).

Verifique se está rodando:
```bash
curl http://localhost:3000/health
# { "status": "ok", "timestamp": "..." }
```

---

## Testes

```bash
# Rodar todos os testes
npm test

# Com relatório de cobertura
npm run test:coverage
```

Os testes usam **Jest + ts-jest** com mocks do Prisma — nenhuma conexão real com banco é necessária. A cobertura mínima exigida é 70% em branches, funções e linhas.

### Testes implementados (Sprint 1)

| Arquivo | Casos cobertos |
|---|---|
| `auth.service.test.ts` | login com usuário inexistente, senha errada, login válido; createUser com e-mail duplicado e com senha hasheada; hashPassword |
| `auth.middleware.test.ts` | requisição sem token, token inválido, token válido populando `req.user`; requireRole bloqueando e permitindo roles |
| `auth.routes.test.ts` | POST /login com body inválido, usuário inexistente e login válido; GET /me sem token e com token; GET /health |

---

## Estrutura do projeto

```
university-access/
├── prisma/
│   ├── schema.prisma          # Blueprint do banco — todas as tabelas e relações
│   ├── seed.ts                # Popula o banco com dados iniciais de teste
│   └── migrations/            # Histórico de mudanças no banco (gerado pelo Prisma)
│
├── src/
│   ├── config/
│   │   ├── env.ts             # Lê e valida variáveis de ambiente
│   │   └── prisma.ts          # Instância singleton do PrismaClient
│   │
│   ├── modules/               # Funcionalidades — um módulo por domínio
│   │   ├── auth/              # Login, JWT, criação de usuário ✅ Sprint 1
│   │   ├── students/          # CRUD de alunos 🔜 Sprint 1 (Dev 2)
│   │   ├── courses/           # CRUD de disciplinas 🔜 Sprint 1 (Dev 2)
│   │   ├── rooms/             # CRUD de salas 🔜 Sprint 1 (Dev 3)
│   │   ├── schedules/         # CRUD de horários 🔜 Sprint 1 (Dev 3)
│   │   ├── qrcode/            # Geração e validação de QR Code 🔜 Sprint 2
│   │   ├── access/            # Registro de entrada/saída + MQTT 🔜 Sprint 2
│   │   ├── attendance/        # Presença e conceitos acadêmicos 🔜 Sprint 3
│   │   └── reports/           # Relatórios e painel admin 🔜 Sprint 3
│   │
│   ├── shared/
│   │   ├── middlewares/
│   │   │   ├── auth.middleware.ts   # authMiddleware + requireRole ✅
│   │   │   └── error.middleware.ts  # Handler global de erros ✅
│   │   ├── utils/             # Funções auxiliares genéricas
│   │   └── mqtt/              # Cliente MQTT 🔜 Sprint 2
│   │
│   ├── __mocks__/             # Mocks do Prisma para os testes
│   ├── __tests__/             # Testes automatizados
│   └── server.ts              # Ponto de entrada — Express + rotas
│
├── .env.example               # Modelo de variáveis de ambiente
├── jest.config.js
├── tsconfig.json
└── package.json
```

Cada módulo segue o padrão de três arquivos:

| Arquivo | Responsabilidade |
|---|---|
| `service.ts` | Lógica de negócio, acesso ao banco via Prisma |
| `routes.ts` | Definição de endpoints, validação com Zod, repasse de erros |
| `validation.ts` | Schemas Zod reutilizáveis |

---

## Endpoints disponíveis

### Implementados (Sprint 1) ✅

| Método | Endpoint | Acesso | Descrição |
|---|---|---|---|
| `POST` | `/api/auth/login` | Público | Login — retorna token JWT |
| `GET` | `/api/auth/me` | Autenticado | Dados do usuário logado |
| `GET` | `/health` | Público | Health check do servidor |

### Planejados

| Método | Endpoint | Acesso | Sprint |
|---|---|---|---|
| `GET` | `/api/students` | ADMIN, PROFESSOR | Dev 2 · S1 |
| `POST` | `/api/students` | ADMIN | Dev 2 · S1 |
| `GET` | `/api/courses` | Autenticado | Dev 2 · S1 |
| `POST` | `/api/courses` | ADMIN | Dev 2 · S1 |
| `GET` | `/api/rooms` | Autenticado | Dev 3 · S1 |
| `POST` | `/api/rooms` | ADMIN | Dev 3 · S1 |
| `GET` | `/api/schedules` | Autenticado | Dev 3 · S1 |
| `POST` | `/api/qrcode/generate` | STUDENT | Dev 2 · S2 |
| `POST` | `/api/qrcode/validate` | Interno (MQTT) | Dev 3 · S2 |
| `GET` | `/api/access/now` | ADMIN | Dev 1 · S2 |
| `POST` | `/api/access/exit` | STUDENT, ADMIN | Dev 1 · S2 |
| `POST` | `/api/attendance` | PROFESSOR | Dev 1 · S3 |
| `GET` | `/api/students/:id/history` | ADMIN, PROF, próprio | Dev 2 · S3 |
| `GET` | `/api/reports/flow` | ADMIN | Dev 1 · S3 |

---

## Autenticação

O sistema usa **JWT (JSON Web Token)**. O fluxo é:

1. `POST /api/auth/login` com `{ email, password }` → recebe `{ token, role }`
2. Todas as rotas protegidas exigem o header: `Authorization: Bearer <token>`
3. O token expira em `JWT_EXPIRES_IN` (padrão: `8h`)

### Roles disponíveis

| Role | Descrição |
|---|---|
| `ADMIN` | Acesso total ao sistema |
| `PROFESSOR` | Lança presença e consulta alunos |
| `STUDENT` | Gera QR Code, consulta próprios dados |

### Protegendo uma rota nova

```typescript
import { authMiddleware, requireRole } from '../../shared/middlewares/auth.middleware'
import { Role } from '@prisma/client'

// Apenas autenticado
router.get('/rota', authMiddleware, handler)

// Apenas ADMIN
router.delete('/rota/:id', authMiddleware, requireRole(Role.ADMIN), handler)

// ADMIN ou PROFESSOR
router.get('/turma', authMiddleware, requireRole(Role.ADMIN, Role.PROFESSOR), handler)
```

---

## Fluxo do QR Code

```
Aluno abre o app
    → GET /api/qrcode/generate (com JWT)
    → backend gera UUID único, salva no banco (QRToken) vinculado ao Student
    → retorna imagem base64 do QR

Aluno aponta o QR para a catraca
    → ESP32 lê o token
    → publica em MQTT: catraca/scan { token, studentId }

Backend recebe via MQTT
    → valida: existência, expiração (5min), uso único, dono correto
    → cria AccessLog com timestamp de entrada
    → publica em MQTT: catraca/command { action: 'OPEN' } ou { action: 'DENY' }

ESP32 aciona o motor da catraca
```

> **Importante:** o QR Code abre a catraca — **não registra presença em aula**. Presença é um fluxo separado, lançado pelo professor.

---

## Divisão de responsabilidades

| Dev | Sprint 1 | Sprint 2 | Sprint 3 |
|---|---|---|---|
| **Dev 1** | Schema, auth, middlewares, testes ✅ | `access/`, cliente MQTT | `attendance/`, `reports/` |
| **Dev 2** | CRUD students, courses, enrollment | `qrcode/generate` | Histórico e conceitos do aluno |
| **Dev 3** | CRUD rooms, schedules | `qrcode/validate` | Presenças por turma |

**Dev 1 é o guardião de:**
- `prisma/schema.prisma` — toda mudança de schema passa por aqui
- `src/shared/middlewares/` — nenhum middleware paralelo
- Branch `main` — só Dev 1 faz merge após `npm test` passar

---

## Padrão de commits

O projeto segue [Conventional Commits](https://www.conventionalcommits.org/):

| Prefixo | Quando usar | Exemplo |
|---|---|---|
| `feat:` | Nova funcionalidade | `feat: adiciona CRUD de alunos` |
| `fix:` | Correção de bug | `fix: corrige validação de matrícula duplicada` |
| `refactor:` | Melhoria sem mudar comportamento | `refactor: extrai lógica de hash para utils` |
| `test:` | Testes novos ou corrigidos | `test: adiciona testes do módulo students` |
| `chore:` | Manutenção | `chore: atualiza dependências` |
| `docs:` | Documentação | `docs: atualiza README com novos endpoints` |

### Branches

| Branch | Dono | Propósito |
|---|---|---|
| `main` | Todos | Código estável — protegida, só Dev 1 mergeia |
| `feat/dev1-foundation` | Dev 1 | Sprint 1 — schema, auth, middlewares |
| `feat/dev1-mqtt` | Dev 1 | Sprint 2 — cliente MQTT e access/ |
| `feat/dev2-students` | Dev 2 | Sprint 1 |
| `feat/dev2-qrcode-gen` | Dev 2 | Sprint 2 |
| `feat/dev3-rooms` | Dev 3 | Sprint 1 |
| `feat/dev3-qrcode-val` | Dev 3 | Sprint 2 |

---

## Variáveis de ambiente

Copie `.env.example` para `.env` e preencha:

| Variável | Descrição | Exemplo |
|---|---|---|
| `DATABASE_URL` | String de conexão PostgreSQL | `postgresql://user:pass@localhost:5432/university_access` |
| `JWT_SECRET` | Chave secreta para assinar tokens JWT | Qualquer string longa e aleatória |
| `JWT_EXPIRES_IN` | Tempo de expiração do token | `8h` |
| `MQTT_BROKER_URL` | URL do broker MQTT | `mqtt://localhost:1883` |
| `PORT` | Porta do servidor HTTP | `3000` |

> ⚠️ **Nunca** suba o arquivo `.env` para o Git. Ele já está no `.gitignore`.
