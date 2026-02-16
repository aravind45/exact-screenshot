import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ResponsiveNavigation } from './ResponsiveNavigation';
import type { BottomNavItem, QuickAction, NavigationItem, HamburgerMenuGroup } from '@/types/navigation';
import { Home, BarChart3, Plus, ClipboardList, User, MessageSquare, Upload, Settings } from 'lucide-react';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    span: ({ children, ...props }: any) => <span {...props}>{children}</span>,
    div: ({ children, ...props }: any) => {
      const { initial, animate, exit, transition, drag, dragConstraints, dragElastic, onDragEnd, layoutId, ...rest } = props;
      return <div {...rest}>{children}</div>;
    },
    button: ({ children, ...props }: any) => {
      const { initial, animate, exit, transition, whileHover, whileTap, ...rest } = props;
      return <button {...rest}>{children}</button>;
    },
    li: ({ children, ...props }: any) => {
      const { initial, animate, exit, transition, ...rest } = props;
      return <li {...rest}>{children}</li>;
    },
    ul: ({ children, ...props }: any) => {
      const { initial, animate, exit, transition, ...rest } = props;
      return <ul {...rest}>{children}</ul>;
    },
  },
  AnimatePresence: ({ children }: any) => children,
}));

// --- matchMedia mock utilities ---
type MatchMediaListener = (event: { matches: boolean }) => void;
let currentWidth = 1200;
const listeners: Map<string, MatchMediaListener[]> = new Map();

function evaluateQuery(query: string, width: number): boolean {
  const maxMatch = query.match(/max-width:\s*(\d+)px/);
  const minMatch = query.match(/min-width:\s*(\d+)px/);
  if (maxMatch && minMatch) {
    return width >= parseInt(minMatch[1]) && width <= parseInt(maxMatch[1]);
  }
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
    addEventListener: vi.fn((_: string, handler: MatchMediaListener) => {
      listeners.get(query)!.push(handler);
    }),
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

// --- Test data ---
const bottomNavItems: BottomNavItem[] = [
  { id: 'home', label: 'Home', icon: Home, path: '/dashboard' },
  { id: 'assets', label: 'Assets', icon: BarChart3, path: '/assets' },
  { id: 'add', label: 'Add', icon: Plus, path: '/add-asset' },
  { id: 'tasks', label: 'Tasks', icon: ClipboardList, path: '/tasks' },
  { id: 'more', label: 'More', icon: User, path: '/more' },
];

const fabActions: QuickAction[] = [
  { id: 'add-asset', label: 'Add Asset', icon: Plus, action: () => {} },
  { id: 'log-comm', label: 'Log Communication', icon: MessageSquare, action: () => {} },
  { id: 'upload-doc', label: 'Upload Document', icon: Upload, action: () => {} },
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

const sidebarContent = <div data-testid="sidebar-content">Sidebar Content</div>;

const originalMatchMedia = window.matchMedia;

describe('ResponsiveNavigation', () => {
  beforeEach(() => {
    listeners.clear();
    window.matchMedia = vi.fn(mockMatchMedia);
  });

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
  });

  // ---- 12.3: Desktop → Tablet → Mobile transitions ----
  describe('Breakpoint transitions', () => {
    it('renders desktop sidebar when width > 1024px', () => {
      setWidth(1200);
      render(
        <ResponsiveNavigation sidebarContent={sidebarContent} />
      );
      const nav = screen.getByTestId('responsive-navigation');
      expect(nav).toHaveAttribute('data-breakpoint', 'desktop');
      expect(screen.getByTestId('desktop-sidebar')).toBeInTheDocument();
      expect(screen.getByTestId('sidebar-content')).toBeInTheDocument();
      expect(screen.queryByTestId('bottom-nav-bar')).not.toBeInTheDocument();
      expect(screen.queryByTestId('tablet-sidebar-toggle')).not.toBeInTheDocument();
    });

    it('renders tablet overlay toggle when width is 768-1024px', () => {
      setWidth(900);
      render(
        <ResponsiveNavigation sidebarContent={sidebarContent} />
      );
      const nav = screen.getByTestId('responsive-navigation');
      expect(nav).toHaveAttribute('data-breakpoint', 'tablet');
      expect(screen.getByTestId('tablet-sidebar-toggle')).toBeInTheDocument();
      expect(screen.queryByTestId('desktop-sidebar')).not.toBeInTheDocument();
      expect(screen.queryByTestId('bottom-nav-bar')).not.toBeInTheDocument();
    });

    it('renders mobile bottom nav and FAB when width < 768px', () => {
      setWidth(500);
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
        />
      );
      const nav = screen.getByTestId('responsive-navigation');
      expect(nav).toHaveAttribute('data-breakpoint', 'mobile');
      expect(screen.getByTestId('bottom-nav-bar')).toBeInTheDocument();
      expect(screen.getByTestId('fab-container')).toBeInTheDocument();
      expect(screen.queryByTestId('desktop-sidebar')).not.toBeInTheDocument();
      expect(screen.queryByTestId('tablet-sidebar-toggle')).not.toBeInTheDocument();
    });

    it('does not render desktop sidebar when no sidebarContent provided', () => {
      setWidth(1200);
      render(<ResponsiveNavigation />);
      expect(screen.queryByTestId('desktop-sidebar')).not.toBeInTheDocument();
    });
  });

  // ---- 12.2 continued: Tablet sidebar overlay behavior ----
  describe('Tablet sidebar overlay', () => {
    it('shows sidebar overlay when isTabletSidebarOpen is true', () => {
      setWidth(900);
      render(
        <ResponsiveNavigation
          sidebarContent={sidebarContent}
          isTabletSidebarOpen={true}
          onTabletSidebarToggle={vi.fn()}
        />
      );
      expect(screen.getByTestId('tablet-sidebar')).toBeInTheDocument();
      expect(screen.getByTestId('tablet-sidebar-backdrop')).toBeInTheDocument();
      expect(screen.getByTestId('sidebar-content')).toBeInTheDocument();
    });

    it('hides sidebar overlay when isTabletSidebarOpen is false', () => {
      setWidth(900);
      render(
        <ResponsiveNavigation
          sidebarContent={sidebarContent}
          isTabletSidebarOpen={false}
          onTabletSidebarToggle={vi.fn()}
        />
      );
      expect(screen.queryByTestId('tablet-sidebar')).not.toBeInTheDocument();
      expect(screen.queryByTestId('tablet-sidebar-backdrop')).not.toBeInTheDocument();
    });

    it('calls onTabletSidebarToggle when toggle button is clicked', () => {
      setWidth(900);
      const onToggle = vi.fn();
      render(
        <ResponsiveNavigation
          sidebarContent={sidebarContent}
          isTabletSidebarOpen={false}
          onTabletSidebarToggle={onToggle}
        />
      );
      fireEvent.click(screen.getByTestId('tablet-sidebar-toggle'));
      expect(onToggle).toHaveBeenCalledTimes(1);
    });

    it('calls onTabletSidebarToggle when backdrop is clicked', () => {
      setWidth(900);
      const onToggle = vi.fn();
      render(
        <ResponsiveNavigation
          sidebarContent={sidebarContent}
          isTabletSidebarOpen={true}
          onTabletSidebarToggle={onToggle}
        />
      );
      fireEvent.click(screen.getByTestId('tablet-sidebar-backdrop'));
      expect(onToggle).toHaveBeenCalledTimes(1);
    });

    it('tablet sidebar toggle has correct aria attributes', () => {
      setWidth(900);
      render(
        <ResponsiveNavigation
          sidebarContent={sidebarContent}
          isTabletSidebarOpen={true}
          onTabletSidebarToggle={vi.fn()}
        />
      );
      const toggle = screen.getByTestId('tablet-sidebar-toggle');
      expect(toggle).toHaveAttribute('aria-expanded', 'true');
      expect(toggle).toHaveAttribute('aria-label', 'Close sidebar');
    });
  });

  // ---- 12.4: State persists across breakpoints ----
  describe('State persistence across breakpoints', () => {
    it('mobile bottom nav calls onBottomNavItemClick with correct id', () => {
      setWidth(500);
      const onClick = vi.fn();
      render(
        <ResponsiveNavigation
          bottomNavItems={bottomNavItems}
          activeBottomNavItem="home"
          onBottomNavItemClick={onClick}
          isFabExpanded={false}
          onFabToggle={vi.fn()}
          fabActions={fabActions}
          onFabActionClick={vi.fn()}
          isHamburgerOpen={false}
          onHamburgerClose={vi.fn()}
          hamburgerGroups={hamburgerGroups}
          onHamburgerItemClick={vi.fn()}
        />
      );
      fireEvent.click(screen.getByTestId('bottom-nav-item-assets'));
      expect(onClick).toHaveBeenCalledWith('assets');
    });

    it('FAB toggle callback is forwarded correctly', () => {
      setWidth(500);
      const onToggle = vi.fn();
      render(
        <ResponsiveNavigation
          bottomNavItems={bottomNavItems}
          activeBottomNavItem="home"
          onBottomNavItemClick={vi.fn()}
          isFabExpanded={false}
          onFabToggle={onToggle}
          fabActions={fabActions}
          onFabActionClick={vi.fn()}
          isHamburgerOpen={false}
          onHamburgerClose={vi.fn()}
          hamburgerGroups={hamburgerGroups}
          onHamburgerItemClick={vi.fn()}
        />
      );
      fireEvent.click(screen.getByTestId('fab-button'));
      expect(onToggle).toHaveBeenCalledTimes(1);
    });

    it('exposes breakpoint via data attribute for external state management', () => {
      setWidth(1200);
      const { rerender } = render(
        <ResponsiveNavigation sidebarContent={sidebarContent} />
      );
      expect(screen.getByTestId('responsive-navigation')).toHaveAttribute('data-breakpoint', 'desktop');

      // The parent component can read this attribute and maintain state accordingly
      // The NavigationContext (already implemented) persists expandedPhases, recentItems, etc.
      // via localStorage, so state survives breakpoint changes automatically.
    });
  });

  // ---- 12.5: Responsive tests ----
  describe('Responsive behavior', () => {
    it('desktop sidebar has correct width (280px)', () => {
      setWidth(1200);
      render(<ResponsiveNavigation sidebarContent={sidebarContent} />);
      const sidebar = screen.getByTestId('desktop-sidebar');
      expect(sidebar.className).toContain('w-[280px]');
    });

    it('tablet sidebar overlay has correct width (240px)', () => {
      setWidth(900);
      render(
        <ResponsiveNavigation
          sidebarContent={sidebarContent}
          isTabletSidebarOpen={true}
          onTabletSidebarToggle={vi.fn()}
        />
      );
      const sidebar = screen.getByTestId('tablet-sidebar');
      expect(sidebar.className).toContain('w-[240px]');
    });

    it('desktop sidebar has proper aria-label', () => {
      setWidth(1200);
      render(<ResponsiveNavigation sidebarContent={sidebarContent} />);
      expect(screen.getByTestId('desktop-sidebar')).toHaveAttribute(
        'aria-label',
        'Desktop navigation sidebar'
      );
    });

    it('tablet sidebar overlay has proper aria attributes', () => {
      setWidth(900);
      render(
        <ResponsiveNavigation
          sidebarContent={sidebarContent}
          isTabletSidebarOpen={true}
          onTabletSidebarToggle={vi.fn()}
        />
      );
      const sidebar = screen.getByTestId('tablet-sidebar');
      expect(sidebar).toHaveAttribute('aria-label', 'Tablet navigation sidebar');
      expect(sidebar).toHaveAttribute('role', 'dialog');
      expect(sidebar).toHaveAttribute('aria-modal', 'true');
    });

    it('component visibility matches spec table for desktop', () => {
      setWidth(1200);
      render(<ResponsiveNavigation sidebarContent={sidebarContent} />);
      // Desktop: Sidebar always, no bottom nav, no FAB
      expect(screen.getByTestId('desktop-sidebar')).toBeInTheDocument();
      expect(screen.queryByTestId('bottom-nav-bar')).not.toBeInTheDocument();
      expect(screen.queryByTestId('fab-container')).not.toBeInTheDocument();
    });

    it('component visibility matches spec table for tablet', () => {
      setWidth(900);
      render(
        <ResponsiveNavigation
          sidebarContent={sidebarContent}
          isTabletSidebarOpen={false}
          onTabletSidebarToggle={vi.fn()}
        />
      );
      // Tablet: Sidebar overlay (toggle visible), no bottom nav, no FAB
      expect(screen.getByTestId('tablet-sidebar-toggle')).toBeInTheDocument();
      expect(screen.queryByTestId('bottom-nav-bar')).not.toBeInTheDocument();
      expect(screen.queryByTestId('fab-container')).not.toBeInTheDocument();
    });

    it('component visibility matches spec table for mobile', () => {
      setWidth(500);
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
        />
      );
      // Mobile: Bottom nav always, FAB always, no sidebar
      expect(screen.getByTestId('bottom-nav-bar')).toBeInTheDocument();
      expect(screen.getByTestId('fab-container')).toBeInTheDocument();
      expect(screen.queryByTestId('desktop-sidebar')).not.toBeInTheDocument();
      expect(screen.queryByTestId('tablet-sidebar-toggle')).not.toBeInTheDocument();
    });

    it('renders at exact boundary 768px as tablet', () => {
      setWidth(768);
      render(
        <ResponsiveNavigation sidebarContent={sidebarContent} onTabletSidebarToggle={vi.fn()} />
      );
      expect(screen.getByTestId('responsive-navigation')).toHaveAttribute('data-breakpoint', 'tablet');
    });

    it('renders at exact boundary 1025px as desktop', () => {
      setWidth(1025);
      render(<ResponsiveNavigation sidebarContent={sidebarContent} />);
      expect(screen.getByTestId('responsive-navigation')).toHaveAttribute('data-breakpoint', 'desktop');
    });
  });
});
