import { test, expect } from '@playwright/test';

test('home page loads', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveURL(/\/(login|dashboard|$)/);
});

test('login page has sign in form', async ({ page }) => {
  await page.goto('/login');
  await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
});
