import type { APIRoute } from 'astro';
import { getEvents } from '@/lib/content';
import { buildIcs } from '@/lib/ics';
import { absolute } from '@/lib/seo';

/**
 * One .ics per event. Language-neutral on purpose: a calendar entry is a date,
 * a place and a link, and the link opens the reader's own language.
 */
export async function getStaticPaths() {
  const events = await getEvents('hy');
  return events.map((event) => ({ params: { slug: event.slug }, props: { event } }));
}

export const GET: APIRoute = ({ props }) => {
  const { event } = props as { event: Awaited<ReturnType<typeof getEvents>>[number] };
  const body = buildIcs({
    uid: event.slug,
    title: event.data.title,
    description: `${event.data.summary}\n${absolute(`/events/${event.slug}`)}`,
    location: event.data.location,
    start: event.data.date,
    end: event.data.endDate,
    url: absolute(`/events/${event.slug}`),
  });

  return new Response(body, {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `attachment; filename="${event.slug}.ics"`,
    },
  });
};
