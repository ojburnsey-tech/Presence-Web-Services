import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { handleRequest } from '../server/runtime.ts';
import { openLocalDatabase } from '../scripts/local-db.mjs';
const origin = 'https://presence.test';
const valid = {
  'contact-name': 'Test Owner',
  'business-name': 'Test Business',
  email: 'dummy@example.invalid',
  website: 'example.com',
  'google-profile': '',
  location: 'Belfast',
  telephone: '028 9000 0000',
  service: 'one-off',
  goal: 'Test enquiry only. Make contact options clearer.',
};
const assets = {
  '/index.html': { body: '<h1>Home</h1>', type: 'text/html' },
  '/thank-you/index.html': {
    body: '<h1 data-receipt-heading>After your audit request</h1><p data-receipt-copy>Neutral.</p><p data-receipt-note>Opening directly does not confirm receipt.</p>',
    type: 'text/html',
  },
  '/404.html': { body: '<h1>Not found</h1>', type: 'text/html' },
};
function fixture(db = openLocalDatabase()) {
  const env = {
    DB: db.binding,
    APP_SECRET: 'test-secret-'.repeat(5),
    OWNER_REVIEW_TOKEN: 'test-owner-'.repeat(5),
    ENQUIRIES_ENABLED: 'true',
    DEPLOYMENT_STAGE: 'staging',
  };
  return {
    db,
    env,
    run: (path, init = {}, now) =>
      handleRequest(new Request(origin + path, init), env, assets, now),
    close: () => db.close(),
  };
}
const post = (data = valid, headers = {}) => ({
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Origin: origin, ...headers },
  body: JSON.stringify(data),
});
const auth = (f) => ({ Authorization: `Bearer ${f.env.OWNER_REVIEW_TOKEN}` });
async function isolated(callback) {
  const f = fixture();
  try {
    await callback(f);
  } finally {
    f.close();
  }
}

test('valid submission is durably saved and available only through the authorised owner path', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'presence-'));
  const file = join(dir, 'db.sqlite');
  let f = fixture(openLocalDatabase(file));
  try {
    const response = await f.run('/api/enquiries', post());
    assert.equal(response.status, 201);
    assert.equal((await response.json()).accepted, true);
    f.close();
    f = fixture(openLocalDatabase(file));
    const owner = await f.run('/api/owner/enquiries', { headers: auth(f) });
    const { items } = await owner.json();
    assert.equal(items.length, 1);
    assert.equal(items[0].website, 'https://example.com/');
    assert.equal(items[0].email, valid.email);
    assert.equal(f.db.raw.prepare('SELECT count(*) n FROM enquiries').get().n, 1);
  } finally {
    f.close();
    rmSync(dir, { recursive: true, force: true });
  }
});

test('missing required fields, invalid email, URLs, service and length limits fail with no writes', async () =>
  isolated(async (f) => {
    for (const [field, value] of [
      ['contact-name', ' '],
      ['business-name', ''],
      ['goal', ''],
      ['telephone', ''],
      ['telephone', 'call me'],
      ['telephone', '123'],
      ['email', 'invalid'],
      ['goal', 'bad\u0000control'],
      ['website', 'javascript:alert(1)'],
      ['website', 'https://user:secret@example.com'],
      ['website', 'http://127.0.0.1'],
      ['google-profile', 'bad'],
      ['service', 'enterprise'],
      ['goal', 'x'.repeat(4001)],
      ['contact-name', 'x'.repeat(101)],
    ]) {
      const r = await f.run('/api/enquiries', post({ ...valid, [field]: value }));
      assert.equal(r.status, 422, field);
      assert.ok((await r.json()).fields[field]);
    }
    assert.equal(f.db.raw.prepare('SELECT count(*) n FROM enquiries').get().n, 0);
  }));

test('HTML and SQL-like text remain inert literal database values; no public read route exists', async () =>
  isolated(async (f) => {
    const attack = '<script>alert("x")</script>\n\' OR 1=1; DROP TABLE enquiries; --';
    assert.equal((await f.run('/api/enquiries', post({ ...valid, goal: attack }))).status, 201);
    const r = await f.run('/api/owner/enquiries', { headers: auth(f) });
    assert.equal((await r.json()).items[0].goal, attack);
    assert.equal((await f.run('/api/enquiries')).status, 405);
    const page = await f.run('/');
    assert.ok(!(await page.text()).includes(attack));
  }));

test('size, malformed JSON, unexpected fields, repeated fields and inappropriate content types are rejected', async () =>
  isolated(async (f) => {
    for (const [body, type, status] of [
      ['{', 'application/json', 400],
      ['[]', 'application/json', 400],
      [JSON.stringify({ ...valid, admin: 'true' }), 'application/json', 400],
      [JSON.stringify({ ...valid, email: [] }), 'application/json', 400],
      ['email=a&email=b', 'application/x-www-form-urlencoded', 400],
      ['x', 'text/plain', 415],
      ['x'.repeat(65537), 'application/json', 413],
    ]) {
      assert.equal(
        (await f.run('/api/enquiries', { method: 'POST', headers: { 'Content-Type': type }, body }))
          .status,
        status,
      );
    }
  }));

test('idempotency, payload deduplication and concurrent double-clicks store exactly one row', async () =>
  isolated(async (f) => {
    const data = { ...valid, 'submission-id': 'a'.repeat(32) };
    const responses = await Promise.all([
      f.run('/api/enquiries', post(data)),
      f.run('/api/enquiries', post(data)),
    ]);
    assert.ok(responses.every((r) => [200, 201].includes(r.status)));
    assert.equal((await f.run('/api/enquiries', post(data))).status, 200);
    assert.equal((await f.run('/api/enquiries', post(valid))).status, 200);
    assert.equal((await f.run('/api/enquiries', post({ ...data, goal: 'changed' }))).status, 409);
    assert.equal(f.db.raw.prepare('SELECT count(*) n FROM enquiries').get().n, 1);
  }));

test('honeypot and cross-site submissions are refused without persistence', async () =>
  isolated(async (f) => {
    assert.equal(
      (await f.run('/api/enquiries', post({ ...valid, 'bot-field': 'spam' }))).status,
      422,
    );
    assert.equal(
      (await f.run('/api/enquiries', post(valid, { Origin: 'https://other.test' }))).status,
      403,
    );
    assert.equal(
      (await f.run('/api/enquiries', post(valid, { 'Sec-Fetch-Site': 'cross-site' }))).status,
      403,
    );
    assert.equal(f.db.raw.prepare('SELECT count(*) n FROM enquiries').get().n, 0);
  }));

test('per-IP rate limits reject the sixth distinct request, while committed retries remain safe', async () =>
  isolated(async (f) => {
    const now = 1800000000000;
    for (let i = 0; i < 5; i++)
      assert.equal(
        (await f.run('/api/enquiries', post({ ...valid, goal: 'Test ' + i }), now)).status,
        201,
      );
    const r = await f.run('/api/enquiries', post({ ...valid, goal: 'Test sixth' }), now);
    assert.equal(r.status, 429);
    assert.ok(Number(r.headers.get('Retry-After')) > 0);
    assert.equal(
      (await f.run('/api/enquiries', post({ ...valid, goal: 'Test 0' }), now)).status,
      200,
    );
    assert.equal(f.db.raw.prepare('SELECT count(*) n FROM enquiries').get().n, 5);
  }));

test('disabled, misconfigured and failed storage return genuine errors without a receipt', async () =>
  isolated(async (f) => {
    for (const patch of [
      { ENQUIRIES_ENABLED: 'false' },
      { APP_SECRET: '' },
      { OWNER_REVIEW_TOKEN: '' },
      { DB: undefined },
      {
        DB: {
          prepare() {
            throw new Error('test database failure');
          },
        },
      },
    ]) {
      const env = { ...f.env, ...patch };
      const r = await handleRequest(new Request(origin + '/api/enquiries', post()), env, assets);
      assert.equal(r.status, 503);
      assert.equal(r.headers.get('Set-Cookie'), null);
      assert.equal((await r.json()).accepted, false);
    }
  }));

test('owner review, pagination, deletion and purge require server-side authorisation', async () =>
  isolated(async (f) => {
    await f.run('/api/enquiries', post());
    const id = f.db.raw.prepare('SELECT id FROM enquiries').get().id;
    for (const path of [
      '/api/owner/enquiries',
      '/api/owner/enquiries?limit=100',
      '/api/owner/enquiries/' + id,
      '/api/owner/purge',
    ]) {
      const method = path.endsWith('purge') ? 'POST' : path.includes(id) ? 'DELETE' : 'GET';
      for (const headers of [
        {},
        { Authorization: 'Bearer wrong' },
        { 'oai-authenticated-user-id': 'pretend-owner' },
      ])
        assert.equal((await f.run(path, { method, headers })).status, 401);
    }
    assert.equal(
      (await f.run('/api/owner/enquiries?limit=1000', { headers: auth(f) })).status,
      400,
    );
    assert.equal(
      (
        await f.run('/api/owner/enquiries/' + id, {
          method: 'DELETE',
          headers: { ...auth(f), Origin: 'https://bad.test' },
        })
      ).status,
      403,
    );
    assert.equal(
      (await f.run('/api/owner/enquiries/' + id, { method: 'DELETE', headers: auth(f) })).status,
      204,
    );
    assert.equal(
      (await f.run('/api/owner/enquiries/' + id, { method: 'DELETE', headers: auth(f) })).status,
      404,
    );
  }));

test('receipt requires a committed save, a valid signature and unexpired opaque cookie', async () =>
  isolated(async (f) => {
    const now = 1800000000000;
    assert.match(await (await f.run('/thank-you/', {}, now)).text(), /Opening directly/);
    const r = await f.run('/api/enquiries', post(), now);
    const cookie = r.headers.get('Set-Cookie');
    assert.match(cookie, /HttpOnly/);
    assert.match(cookie, /Secure/);
    assert.match(cookie, /SameSite=Lax/);
    assert.ok(!cookie.includes(valid.email));
    const raw = cookie.split(';')[0];
    assert.match(
      await (await f.run('/thank-you/', { headers: { Cookie: raw } }, now)).text(),
      /Your request has been received/,
    );
    assert.match(
      await (await f.run('/thank-you/', { headers: { Cookie: raw + 'x' } }, now)).text(),
      /Opening directly/,
    );
    assert.match(
      await (await f.run('/thank-you/', { headers: { Cookie: raw } }, now + 600001)).text(),
      /Opening directly/,
    );
  }));

test('native no-JavaScript POST redirects only after persistence and provides useful error HTML', async () =>
  isolated(async (f) => {
    const native = (data) => ({
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', Origin: origin },
      body: new URLSearchParams(data),
    });
    const r = await f.run('/api/enquiries', native(valid));
    assert.equal(r.status, 303);
    assert.equal(r.headers.get('Location'), '/thank-you/');
    const error = await f.run('/api/enquiries', native({ ...valid, email: 'bad' }));
    assert.equal(error.status, 422);
    assert.match(error.headers.get('Content-Type'), /text\/html/);
    assert.match(await error.text(), /Your enquiry was not sent/);
  }));

test('retention expiry purges records on owner access and production refuses missing approval', async () =>
  isolated(async (f) => {
    const now = 1800000000000;
    await f.run('/api/enquiries', post(), now);
    const r = await f.run('/api/owner/enquiries', { headers: auth(f) }, now + 86400001);
    assert.equal((await r.json()).items.length, 0);
    assert.equal(f.db.raw.prepare('SELECT count(*) n FROM enquiries').get().n, 0);
    const env = { ...f.env, DEPLOYMENT_STAGE: 'production' };
    assert.equal((await handleRequest(new Request(origin + '/'), env, assets)).status, 503);
    env.PUBLIC_LAUNCH_APPROVED = 'true';
    assert.equal(
      (await handleRequest(new Request(origin + '/api/enquiries', post()), env, assets)).status,
      503,
    );
  }));

test('security headers, health, HEAD, missing pages and safe slash redirects are correct', async () =>
  isolated(async (f) => {
    const r = await f.run('/');
    assert.equal(r.headers.get('X-Content-Type-Options'), 'nosniff');
    assert.equal(r.headers.get('X-Frame-Options'), 'DENY');
    assert.match(r.headers.get('Content-Security-Policy'), /form-action 'self'/);
    assert.ok(!r.headers.get('Content-Security-Policy').includes('unsafe-inline'));
    assert.equal(r.headers.get('X-Robots-Tag'), 'noindex, nofollow');
    assert.equal((await f.run('/api/health')).status, 200);
    assert.equal((await f.run('/missing')).status, 404);
    assert.equal((await f.run('/.env')).status, 404);
    assert.equal((await f.run('/', { method: 'HEAD' })).status, 200);
    const redirect = await f.run('/thank-you?next=https://bad.test');
    assert.equal(redirect.status, 308);
    assert.equal(redirect.headers.get('Location'), '/thank-you/?next=https://bad.test');
  }));

test('approved production uses only the fixed HTTPS canonical origin', async () =>
  isolated(async (f) => {
    const env = {
      ...f.env,
      DEPLOYMENT_STAGE: 'production',
      PUBLIC_LAUNCH_APPROVED: 'true',
      BUILD_PUBLIC_RELEASE: 'true',
      ENQUIRY_RETENTION_DAYS: '30',
    };
    const r = await handleRequest(
      new Request('http://www.presencewebservices.co.uk/pricing/?next=https://bad.test'),
      env,
      assets,
    );
    assert.equal(r.status, 308);
    assert.equal(
      r.headers.get('Location'),
      'https://presencewebservices.co.uk/pricing/?next=https://bad.test',
    );
  }));

/* ------------------------------------------------------------------ email */

/** Replaces global fetch with a recorder for Resend calls; restores it afterwards. */
async function withMail(f, respond, callback) {
  const original = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (url, init) => {
    calls.push({ url: String(url), headers: init.headers, body: JSON.parse(init.body) });
    return respond(calls.length);
  };
  f.env.RESEND_API_KEY = 're_test_key';
  try {
    await callback(calls);
  } finally {
    globalThis.fetch = original;
  }
}
const resendOk = (n) => new Response(JSON.stringify({ id: `re_${n}` }), { status: 200 });
const statuses = (f) =>
  f.db.raw.prepare('SELECT notify_status n, confirm_status c FROM enquiries ORDER BY seq').all();

test('without an email key, enquiries are saved and marked as not emailed', async () =>
  isolated(async (f) => {
    const original = globalThis.fetch;
    let called = false;
    globalThis.fetch = async () => {
      called = true;
      return resendOk(1);
    };
    try {
      assert.equal((await f.run('/api/enquiries', post())).status, 201);
    } finally {
      globalThis.fetch = original;
    }
    assert.equal(called, false);
    assert.deepEqual(
      { ...statuses(f)[0] },
      {
        n: 'skipped:not-configured',
        c: 'skipped:not-configured',
      },
    );
    const { items } = await (await f.run('/api/owner/enquiries', { headers: auth(f) })).json();
    assert.equal(items[0].emailToOwner, 'skipped:not-configured');
  }));

test('a new enquiry emails the owner with every detail and the customer a fixed confirmation', async () =>
  isolated(async (f) =>
    withMail(f, resendOk, async (calls) => {
      const hostile = {
        ...valid,
        'contact-name': 'Ann <script>alert(1)</script>',
        // Line breaks are already refused by validation; these characters are allowed but must be escaped.
        'business-name': 'Shop & Co <b>Bold</b>',
        goal: 'Line one\n<img src=x onerror=alert(1)>',
      };
      assert.equal((await f.run('/api/enquiries', post(hostile))).status, 201);
      assert.equal(calls.length, 2);
      const [alert, confirm] = calls;
      const id = f.db.raw.prepare('SELECT id FROM enquiries').get().id;

      assert.equal(alert.url, 'https://api.resend.com/emails');
      assert.equal(alert.headers.Authorization, 'Bearer re_test_key');
      assert.equal(alert.headers['Idempotency-Key'], `alert-${id}`);
      assert.deepEqual(alert.body.to, ['contact@presencewebservices.co.uk']);
      assert.equal(alert.body.reply_to, valid.email);
      assert.doesNotMatch(alert.body.subject, /[\r\n]/);
      assert.match(alert.body.subject, /^Audit request: Shop/);
      // Every detail is present, and markup the visitor typed is inert.
      for (const value of [valid.email, valid.telephone, 'https://example.com/', 'Belfast'])
        assert.ok(alert.body.html.includes(value), value);
      assert.ok(alert.body.html.includes('&lt;script&gt;'));
      assert.ok(alert.body.html.includes('Shop &amp; Co &lt;b&gt;Bold&lt;/b&gt;'));
      assert.ok(!alert.body.html.includes('<script>'));
      assert.ok(!alert.body.html.includes('<img src=x'));
      assert.ok(alert.body.text.includes('Line one'));

      assert.equal(confirm.headers['Idempotency-Key'], `confirm-${id}`);
      assert.deepEqual(confirm.body.to, [valid.email]);
      assert.equal(confirm.body.reply_to, 'contact@presencewebservices.co.uk');
      // The confirmation repeats nothing the visitor typed.
      for (const typed of ['Ann', 'Shop', 'Line one', 'Belfast', valid.telephone])
        assert.ok(!confirm.body.html.includes(typed) && !confirm.body.text.includes(typed), typed);

      assert.deepEqual({ ...statuses(f)[0] }, { n: 'sent:re_1', c: 'sent:re_2' });
    }),
  ));

test('a repeated submission sends no second email, and a provider failure keeps the enquiry', async () =>
  isolated(async (f) =>
    withMail(
      f,
      (n) => (n === 1 ? new Response('{}', { status: 500 }) : resendOk(n)),
      async (calls) => {
        const once = post({ ...valid, 'submission-id': 'a'.repeat(32) });
        assert.equal((await f.run('/api/enquiries', once)).status, 201);
        assert.equal(
          (await f.run('/api/enquiries', post({ ...valid, 'submission-id': 'a'.repeat(32) })))
            .status,
          200,
        );
        assert.equal(calls.length, 2);
        assert.deepEqual({ ...statuses(f)[0] }, { n: 'failed:500', c: 'sent:re_2' });
      },
    ),
  ));

test('confirmations to one address are capped per day while owner alerts continue', async () =>
  isolated(async (f) =>
    withMail(f, resendOk, async (calls) => {
      for (const goal of ['First request.', 'Second request.', 'Third request.'])
        assert.equal((await f.run('/api/enquiries', post({ ...valid, goal }))).status, 201);
      const sentTo = calls.map((call) => call.body.to[0]);
      assert.equal(sentTo.filter((to) => to === 'contact@presencewebservices.co.uk').length, 3);
      assert.equal(sentTo.filter((to) => to === valid.email).length, 2);
      assert.equal(statuses(f)[2].c, 'skipped:daily-limit');
    }),
  ));

test('Sites waitUntil sends emails after receipt without making a false delivery claim', async () =>
  isolated(async (f) => {
    const previousFetch = globalThis.fetch;
    let release;
    let count = 0;
    const work = [];
    f.env.RESEND_API_KEY = 're_test_key';
    globalThis.fetch = async () => {
      count++;
      if (count === 1)
        return new Promise((resolve) => {
          release = () => resolve(resendOk(1));
        });
      return resendOk(count);
    };
    try {
      const response = await handleRequest(
        new Request(origin + '/api/enquiries', post()),
        f.env,
        assets,
        Date.now(),
        {
          waitUntil: (promise) => {
            work.push(promise);
          },
        },
      );
      assert.equal(response.status, 201);
      assert.equal(count, 1);
      assert.equal(work.length, 1);
      assert.equal(statuses(f)[0].n, null);
      const cookie = response.headers.get('Set-Cookie').split(';')[0];
      const confirmation = await f.run('/thank-you/', { headers: { Cookie: cookie } });
      const body = await confirmation.text();
      assert.match(body, /Your request has been received/);
      assert.doesNotMatch(body, /No email notification has been sent/);
      release();
      await Promise.all(work);
      assert.deepEqual({ ...statuses(f)[0] }, { n: 'sent:re_1', c: 'sent:re_2' });
    } finally {
      release?.();
      await Promise.allSettled(work);
      globalThis.fetch = previousFetch;
    }
  }));
