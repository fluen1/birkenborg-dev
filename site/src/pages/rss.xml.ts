import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import type { APIRoute } from 'astro';

export const GET: APIRoute = async (context) => {
  const posts = await getCollection('posts', ({ data }) => data.status === 'published');
  const sorted = posts.sort((a, b) => +b.data.publish_at - +a.data.publish_at);

  return rss({
    title: 'birkenborg.dev — Skrifter',
    description: 'Korte essays om jura, AI-systemer i drift og fejl jeg er løbet ind i.',
    site: context.site!.toString(),
    items: sorted.map(p => ({
      title: p.data.title,
      pubDate: p.data.publish_at,
      description: p.data.excerpt ?? '',
      link: `/skrifter/${p.id.replace(/\.md$/, '')}`,
    })),
    customData: '<language>da-dk</language>',
  });
};
