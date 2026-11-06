# Costs — 6 November 2026

No paid service, subscription upgrade, domain purchase or external email account was ordered. No paid observability, captcha, SMTP, analytics, stock assets, fonts or UI library was added. Existing Sites hosting is the selected route; no second Netlify deployment is planned.

| Item | Current position | Possible future cost / owner action |
| --- | --- | --- |
| Existing domain | Already owned/configured, amount not supplied | Registrar renewal billed on its existing plan; check renewal date/price |
| Sites hosting + managed Worker/D1 | Uses existing platform; its account-specific entitlement/billing was not exposed | Verify quota, limits, custom-domain entitlement and billing controls in owner settings; no guarantee of free forever |
| Direct Cloudflare D1 tariff | Reference only, not proof of the Sites-managed account plan | Official Free allowance: 5m rows read/day, 100k written/day, 5GB total; exceeding Free limits rejects queries. Paid overages differ; do not enable a paid plan without approval |
| Cloudflare inbound Email Routing | Existing forwarding works per owner | Routing supports Free/Paid; current account bill not inspected. No outbound service assumed |
| Gmail | Owner's existing destination | No Google Workspace purchase or send-as setup performed |
| Form notifications | Not installed; owner reviews database | Optional future transactional sender may charge and requires separate setup/consent |
| Private GitHub source | Existing private repository reused | Private Actions/storage overages can cost; no automatic paid CI runs introduced |
| Monitoring/backups | Manual/native process documented | Provider quota/export/backup entitlements require confirmation; optional paid tools need approval |
| Development/test tools | Open-source local dev dependencies | No runtime per-enquiry fee charged by this code; provider usage still applies |

D1 queries include rate-counter writes, deduplication and purge work; do not estimate usage as exactly one write per enquiry. Index maintenance also counts. Distributed spam can consume capacity even without legitimate submissions. Monitor provider usage and fail safely at limits.

Current official reference (checked 6 November 2026): https://developers.cloudflare.com/d1/platform/pricing/. Its direct Cloudflare Workers tariff is not an account-specific Sites quote. Paid D1 lists included allowances and storage/query overages; review the live provider page before any paid decision. Inbound routing and outbound sending are distinct capabilities: https://developers.cloudflare.com/email-service/.

Exact one-off setup expenditure: none authorised through this task. Exact recurring total: cannot be verified from available account billing. Owner must review existing domain, hosting, storage and email costs before launch.
