# Stream C Local-First E2E Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add local browser confidence for the core VDP daily loop by opening registration, wiring Playwright into the web app, and covering the home, tasks, wallet, and review flows with self-bootstrapping tests.

**Architecture:** Keep the backend change surgical by removing the hard-coded first-user registration gate and updating auth e2e coverage to lock in the new policy. Put Playwright entirely in `apps/web`, with small helpers that bootstrap a fresh browser user and seed wallet prerequisites through the same authenticated `/api/proxy/v1` routes the app already uses. Prefer semantic selectors and add only the narrow accessibility hook needed for task completion stability.

**Tech Stack:** Fastify 5, TypeScript, Vitest 3, Next.js 15 App Router, Playwright, pnpm workspace scripts

---

## File Structure

### New files
- `apps/web/playwright.config.ts` — local Playwright config for the Next app
- `apps/web/e2e/helpers/auth.ts` — register-and-enter helper for a fresh browser user
- `apps/web/e2e/helpers/wallet.ts` — authenticated wallet bootstrap helper for account/category prerequisites
- `apps/web/e2e/daily-loop.spec.ts` — critical-path browser tests for home, tasks, wallet, and review

### Modified files
- `server/src/modules/auth/services/RegisterUser.ts` — remove the first-user-only registration gate
- `server/src/modules/auth/__tests__/e2e/AuthAPI.e2e.test.ts` — prove registration stays open after the first user
- `apps/web/package.json` — add Playwright script and dev dependency
- `apps/web/src/features/tasks/presentation/components/task-row.tsx` — add stable accessible labels for completion controls
- `package.json` — expand the root `test:e2e` command to run server e2e and web Playwright
- `pnpm-lock.yaml` — dependency lockfile update for `@playwright/test`

---

### Task 1: Open registration for repeat local users

**Files:**
- Modify: `server/src/modules/auth/__tests__/e2e/AuthAPI.e2e.test.ts`
- Modify: `server/src/modules/auth/services/RegisterUser.ts`

- [ ] **Step 1: Write the failing auth e2e expectation**

Replace the closed-registration test with an open-registration test:

```ts
it('allows registration when users already exist', async () => {
  const first = await registerUser();
  expect(first.status).toBe(200);

  const second = await registerUser({
    email: 'second@vdp.local',
    displayName: 'Second User',
  });

  expect(second.status).toBe(200);
  expect(second.body).toMatchObject({
    user: {
      email: 'second@vdp.local',
      displayName: 'Second User',
      role: 'user',
    },
  });
  expect(second.body.sessionToken).toBeTypeOf('string');
});
```

- [ ] **Step 2: Run the focused auth e2e test and verify RED**

Run:

```bash
pnpm --filter @vdp/server test:e2e -- src/modules/auth/__tests__/e2e/AuthAPI.e2e.test.ts
```

Expected: FAIL on the new test with a `403` / `Registration is closed` assertion mismatch.

- [ ] **Step 3: Remove the user-count gate from the registration service**

Update `RegisterUser.ts` so duplicate email remains the only registration blocker:

```ts
import { ConflictHttpError } from '../../common/http/errors';

export class RegisterUser {
  async execute(input: {
    email: string;
    displayName: string;
    password: string;
  }): Promise<{ sessionToken: string; user: AuthenticatedUser }> {
    const existing = await this.users.findByEmail(input.email.toLowerCase());
    if (existing) {
      throw new ConflictHttpError('Email already registered');
    }

    const now = new Date();
    const role = 'user';
    const user = await this.users.createUser({
      email: input.email.toLowerCase(),
      displayName: input.displayName,
      passwordHash: await this.passwordService.hash(input.password),
      role,
    });

    await this.users.updateLastLoginAt(user.id, now);
    const session = await this.sessionService.create(user.id, null, null);
    // audit log stays unchanged
    return { sessionToken: session.token, user: this.toAuthenticatedUser(user) };
  }
}
```

- [ ] **Step 4: Re-run the auth e2e suite and verify GREEN**

Run:

```bash
pnpm --filter @vdp/server test:e2e -- src/modules/auth/__tests__/e2e/AuthAPI.e2e.test.ts
```

Expected: PASS for the auth suite, including the new second-user registration case.

- [ ] **Step 5: Commit the auth policy change**

```bash
git add server/src/modules/auth/services/RegisterUser.ts server/src/modules/auth/__tests__/e2e/AuthAPI.e2e.test.ts
git commit -m "feat: keep registration open for local browser flows"
```

---

### Task 2: Add Playwright scaffolding and the home-shell login flow

**Files:**
- Create: `apps/web/playwright.config.ts`
- Create: `apps/web/e2e/helpers/auth.ts`
- Create: `apps/web/e2e/daily-loop.spec.ts`
- Modify: `apps/web/package.json`
- Modify: `package.json`
- Modify: `pnpm-lock.yaml`

- [ ] **Step 1: Write the first failing browser spec for the home shell**

Create `apps/web/e2e/daily-loop.spec.ts` with the first test only:

```ts
import { expect, test } from '@playwright/test';
import { loginAsFreshUser } from './helpers/auth';

test('home shell renders after self-bootstrapping auth', async ({ page }) => {
  await loginAsFreshUser(page);

  await expect(page).toHaveURL(/\/home$/);
  await expect(
    page.getByRole('heading', { name: 'Centro de comando' }),
  ).toBeVisible();
  await expect(page.getByText('Tareas de hoy')).toBeVisible();
  await expect(page.getByText('Resumen Wallet')).toBeVisible();
});
```

- [ ] **Step 2: Add Playwright package, scripts, and config so the spec can run**

Run:

```bash
pnpm --filter @vdp/web add -D @playwright/test
pnpm --filter @vdp/web exec playwright install chromium
```

Update workspace scripts:

```json
// apps/web/package.json
{
  "scripts": {
    "test:e2e": "playwright test"
  }
}
```

```json
// package.json
{
  "scripts": {
    "test:e2e": "pnpm --filter @vdp/server test:e2e && pnpm --filter @vdp/web test:e2e"
  }
}
```

Create `apps/web/playwright.config.ts`:

```ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  retries: 0,
  use: {
    baseURL: 'http://127.0.0.1:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  webServer: {
    command: 'pnpm dev',
    port: 3000,
    reuseExistingServer: true,
    timeout: 120_000,
  },
  projects: [
    {
      name: 'chromium',
      use: { browserName: 'chromium' },
    },
  ],
});
```

- [ ] **Step 3: Run the new browser spec and verify RED**

Run:

```bash
pnpm --filter @vdp/web test:e2e --grep "home shell renders after self-bootstrapping auth"
```

Expected: FAIL because `loginAsFreshUser` does not exist yet.

- [ ] **Step 4: Implement the fresh-user auth helper**

Create `apps/web/e2e/helpers/auth.ts`:

```ts
import { expect, type Page } from '@playwright/test';

export async function loginAsFreshUser(page: Page) {
  const seed = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const email = `playwright.${seed}@example.com`;
  const displayName = `Playwright ${seed}`;
  const password = 'playwright-pass-123';

  await page.goto('/login');
  await expect(page.getByRole('button', { name: 'Crear cuenta' })).toBeVisible();
  await page.getByRole('button', { name: 'Crear cuenta' }).click();

  await page.getByLabel(/nombre/i).fill(displayName);
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/contrasena/i).fill(password);
  await page.getByRole('button', { name: /crear cuenta/i }).click();

  await expect(page).toHaveURL(/\/home$/);
  await expect(page.getByRole('heading', { name: 'Centro de comando' })).toBeVisible();

  return { email, displayName, password };
}
```

If the rendered form does not expose stable labels for one of those fields, use the exact visible placeholder or a single narrow `data-testid` on the missing field instead of broad test ids.

- [ ] **Step 5: Re-run the home-shell spec and verify GREEN**

Run:

```bash
pnpm --filter @vdp/web test:e2e --grep "home shell renders after self-bootstrapping auth"
```

Expected: PASS in Chromium with the Next app starting locally and redirecting into `/home`.

- [ ] **Step 6: Commit the Playwright scaffold**

```bash
git add apps/web/package.json apps/web/playwright.config.ts apps/web/e2e/helpers/auth.ts apps/web/e2e/daily-loop.spec.ts package.json pnpm-lock.yaml
git commit -m "test: add playwright local browser scaffold"
```

---

### Task 3: Cover the tasks create-and-complete loop with stable selectors

**Files:**
- Modify: `apps/web/e2e/daily-loop.spec.ts`
- Modify: `apps/web/src/features/tasks/presentation/components/task-row.tsx`

- [ ] **Step 1: Add the failing task lifecycle browser test**

Append this test to `apps/web/e2e/daily-loop.spec.ts`:

```ts
test('task lifecycle works from quick capture to completion', async ({ page }) => {
  const seed = `task-${Date.now()}`;
  const title = `Playwright task ${seed}`;

  await loginAsFreshUser(page);
  await page.goto('/tasks');

  await page.getByPlaceholder('Agregar una tarea concreta para hoy...').fill(title);
  await page.getByRole('button', { name: 'Agregar a hoy' }).click();

  await expect(page.getByText(title)).toBeVisible();
  await page.getByRole('button', { name: `Marcar "${title}" como hecha` }).click();
  await expect(page.getByText(title)).toHaveClass(/line-through/);
});
```

- [ ] **Step 2: Run the focused task spec and verify RED**

Run:

```bash
pnpm --filter @vdp/web test:e2e --grep "task lifecycle works from quick capture to completion"
```

Expected: FAIL because the completion checkbox does not yet expose a stable accessible name.

- [ ] **Step 3: Add accessible labels to task completion controls**

Update both the desktop and mobile completion buttons in `task-row.tsx`:

```tsx
<button
  type="button"
  onClick={() => task.status !== "done" && onComplete(task.id)}
  disabled={task.status === "done" || busy}
  aria-label={
    task.status === "done"
      ? `"${task.title}" ya esta hecha`
      : `Marcar "${task.title}" como hecha`
  }
  className={`task-checkbox shrink-0 ${task.status === "done" ? "checked" : ""}`}
>
```

Keep the markup otherwise unchanged so this stays a stability and accessibility improvement, not a UI rewrite.

- [ ] **Step 4: Re-run the focused task spec and verify GREEN**

Run:

```bash
pnpm --filter @vdp/web test:e2e --grep "task lifecycle works from quick capture to completion"
```

Expected: PASS, with the new task visible and then completed through the labeled checkbox.

- [ ] **Step 5: Commit the tasks browser coverage**

```bash
git add apps/web/e2e/daily-loop.spec.ts apps/web/src/features/tasks/presentation/components/task-row.tsx
git commit -m "test: cover the tasks daily loop in playwright"
```

---

### Task 4: Bootstrap wallet prerequisites and cover quick-add expense

**Files:**
- Create: `apps/web/e2e/helpers/wallet.ts`
- Modify: `apps/web/e2e/daily-loop.spec.ts`

- [ ] **Step 1: Add the failing wallet quick-add browser test**

Append this test:

```ts
import { ensureWalletSetup } from './helpers/wallet';

test('wallet quick-add records a new expense', async ({ page }) => {
  const seed = `wallet-${Date.now()}`;
  const description = `Playwright expense ${seed}`;

  await loginAsFreshUser(page);
  await ensureWalletSetup(page);
  await page.goto('/wallet');

  await page.getByRole('button', { name: 'Gasto rapido' }).click();
  await page.getByPlaceholder('0.00').fill('1250');
  await page.getByRole('button', { name: /hogar|comida|general|playwright/i }).first().click();
  await page.getByPlaceholder('Ej: Almuerzo con amigos').fill(description);
  await page.getByRole('button', { name: 'Guardar gasto' }).click();

  await expect(page.getByText(description)).toBeVisible();
});
```

- [ ] **Step 2: Run the focused wallet spec and verify RED**

Run:

```bash
pnpm --filter @vdp/web test:e2e --grep "wallet quick-add records a new expense"
```

Expected: FAIL because `ensureWalletSetup` does not exist and a fresh user has no account/category data yet.

- [ ] **Step 3: Implement the wallet bootstrap helper through authenticated proxy requests**

Create `apps/web/e2e/helpers/wallet.ts`:

```ts
import { expect, type Page } from '@playwright/test';

export async function ensureWalletSetup(page: Page) {
  const accountRes = await page.request.post('/api/proxy/v1/wallet/accounts', {
    data: {
      name: 'Playwright Cash',
      currency: 'ARS',
      type: 'cash',
      initialBalance: '5000',
    },
  });
  expect(accountRes.ok()).toBeTruthy();

  const categoryRes = await page.request.post('/api/proxy/v1/wallet/categories', {
    data: {
      name: 'Playwright General',
      type: 'expense',
      icon: '🧪',
    },
  });
  expect(categoryRes.ok()).toBeTruthy();
}
```

Keep this helper intentionally small and idempotent at the test-data level by using a fresh user per test, not by over-engineering dedupe logic.

- [ ] **Step 4: Re-run the focused wallet spec and verify GREEN**

Run:

```bash
pnpm --filter @vdp/web test:e2e --grep "wallet quick-add records a new expense"
```

Expected: PASS, with the quick-add sheet submitting successfully and the new description appearing in recent transactions.

- [ ] **Step 5: Commit the wallet browser coverage**

```bash
git add apps/web/e2e/helpers/wallet.ts apps/web/e2e/daily-loop.spec.ts
git commit -m "test: cover wallet quick add in playwright"
```

---

### Task 5: Cover review persistence through navigation

**Files:**
- Modify: `apps/web/e2e/daily-loop.spec.ts`

- [ ] **Step 1: Add the failing review persistence test**

Append this test:

```ts
test('review note persists when navigating away and back', async ({ page }) => {
  const note = `Playwright review note ${Date.now()}`;

  await loginAsFreshUser(page);
  await page.goto('/review');

  await expect(page.getByRole('heading', { name: 'Cerrar tareas' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Verificar wallet' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Resolver alertas' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Decidir mañana' })).toBeVisible();

  await page.getByLabel('Nota de arranque').fill(note);
  await page.goto('/home');
  await page.goto('/review');

  await expect(page.getByLabel('Nota de arranque')).toHaveValue(note);
});
```

- [ ] **Step 2: Run the focused review spec and verify RED**

Run:

```bash
pnpm --filter @vdp/web test:e2e --grep "review note persists when navigating away and back"
```

Expected: FAIL if the current review UI does not expose one of the expected headings or if the note field cannot be reached semantically yet.

- [ ] **Step 3: Make the smallest selector/accessibility adjustment needed, if any**

If the test fails on selector reachability rather than persistence logic, make the narrowest possible fix in the existing markup. Preferred order:

```txt
1. Use an existing heading or nested label correctly
2. Add an explicit accessible name to the exact field/section that is missing one
3. Add one `data-testid` only if semantic reachability is still impossible
```

Do not broaden this into a markup refactor unless the failing selector genuinely exposes an accessibility gap.

- [ ] **Step 4: Re-run the focused review spec and verify GREEN**

Run:

```bash
pnpm --filter @vdp/web test:e2e --grep "review note persists when navigating away and back"
```

Expected: PASS, proving the note survives navigation through the localStorage-backed review model.

- [ ] **Step 5: Commit the review browser coverage**

```bash
git add apps/web/e2e/daily-loop.spec.ts
git commit -m "test: cover review persistence in playwright"
```

---

### Task 6: Final verification for the local-first Stream C slice

**Files:**
- No new files

- [ ] **Step 1: Run the focused backend auth suite**

```bash
pnpm --filter @vdp/server test:e2e -- src/modules/auth/__tests__/e2e/AuthAPI.e2e.test.ts
```

Expected: PASS.

- [ ] **Step 2: Run the full web Playwright suite**

```bash
pnpm --filter @vdp/web test:e2e
```

Expected: PASS for the four critical-path browser tests in Chromium.

- [ ] **Step 3: Run the root Stream C command**

```bash
pnpm test:e2e
```

Expected: PASS for the existing server e2e suite and then the web Playwright suite.

- [ ] **Step 4: Summarize the shipped local-first Stream C slice and note that CI wiring is the next phase**

Use this summary shape:

```txt
- Registration is open for repeat local runs
- Browser tests now self-bootstrap fresh users
- Wallet quick-add coverage seeds its own prerequisites
- Root test:e2e now exercises backend and browser confidence locally
- CI integration is intentionally still pending
```
