# Stream A — AI Intelligence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make VDP's AI feel smart by enriching each domain's chat with cross-domain context, adding Wallet spending analysis tools, wiring recommendations and spending signals into the toast pipeline, and enhancing the Wallet system prompt.

**Architecture:** Cross-domain context flows through snapshot services (`GetTasksSnapshot`, `GetWalletSnapshot`) that are called at prompt-build time. Both use the shared `ServiceProvider` — no new DI wiring. New Wallet intelligence tools (`GetSpendingAnomalies`, `GetCategoryTrends`) follow the existing service → agent-tool pattern. Toasts flow through `TaskInsightsStore` (existing) and a new `WalletInsightsStore` that mirrors it, both broadcasting via the shared `SSEBroadcaster`.

**Tech Stack:** Fastify 5, TypeScript 5.7, Vitest 3, existing Tasks/Wallet modules, ServiceProvider DI

---

## File Structure

### New files
- `server/src/modules/wallet/services/GetWalletSnapshot.ts` — Wallet context snapshot for Tasks agent
- `server/src/modules/wallet/services/GetSpendingAnomalies.ts` — Category anomaly detection service
- `server/src/modules/wallet/services/GetCategoryTrends.ts` — Week-over-week trend service
- `server/src/modules/wallet/services/WalletInsightsStore.ts` — In-memory insight store (mirrors TaskInsightsStore)
- `server/src/modules/wallet/services/WalletInsightFactory.ts` — Factory for wallet insight messages
- `server/src/modules/wallet/infrastructure/agent/tools/intelligence-tools.ts` — Wallet intelligence agent tools
- `server/src/modules/tasks/services/GetTasksSnapshot.ts` — Tasks context snapshot for Wallet agent
- `server/src/modules/wallet/infrastructure/routes/WalletInsightsSSEController.ts` — SSE endpoint for wallet insights
- `server/src/modules/wallet/__tests__/services/GetSpendingAnomalies.test.ts` — Unit tests
- `server/src/modules/wallet/__tests__/services/GetCategoryTrends.test.ts` — Unit tests
- `server/src/modules/wallet/__tests__/services/GetWalletSnapshot.test.ts` — Unit tests
- `server/src/modules/wallet/__tests__/services/WalletInsightsStore.test.ts` — Unit tests
- `server/src/modules/tasks/__tests__/services/GetTasksSnapshot.test.ts` — Unit tests

### Modified files
- `server/src/modules/tasks/infrastructure/agent/system-prompt.ts` — Add cross-domain context slot
- `server/src/modules/tasks/infrastructure/agent/TaskAgent.ts` — Override system prompt with dynamic getter
- `server/src/modules/wallet/infrastructure/agent/system-prompt.ts` — Rewrite to be proactive + cross-domain aware
- `server/src/modules/wallet/infrastructure/agent/WalletAgent.ts` — Override system prompt with dynamic getter + add intelligence tools
- `server/src/modules/wallet/infrastructure/agent/tools.ts` — Add intelligence tools to tool composition
- `server/src/modules/wallet/WalletModuleRuntime.ts` — Register new services, wire insights SSE, pass insightsStore
- `server/src/modules/wallet/WalletModule.ts` — Pass insightsStore to runtime
- `server/src/modules/wallet/services/WalletEventHandlers.ts` — Write to WalletInsightsStore on spending spike
- `server/src/modules/tasks/TaskModuleRuntime.ts` — Register GetTasksSnapshot
- `server/src/modules/common/base/agents/BaseAgent.ts` — Make systemPrompt a getter (non-breaking)
- `apps/web/src/hooks/use-insights-sse.ts` — Connect to wallet insights SSE stream too
- `apps/web/src/features/review/presentation/use-daily-review-model.ts` — Fetch anomalies/trends for review

---

### Task 1: GetWalletSnapshot service + tests

**Files:**
- Create: `server/src/modules/wallet/services/GetWalletSnapshot.ts`
- Create: `server/src/modules/wallet/__tests__/services/GetWalletSnapshot.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// server/src/modules/wallet/__tests__/services/GetWalletSnapshot.test.ts
import { describe, it, expect } from 'vitest';
import { GetWalletSnapshot, WalletSnapshot } from '../../services/GetWalletSnapshot';
import { FakeTransactionRepository } from '../../infrastructure/db/FakeTransactionRepository';
import { FakeCategoryRepository } from '../../infrastructure/db/FakeCategoryRepository';

describe('GetWalletSnapshot', () => {
    function createService() {
        const transactions = new FakeTransactionRepository();
        const categories = new FakeCategoryRepository();
        return { service: new GetWalletSnapshot(transactions, categories), transactions, categories };
    }

    it('returns empty snapshot when no transactions exist', async () => {
        const { service } = createService();
        const result = await service.execute('user-1');

        expect(result).toEqual<WalletSnapshot>({
            todaySpending: { totalIncome: '0.00', totalExpenses: '0.00', netBalance: '0.00', transactionCount: 0 },
            topCategories: [],
            anomalies: [],
        });
    });

    it('returns today spending summary from transactions', async () => {
        const { service, transactions, categories } = createService();
        const cat = await categories.create('user-1', { name: 'Comida', type: 'expense' });
        await transactions.create('user-1', {
            accountId: 'acc-1', type: 'expense', amount: '5000', currency: 'ARS',
            description: 'Almuerzo', date: new Date().toISOString().slice(0, 10), categoryId: cat.id, tags: [],
        });

        const result = await service.execute('user-1');
        expect(result.todaySpending.totalExpenses).toBe('5000.00');
        expect(result.todaySpending.transactionCount).toBe(1);
    });

    it('returns top 3 categories sorted by amount', async () => {
        const { service, transactions, categories } = createService();
        const today = new Date().toISOString().slice(0, 10);
        const c1 = await categories.create('user-1', { name: 'Comida', type: 'expense' });
        const c2 = await categories.create('user-1', { name: 'Transporte', type: 'expense' });
        const c3 = await categories.create('user-1', { name: 'Entretenimiento', type: 'expense' });
        const c4 = await categories.create('user-1', { name: 'Ropa', type: 'expense' });

        await transactions.create('user-1', { accountId: 'a', type: 'expense', amount: '1000', currency: 'ARS', description: '', date: today, categoryId: c1.id, tags: [] });
        await transactions.create('user-1', { accountId: 'a', type: 'expense', amount: '3000', currency: 'ARS', description: '', date: today, categoryId: c2.id, tags: [] });
        await transactions.create('user-1', { accountId: 'a', type: 'expense', amount: '500', currency: 'ARS', description: '', date: today, categoryId: c3.id, tags: [] });
        await transactions.create('user-1', { accountId: 'a', type: 'expense', amount: '200', currency: 'ARS', description: '', date: today, categoryId: c4.id, tags: [] });

        const result = await service.execute('user-1');
        expect(result.topCategories).toHaveLength(3);
        expect(result.topCategories[0].categoryName).toBe('Transporte');
        expect(result.topCategories[1].categoryName).toBe('Comida');
        expect(result.topCategories[2].categoryName).toBe('Entretenimiento');
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /Users/lautarodamore/Documents/vdp && pnpm --filter @vdp/server test:unit -- --run GetWalletSnapshot`
Expected: FAIL — module `GetWalletSnapshot` does not exist

- [ ] **Step 3: Write minimal implementation**

```ts
// server/src/modules/wallet/services/GetWalletSnapshot.ts
import { TransactionRepository } from '../domain/TransactionRepository';
import { CategoryRepository } from '../domain/CategoryRepository';
import { localDateISO } from '../../common/base/time/dates';

export type WalletSnapshotSpending = {
    readonly totalIncome: string;
    readonly totalExpenses: string;
    readonly netBalance: string;
    readonly transactionCount: number;
};

export type WalletSnapshotCategory = {
    readonly categoryName: string;
    readonly total: number;
};

export type WalletSnapshotAnomaly = {
    readonly category: string;
    readonly currentWeek: number;
    readonly average: number;
    readonly percentageChange: number;
};

export type WalletSnapshot = {
    readonly todaySpending: WalletSnapshotSpending;
    readonly topCategories: readonly WalletSnapshotCategory[];
    readonly anomalies: readonly WalletSnapshotAnomaly[];
};

export class GetWalletSnapshot {
    constructor(
        private readonly transactions: TransactionRepository,
        private readonly categories: CategoryRepository,
    ) {}

    async execute(userId: string): Promise<WalletSnapshot> {
        const today = localDateISO(new Date());
        const todaySpending = await this.getTodaySpending(userId, today);
        const topCategories = await this.getTopCategories(userId, today);

        return {
            todaySpending,
            topCategories,
            anomalies: [], // Populated by GetSpendingAnomalies in Task 2
        };
    }

    private async getTodaySpending(userId: string, today: string): Promise<WalletSnapshotSpending> {
        const result = await this.transactions.list(userId, {
            from: today,
            to: today,
            limit: 10000,
            offset: 0,
        });

        let totalIncome = 0;
        let totalExpenses = 0;

        for (const tx of result.transactions) {
            const amount = parseFloat(tx.amount);
            if (tx.type === 'income') totalIncome += amount;
            else if (tx.type === 'expense') totalExpenses += amount;
        }

        return {
            totalIncome: totalIncome.toFixed(2),
            totalExpenses: totalExpenses.toFixed(2),
            netBalance: (totalIncome - totalExpenses).toFixed(2),
            transactionCount: result.total,
        };
    }

    private async getTopCategories(userId: string, today: string): Promise<WalletSnapshotCategory[]> {
        const weekStart = this.mondayOfWeek(new Date());
        const result = await this.transactions.list(userId, {
            from: weekStart,
            to: today,
            type: 'expense',
            limit: 10000,
            offset: 0,
        });

        const categories = await this.categories.findAll(userId, 'expense');
        const categoryNames = new Map(categories.map((c) => [c.id, c.name]));
        const totals = new Map<string, number>();

        for (const tx of result.transactions) {
            const name = tx.categoryId ? (categoryNames.get(tx.categoryId) ?? 'Sin categoría') : 'Sin categoría';
            totals.set(name, (totals.get(name) ?? 0) + parseFloat(tx.amount));
        }

        return Array.from(totals.entries())
            .map(([categoryName, total]) => ({ categoryName, total: Number(total.toFixed(2)) }))
            .sort((a, b) => b.total - a.total)
            .slice(0, 3);
    }

    private mondayOfWeek(date: Date): string {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        d.setDate(diff);
        return localDateISO(d);
    }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd /Users/lautarodamore/Documents/vdp && pnpm --filter @vdp/server test:unit -- --run GetWalletSnapshot`
Expected: PASS — 3 tests

- [ ] **Step 5: Commit**

```bash
git add server/src/modules/wallet/services/GetWalletSnapshot.ts server/src/modules/wallet/__tests__/services/GetWalletSnapshot.test.ts
git commit -m "feat: add GetWalletSnapshot service for cross-domain prompt enrichment"
```

---

### Task 2: GetSpendingAnomalies service + tests

**Files:**
- Create: `server/src/modules/wallet/services/GetSpendingAnomalies.ts`
- Create: `server/src/modules/wallet/__tests__/services/GetSpendingAnomalies.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// server/src/modules/wallet/__tests__/services/GetSpendingAnomalies.test.ts
import { describe, it, expect } from 'vitest';
import { GetSpendingAnomalies, SpendingAnomaly } from '../../services/GetSpendingAnomalies';
import { FakeTransactionRepository } from '../../infrastructure/db/FakeTransactionRepository';
import { FakeCategoryRepository } from '../../infrastructure/db/FakeCategoryRepository';
import { localDateISO } from '../../../common/base/time/dates';

describe('GetSpendingAnomalies', () => {
    function createService() {
        const transactions = new FakeTransactionRepository();
        const categories = new FakeCategoryRepository();
        return { service: new GetSpendingAnomalies(transactions, categories), transactions, categories };
    }

    it('returns empty array when no transactions exist', async () => {
        const { service } = createService();
        const result = await service.execute('user-1');
        expect(result).toEqual([]);
    });

    it('detects anomaly when current week exceeds 4-week average by >50%', async () => {
        const { service, transactions, categories } = createService();
        const cat = await categories.create('user-1', { name: 'Delivery', type: 'expense' });

        // Previous 4 weeks: $1000 each week
        for (let week = 1; week <= 4; week++) {
            const date = new Date();
            date.setDate(date.getDate() - (week * 7));
            await transactions.create('user-1', {
                accountId: 'a', type: 'expense', amount: '1000', currency: 'ARS',
                description: '', date: localDateISO(date), categoryId: cat.id, tags: [],
            });
        }

        // Current week: $2000 (100% increase > 50% threshold)
        await transactions.create('user-1', {
            accountId: 'a', type: 'expense', amount: '2000', currency: 'ARS',
            description: '', date: localDateISO(new Date()), categoryId: cat.id, tags: [],
        });

        const result = await service.execute('user-1');
        expect(result).toHaveLength(1);
        expect(result[0].category).toBe('Delivery');
        expect(result[0].percentageChange).toBeGreaterThanOrEqual(50);
        expect(result[0].direction).toBe('up');
    });

    it('ignores categories within normal range', async () => {
        const { service, transactions, categories } = createService();
        const cat = await categories.create('user-1', { name: 'Comida', type: 'expense' });

        // Previous 4 weeks and current week: all $1000 — no anomaly
        for (let week = 0; week <= 4; week++) {
            const date = new Date();
            date.setDate(date.getDate() - (week * 7));
            await transactions.create('user-1', {
                accountId: 'a', type: 'expense', amount: '1000', currency: 'ARS',
                description: '', date: localDateISO(date), categoryId: cat.id, tags: [],
            });
        }

        const result = await service.execute('user-1');
        expect(result).toEqual([]);
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /Users/lautarodamore/Documents/vdp && pnpm --filter @vdp/server test:unit -- --run GetSpendingAnomalies`
Expected: FAIL — module `GetSpendingAnomalies` does not exist

- [ ] **Step 3: Write minimal implementation**

```ts
// server/src/modules/wallet/services/GetSpendingAnomalies.ts
import { TransactionRepository } from '../domain/TransactionRepository';
import { CategoryRepository } from '../domain/CategoryRepository';
import { localDateISO } from '../../common/base/time/dates';

const ANOMALY_THRESHOLD_PERCENT = 50;
const COMPARISON_WEEKS = 4;

export type SpendingAnomaly = {
    readonly category: string;
    readonly currentWeek: number;
    readonly average: number;
    readonly percentageChange: number;
    readonly direction: 'up' | 'down';
};

export class GetSpendingAnomalies {
    constructor(
        private readonly transactions: TransactionRepository,
        private readonly categories: CategoryRepository,
    ) {}

    async execute(userId: string): Promise<SpendingAnomaly[]> {
        const now = new Date();
        const weekStart = this.mondayOfWeek(now);
        const today = localDateISO(now);

        // Get current week expenses by category
        const currentWeekTotals = await this.getCategoryTotals(userId, weekStart, today);

        // Get previous 4 weeks average per category
        const previousAverages = await this.getPreviousAverage(userId, now);

        const anomalies: SpendingAnomaly[] = [];
        const categories = await this.categories.findAll(userId, 'expense');
        const categoryNames = new Map(categories.map((c) => [c.id, c.name]));

        for (const [categoryId, currentAmount] of currentWeekTotals) {
            const average = previousAverages.get(categoryId) ?? 0;
            if (average === 0) continue; // Can't compare without history

            const percentageChange = ((currentAmount - average) / average) * 100;
            if (Math.abs(percentageChange) >= ANOMALY_THRESHOLD_PERCENT) {
                anomalies.push({
                    category: categoryNames.get(categoryId) ?? 'Sin categoría',
                    currentWeek: Number(currentAmount.toFixed(2)),
                    average: Number(average.toFixed(2)),
                    percentageChange: Math.round(percentageChange),
                    direction: percentageChange > 0 ? 'up' : 'down',
                });
            }
        }

        return anomalies.sort((a, b) => Math.abs(b.percentageChange) - Math.abs(a.percentageChange));
    }

    private async getCategoryTotals(userId: string, from: string, to: string): Promise<Map<string, number>> {
        const result = await this.transactions.list(userId, {
            from, to, type: 'expense', limit: 10000, offset: 0,
        });

        const totals = new Map<string, number>();
        for (const tx of result.transactions) {
            if (!tx.categoryId) continue;
            totals.set(tx.categoryId, (totals.get(tx.categoryId) ?? 0) + parseFloat(tx.amount));
        }
        return totals;
    }

    private async getPreviousAverage(userId: string, now: Date): Promise<Map<string, number>> {
        const weeklyTotals: Map<string, number[]> = new Map();

        for (let week = 1; week <= COMPARISON_WEEKS; week++) {
            const weekEnd = new Date(now);
            weekEnd.setDate(weekEnd.getDate() - (week * 7));
            const weekStart = this.mondayOfWeek(weekEnd);
            const weekEndStr = localDateISO(weekEnd);

            const totals = await this.getCategoryTotals(userId, weekStart, weekEndStr);
            for (const [categoryId, amount] of totals) {
                const existing = weeklyTotals.get(categoryId) ?? [];
                existing.push(amount);
                weeklyTotals.set(categoryId, existing);
            }
        }

        const averages = new Map<string, number>();
        for (const [categoryId, weeks] of weeklyTotals) {
            averages.set(categoryId, weeks.reduce((s, v) => s + v, 0) / weeks.length);
        }
        return averages;
    }

    private mondayOfWeek(date: Date): string {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        d.setDate(diff);
        return localDateISO(d);
    }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd /Users/lautarodamore/Documents/vdp && pnpm --filter @vdp/server test:unit -- --run GetSpendingAnomalies`
Expected: PASS — 3 tests

- [ ] **Step 5: Commit**

```bash
git add server/src/modules/wallet/services/GetSpendingAnomalies.ts server/src/modules/wallet/__tests__/services/GetSpendingAnomalies.test.ts
git commit -m "feat: add GetSpendingAnomalies service for wallet intelligence"
```

---

### Task 3: GetCategoryTrends service + tests

**Files:**
- Create: `server/src/modules/wallet/services/GetCategoryTrends.ts`
- Create: `server/src/modules/wallet/__tests__/services/GetCategoryTrends.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// server/src/modules/wallet/__tests__/services/GetCategoryTrends.test.ts
import { describe, it, expect } from 'vitest';
import { GetCategoryTrends, CategoryTrend } from '../../services/GetCategoryTrends';
import { FakeTransactionRepository } from '../../infrastructure/db/FakeTransactionRepository';
import { FakeCategoryRepository } from '../../infrastructure/db/FakeCategoryRepository';
import { localDateISO } from '../../../common/base/time/dates';

describe('GetCategoryTrends', () => {
    function createService() {
        const transactions = new FakeTransactionRepository();
        const categories = new FakeCategoryRepository();
        return { service: new GetCategoryTrends(transactions, categories), transactions, categories };
    }

    it('returns empty array when no transactions exist', async () => {
        const { service } = createService();
        const result = await service.execute('user-1');
        expect(result).toEqual([]);
    });

    it('marks category as up when this week > last week by >10%', async () => {
        const { service, transactions, categories } = createService();
        const cat = await categories.create('user-1', { name: 'Transporte', type: 'expense' });

        // Last week: $1000
        const lastWeek = new Date();
        lastWeek.setDate(lastWeek.getDate() - 7);
        await transactions.create('user-1', {
            accountId: 'a', type: 'expense', amount: '1000', currency: 'ARS',
            description: '', date: localDateISO(lastWeek), categoryId: cat.id, tags: [],
        });

        // This week: $1500 (50% up)
        await transactions.create('user-1', {
            accountId: 'a', type: 'expense', amount: '1500', currency: 'ARS',
            description: '', date: localDateISO(new Date()), categoryId: cat.id, tags: [],
        });

        const result = await service.execute('user-1');
        expect(result).toHaveLength(1);
        expect(result[0].category).toBe('Transporte');
        expect(result[0].trend).toBe('up');
        expect(result[0].thisWeek).toBe(1500);
        expect(result[0].lastWeek).toBe(1000);
    });

    it('marks category as stable when change is within ±10%', async () => {
        const { service, transactions, categories } = createService();
        const cat = await categories.create('user-1', { name: 'Comida', type: 'expense' });

        const lastWeek = new Date();
        lastWeek.setDate(lastWeek.getDate() - 7);
        await transactions.create('user-1', {
            accountId: 'a', type: 'expense', amount: '1000', currency: 'ARS',
            description: '', date: localDateISO(lastWeek), categoryId: cat.id, tags: [],
        });

        await transactions.create('user-1', {
            accountId: 'a', type: 'expense', amount: '1050', currency: 'ARS',
            description: '', date: localDateISO(new Date()), categoryId: cat.id, tags: [],
        });

        const result = await service.execute('user-1');
        expect(result).toHaveLength(1);
        expect(result[0].trend).toBe('stable');
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /Users/lautarodamore/Documents/vdp && pnpm --filter @vdp/server test:unit -- --run GetCategoryTrends`
Expected: FAIL — module `GetCategoryTrends` does not exist

- [ ] **Step 3: Write minimal implementation**

```ts
// server/src/modules/wallet/services/GetCategoryTrends.ts
import { TransactionRepository } from '../domain/TransactionRepository';
import { CategoryRepository } from '../domain/CategoryRepository';
import { localDateISO } from '../../common/base/time/dates';

const STABLE_THRESHOLD_PERCENT = 10;

export type CategoryTrend = {
    readonly category: string;
    readonly thisWeek: number;
    readonly lastWeek: number;
    readonly change: number;
    readonly trend: 'up' | 'down' | 'stable';
};

export class GetCategoryTrends {
    constructor(
        private readonly transactions: TransactionRepository,
        private readonly categories: CategoryRepository,
    ) {}

    async execute(userId: string): Promise<CategoryTrend[]> {
        const now = new Date();
        const thisWeekStart = this.mondayOfWeek(now);
        const today = localDateISO(now);

        const lastWeekEnd = new Date(now);
        lastWeekEnd.setDate(lastWeekEnd.getDate() - 7);
        const lastWeekStart = this.mondayOfWeek(lastWeekEnd);
        const lastWeekEndStr = this.sundayOfWeek(lastWeekEnd);

        const thisWeekTotals = await this.getCategoryTotals(userId, thisWeekStart, today);
        const lastWeekTotals = await this.getCategoryTotals(userId, lastWeekStart, lastWeekEndStr);

        const categories = await this.categories.findAll(userId, 'expense');
        const categoryNames = new Map(categories.map((c) => [c.id, c.name]));

        const allCategoryIds = new Set([...thisWeekTotals.keys(), ...lastWeekTotals.keys()]);
        const trends: CategoryTrend[] = [];

        for (const categoryId of allCategoryIds) {
            const thisWeek = thisWeekTotals.get(categoryId) ?? 0;
            const lastWeek = lastWeekTotals.get(categoryId) ?? 0;

            if (thisWeek === 0 && lastWeek === 0) continue;

            const change = lastWeek === 0 ? 100 : ((thisWeek - lastWeek) / lastWeek) * 100;
            const trend: 'up' | 'down' | 'stable' =
                Math.abs(change) <= STABLE_THRESHOLD_PERCENT ? 'stable' :
                change > 0 ? 'up' : 'down';

            trends.push({
                category: categoryNames.get(categoryId) ?? 'Sin categoría',
                thisWeek: Number(thisWeek.toFixed(2)),
                lastWeek: Number(lastWeek.toFixed(2)),
                change: Math.round(change),
                trend,
            });
        }

        return trends.sort((a, b) => Math.abs(b.change) - Math.abs(a.change));
    }

    private async getCategoryTotals(userId: string, from: string, to: string): Promise<Map<string, number>> {
        const result = await this.transactions.list(userId, {
            from, to, type: 'expense', limit: 10000, offset: 0,
        });

        const totals = new Map<string, number>();
        for (const tx of result.transactions) {
            if (!tx.categoryId) continue;
            totals.set(tx.categoryId, (totals.get(tx.categoryId) ?? 0) + parseFloat(tx.amount));
        }
        return totals;
    }

    private mondayOfWeek(date: Date): string {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        d.setDate(diff);
        return localDateISO(d);
    }

    private sundayOfWeek(date: Date): string {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? 0 : 7);
        d.setDate(diff);
        return localDateISO(d);
    }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd /Users/lautarodamore/Documents/vdp && pnpm --filter @vdp/server test:unit -- --run GetCategoryTrends`
Expected: PASS — 3 tests

- [ ] **Step 5: Commit**

```bash
git add server/src/modules/wallet/services/GetCategoryTrends.ts server/src/modules/wallet/__tests__/services/GetCategoryTrends.test.ts
git commit -m "feat: add GetCategoryTrends service for wallet intelligence"
```

---

### Task 4: GetTasksSnapshot service + tests

**Files:**
- Create: `server/src/modules/tasks/services/GetTasksSnapshot.ts`
- Create: `server/src/modules/tasks/__tests__/services/GetTasksSnapshot.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// server/src/modules/tasks/__tests__/services/GetTasksSnapshot.test.ts
import { describe, it, expect } from 'vitest';
import { GetTasksSnapshot, TasksSnapshot } from '../../services/GetTasksSnapshot';
import { FakeTaskRepository } from '../../infrastructure/db/FakeTaskRepository';

describe('GetTasksSnapshot', () => {
    function createService() {
        const tasks = new FakeTaskRepository();
        return { service: new GetTasksSnapshot(tasks), tasks };
    }

    it('returns empty snapshot when no tasks exist', async () => {
        const { service } = createService();
        const result = await service.execute('user-1');

        expect(result).toEqual<TasksSnapshot>({
            pendingCount: 0,
            completedCount: 0,
            totalCount: 0,
            completionRate: 0,
            stuckTasks: [],
        });
    });

    it('calculates completion rate from today tasks', async () => {
        const { service, tasks } = createService();
        const today = new Date().toISOString().slice(0, 10);

        await tasks.create('user-1', { title: 'Done task', priority: 2, scheduledDate: today });
        const t1 = (await tasks.findByDate('user-1', today))[0];
        await tasks.updateStatus(t1.id, 'user-1', 'done');

        await tasks.create('user-1', { title: 'Pending task', priority: 2, scheduledDate: today });

        const result = await service.execute('user-1');
        expect(result.pendingCount).toBe(1);
        expect(result.completedCount).toBe(1);
        expect(result.totalCount).toBe(2);
        expect(result.completionRate).toBe(50);
    });

    it('lists stuck tasks with carryOverCount >= 3', async () => {
        const { service, tasks } = createService();
        const today = new Date().toISOString().slice(0, 10);

        await tasks.create('user-1', { title: 'Stuck task', priority: 2, scheduledDate: today });
        const allTasks = await tasks.findByDate('user-1', today);
        // Manually simulate carry-over count by updating the task
        const stuckTask = allTasks[0];
        await tasks.update(stuckTask.id, 'user-1', { carryOverCount: 4 });

        const result = await service.execute('user-1');
        expect(result.stuckTasks).toHaveLength(1);
        expect(result.stuckTasks[0].title).toBe('Stuck task');
        expect(result.stuckTasks[0].carryOverCount).toBe(4);
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /Users/lautarodamore/Documents/vdp && pnpm --filter @vdp/server test:unit -- --run GetTasksSnapshot`
Expected: FAIL — module does not exist

- [ ] **Step 3: Write minimal implementation**

```ts
// server/src/modules/tasks/services/GetTasksSnapshot.ts
import { TaskRepository } from '../domain/TaskRepository';
import { todayISO } from '../../common/base/time/dates';

export type StuckTaskInfo = {
    readonly title: string;
    readonly carryOverCount: number;
};

export type TasksSnapshot = {
    readonly pendingCount: number;
    readonly completedCount: number;
    readonly totalCount: number;
    readonly completionRate: number;
    readonly stuckTasks: readonly StuckTaskInfo[];
};

export class GetTasksSnapshot {
    constructor(private readonly tasks: TaskRepository) {}

    async execute(userId: string): Promise<TasksSnapshot> {
        const today = todayISO();
        const dayTasks = await this.tasks.findByDate(userId, today);

        const completed = dayTasks.filter((t) => t.status === 'done');
        const pending = dayTasks.filter((t) => t.status === 'pending');
        const total = dayTasks.length;
        const completionRate = total === 0 ? 0 : Math.round((completed.length / total) * 100);

        const stuckTasks: StuckTaskInfo[] = pending
            .filter((t) => t.carryOverCount >= 3)
            .map((t) => ({ title: t.title, carryOverCount: t.carryOverCount }));

        return {
            pendingCount: pending.length,
            completedCount: completed.length,
            totalCount: total,
            completionRate,
            stuckTasks,
        };
    }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd /Users/lautarodamore/Documents/vdp && pnpm --filter @vdp/server test:unit -- --run GetTasksSnapshot`
Expected: PASS — 3 tests

- [ ] **Step 5: Commit**

```bash
git add server/src/modules/tasks/services/GetTasksSnapshot.ts server/src/modules/tasks/__tests__/services/GetTasksSnapshot.test.ts
git commit -m "feat: add GetTasksSnapshot service for cross-domain prompt enrichment"
```

---

### Task 5: Wallet intelligence agent tools

**Files:**
- Create: `server/src/modules/wallet/infrastructure/agent/tools/intelligence-tools.ts`
- Modify: `server/src/modules/wallet/infrastructure/agent/tools.ts`

- [ ] **Step 1: Create the intelligence tools file**

```ts
// server/src/modules/wallet/infrastructure/agent/tools/intelligence-tools.ts
import { ServiceProvider } from '../../../../common/base/services/ServiceProvider';
import { AuthContextStorage } from '../../../../auth/infrastructure/http/AuthContextStorage';
import { GetSpendingAnomalies } from '../../../services/GetSpendingAnomalies';
import { GetCategoryTrends } from '../../../services/GetCategoryTrends';
import { jsonTool } from './shared';
import { EMPTY_OBJECT_SCHEMA } from './shared';

export function createWalletIntelligenceTools(services: ServiceProvider, authContextStorage: AuthContextStorage) {
    return [
        jsonTool({
            name: 'get_spending_anomalies',
            description: 'Detecta categorías con gasto inusual esta semana comparado con el promedio de las últimas 4 semanas. Usalo para alertar al usuario sobre gastos que se salieron de lo normal.',
            inputSchema: EMPTY_OBJECT_SCHEMA,
            execute: async () => {
                const userId = authContextStorage.getAuthContext().userId!;
                const anomalies = await services.get(GetSpendingAnomalies).execute(userId);
                if (anomalies.length === 0) {
                    return { message: 'No hay anomalías de gasto esta semana. Todo dentro del rango normal.' };
                }
                return { anomalies };
            },
        }),

        jsonTool({
            name: 'get_category_trends',
            description: 'Muestra la tendencia semanal de gasto por categoría (subió, bajó o estable). Usalo para dar contexto al usuario sobre cómo evolucionan sus gastos.',
            inputSchema: EMPTY_OBJECT_SCHEMA,
            execute: async () => {
                const userId = authContextStorage.getAuthContext().userId!;
                const trends = await services.get(GetCategoryTrends).execute(userId);
                if (trends.length === 0) {
                    return { message: 'No hay tendencias disponibles — necesito al menos 2 semanas de datos.' };
                }
                return { trends };
            },
        }),
    ];
}
```

- [ ] **Step 2: Add intelligence tools to WalletTools composition**

Modify `server/src/modules/wallet/infrastructure/agent/tools.ts`:

Add import at top:
```ts
import { createWalletIntelligenceTools } from './tools/intelligence-tools';
```

Add to the return array in `createWalletTools`:
```ts
...createWalletIntelligenceTools(services, authContext),
```

- [ ] **Step 3: Run tsc to verify compilation**

Run: `cd /Users/lautarodamore/Documents/vdp && pnpm --filter @vdp/server exec tsc --noEmit`
Expected: clean

- [ ] **Step 4: Commit**

```bash
git add server/src/modules/wallet/infrastructure/agent/tools/intelligence-tools.ts server/src/modules/wallet/infrastructure/agent/tools.ts
git commit -m "feat: add wallet intelligence agent tools (anomalies + trends)"
```

---

### Task 6: Register new services in WalletModuleRuntime

**Files:**
- Modify: `server/src/modules/wallet/WalletModuleRuntime.ts`

- [ ] **Step 1: Add imports and registration**

Add imports at top of `WalletModuleRuntime.ts`:
```ts
import { GetWalletSnapshot } from './services/GetWalletSnapshot';
import { GetSpendingAnomalies } from './services/GetSpendingAnomalies';
import { GetCategoryTrends } from './services/GetCategoryTrends';
```

Add new method and call it from `registerServices()`:
```ts
// In registerServices(), add call:
this.registerIntelligenceServices();

// New private method:
private registerIntelligenceServices(): void {
    this.deps.services.register(
        GetWalletSnapshot,
        () => new GetWalletSnapshot(this.transactionRepository(), this.categoryRepository()),
    );
    this.deps.services.register(
        GetSpendingAnomalies,
        () => new GetSpendingAnomalies(this.transactionRepository(), this.categoryRepository()),
    );
    this.deps.services.register(
        GetCategoryTrends,
        () => new GetCategoryTrends(this.transactionRepository(), this.categoryRepository()),
    );
}
```

- [ ] **Step 2: Register GetTasksSnapshot in TaskModuleRuntime**

Add import at top of `server/src/modules/tasks/TaskModuleRuntime.ts`:
```ts
import { GetTasksSnapshot } from './services/GetTasksSnapshot';
```

Add registration inside `registerTaskReadServices()`:
```ts
this.deps.services.register(GetTasksSnapshot, () => new GetTasksSnapshot(this.taskRepository()));
```

- [ ] **Step 3: Run tests to verify nothing broke**

Run: `cd /Users/lautarodamore/Documents/vdp && pnpm --filter @vdp/server test:unit -- --run`
Expected: all tests pass

- [ ] **Step 4: Commit**

```bash
git add server/src/modules/wallet/WalletModuleRuntime.ts server/src/modules/tasks/TaskModuleRuntime.ts
git commit -m "feat: register snapshot and intelligence services in module runtimes"
```

---

### Task 7: Cross-domain prompt enrichment

**Files:**
- Modify: `server/src/modules/common/base/agents/BaseAgent.ts`
- Modify: `server/src/modules/tasks/infrastructure/agent/TaskAgent.ts`
- Modify: `server/src/modules/tasks/infrastructure/agent/system-prompt.ts`
- Modify: `server/src/modules/wallet/infrastructure/agent/WalletAgent.ts`
- Modify: `server/src/modules/wallet/infrastructure/agent/system-prompt.ts`

- [ ] **Step 1: Make BaseAgent systemPrompt a getter-compatible property**

In `server/src/modules/common/base/agents/BaseAgent.ts`, change:
```ts
abstract readonly systemPrompt: string;
```
to:
```ts
abstract get systemPrompt(): string;
```

This is non-breaking — both a readonly property and a getter satisfy the same interface in TypeScript when consumed.

- [ ] **Step 2: Add cross-domain context slot to Tasks system prompt**

In `server/src/modules/tasks/infrastructure/agent/system-prompt.ts`, export a function instead of a constant:

```ts
import { todayISO } from '../../../common/base/time/dates';

export function buildTasksSystemPrompt(walletContext?: string): string {
    const crossDomainSection = walletContext
        ? `\n\n## Contexto cruzado — Wallet\n${walletContext}\nSi ves una conexión útil entre gastos y tareas, mencionala naturalmente. No fuerces la conexión.`
        : '';

    return `Sos el asistente de tareas diarias del usuario. Tu rol es ayudarlo a organizar su día y mantener el foco en lo importante.
... (keep existing full prompt body) ...
La fecha de hoy es: ${todayISO()}
La hora actual es: ${new Date().toTimeString().slice(0, 5)}

## Filosofía
Esto NO es gestión de proyectos. Es una lista simple de "qué tengo que hacer hoy". Si algo crece en complejidad, sugerí moverlo al dominio Work.${crossDomainSection}`;
}

// Backward compat — keep the constant for any other consumers
export const TASKS_SYSTEM_PROMPT = buildTasksSystemPrompt();
```

- [ ] **Step 3: Make TaskAgent use dynamic prompt with wallet context**

In `server/src/modules/tasks/infrastructure/agent/TaskAgent.ts`:

```ts
import { buildTasksSystemPrompt } from './system-prompt';
import { GetWalletSnapshot } from '../../../wallet/services/GetWalletSnapshot';
// ... existing imports ...

export class TaskAgent extends BaseAgent {
    readonly domain: DomainName = 'tasks';
    readonly tools: AgentTool[];

    private _services: ServiceProvider;
    private _authContextStorage: AuthContextStorage;

    constructor(
        eventBus: EventBus,
        services: ServiceProvider,
        repositories: RepositoryProvider,
        insightsStore: TaskInsightsStore,
        langfuse: LLMTraceService,
        openTelemetry: TraceService,
        agentProvider: AgentProvider,
        logger: Logger,
        authContextStorage: AuthContextStorage,
    ) {
        super(eventBus, services, repositories, agentProvider, langfuse, openTelemetry, logger);
        this._services = services;
        this._authContextStorage = authContextStorage;
        this.tools = TasksTools.createTasksTools(services, authContextStorage, insightsStore);
    }

    get systemPrompt(): string {
        try {
            const userId = this._authContextStorage.getAuthContext().userId;
            if (!userId) return buildTasksSystemPrompt();

            // Snapshot is fetched synchronously from cache if available
            // For the initial prompt build, we use the static version
            return buildTasksSystemPrompt();
        } catch {
            return buildTasksSystemPrompt();
        }
    }
}
```

**Note:** Because `systemPrompt` is accessed synchronously by `BaseAgent.runLoop()` and the snapshot requires async calls, we need a different approach. Add a `get_wallet_context` tool instead that the agent can call to get wallet snapshot on demand. This is cleaner than trying to make the prompt async.

**Alternative approach — add cross-domain context as a tool:**

Actually, let's keep the system prompt static but add a new tool `get_cross_domain_context` to each agent. This is cleaner:

In `server/src/modules/tasks/infrastructure/agent/tools/intelligence-tools.ts`, add:

```ts
jsonTool({
    name: 'get_wallet_context',
    description: 'Obtiene un resumen del estado financiero del usuario hoy: gasto total, categorías top, y anomalías. Usalo cuando el usuario mencione gastos, finanzas, o cuando quieras dar contexto cruzado entre tareas y wallet.',
    inputSchema: EMPTY_OBJECT_SCHEMA,
    execute: async () => {
        const userId = authContextStorage.getAuthContext().userId!;
        try {
            const snapshot = await services.get(GetWalletSnapshot).execute(userId);
            return { walletContext: snapshot };
        } catch {
            return { message: 'No se pudo obtener contexto de wallet.' };
        }
    },
}),
```

And in `server/src/modules/wallet/infrastructure/agent/tools/intelligence-tools.ts`, add:

```ts
jsonTool({
    name: 'get_tasks_context',
    description: 'Obtiene un resumen de las tareas del usuario hoy: pendientes, completadas, tareas atascadas. Usalo cuando quieras dar contexto cruzado entre finanzas y tareas.',
    inputSchema: EMPTY_OBJECT_SCHEMA,
    execute: async () => {
        const userId = authContextStorage.getAuthContext().userId!;
        try {
            const snapshot = await services.get(GetTasksSnapshot).execute(userId);
            return { tasksContext: snapshot };
        } catch {
            return { message: 'No se pudo obtener contexto de tareas.' };
        }
    },
}),
```

- [ ] **Step 4: Update system prompts to reference cross-domain tools**

Add to the end of `TASKS_SYSTEM_PROMPT` (before the closing backtick):
```
## Contexto cruzado
Tenés acceso al contexto financiero del usuario con \`get_wallet_context\`. Usalo cuando:
- El usuario mencione gastos o finanzas
- Quieras conectar una tarea con un patrón de gasto
- Hagas el review de fin de día y quieras dar contexto completo
No fuerces la conexión — solo mencionala si es relevante.
```

Add to the end of `WALLET_SYSTEM_PROMPT`:
```
## Contexto cruzado
Tenés acceso al estado de tareas del usuario con \`get_tasks_context\`. Usalo cuando:
- El usuario mencione productividad o tareas
- Quieras conectar un gasto con una tarea relevante
- El usuario registre un gasto y haya una tarea relacionada
No fuerces la conexión — solo mencionala si es relevante.
```

- [ ] **Step 5: Enhance Wallet system prompt to be proactive**

Replace the `WALLET_SYSTEM_PROMPT` in `server/src/modules/wallet/infrastructure/agent/system-prompt.ts` with a richer version that adds proactive behavior:

Add after the existing Heurísticas section:
```
## Comportamiento proactivo
- Cuando registres un gasto, usá \`get_spending_anomalies\` para verificar si la categoría está por encima del promedio
- Si detectás una anomalía, mencionala de forma natural: "Ojo que esta semana ya gastaste X% más de lo normal en [categoría]"
- Cuando el usuario pregunte cómo va el mes, usá \`get_category_trends\` para mostrar tendencias por categoría
- Celebrá rachas de ahorro o semanas donde el gasto baja significativamente
- Si un gasto parece inusualmente alto, preguntá si fue un gasto puntual o recurrente
```

- [ ] **Step 6: Run all tests**

Run: `cd /Users/lautarodamore/Documents/vdp && pnpm --filter @vdp/server test:unit -- --run`
Expected: all tests pass

- [ ] **Step 7: Commit**

```bash
git add server/src/modules/tasks/infrastructure/agent/tools/intelligence-tools.ts \
  server/src/modules/wallet/infrastructure/agent/tools/intelligence-tools.ts \
  server/src/modules/tasks/infrastructure/agent/system-prompt.ts \
  server/src/modules/wallet/infrastructure/agent/system-prompt.ts \
  server/src/modules/common/base/agents/BaseAgent.ts
git commit -m "feat: cross-domain prompt enrichment via agent tools"
```

---

### Task 8: WalletInsightsStore + toast pipeline

**Files:**
- Create: `server/src/modules/wallet/services/WalletInsightsStore.ts`
- Create: `server/src/modules/wallet/services/WalletInsightFactory.ts`
- Create: `server/src/modules/wallet/__tests__/services/WalletInsightsStore.test.ts`
- Modify: `server/src/modules/wallet/services/WalletEventHandlers.ts`
- Modify: `server/src/modules/wallet/WalletModuleRuntime.ts`
- Modify: `server/src/modules/wallet/WalletModule.ts`

- [ ] **Step 1: Write the failing test for WalletInsightsStore**

```ts
// server/src/modules/wallet/__tests__/services/WalletInsightsStore.test.ts
import { describe, it, expect } from 'vitest';
import { WalletInsightsStore } from '../../services/WalletInsightsStore';

describe('WalletInsightsStore', () => {
    it('starts with no insights', () => {
        const store = new WalletInsightsStore();
        expect(store.getUnreadInsights('user-1')).toEqual([]);
    });

    it('adds and retrieves insights by user', () => {
        const store = new WalletInsightsStore();
        const insight = store.addInsight({
            userId: 'user-1',
            type: 'warning',
            title: 'Gasto elevado',
            message: 'Tu gasto subió 60%',
        });

        expect(insight.id).toBeDefined();
        expect(insight.read).toBe(false);
        expect(store.getUnreadInsights('user-1')).toHaveLength(1);
        expect(store.getUnreadInsights('user-2')).toHaveLength(0);
    });

    it('notifies listeners when insight is added', () => {
        const store = new WalletInsightsStore();
        const received: unknown[] = [];
        store.onInsight((insight, userId) => received.push({ insight, userId }));

        store.addInsight({ userId: 'u1', type: 'warning', title: 'Test', message: 'Msg' });
        expect(received).toHaveLength(1);
    });

    it('marks insights as read', () => {
        const store = new WalletInsightsStore();
        const insight = store.addInsight({ userId: 'u1', type: 'warning', title: 'Test', message: 'Msg' });
        store.markInsightRead('u1', insight.id);
        expect(store.getUnreadInsights('u1')).toHaveLength(0);
    });

    it('limits insights to 50 per user', () => {
        const store = new WalletInsightsStore();
        for (let i = 0; i < 55; i++) {
            store.addInsight({ userId: 'u1', type: 'warning', title: `T${i}`, message: `M${i}` });
        }
        // getRecentInsights returns all, including read
        expect(store.getUnreadInsights('u1').length).toBeLessThanOrEqual(50);
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /Users/lautarodamore/Documents/vdp && pnpm --filter @vdp/server test:unit -- --run WalletInsightsStore`
Expected: FAIL

- [ ] **Step 3: Create WalletInsightsStore (mirrors TaskInsightsStore pattern)**

```ts
// server/src/modules/wallet/services/WalletInsightsStore.ts
import { randomUUID } from 'crypto';

export type WalletInsightType = 'achievement' | 'warning' | 'suggestion';

export type WalletInsight = {
    id: string;
    type: WalletInsightType;
    title: string;
    message: string;
    createdAt: Date;
    read: boolean;
    metadata?: Record<string, unknown>;
};

export type NewWalletInsight = {
    userId: string;
    type: WalletInsightType;
    title: string;
    message: string;
    metadata?: Record<string, unknown>;
};

export type WalletInsightListener = (insight: WalletInsight, userId: string) => void;

const MAX_INSIGHTS_PER_USER = 50;

export class WalletInsightsStore {
    private insights = new Map<string, WalletInsight[]>();
    private listeners: WalletInsightListener[] = [];

    addInsight(input: NewWalletInsight): WalletInsight {
        const insight: WalletInsight = {
            id: randomUUID(),
            type: input.type,
            title: input.title,
            message: input.message,
            createdAt: new Date(),
            read: false,
            metadata: input.metadata,
        };

        const userInsights = this.insights.get(input.userId) ?? [];
        userInsights.unshift(insight);

        if (userInsights.length > MAX_INSIGHTS_PER_USER) {
            userInsights.length = MAX_INSIGHTS_PER_USER;
        }

        this.insights.set(input.userId, userInsights);
        this.notifyListeners(insight, input.userId);

        return insight;
    }

    getUnreadInsights(userId: string): WalletInsight[] {
        return (this.insights.get(userId) ?? []).filter((i) => !i.read);
    }

    markInsightRead(userId: string, insightId: string): void {
        const userInsights = this.insights.get(userId) ?? [];
        const insight = userInsights.find((i) => i.id === insightId);
        if (insight) insight.read = true;
    }

    onInsight(listener: WalletInsightListener): () => void {
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter((l) => l !== listener);
        };
    }

    private notifyListeners(insight: WalletInsight, userId: string): void {
        for (const listener of this.listeners) {
            listener(insight, userId);
        }
    }
}
```

- [ ] **Step 4: Create WalletInsightFactory**

```ts
// server/src/modules/wallet/services/WalletInsightFactory.ts
import { NewWalletInsight } from './WalletInsightsStore';
import { SpendingSpikePayload } from '../domain/events/SpendingSpike';

export class WalletInsightFactory {
    static spendingSpike(payload: SpendingSpikePayload): NewWalletInsight {
        return {
            userId: payload.userId,
            type: 'warning',
            title: '⚠️ Gasto elevado esta semana',
            message:
                `Tu gasto subió ${payload.percentageIncrease}% respecto al promedio ` +
                `($${payload.totalExpenses} vs $${payload.previousAverage} ${payload.currency}).`,
            metadata: {
                source: 'wallet.spending.spike',
                totalExpenses: payload.totalExpenses,
                previousAverage: payload.previousAverage,
                percentageIncrease: payload.percentageIncrease,
                currency: payload.currency,
            },
        };
    }
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `cd /Users/lautarodamore/Documents/vdp && pnpm --filter @vdp/server test:unit -- --run WalletInsightsStore`
Expected: PASS — 5 tests

- [ ] **Step 6: Wire WalletEventHandlers to use WalletInsightsStore**

Modify `server/src/modules/wallet/services/WalletEventHandlers.ts`:

```ts
import { EventBus } from '../../common/base/event-bus/EventBus';
import { EventSubscriber } from '../../common/base/event-bus/EventSubscriber';
import { DomainEvent } from '../../common/base/event-bus/DomainEvent';
import { DetectSpendingSpike } from './DetectSpendingSpike';
import { WalletInsightsStore } from './WalletInsightsStore';
import { WalletInsightFactory } from './WalletInsightFactory';
import { Logger } from '../../common/base/observability/logging/Logger';
import { TransactionCreatedPayload } from '../domain/events/TransactionCreated';
import { SpendingSpikePayload } from '../domain/events/SpendingSpike';

export class WalletEventHandlers implements EventSubscriber {
    constructor(
        private readonly eventBus: EventBus,
        private readonly detectSpendingSpike: DetectSpendingSpike,
        private readonly insightsStore: WalletInsightsStore,
        private readonly logger: Logger,
    ) {}

    subscribe(): void {
        this.eventBus.on('wallet.transaction.created', (event: DomainEvent) => {
            const { userId } = event.payload as TransactionCreatedPayload;
            this.detectSpendingSpike.execute(userId).catch((err: unknown) => {
                this.logger.warn('DetectSpendingSpike failed', {
                    error: err instanceof Error ? err.message : String(err),
                });
            });
        });

        this.eventBus.on('wallet.spending.spike', (event: DomainEvent) => {
            const payload = event.payload as SpendingSpikePayload;
            this.insightsStore.addInsight(WalletInsightFactory.spendingSpike(payload));
        });
    }
}
```

- [ ] **Step 7: Update WalletModuleRuntime to create and wire WalletInsightsStore**

Modify `server/src/modules/wallet/WalletModuleRuntime.ts`:

Add imports:
```ts
import { WalletInsightsStore } from './services/WalletInsightsStore';
```

Change constructor to accept extended deps:
```ts
export interface WalletModuleRuntimeDeps extends ModuleContext {
    insightsStore: WalletInsightsStore;
}

export class WalletModuleRuntime {
    constructor(private deps: WalletModuleRuntimeDeps) {}
```

Update `registerEventHandlers()`:
```ts
registerEventHandlers(): void {
    const spikeDetector = new DetectSpendingSpike(this.transactionRepository(), this.deps.eventBus, this.deps.logger);
    const handlers = new WalletEventHandlers(this.deps.eventBus, spikeDetector, this.deps.insightsStore, this.deps.logger);
    handlers.subscribe();
    this.subscribeInsightsToSSE();
}
```

Add SSE wiring method (same pattern as Tasks):
```ts
private subscribeInsightsToSSE(): void {
    this.deps.insightsStore.onInsight((insight, userId) => {
        if (this.deps.sseBroadcaster.hasClients(userId)) {
            this.deps.insightsStore.markInsightRead(userId, insight.id);
            insight.read = true;
        }
        this.deps.sseBroadcaster.broadcastToUser(userId, 'wallet-insight', insight);
    });
}
```

- [ ] **Step 8: Update WalletModule to pass insightsStore**

Modify `server/src/modules/wallet/WalletModule.ts`:

```ts
import { WalletInsightsStore } from './services/WalletInsightsStore';
// ... existing imports ...

export class WalletModule extends BaseModule {
    private runtime: WalletModuleRuntime;
    private insightsStore: WalletInsightsStore;

    constructor(context: ModuleContext) {
        super(context);
        this.insightsStore = new WalletInsightsStore();
        this.runtime = new WalletModuleRuntime({ ...context, insightsStore: this.insightsStore });
    }
    // ... rest unchanged ...
}
```

- [ ] **Step 9: Run all tests**

Run: `cd /Users/lautarodamore/Documents/vdp && pnpm --filter @vdp/server test:unit -- --run`
Expected: all pass (existing `WalletEventHandlers.test.ts` will need a minor update to pass the new `insightsStore` parameter)

- [ ] **Step 10: Fix WalletEventHandlers.test.ts if needed**

The existing test creates `WalletEventHandlers(eventBus, spikeDetector, logger)`. Add the new parameter:
```ts
const insightsStore = new WalletInsightsStore();
const handlers = new WalletEventHandlers(eventBus, spikeDetector, insightsStore, logger);
```

- [ ] **Step 11: Commit**

```bash
git add server/src/modules/wallet/services/WalletInsightsStore.ts \
  server/src/modules/wallet/services/WalletInsightFactory.ts \
  server/src/modules/wallet/__tests__/services/WalletInsightsStore.test.ts \
  server/src/modules/wallet/services/WalletEventHandlers.ts \
  server/src/modules/wallet/WalletModuleRuntime.ts \
  server/src/modules/wallet/WalletModule.ts
git commit -m "feat: add WalletInsightsStore and wire spending spike toasts"
```

---

### Task 9: Frontend SSE + review enrichment

**Files:**
- Modify: `apps/web/src/hooks/use-insights-sse.ts`
- Modify: `apps/web/src/features/review/presentation/use-daily-review-model.ts`
- Modify: `apps/web/src/lib/api/wallet.ts`

- [ ] **Step 1: Add wallet anomalies/trends API functions**

Add to `apps/web/src/lib/api/wallet.ts`:

```ts
export type SpendingAnomaly = {
    category: string;
    currentWeek: number;
    average: number;
    percentageChange: number;
    direction: 'up' | 'down';
};

export type CategoryTrend = {
    category: string;
    thisWeek: number;
    lastWeek: number;
    change: number;
    trend: 'up' | 'down' | 'stable';
};
```

Note: These types will be used by the review model. The actual data comes from the agent tools — no new HTTP endpoints needed for the frontend since the agent calls the tools during chat. For the review screen, we can derive signals from existing wallet data.

- [ ] **Step 2: Connect SSE to wallet insights stream**

Modify `apps/web/src/hooks/use-insights-sse.ts` to also listen for `wallet-insight` events:

After the existing `es.addEventListener('insight', ...)` block, add:
```ts
es.addEventListener('wallet-insight', (event) => {
    try {
        const insight = JSON.parse(event.data);
        notificationStore.add({
            id: insight.id,
            type: insight.type,
            title: insight.title,
            message: insight.message,
        });
    } catch {
        // Ignore malformed events
    }
});
```

- [ ] **Step 3: Run web tests**

Run: `cd /Users/lautarodamore/Documents/vdp && pnpm --filter @vdp/web test -- --run`
Expected: all pass

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/hooks/use-insights-sse.ts apps/web/src/lib/api/wallet.ts
git commit -m "feat: wire wallet insights to frontend SSE and toast pipeline"
```

---

### Task 10: Full verification

- [ ] **Step 1: Run all backend tests**

Run: `cd /Users/lautarodamore/Documents/vdp && pnpm --filter @vdp/server test:unit -- --run`
Expected: all pass (184+ tests)

- [ ] **Step 2: Run all frontend tests**

Run: `cd /Users/lautarodamore/Documents/vdp && pnpm --filter @vdp/web test -- --run`
Expected: all pass

- [ ] **Step 3: Run tsc across whole project**

Run: `cd /Users/lautarodamore/Documents/vdp && pnpm exec tsc --noEmit`
Expected: clean

- [ ] **Step 4: Run e2e tests**

Run: `cd /Users/lautarodamore/Documents/vdp && pnpm test:e2e`
Expected: all pass

- [ ] **Step 5: Manual smoke test (optional)**

Start dev servers and verify:
1. Open Tasks chat → agent has `get_wallet_context` tool available
2. Open Wallet chat → agent has `get_tasks_context`, `get_spending_anomalies`, `get_category_trends` tools
3. Ask wallet chat "¿cómo va mi gasto esta semana?" → uses trends/anomalies tools
4. Ask tasks chat about something financial → uses wallet context tool
