export const fieldLimits = {
  'contact-name': 100,
  'business-name': 160,
  email: 254,
  website: 2048,
  'google-profile': 2048,
  location: 120,
  telephone: 40,
  goal: 4000,
} as const;
export const serviceValues = ['not-sure', 'one-off', 'ongoing', 'new-website'] as const;
export function normalisePublicUrl(value: string): string {
  let candidate = value.trim();
  if (!candidate) return '';
  if (!/^[a-z][a-z\d+.-]*:/i.test(candidate)) candidate = `https://${candidate}`;
  const url = new URL(candidate);
  if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password)
    throw new Error('Use a public http or https address without login details.');
  if (
    !url.hostname.includes('.') ||
    /^(localhost|127\.|0\.|10\.|192\.168\.|169\.254\.)/i.test(url.hostname) ||
    /\.(local|internal)$/i.test(url.hostname)
  )
    throw new Error('Use a public business website address.');
  url.hash = '';
  return url.href;
}
