import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { NavigationContextValue, NavigationState } from '@/types/navigation';

// Polyfill ResizeObserver for jsdom (cmdk requires it)
beforeAll(() => {
  global.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

// Mock navigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock navigation context
const mockOpenQuickActions = vi.fn();
const mockCloseQuickActions = vi.fn();
const mockSetSearchQuery = vi.fn();

let mockState: NavigationState;

vi.mock('@/contexts/NavigationContext', () => ({
  useNavigation: () =>
    ({
      state: mockState,
      openQuickActions: mockOpenQuickActions,
      closeQuickActions: mockCloseQuickActions,
      setSearchQuery: mockSetSearchQuery,
    }) as Partial<NavigationContextValue>,
}));

// Mock the command UI components to avoid cmdk internal filtering issues in jsdom
// cmdk does its own filtering/rendering which conflicts with jsdom
vi.mock('@/components/ui/command', () => {
  const React = require('react');
  return {
    CommandDialog: ({ open, onOpenChange, children }: any) => {
      if (!open) return null;
      return (
        <div data-testid="command-dialog" role="dialog">
          <button
            data-testid="dialog-close"
            onClick={() => onOpenChange(false)}
            aria-label="Close"
          />
          {children}
        </div>
      );
    },
    CommandInput: ({ placeholder, value, onValueChange, ...props }: any) => (
      <input
        placeholder={placeholder}
        value={value}
        onChange={(e: any) => onValueChange(e.target.value)}
        {...props}
      />
    ),
    CommandList: ({ children, ...props }: any) => (
      <div {...props}>{children}</div>
    ),
    CommandEmpty: ({ children, ...props }: any) => (
      <div {...props}>{children}</div>
    ),
    CommandGroup: ({ heading, children, ...props }: any) => (
      <div {...props}>
        {heading && <div data-testid={`group-heading-${heading.toLowerCase().replace(/\s+/g, '-')}`}>{heading}</div>}
        {children}
      </div>
    ),
    CommandItem: ({ children, onSelect, value, ...props }: any) => (
      <div
        role="option"
        onClick={() => onSelect?.(value)}
        {...props}
      >
        {children}
      </div>
    ),
    CommandSeparator: () => <hr />,
  };
});

// Import component after mocks are defined
import { QuickActionsMenu } from './QuickActionsMenu';

const sampleRecentItems = [
  {
    id: 'asset-1',
    type: 'asset' as const,
    title: 'Fidelity 401k',
    url: '/asset/1',
    timestamp: new Date('2026-01-20'),
  },
  {
    id: 'comm-1',
    type: 'communication' as const,
    title: 'Chase Bank Call',
    url: '/communications/1',
    timestamp: new Date('2026-01-19'),
  },
  {
    id: 'doc-1',
    type: 'document' as const,
    title: 'Death Certificate',
    url: '/documents/1',
    timestamp: new Date('2026-01-18'),
  },
];

function createDefaultState(
  overrides: Partial<NavigationState> = {},
): NavigationState {
  return {
    currentPhase: 'discovery',
    currentPage: '/dashboard',
    expandedPhases: ['discovery'],
    recentItems: [],
    notifications: [],
    searchQuery: '',
    isQuickActionsOpen: false,
    isNotificationCenterOpen: false,
    unreadCount: 0,
    ...overrides,
  };
}

function renderQuickActions(stateOverrides: Partial<NavigationState> = {}) {
  mockState = createDefaultState(stateOverrides);
  return render(
    <MemoryRouter>
      <QuickActionsMenu />
    </MemoryRouter>,
  );
}

describe('QuickActionsMenu', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Modal behavior', () => {
    it('does not render dialog content when closed', () => {
      renderQuickActions({ isQuickActionsOpen: false });
      expect(screen.queryByTestId('command-dialog')).not.toBeInTheDocument();
    });

    it('renders dialog with search input when open', () => {
      renderQuickActions({ isQuickActionsOpen: true });
      expect(screen.getByTestId('command-dialog')).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText('Search everything...'),
      ).toBeInTheDocument();
    });

    it('calls closeQuickActions when dialog is dismissed', () => {
      renderQuickActions({ isQuickActionsOpen: true });
      fireEvent.click(screen.getByTestId('dialog-close'));
      expect(mockCloseQuickActions).toHaveBeenCalled();
    });
  });

  describe('Quick actions section', () => {
    it('renders all three quick actions', () => {
      renderQuickActions({ isQuickActionsOpen: true });
      expect(screen.getByText('Add Asset')).toBeInTheDocument();
      expect(screen.getByText('Log Communication')).toBeInTheDocument();
      expect(screen.getByText('Upload Document')).toBeInTheDocument();
    });

    it('navigates to /add-asset when Add Asset is selected', () => {
      renderQuickActions({ isQuickActionsOpen: true });
      fireEvent.click(screen.getByTestId('quick-action-add-asset'));
      expect(mockCloseQuickActions).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith('/add-asset');
    });

    it('navigates to /communications/new when Log Communication is selected', () => {
      renderQuickActions({ isQuickActionsOpen: true });
      fireEvent.click(
        screen.getByTestId('quick-action-log-communication'),
      );
      expect(mockNavigate).toHaveBeenCalledWith('/communications/new');
    });

    it('navigates to /upload when Upload Document is selected', () => {
      renderQuickActions({ isQuickActionsOpen: true });
      fireEvent.click(
        screen.getByTestId('quick-action-upload-document'),
      );
      expect(mockNavigate).toHaveBeenCalledWith('/upload');
    });
  });

  describe('Recent items section', () => {
    it('shows recent items when no search query', () => {
      renderQuickActions({
        isQuickActionsOpen: true,
        recentItems: sampleRecentItems,
      });
      expect(screen.getByText('Fidelity 401k')).toBeInTheDocument();
      expect(screen.getByText('Chase Bank Call')).toBeInTheDocument();
      expect(screen.getByText('Death Certificate')).toBeInTheDocument();
    });

    it('does not show recent items section when there are none', () => {
      renderQuickActions({
        isQuickActionsOpen: true,
        recentItems: [],
      });
      expect(
        screen.queryByTestId('recent-items-group'),
      ).not.toBeInTheDocument();
    });

    it('limits recent items to 5', () => {
      const manyItems = Array.from({ length: 8 }, (_, i) => ({
        id: `item-${i}`,
        type: 'asset' as const,
        title: `Asset ${i}`,
        url: `/asset/${i}`,
        timestamp: new Date(),
      }));
      renderQuickActions({
        isQuickActionsOpen: true,
        recentItems: manyItems,
      });
      const items = screen.getAllByTestId(/^recent-item-/);
      expect(items).toHaveLength(5);
    });

    it('navigates when a recent item is clicked', () => {
      renderQuickActions({
        isQuickActionsOpen: true,
        recentItems: sampleRecentItems,
      });
      fireEvent.click(screen.getByTestId('recent-item-asset-1'));
      expect(mockCloseQuickActions).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith('/asset/1');
    });
  });

  describe('Fuzzy search', () => {
    it('hides recent items when search query is active', () => {
      renderQuickActions({
        isQuickActionsOpen: true,
        recentItems: sampleRecentItems,
        searchQuery: 'fid',
      });
      expect(
        screen.queryByTestId('recent-items-group'),
      ).not.toBeInTheDocument();
    });

    it('shows matching search results for fuzzy query', () => {
      renderQuickActions({
        isQuickActionsOpen: true,
        recentItems: sampleRecentItems,
        searchQuery: 'fidel',
      });
      expect(
        screen.getByTestId('search-result-asset-1'),
      ).toBeInTheDocument();
    });

    it('filters out non-matching items', () => {
      renderQuickActions({
        isQuickActionsOpen: true,
        recentItems: sampleRecentItems,
        searchQuery: 'fidel',
      });
      expect(
        screen.queryByTestId('search-result-comm-1'),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByTestId('search-result-doc-1'),
      ).not.toBeInTheDocument();
    });

    it('matches by type as well as title', () => {
      renderQuickActions({
        isQuickActionsOpen: true,
        recentItems: sampleRecentItems,
        searchQuery: 'asset',
      });
      expect(
        screen.getByTestId('search-result-asset-1'),
      ).toBeInTheDocument();
    });

    it('shows search result subtitle with capitalized type', () => {
      renderQuickActions({
        isQuickActionsOpen: true,
        recentItems: sampleRecentItems,
        searchQuery: 'fidel',
      });
      expect(screen.getByText('Asset')).toBeInTheDocument();
    });
  });

  describe('Keyboard shortcut (Cmd/Ctrl + K)', () => {
    it('opens quick actions on Cmd+K when closed', () => {
      renderQuickActions({ isQuickActionsOpen: false });
      fireEvent.keyDown(document, { key: 'k', metaKey: true });
      expect(mockOpenQuickActions).toHaveBeenCalled();
    });

    it('closes quick actions on Cmd+K when open', () => {
      renderQuickActions({ isQuickActionsOpen: true });
      fireEvent.keyDown(document, { key: 'k', metaKey: true });
      expect(mockCloseQuickActions).toHaveBeenCalled();
    });

    it('opens quick actions on Ctrl+K when closed', () => {
      renderQuickActions({ isQuickActionsOpen: false });
      fireEvent.keyDown(document, { key: 'k', ctrlKey: true });
      expect(mockOpenQuickActions).toHaveBeenCalled();
    });

    it('does not trigger on plain K key press', () => {
      renderQuickActions({ isQuickActionsOpen: false });
      fireEvent.keyDown(document, { key: 'k' });
      expect(mockOpenQuickActions).not.toHaveBeenCalled();
    });
  });
});
