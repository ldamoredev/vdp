# Stream C Local-First E2E Design

**Goal:** Finish the local-confidence portion of Stream C by adding self-bootstrapping Playwright coverage for the web app's critical daily loop, while removing the hard-coded "first user only" registration rule that currently blocks repeat local runs.

**Status:** Approved for implementation on 2026-04-11.

**Related context:**
- [Weekend smart polish confidence spec](/Users/lautarodamore/Documents/vdp/docs/superpowers/specs/2026-04-11-weekend-smart-polish-confidence-design.md)
- Stream C will be delivered in two phases:
  - Phase 1: local Playwright confidence
  - Phase 2: CI integration

---

## Why This Slice Exists

The repository already has strong server-side e2e coverage through Vitest, but Stream C is about browser confidence across the real web experience. Right now the root `test:e2e` command only exercises the backend suite, and local browser testing depends on manually prepared data.

For this first Stream C slice, we want a local setup that works repeatedly without hand-seeding users, without depending on a special test-only account, and without failing because the app currently closes registration after the first user exists.

---

## Product Decision

Registration should no longer be blocked after the first user is created.

The existing setup endpoint can continue to report whether users already exist, but that state should only guide UI defaults such as which auth tab is shown first. It must not be used as a hard authorization rule on the backend.

If the product later needs closed registration in production, that should come back as an explicit configuration decision, not as a permanent user-count gate embedded in the registration service.

---

## Scope

### In scope

- Remove the backend rule that rejects registration when more than one user exists
- Update auth backend tests so they reflect open registration
- Add Playwright to `apps/web`
- Add a self-bootstrapping auth helper for browser tests
- Add local critical-path tests for:
  - login/home shell
  - task creation and completion
  - wallet quick-add expense
  - review note persistence
- Extend local test commands so Stream C can be run from the repo root

### Out of scope

- GitHub Actions / CI integration
- Production auth policy hardening
- Global test data cleanup tooling
- Broad visual regression coverage
- Browser matrix expansion beyond Chromium for this first pass

---

## Architecture

### 1. Open registration in the backend

The registration service currently checks `countUsers()` and throws `Registration is closed` once any user exists. That rule will be removed so registration behavior is simple and predictable:

- reject duplicate email addresses
- accept valid new users at any time
- create a session immediately after successful registration

No new configuration flag is needed for this Stream C slice. The goal is to remove the current blocker, not replace it with another branch of environment-specific behavior.

### 2. Self-bootstrapping browser auth

Playwright should not assume a seeded user such as `test@example.com`.

Instead, browser tests will use a helper that:

- generates a deterministic-enough unique email for each run
- opens the login page
- decides whether to log in or register based on the visible auth mode
- lands in an authenticated browser session ready for the test flow

This keeps local runs resilient even when the database already has many users from previous manual or automated sessions.

### 3. Local-only Playwright setup in the web app

Playwright will live inside `apps/web` because the tests exercise the Next.js frontend and its browser flows.

The Playwright config should:

- use `apps/web/e2e` as the test directory
- target Chromium only for now
- point at `http://127.0.0.1:3000`
- assume the backend is already running on port `4000`
- start the web app automatically for test runs when possible
- capture useful artifacts on failure

The backend remains an external prerequisite for this phase. We are optimizing for practical local confidence, not full environment orchestration yet.

---

## Test Design

### Auth helper

Create a shared helper in `apps/web/e2e/helpers/auth.ts` that performs self-bootstrapping login or registration.

Expected behavior:

- generate a unique display name and email for the run
- visit `/login`
- wait for auth UI to finish loading
- fill the currently active form
- if the page is in register mode, create the account
- if the page is in login mode, switch to register mode when the generated account does not exist yet, then register
- wait for redirect to `/home`
- verify the authenticated shell is visible before returning control

This helper should favor resilient page interactions and readable intent over clever abstractions.

### Critical-path coverage

#### Test 1: Home shell

Assert that a self-bootstrapped user can enter the app and see the expected home shell:

- `/home` loads after auth
- `"Centro de comando"` is visible
- the Tasks and Wallet entry areas are visible

#### Test 2: Tasks loop

Assert that a user can create and complete a task from the main tasks page:

- navigate to `/tasks`
- enter a unique task title
- submit the quick capture form
- confirm the task appears
- complete the task
- confirm the completed state is visible

The task title must be unique per run to avoid collisions with older local data.

#### Test 3: Wallet quick-add

Assert that a user can add an expense from the wallet dashboard:

- navigate to `/wallet`
- open the quick-add expense sheet
- enter a unique description and valid amount
- choose the needed category
- submit
- confirm the transaction appears in recent activity

The transaction description must be unique per run.

#### Test 4: Review persistence

Assert that the review decision note persists through navigation using the current localStorage-backed review model:

- navigate to `/review`
- confirm the four review sections render
- enter a unique note in the decision field
- navigate away and back
- confirm the note is still present

This test validates the current user-facing persistence contract without introducing server persistence requirements.

---

## Selectors and Stability Rules

Browser tests should prefer stable accessible selectors first:

- headings
- button text
- form labels
- placeholder text when needed

If one of the critical flows is too brittle to target this way, add a narrowly scoped `data-testid` only to the specific control or region that lacks a stable semantic handle.

Do not add broad test-id coverage across the app for this slice.

---

## Command Surface

The local command surface should clearly separate backend and browser suites:

- `apps/web` gets a `test:e2e` script for Playwright
- the repo root `test:e2e` command should run the existing server e2e suite and then the new web Playwright suite

The important outcome is that Stream C local confidence is discoverable and runnable from the root of the monorepo.

---

## Risks and Mitigations

### Existing local data varies across runs

Mitigation:
- use unique titles, descriptions, and emails
- avoid asserting exact counts when presence checks are enough

### Auth page defaults are state-dependent

Mitigation:
- make the helper explicitly inspect and switch auth modes rather than assuming register is the default

### Some components do not expose stable selectors yet

Mitigation:
- start with semantic selectors
- add narrowly scoped test ids only where the real markup forces us to

### Registration policy could matter later in production

Mitigation:
- document this as a product simplification for now
- if needed later, reintroduce closed registration behind explicit configuration

---

## Success Criteria

This Stream C local-first slice is complete when:

- users can register even when the database already has users
- auth e2e coverage reflects the new registration policy
- Playwright is configured in `apps/web`
- local browser tests cover the four agreed critical flows
- the local command surface makes the browser suite easy to run

CI coverage is intentionally deferred to the next phase.
