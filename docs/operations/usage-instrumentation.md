# Owner-Usage Instrumentation (F1.2)

`core.usage_events` counts the owner's product usage: one row per
(owner, surface, action, day), incremented on repeat. Recording happens in
`UsageTrackingMiddleware` (registered in `App.ts`) from successful authenticated
API responses; the (surface, action) key is derived from the matched route
pattern by `usage-mapping.ts`, so cardinality stays bounded and no handler needs
touching. Writes are fire-and-forget — a storage failure never breaks a request.

By design there is no UI, no dashboard, and no client-side tracking. Reading is
plain SQL against prod (e.g. via the Supabase MCP `execute_sql` or psql):

```sql
-- Daily visits/actions per domain (the F1.2 "done" query)
SELECT occurred_on, surface, SUM(count) AS hits
FROM core.usage_events
GROUP BY occurred_on, surface
ORDER BY occurred_on DESC, hits DESC;

-- Which specific actions dominate a domain
SELECT action, SUM(count) AS hits, COUNT(DISTINCT occurred_on) AS days_used
FROM core.usage_events
WHERE surface = 'tasks'
GROUP BY action
ORDER BY hits DESC;

-- Days-active per surface in the last N weeks (the Phase-2 decision input)
SELECT surface, COUNT(DISTINCT occurred_on) AS active_days
FROM core.usage_events
WHERE occurred_on >= CURRENT_DATE - 14
GROUP BY surface
ORDER BY active_days DESC;
```

Caveats when reading:

- `occurred_on` uses the **server's** local date (Railway runs UTC), so late-night
  ART usage lands on the "next" day. Fine for trends; don't over-read day edges.
- Reads and writes both count (`GET` vs mutating methods are distinguishable by
  the action prefix). A `WHERE action NOT LIKE 'GET %'` filter isolates writes.
- Auth plumbing (`/api/auth/*`), the health check, preflights, and unmatched
  routes are excluded at the mapper level.
