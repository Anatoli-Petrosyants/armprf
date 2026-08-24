import type { Lang } from './i18n';
import { getAthletes } from './content';

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
