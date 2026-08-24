#!/usr/bin/env node
/**
 * Creates a placeholder file for every `/img/...` path the site references and
 * that does not exist yet under src/assets/img/. Existing files are never
 * touched, so dropping a real photo in permanently replaces the placeholder.
 *
 *   npm run placeholders
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import sharp from 'sharp';

const ROOT = resolve(process.cwd());
const ASSETS = join(ROOT, 'src/assets/img');
const CONTENT = join(ROOT, 'src/content');

const ACCENT = '#f2a800';
const BG = '#12171a';
const GRID = '#20282d';
const INK = '#7d8b92';

/** Aspect + width rules per image folder, matching src/content/config/images.md. */
const SPECS = [
  { match: /^\/img\/brand\/hero\//, w: 2560, h: 1440 },
  { match: /^\/img\/brand\/portraits\//, w: 1000, h: 1000 },
  { match: /^\/img\/brand\/og\//, w: 1200, h: 630 },
  { match: /^\/img\/brand\/logo\//, w: 512, h: 512 },
  { match: /^\/img\/brand\/sponsors\//, w: 480, h: 200 },
  { match: /^\/img\/(posts|events|challenges)\//, w: 1920, h: 1080 },
  { match: /.*/, w: 1600, h: 1067 },
];

function specFor(path) {
  return SPECS.find((s) => s.match.test(path));
}

function esc(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** A reticle-and-grid plate — deliberately obviously a placeholder. */
function plateSvg(w, h, label) {
  const step = Math.round(Math.min(w, h) / 12);
  const lines = [];
  for (let x = step; x < w; x += step) lines.push(`<line x1="${x}" y1="0" x2="${x}" y2="${h}"/>`);
  for (let y = step; y < h; y += step) lines.push(`<line x1="0" y1="${y}" x2="${w}" y2="${y}"/>`);
  const cx = Math.round(w / 2);
  const cy = Math.round(h / 2);
  const r = Math.round(Math.min(w, h) * 0.16);
  const fs = Math.max(14, Math.round(Math.min(w, h) / 34));
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <rect width="${w}" height="${h}" fill="${BG}"/>
  <g stroke="${GRID}" stroke-width="1">${lines.join('')}</g>
  <g stroke="${ACCENT}" stroke-width="${Math.max(1, Math.round(r / 60))}" fill="none" opacity="0.75">
    <circle cx="${cx}" cy="${cy}" r="${r}"/>
    <circle cx="${cx}" cy="${cy}" r="${Math.round(r * 0.45)}"/>
    <line x1="${cx - r * 1.6}" y1="${cy}" x2="${cx - r * 0.15}" y2="${cy}"/>
    <line x1="${cx + r * 0.15}" y1="${cy}" x2="${cx + r * 1.6}" y2="${cy}"/>
    <line x1="${cx}" y1="${cy - r * 1.6}" x2="${cx}" y2="${cy - r * 0.15}"/>
    <line x1="${cx}" y1="${cy + r * 0.15}" x2="${cx}" y2="${cy + r * 1.6}"/>
  </g>
  <text x="${cx}" y="${cy + r * 2.1}" fill="${INK}" font-family="monospace" font-size="${fs}"
        text-anchor="middle" letter-spacing="1.5">${esc(label)}</text>
  <text x="${cx}" y="${cy + r * 2.1 + fs * 1.6}" fill="${ACCENT}" font-family="monospace"
        font-size="${Math.round(fs * 0.8)}" text-anchor="middle" opacity="0.8"
        letter-spacing="3">TODO(content) ${w}×${h}</text>
</svg>`;
}

const LOGO_MARK = (fg, ring) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512" role="img" aria-label="ARMPRF">
  <g fill="none" stroke="${ring}" stroke-width="14">
    <circle cx="256" cy="256" r="196"/>
    <circle cx="256" cy="256" r="118"/>
  </g>
  <g stroke="${fg}" stroke-width="14" stroke-linecap="square">
    <line x1="256" y1="20" x2="256" y2="132"/>
    <line x1="256" y1="380" x2="256" y2="492"/>
    <line x1="20" y1="256" x2="132" y2="256"/>
    <line x1="380" y1="256" x2="492" y2="256"/>
  </g>
  <circle cx="256" cy="256" r="26" fill="${ring}"/>
</svg>`;

const SPONSOR_MARK = (name) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 200" width="480" height="200" role="img" aria-label="${esc(name)}">
  <rect width="480" height="200" fill="none"/>
  <g fill="none" stroke="currentColor" stroke-width="6" opacity="0.55">
    <rect x="14" y="14" width="452" height="172" rx="4"/>
    <line x1="60" y1="100" x2="120" y2="100"/>
    <line x1="360" y1="100" x2="420" y2="100"/>
  </g>
  <text x="240" y="112" fill="currentColor" font-family="sans-serif" font-size="34" font-weight="700"
        text-anchor="middle" letter-spacing="2">${esc(name)}</text>
</svg>`;

/* ------------------------------------------------------------------ collect */
const wanted = new Set();

function walk(dir, fn) {
  if (!existsSync(dir)) return;
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full, fn);
    else fn(full);
  }
}

walk(CONTENT, (file) => {
  if (!/\.(json|md)$/.test(file)) return;
  const text = readFileSync(file, 'utf-8');
  for (const m of text.matchAll(/\/img\/[A-Za-z0-9._\/-]+\.(?:jpg|jpeg|png|svg|webp)/g)) {
    wanted.add(m[0]);
  }
});

// Slots that components reference directly rather than through content files.
[
  '/img/brand/logo/armprf-logo-dark.svg',
  '/img/brand/logo/armprf-logo-light.svg',
  '/img/brand/og/og-default.jpg',
  '/img/brand/hero/hero-01.jpg',
  '/img/brand/hero/hero-02.jpg',
  '/img/brand/hero/hero-03.jpg',
].forEach((p) => wanted.add(p));

/* ------------------------------------------------------------------ generate */
let made = 0;
let kept = 0;

for (const rel of [...wanted].sort()) {
  const out = join(ASSETS, rel.replace('/img/', ''));
  if (existsSync(out)) {
    kept += 1;
    continue;
  }
  mkdirSync(dirname(out), { recursive: true });
  const label = rel.replace('/img/', '');

  if (rel.endsWith('.svg')) {
    if (rel.includes('/logo/')) {
      const light = rel.includes('light');
      writeFileSync(out, LOGO_MARK(light ? '#14181a' : '#eef1f2', ACCENT));
    } else {
      const name = label.split('/').pop().replace(/\.svg$/, '').replace(/^sponsor-/, '').toUpperCase();
      writeFileSync(out, SPONSOR_MARK(name));
    }
    made += 1;
    continue;
  }

  const { w, h } = specFor(rel);
  const svg = Buffer.from(plateSvg(w, h, label));
  await sharp(svg).jpeg({ quality: 82, mozjpeg: true }).toFile(out);
  made += 1;
}

// The social card also has to exist as a static file for crawlers that do not
// follow Astro's hashed asset URLs.
const ogStatic = join(ROOT, 'public/og-default.jpg');
if (!existsSync(ogStatic)) {
  mkdirSync(dirname(ogStatic), { recursive: true });
  await sharp(Buffer.from(plateSvg(1200, 630, 'og-default'))).jpeg({ quality: 82 }).toFile(ogStatic);
  made += 1;
}

console.log(`placeholders: ${made} created, ${kept} already present (never overwritten)`);
