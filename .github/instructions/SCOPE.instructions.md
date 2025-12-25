---
applyTo: "**"
---

# SCOPE.instructions.md

## Project

**PromptLab** — AI Writing Workspace (Monorepo)

PromptLab is a full-stack TypeScript monorepo that provides:

- A web UI (Next.js + React) for creating prompt templates and running generations.
- A backend API (Node + Express) that validates requests, persists jobs/results, and orchestrates execution.
- A background worker that processes jobs asynchronously (LLM calls, retries, timeouts).
- Shared packages for types/schemas (Zod), database access (Prisma), and utilities.

The goal is to produce a codebase that is “code-review interview ready”: clear architecture, strong reasoning, clean boundaries, and practical reliability patterns (rate limiting, caching, async jobs, idempotency).

---

## Interview-oriented goals

This project is intentionally designed to demonstrate:

1. **Reasoning and communication**: you can explain trade-offs and failure modes.
2. **Full-stack TS proficiency**: Next.js/React + Node/Express + type sharing.
3. **Backend maturity**: validation, error shapes, idempotency, queues, retries/timeouts.
4. **AI integration readiness**: provider abstraction (OpenAI/Claude), token/cost logging, prompt versioning, evaluation harness.
5. **Startup pragmatism**: ship a thin slice quickly, then iterate safely.

---

## Monorepo structure

Expected structure:

- `apps/web`  
  Next.js App Router UI: templates, generation form, job status, results history.

- `apps/api`  
  Express API: auth, templates CRUD, generate endpoint, job status endpoint, rate limiting, caching.

- `apps/worker`  
  Job processor: fetch pending jobs, call LLM provider, save results, handle retries/timeouts.

- `packages/shared`  
  Zod schemas + TypeScript types shared between web/api/worker.

- `packages/db`  
  Prisma schema + Prisma client wrapper.

- (optional) `packages/redis`  
  Redis client wrapper + rate limit + caching helpers.

---

## Core user experience

### User stories

1. As a user, I can create a **Template** (name, instructions, variables).
2. As a user, I can run a **Generation** using a template + input.
3. The app returns a **Job ID** immediately and shows status: queued/running/done/failed.
4. When done, I can view output, copy it, and see a history of results.
5. The system prevents abuse with **rate limiting** and avoids duplicate work with **idempotency + caching**.
6. (Optional) I can switch provider: OpenAI vs Anthropic.
7. (Optional) I can run “evaluation” jobs (golden prompts) to detect regressions when prompt logic changes.

---

## Non-goals (initial MVP)

To keep scope controlled and deliverable quickly:

- No complex auth system (use simple JWT with a single user or local dev auth).
- No multi-tenant billing logic initially (payments are optional later).
- No heavy realtime sockets required (polling job status is sufficient for MVP).
- No fully automated LLM eval scoring (manual review is acceptable for MVP).

---

## Key design principles

1. **Thin edges, thick services**  
   HTTP handlers validate + delegate; business logic lives in services.

2. **Type safety across boundaries**  
   Zod schemas in `packages/shared` are the single source of truth.

3. **Async by default for LLM calls**  
   `/generate` creates a job and returns quickly; worker processes.

4. **Idempotency**  
   Same (templateId + provider + input + promptVersion) should not create duplicate work.

5. **Observability**  
   Every request/job has IDs. Log latency, retries, errors, and estimated token usage/cost.

---

## Data model (Prisma)

Minimum entities (MVP):

- **User** (optional, can be stubbed)
- **Template**
- **Job**
- **GenerationResult** (can be folded into Job in MVP)

Suggested MVP schema concepts:

- Template: `id`, `name`, `systemPrompt`, `userPrompt`, `variablesSchema`, `version`, `createdAt`
- Job: `id`, `status`, `templateId`, `provider`, `input`, `inputHash`, `output`, `error`, `attempts`, `startedAt`, `finishedAt`, `createdAt`

Notes:

- Store `inputHash` to enforce idempotency.
- Store `attempts` and timestamps to support retries and debugging.

---

## API contract (Express)

### Endpoints (MVP)

1. `POST /templates`

- create template

2. `GET /templates`

- list templates

3. `GET /templates/:id`

- template details

4. `POST /generate`

- body: { templateId, provider, input }
- returns: { jobId }
- creates job (queued) and enqueues work

5. `GET /jobs/:id`

- returns job status and output/error if completed

### Error response format

Standardize errors so frontend can handle them:

```json
{
  "error": {
    "code": "validation_error | not_found | rate_limited | internal_error",
    "message": "human readable",
    "details": {}
  }
}
```

⸻

Worker behavior

Worker responsibilities
• Poll or consume queue for queued jobs
• Mark job running
• Call LLM provider with correct prompt composition
• Save output to DB, mark done
• On failure: increment attempts, retry with backoff, then mark failed

Retry policy (recommended)
• attempts <= 3
• backoff: 1s, 3s, 10s (simple exponential)
• fail fast for validation errors (no retry)
• retry for network/provider errors (timeouts, 429s, 5xx)

⸻

Redis usage (recommended)

Redis can be used for: 1. Rate limiting
• Key: ratelimit:{userId}:{minuteBucket} 2. Idempotency/caching
• Key: gen:{inputHash} -> jobId or output 3. Queue
• BullMQ or a lightweight list-based queue if needed quickly

If Redis is too heavy initially, implement:
• In-memory rate limit (dev-only)
• DB-based job polling (worker queries queued jobs)

But for interview quality, Redis is a strong signal.

⸻

LLM provider abstraction

Create a package/module that exposes:
• generateText({ provider, systemPrompt, userPrompt, input })
• providers: openai, anthropic

Implementation notes:
• Keep provider-specific code isolated.
• Normalize output: { text, usageTokens?, costUSD? }
• Include timeouts and retries (within provider module).

⸻

Prompt composition

Templates should support:
• A fixed systemPrompt
• A userPrompt with placeholders (e.g. {{input}} or variables)
• promptVersion stored on template

Example composition:
• system: template.systemPrompt
• user: template.userPrompt with input injected

Store final prompts for debugging (optional but useful).

⸻

Evaluation harness (optional but impressive)

Add:
• POST /eval/run creates an eval job set (runs N golden prompts)
• UI to show “before/after” outputs
• simple manual scoring fields (1–5)

Even a basic version demonstrates maturity.

⸻

Security and privacy

Minimum good practices:
• Do not log raw user input in production logs (mask/trim for dev)
• Keep API keys in env vars only
• Validate input sizes (max length) to prevent abuse/cost explosion
• Rate limit generation endpoints

⸻

Implementation plan (step-by-step)

Follow in order. Each step should compile and run.

Phase 0 — Repo baseline 1. Ensure monorepo scripts run:
• yarn dev starts apps/web and apps/api
• apps/worker can run separately 2. Add .env.example with:
• DATABASE_URL
• REDIS_URL (optional)
• OPENAI_API_KEY / ANTHROPIC_API_KEY (optional for now)

Deliverable:
• Repo boots with placeholder pages and a health endpoint.

⸻

Phase 1 — Shared schemas 1. In packages/shared, define:
• Template schemas
• Generate request schema
• Job schemas and status enum 2. Export types from Zod.

Deliverable:
• API can validate requests with shared schemas.

⸻

Phase 2 — Database foundation 1. In packages/db, implement Prisma schema:
• Template
• Job 2. Create prisma client wrapper. 3. Run migrations.

Deliverable:
• DB tables exist and can be queried.

⸻

Phase 3 — API: templates CRUD 1. Implement:
• POST /templates
• GET /templates
• GET /templates/:id 2. Use Zod validation. 3. Add consistent error responses.

Deliverable:
• UI can create and list templates via API.

⸻

Phase 4 — API: generate endpoint (sync mock) 1. Implement POST /generate:
• validate request
• create Job as queued
• return { jobId } 2. Implement GET /jobs/:id:
• status + output/error

Deliverable:
• Frontend can create jobs and poll status.

⸻

Phase 5 — Worker: DB polling (no Redis yet) 1. Worker loop:
• query queued jobs (limit N)
• mark running
• generate output (mock for now)
• save output, mark done 2. Handle failure:
• attempts increment
• mark failed after max attempts

Deliverable:
• End-to-end async: user submits → job finishes.

⸻

Phase 6 — LLM integration (real providers) 1. Implement provider module:
• OpenAI or Anthropic (start with one)
• timeouts/retries 2. Replace mock worker generation with provider call. 3. Store prompt version + provider.

Deliverable:
• Real LLM output is generated and stored.

⸻

Phase 7 — Rate limiting + idempotency 1. Add rate limit middleware to /generate. 2. Add input hashing:
• hash(templateId + provider + input + templateVersion) 3. If same hash exists and job is done:
• return existing result/jobId

Deliverable:
• Prevent abuse and duplicate cost.

⸻

Phase 8 — Redis upgrade (recommended) 1. Add Redis client wrapper. 2. Rate limit keys in Redis. 3. Cache jobId/result by hash. 4. Optionally adopt BullMQ for queue reliability.

Deliverable:
• More production-like behavior.

⸻

Phase 9 — UI polish (interview-ready) 1. Templates page:
• create/edit template 2. Generate page:
• choose template + provider
• input text
• submit → jobId
• show live status + output 3. History page:
• list jobs and results

Deliverable:
• Clean demo that shows your engineering choices.

⸻

Phase 10 — “Explainability” for interview 1. Add /docs page or README:
• architecture diagram (text)
• trade-offs and failure modes 2. Add “what I’d do next” section:
• websockets for job updates
• evaluation automation
• multi-tenant + billing

Deliverable:
• Hiring manager can review reasoning quickly.

⸻

Definition of Done (for final interview)

Minimum:
• Monorepo runs locally with 1 command (or documented).
• You can show: 1. Shared schema usage (Zod) 2. API endpoint with validation + job creation 3. Worker that processes jobs with retries 4. UI that polls job status and shows output
• You can explain:
• trade-offs
• failure modes
• rate limiting and cost control
• idempotency and caching strategy

Stretch:
• Redis-based rate limiting + caching
• Prompt versioning + evaluation harness
• Provider switch OpenAI/Claude

⸻

Suggested talking points (for code review)

When showing a file, always cover:
• What it does (context)
• Inputs/outputs
• Key decisions and trade-offs
• Failure modes and mitigations
• What you’d improve next

English phrases:
• “Let me frame the problem first…”
• “The main trade-off is…”
• “The failure modes I considered are…”
• “If I had more time, I’d…”

⸻

Notes for AI coding agent

If an AI agent is implementing, it should:
• Keep changes incremental and buildable at each step.
• Prefer simple, readable code over clever abstractions.
• Avoid introducing too many dependencies early.
• Always maintain shared types in packages/shared.
• Keep API error shapes consistent.
• Add small comments only where reasoning matters (trade-offs, failure modes).
