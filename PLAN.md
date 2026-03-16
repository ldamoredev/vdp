# VDP - Life Operating System: System Design & Implementation Roadmap

## Context

VDP is a modular personal AI platform designed as a "Life Operating System." The repo has a unified Fastify backend (`server/`) with working Wallet and Health modules (schemas, routes, AI agents, events), core infrastructure (event bus, scheduler, skill registry, agent registry), and multiple separate frontend apps that are being consolidated into a single Next.js app (`apps/web/`). This plan defines the target architecture, refactor strategy, and domain-by-domain implementation roadmap.

---

## 1. System Vision

VDP is not a dashboard — it's an **agent-orchestrated life management system**. Each life domain (Tasks, Wallet, Health, People, Work, Study) operates semi-autonomously through its own AI agent, while a central orchestration layer enables cross-domain intelligence.

**Key differentiators:**
- Agents are **proactive** (they initiate actions, not just respond)
- Domains are **interconnected** via events (bad sleep → reduced work intensity → conservative financial decisions)
- The system builds a **temporal knowledge graph** of the user's life over time
- Skills are **composable** capabilities agents share (send message, analyze trends, schedule)
- MCPs provide **external integration** (Gmail, banks, calendar, messaging)

---

## 2. Target Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   UNIFIED FRONTEND (apps/web)                │
│                    Single Next.js app (:3000)                │
│                                                              │
│  ┌──────┐ ┌──────────────────────────────────────────────┐  │
│  │      │ │              (domain) route group              │  │
│  │ Icon │ │  /wallet/*  /health/*  /work/*  /people/*     │  │
│  │ Rail │ │  /study/*                                     │  │
│  │      │ │  Shared: sidebar panel, header, chat panel    │  │
│  └──────┘ └──────────────────────────────────────────────┘  │
│                                                              │
│  / (home) — full-width cross-domain life dashboard           │
│  Chat panel: one agent per domain, context-switches on nav   │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────┴──────────────────────────────┐
│                   API GATEWAY                        │
│            (Fastify + Auth Middleware)                │
└────────────────┬────────────────────────────────────┘
                 │
┌────────────────┴────────────────────────────────────┐
│               DOMAIN SERVICES LAYER                  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐            │
│  │  Wallet  │ │  Health  │ │  People  │  ...        │
│  │ Service  │ │ Service  │ │ Service  │             │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘            │
└───────┼─────────────┼───────────┼───────────────────┘
        │             │           │
┌───────┴─────────────┴───────────┴───────────────────┐
│                 AGENT LAYER                          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐            │
│  │  Wallet  │ │  Health  │ │  People  │             │
│  │  Agent   │ │  Agent   │ │  Agent   │  ...        │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘            │
│       └─────────────┼───────────┘                    │
│              ┌──────┴──────┐                         │
│              │ Orchestrator│ (cross-domain agent)     │
│              └─────────────┘                         │
└─────────────────────┬───────────────────────────────┘
                      │
┌─────────────────────┴───────────────────────────────┐
│                  CORE LAYER                          │
│  ┌─────────┐ ┌─────────┐ ┌──────────┐ ┌─────────┐ │
│  │Event Bus│ │  Goals  │ │ Timeline │ │ Memory  │  │
│  │         │ │ Engine  │ │          │ │ System  │  │
│  └─────────┘ └─────────┘ └──────────┘ └─────────┘ │
│  ┌─────────┐ ┌─────────┐ ┌──────────┐             │
│  │  Auth   │ │Analytics│ │Scheduler │              │
│  └─────────┘ └─────────┘ └──────────┘             │
└─────────────────────┬───────────────────────────────┘
                      │
┌─────────────────────┴───────────────────────────────┐
│              SKILLS LAYER                            │
│  analyze_trends │ send_message │ schedule_event │    │
│  create_plan │ summarize │ detect_anomaly │ ...      │
└─────────────────────┬───────────────────────────────┘
                      │
┌─────────────────────┴───────────────────────────────┐
│              MCP LAYER (External Integrations)        │
│  Gmail │ Calendar │ Bank API │ Telegram │ WhatsApp │  │
│  Fitbit/Apple Health │ GitHub │ Notion │ ...         │
└─────────────────────────────────────────────────────┘
```

**Architecture style:** Pragmatic modular monolith. Single deployable backend, internally organized as isolated domain modules with event-driven cross-domain communication.

**Module pattern:** Each domain follows a consistent internal structure: **schema → service → thin adapters (routes + agent tools) → events**. The service layer is the heart of each module — it owns all business logic, queries, and event emission. Routes and agent tools are thin adapters that validate input, call the service, and format output. Modules never import from other modules directly; they communicate exclusively via the event bus.

**What we take from DDD/Clean/Hexagonal:**
- **Service layer** — eliminates duplicated logic between routes and agent tools
- **Domain events** — core to the product vision (sleep affects spending, etc.)
- **Module isolation** — each domain is a self-contained folder
- **Adapter pattern for external integrations** — MCPs have clean port interfaces (the only place we use formal interfaces)

**What we deliberately skip:**
- No repository pattern (Drizzle IS the data access abstraction)
- No use case classes (service methods suffice)
- No value objects (TypeScript types + Zod schemas are enough)
- No interface ports for DB (we're never swapping Drizzle)
- No separate domain entities (Drizzle inferred types ARE the entities)
- No CQRS (single user, one database)

---

## 3. Repository Structure

```
vdp/
├── apps/
│   └── web/                          # ← Unified Next.js frontend
│       ├── src/
│       │   ├── app/
│       │   │   ├── layout.tsx        # Root layout: html, body, Providers
│       │   │   ├── page.tsx          # "/" — cross-domain life dashboard (full-width, no sidebar)
│       │   │   ├── globals.css       # Global styles + design system tokens
│       │   │   │
│       │   │   └── (domain)/         # Route group: shared shell layout
│       │   │       ├── layout.tsx    # Shell: icon rail + sidebar panel + header + chat panel
│       │   │       ├── tasks/
│       │   │       │   └── page.tsx            # /tasks (today's todo list + history)
│       │   │       ├── wallet/
│       │   │       │   ├── page.tsx            # /wallet (dashboard)
│       │   │       │   ├── transactions/
│       │   │       │   │   ├── page.tsx        # /wallet/transactions
│       │   │       │   │   └── new/page.tsx    # /wallet/transactions/new
│       │   │       │   ├── savings/page.tsx
│       │   │       │   ├── investments/page.tsx
│       │   │       │   └── stats/page.tsx
│       │   │       ├── health/
│       │   │       │   ├── page.tsx            # /health (dashboard)
│       │   │       │   ├── metrics/page.tsx
│       │   │       │   ├── habits/page.tsx
│       │   │       │   ├── medications/page.tsx
│       │   │       │   ├── appointments/page.tsx
│       │   │       │   └── body/page.tsx
│       │   │       ├── work/
│       │   │       │   ├── page.tsx
│       │   │       │   ├── projects/page.tsx
│       │   │       │   ├── tasks/page.tsx
│       │   │       │   ├── calendar/page.tsx
│       │   │       │   └── analytics/page.tsx
│       │   │       ├── people/
│       │   │       │   ├── page.tsx
│       │   │       │   ├── contacts/page.tsx
│       │   │       │   └── interactions/page.tsx
│       │   │       └── study/
│       │   │           ├── page.tsx
│       │   │           ├── subjects/page.tsx
│       │   │           ├── flashcards/page.tsx
│       │   │           └── notes/page.tsx
│       │   │
│       │   ├── components/
│       │   │   ├── shell/             # Shared shell components
│       │   │   │   ├── icon-rail.tsx  # Left icon rail (domain switcher)
│       │   │   │   ├── sidebar-panel.tsx  # Expandable domain-specific nav
│       │   │   │   ├── header.tsx     # Top bar with theme toggle + chat button
│       │   │   │   └── chat-panel.tsx # Domain-aware AI chat
│       │   │   ├── theme-toggle.tsx   # Sun/Moon theme switch with animation
│       │   │   ├── shared/            # Reusable UI components
│       │   │   │   ├── loading-skeleton.tsx
│       │   │   │   ├── glass-card.tsx
│       │   │   │   └── ...
│       │   │   ├── wallet/            # Wallet-specific components
│       │   │   ├── health/            # Health-specific components
│       │   │   └── ...
│       │   │
│       │   └── lib/
│       │       ├── api/               # Modular API client
│       │       │   ├── client.ts      # Base fetch wrapper
│       │       │   ├── wallet.ts      # Wallet endpoints
│       │       │   ├── health.ts      # Health endpoints
│       │       │   └── index.ts       # Re-exports: api.wallet.*, api.health.*
│       │       ├── theme.tsx           # ThemeProvider context + useTheme() hook
│       │       ├── chat-store.ts      # Chat panel state (one per domain)
│       │       ├── use-chat-store.ts  # React hook for chat state
│       │       ├── format.ts          # Formatting utils (money, dates, metrics)
│       │       ├── providers.tsx       # React Query + global providers
│       │       └── navigation.ts      # Domain nav config (routes, icons, labels)
│       │
│       ├── next.config.ts
│       ├── package.json
│       └── tsconfig.json
│
├── server/                         # Unified Fastify backend
│   ├── src/
│   │   ├── app.ts                 # Fastify app setup
│   │   ├── server.ts              # Entry point
│   │   ├── core/                  # Core infrastructure
│   │   │   ├── event-bus/
│   │   │   │   ├── bus.ts         # EventEmitter-based bus
│   │   │   │   ├── types.ts       # Event type definitions
│   │   │   │   └── handlers.ts    # Cross-domain event handlers
│   │   │   ├── goals/
│   │   │   │   ├── engine.ts      # Goal tracking & progress
│   │   │   │   ├── schema.ts      # Goal DB schema
│   │   │   │   └── routes.ts      # Goal API routes
│   │   │   ├── timeline/
│   │   │   │   ├── service.ts     # Life event timeline
│   │   │   │   ├── schema.ts
│   │   │   │   └── routes.ts
│   │   │   ├── memory/
│   │   │   │   ├── service.ts     # Agent memory (vector + relational)
│   │   │   │   └── schema.ts
│   │   │   ├── auth/
│   │   │   │   ├── middleware.ts   # Auth middleware (single-user for now)
│   │   │   │   └── routes.ts
│   │   │   ├── analytics/
│   │   │   │   ├── service.ts     # Cross-domain analytics
│   │   │   │   └── routes.ts
│   │   │   └── scheduler/
│   │   │       ├── service.ts     # Cron-based task scheduler
│   │   │       └── jobs.ts        # Registered jobs
│   │   │
│   │   ├── modules/               # Domain modules (each follows: schema → service → adapters → events)
│   │   │   ├── tasks/
│   │   │   │   ├── schema.ts      # Drizzle tables: tasks, task_notes
│   │   │   │   ├── service.ts     # CRUD, daily review, carry-over, completion stats
│   │   │   │   ├── events.ts      # daily.all_completed, task.stuck, overloaded
│   │   │   │   ├── routes/        # Thin HTTP handlers
│   │   │   │   └── agent/         # 3-line agent config + thin tools
│   │   │   ├── wallet/
│   │   │   │   ├── schema.ts      # Drizzle table definitions (source of truth for types)
│   │   │   │   ├── service.ts     # ALL business logic: queries, calculations, event emission
│   │   │   │   ├── events.ts      # Domain event definitions
│   │   │   │   ├── routes/        # Thin HTTP adapters: validate → call service → respond
│   │   │   │   │   ├── accounts.ts
│   │   │   │   │   ├── transactions.ts
│   │   │   │   │   ├── categories.ts
│   │   │   │   │   ├── savings.ts
│   │   │   │   │   ├── investments.ts
│   │   │   │   │   ├── stats.ts
│   │   │   │   │   └── exchange-rates.ts
│   │   │   │   └── agent/         # Thin agent adapters: parse input → call service → return JSON
│   │   │   │       ├── wallet-agent.ts    # 3 lines: domain + systemPrompt + tools
│   │   │   │       ├── tools.ts           # Tool definitions call service methods
│   │   │   │       └── system-prompt.ts
│   │   │   ├── health/
│   │   │   │   ├── schema.ts
│   │   │   │   ├── service.ts
│   │   │   │   ├── events.ts
│   │   │   │   ├── routes/
│   │   │   │   └── agent/
│   │   │   └── ... (people, work, study — same structure)
│   │   │
│   │   ├── agents/                # Agent orchestration
│   │   │   ├── orchestrator.ts    # Cross-domain agent coordinator
│   │   │   ├── base-agent.ts      # Base agent class
│   │   │   └── registry.ts        # Agent registry
│   │   │
│   │   ├── skills/                # Reusable agent capabilities
│   │   │   ├── registry.ts        # Skill registry
│   │   │   ├── analyze-trends.ts
│   │   │   ├── detect-anomaly.ts
│   │   │   ├── create-plan.ts
│   │   │   ├── send-notification.ts
│   │   │   └── summarize.ts
│   │   │
│   │   └── mcps/                  # External integrations
│   │       ├── registry.ts        # MCP registry
│   │       ├── gmail/
│   │       ├── calendar/
│   │       ├── telegram/
│   │       └── bank-api/
│   │
│   ├── drizzle.config.ts
│   └── package.json
│
├── packages/
│   └── shared/                    # Shared types, schemas, constants
│       ├── src/
│       │   ├── types/             # Domain types
│       │   ├── schemas/           # Zod validation schemas
│       │   ├── constants/         # Enums, currency codes, etc.
│       │   └── events/            # Event type definitions (shared)
│       └── package.json
│
├── pnpm-workspace.yaml
├── package.json
├── docker-compose.yml             # PostgreSQL + Redis
└── CLAUDE.md
```

### Key structural changes from current state:

1. **Unified backend** → Move from `apps/wallet/backend/` to `server/` — one Fastify server serving all domains. This prevents duplication of auth, event bus, and shared infra across multiple backends. ✅ DONE
2. **Remove `packages/db`** → DB schema moves into `server/src/modules/*/schema.ts`. Each domain owns its schema. The Drizzle client lives in `server/src/core/`. ✅ DONE (packages/db still exists but is orphaned — needs cleanup)
3. **Unified frontend** → Consolidate all 6 frontend apps (`apps/landing`, `apps/wallet/frontend`, `apps/health/frontend`, etc.) into a single Next.js app at `apps/web/`. Uses Next.js route groups: `(domain)/` for the shared shell layout, root `/` for a full-width cross-domain dashboard. **No `packages/ui` needed** — shared components live inside `apps/web/src/components/shared/`.
4. **Two-level sidebar** → Icon rail (always visible, shows all domains) + expandable sidebar panel (swaps content per domain). Replaces the per-app sidebar pattern.
5. **Domain-aware chat panel** → One chat panel in the shell, one AI agent per domain. Chat context switches automatically when navigating between domains. Each domain maintains its own conversation thread.
6. **Modular API client** → Single API client with per-domain modules (`lib/api/wallet.ts`, `lib/api/health.ts`) instead of duplicated `api.ts` files per app. Accessed as `api.wallet.getAccounts()`, `api.health.getMetrics()`.
7. **Agent code co-located with domain** → Each domain's agent lives inside its module folder, not in a separate agent directory. The `agents/` top-level folder is only for orchestration.
8. **MCP server stays** → `apps/wallet/mcp-server/` remains for Claude Desktop integration but will evolve to cover all domains.

### Dead code to remove:

- `apps/landing/` — replaced by `apps/web/` root page
- `apps/wallet/frontend/` — migrated to `apps/web/src/app/(domain)/wallet/`
- `apps/health/frontend/` — migrated to `apps/web/src/app/(domain)/health/`
- `apps/people/frontend/` — migrated to `apps/web/src/app/(domain)/people/`
- `apps/work/frontend/` — migrated to `apps/web/src/app/(domain)/work/`
- `apps/study/frontend/` — migrated to `apps/web/src/app/(domain)/study/`
- `apps/wallet/backend/` — already migrated to `server/src/modules/wallet/`
- `packages/db/` — already migrated to `server/src/core/db/` and `server/src/modules/*/schema.ts`

### Frontend Architecture

#### Layout hierarchy

```
Root layout (layout.tsx)
├── "/" — Home layout (full-width, no sidebar)
│   └── Cross-domain life dashboard
│
└── "(domain)/" — Shell layout
    ├── Icon rail (always visible, left edge)
    │   ├── VDP logo / home link
    │   ├── Wallet icon (active = highlighted)
    │   ├── Health icon
    │   ├── Work icon
    │   ├── People icon
    │   └── Study icon
    │
    ├── Sidebar panel (expandable, swaps per domain)
    │   ├── Domain name + icon header
    │   └── Domain-specific nav items
    │       e.g. Wallet: Dashboard, Transactions, Savings, Investments, Stats
    │
    ├── Header bar (domain name, breadcrumbs, chat toggle)
    │
    ├── Main content area (renders page.tsx from route)
    │
    └── Chat panel (slides in from right, domain-aware)
        ├── Talks to the domain's AI agent based on current route
        ├── Maintains separate conversation per domain
        └── Shared SSE streaming infrastructure
```

#### Navigation config

Domain navigation is data-driven via a config object (`lib/navigation.ts`):

```typescript
type DomainConfig = {
  key: string;           // "wallet", "health", etc.
  label: string;         // "Wallet", "Health", etc.
  icon: LucideIcon;      // Icon for the rail
  color: string;         // Accent color for the domain
  agentEndpoint: string; // "/api/v1/agent/chat", "/api/v1/health/agent/chat"
  navItems: Array<{
    href: string;        // "/wallet/transactions"
    label: string;       // "Transacciones"
    icon: LucideIcon;
  }>;
};
```

Adding a new domain to the frontend = adding an entry to this config + creating route pages.

#### Chat panel behavior

- Chat panel is rendered once in the shell layout
- It reads the current domain from the route (`usePathname()` → extract first segment)
- When domain changes: conversation context switches, previous conversation is preserved in memory
- Each domain has its own `conversationId` tracked in chat store
- Agent endpoint is resolved from domain config
- SSE streaming logic is shared — only the endpoint and conversationId change

#### API client pattern

```typescript
// lib/api/client.ts — base fetch wrapper
async function request<T>(path: string, options?: RequestInit): Promise<T>

// lib/api/wallet.ts
export const walletApi = {
  getAccounts: () => request<Account[]>("/accounts"),
  getTransactions: (params) => request<PaginatedResult<Transaction>>("/transactions", ...),
  // ...
};

// lib/api/health.ts
export const healthApi = {
  getTodaySummary: () => request<TodaySummary>("/health/today"),
  getMetrics: (params) => request<HealthMetric[]>("/health/metrics", ...),
  // ...
};

// lib/api/index.ts
export const api = {
  wallet: walletApi,
  health: healthApi,
  // future: work, people, study
};

// Usage: api.wallet.getAccounts(), api.health.getMetrics()
```

---

### Module Architecture (Backend)

#### The rule: schema → service → thin adapters → events

Every domain module follows the same internal structure. The **service** is the heart — it owns all business logic, database queries, calculations, and event emission. Everything else is a thin adapter.

```
                    ┌─────────────┐   ┌─────────────┐   ┌──────────────┐
                    │ HTTP Routes │   │ Agent Tools  │   │Event Handlers│
                    │  (validate  │   │   (parse     │   │  (receive    │
                    │  + format)  │   │   + format)  │   │  + delegate) │
                    └──────┬──────┘   └──────┬───────┘   └──────┬───────┘
                           │                 │                   │
                           ▼                 ▼                   ▼
                    ┌────────────────────────────────────────────────────┐
                    │                  SERVICE                           │
                    │  All business logic lives here:                    │
                    │  - Database queries (Drizzle, written ONCE)        │
                    │  - Calculations & transformations                  │
                    │  - Event emission (callers don't need to remember) │
                    │  - Cross-cutting concerns (e.g. auto-categorize)  │
                    └──────┬────────────────┬────────────────┬──────────┘
                           │                │                │
                           ▼                ▼                ▼
                    ┌──────────┐    ┌──────────┐    ┌──────────────┐
                    │  Schema  │    │  Events  │    │  Core infra  │
                    │ (Drizzle)│    │  (emit)  │    │ (DB, bus...) │
                    └──────────┘    └──────────┘    └──────────────┘
```

#### Rules

1. **Routes never import Drizzle tables directly** — they call service methods
2. **Agent tools never write SQL** — they call service methods
3. **Service emits events** — callers don't need to remember to emit
4. **Modules never import from other modules** — they communicate via events only
5. **Services call Drizzle directly** — no repository layer (Drizzle IS the abstraction)
6. **Validation happens at the edge** — routes validate with Zod, services receive typed data
7. **One source of truth for types** — Drizzle schema infers types, no separate domain entities

#### Service example

```typescript
// server/src/modules/wallet/service.ts
import { db } from "../../core/db/client.js";
import { accounts, transactions, categories } from "./schema.js";
import { walletEvents } from "./events.js";
import { eq, and, gte, lte, desc, sql } from "drizzle-orm";

class WalletService {
  // Query written ONCE — used by both route and agent tool
  async getAccountsWithBalances() {
    return db.select({
      id: accounts.id,
      name: accounts.name,
      currency: accounts.currency,
      type: accounts.type,
      initialBalance: accounts.initialBalance,
      currentBalance: sql<string>`(${accounts.initialBalance}::numeric + COALESCE((...), 0))::text`,
    }).from(accounts).where(eq(accounts.isActive, true));
  }

  async createTransaction(data: {
    accountId?: string;
    categoryId?: string | null;
    type: string;
    amount: string;
    currency?: string;
    description?: string | null;
    date?: string;
    tags?: string[];
  }) {
    const currency = data.currency || "ARS";
    const accountId = data.accountId || await this.resolveDefaultAccount(currency);

    const [tx] = await db.insert(transactions).values({
      accountId,
      categoryId: data.categoryId || null,
      type: data.type,
      amount: data.amount,
      currency,
      description: data.description || null,
      date: data.date || new Date().toISOString().slice(0, 10),
      tags: data.tags || [],
    }).returning();

    // Service emits events — callers don't need to remember
    await walletEvents.transactionCreated({
      id: tx.id, type: tx.type, amount: tx.amount,
      currency: tx.currency, categoryId: tx.categoryId,
      description: tx.description,
    });

    return tx;
  }

  async getMonthlySummary(month: number, year: number) { /* single implementation */ }
  async getSpendingByCategory(filters: CategoryFilters) { /* single implementation */ }

  private async resolveDefaultAccount(currency: string) {
    const [acc] = await db.select().from(accounts)
      .where(and(eq(accounts.currency, currency), eq(accounts.isActive, true)))
      .limit(1);
    if (!acc) throw new Error(`No active account for ${currency}`);
    return acc.id;
  }
}

export const walletService = new WalletService();
```

#### Route becomes trivially thin

```typescript
// server/src/modules/wallet/routes/accounts.ts
import { walletService } from "../service.js";
import { createAccountSchema } from "@vdp/shared";

export async function accountsRoutes(app: FastifyInstance) {
  app.get("/api/v1/accounts", async (req, reply) => {
    const result = await walletService.getAccountsWithBalances();
    return reply.send(result);
  });

  app.post("/api/v1/accounts", async (req, reply) => {
    const parsed = createAccountSchema.safeParse(req.body);
    if (!parsed.success) return reply.status(400).send({ error: parsed.error.flatten() });
    const account = await walletService.createAccount(parsed.data);
    return reply.status(201).send(account);
  });
}
```

#### Agent tool becomes trivially thin

```typescript
// server/src/modules/wallet/agent/tools.ts
import { walletService } from "../service.js";

export function createWalletTools(): AgentTool[] {
  return [
    {
      name: "get_accounts_with_balances",
      description: "Get all accounts with their current balances.",
      inputSchema: { type: "object", properties: {}, required: [] },
      execute: async () => JSON.stringify(await walletService.getAccountsWithBalances()),
    },
    {
      name: "create_transaction",
      description: "Create a new transaction (income, expense, or transfer).",
      inputSchema: { /* ... */ },
      execute: async (input) => JSON.stringify(await walletService.createTransaction(input)),
    },
  ];
}
```

#### Agent becomes 3 lines of config

```typescript
// server/src/modules/wallet/agent/wallet-agent.ts
class WalletAgent extends BaseAgent {
  readonly domain = "wallet";
  readonly systemPrompt = WALLET_SYSTEM_PROMPT;
  readonly tools = createWalletTools();
}
```

All chat persistence (conversations, messages, tool results) is handled by BaseAgent using a shared core schema. Domain agents only define their domain, prompt, and tools.

#### Agent conversation persistence (shared core schema)

Agent conversations and messages are NOT per-domain tables. They live in a shared `core` schema with a `domain` column:

```sql
-- core.agent_conversations
id, domain, title, created_at, updated_at

-- core.agent_messages
id, conversation_id, role, content, tool_calls (jsonb), tool_result (jsonb), created_at
```

BaseAgent handles all persistence in `chat()`, `onAssistantMessage()`, `onToolResult()`. Domain agents never touch conversation tables.

#### MCP integrations — the one place for formal interfaces

External integrations (bank APIs, Gmail, calendar) are the only place where we use port/adapter interfaces, because these are unstable external systems that might change:

```typescript
// server/src/mcps/types.ts
interface ExternalTransactionSource {
  fetchTransactions(since: Date): Promise<ImportedTransaction[]>;
}

// server/src/mcps/bank-scraper.ts
class BankScraperAdapter implements ExternalTransactionSource { /* ... */ }

// server/src/mcps/csv-import.ts
class CSVImportAdapter implements ExternalTransactionSource { /* ... */ }
```

Services consume MCP adapters through these interfaces. This is the only dependency inversion in the system — everything else uses concrete imports.

#### Adding a new domain (checklist)

Adding a new domain module (e.g., "work") requires:

1. `schema.ts` — Define Drizzle tables under a new pgSchema
2. `service.ts` — Implement business logic methods
3. `events.ts` — Define domain events
4. `routes/` — Thin HTTP handlers calling service
5. `agent/tools.ts` — Thin tool definitions calling service
6. `agent/system-prompt.ts` — Agent personality and instructions
7. `agent/work-agent.ts` — 3 lines: `domain`, `systemPrompt`, `tools`
8. Register agent in agent registry (`app.ts`)
9. Register routes in app (`app.ts`)
10. Add Zod schemas to `@vdp/shared` (if needed for frontend form validation)
11. Add domain config entry to frontend `navigation.ts`
12. Create route pages under `(domain)/work/`

Steps 1-7 are the module. Steps 8-12 are wiring. No framework code needs to change.

---



## 4. Refactor Strategy

### Phase 0: Foundation (before any new domain work)

**Step 1: Create unified server** ✅ DONE
- Created `server/` directory with `@vdp/server` package
- Migrated all wallet backend code into `server/src/domains/wallet/`
- Moved Drizzle config and DB client to `server/src/core/db/`
- Moved wallet schema to `server/src/domains/wallet/schema.ts`
- Frontend already points to `localhost:4001` — no changes needed
- Old `apps/wallet/backend/` can be removed (kept for reference)

**Step 2: Consolidate frontend into unified app** ✅ DECIDED (pending implementation)
- Create `apps/web/` — single Next.js app replacing all 6 frontend apps
- Navigation model: two-level sidebar (icon rail + expandable panel per domain)
- Route structure: `(domain)/` route group for shared shell, `/` for cross-domain home dashboard
- Home page (`/`) uses its own full-width layout without domain sidebar
- Chat panel: domain-aware, one agent per domain, context-switches on navigation
- Modular API client: `lib/api/client.ts` + per-domain modules (`wallet.ts`, `health.ts`, etc.)
- Shared components live in `apps/web/src/components/shared/` (no separate `packages/ui`)
- After migration: remove `apps/landing/`, `apps/wallet/frontend/`, `apps/health/frontend/`, `apps/people/frontend/`, `apps/work/frontend/`, `apps/study/frontend/`
- Update `pnpm-workspace.yaml` to: `apps/web`, `server`, `packages/*`
- Update root `package.json` dev scripts

**Step 3: Build core infrastructure** ✅ DONE
- Implemented event bus (`server/src/core/event-bus/`) — typed events, wildcard subscriptions, circular buffer log
- Implemented base agent class (`server/src/agents/base-agent.ts`) — chat loop, tool execution, event handling hooks
- Implemented skill registry (`server/src/skills/registry.ts`) — register/execute/list pattern ✅
- Implemented scheduler (`server/src/core/scheduler/`) — node-cron based with enable/disable ✅
- Docker compose for PostgreSQL + Redis (pending — using local PostgreSQL for now)

**Step 4: Refactor wallet to use new infra** ✅ DONE (partial — needs service layer)
- WalletAgent extends BaseAgent with full chat persistence
- Wallet emits domain events (transaction.created, spending.spike, etc.)
- Wallet tools factory pattern (`createWalletTools()`)
- All routes migrated and verified working end-to-end
- Agent route uses WalletAgent singleton with event bus + skill registry
- ⚠️ Still missing: service layer, routes and tools still contain duplicated SQL

**Step 5: Backend architecture refactor** ✅ DECIDED (pending implementation)

This step applies the module pattern (schema → service → thin adapters → events) to existing modules and core infrastructure:

- **5a. Shared agent conversation schema** — Create `core` pgSchema with `agent_conversations` and `agent_messages` tables (with `domain` column). Move persistence logic into BaseAgent. Remove per-domain conversation tables from wallet and health schemas. All domain agents become 3-line configs (domain + systemPrompt + tools).

- **5b. Wallet service layer** — Extract `walletService` from routes and tools. All balance calculations, transaction creation, stats queries written ONCE in `service.ts`. Routes become thin validators. Tools become thin JSON wrappers.

- **5c. Health service layer** — Same extraction for health module. Fix the `toolCalls` text/jsonb inconsistency (will be eliminated by shared agent persistence).

- **5d. Shared SSE agent route** — Extract generic SSE chat endpoint that resolves the agent from the agent registry by domain name. One route handler serves all domains: `POST /api/v1/:domain/agent/chat`.

- **5e. Health Zod schemas** — Add health validation schemas to `@vdp/shared`. Routes use `schema.safeParse()` instead of raw `request.body` casts.

- **5f. Wire registries** — Register wallet + health agents in agent registry at startup. Register at least one real skill. Subscribe to at least one cross-domain event. Register at least one scheduler job.

- **5g. Dead code cleanup** — Delete `apps/wallet/backend/`, `packages/db/`. Update `pnpm-workspace.yaml`.

---

## 5. Core Infrastructure Plan

### 5.1 Event Bus

```typescript
// server/src/core/event-bus/types.ts
type DomainEvent = {
  id: string;
  domain: "tasks" | "wallet" | "health" | "people" | "work" | "study" | "system";
  type: string;          // e.g. "transaction.created", "sleep.poor_quality"
  payload: Record<string, unknown>;
  timestamp: Date;
  metadata?: { triggeredBy?: string; correlationId?: string };
};

// In-process EventEmitter for v1. Upgrade to Redis pub/sub later if needed.
```

**Why in-process first:** Single server = no need for distributed messaging. Redis pub/sub can be added later without changing the event interface.

### 5.2 Goals Engine

```
goals table:
  id, domain, title, description, target_value, current_value,
  unit, deadline, status (active/completed/abandoned),
  created_at, updated_at

goal_milestones table:
  id, goal_id, title, target_value, completed_at

goal_progress table:
  id, goal_id, value, note, recorded_at
```

Goals are cross-domain. "Save $5000" is wallet. "Run 5km" is health. "Read 20 books" is study. The engine is domain-agnostic — domains push progress updates.

### 5.3 Timeline

A unified chronological feed of life events across all domains:

```
timeline_events table:
  id, domain, event_type, title, description, data (jsonb),
  importance (1-5), occurred_at, created_at
```

Used by agents for context: "What happened in the last week across all domains?"

### 5.4 Memory System

Agent memory for context persistence across conversations:

```
agent_memories table:
  id, domain, agent_id, content, memory_type (fact/preference/pattern/insight),
  importance (1-10), last_accessed_at, created_at
```

v1: relational storage with keyword search. v2: add pgvector for semantic search.

### 5.5 Auth

Single-user system for v1. Simple token-based auth:
- Environment variable `VDP_AUTH_TOKEN`
- Middleware checks `Authorization: Bearer <token>` header
- All frontends send token from localStorage
- Upgrade to proper auth (Lucia/Better Auth) when multi-user is needed

### 5.6 Scheduler

Cron-based job scheduler for proactive agent behavior:

```typescript
// Jobs like:
// - Every morning: health agent checks sleep data and emits events
// - Every evening: wallet agent summarizes daily spending
// - Weekly: orchestrator generates cross-domain insights
```

Use `node-cron` or `bullmq` with Redis for reliable job scheduling.

---

## 6. Agent System Design

### 6.1 Base Agent (owns all persistence)

BaseAgent handles the entire chat lifecycle: conversation management, message persistence, tool execution loop, and SSE streaming. Domain agents only provide configuration.

```typescript
// server/src/agents/base-agent.ts
abstract class BaseAgent {
  abstract readonly domain: DomainName;
  abstract readonly systemPrompt: string;
  abstract readonly tools: AgentTool[];

  // Core capabilities (injected):
  protected eventBus: EventBus;
  protected skills: SkillRegistry;

  // Chat with full persistence (BaseAgent handles everything):
  // - Get or create conversation (core.agent_conversations)
  // - Save user message (core.agent_messages)
  // - Load history, build Anthropic messages
  // - Run tool use loop
  // - Persist assistant messages and tool results
  // - Stream via SSE callbacks
  async chat(options: {
    message: string;
    conversationId?: string;
    callbacks: ChatCallbacks;
  }): Promise<void>;

  // Tool execution loop (handles multi-turn tool use)
  protected async runLoop(messages, callbacks): Promise<void>;

  // Proactive: agent decides to act without user input
  async evaluate(context: AgentContext): Promise<void>;

  // React to events from other domains
  async handleEvent(event: DomainEvent): Promise<void>;
}
```

### 6.2 Domain Agent (3 lines of config)

```typescript
// server/src/modules/wallet/agent/wallet-agent.ts
class WalletAgent extends BaseAgent {
  readonly domain = "wallet";
  readonly systemPrompt = WALLET_SYSTEM_PROMPT;
  readonly tools = createWalletTools();
}
```

That's the entire file. No persistence overrides, no conversation table imports.

### 6.3 Agent Tool Pattern

Tools are thin wrappers that call the domain service and return JSON:

```typescript
// server/src/modules/wallet/agent/tools.ts
export function createWalletTools(): AgentTool[] {
  return [
    {
      name: "list_transactions",
      description: "List recent transactions with optional filters",
      inputSchema: { /* JSON Schema */ },
      execute: async (params) => JSON.stringify(
        await walletService.listTransactions(params)
      ),
    },
    {
      name: "create_transaction",
      description: "Create a new transaction",
      inputSchema: { /* JSON Schema */ },
      execute: async (params) => JSON.stringify(
        await walletService.createTransaction(params)
      ),
    },
    // ... all tools follow this pattern
  ];
}
```

Tools never write SQL. They never emit events. The service handles both.

### 6.4 Shared SSE Agent Route

One generic route handler serves all domains by resolving the agent from the registry:

```typescript
// server/src/agents/routes.ts
app.post("/api/v1/:domain/agent/chat", async (request, reply) => {
  const { domain } = request.params;
  const agent = agentRegistry.get(domain);
  if (!agent) return reply.status(404).send({ error: `No agent for domain: ${domain}` });

  // SSE setup + callbacks (written ONCE)
  reply.raw.writeHead(200, { "Content-Type": "text/event-stream", ... });

  await agent.chat({
    message: request.body.message,
    conversationId: request.body.conversationId,
    callbacks: { onText, onToolUse, onToolResult, onDone, onError },
  });
});
```

No more per-domain agent route files.

### 6.5 Agent Conversation Persistence (shared core schema)

```sql
CREATE SCHEMA IF NOT EXISTS core;

-- One table for ALL domain agent conversations
CREATE TABLE core.agent_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain VARCHAR(20) NOT NULL,    -- "wallet", "health", etc.
  title VARCHAR(200),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- One table for ALL messages across all agents
CREATE TABLE core.agent_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES core.agent_conversations(id),
  role VARCHAR(10) NOT NULL,       -- "user", "assistant", "tool"
  content TEXT,
  tool_calls JSONB,                -- always jsonb, never text
  tool_result JSONB,               -- always jsonb, never text
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

### 6.6 Orchestrator Agent

The orchestrator doesn't own a domain. It:
- Subscribes to events from all domains
- Detects cross-domain patterns ("you spent more when sleep was poor")
- Coordinates multi-domain actions
- Generates weekly/monthly life summaries
- Has access to all domain agents' tools (delegated)

### 6.7 Proactive Agent Loop

```
Scheduler triggers → Agent.evaluate(context) → Agent decides actions
  → Actions execute → Events emitted → Other agents react
```

Example flow:
1. Scheduler triggers health agent at 8am
2. Health agent checks: sleep was 4 hours
3. Emits event: `health.sleep.poor_quality { hours: 4 }`
4. Orchestrator receives event, forwards to work agent
5. Work agent responds: suggests lighter workload, postpones deep work tasks
6. Wallet agent receives event: pauses risky investment suggestions

---

## 7. Skills System

Skills are **stateless, reusable functions** that agents compose to accomplish tasks.

```typescript
// server/src/skills/registry.ts
interface Skill {
  name: string;
  description: string;
  execute(params: unknown): Promise<unknown>;
}

class SkillRegistry {
  register(skill: Skill): void;
  get(name: string): Skill;
  list(): Skill[];
}
```

### Core Skills (built during Phase 0):

| Skill | Description | Used by |
|-------|-------------|---------|
| `analyze-trends` | Detect trends in time-series data | All agents |
| `detect-anomaly` | Flag unusual values/patterns | Wallet, Health |
| `create-plan` | Generate action plans from goals | All agents |
| `send-notification` | Push notification to user | All agents |
| `summarize` | Generate natural language summary | Orchestrator |
| `compare-periods` | Compare metrics across time periods | All agents |
| `forecast` | Simple forecasting from historical data | Wallet, Health |

### Domain-Specific Skills (built with each domain):

| Skill | Domain | Description |
|-------|--------|-------------|
| `categorize-transaction` | Wallet | Auto-categorize spending |
| `calculate-burn-rate` | Wallet | Monthly burn rate analysis |
| `sleep-quality-score` | Health | Compute sleep quality from data |
| `relationship-health-score` | People | Score based on interaction frequency |
| `learning-velocity` | Study | Track learning speed over time |

---

## 8. MCP Integration System

MCPs are **adapters** to external APIs. They expose a uniform interface.

```typescript
interface MCPIntegration {
  name: string;
  domain: string;
  capabilities: string[];   // ["read_transactions", "send_message", etc.]

  connect(config: unknown): Promise<void>;
  isConnected(): boolean;
  execute(action: string, params: unknown): Promise<unknown>;
}
```

### MCP Priority by Domain:

| Domain | MCP | Priority | Purpose |
|--------|-----|----------|---------|
| Wallet | Bank API (screen scraping / open banking) | P0 | Auto-import transactions |
| Wallet | Exchange rate API (dolarapi.com) | P0 | ARS/USD rates |
| Health | Apple Health (via shortcuts/export) | P1 | Steps, sleep, heart rate |
| Health | Google Fit API | P2 | Alternative health data source |
| People | Google Contacts | P1 | Contact sync |
| People | Telegram API | P1 | Message tracking |
| People | WhatsApp (unofficial) | P2 | Interaction tracking |
| Work | Google Calendar | P0 | Schedule management |
| Work | GitHub API | P1 | Code activity tracking |
| Work | Linear/Jira | P2 | Task management |
| Study | Notion API | P1 | Notes & knowledge base |
| Study | Kindle/Readwise | P2 | Reading tracking |
| System | Gmail API | P0 | Cross-domain email |
| System | Telegram Bot | P0 | Notification channel |

---

## 9. Domain Development Order

```
0. Tasks    ████████████████████ (FIRST - simplest, proves the architecture)
1. Wallet   ████████████████████ (DONE - refactor to service layer)
2. Health   ▓▓▓▓▓▓▓▓░░░░░░░░░░░ (Backend DONE - needs service layer + frontend migration)
3. Work     ░░░░░░░░░░░░░░░░░░░░ (calendar/task data is structured)
4. People   ░░░░░░░░░░░░░░░░░░░░ (requires messaging MCPs)
5. Study    ░░░░░░░░░░░░░░░░░░░░ (most subjective, least urgent)
```

**Rationale:**
- **Tasks first** (new): Simplest possible domain — pure CRUD with no external dependencies. First module built end-to-end on the new architecture (service layer, thin routes, thin tools, shared agent persistence). Proves the pattern works before applying it to existing modules. Immediately useful as a daily driver.
- **Wallet** (refactor): Already working, needs service layer extraction and migration to new patterns
- **Health** (refactor + complete): Backend exists, needs same service layer treatment plus frontend migration
- **Work**: Calendar integration gives structure, GitHub gives activity data. Daily tasks from Tasks module can graduate here.
- **People**: Requires messaging integrations which are harder to build
- **Study**: Most subjective metrics, least external data sources

---

## 10. Detailed Blueprint Per Domain

### 10.0 TASKS (First complete module)

**Purpose:** A lightweight daily todo list. Not project management — just "things I need to get done today." Tasks can optionally link to a domain (wallet, health, people, etc.) and can later be promoted to full Work project tasks when they grow in scope.

**Domain Model:**

```
tasks table:
  id, title, description, status (pending/done/carried_over/discarded),
  priority (1-3: low/medium/high), scheduled_date (defaults to today),
  domain (nullable: "wallet"|"health"|"work"|"people"|"study"|null),
  completed_at, created_at, updated_at

task_notes table:
  id, task_id, content, created_at
```

Deliberately simple. No projects, no dependencies, no estimated hours, no assignees. That's Work domain territory.

**Key Metrics:**
- Tasks completed today / total scheduled
- Daily completion rate trend (last 7/30 days)
- Carry-over rate (how often tasks slip)
- Average tasks per day
- Completion by domain (which areas generate most todos)

**Rules & Triggers:**
- All tasks completed for the day → emit `tasks.daily.all_completed`
- Task carried over 3+ times → emit `tasks.task.stuck` (something is blocked)
- Zero tasks created today → emit `tasks.daily.empty` (no plan for the day)
- High carry-over rate (>50% over a week) → emit `tasks.overloaded` (taking on too much)

**UI Pages** (at `(domain)/tasks/` in unified app):
- Dashboard: Today's todo list with checkboxes, priority indicators, domain tags
- Quick-add input always visible at the top
- Filter by status (pending, done, all) and by domain
- End-of-day review: shows incomplete tasks with carry-over / discard buttons
- History: past days with completion stats

**Agent Responsibilities:**
- Create, complete, and list tasks via natural language
- Suggest daily task priorities based on deadlines and domain context
- At end of day: prompt user to review incomplete tasks
- Flag stuck tasks (carried over multiple times)
- Daily completion summary
- Suggest tasks based on events from other domains ("you have a dentist appointment tomorrow — add a reminder?")

**Skills Required:** summarize, send-notification

**MCP Integrations:** None (standalone, self-contained)

**Automations:**
- Morning: Show today's task list (including carried-over items)
- Evening: Prompt end-of-day review for incomplete tasks
- Weekly: Completion rate summary, identify stuck tasks

**Acceptance Criteria:**
- [ ] Task CRUD (create, list, update status, delete)
- [ ] Schedule tasks for a specific date (default: today)
- [ ] Optional domain tagging
- [ ] Priority levels (low/medium/high)
- [ ] End-of-day review flow (carry over or discard)
- [ ] Task history with daily completion stats
- [ ] Tasks agent with tool use
- [ ] Proactive stuck-task detection
- [ ] Service layer pattern (schema → service → thin routes → thin tools → events)
- [ ] Shared agent persistence via core schema
- [ ] Registered in agent registry, accessible via generic SSE route

**Why build this first:**

Tasks is the simplest possible domain — pure CRUD, no external integrations, no complex calculations, no multi-currency math. Building it end-to-end proves the entire architecture works:
1. The service layer pattern holds up
2. Thin routes and thin tools actually stay thin
3. Shared agent persistence works across domains
4. The generic SSE agent route resolves correctly
5. Domain events emit and can be subscribed to
6. The frontend shell (sidebar, chat panel) works with a new domain

Once Tasks works, we have a verified template for every future domain.

---

### 10.1 WALLET (Refactor existing)

**Domain Model:** Already built — accounts, transactions, categories, savings goals, investments, exchange rates.

**Key Metrics:**
- Monthly income vs expenses (burn rate)
- Savings rate (% of income saved)
- Investment portfolio performance
- Category spending trends
- Net worth over time

**Rules & Triggers:**
- Spending spike alert (>2x daily average)
- Budget threshold warnings (80%, 100% of category budget)
- Savings goal milestone celebrations
- Unusual transaction detection
- Exchange rate significant movement alert

**UI Pages** (at `(domain)/wallet/` in unified app): Dashboard, Transactions, Savings, Investments, Stats. Chat panel accessible from shell.

**Agent Responsibilities:**
- Answer financial questions conversationally
- Auto-categorize transactions
- Proactive spending alerts
- Weekly/monthly financial summaries
- Investment rebalancing suggestions
- React to cross-domain events (reduce risk when stressed)

**Skills Required:** analyze-trends, detect-anomaly, forecast, categorize-transaction, calculate-burn-rate

**MCP Integrations:** Bank API (transaction import), Exchange rate API (dolarapi.com)

**Automations:**
- Daily: Fetch exchange rates
- Weekly: Generate spending summary, check budget adherence
- Monthly: Generate full financial report, update net worth

**Acceptance Criteria:**
- [x] CRUD for all entities
- [x] AI agent with tool use
- [x] Statistics and visualizations
- [x] Refactored to unified server architecture
- [x] Emits domain events
- [x] Uses base agent class
- [ ] Proactive alerts working
- [ ] Exchange rate MCP auto-fetching

---

### 10.2 HEALTH

**Domain Model:**

```
health_metrics table:
  id, metric_type (sleep/steps/weight/heart_rate/water/calories/mood/energy),
  value, unit, recorded_at, source (manual/apple_health/fitbit), notes

health_habits table:
  id, name, frequency (daily/weekly), target_value, unit,
  is_active, created_at

habit_completions table:
  id, habit_id, completed_at, value, notes

medications table:
  id, name, dosage, frequency, time_of_day, start_date, end_date, is_active

medication_logs table:
  id, medication_id, taken_at, skipped, notes

appointments table:
  id, title, doctor_name, specialty, location, scheduled_at,
  notes, status (upcoming/completed/cancelled)

body_measurements table:
  id, measurement_type (weight/height/body_fat/blood_pressure/glucose),
  value, unit, recorded_at
```

**Key Metrics:**
- Sleep quality score (duration + consistency)
- Daily step count & weekly average
- Habit completion rate (%)
- Weight trend (7-day moving average)
- Hydration level
- Mood/energy trend
- Medication adherence rate

**Rules & Triggers:**
- Poor sleep (<6h) → emit `health.sleep.poor_quality`
- Missed medication → emit `health.medication.missed`
- Weight change >2kg in a week → emit `health.weight.significant_change`
- Habit streak broken → emit `health.habit.streak_broken`
- Mood declining for 3+ days → emit `health.mood.declining_trend`
- Step goal achieved → emit `health.steps.goal_reached`

**UI Pages** (at `(domain)/health/` in unified app):
- Dashboard: Today's metrics overview (sleep, steps, water, mood, energy)
- Metrics page: Historical charts for each metric type (Recharts)
- Habits page: Habit tracker with streak visualization
- Medications page: Medication schedule and adherence log
- Appointments page: Upcoming and past appointments
- Body page: Weight/measurement trends
- Chat panel accessible from shell (health agent)

**Agent Responsibilities:**
- Track and analyze health patterns
- Remind about medications and appointments
- Correlate health data with other domains ("you spend more when mood is low")
- Suggest habit improvements based on trends
- Generate weekly health summaries
- Answer health-related questions (with clear disclaimer: not medical advice)

**Skills Required:** analyze-trends, detect-anomaly, forecast, sleep-quality-score, compare-periods

**MCP Integrations:**
- Apple Health (export via Shortcuts → JSON import) — P0
- Google Calendar (appointment sync) — P1
- Fitbit/Garmin API — P2

**Automations:**
- Morning: Check last night's sleep, emit quality event
- Daily: Medication reminders at scheduled times
- Evening: Daily health summary, prompt for mood/energy log
- Weekly: Health trend analysis, habit completion report

**Acceptance Criteria:**
- [ ] All health entities CRUD
- [ ] Manual metric logging UI
- [ ] Historical charts for all metric types
- [ ] Habit tracking with streaks
- [ ] Medication tracking with reminders
- [ ] Health agent with tool use
- [ ] Apple Health data import
- [ ] Cross-domain events working (sleep → work/wallet)
- [ ] Weekly health summary generation

---

### 10.3 WORK

**Domain Model:**

```
projects table:
  id, name, description, status (active/completed/paused/archived),
  priority (1-5), deadline, domain (personal/professional), created_at

tasks table:
  id, project_id (nullable), title, description,
  status (todo/in_progress/done/blocked), priority (1-5),
  estimated_hours, actual_hours, deadline, completed_at, created_at

time_blocks table:
  id, task_id (nullable), title, start_time, end_time,
  category (deep_work/meeting/admin/break), notes

work_sessions table:
  id, task_id, started_at, ended_at, duration_minutes,
  focus_score (1-5), notes

calendar_events table:
  id, external_id, title, start_time, end_time, location,
  attendees (jsonb), source (manual/google_calendar), synced_at

daily_logs table:
  id, date, energy_level (1-5), productivity_score (1-5),
  accomplishments (text[]), blockers (text[]), notes
```

**Key Metrics:**
- Deep work hours per day/week
- Task completion rate
- Project progress (% tasks done)
- Meeting load (hours in meetings vs deep work)
- Focus score trends
- Productivity score trends
- Overdue task count

**Rules & Triggers:**
- Meeting overload (>4h/day) → emit `work.meetings.overloaded`
- Task overdue → emit `work.task.overdue`
- Project deadline approaching (7 days) → emit `work.project.deadline_approaching`
- Zero deep work in a day → emit `work.deep_work.zero_day`
- High productivity streak (3+ days) → emit `work.productivity.streak`

**UI Pages** (at `(domain)/work/` in unified app):
- Dashboard: Today's schedule, active tasks, focus timer
- Projects page: Project list with progress bars
- Tasks page: Kanban or list view with filters
- Calendar page: Week view with time blocks
- Analytics page: Productivity charts, deep work trends
- Daily log page: End-of-day reflection form
- Chat panel accessible from shell (work agent)

**Agent Responsibilities:**
- Help plan daily schedule based on priorities and energy
- Track project progress and flag risks
- Suggest task prioritization
- Analyze productivity patterns
- Correlate work output with health metrics
- Generate weekly work summaries
- React to health events (poor sleep → suggest lighter day)

**Skills Required:** analyze-trends, create-plan, forecast, compare-periods, summarize

**MCP Integrations:**
- Google Calendar API — P0
- GitHub API (commits, PRs) — P1
- Linear/Jira — P2

**Automations:**
- Morning: Generate today's suggested schedule
- End of day: Prompt for daily log, summarize accomplishments
- Weekly: Productivity report, next week planning
- On health event: Adjust daily recommendations

**Acceptance Criteria:**
- [ ] Project and task CRUD
- [ ] Time blocking UI
- [ ] Work session tracking (focus timer)
- [ ] Google Calendar sync
- [ ] Daily log / reflection
- [ ] Work agent with tool use
- [ ] Productivity analytics
- [ ] Cross-domain reaction to health events
- [ ] Weekly planning assistance

---

### 10.4 PEOPLE

**Domain Model:**

```
contacts table:
  id, name, nickname, email, phone, birthday,
  relationship_type (family/friend/colleague/acquaintance),
  importance (1-5), notes, avatar_url, created_at

interactions table:
  id, contact_id, type (call/message/meeting/social),
  channel (whatsapp/telegram/email/in_person),
  date, duration_minutes, sentiment (positive/neutral/negative),
  notes, created_at

groups table:
  id, name, description, created_at

group_members table:
  id, group_id, contact_id

relationship_goals table:
  id, contact_id (nullable), group_id (nullable),
  goal (e.g. "call weekly"), frequency, last_achieved_at

social_events table:
  id, title, date, location, description,
  attendees (contact_id[]), status (planned/completed/cancelled)

important_dates table:
  id, contact_id, date_type (birthday/anniversary/custom),
  date, label, remind_days_before
```

**Key Metrics:**
- Interaction frequency per contact
- Relationship health score (based on frequency vs target)
- Days since last contact (per person)
- Social activity level (interactions per week)
- Birthday/important date proximity
- Sentiment trends per relationship

**Rules & Triggers:**
- No contact in 30+ days with important person → emit `people.relationship.neglected`
- Birthday approaching (7 days) → emit `people.birthday.approaching`
- Social isolation (0 interactions in a week) → emit `people.social.isolation`
- Negative sentiment trend → emit `people.relationship.declining`

**UI Pages** (at `(domain)/people/` in unified app):
- Dashboard: Upcoming birthdays, neglected contacts, recent interactions
- Contacts page: Contact list with relationship health indicators
- Contact detail: Interaction history, relationship timeline
- Interactions page: Log new interactions
- Groups page: Friend circles / groups
- Calendar: Social events and important dates
- Chat panel accessible from shell (people agent)

**Agent Responsibilities:**
- Remind about neglected relationships
- Suggest reaching out to specific people
- Track interaction patterns
- Birthday and important date reminders
- Help plan social events
- Generate relationship health reports
- Suggest gifts based on interaction notes

**Skills Required:** analyze-trends, send-notification, compare-periods, relationship-health-score

**MCP Integrations:**
- Google Contacts — P1
- Telegram API (interaction detection) — P1
- Google Calendar (social events) — P1
- WhatsApp (unofficial, read-only) — P2

**Acceptance Criteria:**
- [ ] Contact CRUD with relationship types
- [ ] Interaction logging
- [ ] Relationship health scoring
- [ ] Birthday and important date reminders
- [ ] Social event planning
- [ ] People agent with tool use
- [ ] Google Contacts sync
- [ ] Telegram interaction tracking
- [ ] Neglected relationship alerts

---

### 10.5 STUDY

**Domain Model:**

```
subjects table:
  id, name, description, category (language/programming/science/art/other),
  status (active/completed/paused), priority (1-5), created_at

learning_resources table:
  id, subject_id, type (book/course/video/article/podcast),
  title, author, url, total_units (pages/chapters/lessons),
  completed_units, status (not_started/in_progress/completed),
  rating (1-5), notes, created_at

study_sessions table:
  id, subject_id, resource_id (nullable), started_at, ended_at,
  duration_minutes, focus_score (1-5), notes_taken (text),
  concepts_learned (text[])

flashcards table:
  id, subject_id, front, back, difficulty (1-5),
  next_review_at, review_count, ease_factor, created_at

flashcard_reviews table:
  id, flashcard_id, quality (1-5), reviewed_at

knowledge_notes table:
  id, subject_id, title, content, tags (text[]),
  linked_notes (id[]), created_at, updated_at

learning_goals table:
  id, subject_id, description, target_date, status, created_at
```

**Key Metrics:**
- Study hours per day/week
- Learning velocity (units completed per hour)
- Knowledge retention (flashcard review accuracy)
- Subject progress (% complete)
- Streak (consecutive study days)
- Focus score trends during study
- Active subjects count

**Rules & Triggers:**
- Study streak broken → emit `study.streak.broken`
- Flashcards due for review → emit `study.flashcards.due`
- Resource nearly complete (>90%) → emit `study.resource.nearly_complete`
- No study in 3+ days → emit `study.inactive`
- Low retention on flashcards → emit `study.retention.declining`

**UI Pages** (at `(domain)/study/` in unified app):
- Dashboard: Today's study plan, active subjects, streak counter
- Subjects page: Subject list with progress
- Resources page: Books, courses with completion tracking
- Study timer: Pomodoro-style focus timer
- Flashcards page: Review interface with spaced repetition
- Notes page: Knowledge note editor with linking
- Analytics: Study hours, learning velocity charts
- Chat panel accessible from shell (study agent)

**Agent Responsibilities:**
- Create study plans based on goals and available time
- Remind about flashcard reviews
- Track learning velocity and suggest pace adjustments
- Generate study summaries
- Create flashcards from notes
- Correlate study effectiveness with health/work data
- Suggest optimal study times based on energy patterns

**Skills Required:** analyze-trends, create-plan, forecast, learning-velocity, summarize

**MCP Integrations:**
- Notion API (notes sync) — P1
- Readwise/Kindle (reading highlights) — P2

**Acceptance Criteria:**
- [ ] Subject and resource CRUD
- [ ] Study session tracking with timer
- [ ] Spaced repetition flashcard system
- [ ] Knowledge note system
- [ ] Learning analytics
- [ ] Study agent with tool use
- [ ] Study plan generation
- [ ] Flashcard auto-creation from notes
- [ ] Cross-domain time awareness (work schedule → study windows)

---

## 11. Implementation Roadmap

### Phase 0: Architecture Foundation (Weeks 1-3)

| Step | Task | Status | Details |
|------|------|--------|---------|
| 0.1 | Create unified server | ✅ DONE | New `server/` with Fastify, migrate wallet backend code |
| 0.2 | Migrate DB layer | ✅ DONE | Move Drizzle config + wallet schema into server |
| 0.3 | Build event bus | ✅ DONE | In-process EventEmitter with typed events |
| 0.4 | Build base agent | ✅ DONE | Abstract class with chat, evaluate, handleEvent |
| 0.5 | Build skill registry | ✅ DONE | Registration + execution framework |
| 0.6 | Build scheduler | ✅ DONE | node-cron based job scheduler |
| | **Backend refactor** | | |
| 0.7 | Shared agent persistence | ✅ DONE | Core schema for conversations/messages, BaseAgent owns persistence, remove per-domain tables |
| 0.8 | Wallet service layer | ✅ DONE | Extract `walletService` — all queries, calculations, event emission in one place |
| 0.9 | Health service layer | ✅ DONE | Extract `healthService` — same pattern, fix toolCalls text/jsonb inconsistency |
| 0.10 | Shared SSE agent route | ✅ DONE | Generic `POST /api/v1/:domain/agent/chat` resolving agent from registry |
| 0.11 | Health Zod schemas | ✅ DONE | Add health validation to `@vdp/shared`, routes use `safeParse()` |
| 0.12 | Wire registries | ✅ DONE | Register agents, one skill, one event subscriber, one scheduler job |
| 0.13 | Dead code cleanup | ✅ DONE | Delete `packages/db/`, update workspace config, clean stale references |
| | **Tasks module (first complete domain)** | | |
| 0.14 | Tasks schema | ✅ DONE | `tasks` pgSchema with tasks + task_notes tables, 3 indexes |
| 0.15 | Tasks service | ✅ DONE | `tasksService` — CRUD, daily review, carry-over/discard, completion stats (~290 lines) |
| 0.16 | Tasks routes | ✅ DONE | Thin HTTP routes + stats routes calling service |
| 0.17 | Tasks agent | ✅ DONE | 3-line config + 14 thin tools calling service |
| 0.18 | Tasks events | ✅ DONE | daily.all_completed, task.stuck, daily.empty, overloaded |
| 0.19 | Tasks Zod schemas | ✅ DONE | Add task validation to `@vdp/shared` |
| 0.20 | Verify Tasks e2e | ✅ DONE | Routes work, agent chat works via generic SSE, events fire |
| | **Frontend consolidation** | | |
| 0.21 | Create unified frontend | ✅ DONE | `apps/web/` with two-level sidebar, route groups, modular API client |
| 0.22 | Migrate tasks frontend | ✅ DONE | Tasks pages migrated to `(domain)/tasks/*` with `tasksApi` imports |
| 0.23 | Migrate wallet frontend | ✅ DONE | 6 wallet pages migrated to `(domain)/wallet/*` with `walletApi` imports |
| 0.24 | Migrate health frontend | ✅ DONE | 6 health pages migrated to `(domain)/health/*` with `healthApi` imports |
| 0.25 | Build home dashboard | ✅ DONE | Cross-domain overview at `/home` — tasks, wallet, health summaries |
| 0.26 | Remove old frontend apps | ✅ DONE | Deleted 6 old frontend dirs + landing app, cleaned pnpm-workspace.yaml |
| | **UI/UX polish** | | |
| 0.27 | Landing page reorganization | ✅ DONE | Dashboard hero card (full-width CTA) + "Modulos" divider + responsive 2-3 col grid. Tasks first in grid. |
| 0.28 | Light/dark theme system | ✅ DONE | 50+ CSS custom properties, `[data-theme]` toggle, ThemeProvider with localStorage → prefers-color-scheme → dark cascade, anti-flash script, WCAG AA light theme, domain accent adjustments for light mode |
| | **Infrastructure** | | |
| 0.29 | Docker compose | 🔲 TODO | PostgreSQL + Redis containers |
| 0.30 | Verify end-to-end | 🔲 TODO | Single `pnpm dev` starts web + server, all flows work |

### Phase 1: Health Domain (Weeks 3-5)

| Step | Task | Details |
|------|------|---------|
| 1.1 | Health DB schema | Create all health tables via Drizzle ✅ DONE |
| 1.2 | Health service layer | CRUD + business logic for all entities |
| 1.3 | Health API routes | REST endpoints for all health entities ✅ DONE |
| 1.4 | Health pages in unified app | Dashboard, metrics, habits, medications, appointments, body pages under `(domain)/health/` |
| 1.5 | Health agent | Agent with health-specific tools ✅ DONE |
| 1.6 | Health events | Define + wire event emission ✅ DONE |
| 1.7 | Cross-domain wiring | Health events → wallet/work agents react |
| 1.8 | Apple Health import | Shortcut-based data import |
| 1.9 | Health automations | Morning/evening/weekly scheduled jobs |

### Phase 2: Work Domain (Weeks 6-8)

| Step | Task | Details |
|------|------|---------|
| 2.1 | Work DB schema | Projects, tasks, time blocks, sessions, logs |
| 2.2 | Work service layer | CRUD + scheduling logic |
| 2.3 | Work API routes | REST endpoints |
| 2.4 | Work pages in unified app | Dashboard, projects, tasks, calendar, analytics under `(domain)/work/` |
| 2.5 | Work agent | Agent with work-specific tools |
| 2.6 | Google Calendar MCP | Bi-directional calendar sync |
| 2.7 | Cross-domain wiring | Health → work adjustment, work → wallet impact |
| 2.8 | Work automations | Morning planning, daily log prompts |

### Phase 3: People Domain (Weeks 9-11)

| Step | Task | Details |
|------|------|---------|
| 3.1 | People DB schema | Contacts, interactions, groups, events |
| 3.2 | People service layer | CRUD + relationship scoring |
| 3.3 | People API routes | REST endpoints |
| 3.4 | People pages in unified app | Dashboard, contacts, interactions under `(domain)/people/` |
| 3.5 | People agent | Agent with people-specific tools |
| 3.6 | Google Contacts MCP | Contact sync |
| 3.7 | Telegram MCP | Interaction tracking |
| 3.8 | Cross-domain wiring | Social isolation → health/work alerts |
| 3.9 | People automations | Birthday reminders, neglect alerts |

### Phase 4: Study Domain (Weeks 12-14)

| Step | Task | Details |
|------|------|---------|
| 4.1 | Study DB schema | Subjects, resources, sessions, flashcards, notes |
| 4.2 | Study service layer | CRUD + spaced repetition algorithm |
| 4.3 | Study API routes | REST endpoints |
| 4.4 | Study pages in unified app | Dashboard, subjects, flashcards, notes under `(domain)/study/` |
| 4.5 | Study agent | Agent with study-specific tools |
| 4.6 | Notion MCP | Notes sync |
| 4.7 | Cross-domain wiring | Work schedule → study windows |
| 4.8 | Study automations | Flashcard reminders, study planning |

### Phase 5: Orchestrator & Polish (Weeks 15-16)

| Step | Task | Details |
|------|------|---------|
| 5.1 | Orchestrator agent | Cross-domain coordinator agent |
| 5.2 | Goals engine | Cross-domain goal tracking |
| 5.3 | Timeline | Unified life event feed |
| 5.4 | Weekly life report | Auto-generated cross-domain summary |
| 5.5 | Notification system | Telegram bot for proactive notifications |
| 5.6 | Memory system | Agent memory with search |
| 5.7 | End-to-end testing | Full cross-domain scenario testing |

---

## Critical Files to Modify During Refactor

**Already done (server-side):**
- `apps/wallet/backend/src/` → `server/src/modules/wallet/` ✅
- `packages/db/src/schema/wallet.ts` → `server/src/modules/wallet/schema.ts` ✅
- `packages/db/src/client.ts` → `server/src/core/db/client.ts` ✅
- `packages/db/drizzle.config.ts` → `server/drizzle.config.ts` ✅
- `server/src/core/event-bus/` — Event system ✅
- `server/src/agents/base-agent.ts` — Base agent class ✅
- `server/src/skills/registry.ts` — Skill framework ✅
- `server/src/core/scheduler/` — Job scheduler ✅

**Backend architecture refactor (next):**

Create:
- `server/src/core/schema.ts` — Shared `core` pgSchema with `agent_conversations` + `agent_messages` tables
- `server/src/modules/wallet/service.ts` — WalletService class (extract logic from routes + tools)
- `server/src/modules/health/service.ts` — HealthService class (same pattern)
- `server/src/agents/routes.ts` — Generic SSE agent route (`POST /api/v1/:domain/agent/chat`)
- `packages/shared/src/schemas/health.ts` — Health Zod validation schemas

Refactor:
- `server/src/agents/base-agent.ts` — Add conversation persistence (chat, onAssistantMessage, onToolResult use core schema)
- `server/src/modules/wallet/agent/wallet-agent.ts` — Reduce to 3 lines (domain + prompt + tools), remove persistence overrides
- `server/src/modules/health/agent/health-agent.ts` — Same reduction
- `server/src/modules/wallet/agent/tools.ts` — Tools call `walletService.*` instead of writing SQL
- `server/src/modules/health/agent/tools.ts` — Tools call `healthService.*` instead of writing SQL
- `server/src/modules/wallet/routes/*.ts` — Routes call `walletService.*` instead of writing SQL
- `server/src/modules/health/routes/*.ts` — Routes call `healthService.*` instead of writing SQL
- `server/src/app.ts` — Register agents in registry, wire event subscribers, register scheduler jobs, use generic agent route

Delete:
- `server/src/modules/wallet/schema.ts` — Remove `agentConversations` + `agentMessages` tables (moved to core)
- `server/src/modules/health/schema.ts` — Remove `healthAgentConversations` + `healthAgentMessages` tables (moved to core)
- `server/src/modules/wallet/routes/agent.ts` — Replaced by generic agent route
- `server/src/modules/health/routes/agent.ts` — Replaced by generic agent route

**Frontend consolidation:**

Create:
- `apps/web/` — New unified Next.js app
- `apps/web/src/app/(domain)/layout.tsx` — Shell layout with two-level sidebar + chat panel
- `apps/web/src/app/page.tsx` — Cross-domain home dashboard (full-width layout)
- `apps/web/src/components/shell/icon-rail.tsx` — Domain switcher rail
- `apps/web/src/components/shell/sidebar-panel.tsx` — Expandable domain-specific nav
- `apps/web/src/components/shell/chat-panel.tsx` — Domain-aware chat (replaces per-app chat panels)
- `apps/web/src/lib/api/` — Modular API client (client.ts + per-domain modules)
- `apps/web/src/lib/navigation.ts` — Domain nav config (routes, icons, labels per domain)

Migrate:
- `apps/wallet/frontend/src/app/page.tsx` → `apps/web/src/app/(domain)/wallet/page.tsx`
- `apps/wallet/frontend/src/app/transactions/` → `apps/web/src/app/(domain)/wallet/transactions/`
- `apps/wallet/frontend/src/app/savings/` → `apps/web/src/app/(domain)/wallet/savings/`
- `apps/wallet/frontend/src/app/investments/` → `apps/web/src/app/(domain)/wallet/investments/`
- `apps/wallet/frontend/src/app/stats/` → `apps/web/src/app/(domain)/wallet/stats/`
- `apps/health/frontend/src/app/` → `apps/web/src/app/(domain)/health/` (all pages)
- Format utils from `apps/wallet/frontend/src/lib/format.ts` → `apps/web/src/lib/format.ts` (merge both)

Delete after migration:
- `apps/landing/`
- `apps/wallet/frontend/`
- `apps/wallet/backend/` (already migrated to server)
- `apps/health/frontend/`
- `apps/people/frontend/`
- `apps/work/frontend/`
- `apps/study/frontend/`
- `packages/db/` (already migrated to server)

Update:
- `pnpm-workspace.yaml` — Simplify to: `apps/web`, `server`, `packages/*`
- Root `package.json` — Update dev scripts (`dev:web`, `dev:server`, `dev` runs both)

---

## Verification

After Phase 0 (backend refactor):
1. Wallet routes return same data as before (no behavior change)
2. Wallet agent chat works through generic SSE route (`POST /api/v1/wallet/agent/chat`)
3. Health agent chat works through same generic route (`POST /api/v1/health/agent/chat`)
4. Agent conversations stored in `core.agent_conversations` with correct `domain` column
5. No SQL in route files or tool files — all queries in service layer
6. `walletService.getAccountsWithBalances()` used by both route and tool (single source)
7. At least one cross-domain event handler fires (e.g., health.sleep.poor_quality → console log)
8. At least one scheduler job runs on cron
9. Agent registry resolves agents by domain name
10. Old `apps/wallet/backend/` and `packages/db/` deleted

After Phase 0 (frontend consolidation):
1. Run `pnpm dev` — unified web app + server start (two processes)
2. Navigate to `http://localhost:3000` — see cross-domain home dashboard
3. Navigate to `/wallet` — two-level sidebar shows, wallet dashboard loads with real data
4. Navigate to `/health` — sidebar swaps to health nav, health dashboard loads
5. Chat panel opens and talks to the correct domain agent based on current route
6. Switching domains in sidebar switches chat context
7. All old frontend apps are deleted, workspace config is clean

After each domain phase:
1. Domain pages load with real data under `(domain)/{domain}/` routes
2. Domain has a `service.ts` that owns all business logic
3. Domain appears in icon rail with correct icon/color
4. Agent responds to domain-specific questions in chat panel (via generic route)
5. Cross-domain events propagate correctly
6. Scheduled automations execute on time