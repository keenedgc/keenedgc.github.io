import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  site: 'https://keenedgc.github.io',
  output: 'static',
  integrations: [mdx(), react(), sitemap(), tailwind()]
});
