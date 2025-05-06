import { defineConfig } from 'astro/config'
import mdx from '@astrojs/mdx'
import tailwind from '@astrojs/tailwind'
import compress from 'astro-compress'
import icon from 'astro-icon'
import react from '@astrojs/react';

import netlify from '@astrojs/netlify';
import netlify from '@astrojs/netlify/functions';

// https://astro.build/config
export default defineConfig({
  compressHTML: true,
  output: 'server',

  integrations: [
    react(),
    mdx(),
    icon(),
    tailwind({
      applyBaseStyles: false,
    }),
    compress(),
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