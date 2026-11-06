import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync, copyFileSync, cpSync, rmSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { build } from 'esbuild';
import { readAssets } from './assets.mjs';
import { business } from '../src/config/business.ts';
const root = process.cwd();
const pkg = JSON.parse(readFileSync('node_modules/astro/package.json', 'utf8'));
const bin = typeof pkg.bin === 'string' ? pkg.bin : pkg.bin.astro;
execFileSync(process.execPath, [resolve('node_modules/astro', bin), 'build'], {
  stdio: 'inherit',
  env: {
    ...process.env,
    ENQUIRY_BACKEND: 'sites',
    PUBLIC_RELEASE: business.launchReady ? 'true' : '',
  },
});
const output = resolve('work/sites-artifact');
rmSync(output, { recursive: true, force: true });
mkdirSync(join(output, 'dist/server'), { recursive: true });
mkdirSync(join(output, '.openai'), { recursive: true });
cpSync('drizzle', join(output, 'drizzle'), { recursive: true });
const assets = readAssets();
await build({
  stdin: {
    contents: `import { handleRequest } from './server/runtime.ts'; const assets=${JSON.stringify(assets)}; export default { fetch(request, env) { return handleRequest(request, { ...env, BUILD_PUBLIC_RELEASE: '${business.launchReady}' }, assets); } };`,
    loader: 'ts',
    resolveDir: root,
    sourcefile: 'generated-entry.ts',
  },
  bundle: true,
  format: 'esm',
  platform: 'browser',
  target: 'es2022',
  minify: true,
  sourcemap: false,
  outfile: join(output, 'dist/server/index.js'),
});
const manifest = JSON.parse(readFileSync('.openai/hosting.json', 'utf8'));
if (manifest.static)
  throw new Error('Worker publication must not retain a static hosting declaration.');
copyFileSync('.openai/hosting.json', join(output, '.openai/hosting.json'));

writeFileSync(
  join(output, 'dist/server/wrangler.json'),
  JSON.stringify(
    {
      name: 'presence-web-services',
      main: 'index.js',
      compatibility_date: '2026-11-01',
      d1_databases: [
        { binding: 'DB', database_name: 'presence-enquiries', migrations_dir: '../../drizzle' },
      ],
    },
    null,
    2,
  ),
);
console.log(
  'Sites Worker artifact prepared in work/sites-artifact. No public deployment performed.',
);
