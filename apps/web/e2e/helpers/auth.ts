import { expect, type Page } from '@playwright/test';

type BrowserUserCredentials = {
  email: string;
  password: string;
};

export async function loginAsFreshUser(page: Page) {
  const seed = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const email = `playwright.${seed}@example.com`;
  const displayName = `Playwright ${seed}`;
  const password = 'playwright-pass-123';

  await page.goto('/login');
  await expect(page.getByLabel('Email')).toBeVisible();
  await page.getByRole('button', { name: 'Crear cuenta' }).click();
  const displayNameField = page.getByLabel('Nombre visible');
  await expect(displayNameField).toBeVisible();
  await displayNameField.fill(displayName);
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Contrasena').fill(password);
  const registerResponsePromise = page.waitForResponse(
    (response) =>
      response.url().includes('/api/auth/register') &&
      response.request().method() === 'POST',
  );
  await page.getByRole('button', { name: 'Crea tu cuenta' }).click();
  const registerResponse = await registerResponsePromise;
  if (!registerResponse.ok()) {
    throw new Error(
      `Registration failed with ${registerResponse.status()}: ${await registerResponse.text()}`,
    );
  }

  await expect(page).toHaveURL(/\/home$/, { timeout: 15_000 });
  await expect(
    page.getByRole('heading', { name: 'Centro de comando' }),
  ).toBeVisible({ timeout: 10_000 });
  await expect
    .poll(async () => {
      const response = await page.request.get('/api/auth/me');
      return response.status();
    })
    .toBe(200);

  return { email, displayName, password };
}

export async function loginAsExistingUser(
  page: Page,
  credentials: BrowserUserCredentials,
  expectedPath: RegExp = /\/home$/,
) {
  await expect(page.getByLabel('Email')).toBeVisible();
  await page.getByRole('button', { name: 'Iniciar sesion' }).click();
  await page.getByLabel('Email').fill(credentials.email);
  await page.getByLabel('Contrasena').fill(credentials.password);

  const loginResponsePromise = page.waitForResponse(
    (response) =>
      response.url().includes('/api/auth/login') &&
      response.request().method() === 'POST',
  );
  await page.getByRole('button', { name: 'Bienvenido de nuevo' }).click();
  const loginResponse = await loginResponsePromise;
  if (!loginResponse.ok()) {
    throw new Error(
      `Login failed with ${loginResponse.status()}: ${await loginResponse.text()}`,
    );
  }

  await expect(page).toHaveURL(expectedPath, { timeout: 15_000 });
  await expect
    .poll(async () => {
      const response = await page.request.get('/api/auth/me');
      return response.status();
    })
    .toBe(200);
}
