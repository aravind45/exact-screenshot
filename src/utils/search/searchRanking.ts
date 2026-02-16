/**
 * Search result ranking — scores, sorts, and returns ranked results.
 */

import type { SearchableItem } from './searchIndex';
import { scoreItem } from './fuzzySearch';

export interface RankedSearchResult {
  item: SearchableItem;
  score: number;
}

/**
 * Search the index and return results ranked by relevance (descending score).
 *
 * Items with score === 0 are excluded.
 * An optional `maxResults` caps the returned list (default 20).
 */
export function rankSearchResults(
  query: string,
  items: ReadonlyArray<SearchableItem>,
  maxResults = 20,
): RankedSearchResult[] {
  if (!query.trim()) return [];

  const scored: RankedSearchResult[] = [];

  for (const item of items) {
    const score = scoreItem(query, item);
    if (score > 0) {
      scored.push({ item, score });
    }
  }

  // Sort by score descending, then alphabetically by title for ties
  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.item.title.localeCompare(b.item.title);
  });

  return scored.slice(0, maxResults);
}

/**
 * Convenience: perform a full search against a SearchIndex instance and
 * return just the items (without scores) for simpler consumption.
 */
export function search(
  query: string,
  items: ReadonlyArray<SearchableItem>,
  maxResults = 20,
): SearchableItem[] {
  return rankSearchResults(query, items, maxResults).map((r) => r.item);
}
