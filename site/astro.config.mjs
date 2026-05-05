import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://birkenborg.dev',
  trailingSlash: 'never',
  build: { format: 'directory' },
  integrations: [sitemap()],
});
