import { fieldLimits, serviceValues, normalisePublicUrl } from '../src/lib/enquiry.ts';
import type { EnquiryData } from './types.ts';
export const MAX_BODY_BYTES = 65536;
const allowed = new Set([
  ...Object.keys(fieldLimits),
  'service',
  'form-name',
  'bot-field',
  'submission-id',
]);
export class InputError extends Error {
  status: number;
  fields: Record<string, string>;
  constructor(
    status: number,
    fields: Record<string, string>,
    message = 'Please check the highlighted details.',
  ) {
    super(message);
    this.status = status;
    this.fields = fields;
  }
}
export async function readSubmission(request: Request): Promise<Record<string, string>> {
  if (Number(request.headers.get('content-length') || 0) > MAX_BODY_BYTES)
    throw new InputError(413, {}, 'The request is too large. Please shorten your message.');
  const type = request.headers.get('content-type')?.split(';')[0].trim().toLowerCase();
  if (type !== 'application/json' && type !== 'application/x-www-form-urlencoded')
    throw new InputError(415, {}, 'Use the website enquiry form.');
  const reader = request.body?.getReader();
  let count = 0;
  const chunks: Uint8Array[] = [];
  if (reader)
    try {
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        count += value.byteLength;
        if (count > MAX_BODY_BYTES) {
          await reader.cancel();
          throw new InputError(413, {}, 'The request is too large. Please shorten your message.');
        }
        chunks.push(value);
      }
    } finally {
      reader.releaseLock();
    }
  const bytes = new Uint8Array(count);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  let text: string;
  try {
    text = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    throw new InputError(400, {}, 'The request could not be read.');
  }
  const result: Record<string, string> = Object.create(null);
  if (type === 'application/json') {
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      throw new InputError(400, {}, 'The request could not be read.');
    }
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed))
      throw new InputError(400, {}, 'The request could not be read.');
    for (const [key, value] of Object.entries(parsed)) {
      if (!allowed.has(key) || typeof value !== 'string')
        throw new InputError(400, {}, 'Unexpected form data.');
      result[key] = value;
    }
  } else {
    for (const [key, value] of new URLSearchParams(text)) {
      if (!allowed.has(key) || Object.hasOwn(result, key))
        throw new InputError(400, {}, 'Unexpected or repeated form fields.');
      result[key] = value;
    }
  }
  return result;
}
export function validateSubmission(input: Record<string, string>): EnquiryData {
  const data: Record<string, string> = Object.create(null);
  const errors: Record<string, string> = {};
  if (input['bot-field']?.trim())
    throw new InputError(
      422,
      {},
      'We could not accept this request. Please contact the business by email if this continues.',
    );
  if (input['form-name'] && input['form-name'] !== 'presence-review')
    throw new InputError(400, {}, 'Unexpected form name.');
  for (const [key, max] of Object.entries(fieldLimits)) {
    const value = (input[key] || '').normalize('NFC').replace(/\r\n?/g, '\n').trim();
    data[key] = value;
    if (value.length > max) errors[key] = `Use ${max} characters or fewer.`;
    if (
      [...value].some((character) => {
        const code = character.charCodeAt(0);
        return code === 127 || (code < 32 && !(key === 'goal' && [9, 10].includes(code)));
      })
    )
      errors[key] = 'Remove control characters from this field.';
  }
  for (const key of ['contact-name', 'business-name', 'email', 'goal'])
    if (!data[key]) errors[key] = 'Please complete this field.';
  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email))
    errors.email = 'Enter a valid email address.';
  for (const key of ['website', 'google-profile'])
    if (data[key])
      try {
        data[key] = normalisePublicUrl(data[key]);
        if (data[key].length > fieldLimits[key as 'website' | 'google-profile'])
          errors[key] = 'This address is too long.';
      } catch {
        errors[key] =
          'Enter a public http or https address without login details, or leave this field empty.';
      }
  data.service = input.service || 'not-sure';
  if (!serviceValues.includes(data.service as (typeof serviceValues)[number]))
    errors.service = 'Choose one of the listed services.';
  if (Object.keys(errors).length) throw new InputError(422, errors);
  return data as unknown as EnquiryData;
}
