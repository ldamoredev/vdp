# VDP Frontend Module Architecture Plan

## Executive Summary

The previous refactoring (split hooks, chat decomposition, history model, detail sub-components) is complete. This plan establishes **Solution A: Domain Context + Module Convention** — a repeatable pattern so future domain modules (health, wallet, etc.) can be added by following the tasks module as a canonical reference.

**Core changes**:
1. React Context per module (split reads/writes to avoid re-render storms)
2. Standardized module scaffold convention
3. Components consume context instead of receiving 15+ props
4. Extensible domain configuration system

**Total estimated effort**: 8-12 hours across 5 phases.

---

## Architecture Decisions

### Split Context Pattern (reads vs writes)

Each module gets **two contexts** to prevent unnecessary re-renders:
- `QueriesContext` — read-only derived data (tasks, stats, planning, filters). Changes frequently.
- `ActionsContext` — stable function references (mutations, setters). Rarely changes reference identity.

This is critical: a single context with 50+ values would re-render the entire subtree on every state change.

### Module Convention

Every domain module follows this exact structure:
```
features/{domain}/
├── presentation/
│   ├── components/           # UI components (consume context via hooks)
│   │   ├── detail/           # Sub-components for detail views (optional)
│   │   └── ...
│   ├── __tests__/            # Selector tests + hook tests
│   ├── {domain}-selectors.ts # Pure functions: filtering, sorting, formatting
│   ├── use-{domain}-queries.ts    # React Query hooks + derived state
│   ├── use-{domain}-mutations.ts  # Mutation hooks + busy state
│   ├── use-{domain}-detail.ts     # Selected item detail (optional)
│   ├── use-{domain}-creation.ts   # Creation form state (optional)
│   ├── use-{domain}-model.ts      # Thin orchestrator composing sub-hooks
│   ├── {domain}-context.tsx       # Context definitions + Provider
│   └── use-{domain}-context.ts    # Consumer hooks (useTasksQueries, useTasksActions)
```

### Page Files Stay Thin

```tsx
// app/(domain)/tasks/page.tsx (~15 lines)
export default function TasksDashboard() {
  return (
    <TasksProvider>
      <TasksDashboardContent />
    </TasksProvider>
  );
}
```

---

## Phase 1: Tasks Context Layer (2-3 hours) — HIGHEST IMPACT

**Goal**: Create the context layer for the tasks module. Components switch from props to context consumption.

### New Files

| File | Description |
|------|-------------|
| `features/tasks/presentation/tasks-context.tsx` | `TasksQueriesContext`, `TasksActionsContext`, `TasksProvider` component |
| `features/tasks/presentation/use-tasks-context.ts` | `useTasksQueries()` and `useTasksActions()` consumer hooks with error boundaries |

### `tasks-context.tsx` Design

```tsx
// Two separate contexts to avoid re-render storms
const TasksQueriesContext = createContext<TasksQueriesValue | null>(null);
const TasksActionsContext = createContext<TasksActionsValue | null>(null);

// TasksQueriesValue = return type of useTasksQueries() (data + derived state)
// TasksActionsValue = mutations + setters from useTaskMutations + useTaskCreation + useTaskDetail

export function TasksProvider({ children }: { children: React.ReactNode }) {
  const queries = useTasksQueries();
  const detail = useTaskDetail({ tasks, pendingTasks, focusTasks });
  const mutations = useTaskMutations({ onNoteAdded: ... });
  const creation = useTaskCreation({ onCreated: ..., setFilter: ... });

  // useMemo for actions to stabilize references
  const actions = useMemo(() => ({ ...mutations, ...detail.actions, ...creation.actions }), [...deps]);

  return (
    <TasksActionsContext value={actions}>
      <TasksQueriesContext value={{ ...queries, ...detail.data }}>
        {children}
      </TasksQueriesContext>
    </TasksActionsContext>
  );
}
```

### `use-tasks-context.ts` Design

```tsx
export function useTasksQueries() {
  const ctx = useContext(TasksQueriesContext);
  if (!ctx) throw new Error("useTasksQueries must be used within TasksProvider");
  return ctx;
}

export function useTasksActions() {
  const ctx = useContext(TasksActionsContext);
  if (!ctx) throw new Error("useTasksActions must be used within TasksProvider");
  return ctx;
}
```

### Modified Files

| File | Change |
|------|--------|
| `app/(domain)/tasks/page.tsx` | Wrap with `<TasksProvider>`, extract content to `TasksDashboardContent` |
| `use-tasks-dashboard-model.ts` | Keep as orchestrator but also feed into context |

### Testing

- Unit test: `useTasksQueries` throws outside provider
- Unit test: `useTasksActions` throws outside provider
- Integration: Existing selector tests remain unchanged

---

## Phase 2: Migrate Components to Context (2-3 hours)

**Goal**: Components consume context instead of receiving props from page. Remove prop drilling.

### Migration Order (by prop count, highest first)

1. **DetailPanel** (16 props → 0) — uses `useTasksQueries()` + `useTasksActions()`
2. **ExecutionQueue** (16 props → 0) — uses both contexts
3. **OperationalHeader** (10 props → 0) — uses `useTasksQueries()` + `useTasksActions()`
4. **QuickCaptureForm** (9 props → 0) — uses `useTasksActions()` for creation
5. **ClarificationGate** (9 props → 0) — uses `useTasksActions()` for creation state
6. **PlanningSignal** (6 props → 0) — uses `useTasksQueries()`
7. **FocusRecommendation** (3 props → 0) — uses `useTasksQueries()` + `useTasksActions()`
8. **SidebarCards** (3 components, 2-3 props each → 0) — use `useTasksQueries()`

### Page After Migration

```tsx
// ~25 lines total
export default function TasksDashboard() {
  return (
    <TasksProvider>
      <div className="max-w-6xl space-y-8 animate-fade-in">
        <section className="grid gap-6 lg:grid-cols-[1.55fr_0.95fr]">
          <OperationalHeader />
          <QuickCaptureForm />
        </section>
        <section className="grid gap-6 lg:grid-cols-[1.25fr_1fr]">
          <PlanningSignal />
          <FocusRecommendation />
        </section>
        <section className="grid gap-6 lg:grid-cols-[1.5fr_0.9fr]">
          <ExecutionQueue />
          <div className="space-y-6">
            <NextBestAction />
            <DetailPanel />
            <RecoveryBoard />
            <WeeklyRhythm />
          </div>
        </section>
        <ClarificationGate />
      </div>
    </TasksProvider>
  );
}
```

### Testing

- Each migrated component renders correctly within `<TasksProvider>`
- Existing behavior unchanged (manual verification)

---

## Phase 3: Context Type Definitions (1-2 hours)

**Goal**: Extract shared type contracts that any domain module can follow.

### New Files

| File | Description |
|------|-------------|
| `lib/module-types.ts` | Shared interfaces for module patterns |

### Type Definitions

```tsx
// Generic module context pattern
export interface ModuleQueriesContext<TData> {
  readonly data: TData;
  readonly isLoading: boolean;
}

// Generic module actions pattern
export interface ModuleActionsContext<TActions> {
  readonly actions: TActions;
}
```

### Extend DomainKey

Update `lib/navigation.ts`:
```tsx
export type DomainKey = "tasks" | "wallet" | "health";
```

Re-enable wallet/health in the `domains` array (currently commented out / only tasks is listed).

---

## Phase 4: History Page Context (1-2 hours)

**Goal**: Apply the same context pattern to the history page, proving the convention works for sub-pages within a module.

### New Files

| File | Description |
|------|-------------|
| `features/tasks/presentation/history-context.tsx` | `HistoryProvider` with queries/actions split |
| `features/tasks/presentation/use-history-context.ts` | `useHistoryQueries()`, `useHistoryActions()` |

### Modified Files

| File | Change |
|------|--------|
| `app/(domain)/tasks/history/page.tsx` | Wrap with `<HistoryProvider>`, thin page |
| All `history-*.tsx` components | Consume context instead of props |

---

## Phase 5: Module Scaffold Documentation + Verification (1-2 hours)

**Goal**: Ensure the pattern is clear and the build passes.

### Actions

1. Create `features/README.md` with the module convention scaffold
2. Run full build (`next build`)
3. Run all tests (`vitest run`)
4. Verify no regressions in browser

### Module Scaffold Template

```
To add a new domain module (e.g., "wallet"):

1. Create `features/wallet/presentation/`
2. Add selectors: `wallet-selectors.ts` (pure functions)
3. Add queries hook: `use-wallet-queries.ts`
4. Add mutations hook: `use-wallet-mutations.ts`
5. Add model hook: `use-wallet-model.ts` (composes above)
6. Add context: `wallet-context.tsx` + `use-wallet-context.ts`
7. Add components under `components/` (consume context, zero props from page)
8. Add page: `app/(domain)/wallet/page.tsx` wraps with provider
9. Register domain in `lib/navigation.ts`
```

---

## Implementation Order

| Phase | Effort | Impact | Risk | Files Changed | Files Created |
|-------|--------|--------|------|---------------|---------------|
| 1: Tasks context layer | 2-3h | **High** | Low | 2 | 2 |
| 2: Migrate components | 2-3h | **High** | Medium | 10 | 0 |
| 3: Type definitions | 1-2h | Medium | None | 1 | 1 |
| 4: History context | 1-2h | Medium | Low | 6 | 2 |
| 5: Scaffold + verify | 1-2h | Medium | None | 0 | 1 |

---

## Key Principles

1. **Two contexts per module** — reads (changes often) vs actions (stable references)
2. **Components own their data** — consume context, no prop drilling from page
3. **Page files are layout-only** — Provider + grid structure, under 30 lines
4. **Selectors remain pure** — No React dependency, tested independently
5. **Hooks compose, not inherit** — Each hook is independent, provider does flat composition
6. **Convention over configuration** — Same file names, same structure, every module
