import { useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from '@/components/ui/command';
import {
  Plus,
  MessageSquare,
  FileUp,
  Landmark,
  FileText,
  Clock,
} from 'lucide-react';
import { useNavigation } from '@/contexts/NavigationContext';
import type { RecentItem, SearchResult  } from '@/types/navigation';

/** Simple fuzzy match: checks if all query chars appear in order in the target */
export function fuzzyMatch(query: string, target: string): boolean {
  const q = query.toLowerCase();
  const t = target.toLowerCase();
  let qi = 0;
  for (let ti = 0; ti < t.length && qi < q.length; ti++) {
    if (t[ti] === q[qi]) qi++;
  }
  return qi === q.length;
}

const ICON_MAP: Record<
  RecentItem['type'],
  React.ComponentType<{ className?: string }>
> = {
  asset: Landmark,
  communication: MessageSquare,
  document: FileText,
};

/** Build search results from recent items filtered by fuzzy query */
function useSearchResults(
  recentItems: RecentItem[],
  query: string,
): SearchResult[] {
  return useMemo(() => {
    if (!query.trim()) return [];
    return recentItems
      .filter(
        (item) =>
          fuzzyMatch(query, item.title) || fuzzyMatch(query, item.type),
      )
      .map((item) => ({
        id: item.id,
        type: item.type,
        title: item.title,
        subtitle: item.type.charAt(0).toUpperCase() + item.type.slice(1),
        icon: ICON_MAP[item.type] || FileText,
        url: item.url,
      }));
  }, [recentItems, query]);
}

export function QuickActionsMenu() {
  const {
    state,
    openQuickActions,
    closeQuickActions,
    setSearchQuery,
  } = useNavigation();
  const { isQuickActionsOpen, recentItems, searchQuery } = state;
  const navigate = useNavigate();
  const searchResults = useSearchResults(recentItems, searchQuery);

  // Quick actions definitions
  const quickActions = useMemo(
    () => [
      {
        id: 'add-asset',
        label: 'Add Asset',
        icon: Plus,
        path: '/add-asset',
      },
      {
        id: 'log-communication',
        label: 'Log Communication',
        icon: MessageSquare,
        path: '/communications/new',
      },
      {
        id: 'upload-document',
        label: 'Upload Document',
        icon: FileUp,
        path: '/upload',
      },
    ],
    [],
  );

  // Global Cmd/Ctrl + K keyboard shortcut
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isQuickActionsOpen) {
          closeQuickActions();
        } else {
          openQuickActions();
        }
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isQuickActionsOpen, closeQuickActions, openQuickActions]);

  const handleSelect = useCallback(
    (url: string) => {
      closeQuickActions();
      navigate(url);
    },
    [closeQuickActions, navigate],
  );

  const hasQuery = searchQuery.trim().length > 0;

  return (
    <CommandDialog
      open={isQuickActionsOpen}
      onOpenChange={(open) => {
        if (!open) closeQuickActions();
      }}
    >
      <CommandInput
        placeholder="Search everything..."
        value={searchQuery}
        onValueChange={setSearchQuery}
        data-testid="quick-actions-search"
      />
      <CommandList data-testid="quick-actions-list">
        <CommandEmpty data-testid="quick-actions-empty">
          No results found.
        </CommandEmpty>

        {/* Search results when query is active */}
        {hasQuery && searchResults.length > 0 && (
          <CommandGroup heading="Results" data-testid="search-results-group">
            {searchResults.map((result) => {
              const Icon = result.icon;
              return (
                <CommandItem
                  key={result.id}
                  value={result.title}
                  onSelect={() => handleSelect(result.url)}
                  data-testid={`search-result-${result.id}`}
                >
                  <Icon className="mr-2 h-4 w-4 shrink-0 opacity-70" />
                  <div className="flex flex-col">
                    <span>{result.title}</span>
                    {result.subtitle && (
                      <span className="text-xs text-muted-foreground">
                        {result.subtitle}
                      </span>
                    )}
                  </div>
                </CommandItem>
              );
            })}
          </CommandGroup>
        )}

        {/* Recent items (shown when no query) */}
        {!hasQuery && recentItems.length > 0 && (
          <>
            <CommandGroup heading="Recent" data-testid="recent-items-group">
              {recentItems.slice(0, 5).map((item) => {
                const Icon = ICON_MAP[item.type] || FileText;
                return (
                  <CommandItem
                    key={item.id}
                    value={item.title}
                    onSelect={() => handleSelect(item.url)}
                    data-testid={`recent-item-${item.id}`}
                  >
                    <Clock className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                    <Icon className="mr-2 h-4 w-4 shrink-0 opacity-70" />
                    <span>{item.title}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
            <CommandSeparator />
          </>
        )}

        {/* Quick actions (always shown) */}
        <CommandGroup heading="Quick Actions" data-testid="quick-actions-group">
          {quickActions.map((qa) => {
            const Icon = qa.icon;
            return (
              <CommandItem
                key={qa.id}
                value={qa.label}
                onSelect={() => handleSelect(qa.path)}
                data-testid={`quick-action-${qa.id}`}
              >
                <Icon className="mr-2 h-4 w-4 shrink-0" />
                <span>{qa.label}</span>
              </CommandItem>
            );
          })}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
