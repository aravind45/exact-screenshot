import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FloatingActionButton, defaultActions } from './FloatingActionButton';
import { Plus, MessageSquare, Upload } from 'lucide-react';
import type { QuickAction } from '@/types/navigation';

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => {
      const { initial, animate, exit, transition, ...rest } = props;
      return <div {...rest}>{children}</div>;
    },
    button: ({ children, ...props }: any) => {
      const { initial, animate, exit, transition, whileHover, whileTap, ...rest } = props;
      return <button {...rest}>{children}</button>;
    },
    span: ({ children, ...props }: any) => {
      const { initial, animate, exit, transition, ...rest } = props;
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

const testActions: QuickAction[] = [
  { id: 'add-asset', label: 'Add Asset', icon: Plus, action: vi.fn() },
  { id: 'log-communication', label: 'Log Communication', icon: MessageSquare, action: vi.fn() },
  { id: 'upload-document', label: 'Upload Document', icon: Upload, action: vi.fn() },
];

describe('FloatingActionButton', () => {
  const mockOnToggle = vi.fn();
  const mockOnActionClick = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders the FAB container', () => {
      render(
        <FloatingActionButton
          isExpanded={false}
          onToggle={mockOnToggle}
          actions={testActions}
          onActionClick={mockOnActionClick}
        />
      );
      expect(screen.getByTestId('fab-container')).toBeInTheDocument();
    });

    it('renders the FAB button', () => {
      render(
        <FloatingActionButton
          isExpanded={false}
          onToggle={mockOnToggle}
          actions={testActions}
          onActionClick={mockOnActionClick}
        />
      );
      expect(screen.getByTestId('fab-button')).toBeInTheDocument();
    });

    it('renders Plus icon inside the FAB button', () => {
      render(
        <FloatingActionButton
          isExpanded={false}
          onToggle={mockOnToggle}
          actions={testActions}
          onActionClick={mockOnActionClick}
        />
      );
      const fab = screen.getByTestId('fab-button');
      const svg = fab.querySelector('svg');
      expect(svg).toBeInTheDocument();
      expect(svg?.classList.contains('w-6')).toBe(true);
      expect(svg?.classList.contains('h-6')).toBe(true);
    });
  });

  describe('Expand/Collapse', () => {
    it('does not show menu when collapsed', () => {
      render(
        <FloatingActionButton
          isExpanded={false}
          onToggle={mockOnToggle}
          actions={testActions}
          onActionClick={mockOnActionClick}
        />
      );
      expect(screen.queryByTestId('fab-menu')).not.toBeInTheDocument();
    });

    it('shows menu when expanded', () => {
      render(
        <FloatingActionButton
          isExpanded={true}
          onToggle={mockOnToggle}
          actions={testActions}
          onActionClick={mockOnActionClick}
        />
      );
      expect(screen.getByTestId('fab-menu')).toBeInTheDocument();
    });

    it('calls onToggle when FAB button is clicked', () => {
      render(
        <FloatingActionButton
          isExpanded={false}
          onToggle={mockOnToggle}
          actions={testActions}
          onActionClick={mockOnActionClick}
        />
      );
      fireEvent.click(screen.getByTestId('fab-button'));
      expect(mockOnToggle).toHaveBeenCalledTimes(1);
    });

    it('shows backdrop when expanded', () => {
      render(
        <FloatingActionButton
          isExpanded={true}
          onToggle={mockOnToggle}
          actions={testActions}
          onActionClick={mockOnActionClick}
        />
      );
      expect(screen.getByTestId('fab-backdrop')).toBeInTheDocument();
    });

    it('does not show backdrop when collapsed', () => {
      render(
        <FloatingActionButton
          isExpanded={false}
          onToggle={mockOnToggle}
          actions={testActions}
          onActionClick={mockOnActionClick}
        />
      );
      expect(screen.queryByTestId('fab-backdrop')).not.toBeInTheDocument();
    });

    it('calls onToggle when backdrop is clicked', () => {
      render(
        <FloatingActionButton
          isExpanded={true}
          onToggle={mockOnToggle}
          actions={testActions}
          onActionClick={mockOnActionClick}
        />
      );
      fireEvent.click(screen.getByTestId('fab-backdrop'));
      expect(mockOnToggle).toHaveBeenCalledTimes(1);
    });
  });

  describe('Quick Add Menu', () => {
    it('renders all 3 action items when expanded', () => {
      render(
        <FloatingActionButton
          isExpanded={true}
          onToggle={mockOnToggle}
          actions={testActions}
          onActionClick={mockOnActionClick}
        />
      );
      expect(screen.getByTestId('fab-action-add-asset')).toBeInTheDocument();
      expect(screen.getByTestId('fab-action-log-communication')).toBeInTheDocument();
      expect(screen.getByTestId('fab-action-upload-document')).toBeInTheDocument();
    });

    it('renders action labels', () => {
      render(
        <FloatingActionButton
          isExpanded={true}
          onToggle={mockOnToggle}
          actions={testActions}
          onActionClick={mockOnActionClick}
        />
      );
      expect(screen.getByText('Add Asset')).toBeInTheDocument();
      expect(screen.getByText('Log Communication')).toBeInTheDocument();
      expect(screen.getByText('Upload Document')).toBeInTheDocument();
    });

    it('calls onActionClick with the correct action when clicked', () => {
      render(
        <FloatingActionButton
          isExpanded={true}
          onToggle={mockOnToggle}
          actions={testActions}
          onActionClick={mockOnActionClick}
        />
      );
      fireEvent.click(screen.getByTestId('fab-action-add-asset'));
      expect(mockOnActionClick).toHaveBeenCalledWith(testActions[0]);
    });

    it('calls onActionClick for each action item', () => {
      render(
        <FloatingActionButton
          isExpanded={true}
          onToggle={mockOnToggle}
          actions={testActions}
          onActionClick={mockOnActionClick}
        />
      );
      testActions.forEach((action) => {
        fireEvent.click(screen.getByTestId(`fab-action-${action.id}`));
      });
      expect(mockOnActionClick).toHaveBeenCalledTimes(3);
    });

    it('renders action item icons', () => {
      render(
        <FloatingActionButton
          isExpanded={true}
          onToggle={mockOnToggle}
          actions={testActions}
          onActionClick={mockOnActionClick}
        />
      );
      testActions.forEach((action) => {
        const button = screen.getByTestId(`fab-action-${action.id}`);
        const svg = button.querySelector('svg');
        expect(svg).toBeInTheDocument();
      });
    });
  });

  describe('Default Actions', () => {
    it('exports defaultActions with 3 items', () => {
      expect(defaultActions).toHaveLength(3);
    });

    it('default actions include Add Asset, Log Communication, Upload Document', () => {
      expect(defaultActions.map((a) => a.label)).toEqual([
        'Add Asset',
        'Log Communication',
        'Upload Document',
      ]);
    });
  });

  describe('Sizing & Positioning', () => {
    it('FAB button is 56x56px', () => {
      render(
        <FloatingActionButton
          isExpanded={false}
          onToggle={mockOnToggle}
          actions={testActions}
          onActionClick={mockOnActionClick}
        />
      );
      const fab = screen.getByTestId('fab-button');
      expect(fab.style.width).toBe('56px');
      expect(fab.style.height).toBe('56px');
    });

    it('FAB button has correct shadow', () => {
      render(
        <FloatingActionButton
          isExpanded={false}
          onToggle={mockOnToggle}
          actions={testActions}
          onActionClick={mockOnActionClick}
        />
      );
      const fab = screen.getByTestId('fab-button');
      expect(fab.style.boxShadow).toBe('0 4px 12px rgba(0,0,0,0.15)');
    });

    it('FAB container is hidden on desktop (md:hidden)', () => {
      render(
        <FloatingActionButton
          isExpanded={false}
          onToggle={mockOnToggle}
          actions={testActions}
          onActionClick={mockOnActionClick}
        />
      );
      const container = screen.getByTestId('fab-container');
      expect(container.className).toContain('md:hidden');
    });

    it('menu items have 48px height', () => {
      render(
        <FloatingActionButton
          isExpanded={true}
          onToggle={mockOnToggle}
          actions={testActions}
          onActionClick={mockOnActionClick}
        />
      );
      testActions.forEach((action) => {
        const button = screen.getByTestId(`fab-action-${action.id}`);
        expect(button.style.height).toBe('48px');
      });
    });
  });

  describe('Accessibility', () => {
    it('FAB button has aria-label when collapsed', () => {
      render(
        <FloatingActionButton
          isExpanded={false}
          onToggle={mockOnToggle}
          actions={testActions}
          onActionClick={mockOnActionClick}
        />
      );
      const fab = screen.getByTestId('fab-button');
      expect(fab).toHaveAttribute('aria-label', 'Open quick actions menu');
    });

    it('FAB button has aria-label when expanded', () => {
      render(
        <FloatingActionButton
          isExpanded={true}
          onToggle={mockOnToggle}
          actions={testActions}
          onActionClick={mockOnActionClick}
        />
      );
      const fab = screen.getByTestId('fab-button');
      expect(fab).toHaveAttribute('aria-label', 'Close quick actions menu');
    });

    it('FAB button has aria-expanded attribute', () => {
      const { rerender } = render(
        <FloatingActionButton
          isExpanded={false}
          onToggle={mockOnToggle}
          actions={testActions}
          onActionClick={mockOnActionClick}
        />
      );
      expect(screen.getByTestId('fab-button')).toHaveAttribute('aria-expanded', 'false');

      rerender(
        <FloatingActionButton
          isExpanded={true}
          onToggle={mockOnToggle}
          actions={testActions}
          onActionClick={mockOnActionClick}
        />
      );
      expect(screen.getByTestId('fab-button')).toHaveAttribute('aria-expanded', 'true');
    });

    it('FAB button has aria-haspopup', () => {
      render(
        <FloatingActionButton
          isExpanded={false}
          onToggle={mockOnToggle}
          actions={testActions}
          onActionClick={mockOnActionClick}
        />
      );
      expect(screen.getByTestId('fab-button')).toHaveAttribute('aria-haspopup', 'true');
    });

    it('each action button has aria-label', () => {
      render(
        <FloatingActionButton
          isExpanded={true}
          onToggle={mockOnToggle}
          actions={testActions}
          onActionClick={mockOnActionClick}
        />
      );
      testActions.forEach((action) => {
        const button = screen.getByTestId(`fab-action-${action.id}`);
        expect(button).toHaveAttribute('aria-label', action.label);
      });
    });

    it('backdrop has aria-hidden', () => {
      render(
        <FloatingActionButton
          isExpanded={true}
          onToggle={mockOnToggle}
          actions={testActions}
          onActionClick={mockOnActionClick}
        />
      );
      expect(screen.getByTestId('fab-backdrop')).toHaveAttribute('aria-hidden', 'true');
    });

    it('icons have aria-hidden', () => {
      render(
        <FloatingActionButton
          isExpanded={true}
          onToggle={mockOnToggle}
          actions={testActions}
          onActionClick={mockOnActionClick}
        />
      );
      const container = screen.getByTestId('fab-container');
      const svgs = container.querySelectorAll('svg');
      svgs.forEach((svg) => {
        expect(svg.getAttribute('aria-hidden')).toBe('true');
      });
    });

    it('menu uses semantic list structure', () => {
      render(
        <FloatingActionButton
          isExpanded={true}
          onToggle={mockOnToggle}
          actions={testActions}
          onActionClick={mockOnActionClick}
        />
      );
      const menu = screen.getByTestId('fab-menu');
      expect(menu.tagName).toBe('UL');
      expect(menu).toHaveAttribute('role', 'list');

      const items = menu.querySelectorAll('li');
      expect(items).toHaveLength(3);
    });
  });
});
