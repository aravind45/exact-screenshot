/**
 * SearchIndex - Indexes searchable items for fast lookup.
 *
 * Supports assets, communications, documents, and navigation pages.
 */

export type SearchableItemType = 'asset' | 'communication' | 'document' | 'page';

export interface SearchableItem {
  id: string;
  type: SearchableItemType;
  title: string;
  /** Secondary text used for matching (e.g. institution name, subject line) */
  subtitle?: string;
  /** Additional keywords to match against */
  keywords?: string[];
  url: string;
  /** Category label shown in results */
  category: string;
}

export class SearchIndex {
  private items: SearchableItem[] = [];

  /** Replace the entire index with new items */
  setItems(items: SearchableItem[]): void {
    this.items = items;
  }

  /** Add a single item to the index */
  addItem(item: SearchableItem): void {
    // Avoid duplicates by id+type
    const idx = this.items.findIndex(
      (i) => i.id === item.id && i.type === item.type,
    );
    if (idx >= 0) {
      this.items[idx] = item;
    } else {
      this.items.push(item);
    }
  }

  /** Remove an item by id and type */
  removeItem(id: string, type: SearchableItemType): void {
    this.items = this.items.filter(
      (i) => !(i.id === id && i.type === type),
    );
  }

  /** Get all indexed items */
  getItems(): ReadonlyArray<SearchableItem> {
    return this.items;
  }

  /** Get items filtered by type */
  getItemsByType(type: SearchableItemType): SearchableItem[] {
    return this.items.filter((i) => i.type === type);
  }

  /** Get total number of indexed items */
  get size(): number {
    return this.items.length;
  }

  /** Clear the entire index */
  clear(): void {
    this.items = [];
  }
}

/**
 * Build a default search index from app data.
 * This is a helper that creates SearchableItems from raw domain objects.
 */
export function buildSearchableItems(data: {
  assets?: Array<{ id: string; name: string; institution?: string; url?: string }>;
  communications?: Array<{ id: string; subject: string; institution?: string; url?: string }>;
  documents?: Array<{ id: string; name: string; type?: string; url?: string }>;
  pages?: Array<{ id: string; label: string; path: string; keywords?: string[] }>;
}): SearchableItem[] {
  const items: SearchableItem[] = [];

  if (data.assets) {
    for (const a of data.assets) {
      items.push({
        id: a.id,
        type: 'asset',
        title: a.name,
        subtitle: a.institution,
        keywords: [a.institution ?? ''].filter(Boolean),
        url: a.url ?? `/assets/${a.id}`,
        category: 'Assets',
      });
    }
  }

  if (data.communications) {
    for (const c of data.communications) {
      items.push({
        id: c.id,
        type: 'communication',
        title: c.subject,
        subtitle: c.institution,
        keywords: [c.institution ?? ''].filter(Boolean),
        url: c.url ?? `/communications/${c.id}`,
        category: 'Communications',
      });
    }
  }

  if (data.documents) {
    for (const d of data.documents) {
      items.push({
        id: d.id,
        type: 'document',
        title: d.name,
        subtitle: d.type,
        keywords: [d.type ?? ''].filter(Boolean),
        url: d.url ?? `/documents/${d.id}`,
        category: 'Documents',
      });
    }
  }

  if (data.pages) {
    for (const p of data.pages) {
      items.push({
        id: p.id,
        type: 'page',
        title: p.label,
        keywords: p.keywords,
        url: p.path,
        category: 'Settings',
      });
    }
  }

  return items;
}
