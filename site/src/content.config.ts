import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const posts = defineCollection({
  loader: glob({ pattern: '**/*.md', base: '../content/posts' }),
  schema: z.object({
    title: z.string(),
    slug: z.string().optional(),
    publish_at: z.coerce.date(),
    status: z.enum(['draft', 'scheduled', 'published', 'aborted']).default('draft'),
    tags: z.array(z.string()).default([]),
    privacy_flag: z.boolean().default(false),
    linkedin_url: z.string().nullable().default(null),
    excerpt: z.string().optional(),
    marginalia: z.array(z.object({
      ts: z.string(),
      text: z.string(),
      source: z.enum(['telegram', 'auto-commit', 'manual']).default('manual'),
    })).default([]),
  }),
});

const projekter = defineCollection({
  loader: glob({ pattern: '**/*.md', base: '../content/projekter' }),
  schema: z.object({
    title: z.string(),
    status: z.enum(['shipped', 'alpha', 'internal', 'archived']),
    pill_label: z.string(),
    summary: z.string(),
    featured: z.boolean().default(false),
    order: z.number().default(100),
    external_url: z.string().url().optional(),
  }),
});

export const collections = { posts, projekter };
