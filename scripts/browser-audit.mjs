import { chromium } from '@playwright/test';
import axe from 'axe-core';
import { mkdirSync, writeFileSync } from 'node:fs';
const base = 'http://127.0.0.1:4331';
const paths = [
  '/',
  '/services/',
  '/pricing/',
  '/about/',
  '/contact/',
  '/privacy/',
  '/terms/',
  '/thank-you/',
  '/404.html',
];
mkdirSync('reports/screenshots', { recursive: true });
const browser = await chromium.launch({
  executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || '/usr/bin/chromium',
});
const page = await browser.newPage();
const errors = [];
page.on('pageerror', (error) => errors.push(error.message));
page.on('console', (message) => {
  if (message.type() === 'error' && !message.text().includes('404')) errors.push(message.text());
});
const evidence = {
  date: new Date().toISOString(),
  browser: browser.version(),
  routes: [],
  reflow: [],
  errors,
};
for (const width of [320, 375, 390, 768, 1024, 1440, 1920]) {
  await page.setViewportSize({ width, height: 900 });
  for (const path of paths) {
    await page.goto(base + path, { waitUntil: 'networkidle' });
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    );
    evidence.reflow.push({ path, width, overflow });
    if ([390, 1440].includes(width)) {
      const name = path === '/' ? 'home' : path.replaceAll('/', '').replace('.html', '');
      await page.screenshot({ path: `reports/screenshots/${name}-${width}.png`, fullPage: true });
      await page.evaluate(axe.source);
      const result = await page.evaluate(async () =>
        window.axe.run(document, {
          runOnly: {
            type: 'tag',
            values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'],
          },
        }),
      );
      evidence.routes.push({
        path,
        width,
        violations: result.violations.map(({ id, impact, nodes }) => ({
          id,
          impact,
          targets: nodes.map((n) => n.target),
        })),
      });
    }
  }
}
for (const [label, width, height, scale] of [
  ['landscape', 844, 390, 1],
  ['200-percent-text', 640, 900, 2],
  ['400-percent-reflow', 320, 900, 1],
]) {
  await page.setViewportSize({ width, height });
  for (const path of paths) {
    await page.goto(base + path);
    if (scale !== 1)
      await page.evaluate((scale) => {
        document.documentElement.style.fontSize = `${scale * 100}%`;
      }, scale);
    evidence.reflow.push({
      path,
      condition: label,
      width,
      overflow: await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth),
    });
  }
}
await page.emulateMedia({ forcedColors: 'active', reducedMotion: 'reduce' });
await page.goto(base + '/');
await page.getByRole('button', { name: 'Open menu' }).click();
await page.screenshot({ path: 'reports/screenshots/menu-forced-colors.png' });
await page.keyboard.press('Escape');
await browser.close();
writeFileSync('reports/browser-audit.json', JSON.stringify(evidence, null, 2));
const failures = evidence.reflow.filter((x) => x.overflow);
const violations = evidence.routes.filter((x) => x.violations.length);
console.log(
  JSON.stringify({
    browser: evidence.browser,
    reflowChecks: evidence.reflow.length,
    overflow: failures,
    axeViolations: violations,
    errors,
  }),
);
if (failures.length || violations.length || errors.length) process.exitCode = 1;
