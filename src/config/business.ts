export interface BusinessConfig {
  name: string;
  shortName: string;
  description: string;
  siteUrl: string;
  email: string;
  telephone: string;
  legalName: string;
  legalStatus: string;
  correspondenceAddress: string;
  companyNumber: string;
  vatNumber: string;
  vatStatement: string;
  privacyRetention: string;
  launchReady: boolean;
  prices: { oneOff: number; ongoing: number };
}

/** Owner-editable facts. Empty details are deliberately omitted from the UI. */
export const business: BusinessConfig = {
  name: 'Presence Web Services',
  shortName: 'Presence',
  description:
    'Website creation, ongoing maintenance and Google Business Profile management for independent businesses in Northern Ireland and across the UK.',
  siteUrl: 'https://presencewebservices.co.uk', // Owner-confirmed intended production origin.
  email: 'contact@presencewebservices.co.uk',
  telephone: '',
  legalName: '',
  legalStatus: '',
  correspondenceAddress: '',
  companyNumber: '',
  vatNumber: '',
  vatStatement: '', // Confirm tax treatment before accepting paid work.
  privacyRetention: '', // Confirm and publish a justified retention schedule before launch.
  launchReady: false, // Keeps every page noindex and robots disallowed until reviewed.
  prices: { oneOff: 149, ongoing: 129 },
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
    'vatStatement',
    'privacyRetention',
  ] as const;
  const missing = required.filter((key) => !business[key].trim());
  if (missing.length)
    throw new Error(
      `Public launch is blocked. Complete business configuration: ${missing.join(', ')}.`,
    );
}

export const navigation = [
  { href: '/', label: 'Home' },
  { href: '/services/', label: 'Services' },
  { href: '/pricing/', label: 'Pricing' },
  { href: '/about/', label: 'About' },
  { href: '/contact/', label: 'Contact' },
] as const;

export const services = [
  {
    id: 'website-creation',
    name: 'Website creation and improvements',
    description:
      'If you need a first website, a replacement or changes to an existing site, we start with the services you sell and the information customers need before they enquire. The work can cover page structure, copy, mobile layouts and contact forms.',
    tasks: [
      'Plan pages around your services, coverage and customers’ questions',
      'Write or improve service information using details you approve',
      'Build clear mobile layouts and straightforward enquiry forms',
    ],
    note: `New websites and substantial redesigns are quoted separately. The £${business.prices.oneOff} starting price is for an agreed set of smaller improvements.`,
  },
  {
    id: 'website-management',
    name: 'Website maintenance and ongoing development',
    description:
      'A new service, changed opening hours or a form that stops delivering messages can leave customers with the wrong impression. We maintain agreed content, check important functions and work through improvements as your business changes.',
    tasks: [
      'Update service pages, photographs and business information',
      'Check availability, links, mobile usability and enquiry delivery',
      'Carry out appropriate maintenance on supported platforms',
      'Agree further page and contact improvements as priorities change',
    ],
    note: 'The platform, hosting and permissions available determine what can be maintained. We check these before agreeing the scope.',
  },
  {
    id: 'google-business-profile',
    name: 'Google Business Profile and local listings',
    description:
      'Customers may see your opening hours or phone number on Google before they visit your website. We check those details against the information you confirm, review categories and services, and identify inconsistencies across relevant business listings.',
    tasks: [
      'Review categories, service areas, hours and contact information',
      'Make approved profile, photo and business updates',
      'Check relevant listings for inconsistent names, numbers or addresses',
      'Review the local search information and profile measures available',
    ],
    note: 'Google Business Profiles are free to own. Presence charges for the management work. Google controls verification, profile decisions and search rankings.',
  },
  {
    id: 'review-support',
    name: 'Review monitoring and responses',
    description:
      'We can monitor genuine customer reviews, draft replies for your approval and help you request honest feedback. A complaint may need information only you can provide, so the response should reflect what actually happened.',
    tasks: [
      'Keep track of new feedback and questions that need your input',
      'Draft useful replies and a fair way to ask customers for reviews',
    ],
    note: 'No purchased reviews, selective requests for positive ratings or promises to remove legitimate negative feedback.',
  },
  {
    id: 'enquiry-improvements',
    name: 'Contact forms and customer enquiries',
    description:
      'If a customer has found the right service, the next step should be easy to find. We review where contact options appear, what a form asks for and whether messages reach the right place. The aim is to reduce avoidable obstacles to a quote, booking enquiry or sale.',
    tasks: [
      'Place relevant contact options beside the information customers are reading',
      'Remove unnecessary form fields and explain what happens after submission',
      'Test the agreed contact journey on mobile and check message delivery',
    ],
  },
  {
    id: 'reporting',
    name: 'Website assessments and performance reporting',
    description:
      'A review identifies issues and suggests what to tackle first. For ongoing work, reporting separates the changes made from what the available figures show and what remains uncertain.',
    tasks: [
      'Assess public website and business information, then agree priorities',
      'Explain completed work, available measures and the next recommendations',
      'Use actual enquiry and confirmed-job figures where you can provide reliable records',
    ],
    note: 'A click on a phone number is not a confirmed job. Better enquiry figures can inform decisions, but they do not prove that a particular change caused a sale.',
  },
] as const;

export const faqs = [
  {
    id: 'cost',
    question: 'How much does it cost?',
    answer: `One-off improvements start at £${business.prices.oneOff}; ongoing support starts at £${business.prices.ongoing} a month. You receive a written scope and quote before deciding. New websites and larger projects are quoted separately.`,
  },
  {
    id: 'first-enquiry',
    question: 'What happens after I enquire?',
    answer:
      'We look at the public business links you share and discuss your priorities. The free audit assesses publicly available information thoroughly. It does not cover private systems, invasive security testing or a full technical audit. If you want to proceed, we agree the work, costs, access and timing in a proposal.',
  },
  {
    id: 'existing-site',
    question: 'Can you work on my existing website?',
    answer:
      'Often, yes. We first check the platform, hosting and access available, then explain which changes can be supported. You do not need to commit to a rebuild to ask for help.',
  },
  {
    id: 'one-off',
    question: 'Can I pay for individual improvements?',
    answer:
      'Yes. We can agree a defined project without ongoing support. For example, that might involve service-page changes or a simpler quote form. The quote confirms what is included.',
  },
  {
    id: 'ongoing',
    question: 'What happens during an ongoing partnership?',
    answer:
      'We agree the checks, updates and improvements your business needs, keep you informed about completed work and review the next priorities. The proposal sets the scope, communication arrangements, payment and cancellation terms. It is not unlimited development.',
  },
  {
    id: 'access',
    question: 'What access would you need?',
    answer:
      'The free public audit needs no account access. For paid work, we explain the permissions required and use delegated access where supported. You retain owner access and approve business information. Please do not send passwords through the form.',
  },
  {
    id: 'results',
    question: 'Can you guarantee better Google rankings?',
    answer:
      'No. Google controls its search results. Accurate information, useful pages and fewer contact problems are sensible improvements, but rankings, enquiries and sales cannot be guaranteed.',
  },
  {
    id: 'measurement',
    question: 'How do we know whether changes helped?',
    answer:
      'We check that the agreed changes work and review the figures available. Form requests, calls and confirmed jobs tell us different things. Your own enquiry records help distinguish activity on a website from work actually won.',
  },
] as const;
