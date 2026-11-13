# Google Business Profile: Presence Web Services

Everything needed to create, verify and run the profile, ready to copy and paste. It follows
Google's own rules (checked November 2026) so nothing here risks a suspension.

Files in this folder:

| File                           | Use                                                     |
| ------------------------------ | ------------------------------------------------------- |
| `logo-720.png`                 | Profile **logo** (720 x 720, Google's recommended size) |
| `post-free-audit-1200x900.png` | Image for **Post 1** below                              |

Regenerate both with `PLAYWRIGHT_CHROMIUM_EXECUTABLE=<chrome path> node scripts/gbp-assets.mjs`.

---

## Before you start

1. **Get the business phone number first.** Google may call or text it during verification, it
   must be the same number as the website, and Google requires that the business controls it.
2. **Sign in with a Google account you will keep for the business.** Best: create a Google
   account using `contact@presencewebservices.co.uk` (accounts.google.com, "Use your existing
   email"). The profile then belongs to the business address, not a personal Gmail.
3. Have the logo file and at least three real photos ready (see Photos).

Go to **business.google.com/create** and fill in the fields as below.

---

## 1. Core details

| Field                     | Enter exactly                                                                                    | Why                                                                                                                                                              |
| ------------------------- | ------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Business name**         | `Presence Web Services`                                                                          | Must match the real-world name. Adding "Belfast", "Web Design" or anything else breaks Google's rules and can get the profile suspended.                         |
| **Business type**         | "Service business": you visit or deal with customers remotely, they do not come to you           | You work from home, so you are a service-area business.                                                                                                          |
| **Primary category**      | `Website designer`                                                                               | The primary category is the strongest ranking signal and this one matches what customers search. If Google offers `Web designer` instead, use that.              |
| **Additional categories** | `Internet marketing service`                                                                     | Covers the Google profile and listings work. Only add categories you genuinely provide. Do not add SEO or advertising categories.                                |
| **Address**               | 279 Lower Braniel Road, Belfast BT5 7NS, then choose **hide address / do not show to customers** | Google requires home-based service businesses to hide the address. It is used only for verification. Never use a virtual office or PO box (both are ineligible). |
| **Phone**                 | The business number (same as on the website)                                                     | Must connect directly to you.                                                                                                                                    |
| **Website**               | `https://presencewebservices.co.uk/`                                                             | Exact homepage, no tracking codes or redirects.                                                                                                                  |
| **Appointment link**      | `https://presencewebservices.co.uk/contact/`                                                     | Sends people straight to the audit request form.                                                                                                                 |
| **Opening date**          | The month you started trading                                                                    |                                                                                                                                                                  |

### Service areas (Google allows up to 20, within about 2 hours' drive)

Add these 18 (leaves two spare). Do not add "Northern Ireland" or "United Kingdom": Google no
longer accepts country or region-wide areas.

```
Belfast, Dundonald, Holywood, Bangor, Newtownards, Comber, Lisburn, Newtownabbey,
Carrickfergus, Ballyclare, Antrim, Larne, Ballynahinch, Downpatrick, Banbridge,
Craigavon, Ballymena, Newry
```

Clients elsewhere in the UK can still hire you; the service area only describes where you
meet people in person.

### Hours

Enter the hours you will genuinely **answer the phone**, for example Monday to Friday
09:00 to 17:30. A profile that says "open" when nobody answers loses trust and reviews. Add
**special hours** for bank holidays (including Northern Ireland's 17 March and 12 July holidays) before each one.

---

## 2. Description ("From the business", 708 of 750 characters)

Google bans links, prices and promotions here, so this is factual only:

```
Presence Web Services helps independent businesses in Belfast and across Northern Ireland look right online and get found on Google. We build and improve websites, look after them month to month, and set up and manage Google Business Profiles so your hours, services and photos stay accurate and every review gets a considered reply. Every job starts with an audit of your website and Google listing, then a written quote in plain English before any work begins. You deal directly with the founder, Oliver Burns, and your website, domain and Google accounts always stay in your name. Ongoing support can be stopped with 30 days' notice, and a short monthly report shows what changed and what we suggest next.
```

---

## 3. Services

Add each as a **custom service**. Service names must not contain prices (Google rejects them);
use the separate price field. Prices match the website.

| Service name                                   | Price field   | Description                                                                                                                                                            |
| ---------------------------------------------- | ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Website and Google profile audit               | Free          | We review your website and Google Business Profile and send a written list of what to fix first, in plain English. No obligation.                                      |
| Website improvements                           | From £249     | An agreed set of smaller fixes to the site you already have: clearer service pages, mobile layout fixes and simpler contact forms. Scoped and quoted in writing first. |
| New website design and build                   | (leave blank) | A new or replacement website planned around the services you sell and the questions customers ask. Quoted per project after an audit.                                  |
| Website care and maintenance                   | From £179     | Monthly care: content updates, checks on links, mobile layouts and form delivery, and agreed improvements. Includes a short monthly report. 30 days' notice to stop.   |
| Google Business Profile management             | From £179     | We keep your categories, services, hours, photos and details accurate, post updates and flag anything Google or the public changes. Part of monthly care.              |
| Google Business Profile setup and optimisation | From £249     | A one-off setup or clean-up of your profile: categories, services, service areas, description and photos, checked against Google's rules.                              |
| Contact form and enquiry improvements          | From £249     | We make the next step obvious, cut unnecessary form fields and test that every message actually reaches you.                                                           |
| Local listings clean-up                        | From £249     | We correct inconsistent names, numbers and addresses on the directories that matter, so customers and Google see the same details everywhere.                          |
| Review monitoring and replies                  | From £179     | We flag new reviews, draft considered replies for your approval and set up a simple review link or QR code. No fake or filtered reviews.                               |

---

## 4. Logo, cover and photos

Google accepts JPG or PNG, 10 KB to 5 MB, ideally 720 x 720 or larger. Photos only appear
after verification and can take 24 to 48 hours.

- **Logo:** `logo-720.png` from this folder.
- **Cover:** a **real photo**, not a graphic (Google may replace a graphic cover with another
  photo). Best: you working at a laptop, natural light, landscape.
- **First 10 photos to take** (real, recent, well lit, no stock images):
  1. Headshot of Oliver (the same photo planned for the About page)
  2. Working at your desk or laptop
  3. Meeting a client or talking on the phone (with their permission)
  4. Screen showing a client's website on desktop and phone (with permission, and only real work)
  5. Before-and-after of a real Google profile or page you improved (with permission)
  6. Your workspace
  7. A recognisable Belfast location where you meet clients
  8. Screenshot of the Presence website homepage
  9. A sample monthly report with client details hidden
  10. You at a local business or networking event

Add one or two new photos every month. Active profiles get more views and Google favours them.

---

## 5. Verification (usually a live video)

Google will most likely ask for a **continuous video recorded in the Google app** (you cannot
upload one recorded earlier). Plan it before you press record:

1. **Location:** start outside, show the **Lower Braniel Road** street sign and the house
   number, then walk inside without stopping.
2. **Equipment and workspace:** your desk, laptop and phone.
3. **Proof you run the business:** open the live website, then the Cloudflare or website
   admin dashboard showing `presencewebservices.co.uk`, and the `contact@` inbox. Business
   paperwork (an HMRC registration letter, business cards) helps.
4. Keep it under two minutes, steady and well lit. Do not show passwords, bank details or
   client data.

If Google offers phone, text or email verification instead, use it. Do not edit the name,
category or address while verification is pending; edits can restart it.

---

## 6. First four posts

Posts appear on the profile and in Maps. Keep phone numbers out of post text (Google can
reject them) and use the button instead. Post weekly.

**Post 1, type "Offer"** · image `post-free-audit-1200x900.png` · button "Learn more" to
`https://presencewebservices.co.uk/contact/`

```
Free website and Google profile audit

Not sure why the phone isn't ringing? We'll look at your website and Google Business Profile the way a customer does and send you a written list of what to fix first, in plain English. No obligation, and your accounts stay in your name.
```

**Post 2, type "Update"** · photo of your Google profile work · button "Learn more" to the
Services page

```
Five things customers check on your Google profile before they call

1. Are you open right now?
2. Do you cover their area?
3. Is the phone number right?
4. Do recent reviews get a reply?
5. Do the photos look like a real, current business?

If any of these are out of date, you lose the call to the next business on the list. We check all five in every audit.
```

**Post 3, type "Update"** · photo of you working · button "Learn more" to the About page

```
How we work

Every job starts with an audit and a written quote, so you know what you're paying for before anything changes. You deal directly with Oliver, the founder, not an account manager, and your website, domain and Google accounts always stay in your name. Monthly care can be stopped with 30 days' notice.
```

**Post 4, type "Update"** · screenshot of a contact form · button "Learn more" to the
Services page

```
Does your contact form actually reach you?

Forms break quietly: a changed email address, a full inbox or a plugin update, and enquiries vanish without anyone noticing. Send yourself a test message today. If it doesn't arrive within a few minutes, it's worth finding out why.
```

---

## 7. Reviews (the biggest ranking and trust factor you control)

- After verification, copy your review link (profile, "Ask for reviews") and save it.
- **Ask every client** once the work is delivered, by message with the link, while they are
  happy. Ask everyone, not only the clients you expect to be positive: filtering who you ask
  ("review gating") breaks Google's rules.
- **Never** offer anything in exchange, write reviews yourself, or ask friends or family who
  are not clients. Fake or incentivised reviews are illegal in the UK under the Digital Markets,
  Competition and Consumers Act 2024, as well as banned by Google.
- **Reply to every review within two days.**

Reply templates:

```
Thanks, [name]. It was good working with you on [the specific job]. If anything needs changing, just get in touch.
```

```
Thanks for the feedback, [name]. I'm sorry [the specific issue] wasn't right. I'd like to sort it out, so please contact me directly and I'll go through it with you.
```

---

## 8. After launch: 10-minute weekly routine

1. Publish one post.
2. Reply to any new reviews.
3. Check for **suggested edits**: anyone, including Google, can propose changes to your
   details. Reject anything wrong.
4. Monthly: add photos and look at **Performance** (calls, website clicks, searches).
5. Keep hours, services and prices identical to the website.

## 9. Once verified, tell Claude

Send the profile's **Share** link. It goes in `googleProfileUrl` in
`src/config/business.ts`, which adds it to the site's structured data so Google connects the
website and the profile. Then set up the same name, phone and website on **Bing Places**
(it can import from Google) and **Apple Business Connect** (Apple Maps).

## Sources

- Google: [Guidelines for representing your business](https://support.google.com/business/answer/3038177)
- Google: [Service areas](https://support.google.com/business/answer/9157481)
- Google: [Edit your Business Profile](https://support.google.com/business/answer/3039617)
- Google: [Photos and videos](https://support.google.com/business/answer/6103862)
- Google: [Services](https://support.google.com/business/answer/9455399)
- Google: [Video verification](https://support.google.com/business/answer/14271705)
