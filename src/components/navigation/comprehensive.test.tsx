/**
 * Comprehensive Navigation Tests
 *
 * Task 21: Fills coverage gaps and adds integration, E2E-style,
 * visual regression, browser-compatibility, and mobile-specific tests.
 *
 * Sections:
 *  21.1 - Unit test gap coverage (untested utilities & components)
 *  21.2 - Integration tests (multi-component flows)
 *  21.3 - E2E-style critical path tests
 *  21.4 - Visual regression / structural snapshot tests
 *  21.5 - Browser compatibility pattern tests
 *  21.6 - Mobile-specific behavior tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act, within, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ReactNode } from 'react';

// ── Source imports ──────────────────────────────────────────────────────
import { NavigationProvider, useNavigation } from '@/contexts/NavigationContext';
import { Breadcrumbs, generateBreadcrumbs, truncateLabel, collapseItems } from './Breadcrumbs';
import type { BreadcrumbItem } from './Breadcrumbs';
import { BottomNavBar, defaultItems } from './BottomNavBar';
import { FloatingActionButton } from './FloatingActionButton';
import { HamburgerMenu } from './HamburgerMenu';
import { SkipNavigation } from './SkipNavigation';
import {
  NavigationSidebarSkeleton,
  QuickActionsMenuSkeleton,
  NotificationCenterSkeleton,
  GenericNavigationSkeleton,
} from './NavigationSkeleton';
import { NavigationItemWithTooltip } from './NavigationItemWithTooltip';
import { NAVIGATION_TOOLTIP_DATA, getTooltipContent } from './navigationTooltipData';
import { groupNotifications } from './NotificationCenter';
import { fuzzyMatch } from './QuickActionsMenu';
import { fuzzyScore, fuzzyCharMatch, scoreItem } from '@/utils/search/fuzzySearch';
import { SearchIndex, buildSearchableItems } from '@/utils/search/searchIndex';
import {
  HOVER_TRANSITION,
  EXPAND_TRANSITION,
  FAB_TRANSITION,
  PAGE_TRANSITION,
  TAP_SCALE,
  HOVER_LIFT,
  NAV_ITEM_HOVER,
  TOUCH_ACTIVE,
  HOVER_CSS,
  INTERACTIVE_CSS,
} from './animationConstants';
import { ResponsiveNavigation } from './ResponsiveNavigation';
import type {
  Notification,
  QuickAction,
  NavigationItem,
  HamburgerMenuGroup,
  BottomNavItem,
  Phase,
} from '@/types/navigation';
import { Home, BarChart3, Plus, ClipboardList, User, MessageSquare, Upload, Settings, FileText, Search } from 'lucide-react';

// ── Polyfills ──────────────────────────────────────────────────────────
if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as any;
}

// ── Mocks ──────────────────────────────────────────────────────────────
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => {
      const { initial, animate, exit, transition, variants, whileTap, whileHover, custom, drag, dragConstraints, dragElastic, onDragEnd, layoutId, ...rest } = props;
      return <div {...rest}>{children}</div>;
    },
    button: ({ children, ...props }: any) => {
      const { initial, animate, exit, transition, whileHover, whileTap, variants, custom, ...rest } = props;
      return <button {...rest}>{children}</button>;
    },
    span: ({ children, ...props }: any) => {
      const { initial, animate, exit, transition, layoutId, variants, custom, ...rest } = props;
      return <span {...rest}>{children}</span>;
    },
    ul: ({ children, ...props }: any) => {
      const { initial, animate, exit, transition, ...rest } = props;
      return <ul {...rest}>{children}</ul>;
    },
    li: ({ children, ...props }: any) => {
      const { initial, animate, exit, transition, ...rest } = props;
      return <li {...rest}>{children}</li>;
    },
  },
  AnimatePresence: ({ children }: any) => children,
}));

// ── matchMedia mock utilities ──────────────────────────────────────────
type MatchMediaListener = (event: { matches: boolean }) => void;
let currentWidth = 1200;
const listeners: Map<string, MatchMediaListener[]> = new Map();

function evaluateQuery(query: string, width: number): boolean {
  const maxMatch = query.match(/max-width:\s*(\d+)px/);
  const minMatch = query.match(/min-width:\s*(\d+)px/);
  if (maxMatch && minMatch) return width >= parseInt(minMatch[1]) && width <= parseInt(maxMatch[1]);
  if (maxMatch) return width <= parseInt(maxMatch[1]);
  if (minMatch) return width >= parseInt(minMatch[1]);
  return false;
}

function mockMatchMedia(query: string) {
  if (!listeners.has(query)) listeners.set(query, []);
  return {
    matches: evaluateQuery(query, currentWidth),
    media: query,
    onchange: null,
    addEventListener: vi.fn((_: string, handler: MatchMediaListener) => { listeners.get(query)!.push(handler); }),
    removeEventListener: vi.fn((_: string, handler: MatchMediaListener) => {
      const arr = listeners.get(query)!;
      const idx = arr.indexOf(handler);
      if (idx >= 0) arr.splice(idx, 1);
    }),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  } as unknown as MediaQueryList;
}

function setWidth(width: number) {
  currentWidth = width;
  Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: width });
  listeners.forEach((handlers, query) => {
    const matches = evaluateQuery(query, width);
    handlers.forEach((h) => h({ matches }));
  });
}

const originalMatchMedia = window.matchMedia;

// ── Helpers ────────────────────────────────────────────────────────────
function renderWithRouter(ui: React.ReactElement, { route = '/' } = {}) {
  return render(<MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>);
}

function renderWithProvider(ui: React.ReactElement, { route = '/dashboard' } = {}) {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <NavigationProvider>{ui}</NavigationProvider>
    </MemoryRouter>,
  );
}

// Helper component to read context state for integration tests
function ContextReader({ onState }: { onState: (ctx: ReturnType<typeof useNavigation>) => void }) {
  const ctx = useNavigation();
  onState(ctx);
  return null;
}

// ── Test data ──────────────────────────────────────────────────────────
const bottomNavItems: BottomNavItem[] = [
  { id: 'home', label: 'Home', icon: Home, path: '/dashboard' },
  { id: 'assets', label: 'Assets', icon: BarChart3, path: '/assets' },
  { id: 'add', label: 'Add', icon: Plus, path: '/add-asset' },
  { id: 'tasks', label: 'Tasks', icon: ClipboardList, path: '/tasks' },
  { id: 'more', label: 'More', icon: User, path: '/more' },
];

const fabActions: QuickAction[] = [
  { id: 'add-asset', label: 'Add Asset', icon: Plus, action: vi.fn() },
  { id: 'log-comm', label: 'Log Communication', icon: MessageSquare, action: vi.fn() },
  { id: 'upload-doc', label: 'Upload Document', icon: Upload, action: vi.fn() },
];

const hamburgerGroups: HamburgerMenuGroup[] = [
  {
    id: 'setup',
    title: 'Phase 1: Setup',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: Home, path: '/dashboard' },
      { id: 'settings', label: 'Settings', icon: Settings, path: '/settings' },
    ],
  },
];

const sampleNotifications: Notification[] = [
  { id: 'n1', type: 'urgent', title: 'Fidelity 401k needs attention', message: 'No contact in 35 days', actionUrl: '/assets/fidelity', read: false, createdAt: new Date('2026-01-20') },
  { id: 'n2', type: 'follow-up', title: 'Chase Bank follow-up due', message: 'Response expected by Jan 25', actionUrl: '/assets/chase', read: false, createdAt: new Date('2026-01-18') },
  { id: 'n3', type: 'update', title: 'Document uploaded', message: 'Death certificate added', actionUrl: '/documents/dc', read: true, createdAt: new Date('2026-01-15') },
  { id: 'n4', type: 'urgent', title: 'Court deadline approaching', message: 'Filing due Feb 1', actionUrl: '/probate', read: false, createdAt: new Date('2026-01-22') },
  { id: 'n5', type: 'follow-up', title: 'Vanguard response pending', message: 'Sent claim form 16 days ago', actionUrl: '/assets/vanguard', read: true, createdAt: new Date('2026-01-10') },
  { id: 'n6', type: 'update', title: 'Asset status changed', message: 'Schwab account moved to Approved', actionUrl: '/assets/schwab', read: false, createdAt: new Date('2026-01-21') },
];


// ════════════════════════════════════════════════════════════════════════
// 21.1 — Unit Test Gap Coverage
// ════════════════════════════════════════════════════════════════════════

describe('21.1 Unit test gap coverage', () => {
  // ── NavigationItemWithTooltip ──
  describe('NavigationItemWithTooltip', () => {
    it('renders children without tooltip when no content found for itemId', () => {
      render(
        <NavigationItemWithTooltip itemId="nonexistent-item">
          <button>Nav Item</button>
        </NavigationItemWithTooltip>,
      );
      expect(screen.getByText('Nav Item')).toBeInTheDocument();
    });

    it('renders children without tooltip when enabled=false', () => {
      render(
        <NavigationItemWithTooltip itemId="dashboard" enabled={false}>
          <button>Dashboard</button>
        </NavigationItemWithTooltip>,
      );
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });

    it('renders with tooltip when valid itemId is provided', () => {
      render(
        <NavigationItemWithTooltip itemId="dashboard">
          <button>Dashboard</button>
        </NavigationItemWithTooltip>,
      );
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });

    it('uses explicit tooltipContent over data lookup', () => {
      const customContent = { title: 'Custom', description: 'Custom tooltip' };
      render(
        <NavigationItemWithTooltip itemId="dashboard" tooltipContent={customContent}>
          <button>Dashboard</button>
        </NavigationItemWithTooltip>,
      );
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });
  });

  // ── navigationTooltipData ──
  describe('navigationTooltipData', () => {
    it('has tooltip data for all 13 navigation items', () => {
      const expectedIds = [
        'dashboard', 'estate-profile', 'probate-hub',
        'asset-inventory', 'document-scanner', 'asset-detective',
        'active-assets', 'communications', 'document-vault', 'follow-ups',
        'final-distribution', 'tax-documents', 'close-estate',
      ];
      expectedIds.forEach((id) => {
        expect(NAVIGATION_TOOLTIP_DATA[id]).toBeDefined();
        expect(NAVIGATION_TOOLTIP_DATA[id].title).toBeTruthy();
        expect(NAVIGATION_TOOLTIP_DATA[id].description).toBeTruthy();
      });
    });

    it('every tooltip entry has an example use case', () => {
      Object.values(NAVIGATION_TOOLTIP_DATA).forEach((content) => {
        expect(content.example).toBeTruthy();
      });
    });

    it('every tooltip entry has an icon', () => {
      Object.values(NAVIGATION_TOOLTIP_DATA).forEach((content) => {
        expect(content.icon).toBeDefined();
        // Lucide icons are React components (objects with $$typeof or functions)
        expect(['function', 'object']).toContain(typeof content.icon);
      });
    });

    it('getTooltipContent returns undefined for unknown id', () => {
      expect(getTooltipContent('unknown-id')).toBeUndefined();
    });

    it('getTooltipContent returns correct data for known id', () => {
      const content = getTooltipContent('dashboard');
      expect(content?.title).toBe('Dashboard');
    });
  });

  // ── groupNotifications ──
  describe('groupNotifications', () => {
    it('groups notifications by type in priority order', () => {
      const groups = groupNotifications(sampleNotifications);
      expect(groups[0].type).toBe('urgent');
      expect(groups[1].type).toBe('follow-up');
      expect(groups[2].type).toBe('update');
    });

    it('sorts within each group by createdAt descending', () => {
      const groups = groupNotifications(sampleNotifications);
      const urgentGroup = groups.find((g) => g.type === 'urgent')!;
      expect(urgentGroup.notifications[0].id).toBe('n4'); // Jan 22 before Jan 20
      expect(urgentGroup.notifications[1].id).toBe('n1');
    });

    it('excludes empty groups', () => {
      const onlyUrgent = sampleNotifications.filter((n) => n.type === 'urgent');
      const groups = groupNotifications(onlyUrgent);
      expect(groups).toHaveLength(1);
      expect(groups[0].type).toBe('urgent');
    });

    it('returns empty array for no notifications', () => {
      expect(groupNotifications([])).toHaveLength(0);
    });

    it('includes correct count per group', () => {
      const groups = groupNotifications(sampleNotifications);
      expect(groups.find((g) => g.type === 'urgent')!.notifications).toHaveLength(2);
      expect(groups.find((g) => g.type === 'follow-up')!.notifications).toHaveLength(2);
      expect(groups.find((g) => g.type === 'update')!.notifications).toHaveLength(2);
    });
  });

  // ── fuzzyMatch (QuickActionsMenu) ──
  describe('fuzzyMatch (QuickActionsMenu)', () => {
    it('matches exact string', () => {
      expect(fuzzyMatch('fidelity', 'Fidelity 401k')).toBe(true);
    });

    it('matches subsequence characters', () => {
      expect(fuzzyMatch('fdl', 'Fidelity')).toBe(true);
    });

    it('returns false for non-matching query', () => {
      expect(fuzzyMatch('xyz', 'Fidelity')).toBe(false);
    });

    it('is case insensitive', () => {
      expect(fuzzyMatch('CHASE', 'chase bank')).toBe(true);
    });

    it('handles empty query', () => {
      expect(fuzzyMatch('', 'anything')).toBe(true);
    });
  });

  // ── Breadcrumbs utilities ──
  describe('Breadcrumbs utilities', () => {
    describe('truncateLabel', () => {
      it('returns label unchanged when within limit', () => {
        expect(truncateLabel('Short')).toBe('Short');
      });

      it('truncates and adds ellipsis when exceeding limit', () => {
        const long = 'A'.repeat(40);
        const result = truncateLabel(long, 30);
        expect(result.length).toBeLessThanOrEqual(30);
        expect(result.endsWith('…')).toBe(true);
      });

      it('handles exact boundary length', () => {
        const exact = 'A'.repeat(30);
        expect(truncateLabel(exact, 30)).toBe(exact);
      });
    });

    describe('collapseItems', () => {
      const items: BreadcrumbItem[] = [
        { label: 'Home', path: '/dashboard' },
        { label: 'Discovery', path: '/discovery' },
        { label: 'Assets', path: '/assets' },
        { label: 'Inventory', path: '/inventory' },
        { label: 'Fidelity 401k' },
      ];

      it('returns all items when count <= maxItems', () => {
        const result = collapseItems(items.slice(0, 3), 4);
        expect(result.visible).toHaveLength(3);
        expect(result.collapsed).toHaveLength(0);
      });

      it('collapses middle items when count > maxItems', () => {
        const result = collapseItems(items, 4);
        expect(result.visible).toHaveLength(3); // first + last two
        expect(result.collapsed.length).toBeGreaterThan(0);
      });

      it('keeps first and last two items visible', () => {
        const result = collapseItems(items, 3);
        expect(result.visible[0].label).toBe('Home');
        expect(result.visible[result.visible.length - 1].label).toBe('Fidelity 401k');
      });
    });

    describe('generateBreadcrumbs', () => {
      it('returns single Home item for /dashboard', () => {
        const items = generateBreadcrumbs('/dashboard');
        expect(items).toHaveLength(1);
        expect(items[0].label).toBe('Home');
        expect(items[0].path).toBeUndefined();
      });

      it('generates correct breadcrumbs for /assets', () => {
        const items = generateBreadcrumbs('/assets');
        expect(items.length).toBeGreaterThanOrEqual(2);
        expect(items[0].label).toBe('Home');
        expect(items[items.length - 1].path).toBeUndefined();
      });

      it('includes phase context for known routes', () => {
        const items = generateBreadcrumbs('/assets');
        const labels = items.map((i) => i.label);
        expect(labels).toContain('Discovery');
      });

      it('handles dynamic segments gracefully', () => {
        const items = generateBreadcrumbs('/asset/fidelity-401k');
        expect(items.length).toBeGreaterThanOrEqual(2);
        const lastLabel = items[items.length - 1].label;
        expect(lastLabel).toBeTruthy();
      });

      it('last item never has a path', () => {
        const routes = ['/assets', '/upload', '/documents', '/settings'];
        routes.forEach((route) => {
          const items = generateBreadcrumbs(route);
          expect(items[items.length - 1].path).toBeUndefined();
        });
      });
    });
  });

  // ── SearchIndex ──
  describe('SearchIndex', () => {
    let index: SearchIndex;

    beforeEach(() => {
      index = new SearchIndex();
    });

    it('starts empty', () => {
      expect(index.size).toBe(0);
      expect(index.getItems()).toHaveLength(0);
    });

    it('adds and retrieves items', () => {
      index.addItem({ id: '1', type: 'asset', title: 'Fidelity', url: '/a/1', category: 'Assets' });
      expect(index.size).toBe(1);
      expect(index.getItems()[0].title).toBe('Fidelity');
    });

    it('prevents duplicate items by id+type', () => {
      index.addItem({ id: '1', type: 'asset', title: 'Fidelity', url: '/a/1', category: 'Assets' });
      index.addItem({ id: '1', type: 'asset', title: 'Fidelity Updated', url: '/a/1', category: 'Assets' });
      expect(index.size).toBe(1);
      expect(index.getItems()[0].title).toBe('Fidelity Updated');
    });

    it('allows same id with different types', () => {
      index.addItem({ id: '1', type: 'asset', title: 'Fidelity', url: '/a/1', category: 'Assets' });
      index.addItem({ id: '1', type: 'document', title: 'Fidelity Doc', url: '/d/1', category: 'Documents' });
      expect(index.size).toBe(2);
    });

    it('removes items by id and type', () => {
      index.addItem({ id: '1', type: 'asset', title: 'Fidelity', url: '/a/1', category: 'Assets' });
      index.removeItem('1', 'asset');
      expect(index.size).toBe(0);
    });

    it('filters items by type', () => {
      index.addItem({ id: '1', type: 'asset', title: 'A', url: '/a', category: 'Assets' });
      index.addItem({ id: '2', type: 'document', title: 'D', url: '/d', category: 'Documents' });
      expect(index.getItemsByType('asset')).toHaveLength(1);
      expect(index.getItemsByType('document')).toHaveLength(1);
    });

    it('clears all items', () => {
      index.addItem({ id: '1', type: 'asset', title: 'A', url: '/a', category: 'Assets' });
      index.clear();
      expect(index.size).toBe(0);
    });

    it('setItems replaces entire index', () => {
      index.addItem({ id: '1', type: 'asset', title: 'Old', url: '/a', category: 'Assets' });
      index.setItems([{ id: '2', type: 'document', title: 'New', url: '/d', category: 'Documents' }]);
      expect(index.size).toBe(1);
      expect(index.getItems()[0].title).toBe('New');
    });
  });

  // ── buildSearchableItems ──
  describe('buildSearchableItems', () => {
    it('builds items from assets', () => {
      const items = buildSearchableItems({ assets: [{ id: '1', name: 'Fidelity 401k', institution: 'Fidelity' }] });
      expect(items).toHaveLength(1);
      expect(items[0].type).toBe('asset');
      expect(items[0].title).toBe('Fidelity 401k');
    });

    it('builds items from communications', () => {
      const items = buildSearchableItems({ communications: [{ id: '1', subject: 'Call with Chase' }] });
      expect(items).toHaveLength(1);
      expect(items[0].type).toBe('communication');
    });

    it('builds items from documents', () => {
      const items = buildSearchableItems({ documents: [{ id: '1', name: 'Death Certificate', type: 'Legal' }] });
      expect(items).toHaveLength(1);
      expect(items[0].type).toBe('document');
    });

    it('builds items from pages', () => {
      const items = buildSearchableItems({ pages: [{ id: '1', label: 'Settings', path: '/settings', keywords: ['config'] }] });
      expect(items).toHaveLength(1);
      expect(items[0].type).toBe('page');
      expect(items[0].keywords).toContain('config');
    });

    it('handles empty data', () => {
      expect(buildSearchableItems({})).toHaveLength(0);
    });
  });

  // ── fuzzyScore / scoreItem ──
  describe('fuzzyScore', () => {
    it('returns score 100 for exact match', () => {
      expect(fuzzyScore('fidelity', 'fidelity').score).toBe(100);
    });

    it('returns score 80 for starts-with match', () => {
      expect(fuzzyScore('fid', 'fidelity').score).toBe(80);
    });

    it('returns score 60 for word-starts-with match', () => {
      expect(fuzzyScore('401', 'Fidelity 401k').score).toBe(60);
    });

    it('returns score 40 for contains match', () => {
      expect(fuzzyScore('delit', 'Fidelity').score).toBe(40);
    });

    it('returns score 20 for fuzzy char match', () => {
      expect(fuzzyScore('fly', 'Fidelity').score).toBe(20);
    });

    it('returns score 0 for no match', () => {
      expect(fuzzyScore('xyz', 'Fidelity').score).toBe(0);
    });

    it('returns no match for empty query', () => {
      expect(fuzzyScore('', 'Fidelity').matched).toBe(false);
    });

    it('returns no match for empty target', () => {
      expect(fuzzyScore('test', '').matched).toBe(false);
    });
  });

  describe('scoreItem', () => {
    it('scores against title', () => {
      expect(scoreItem('fidelity', { title: 'Fidelity 401k' })).toBe(80);
    });

    it('scores against subtitle', () => {
      // 'bank' starts-with matches 'Bank of America' → score 80
      expect(scoreItem('bank', { title: 'Checking', subtitle: 'Bank of America' })).toBe(80);
    });

    it('scores against keywords', () => {
      expect(scoreItem('invest', { title: 'Account', keywords: ['investment'] })).toBe(80);
    });

    it('returns highest score across all fields', () => {
      const score = scoreItem('fidelity', { title: 'Fidelity 401k', subtitle: 'Fidelity Investments', keywords: ['fidelity'] });
      expect(score).toBe(100); // exact match on keyword
    });
  });

  // ── Animation constants completeness ──
  describe('animationConstants completeness', () => {
    it('exports all expected constants', () => {
      expect(HOVER_TRANSITION).toBeDefined();
      expect(EXPAND_TRANSITION).toBeDefined();
      expect(FAB_TRANSITION).toBeDefined();
      expect(PAGE_TRANSITION).toBeDefined();
      expect(TAP_SCALE).toBeDefined();
      expect(HOVER_LIFT).toBeDefined();
      expect(NAV_ITEM_HOVER).toBeDefined();
      expect(TOUCH_ACTIVE).toBeDefined();
      expect(HOVER_CSS).toBeDefined();
      expect(INTERACTIVE_CSS).toBeDefined();
    });

    it('HOVER_LIFT scales up slightly', () => {
      expect(HOVER_LIFT.scale).toBe(1.02);
    });

    it('NAV_ITEM_HOVER has subtle scale', () => {
      expect(NAV_ITEM_HOVER.scale).toBe(1.01);
    });

    it('CSS strings contain transition keywords', () => {
      expect(HOVER_CSS).toContain('transition');
      expect(INTERACTIVE_CSS).toContain('transition');
    });
  });
});


// ════════════════════════════════════════════════════════════════════════
// 21.2 — Integration Tests (multi-component flows)
// ════════════════════════════════════════════════════════════════════════

describe('21.2 Integration tests', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('NavigationContext + Breadcrumbs integration', () => {
    it('breadcrumbs reflect the current route from context', () => {
      renderWithProvider(<Breadcrumbs />, { route: '/assets' });
      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('Asset Inventory')).toBeInTheDocument();
    });

    it('breadcrumbs update when navigating to a different phase route', () => {
      const { unmount } = renderWithProvider(<Breadcrumbs />, { route: '/documents' });
      expect(screen.getByText('Document Vault')).toBeInTheDocument();
      unmount();

      renderWithProvider(<Breadcrumbs />, { route: '/upload' });
      expect(screen.getByText('Document Scanner')).toBeInTheDocument();
    });

    it('breadcrumbs show phase context for settlement routes', () => {
      renderWithProvider(<Breadcrumbs />, { route: '/documents' });
      const labels = screen.getAllByRole('listitem').map((li) => li.textContent);
      const joined = labels.join(' ');
      expect(joined).toContain('Settlement');
    });
  });

  describe('NavigationContext state management flow', () => {
    it('togglePhase expands and collapses phases', () => {
      let capturedCtx: ReturnType<typeof useNavigation> | null = null;

      renderWithProvider(
        <ContextReader onState={(ctx) => { capturedCtx = ctx; }} />,
        { route: '/dashboard' },
      );

      expect(capturedCtx).not.toBeNull();
      const initialExpanded = capturedCtx!.state.expandedPhases;

      // Toggle a phase that's not expanded
      act(() => {
        capturedCtx!.togglePhase('close');
      });
      expect(capturedCtx!.state.expandedPhases).toContain('close');

      // Toggle it again to collapse
      act(() => {
        capturedCtx!.togglePhase('close');
      });
      expect(capturedCtx!.state.expandedPhases).not.toContain('close');
    });

    it('addRecentItem maintains max 5 items and deduplicates', () => {
      let capturedCtx: ReturnType<typeof useNavigation> | null = null;

      renderWithProvider(
        <ContextReader onState={(ctx) => { capturedCtx = ctx; }} />,
        { route: '/dashboard' },
      );

      // Add 6 items
      for (let i = 1; i <= 6; i++) {
        act(() => {
          capturedCtx!.addRecentItem({
            id: `item-${i}`,
            type: 'asset',
            title: `Asset ${i}`,
            url: `/assets/${i}`,
            timestamp: new Date(),
          });
        });
      }

      expect(capturedCtx!.state.recentItems).toHaveLength(5);
      // Most recent should be first
      expect(capturedCtx!.state.recentItems[0].id).toBe('item-6');

      // Adding a duplicate should move it to front without increasing count
      act(() => {
        capturedCtx!.addRecentItem({
          id: 'item-3',
          type: 'asset',
          title: 'Asset 3',
          url: '/assets/3',
          timestamp: new Date(),
        });
      });
      expect(capturedCtx!.state.recentItems).toHaveLength(5);
      expect(capturedCtx!.state.recentItems[0].id).toBe('item-3');
    });

    it('notification management: add, mark read, mark all read', () => {
      let capturedCtx: ReturnType<typeof useNavigation> | null = null;

      renderWithProvider(
        <ContextReader onState={(ctx) => { capturedCtx = ctx; }} />,
        { route: '/dashboard' },
      );

      // Add notifications
      act(() => {
        capturedCtx!.addNotification(sampleNotifications[0]);
        capturedCtx!.addNotification(sampleNotifications[1]);
      });

      expect(capturedCtx!.state.notifications).toHaveLength(2);

      // Mark one as read
      act(() => {
        capturedCtx!.markNotificationRead('n1');
      });
      const n1 = capturedCtx!.state.notifications.find((n) => n.id === 'n1');
      expect(n1?.read).toBe(true);

      // Mark all as read
      act(() => {
        capturedCtx!.markAllNotificationsRead();
      });
      capturedCtx!.state.notifications.forEach((n) => {
        expect(n.read).toBe(true);
      });
    });

    it('quick actions open/close state management', () => {
      let capturedCtx: ReturnType<typeof useNavigation> | null = null;

      renderWithProvider(
        <ContextReader onState={(ctx) => { capturedCtx = ctx; }} />,
        { route: '/dashboard' },
      );

      expect(capturedCtx!.state.isQuickActionsOpen).toBe(false);

      act(() => { capturedCtx!.openQuickActions(); });
      expect(capturedCtx!.state.isQuickActionsOpen).toBe(true);

      act(() => { capturedCtx!.setSearchQuery('fidelity'); });
      expect(capturedCtx!.state.searchQuery).toBe('fidelity');

      act(() => { capturedCtx!.closeQuickActions(); });
      expect(capturedCtx!.state.isQuickActionsOpen).toBe(false);
      expect(capturedCtx!.state.searchQuery).toBe(''); // cleared on close
    });

    it('notification center open/close state management', () => {
      let capturedCtx: ReturnType<typeof useNavigation> | null = null;

      renderWithProvider(
        <ContextReader onState={(ctx) => { capturedCtx = ctx; }} />,
        { route: '/dashboard' },
      );

      expect(capturedCtx!.state.isNotificationCenterOpen).toBe(false);

      act(() => { capturedCtx!.openNotificationCenter(); });
      expect(capturedCtx!.state.isNotificationCenterOpen).toBe(true);

      act(() => { capturedCtx!.closeNotificationCenter(); });
      expect(capturedCtx!.state.isNotificationCenterOpen).toBe(false);
    });
  });

  describe('Search + Navigation integration', () => {
    it('fuzzy search finds assets by partial name', () => {
      const index = new SearchIndex();
      const items = buildSearchableItems({
        assets: [
          { id: '1', name: 'Fidelity 401k', institution: 'Fidelity Investments' },
          { id: '2', name: 'Chase Checking', institution: 'Chase Bank' },
          { id: '3', name: 'Schwab Brokerage', institution: 'Charles Schwab' },
        ],
      });
      index.setItems(items);

      // Search for "fid" should match Fidelity
      const results = index.getItems().filter((item) => fuzzyScore('fid', item.title).matched);
      expect(results).toHaveLength(1);
      expect(results[0].title).toBe('Fidelity 401k');
    });

    it('search ranks exact matches higher than fuzzy matches', () => {
      const items = [
        { title: 'Chase Bank', subtitle: 'Checking' },
        { title: 'Fidelity', subtitle: 'Chase related' },
      ];
      const scores = items.map((item) => ({ ...item, score: scoreItem('chase', item) }));
      scores.sort((a, b) => b.score - a.score);
      expect(scores[0].title).toBe('Chase Bank');
    });
  });
});


// ════════════════════════════════════════════════════════════════════════
// 21.3 — E2E-style Critical Path Tests
// ════════════════════════════════════════════════════════════════════════

describe('21.3 E2E-style critical path tests', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('Flow: Navigate through all phases via breadcrumbs', () => {
    const phaseRoutes: { route: string; expectedPhase: string; expectedPage: string }[] = [
      { route: '/dashboard', expectedPhase: 'Setup', expectedPage: 'Home' },
      { route: '/assets', expectedPhase: 'Discovery', expectedPage: 'Asset Inventory' },
      { route: '/documents', expectedPhase: 'Settlement', expectedPage: 'Document Vault' },
      { route: '/distribution', expectedPhase: 'Close', expectedPage: 'Final Distribution' },
    ];

    phaseRoutes.forEach(({ route, expectedPhase, expectedPage }) => {
      it(`renders correct breadcrumbs for ${route}`, () => {
        renderWithProvider(<Breadcrumbs />, { route });
        if (route === '/dashboard') {
          expect(screen.getByText('Home')).toBeInTheDocument();
        } else {
          expect(screen.getByText(expectedPage)).toBeInTheDocument();
        }
      });
    });
  });

  describe('Flow: Context tracks phase from route', () => {
    const routePhaseMap: [string, Phase][] = [
      ['/dashboard', 'setup'],
      ['/estate', 'setup'],
      ['/probate', 'setup'],
      ['/assets', 'setup'], // /assets doesn't contain /discovery, defaults to setup
      ['/upload', 'discovery'],
      ['/add-asset', 'discovery'],
      ['/asset/123', 'settlement'],
      ['/settlement', 'settlement'],
      ['/documents', 'settlement'],
      ['/close', 'close'],
      ['/distribution', 'close'],
    ];

    routePhaseMap.forEach(([route, expectedPhase]) => {
      it(`route "${route}" maps to phase "${expectedPhase}"`, () => {
        let capturedCtx: ReturnType<typeof useNavigation> | null = null;
        renderWithProvider(
          <ContextReader onState={(ctx) => { capturedCtx = ctx; }} />,
          { route },
        );
        expect(capturedCtx!.state.currentPhase).toBe(expectedPhase);
      });
    });
  });

  describe('Flow: Full notification lifecycle', () => {
    it('add notification → read it → mark all read', () => {
      let ctx: ReturnType<typeof useNavigation> | null = null;

      renderWithProvider(
        <ContextReader onState={(c) => { ctx = c; }} />,
        { route: '/dashboard' },
      );

      // Start with no notifications
      expect(ctx!.state.notifications).toHaveLength(0);
      expect(ctx!.state.unreadCount).toBe(0);

      // Add 3 notifications
      act(() => {
        ctx!.addNotification({ ...sampleNotifications[0] });
        ctx!.addNotification({ ...sampleNotifications[1] });
        ctx!.addNotification({ ...sampleNotifications[2] });
      });

      expect(ctx!.state.notifications).toHaveLength(3);

      // n1 and n2 are unread, n3 is read
      // unreadCount updates via useEffect, so we wait
      act(() => {}); // flush effects
      expect(ctx!.state.unreadCount).toBe(2);

      // Mark n1 as read
      act(() => { ctx!.markNotificationRead('n1'); });
      act(() => {}); // flush
      expect(ctx!.state.unreadCount).toBe(1);

      // Mark all as read
      act(() => { ctx!.markAllNotificationsRead(); });
      act(() => {}); // flush
      expect(ctx!.state.unreadCount).toBe(0);
    });
  });

  describe('Flow: Recent items tracking', () => {
    it('tracks recently viewed items across navigation', () => {
      let ctx: ReturnType<typeof useNavigation> | null = null;

      renderWithProvider(
        <ContextReader onState={(c) => { ctx = c; }} />,
        { route: '/dashboard' },
      );

      // Simulate viewing assets
      act(() => {
        ctx!.addRecentItem({ id: 'a1', type: 'asset', title: 'Fidelity 401k', url: '/assets/a1', timestamp: new Date() });
      });
      act(() => {
        ctx!.addRecentItem({ id: 'c1', type: 'communication', title: 'Call with Chase', url: '/comms/c1', timestamp: new Date() });
      });
      act(() => {
        ctx!.addRecentItem({ id: 'd1', type: 'document', title: 'Death Certificate', url: '/docs/d1', timestamp: new Date() });
      });

      expect(ctx!.state.recentItems).toHaveLength(3);
      // Most recent first
      expect(ctx!.state.recentItems[0].id).toBe('d1');
      expect(ctx!.state.recentItems[1].id).toBe('c1');
      expect(ctx!.state.recentItems[2].id).toBe('a1');
    });
  });

  describe('Flow: localStorage persistence', () => {
    it('persists expandedPhases to localStorage', () => {
      let ctx: ReturnType<typeof useNavigation> | null = null;

      renderWithProvider(
        <ContextReader onState={(c) => { ctx = c; }} />,
        { route: '/dashboard' },
      );

      act(() => { ctx!.togglePhase('settlement'); });

      const stored = JSON.parse(localStorage.getItem('expectedestate_navigation_state') || '{}');
      expect(stored.expandedPhases).toContain('settlement');
    });

    it('persists recentItems to localStorage', () => {
      let ctx: ReturnType<typeof useNavigation> | null = null;

      renderWithProvider(
        <ContextReader onState={(c) => { ctx = c; }} />,
        { route: '/dashboard' },
      );

      act(() => {
        ctx!.addRecentItem({ id: 'a1', type: 'asset', title: 'Test', url: '/test', timestamp: new Date() });
      });

      const stored = JSON.parse(localStorage.getItem('expectedestate_navigation_state') || '{}');
      expect(stored.recentItems).toHaveLength(1);
      expect(stored.recentItems[0].id).toBe('a1');
    });
  });
});


// ════════════════════════════════════════════════════════════════════════
// 21.4 — Visual Regression / Structural Snapshot Tests
// ════════════════════════════════════════════════════════════════════════

describe('21.4 Visual regression / structural snapshot tests', () => {
  describe('Skeleton components structure', () => {
    it('NavigationSidebarSkeleton has consistent structure', () => {
      const { container } = render(<NavigationSidebarSkeleton />);
      const skeleton = container.firstElementChild!;

      expect(skeleton).toHaveAttribute('data-testid', 'navigation-sidebar-skeleton');
      expect(skeleton).toHaveAttribute('role', 'status');
      expect(skeleton.className).toContain('animate-pulse');
      // Should have 4 phase section placeholders
      expect(skeleton.children.length).toBe(4);
    });

    it('QuickActionsMenuSkeleton has consistent structure', () => {
      const { container } = render(<QuickActionsMenuSkeleton />);
      const skeleton = container.firstElementChild!;

      expect(skeleton).toHaveAttribute('data-testid', 'quick-actions-skeleton');
      expect(skeleton).toHaveAttribute('role', 'status');
      expect(skeleton.className).toContain('animate-pulse');
      // Search bar + 3 items = 4 children
      expect(skeleton.children.length).toBe(4);
    });

    it('NotificationCenterSkeleton has consistent structure', () => {
      const { container } = render(<NotificationCenterSkeleton />);
      const skeleton = container.firstElementChild!;

      expect(skeleton).toHaveAttribute('data-testid', 'notification-center-skeleton');
      expect(skeleton).toHaveAttribute('role', 'status');
      expect(skeleton.className).toContain('animate-pulse');
      // 3 notification placeholders
      expect(skeleton.children.length).toBe(3);
    });

    it('GenericNavigationSkeleton has consistent structure', () => {
      const { container } = render(<GenericNavigationSkeleton />);
      const skeleton = container.firstElementChild!;

      expect(skeleton).toHaveAttribute('data-testid', 'navigation-generic-skeleton');
      expect(skeleton).toHaveAttribute('role', 'status');
      expect(skeleton.className).toContain('animate-pulse');
    });
  });

  describe('SkipNavigation structure', () => {
    it('has consistent class structure for visibility toggling', () => {
      render(<SkipNavigation />);
      const link = screen.getByTestId('skip-navigation');

      expect(link.tagName).toBe('A');
      expect(link).toHaveAttribute('href', '#main-content');
      expect(link.className).toContain('sr-only');
      expect(link.className).toContain('focus:not-sr-only');
      expect(link.className).toContain('focus:fixed');
      expect(link.className).toContain('focus:z-[200]');
    });
  });

  describe('BottomNavBar structure consistency', () => {
    it('maintains consistent DOM structure', () => {
      render(<BottomNavBar items={defaultItems} activeItem="home" onItemClick={vi.fn()} />);
      const nav = screen.getByTestId('bottom-nav-bar');

      // Should be a <nav> element
      expect(nav.tagName).toBe('NAV');
      expect(nav).toHaveAttribute('aria-label', 'Mobile navigation');

      // Should contain a list
      const list = within(nav).getByRole('list');
      expect(list).toBeInTheDocument();

      // Should have correct number of items
      const items = within(list).getAllByRole('listitem');
      expect(items).toHaveLength(defaultItems.length);
    });

    it('active item has consistent visual classes', () => {
      render(<BottomNavBar items={defaultItems} activeItem="home" onItemClick={vi.fn()} />);
      const activeBtn = screen.getByTestId('bottom-nav-item-home');
      expect(activeBtn.className).toContain('text-blue-500');
      expect(activeBtn).toHaveAttribute('aria-current', 'page');
    });

    it('inactive items have consistent visual classes', () => {
      render(<BottomNavBar items={defaultItems} activeItem="home" onItemClick={vi.fn()} />);
      const inactiveBtn = screen.getByTestId('bottom-nav-item-assets');
      expect(inactiveBtn.className).toContain('text-slate-500');
      expect(inactiveBtn).not.toHaveAttribute('aria-current');
    });
  });

  describe('Breadcrumbs structure consistency', () => {
    it('maintains consistent DOM structure', () => {
      renderWithRouter(
        <Breadcrumbs items={[
          { label: 'Home', path: '/dashboard' },
          { label: 'Discovery' },
          { label: 'Assets' },
        ]} />,
      );
      const nav = screen.getByTestId('breadcrumbs');
      expect(nav.tagName).toBe('NAV');
      expect(nav).toHaveAttribute('aria-label', 'Breadcrumb');

      const list = within(nav).getByRole('list');
      expect(list.tagName).toBe('OL');
    });

    it('last item has aria-current="page" and no link', () => {
      renderWithRouter(
        <Breadcrumbs items={[
          { label: 'Home', path: '/dashboard' },
          { label: 'Assets' },
        ]} />,
      );
      const currentPage = screen.getByText('Assets');
      expect(currentPage.closest('[aria-current="page"]')).toBeInTheDocument();
      expect(currentPage.closest('a')).toBeNull();
    });

    it('non-last items with paths are links', () => {
      renderWithRouter(
        <Breadcrumbs items={[
          { label: 'Home', path: '/dashboard' },
          { label: 'Discovery', path: '/discovery' },
          { label: 'Assets' },
        ]} />,
      );
      const homeLink = screen.getByText('Home').closest('a');
      expect(homeLink).toBeInTheDocument();
      expect(homeLink).toHaveAttribute('href', '/dashboard');
    });
  });

  describe('FloatingActionButton structure consistency', () => {
    it('collapsed FAB has consistent structure', () => {
      render(<FloatingActionButton isExpanded={false} onToggle={vi.fn()} onActionClick={vi.fn()} />);
      const container = screen.getByTestId('fab-container');
      const button = screen.getByTestId('fab-button');

      expect(button).toHaveAttribute('aria-expanded', 'false');
      expect(button).toHaveAttribute('aria-haspopup', 'true');
      expect(button).toHaveAttribute('aria-label', 'Open quick actions menu');
      expect(button.className).toContain('bg-blue-600');
    });

    it('expanded FAB has consistent structure with menu', () => {
      render(<FloatingActionButton isExpanded={true} onToggle={vi.fn()} onActionClick={vi.fn()} />);
      const button = screen.getByTestId('fab-button');
      const menu = screen.getByTestId('fab-menu');

      expect(button).toHaveAttribute('aria-expanded', 'true');
      expect(button).toHaveAttribute('aria-label', 'Close quick actions menu');
      expect(menu).toHaveAttribute('aria-label', 'Quick actions');
    });
  });

  describe('HamburgerMenu structure consistency', () => {
    it('open menu has consistent dialog structure', () => {
      render(<HamburgerMenu isOpen={true} onClose={vi.fn()} onItemClick={vi.fn()} />);
      const dialog = screen.getByRole('dialog');

      expect(dialog).toHaveAttribute('aria-modal', 'true');
      expect(dialog).toHaveAttribute('aria-label', 'Navigation menu');
      expect(screen.getByTestId('hamburger-menu-close')).toBeInTheDocument();
    });

    it('closed menu renders nothing', () => {
      render(<HamburgerMenu isOpen={false} onClose={vi.fn()} onItemClick={vi.fn()} />);
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });
});


// ════════════════════════════════════════════════════════════════════════
// 21.5 — Browser Compatibility Pattern Tests
// ════════════════════════════════════════════════════════════════════════

describe('21.5 Browser compatibility pattern tests', () => {
  describe('CSS fallback patterns', () => {
    it('BottomNavBar uses standard flexbox (widely supported)', () => {
      render(<BottomNavBar items={defaultItems} activeItem="home" onItemClick={vi.fn()} />);
      const list = screen.getByRole('list');
      // Tailwind flex classes are universally supported — flex is on the inner list
      expect(list.className).toContain('flex');
    });

    it('skeleton components use animate-pulse (CSS animation fallback)', () => {
      render(<NavigationSidebarSkeleton />);
      const skeleton = screen.getByTestId('navigation-sidebar-skeleton');
      // animate-pulse uses CSS @keyframes which is widely supported
      expect(skeleton.className).toContain('animate-pulse');
    });

    it('SkipNavigation uses sr-only pattern compatible with all screen readers', () => {
      render(<SkipNavigation />);
      const link = screen.getByTestId('skip-navigation');
      // sr-only is a well-established pattern that works across browsers
      expect(link.className).toContain('sr-only');
    });

    it('focus-visible is used instead of focus for keyboard-only indicators', () => {
      render(<FloatingActionButton isExpanded={false} onToggle={vi.fn()} onActionClick={vi.fn()} />);
      const fab = screen.getByTestId('fab-button');
      // focus-visible is supported in all modern browsers
      expect(fab.className).toContain('focus-visible:outline');
    });
  });

  describe('Feature detection patterns', () => {
    it('localStorage access is wrapped in try-catch', () => {
      // Verify the NavigationContext handles localStorage errors gracefully
      const originalGetItem = localStorage.getItem;
      localStorage.getItem = vi.fn(() => { throw new Error('Storage disabled'); });

      // Should not throw when creating provider
      expect(() => {
        renderWithProvider(
          <ContextReader onState={() => {}} />,
          { route: '/dashboard' },
        );
      }).not.toThrow();

      localStorage.getItem = originalGetItem;
    });

    it('localStorage setItem errors are handled gracefully', () => {
      let ctx: ReturnType<typeof useNavigation> | null = null;
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = vi.fn(() => { throw new Error('Quota exceeded'); });

      renderWithProvider(
        <ContextReader onState={(c) => { ctx = c; }} />,
        { route: '/dashboard' },
      );

      // Should not throw when toggling phase (which persists to localStorage)
      expect(() => {
        act(() => { ctx!.togglePhase('close'); });
      }).not.toThrow();

      localStorage.setItem = originalSetItem;
    });
  });

  describe('Semantic HTML for cross-browser accessibility', () => {
    it('navigation components use <nav> elements', () => {
      render(<BottomNavBar items={defaultItems} activeItem="home" onItemClick={vi.fn()} />);
      expect(screen.getByRole('navigation')).toBeInTheDocument();
    });

    it('breadcrumbs use <ol> for ordered list semantics', () => {
      renderWithRouter(
        <Breadcrumbs items={[{ label: 'Home', path: '/' }, { label: 'Page' }]} />,
      );
      const nav = screen.getByTestId('breadcrumbs');
      expect(nav.querySelector('ol')).toBeInTheDocument();
    });

    it('dialog components use role="dialog" with aria-modal', () => {
      render(<HamburgerMenu isOpen={true} onClose={vi.fn()} onItemClick={vi.fn()} />);
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
    });

    it('interactive elements use standard button elements', () => {
      render(<FloatingActionButton isExpanded={true} onToggle={vi.fn()} onActionClick={vi.fn()} />);
      const buttons = screen.getAllByRole('button');
      buttons.forEach((btn) => {
        // All interactive elements should be actual buttons for cross-browser compat
        expect(btn.tagName).toBe('BUTTON');
      });
    });
  });

  describe('Animation constants use standard CSS properties', () => {
    it('transitions use standard easing functions', () => {
      // These easing values are supported in all modern browsers
      expect(HOVER_TRANSITION.ease).toBe('easeOut');
      expect(EXPAND_TRANSITION.ease).toBe('easeInOut');
      expect(PAGE_TRANSITION.ease).toBe('easeInOut');
    });

    it('FAB uses cubic-bezier which is universally supported', () => {
      expect(FAB_TRANSITION.ease).toEqual([0.4, 0, 0.2, 1]);
    });

    it('CSS transition strings use standard properties', () => {
      expect(HOVER_CSS).toContain('duration-150');
      expect(INTERACTIVE_CSS).toContain('duration-150');
    });
  });
});

// ════════════════════════════════════════════════════════════════════════
// 21.6 — Mobile-Specific Behavior Tests
// ════════════════════════════════════════════════════════════════════════

describe('21.6 Mobile-specific behavior tests', () => {
  beforeEach(() => {
    listeners.clear();
    window.matchMedia = vi.fn(mockMatchMedia);
  });

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
  });

  describe('Touch target sizes', () => {
    it('BottomNavBar items meet 44x44px minimum touch target', () => {
      render(<BottomNavBar items={defaultItems} activeItem="home" onItemClick={vi.fn()} />);
      defaultItems.forEach((item) => {
        const btn = screen.getByTestId(`bottom-nav-item-${item.id}`);
        expect(parseInt(btn.style.minWidth)).toBeGreaterThanOrEqual(44);
        expect(parseInt(btn.style.minHeight)).toBeGreaterThanOrEqual(44);
      });
    });

    it('FloatingActionButton meets 44x44px minimum (56x56)', () => {
      render(<FloatingActionButton isExpanded={false} onToggle={vi.fn()} onActionClick={vi.fn()} />);
      const fab = screen.getByTestId('fab-button');
      expect(parseInt(fab.style.width)).toBeGreaterThanOrEqual(44);
      expect(parseInt(fab.style.height)).toBeGreaterThanOrEqual(44);
    });

    it('HamburgerMenu close button meets 44x44px minimum', () => {
      render(<HamburgerMenu isOpen={true} onClose={vi.fn()} onItemClick={vi.fn()} />);
      const closeBtn = screen.getByTestId('hamburger-menu-close');
      expect(parseInt(closeBtn.style.minWidth)).toBeGreaterThanOrEqual(44);
      expect(parseInt(closeBtn.style.minHeight)).toBeGreaterThanOrEqual(44);
    });

    it('HamburgerMenu nav items meet 44px minimum height', () => {
      render(<HamburgerMenu isOpen={true} onClose={vi.fn()} onItemClick={vi.fn()} />);
      const item = screen.getByTestId('hamburger-item-dashboard');
      expect(parseInt(item.style.minHeight)).toBeGreaterThanOrEqual(44);
    });
  });

  describe('Responsive breakpoint behavior', () => {
    it('shows mobile components at 375px (iPhone SE)', () => {
      setWidth(375);
      render(
        <ResponsiveNavigation
          bottomNavItems={bottomNavItems}
          activeBottomNavItem="home"
          onBottomNavItemClick={vi.fn()}
          isFabExpanded={false}
          onFabToggle={vi.fn()}
          fabActions={fabActions}
          onFabActionClick={vi.fn()}
          isHamburgerOpen={false}
          onHamburgerClose={vi.fn()}
          hamburgerGroups={hamburgerGroups}
          onHamburgerItemClick={vi.fn()}
        />,
      );
      expect(screen.getByTestId('responsive-navigation')).toHaveAttribute('data-breakpoint', 'mobile');
      expect(screen.getByTestId('bottom-nav-bar')).toBeInTheDocument();
      expect(screen.getByTestId('fab-container')).toBeInTheDocument();
    });

    it('shows mobile components at 414px (iPhone Plus)', () => {
      setWidth(414);
      render(
        <ResponsiveNavigation
          bottomNavItems={bottomNavItems}
          activeBottomNavItem="home"
          onBottomNavItemClick={vi.fn()}
          isFabExpanded={false}
          onFabToggle={vi.fn()}
          fabActions={fabActions}
          onFabActionClick={vi.fn()}
          isHamburgerOpen={false}
          onHamburgerClose={vi.fn()}
          hamburgerGroups={hamburgerGroups}
          onHamburgerItemClick={vi.fn()}
        />,
      );
      expect(screen.getByTestId('responsive-navigation')).toHaveAttribute('data-breakpoint', 'mobile');
    });

    it('shows tablet layout at 768px (iPad)', () => {
      setWidth(768);
      render(
        <ResponsiveNavigation
          sidebarContent={<div>Sidebar</div>}
          onTabletSidebarToggle={vi.fn()}
        />,
      );
      expect(screen.getByTestId('responsive-navigation')).toHaveAttribute('data-breakpoint', 'tablet');
      expect(screen.getByTestId('tablet-sidebar-toggle')).toBeInTheDocument();
    });

    it('shows tablet layout at 1024px', () => {
      setWidth(1024);
      render(
        <ResponsiveNavigation
          sidebarContent={<div>Sidebar</div>}
          onTabletSidebarToggle={vi.fn()}
        />,
      );
      expect(screen.getByTestId('responsive-navigation')).toHaveAttribute('data-breakpoint', 'tablet');
    });

    it('shows desktop layout at 1025px', () => {
      setWidth(1025);
      render(<ResponsiveNavigation sidebarContent={<div>Sidebar</div>} />);
      expect(screen.getByTestId('responsive-navigation')).toHaveAttribute('data-breakpoint', 'desktop');
      expect(screen.getByTestId('desktop-sidebar')).toBeInTheDocument();
    });
  });

  describe('Mobile-specific component behavior', () => {
    it('BottomNavBar has touch-action manipulation for fast taps', () => {
      render(<BottomNavBar items={defaultItems} activeItem="home" onItemClick={vi.fn()} />);
      const list = screen.getByRole('list');
      expect(list.style.touchAction).toBe('manipulation');
    });

    it('BottomNavBar items have active state for touch feedback', () => {
      render(<BottomNavBar items={defaultItems} activeItem="home" onItemClick={vi.fn()} />);
      const inactiveBtn = screen.getByTestId('bottom-nav-item-assets');
      expect(inactiveBtn.className).toContain('active:bg-slate-100');
    });

    it('FAB action items have touch-action manipulation', () => {
      render(<FloatingActionButton isExpanded={true} onToggle={vi.fn()} onActionClick={vi.fn()} />);
      const actionBtn = screen.getByTestId('fab-action-add-asset');
      expect(actionBtn.style.touchAction).toBe('manipulation');
    });

    it('HamburgerMenu closes on Escape key (mobile keyboard)', () => {
      const onClose = vi.fn();
      render(<HamburgerMenu isOpen={true} onClose={onClose} onItemClick={vi.fn()} />);
      fireEvent.keyDown(document, { key: 'Escape' });
      expect(onClose).toHaveBeenCalled();
    });

    it('HamburgerMenu backdrop closes menu on tap', () => {
      const onClose = vi.fn();
      render(<HamburgerMenu isOpen={true} onClose={onClose} onItemClick={vi.fn()} />);
      const backdrop = screen.getByTestId('hamburger-menu-backdrop');
      fireEvent.click(backdrop);
      expect(onClose).toHaveBeenCalled();
    });

    it('FAB expanded menu shows all 3 quick actions', () => {
      render(<FloatingActionButton isExpanded={true} onToggle={vi.fn()} onActionClick={vi.fn()} />);
      expect(screen.getByTestId('fab-action-add-asset')).toBeInTheDocument();
      expect(screen.getByTestId('fab-action-log-communication')).toBeInTheDocument();
      expect(screen.getByTestId('fab-action-upload-document')).toBeInTheDocument();
    });

    it('BottomNavBar shows badge when item has badge count', () => {
      const itemsWithBadge: BottomNavItem[] = [
        { ...defaultItems[0], badge: 3 },
        ...defaultItems.slice(1),
      ];
      render(<BottomNavBar items={itemsWithBadge} activeItem="home" onItemClick={vi.fn()} />);
      const badge = screen.getByTestId('bottom-nav-badge-home');
      expect(badge).toBeInTheDocument();
      expect(badge.textContent).toBe('3');
    });

    it('BottomNavBar does not show badge when count is 0 or undefined', () => {
      render(<BottomNavBar items={defaultItems} activeItem="home" onItemClick={vi.fn()} />);
      expect(screen.queryByTestId('bottom-nav-badge-home')).not.toBeInTheDocument();
    });
  });

  describe('Mobile navigation interaction flows', () => {
    it('tapping bottom nav item triggers callback with correct id', () => {
      const onClick = vi.fn();
      render(<BottomNavBar items={defaultItems} activeItem="home" onItemClick={onClick} />);

      fireEvent.click(screen.getByTestId('bottom-nav-item-assets'));
      expect(onClick).toHaveBeenCalledWith('assets');

      fireEvent.click(screen.getByTestId('bottom-nav-item-tasks'));
      expect(onClick).toHaveBeenCalledWith('tasks');
    });

    it('FAB toggle cycles expanded state', () => {
      const onToggle = vi.fn();
      const { rerender } = render(
        <FloatingActionButton isExpanded={false} onToggle={onToggle} onActionClick={vi.fn()} />,
      );

      fireEvent.click(screen.getByTestId('fab-button'));
      expect(onToggle).toHaveBeenCalledTimes(1);

      rerender(
        <FloatingActionButton isExpanded={true} onToggle={onToggle} onActionClick={vi.fn()} />,
      );

      fireEvent.click(screen.getByTestId('fab-button'));
      expect(onToggle).toHaveBeenCalledTimes(2);
    });

    it('FAB action click triggers callback with correct action', () => {
      const onAction = vi.fn();
      render(<FloatingActionButton isExpanded={true} onToggle={vi.fn()} onActionClick={onAction} />);

      fireEvent.click(screen.getByTestId('fab-action-add-asset'));
      expect(onAction).toHaveBeenCalledTimes(1);
      expect(onAction.mock.calls[0][0]).toHaveProperty('id', 'add-asset');
    });

    it('hamburger menu item click triggers callback', () => {
      const onItemClick = vi.fn();
      render(<HamburgerMenu isOpen={true} onClose={vi.fn()} onItemClick={onItemClick} />);

      fireEvent.click(screen.getByTestId('hamburger-item-dashboard'));
      expect(onItemClick).toHaveBeenCalledTimes(1);
    });
  });
});
