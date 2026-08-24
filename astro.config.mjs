// @ts-check
import { readFileSync } from 'node:fs';
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

// There is no leaderboards overview page: /leaderboards opens the featured
// challenge directly, and the tab strip on that page switches between them.
// Reading the id here keeps site.json the single place that decides which one.
const { featuredChallenge } = JSON.parse(
  readFileSync(new URL('./src/content/config/site.json', import.meta.url), 'utf-8'),
);

// armprf.com — static site, deployed to GitHub Pages.
// Locale routing is handled manually via `[...locale]` rest params so that
// Armenian lives at the root (`/about`) and English is prefixed (`/en/about`).
export default defineConfig({
  site: 'https://armprf.com',
  trailingSlash: 'ignore',
  build: { format: 'directory' },
  redirects: {
    '/leaderboards': `/leaderboards/${featuredChallenge}`,
    '/en/leaderboards': `/en/leaderboards/${featuredChallenge}`,
  },
  integrations: [
    sitemap({
      i18n: {
        defaultLocale: 'hy',
        locales: { hy: 'hy-AM', en: 'en' },
      },
      // The redirect stub is not a page anyone should land on from search.
      filter: (page) => !page.includes('/404') && !/\/leaderboards\/?$/.test(page),
    }),
  ],
  image: {
    responsiveStyles: true,
  },
  markdown: {
    shikiConfig: { theme: 'github-dark', wrap: true },
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
