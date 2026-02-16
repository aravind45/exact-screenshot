import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import {
  Breadcrumbs,
  truncateLabel,
  generateBreadcrumbs,
  collapseItems,
  type BreadcrumbItem,
} from './Breadcrumbs';
import { Home } from 'lucide-react';

// Mock Radix Tooltip to avoid portal issues in jsdom
vi.mock('@/components/ui/tooltip', () => ({
  Tooltip: ({ children }: any) => <>{children}</>,
  TooltipTrigger: ({ children, asChild }: any) => {
    if (asChild) return <>{children}</>;
    return <div>{children}</div>;
  },
  TooltipContent: ({ children }: any) => <div data-testid="tooltip-content">{children}</div>,
}));

function renderBreadcrumbs(
  props: Partial<React.ComponentProps<typeof Breadcrumbs>> = {},
  initialPath: string = '/dashboard',
) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Breadcrumbs {...props} />
    </MemoryRouter>,
  );
}

// --- Pure function tests ---

describe('truncateLabel', () => {
  it('returns label unchanged when within max length', () => {
    expect(truncateLabel('Short label')).toBe('Short label');
  });

  it('truncates label exceeding max length with ellipsis', () => {
    const longLabel = 'A'.repeat(40);
    const result = truncateLabel(longLabel, 30);
    expect(result).toHaveLength(30);
    expect(result.endsWith('…')).toBe(true);
  });

  it('returns label unchanged when exactly at max length', () => {
    const label = 'A'.repeat(30);
    expect(truncateLabel(label, 30)).toBe(label);
  });

  it('uses default max length of 30', () => {
    const label = 'A'.repeat(31);
    const result = truncateLabel(label);
    expect(result).toHaveLength(30);
  });
});

describe('generateBreadcrumbs', () => {
  it('returns Home only (no path) for /dashboard', () => {
    const items = generateBreadcrumbs('/dashboard');
    expect(items).toHaveLength(1);
    expect(items[0].label).toBe('Home');
    expect(items[0].path).toBeUndefined();
  });

  it('returns Home only (no path) for root /', () => {
    const items = generateBreadcrumbs('/');
    expect(items).toHaveLength(1);
    expect(items[0].label).toBe('Home');
  });

  it('generates breadcrumbs for /assets with phase', () => {
    const items = generateBreadcrumbs('/assets');
    expect(items.length).toBeGreaterThanOrEqual(2);
    expect(items[0].label).toBe('Home');
    expect(items[0].path).toBe('/dashboard');
    // Phase segment
    const phaseItem = items.find((i) => i.label === 'Discovery');
    expect(phaseItem).toBeDefined();
    // Last item is current page with no path
    const last = items[items.length - 1];
    expect(last.label).toBe('Asset Inventory');
    expect(last.path).toBeUndefined();
  });

  it('generates breadcrumbs for nested route /asset/123', () => {
    const items = generateBreadcrumbs('/asset/123');
    expect(items[0].label).toBe('Home');
    // Last item should be the dynamic segment
    const last = items[items.length - 1];
    expect(last.path).toBeUndefined();
  });

  it('generates breadcrumbs for /probate/petition', () => {
    const items = generateBreadcrumbs('/probate/petition');
    expect(items[0].label).toBe('Home');
    const phaseItem = items.find((i) => i.label === 'Setup');
    expect(phaseItem).toBeDefined();
  });

  it('last item never has a path', () => {
    const items = generateBreadcrumbs('/documents');
    const last = items[items.length - 1];
    expect(last.path).toBeUndefined();
  });

  it('capitalizes unknown segments', () => {
    const items = generateBreadcrumbs('/some-unknown-page');
    const last = items[items.length - 1];
    expect(last.label).toBe('Some Unknown Page');
  });
});

describe('collapseItems', () => {
  const makeItems = (count: number): BreadcrumbItem[] =>
    Array.from({ length: count }, (_, i) => ({
      label: `Item ${i}`,
      path: i < count - 1 ? `/path-${i}` : undefined,
    }));

  it('returns all items when count <= maxItems', () => {
    const items = makeItems(3);
    const { visible, collapsed } = collapseItems(items, 4);
    expect(visible).toEqual(items);
    expect(collapsed).toHaveLength(0);
  });

  it('returns all items when count equals maxItems', () => {
    const items = makeItems(4);
    const { visible, collapsed } = collapseItems(items, 4);
    expect(visible).toEqual(items);
    expect(collapsed).toHaveLength(0);
  });

  it('collapses middle items when count > maxItems', () => {
    const items = makeItems(6);
    const { visible, collapsed } = collapseItems(items, 4);
    // Should show first + last two = 3 visible
    expect(visible).toHaveLength(3);
    expect(visible[0].label).toBe('Item 0');
    expect(visible[1].label).toBe('Item 4');
    expect(visible[2].label).toBe('Item 5');
    // Middle items collapsed
    expect(collapsed).toHaveLength(3);
    expect(collapsed[0].label).toBe('Item 1');
  });

  it('handles exactly maxItems + 1 items', () => {
    const items = makeItems(5);
    const { visible, collapsed } = collapseItems(items, 4);
    expect(visible).toHaveLength(3);
    expect(collapsed).toHaveLength(2);
  });
});

// --- Component rendering tests ---

describe('Breadcrumbs component', () => {
  it('renders nav element with aria-label', () => {
    renderBreadcrumbs({
      items: [{ label: 'Home', icon: Home }, { label: 'Assets' }],
    });
    const nav = screen.getByTestId('breadcrumbs');
    expect(nav).toBeInTheDocument();
    expect(nav.tagName).toBe('NAV');
    expect(nav).toHaveAttribute('aria-label', 'Breadcrumb');
  });

  it('renders semantic ol/li structure', () => {
    renderBreadcrumbs({
      items: [
        { label: 'Home', path: '/dashboard', icon: Home },
        { label: 'Assets' },
      ],
    });
    const nav = screen.getByTestId('breadcrumbs');
    const ol = nav.querySelector('ol');
    expect(ol).toBeInTheDocument();
    const lis = nav.querySelectorAll('li');
    expect(lis.length).toBe(2);
  });

  it('renders clickable links for non-last items with paths', () => {
    renderBreadcrumbs({
      items: [
        { label: 'Home', path: '/dashboard' },
        { label: 'Discovery', path: '/discovery' },
        { label: 'Asset Inventory' },
      ],
    });
    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(2);
    expect(links[0]).toHaveAttribute('href', '/dashboard');
    expect(links[1]).toHaveAttribute('href', '/discovery');
  });

  it('renders last item as non-clickable with aria-current="page"', () => {
    renderBreadcrumbs({
      items: [
        { label: 'Home', path: '/dashboard' },
        { label: 'Current Page' },
      ],
    });
    const currentPage = screen.getByText('Current Page');
    const span = currentPage.closest('[aria-current="page"]');
    expect(span).toBeInTheDocument();
  });

  it('renders ChevronRight separators between items', () => {
    renderBreadcrumbs({
      items: [
        { label: 'Home', path: '/dashboard' },
        { label: 'Assets', path: '/assets' },
        { label: 'Detail' },
      ],
    });
    // Separators are aria-hidden SVGs
    const nav = screen.getByTestId('breadcrumbs');
    const separators = nav.querySelectorAll('[aria-hidden="true"]');
    expect(separators.length).toBeGreaterThanOrEqual(2);
  });

  it('renders custom separator when provided', () => {
    renderBreadcrumbs({
      items: [
        { label: 'Home', path: '/dashboard' },
        { label: 'Page' },
      ],
      separator: <span data-testid="custom-sep">/</span>,
    });
    expect(screen.getByTestId('custom-sep')).toBeInTheDocument();
  });

  it('shows collapsed indicator when items exceed maxItems', () => {
    renderBreadcrumbs({
      items: [
        { label: 'Home', path: '/dashboard' },
        { label: 'Phase', path: '/phase' },
        { label: 'Section', path: '/section' },
        { label: 'Subsection', path: '/subsection' },
        { label: 'Current Page' },
      ],
      maxItems: 4,
    });
    expect(screen.getByTestId('breadcrumb-collapsed')).toBeInTheDocument();
  });

  it('does not show collapsed indicator when items within maxItems', () => {
    renderBreadcrumbs({
      items: [
        { label: 'Home', path: '/dashboard' },
        { label: 'Assets', path: '/assets' },
        { label: 'Detail' },
      ],
      maxItems: 4,
    });
    expect(screen.queryByTestId('breadcrumb-collapsed')).not.toBeInTheDocument();
  });

  it('shows truncation indicator for long labels', () => {
    const longLabel = 'A'.repeat(40);
    renderBreadcrumbs({
      items: [
        { label: 'Home', path: '/dashboard' },
        { label: longLabel },
      ],
    });
    expect(screen.getByTestId('breadcrumb-truncated')).toBeInTheDocument();
  });

  it('auto-generates breadcrumbs from route when no items prop', () => {
    renderBreadcrumbs({}, '/assets');
    const nav = screen.getByTestId('breadcrumbs');
    expect(nav).toBeInTheDocument();
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Asset Inventory')).toBeInTheDocument();
  });

  it('returns null when no visible items', () => {
    const { container } = renderBreadcrumbs({ items: [] });
    expect(container.querySelector('nav')).not.toBeInTheDocument();
  });

  it('renders items with icons', () => {
    renderBreadcrumbs({
      items: [
        { label: 'Home', path: '/dashboard', icon: Home },
        { label: 'Page' },
      ],
    });
    // The Home icon should be rendered as an SVG
    const nav = screen.getByTestId('breadcrumbs');
    const svgs = nav.querySelectorAll('svg');
    expect(svgs.length).toBeGreaterThanOrEqual(1);
  });
});
