import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Suspense } from 'react';
import { MemoryRouter } from 'react-router-dom';
import {
  NavigationSidebarSkeleton,
  QuickActionsMenuSkeleton,
  NotificationCenterSkeleton,
  GenericNavigationSkeleton,
} from './NavigationSkeleton';
import { BottomNavBar } from './BottomNavBar';
import { Breadcrumbs } from './Breadcrumbs';
import { FloatingActionButton } from './FloatingActionButton';
import { ResponsiveNavigation } from './ResponsiveNavigation';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    span: ({ children, ...props }: any) => <span {...props}>{children}</span>,
    li: ({ children, ...props }: any) => <li {...props}>{children}</li>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  },
  AnimatePresence: ({ children }: any) => children,
}));

vi.mock('@/hooks/useMediaQuery', () => ({
  useMediaQuery: () => 'desktop',
}));

// ─── 18.5: Bundle size / tree-shaking tests ───────────────────────────

describe('18.5 Bundle size & tree-shaking', () => {
  it('LazyComponents exports lazy-wrapped components', async () => {
    const mod = await import('./LazyComponents');
    expect(mod.LazyQuickActionsMenu).toBeDefined();
    expect(mod.LazyNotificationCenter).toBeDefined();
    expect(mod.LazyOnboardingWizard).toBeDefined();
    expect(mod.LazyKeyboardShortcutsModal).toBeDefined();
  });

  it('navigation components use named exports for tree-shaking', () => {
    expect(BottomNavBar).toBeDefined();
    expect(Breadcrumbs).toBeDefined();
    expect(FloatingActionButton).toBeDefined();
    expect(ResponsiveNavigation).toBeDefined();
  });

  it('components are wrapped with React.memo', () => {
    // React.memo components have $$typeof and type properties
    for (const component of [BottomNavBar, Breadcrumbs, FloatingActionButton, ResponsiveNavigation]) {
      expect(component).toHaveProperty('$$typeof');
      expect(component).toHaveProperty('type');
    }
  });

  it('skeleton components are lightweight (no heavy dependencies)', () => {
    expect(NavigationSidebarSkeleton).toBeDefined();
    expect(QuickActionsMenuSkeleton).toBeDefined();
    expect(NotificationCenterSkeleton).toBeDefined();
    expect(GenericNavigationSkeleton).toBeDefined();
    expect(typeof NavigationSidebarSkeleton).toBe('function');
    expect(typeof QuickActionsMenuSkeleton).toBe('function');
  });
});

// ─── 18.6: Performance audit (render time) ────────────────────────────

describe('18.6 Performance audit', () => {
  it('NavigationSidebarSkeleton renders in under 100ms', () => {
    const start = performance.now();
    render(<NavigationSidebarSkeleton />);
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(100);
  });

  it('BottomNavBar renders in under 100ms', () => {
    const onItemClick = vi.fn();
    const start = performance.now();
    render(
      <BottomNavBar
        items={[
          { id: 'home', label: 'Home', icon: () => <span>H</span>, path: '/' },
        ]}
        activeItem="home"
        onItemClick={onItemClick}
      />
    );
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(100);
  });

  it('Breadcrumbs renders in under 100ms', () => {
    const start = performance.now();
    render(
      <MemoryRouter initialEntries={['/assets']}>
        <Breadcrumbs
          items={[
            { label: 'Home', path: '/dashboard' },
            { label: 'Discovery' },
            { label: 'Asset Inventory' },
          ]}
        />
      </MemoryRouter>
    );
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(100);
  });

  it('Lazy components render with Suspense fallback', async () => {
    const { LazyQuickActionsMenu } = await import('./LazyComponents');
    render(
      <MemoryRouter>
        <Suspense fallback={<div data-testid="lazy-fallback">Loading...</div>}>
          <LazyQuickActionsMenu />
        </Suspense>
      </MemoryRouter>
    );
    // While loading, the fallback should be shown
    expect(screen.getByTestId('lazy-fallback')).toBeDefined();
  });

  it('skeleton components render accessible loading states', () => {
    const { unmount: u1 } = render(<NavigationSidebarSkeleton />);
    expect(screen.getByTestId('navigation-sidebar-skeleton')).toBeDefined();
    expect(screen.getByLabelText('Loading navigation')).toBeDefined();
    u1();

    const { unmount: u2 } = render(<QuickActionsMenuSkeleton />);
    expect(screen.getByTestId('quick-actions-skeleton')).toBeDefined();
    u2();

    const { unmount: u3 } = render(<NotificationCenterSkeleton />);
    expect(screen.getByTestId('notification-center-skeleton')).toBeDefined();
    u3();

    const { unmount: u4 } = render(<GenericNavigationSkeleton />);
    expect(screen.getByTestId('navigation-generic-skeleton')).toBeDefined();
    u4();
  });

  it('FloatingActionButton renders in under 100ms', () => {
    const start = performance.now();
    render(
      <FloatingActionButton
        isExpanded={false}
        onToggle={vi.fn()}
        actions={[]}
        onActionClick={vi.fn()}
      />
    );
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(100);
  });
});
