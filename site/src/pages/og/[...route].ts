import { OGImageRoute } from 'astro-og-canvas';
import { getCollection } from 'astro:content';

const posts = await getCollection(
  'posts',
  ({ data }) => data.status === 'published' && !data.privacy_flag,
);

const projekter = await getCollection(
  'projekter',
  ({ data }) => data.status !== 'archived',
);

const DANISH_MONTHS = [
  'januar', 'februar', 'marts', 'april', 'maj', 'juni',
  'juli', 'august', 'september', 'oktober', 'november', 'december',
];

function formatDateDanish(date: Date): string {
  return `${date.getDate()}. ${DANISH_MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

// Keys become URL slugs: posts → "posts/<id>.png", projekter → "projekter/<id>.png"
const pages = {
  ...Object.fromEntries(
    posts.map((post) => {
      const date = new Date(post.data.publish_at);
      const excerpt = post.data.excerpt ?? '';
      const dateLine = `${formatDateDanish(date)}  ·  Philip Birkenborg  ·  birkenborg.dev`;
      return [
        `posts/${post.id.replace(/\.md$/, '')}`,
        {
          title: post.data.title,
          description: excerpt ? `${excerpt}\n\n${dateLine}` : dateLine,
        },
      ];
    }),
  ),
  ...Object.fromEntries(
    projekter.map((project) => [
      `projekter/${project.id.replace(/\.md$/, '')}`,
      {
        title: project.data.title,
        description: `${project.data.summary ?? ''}\n\nProjekt  ·  Philip Birkenborg  ·  birkenborg.dev`,
      },
    ]),
  ),
};

export const { getStaticPaths, GET } = await OGImageRoute({
  param: 'route',
  pages,
  getImageOptions: (_path, page) => ({
    title: page.title,
    description: page.description,
    bgGradient: [[250, 249, 245]], // --cream
    border: { color: [184, 93, 64], width: 4, side: 'inline-start' }, // --clay-deep
    padding: 80,
    font: {
      title: {
        size: 64,
        families: ['Fraunces'],
        weight: 'Normal',
        color: [20, 20, 19], // --ink
        lineHeight: 1.1,
      },
      description: {
        size: 26,
        families: ['Geist'],
        weight: 'Normal',
        color: [90, 88, 79], // --gray-700
        lineHeight: 1.4,
      },
    },
    fonts: [
      'https://api.fontsource.org/v1/fonts/fraunces/latin-400-normal.ttf',
      'https://api.fontsource.org/v1/fonts/geist/latin-400-normal.ttf',
    ],
    logo: {
      path: './public/favicon.svg',
      size: [48, 48],
    },
  }),
});
