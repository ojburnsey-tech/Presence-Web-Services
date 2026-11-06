# Operating Presence

## Enquiries

No email notifications or SMTP integration are enabled. A saved request lives in D1. Cloudflare's inbound email forwarding to Gmail is separate and does not automatically receive form submissions. Review enquiries regularly through the authenticated Sites Settings database viewer or the protected owner API. Do not rely on an email arriving.

Owner API (HTTPS only remotely):

- `GET /api/owner/enquiries?limit=25`: latest non-expired enquiries, at most 100 per page. Continue with the returned `nextCursor` as `before`. The response contains personal information; never publish it or put it in reports.
- `DELETE /api/owner/enquiries/<id>`: deletes one row; 204 if removed, 404 if absent.
- `POST /api/owner/purge`: removes expired enquiries and old rate counters.

All require `Authorization: Bearer <OWNER_REVIEW_TOKEN>`. The token is a separate server runtime secret, not an email address or browser account ID. Platform sign-in alone does not grant API access. Do not put the token in a query string, browser script, source, screenshots, command history or shared files. Set/rotate your own high-entropy value in Sites runtime settings and redeploy. If lost, rotate it; do not weaken authorisation. Native database settings are protected by the owner's Sites account.

For scripted access use `node scripts/owner.mjs list|delete|purge` with token supplied through the hidden terminal prompt. `PRESENCE_SITE_ORIGIN` selects the exact site (defaults to the private preview). Private staging may additionally require supported Sites service access; the CLI supports `PRESENCE_SITE_SERVICE_TOKEN` from a secure environment. Never use a bypass token with another host. The CLI does not configure platform permissions. The workspace network policy must permit the hostname.

The selected staging expiry is one day, for dummy data only. Production cannot accept submissions without an explicit positive retention setting. Publish the approved period in the privacy notice and configure the same value at runtime. Expiry is checked/purged on submission and owner access; there is **no scheduled job**. Run owner purge at an agreed regular interval. Deletion from the active database does not erase provider backups immediately; confirm provider backup lifecycle. Rate hashes expire through purge after one day. No raw IP is stored in an enquiry row; host infrastructure may maintain separate logs.

For a correction request, verify the person proportionately through existing correspondence, locate the row privately, record the correction securely, and delete the original if appropriate; no public update endpoint exists. Handle access/erasure requests within applicable legal time limits, including relevant Gmail correspondence and backup handling. Do not request identity documents through this form.

## Content and pricing

Edit `src/config/business.ts` for prices, services and confirmed identity. Edit individual `.astro` pages for their own content. Keep legal facts empty until confirmed. The service chooser reads the same shared prices. Preserve the illustrative-example label. No paid work begins through the form; written proposals must confirm scope, tax, payment, ownership and cancellation arrangements.

## Monitoring and incident response

No external paid monitoring service is installed. Native deployment status and runtime events are available through Sites. The application never logs enquiry bodies; errors return a generic message. Restrict access to infrastructure logs and avoid adding personal details to them.

- After each release: check /api/health, nine routes, menu, headers and a dummy submit/read/delete journey. A healthy page alone does not prove the form works.
- During business use: review stored enquiries and spam regularly. Periodically run a dummy request, independently verify receipt and remove it. Choose a sustainable frequency before launch.
- For a failed deployment: read the platform error, check schema/env compatibility, retain the last working version; do not repeatedly deploy unchanged input.
- For broken form/storage: disable enquiries, deploy that setting, confirm users get an unavailable message and can email. Investigate platform limits/status/configuration; re-enable only after persistence and owner access pass.
- For abuse: inspect aggregate rates without exporting legitimate enquiries, reduce traffic with provider-supported controls if authorised, disable intake if necessary, rotate exposed credentials and assess whether any personal information was accessed. Existing per-IP limits/honeypot reduce simple abuse; they do not prevent distributed attacks.
- For a privacy incident: contain access, preserve minimal evidence, assess UK reporting/notification duties and seek appropriate advice. Do not claim no breach without evidence.
- Monthly or after advisories: npm audit, review Astro/Node support, update lockfile in a branch, then all checks/browser journeys before release. minimatch 11.0.4 and the shared esbuild override fix earlier toolchain advisories; revisit them when upstream resolves the transitive dependencies.
- Track registrar/domain renewal and billing contacts. Check certificate renewal/expiry and routing periodically; hosting-managed issuance is not a permanent verification.

## Backups and restore

Full source and lockfile belong in the existing private GitHub repository; no PII/secrets/databases. Retain source commits and saved Sites versions. Export a source ZIP excluding .git/node_modules/work/.env/database files.

D1 data backup access is separate from source. Confirm what Sites exposes for backup/export and recovery before collecting production enquiries. If the owner has direct Cloudflare D1 access, use provider-supported export/Time Travel in the correct account; do not invent credentials or assume the managed database is in your own zone account. Encrypt exports, restrict access, keep them outside Git, apply an approved backup retention period and log deletions without copying enquiry content. Restore a dummy export to a separate private test database and verify counts/field values/owner isolation before calling recovery proven. A code rollback does not restore deleted rows. The provider backup/restore drill remains a launch action until verified.

Official D1 backup documentation: https://developers.cloudflare.com/d1/reference/time-travel/.

## Hosted acceptance script

`node scripts/verify-hosted.mjs` performs a dummy save, independently reads it through the owner API, verifies duplicate/confirmation/error/header behaviour and deletes that exact dummy record. Supply credentials through its hidden JSON stdin prompt (keys `owner` and optional private `service`) or a secure environment using `PRESENCE_OWNER_TOKEN` / `PRESENCE_SITE_SERVICE_TOKEN`. It is restricted to the exact private preview hostname. It never prints credentials or enquiry fields. The resulting report contains only check labels, not PII. The workspace needs approved network access to that host. If a run stops after a save but before cleanup, remove the matching “Presence release test only” dummy record through owner review; staging expiry also applies.
