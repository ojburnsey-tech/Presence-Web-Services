> Historical design notes. Deployment instructions here are superseded by ../DEPLOYMENT.md.

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
