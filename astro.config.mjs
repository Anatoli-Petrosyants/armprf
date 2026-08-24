// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

// armprf.com — static site, deployed to GitHub Pages.
// Locale routing is handled manually via `[...locale]` rest params so that
// Armenian lives at the root (`/about`) and English is prefixed (`/en/about`).
export default defineConfig({
  site: 'https://armprf.com',
  trailingSlash: 'ignore',
  build: { format: 'directory' },
  integrations: [
    sitemap({
      i18n: {
        defaultLocale: 'hy',
        locales: { hy: 'hy-AM', en: 'en' },
      },
      filter: (page) => !page.includes('/404'),
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
