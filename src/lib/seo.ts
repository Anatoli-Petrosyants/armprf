import { site } from './site';
import { HTML_LANG, LOCALES, localizePath, type Lang } from './i18n';

export function absolute(path: string): string {
  return new URL(path, site.url).href;
}

/** hreflang set for one language-neutral path, plus x-default on Armenian. */
export function alternates(neutral: string) {
  const links = LOCALES.map((lang) => ({
    hreflang: HTML_LANG[lang],
    href: absolute(localizePath(neutral, lang)),
  }));
  links.push({ hreflang: 'x-default', href: absolute(localizePath(neutral, 'hy')) });
  return links;
}

export function organizationLd(lang: Lang) {
  return {
    '@context': 'https://schema.org',
    '@type': 'SportsOrganization',
    '@id': `${site.url}/#organization`,
    name: site.name[lang],
    legalName: site.legalName[lang],
    alternateName: site.shortName,
    url: site.url,
    logo: absolute('/img/brand/logo/armprf-logo-dark.svg'),
    foundingDate: String(site.foundingYear),
    sport: 'Precision Rifle Shooting',
    email: site.contact.email,
    telephone: site.contact.phone,
    areaServed: 'AM',
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'AM',
      streetAddress: site.contact.address[lang],
    },
    sameAs: Object.values(site.social),
  };
}

interface EventLdInput {
  name: string;
  description: string;
  start: Date;
  end?: Date;
  location: string;
  url: string;
  status: string;
  image?: string;
}

const EVENT_STATUS_LD: Record<string, string> = {
  open: 'https://schema.org/EventScheduled',
  full: 'https://schema.org/EventScheduled',
  closed: 'https://schema.org/EventScheduled',
  completed: 'https://schema.org/EventScheduled',
};

export function sportsEventLd(input: EventLdInput, lang: Lang) {
  return {
    '@context': 'https://schema.org',
    '@type': 'SportsEvent',
    name: input.name,
    description: input.description,
    startDate: input.start.toISOString().slice(0, 10),
    endDate: (input.end ?? input.start).toISOString().slice(0, 10),
    eventStatus: EVENT_STATUS_LD[input.status] ?? 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    url: absolute(input.url),
    ...(input.image ? { image: absolute(input.image) } : {}),
    location: {
      '@type': 'Place',
      name: input.location,
      address: { '@type': 'PostalAddress', addressCountry: 'AM' },
    },
    organizer: { '@id': `${site.url}/#organization`, name: site.name[lang] },
  };
}

interface ArticleLdInput {
  title: string;
  description: string;
  published: Date;
  modified?: Date;
  url: string;
  image?: string;
  author: string;
}

export function articleLd(input: ArticleLdInput, lang: Lang) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: input.title,
    description: input.description,
    datePublished: input.published.toISOString(),
    dateModified: (input.modified ?? input.published).toISOString(),
    mainEntityOfPage: absolute(input.url),
    inLanguage: HTML_LANG[lang],
    ...(input.image ? { image: absolute(input.image) } : {}),
    author: { '@type': 'Organization', name: input.author },
    publisher: { '@id': `${site.url}/#organization`, name: site.name[lang] },
  };
}

export function breadcrumbLd(items: Array<{ name: string; url: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: absolute(item.url),
    })),
  };
}

export function faqLd(items: Array<{ q: string; a: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a },
    })),
  };
}
