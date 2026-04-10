# Two-Domain Confidence Phase Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make VDP feel like a trustworthy two-domain product by tightening browser auth trust, making Home visibly two-domain, surfacing persistent cross-domain insights, and polishing the Wallet daily loop.

**Architecture:** Keep the current modular-monolith and shared-shell patterns. Backend changes stay narrow: read-model endpoints and richer cross-domain metadata on top of existing event flows. Frontend changes stay inside existing Next.js route modules, home cards, wallet presentation hooks, and chat action rendering so the product gets stronger without widening scope into new domains.

**Tech Stack:** Next.js 15, React 19, TanStack Query, Vitest, Fastify 5, TypeScript, existing Tasks/Wallet modules

---

## File Structure

- `.github/workflows/ci.yml`
  Locks CI to a deterministic local timezone so date-sensitive trust checks stay stable.
- `apps/web/src/lib/server/backend.ts`
  Shared cookie/proxy helpers for same-origin auth routes.
- `apps/web/src/app/api/auth/login/route.ts`
  Sets the managed `vdp_session` cookie after backend login.
- `apps/web/src/app/api/auth/logout/route.ts`
  Clears the managed session cookie locally and notifies the backend.
- `apps/web/src/app/api/auth/me/route.ts`
  Reads the session cookie, proxies the backend `me` check, and clears stale sessions.
- `apps/web/src/app/api/auth/__tests__/auth-routes.test.ts`
  Route-level regression tests for login, logout, and `/me`.
- `apps/web/src/app/(domain)/home/page.tsx`
  Composes the shared two-domain command-center surface.
- `apps/web/src/components/home/wallet-snapshot-card.tsx`
  Home card for balances, spending summary, and quick Wallet entry points.
- `apps/web/src/components/home/product-focus-card.tsx`
  Replaces the “disabled domains” emphasis with an explicit current-product focus card.
- `apps/web/src/components/home/cross-domain-signals-card.tsx`
  Displays persistent insights that connect Tasks and Wallet.
- `apps/web/src/components/home/__tests__/wallet-snapshot-card.test.tsx`
  Regression tests for the Wallet snapshot card states and copy.
- `apps/web/src/components/home/__tests__/product-focus-card.test.tsx`
  Regression tests for the new focus card.
- `apps/web/src/components/home/__tests__/cross-domain-signals-card.test.tsx`
  Regression tests for the insights card.
- `apps/web/src/features/wallet/presentation/components/dashboard-screen.tsx`
  Main Wallet dashboard entry point.
- `apps/web/src/features/wallet/presentation/components/recent-transactions.tsx`
  Wallet daily-loop transaction summary and empty state.
- `apps/web/src/features/wallet/presentation/__tests__/wallet-dashboard-actions.test.tsx`
  Frontend regression tests for dashboard CTAs and empty-state affordances.
- `apps/web/src/lib/api/tasks.ts`
  Web read-model client for Tasks stats plus persistent insights.
- `apps/web/src/lib/api/wallet.ts`
  Existing Wallet read-model client reused by Home and dashboard.
- `apps/web/src/lib/chat/tool-actions.ts`
  Human-friendly Wallet tool labels and result parsing for chat tool cards.
- `apps/web/src/lib/chat/__tests__/tool-actions.test.ts`
  Regression tests for Wallet tool action summaries.
- `server/src/modules/tasks/services/TaskInsightsStore.ts`
  In-memory source of truth for unread/recent insights and streak data.
- `server/src/modules/tasks/infrastructure/routes/TaskInsightsSSEController.ts`
  Existing SSE controller extended with a read endpoint for Home.
- `server/src/modules/tasks/services/CrossDomainEventHandlers.ts`
  Backend cross-domain bridge from Wallet signals to Tasks insights and review tasks.
- `server/src/modules/tasks/__tests__/e2e/TasksAPI.e2e.test.ts`
  API verification for the new persistent insights endpoint.
- `server/src/modules/tasks/__tests__/services/CrossDomainEventHandlers.test.ts`
  Unit regression coverage for richer cross-domain insight metadata.

### Task 1: Harden Same-Origin Auth Trust

**Files:**
- Create: `apps/web/src/app/api/auth/__tests__/auth-routes.test.ts`
- Modify: `apps/web/src/lib/server/backend.ts`
- Modify: `apps/web/src/app/api/auth/login/route.ts`
- Modify: `apps/web/src/app/api/auth/logout/route.ts`
- Modify: `apps/web/src/app/api/auth/me/route.ts`
- Modify: `.github/workflows/ci.yml`
- Test: `apps/web/src/app/api/auth/__tests__/auth-routes.test.ts`
- Test: `apps/web/src/lib/__tests__/auth.test.ts`

- [ ] **Step 1: Write the failing route-level auth regression tests**

```ts
import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST as loginRoute } from "../login/route";
import { POST as logoutRoute } from "../logout/route";
import { GET as meRoute } from "../me/route";

const cookieSet = vi.fn();
const cookiesMock = vi.fn(async () => ({ get: vi.fn(), set: cookieSet }));
const fetchMock = vi.fn();

vi.mock("next/headers", () => ({ cookies: cookiesMock }));

describe("auth route contract", () => {
  beforeEach(() => {
    cookieSet.mockReset();
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  it("login stores the managed session cookie with the shared options", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        sessionToken: "session-1",
        user: { id: "user-1", email: "owner@vdp.local", displayName: "Owner", role: "user" },
      }),
    });

    await loginRoute(new Request("http://localhost/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: "owner@vdp.local", password: "super-secret-password" }),
      headers: { "Content-Type": "application/json" },
    }) as never);

    expect(cookieSet).toHaveBeenCalledWith(
      "vdp_session",
      "session-1",
      expect.objectContaining({ httpOnly: true, sameSite: "lax", path: "/" }),
    );
  });

  it("me clears the cookie when the backend rejects the session", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ error: "UNAUTHORIZED", message: "Invalid session" }),
    });

    await meRoute(new Request("http://localhost/api/auth/me", {
      headers: { cookie: "vdp_session=stale-token" },
    }) as never);

    expect(cookieSet).toHaveBeenCalledWith(
      "vdp_session",
      "",
      expect.objectContaining({ httpOnly: true, sameSite: "lax", path: "/", maxAge: 0 }),
    );
  });

  it("logout clears the cookie even if the backend call fails", async () => {
    fetchMock.mockRejectedValue(new Error("network down"));

    await logoutRoute(new Request("http://localhost/api/auth/logout", {
      method: "POST",
      headers: { cookie: "vdp_session=stale-token" },
    }) as never);

    expect(cookieSet).toHaveBeenCalledWith(
      "vdp_session",
      "",
      expect.objectContaining({ maxAge: 0 }),
    );
  });
});
```

- [ ] **Step 2: Run the auth route tests to verify they fail**

Run: `pnpm --filter @vdp/web test -- src/app/api/auth/__tests__/auth-routes.test.ts`

Expected: `FAIL` because the route test file does not exist yet and the cookie-clearing helper has not been centralized.

- [ ] **Step 3: Implement shared cookie clearing and deterministic CI**

```ts
// apps/web/src/lib/server/backend.ts
export function clearSessionCookie(
  cookieStore: Pick<Awaited<ReturnType<typeof import("next/headers").cookies>>, "set">,
) {
  cookieStore.set(SESSION_COOKIE_NAME, "", {
    ...getSessionCookieOptions(),
    maxAge: 0,
  });
}
```

```ts
// apps/web/src/app/api/auth/logout/route.ts
import { clearSessionCookie } from "@/lib/server/backend";

// ...
  clearSessionCookie(cookieStore);
  return NextResponse.json({ ok: true });
```

```ts
// apps/web/src/app/api/auth/me/route.ts
import { clearSessionCookie } from "@/lib/server/backend";

// ...
  if (!response.ok) {
    clearSessionCookie(cookieStore);
    return NextResponse.json(payload, { status: response.status });
  }
```

```yaml
# .github/workflows/ci.yml
jobs:
  ci:
    runs-on: ubuntu-latest
    timeout-minutes: 10
    env:
      TZ: America/Argentina/Buenos_Aires
```

- [ ] **Step 4: Run the targeted auth verification**

Run: `pnpm --filter @vdp/web test -- src/app/api/auth/__tests__/auth-routes.test.ts src/lib/__tests__/auth.test.ts`

Expected: `PASS` with the new route tests green and the existing auth helper tests still green.

- [ ] **Step 5: Commit**

```bash
git add .github/workflows/ci.yml \
  apps/web/src/lib/server/backend.ts \
  apps/web/src/app/api/auth/login/route.ts \
  apps/web/src/app/api/auth/logout/route.ts \
  apps/web/src/app/api/auth/me/route.ts \
  apps/web/src/app/api/auth/__tests__/auth-routes.test.ts
git commit -m "test: harden same-origin auth routes"
```

### Task 2: Turn Home Into A Two-Domain Command Center

**Files:**
- Modify: `apps/web/src/app/(domain)/home/page.tsx`
- Create: `apps/web/src/components/home/wallet-snapshot-card.tsx`
- Create: `apps/web/src/components/home/product-focus-card.tsx`
- Create: `apps/web/src/components/home/__tests__/wallet-snapshot-card.test.tsx`
- Create: `apps/web/src/components/home/__tests__/product-focus-card.test.tsx`
- Test: `apps/web/src/components/home/__tests__/wallet-snapshot-card.test.tsx`
- Test: `apps/web/src/components/home/__tests__/product-focus-card.test.tsx`

- [ ] **Step 1: Write the failing Home card tests**

```ts
import { describe, expect, it } from "vitest";
import { renderToString } from "react-dom/server";
import { WalletSnapshotCard } from "../wallet-snapshot-card";
import { ProductFocusCard } from "../product-focus-card";

describe("WalletSnapshotCard", () => {
  it("shows balances, expenses, and a quick link to Wallet", () => {
    const html = renderToString(
      <WalletSnapshotCard
        stats={{ totalIncome: "1200.00", totalExpenses: "450.00", netBalance: "750.00", transactionCount: 8 }}
        recentTransactions={[
          { id: "tx-1", description: "Supermercado", type: "expense", amount: "45.00", currency: "ARS", date: "2026-04-05", accountId: "acc-1", categoryId: null, transferToAccountId: null, tags: [], createdAt: "", updatedAt: "" },
        ]}
      />,
    );

    expect(html).toContain("Wallet");
    expect(html).toContain("750.00");
    expect(html).toContain("/wallet/transactions/new");
  });
});

describe("ProductFocusCard", () => {
  it("states that Tasks and Wallet are the live modules", () => {
    const html = renderToString(<ProductFocusCard />);
    expect(html).toContain("Tasks");
    expect(html).toContain("Wallet");
    expect(html).not.toContain("Próximos módulos");
  });
});
```

- [ ] **Step 2: Run the Home card tests to verify they fail**

Run: `pnpm --filter @vdp/web test -- src/components/home/__tests__/wallet-snapshot-card.test.tsx src/components/home/__tests__/product-focus-card.test.tsx`

Expected: `FAIL` because the new card components do not exist yet.

- [ ] **Step 3: Implement the Home cards and compose them into the page**

```tsx
// apps/web/src/components/home/product-focus-card.tsx
import Link from "next/link";
import { ArrowRight, Wallet, ListChecks } from "lucide-react";

export function ProductFocusCard() {
  return (
    <div className="glass-card-static p-5 space-y-4">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
          Foco actual
        </p>
        <h3 className="mt-2 text-lg font-semibold text-[var(--foreground)]">
          Tasks + Wallet son el producto activo
        </h3>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Este ciclo fortalece los dos dominios en uso antes de activar nuevos módulos.
        </p>
      </div>
      <div className="grid gap-2">
        <Link href="/tasks" className="glass-card flex items-center justify-between p-3">
          <span className="flex items-center gap-2"><ListChecks size={15} /> Tasks</span>
          <ArrowRight size={14} />
        </Link>
        <Link href="/wallet" className="glass-card flex items-center justify-between p-3">
          <span className="flex items-center gap-2"><Wallet size={15} /> Wallet</span>
          <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  );
}
```

```tsx
// apps/web/src/components/home/wallet-snapshot-card.tsx
import Link from "next/link";
import { ArrowRight, CreditCard } from "lucide-react";
import { formatMoney } from "@/lib/format";
import type { Transaction, WalletStatsSummary } from "@/lib/api/types";

export function WalletSnapshotCard({
  stats,
  recentTransactions,
}: {
  stats?: WalletStatsSummary;
  recentTransactions: readonly Transaction[];
}) {
  return (
    <div className="glass-card-static overflow-hidden">
      <div className="flex items-center justify-between border-b border-[var(--glass-border)] p-4">
        <div className="flex items-center gap-2">
          <CreditCard size={16} className="text-[var(--accent)]" />
          <h3 className="text-sm font-medium text-[var(--foreground)]">Wallet</h3>
        </div>
        <Link href="/wallet/transactions/new" className="text-xs text-[var(--accent)]">
          Cargar movimiento
        </Link>
      </div>
      <div className="grid gap-3 p-4 md:grid-cols-3">
        <div>
          <p className="text-[11px] uppercase tracking-wider text-[var(--muted)]">Balance</p>
          <p className="mt-1 text-xl font-semibold text-[var(--foreground)]">
            {stats ? formatMoney(stats.netBalance, "ARS") : "—"}
          </p>
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-wider text-[var(--muted)]">Gastos</p>
          <p className="mt-1 text-xl font-semibold text-[var(--foreground)]">
            {stats ? formatMoney(stats.totalExpenses, "ARS") : "—"}
          </p>
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-wider text-[var(--muted)]">Movimientos</p>
          <p className="mt-1 text-xl font-semibold text-[var(--foreground)]">
            {stats?.transactionCount ?? recentTransactions.length}
          </p>
        </div>
      </div>
    </div>
  );
}
```

```tsx
// apps/web/src/app/(domain)/home/page.tsx
import { walletApi } from "@/lib/api/wallet";
import { walletQueryKeys } from "@/features/wallet/presentation/wallet-query-keys";
import { WalletSnapshotCard } from "@/components/home/wallet-snapshot-card";
import { ProductFocusCard } from "@/components/home/product-focus-card";

// ...
  const { data: walletStats } = useQuery({
    queryKey: walletQueryKeys.statsSummary,
    queryFn: () => walletApi.getStatsSummary(),
  });

  const { data: walletRecent } = useQuery({
    queryKey: walletQueryKeys.recentTransactions,
    queryFn: () => walletApi.getTransactions({ limit: "4" }),
  });

// ...
        <div className="space-y-6">
          <WalletSnapshotCard
            stats={walletStats}
            recentTransactions={walletRecent?.transactions ?? []}
          />
          <WeeklyTrendCard trend={trend} />
          <ProductFocusCard />
        </div>
```

- [ ] **Step 4: Run the Home-focused frontend verification**

Run: `pnpm --filter @vdp/web test -- src/components/home/__tests__/wallet-snapshot-card.test.tsx src/components/home/__tests__/product-focus-card.test.tsx`

Expected: `PASS` with the new cards rendering the two-domain focus and Wallet summary content.

- [ ] **Step 5: Commit**

```bash
git add \
  'apps/web/src/app/(domain)/home/page.tsx' \
  apps/web/src/components/home/wallet-snapshot-card.tsx \
  apps/web/src/components/home/product-focus-card.tsx \
  apps/web/src/components/home/__tests__/wallet-snapshot-card.test.tsx \
  apps/web/src/components/home/__tests__/product-focus-card.test.tsx
git commit -m "feat: reframe home around tasks and wallet"
```

### Task 3: Add A Persistent Insights Read Model

**Files:**
- Modify: `server/src/modules/tasks/services/TaskInsightsStore.ts`
- Modify: `server/src/modules/tasks/infrastructure/routes/TaskInsightsSSEController.ts`
- Modify: `server/src/modules/tasks/__tests__/e2e/TasksAPI.e2e.test.ts`
- Modify: `apps/web/src/lib/api/tasks.ts`
- Modify: `apps/web/src/lib/api/types.ts`
- Create: `apps/web/src/components/home/cross-domain-signals-card.tsx`
- Create: `apps/web/src/components/home/__tests__/cross-domain-signals-card.test.tsx`
- Modify: `apps/web/src/app/(domain)/home/page.tsx`
- Test: `server/src/modules/tasks/__tests__/e2e/TasksAPI.e2e.test.ts`
- Test: `apps/web/src/components/home/__tests__/cross-domain-signals-card.test.tsx`

- [ ] **Step 1: Write the failing backend and frontend insight tests**

```ts
// server/src/modules/tasks/__tests__/e2e/TasksAPI.e2e.test.ts
import { TaskInsightsStore } from "../../services/TaskInsightsStore";

it("returns recent insights for the home dashboard", async () => {
  const insightsStore = testApp.core.services.get(TaskInsightsStore);
  insightsStore.addInsight({
    type: "warning",
    title: "Gasto elevado esta semana",
    message: "Tu gasto subió 60% respecto al promedio.",
    metadata: { source: "wallet.spending.spike" },
  });

  const res = await testApp.app.inject({
    method: "GET",
    url: "/api/v1/tasks/insights?limit=5",
  });

  expect(res.statusCode).toBe(200);
  expect(res.json().insights).toHaveLength(1);
  expect(res.json().insights[0].title).toBe("Gasto elevado esta semana");
});
```

```ts
// apps/web/src/components/home/__tests__/cross-domain-signals-card.test.tsx
import { describe, expect, it } from "vitest";
import { renderToString } from "react-dom/server";
import { CrossDomainSignalsCard } from "../cross-domain-signals-card";

it("renders the latest cross-domain insight and its action link", () => {
  const html = renderToString(
    <CrossDomainSignalsCard
      insights={[
        {
          id: "ins-1",
          type: "warning",
          title: "Gasto elevado esta semana",
          message: "Tu gasto subió 60% respecto al promedio.",
          createdAt: "2026-04-05T12:00:00.000Z",
          metadata: { actionHref: "/wallet/transactions?from=2026-03-30&to=2026-04-05", actionLabel: "Revisar movimientos" },
        },
      ]}
    />,
  );

  expect(html).toContain("Gasto elevado esta semana");
  expect(html).toContain("Revisar movimientos");
});
```

- [ ] **Step 2: Run the insight tests to verify they fail**

Run: `pnpm --filter @vdp/server test:e2e -- modules/tasks/__tests__/e2e/TasksAPI.e2e.test.ts`

Run: `pnpm --filter @vdp/web test -- src/components/home/__tests__/cross-domain-signals-card.test.tsx`

Expected: `FAIL` because the persistent insights endpoint, web types, and home card do not exist yet.

- [ ] **Step 3: Implement the read endpoint, web client, and home card**

```ts
// server/src/modules/tasks/services/TaskInsightsStore.ts
export type InsightRecord = {
  id: string;
  type: InsightType;
  title: string;
  message: string;
  createdAt: Date;
  read: boolean;
  metadata?: Record<string, unknown>;
};

getRecentInsights(limit = 5): InsightRecord[] {
  return [...this.insights]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, limit);
}
```

```ts
// server/src/modules/tasks/infrastructure/routes/TaskInsightsSSEController.ts
registerRoutes(routes: RouteRegister): void {
  routes.get('/', {}, this.list);
  routes.get('/stream', this.stream);
}

private readonly list: RouteContextHandler<{ limit?: string }, undefined, undefined> = async ({
  query,
  reply,
}) => {
  const limit = Number(query?.limit ?? 5);
  return reply.send({
    insights: this.insightsStore.getRecentInsights(Number.isFinite(limit) ? limit : 5),
  });
};
```

```ts
// apps/web/src/lib/api/types.ts
export interface TaskInsight {
  id: string;
  type: "achievement" | "warning" | "suggestion";
  title: string;
  message: string;
  createdAt: string;
  metadata?: Record<string, unknown>;
}
```

```ts
// apps/web/src/lib/api/tasks.ts
import type { TaskInsight } from "./types";

getInsights: (limit = 5) =>
  request<{ insights: TaskInsight[] }>(
    withQueryParams("/tasks/insights", { limit }),
  ),
```

```tsx
// apps/web/src/components/home/cross-domain-signals-card.tsx
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import type { TaskInsight } from "@/lib/api/types";

export function CrossDomainSignalsCard({ insights }: { insights: readonly TaskInsight[] }) {
  return (
    <div className="glass-card-static overflow-hidden">
      <div className="flex items-center gap-2 border-b border-[var(--glass-border)] p-4">
        <AlertTriangle size={16} className="text-[var(--accent-amber)]" />
        <h3 className="text-sm font-medium text-[var(--foreground)]">Señales cruzadas</h3>
      </div>
      <div className="space-y-3 p-4">
        {insights.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">No hay señales nuevas por ahora.</p>
        ) : (
          insights.map((insight) => (
            <div key={insight.id} className="rounded-xl border border-[var(--glass-border)] p-3">
              <p className="text-sm font-medium text-[var(--foreground)]">{insight.title}</p>
              <p className="mt-1 text-xs leading-relaxed text-[var(--muted)]">{insight.message}</p>
              {typeof insight.metadata?.actionHref === "string" && typeof insight.metadata?.actionLabel === "string" ? (
                <Link href={insight.metadata.actionHref} className="mt-3 inline-flex text-xs text-[var(--accent)]">
                  {insight.metadata.actionLabel}
                </Link>
              ) : null}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run the persistent-insights verification**

Run: `pnpm --filter @vdp/server test:e2e -- modules/tasks/__tests__/e2e/TasksAPI.e2e.test.ts`

Run: `pnpm --filter @vdp/web test -- src/components/home/__tests__/cross-domain-signals-card.test.tsx`

Expected: `PASS` with the API returning recent insights and the Home card rendering them.

- [ ] **Step 5: Commit**

```bash
git add \
  server/src/modules/tasks/services/TaskInsightsStore.ts \
  server/src/modules/tasks/infrastructure/routes/TaskInsightsSSEController.ts \
  server/src/modules/tasks/__tests__/e2e/TasksAPI.e2e.test.ts \
  apps/web/src/lib/api/tasks.ts \
  apps/web/src/lib/api/types.ts \
  apps/web/src/components/home/cross-domain-signals-card.tsx \
  apps/web/src/components/home/__tests__/cross-domain-signals-card.test.tsx \
  'apps/web/src/app/(domain)/home/page.tsx'
git commit -m "feat: add persistent task insights for home"
```

### Task 4: Make Spending Spikes Actionable

**Files:**
- Modify: `server/src/modules/tasks/services/CrossDomainEventHandlers.ts`
- Modify: `server/src/modules/tasks/__tests__/services/CrossDomainEventHandlers.test.ts`
- Modify: `apps/web/src/components/home/cross-domain-signals-card.tsx`
- Test: `server/src/modules/tasks/__tests__/services/CrossDomainEventHandlers.test.ts`
- Test: `apps/web/src/components/home/__tests__/cross-domain-signals-card.test.tsx`

- [ ] **Step 1: Write the failing cross-domain metadata tests**

```ts
it("includes a wallet drill-down action in the spending spike insight metadata", async () => {
  const addSpy = vi.spyOn(insightsStore, "addInsight");

  await eventBus.emit(new SpendingSpike({
    userId: "test-user-id",
    totalExpenses: "750.00",
    previousAverage: "300.00",
    percentageIncrease: 150,
    currency: "ARS",
    periodFrom: "2026-03-30",
    periodTo: "2026-04-05",
  }));

  const metadata = addSpy.mock.calls[0][0].metadata as Record<string, unknown>;
  expect(metadata.actionHref).toBe("/wallet/transactions?from=2026-03-30&to=2026-04-05");
  expect(metadata.actionLabel).toBe("Revisar movimientos");
  expect(metadata.source).toBe("wallet.spending.spike");
});
```

- [ ] **Step 2: Run the cross-domain handler tests to verify they fail**

Run: `pnpm --filter @vdp/server test:unit -- modules/tasks/__tests__/services/CrossDomainEventHandlers.test.ts`

Expected: `FAIL` because the action metadata is not attached yet.

- [ ] **Step 3: Attach drill-down metadata and render it in Home**

```ts
// server/src/modules/tasks/services/CrossDomainEventHandlers.ts
this.insightsStore.addInsight({
  type: "warning",
  title: "Gasto elevado esta semana",
  message:
    `Tu gasto subió ${payload.percentageIncrease}% respecto al promedio ` +
    `($${payload.totalExpenses} vs $${payload.previousAverage} ${payload.currency}). ` +
    `Revisá los movimientos de la semana y ajustá prioridades si hace falta.`,
  metadata: {
    source: "wallet.spending.spike",
    totalExpenses: payload.totalExpenses,
    previousAverage: payload.previousAverage,
    percentageIncrease: payload.percentageIncrease,
    currency: payload.currency,
    periodFrom: payload.periodFrom,
    periodTo: payload.periodTo,
    actionHref: `/wallet/transactions?from=${payload.periodFrom}&to=${payload.periodTo}`,
    actionLabel: "Revisar movimientos",
  },
});
```

```tsx
// apps/web/src/components/home/cross-domain-signals-card.tsx
{typeof insight.metadata?.periodFrom === "string" && typeof insight.metadata?.periodTo === "string" ? (
  <p className="mt-2 text-[11px] text-[var(--muted)]">
    Ventana: {insight.metadata.periodFrom} → {insight.metadata.periodTo}
  </p>
) : null}
```

- [ ] **Step 4: Run the handler and card verification**

Run: `pnpm --filter @vdp/server test:unit -- modules/tasks/__tests__/services/CrossDomainEventHandlers.test.ts`

Run: `pnpm --filter @vdp/web test -- src/components/home/__tests__/cross-domain-signals-card.test.tsx`

Expected: `PASS` with the richer wallet drill-down metadata visible to both backend tests and the Home card.

- [ ] **Step 5: Commit**

```bash
git add \
  server/src/modules/tasks/services/CrossDomainEventHandlers.ts \
  server/src/modules/tasks/__tests__/services/CrossDomainEventHandlers.test.ts \
  apps/web/src/components/home/cross-domain-signals-card.tsx
git commit -m "feat: add actionable spending spike insights"
```

### Task 5: Make Wallet Chat Tool Results Read Like Product UI

**Files:**
- Modify: `apps/web/src/lib/chat/tool-actions.ts`
- Create: `apps/web/src/lib/chat/__tests__/tool-actions.test.ts`
- Test: `apps/web/src/lib/chat/__tests__/tool-actions.test.ts`

- [ ] **Step 1: Write the failing Wallet tool-action tests**

```ts
import { describe, expect, it } from "vitest";
import { getToolDisplayName, parseToolAction } from "../tool-actions";

describe("wallet tool actions", () => {
  it("shows a friendly label for log_transaction", () => {
    expect(getToolDisplayName("log_transaction")).toBe("Registrar movimiento");
  });

  it("summarizes a logged transaction", () => {
    const view = parseToolAction(
      "log_transaction",
      JSON.stringify({
        id: "tx-1",
        type: "expense",
        amount: "1500.00",
        currency: "ARS",
        description: "Supermercado",
        date: "2026-04-05",
      }),
    );

    expect(view.title).toContain("Movimiento registrado");
    expect(view.detail).toContain("Supermercado");
    expect(view.tone).toBe("success");
  });

  it("summarizes spending_summary", () => {
    const view = parseToolAction(
      "spending_summary",
      JSON.stringify({ totalExpenses: "45000.00", topCategory: "Comida", currency: "ARS" }),
    );

    expect(view.title).toBe("Resumen de gastos");
    expect(view.detail).toContain("45000.00");
  });
});
```

- [ ] **Step 2: Run the Wallet tool-action tests to verify they fail**

Run: `pnpm --filter @vdp/web test -- src/lib/chat/__tests__/tool-actions.test.ts`

Expected: `FAIL` because the Wallet tool names and result parsers are not implemented yet.

- [ ] **Step 3: Implement Wallet labels and result parsing**

```ts
// apps/web/src/lib/chat/tool-actions.ts
export function getToolDisplayName(tool: string) {
  switch (tool) {
    case "get_accounts":
      return "Ver cuentas";
    case "create_account":
      return "Crear cuenta";
    case "list_transactions":
      return "Ver movimientos";
    case "log_transaction":
      return "Registrar movimiento";
    case "get_balance":
      return "Ver balance";
    case "spending_summary":
      return "Resumen de gastos";
    case "list_savings_goals":
      return "Ver ahorros";
    case "create_savings_goal":
      return "Crear objetivo de ahorro";
    case "contribute_savings":
      return "Aportar a ahorros";
    case "list_investments":
      return "Ver inversiones";
    case "create_investment":
      return "Crear inversión";
    default:
      return tool;
  }
}
```

```ts
if (tool === "log_transaction" && isRecord(parsed)) {
  return {
    title: `Movimiento registrado: ${asString(parsed.description) || "Sin descripción"}`,
    detail: `${asString(parsed.amount) || "0.00"} ${asString(parsed.currency) || "ARS"} · ${asString(parsed.date) || "Sin fecha"}`,
    tone: "success",
  };
}

if (tool === "spending_summary" && isRecord(parsed)) {
  return {
    title: "Resumen de gastos",
    detail: `${asString(parsed.totalExpenses) || "0.00"} ${asString(parsed.currency) || "ARS"} · principal: ${asString(parsed.topCategory) || "Sin categoría"}`,
    tone: "info",
  };
}
```

- [ ] **Step 4: Run the Wallet chat-summary verification**

Run: `pnpm --filter @vdp/web test -- src/lib/chat/__tests__/tool-actions.test.ts`

Expected: `PASS` with Wallet tool results showing product-quality labels and summaries.

- [ ] **Step 5: Commit**

```bash
git add \
  apps/web/src/lib/chat/tool-actions.ts \
  apps/web/src/lib/chat/__tests__/tool-actions.test.ts
git commit -m "feat: improve wallet chat action summaries"
```

### Task 6: Polish The Wallet Daily Loop

**Files:**
- Modify: `apps/web/src/features/wallet/presentation/components/dashboard-screen.tsx`
- Modify: `apps/web/src/features/wallet/presentation/components/recent-transactions.tsx`
- Create: `apps/web/src/features/wallet/presentation/__tests__/wallet-dashboard-actions.test.tsx`
- Test: `apps/web/src/features/wallet/presentation/__tests__/wallet-dashboard-actions.test.tsx`

- [ ] **Step 1: Write the failing Wallet dashboard CTA tests**

```ts
import { describe, expect, it } from "vitest";
import { renderToString } from "react-dom/server";
import { RecentTransactions } from "../components/recent-transactions";

describe("wallet dashboard actions", () => {
  it("shows a direct CTA to create a transaction when there are no movements", () => {
    const html = renderToString(
      <RecentTransactions transactions={[]} isLoading={false} />,
    );

    expect(html).toContain("/wallet/transactions/new");
    expect(html).toContain("Crear primera transacción");
  });
});
```

- [ ] **Step 2: Run the Wallet dashboard tests to verify they fail**

Run: `pnpm --filter @vdp/web test -- src/features/wallet/presentation/__tests__/wallet-dashboard-actions.test.tsx`

Expected: `FAIL` because the empty-state CTA does not exist yet.

- [ ] **Step 3: Implement stronger Wallet CTAs**

```tsx
// apps/web/src/features/wallet/presentation/components/dashboard-screen.tsx
import Link from "next/link";
import { Plus, ArrowRight } from "lucide-react";

// inside the header block
<div className="flex items-center gap-2">
  <Link href="/wallet/transactions/new" className="btn-primary">
    <Plus size={16} />
    Nuevo movimiento
  </Link>
  <Link href="/wallet/stats" className="btn-secondary">
    Ver estadísticas
    <ArrowRight size={14} />
  </Link>
</div>
```

```tsx
// apps/web/src/features/wallet/presentation/components/recent-transactions.tsx
} : transactions.length === 0 ? (
  <div className="p-12 text-center">
    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--hover-overlay)]">
      <ArrowUpRight size={20} className="text-[var(--muted)]" />
    </div>
    <p className="text-sm text-[var(--muted)]">No hay transacciones aún</p>
    <p className="mt-1 text-xs text-[var(--muted)]">
      Empezá por registrar tu primer movimiento.
    </p>
    <Link href="/wallet/transactions/new" className="btn-primary mt-4 inline-flex">
      Crear primera transacción
    </Link>
  </div>
```

- [ ] **Step 4: Run the Wallet daily-loop verification**

Run: `pnpm --filter @vdp/web test -- src/features/wallet/presentation/__tests__/wallet-dashboard-actions.test.tsx`

Expected: `PASS` with the dashboard exposing direct daily-loop entry points.

- [ ] **Step 5: Commit**

```bash
git add \
  apps/web/src/features/wallet/presentation/components/dashboard-screen.tsx \
  apps/web/src/features/wallet/presentation/components/recent-transactions.tsx \
  apps/web/src/features/wallet/presentation/__tests__/wallet-dashboard-actions.test.tsx
git commit -m "feat: strengthen wallet dashboard entry points"
```

## Final Verification Sweep

- Run: `pnpm --filter @vdp/web test`
- Run: `pnpm --filter @vdp/server test:unit`
- Run: `pnpm --filter @vdp/server test:e2e -- modules/tasks/__tests__/e2e/TasksAPI.e2e.test.ts modules/auth/__tests__/e2e/AuthAPI.e2e.test.ts`
- Run: `pnpm --filter @vdp/web build`
- Run: `pnpm --filter @vdp/server exec tsc --noEmit`

Expected:

- Web tests pass with the new Home cards, auth route tests, and Wallet chat summaries.
- Server unit tests pass with the richer cross-domain metadata.
- Targeted e2e tests pass for auth and persistent insights.
- Web build and server type-check stay green.
