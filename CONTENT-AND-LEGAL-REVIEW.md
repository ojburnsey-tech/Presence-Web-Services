# Content and legal review — 6 November 2026

This records the implemented wording and remaining decisions. It is not legal certification or trademark clearance.

## Confirmed and used

- Brand/business name: Presence Web Services, explicitly confirmed by owner.
- Contact: contact@presencewebservices.co.uk, explicitly confirmed.
- Intended production origin: https://presencewebservices.co.uk.
- Inbound Cloudflare Email Routing forwards to the owner's personal Gmail inbox; successful forwarding is owner-reported. No outbound mailbox/SMTP or form email integration has been verified.
- Northern Ireland and wider UK audience. No fictional office address or Google Business Profile eligibility is claimed.
- New independent business: no customers, testimonials, staff, years of experience, credentials or commercial results are invented.
- One-off improvements from £249, ongoing from £179/month; full websites separately quoted. No invented minimum term, setup fee, cancellation policy or unlimited development.
- Free audit: thorough within publicly available information, manual assessment, no account access, no invasive testing, no guarantee of results or obligation to buy.

The homepage states the actual paid services early, then explains the enquiry process and indicative prices. Services, Pricing and About retain distinct content. The illustrative audit is explicitly labelled “Illustrative example. Not a client project.” No invented percentages or before/after customer claims appear. Paid work requires an individual written proposal. The terms describe website use and the audit; they are not a complete client-services contract.

## Data map

| Data                                                             | Purpose / basis to confirm                                                                                                      | System / access                                                                         | Retention                                                 |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| Required name, business, email, goal                             | Respond and assess requested work; pre-contract steps for personal enquiries, legitimate interests for organisational enquiries | Sites managed Cloudflare D1; separate owner bearer API or authenticated native settings | Staging one-day expiry; production owner decision pending |
| Optional website/Google URL, location, phone, service preference | Identify public business information and suitable support                                                                       | Same D1 record; URLs are not fetched by the application                                 | Same                                                      |
| Keyed IP rate hash, time window, attempt count                   | Protect the service, legitimate interests subject to assessment                                                                 | D1 rate table, no raw IP in enquiry record                                              | Purged on activity/owner purge after one day              |
| Opaque receipt ID, expiry, HMAC signature                        | Show genuine confirmation after save                                                                                            | Essential HttpOnly SameSite=Lax cookie, Secure over HTTPS                               | Ten minutes                                               |
| Direct email correspondence                                      | Respond to direct messages/rights requests                                                                                      | Cloudflare forwarding to Gmail; inbox owner                                             | Owner schedule pending, separate deletion from database   |
| Host access/authentication logs/cookies                          | Hosting and private sign-in security                                                                                            | Provider controlled; not an app enquiry log                                             | Provider terms/settings must be verified                  |

No marketing consent is bundled into an enquiry. No analytics, advertising cookies or browser PII storage. A decorative cookie banner has not been added. No automated decision-making with significant effects is claimed. Enquiry data is never rendered publicly. Owner JSON must be handled as personal data, not pasted into public issue trackers.

The privacy page has been changed from the obsolete Netlify proposal to the Sites/D1/Gmail arrangement and clearly marked as a private-test draft. It states that production retention and contractual roles/transfer safeguards still require confirmation. It does not promise UK-only hosting or instant deletion from backups. Form receipt is not email delivery.

## Release decisions still required

1. **Trading structure and legal controller identity.** Confirm sole-trader versus incorporated status. A trading name confirmation does not establish a sole trader's personal legal identity or a registered company identity. If sole trader, confirm the appropriate own-name disclosure and lawful geographic/correspondence address for publication. If incorporated, provide verified company details and registered-office disclosures as applicable. No personal details have been inferred from GitHub/account names.
2. **Address and contact disclosures.** Supply the legally appropriate address and confirm the website disclosure wording for the actual structure. Do not invent an office, company number, VAT number or telephone.
3. **Tax/pricing treatment.** Confirm VAT status and the wording needed so indicative pricing is accurate. The website makes no claim of VAT registration/exemption. Client quotes must state tax treatment.
4. **Retention and deletion.** Approve a justified production period or criteria, configure the matching retention days, define purge frequency and email/backup treatment. The one-day test expiry is not a production business policy.
5. **Provider arrangements.** Review OpenAI/Sites, Cloudflare and Google contractual roles, applicable terms, locations, subprocessors and UK transfer safeguards. Confirm managed D1 backup/recovery access and lifecycle. Do not assume owning a Cloudflare DNS zone grants access to a Sites-managed database.
6. **Lawful bases and rights workflow.** Confirm the documented pre-contract/legitimate-interest assessment, a working privacy contact, proportional identity checking, response handling and any ICO fee/registration assessment that applies.
7. **Name/trademark clearance.** Owner must confirm the preliminary checks and accept the name risk; brand confirmation is not evidence of a completed register search or legal clearance.
8. **Paid-service agreement.** Approve parties, scope, IP/handover, delegated access, fees/tax, cancellation/payment, liability and complaint terms suitable for the actual business and relevant jurisdiction. Do not treat website terms as that agreement.
9. **Public launch and domain changes.** Explicit approval is still required. Current draft language/noindex/private restrictions must be reviewed before public release, and final policy wording must describe verified live infrastructure.

## Authoritative sources checked

Accessed 6 November 2026; source requirements must be interpreted for the actual trading structure. Some ICO page fetches return 403; its indexed current guidance was available. UK guidance is being updated after the Data (Use and Access) Act 2025; recheck at launch.

- GOV.UK, choosing a sole-trader business name and official paperwork: https://www.gov.uk/become-sole-trader/choose-your-business-name.
- Northern Ireland business website disclosures: https://www.nibusinessinfo.co.uk/content/business-websites-legal-requirements. Distinguish registered-company specifics from general online-business obligations.
- ICO privacy information, including identity, recipients, retention periods or decision criteria, rights and complaints: https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/individual-rights/the-right-to-be-informed/what-privacy-information-should-we-provide/?q=consent.
- ICO lawful basis: https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/lawful-basis/a-guide-to-lawful-basis/.
- ICO storage limitation: https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/data-protection-principles/a-guide-to-the-data-protection-principles/storage-limitation/.
- GOV.UK responding to data-protection requests: https://www.gov.uk/respond-data-protection-request.
- Cloudflare distinguishes inbound routing from outbound sending: https://developers.cloudflare.com/email-service/.

No claim of legal compliance, name availability, completed ICO registration or professional legal approval has been made.
