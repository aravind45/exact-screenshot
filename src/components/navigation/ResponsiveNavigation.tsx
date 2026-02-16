import { useState, useCallback, memo } from 'react';
import { useMediaQuery, type Breakpoint } from '@/hooks/useMediaQuery';
import { BottomNavBar } from './BottomNavBar';
import { FloatingActionButton } from './FloatingActionButton';
import { HamburgerMenu } from './HamburgerMenu';
import type {
  BottomNavItem,
  QuickAction,
  NavigationItem,
  HamburgerMenuGroup,
} from '@/types/navigation';

export interface ResponsiveNavigationProps {
  /** Items for the mobile bottom nav bar */
  bottomNavItems?: BottomNavItem[];
  /** Currently active bottom nav item id */
  activeBottomNavItem?: string;
  /** Callback when a bottom nav item is clicked */
  onBottomNavItemClick?: (id: string) => void;
  /** Whether the FAB menu is expanded */
  isFabExpanded?: boolean;
  /** Callback to toggle FAB */
  onFabToggle?: () => void;
  /** FAB quick actions */
  fabActions?: QuickAction[];
  /** Callback when a FAB action is clicked */
  onFabActionClick?: (action: QuickAction) => void;
  /** Whether the hamburger menu is open */
  isHamburgerOpen?: boolean;
  /** Callback to close hamburger menu */
  onHamburgerClose?: () => void;
  /** Hamburger menu groups */
  hamburgerGroups?: HamburgerMenuGroup[];
  /** Hamburger quick actions */
  hamburgerQuickActions?: NavigationItem[];
  /** Hamburger footer items */
  hamburgerFooterItems?: NavigationItem[];
  /** Callback when a hamburger item is clicked */
  onHamburgerItemClick?: (item: NavigationItem) => void;
  /** Desktop/tablet sidebar content */
  sidebarContent?: React.ReactNode;
  /** Whether the tablet sidebar overlay is open */
  isTabletSidebarOpen?: boolean;
  /** Callback to toggle tablet sidebar overlay */
  onTabletSidebarToggle?: () => void;
}

/**
 * Responsive navigation wrapper that renders the appropriate navigation
 * components based on the current breakpoint.
 *
 * - Desktop (> 1024px): Full sidebar always visible
 * - Tablet (768px - 1024px): Collapsible sidebar overlay
 * - Mobile (< 768px): Bottom nav bar + FAB + hamburger menu
 */
export const ResponsiveNavigation = memo(function ResponsiveNavigation({
  bottomNavItems,
  activeBottomNavItem = 'home',
  onBottomNavItemClick,
  isFabExpanded = false,
  onFabToggle,
  fabActions,
  onFabActionClick,
  isHamburgerOpen = false,
  onHamburgerClose,
  hamburgerGroups,
  hamburgerQuickActions,
  hamburgerFooterItems,
  onHamburgerItemClick,
  sidebarContent,
  isTabletSidebarOpen = false,
  onTabletSidebarToggle,
}: ResponsiveNavigationProps) {
  const breakpoint = useMediaQuery();

  const handleBottomNavClick = useCallback(
    (id: string) => {
      onBottomNavItemClick?.(id);
    },
    [onBottomNavItemClick]
  );

  const handleFabToggle = useCallback(() => {
    onFabToggle?.();
  }, [onFabToggle]);

  const handleFabAction = useCallback(
    (action: QuickAction) => {
      onFabActionClick?.(action);
    },
    [onFabActionClick]
  );

  const handleHamburgerClose = useCallback(() => {
    onHamburgerClose?.();
  }, [onHamburgerClose]);

  const handleHamburgerItemClick = useCallback(
    (item: NavigationItem) => {
      onHamburgerItemClick?.(item);
    },
    [onHamburgerItemClick]
  );

  const handleTabletSidebarToggle = useCallback(() => {
    onTabletSidebarToggle?.();
  }, [onTabletSidebarToggle]);

  return (
    <div data-testid="responsive-navigation" data-breakpoint={breakpoint}>
      {/* Desktop: Full sidebar always visible */}
      {breakpoint === 'desktop' && sidebarContent && (
        <aside
          data-testid="desktop-sidebar"
          className="fixed top-0 left-0 bottom-0 w-[280px] bg-white border-r border-slate-200 overflow-y-auto z-40"
          aria-label="Desktop navigation sidebar"
        >
          {sidebarContent}
        </aside>
      )}

      {/* Tablet: Collapsible sidebar overlay */}
      {breakpoint === 'tablet' && (
        <>
          {/* Toggle button */}
          <button
            data-testid="tablet-sidebar-toggle"
            onClick={handleTabletSidebarToggle}
            className="fixed top-3 left-3 z-50 flex items-center justify-center w-10 h-10 rounded-md bg-white border border-slate-200 shadow-sm hover:bg-slate-50 active:bg-slate-100 transition-all duration-150 ease-out focus-visible:outline-2 focus-visible:outline-blue-500 focus-visible:outline-offset-2"
            aria-label={isTabletSidebarOpen ? 'Close sidebar' : 'Open sidebar'}
            aria-expanded={isTabletSidebarOpen}
          >
            <svg
              className="w-5 h-5 text-slate-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>

          {/* Overlay sidebar */}
          {isTabletSidebarOpen && (
            <>
              <div
                data-testid="tablet-sidebar-backdrop"
                className="fixed inset-0 bg-black/30 z-40"
                onClick={handleTabletSidebarToggle}
                aria-hidden="true"
              />
              <aside
                data-testid="tablet-sidebar"
                className="fixed top-0 left-0 bottom-0 w-[240px] bg-white border-r border-slate-200 overflow-y-auto z-50 shadow-xl"
                aria-label="Tablet navigation sidebar"
                role="dialog"
                aria-modal="true"
              >
                {sidebarContent}
              </aside>
            </>
          )}
        </>
      )}

      {/* Mobile: Bottom nav + FAB + Hamburger */}
      {breakpoint === 'mobile' && (
        <>
          <BottomNavBar
            items={bottomNavItems}
            activeItem={activeBottomNavItem}
            onItemClick={handleBottomNavClick}
          />
          <FloatingActionButton
            isExpanded={isFabExpanded}
            onToggle={handleFabToggle}
            actions={fabActions}
            onActionClick={handleFabAction}
          />
          <HamburgerMenu
            isOpen={isHamburgerOpen}
            onClose={handleHamburgerClose}
            groups={hamburgerGroups}
            quickActions={hamburgerQuickActions}
            footerItems={hamburgerFooterItems}
            onItemClick={handleHamburgerItemClick}
          />
        </>
      )}
    </div>
  );
});

export { type Breakpoint };
