import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BottomNavBar, defaultItems } from './BottomNavBar';
import type { BottomNavItem } from '@/types/navigation';
import { Home, BarChart3, Plus, ClipboardList, User } from 'lucide-react';

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    span: ({ children, layoutId, ...props }: any) => <span {...props}>{children}</span>,
    button: ({ children, whileTap, whileHover, ...props }: any) => <button {...props}>{children}</button>,
  },
  AnimatePresence: ({ children }: any) => children,
}));

const testItems: BottomNavItem[] = [
  { id: 'home', label: 'Home', icon: Home, path: '/dashboard' },
  { id: 'assets', label: 'Assets', icon: BarChart3, path: '/assets' },
  { id: 'add', label: 'Add', icon: Plus, path: '/add-asset' },
  { id: 'tasks', label: 'Tasks', icon: ClipboardList, path: '/tasks' },
  { id: 'more', label: 'More', icon: User, path: '/more' },
];

describe('BottomNavBar', () => {
  const mockOnItemClick = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders the navigation bar', () => {
      render(
        <BottomNavBar items={testItems} activeItem="home" onItemClick={mockOnItemClick} />
      );
      expect(screen.getByTestId('bottom-nav-bar')).toBeInTheDocument();
    });

    it('renders all 5 primary navigation items', () => {
      render(
        <BottomNavBar items={testItems} activeItem="home" onItemClick={mockOnItemClick} />
      );
      expect(screen.getByTestId('bottom-nav-item-home')).toBeInTheDocument();
      expect(screen.getByTestId('bottom-nav-item-assets')).toBeInTheDocument();
      expect(screen.getByTestId('bottom-nav-item-add')).toBeInTheDocument();
      expect(screen.getByTestId('bottom-nav-item-tasks')).toBeInTheDocument();
      expect(screen.getByTestId('bottom-nav-item-more')).toBeInTheDocument();
    });

    it('renders labels for all items', () => {
      render(
        <BottomNavBar items={testItems} activeItem="home" onItemClick={mockOnItemClick} />
      );
      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('Assets')).toBeInTheDocument();
      expect(screen.getByText('Add')).toBeInTheDocument();
      expect(screen.getByText('Tasks')).toBeInTheDocument();
      expect(screen.getByText('More')).toBeInTheDocument();
    });

    it('uses default items when none provided', () => {
      render(
        <BottomNavBar items={defaultItems} activeItem="home" onItemClick={mockOnItemClick} />
      );
      expect(screen.getAllByRole('listitem')).toHaveLength(5);
    });
  });

  describe('Active state indicators', () => {
    it('marks the active item with aria-current="page"', () => {
      render(
        <BottomNavBar items={testItems} activeItem="assets" onItemClick={mockOnItemClick} />
      );
      const activeButton = screen.getByTestId('bottom-nav-item-assets');
      expect(activeButton).toHaveAttribute('aria-current', 'page');
    });

    it('does not set aria-current on inactive items', () => {
      render(
        <BottomNavBar items={testItems} activeItem="home" onItemClick={mockOnItemClick} />
      );
      const inactiveButton = screen.getByTestId('bottom-nav-item-assets');
      expect(inactiveButton).not.toHaveAttribute('aria-current');
    });

    it('renders active indicator for the active item', () => {
      render(
        <BottomNavBar items={testItems} activeItem="tasks" onItemClick={mockOnItemClick} />
      );
      expect(screen.getByTestId('bottom-nav-indicator-tasks')).toBeInTheDocument();
    });

    it('does not render active indicator for inactive items', () => {
      render(
        <BottomNavBar items={testItems} activeItem="home" onItemClick={mockOnItemClick} />
      );
      expect(screen.queryByTestId('bottom-nav-indicator-assets')).not.toBeInTheDocument();
      expect(screen.queryByTestId('bottom-nav-indicator-tasks')).not.toBeInTheDocument();
    });

    it('applies active color class to active item', () => {
      render(
        <BottomNavBar items={testItems} activeItem="home" onItemClick={mockOnItemClick} />
      );
      const activeButton = screen.getByTestId('bottom-nav-item-home');
      expect(activeButton.className).toContain('text-blue-500');
    });

    it('applies inactive color class to non-active items', () => {
      render(
        <BottomNavBar items={testItems} activeItem="home" onItemClick={mockOnItemClick} />
      );
      const inactiveButton = screen.getByTestId('bottom-nav-item-assets');
      expect(inactiveButton.className).toContain('text-slate-500');
    });
  });

  describe('Interaction', () => {
    it('calls onItemClick with the item id when clicked', () => {
      render(
        <BottomNavBar items={testItems} activeItem="home" onItemClick={mockOnItemClick} />
      );
      fireEvent.click(screen.getByTestId('bottom-nav-item-assets'));
      expect(mockOnItemClick).toHaveBeenCalledWith('assets');
    });

    it('calls onItemClick for each item', () => {
      render(
        <BottomNavBar items={testItems} activeItem="home" onItemClick={mockOnItemClick} />
      );
      testItems.forEach((item) => {
        fireEvent.click(screen.getByTestId(`bottom-nav-item-${item.id}`));
      });
      expect(mockOnItemClick).toHaveBeenCalledTimes(5);
    });
  });

  describe('Badge support', () => {
    it('renders badge when item has a badge count', () => {
      const itemsWithBadge: BottomNavItem[] = [
        ...testItems.slice(0, 3),
        { ...testItems[3], badge: 5 },
        testItems[4],
      ];
      render(
        <BottomNavBar items={itemsWithBadge} activeItem="home" onItemClick={mockOnItemClick} />
      );
      expect(screen.getByTestId('bottom-nav-badge-tasks')).toBeInTheDocument();
      expect(screen.getByTestId('bottom-nav-badge-tasks')).toHaveTextContent('5');
    });

    it('does not render badge when count is 0', () => {
      const itemsWithZeroBadge: BottomNavItem[] = [
        ...testItems.slice(0, 3),
        { ...testItems[3], badge: 0 },
        testItems[4],
      ];
      render(
        <BottomNavBar items={itemsWithZeroBadge} activeItem="home" onItemClick={mockOnItemClick} />
      );
      expect(screen.queryByTestId('bottom-nav-badge-tasks')).not.toBeInTheDocument();
    });

    it('shows 99+ for badge counts over 99', () => {
      const itemsWithLargeBadge: BottomNavItem[] = [
        ...testItems.slice(0, 3),
        { ...testItems[3], badge: 150 },
        testItems[4],
      ];
      render(
        <BottomNavBar items={itemsWithLargeBadge} activeItem="home" onItemClick={mockOnItemClick} />
      );
      expect(screen.getByTestId('bottom-nav-badge-tasks')).toHaveTextContent('99+');
    });
  });

  describe('Accessibility', () => {
    it('has nav element with aria-label', () => {
      render(
        <BottomNavBar items={testItems} activeItem="home" onItemClick={mockOnItemClick} />
      );
      const nav = screen.getByRole('navigation');
      expect(nav).toHaveAttribute('aria-label', 'Mobile navigation');
    });

    it('each button has an aria-label', () => {
      render(
        <BottomNavBar items={testItems} activeItem="home" onItemClick={mockOnItemClick} />
      );
      testItems.forEach((item) => {
        const button = screen.getByTestId(`bottom-nav-item-${item.id}`);
        expect(button).toHaveAttribute('aria-label', item.label);
      });
    });

    it('badge has aria-label for notification count', () => {
      const itemsWithBadge: BottomNavItem[] = [
        ...testItems.slice(0, 3),
        { ...testItems[3], badge: 3 },
        testItems[4],
      ];
      render(
        <BottomNavBar items={itemsWithBadge} activeItem="home" onItemClick={mockOnItemClick} />
      );
      const badge = screen.getByTestId('bottom-nav-badge-tasks');
      expect(badge).toHaveAttribute('aria-label', '3 notifications');
    });

    it('renders a list with proper roles', () => {
      render(
        <BottomNavBar items={testItems} activeItem="home" onItemClick={mockOnItemClick} />
      );
      expect(screen.getByRole('list')).toBeInTheDocument();
      expect(screen.getAllByRole('listitem')).toHaveLength(5);
    });
  });

  describe('Touch-friendly sizing', () => {
    it('each nav button has minimum 44x44px touch target', () => {
      render(
        <BottomNavBar items={testItems} activeItem="home" onItemClick={mockOnItemClick} />
      );
      testItems.forEach((item) => {
        const button = screen.getByTestId(`bottom-nav-item-${item.id}`);
        const style = button.style;
        expect(parseInt(style.minWidth)).toBeGreaterThanOrEqual(44);
        expect(parseInt(style.minHeight)).toBeGreaterThanOrEqual(44);
      });
    });

    it('nav bar has fixed height of 64px', () => {
      render(
        <BottomNavBar items={testItems} activeItem="home" onItemClick={mockOnItemClick} />
      );
      const navBar = screen.getByTestId('bottom-nav-bar');
      expect(navBar.style.height).toBe('64px');
    });
  });

  describe('Responsive behavior', () => {
    it('has md:hidden class to hide on desktop', () => {
      render(
        <BottomNavBar items={testItems} activeItem="home" onItemClick={mockOnItemClick} />
      );
      const navBar = screen.getByTestId('bottom-nav-bar');
      expect(navBar.className).toContain('md:hidden');
    });

    it('has fixed positioning at bottom', () => {
      render(
        <BottomNavBar items={testItems} activeItem="home" onItemClick={mockOnItemClick} />
      );
      const navBar = screen.getByTestId('bottom-nav-bar');
      expect(navBar.className).toContain('fixed');
      expect(navBar.className).toContain('bottom-0');
    });

    it('items are evenly distributed with flex', () => {
      render(
        <BottomNavBar items={testItems} activeItem="home" onItemClick={mockOnItemClick} />
      );
      const listItems = screen.getAllByRole('listitem');
      listItems.forEach((li) => {
        expect(li.className).toContain('flex-1');
        expect(li.style.width).toBe('20%');
      });
    });

    it('icon size is 24x24px (w-6 h-6 class)', () => {
      render(
        <BottomNavBar items={testItems} activeItem="home" onItemClick={mockOnItemClick} />
      );
      // Each button contains an SVG icon with w-6 h-6 classes
      const navBar = screen.getByTestId('bottom-nav-bar');
      const svgs = navBar.querySelectorAll('svg');
      expect(svgs).toHaveLength(5);
      svgs.forEach((svg) => {
        expect(svg.classList.contains('w-6')).toBe(true);
        expect(svg.classList.contains('h-6')).toBe(true);
      });
    });

    it('label font size is 10px', () => {
      render(
        <BottomNavBar items={testItems} activeItem="home" onItemClick={mockOnItemClick} />
      );
      const label = screen.getByText('Home');
      expect(label.style.fontSize).toBe('10px');
    });
  });
});
