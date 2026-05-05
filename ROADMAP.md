# VDP Roadmap

Forward-looking only. For setup and commands see [`README.md`](./README.md). For architecture and conventions see [`CLAUDE.md`](./CLAUDE.md).

## Active vs Inactive

| Domain | Backend | Frontend | Agent | Status |
|--------|---------|----------|-------|--------|
| Tasks | ✅ | ✅ | ✅ | Stable — reference module |
| Wallet | ✅ | ✅ | ✅ | Active — newer than Tasks, lighter frontend coverage |
| Health | — | Demo page | — | Inactive |
| People | — | Demo page | — | Inactive |
| Work | — | Demo page | — | Inactive |
| Study | — | Demo page | — | Inactive |

## What's Next

Auth V1 (multi-user, sessions, profile/security center, audit logs) is done. The platform is multi-user-safe. Two natural next paths:

1. **Harden** — failed-login rate limiting, production session-flow validation, observability for auth events
2. **Expand** — pick the third domain (Health is the most coherent candidate; backend partially scaffolded already)

The default sequencing is: harden first, expand second. New domain work should not start until the auth flow has been validated under real production conditions.

## Gating: Before Adding a New Domain

A domain is only "real" when it matches the Tasks template:

1. Module registered in `DefaultCoreConfiguration`
2. Drizzle schema + migration applied
3. Domain entity (`fromSnapshot` / `toSnapshot`)
4. Repository interface + Drizzle impl + Fake repo
5. Use-case services (one class per operation)
6. HTTP controller using `authContextStorage` for `userId`
7. Cross-user isolation tests
8. Frontend feature module following the two-context pattern
9. Shared zod schemas in `@vdp/shared` for cross-package types
10. Pages registered in `apps/web/src/lib/navigation.ts`

Use `/new-server-module <domain>` and `/new-frontend-module <domain>` to scaffold against this template.

## Cross-Domain Behavior

The first cross-domain signal is live: Wallet emits `wallet.spending.spike` → Tasks creates a high-priority review task and an insight. Implementation in `CrossDomainEventHandlers`.

Future cross-domain signals should follow the same pattern: emit a domain event from the source module, subscribe in the target module via `eventBus`, run actions through services (never direct DB writes), and write tests for both the happy path and error resilience (event bus must never block).

## Production Constraint

Production data can be discarded — the app is not yet used by anyone. Avoid spending effort on backward-compatible migrations until that changes.
