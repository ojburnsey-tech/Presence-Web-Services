import { execFileSync } from 'node:child_process';
import { createInterface } from 'node:readline/promises';
const [action, id] = process.argv.slice(2);
if (
  !['list', 'delete', 'purge'].includes(action) ||
  (action === 'delete' && !/^[a-f\d-]{36}$/.test(id || ''))
)
  throw new Error('Usage: node scripts/owner.mjs list|delete <id>|purge');
const origin =
  process.env.PRESENCE_SITE_ORIGIN ||
  'https://presence-private-preview-4nov-c73a.ojburnsey.chatgpt.site';
const parsed = new URL(origin);
if (
  parsed.protocol !== 'https:' ||
  parsed.username ||
  parsed.password ||
  parsed.pathname !== '/' ||
  parsed.search ||
  parsed.hash
)
  throw new Error('Use an HTTPS site origin only.');
if (
  process.env.PRESENCE_SITE_SERVICE_TOKEN &&
  parsed.hostname !== 'presence-private-preview-4nov-c73a.ojburnsey.chatgpt.site'
)
  throw new Error('Private Sites service access is restricted to this exact preview hostname.');
let token = process.env.PRESENCE_OWNER_TOKEN || '';
if (!token) {
  if (!process.stdin.isTTY)
    throw new Error('Supply a secure terminal or PRESENCE_OWNER_TOKEN environment variable.');
  execFileSync('stty', ['-echo'], { stdio: 'inherit' });
  const input = createInterface({ input: process.stdin, output: process.stdout });
  try {
    token = await input.question('Owner review token (hidden): ');
  } finally {
    input.close();
    execFileSync('stty', ['echo'], { stdio: 'inherit' });
    console.log('');
  }
}
if (token.length < 32) throw new Error('The owner token is incomplete.');
const headers = { Authorization: `Bearer ${token}` };
if (process.env.PRESENCE_SITE_SERVICE_TOKEN)
  headers['OAI-Sites-Authorization'] = `Bearer ${process.env.PRESENCE_SITE_SERVICE_TOKEN}`;
const path =
  action === 'list'
    ? '/api/owner/enquiries'
    : action === 'purge'
      ? '/api/owner/purge'
      : `/api/owner/enquiries/${id}`;
const response = await fetch(origin + path, {
  method: action === 'list' ? 'GET' : action === 'purge' ? 'POST' : 'DELETE',
  headers,
  redirect: 'error',
});
if (!response.ok)
  throw new Error(
    `Owner request failed (${response.status}). Check network policy, platform access and runtime configuration.`,
  );
console.log(response.status === 204 ? 'Deleted.' : await response.text());
