import { site } from './site';
import { DEFAULT_LANG, HTML_LANG, LOCALES, localizePath, type Lang } from './i18n';

export function absolute(path: string): string {
  return new URL(path, site.url).href;
}

/** hreflang set for one language-neutral path, plus x-default on English. */
export function alternates(neutral: string) {
  const links = LOCALES.map((lang) => ({
    hreflang: HTML_LANG[lang],
    href: absolute(localizePath(neutral, lang)),
  }));
  links.push({ hreflang: 'x-default', href: absolute(localizePath(neutral, DEFAULT_LANG)) });
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
