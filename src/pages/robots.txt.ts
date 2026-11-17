export const prerender = true

import type { APIRoute } from 'astro';
import { PRIVATE_PREFIXES } from '../lib/seo';

// The styleguide stays crawlable: its noindex tag only works if crawlers may read the page.
const disallowed = [...PRIVATE_PREFIXES.filter((prefix) => prefix !== '/styleguide/'), '/api/'];

const getRobotsTxt = (sitemapURL: URL) => `
User-agent: *
Allow: /
${disallowed.map((prefix) => `Disallow: ${prefix}`).join('\n')}

Sitemap: ${sitemapURL.href}
`;

export const GET: APIRoute = ({ site }) => {
  const sitemapURL = new URL('sitemap-index.xml', site);
  return new Response(getRobotsTxt(sitemapURL));
};
