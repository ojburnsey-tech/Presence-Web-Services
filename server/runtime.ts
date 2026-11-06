import { InputError, readSubmission, validateSubmission } from './validation.ts';
import type {
  AppEnv,
  AssetMap,
  EnquiryData,
  EnquiryRow,
  Database,
  WorkerContext,
} from './types.ts';
import { customerConfirmation, mailConfig, ownerAlert, sendEmail } from './email.ts';
const encoder = new TextEncoder();
const cookieName = 'presence_receipt';
const json = (data: unknown, status = 200, headers: HeadersInit = {}) =>
  new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      ...headers,
    },
  });
function escapeHtml(text: string): string {
  return text.replace(
    /[&<>"']/g,
    (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!,
  );
}
async function hmac(secret: string, text: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const bytes = new Uint8Array(await crypto.subtle.sign('HMAC', key, encoder.encode(text)));
  return [...bytes].map((value) => value.toString(16).padStart(2, '0')).join('');
}
async function equalSecret(provided: string, expected: string): Promise<boolean> {
  const left = new Uint8Array(await crypto.subtle.digest('SHA-256', encoder.encode(provided)));
  const right = new Uint8Array(await crypto.subtle.digest('SHA-256', encoder.encode(expected)));
  let difference = 0;
  for (let i = 0; i < left.length; i++) difference |= left[i] ^ right[i];
  return difference === 0;
}
function configReady(env: AppEnv): boolean {
  return (
    env.ENQUIRIES_ENABLED === 'true' &&
    !!env.DB &&
    (env.APP_SECRET?.length || 0) >= 32 &&
    (env.OWNER_REVIEW_TOKEN?.length || 0) >= 32 &&
    (env.DEPLOYMENT_STAGE !== 'production' ||
      (env.PUBLIC_LAUNCH_APPROVED === 'true' && Number(env.ENQUIRY_RETENTION_DAYS) > 0))
  );
}
function originAllowed(request: Request): boolean {
  const origin = request.headers.get('origin');
  return (
    request.headers.get('sec-fetch-site') !== 'cross-site' &&
    (!origin || origin === new URL(request.url).origin)
  );
}
async function purge(db: Database, now: number) {
  const result = await db.prepare('DELETE FROM enquiries WHERE expires_at <= ?').bind(now).run();
  await db
    .prepare('DELETE FROM enquiry_rate_limits WHERE window_start < ?')
    .bind(now - 86400000)
    .run();
  return result.meta.changes;
}
async function receipt(env: AppEnv, id: string, now: number) {
  const payload = `${id}.${now + 600000}`;
  return `${payload}.${await hmac(env.APP_SECRET!, `receipt:${payload}`)}`;
}
async function validReceipt(request: Request, env: AppEnv, now: number): Promise<boolean> {
  const value = request.headers
    .get('cookie')
    ?.split(';')
    .map((x) => x.trim())
    .find((x) => x.startsWith(`${cookieName}=`))
    ?.slice(cookieName.length + 1);
  if (!value || !env.APP_SECRET) return false;
  const [id, expiry, signature, ...extra] = value.split('.');
  if (
    extra.length ||
    !id ||
    !expiry ||
    !signature ||
    !/^\d+$/.test(expiry) ||
    Number(expiry) < now ||
    Number(expiry) > now + 600000
  )
    return false;
  return equalSecret(signature, await hmac(env.APP_SECRET, `receipt:${id}.${expiry}`));
}
async function accepted(
  request: Request,
  env: AppEnv,
  row: EnquiryRow,
  duplicate: boolean,
  now: number,
) {
  const token = await receipt(env, row.id, now);
  const secure = new URL(request.url).protocol === 'https:' ? '; Secure' : '';
  const headers = {
    'Set-Cookie': `${cookieName}=${token}; Path=/thank-you/; Max-Age=600; HttpOnly; SameSite=Lax${secure}`,
  };
  if (request.headers.get('content-type')?.startsWith('application/json'))
    return json(
      { accepted: true, duplicate, redirect: '/thank-you/' },
      duplicate ? 200 : 201,
      headers,
    );
  return new Response(null, {
    status: 303,
    headers: { ...headers, Location: '/thank-you/', 'Cache-Control': 'no-store' },
  });
}
/** Confirmations allowed per recipient address per day, to stop the form being used to spam. */
const CONFIRMATIONS_PER_ADDRESS_PER_DAY = 2;

/**
 * Sends the owner alert and the customer confirmation for a newly saved enquiry, then records
 * the outcome on the row. The enquiry is already stored, so failures here are recorded rather
 * than reported to the visitor.
 */
async function deliver(env: AppEnv, row: EnquiryRow, data: EnquiryData, now: number) {
  const db = env.DB!;
  const record = (notify: string, confirm: string) =>
    db
      .prepare('UPDATE enquiries SET notify_status = ?, confirm_status = ? WHERE id = ?')
      .bind(notify, confirm, row.id)
      .run();
  const config = mailConfig(env);
  if (!config) {
    await record('skipped:not-configured', 'skipped:not-configured');
    return;
  }
  const notify = await sendEmail(
    config,
    ownerAlert(data, { id: row.id, createdAt: row.created_at, expiresAt: row.expires_at }, config),
    `alert-${row.id}`,
  );
  const day = 86400000;
  const recipientKey = await hmac(env.APP_SECRET!, `confirm:${data.email.toLowerCase()}`);
  const count = await db
    .prepare(
      'INSERT INTO enquiry_rate_limits (rate_key,window_start,attempts) VALUES (?, ?, 1) ON CONFLICT(rate_key,window_start) DO UPDATE SET attempts = attempts+1 RETURNING attempts',
    )
    .bind(`${recipientKey}:confirm`, Math.floor(now / day) * day)
    .first<{ attempts: number }>();
  const confirm =
    count && count.attempts > CONFIRMATIONS_PER_ADDRESS_PER_DAY
      ? 'skipped:daily-limit'
      : await sendEmail(config, customerConfirmation(data.email, config), `confirm-${row.id}`);
  await record(notify, confirm);
}

async function submit(
  request: Request,
  env: AppEnv,
  now: number,
  ctx?: WorkerContext,
): Promise<Response> {
  if (!originAllowed(request))
    return json({ accepted: false, message: 'This request must come from the enquiry page.' }, 403);
  if (!configReady(env))
    return json(
      {
        accepted: false,
        message:
          'Enquiries are temporarily unavailable. Your request has not been saved. Please try again later or email contact@presencewebservices.co.uk.',
      },
      503,
      { 'Retry-After': '300' },
    );
  const input = await readSubmission(request);
  const data = validateSubmission(input);
  const payload = JSON.stringify(data);
  const fingerprint = await hmac(env.APP_SECRET!, `payload:${payload}`);
  const supplied = input['submission-id'] || '';
  if (supplied && !/^[a-f\d]{32}$/.test(supplied))
    throw new InputError(422, {}, 'Please reload the enquiry form and try again.');
  const requestKey =
    supplied || (await hmac(env.APP_SECRET!, `native:${fingerprint}:${Math.floor(now / 120000)}`));
  const db = env.DB!;
  const existing = await db
    .prepare('SELECT * FROM enquiries WHERE request_key = ? AND expires_at > ?')
    .bind(requestKey, now)
    .first<EnquiryRow>();
  if (existing) {
    if (existing.payload_hash !== fingerprint)
      return json(
        {
          accepted: false,
          message: 'This request has changed since it was sent. Please start a new enquiry.',
        },
        409,
      );
    return accepted(request, env, existing, true, now);
  }
  const ip = request.headers.get('cf-connecting-ip') || 'unidentified';
  const rateKey = await hmac(env.APP_SECRET!, `rate:${ip}`);
  for (const [duration, limit] of [
    [60000, 5],
    [3600000, 20],
  ]) {
    const start = Math.floor(now / duration) * duration;
    const rate = await db
      .prepare(
        'INSERT INTO enquiry_rate_limits (rate_key,window_start,attempts) VALUES (?, ?, 1) ON CONFLICT(rate_key,window_start) DO UPDATE SET attempts = attempts+1 RETURNING attempts',
      )
      .bind(`${rateKey}:${duration}`, start)
      .first<{ attempts: number }>();
    if (rate && rate.attempts > limit)
      return json(
        { accepted: false, message: 'Too many requests. Please wait before trying again.' },
        429,
        { 'Retry-After': String(Math.ceil((start + duration - now) / 1000)) },
      );
  }
  await purge(db, now);
  const days = env.DEPLOYMENT_STAGE === 'production' ? Number(env.ENQUIRY_RETENTION_DAYS) : 1;
  if (!Number.isInteger(days) || days < 1 || days > 3650)
    return json(
      {
        accepted: false,
        message: 'Enquiries are temporarily unavailable. Nothing has been saved.',
      },
      503,
    );
  const id = crypto.randomUUID();
  await db
    .prepare(
      'INSERT OR IGNORE INTO enquiries (id,request_key,payload_hash,created_at,expires_at,data_json) SELECT ?, ?, ?, ?, ?, ? WHERE NOT EXISTS (SELECT 1 FROM enquiries WHERE payload_hash = ? AND created_at > ?)',
    )
    .bind(
      id,
      requestKey,
      fingerprint,
      now,
      now + days * 86400000,
      payload,
      fingerprint,
      now - 120000,
    )
    .run();
  const saved = await db
    .prepare(
      'SELECT * FROM enquiries WHERE request_key = ? OR (payload_hash = ? AND created_at > ?) ORDER BY seq DESC LIMIT 1',
    )
    .bind(requestKey, fingerprint, now - 120000)
    .first<EnquiryRow>();
  if (!saved) throw new Error('Persistence failed.');
  if (saved.payload_hash !== fingerprint)
    return json(
      {
        accepted: false,
        message: 'A conflicting request was received. Please start a new enquiry.',
      },
      409,
    );
  const duplicate = saved.id !== id;
  if (!duplicate) {
    // Email only for a genuinely new enquiry. On the hosted Worker the visitor gets their
    // response straight away and delivery finishes in the background via waitUntil.
    const delivery = deliver(env, saved, data, now).catch(() => {
      /* The row keeps a null status, which the owner API reports as "pending". */
    });
    if (ctx?.waitUntil) ctx.waitUntil(delivery);
    else await delivery;
  }
  return accepted(request, env, saved, duplicate, now);
}
async function owner(request: Request, env: AppEnv, url: URL, now: number): Promise<Response> {
  const token = request.headers.get('authorization')?.replace(/^Bearer /, '') || '';
  if (
    !env.OWNER_REVIEW_TOKEN ||
    env.OWNER_REVIEW_TOKEN.length < 32 ||
    token.length > 512 ||
    !(await equalSecret(token, env.OWNER_REVIEW_TOKEN))
  )
    return json({ message: 'Unauthorised.' }, 401);
  if (!env.DB) return json({ message: 'Storage unavailable.' }, 503);
  if (request.method !== 'GET' && !originAllowed(request))
    return json({ message: 'Origin rejected.' }, 403);
  if (url.pathname === '/api/owner/enquiries' && request.method === 'GET') {
    const raw = url.searchParams.get('limit') || '25';
    const before = url.searchParams.get('before') || String(Number.MAX_SAFE_INTEGER);
    if (
      !/^\d+$/.test(raw) ||
      Number(raw) < 1 ||
      Number(raw) > 100 ||
      !/^\d+$/.test(before) ||
      !Number.isSafeInteger(Number(before))
    )
      return json({ message: 'Invalid pagination.' }, 400);
    await purge(env.DB, now);
    const { results } = await env.DB.prepare(
      'SELECT * FROM enquiries WHERE seq < ? ORDER BY seq DESC LIMIT ?',
    )
      .bind(Number(before), Number(raw))
      .all<EnquiryRow>();
    return json({
      items: results.map((row) => ({
        id: row.id,
        createdAt: new Date(row.created_at).toISOString(),
        expiresAt: new Date(row.expires_at).toISOString(),
        ...JSON.parse(row.data_json),
        emailToOwner: row.notify_status ?? 'pending',
        emailToCustomer: row.confirm_status ?? 'pending',
      })),
      nextCursor: results.length === Number(raw) ? results.at(-1)?.seq : null,
    });
  }
  if (url.pathname === '/api/owner/purge' && request.method === 'POST')
    return json({ deleted: await purge(env.DB, now) });
  const match = url.pathname.match(/^\/api\/owner\/enquiries\/([a-f\d-]{36})$/);
  if (match && request.method === 'DELETE') {
    const result = await env.DB.prepare('DELETE FROM enquiries WHERE id = ?').bind(match[1]).run();
    return new Response(null, { status: result.meta.changes ? 204 : 404 });
  }
  return json({ message: 'Not found.' }, 404);
}
function failurePage(message: string, fields: Record<string, string>, status: number) {
  const details = Object.entries(fields)
    .map(([key, value]) => `<li>${escapeHtml(key)}: ${escapeHtml(value)}</li>`)
    .join('');
  return new Response(
    `<!doctype html><html lang="en-GB"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Enquiry not sent | Presence Web Services</title><link rel="stylesheet" href="/error.css"><main><h1>Your enquiry was not sent</h1><p>${escapeHtml(message)}</p>${details ? `<ul>${details}</ul>` : ''}<p>Use your browser’s Back button to return to the form and check your details. You can also contact <a href="mailto:contact@presencewebservices.co.uk">contact@presencewebservices.co.uk</a>.</p><a href="/contact/">Return to the enquiry page</a></main></html>`,
    {
      status,
      headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' },
    },
  );
}
function protect(response: Response, request: Request, env: AppEnv): Response {
  const headers = new Headers(response.headers);
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  headers.set('X-Frame-Options', 'DENY');
  headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');
  headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'; object-src 'none'",
  );
  if (new URL(request.url).protocol === 'https:')
    headers.set('Strict-Transport-Security', 'max-age=31536000');
  if (env.DEPLOYMENT_STAGE !== 'production') headers.set('X-Robots-Tag', 'noindex, nofollow');
  if (!headers.has('Cache-Control')) headers.set('Cache-Control', 'no-store');
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
export async function handleRequest(
  request: Request,
  env: AppEnv,
  assets: AssetMap,
  now = Date.now(),
  ctx?: WorkerContext,
): Promise<Response> {
  const url = new URL(request.url);
  let response: Response;
  try {
    if (
      env.DEPLOYMENT_STAGE === 'production' &&
      (env.PUBLIC_LAUNCH_APPROVED !== 'true' || env.BUILD_PUBLIC_RELEASE !== 'true')
    )
      response = json({ message: 'Release awaiting owner approval.' }, 503);
    else if (
      env.DEPLOYMENT_STAGE === 'production' &&
      url.origin !== 'https://presencewebservices.co.uk'
    )
      response = new Response(null, {
        status: 308,
        headers: { Location: `https://presencewebservices.co.uk${url.pathname}${url.search}` },
      });
    else if (url.pathname === '/api/enquiries')
      response =
        request.method === 'POST'
          ? await submit(request, env, now, ctx)
          : json({ message: 'Method not allowed.' }, 405, { Allow: 'POST' });
    else if (url.pathname.startsWith('/api/owner/')) response = await owner(request, env, url, now);
    else if (url.pathname === '/api/health') {
      let ready = false;
      if (configReady(env))
        try {
          await env.DB!.prepare('SELECT id FROM enquiries LIMIT 1').first();
          ready = true;
        } catch {
          /* No enquiry details are logged. */
        }
      response = json({ enquiriesAvailable: ready }, ready ? 200 : 503);
    } else if (request.method !== 'GET' && request.method !== 'HEAD')
      response = json({ message: 'Method not allowed.' }, 405, { Allow: 'GET, HEAD' });
    else {
      let pathname = url.pathname;
      let asset = assets[pathname];
      if (!asset && assets[`${pathname}/index.html`])
        return protect(
          new Response(null, { status: 308, headers: { Location: `${pathname}/${url.search}` } }),
          request,
          env,
        );
      if (!asset && pathname.endsWith('/')) asset = assets[`${pathname}index.html`];
      let status = 200;
      if (!asset) {
        asset = assets['/404.html'];
        status = 404;
        pathname = '/404.html';
      }
      if (!asset) response = new Response('Not found', { status: 404 });
      else {
        let body: BodyInit = asset.base64
          ? Uint8Array.from(atob(asset.body), (char) => char.charCodeAt(0))
          : asset.body;
        if (url.pathname === '/thank-you/' && (await validReceipt(request, env, now))) {
          body = asset.body
            .replace(
              /(<h1\b[^>]*data-receipt-heading[^>]*>)[\s\S]*?(<\/h1>)/,
              '$1Your request has been received.$2',
            )
            .replace(
              /(<p\b[^>]*data-receipt-copy[^>]*>)[\s\S]*?(<\/p>)/,
              '$1Your enquiry has been saved. Presence will use the details you shared to assess your public website and business presence.$2',
            )
            .replace(
              /(<p\b[^>]*data-receipt-note[^>]*>)[\s\S]*?(<\/p>)/,
              env.DEPLOYMENT_STAGE === 'production'
                ? '$1No paid work starts until a separate proposal has been agreed.$2'
                : '$1This is a private staging test. No email notification has been sent.$2',
            );
        }
        response = new Response(request.method === 'HEAD' ? null : body, {
          status,
          headers: {
            'Content-Type': asset.type,
            'Cache-Control': pathname.startsWith('/_astro/')
              ? 'public, max-age=31536000, immutable'
              : 'no-store',
          },
        });
      }
    }
  } catch (error) {
    if (error instanceof InputError)
      response = request.headers.get('content-type')?.startsWith('application/json')
        ? json({ accepted: false, message: error.message, fields: error.fields }, error.status)
        : failurePage(error.message, error.fields, error.status);
    else
      response =
        request.headers.get('content-type')?.startsWith('application/json') ||
        url.pathname.startsWith('/api/owner/')
          ? json(
              {
                accepted: false,
                message:
                  'The service could not save your request. Please try again later. Your details remain in the form.',
              },
              503,
            )
          : failurePage(
              'The service could not save your request. Please try again later.',
              {},
              503,
            );
  }
  if (
    url.pathname === '/api/enquiries' &&
    request.method === 'POST' &&
    !request.headers.get('content-type')?.startsWith('application/json') &&
    response.status >= 400 &&
    response.headers.get('content-type')?.includes('application/json')
  ) {
    const details = (await response.json()) as {
      message?: string;
      fields?: Record<string, string>;
    };
    response = failurePage(
      details.message || 'The request could not be saved.',
      details.fields || {},
      response.status,
    );
  }
  return protect(response, request, env);
}
