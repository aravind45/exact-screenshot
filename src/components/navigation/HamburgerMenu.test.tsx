import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { HamburgerMenu, defaultPhaseGroups, defaultQuickActions, defaultFooterItems } from './HamburgerMenu';
import type { HamburgerMenuGroup, NavigationItem } from '@/types/navigation';
import { Home, Settings, HelpCircle, LogOut, Plus, Search } from 'lucide-react';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, onDragEnd, drag, dragConstraints, dragElastic, initial, animate, exit, transition, ...props }: any) => {
      // Expose onDragEnd via a data attribute so tests can simulate swipe
      return (
        <div {...props} data-drag-handler={onDragEnd ? 'true' : undefined}>
          {children}
        </div>
      );
    },
  },
  AnimatePresence: ({ children }: any) => children,
}));

const testGroups: HamburgerMenuGroup[] = [
  {
    id: 'setup',
    title: 'Phase 1: Setup',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: Home, path: '/dashboard' },
      { id: 'estate-profile', label: 'Estate Profile', icon: Settings, path: '/estate-profile' },
    ],
  },
  {
    id: 'discovery',
    title: 'Phase 2: Discovery',
    items: [
      { id: 'asset-inventory', label: 'Asset Inventory', icon: Search, path: '/assets', badge: 12, badgeType: 'info' },
    ],
  },
];

const testQuickActions: NavigationItem[] = [
  { id: 'add-asset', label: 'Add Asset', icon: Plus, path: '/add-asset' },
];

const testFooterItems: NavigationItem[] = [
  { id: 'settings', label: 'Settings', icon: Settings, path: '/settings' },
  { id: 'help', label: 'Help & Support', icon: HelpCircle, path: '/help' },
  { id: 'sign-out', label: 'Sign Out', icon: LogOut, path: '/sign-out' },
];

describe('HamburgerMenu', () => {
  const mockOnClose = vi.fn();
  const mockOnItemClick = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    document.body.style.overflow = '';
  });

  afterEach(() => {
    document.body.style.overflow = '';
  });

  const renderMenu = (isOpen = true) =>
    render(
      <HamburgerMenu
        isOpen={isOpen}
        onClose={mockOnClose}
        groups={testGroups}
        quickActions={testQuickActions}
        footerItems={testFooterItems}
        onItemClick={mockOnItemClick}
      />
    );

  describe('Rendering', () => {
    it('renders the menu container when open', () => {
      renderMenu(true);
      expect(screen.getByTestId('hamburger-menu-container')).toBeInTheDocument();
    });

    it('does not render when closed', () => {
      renderMenu(false);
      expect(screen.queryByTestId('hamburger-menu-container')).not.toBeInTheDocument();
    });

    it('renders the slide-out panel', () => {
      renderMenu();
      expect(screen.getByTestId('hamburger-menu-panel')).toBeInTheDocument();
    });

    it('renders the header with "Menu" title', () => {
      renderMenu();
      expect(screen.getByTestId('hamburger-menu-header')).toBeInTheDocument();
      expect(screen.getByText('Menu')).toBeInTheDocument();
    });

    it('renders the close button', () => {
      renderMenu();
      expect(screen.getByTestId('hamburger-menu-close')).toBeInTheDocument();
    });

    it('renders the scrollable content area', () => {
      renderMenu();
      expect(screen.getByTestId('hamburger-menu-content')).toBeInTheDocument();
    });
  });

  describe('Secondary Navigation Items (11.2)', () => {
    it('renders all phase groups', () => {
      renderMenu();
      expect(screen.getByTestId('hamburger-group-setup')).toBeInTheDocument();
      expect(screen.getByTestId('hamburger-group-discovery')).toBeInTheDocument();
    });

    it('renders group titles', () => {
      renderMenu();
      expect(screen.getByText('Phase 1: Setup')).toBeInTheDocument();
      expect(screen.getByText('Phase 2: Discovery')).toBeInTheDocument();
    });

    it('renders all navigation items within groups', () => {
      renderMenu();
      expect(screen.getByTestId('hamburger-item-dashboard')).toBeInTheDocument();
      expect(screen.getByTestId('hamburger-item-estate-profile')).toBeInTheDocument();
      expect(screen.getByTestId('hamburger-item-asset-inventory')).toBeInTheDocument();
    });

    it('renders item labels', () => {
      renderMenu();
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Estate Profile')).toBeInTheDocument();
      expect(screen.getByText('Asset Inventory')).toBeInTheDocument();
    });

    it('renders quick actions section', () => {
      renderMenu();
      expect(screen.getByTestId('hamburger-quick-actions')).toBeInTheDocument();
      expect(screen.getByText('Quick Actions')).toBeInTheDocument();
      expect(screen.getByTestId('hamburger-item-add-asset')).toBeInTheDocument();
    });

    it('renders footer items (settings, help, sign out)', () => {
      renderMenu();
      expect(screen.getByTestId('hamburger-footer')).toBeInTheDocument();
      expect(screen.getByTestId('hamburger-item-settings')).toBeInTheDocument();
      expect(screen.getByTestId('hamburger-item-help')).toBeInTheDocument();
      expect(screen.getByTestId('hamburger-item-sign-out')).toBeInTheDocument();
    });

    it('uses default groups when defaults are exported', () => {
      expect(defaultPhaseGroups).toHaveLength(4);
      expect(defaultPhaseGroups.map((g) => g.id)).toEqual(['setup', 'discovery', 'settlement', 'close']);
    });

    it('uses default quick actions when defaults are exported', () => {
      expect(defaultQuickActions).toHaveLength(4);
      expect(defaultQuickActions.map((a) => a.id)).toContain('add-asset');
      expect(defaultQuickActions.map((a) => a.id)).toContain('log-communication');
    });

    it('uses default footer items when defaults are exported', () => {
      expect(defaultFooterItems).toHaveLength(4);
      expect(defaultFooterItems.map((f) => f.id)).toContain('settings');
      expect(defaultFooterItems.map((f) => f.id)).toContain('sign-out');
    });
  });

  describe('Badge Support', () => {
    it('renders badge count on items with badges', () => {
      renderMenu();
      expect(screen.getByTestId('hamburger-badge-asset-inventory')).toBeInTheDocument();
      expect(screen.getByTestId('hamburger-badge-asset-inventory')).toHaveTextContent('12');
    });

    it('does not render badge when count is 0', () => {
      const groupsWithZeroBadge: HamburgerMenuGroup[] = [
        {
          id: 'test',
          title: 'Test',
          items: [{ id: 'item1', label: 'Item', icon: Home, path: '/', badge: 0 }],
        },
      ];
      render(
        <HamburgerMenu
          isOpen={true}
          onClose={mockOnClose}
          groups={groupsWithZeroBadge}
          quickActions={[]}
          footerItems={[]}
          onItemClick={mockOnItemClick}
        />
      );
      expect(screen.queryByTestId('hamburger-badge-item1')).not.toBeInTheDocument();
    });

    it('shows 99+ for badge counts over 99', () => {
      const groupsWithLargeBadge: HamburgerMenuGroup[] = [
        {
          id: 'test',
          title: 'Test',
          items: [{ id: 'item1', label: 'Item', icon: Home, path: '/', badge: 150, badgeType: 'urgent' }],
        },
      ];
      render(
        <HamburgerMenu
          isOpen={true}
          onClose={mockOnClose}
          groups={groupsWithLargeBadge}
          quickActions={[]}
          footerItems={[]}
          onItemClick={mockOnItemClick}
        />
      );
      expect(screen.getByTestId('hamburger-badge-item1')).toHaveTextContent('99+');
    });
  });

  describe('Active State', () => {
    it('highlights active item with aria-current', () => {
      const groupsWithActive: HamburgerMenuGroup[] = [
        {
          id: 'test',
          title: 'Test',
          items: [{ id: 'active-item', label: 'Active', icon: Home, path: '/', isActive: true }],
        },
      ];
      render(
        <HamburgerMenu
          isOpen={true}
          onClose={mockOnClose}
          groups={groupsWithActive}
          quickActions={[]}
          footerItems={[]}
          onItemClick={mockOnItemClick}
        />
      );
      const item = screen.getByTestId('hamburger-item-active-item');
      expect(item).toHaveAttribute('aria-current', 'page');
    });

    it('applies active styling to active items', () => {
      const groupsWithActive: HamburgerMenuGroup[] = [
        {
          id: 'test',
          title: 'Test',
          items: [{ id: 'active-item', label: 'Active', icon: Home, path: '/', isActive: true }],
        },
      ];
      render(
        <HamburgerMenu
          isOpen={true}
          onClose={mockOnClose}
          groups={groupsWithActive}
          quickActions={[]}
          footerItems={[]}
          onItemClick={mockOnItemClick}
        />
      );
      const item = screen.getByTestId('hamburger-item-active-item');
      expect(item.className).toContain('text-blue-500');
      expect(item.className).toContain('bg-blue-50');
    });
  });

  describe('Interaction - Tap to Close (11.4)', () => {
    it('calls onClose when backdrop is clicked', () => {
      renderMenu();
      fireEvent.click(screen.getByTestId('hamburger-menu-backdrop'));
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when close button is clicked', () => {
      renderMenu();
      fireEvent.click(screen.getByTestId('hamburger-menu-close'));
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when Escape key is pressed', () => {
      renderMenu();
      fireEvent.keyDown(document, { key: 'Escape' });
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('does not call onClose for non-Escape keys', () => {
      renderMenu();
      fireEvent.keyDown(document, { key: 'Enter' });
      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });

  describe('Interaction - Item Click', () => {
    it('calls onItemClick with the correct item when a nav item is clicked', () => {
      renderMenu();
      fireEvent.click(screen.getByTestId('hamburger-item-dashboard'));
      expect(mockOnItemClick).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'dashboard', label: 'Dashboard' })
      );
    });

    it('calls onClose after clicking a nav item', () => {
      renderMenu();
      fireEvent.click(screen.getByTestId('hamburger-item-dashboard'));
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('calls onItemClick for quick action items', () => {
      renderMenu();
      fireEvent.click(screen.getByTestId('hamburger-item-add-asset'));
      expect(mockOnItemClick).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'add-asset', label: 'Add Asset' })
      );
    });

    it('calls onItemClick for footer items', () => {
      renderMenu();
      fireEvent.click(screen.getByTestId('hamburger-item-sign-out'));
      expect(mockOnItemClick).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'sign-out', label: 'Sign Out' })
      );
    });
  });

  describe('Body Scroll Lock', () => {
    it('sets body overflow to hidden when open', () => {
      renderMenu(true);
      expect(document.body.style.overflow).toBe('hidden');
    });

    it('restores body overflow when closed', () => {
      const { rerender } = render(
        <HamburgerMenu
          isOpen={true}
          onClose={mockOnClose}
          groups={testGroups}
          quickActions={testQuickActions}
          footerItems={testFooterItems}
          onItemClick={mockOnItemClick}
        />
      );
      expect(document.body.style.overflow).toBe('hidden');

      rerender(
        <HamburgerMenu
          isOpen={false}
          onClose={mockOnClose}
          groups={testGroups}
          quickActions={testQuickActions}
          footerItems={testFooterItems}
          onItemClick={mockOnItemClick}
        />
      );
      expect(document.body.style.overflow).toBe('');
    });
  });

  describe('Accessibility', () => {
    it('has role="dialog" and aria-modal="true"', () => {
      renderMenu();
      const container = screen.getByTestId('hamburger-menu-container');
      expect(container).toHaveAttribute('role', 'dialog');
      expect(container).toHaveAttribute('aria-modal', 'true');
    });

    it('has aria-label on the dialog', () => {
      renderMenu();
      const container = screen.getByTestId('hamburger-menu-container');
      expect(container).toHaveAttribute('aria-label', 'Navigation menu');
    });

    it('close button has aria-label', () => {
      renderMenu();
      const closeBtn = screen.getByTestId('hamburger-menu-close');
      expect(closeBtn).toHaveAttribute('aria-label', 'Close menu');
    });

    it('backdrop has aria-hidden', () => {
      renderMenu();
      const backdrop = screen.getByTestId('hamburger-menu-backdrop');
      expect(backdrop).toHaveAttribute('aria-hidden', 'true');
    });

    it('phase navigation has aria-label', () => {
      renderMenu();
      const nav = screen.getByRole('navigation', { name: 'Phase navigation' });
      expect(nav).toBeInTheDocument();
    });

    it('group lists are labelled by group headings', () => {
      renderMenu();
      const setupGroup = screen.getByTestId('hamburger-group-setup');
      const list = setupGroup.querySelector('ul');
      expect(list).toHaveAttribute('aria-labelledby', 'hamburger-group-label-setup');
    });

    it('icons have aria-hidden', () => {
      renderMenu();
      const panel = screen.getByTestId('hamburger-menu-panel');
      const svgs = panel.querySelectorAll('svg');
      svgs.forEach((svg) => {
        expect(svg.getAttribute('aria-hidden')).toBe('true');
      });
    });

    it('badge has aria-label for count', () => {
      renderMenu();
      const badge = screen.getByTestId('hamburger-badge-asset-inventory');
      expect(badge).toHaveAttribute('aria-label', '12 pending');
    });

    it('footer list has aria-label', () => {
      renderMenu();
      const footer = screen.getByTestId('hamburger-footer');
      const list = footer.querySelector('ul');
      expect(list).toHaveAttribute('aria-label', 'Settings and support');
    });
  });

  describe('Touch-Friendly Sizing', () => {
    it('all nav item buttons have minimum 44px height', () => {
      renderMenu();
      const items = [
        'hamburger-item-dashboard',
        'hamburger-item-estate-profile',
        'hamburger-item-asset-inventory',
        'hamburger-item-add-asset',
        'hamburger-item-settings',
        'hamburger-item-help',
        'hamburger-item-sign-out',
      ];
      items.forEach((testId) => {
        const button = screen.getByTestId(testId);
        expect(parseInt(button.style.minHeight)).toBeGreaterThanOrEqual(44);
      });
    });

    it('close button has minimum 44x44px touch target', () => {
      renderMenu();
      const closeBtn = screen.getByTestId('hamburger-menu-close');
      expect(parseInt(closeBtn.style.minWidth)).toBeGreaterThanOrEqual(44);
      expect(parseInt(closeBtn.style.minHeight)).toBeGreaterThanOrEqual(44);
    });
  });

  describe('Viewport-Based Responsive Tests (11.5)', () => {
    it('container has md:hidden class to only show on mobile', () => {
      renderMenu();
      const container = screen.getByTestId('hamburger-menu-container');
      expect(container.className).toContain('md:hidden');
    });

    it('panel has max-w-sm class for constrained width on larger phones', () => {
      renderMenu();
      const panel = screen.getByTestId('hamburger-menu-panel');
      expect(panel.className).toContain('max-w-sm');
    });

    it('panel has w-full class for full width on small screens', () => {
      renderMenu();
      const panel = screen.getByTestId('hamburger-menu-panel');
      expect(panel.className).toContain('w-full');
    });

    it('panel is positioned on the right side', () => {
      renderMenu();
      const panel = screen.getByTestId('hamburger-menu-panel');
      expect(panel.className).toContain('right-0');
    });

    it('panel stretches full height (top-0 bottom-0)', () => {
      renderMenu();
      const panel = screen.getByTestId('hamburger-menu-panel');
      expect(panel.className).toContain('top-0');
      expect(panel.className).toContain('bottom-0');
    });

    it('container uses fixed positioning with full viewport coverage', () => {
      renderMenu();
      const container = screen.getByTestId('hamburger-menu-container');
      expect(container.className).toContain('fixed');
      expect(container.className).toContain('inset-0');
    });

    it('content area is scrollable for overflow on small screens', () => {
      renderMenu();
      const content = screen.getByTestId('hamburger-menu-content');
      expect(content.className).toContain('overflow-y-auto');
      expect(content.className).toContain('flex-1');
    });

    it('header has fixed height for consistent layout', () => {
      renderMenu();
      const header = screen.getByTestId('hamburger-menu-header');
      expect(header.style.height).toBe('56px');
      expect(header.style.minHeight).toBe('56px');
    });
  });

  describe('Sign Out Styling', () => {
    it('sign out button has red text color', () => {
      renderMenu();
      const signOut = screen.getByTestId('hamburger-item-sign-out');
      expect(signOut.className).toContain('text-red-600');
    });

    it('non-sign-out footer items have normal text color', () => {
      renderMenu();
      const settings = screen.getByTestId('hamburger-item-settings');
      expect(settings.className).toContain('text-slate-700');
    });
  });
});
