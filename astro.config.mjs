import { defineConfig } from 'astro/config'
import mdx from '@astrojs/mdx'
import tailwind from '@astrojs/tailwind'
// import compress from 'astro-compress'
import icon from 'astro-icon'
import react from '@astrojs/react';
import vercel from '@astrojs/vercel';

import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  compressHTML: true,
  output: 'server',
  site: 'https://ignite-startupclub.de',

  integrations: 
  [
    react(), 
    mdx(), 
    icon(),
    tailwind({
    applyBaseStyles: false,
  }),
  // compress(),
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