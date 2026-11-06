import { defineConfig } from 'astro/config';
import { business } from './src/config/business';

export default defineConfig({
  site: business.launchReady ? business.siteUrl : undefined,
  output: 'static',
  trailingSlash: 'always',
  build: { format: 'directory', inlineStylesheets: 'never' },
  vite: { build: { assetsInlineLimit: 0 } },
});
