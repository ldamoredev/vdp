import { expect, test } from '@playwright/test';
import { loginAsExistingUser, loginAsFreshUser } from './helpers/auth';
import { ensureWalletSetup } from './helpers/wallet';

test('home shell renders after self-bootstrapping auth', async ({ page }) => {
  await loginAsFreshUser(page);

  await expect(page.getByText('Tareas de hoy')).toBeVisible();
  await expect(page.getByText('Resumen Wallet')).toBeVisible();
});

test('task lifecycle works from quick capture to completion', async ({ page }) => {
  const seed = `task-${Date.now()}`;
  const title = `Playwright task ${seed}`;

  await loginAsFreshUser(page);
  await page.goto('/tasks');

  await page.getByPlaceholder('Agregar una tarea concreta para hoy...').fill(title);
  await page.getByRole('button', { name: 'Agregar a hoy' }).click();

  const createAnywayButton = page.getByRole('button', { name: 'Crear igual' });
  if (await createAnywayButton.isVisible().catch(() => false)) {
    await createAnywayButton.click();
  }

  await expect(page.getByText(title)).toBeVisible();
  await page
    .getByRole('button', { name: `Marcar "${title}" como hecha` })
    .click();
  await page.getByRole('button', { name: /Hechas/ }).click();
  await expect(
    page.getByRole('button', { name: `"${title}" ya esta hecha` }).first(),
  ).toBeVisible();
});

test('wallet quick-add records a new expense', async ({ page }) => {
  const seed = `wallet-${Date.now()}`;
  const description = `Playwright expense ${seed}`;

  await loginAsFreshUser(page);
  await ensureWalletSetup(page);
  await page.goto('/wallet');

  await page.getByRole('button', { name: /Gasto r[aá]pido/i }).click();
  await page.getByPlaceholder('0.00').fill('1250');
  await page
    .getByRole('button', { name: /hogar|comida|general|playwright/i })
    .first()
    .click();
  await page.getByPlaceholder('Ej: Almuerzo con amigos').fill(description);
  await page.getByRole('button', { name: 'Guardar gasto' }).click();

  await expect(page.getByText(description)).toBeVisible();
});

test('review note persists when navigating away and back', async ({ page }) => {
  const note = `Playwright review note ${Date.now()}`;

  const user = await loginAsFreshUser(page);
  await page.goto('/review');

  await expect(page.getByRole('heading', { name: 'Cerrar tareas' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Verificar wallet' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Resolver alertas' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Decidir mañana' })).toBeVisible();

  await page.getByLabel('Nota de arranque').fill(note);
  await page.getByRole('link', { name: 'W Wallet' }).click();
  await expect(page.getByRole('heading', { name: 'Wallet' })).toBeVisible();
  await page.goto('/review');
  const loginHeading = page.getByRole('heading', { name: 'Crea tu cuenta' });
  if (
    page.url().includes('/login') ||
    (await loginHeading.isVisible().catch(() => false))
  ) {
    await loginAsExistingUser(page, user, /\/review$/);
  }

  await expect(page).toHaveURL(/\/review$/);
  await expect(
    page.getByRole('heading', { name: 'Decidir mañana' }),
  ).toBeVisible({ timeout: 15_000 });
  await expect(page.getByLabel('Nota de arranque')).toHaveValue(note, {
    timeout: 15_000,
  });
});
