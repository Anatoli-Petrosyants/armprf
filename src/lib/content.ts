import { getCollection, type CollectionEntry } from 'astro:content';
import { DEFAULT_LANG, type Lang } from './i18n';

type Bilingual = 'posts' | 'challenges' | 'athletes';

export function langOf(id: string): Lang {
  return id.endsWith('.en') ? 'en' : 'hy';
}

export function slugOf(id: string): string {
  return id.replace(/\.(hy|en)$/, '');
}

/**
 * Load a bilingual collection for one language, falling back to the English
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

/** Published posts, newest first. Drafts are excluded from production builds. */
export async function getPosts(lang: Lang) {
  const posts = await getLocalized('posts', lang);
  return posts
    .filter((p) => import.meta.env.DEV || !p.data.draft)
    .sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
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
