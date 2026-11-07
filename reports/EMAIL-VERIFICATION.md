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

## Deployed result

- Private Sites version **10** deployed successfully, deployment `appgdep_6aee6adee2bc8191b541f2c726432079`, environment revision 1.
- URL: https://presence-private-preview-4nov-c73a.ojburnsey.chatgpt.site/ . Fresh native access inspection confirms custom access, one owner and no groups.
- Saved version: `appgprj_6aebc28289908191851ee53a5b25c1a9~appgver_fd22e739556c81918d214c188fe293be`; Sites source `40dc34898c00030961876125e783735a1a52a8af`, matching GitHub application source at `ea17c37253c55ec9c5968d8a91a20dedc64e01b4`.
- Protected native D1 inspection confirms notify_status and confirm_status were added to the existing enquiry table. Existing enquiries were preserved; no record was deleted during verification.
- A fresh post-deployment runtime-settings check still has no RESEND_API_KEY entry. Email sending remains disabled. No real delivery or forwarding receipt is claimed.
- This later documentation update does not change the deployed application. All required code and locally testable checks are complete; the remaining email setup and network/inbox checks require owner/account access.

## Sender secret activated: 7 November 2026

The owner reported completing the sender setup. Native Sites settings now confirm RESEND_API_KEY is present as a secret (its value was not read or printed), runtime revision 3. Version 10 was redeployed successfully as deployment `appgdep_6aee70af35988191ad03f1319bfb7ab5`, applying revision 3. The site remains owner-only, staging and not approved for public launch.

The initial post-activation database check found two older enquiries, both without recorded email statuses; they predate this activation. No existing enquiry was deleted or resent. A fresh owner-browser submission has been requested because the workspace still cannot reach the private hostname (proxy CONNECT 403). Live provider acceptance and inbox delivery remain pending that fresh test; the earlier missing-key finding is historical and is now resolved.
