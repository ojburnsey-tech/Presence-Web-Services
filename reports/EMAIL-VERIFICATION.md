# Sites enquiry email verification

## Implementation and source

PR #3 was merged into main as `6801197648bf922f1be5f92d612e5aa3d25c3300`. It contains the latest owner review changes, the Inter asset fix and the Resend integration. Follow-up verification corrected the confirmation page's outdated claim that no email was sent, clarified that database expiry does not delete inbox copies, and added the required test phone number to the hosted test script.

The Worker receives its execution context and uses `ctx.waitUntil` to finish delivery after the enquiry response. New requests are saved first. Owner alerts go to contact@presencewebservices.co.uk; fixed-content customer confirmations go to the submitted address, capped at two per address per day. Inputs are escaped and delivery uses provider idempotency keys. Provider failures do not remove the saved enquiry. Private preview access and public launch guards are preserved.

## Checks actually completed

- Astro checks, strict TypeScript, lint and full Worker build pass.
- All 41 automated test groups pass, including actual SQLite persistence and mocked Resend API behaviour.
- Email tests cover a missing API key, owner/customer payloads, escaping, Reply-To, duplicates, provider failure, recipient daily limits and Worker background completion through waitUntil.
- The Worker artifact includes the email implementation and the additive migration for notify_status and confirm_status. Hosted application and schema state must be recorded after deployment; build success alone is insufficient.
- Native Sites runtime settings contain APP_SECRET, OWNER_REVIEW_TOKEN, DEPLOYMENT_STAGE, ENQUIRIES_ENABLED and PUBLIC_LAUNCH_APPROVED. RESEND_API_KEY was absent at the check. Existing secret values were not retrieved or printed.
- Direct HTTPS access to the private preview fails at the workspace proxy with CONNECT 403, before the application receives a request. Public DNS lookups from this workspace are also unavailable.
- The installed Cloudflare workflow skill was read, but no Cloudflare account API or browser-control tools are exposed in this session. No authenticated DNS/account verification was performed.

## What is not verified

No real Resend send, sender-domain verification, provider delivery event, customer inbox receipt or Cloudflare-to-Gmail forwarding receipt was confirmed in this work. Mocked tests establish code behaviour, not live delivery. A sent provider status means acceptance by Resend, not final inbox delivery. Existing inbound forwarding was previously owner-reported as working; that is not a new independent test.

## Required setup and end-to-end check

1. In Resend, add and verify `mail.presencewebservices.co.uk`. Copy the exact DNS records supplied by that account to Cloudflare. Do not guess their values, enable receiving on the existing contact domain or replace the functioning apex MX/SPF/DKIM/DMARC records.
2. Create a sending-only key restricted to the verified domain. Add it as the secret `RESEND_API_KEY` in this Site's runtime environment settings; do not put it in chat, Git, the manifest or browser code. No API key was requested through chat.
3. Redeploy a saved private Sites version to apply the new runtime revision. Keep DEPLOYMENT_STAGE=staging and PUBLIC_LAUNCH_APPROVED=false for this test. Production retention settings and public release remain separate decisions.
4. Allow the exact private preview hostname through the workspace network policy, or test from the owner's signed-in browser. Submit dummy business details with an inbox the owner controls and a valid test phone number. Do not use a real prospect's address.
5. Confirm the saved row and both email statuses through protected owner access. Verify both messages in Resend's delivery log and the intended inbox, including spam. Test that the owner alert reaches Gmail via contact@ forwarding and that Reply targets the customer address correctly.
6. Remove the dummy record and handle test email copies separately. Record the observed results before claiming live verification.

No public publication, DNS edits, forwarding changes, paid account upgrades or real-customer messages were performed. See DEPLOYMENT.md under Enquiry emails (Resend) for the full operator setup.

Official references checked: https://resend.com/docs/send-with-cloudflare-workers and https://resend.com/docs/guides/dns/cloudflare. These support the Worker/API and DNS setup; they do not establish this account's configuration.
