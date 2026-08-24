import { localizePath, type Lang } from './i18n';
import { getAthletes } from './content';

/**
 * Result rows carry the name as it was recorded at the match. These maps let a
 * leaderboard link that name to a profile and show it in the reader's script,
 * without duplicating the name in every results file.
 */
export async function athleteMaps(lang: Lang) {
  const athletes = await getAthletes(lang);
  const slugs: Record<string, string> = {};
  const names: Record<string, string> = {};

  for (const athlete of athletes) {
    const href = localizePath(`/athletes/${athlete.data.slug}`, lang);
    // Key on every spelling we know, so either language file matches a row.
    slugs[athlete.data.name.trim().toLowerCase()] = href;
    slugs[athlete.data.slug] = href;
    names[athlete.data.name.trim().toLowerCase()] = athlete.data.name;
  }

  // The Armenian file's name has to resolve from the Latin spelling in results.
  const latin = await getAthletes('en');
  for (const athlete of latin) {
    const key = athlete.data.name.trim().toLowerCase();
    const match = athletes.find((a) => a.data.slug === athlete.data.slug);
    if (!match) continue;
    slugs[key] = localizePath(`/athletes/${athlete.data.slug}`, lang);
    names[key] = match.data.name;
  }

  return { slugs, names };
}
