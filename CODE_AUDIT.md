# VDP Code Health Audit

**Date:** 2026-03-26
**Scope:** Full monorepo (`server/`, `apps/web/`, `packages/shared/`)
**Tools used:** everything-claude-code agents (code-reviewer, typescript-reviewer, architect, refactor-cleaner), AgentShield security scan, manual analysis
**Context:** Post first production deploy (Render + Vercel + Supabase + Groq)

---

## Findings by Priority

### 🔴 Critical (6 findings)

#### C1. Silent embedding failures — 3 instances
**Files:** `server/src/modules/tasks/services/CreateTask.ts:26`, `UpdateTask.ts:28`, `AddTaskNote.ts:20`
**Issue:** `.catch(() => {})` silently swallows embedding errors. If the embedding pipeline breaks, similarity search degrades without any indication.
**Fix:** Log the error and optionally emit a diagnostic event.
**Effort:** Quick fix (30 min)
**Isolation:** Safe — each file is independent

#### C2. `any` type in production server code — 18 instances (non-test)
**Files:** `BaseAgent.ts` (6), `ServiceProvider.ts` (2), `RepositoryProvider.ts` (3), `DomainEvent.ts` (1), `agent-chat.ts` (1), `AgentChatLoop.ts` (1), `DrizzleTaskEmbeddingRepository.ts` (2), `OllamaAgentProvider.ts` (2), `OpenAICompatibleAgentProvider.ts` (2), `SummarizeSkill.ts` (1)
**Issue:** Reduces type safety across the agent system and core infrastructure. `err: any` in catch blocks is particularly dangerous — no guarantee `.message` exists.
**Fix:** Replace with `unknown` + type guards, or specific types (`Record<string, unknown>`, typed error classes).
**Effort:** Half day
**Isolation:** Safe — can fix file by file

#### C3. `any` type in frontend code — 29+ instances
**Files:** All wallet pages (`investments`, `savings`, `transactions/new`, `stats`), all health pages (`medications`, `appointments`, `metrics`, `body`, `habits`), health components (`habits-grid`, `weekly-chart`, `appointments-card`, `medications-card`, `config.ts`), chat hooks (`use-chat-conversations.ts`, `use-chat-stream.ts`)
**Issue:** Wallet and health demo pages use `any` for all data iteration and mutation functions. Chat hooks use `any` for error handling.
**Fix:** Create proper interfaces for wallet/health data types (many already exist in `@vdp/shared`). Type catch blocks with `unknown`.
**Effort:** Half day for chat hooks (production code). Wallet/health pages are demo-only — lower priority.
**Isolation:** Safe — each file independent

#### C4. No test coverage configuration
**Files:** `server/vitest.config.ts`, `apps/web/vitest.config.mts`
**Issue:** No coverage thresholds configured despite 80% project requirement. No CI enforcement.
**Fix:** Add `coverage` config with `thresholds: { lines: 80, functions: 80, branches: 80 }` to vitest configs.
**Effort:** Quick fix (30 min)
**Isolation:** Safe

#### C5. Shared package has zero tests
**Files:** `packages/shared/` — no test directory exists
**Issue:** 60+ exported schemas and types with no tests. Schema validation bugs would propagate silently to server and web.
**Fix:** Add vitest config and tests for critical schemas (task schemas at minimum, since those are the only ones currently used).
**Effort:** Half day
**Isolation:** Safe

#### C6. No root error boundary
**Files:** Missing `apps/web/src/app/error.tsx`
**Issue:** Domain error boundary exists at `(domain)/error.tsx` but root-level errors (layout crashes, auth failures) are unhandled.
**Fix:** Create root `error.tsx` with fallback UI.
**Effort:** Quick fix (30 min)
**Isolation:** Safe

---

### 🟡 Should Fix (12 findings)

#### S1. Large functions exceeding 50 lines — 7 instances
| File | Lines | Issue |
|------|-------|-------|
| `AgentChatLoop.ts` | 134 | Chat loop, tool handling, stream control mixed |
| `management-tools.ts` | 152 | 6 tool definitions inline |
| `EventBus.ts` | 123 | Emit + handler mgmt + logging mixed |
| `TaskInsightsStore.ts` | 117 | Multiple insight operations |
| `HttpController.ts` | 100 | Route registration with overloads |
| `scheduler/service.ts` | 90 | Scheduling logic |
| `AgentConversationStore.ts` | 76 | Conversation persistence |

**Fix:** Extract nested functions, split concerns.
**Effort:** Full day (all together)
**Isolation:** Moderate — AgentChatLoop and EventBus changes need careful testing

#### S2. N+1 query in DetectRepeatPattern
**File:** `server/src/modules/tasks/services/DetectRepeatPattern.ts:25-26`
**Issue:** `historicalIds.map(id => this.repository.getTask(id))` — parallel but individual queries per ID. With 10 similar tasks = 10 queries.
**Fix:** Add `getTasksByIds(ids: string[])` to TaskRepository using `WHERE id IN (...)`.
**Effort:** Quick fix (1 hour)
**Isolation:** Safe — add new method, update one caller

#### S3. Large page components — 9 files over 300 lines
| File | Lines | Should Extract |
|------|-------|---------------|
| `people/page.tsx` | 375 | MessageComposer, ContactCard |
| `work/page.tsx` | 371 | EmailComposer, CalendarSection |
| `home/page.tsx` | 339 | TaskCard, WalletCard, InsightsSection |
| `wallet/investments/page.tsx` | 325 | InvestmentForm, InvestmentTable |
| `study/page.tsx` | 324 | CourseCard, ProgressSection |
| `wallet/savings/page.tsx` | 296 | SavingsForm |
| `health/appointments/page.tsx` | 288 | AppointmentForm |
| `tasks-dashboard-selectors.test.ts` | 424 | (acceptable for test file) |

**Note:** Most of these are demo pages (wallet, health, people, work, study). Only `home/page.tsx` is production code.
**Effort:** Full day+ for all. Prioritize `home/page.tsx` only.
**Isolation:** Safe — component extraction is isolated

#### S4. Fragile error classification via substring matching
**File:** `server/src/modules/common/http/agent-chat.ts:99-111`
**Issue:** `classifyAgentError()` matches on `error.toLowerCase().includes('api')` — fragile, will break with new error messages.
**Fix:** Use error codes or typed error classes instead of string matching.
**Effort:** Half day
**Isolation:** Moderate — touches error handling flow

#### S5. Event-DB ordering risk
**File:** `server/src/modules/tasks/services/CompleteTask.ts`
**Issue:** Event emitted AFTER DB save. If event handler fails, state is persisted but downstream effects don't execute. No transaction wrapping.
**Fix:** Consider wrapping critical operations in transactions, or making event handlers idempotent with retry.
**Effort:** Half day (design decision needed)
**Isolation:** Low — affects event system architecture

#### S6. Inline styles — 132 instances in frontend
**Files:** Primarily demo pages (people, work, wallet, health, study)
**Issue:** `style={{...}}` with CSS variables used heavily instead of CSS classes or utility patterns.
**Fix:** Extract to CSS modules or utility classes for repeated patterns.
**Effort:** Full day+ (mostly demo pages)
**Isolation:** Safe but tedious

#### S7. DomainEvent payload typed as `any`
**File:** `server/src/modules/common/base/event-bus/DomainEvent.ts:19`
**Issue:** Event payloads lose type safety at the event bus level.
**Fix:** Use generics: `DomainEvent<T>` with typed payloads per event class.
**Effort:** Half day
**Isolation:** Low — affects all event classes

#### S8. Tool implementations inline in tool definitions
**File:** `server/src/modules/tasks/infrastructure/agent/tools/management-tools.ts`
**Issue:** 6 tool execute functions defined inline (152 lines). Hard to test individually.
**Fix:** Extract each tool's execute to a named function or class.
**Effort:** Half day
**Isolation:** Safe

#### S9. `as any` in test files — 8 instances
**Files:** `DetectRepeatPattern.test.ts` (4), `CreateTask.test.ts` (2), `CarryOverTask.test.ts` (1), `CarryOverAllPending.test.ts` (1), `DrizzleTaskRepository.test.ts` (1), `DrizzleTaskNoteRepository.test.ts` (2)
**Issue:** Tests bypass type safety to access private members or create partial mocks.
**Fix:** Use proper test helpers or typed mock factories.
**Effort:** Half day
**Isolation:** Safe

#### S10. No numeric validation on `parseFloat` calls — 15 instances
**Files:** Wallet and health demo pages
**Issue:** `parseFloat(value)` used without checking for `NaN`. Could display `NaN` in UI.
**Fix:** Create `safeParseFloat(value: string, fallback = 0)` utility.
**Effort:** Quick fix (1 hour)
**Isolation:** Safe

#### S11. Hardcoded magic numbers in agent prompts
**Files:** `server/src/modules/tasks/infrastructure/agent/system-prompt.ts`
**Issue:** "3+ days" for stuck detection, "5 carry overs" for alerts — hardcoded in prompt text.
**Fix:** Extract to configuration constants.
**Effort:** Quick fix (30 min)
**Isolation:** Safe

#### S12. Unused exports in shared package — 60+ items
**Files:** `packages/shared/src/schemas/wallet.ts`, `health.ts`, `types/wallet.ts`, `types/common.ts`
**Issue:** Wallet and health schemas/types exported but never imported anywhere. Dead code.
**Note:** These were pre-built for future modules. Not harmful but adds noise.
**Fix:** Either remove and recreate when needed, or add `// @future` marker comments.
**Effort:** Quick fix (30 min) to add markers, or remove entirely
**Isolation:** Safe

---

### 🟢 Nice to Have (8 findings)

#### N1. Missing JSDoc on public exports
**Files:** `packages/shared/src/**`, exported services
**Issue:** No documentation on exported types, schemas, or service classes.
**Effort:** Full day+

#### N2. Inconsistent dependency versions across packages
**Files:** Root, server, web `package.json` files
**Issue:** Zod `^3.24.0` vs `^3.24.2`, TypeScript `^5.7.0` vs `^5.7.3`. Functionally compatible but inconsistent.
**Effort:** Quick fix (15 min)

#### N3. Hardcoded Spanish strings in agent code
**Files:** `system-prompt.ts`, `agent-chat.ts`, `management-tools.ts`, `TaskInsightFactory.ts`
**Issue:** Not i18n-ready. Acceptable for single-user app, but will need refactoring for multi-user.
**Effort:** Full day+ (if needed)

#### N4. DrizzleTaskEmbeddingRepository uses double cast
**File:** `DrizzleTaskEmbeddingRepository.ts:45-46`
**Issue:** `(result as any).rows` then `(rows as any[]).map((row: any) => ...)` — triple `any` in two lines.
**Fix:** Create typed interface for the raw SQL result.
**Effort:** Quick fix (30 min)

#### N5. Web app tsconfig target diverges from base
**File:** `apps/web/tsconfig.json` uses `ES2017` vs base `ES2022`
**Issue:** Intentional for Next.js compatibility but worth documenting.
**Effort:** N/A (document only)

#### N6. Duplicate `.catch(() => {})` pattern
**Files:** `CreateTask.ts`, `UpdateTask.ts`, `AddTaskNote.ts`
**Issue:** Same fire-and-forget pattern repeated 3 times.
**Fix:** Extract to shared utility: `fireAndForget(promise, logger)`.
**Effort:** Quick fix (30 min)

#### N7. `EmbedTask.execute()` returns silently when task not found
**File:** `server/src/modules/tasks/services/EmbedTask.ts:14-16`
**Issue:** No logging when task lookup fails during embedding.
**Effort:** Quick fix (15 min)

#### N8. Complex ternaries in JSX without extraction
**Files:** Wallet demo pages
**Issue:** `(((totalCurrent - totalInvested) / totalInvested) * 100).toFixed(1)` inline in JSX.
**Fix:** Extract to utility functions.
**Effort:** Quick fix (30 min)

---

## Architecture Assessment

### What's Working Well ✓

| Area | Assessment |
|------|-----------|
| **Module boundaries** | Clean unidirectional flow: routes → services → repositories → domain |
| **No circular dependencies** | Verified — no cross-module imports that skip boundaries |
| **Domain logic placement** | Business logic properly in services, controllers are thin |
| **Repository pattern** | Consistent abstraction with Fake implementations for testing |
| **Immutability** | Domain objects return new states, services don't mutate inputs |
| **Event-driven communication** | EventBus for cross-module events, no direct coupling |
| **No singletons** | All dependencies through Core → ModuleContext injection |
| **Test architecture** | Unit (Fakes), Integration (real Postgres), E2E (Fastify inject) |
| **API client abstraction** | Frontend has clean typed API layer with proper error class |
| **Split-context pattern** | TasksQueriesContext + TasksActionsContext — good separation |

### Architecture Concerns ⚠️

| Area | Issue | Severity |
|------|-------|----------|
| **ServiceProvider typing** | Uses `Map<any, any>` internally — type safety lost at DI level | 🟡 |
| **DomainEvent payload** | `any` payload — events lose type info when crossing boundaries | 🟡 |
| **Agent tool testing** | Tools defined inline, can't be unit tested independently | 🟡 |
| **No transaction boundaries** | Event emission after DB save without atomicity guarantee | 🟡 |

---

## Tech Debt Inventory

| Item | Origin | Status |
|------|--------|--------|
| Silent embedding `.catch(() => {})` | Phase 2 fire-and-forget design | Ships in production |
| DetectRepeatPattern not wired from carry-over | Phase 2 intelligence gap | ✅ Resolved — wired from `CarryOverTask` |
| TaskRepeatDetected event handler missing | Phase 2 intelligence gap | ✅ Resolved — handler in `TaskEventHandlers` |
| RecommendationEngine not exposed as agent tool | Phase 2 intelligence gap | ✅ Resolved — exposed as `get_recommendations` |
| Embeddings disabled in prod (no cloud provider) | Deploy constraint | Groq doesn't offer embeddings |
| `tsx` as production runtime | ESM extensionless import workaround | Works but adds ~50MB to image |
| Demo pages (wallet/health/people/work/study) fully `any`-typed | Rapid prototyping | Not production code yet |

---

## Prioritized Action List

### Phase 1: Quick Wins (1 day total)

| # | Action | Effort | Finding |
|---|--------|--------|---------|
| 1 | Replace `.catch(() => {})` with `.catch(err => log.warn(...))` | 30 min | C1 |
| 2 | Add coverage config + thresholds to vitest | 30 min | C4 |
| 3 | Create root `error.tsx` | 30 min | C6 |
| 4 | Add `getTasksByIds()` to TaskRepository | 1 hour | S2 |
| 5 | Extract agent prompt magic numbers to constants | 30 min | S11 |
| 6 | Create `safeParseFloat()` utility | 30 min | S10 |
| 7 | Type `DrizzleTaskEmbeddingRepository` raw query result | 30 min | N4 |
| 8 | Add `fireAndForget()` utility | 30 min | N6, N7 |

### Phase 2: Type Safety (1-2 days)

| # | Action | Effort | Finding |
|---|--------|--------|---------|
| 9 | Replace `err: any` with `unknown` + type guards (server) | 2 hours | C2 |
| 10 | Type `DomainEvent<T>` with generics | 3 hours | S7 |
| 11 | Type chat hooks error handling (frontend) | 1 hour | C3 (partial) |
| 12 | Fix `as any` in test files with proper mocks | 2 hours | S9 |
| 13 | Type `ServiceProvider` and `RepositoryProvider` generics | 2 hours | C2 |

### Phase 3: Structure (2-3 days)

| # | Action | Effort | Finding |
|---|--------|--------|---------|
| 14 | Extract `AgentChatLoop` into smaller functions | 3 hours | S1 |
| 15 | Extract tool implementations from `management-tools.ts` | 3 hours | S8 |
| 16 | Split `home/page.tsx` into sub-components | 2 hours | S3 |
| 17 | Replace string-based error classification with error codes | 3 hours | S4 |
| 18 | Add shared package tests (task schemas) | 3 hours | C5 |

### Phase 4: When Building Next Module

| # | Action | Effort | Finding |
|---|--------|--------|---------|
| 19 | Clean up unused shared package exports OR type demo pages | 2 hours | S12, C3 |
| 20 | Extract inline styles to CSS modules (demo pages) | Full day | S6 |
| 21 | Add transaction boundaries for critical operations | Half day | S5 |
| 22 | Consider i18n extraction for agent strings | Full day | N3 |

---

## Score Summary

| Category | Score | Notes |
|----------|-------|-------|
| **Architecture** | 9/10 | Excellent module boundaries, clean DI, good patterns |
| **Type Safety** | 6/10 | `any` usage in agent system and demo pages |
| **Error Handling** | 7/10 | Good patterns exist but 3 silent swallows + fragile classification |
| **Testing** | 7/10 | Good coverage on server, missing on shared, no coverage thresholds |
| **Database** | 8/10 | Clean repository pattern, 1 N+1, justified raw SQL |
| **Frontend** | 7/10 | Good architecture, demo pages need typing |
| **Agent/AI** | 7/10 | Clean tool definitions, prompts hardcoded but functional |
| **Security** | 9/10 | Helmet, rate-limit, auth gate, CORS locked, no secrets in code |
| **Overall** | **7.5/10** | Solid foundation, type safety is the main gap |
