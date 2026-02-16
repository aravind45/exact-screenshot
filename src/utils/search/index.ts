export { SearchIndex, buildSearchableItems } from './searchIndex';
export type { SearchableItem, SearchableItemType } from './searchIndex';

export { fuzzyScore, fuzzyCharMatch, scoreItem } from './fuzzySearch';
export type { FuzzyMatchResult } from './fuzzySearch';

export { rankSearchResults, search } from './searchRanking';
export type { RankedSearchResult } from './searchRanking';

export { performSearch, debounce } from './performSearch';

export {
  getSearchAnalytics,
  trackSearchQuery,
  trackSearchClick,
  clearSearchAnalytics,
} from './searchAnalytics';
export type { SearchAnalyticsEntry, SearchAnalyticsData } from './searchAnalytics';
