/**
 * Enquiry emails, sent through Resend's HTTPS API.
 *
 * Two messages are sent for each new audit request:
 *   1. An owner alert to the business inbox with every submitted detail, Reply-To set to the
 *      customer, and shortcuts for starting the audit.
 *   2. A confirmation to the customer. It deliberately contains no text the visitor typed, so the
 *      form cannot be used to send arbitrary content to a third party's inbox.
 *
 * Templates use table layout and inline styles because email clients (Outlook, Gmail) ignore most
 * modern CSS. All submitted values are HTML-escaped; links are only built from values the
 * validator has already normalised to public http(s) URLs.
 */
import { business } from '../src/config/business.ts';
import type { AppEnv, EnquiryData } from './types.ts';

export interface OutgoingEmail {
  to: string;
  subject: string;
  html: string;
  text: string;
  replyTo: string;
}

export interface MailConfig {
  apiKey: string;
  from: string;
  notifyTo: string;
}

/** Returns sending settings, or null when no API key is configured (emails are then skipped). */
export function mailConfig(env: AppEnv): MailConfig | null {
  const apiKey = env.RESEND_API_KEY?.trim();
  if (!apiKey) return null;
  return {
    apiKey,
    from: env.MAIL_FROM?.trim() || business.mailFrom,
    notifyTo: env.NOTIFY_EMAIL?.trim() || business.email,
  };
}

const serviceLabels: Record<string, string> = {
  'not-sure': 'Not sure yet',
  'one-off': 'One-off improvements',
  ongoing: 'Ongoing website care',
  'new-website': 'A new website or rebuild',
};

/* ------------------------------------------------------------------ helpers */

const escape = (text: string) =>
  text.replace(
    /[&<>"']/g,
    (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!,
  );

/** Escapes text and keeps the visitor's own line breaks. */
const paragraphs = (text: string) => escape(text).replace(/\n/g, '<br>');

/** Subjects are single-line and bounded; control characters are removed. */
const subjectSafe = (text: string) =>
  [...text]
    .map((character) => {
      const code = character.charCodeAt(0);
      return code < 32 || code === 127 ? ' ' : character;
    })
    .join('')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 120);

const londonTime = (time: number) =>
  new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/London',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(time);

const londonDate = (time: number) =>
  new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/London',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(time);

/* Brand tokens, matching the website. */
const ink = '#282828';
const muted = '#60605b';
const accent = '#a5482c';
const line = '#e4e3dc';
const paper = '#f8f7f3';
const card = '#ffffff';
const font = `-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', 'Helvetica Neue', Helvetica, Arial, sans-serif`;
const siteUrl = business.siteUrl;
const siteHost = new URL(siteUrl).host;

/** The wordmark as live text, so it shows even when a mail client blocks images. */
const wordmark = `<a href="${siteUrl}" style="color:${ink};text-decoration:none;font-family:${font};">
  <span style="font-size:22px;font-weight:700;letter-spacing:-0.9px;color:${ink};">presence<span style="color:${accent};">.</span></span>
  <span style="font-size:13px;font-weight:500;color:${muted};padding-left:6px;">Web Services</span>
</a>`;

const button = (href: string, label: string, primary = true) =>
  `<a href="${escape(href)}" style="display:inline-block;padding:11px 20px;margin:0 8px 8px 0;border-radius:999px;font-family:${font};font-size:14px;font-weight:600;line-height:1.2;text-decoration:none;${
    primary
      ? `background:${ink};color:#ffffff;border:1px solid ${ink};`
      : `background:${card};color:${ink};border:1px solid #c9c8bf;`
  }">${escape(label)}</a>`;

/** Shared document shell: preheader, centred 600px card, footer. */
function shell(options: { title: string; preheader: string; body: string; footer: string }) {
  return `<!doctype html>
<html lang="en-GB">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>${escape(options.title)}</title>
<style>
  /* Clients that support media queries (Apple Mail, Gmail apps) get tighter phone padding. */
  @media (max-width: 480px) {
    .email-card { padding: 26px 22px 24px !important; }
    .email-outer { padding: 20px 10px !important; }
  }
</style>
</head>
<body style="margin:0;padding:0;background:${paper};-webkit-text-size-adjust:100%;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${escape(options.preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${paper};">
  <tr>
    <td class="email-outer" align="center" style="padding:32px 16px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;">
        <tr><td style="padding:0 4px 20px;">${wordmark}</td></tr>
        <tr>
          <td class="email-card" style="background:${card};border:1px solid ${line};border-radius:14px;padding:36px 36px 32px;font-family:${font};color:${ink};">
            ${options.body}
          </td>
        </tr>
        <tr>
          <td style="padding:20px 4px 0;font-family:${font};font-size:12px;line-height:1.6;color:${muted};">
            ${options.footer}
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`;
}

/* ---------------------------------------------------------- owner alert */

export function ownerAlert(
  data: EnquiryData,
  meta: { id: string; createdAt: number; expiresAt: number },
  config: MailConfig,
): OutgoingEmail {
  const name = data['contact-name'];
  const businessName = data['business-name'];
  const place = data.location ? ` in ${data.location}` : '';
  const service = serviceLabels[data.service] || serviceLabels['not-sure'];
  const reference = meta.id.slice(0, 8).toUpperCase();
  const searchQuery = [businessName, data.location].filter(Boolean).join(' ');
  const replySubject = `Your free audit from ${business.name}`;

  // Each row: label, display HTML (already escaped) and its plain-text equivalent.
  const rows: [string, string, string][] = [
    ['Name', escape(name), name],
    ['Business', escape(businessName), businessName],
    [
      'Email',
      `<a href="mailto:${escape(encodeURIComponent(data.email))}" style="color:${ink};">${escape(data.email)}</a>`,
      data.email,
    ],
    [
      'Phone',
      `<a href="tel:${escape(data.telephone.replace(/[^\d+]/g, ''))}" style="color:${ink};">${escape(data.telephone)}</a>`,
      data.telephone,
    ],
    [
      'Website',
      data.website
        ? `<a href="${escape(data.website)}" style="color:${ink};word-break:break-all;">${escape(data.website)}</a>`
        : `<span style="color:${muted};">None given</span>`,
      data.website || 'None given',
    ],
    [
      'Google listing',
      data['google-profile']
        ? `<a href="${escape(data['google-profile'])}" style="color:${ink};word-break:break-all;">Open listing</a>`
        : `<span style="color:${muted};">None given</span>`,
      data['google-profile'] || 'None given',
    ],
    [
      'Town or area',
      data.location ? escape(data.location) : `<span style="color:${muted};">Not given</span>`,
      data.location || 'Not given',
    ],
    ['Interested in', escape(service), service],
  ];

  const detailRows = rows
    .map(
      ([label, value], index) => `<tr>
  <td valign="top" style="padding:11px 16px 11px 0;width:132px;font-size:13px;color:${muted};${index ? `border-top:1px solid ${line};` : ''}">${label}</td>
  <td valign="top" style="padding:11px 0;font-size:15px;line-height:1.5;color:${ink};${index ? `border-top:1px solid ${line};` : ''}">${value}</td>
</tr>`,
    )
    .join('');

  const tools = [
    data.website
      ? [
          'PageSpeed Insights',
          `https://pagespeed.web.dev/analysis?url=${encodeURIComponent(data.website)}`,
        ]
      : null,
    ['Google search', `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`],
    [
      'Google Maps',
      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(searchQuery)}`,
    ],
  ].filter(Boolean) as [string, string][];

  const actions = [
    button(
      // The address is encoded so characters like "?" cannot add extra mailto parameters.
      `mailto:${encodeURIComponent(data.email)}?subject=${encodeURIComponent(replySubject)}`,
      `Reply to ${name.split(/\s+/)[0] || 'them'}`,
    ),
    button(`tel:${data.telephone.replace(/[^\d+]/g, '')}`, 'Call', false),
    data.website ? button(data.website, 'Open website', false) : '',
  ].join('');

  const body = `
<p style="margin:0 0 6px;font-size:13px;color:${muted};">New audit request · ${escape(londonTime(meta.createdAt))}</p>
<h1 style="margin:0;font-size:26px;line-height:1.2;font-weight:700;letter-spacing:-0.5px;color:${ink};">${escape(businessName)}</h1>
<p style="margin:6px 0 24px;font-size:15px;color:${muted};">${escape(name)}${escape(place)}</p>
<div style="margin:0 0 22px;">${actions}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:1px solid ${ink};border-bottom:1px solid ${line};">${detailRows}</table>
<h2 style="margin:28px 0 10px;font-size:15px;font-weight:600;color:${ink};">What they’d like to improve</h2>
<div style="padding:16px 18px;background:${paper};border-radius:10px;font-size:15px;line-height:1.6;color:${ink};">${paragraphs(data.goal)}</div>
<h2 style="margin:28px 0 8px;font-size:15px;font-weight:600;color:${ink};">Start the audit</h2>
<p style="margin:0;font-size:14px;line-height:1.9;">${tools
    .map(
      ([label, href]) =>
        `<a href="${escape(href)}" style="color:${accent};text-decoration:underline;margin-right:16px;white-space:nowrap;">${label}</a>`,
    )
    .join(' ')}</p>`;

  const footer = `Reference ${reference}. Pressing Reply answers ${escape(data.email)} directly.
The website record expires on ${escape(londonDate(meta.expiresAt))} and is removed on the next cleanup. Manage email copies in this inbox separately.`;

  const text = [
    `New audit request: ${businessName}`,
    `Received ${londonTime(meta.createdAt)}`,
    '',
    ...rows.map(([label, , plain]) => `${label}: ${plain}`),
    '',
    'What they’d like to improve:',
    data.goal,
    '',
    'Start the audit:',
    ...tools.map(([label, href]) => `${label}: ${href}`),
    '',
    `Reference ${reference}. Reply to this email to answer ${data.email} directly.`,
    `The website record expires on ${londonDate(meta.expiresAt)} and is removed on the next cleanup. Manage email copies in this inbox separately.`,
  ].join('\n');

  return {
    to: config.notifyTo,
    replyTo: data.email,
    subject: subjectSafe(`Audit request: ${businessName}${place}`),
    html: shell({
      title: `Audit request from ${businessName}`,
      preheader: `${name} at ${businessName}${place} requested a free audit.`,
      body,
      footer,
    }),
    text,
  };
}

/* ---------------------------------------------------- customer confirmation */

/**
 * Fixed content only. Nothing the visitor typed is included, so a malicious submission cannot
 * use this message to deliver its own text to someone else's inbox.
 */
export function customerConfirmation(to: string, config: MailConfig): OutgoingEmail {
  const founder = business.founder.name;
  const steps = [
    ['We review your website and Google listing', 'We look at it the way a customer would.'],
    [
      'We email you what we found',
      'A plain-English summary of what’s working, what isn’t, and what we’d fix first.',
    ],
    [
      'You decide whether to go ahead',
      'If you’d like to go ahead, we send a written quote before any work begins. There’s no obligation.',
    ],
  ];
  const stepRows = steps
    .map(
      ([title, detail], index) => `<tr>
  <td valign="top" style="width:34px;padding:14px 0;${index ? `border-top:1px solid ${line};` : ''}">
    <span style="display:inline-block;width:24px;height:24px;line-height:24px;border-radius:12px;background:${ink};color:#ffffff;font-size:12px;font-weight:600;text-align:center;">${index + 1}</span>
  </td>
  <td valign="top" style="padding:14px 0;${index ? `border-top:1px solid ${line};` : ''}">
    <p style="margin:0;font-size:15px;font-weight:600;line-height:1.4;color:${ink};">${title}</p>
    <p style="margin:3px 0 0;font-size:14px;line-height:1.55;color:${muted};">${detail}</p>
  </td>
</tr>`,
    )
    .join('');

  const body = `
<h1 style="margin:0;font-size:26px;line-height:1.2;font-weight:700;letter-spacing:-0.5px;color:${ink};">We’ve received your audit request</h1>
<p style="margin:16px 0 0;font-size:16px;line-height:1.6;color:${ink};">Thank you for getting in touch. We’ll look at how your business appears online: how clearly your services are explained, whether your details are accurate, and how easy it is for customers to contact you.</p>
<h2 style="margin:30px 0 4px;font-size:15px;font-weight:600;color:${ink};">What happens next</h2>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${stepRows}</table>
<p style="margin:24px 0 0;font-size:16px;line-height:1.6;color:${ink};">If there’s anything you’d like to add, just reply to this email.</p>
<p style="margin:28px 0 0;font-size:16px;line-height:1.5;color:${ink};">Kind regards,</p>
<p style="margin:4px 0 0;font-size:16px;line-height:1.5;color:${ink};font-weight:600;">${escape(founder)}</p>
<p style="margin:0;font-size:14px;line-height:1.5;color:${muted};">${escape(business.name)}</p>
<div style="margin:28px 0 0;">${button(siteUrl, 'Visit our website', false)}</div>`;

  const footer = `${escape(business.name)} · <a href="mailto:${business.email}" style="color:${muted};">${business.email}</a> · <a href="${siteUrl}" style="color:${muted};">${siteHost}</a><br>
You’re receiving this because this email address was used to request a free audit on ${siteHost}. If that wasn’t you, you can ignore this email; nothing else will be sent.`;

  const text = [
    'We’ve received your audit request',
    '',
    'Thank you for getting in touch. We’ll look at how your business appears online: how clearly your services are explained, whether your details are accurate, and how easy it is for customers to contact you.',
    '',
    'What happens next',
    ...steps.map(([title, detail], index) => `${index + 1}. ${title}. ${detail}`),
    '',
    'If there’s anything you’d like to add, just reply to this email.',
    '',
    'Kind regards,',
    founder,
    business.name,
    siteUrl,
    '',
    `You’re receiving this because this email address was used to request a free audit on ${siteHost}. If that wasn’t you, you can ignore this email; nothing else will be sent.`,
  ].join('\n');

  return {
    to,
    replyTo: config.notifyTo,
    subject: 'We’ve received your audit request',
    html: shell({
      title: 'We’ve received your audit request',
      preheader: 'Thanks for getting in touch. Here’s what happens next.',
      body,
      footer,
    }),
    text,
  };
}

/* ----------------------------------------------------------------- sending */

/**
 * Sends one email. Resolves to a short status for the enquiry record; never throws, because a
 * delivery problem must not lose an enquiry that has already been saved.
 */
export async function sendEmail(
  config: MailConfig,
  message: OutgoingEmail,
  idempotencyKey: string,
): Promise<string> {
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
        // Resend keeps keys for 24 hours, so a retried request cannot send a second copy.
        'Idempotency-Key': idempotencyKey,
      },
      body: JSON.stringify({
        from: config.from,
        to: [message.to],
        reply_to: message.replyTo,
        subject: message.subject,
        html: message.html,
        text: message.text,
      }),
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) return `failed:${response.status}`;
    const result = (await response.json().catch(() => ({}))) as { id?: unknown };
    return typeof result.id === 'string' ? `sent:${result.id.slice(0, 64)}` : 'sent';
  } catch (error) {
    return error instanceof Error && error.name === 'TimeoutError'
      ? 'failed:timeout'
      : 'failed:network';
  }
}
