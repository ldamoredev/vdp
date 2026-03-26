# VDP Production Readiness Review

**Date:** 2026-03-25
**Reviewed by:** Claude (automated review)
**Project:** VDP Monorepo (server + web + shared)

---

## 1. Build Check

### `pnpm build`
- ✅ **All 3 packages build successfully** (`@vdp/shared`, `@vdp/server`, `@vdp/web`)
- ✅ Next.js compiles cleanly — 23 static pages generated (including `/login`), middleware compiled
- ✅ TypeScript server compiles with no errors

### `tsc --noEmit`
- ✅ Server passes `tsc --noEmit` with zero errors
- ✅ Web types validated by Next.js build (linting + type checking)

### Tests
- ✅ **30 test files, 121 tests — all passing**

### Linter
- ⚠️ No explicit ESLint configuration found in the monorepo. Next.js uses built-in linting during `next build`, but the server has no linter configured.

---

## 2. Environment Variables

### All `process.env.*` references

| Variable | Package | Required | Default |
|----------|---------|----------|---------|
| `PORT` | server | No | `4001` |
| `DATABASE_URL` | server | **Yes** | None |
| `ACCESS_SECRET` | both | **Recommended** | None (guard disabled) |
| `CORS_ORIGIN` | server | **Recommended** | `true` (allow all) |
| `ANTHROPIC_API_KEY` | server | Conditional | None |
| `AGENT_PROVIDER` | server | No | Auto-detected |
| `OPENAI_COMPAT_BASE_URL` | server | If provider=openai-compatible | None |
| `OPENAI_COMPAT_API_KEY` | server | If provider=openai-compatible | None |
| `OPENAI_COMPAT_MODEL` | server | No | `llama-3.3-70b-versatile` |
| `OLLAMA_BASE_URL` | server | No | `http://127.0.0.1:11434` |
| `OLLAMA_MODEL` | server | No | `qwen3:4b` |
| `LANGFUSE_SECRET_KEY` | server | No | None |
| `LANGFUSE_PUBLIC_KEY` | server | No | None |
| `LANGFUSE_HOST` | server | No | `http://localhost:3001` |
| `NODE_ENV` | both | No | — |
| `OTEL_ENABLED` | server | No | `false` |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | server | No | None |
| `OTEL_SERVICE_NAME` | server | No | `vdp-server` |
| `NEXT_PUBLIC_API_URL` | web | **Yes** (prod) | `http://localhost:4001/api/v1` |

### Env file status
- ✅ `.env.example` exists for both `server/` and `apps/web/`
- ✅ `.env` is in `.gitignore`
- ⚠️ No startup validation — if `DATABASE_URL` is missing, the app crashes with an opaque pg error

### Critical secrets
- `DATABASE_URL` — database credentials
- `ACCESS_SECRET` — shared access gate for frontend + API
- `ANTHROPIC_API_KEY` / `OPENAI_COMPAT_API_KEY` — LLM API keys (billed)
- `LANGFUSE_SECRET_KEY` — observability platform key

---

## 3. Database

### Drizzle Migrations
- ✅ 3 migrations present and configured
- ✅ Migration scripts in root `package.json`
- ✅ Uses `pgvector/pgvector:pg16` — embeddings support ready
- ✅ Compatible with Supabase free tier (PostgreSQL + pgvector)

### Connection Configuration
- ⚠️ No connection pool size configured (uses pg defaults — 10 connections). Supabase free tier allows 60 connections max.
- ✅ Parameterized queries via Drizzle ORM (SQL injection safe)

---

## 4. Basic Security

### CORS
- ✅ **CORS is configurable** via `CORS_ORIGIN` env var (comma-separated allowlist). Defaults to open for local dev, restrictable in production.

### Rate Limiting
- ✅ **`@fastify/rate-limit` installed** — 100 req/min global limit configured.

### Security Headers (Helmet)
- ✅ **`@fastify/helmet` installed** — adds `X-Content-Type-Options`, `X-Frame-Options`, `Strict-Transport-Security`, etc. CSP disabled (common for API servers).

### Access Control
- ✅ **API key guard** on all `/api/v1/*` routes via `ACCESS_SECRET` env var
- ✅ `/api/health` is public (for load balancer probes)
- ✅ Supports both `x-api-key` header and `?api_key=` query param (for SSE/EventSource)
- ✅ Guard auto-disables when `ACCESS_SECRET` is unset (local dev convenience)

### Frontend Gate
- ✅ **Next.js middleware** redirects unauthenticated users to `/login`
- ✅ **Login page** validates secret via `/api/auth` route, sets HTTP-only cookie
- ✅ Cookie: `httpOnly`, `secure` in production, `sameSite: lax`, 30-day expiry
- ✅ API client automatically reads cookie and sends `x-api-key` header

### Hardcoded Secrets
- ✅ No hardcoded secrets found in source code

### .gitignore
- ✅ Covers: `node_modules/`, `dist/`, `.next/`, `.turbo/`, `.env`, `.env.local`, `*.tsbuildinfo`, `.DS_Store`

---

## 5. Health & Observability

### Health Endpoint
- ✅ `/api/health` endpoint exists (public, skips auth)
- ⚠️ Returns module/agent/skill status only — doesn't check DB connectivity

### Logging
- ✅ Fastify pino logger (structured JSON)
- ✅ Timeline events logged with domain/type metadata
- ⚠️ No log level configuration via env var

### Global Error Handling
- ✅ Global `httpErrorHandler` — known errors → structured JSON, unknown → generic 500
- ✅ Unknown errors logged server-side, no internals leaked to client

### Observability
- ✅ OpenTelemetry with auto-instrumentation
- ✅ Langfuse for LLM observability
- ✅ Graceful degradation when disabled

### Graceful Shutdown
- ✅ SIGINT/SIGTERM handlers, parallel shutdown via `Promise.allSettled`

---

## 6. Frontend (Next.js)

### Build
- ✅ `next build` passes cleanly — 23 pages + middleware
- ✅ `output: "standalone"` configured for Docker

### API URLs
- ✅ API base URL parameterized via `NEXT_PUBLIC_API_URL`
- ✅ SSE hook also parameterized

### Auth Flow
- ✅ Middleware redirects to `/login` when no valid cookie
- ✅ Login page with glassmorphism styling matching design system
- ✅ API client auto-attaches `x-api-key` from cookie

### Error/Loading State
- ✅ `ApiError` class with structured error handling
- ✅ SSE stream handles errors and reconnects with exponential backoff

---

## 7. Dependencies

### `pnpm audit`
- ⚠️ **8 vulnerabilities found**: 7 moderate + 1 high — all in **dev dependencies only** (vitest/vite chain), do NOT ship to production

### Dev vs Production Dependencies
- ✅ Correctly separated across all packages

---

## 8. Scripts & Config

### Production Start Scripts
- ✅ Server: `"start": "node dist/main.js"`
- ✅ Web: `"start": "next start --port 3000"`

### Docker
- ✅ **Server Dockerfile** — multi-stage build (deps → build → runner)
- ✅ **Web Dockerfile** — multi-stage with standalone output
- ✅ **`.dockerignore`** — excludes node_modules, .env, .git, etc.

### Build Output
- ✅ Server → `dist/`, Web → `.next/standalone`
- ⚠️ Server source maps enabled — consider disabling for production

---

## Summary

### What's Good
- ✅ Clean build — 3/3 packages, 121/121 tests passing
- ✅ CORS configurable via `CORS_ORIGIN` env var
- ✅ Rate limiting at 100 req/min
- ✅ Security headers via Helmet
- ✅ Shared-secret auth gate (frontend + backend)
- ✅ `.env.example` for both server and web
- ✅ Dockerfiles for both server and web
- ✅ `output: "standalone"` for Next.js Docker
- ✅ OpenAI-compatible agent provider (Groq, etc.)
- ✅ Structured error handling + global handler
- ✅ Parameterized queries (no SQL injection)
- ✅ No hardcoded secrets
- ✅ Graceful shutdown
- ✅ Health endpoint
- ✅ OpenTelemetry + Langfuse observability

### Verdict: 🟢 READY WITH WARNINGS

---

## Remaining Warnings (non-blocking)

| # | Issue | Priority | Fix |
|---|-------|----------|-----|
| 1 | No env var validation at startup | High | Add Zod schema to validate `process.env` in `main.ts` |
| 2 | Health endpoint doesn't check DB | Medium | Add pg pool query to `/api/health` |
| 3 | No log level env var | Medium | Add `LOG_LEVEL`, configure pino |
| 4 | Source maps in prod build | Low | Set `"sourceMap": false` or use tsconfig.build.json |
| 5 | No CI/CD pipeline | Medium | Add GitHub Actions for build + test + deploy |
| 6 | No ESLint on server | Low | Add ESLint config |
| 7 | No DB connection pool tuning | Low | Configure pool size for Supabase (max 60) |
| 8 | Dev-only audit vulnerabilities | Low | Update vitest/vite |
