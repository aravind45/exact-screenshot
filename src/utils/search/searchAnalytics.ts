/**
 * Search analytics — tracks queries and result clicks in localStorage.
 */

const STORAGE_KEY = 'ee_search_analytics';
const MAX_ENTRIES = 100;

export interface SearchAnalyticsEntry {
  query: string;
  resultCount: number;
  clickedResultId: string | null;
  timestamp: string; // ISO string
}

export interface SearchAnalyticsData {
  entries: SearchAnalyticsEntry[];
  /** Most frequently searched queries (top 10) */
  topQueries: Array<{ query: string; count: number }>;
}

/**
 * Read analytics data from localStorage.
 */
export function getSearchAnalytics(): SearchAnalyticsData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { entries: [], topQueries: [] };
    const data = JSON.parse(raw) as SearchAnalyticsData;
    return data;
  } catch {
    return { entries: [], topQueries: [] };
  }
}

/**
 * Record a search query event.
 */
export function trackSearchQuery(query: string, resultCount: number): void {
  const data = getSearchAnalytics();

  data.entries.push({
    query,
    resultCount,
    clickedResultId: null,
    timestamp: new Date().toISOString(),
  });

  // Cap stored entries
  if (data.entries.length > MAX_ENTRIES) {
    data.entries = data.entries.slice(-MAX_ENTRIES);
  }

  data.topQueries = computeTopQueries(data.entries);
  saveAnalytics(data);
}

/**
 * Record a click on a search result.
 */
export function trackSearchClick(query: string, resultId: string): void {
  const data = getSearchAnalytics();

  // Update the most recent entry for this query
  for (let i = data.entries.length - 1; i >= 0; i--) {
    if (data.entries[i].query === query && !data.entries[i].clickedResultId) {
      data.entries[i].clickedResultId = resultId;
      break;
    }
  }

  saveAnalytics(data);
}

/**
 * Clear all analytics data.
 */
export function clearSearchAnalytics(): void {
  localStorage.removeItem(STORAGE_KEY);
}

/** Compute top 10 most frequent queries */
function computeTopQueries(
  entries: SearchAnalyticsEntry[],
): Array<{ query: string; count: number }> {
  const counts = new Map<string, number>();
  for (const e of entries) {
    const q = e.query.toLowerCase().trim();
    if (q) {
      counts.set(q, (counts.get(q) ?? 0) + 1);
    }
  }

  return Array.from(counts.entries())
    .map(([query, count]) => ({ query, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
}

function saveAnalytics(data: SearchAnalyticsData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // localStorage full or unavailable — silently ignore
  }
}
