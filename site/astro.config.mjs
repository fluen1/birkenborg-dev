import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import rehypeImgAttrs from './src/lib/rehype-img-attrs.mjs';
import remarkStripLinkedin from './src/lib/remark-strip-linkedin.mjs';

export default defineConfig({
  site: 'https://birkenborg.dev',
  trailingSlash: 'never',
  build: { format: 'directory' },
  integrations: [sitemap()],
  markdown: {
    remarkPlugins: [remarkStripLinkedin],
    rehypePlugins: [rehypeImgAttrs],
  },
});
