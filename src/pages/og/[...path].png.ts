import type { APIRoute } from 'astro';
import { renderOg } from '@/lib/og';
import { getChallenges, getPosts } from '@/lib/content';
import { formatDateShort } from '@/lib/format';
import { LOCALES } from '@/lib/i18n';

/**
 * Build-time social cards. The path mirrors the page it belongs to, minus the
 * locale — the English card is the canonical one, since `/` is English.
 */
export async function getStaticPaths() {
  const paths: Array<{ params: { path: string }; props: { eyebrow: string; title: string; meta?: string } }> = [];

  for (const post of await getPosts('en')) {
    paths.push({
      params: { path: `blog/${post.slug}` },
      props: { eyebrow: post.data.tags[0], title: post.data.title, meta: formatDateShort(post.data.date, 'en') },
    });
  }

  for (const challenge of await getChallenges('en')) {
    paths.push({
      params: { path: `leaderboards/${challenge.data.id}` },
      props: {
        eyebrow: 'Leaderboard',
        title: challenge.data.title,
        meta: challenge.data.maxScore ? `max ${challenge.data.maxScore}` : 'armprf.com',
      },
    });
  }

  void LOCALES;
  return paths;
}

export const GET: APIRoute = async ({ props }) => {
  const png = await renderOg(props as { eyebrow: string; title: string; meta?: string });
  return new Response(new Uint8Array(png), {
    headers: { 'Content-Type': 'image/png', 'Cache-Control': 'public, max-age=31536000, immutable' },
  });
};
