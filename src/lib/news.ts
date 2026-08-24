import { TAGS } from '@/content.config';

export const PER_PAGE = 12;

type PostLike = { data: { tags: string[] } };

/** Tag counts in the declared tag order, dropping tags nobody has used yet. */
export function tagCounts(posts: PostLike[]): Array<{ tag: string; count: number }> {
  const counts = new Map<string, number>();
  for (const post of posts) {
    for (const tag of post.data.tags) counts.set(tag, (counts.get(tag) ?? 0) + 1);
  }
  return TAGS.map((tag) => ({ tag, count: counts.get(tag) ?? 0 })).filter((entry) => entry.count > 0);
}
