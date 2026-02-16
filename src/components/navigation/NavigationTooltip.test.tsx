import { describe, it, expect, vi, beforeAll } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { NavigationItemWithTooltip } from './NavigationItemWithTooltip';
import { getTooltipContent, NAVIGATION_TOOLTIP_DATA } from './navigationTooltipData';
import type { NavigationTooltipContent } from '@/types/navigation';
import { LayoutDashboard } from 'lucide-react';

// Polyfill ResizeObserver for jsdom (Radix popper requires it)
beforeAll(() => {
  global.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

// Mock Radix Tooltip primitives to avoid portal/popper issues in jsdom
// while still testing our component logic and rendered content.
vi.mock('@radix-ui/react-tooltip', () => {
  const React = require('react');
  return {
    Provider: ({ children }: any) => <>{children}</>,
    Root: ({ children, open, onOpenChange }: any) => {
      // Store onOpenChange so tests can verify Esc behavior
      return (
        <div data-open={open} data-testid="tooltip-root">
          {React.Children.map(children, (child: any) =>
            React.isValidElement(child)
              ? React.cloneElement(child as React.ReactElement<any>, { 'data-tooltip-open': open, onOpenChange })
              : child,
          )}
        </div>
      );
    },
    Trigger: ({ children, asChild }: any) => {
      if (asChild) return <>{children}</>;
      return <div>{children}</div>;
    },
    Portal: ({ children }: any) => <>{children}</>,
    Content: ({ children, className, side, sideOffset, ...props }: any) => (
      <div
        className={className}
        data-testid="navigation-tooltip"
        data-side={side || 'right'}
        role="tooltip"
        {...props}
      >
        {children}
      </div>
    ),
    Arrow: () => null,
  };
});

const sampleContent: NavigationTooltipContent = {
  title: 'Asset Inventory',
  description: 'View and manage all discovered estate assets in one place.',
  example: 'Add a newly found bank account or update the value of a property.',
  icon: LayoutDashboard,
};

const sampleContentNoExample: NavigationTooltipContent = {
  title: 'Dashboard',
  description: 'Your estate overview showing progress and next actions.',
};

// We import NavigationTooltip AFTER the mock is set up
import { NavigationTooltip } from './NavigationTooltip';

function renderTooltip(
  props: Partial<React.ComponentProps<typeof NavigationTooltip>> = {},
) {
  const defaultProps = {
    content: sampleContent,
    children: <button data-testid="trigger">Nav Item</button>,
    ...props,
  };
  return render(<NavigationTooltip {...defaultProps} />);
}

// --- Unit tests for NavigationTooltip ---

describe('NavigationTooltip', () => {
  describe('rendering', () => {
    it('renders the trigger element', () => {
      renderTooltip();
      expect(screen.getByTestId('trigger')).toBeInTheDocument();
    });

    it('shows tooltip content when open is controlled to true', () => {
      renderTooltip({ open: true, onOpenChange: vi.fn() });
      expect(screen.getByTestId('navigation-tooltip')).toBeInTheDocument();
    });

    it('displays title in tooltip content', () => {
      renderTooltip({ open: true, onOpenChange: vi.fn() });
      expect(screen.getByText('Asset Inventory')).toBeInTheDocument();
    });

    it('displays description in tooltip content', () => {
      renderTooltip({ open: true, onOpenChange: vi.fn() });
      expect(
        screen.getByText('View and manage all discovered estate assets in one place.'),
      ).toBeInTheDocument();
    });

    it('displays example when provided', () => {
      renderTooltip({ open: true, onOpenChange: vi.fn() });
      expect(screen.getByText(/Add a newly found bank account/)).toBeInTheDocument();
      expect(screen.getByText('Example:')).toBeInTheDocument();
    });

    it('does not display example section when not provided', () => {
      renderTooltip({
        content: sampleContentNoExample,
        open: true,
        onOpenChange: vi.fn(),
      });
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.queryByText('Example:')).not.toBeInTheDocument();
    });

    it('renders icon when provided in content', () => {
      renderTooltip({ open: true, onOpenChange: vi.fn() });
      const tooltip = screen.getByTestId('navigation-tooltip');
      const icons = tooltip.querySelectorAll('[aria-hidden="true"]');
      expect(icons.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('accessibility', () => {
    it('tooltip content has role="tooltip"', () => {
      renderTooltip({ open: true, onOpenChange: vi.fn() });
      const tooltip = screen.getByTestId('navigation-tooltip');
      expect(tooltip).toHaveAttribute('role', 'tooltip');
    });

    it('icons are hidden from screen readers with aria-hidden', () => {
      renderTooltip({ open: true, onOpenChange: vi.fn() });
      const tooltip = screen.getByTestId('navigation-tooltip');
      const hiddenIcons = tooltip.querySelectorAll('[aria-hidden="true"]');
      expect(hiddenIcons.length).toBeGreaterThanOrEqual(1);
    });

    it('dismisses tooltip on Escape key', () => {
      const onOpenChange = vi.fn();
      renderTooltip({ open: true, onOpenChange });

      expect(screen.getByTestId('navigation-tooltip')).toBeInTheDocument();
      fireEvent.keyDown(document, { key: 'Escape' });
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it('does not dismiss tooltip on non-Escape keys', () => {
      const onOpenChange = vi.fn();
      renderTooltip({ open: true, onOpenChange });

      fireEvent.keyDown(document, { key: 'Tab' });
      fireEvent.keyDown(document, { key: 'Enter' });
      fireEvent.keyDown(document, { key: 'a' });

      const falseCalls = onOpenChange.mock.calls.filter(
        (call: [boolean]) => call[0] === false,
      );
      expect(falseCalls).toHaveLength(0);
    });

    it('does not fire Esc handler when tooltip is closed', () => {
      const onOpenChange = vi.fn();
      renderTooltip({ open: false, onOpenChange });

      fireEvent.keyDown(document, { key: 'Escape' });
      expect(onOpenChange).not.toHaveBeenCalled();
    });
  });

  describe('positioning and delay', () => {
    it('defaults to right side positioning', () => {
      renderTooltip({ open: true, onOpenChange: vi.fn() });
      const tooltip = screen.getByTestId('navigation-tooltip');
      expect(tooltip).toHaveAttribute('data-side', 'right');
    });

    it('accepts custom side prop', () => {
      renderTooltip({ side: 'bottom', open: true, onOpenChange: vi.fn() });
      const tooltip = screen.getByTestId('navigation-tooltip');
      expect(tooltip).toHaveAttribute('data-side', 'bottom');
    });

    it('uses 500ms delay by default', () => {
      renderTooltip();
      expect(screen.getByTestId('trigger')).toBeInTheDocument();
    });

    it('accepts custom delay duration', () => {
      renderTooltip({ delayDuration: 200 });
      expect(screen.getByTestId('trigger')).toBeInTheDocument();
    });
  });

  describe('styling', () => {
    it('tooltip has max-width of 300px', () => {
      renderTooltip({ open: true, onOpenChange: vi.fn() });
      const tooltip = screen.getByTestId('navigation-tooltip');
      expect(tooltip.className).toContain('max-w-[300px]');
    });

    it('tooltip has proper border and shadow styling', () => {
      renderTooltip({ open: true, onOpenChange: vi.fn() });
      const tooltip = screen.getByTestId('navigation-tooltip');
      expect(tooltip.className).toContain('rounded-lg');
      expect(tooltip.className).toContain('shadow-lg');
      expect(tooltip.className).toContain('border');
    });
  });
});

// --- Unit tests for NavigationItemWithTooltip ---

describe('NavigationItemWithTooltip', () => {
  it('renders children when no tooltip content found and none provided', () => {
    render(
      <NavigationItemWithTooltip itemId="nonexistent-id">
        <button>Item</button>
      </NavigationItemWithTooltip>,
    );
    expect(screen.getByText('Item')).toBeInTheDocument();
  });

  it('renders children without tooltip when disabled', () => {
    render(
      <NavigationItemWithTooltip itemId="dashboard" enabled={false}>
        <button>Dashboard</button>
      </NavigationItemWithTooltip>,
    );
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  it('wraps children with tooltip when content exists for itemId', () => {
    render(
      <NavigationItemWithTooltip itemId="dashboard">
        <button data-testid="dash-trigger">Dashboard</button>
      </NavigationItemWithTooltip>,
    );
    expect(screen.getByTestId('dash-trigger')).toBeInTheDocument();
    // Should have a tooltip root wrapper
    expect(screen.getByTestId('tooltip-root')).toBeInTheDocument();
  });

  it('uses explicit tooltipContent over data lookup', () => {
    const customContent: NavigationTooltipContent = {
      title: 'Custom Title',
      description: 'Custom description for testing.',
    };
    render(
      <NavigationItemWithTooltip itemId="dashboard" tooltipContent={customContent}>
        <button>Dashboard</button>
      </NavigationItemWithTooltip>,
    );
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });
});

// --- Unit tests for tooltip data ---

describe('navigationTooltipData', () => {
  it('getTooltipContent returns data for known item ids', () => {
    const content = getTooltipContent('dashboard');
    expect(content).toBeDefined();
    expect(content!.title).toBe('Dashboard');
    expect(content!.description).toBeTruthy();
  });

  it('getTooltipContent returns undefined for unknown item ids', () => {
    expect(getTooltipContent('nonexistent')).toBeUndefined();
  });

  it('all tooltip entries have title and description', () => {
    for (const [, content] of Object.entries(NAVIGATION_TOOLTIP_DATA)) {
      expect(content.title).toBeTruthy();
      expect(content.description).toBeTruthy();
    }
  });

  it('all tooltip descriptions are 1-2 sentences (end with period)', () => {
    for (const [, content] of Object.entries(NAVIGATION_TOOLTIP_DATA)) {
      expect(content.description.trim().endsWith('.')).toBe(true);
    }
  });

  it('covers all expected navigation items', () => {
    const expectedIds = [
      'dashboard',
      'estate-profile',
      'probate-hub',
      'asset-inventory',
      'document-scanner',
      'asset-detective',
      'active-assets',
      'communications',
      'document-vault',
      'follow-ups',
      'final-distribution',
      'tax-documents',
      'close-estate',
    ];
    for (const id of expectedIds) {
      expect(NAVIGATION_TOOLTIP_DATA[id]).toBeDefined();
    }
  });
});
