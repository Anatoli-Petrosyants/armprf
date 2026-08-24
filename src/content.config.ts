import { defineCollection } from 'astro:content';
import { z } from 'zod';
import { glob } from 'astro/loaders';
import type { Loader } from 'astro/loaders';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';

/* ---------------------------------------------------------------------------
 * Every markdown item exists once per language: `<slug>.hy.md` and `<slug>.en.md`.
 * The id keeps the suffix (`2026-05-17-gyumri.hy`) so both files can live in the
 * same collection; `slugOf()` / `langOf()` in src/lib/content.ts split it again.
 * ------------------------------------------------------------------------- */
const bilingual = (dir: string) =>
  glob({
    pattern: '**/*.{hy,en}.md',
    base: `./src/content/${dir}`,
    generateId: ({ entry }) => entry.replace(/\.md$/, ''),
  });

/** Image paths are plain strings rooted at `/img/…` and resolved against
 *  `src/assets/img/…` by src/lib/images.ts, so a non-developer only ever has to
 *  drop a file into a folder with a matching name. */
const imagePath = z.string().regex(/^\/img\//, 'image paths must start with /img/');

const altText = z.string().min(3, 'alt text is required — see CONTENT_GUIDE.md');

const galleryItem = z.object({
  src: imagePath,
  alt: altText,
  caption: z.string().optional(),
});

const TAGS = [
  'match-report',
  'training',
  'gear',
  'rimfire',
  'community',
  'announcement',
] as const;

const posts = defineCollection({
  loader: bilingual('posts'),
  schema: z.object({
    title: z.string(),
    excerpt: z.string(),
    date: z.coerce.date(),
    updated: z.coerce.date().optional(),
    tags: z.array(z.enum(TAGS)).min(1),
    author: z.string().default('ARMPRF'),
    cover: imagePath.optional(),
    coverAlt: altText.optional(),
    gallery: z.array(galleryItem).default([]),
    videoUrl: z.url().optional(),
    featured: z.boolean().default(false),
    draft: z.boolean().default(false),
  }),
});

const EVENT_STATUS = ['open', 'full', 'closed', 'completed'] as const;

const events = defineCollection({
  loader: bilingual('events'),
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    date: z.coerce.date(),
    endDate: z.coerce.date().optional(),
    status: z.enum(EVENT_STATUS),
    location: z.string(),
    mapUrl: z.url().optional(),
    geo: z.object({ lat: z.number(), lon: z.number() }).optional(),
    discipline: z.string(),
    divisions: z.array(z.string()).min(1),
    distanceMin: z.number().int().positive(),
    distanceMax: z.number().int().positive(),
    distanceUnit: z.enum(['m', 'yd']).default('m'),
    roundCount: z.number().int().positive(),
    entryFee: z.string().optional(),
    registrationUrl: z.url().optional(),
    matchDirector: z.string(),
    bookletPdf: z.string().optional(),
    resultsUrl: z.string().optional(),
    galleryTag: z.string().optional(),
    cover: imagePath.optional(),
    coverAlt: altText.optional(),
    gallery: z.array(galleryItem).default([]),
    featured: z.boolean().default(false),
  }),
});

const SCORING = ['points', 'hits', 'time', 'percent'] as const;

/** Column ids a challenge may declare. Each maps to a field on a result row and
 *  to an i18n key (`lb.<id>`), so a new challenge can show a different table
 *  without touching a component. */
const COLUMNS = [
  'rank',
  'name',
  'club',
  'division',
  'score',
  'hits',
  'misses',
  'percent',
  'time',
  'date',
  'rifle',
  'caliber',
  'notes',
  'proof',
  'verified',
] as const;

const challenges = defineCollection({
  loader: bilingual('challenges'),
  schema: z.object({
    id: z.string(),
    title: z.string(),
    summary: z.string(),
    scoring: z.enum(SCORING),
    sortDirection: z.enum(['asc', 'desc']).default('desc'),
    maxScore: z.number().optional(),
    unit: z.string().optional(),
    videoUrl: z.url().optional(),
    heroImage: imagePath.optional(),
    heroAlt: altText.optional(),
    columns: z.array(z.enum(COLUMNS)).min(2),
    seasonal: z.boolean().default(false),
    active: z.boolean().default(true),
    order: z.number().int().default(100),
  }),
});

const athletes = defineCollection({
  loader: bilingual('athletes'),
  schema: z.object({
    name: z.string(),
    slug: z.string(),
    club: z.string(),
    divisions: z.array(z.string()).min(1),
    photo: imagePath.optional(),
    photoAlt: altText.optional(),
    memberSince: z.number().int(),
    hometown: z.string().optional(),
    rifle: z.string().optional(),
    caliber: z.string().optional(),
    bestFinishes: z.array(z.string()).default([]),
    instagram: z.url().optional(),
    board: z.boolean().default(false),
  }),
});

/* ---------------------------------------------------------------------------
 * results/<challengeId>.json is a flat array of rows — the shape a non-developer
 * can extend by copying the line above. The stock `glob` loader treats one data
 * file as one entry, so this loader fans each array element out into its own
 * entry and stamps the challenge id from the filename.
 * ------------------------------------------------------------------------- */
const resultRow = z.object({
  challenge: z.string(),
  name: z.string(),
  club: z.string().default(''),
  division: z.string().default(''),
  date: z.coerce.date(),
  rifle: z.string().optional(),
  caliber: z.string().optional(),
  score: z.number().optional(),
  hits: z.number().int().nonnegative().optional(),
  misses: z.number().int().nonnegative().optional(),
  percent: z.number().min(0).max(100).optional(),
  time: z.number().nonnegative().optional(),
  notes: z.string().optional(),
  proofUrl: z.url().optional(),
  verified: z.boolean().default(false),
});

const RESULTS_DIR = resolve('./src/content/results');

const resultsLoader: Loader = {
  name: 'armprf-results',
  load: async ({ store, parseData, generateDigest, logger, watcher }) => {
    store.clear();
    let files: string[] = [];
    try {
      files = readdirSync(RESULTS_DIR).filter((f) => f.endsWith('.json'));
    } catch {
      logger.warn(`No results directory at ${RESULTS_DIR}`);
      return;
    }

    for (const file of files) {
      const full = join(RESULTS_DIR, file);
      const challenge = file.replace(/\.json$/, '');
      let rows: unknown;
      try {
        rows = JSON.parse(readFileSync(full, 'utf-8'));
      } catch (err) {
        throw new Error(`results/${file} is not valid JSON: ${(err as Error).message}`);
      }
      if (!Array.isArray(rows)) {
        throw new Error(`results/${file} must contain a JSON array of result rows.`);
      }

      // `filePath` has to stay relative to the project root for Astro's store.
      const relative = `src/content/results/${file}`;
      let i = 0;
      for (const row of rows) {
        const id = `${challenge}#${i}`;
        const data = await parseData({
          id,
          data: { ...(row as Record<string, unknown>), challenge },
          filePath: relative,
        });
        store.set({ id, data, digest: generateDigest(data), filePath: relative });
        i += 1;
      }
      // Touching mtime keeps the dev server honest about edits to the array.
      statSync(full);
    }

    watcher?.add(RESULTS_DIR);
    watcher?.on('change', (path) => {
      if (path.startsWith(RESULTS_DIR)) logger.info('results changed — restart if rows do not refresh');
    });
  },
};

const results = defineCollection({
  loader: resultsLoader,
  schema: resultRow,
});

export const collections = { posts, events, challenges, athletes, results };
export { TAGS, EVENT_STATUS, SCORING, COLUMNS };
