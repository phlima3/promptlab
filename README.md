# PromptLab - AI Writing Workspace

**PromptLab** é um monorepo TypeScript full-stack que fornece uma plataforma para criação de templates de prompts e execução de gerações de texto usando LLMs (OpenAI/Anthropic).

## 🏗️ Arquitetura

- **apps/web** - Next.js UI (templates, geração, status de jobs)
- **apps/api** - Express API (templates CRUD, endpoint de geração, status de jobs)
- **apps/worker** - Processador de jobs em background (retry logic, timeouts)
- **packages/shared** - Schemas Zod + tipos TypeScript compartilhados
- **packages/db** - Prisma schema + client wrapper

## 🚀 Quick Start

### Pré-requisitos

- Node.js 18+ e Yarn
- Docker (para PostgreSQL e Redis)

### 1. Instalar dependências

```bash
yarn install
```

### 2. Iniciar serviços de infraestrutura

```bash
docker compose up -d
```

Isso iniciará:

- PostgreSQL na porta 5433
- Redis na porta 6379

### 3. Configurar variáveis de ambiente

Copie o `.env.example` para `.env` e ajuste se necessário:

```bash
cp .env.example .env
```

O arquivo já está configurado para usar os containers Docker.

### 4. Executar migrations do banco de dados

```bash
yarn db:migrate
```

### 5. Popular banco de dados com templates de exemplo

```bash
yarn db:seed
```

### 6. Iniciar aplicação

Em terminais separados:

```bash
# Terminal 1: API
yarn workspace @promptlab/api dev

# Terminal 2: Worker
yarn workspace @promptlab/worker dev

# Terminal 3: Web (quando implementada)
yarn workspace web dev
```

Ou usar o comando turbo (inicia todos juntos):

```bash
yarn dev
```

## 🧪 Testar o fluxo completo

Com a API e Worker rodando, execute:

```bash
yarn test:flow
```

Este script irá:

1. Listar templates disponíveis
2. Submeter um job de geração
3. Fazer polling do status
4. Exibir o resultado

## 📚 API Endpoints

### Templates

**POST /templates**
Cria um novo template

```json
{
  "name": "Blog Post Writer",
  "systemPrompt": "You are a professional blog writer.",
  "userPrompt": "Write about: {{input}}",
  "variablesSchema": { "input": "string" }
}
```

**GET /templates**
Lista todos os templates

**GET /templates/:id**
Obtém um template específico

### Generation

**POST /generate**
Cria um job de geração

```json
{
  "templateId": "cm...",
  "provider": "openai",
  "input": "the benefits of TypeScript"
}
```

Retorna: `{ "jobId": "cm..." }`

**GET /jobs/:id**
Obtém status e resultado de um job

## 🔑 Design Decisions

### 1. Async by Default

Chamadas LLM são assíncronas por padrão. O endpoint `/generate` retorna imediatamente com um `jobId` que pode ser consultado via polling.

### 2. Idempotency

Jobs com o mesmo `(templateId + provider + input + templateVersion)` não criam trabalho duplicado. O sistema retorna o `jobId` existente.

### 3. Retry Logic

Worker implementa retry com backoff exponencial (1s, 3s, 10s) até 3 tentativas antes de marcar como falha.

### 4. Type Safety

Schemas Zod em `packages/shared` garantem validação consistente entre frontend, API e worker.

### 5. Error Handling

Respostas de erro padronizadas:

```json
{
  "error": {
    "code": "validation_error | not_found | rate_limited | internal_error",
    "message": "human readable message",
    "details": {}
  }
}
```

## 📊 Database Schema

### Template

- `id`, `name`, `systemPrompt`, `userPrompt`
- `variablesSchema` (JSON), `version`
- Timestamps: `createdAt`, `updatedAt`

### Job

- `id`, `status` (queued/running/completed/failed)
- `templateId`, `provider`, `input`, `inputHash`
- `output`, `error`, `attempts`
- Timestamps: `startedAt`, `finishedAt`, `createdAt`, `updatedAt`

## 🔧 Scripts Úteis

```bash
# Desenvolvimento
yarn dev                  # Inicia todos os apps
yarn typecheck           # Verifica tipos TypeScript
yarn build               # Build de produção

# Database
yarn db:migrate          # Roda migrations
yarn db:generate         # Gera Prisma Client
yarn db:seed            # Popula com dados de exemplo

# Testing
yarn test:flow          # Teste end-to-end do fluxo completo
```

## 🎯 Roadmap (Next Steps)

### Fase 6 - LLM Provider Integration

- [ ] Implementar módulo de provedor real (OpenAI/Anthropic)
- [ ] Adicionar logging de tokens e custos estimados
- [ ] Implementar timeouts e circuit breakers

### Fase 7 - Rate Limiting + Caching

- [ ] Redis-based rate limiting por usuário
- [ ] Cache de resultados por inputHash
- [ ] Implementar sliding window rate limiter

### Fase 8 - Redis Queue

- [ ] Migrar de polling para BullMQ
- [ ] Job priorities e concurrency control
- [ ] Dead letter queue para jobs falhos

### Fase 9 - UI (Next.js)

- [ ] Página de templates (criar/listar/editar)
- [ ] Página de geração com live status updates
- [ ] Histórico de jobs e resultados

### Fase 10 - Production Ready

- [ ] WebSockets para job updates em tempo real
- [ ] Evaluation harness (prompt versioning + regression testing)
- [ ] Observabilidade: structured logging + metrics
- [ ] Multi-tenant + autenticação JWT

## 🏆 Interview-Ready Features

Este projeto demonstra:

✅ **Full-stack TypeScript**: Next.js + Express + shared types  
✅ **Backend maturity**: Validation, error handling, async jobs, retries  
✅ **Database design**: Prisma, migrations, proper indexing  
✅ **API design**: RESTful, idempotent, consistent error responses  
✅ **Worker patterns**: Polling, retry logic, backoff, graceful shutdown  
✅ **Type safety**: Zod schemas como single source of truth  
✅ **Pragmatism**: MVP scope bem definido, incremental delivery

## 📝 License

MIT
