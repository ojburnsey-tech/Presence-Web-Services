import { createServer } from 'node:http';
import { Readable } from 'node:stream';
import { handleRequest } from '../server/runtime.ts';
import { openLocalDatabase } from './local-db.mjs';
import { readAssets } from './assets.mjs';
const localPort = Number(process.env.TEST_PORT || 4331);
const database = openLocalDatabase(process.env.LOCAL_DB_PATH || 'work/local-enquiries.sqlite');
const assets = readAssets();
const env = {
  DB: database.binding,
  APP_SECRET: 'local-test-app-secret-never-use-in-production-000000',
  OWNER_REVIEW_TOKEN: 'local-test-owner-token-never-use-in-production-0000',
  ENQUIRIES_ENABLED: 'true',
  DEPLOYMENT_STAGE: 'local',
  ...Object.fromEntries(
    [
      'APP_SECRET',
      'OWNER_REVIEW_TOKEN',
      'ENQUIRIES_ENABLED',
      'DEPLOYMENT_STAGE',
      'ENQUIRY_RETENTION_DAYS',
    ]
      .filter((key) => process.env[key] !== undefined)
      .map((key) => [key, process.env[key]]),
  ),
};
const server = createServer(async (incoming, outgoing) => {
  try {
    const headers = new Headers();
    for (const [name, value] of Object.entries(incoming.headers)) {
      if (value !== undefined) headers.set(name, Array.isArray(value) ? value.join(', ') : value);
    }
    const method = incoming.method || 'GET';
    const request = new Request(`http://127.0.0.1:${localPort}${incoming.url}`, {
      method,
      headers,
      ...(!['GET', 'HEAD'].includes(method)
        ? { body: Readable.toWeb(incoming), duplex: 'half' }
        : {}),
    });
    const response = await handleRequest(request, env, assets);
    outgoing.writeHead(response.status, Object.fromEntries(response.headers));
    outgoing.end(new Uint8Array(await response.arrayBuffer()));
  } catch {
    outgoing.writeHead(500, { 'Content-Type': 'text/plain', 'Cache-Control': 'no-store' });
    outgoing.end('The local test server could not process this request.');
  }
});
server.listen(localPort, '127.0.0.1', () =>
  console.log(`Local Worker + SQLite test server: http://127.0.0.1:${localPort}. Dummy data only.`),
);
for (const signal of ['SIGTERM', 'SIGINT'])
  process.on(signal, () =>
    server.close(() => {
      database.close();
      process.exit(0);
    }),
  );
