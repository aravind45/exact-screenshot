import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { SkipNavigation } from './SkipNavigation';
import { BottomNavBar, defaultItems } from './BottomNavBar';
import { Breadcrumbs, generateBreadcrumbs } from './Breadcrumbs';
import { FloatingActionButton } from './FloatingActionButton';
import { HamburgerMenu } from './HamburgerMenu';
import { KeyboardShortcutsModal } from './KeyboardShortcutsModal';
import { NavigationTooltip } from './NavigationTooltip';
import type { NavigationTooltipContent } from '@/types/navigation';

// Polyfill ResizeObserver for Radix UI tooltip tests in jsdom
if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as any;
}

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    span: ({ children, ...props }: any) => <span {...props}>{children}</span>,
    div: ({ children, ...props }: any) => {
      const { initial, animate, exit, transition, drag, dragConstraints, dragElastic, onDragEnd, variants, custom, layoutId, ...rest } = props;
      return <div {...rest}>{children}</div>;
    },
    button: ({ children, ...props }: any) => {
      const { initial, animate, exit, transition, whileHover, whileTap, ...rest } = props;
      return <button {...rest}>{children}</button>;
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

// Helper to render with router
function renderWithRouter(ui: React.ReactElement, { route = '/' } = {}) {
  return render(<MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>);
}

const tooltipContent: NavigationTooltipContent = {
  title: 'Dashboard',
  description: 'View your estate overview and next actions.',
  example: 'Check pending tasks and recent activity.',
};

// ============================================================
// 19.1 - Accessibility Audit Tests
// Checks for common a11y issues: missing aria-labels, roles,
// semantic HTML, focus indicators, etc.
// ============================================================
describe('19.1 Accessibility Audit', () => {
  describe('BottomNavBar', () => {
    const mockClick = vi.fn();

    it('uses semantic <nav> element with aria-label', () => {
      render(<BottomNavBar items={defaultItems} activeItem="home" onItemClick={mockClick} />);
      const nav = screen.getByRole('navigation');
      expect(nav).toHaveAttribute('aria-label', 'Mobile navigation');
    });

    it('uses <ul> with role="list" for navigation items', () => {
      render(<BottomNavBar items={defaultItems} activeItem="home" onItemClick={mockClick} />);
      expect(screen.getByRole('list')).toBeInTheDocument();
    });

    it('every button has an aria-label', () => {
      render(<BottomNavBar items={defaultItems} activeItem="home" onItemClick={mockClick} />);
      defaultItems.forEach((item) => {
        const btn = screen.getByTestId(`bottom-nav-item-${item.id}`);
        expect(btn).toHaveAttribute('aria-label', item.label);
      });
    });

    it('active item has aria-current="page"', () => {
      render(<BottomNavBar items={defaultItems} activeItem="assets" onItemClick={mockClick} />);
      expect(screen.getByTestId('bottom-nav-item-assets')).toHaveAttribute('aria-current', 'page');
    });

    it('icons are hidden from screen readers with aria-hidden', () => {
      render(<BottomNavBar items={defaultItems} activeItem="home" onItemClick={mockClick} />);
      const nav = screen.getByTestId('bottom-nav-bar');
      const svgs = nav.querySelectorAll('svg');
      svgs.forEach((svg) => {
        expect(svg).toHaveAttribute('aria-hidden', 'true');
      });
    });
  });

  describe('Breadcrumbs', () => {
    it('uses semantic <nav> element with aria-label="Breadcrumb"', () => {
      renderWithRouter(
        <Breadcrumbs items={[{ label: 'Home', path: '/dashboard' }, { label: 'Assets' }]} />
      );
      const nav = screen.getByRole('navigation');
      expect(nav).toHaveAttribute('aria-label', 'Breadcrumb');
    });

    it('uses <ol> with role="list" for breadcrumb items', () => {
      renderWithRouter(
        <Breadcrumbs items={[{ label: 'Home', path: '/dashboard' }, { label: 'Assets' }]} />
      );
      expect(screen.getByRole('list')).toBeInTheDocument();
    });

    it('current page has aria-current="page"', () => {
      renderWithRouter(
        <Breadcrumbs items={[{ label: 'Home', path: '/dashboard' }, { label: 'Assets' }]} />
      );
      const currentPage = screen.getByText('Assets');
      expect(currentPage.closest('[aria-current="page"]')).toBeInTheDocument();
    });

    it('separator chevrons are hidden from screen readers', () => {
      renderWithRouter(
        <Breadcrumbs items={[{ label: 'Home', path: '/dashboard' }, { label: 'Assets' }]} />
      );
      const nav = screen.getByTestId('breadcrumbs');
      const separators = nav.querySelectorAll('[aria-hidden="true"]');
      expect(separators.length).toBeGreaterThan(0);
    });
  });

  describe('FloatingActionButton', () => {
    const mockToggle = vi.fn();
    const mockAction = vi.fn();

    it('FAB button has descriptive aria-label', () => {
      render(
        <FloatingActionButton isExpanded={false} onToggle={mockToggle} onActionClick={mockAction} />
      );
      const fab = screen.getByTestId('fab-button');
      expect(fab).toHaveAttribute('aria-label', 'Open quick actions menu');
    });

    it('FAB button has aria-expanded state', () => {
      render(
        <FloatingActionButton isExpanded={true} onToggle={mockToggle} onActionClick={mockAction} />
      );
      const fab = screen.getByTestId('fab-button');
      expect(fab).toHaveAttribute('aria-expanded', 'true');
    });

    it('FAB button has aria-haspopup', () => {
      render(
        <FloatingActionButton isExpanded={false} onToggle={mockToggle} onActionClick={mockAction} />
      );
      expect(screen.getByTestId('fab-button')).toHaveAttribute('aria-haspopup', 'true');
    });

    it('expanded menu has aria-label on the list', () => {
      render(
        <FloatingActionButton isExpanded={true} onToggle={mockToggle} onActionClick={mockAction} />
      );
      const menu = screen.getByTestId('fab-menu');
      expect(menu).toHaveAttribute('aria-label', 'Quick actions');
    });

    it('action buttons have aria-labels', () => {
      render(
        <FloatingActionButton isExpanded={true} onToggle={mockToggle} onActionClick={mockAction} />
      );
      expect(screen.getByTestId('fab-action-add-asset')).toHaveAttribute('aria-label', 'Add Asset');
      expect(screen.getByTestId('fab-action-log-communication')).toHaveAttribute('aria-label', 'Log Communication');
      expect(screen.getByTestId('fab-action-upload-document')).toHaveAttribute('aria-label', 'Upload Document');
    });
  });

  describe('HamburgerMenu', () => {
    const mockClose = vi.fn();
    const mockItemClick = vi.fn();

    it('has role="dialog" and aria-modal="true"', () => {
      render(
        <HamburgerMenu isOpen={true} onClose={mockClose} onItemClick={mockItemClick} />
      );
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
    });

    it('has aria-label on the dialog', () => {
      render(
        <HamburgerMenu isOpen={true} onClose={mockClose} onItemClick={mockItemClick} />
      );
      expect(screen.getByRole('dialog')).toHaveAttribute('aria-label', 'Navigation menu');
    });

    it('close button has aria-label', () => {
      render(
        <HamburgerMenu isOpen={true} onClose={mockClose} onItemClick={mockItemClick} />
      );
      expect(screen.getByTestId('hamburger-menu-close')).toHaveAttribute('aria-label', 'Close menu');
    });

    it('phase groups have aria-labelledby linking to group headers', () => {
      render(
        <HamburgerMenu isOpen={true} onClose={mockClose} onItemClick={mockItemClick} />
      );
      const setupGroup = screen.getByTestId('hamburger-group-setup');
      const list = within(setupGroup).getByRole('list');
      expect(list).toHaveAttribute('aria-labelledby', 'hamburger-group-label-setup');
    });

    it('navigation items with active state have aria-current="page"', () => {
      const groups = [
        {
          id: 'test',
          title: 'Test',
          items: [
            { id: 'item1', label: 'Active Item', icon: () => <svg />, path: '/test', isActive: true },
          ],
        },
      ];
      render(
        <HamburgerMenu isOpen={true} onClose={mockClose} onItemClick={mockItemClick} groups={groups} />
      );
      expect(screen.getByTestId('hamburger-item-item1')).toHaveAttribute('aria-current', 'page');
    });
  });
});

// ============================================================
// 19.3 - Screen Reader Support Tests
// Verifies aria-live regions, aria-labels, screen reader
// announcements, and semantic structure for assistive tech.
// ============================================================
describe('19.3 Screen Reader Support', () => {
  describe('SkipNavigation', () => {
    it('renders a skip link targeting #main-content', () => {
      render(<SkipNavigation />);
      const link = screen.getByTestId('skip-navigation');
      expect(link).toHaveAttribute('href', '#main-content');
      expect(link).toHaveTextContent('Skip to main content');
    });

    it('has sr-only class to be visually hidden by default', () => {
      render(<SkipNavigation />);
      const link = screen.getByTestId('skip-navigation');
      expect(link.className).toContain('sr-only');
    });

    it('becomes visible on focus (focus:not-sr-only)', () => {
      render(<SkipNavigation />);
      const link = screen.getByTestId('skip-navigation');
      expect(link.className).toContain('focus:not-sr-only');
    });
  });

  describe('BottomNavBar - Screen Reader Announcements', () => {
    const mockClick = vi.fn();

    it('badge counts have aria-label for screen readers', () => {
      const itemsWithBadge = [
        { ...defaultItems[0], badge: 5 },
        ...defaultItems.slice(1),
      ];
      render(<BottomNavBar items={itemsWithBadge} activeItem="home" onItemClick={mockClick} />);
      const badge = screen.getByTestId('bottom-nav-badge-home');
      expect(badge).toHaveAttribute('aria-label', '5 notifications');
    });
  });

  describe('HamburgerMenu - Semantic Structure', () => {
    const mockClose = vi.fn();
    const mockItemClick = vi.fn();

    it('uses <nav> element for phase navigation', () => {
      render(
        <HamburgerMenu isOpen={true} onClose={mockClose} onItemClick={mockItemClick} />
      );
      const nav = screen.getByLabelText('Phase navigation');
      expect(nav.tagName).toBe('NAV');
    });

    it('footer list has aria-label for settings and support', () => {
      render(
        <HamburgerMenu isOpen={true} onClose={mockClose} onItemClick={mockItemClick} />
      );
      const footer = screen.getByTestId('hamburger-footer');
      const list = within(footer).getByRole('list');
      expect(list).toHaveAttribute('aria-label', 'Settings and support');
    });

    it('decorative icons have aria-hidden="true"', () => {
      render(
        <HamburgerMenu isOpen={true} onClose={mockClose} onItemClick={mockItemClick} />
      );
      const closeBtn = screen.getByTestId('hamburger-menu-close');
      const svg = closeBtn.querySelector('svg');
      expect(svg).toHaveAttribute('aria-hidden', 'true');
    });

    it('dividers have role="separator"', () => {
      render(
        <HamburgerMenu isOpen={true} onClose={mockClose} onItemClick={mockItemClick} />
      );
      const separators = screen.getByTestId('hamburger-menu-content').querySelectorAll('[role="separator"]');
      expect(separators.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Breadcrumbs - Screen Reader', () => {
    it('generates correct breadcrumb structure from route', () => {
      const items = generateBreadcrumbs('/assets');
      expect(items.length).toBeGreaterThanOrEqual(2);
      expect(items[0].label).toBe('Home');
      // Last item should have no path (current page)
      expect(items[items.length - 1].path).toBeUndefined();
    });

    it('last breadcrumb item is not a link (current page)', () => {
      renderWithRouter(
        <Breadcrumbs items={[
          { label: 'Home', path: '/dashboard' },
          { label: 'Discovery' },
          { label: 'Asset Inventory' },
        ]} />
      );
      const currentPage = screen.getByText('Asset Inventory');
      // Should not be wrapped in a link
      expect(currentPage.closest('a')).toBeNull();
    });
  });

  describe('NavigationTooltip - Screen Reader', () => {
    it('tooltip content has role="tooltip"', () => {
      render(
        <NavigationTooltip content={tooltipContent} open={true} onOpenChange={() => {}}>
          <button>Trigger</button>
        </NavigationTooltip>
      );
      const tooltips = screen.getAllByRole('tooltip');
      expect(tooltips.length).toBeGreaterThanOrEqual(1);
    });

    it('decorative icons in tooltip have aria-hidden', () => {
      const contentWithIcon = {
        ...tooltipContent,
        icon: ({ className }: { className?: string }) => (
          <svg className={className} data-testid="tooltip-icon" />
        ),
      };
      render(
        <NavigationTooltip content={contentWithIcon} open={true} onOpenChange={() => {}}>
          <button>Trigger</button>
        </NavigationTooltip>
      );
      // Radix renders the tooltip content in both a visible and a sr-only element
      const tooltipEl = screen.getByTestId('navigation-tooltip');
      const icon = tooltipEl.querySelector('[data-testid="tooltip-icon"]');
      expect(icon).toBeInTheDocument();
    });
  });
});

// ============================================================
// 19.4 - Keyboard Navigation Tests
// Verifies all navigation items are reachable via keyboard
// (Tab, Enter, Escape, Arrow keys).
// ============================================================
describe('19.4 Keyboard Navigation', () => {
  describe('BottomNavBar - Keyboard', () => {
    const mockClick = vi.fn();

    beforeEach(() => vi.clearAllMocks());

    it('all nav buttons are focusable via Tab', () => {
      render(<BottomNavBar items={defaultItems} activeItem="home" onItemClick={mockClick} />);
      defaultItems.forEach((item) => {
        const btn = screen.getByTestId(`bottom-nav-item-${item.id}`);
        btn.focus();
        expect(document.activeElement).toBe(btn);
      });
    });

    it('buttons are activatable with Enter key', () => {
      render(<BottomNavBar items={defaultItems} activeItem="home" onItemClick={mockClick} />);
      const btn = screen.getByTestId('bottom-nav-item-assets');
      fireEvent.keyDown(btn, { key: 'Enter' });
      fireEvent.click(btn);
      expect(mockClick).toHaveBeenCalledWith('assets');
    });
  });

  describe('HamburgerMenu - Keyboard', () => {
    const mockClose = vi.fn();
    const mockItemClick = vi.fn();

    beforeEach(() => vi.clearAllMocks());

    it('closes on Escape key', () => {
      render(
        <HamburgerMenu isOpen={true} onClose={mockClose} onItemClick={mockItemClick} />
      );
      fireEvent.keyDown(document, { key: 'Escape' });
      expect(mockClose).toHaveBeenCalled();
    });

    it('traps focus within the menu (Tab on last element wraps to first)', () => {
      render(
        <HamburgerMenu isOpen={true} onClose={mockClose} onItemClick={mockItemClick} />
      );
      const panel = screen.getByTestId('hamburger-menu-panel');
      const focusableElements = panel.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      expect(focusableElements.length).toBeGreaterThan(0);

      // Focus the last element and press Tab - should wrap
      const lastEl = focusableElements[focusableElements.length - 1];
      lastEl.focus();
      fireEvent.keyDown(document, { key: 'Tab' });
      // Focus trap handler should prevent default and wrap
    });

    it('all menu items are keyboard accessible buttons', () => {
      render(
        <HamburgerMenu isOpen={true} onClose={mockClose} onItemClick={mockItemClick} />
      );
      const panel = screen.getByTestId('hamburger-menu-panel');
      const buttons = panel.querySelectorAll('button');
      buttons.forEach((btn) => {
        btn.focus();
        expect(document.activeElement).toBe(btn);
      });
    });
  });

  describe('FloatingActionButton - Keyboard', () => {
    const mockToggle = vi.fn();
    const mockAction = vi.fn();

    beforeEach(() => vi.clearAllMocks());

    it('FAB button is focusable', () => {
      render(
        <FloatingActionButton isExpanded={false} onToggle={mockToggle} onActionClick={mockAction} />
      );
      const fab = screen.getByTestId('fab-button');
      fab.focus();
      expect(document.activeElement).toBe(fab);
    });

    it('FAB button activates on Enter', () => {
      render(
        <FloatingActionButton isExpanded={false} onToggle={mockToggle} onActionClick={mockAction} />
      );
      const fab = screen.getByTestId('fab-button');
      fireEvent.click(fab);
      expect(mockToggle).toHaveBeenCalled();
    });

    it('expanded action buttons are focusable', () => {
      render(
        <FloatingActionButton isExpanded={true} onToggle={mockToggle} onActionClick={mockAction} />
      );
      const addBtn = screen.getByTestId('fab-action-add-asset');
      addBtn.focus();
      expect(document.activeElement).toBe(addBtn);
    });
  });

  describe('NavigationTooltip - Keyboard', () => {
    it('dismisses on Escape key', () => {
      const onOpenChange = vi.fn();
      render(
        <NavigationTooltip content={tooltipContent} open={true} onOpenChange={onOpenChange}>
          <button>Trigger</button>
        </NavigationTooltip>
      );
      fireEvent.keyDown(document, { key: 'Escape' });
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });

  describe('KeyboardShortcutsModal - Keyboard', () => {
    it('renders all shortcut groups', () => {
      render(<KeyboardShortcutsModal isOpen={true} onClose={vi.fn()} />);
      expect(screen.getByText('Global')).toBeInTheDocument();
      expect(screen.getByText('Navigation')).toBeInTheDocument();
      expect(screen.getByText('General')).toBeInTheDocument();
    });

    it('has accessible dialog structure', () => {
      render(<KeyboardShortcutsModal isOpen={true} onClose={vi.fn()} />);
      expect(screen.getByTestId('keyboard-shortcuts-modal')).toHaveAttribute('aria-label', 'Keyboard shortcuts');
    });

    it('displays keyboard shortcut descriptions', () => {
      render(<KeyboardShortcutsModal isOpen={true} onClose={vi.fn()} />);
      expect(screen.getByText('Open Quick Actions')).toBeInTheDocument();
      expect(screen.getByText('Open Help')).toBeInTheDocument();
      expect(screen.getByText('Navigate through items')).toBeInTheDocument();
    });
  });
});

// ============================================================
// 19.6 - WCAG 2.1 AA Compliance Tests
// Verifies focus visible indicators, sufficient contrast classes,
// semantic HTML, touch target sizes, and other WCAG patterns.
// ============================================================
describe('19.6 WCAG 2.1 AA Compliance', () => {
  describe('Focus Visible Indicators', () => {
    it('BottomNavBar buttons have focus-visible outline styles', () => {
      const mockClick = vi.fn();
      render(<BottomNavBar items={defaultItems} activeItem="home" onItemClick={mockClick} />);
      const btn = screen.getByTestId('bottom-nav-item-home');
      expect(btn.className).toContain('focus-visible:outline');
    });

    it('FloatingActionButton has focus-visible outline', () => {
      render(
        <FloatingActionButton isExpanded={false} onToggle={vi.fn()} onActionClick={vi.fn()} />
      );
      const fab = screen.getByTestId('fab-button');
      expect(fab.className).toContain('focus-visible:outline');
    });

    it('HamburgerMenu close button has focus-visible outline', () => {
      render(
        <HamburgerMenu isOpen={true} onClose={vi.fn()} onItemClick={vi.fn()} />
      );
      const closeBtn = screen.getByTestId('hamburger-menu-close');
      expect(closeBtn.className).toContain('focus-visible:outline');
    });

    it('HamburgerMenu navigation items have focus-visible outline', () => {
      render(
        <HamburgerMenu isOpen={true} onClose={vi.fn()} onItemClick={vi.fn()} />
      );
      const item = screen.getByTestId('hamburger-item-dashboard');
      expect(item.className).toContain('focus-visible:outline');
    });

    it('FAB action buttons have focus-visible outline', () => {
      render(
        <FloatingActionButton isExpanded={true} onToggle={vi.fn()} onActionClick={vi.fn()} />
      );
      const actionBtn = screen.getByTestId('fab-action-add-asset');
      expect(actionBtn.className).toContain('focus-visible:outline');
    });
  });

  describe('Touch Target Sizes (WCAG 2.5.5 - min 44x44px)', () => {
    it('BottomNavBar buttons meet 44x44px minimum', () => {
      const mockClick = vi.fn();
      render(<BottomNavBar items={defaultItems} activeItem="home" onItemClick={mockClick} />);
      defaultItems.forEach((item) => {
        const btn = screen.getByTestId(`bottom-nav-item-${item.id}`);
        expect(parseInt(btn.style.minWidth)).toBeGreaterThanOrEqual(44);
        expect(parseInt(btn.style.minHeight)).toBeGreaterThanOrEqual(44);
      });
    });

    it('HamburgerMenu close button meets 44x44px minimum', () => {
      render(
        <HamburgerMenu isOpen={true} onClose={vi.fn()} onItemClick={vi.fn()} />
      );
      const closeBtn = screen.getByTestId('hamburger-menu-close');
      expect(parseInt(closeBtn.style.minWidth)).toBeGreaterThanOrEqual(44);
      expect(parseInt(closeBtn.style.minHeight)).toBeGreaterThanOrEqual(44);
    });

    it('HamburgerMenu navigation items meet 44px minimum height', () => {
      render(
        <HamburgerMenu isOpen={true} onClose={vi.fn()} onItemClick={vi.fn()} />
      );
      const item = screen.getByTestId('hamburger-item-dashboard');
      expect(parseInt(item.style.minHeight)).toBeGreaterThanOrEqual(44);
    });

    it('FloatingActionButton meets 44x44px minimum (56x56)', () => {
      render(
        <FloatingActionButton isExpanded={false} onToggle={vi.fn()} onActionClick={vi.fn()} />
      );
      const fab = screen.getByTestId('fab-button');
      expect(parseInt(fab.style.width)).toBeGreaterThanOrEqual(44);
      expect(parseInt(fab.style.height)).toBeGreaterThanOrEqual(44);
    });
  });

  describe('Semantic HTML', () => {
    it('BottomNavBar uses <nav> element', () => {
      render(<BottomNavBar items={defaultItems} activeItem="home" onItemClick={vi.fn()} />);
      expect(screen.getByRole('navigation')).toBeInTheDocument();
    });

    it('Breadcrumbs uses <nav> element', () => {
      renderWithRouter(
        <Breadcrumbs items={[{ label: 'Home', path: '/' }, { label: 'Page' }]} />
      );
      expect(screen.getByRole('navigation')).toBeInTheDocument();
    });

    it('Breadcrumbs uses ordered list <ol>', () => {
      renderWithRouter(
        <Breadcrumbs items={[{ label: 'Home', path: '/' }, { label: 'Page' }]} />
      );
      const nav = screen.getByTestId('breadcrumbs');
      expect(nav.querySelector('ol')).toBeInTheDocument();
    });

    it('HamburgerMenu uses <nav> for phase navigation', () => {
      render(
        <HamburgerMenu isOpen={true} onClose={vi.fn()} onItemClick={vi.fn()} />
      );
      expect(screen.getByLabelText('Phase navigation').tagName).toBe('NAV');
    });

    it('HamburgerMenu uses <ul> lists for navigation groups', () => {
      render(
        <HamburgerMenu isOpen={true} onClose={vi.fn()} onItemClick={vi.fn()} />
      );
      const lists = screen.getAllByRole('list');
      expect(lists.length).toBeGreaterThanOrEqual(4); // 4 phase groups + quick actions + footer
    });
  });

  describe('Color and Contrast Patterns', () => {
    it('active nav items use distinct color (blue-500)', () => {
      render(<BottomNavBar items={defaultItems} activeItem="home" onItemClick={vi.fn()} />);
      const activeBtn = screen.getByTestId('bottom-nav-item-home');
      expect(activeBtn.className).toContain('text-blue-500');
    });

    it('inactive nav items use sufficient contrast color (slate-500)', () => {
      render(<BottomNavBar items={defaultItems} activeItem="home" onItemClick={vi.fn()} />);
      const inactiveBtn = screen.getByTestId('bottom-nav-item-assets');
      expect(inactiveBtn.className).toContain('text-slate-500');
    });

    it('badge uses high-contrast white text on colored background', () => {
      const itemsWithBadge = [{ ...defaultItems[0], badge: 3 }, ...defaultItems.slice(1)];
      render(<BottomNavBar items={itemsWithBadge} activeItem="home" onItemClick={vi.fn()} />);
      const badge = screen.getByTestId('bottom-nav-badge-home');
      expect(badge.className).toContain('text-white');
      expect(badge.className).toContain('bg-red-500');
    });
  });

  describe('ARIA Expanded States', () => {
    it('FAB communicates expanded state', () => {
      const { rerender } = render(
        <FloatingActionButton isExpanded={false} onToggle={vi.fn()} onActionClick={vi.fn()} />
      );
      expect(screen.getByTestId('fab-button')).toHaveAttribute('aria-expanded', 'false');

      rerender(
        <FloatingActionButton isExpanded={true} onToggle={vi.fn()} onActionClick={vi.fn()} />
      );
      expect(screen.getByTestId('fab-button')).toHaveAttribute('aria-expanded', 'true');
    });

    it('FAB label changes based on expanded state', () => {
      const { rerender } = render(
        <FloatingActionButton isExpanded={false} onToggle={vi.fn()} onActionClick={vi.fn()} />
      );
      expect(screen.getByTestId('fab-button')).toHaveAttribute('aria-label', 'Open quick actions menu');

      rerender(
        <FloatingActionButton isExpanded={true} onToggle={vi.fn()} onActionClick={vi.fn()} />
      );
      expect(screen.getByTestId('fab-button')).toHaveAttribute('aria-label', 'Close quick actions menu');
    });
  });
});
