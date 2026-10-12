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