import type { APIRoute } from 'astro';
import { renderOg } from '@/lib/og';
import { getChallenges, getEvents, getPosts } from '@/lib/content';
import { formatDateShort } from '@/lib/format';
import { LOCALES } from '@/lib/i18n';

/**
 * Build-time social cards. The path mirrors the page it belongs to, minus the
 * locale — the Armenian card is the canonical one, since `/` is Armenian.
 */
export async function getStaticPaths() {
  const paths: Array<{ params: { path: string }; props: { eyebrow: string; title: string; meta?: string } }> = [];

  for (const post of await getPosts('hy')) {
    paths.push({
      params: { path: `news/${post.slug}` },
      props: { eyebrow: post.data.tags[0], title: post.data.title, meta: formatDateShort(post.data.date, 'hy') },
    });
  }

  for (const event of await getEvents('hy')) {
    paths.push({
      params: { path: `events/${event.slug}` },
      props: {
        eyebrow: event.data.discipline,
        title: event.data.title,
        meta: `${formatDateShort(event.data.date, 'hy')} · ${event.data.location}`,
      },
    });
  }

  for (const challenge of await getChallenges('hy')) {
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
