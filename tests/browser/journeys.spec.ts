import { test, expect } from '@playwright/test';

test('pages, navigation, active states, back and forward', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  for (const route of [
    '/',
    '/services/',
    '/pricing/',
    '/about/',
    '/contact/',
    '/privacy/',
    '/terms/',
    '/thank-you/',
  ]) {
    await page.goto(route);
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('main')).toHaveCount(1);
  }
  await page.goto('/');
  // The footer is visible at every width; the bar links collapse into Menu on phones.
  await page
    .getByRole('navigation', { name: 'Footer navigation' })
    .getByRole('link', { name: 'All services', exact: true })
    .click();
  await expect(page).toHaveURL(/\/services\/$/);
  await page.goBack();
  await expect(page).toHaveURL(/\/$/);
  await page.goForward();
  await expect(page).toHaveURL(/\/services\/$/);
  expect(errors).toEqual([]);
});

test('pricing prefills the form and invalid input cannot submit', async ({ page }) => {
  await page.goto('/pricing/');
  await page.getByRole('link', { name: 'Discuss ongoing support' }).click();
  await expect(page.locator('#service')).toHaveValue('ongoing');
  await page.getByRole('button', { name: 'Send audit request' }).click();
  await expect(page.locator('#contact-name')).toBeFocused();
  await page.locator('#contact-name').fill('Test Owner');
  await page.locator('#business-name').fill('Test Business');
  await page.locator('#email').fill('invalid');
  await page.locator('#goal').fill('Make quote requests clearer.');
  await page.getByRole('button', { name: 'Send audit request' }).click();
  await expect(page.locator('#email')).toBeFocused();
  await page.locator('#email').fill('test@example.co.uk');
  await page.locator('#website').fill('invalid-url');
  await page.getByRole('button', { name: 'Send audit request' }).click();
  await expect(page.locator('#website')).toBeFocused();
  await page.locator('#website').fill('https://example.co.uk');
  await page.getByRole('button', { name: 'Send audit request' }).click();
  await expect(page).toHaveURL(/\/thank-you\//);
  await expect(page.locator('h1')).toHaveText('Your request has been received.');
});

test('all small viewports fit, menu is accessible and FAQ responds to keyboard', async ({
  page,
}) => {
  for (const width of [320, 375, 390, 768, 1024, 1440, 1920]) {
    await page.setViewportSize({ width, height: 900 });
    for (const path of [
      '/',
      '/services/',
      '/pricing/',
      '/about/',
      '/contact/',
      '/privacy/',
      '/terms/',
    ]) {
      await page.goto(path);
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
        `${path} at ${width}`,
      ).toBe(true);
    }
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  const trigger = page.getByRole('button', { name: 'Open menu' });
  await trigger.click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toBeHidden();
  await expect(trigger).toBeFocused();
  await page.goto('/pricing/');
  const faq = page.locator('.faq').first();
  await faq.locator('summary').focus();
  await page.keyboard.press('Enter');
  await expect(faq).toHaveAttribute('open', '');
  await page.keyboard.press('Enter');
  await expect(faq).not.toHaveAttribute('open');
});

test('custom missing page and confirmation do not fabricate receipt', async ({ page }) => {
  const response = await page.goto('/this-page-does-not-exist/');
  expect(response?.status()).toBe(404);
  await expect(page.getByRole('heading', { name: 'We couldn’t find that page.' })).toBeVisible();
  await page.goto('/thank-you/');
  await expect(
    page.getByText(
      'Opening this page directly does not submit a request or confirm receipt. Please use the review form to send your enquiry.',
    ),
  ).toBeVisible();
});

test('content and mobile navigation work without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    viewport: { width: 390, height: 844 },
  });
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:4331/');
  await page.locator('[data-menu-fallback]').click();
  await page
    .getByRole('navigation', { name: 'Footer navigation' })
    .getByRole('link', { name: 'Pricing', exact: true })
    .click();
  await expect(page).toHaveURL(/\/pricing\/$/);
  await expect(page.locator('.price-card')).toHaveCount(3);
  await context.close();
});

test('desktop shows every destination in the bar without a menu button', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  const bar = page.getByRole('navigation', { name: 'Main navigation' });
  for (const name of ['Services', 'Pricing', 'About', 'Contact'])
    await expect(bar.getByRole('link', { name, exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Open menu' })).toBeHidden();
});

test('phone menu contains keyboard focus, supports rapid reversal and responds to reduced motion', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Open menu' }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  for (let i = 0; i < 14; i++) {
    await page.keyboard.press('Tab');
    expect(await page.evaluate(() => !!document.activeElement?.closest('#site-menu'))).toBe(true);
  }
  await page.evaluate(() => {
    const toggle = document.querySelector<HTMLButtonElement>('[data-menu-toggle]');
    toggle?.click();
    toggle?.click();
  });
  await expect(dialog).toBeVisible();
  await expect(page.getByRole('button', { name: 'Close menu' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.getByRole('button', { name: 'Open menu' }).click();
  await expect(dialog).toBeVisible();
  await page.getByRole('button', { name: 'Close menu' }).click();
  await expect(dialog).toBeHidden();
});

test('website project prefill, illustrative audit and service anchors work', async ({ page }) => {
  await page.goto('/pricing/');
  await page.getByRole('link', { name: 'Discuss a website project' }).click();
  await expect(page.locator('#service')).toHaveValue('new-website');
  await page.goto('/');
  await expect(
    page.getByText('Illustrative example. Not a client project.', { exact: true }),
  ).toBeVisible();
  await page.getByRole('link', { name: 'Website care', exact: true }).first().click();
  await expect(page).toHaveURL(/\/services\/#website-care$/);
  await expect(page.getByRole('heading', { name: 'Website care', level: 2 })).toBeInViewport();
});

async function fillDummy(
  page: import('@playwright/test').Page,
  goal = 'Browser test only: clearer service details.',
) {
  await page.locator('#contact-name').fill('Test Owner');
  await page.locator('#business-name').fill('Dummy Business');
  await page.locator('#email').fill('dummy@example.invalid');
  await page.locator('#goal').fill(goal);
}

test('network and backend errors preserve entered data and never show false success', async ({
  page,
}) => {
  await page.goto('/contact/');
  await fillDummy(page);
  await page.route('**/api/enquiries', (route) => route.abort('failed'));
  await page.getByRole('button', { name: 'Send audit request' }).click();
  await expect(page.getByRole('alert')).toContainText('could not confirm receipt');
  await expect(page.locator('#business-name')).toHaveValue('Dummy Business');
  await expect(page.getByRole('button', { name: 'Send audit request' })).toBeEnabled();
  await page.unroute('**/api/enquiries');
  await page.route('**/api/enquiries', (route) =>
    route.fulfill({
      status: 503,
      contentType: 'application/json',
      body: JSON.stringify({ accepted: false, message: 'Storage unavailable. Nothing was saved.' }),
    }),
  );
  await page.getByRole('button', { name: 'Send audit request' }).click();
  await expect(page.getByRole('alert')).toContainText('Nothing was saved');
  await expect(page).toHaveURL(/\/contact\//);
  expect(await page.evaluate(() => localStorage.length + sessionStorage.length)).toBe(0);
});

test('keyboard submission normalises a bare URL and confirms actual persistence', async ({
  page,
  request,
}) => {
  await page.goto('/contact/');
  await fillDummy(page, 'Keyboard browser dummy test.');
  await page.locator('#website').fill('example.com');
  await page.locator('#website').blur();
  await expect(page.locator('#website')).toHaveValue('https://example.com/');
  await page.getByRole('button', { name: 'Send audit request' }).focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/thank-you\//);
  await expect(page.locator('h1')).toHaveText('Your request has been received.');
  const owner = await request.get('/api/owner/enquiries', {
    headers: { Authorization: 'Bearer local-test-owner-token-never-use-in-production-0000' },
  });
  expect(owner.status()).toBe(200);
  expect(
    (await owner.json()).items.some(
      (item: { goal: string }) => item.goal === 'Keyboard browser dummy test.',
    ),
  ).toBe(true);
  const publicRead = await request.get('/api/owner/enquiries');
  expect(publicRead.status()).toBe(401);
});

test('native form works with JavaScript disabled and only then confirms receipt', async ({
  browser,
}) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    viewport: { width: 390, height: 844 },
  });
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:4331/contact/');
  await fillDummy(page, 'Native browser dummy test.');
  await page.getByRole('button', { name: 'Send audit request' }).click();
  await expect(page).toHaveURL(/\/thank-you\//);
  await expect(page.locator('h1')).toHaveText('Your request has been received.');
  await context.close();
});
