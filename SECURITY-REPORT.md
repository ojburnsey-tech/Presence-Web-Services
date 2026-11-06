# Security assessment — 6 November 2026

Scope: authored Astro pages, browser scripts, Worker API, SQL migration, local SQLite adapter, dependency lockfile, packaging and existing Sites access configuration. This is a proportionate engineering assessment, not a penetration test, full ASVS certification or guarantee of no vulnerabilities. Hosted data-path tests are separately gated by actual deployment and network access.

## Threat model

An anonymous visitor may view public content and submit an enquiry after approved public launch; staging remains owner-only at the hosting layer. Untrusted strings cross browser → Worker → D1. Business URLs remain strings; the server never fetches them. A separate high-entropy bearer grants owner list/delete/purge access. Hosting administrators, runtime secret storage, D1 and source repositories are trusted dependencies. A guessed business email, supplied user ID, browser-only state or guessed record ID does not grant owner access.

Attackers could submit spam, oversized/invalid data, scripts/SQL-like strings, replay requests, guess owner routes, forge origins, steal secrets, cause unavailable storage, or exploit caching/deployment errors. There is no upload, checkout, visitor account system, user-defined command execution or server-side remote URL fetch.

## Findings and retests

| ID | Severity | Evidence / affected surface | Treatment | Retest / uncertainty |
| --- | --- | --- | --- | --- |
| S01 | P0 | Native Sites access reported public despite private requirement | Restored custom access: owner only, no groups | Native settings confirmed; preserve for every release |
| S02 | P0 | Old contact form had no Sites receiver/storage | Parameterised D1 API with durable insert/read-back; genuine 201/303 only after save | SQLite restart, native/enhanced browser and failure tests pass; hosted D1 acceptance still required |
| S03 | P0 | Stored enquiries require explicit server authorisation | Separate random owner runtime token, constant-length digest comparison; no anonymous list/update/delete | Wrong/missing/forged-ID owner access 401, bounded pagination, ID deletion, CSRF checks tested locally |
| S04 | P1 | Missing backend validation/abuse controls | 64 KiB streaming body cap, string/field/enum allowlist, NFC, control/length/email/URL checks, honeypot, IP-HMAC rate windows | Malformed/duplicate URL-encoded fields, unsafe URLs, long values, honeypot and sixth distinct request tested |
| S05 | P1 | Retry/double-click could duplicate or falsely confirm | Request key plus atomic SQL payload deduplication; pending button lock, retry key retained in memory, signed receipt cookie | Concurrent requests save one row; conflicting key 409; network/503 preserve form, direct/tampered/expired receipt neutral |
| S06 | P1 | Netlify-only headers ineffective on Sites | Runtime self-only CSP, frame denial, nosniff, referrer/permissions policy, HTTPS HSTS | Header assertions; real Chromium reports no page/CSP errors; hosted headers unverified until reachable |
| S07 | P1 | Unconfirmed public configuration/domain | Source build flag plus runtime launch approval; production fails closed, fixed HTTPS apex redirect | Tests cover denied production and constant-host redirect; DNS/TLS not verified |
| S08 | P1 | Obsolete privacy workflow/unknown retention | Provider-aligned draft, one-day dummy expiry, protected purge/delete; production needs explicit retention | Local expiry/purge tests pass; owner policy/provider backup lifecycle pending |
| S09 | P1 | Incomplete source recovery | Full source/lockfile/docs prepared, exclude PII/secrets/build data; retain prior Sites version | Private remote and export status recorded in release/test report |
| S10 | P2 | Browser-native dialog Tab could reach browser chrome/body | Explicit first/last Tab/Shift-Tab wrapping, native inert modal, focus restore | Real Chromium focus/reversal/reduced-motion journeys pass |

## Controls reviewed

- **XSS / injection:** Astro escapes page content; no user enquiry is inserted into public HTML. Error HTML escapes static field labels/messages. Dynamic browser errors and chooser content use textContent/createElement. Owner records are application/json with nosniff and no-store. SQL values are bound; table/column names are fixed. HTML and SQL attack strings persisted literally in a dummy row without execution. No eval of user input, command execution or public source maps.
- **URLs / redirects / SSRF:** http/https only, reject credentials and common local hosts, strip fragments, length limits. URLs are not fetched; no SSRF request path exists. These checks are not a general-purpose private-network filter and must be redesigned before any future URL fetch. Success redirects are a fixed local path. Production redirect uses a constant HTTPS origin.
- **Access / IDOR:** every owner endpoint verifies the separate server token before database use. No public read or update endpoint. Public submission replies omit row IDs/details. Owner API is bounded and no-store. Static asset lookup is a generated allowlist; .env/source/backup paths return 404. All hosting/viewer roles must remain least privilege.
- **Secrets:** APP_SECRET and OWNER_REVIEW_TOKEN are runtime secret entries, absent from public build/manifest/source. Local-only dummy credentials are explicitly labelled and bind to loopback. Native repository credentials remain session memory/stdin only. Do not store PII exports in Git.
- **Transport / browser:** CSP default/script/style/connect/form self only, no unsafe-inline or wildcard; object/base/frame restrictions. HSTS on HTTPS only, no preload/includeSubDomains while broader domain state is unverified. No CORS grants or third-party scripts. Signed ten-minute receipt cookie is HttpOnly/SameSite=Lax/Secure on HTTPS; it contains no enquiry fields.
- **Abuse / availability:** 5 distinct accepted-attempt requests/minute and 20/hour per provider-supplied IP hash; native retries deduplicated. Idempotent committed retries can bypass the new-write counter but still perform bounded reads. Honeypot, body cap and validation help simple abuse, not distributed botnets. No captcha or paid WAF has been configured. D1/provider quotas can return 503 honestly. Malformed requests are rejected before D1; edge-level volume controls remain operational.
- **Data lifecycle:** no enquiry body logging, no marketing list, no browser PII storage, no notification copies. Purge is activity/manual driven, not a scheduled guarantee. Retention/backups and host logs need owner approval.
- **Dependencies:** npm audit reports zero known vulnerabilities in production and full development trees at the recorded run. Reproducible lockfile retained. Audit coverage is advisory-based and does not prove absence of vulnerabilities. No UI framework, ORM or third-party backend added; esbuild bundles the Worker, Node SQLite supplies test persistence.

## OWASP mapping

Reviewed against relevant OWASP Top 10 risk themes: broken access control, injection, cryptographic failures, insecure design, misconfiguration, vulnerable components, authentication, integrity, logging/monitoring and SSRF. There is no visitor password/session-login system to assess; hosting account authentication and secret custody remain provider/operator responsibilities.

Applicable ASVS 5.0 areas considered: V1 encoding/sanitisation, V2 validation/business logic, V3 web frontend security, V4 API/web services, V8 authorisation, V11 cryptography, V12 secure communication, V13 configuration, V14 data protection, V15 architecture and V16 logging/error handling. Receipt state is limited to confirmation and grants no record access. No claim of complete requirement-by-requirement compliance or an ASVS level is made.

Sources: https://asvs.owasp.org/ (stable 5.0.0, May 2025), https://github.com/OWASP/ASVS/tree/v5.0.0, https://owasp.org/www-project-top-ten/. Version checked 6 November 2026.

## Residual release blockers

Hosted D1 migration/persistence and anonymous-vs-owner isolation must be verified, not inferred from local SQLite. Network policy currently blocks direct staging/domain access. Firefox/WebKit downloads are blocked; real Safari/screen-reader use remains unverified. Production DNS/TLS, provider backups/restore, legal identity/address, retention, provider terms/name clearance and public approval remain gates. No known unresolved critical/high application exploit was identified in tested local paths, but those limits prevent a blanket security or launch-ready claim.
