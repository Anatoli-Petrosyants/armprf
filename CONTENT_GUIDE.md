# Editing armprf.com

This site has no admin panel and no database. Everything you see on the page comes from a
file in this repository. If you can edit a text file, you can update the whole site.

You never need to touch anything inside `src/components`, `src/layouts`, `src/pages` or
`src/lib`. Those are the machinery. Content lives in `src/content` and images in
`src/assets/img`.

---

## The one rule about languages

Everything exists twice: once in Armenian, once in English.

For posts, challenges and athletes that means **two files per item**:

```
src/content/posts/2026-05-19-gyumri-round-2-report.hy.md   ← Armenian
src/content/posts/2026-05-19-gyumri-round-2-report.en.md   ← English
```

The part before `.hy` / `.en` is the address of the page, and it must match exactly
between the two files. To add a translation, copy the `.hy.md` file, rename it to `.en.md`,
and translate the inside.

If an English file is missing, the English page still works — it shows the Armenian text
with a small "not translated yet" notice. Nothing breaks.

For settings files (everything in `src/content/config/`), both languages live inside the
same file, as `"hy"` and `"en"` keys:

```json
"title": { "hy": "Մրցումներ", "en": "Events" }
```

---

## Add a blog post

1. Create two files in `src/content/posts/`, named `YYYY-MM-DD-short-slug.hy.md` and
   `.en.md`.
2. Copy the block below into each and edit it.

```markdown
---
title: "Gyumri Round 2: the wind took the points"
excerpt: "One or two sentences. This shows on the cards and in Google results."
date: 2026-05-19
tags: ["match-report"]
author: "ARMPRF"
cover: "/img/posts/2026-05-19-gyumri-report.jpg"
coverAlt: "A shooter on a positional stage, wind flags behind"
gallery:
  - src: "/img/match/stage-firing/2026-05-17_match-stage-firing_gyumri_01.jpg"
    alt: "A shooter firing off a tank trap"
featured: false
draft: false
---

The article itself, in Markdown. Use `##` for section headings, `-` for bullets,
`**bold**` for emphasis.
```

Allowed `tags`, exactly as spelled: `match-report`, `training`, `gear`, `rimfire`,
`community`, `announcement`. Anything else fails the build with a clear message.

Set `draft: true` to keep a post visible while you work locally but out of the published
site.

Matches live here too. Announce one as a post tagged `announcement`, listing the date,
divisions, distances, round count, entry fee and how to enter; afterwards publish a second
post tagged `match-report` with the photographs.

---

## Add a leaderboard result

Open `src/content/results/<challenge-id>.json`. It is a plain list. Copy the last entry,
paste it below, edit the numbers:

```json
{
  "name": "Armen Hakobyan",
  "club": "ARMPRF",
  "division": "Open",
  "date": "2026-05-17",
  "rifle": "Tikka T3x TAC A1",
  "caliber": "6.5 Creedmoor",
  "score": 18,
  "verified": true,
  "proofUrl": "https://www.youtube.com/watch?v=..."
}
```

Things worth knowing:

- **Never write a rank.** Position is calculated from the scores every time the site
  builds. Equal scores share a rank and the next rank is skipped: 1, 2, 2, 4.
- `club` is recorded on every row but only shown once more than one club exists. While
  everyone is ARMPRF the column and its filter stay hidden — add a second club and both
  come back on their own.
- `name` should match the athlete's name in `src/content/athletes/`. If it does not, the
  result still shows, but the build prints a warning and the name will not link to a
  profile. Use the Latin spelling from the `.en.md` file — the site swaps in the Armenian
  spelling automatically on Armenian pages.
- `verified` and `proofUrl` are still recorded on every row, but no longer shown on the
  board. Keep filling them in — they are the audit trail, and putting either column back is
  one word in the challenge's `columns` list.
- The season shown by the "current season" toggle comes from the year in `date`.
- Depending on the challenge you may use `hits`, `misses`, `percent` or `time` (seconds)
  instead of `score`. The challenge file decides which columns appear.

A score above the challenge's `maxScore` stops the build on purpose. So does a date the
computer cannot read. Both messages tell you the file and the shooter.

---

## Add a whole new challenge

Two files, nothing else.

**1. `src/content/challenges/my-challenge.hy.md`** (and `.en.md`):

```markdown
---
id: "my-challenge"          # must match the results filename
title: "My Challenge"
summary: "One sentence."
scoring: "points"           # points | hits | time | percent
sortDirection: "desc"       # desc = high score wins, asc = low time wins
maxScore: 21                # optional, but it enables the safety check
unit: "pts"                 # optional label next to the number
videoUrl: "https://www.youtube.com/watch?v=..."   # optional
heroImage: "/img/challenges/my-challenge.jpg"
heroAlt: "Describe the photo"
columns: ["rank", "name", "club", "division", "score", "date", "verified", "proof"]
seasonal: false             # true pre-selects the current season
active: true
order: 50                   # lower numbers appear first
---

The rules, in Markdown. This is the body of the challenge page.
```

**2. `src/content/results/my-challenge.json`** — start it as `[]` and add rows.

The tab, the page, the podium, the filters, the sorting and the sitemap entry all appear
by themselves. Available column names: `rank`, `name`, `club`, `division`, `score`,
`hits`, `misses`, `percent`, `time`, `date`, `rifle`, `caliber`, `notes`, `proof`,
`verified`.

To feature a different challenge on the home page, change `featuredChallenge` in
`src/content/config/site.json` to its `id`.

---

## Add an athlete

Athletes are a roster, not a set of profile pages: a photograph, a name, a city and the
year they joined. Two files in `src/content/athletes/`, named after the slug:

```markdown
---
name: "Armen Hakobyan"
slug: "armen-hakobyan"      # same in both language files
club: "ARMPRF"
photo: "/img/brand/portraits/armen-hakobyan.jpg"
photoAlt: "Armen Hakobyan, ARMPRF shooter, portrait"
memberSince: 2023
hometown: "Yerevan"
---
```

Nothing goes below the second `---`. There is no body to write.

Write the name in Armenian in the `.hy.md` file and in Latin in the `.en.md` file. Results
files record the Latin spelling, and the leaderboard swaps in the Armenian one on Armenian
pages by matching the slug — so you never repeat a name in a results file.

## Add a photo

1. Save it as `src/assets/img/<folder>/<filename>.jpg`, using the folders listed in
   `src/content/config/images.md`.
2. Name it `YYYY-MM-DD_tag_short-description_01.jpg`.
3. Reference it from a content file as `/img/<folder>/<filename>.jpg` — note the leading
   slash and that you drop the `src/assets` part.
4. Always write an `alt` description. The build refuses images without one in places where
   it matters.

Sizes: landscape 3:2 or 16:9 for galleries and heroes, 1:1 for portraits, JPEG quality 90,
longest edge at least 2000 px. Keep your originals elsewhere; the build makes the web
sizes.

Every image slot the site expects is listed in `src/content/config/images.md`, with the
aspect ratio and minimum resolution for each folder, and whether the file there is real
artwork or a generated stand-in. The logo, the home hero and the two About photos are real;
everything else is still a placeholder, so nothing looks broken while you collect the rest. **The build never
overwrites a file that already exists** — dropping your photo in at the same path is
enough.

Photographs are published inside posts. Add them to the `gallery:` list in a post's
frontmatter and they appear as a grid under the article, with a lightbox.

## Add a video

Do not upload video files. Set `videoUrl` on a post or a challenge and the YouTube id is
enough — the player only contacts YouTube once a visitor clicks it.

---

## Change the slogan, the contact details, the flags

Everything site-wide lives in `src/content/config/site.json`.

- **Slogan** — three are already written in `slogans`. Change `activeSloganIndex` to `0`,
  `1` or `2`, or edit the text.
- **Email, phone, address, map** — under `contact`.
- **Instagram, Facebook, YouTube, Telegram** — under `social`.
- **Google Form links** — under `forms`: `scoreSubmission` for the leaderboard "submit your
  score" button, `contact` for the optional form on the Contact page. Replace both `TODO_`
  placeholders with the real form URLs.
- **Switches** — under `flags`:
  - `showShop` — turns the Shop page and its nav link on or off.
  - `showContactForm` — adds a Google Form button next to the email link on Contact.
  - `showAthletePhotos` — hides every athlete portrait if you would rather not publish
    faces.
- **Featured challenge and current season** — `featuredChallenge`, `currentSeason`.

Other settings files, all in `src/content/config/`:

| File | Controls |
| --- | --- |
| `nav.json` | The menu, in order |
| `home.json` | Home page mission tiles and the three numbers under the hero |
| `about.json` | Mission text, goals, board, history, safety statement, the two About photos |
| `rules.json` | The Rules & Safety page |
| `i18n/hy.json`, `i18n/en.json` | Every button and label on the site |

---

## Working locally

```bash
npm install     # once
npm run dev     # http://localhost:4321, updates as you save
npm run build   # the real build; fails if content is wrong
```

Two helpers worth knowing:

```bash
npm run content   # regenerate placeholder images and refresh images.md
```

Run that after adding new content that points at a photo you have not uploaded yet. It
creates a stand-in so the page still looks right, and it never touches a real file.

## Publishing

Commit and push to `main`. GitHub Actions builds the site and publishes it. It takes about
two minutes. If the build fails, the site stays as it was and the error is in the Actions
tab, in plain language: which file, which line, what is wrong.

---

## DNS setup for armprf.com

`public/CNAME` already contains `armprf.com`, so GitHub knows which domain to serve.

**1. In the repository:** Settings → Pages → Source: *GitHub Actions*. Under "Custom
domain" enter `armprf.com` and save.

**2. At your DNS provider,** create these records for the apex domain:

| Type | Name | Value |
| --- | --- | --- |
| A | `@` | `185.199.108.153` |
| A | `@` | `185.199.109.153` |
| A | `@` | `185.199.110.153` |
| A | `@` | `185.199.111.153` |
| AAAA | `@` | `2606:50c0:8000::153` |
| AAAA | `@` | `2606:50c0:8001::153` |
| AAAA | `@` | `2606:50c0:8002::153` |
| AAAA | `@` | `2606:50c0:8003::153` |
| CNAME | `www` | `<your-github-username>.github.io.` |

The AAAA records are optional but recommended. The trailing dot on the CNAME value matters
at some providers.

**3. Wait** for DNS to propagate — usually minutes, sometimes a few hours. Then tick
"Enforce HTTPS" in Settings → Pages. GitHub issues the certificate itself.

**4. Check** that `https://www.armprf.com` redirects to `https://armprf.com`. GitHub does
this automatically once the `www` CNAME resolves.

---

## When something goes wrong

The build is deliberately strict, because a broken leaderboard is worse than a failed
deploy. These are the messages you are most likely to see.

| Message | What to do |
| --- | --- |
| `data does not match collection schema` | A field is missing or misspelled in a `---` block. The message names the file and the field. |
| `scored 25, above maxScore 21` | A typo in a results file, or the challenge's `maxScore` is wrong. |
| `references challenge "x", but no challenges/x.hy.md declares that id` | The results filename and the challenge `id` disagree. |
| `No athlete profile for "…"` | A warning, not an error. Either add the athlete or accept that the name will not link. |
| `image paths must start with /img/` | You wrote a path with `src/assets` in it. Drop that part. |
| `alt text is required` | Add an `alt` or `coverAlt` line. |
