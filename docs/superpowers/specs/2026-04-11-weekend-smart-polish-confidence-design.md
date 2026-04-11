# Weekend Phase: Smart, Polish, Confidence

> **Goal:** Make VDP feel smarter, more polished, and more trustworthy in one chill weekend — without touching production infrastructure.

**Three streams, executed in order:**
- **Stream A — AI Intelligence:** Cross-domain prompt enrichment, Wallet spending tools, unified toast signals
- **Stream B — UX Polish:** PWA installability, onboarding modal, mobile audit
- **Stream C — E2E Test Confidence:** Playwright critical path tests

**Tech Stack:** Next.js 15, React 19, TanStack Query, Vitest, Fastify 5, TypeScript, Playwright, existing Tasks/Wallet modules

---

## Stream A — AI Intelligence

### A.1 Cross-Domain Prompt Enrichment

**Problem:** Tasks and Wallet chat operate in isolation. The AI never references the other domain, so it can't make useful cross-domain suggestions.

**Solution:** When building the agent system prompt for a chat request, inject a snapshot of the *other* domain's current state. The LLM reasons about connections naturally — no hardcoded rules.

**Tasks chat receives Wallet snapshot:**
- Today's total spending (income, expenses, net)
- Spending anomalies (categories where this week's spending exceeds the 4-week average by >50%)
- Top 3 categories by amount this week

**Wallet chat receives Tasks snapshot:**
- Pending task count for today
- Tasks being carried over 3+ days (title + carry-over count)
- Today's completion ratio (done / total)

**Implementation approach:**
- New service: `GetWalletSnapshot` in Wallet module — returns a plain object with today's spending summary, anomalies, and top categories. Queries existing repository methods.
- New service: `GetTasksSnapshot` in Tasks module — returns pending count, stuck tasks, completion ratio. Queries existing repository methods.
- Each agent controller calls the other domain's snapshot service during system prompt construction.
- Snapshot data is appended to the system prompt as a structured `[Contexto cruzado]` section.
- Dependencies flow through `ModuleContext` — no singletons, no circular imports. Each module exposes its snapshot service; the agent controllers receive the cross-domain service via DI.

### A.2 Wallet Intelligence Tools

**Problem:** Wallet agent has no analytical tools. It can log and list transactions but cannot detect patterns or anomalies.

**New service: `GetSpendingAnomalies`**
- Compares current week's spending per category against the 4-week rolling average
- Flags categories where current week > average × 1.5
- Returns: `{ category, currentWeek, average, percentageChange, direction: 'up' | 'down' }[]`
- Exposed as agent tool: `get_spending_anomalies`

**New service: `GetCategoryTrends`**
- Calculates week-over-week direction for each category
- Returns: `{ category, thisWeek, lastWeek, change: number, trend: 'up' | 'down' | 'stable' }[]`
- "stable" = change within ±10%
- Exposed as agent tool: `get_category_trends`

**Both services:**
- Query existing `WalletStatsRepository` methods (or add thin new queries if needed)
- Accept `userId` parameter for multi-user scoping
- Return typed DTOs, not raw DB rows
- Unit tested with `FakeWalletStatsRepository`

### A.3 Wallet System Prompt Enhancement

**Problem:** Wallet system prompt is purely reactive — "register, confirm, show data".

**Changes:**
- Add proactive behavior instructions matching the Tasks prompt style
- Reference the new tools: "Usá `get_spending_anomalies` para detectar gastos inusuales" and "Usá `get_category_trends` para mostrar tendencias"
- Add cross-domain awareness: "Tenés contexto de tareas pendientes. Si ves una conexión útil entre gastos y tareas, mencionala naturalmente."
- Add personality: opinionated but not preachy, alerts on anomalies, celebrates savings streaks

### A.4 Recommendation Engine → Toast Pipeline

**Problem:** `RecommendationEngine` generates useful recommendations (celebrate, break_down, reschedule, discard) but they're only available when the agent calls `get_recommendations`. They never surface proactively as toasts.

**Solution:** Wire recommendation output into `TaskInsightsStore` events:
- When `GetEndOfDayReview` runs, it calls `RecommendationEngine` and emits insights for noteworthy recommendations
- `celebrate` → achievement toast ("🎉 Completaste todas las tareas de hoy")
- `break_down` (carry-over ≥ 3) → suggestion toast ("💡 'Estudiar React' lleva 4 días — ¿dividirla?")
- These flow through the existing SSE → notification-store → toast-container pipeline

### A.5 Wallet Insights → Toast Pipeline

**Problem:** Wallet events (`TransactionCreated`, `SpendingSpike`) don't surface as user-visible toasts.

**Solution:**
- New `WalletInsightsStore` — mirrors `TaskInsightsStore` structure (in-memory, per-user, typed insights)
- `SpendingSpike` event handler writes to `WalletInsightsStore`
- Extend existing insights SSE endpoint to broadcast both Task and Wallet insights (single stream, unified format)
- Frontend `use-insights-sse.ts` already feeds into `notification-store` — extend it to handle Wallet insight types
- New toast types: spending anomaly (warning, amber), category trend alert (suggestion, purple)

### A.6 Review Ritual Enrichment

**Problem:** The daily review ritual screen shows task queue, wallet queue, and insights — but the insights are static and don't include the new intelligence signals.

**Solution:**
- `useDailyReviewModel` already queries both Tasks and Wallet APIs
- Add calls to the new anomaly/trend endpoints so the review screen shows: "Esta semana gastaste 60% más en delivery que tu promedio"
- These appear in the "Resolver alertas" section of the review screen
- No new components needed — just richer data flowing into existing sections

---

## Stream B — UX Polish

### B.1 PWA Installability

**Problem:** VDP is a web app that can't be installed on a phone. No manifest, no icons, no meta tags.

**Solution — manifest only, no service worker:**
- `apps/web/src/app/manifest.ts` — Next.js metadata API manifest
  - name: "VDP — Life Operating System"
  - short_name: "VDP"
  - start_url: "/home"
  - display: "standalone"
  - background_color: dark theme color
  - theme_color: dark theme color
  - icons: 192x192 + 512x512 PNG
- Icon generation: create simple VDP-branded icons (can be text-based SVG → PNG)
- `apps/web/src/app/layout.tsx` metadata additions:
  - viewport with width=device-width, initial-scale=1
  - theme-color
  - apple-mobile-web-app-capable: yes
  - apple-mobile-web-app-status-bar-style: black-translucent
  - format-detection: telephone=no
- Apple touch icon: 180x180 in public/

**Explicitly excluded:** Service worker, offline caching, push notifications. These add complexity and stale-page risk. Installability only requires manifest + HTTPS.

### B.2 Onboarding Modal

**Problem:** New users land on /home with no context about what VDP is or how to use it.

**Solution — 3-step modal on first visit:**
- Trigger: `localStorage.getItem('vdp_onboarded')` is null on `/home` mount
- Component: `OnboardingModal` with 3 steps:
  1. **Tus tareas** (📋) — "Organizá tu día con tareas inteligentes. El asistente te ayuda a priorizar y revisar."
  2. **Tu wallet** (💰) — "Registrá gastos e ingresos rápido. Detectamos patrones y te avisamos."
  3. **Tu asistente** (🤖) — "Chateá con IA que conoce tus tareas y finanzas. Te sugiere, te alerta, y te ayuda a decidir."
- Navigation: dot indicators + "Siguiente" / "Empezar" buttons
- On finish: `localStorage.setItem('vdp_onboarded', 'true')`, modal closes
- Style: glassmorphism overlay matching the login page aesthetic
- No sample data created — purely informational orientation

### B.3 Mobile Audit

**Problem:** Several newer pages (review, wallet quick-add, wallet stats) haven't been verified on mobile widths.

**Approach:** Verify at 375px width using preview tools during implementation. Fix-as-you-go — no separate task.

**Pages to verify:**
- `/review` — daily review ritual (new, unverified)
- `/wallet` — dashboard with quick-add sheet
- `/wallet/transactions` — transaction list
- `/wallet/stats` — spending charts
- `/home` — with new onboarding modal

**Common mobile issues to watch for:**
- Horizontal overflow from fixed-width elements
- Touch targets too small (< 44px)
- Text truncation hiding important content
- Sheets/modals not respecting safe-area-inset-bottom

---

## Stream C — E2E Test Confidence

### C.1 Playwright Setup

**Install and configure:**
- `pnpm --filter @vdp/web add -D @playwright/test`
- `npx playwright install chromium` (single browser, fast)
- `apps/web/playwright.config.ts`:
  - testDir: `./e2e`
  - webServer: `pnpm dev` on port 3000
  - baseURL: `http://localhost:3000`
  - use: chromium only, screenshot on failure
  - timeout: 30s per test
- `apps/web/package.json`: add `"test:e2e": "playwright test"`
- Root `package.json`: extend `test:e2e` to include web E2E

**Prerequisite:** Backend server on port 4000 with test database containing the test user (`test@example.com` / `12345678`).

### C.2 Auth Helper

**Shared login utility:**
- `apps/web/e2e/helpers/auth.ts`
- `loginAsTestUser(page)` — navigates to /login, fills credentials, submits, waits for /home redirect
- Used in `beforeEach` or as a Playwright fixture for authenticated tests

### C.3 Critical Path Tests

**File: `apps/web/e2e/daily-loop.spec.ts`**

**Test 1 — Login and Home:**
1. Navigate to /login
2. Fill email + password, submit
3. Assert redirect to /home
4. Assert "Centro de comando" heading visible
5. Assert Tasks card and Wallet card are present

**Test 2 — Task lifecycle:**
1. Login → navigate to /tasks
2. Open quick-capture modal (button click)
3. Type a task title, submit
4. Assert task appears in the list
5. Click complete on the task
6. Assert task shows as completed

**Test 3 — Quick-add expense:**
1. Login → navigate to /wallet
2. Click quick-add button
3. Fill amount, description, select category
4. Submit
5. Assert transaction appears in recent transactions list

**Test 4 — Review ritual:**
1. Login → navigate to /review
2. Assert all 4 sections render (Cerrar tareas, Verificar wallet, Resolver alertas, Decidir mañana)
3. Type a note in the decision textarea
4. Navigate to /home, then back to /review
5. Assert note persisted via localStorage

### C.4 CI Integration

- Add Playwright to GitHub Actions CI pipeline
- Runs after unit tests pass
- Requires both web and server dev servers running
- Screenshots on failure saved as artifacts

---

## What's Explicitly Out of Scope

- Production infrastructure changes (Render tier, cloud embeddings, keep-alive)
- Service worker / offline caching
- Push notifications (browser API)
- New backend modules
- Third domain activation (Health, People, etc.)
- Component-level tests with testing-library (can add incrementally later)
- Visual regression testing
