import { readdirSync, readFileSync } from 'node:fs';
import { join, relative, extname } from 'node:path';
const types = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.webp': 'image/webp',
};
export function readAssets(root = 'dist') {
  const assets = Object.create(null);
  const visit = (directory) => {
    for (const item of readdirSync(directory, { withFileTypes: true })) {
      const file = join(directory, item.name);
      if (item.isDirectory()) visit(file);
      else {
        const extension = extname(file);
        const type = types[extension];
        if (!type) continue;
        const bytes = readFileSync(file);
        const binary = !type.startsWith('text/') && extension !== '.svg' && extension !== '.xml';
        assets['/' + relative(root, file).split('\\').join('/')] = binary
          ? { body: bytes.toString('base64'), type, base64: true }
          : { body: bytes.toString('utf8'), type };
      }
    }
  };
  visit(root);
  return assets;
}
