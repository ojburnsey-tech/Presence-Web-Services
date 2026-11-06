import type { APIRoute } from 'astro';
import { business } from '../config/business';
export const GET: APIRoute = ({ site }) =>
  new Response(
    `User-agent: *\n${business.launchReady ? 'Allow: /\nDisallow: /thank-you/' : 'Disallow: /'}\n${site ? `Sitemap: ${new URL('/sitemap.xml', site).href}\n` : ''}`,
    { headers: { 'Content-Type': 'text/plain; charset=utf-8' } },
  );
