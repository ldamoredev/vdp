# Architecture Docs

Updated: 2026-03-27

This folder is the authoritative architecture reference for the current codebase.

If older documents in `docs/` conflict with anything here, trust:

1. the current codebase
2. `PLAN.md`
3. this `docs/architecture/` folder

## Current Canonical Docs

- [Frontend](./frontend.md)
- [Backend](./backend.md)

## Current Project Reality

- `Tasks` is the reference module.
- `Wallet` is the second active module and now follows the same frontend and backend conventions closely enough to be treated as the second template.
- `Health`, `People`, `Work`, and `Study` are not authoritative architecture references.

## Architectural Priorities

1. keep module boundaries explicit
2. keep shared primitives small and justified
3. prefer current code over outdated diagrams
4. avoid adding abstractions before two modules really need them

## Reading Order

Read the docs in this order:

1. [Frontend](./frontend.md)
2. [Backend](./backend.md)

## Notes About Older Docs

The top-level `docs/` files are still useful as historical context, but several are partially stale. They should not be used as the primary source for current architecture decisions until they are revised or marked as superseded.
