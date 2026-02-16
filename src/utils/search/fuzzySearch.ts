/**
 * Fuzzy search algorithm — lightweight, no external dependencies.
 *
 * Matching strategy (case-insensitive):
 *  1. Exact match          → score 100
 *  2. Starts with query    → score 80
 *  3. Word starts with     → score 60  (a word boundary matches)
 *  4. Contains substring   → score 40
 *  5. Fuzzy char sequence  → score 20  (all query chars appear in order)
 *  6. No match             → score 0
 */

export interface FuzzyMatchResult {
  /** Whether the query matched the target at all */
  matched: boolean;
  /** Relevance score (0–100) */
  score: number;
}

/**
 * Score a single target string against a query.
 */
export function fuzzyScore(query: string, target: string): FuzzyMatchResult {
  if (!query || !target) {
    return { matched: false, score: 0 };
  }

  const q = query.toLowerCase();
  const t = target.toLowerCase();

  // 1. Exact match
  if (t === q) {
    return { matched: true, score: 100 };
  }

  // 2. Starts with
  if (t.startsWith(q)) {
    return { matched: true, score: 80 };
  }

  // 3. Word starts with — check if any word in the target starts with the query
  const words = t.split(/[\s\-_/]+/);
  for (const word of words) {
    if (word.startsWith(q)) {
      return { matched: true, score: 60 };
    }
  }

  // 4. Contains substring
  if (t.includes(q)) {
    return { matched: true, score: 40 };
  }

  // 5. Fuzzy character sequence match
  if (fuzzyCharMatch(q, t)) {
    return { matched: true, score: 20 };
  }

  return { matched: false, score: 0 };
}

/**
 * Check if all characters in `query` appear in order in `target`.
 */
export function fuzzyCharMatch(query: string, target: string): boolean {
  let qi = 0;
  for (let ti = 0; ti < target.length && qi < query.length; ti++) {
    if (target[ti] === query[qi]) {
      qi++;
    }
  }
  return qi === query.length;
}

/**
 * Score a SearchableItem against a query by checking title, subtitle, and keywords.
 * Returns the highest score found across all fields.
 */
export function scoreItem(
  query: string,
  item: { title: string; subtitle?: string; keywords?: string[] },
): number {
  let best = fuzzyScore(query, item.title).score;

  if (item.subtitle) {
    best = Math.max(best, fuzzyScore(query, item.subtitle).score);
  }

  if (item.keywords) {
    for (const kw of item.keywords) {
      best = Math.max(best, fuzzyScore(query, kw).score);
    }
  }

  return best;
}
