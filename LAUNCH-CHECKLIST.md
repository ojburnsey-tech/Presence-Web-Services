# Launch checklist — private release candidate

Status: **BLOCKED for public launch**. No public launch or DNS/email change is approved. The confirmed trading name/email do not resolve the remaining identity, address, retention and name-clearance decisions.

## Implemented / locally verified

- [x] Preserve nine Astro pages, original brand direction, separate service/pricing/about content.
- [x] Confirmed name/email in configuration; free audit primary action, paid services early, honest from-prices.
- [x] Working local Worker/SQLite form, server validation, native POST and enhanced errors/retries.
- [x] Durable save/read-back, idempotency/deduplication, honeypot, body limits and IP-hash rate limits.
- [x] Separate server-side owner list/delete/purge authorisation; no anonymous record read/update.
- [x] Genuine signed-cookie confirmation after save; neutral direct access.
- [x] Runtime security headers, fixed canonical redirect and dual source/runtime public gate.
- [x] Privacy draft changed to selected Sites/D1/inbound-email workflow; no invented details.
- [x] Source, lockfile, migrations, tests and eight handover documents prepared.
- [x] Existing Sites access restored to owner only, no groups.

## Verification required before public approval

- [x] Native Worker artifact accepted, generated Drizzle migrations deployed and runtime secrets/configuration saved; DB tables independently inspected. Hosted HTTP health/receipt remains below.
- [ ] Actual hosted dummy submission independently confirmed in D1/owner review, duplicate checked and dummy deleted.
- [ ] Hosted anonymous app access vs owner-only data access checked separately without opening staging publicly.
- [ ] Hosted unavailable/error/success and confirmation states checked over HTTPS, with no PII cache/log exposure.
- [ ] Firefox and WebKit journeys pass; downloads currently blocked by network policy. Check actual Safari/iOS and screen reader on representative devices.
- [ ] Owner reviews mobile/desktop screenshots and keyboard/zoom/reduced-motion/high-contrast behaviour. Automated Chromium evidence is in TEST-REPORT.md.
- [ ] Provider backup/export permissions and restore-to-test drill verified; retention of provider backups understood.

## Owner decisions / external P0 gates

- [ ] Confirm actual trading structure and legal controller identity for public disclosure.
- [ ] Provide a suitable lawful correspondence/geographic address and approve its disclosure.
- [ ] Confirm tax/VAT treatment and indicative-pricing wording.
- [ ] Confirm trademark/name checks to owner's satisfaction.
- [ ] Approve production enquiry retention period/criteria, purge frequency and email/backup schedule.
- [ ] Confirm provider contractual roles, locations, processing/transfer terms and any applicable ICO assessment.
- [ ] Approve final privacy/terms wording and separate client-service agreement.
- [ ] Confirm owner can review/delete enquiries reliably; no email notifications currently exist.
- [ ] Review hosting/custom-domain quotas and billing; authorise any cost explicitly.
- [ ] Explicitly approve public publication and specific web DNS changes.

## Production execution after approval only

- [ ] Attach apex/www to the same Sites project and obtain exact provider DNS/validation values.
- [ ] Back up Cloudflare DNS/Email Routing; edit only approved web/verification records, preserve nameservers and all email records.
- [ ] Verify domain resolution, HTTP→HTTPS/apex redirects, certificates/expiry, real 404 and no loops.
- [ ] Complete business config and build public release; configure matching runtime retention/production approval.
- [ ] Verify production canonical/OG/schema, robots, sitemap and absence of unintended noindex; confirmation stays noindex.
- [ ] Approve audience change, deploy exact reviewed version, then anonymously submit dummy data and independently verify receipt/owner isolation.
- [ ] Test inbound contact email forwarding again without assuming outbound send-as works.
- [ ] Verify Search Console ownership with its actual unique TXT; submit sitemap and inspect pages.
- [ ] Record live version/source SHA, recovery point, operator review schedule and rollback procedure.

Do not mark production verified from a build, native deployment success or a Lighthouse score alone.
