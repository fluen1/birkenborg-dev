import { test, expect } from '@playwright/test';

test('forside renders med hero-headline', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('h1.headline')).toContainText('In-house jurist');
  await expect(page.locator('.eyebrow')).toBeVisible();
});

test('forsiden viser tre projekter', async ({ page }) => {
  await page.goto('/');
  const cards = page.locator('.project');
  await expect(cards).toHaveCount(3);
});

test('navigation til /skrifter virker', async ({ page }) => {
  await page.goto('/');
  await page.click('nav.primary a:has-text("Skrifter")');
  await expect(page).toHaveURL(/\/skrifter$/);
  await expect(page.locator('h1').first()).toContainText('Skrifter');
});

test('seneste post-side renders fuld titel', async ({ page }) => {
  await page.goto('/skrifter/ma-agent-paragraf-30');
  await expect(page.locator('h1').first()).toContainText('paragraf 30');
});

test('CV-side har download-link', async ({ page }) => {
  await page.goto('/cv');
  await expect(page.locator('a.download')).toHaveAttribute('href', '/cv.pdf');
});

test('alle sider returnerer 200', async ({ page }) => {
  for (const url of ['/', '/skrifter', '/projekter', '/cv', '/kontakt']) {
    const resp = await page.goto(url);
    expect(resp?.status()).toBe(200);
  }
});
