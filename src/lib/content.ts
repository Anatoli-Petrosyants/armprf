import { getCollection, type CollectionEntry } from 'astro:content';
import { DEFAULT_LANG, type Lang } from './i18n';

type Bilingual = 'posts' | 'events' | 'challenges' | 'athletes';

export function langOf(id: string): Lang {
  return id.endsWith('.en') ? 'en' : 'hy';
}

export function slugOf(id: string): string {
  return id.replace(/\.(hy|en)$/, '');
}

/**
 * Load a bilingual collection for one language, falling back to the Armenian
 * file when a translation is missing. `translated` is false on a fallback so
 * pages can show a "not translated yet" notice instead of silently lying.
 */
export async function getLocalized<C extends Bilingual>(
  collection: C,
  lang: Lang,
): Promise<Array<CollectionEntry<C> & { slug: string; translated: boolean }>> {
  const all = await getCollection(collection);
  const bySlug = new Map<string, Partial<Record<Lang, CollectionEntry<C>>>>();

  for (const entry of all) {
    const slug = slugOf(entry.id);
    const bucket = bySlug.get(slug) ?? {};
    bucket[langOf(entry.id)] = entry as CollectionEntry<C>;
    bySlug.set(slug, bucket);
  }

  const out: Array<CollectionEntry<C> & { slug: string; translated: boolean }> = [];
  for (const [slug, bucket] of bySlug) {
    const exact = bucket[lang];
    const fallback = bucket[DEFAULT_LANG] ?? Object.values(bucket)[0];
    const entry = exact ?? fallback;
    if (!entry) continue;
    out.push(Object.assign({}, entry, { slug, translated: Boolean(exact) }) as CollectionEntry<C> & {
      slug: string;
      translated: boolean;
    });
  }
  return out;
}

export async function getLocalizedEntry<C extends Bilingual>(
  collection: C,
  slug: string,
  lang: Lang,
) {
  const all = await getLocalized(collection, lang);
  return all.find((e) => e.slug === slug);
}

/** Published posts, newest first. Drafts are excluded from production builds. */
export async function getPosts(lang: Lang) {
  const posts = await getLocalized('posts', lang);
  return posts
    .filter((p) => import.meta.env.DEV || !p.data.draft)
    .sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
}

export async function getEvents(lang: Lang) {
  const events = await getLocalized('events', lang);
  return events.sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
}

/** Split events on "now" using the end date when a match runs over two days. */
export function splitEvents<T extends { data: { date: Date; endDate?: Date; status: string } }>(
  events: T[],
  now = new Date(),
) {
  const upcoming: T[] = [];
  const past: T[] = [];
  for (const e of events) {
    const until = e.data.endDate ?? e.data.date;
    if (e.data.status !== 'completed' && until.getTime() >= now.getTime()) upcoming.push(e);
    else past.push(e);
  }
  upcoming.sort((a, b) => a.data.date.getTime() - b.data.date.getTime());
  return { upcoming, past };
}

export async function getChallenges(lang: Lang) {
  const challenges = await getLocalized('challenges', lang);
  return challenges
    .filter((c) => c.data.active)
    .sort((a, b) => a.data.order - b.data.order || a.data.title.localeCompare(b.data.title));
}

export async function getAthletes(lang: Lang) {
  const athletes = await getLocalized('athletes', lang);
  return athletes.sort((a, b) => a.data.name.localeCompare(b.data.name));
}
