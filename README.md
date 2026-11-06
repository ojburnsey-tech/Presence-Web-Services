# Presence Web Services

Nine-page Astro website with a small Cloudflare Worker enquiry API and a D1 database. This is a private release candidate, not an approved public launch. The confirmed brand and contact are Presence Web Services and contact@presencewebservices.co.uk. Public launch still requires the owner decisions and hosted checks in [LAUNCH-CHECKLIST.md](LAUNCH-CHECKLIST.md).

## Setup

Use Node 24 LTS (tested 24.22.1) and npm 11.9.0. Astro requires Node >=22.23.4. No Netlify account is needed.

```sh
npm ci
npm run dev
```

Astro prints its local address, usually http://localhost:4321. In a remote workspace that address is not on your own computer. Astro dev previews content only; its form deliberately explains that submissions are unavailable.

For the complete local enquiry journey with SQLite persistence:

```sh
npm run build:sites
npm run serve:test
```

Open http://127.0.0.1:4331 on the same machine. This server binds only to loopback, uses clearly labelled local test credentials and stores dummy records in ignored `work/enquiries-v2.sqlite`. Restart it after rebuilding. Never expose it to the internet. Local SQLite tests exercise the same SQL, but do not prove hosted D1 behaviour.

The Drizzle schema generator is development-only; runtime queries use bound SQL. Keep the generated SQL/journal/snapshots in `drizzle/` immutable after application. The legacy `migrations/` file is retained as a local prototype record, not an additional hosted migration.

## Commands

| Command                                                            | Purpose                                                                 |
| ------------------------------------------------------------------ | ----------------------------------------------------------------------- |
| `npm run check`                                                    | Astro diagnostics                                                       |
| `npx tsc --noEmit`                                                 | Strict whole-project TypeScript                                         |
| `npm run lint`                                                     | ESLint, including Astro/server files                                    |
| `npm run build:sites`                                              | Static Astro build, bundled Worker and deployment artifact              |
| `npm test`                                                         | Generated HTML, links, DOM, accessibility and real SQLite backend tests |
| `npm run test:e2e -- --project=chromium --project=mobile-chromium` | Browser journeys against the local Worker                               |
| `node scripts/browser-audit.mjs`                                   | Nine pages, seven widths, rendered axe and screenshots                  |
| `npm audit`                                                        | Known dependency advisories                                             |
| `npm run format:check`                                             | Formatting                                                              |

Playwright Chromium defaults to `/usr/bin/chromium`; set `PLAYWRIGHT_CHROMIUM_EXECUTABLE` for another installed Chromium. Firefox/WebKit projects are configured but require their Playwright browser packages. See [TEST-REPORT.md](TEST-REPORT.md) for actual evidence and limitations, including network-blocked browser downloads.

## Architecture

- `src/pages`: Home, Services, Pricing, About, Contact, Privacy, Terms, confirmation and 404.
- `src/config/business.ts`: confirmed facts, prices, service descriptions and launch gate.
- `src/components`: shared navigation, fields, pricing, service chooser and illustrative audit.
- `src/scripts`: small form/menu progressive enhancements; no UI framework.
- `src/styles/global.css`: colour/type/spacing tokens and responsive layout.
- `server/runtime.ts`: submission, protected owner endpoints, receipt checks, headers and static serving.
- `server/validation.ts`, `src/lib/enquiry.ts`: input limits, normalisation and validation.
- `db/schema.ts`, `drizzle/`: generated immutable schema migrations; never apply schema changes in a request handler.
- `scripts/build-sites.mjs`: embeds only generated public assets in a Worker ESM module.
- `scripts/local-db.mjs`: local SQLite D1 adapter with migration checksums.
- `public/`: original wordmark, favicon, touch icon and social sharing image.

There are no advertising trackers, remote fonts, checkout, chat widget, analytics or outbound email integrations. The form works as a native POST without JavaScript; JavaScript improves errors, retries, URL normalisation and service prefilling. A signed ten-minute HttpOnly receipt cookie permits genuine confirmation only after persistence. No enquiry data goes into localStorage/sessionStorage.

The Apple Design skill informed system typography, restrained surfaces, immediate status feedback, interruptible spring motion, explicit keyboard wrapping, reduced motion and focus restoration. See [skill documentation](skill://plugins_6aebb6fc23d08191b4a4fa276e1a646a/apple-design/SKILL.md).

## Hosting and maintenance

Use one hosting route: existing OpenAI Sites, with its managed Cloudflare Worker/D1 storage. Preserve project `appgprj_6aebc28289908191851ee53a5b25c1a9` and owner-only access. Do not upload `dist/` alone: that would omit the enquiry API. See [DEPLOYMENT.md](DEPLOYMENT.md), [OPERATIONS.md](OPERATIONS.md), [SECURITY-REPORT.md](SECURITY-REPORT.md), [CONTENT-AND-LEGAL-REVIEW.md](CONTENT-AND-LEGAL-REVIEW.md) and [COSTS.md](COSTS.md).

The intended production origin is https://presencewebservices.co.uk, but it is not approved or verified as this app's live domain. `business.launchReady=false` keeps staging noindex, omits production canonical/social URLs and emits an empty sitemap. Public release requires both an approved source build and runtime approval. The build rejects missing legal/retention details. Keep all secrets in Sites runtime settings; `.env.example` contains names only.

Prices are indicative: one-off from £149, ongoing from £129/month, websites separately quoted. Any chosen scope, tax treatment, third-party charges and cancellation/payment conditions require a separate written proposal. Never add invented testimonials, results, affiliations or legal details.
