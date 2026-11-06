# Release record — 6 November 2026

## Recovery

Original Sites recovery point: version 4, static source `00b560a04784226bb3e1044d6ce3ea2e667892aa`. It has no working form; rollback to it is a preview-only fallback, not a working enquiry service. Database changes are not undone by a code rollback.

## Verified native hosting

- Access restored from public to custom, one allowed owner, no groups. Rechecked before private deployment.
- Version 5 saved separately before deploying. It provisioned D1 but did not apply the prototype migration; no hosted receipt was claimed.
- Version 6 source: `f2ed17b5901bf45b959e0452fda5cb54549e05e0`.
- Saved version ID: `appgprj_6aebc28289908191851ee53a5b25c1a9~appgver_4946f39f6618819190bc3f70eec6366e`.
- Deployment: `appgdep_6aed252325a88191bf78323644b5603e`, succeeded 6 November 2026, runtime environment revision 1.
- URL: https://presence-private-preview-4nov-c73a.ojburnsey.chatgpt.site/ (owner-only).
- `.openai/hosting.json` uses logical `d1: "DB"`; the supported archive entrypoint is `dist/server/index.js`. Generated Drizzle SQL, snapshots and journal are in artifact-root `drizzle/`.
- Native schema overview confirms `DB`, `enquiries`, `enquiry_rate_limits`. Native protected table read confirms expected enquiry columns and zero rows. This verifies migrations, not POST acceptance.
- Runtime APP_SECRET and separate OWNER_REVIEW_TOKEN stored as secrets; intake enabled for dummy staging only. Public launch runtime flag false. Secret values are not in source or this report.

## Local verification

- Clean npm ci from lockfile, build, strict types, lint and 33 automated test groups passed.
- 20 real Chromium desktop/mobile journeys passed; final repeated run recorded in TEST-REPORT.md.
- 90 layout/reflow checks, zero overflow; 18 rendered axe runs, zero violations; no page/CSP errors.
- Mobile/desktop Lighthouse: Performance 100, Accessibility 100, Best Practices 100, SEO 63 (intentional staging block). Lab LCP 0.9s/0.2s; CLS 0/0; TBT 0ms/0ms. No field INP.
- Full/production npm audit: zero known vulnerabilities, including after the Drizzle esbuild override. Drizzle schema generation retest reports no changes.
- Screenshots captured for all nine routes, mobile/desktop and forced-colors/menu; representative page captures visually reviewed.

## External limits

Official Firefox and WebKit downloads fail with proxy 403 Domain forbidden. Direct preview curl fails proxy CONNECT 403; Node verification fails DNS EAI_AGAIN before reaching the origin. No hosted dummy submission, confirmation, owner HTTP isolation or deletion was verified. No notifications or SMTP configured. Domain list empty; no DNS/Email Routing changes made. Production DNS/TLS and forwarding after launch remain owner acceptance steps.

## Independent source recovery

Existing private GitHub repository reused: https://github.com/ojburnsey-tech/Presence-Web-Services/tree/release/production-readiness. Full authored source, lockfile, tests, migrations, documentation and screenshots are backed up on that release branch, preserving main. No new duplicate repository or automatic paid CI workflow was created. A fresh source ZIP is generated under ignored work/ after final checks.

Current status: BLOCKED for public launch by hosted HTTP verification, cross-engine browser checks, production domain/TLS, legal identity/address/tax, retention/provider arrangements, name clearance and explicit public approval. Private review remains available. The final small-copy/field-feedback candidate and exact saved deployment will be appended after native completion.

## Final private candidate

- Saved **version 7** before publication, source `5e2b8cc43c58079ee4ceac48b040342632085e9b`.
- Version ID: `appgprj_6aebc28289908191851ee53a5b25c1a9~appgver_b5f7d8622a68819183a2b36e53a923cf`.
- Deployment ID: `appgdep_6aed2702fcc881918a40856a09aa34d4`, succeeded at 2026-11-06 01:02:06 UTC, environment revision 1.
- Private URL unchanged; platform owner-only enforcement succeeded.
- Final clean-install checks: types/lint/build/format all pass, 33 automated groups pass, 20 Chromium desktop/mobile journeys pass, repeated 90 reflow/18 rendered axe runs pass.
- GitHub release branch contains the complete matching implementation and later documentation/evidence updates. Published Worker remains version 7; a later documentation commit is not another application release.
- Source ZIP: ignored `work/Presence-Web-Services.zip`, generated from committed source. Deployment archive: ignored `work/presence-worker-candidate.tar.gz`, matching the saved version 7 source/build.
- Public launch status remains **BLOCKED** for the external gates above. No public audience change, domain attachment, web DNS/email routing edit, paid subscription or outgoing-email integration was performed.
