import type { Lang } from './i18n';
import { getAthletes } from './content';
import about from '@/content/config/about.json';
import { site } from './site';

/** Roster cards per page. The grid is five wide, so ten fills two clean rows. */
export const PER_PAGE = 10;

/**
 * The roster leads with the board in the order `about.json` lists them, then
 * the slugs `site.json` pins in `featuredAthletes`, then everyone else
 * alphabetically. Board members are matched on the portrait path, so a name
 * spelled differently per language still lines up.
 */
export async function getRoster(lang: Lang) {
  const athletes = await getAthletes(lang);
  const board = new Map(about.board.map((member, index) => [member.photo, index]));
  const featured = new Map(site.featuredAthletes.map((slug, index) => [slug, index]));

  const rank = (athlete: (typeof athletes)[number]) => {
    const seat = board.get(athlete.data.photo ?? '');
    if (seat !== undefined) return seat;
    const pinned = featured.get(athlete.data.slug);
    if (pinned !== undefined) return board.size + pinned;
    return Number.MAX_SAFE_INTEGER;
  };

  return [...athletes].sort((a, b) => rank(a) - rank(b));
}

/**
 * Result rows carry the name as it was recorded at the match, in Latin script.
 * This maps that spelling to the reader's language, so an Armenian page shows
 * Armenian names without every results file having to repeat them.
 */
export async function athleteNames(lang: Lang): Promise<Record<string, string>> {
  const [localized, latin] = await Promise.all([getAthletes(lang), getAthletes('en')]);
  const names: Record<string, string> = {};

  for (const athlete of localized) {
    names[athlete.data.name.trim().toLowerCase()] = athlete.data.name;
  }
  for (const athlete of latin) {
    const match = localized.find((a) => a.data.slug === athlete.data.slug);
    if (match) names[athlete.data.name.trim().toLowerCase()] = match.data.name;
  }

  return names;
}
