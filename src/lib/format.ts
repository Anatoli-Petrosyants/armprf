import { HTML_LANG, type Lang } from './i18n';

/** Dates are rendered in UTC so a build machine's timezone cannot shift a match day. */
export function formatDate(date: Date, lang: Lang, opts?: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat(HTML_LANG[lang], {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
    ...opts,
  }).format(date);
}

export function formatDateShort(date: Date, lang: Lang): string {
  return formatDate(date, lang, { month: 'short', day: 'numeric', year: 'numeric' });
}

/** `2026-05-17` — for <time datetime> and .ics. */
export function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function formatNumber(value: number, lang: Lang, opts?: Intl.NumberFormatOptions): string {
  return new Intl.NumberFormat(HTML_LANG[lang], opts).format(value);
}

/** Seconds as m:ss.t — leaderboard time columns. */
export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}:${s.toFixed(1).padStart(4, '0')}` : `${s.toFixed(1)}s`;
}

export function readingTime(markdown: string): number {
  const words = markdown.trim().split(/\s+/).length;
  return Math.max(1, Math.round(words / 200));
}

/** Accepts a full YouTube URL or a bare id; returns the id or undefined. */
export function youtubeId(input: string | undefined): string | undefined {
  if (!input) return undefined;
  if (/^[\w-]{11}$/.test(input)) return input;
  const match = input.match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([\w-]{11})/);
  return match?.[1];
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9԰-֏]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
