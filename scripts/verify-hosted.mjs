import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
const origin = 'https://presence-private-preview-4nov-c73a.ojburnsey.chatgpt.site';
let config;
if (process.env.PRESENCE_OWNER_TOKEN) {
  config = {
    owner: process.env.PRESENCE_OWNER_TOKEN,
    service: process.env.PRESENCE_SITE_SERVICE_TOKEN,
  };
} else {
  if (process.stdin.isTTY) execFileSync('stty', ['-echo'], { stdio: 'inherit' });
  process.stdout.write(
    'Ready for private verification credential JSON on stdin (input is hidden).\n',
  );
  let buffer = '';
  for await (const chunk of process.stdin) {
    buffer += chunk;
    if (buffer.includes('\n')) break;
  }
  config = JSON.parse(buffer.trim());
}
if (typeof config.owner !== 'string' || config.owner.length < 32)
  throw new Error('A valid owner token is required.');
const service = config.service ? { 'OAI-Sites-Authorization': `Bearer ${config.service}` } : {};
const request = (path, options = {}) =>
  fetch(origin + path, {
    ...options,
    redirect: 'manual',
    signal: AbortSignal.timeout(15000),
    headers: { ...service, ...options.headers },
  });
const evidence = { date: new Date().toISOString(), origin, checks: [] };
let dummyId;
try {
  let response = await request('/api/health');
  assert.equal(
    response.status,
    200,
    'Hosted health must be ready, not a sign-in or proxy response.',
  );
  assert.equal((await response.json()).enquiriesAvailable, true);
  evidence.checks.push('database health');
  response = await request('/api/owner/enquiries');
  assert.equal(response.status, 401);
  evidence.checks.push('anonymous app cannot read');
  const marker = `Private release test ${crypto.randomUUID()}`;
  const payload = {
    'contact-name': 'Dummy Test',
    'business-name': 'Presence release test only',
    email: 'dummy@example.invalid',
    telephone: '+44 7700 900123',
    goal: marker,
    website: 'example.com',
    service: 'not-sure',
    'submission-id': crypto.randomUUID().replaceAll('-', ''),
  };
  const post = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: origin },
    body: JSON.stringify(payload),
  };
  response = await request('/api/enquiries', post);
  assert.equal(response.status, 201);
  assert.equal((await response.json()).accepted, true);
  const cookie = response.headers.get('set-cookie');
  assert.match(cookie, /HttpOnly/);
  assert.match(cookie, /Secure/);
  evidence.checks.push('real save and secure receipt');
  response = await request('/api/enquiries', post);
  assert.equal(response.status, 200);
  assert.equal((await response.json()).duplicate, true);
  response = await request('/api/owner/enquiries?limit=100', {
    headers: { Authorization: `Bearer ${config.owner}` },
  });
  assert.equal(response.status, 200);
  const rows = (await response.json()).items.filter((item) => item.goal === marker);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].website, 'https://example.com/');
  dummyId = rows[0].id;
  evidence.checks.push('independent owner receipt and one stored duplicate');
  response = await request('/thank-you/', { headers: { Cookie: cookie.split(';')[0] } });
  assert.match(await response.text(), /Your request has been received/);
  response = await request('/thank-you/');
  assert.match(await response.text(), /Opening this page directly does not submit/);
  evidence.checks.push('signed vs direct confirmation');
  response = await request('/api/enquiries', {
    ...post,
    body: JSON.stringify({ ...payload, email: 'bad' }),
  });
  assert.equal(response.status, 422);
  evidence.checks.push('hosted validation');
  response = await request('/');
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('X-Content-Type-Options'), 'nosniff');
  assert.match(response.headers.get('Content-Security-Policy'), /form-action 'self'/);
  assert.match(response.headers.get('X-Robots-Tag'), /noindex/);
  assert.match(response.headers.get('Strict-Transport-Security'), /max-age=/);
  evidence.checks.push('private HTTPS headers');
} finally {
  if (dummyId) {
    const response = await request(`/api/owner/enquiries/${dummyId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${config.owner}` },
    });
    assert.equal(response.status, 204);
    evidence.checks.push('dummy deleted');
  }
}
writeFileSync('reports/hosted-verification.json', JSON.stringify(evidence, null, 2));
console.log(JSON.stringify({ verified: evidence.checks }));
