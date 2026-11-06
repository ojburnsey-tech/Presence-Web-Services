# Deployment and rollback

## Selected route

Retain Astro static generation and publish its pages/assets through a small Worker ESM server on the existing OpenAI Sites project. D1 is the durable store. No external account, Netlify migration, SMTP service or second public deployment has been configured.

Existing project: `appgprj_6aebc28289908191851ee53a5b25c1a9`.
Private URL: https://presence-private-preview-4nov-c73a.ojburnsey.chatgpt.site/
Original recovery snapshot: Sites version 4, source commit `00b560a04784226bb3e1044d6ce3ea2e667892aa` (static, non-working form). Retain it. Returning to it disables working enquiries; display its existing preview notice. Database rollback is separate.

## Build/package

1. `npm ci`, checks, `npm run build:sites`, `npm test`.
2. Output: `work/sites-artifact/dist/server/index.js`, `.openai/hosting.json` and the generated `drizzle/` SQL/journal plus Worker config. Only public generated assets are embedded; source maps, backups, database files and secrets are excluded.
3. Push exact source to the Sites source repository, preserving its project ID, and separately back up the complete authored project to the existing private GitHub repository. Never force-push over an unknown remote change.
4. Package the matching artifact as a tar archive. Use native Sites **save_site_version** first; keep its exact returned version ID. Inspect any validation error before proceeding.
5. Configure runtime variables through native Sites settings, with secret fields marked secret. Deploy that saved version using **deploy_private_site_version** only after verifying custom access allows the owner alone and no groups.
6. Poll a non-terminal deployment to completion. A successful platform deployment proves publication, not real enquiry receipt. Perform the hosted acceptance checks below.

The source `.openai/hosting.json` declares the D1 logical binding. Sites owns actual database IDs and routing. Do not provision a separate paid database or invent provider IDs. The release record must confirm migration acceptance and deployed schema before claiming hosted storage works.

## Runtime variables

| Key                      | Value / handling                                                                      |
| ------------------------ | ------------------------------------------------------------------------------------- |
| `APP_SECRET`             | Random at least 32 characters; secret, HMAC for receipts/fingerprints/rate hashes     |
| `OWNER_REVIEW_TOKEN`     | Separate high-entropy at least 32 characters; secret, owner-only API bearer           |
| `ENQUIRIES_ENABLED`      | `true` only when storage and owner access are configured                              |
| `DEPLOYMENT_STAGE`       | `staging` for private candidate; `production` only after approval                     |
| `ENQUIRY_RETENTION_DAYS` | `365` in production (12 months, as the privacy policy states). Staging stays at 1 day |
| `RESEND_API_KEY`         | Secret. Resend API key with "Sending access" only. Without it no emails are sent      |
| `MAIL_FROM`              | Optional. Defaults to `Presence Web Services <audits@mail.presencewebservices.co.uk>` |
| `NOTIFY_EMAIL`           | Optional. Defaults to `contact@presencewebservices.co.uk`                             |
| `PUBLIC_LAUNCH_APPROVED` | Leave false/absent until explicit public launch approval                              |

`BUILD_PUBLIC_RELEASE` is forcibly supplied by the build from `business.launchReady`; a hosted runtime value cannot override the bundled false value. Production refuses to serve when either approval gate is false. Missing storage/secrets fail safely with 503. Staging uses a one-day dummy-record expiry. Runtime changes require deploying a saved version to apply the new revision.

## Enquiry emails (Resend)

Each new enquiry is saved first, then two emails are sent in the background:

- **Owner alert** to `contact@presencewebservices.co.uk` (forwarded to Gmail by Cloudflare Email Routing). It contains every submitted field, Reply-To is the customer, and it links to PageSpeed Insights, Google search and Google Maps for the audit.
- **Customer confirmation** from the same sender, Reply-To `contact@`. It contains no text the visitor typed, and each address receives at most two per day.

Delivery never blocks or loses an enquiry. The outcome is stored on the row (`notify_status`, `confirm_status`) and shown by the owner API as `emailToOwner` and `emailToCustomer` (`sent:<id>`, `failed:<status>`, `skipped:<reason>` or `pending`). Resend idempotency keys (`alert-<id>`, `confirm-<id>`) stop retries sending duplicates.

Setup (owner):

1. Create a free account at resend.com. The Free plan allows 3,000 emails a month and 100 a day.
2. **Domains → Add domain** and enter `mail.presencewebservices.co.uk`. Resend recommends a sending subdomain so the main domain's reputation is protected.
3. In Cloudflare **DNS → Records**, add exactly the records Resend shows (DKIM and SPF; TXT and MX on the subdomain). Set any CNAME to **DNS only**. Do not edit the existing apex MX, SPF or `cf2024-1._domainkey` records: they run `contact@` forwarding.
4. Wait for Resend to show the domain as **Verified** (it can take up to 72 hours).
5. **API Keys → Create API key** with **Sending access** for that domain only. Copy it once.
6. In ChatGPT Sites runtime settings, add `RESEND_API_KEY` as a **secret**, and set `ENQUIRY_RETENTION_DAYS` to `365` for production. Deploy a new saved version so the runtime picks them up.
7. Submit a test enquiry using an inbox you own. Confirm both emails arrive, that Reply works from Gmail, and that the owner API shows `sent:` for both.

Never paste the API key into chat, source code or a commit. Rotate it in Resend if it is exposed. Optional later: add a DMARC record (`_dmarc` TXT, starting with `v=DMARC1; p=none`) once both forwarding and Resend sending are verified.

## Hosted acceptance

Use dummy data only. Verify POST /api/enquiries stores an enquiry, then independently confirm its ID and field values through protected owner access or the authenticated Sites database viewer. Retry and confirm a single row; delete the dummy record. Verify missing/wrong owner authorisation is 401, public reads are unavailable, validation and unavailable states work, successful confirmation has a receipt, direct confirmation remains neutral, HTTPS headers are present, and no PII is cached/logged. Test anonymous app requests separately from owner requests. Keep the platform owner-only while testing; use supported private service access only for this exact site when available. Do not temporarily make staging public.

The workspace proxy currently blocks direct access to the preview and production domains (CONNECT 403). This must be resolved by the environment's network settings or owner-side testing; changing app security will not fix the proxy. Do not claim hosted form verification from local SQLite tests.

## Production domain: owner approval required

Canonical choice: **https://presencewebservices.co.uk**. The application redirects approved production requests from HTTP, www and alternate origins to that fixed HTTPS origin with a 308. It never uses a visitor-supplied destination. DNS and certificate routing must reach the Worker first; application redirects alone do not establish either.

The Sites custom-domain list was empty at review. Native Sites supports apex A targets, subdomain CNAME targets and provider verification records. Exact values are issued only when attaching a domain. No domain attachment or DNS change has been authorised, so target values have deliberately not been invented.

After owner approval:

1. Export the current Cloudflare DNS zone and Email Routing settings. Record existing MX and TXT values privately.
2. Attach `presencewebservices.co.uk` and `www.presencewebservices.co.uk` to this **same** Sites project using native custom-domain settings. Copy every exact host/type/value and validation record returned by the provider.
3. In the existing Cloudflare zone, add or change **only** the web A/AAAA/CNAME records and provider validation records specifically required. Resolve conflicting old web records deliberately. Follow provider guidance on Cloudflare proxy status and apex support. Keep existing nameservers.
4. Preserve every functioning Email Routing MX/SPF/DKIM/DMARC record. Do not replace the TXT/SPF value with a second SPF record or merge it by guesswork. A host-verification TXT is separate from email authentication.
5. Wait for provider hostname validation and certificate issuance. Use refresh status, then test apex/www over HTTP/HTTPS, certificate names/expiry, redirect chain and final 200, real 404 and absence of loops.
6. Finish legal facts, trademark approval, provider/retention decisions and business.launchReady. Build the approved production artifact; configure approved runtime stage/retention/public flag. Deploy privately and review before changing the platform audience to public, as explicitly authorised by the owner.
7. Verify public form receipt and owner isolation from a fresh anonymous browser. Check canonical/OG URLs, robots allowing production, populated sitemap, no staging meta/header noindex and confirmation/404 exclusion. Re-test inbound email forwarding with a dummy message. Roll back or disable submissions if any gate fails.

These production steps are instructions, not completed actions. Domain resolution, certificates, redirects and forwarding after changes remain unverified.

## Search Console

In Google Search Console add a **Domain** property for `presencewebservices.co.uk` using the owner's account. Copy its unique TXT verification value to the existing Cloudflare zone at the exact host Google gives. Leave that TXT in place after verification. Verify ownership, submit `https://presencewebservices.co.uk/sitemap.xml`, inspect the homepage/service/pricing URLs and check the rendered canonical/indexing results. Do not submit the staging hostname. Adding a Domain property does not guarantee indexing. Official instructions: https://support.google.com/webmasters/answer/9008080?hl=en.

## Rollback, migrations and recovery

Keep the previous saved version and exact source SHA. If code fails, redeploy the last compatible version through the same private workflow, preserving access settings and runtime revision. Do not change DNS as an initial code rollback. Disable `ENQUIRIES_ENABLED` and redeploy if storage integrity or abuse is uncertain.

Generate new SQL with `npm run db:generate` after editing `db/schema.ts`; inspect and commit SQL, snapshots and journal. The original `migrations/0001_enquiries.sql` is retained as an immutable local prototype record; it was not applied by hosted Sites. `drizzle/` is the active migration directory. Migrations are append-only. Applied SQL is immutable. A failed deploy may already have applied migrations: inspect schema/migration status before retrying. Do not repeat destructive SQL or assume code rollback undoes database changes. Add backward-compatible columns/tables first; backfill separately with an approved plan, then remove old fields in a later release. Back up and verify restore in a separate test database before destructive work. Production backup/export and restore permissions/retention are provider-dependent and still require an owner-verified drill. See OPERATIONS.md.
