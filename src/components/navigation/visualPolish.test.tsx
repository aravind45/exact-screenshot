import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Plus, MessageSquare, Upload } from 'lucide-react';
import type { QuickAction } from '@/types/navigation';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => {
      const { initial, animate, exit, transition, variants, whileTap, whileHover, custom, ...rest } = props;
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

// Mock react-router-dom useLocation for PageTransition
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
  };
});

import { PageTransition } from './PageTransition';
import { AsyncActionButton } from './AsyncActionButton';
import { FloatingActionButton } from './FloatingActionButton';
import { BottomNavBar } from './BottomNavBar';
import {
  HOVER_TRANSITION,
  EXPAND_TRANSITION,
  FAB_TRANSITION,
  PAGE_TRANSITION,
  TAP_SCALE,
  TOUCH_ACTIVE,
} from './animationConstants';

// ─── Animation Constants Tests ───

describe('animationConstants', () => {
  it('HOVER_TRANSITION has 150ms duration and easeOut', () => {
    expect(HOVER_TRANSITION.duration).toBe(0.15);
    expect(HOVER_TRANSITION.ease).toBe('easeOut');
  });

  it('EXPAND_TRANSITION has 200ms duration and easeInOut', () => {
    expect(EXPAND_TRANSITION.duration).toBe(0.2);
    expect(EXPAND_TRANSITION.ease).toBe('easeInOut');
  });

  it('FAB_TRANSITION has 300ms duration and cubic-bezier ease', () => {
    expect(FAB_TRANSITION.duration).toBe(0.3);
    expect(FAB_TRANSITION.ease).toEqual([0.4, 0, 0.2, 1]);
  });

  it('PAGE_TRANSITION has 200ms duration and easeInOut', () => {
    expect(PAGE_TRANSITION.duration).toBe(0.2);
    expect(PAGE_TRANSITION.ease).toBe('easeInOut');
  });

  it('TAP_SCALE scales down to 0.95', () => {
    expect(TAP_SCALE.scale).toBe(0.95);
  });

  it('TOUCH_ACTIVE scales down and reduces opacity', () => {
    expect(TOUCH_ACTIVE.scale).toBe(0.97);
    expect(TOUCH_ACTIVE.opacity).toBe(0.85);
  });
});

// ─── PageTransition Tests ───

describe('PageTransition', () => {
  it('renders children inside a transition wrapper', () => {
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <PageTransition>
          <div data-testid="page-content">Hello</div>
        </PageTransition>
      </MemoryRouter>
    );
    expect(screen.getByTestId('page-content')).toBeInTheDocument();
    expect(screen.getByTestId('page-transition')).toBeInTheDocument();
  });

  it('renders with slide mode by default', () => {
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <PageTransition>
          <p>Content</p>
        </PageTransition>
      </MemoryRouter>
    );
    expect(screen.getByTestId('page-transition')).toBeInTheDocument();
  });

  it('renders with fade mode when specified', () => {
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <PageTransition mode="fade">
          <p>Content</p>
        </PageTransition>
      </MemoryRouter>
    );
    expect(screen.getByTestId('page-transition')).toBeInTheDocument();
  });

  it('applies willChange style for performance', () => {
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <PageTransition>
          <p>Content</p>
        </PageTransition>
      </MemoryRouter>
    );
    const wrapper = screen.getByTestId('page-transition');
    expect(wrapper.style.willChange).toBe('transform, opacity');
  });
});

// ─── AsyncActionButton Tests ───

describe('AsyncActionButton', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders children in idle state', () => {
    render(
      <AsyncActionButton onClick={async () => {}} data-testid="async-btn">
        Save
      </AsyncActionButton>
    );
    expect(screen.getByText('Save')).toBeInTheDocument();
  });

  it('shows loading state during async action', async () => {
    let resolveAction: () => void;
    const action = new Promise<void>((resolve) => {
      resolveAction = resolve;
    });

    render(
      <AsyncActionButton onClick={() => action} data-testid="async-btn">
        Save
      </AsyncActionButton>
    );

    await act(async () => {
      fireEvent.click(screen.getByTestId('async-btn'));
    });

    expect(screen.getByTestId('async-btn-loading')).toBeInTheDocument();
    expect(screen.getByTestId('async-btn')).toHaveAttribute('aria-busy', 'true');

    await act(async () => {
      resolveAction!();
    });
  });

  it('shows success state after completion', async () => {
    render(
      <AsyncActionButton onClick={async () => {}} data-testid="async-btn">
        Save
      </AsyncActionButton>
    );

    await act(async () => {
      fireEvent.click(screen.getByTestId('async-btn'));
    });

    expect(screen.getByTestId('async-btn-success')).toBeInTheDocument();

    // Returns to idle after timeout
    act(() => {
      vi.advanceTimersByTime(1300);
    });

    expect(screen.getByText('Save')).toBeInTheDocument();
  });

  it('returns to idle on error', async () => {
    const failingAction = async () => {
      throw new Error('fail');
    };

    render(
      <AsyncActionButton onClick={failingAction} data-testid="async-btn">
        Save
      </AsyncActionButton>
    );

    await act(async () => {
      fireEvent.click(screen.getByTestId('async-btn'));
    });

    expect(screen.getByText('Save')).toBeInTheDocument();
  });

  it('is disabled during loading', async () => {
    let resolveAction: () => void;
    const action = new Promise<void>((resolve) => {
      resolveAction = resolve;
    });

    render(
      <AsyncActionButton onClick={() => action} data-testid="async-btn">
        Save
      </AsyncActionButton>
    );

    await act(async () => {
      fireEvent.click(screen.getByTestId('async-btn'));
    });

    expect(screen.getByTestId('async-btn')).toBeDisabled();

    await act(async () => {
      resolveAction!();
    });
  });

  it('skips success state when showSuccess is false', async () => {
    render(
      <AsyncActionButton onClick={async () => {}} data-testid="async-btn" showSuccess={false}>
        Save
      </AsyncActionButton>
    );

    await act(async () => {
      fireEvent.click(screen.getByTestId('async-btn'));
    });

    // Should go straight back to idle
    expect(screen.getByText('Save')).toBeInTheDocument();
  });
});

// ─── Hover & Touch Interaction Tests ───

describe('BottomNavBar touch interactions', () => {
  const mockOnItemClick = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('applies touch-action manipulation for fast taps', () => {
    render(
      <BottomNavBar
        items={[{ id: 'home', label: 'Home', icon: Plus, path: '/dashboard' }]}
        activeItem="home"
        onItemClick={mockOnItemClick}
      />
    );
    const list = screen.getByRole('list');
    expect(list.style.touchAction).toBe('manipulation');
  });

  it('non-active items have active state class for touch feedback', () => {
    render(
      <BottomNavBar
        items={[
          { id: 'home', label: 'Home', icon: Plus, path: '/dashboard' },
          { id: 'assets', label: 'Assets', icon: Plus, path: '/assets' },
        ]}
        activeItem="home"
        onItemClick={mockOnItemClick}
      />
    );
    // Non-active item should have active state class
    const assetsBtn = screen.getByTestId('bottom-nav-item-assets');
    expect(assetsBtn.className).toContain('active:bg-slate-100');
  });
});

describe('FloatingActionButton micro-interactions', () => {
  const testActions: QuickAction[] = [
    { id: 'add-asset', label: 'Add Asset', icon: Plus, action: vi.fn() },
    { id: 'log-comm', label: 'Log Communication', icon: MessageSquare, action: vi.fn() },
    { id: 'upload-doc', label: 'Upload Document', icon: Upload, action: vi.fn() },
  ];

  it('FAB button has active:bg-blue-700 for press feedback', () => {
    render(
      <FloatingActionButton
        isExpanded={false}
        onToggle={vi.fn()}
        actions={testActions}
        onActionClick={vi.fn()}
      />
    );
    const fab = screen.getByTestId('fab-button');
    expect(fab.className).toContain('active:bg-blue-700');
  });

  it('FAB button uses transition-all for smooth interactions', () => {
    render(
      <FloatingActionButton
        isExpanded={false}
        onToggle={vi.fn()}
        actions={testActions}
        onActionClick={vi.fn()}
      />
    );
    const fab = screen.getByTestId('fab-button');
    expect(fab.className).toContain('transition-all');
    expect(fab.className).toContain('duration-150');
    expect(fab.className).toContain('ease-out');
  });

  it('action items have touch-action manipulation', () => {
    render(
      <FloatingActionButton
        isExpanded={true}
        onToggle={vi.fn()}
        actions={testActions}
        onActionClick={vi.fn()}
      />
    );
    const actionBtn = screen.getByTestId('fab-action-add-asset');
    expect(actionBtn.style.touchAction).toBe('manipulation');
  });

  it('action items have hover:shadow-xl for depth effect', () => {
    render(
      <FloatingActionButton
        isExpanded={true}
        onToggle={vi.fn()}
        actions={testActions}
        onActionClick={vi.fn()}
      />
    );
    const actionBtn = screen.getByTestId('fab-action-add-asset');
    expect(actionBtn.className).toContain('hover:shadow-xl');
  });

  it('action items have active:bg-slate-100 for press feedback', () => {
    render(
      <FloatingActionButton
        isExpanded={true}
        onToggle={vi.fn()}
        actions={testActions}
        onActionClick={vi.fn()}
      />
    );
    const actionBtn = screen.getByTestId('fab-action-add-asset');
    expect(actionBtn.className).toContain('active:bg-slate-100');
  });
});

// ─── Animation Consistency Tests ───

describe('Animation consistency across components', () => {
  it('all interactive buttons use duration-150 ease-out pattern', () => {
    // This test validates the design spec: hover effects use 150ms ease-out
    // by checking the constants match the spec
    expect(HOVER_TRANSITION.duration).toBe(0.15); // 150ms
    expect(HOVER_TRANSITION.ease).toBe('easeOut');
  });

  it('page transitions use 200ms easeInOut per design spec', () => {
    expect(PAGE_TRANSITION.duration).toBe(0.2); // 200ms
    expect(PAGE_TRANSITION.ease).toBe('easeInOut');
  });

  it('expand/collapse uses 200ms easeInOut per design spec', () => {
    expect(EXPAND_TRANSITION.duration).toBe(0.2); // 200ms
    expect(EXPAND_TRANSITION.ease).toBe('easeInOut');
  });

  it('FAB uses 300ms cubic-bezier per design spec', () => {
    expect(FAB_TRANSITION.duration).toBe(0.3); // 300ms
    expect(FAB_TRANSITION.ease).toEqual([0.4, 0, 0.2, 1]);
  });
});
