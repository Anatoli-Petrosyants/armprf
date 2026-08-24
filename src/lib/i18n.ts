import hy from '@/content/config/i18n/hy.json';
import en from '@/content/config/i18n/en.json';

export const LOCALES = ['hy', 'en'] as const;
export type Lang = (typeof LOCALES)[number];
export const DEFAULT_LANG: Lang = 'hy';

/** BCP-47 tags for <html lang> and hreflang. */
export const HTML_LANG: Record<Lang, string> = { hy: 'hy-AM', en: 'en' };

const DICTS: Record<Lang, Record<string, string>> = { hy, en };

export function isLang(value: unknown): value is Lang {
  return typeof value === 'string' && (LOCALES as readonly string[]).includes(value);
}

/**
 * Look up a UI string. Missing keys fall back to Armenian, then to the key
 * itself — a missing translation degrades to readable text, never to a blank.
 */
export function useTranslations(lang: Lang) {
  const dict = DICTS[lang];
  return function t(key: string, vars?: Record<string, string | number>): string {
    let out = dict[key] ?? DICTS[DEFAULT_LANG][key] ?? key;
    if (vars) {
      for (const [k, v] of Object.entries(vars)) out = out.replaceAll(`{${k}}`, String(v));
    }
    return out;
  };
}

/**
 * Armenian lives at the site root, English under `/en`. Both are real static
 * pages, so language switching works with JavaScript disabled.
 */
export function localizePath(path: string, lang: Lang): string {
  const clean = path === '/' ? '' : path.replace(/\/+$/, '');
  return lang === DEFAULT_LANG ? clean || '/' : `/en${clean}` || '/en';
}

/** Strip the locale prefix, giving the language-neutral path. */
export function neutralPath(pathname: string): string {
  const stripped = pathname.replace(/^\/en(?=\/|$)/, '') || '/';
  return stripped.replace(/\/+$/, '') || '/';
}

/** The `[...locale]` rest param used by every page route. */
export function localeParam(lang: Lang): string | undefined {
  return lang === DEFAULT_LANG ? undefined : lang;
}

/** getStaticPaths entries covering both languages. */
export function localePaths() {
  return LOCALES.map((lang) => ({
    params: { locale: localeParam(lang) },
    props: { lang },
  }));
}

/** Pick the field for `lang` from a `{ hy, en }` record. */
export function pick<T>(value: Record<Lang, T> | undefined, lang: Lang): T | undefined {
  if (!value) return undefined;
  return value[lang] ?? value[DEFAULT_LANG];
}
