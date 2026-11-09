export interface BusinessConfig {
  name: string;
  shortName: string;
  description: string;
  siteUrl: string;
  email: string;
  /**
   * Sender for website emails. Resend recommends a dedicated sending subdomain so the main
   * domain's reputation is protected; replies always go to `email`.
   */
  mailFrom: string;
  /** How long the website keeps enquiries, in days. Must match ENQUIRY_RETENTION_DAYS. */
  enquiryRetentionDays: number;
  /** Required on the website by the Provision of Services Regulations 2009, reg 7(2)(b). */
  telephone: string;
  /** ICO data protection fee registration number (for example "ZA123456"), once paid. */
  icoRegistration: string;
  legalName: string;
  legalStatus: string;
  correspondenceAddress: string;
  companyNumber: string;
  vatNumber: string;
  vatStatement: string;
  privacyRetention: string;
  launchReady: boolean;
  prices: { oneOff: number; ongoing: number };
  /** The person clients deal with. The photo renders only once a real file is supplied. */
  founder: {
    name: string;
    role: string;
    region: string;
    /** Path under public/, e.g. '/oliver-burns.jpg'. Leave empty until a real photo exists. */
    photo: string;
    photoWidth: number;
    photoHeight: number;
  };
}

/** Owner-editable facts. Empty details are deliberately omitted from the UI. */
export const business: BusinessConfig = {
  name: 'Presence Web Services',
  shortName: 'Presence',
  description:
    'Websites, ongoing website care and Google Business Profile management for independent businesses in Northern Ireland and across the UK.',
  siteUrl: 'https://presencewebservices.co.uk', // Owner-confirmed intended production origin.
  email: 'contact@presencewebservices.co.uk',
  mailFrom: 'Presence Web Services <audits@mail.presencewebservices.co.uk>',
  enquiryRetentionDays: 365,
  telephone: '', // A business phone number is legally required before public launch.
  icoRegistration: '', // Add once the ICO data protection fee has been paid.
  legalName: 'Oliver James Burns',
  legalStatus: 'Sole trader, trading as Presence Web Services',
  correspondenceAddress: '279 Lower Braniel Road, Belfast BT5 7NS',
  companyNumber: '',
  vatNumber: '',
  vatStatement:
    'Presence Web Services is not registered for VAT, so no VAT is added to our prices.',
  privacyRetention:
    'Enquiries sent through the website are deleted automatically 12 months after they are received. If an enquiry does not lead to paid work, related emails are deleted from our inbox within 12 months of our last contact with you.',
  launchReady: false, // Keeps every page noindex and robots disallowed until reviewed.
  prices: { oneOff: 249, ongoing: 179 },
  founder: {
    name: 'Oliver Burns',
    role: 'Founder',
    region: 'Belfast',
    photo: '', // Add a real, natural photo to public/ and set its path and pixel size here.
    photoWidth: 1200,
    photoHeight: 1500,
  },
};

if (business.siteUrl && !/^https:\/\/[^/]+$/.test(business.siteUrl)) {
  throw new Error('business.siteUrl must be a verified HTTPS origin without a trailing slash.');
}
if (business.launchReady) {
  const required = [
    'siteUrl',
    'legalName',
    'legalStatus',
    'correspondenceAddress',
    'email',
    'telephone',
    'vatStatement',
    'privacyRetention',
  ] as const;
  const missing = required.filter((key) => !business[key].trim());
  if (missing.length)
    throw new Error(
      `Public launch is blocked. Complete business configuration: ${missing.join(', ')}.`,
    );
}

/** Primary destinations. The wordmark links home, so Home only appears in the footer and menu. */
export const navigation = [
  { href: '/', label: 'Home' },
  { href: '/services/', label: 'Services' },
  { href: '/pricing/', label: 'Pricing' },
  { href: '/about/', label: 'About' },
  { href: '/contact/', label: 'Contact' },
] as const;

/** Services are grouped the way owners describe their problem, not by internal discipline. */
export const serviceGroups = [
  {
    id: 'websites',
    name: 'Websites',
    summary: 'Pages that explain what you do and make it easy to get in touch.',
    homeSummary:
      'New websites, redesigns and smaller fixes, planned around the services you sell and the questions customers ask before they get in touch.',
    linkLabel: 'Website services',
  },
  {
    id: 'website-care',
    name: 'Website care',
    summary: 'Someone looking after your site every month, so it stays accurate and keeps working.',
    homeSummary:
      'Regular updates, checks and improvements, so your information stays current and your contact forms keep delivering.',
    linkLabel: 'Website care',
  },
  {
    id: 'local-search',
    name: 'Google and local search',
    summary: 'Accurate details wherever customers look you up.',
    homeSummary:
      'Accurate Google Business Profile details, consistent local listings and a fair way to ask customers for reviews.',
    linkLabel: 'Google and local search',
  },
] as const;

export type ServiceGroupId = (typeof serviceGroups)[number]['id'];

export const services = [
  {
    id: 'website-creation',
    group: 'websites',
    name: 'New websites and improvements',
    description:
      'Whether you need a first website, a replacement or changes to the one you have, we start with the services you sell and what customers need to know before they enquire.',
    tasks: [
      'Plan pages around your services, coverage area and customers’ questions',
      'Write or improve service information using details you approve',
      'Build clear mobile layouts and straightforward enquiry forms',
    ],
    note: `New websites and substantial redesigns are quoted separately. The £${business.prices.oneOff} starting price covers an agreed set of smaller improvements.`,
    cta: { label: 'Discuss your website', href: '/contact/?service=one-off' },
  },
  {
    id: 'enquiry-improvements',
    group: 'websites',
    name: 'Contact forms and enquiries',
    description:
      'Once a customer has found the right service, the next step should be obvious. We look at where contact options appear, what your form asks for and whether messages reach you.',
    tasks: [
      'Put contact options beside the information customers are reading',
      'Remove unnecessary form fields and explain what happens next',
      'Test the contact journey on a phone and confirm messages arrive',
    ],
    cta: { label: 'Ask about your enquiry process', href: '/contact/?service=one-off' },
  },
  {
    id: 'website-management',
    group: 'website-care',
    name: 'Maintenance and updates',
    description:
      'A new service, changed opening hours or a form that quietly stops sending messages can cost you work. We keep your content current, check the things that matter and keep improving the site as your business changes.',
    tasks: [
      'Update service pages, photographs and business information',
      'Check links, mobile layouts and enquiry delivery',
      'Carry out routine maintenance on supported platforms',
      'Agree further improvements as your priorities change',
    ],
    note: 'What we can maintain depends on your platform, hosting and access. We check this before agreeing the scope.',
    cta: { label: 'Ask about website care', href: '/contact/?service=ongoing' },
  },
  {
    id: 'reporting',
    group: 'website-care',
    name: 'Audits and reporting',
    description:
      'An audit shows what to fix first. For ongoing work, a short monthly report sets out what changed, what the figures show and what we suggest next.',
    tasks: [
      'Review your public website and business information, then agree priorities',
      'Explain completed work, the available figures and next steps',
      'Track real enquiries and confirmed jobs where you keep records',
    ],
    note: 'We report enquiries and confirmed jobs separately from clicks and visits, so you can see what is actually bringing in work.',
    cta: { label: 'Request a free audit', href: '/contact/' },
  },
  {
    id: 'google-business-profile',
    group: 'local-search',
    name: 'Google Business Profile and listings',
    description:
      'Many customers see your hours and phone number on Google before they ever reach your website. We check those details against what you confirm, review your categories and services, and fix inconsistencies across the listings that matter.',
    tasks: [
      'Review categories, service areas, opening hours and contact details',
      'Make approved profile, photo and business updates',
      'Correct inconsistent names, numbers or addresses on relevant listings',
    ],
    note: 'Google Business Profiles are free to own. You pay for the management work, not the listing, and Google remains in control of verification and rankings.',
    cta: { label: 'Ask about your Google profile', href: '/contact/?service=ongoing' },
  },
  {
    id: 'review-support',
    group: 'local-search',
    name: 'Reviews',
    description:
      'We monitor new reviews, draft replies for you to approve and set up a simple way to ask customers for honest feedback.',
    tasks: [
      'Flag new reviews and questions that need your input',
      'Draft considered replies, including to critical reviews',
      'Set up a review link or QR code for after a job',
    ],
    note: 'No bought reviews, no asking only happy customers and no promises to remove genuine negative feedback.',
    cta: { label: 'Ask about review support', href: '/contact/?service=ongoing' },
  },
] as const;

export const faqs = [
  {
    id: 'cost',
    question: 'How much does it cost?',
    answer: `One-off improvements start at £${business.prices.oneOff}, and ongoing support starts at £${business.prices.ongoing} a month. You get a written scope and quote before deciding. New websites and larger projects are quoted separately.`,
  },
  {
    id: 'first-enquiry',
    question: 'What happens after I enquire?',
    answer:
      'We review the public links you share and get back to you with what we found and what we would tackle first. If you want to go ahead, we send a proposal covering the work, cost, access and timing. The free audit looks at public information only, so it doesn’t include private systems or security testing.',
  },
  {
    id: 'existing-site',
    question: 'Can you work on my existing website?',
    answer:
      'Usually, yes. We check the platform, hosting and access first, then tell you what can be supported. You don’t need to commit to a rebuild to ask for help.',
  },
  {
    id: 'one-off',
    question: 'Can I pay for individual improvements?',
    answer:
      'Yes. You can book a defined piece of work without ongoing support, such as rewriting a service page or simplifying a quote form. The quote confirms exactly what is included.',
  },
  {
    id: 'ongoing',
    question: 'What happens during an ongoing partnership?',
    answer:
      'We agree the checks, updates and improvements your business needs, keep you informed about the work done and review priorities each month. Your proposal sets out the scope, how we communicate, payment and cancellation terms. It isn’t unlimited development.',
  },
  {
    id: 'access',
    question: 'What access would you need?',
    answer:
      'None for the free audit. For paid work, we explain which permissions are needed and use delegated access wherever the platform allows it, so you keep owner access throughout. Please don’t send passwords through the form.',
  },
  {
    id: 'results',
    question: 'Can you guarantee better Google rankings?',
    answer:
      'No, and you should be wary of anyone who does. Google decides its own results. Accurate information, useful pages and an easy way to get in touch are sensible improvements, but rankings, enquiries and sales can’t be guaranteed.',
  },
  {
    id: 'measurement',
    question: 'How will I know whether the changes helped?',
    answer:
      'We confirm each change works, then look at the figures available. Form submissions, calls and confirmed jobs tell you different things, so your own enquiry records help separate website activity from work actually won.',
  },
] as const;
