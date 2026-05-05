import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://birkenborg.dev',
  trailingSlash: 'never',
  build: { format: 'directory' },
});
