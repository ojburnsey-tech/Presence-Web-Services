# Initial audit: 6 November 2026

Assessment of the accessible Astro source and existing Sites project, before implementation. No professional penetration test or rendered visual review has been performed.

## Keep

The nine static Astro routes, existing wordmark/palette, restrained service descriptions, indicative £149/£129 pricing, separate service/pricing/about content, accessible native disclosure controls, menu spring/focus handling, static metadata and minimal dependencies are useful. Source is available in /workspace/Presence-Web-Services; the Sites checkout currently contains generated static output.

## Findings

| ID | Severity | Evidence / consequence | Planned treatment |
| --- | --- | --- | --- |
| A01 | P0 | Sites get_site reported access_mode public, contrary to the requested private release state | Restored custom owner-only access with no groups; retain private publication |
| A02 | P0 | Contact frontmatter enables submission only for NETLIFY=true; the Sites snapshot has no server handler or durable enquiry storage | Add hosting-aware server validation, persistence, error/success responses and a protected owner workflow |
| A03 | P0 | Legal name/status/address, VAT treatment, retention decision and trademark clearance are not confirmed | Explicit external release gates; no fabricated information |
| A04 | P0 | No approved or verified public deployment at the supplied production domain | Prepare one hosting route; do not alter DNS, nameservers or email records |
| A05 | P1 | Browser preview relay unavailable; no browser control tool exposed; prior tests are jsdom/HTML checks | Attempt existing Playwright runner, record actual limitations; do not invent viewport, accessibility or performance results |
| A06 | P1 | Form lacks server-side length/URL/enum checks, retry/idempotency handling, rate limiting and real confirmation on Sites | Implement and test server boundaries, failure preservation and confirmed receipts |
| A07 | P1 | Security headers exist only in netlify.toml; they are not an effective Sites Worker policy | Apply and test runtime response headers, avoiding inline script/style permissions |
| A08 | P1 | Privacy policy describes Netlify and omits the now-confirmed Cloudflare Email Routing to Google Gmail arrangement | Draft policy aligned with the selected runtime and actual inbound routing; final legal review remains blocked |
| A09 | P2 | Paid services and commercial arrangements are below the audit-focused opening | Keep compact audit hero and logo placement; make paid services clear early with concise process/pricing/FAQ context |
| A10 | P2 | No interactive service-selection guide; existing audit example is an accessible single disclosure | Add a small useful chooser; refine the labelled example without fictional results |
| A11 | P1 | Local repository contains most source untracked; origin is the existing GitHub repository | Back up first, commit complete source, verify remote privacy/access; export if remote write is unavailable |
| A12 | P1 | Contact address and production origin supplied by owner are not in configuration | Add confirmed email and gated production origin without treating the domain as approved/live |

## Limits

Current visual state was assessed from source and prior owner-provided screenshot; no current rendered screenshot is available. Existing email forwarding is owner-reported verified. DNS/TLS, outbound mail, real hosted persistence and anonymous-versus-owner behaviour require independent checks. A passing package audit will not establish absence of vulnerabilities.
