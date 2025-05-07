import { defineConfig } from 'astro/config'
import mdx from '@astrojs/mdx'
import tailwind from '@astrojs/tailwind'
import compress from 'astro-compress'
import icon from 'astro-icon'
import react from '@astrojs/react';

import netlify from '@astrojs/netlify';

import sitemap from 'astro-sitemap';

// https://astro.build/config
export default defineConfig({
  compressHTML: true,
  output: 'server',
  site: 'https://ignite-startupclub.de',

  integrations: [react(), mdx(), icon(), tailwind({
    applyBaseStyles: false,
  }), compress(),
  sitemap({
    changefreq: 'weekly',
    priority: 0.7,
    lastmod: new Date(),
    serialize(item) {
      if (item.url.endsWith('/')) {
        item.url = item.url.slice(0, -1);
      }
      return item;
    },
    i18n: {
      defaultLocale: 'de',
      locales: {
        de: 'de-DE',
      }
    }
  })
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
  },

  adapter: netlify(),
})