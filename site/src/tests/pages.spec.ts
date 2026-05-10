import { test, expect } from '@playwright/test';

test('forside renders med hero-skrift', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('section.hero-skrift')).toBeVisible();
  await expect(page.locator('section.hero-skrift .label')).toContainText('Senest skrift');
  await expect(page.locator('section.hero-skrift h1.title')).toBeVisible();
});

test('forsiden viser om-mig-sektion + activity-feed', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('section.om-mig')).toBeVisible();
  await expect(page.locator('aside.feed')).toBeVisible();
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
  for (const url of ['/', '/skrifter', '/projekter', '/cv', '/chat', '/kontakt', '/klinikker', '/konsulenter', '/now']) {
    const resp = await page.goto(url);
    expect(resp?.status()).toBe(200);
  }
});
