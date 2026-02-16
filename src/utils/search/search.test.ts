import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  SearchIndex,
  buildSearchableItems,
  type SearchableItem,
} from './searchIndex';
import { fuzzyScore, fuzzyCharMatch, scoreItem } from './fuzzySearch';
import { rankSearchResults, search } from './searchRanking';
import { performSearch, debounce } from './performSearch';
import {
  trackSearchQuery,
  trackSearchClick,
  getSearchAnalytics,
  clearSearchAnalytics,
} from './searchAnalytics';

// ---------------------------------------------------------------------------
// Test fixtures
// ---------------------------------------------------------------------------

function createTestItems(): SearchableItem[] {
  return [
    {
      id: 'a1',
      type: 'asset',
      title: 'Fidelity 401k',
      subtitle: 'Fidelity Investments',
      keywords: ['retirement', '401k'],
      url: '/assets/a1',
      category: 'Assets',
    },
    {
      id: 'a2',
      type: 'asset',
      title: 'Chase Checking Account',
      subtitle: 'JPMorgan Chase',
      keywords: ['bank', 'checking'],
      url: '/assets/a2',
      category: 'Assets',
    },
    {
      id: 'c1',
      type: 'communication',
      title: 'Call with Fidelity',
      subtitle: 'Fidelity Investments',
      url: '/communications/c1',
      category: 'Communications',
    },
    {
      id: 'd1',
      type: 'document',
      title: 'Death Certificate',
      subtitle: 'Legal',
      url: '/documents/d1',
      category: 'Documents',
    },
    {
      id: 'p1',
      type: 'page',
      title: 'Settings',
      keywords: ['preferences', 'account'],
      url: '/settings',
      category: 'Settings',
    },
  ];
}

// ---------------------------------------------------------------------------
// SearchIndex
// ---------------------------------------------------------------------------

describe('SearchIndex', () => {
  let index: SearchIndex;

  beforeEach(() => {
    index = new SearchIndex();
  });

  it('starts empty', () => {
    expect(index.size).toBe(0);
    expect(index.getItems()).toEqual([]);
  });

  it('setItems replaces all items', () => {
    const items = createTestItems();
    index.setItems(items);
    expect(index.size).toBe(5);
    index.setItems([items[0]]);
    expect(index.size).toBe(1);
  });

  it('addItem appends a new item', () => {
    index.addItem(createTestItems()[0]);
    expect(index.size).toBe(1);
  });

  it('addItem updates existing item with same id+type', () => {
    const item = createTestItems()[0];
    index.addItem(item);
    index.addItem({ ...item, title: 'Updated' });
    expect(index.size).toBe(1);
    expect(index.getItems()[0].title).toBe('Updated');
  });

  it('removeItem removes by id and type', () => {
    index.setItems(createTestItems());
    index.removeItem('a1', 'asset');
    expect(index.size).toBe(4);
    expect(index.getItems().find((i) => i.id === 'a1')).toBeUndefined();
  });

  it('getItemsByType filters correctly', () => {
    index.setItems(createTestItems());
    expect(index.getItemsByType('asset')).toHaveLength(2);
    expect(index.getItemsByType('page')).toHaveLength(1);
    expect(index.getItemsByType('document')).toHaveLength(1);
  });

  it('clear empties the index', () => {
    index.setItems(createTestItems());
    index.clear();
    expect(index.size).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// buildSearchableItems
// ---------------------------------------------------------------------------

describe('buildSearchableItems', () => {
  it('builds items from assets', () => {
    const items = buildSearchableItems({
      assets: [{ id: '1', name: 'Fidelity 401k', institution: 'Fidelity' }],
    });
    expect(items).toHaveLength(1);
    expect(items[0].type).toBe('asset');
    expect(items[0].title).toBe('Fidelity 401k');
    expect(items[0].category).toBe('Assets');
  });

  it('builds items from communications', () => {
    const items = buildSearchableItems({
      communications: [{ id: '1', subject: 'Call with Chase' }],
    });
    expect(items).toHaveLength(1);
    expect(items[0].type).toBe('communication');
    expect(items[0].title).toBe('Call with Chase');
  });

  it('builds items from documents', () => {
    const items = buildSearchableItems({
      documents: [{ id: '1', name: 'Death Certificate', type: 'Legal' }],
    });
    expect(items).toHaveLength(1);
    expect(items[0].type).toBe('document');
    expect(items[0].subtitle).toBe('Legal');
  });

  it('builds items from pages', () => {
    const items = buildSearchableItems({
      pages: [{ id: 's', label: 'Settings', path: '/settings', keywords: ['prefs'] }],
    });
    expect(items).toHaveLength(1);
    expect(items[0].type).toBe('page');
    expect(items[0].keywords).toContain('prefs');
  });

  it('handles empty data', () => {
    expect(buildSearchableItems({})).toEqual([]);
  });

  it('combines all data sources', () => {
    const items = buildSearchableItems({
      assets: [{ id: '1', name: 'A' }],
      communications: [{ id: '2', subject: 'B' }],
      documents: [{ id: '3', name: 'C' }],
      pages: [{ id: '4', label: 'D', path: '/d' }],
    });
    expect(items).toHaveLength(4);
  });
});

// ---------------------------------------------------------------------------
// fuzzyScore
// ---------------------------------------------------------------------------

describe('fuzzyScore', () => {
  it('returns score 100 for exact match (case-insensitive)', () => {
    expect(fuzzyScore('fidelity', 'Fidelity').score).toBe(100);
  });

  it('returns score 80 for starts-with match', () => {
    expect(fuzzyScore('fid', 'Fidelity 401k').score).toBe(80);
  });

  it('returns score 60 for word-starts-with match', () => {
    expect(fuzzyScore('401', 'Fidelity 401k').score).toBe(60);
  });

  it('returns score 40 for contains match', () => {
    expect(fuzzyScore('delit', 'Fidelity').score).toBe(40);
  });

  it('returns score 20 for fuzzy char sequence match', () => {
    // "fdk" → chars f, d, k appear in order in "Fidelity 401k"
    expect(fuzzyScore('fdk', 'Fidelity 401k').score).toBe(20);
  });

  it('returns score 0 for no match', () => {
    const result = fuzzyScore('xyz', 'Fidelity');
    expect(result.matched).toBe(false);
    expect(result.score).toBe(0);
  });

  it('returns no match for empty query', () => {
    expect(fuzzyScore('', 'Fidelity').matched).toBe(false);
  });

  it('returns no match for empty target', () => {
    expect(fuzzyScore('fid', '').matched).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// fuzzyCharMatch
// ---------------------------------------------------------------------------

describe('fuzzyCharMatch', () => {
  it('matches when all chars appear in order', () => {
    expect(fuzzyCharMatch('fdk', 'fidelity 401k')).toBe(true);
  });

  it('does not match when chars are out of order', () => {
    expect(fuzzyCharMatch('kdf', 'fidelity 401k')).toBe(false);
  });

  it('matches single character', () => {
    expect(fuzzyCharMatch('f', 'fidelity')).toBe(true);
  });

  it('returns true for empty query', () => {
    expect(fuzzyCharMatch('', 'anything')).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// scoreItem
// ---------------------------------------------------------------------------

describe('scoreItem', () => {
  it('scores against title', () => {
    expect(scoreItem('fidelity', { title: 'Fidelity 401k' })).toBe(80);
  });

  it('scores against subtitle and takes the best', () => {
    const score = scoreItem('investments', {
      title: 'Fidelity 401k',
      subtitle: 'Fidelity Investments',
    });
    // "investments" is a word in subtitle → word starts with → 60
    expect(score).toBe(60);
  });

  it('scores against keywords', () => {
    const score = scoreItem('retirement', {
      title: 'Fidelity 401k',
      keywords: ['retirement'],
    });
    expect(score).toBe(100); // exact match on keyword
  });

  it('returns 0 when nothing matches', () => {
    expect(scoreItem('zzz', { title: 'Fidelity' })).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// rankSearchResults
// ---------------------------------------------------------------------------

describe('rankSearchResults', () => {
  const items = createTestItems();

  it('returns empty for blank query', () => {
    expect(rankSearchResults('', items)).toEqual([]);
    expect(rankSearchResults('   ', items)).toEqual([]);
  });

  it('returns results sorted by score descending', () => {
    const results = rankSearchResults('fidelity', items);
    expect(results.length).toBeGreaterThan(0);
    for (let i = 1; i < results.length; i++) {
      expect(results[i - 1].score).toBeGreaterThanOrEqual(results[i].score);
    }
  });

  it('excludes items with score 0', () => {
    const results = rankSearchResults('zzzzz', items);
    expect(results).toHaveLength(0);
  });

  it('respects maxResults', () => {
    const results = rankSearchResults('a', items, 2);
    expect(results.length).toBeLessThanOrEqual(2);
  });

  it('finds assets by institution keyword', () => {
    const results = rankSearchResults('checking', items);
    expect(results.some((r) => r.item.id === 'a2')).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// search (convenience)
// ---------------------------------------------------------------------------

describe('search', () => {
  const items = createTestItems();

  it('returns SearchableItem[] without scores', () => {
    const results = search('fidelity', items);
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]).toHaveProperty('id');
    expect(results[0]).not.toHaveProperty('score');
  });
});

// ---------------------------------------------------------------------------
// performSearch
// ---------------------------------------------------------------------------

describe('performSearch', () => {
  const items = createTestItems();

  it('returns ranked results', () => {
    const results = performSearch('fidelity', items);
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].score).toBeGreaterThanOrEqual(results[results.length - 1].score);
  });

  it('returns empty for blank query', () => {
    expect(performSearch('', items)).toEqual([]);
  });

  it('handles large datasets within reasonable time', () => {
    // Generate 1000+ items
    const largeItems: SearchableItem[] = Array.from({ length: 1500 }, (_, i) => ({
      id: `item-${i}`,
      type: 'asset' as const,
      title: `Asset ${i} - ${i % 2 === 0 ? 'Fidelity' : 'Chase'} Account`,
      subtitle: `Institution ${i}`,
      url: `/assets/${i}`,
      category: 'Assets',
    }));

    const start = performance.now();
    const results = performSearch('fidelity', largeItems);
    const elapsed = performance.now() - start;

    expect(results.length).toBeGreaterThan(0);
    expect(elapsed).toBeLessThan(100); // < 100ms requirement
  });
});

// ---------------------------------------------------------------------------
// debounce
// ---------------------------------------------------------------------------

describe('debounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('delays function execution', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 300);

    debounced();
    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(300);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('resets timer on subsequent calls', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 300);

    debounced();
    vi.advanceTimersByTime(200);
    debounced(); // reset
    vi.advanceTimersByTime(200);
    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('passes arguments to the debounced function', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 100);

    debounced('hello', 42);
    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledWith('hello', 42);
  });
});

// ---------------------------------------------------------------------------
// searchAnalytics
// ---------------------------------------------------------------------------

describe('searchAnalytics', () => {
  beforeEach(() => {
    clearSearchAnalytics();
  });

  it('starts with empty analytics', () => {
    const data = getSearchAnalytics();
    expect(data.entries).toEqual([]);
    expect(data.topQueries).toEqual([]);
  });

  it('tracks a search query', () => {
    trackSearchQuery('fidelity', 3);
    const data = getSearchAnalytics();
    expect(data.entries).toHaveLength(1);
    expect(data.entries[0].query).toBe('fidelity');
    expect(data.entries[0].resultCount).toBe(3);
    expect(data.entries[0].clickedResultId).toBeNull();
  });

  it('tracks a search result click', () => {
    trackSearchQuery('fidelity', 3);
    trackSearchClick('fidelity', 'a1');
    const data = getSearchAnalytics();
    expect(data.entries[0].clickedResultId).toBe('a1');
  });

  it('computes top queries', () => {
    trackSearchQuery('fidelity', 3);
    trackSearchQuery('chase', 2);
    trackSearchQuery('fidelity', 1);
    const data = getSearchAnalytics();
    expect(data.topQueries[0].query).toBe('fidelity');
    expect(data.topQueries[0].count).toBe(2);
  });

  it('caps entries at 100', () => {
    for (let i = 0; i < 110; i++) {
      trackSearchQuery(`query-${i}`, 1);
    }
    const data = getSearchAnalytics();
    expect(data.entries.length).toBeLessThanOrEqual(100);
  });

  it('clearSearchAnalytics removes all data', () => {
    trackSearchQuery('test', 1);
    clearSearchAnalytics();
    const data = getSearchAnalytics();
    expect(data.entries).toEqual([]);
  });
});
