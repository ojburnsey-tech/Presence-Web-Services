/**
 * Renders the images for the Presence Web Services Google Business Profile.
 *
 *   node scripts/gbp-assets.mjs
 *
 * Output (docs/google-business-profile/):
 *   logo-720.png              Square profile logo, 720 x 720 (Google's recommended size).
 *   post-free-audit-1200x900.png  Image for the first "Offer" post (4:3, Google's post ratio).
 *
 * The wordmark is set exactly as on the website (bold, -0.045em tracking, accent full stop).
 * SF Pro cannot be rendered outside Apple platforms, so Inter Display, the site's own
 * fallback and the closest freely licensed match, is used. Colours are the site tokens.
 */
import { mkdirSync } from 'node:fs';
import { chromium } from 'playwright';

const outDir = new URL('../docs/google-business-profile/', import.meta.url);
mkdirSync(outDir, { recursive: true });

/** Site design tokens (src/styles/global.css, light theme). */
const t = {
  paper: '#f8f7f3',
  ink: '#282828',
  muted: '#60605b',
  line: '#deded5',
  accent: '#d77555',
  accentDark: '#a5482c',
};

const base = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { background: ${t.paper}; color: ${t.ink}; }
  body { font-family: 'Inter Display', 'Inter', sans-serif; -webkit-font-smoothing: antialiased; }
  .name { font-weight: 700; letter-spacing: -0.045em; line-height: 1; }
  .dot { color: ${t.accentDark}; }
  .sub { font-weight: 500; color: ${t.muted}; letter-spacing: -0.005em; line-height: 1; }
`;

/**
 * Logo: the wordmark stacked and centred. Content stays inside the central 70% so nothing
 * is lost when Google crops the logo to a circle.
 */
const logo = `<!doctype html><html><head><style>${base}
  body { width: 720px; height: 720px; display: grid; place-items: center; }
  .mark { display: flex; flex-direction: column; align-items: center; gap: 22px; transform: translateY(6px); }
  .name { font-size: 112px; }
  .sub { font-size: 38px; }
</style></head><body>
  <div class="mark">
    <span class="name">presence<span class="dot">.</span></span>
    <span class="sub">Web Services</span>
  </div>
</body></html>`;

/** First post image: plain, typographic and on-brand. No stock imagery, no invented claims. */
const post = `<!doctype html><html><head><style>${base}
  body { width: 1200px; height: 900px; padding: 88px 96px; display: flex; flex-direction: column; }
  header { display: flex; align-items: baseline; gap: 14px; padding-bottom: 40px; border-bottom: 1px solid ${t.line}; }
  header .name { font-size: 44px; }
  header .sub { font-size: 24px; }
  main { flex: 1; display: flex; flex-direction: column; justify-content: center; }
  .eyebrow { font-family: 'Inter', sans-serif; font-weight: 600; font-size: 24px; color: ${t.accentDark}; margin-bottom: 28px; }
  h1 { font-weight: 700; font-size: 78px; letter-spacing: -0.035em; line-height: 1.04; max-width: 980px; }
  p { font-family: 'Inter', sans-serif; font-size: 30px; line-height: 1.45; color: ${t.muted}; margin-top: 34px; max-width: 900px; }
  footer { display: flex; align-items: center; gap: 22px; font-family: 'Inter', sans-serif; font-size: 26px; font-weight: 500; }
  footer i { width: 48px; height: 3px; background: ${t.accent}; display: block; }
</style></head><body>
  <header><span class="name">presence<span class="dot">.</span></span><span class="sub">Web Services</span></header>
  <main>
    <div class="eyebrow">Free audit</div>
    <h1>Is your website or Google listing costing you calls?</h1>
    <p>We check your website and Google Business Profile and send you a written list of what to fix first. No obligation.</p>
  </main>
  <footer><i></i>presencewebservices.co.uk</footer>
</body></html>`;

// Same convention as playwright.config.ts: honour an explicit browser path when one is set.
const browser = await chromium.launch(
  process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE
    ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE }
    : {},
);
try {
  const shots = [
    { html: logo, width: 720, height: 720, file: 'logo-720.png' },
    { html: post, width: 1200, height: 900, file: 'post-free-audit-1200x900.png' },
  ];
  for (const { html, width, height, file } of shots) {
    // deviceScaleFactor 1: Google's upload sizes are exact pixel sizes.
    const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
    await page.setContent(html, { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: new URL(file, outDir).pathname, type: 'png' });
    await page.close();
    console.log(`wrote docs/google-business-profile/${file}`);
  }
} finally {
  await browser.close();
}
