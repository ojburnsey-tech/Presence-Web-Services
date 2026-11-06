# Test report — 6 November 2026

Evidence is from the accessible source and local production-like Worker server, unless explicitly labelled native hosting. No public deployment or production verification is claimed.

## Environment

Node 24.22.1, npm 11.9.0, Astro 7.4.5, strict TypeScript, ESLint, Playwright 1.64.1, system Chromium **155.0.8059.79**, axe-core and Lighthouse 13.6.0. Local HTTP server runs the actual Worker handler with a real file-backed SQLite adapter for D1-shaped prepared statements. It binds only to 127.0.0.1:4331. Screenshots contain no prospect data.

## Checks and actual results

| Check                       | Command / evidence                                                    | Result                                                                                                                            |
| --------------------------- | --------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Astro diagnostics           | `npm run check`                                                       | 0 errors, warnings or hints                                                                                                       |
| Whole-project types         | `npx tsc --noEmit`                                                    | Passed                                                                                                                            |
| Lint                        | `npm run lint`                                                        | Passed after correcting an unused cleanup assignment                                                                              |
| Artifact build              | `npm run build:sites`                                                 | Nine pages + Worker ESM; no inline executable script/style or source maps                                                         |
| Site/backend tests          | `npm test`                                                            | 33 groups passed: generated HTML/link checks, DOM/axe, validation, SQLite persistence, access and failures                        |
| Real browser journeys       | `npx playwright test --project=chromium --project=mobile-chromium`    | 20 journeys passed across desktop/mobile Chromium projects                                                                        |
| Rendered browser audit      | `node scripts/browser-audit.mjs`                                      | 90 reflow checks, zero overflow; 18 full rendered axe runs (nine pages × 390/1440px), zero violations; no page/CSP console errors |
| Full dependency audit       | `npm audit --json`                                                    | Zero known vulnerabilities, including development dependencies; `reports/npm-audit.json`                                          |
| Production dependency audit | `npm audit --omit=dev --json`                                         | Zero known vulnerabilities                                                                                                        |
| Firefox / WebKit            | `npx playwright install firefox webkit`, then separate WebKit attempt | Download blocked by workspace proxy (403 Domain forbidden) from official browser CDNs; neither engine was run                     |
| Direct hosted HTTP          | curl to exact private preview                                         | Proxy CONNECT 403 before origin; no hosted receipt inferred                                                                       |
| Domain settings             | Native Sites list_custom_domains                                      | Empty; no production domain attachment made                                                                                       |

## Form/security scenarios

Valid requests are independently read from the database, including after closing/reopening the SQLite file. Missing/blank required fields, invalid email/URLs/service, oversized values/body, malformed JSON, unexpected types/fields, duplicate URL-encoded fields, control characters, honeypot and cross-site origins are rejected. HTML and SQL-like input remains inert text in a dummy record. Atomic duplicate/concurrent handling stores one row. A changed payload with a reused request key receives 409. The sixth distinct request in a per-IP minute receives 429 and Retry-After; committed retries remain idempotent.

Disabled/missing secrets, unavailable database and simulated persistence failure produce 503 and no receipt cookie. Browser network/503 tests preserve entered data, restore the button and stay on Contact. URLs are normalised on blur/submit without rewriting under a typing cursor. Pricing/service selections prefill; no website is required. Browser keyboard/mobile and no-JavaScript POST journeys reach confirmation only after saving. Direct/tampered/expired confirmation remains neutral.

Owner list/delete/purge is independently tested with correct, missing and wrong tokens; forged user-ID headers grant nothing. Pagination limits are checked, cross-origin mutation rejected and expiry/purge verified. No anonymous read/update exists. Public source/.env paths return real 404. Security header assertions and real browser checks cover CSP functionality, framing policy, no-store PII responses, HSTS over HTTPS and fixed production redirect destinations. These are local controls; provider dispatch and real D1 require a deployed acceptance test.

## Browser/accessibility coverage

Routes: Home, Services, Pricing, About, Contact, Privacy, Terms, confirmation and 404. Viewports: 320, 375, 390, 768, 1024, 1440, 1920px. Additional checks: 844×390 landscape; 200% text at a 640px layout viewport; 320px reflow corresponding to 400% zoom from 1280px. These are automation approximations, not a claim of using every browser's native zoom UI.

Keyboard checks include active navigation/history, modal Tab containment, focus restoration, Escape/backdrop/reversal, reduced motion, FAQ disclosures, pricing radios/prefill and form submission. Forced-colors screenshot captured. Native menu initially allowed Tab to reach browser chrome/body; explicit wrapping fixed it and real-browser retest passed. At 320px the new radio controls inherited text-input width; scoping their size fixed the overflow, confirmed by the full 90-check rerun.

Axe ran WCAG 2/2.1/2.2 A/AA tags in both jsdom and rendered Chromium; rendered runs include contrast. Critical token contrast pairs are also mathematically checked. Automated checks do not establish full WCAG conformance. Real assistive technology (VoiceOver/NVDA), actual iOS/Safari and human usability review remain owner/device checks. No known serious barrier remains in the tested Chromium journeys.

Screenshots: `reports/screenshots/` contains all nine routes at 390 and 1440px plus forced-colors menu. They were captured as a review baseline, not compared against a previous approved golden image. Representative homepage, pricing, services, contact, legal and menu captures are visually inspected during final review. Re-run after meaningful layout changes.

## Performance: real local lab measurements

Lighthouse CLI used installed Chromium on the local Worker, no analytics/remote fonts. Mobile uses Lighthouse's default simulated mobile throttling; desktop uses its desktop preset. Reports preserve exact settings and audit details.

| Metric              | Mobile | Desktop |
| ------------------- | ------ | ------- |
| Performance         | 100    | 100     |
| Accessibility       | 100    | 100     |
| Best practices      | 100    | 100     |
| SEO                 | 63     | 63      |
| LCP                 | 0.9s   | 0.2s    |
| CLS                 | 0      | 0       |
| Total blocking time | 0ms    | 0ms     |

SEO is intentionally below the requested 95 target because private staging is noindex/disallowed; do not remove those protections to improve a score. Final production SEO, canonical/schema/OG, robots/sitemap and HTTPS must be tested after approved configuration. LCP/CLS meet the stated lab targets in these runs. TBT is not INP; **no field INP or real-user Core Web Vitals are available**. Real hosted latency and traffic may differ. Local lab scores do not establish live performance.

Reports: `reports/lighthouse-mobile.report.json/html`, `reports/lighthouse-desktop.report.json/html`, `reports/browser-audit.json`. Lighthouse notes a back/forward cache limitation from no-store and rendering/dependency opportunities despite performance 100; caching private/receipt data safely takes priority.

## Native staging evidence

Sites version 6 deployed privately on 6 November 2026. Native schema inspection confirms binding `DB` and tables `enquiries` / `enquiry_rate_limits`; a native read confirms the enquiry table is empty. Migration discovery required the generated Drizzle SQL/journal in the artifact root. The earlier version 5 provisioned a binding without applying the prototype migration; version 6 corrects that packaging. Exact IDs and source are recorded in reports/RELEASE-RECORD.md.

A private hosted-verification script was attempted with supported site service access and the separate owner token. It failed before an HTTP request reached the site (`getaddrinfo EAI_AGAIN`); curl independently fails at the proxy with CONNECT 403. No dummy row was created remotely and no hosted form receipt is claimed. `scripts/verify-hosted.mjs` is ready for re-running after network access is available.

## Release evidence to finish

Final source/browser counts, saved version/native deployment and private GitHub backup are recorded in `reports/RELEASE-RECORD.md`. Until hosted dummy receipt, production DNS/TLS, legal details, retention/name approval and owner publication approval are complete, status remains BLOCKED for public launch. No email notification delivery or outgoing business mailbox is claimed.
