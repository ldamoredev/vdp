# Module Scaffold Convention

Every domain module follows this structure. Use the `tasks` module as the canonical reference.

## Directory Structure

```
features/{domain}/
└── presentation/
    ├── components/              # UI components (consume context, zero props from page)
    │   ├── detail/              # Sub-components for detail views (optional)
    │   └── ...
    ├── __tests__/               # Selector + hook tests
    ├── {domain}-selectors.ts    # Pure functions: filtering, sorting, formatting
    ├── use-{domain}-queries.ts  # React Query hooks + derived state
    ├── use-{domain}-mutations.ts # Mutation hooks + busy state
    ├── use-{domain}-detail.ts   # Selected item detail state (optional)
    ├── use-{domain}-creation.ts # Creation form state (optional)
    ├── use-{domain}-model.ts    # Thin orchestrator composing sub-hooks
    ├── {domain}-context.tsx     # Context definitions + Provider component
    └── use-{domain}-context.ts  # Consumer hooks: use{Domain}Data() + use{Domain}Actions()
```

## Step-by-Step Guide

### 1. Register the domain

Add to `lib/navigation.ts`:
```typescript
export type DomainKey = "tasks" | "wallet" | "health" | "{domain}";
```

And add a `DomainConfig` entry to the `domains` array.

### 2. Create selectors (pure functions)

```typescript
// features/{domain}/presentation/{domain}-selectors.ts
// NO React imports. Pure functions only. This is the primary testing surface.
export function sortItems(items: Item[]) { ... }
export function filterItems(items: Item[], filter: Filter) { ... }
```

### 3. Create hooks

```typescript
// use-{domain}-queries.ts — React Query + derived state
// use-{domain}-mutations.ts — useMutation wrappers
// use-{domain}-model.ts — thin orchestrator that composes the above
```

### 4. Create contexts (split reads vs writes)

Two contexts per module to prevent re-render storms:
- **QueriesContext** — data that changes frequently (tasks, stats, form state)
- **ActionsContext** — stable function references (mutations, setters)

```typescript
// {domain}-context.tsx
export function {Domain}Provider({ children }) {
  const queries = use{Domain}Queries();
  const mutations = use{Domain}Mutations();

  const actionsValue = useMemo(() => ({
    // All setter functions and mutation triggers
  }), []);  // Stable — React guarantees setState identity

  return (
    <ActionsContext value={actionsValue}>
      <QueriesContext value={queriesValue}>
        {children}
      </QueriesContext>
    </ActionsContext>
  );
}
```

```typescript
// use-{domain}-context.ts
export function use{Domain}Data() { ... }    // reads
export function use{Domain}Actions() { ... } // writes
```

### 5. Create components

Components consume context directly — no props from the page:

```typescript
export function MyComponent() {
  const { items, filter } = use{Domain}Data();
  const { setFilter, deleteItem } = use{Domain}Actions();
  // ...render
}
```

### 6. Create the page

Pages are layout-only — Provider + grid structure, under 30 lines:

```typescript
// app/(domain)/{domain}/page.tsx
export default function {Domain}Dashboard() {
  return (
    <{Domain}Provider>
      <div className="max-w-6xl space-y-8 animate-fade-in">
        <ComponentA />
        <ComponentB />
      </div>
    </{Domain}Provider>
  );
}
```

## Key Principles

1. **Two contexts per module** — reads (changes often) vs actions (stable references)
2. **Components own their data** — consume context, no prop drilling from page
3. **Page files are layout-only** — Provider + grid, under 30 lines
4. **Selectors remain pure** — No React dependency, tested independently
5. **Hooks compose, not inherit** — Each hook is independent, provider does flat composition
6. **Convention over configuration** — Same file names, same structure, every module

## Reference Implementation

See `features/tasks/presentation/` for the complete example:
- `tasks-context.tsx` + `use-tasks-context.ts` (main dashboard)
- `history-context.tsx` + `use-history-context.ts` (sub-page)
