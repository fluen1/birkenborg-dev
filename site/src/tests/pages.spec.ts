import { test, expect } from '@playwright/test';

test('forside renders med hero-skrift', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('section.hero-skrift.revealed')).toBeVisible({ timeout: 2000 });
  await expect(page.locator('section.hero-skrift .label')).toContainText('Senest skrift');
  await expect(page.locator('section.hero-skrift h1.title')).toBeVisible();
});

test('forsiden viser om-mig-sektion + activity-feed', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('section.om-mig')).toBeVisible();
  await expect(page.locator('aside.af-feed')).toBeVisible();
});

test('navigation til /skrifter virker', async ({ page }) => {
  await page.goto('/');
  await page.click('nav.primary a:has-text("Skrifter")');
  await expect(page).toHaveURL(/\/skrifter\/$/);
  await expect(page.locator('h1').first()).toContainText('Skrifter');
});

test('seneste post-side renders fuld titel', async ({ page }) => {
  await page.goto('/skrifter/ma-agent-paragraf-30/');
  await expect(page.locator('h1').first()).toContainText('paragraf 30');
});

test('CV-side har download-link', async ({ page }) => {
  await page.goto('/cv/');
  await expect(page.locator('a.download')).toHaveAttribute('href', '/cv.pdf');
});

test('dark mode toggle persists across page load', async ({ page }) => {
  await page.goto('/');
  await page.click('.theme-toggle');
  const theme = await page.getAttribute('html', 'data-theme');
  expect(theme).toBe('dark');
  await page.reload();
  const themeAfterReload = await page.getAttribute('html', 'data-theme');
  expect(themeAfterReload).toBe('dark');
});

test('scroll-reveal respects prefers-reduced-motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const heroClass = await page.locator('section.hero-skrift').getAttribute('class');
  expect(heroClass).toContain('revealed');
});

test('tag-filter på /skrifter filtrerer listen og synker URL', async ({ page }) => {
  await page.goto('/skrifter/');
  const allItems = page.locator('[data-skrifter-list] [data-tags]');
  const total = await allItems.count();
  expect(total).toBeGreaterThan(0);

  // Vælg første emne-chip (ikke "Alle") — robust mod hvilke tags der findes.
  const firstTag = page.locator('.tag-chip:not([data-tag=""])').first();
  await firstTag.click();

  await expect(page).toHaveURL(/\?tag=/);
  await expect(firstTag).toHaveAttribute('aria-pressed', 'true');

  const visible = page.locator('[data-skrifter-list] [data-tags]:not([hidden])');
  const visibleCount = await visible.count();
  expect(visibleCount).toBeGreaterThan(0);
  expect(visibleCount).toBeLessThan(total); // filtret skjuler faktisk noget

  // Tilbage til "Alle" viser alt igen + rydder URL.
  await page.click('.tag-chip[data-tag=""]');
  await expect(page).toHaveURL(/\/skrifter\/$/);
  await expect(page.locator('[data-skrifter-list] [data-tags]:not([hidden])')).toHaveCount(total);
});

test('alle sider returnerer 200', async ({ page }) => {
  for (const url of ['/', '/skrifter/', '/projekter/', '/cv/', '/chat/', '/kontakt/', '/arbejd-sammen/', '/now/']) {
    const resp = await page.goto(url);
    expect(resp?.status()).toBe(200);
  }
});
