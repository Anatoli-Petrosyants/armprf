import rss from '@astrojs/rss';
import { getPosts } from './content';
import { localizePath, type Lang } from './i18n';
import { site, siteName } from './site';
import { absolute } from './seo';

/** One feed per language, both linked from every page's <head>. */
export async function buildFeed(lang: Lang) {
  const posts = await getPosts(lang);
  return rss({
    title: `${siteName(lang)} — ${lang === 'hy' ? 'Նորություններ' : 'News'}`,
    description: site.description[lang],
    site: site.url,
    trailingSlash: false,
    customData: `<language>${lang === 'hy' ? 'hy-am' : 'en'}</language>`,
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.excerpt,
      pubDate: post.data.date,
      link: localizePath(`/blog/${post.slug}`, lang),
      categories: post.data.tags,
      author: post.data.author,
      ...(post.data.cover
        ? { enclosure: undefined, customData: `<media:content url="${absolute(post.data.cover)}" medium="image"/>` }
        : {}),
    })),
  });
}
