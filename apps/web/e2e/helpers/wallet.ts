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
      icon: 'test',
    },
  });
  expect(categoryRes.ok()).toBeTruthy();
}
