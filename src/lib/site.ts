import siteJson from '@/content/config/site.json';
import navJson from '@/content/config/nav.json';
import type { Lang } from './i18n';

export const site = siteJson;
export const nav = navJson;

export type FlagName = keyof typeof siteJson.flags;

export function flag(name: FlagName): boolean {
  return Boolean(siteJson.flags[name]);
}

export function siteName(lang: Lang): string {
  return siteJson.name[lang];
}

export function slogan(lang: Lang): string {
  const index = Math.min(siteJson.activeSloganIndex, siteJson.slogans.length - 1);
  return siteJson.slogans[index][lang];
}

/** Nav entries whose feature flag (if any) is on. */
export function visibleNav(items: Array<{ key: string; path: string; flag?: string }>) {
  return items.filter((item) => !item.flag || flag(item.flag as FlagName));
}

export const socialLinks = [
  { id: 'instagram', label: 'Instagram', url: siteJson.social.instagram },
  { id: 'facebook', label: 'Facebook', url: siteJson.social.facebook },
  { id: 'youtube', label: 'YouTube', url: siteJson.social.youtube },
] as const;
