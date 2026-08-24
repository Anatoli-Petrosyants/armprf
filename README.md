# armprf.com

Static website for the **Armenian Precision Rifle Federation (ARMPRF)**. Built with Astro,
deployed to GitHub Pages on the custom domain `armprf.com`.

No backend, no CMS, no database. Every word, number and photo on the site comes from a file
in this repository. If you are here to update content rather than code, read
[CONTENT_GUIDE.md](./CONTENT_GUIDE.md) instead — it is written for that.

## Quick start

```bash
npm install
npm run dev       # http://localhost:4321
npm run build     # production build into dist/
npm run preview   # serve dist/ locally
npm run check     # astro check — TypeScript and template diagnostics
npm run content   # regenerate placeholder images + src/content/config/images.md
```

Node 24 (see `.nvmrc`).

## Stack

| Piece | Choice | Why |
| --- | --- | --- |
| Framework | Astro 7, static output | Ships HTML. Islands only where a page genuinely needs behaviour. |
| Styling | Tailwind CSS 4 over CSS custom properties | The palette is one token block; the light theme redefines six variables. |
| Content | Astro content collections with Zod schemas | Bad content fails the build instead of reaching the site. |
| Images | `astro:assets` + sharp | AVIF and WebP variants generated at build, per layout. |
| Fonts | Archivo + Noto Sans Armenian, self-hosted `woff2` | No request leaves the origin. Archivo has no Armenian glyphs, so Noto covers `U+0530–058F`. |
| Logo | Federation wordmark inlined from SVG | The white lettering follows `currentColor`, so one file serves both themes; the ARMPRF monogram keeps its red, blue and orange. |
| Interactivity | Vanilla TypeScript in `<script>` islands | Leaderboard sorting, lightbox, theme and menu. No UI framework. |
| Social cards | satori → SVG → sharp → PNG, at build time | One card per post, event and challenge. |

## Architecture

```
src/
├─ content/
│  ├─ posts/        <slug>.hy.md + <slug>.en.md      blog
│  ├─ events/       <slug>.hy.md + <slug>.en.md      matches
│  ├─ challenges/   <id>.hy.md   + <id>.en.md        standing challenges (rules in the body)
│  ├─ athletes/     <slug>.hy.md + <slug>.en.md      shooter profiles
│  ├─ results/      <challenge-id>.json              flat arrays of leaderboard rows
│  └─ config/       site.json, nav.json, i18n/*.json, home/about/gallery data
├─ assets/img/      every photograph, optimized by the build
├─ components/      presentational Astro components
├─ layouts/         BaseLayout — head, meta, JSON-LD, header, footer
├─ lib/             i18n, content access, ranking, SEO, ICS, OG rendering
├─ pages/[...locale]/  every page, built once per language
└─ styles/global.css   design tokens, base styles, components, motifs
```

### Routing and language

Armenian is the default and lives at the root (`/about`). English is prefixed (`/en/about`).
Both are real static pages, so language switching and every piece of content work with
JavaScript disabled.

That is done with a single rest parameter: `src/pages/[...locale]/about.astro` returns two
paths from `getStaticPaths()`, one with `locale: undefined` and one with `locale: 'en'`.
One file per page, two languages, no duplication.

`localStorage` remembers a visitor's language choice, but it is only acted on at the site
root — a shared deep link always opens in the language it was shared in, and crawlers
always see Armenian at `/`.

### Content model

Markdown items exist once per language, side by side, distinguished by a `.hy` / `.en`
suffix before the extension. `src/lib/content.ts` pairs them by slug and falls back to
Armenian when a translation is missing, marking the entry `translated: false` so the page
can say so out loud.

Results are the exception: `src/content/results/<challenge-id>.json` is a flat JSON array,
language-neutral, loaded by a small custom loader in `src/content.config.ts` that fans each
array element into its own collection entry and stamps the challenge id from the filename.

### Leaderboards

`src/lib/leaderboard.ts` owns everything about ranking.

- **Rank is computed, never authored.** Ties share a rank and the next rank is skipped
  (1, 2, 2, 4). Equal scores break on the earlier date.
- The score field follows the challenge's `scoring` mode: `points` → `score`, `hits` →
  `hits`, `time` → `time`, `percent` → `percent`.
- `sortDirection` handles low-wins challenges without a special case.
- A challenge declares its own `columns`, so two challenges can show completely different
  tables through the same component.

The table is rendered server-side in full. Sorting, search, division/club/season filters
and the all-time / current-season toggle are progressive enhancements over rows that are
already in the DOM — so the complete leaderboard is readable and indexable with no
JavaScript. On narrow screens CSS turns each row into a card via `data-label` rather than
duplicating the markup.

### Build-time validation

`assertResultsValid()` runs on every page that renders a leaderboard, which means it runs
on every build.

Errors (build fails):
- a score above the challenge's declared `maxScore`
- a result referencing a challenge id that does not exist
- an unparseable date (caught by the Zod schema)

Warnings (build continues):
- a shooter name with no athlete profile

The seed data ships with two guest shooters who have no profile, so the warning path is
visible in a normal build. That is intentional.

Schemas also enforce alt text and the `/img/…` path convention, so an image can never be
committed without a description.

### Images

Content files address images as `/img/<folder>/<file>`; the build resolves that to
`src/assets/img/<folder>/<file>` via an eager `import.meta.glob` in `src/lib/images.ts`.
A missing file logs one warning and renders a labelled placeholder box instead of breaking
the page.

`npm run placeholders` generates a stand-in for every referenced path that does not exist
yet, at the correct aspect ratio. It never overwrites an existing file, so dropping in the
real photograph is all that is needed. `npm run images` regenerates
`src/content/config/images.md`, the manifest of every slot the site expects.

### Theming

Dark is the base theme. `:root[data-theme="light"]` redefines six surface and ink tokens;
brand colours stay put. An inline script in `<head>` applies the saved choice before first
paint, so there is no flash.

## Deployment

`.github/workflows/deploy.yml` runs on every push to `main`: install, `astro check`,
`astro build`, then publish `dist/` to GitHub Pages. `public/CNAME` pins the domain.

DNS records and the one-time GitHub Pages settings are in
[CONTENT_GUIDE.md](./CONTENT_GUIDE.md#dns-setup-for-armprfcom).

## Conventions worth keeping

- Content never imports from `src/components`. Components never hardcode a string that a
  visitor reads — those go through `useTranslations()` or a config file.
- New UI strings go in **both** `src/content/config/i18n/hy.json` and `en.json`. A missing
  key falls back to Armenian, then to the key itself, so nothing renders blank.
- Prefer a `<details>` element or a CSS-only pattern before reaching for a script.
- Anything a non-developer might want to change belongs in `src/content/config/`, not in a
  component.
