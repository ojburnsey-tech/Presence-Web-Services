> Historical design notes. Deployment instructions here are superseded by ../DEPLOYMENT.md.

# Unslop pass, 6 November 2026

A second pass removed the generic treatments the first redesign had introduced, keeping all substantive content.

- **Structure.** The centred hero with two calls to action becomes the proposition beside the illustrative audit note, which is the first thing Presence actually delivers. One call to action. The heading-left, content-right template that repeated on seven sections is gone; each section now uses the shape of its content: term-and-explanation rows, a services index, a right-aligned price list, prose, or disclosures.
- **Pricing.** The three bordered, shadowed cards become a single comparison whose rows align across plans (CSS subgrid), so prices and actions line up.
- **System.** Removed the alternating tinted bands, the automatic rules between sections, ink top-rules on equal columns, card shadows, pill-shaped jump links and the hover-nudging chevron. The accent is limited to hover and focus states, the wordmark dot, the current menu item and the contact page's real three-step sequence. Ticks now mark only what a price includes; task lists use plain bullets.
- **Copy.** Slogan-fragment headings ("One person, start to finish.", "Clear prices, agreed in writing.") become plain labels. Removed the eyebrow that repeated the contact heading, the form heading that repeated the page title, the second "illustrative" disclaimer and the menu's repeated reassurance line.
- **Kept, with reason.** The owner's palette (#282828, #D77555, warm white) and wordmark are specified brand assets. The translucent header expresses a real layer: content scrolls beneath it. The menu drawer keeps its scrim and shadow because it is modal. Pill buttons remain because they are controls. The 1-2-3 numbering on the contact page is a real sequence.

All suites pass: 34 site tests, 14 server tests, 22 Chromium browser journeys. Rendered at 320, 375, 390, 768, 1024, 1440 and 1920px with no horizontal overflow, including the phone menu with reduced motion.

# Company-site refinement, 6 November 2026

The owner asked for the site to read as an established company rather than a first draft, using the Apple design skill, with no AI-template signals. Owner decisions recorded before work began: name the founder with a real photo, keep "we" as the voice, replace the menu-only sidebar with a top navigation bar, implement immediately.

## Changed

- **Navigation.** A thin, translucent sticky bar (backdrop blur, solid under reduced transparency or increased contrast) with the wordmark, Services, Pricing, About, Contact and a small Free audit button. Below 48rem it collapses to the wordmark and a Menu control. The existing critically damped spring drawer is kept, now entering from the right beside its trigger, with the Close control sitting exactly over the Menu button. This supersedes the 5 November sidebar decision below.
- **Home.** Leads with what the business does ("Your website should help bring in business.") instead of the freebie. Adds a three-part "What we do" summary, the free audit with the clearly labelled illustrative audit note beside it, visible starting prices, a named-founder section and the short FAQ. The duplicated giant wordmark is removed.
- **Services.** Six equally weighted blocks with alternating coloured panels and accent-bordered callouts are regrouped under three headings owners recognise (Websites, Website care, Google and local search). Every service keeps its anchor id and an enquiry link.
- **Pricing.** The radio-button "Which arrangement fits?" widget is removed. One-off, ongoing and new-website options sit side by side as three equal cards. No "most popular" badge or other implied social proof.
- **About.** Names Oliver Burns as the person clients deal with, explains why the business exists using the owner's own reasoning, and folds the separate "practical limit" section into one plain principle ("No promises we can't keep").
- **Copy.** Disclaimers are stated once, plainly, where they matter instead of in every section; contractions replace stiff "do not" phrasing; third-person "Presence takes on that work" constructions are removed. No guarantee, credential, client, metric or date was added.
- **Footer.** A full company footer: description, contact address, service, company and legal columns, and the legal identification line once those details are configured.
- **Design system.** The stylesheet is rewritten as one ordered file (reset, base, components, responsive) instead of seven appended patch layers. Heading tracking is reduced from as tight as -0.07em to -0.014em to -0.03em, scaled by size. Body text moves from 14px grey to 16-17px. Buttons are pills with immediate press feedback. The accent is reserved for links and small signals; every primary action is ink. Input borders now meet 3:1 non-text contrast.

## Owner action

- Add a real, natural photo (not a stock or studio-style headshot) to `public/`, then set `founder.photo`, `photoWidth` and `photoHeight` in `src/config/business.ts`. Nothing renders until then, so there is never a placeholder.
- Change `founder.region` to Belfast if that is accurate. Northern Ireland is used because it is the only location the records confirm.

## Verification

Type check, lint, formatting, 34 site tests (including axe on all nine documents), 14 server tests and 22 Chromium browser journeys (desktop and iPhone 13 emulation) pass. No horizontal overflow at 320, 375, 390, 768, 1024, 1440 or 1920px. Firefox and WebKit binaries are not installed in this environment, so those two Playwright projects were not run.

# Free-audit landing page and sidebar, 5 November 2026

The owner confirmed a short landing page with a request button, a thorough audit of publicly available information, separate Services/Pricing/About destinations, and a left sidebar closed by default on desktop and mobile.

## Implemented

- Replaced the split headline-and-card hero with a single centred audit introduction and a prominent Request a free audit button. The landing main content is about 139 words in one section. No form, pricing grid, FAQ, workflow block or sample card is duplicated there.
- Replaced horizontal/mobile top navigation with a native modal sidebar. An exact critically damped spring carries current position and velocity through reversals. The close control stays stationary, so the drawer can be reopened while closing. Escape, backdrop dismissal, focus return, reduced motion and page-history cleanup are implemented. Native showModal provides keyboard focus containment and background inertness in supported browsers.
- Kept a usable fallback: without JavaScript or native modal support, Menu points to the compact footer navigation. All separate destinations remain ordinary page links.
- Removed the repeated end-of-page audit banners. Services has a contextual audit link and its own illustrative audit-note disclosure; Pricing keeps comparison/FAQ content; About closes with service and pricing links. The footer is compact.
- Updated the request form, terms, FAQ, metadata and sharing asset to use free audit consistently. The audit is thorough within publicly available information, excluding private systems, invasive testing and a complete technical audit. No outcome or fixed turnaround is promised.
- Preserved the existing Netlify form registration and fields, validation, service-selection prefilling, ownership statements, launch guard and prices (£149 one-off and £129/month).
- Removed obsolete layout rules and unused shared banner/arrow components. No dependency was added. Runtime JavaScript totals 3,245 bytes uncompressed; the stylesheet is 25,832 bytes.

## Verification

Astro/TypeScript: 0 errors, 0 warnings, 0 hints. Lint, build, formatting and all 20 local test groups pass. The browser suite collects 24 cases across its four configured projects, including sidebar focus containment, rapid reversal, reduced motion, small/wide viewports and no-JavaScript fallback. Browser execution remains unavailable because the supported preview relay/browser tool is missing; no rendered viewport, Safari, screen-reader or Lighthouse pass is claimed.

The owner-only preview is updated through the existing Site without changing its audience. It remains a static review copy with submission disabled. The public Netlify launch and real submission verification still require account setup and business/legal information. See LAUNCH.md and TEST_RESULTS.md.

## Branding and navigation visibility follow-up

The landing-page eyebrow is replaced by the existing Presence wordmark, centred above the audit headline. Its duplicate in the landing header is omitted; inner pages retain their header wordmark. The Menu control is larger and charcoal, with a high-contrast label and icon. The open drawer's close control remains light against the dark panel.

The landing page now adds three concise audit-coverage rows and explains the recommended-priorities outcome. Its main content is 139 words in one section, preserving the audit button as the primary action. No split hero, sample card, pricing grid or repeated page sections were restored. All 20 existing tests, type/lint/build checks and formatting pass. Rendered browser inspection remains unavailable.
