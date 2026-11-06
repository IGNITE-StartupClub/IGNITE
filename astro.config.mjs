import { defineConfig } from 'astro/config'
import mdx from '@astrojs/mdx'
import tailwind from '@astrojs/tailwind'
import icon from 'astro-icon'
import react from '@astrojs/react';
import vercel from '@astrojs/vercel';

import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  compressHTML: true,
  output: 'server',
  site: 'https://ignite-startupclub.de',

  // isCrossSiteForm (src/lib/memberAuth.ts, run by src/middleware.ts) does this check instead. Astro's own has no
  // exceptions and would refuse the OAuth token endpoint, which gets form posts without an Origin from other servers.
  security: { checkOrigin: false },

  // Old addresses from before the Netzwerk section. Browsers keep the hash, so links to a CRM contact still work.
  redirects: {
    '/mitglieder/crm': '/mitglieder/netzwerk',
    '/mitglieder/alumni': '/mitglieder/netzwerk/alumni',
    '/mitglieder/team': '/mitglieder/netzwerk/team',
    '/en/members/crm': '/en/members/network',
    '/en/members/alumni': '/en/members/network/alumni',
    '/en/members/team': '/en/members/network/team',
  },

  // ViewTransitions would prefetch every link on hover. Member pages answer no-store, so that rendered them twice;
  // public links opt in with data-astro-prefetch (Header.astro).
  prefetch: { prefetchAll: false },

  // German is served at the root, English under /en/. The pages in src/pages/en/ are written by hand; Astro only
  // provides the locale detection (Astro.currentLocale) and the routing rules.
  i18n: {
    defaultLocale: 'de',
    locales: ['de', 'en'],
    routing: { prefixDefaultLocale: false },
  },

  integrations: 
  [
    react(), 
    mdx(), 
    icon(),
    tailwind({
    applyBaseStyles: false,
  }),
  sitemap()
],

  vite: {
    css: {
      preprocessorOptions: {
        scss: {
          logger: {
            warn: () => {},
          },
        },
      },
    },
    resolve: {
      alias: {
        '@': '/src',
      },
    },
  },
  adapter: vercel(),
})