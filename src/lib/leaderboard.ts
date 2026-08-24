import { getCollection, type CollectionEntry } from 'astro:content';
import { slugOf } from './content';

export type ResultRow = CollectionEntry<'results'>['data'];
export type RankedRow = ResultRow & { rank: number; season: number };

export interface ChallengeShape {
  id: string;
  scoring: 'points' | 'hits' | 'time' | 'percent';
  sortDirection: 'asc' | 'desc';
  maxScore?: number;
}

/** The field a challenge is ranked on. */
export function scoreField(scoring: ChallengeShape['scoring']): keyof ResultRow {
  switch (scoring) {
    case 'hits':
      return 'hits';
    case 'time':
      return 'time';
    case 'percent':
      return 'percent';
    default:
      return 'score';
  }
}

export function scoreOf(row: ResultRow, challenge: ChallengeShape): number | undefined {
  const value = row[scoreField(challenge.scoring)];
  return typeof value === 'number' ? value : undefined;
}

/**
 * Sort and assign ranks. Ties share a rank and the following rank is skipped:
 * 1, 2, 2, 4. Rank is always computed here — never read from a content file.
 */
export function rank(rows: ResultRow[], challenge: ChallengeShape): RankedRow[] {
  const withScore = rows.map((row) => ({ row, value: scoreOf(row, challenge) }));
  const dir = challenge.sortDirection === 'asc' ? 1 : -1;

  withScore.sort((a, b) => {
    // Rows with no score sink to the bottom regardless of sort direction.
    if (a.value === undefined && b.value === undefined) return 0;
    if (a.value === undefined) return 1;
    if (b.value === undefined) return -1;
    if (a.value !== b.value) return (a.value - b.value) * dir;
    // Same score: both challenges break the tie on elapsed time, shorter first.
    // A row with no recorded time cannot win the tie, so it falls back to date.
    const at = a.row.time;
    const bt = b.row.time;
    if (typeof at === 'number' && typeof bt === 'number' && at !== bt) return at - bt;
    if (typeof at === 'number' && typeof bt !== 'number') return -1;
    if (typeof at !== 'number' && typeof bt === 'number') return 1;
    // Neither timed: the earlier date got there first.
    return a.row.date.getTime() - b.row.date.getTime();
  });

  const out: RankedRow[] = [];
  let lastValue: number | undefined | symbol = Symbol('none');
  let lastRank = 0;

  withScore.forEach(({ row, value }, index) => {
    const isTie = value !== undefined && value === lastValue;
    const position = isTie ? lastRank : index + 1;
    if (!isTie) lastRank = position;
    lastValue = value;
    out.push({ ...row, rank: position, season: row.date.getUTCFullYear() });
  });

  return out;
}

/** All result rows for one challenge id, already ranked. */
export async function getRankedRows(challenge: ChallengeShape): Promise<RankedRow[]> {
  const all = await getCollection('results');
  const rows = all.filter((r) => r.data.challenge === challenge.id).map((r) => r.data);
  return rank(rows, challenge);
}

/**
 * Build-time content checks. Malformed dates and unknown fields are already
 * rejected by the Zod schema; this catches the cross-file mistakes.
 *
 * Errors (build fails): a score above the challenge's declared maxScore, or a
 * result pointing at a challenge that does not exist.
 * Warnings (build continues): a shooter name with no athlete profile.
 */
export async function validateResults(): Promise<{ errors: string[]; warnings: string[] }> {
  const [results, challenges, athletes] = await Promise.all([
    getCollection('results'),
    getCollection('challenges'),
    getCollection('athletes'),
  ]);

  const byId = new Map<string, CollectionEntry<'challenges'>['data']>();
  for (const c of challenges) byId.set(c.data.id, c.data);

  const knownNames = new Set(athletes.map((a) => a.data.name.trim().toLowerCase()));
  const knownSlugs = new Set(athletes.map((a) => slugOf(a.id)));

  const errors: string[] = [];
  const warnings: string[] = [];
  const unknownShooters = new Set<string>();

  for (const entry of results) {
    const row = entry.data;
    const challenge = byId.get(row.challenge);
    if (!challenge) {
      errors.push(
        `results/${row.challenge}.json references challenge "${row.challenge}", but no challenges/${row.challenge}.hy.md declares that id.`,
      );
      continue;
    }

    const value = scoreOf(row, { ...challenge, id: challenge.id });
    if (challenge.maxScore !== undefined && value !== undefined && value > challenge.maxScore) {
      errors.push(
        `${entry.id}: ${row.name} scored ${value}, above maxScore ${challenge.maxScore} for "${challenge.id}".`,
      );
    }

    if (Number.isNaN(row.date.getTime())) {
      errors.push(`${entry.id}: ${row.name} has an unparseable date.`);
    }

    const key = row.name.trim().toLowerCase();
    if (!knownNames.has(key) && !knownSlugs.has(key)) unknownShooters.add(row.name.trim());
  }

  for (const name of [...unknownShooters].sort()) {
    warnings.push(`No athlete profile for "${name}" — add src/content/athletes/<slug>.hy.md to link their results.`);
  }

  return { errors, warnings };
}

let reported = false;

/** Run the checks once per build; throw on errors so CI cannot ship bad data. */
export async function assertResultsValid(): Promise<void> {
  if (reported) return;
  reported = true;
  const { errors, warnings } = await validateResults();
  for (const w of warnings) console.warn(`[content] ${w}`);
  if (errors.length) {
    throw new Error(`[content] ${errors.length} leaderboard problem(s):\n  - ${errors.join('\n  - ')}`);
  }
}
