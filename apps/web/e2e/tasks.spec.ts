import { expect, test, type Page } from '@playwright/test';
import { loginAsFreshUser } from './helpers/auth';

// The dashboard renders a task title in several places (queue row, focus
// recommendation, next-best-action) plus a hidden mobile row, so `getByText`
// matches multiple nodes. Filter-count badges are single, visible, and
// deterministic, so we assert queue membership through them and use `.first()`
// only when checking a title is rendered at all.

async function createTask(page: Page, title: string) {
  await page.getByPlaceholder('Agregar una tarea concreta para hoy...').fill(title);
  await page.getByRole('button', { name: 'Agregar a hoy' }).click();

  // Vague titles trigger a clarification gate; specific ones don't. Handle both.
  const createAnyway = page.getByRole('button', { name: 'Crear igual' });
  if (await createAnyway.isVisible().catch(() => false)) {
    await createAnyway.click();
  }

  await expect(page.getByText(title).first()).toBeVisible();
}

test('fresh user sees the empty focus state', async ({ page }) => {
  await loginAsFreshUser(page);
  await page.goto('/tasks');

  await expect(page.getByText('Sin tareas urgentes')).toBeVisible();
});

test('carry over moves a task out of today', async ({ page }) => {
  const title = `Playwright carryover ${Date.now()}`;

  await loginAsFreshUser(page);
  await page.goto('/tasks');
  await createTask(page, title);

  await page.getByTitle('Llevar a manana').click();

  // Carry-over reschedules to tomorrow, so it leaves today's queue entirely.
  await expect(page.getByRole('button', { name: /Pendientes · 0/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /Todas · 0/ })).toBeVisible();
});

test('discard removes a task from focus and surfaces it in history', async ({ page }) => {
  const title = `Playwright discard ${Date.now()}`;

  await loginAsFreshUser(page);
  await page.goto('/tasks');
  await createTask(page, title);

  await page.getByTitle('Descartar').click();

  // Gone from the pending/focus queues, but still one of today's tasks.
  await expect(page.getByRole('button', { name: /Pendientes · 0/ })).toBeVisible();
  await page.getByRole('button', { name: /Todas · 1/ }).click();
  await expect(page.getByText(title).first()).toBeVisible();

  // In-app navigation keeps the React Query cache warm, so history surfaces it
  // under the closure state without a cold refetch race.
  await page.getByRole('navigation').getByRole('link', { name: 'Historial' }).click();
  await expect(page.getByRole('heading', { name: 'Estado del cierre' })).toBeVisible();
  await expect(page.getByText(title).first()).toBeVisible();
});

test('add a context note from the detail panel', async ({ page }) => {
  const title = `Playwright detail ${Date.now()}`;
  const note = `Contexto Playwright ${Date.now()}`;

  await loginAsFreshUser(page);
  await page.goto('/tasks');
  await createTask(page, title);

  await page.getByTitle('Ver detalle').click();
  await expect(page.getByRole('heading', { name: 'Panel de detalle' })).toBeVisible();

  await page.getByPlaceholder('Ej: contexto para retomarla rapido').fill(note);
  await page.getByRole('button', { name: 'Guardar nota' }).click();

  // The note content is unique text rendered once in the notes list.
  await expect(page.getByText(note)).toBeVisible();
});

test('completed task appears in the history closure summary', async ({ page }) => {
  const title = `Playwright done ${Date.now()}`;

  await loginAsFreshUser(page);
  await page.goto('/tasks');
  await createTask(page, title);

  await page.getByRole('button', { name: `Marcar "${title}" como hecha` }).click();

  // In-app navigation reuses the warm task cache so the closure summary lists it.
  await page.getByRole('navigation').getByRole('link', { name: 'Historial' }).click();
  await expect(page.getByRole('heading', { name: 'Completadas' })).toBeVisible();
  await expect(page.getByText(title).first()).toBeVisible();
});
