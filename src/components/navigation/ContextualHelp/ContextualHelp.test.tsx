import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { HelpIcon } from './HelpIcon';
import { HelpPanel } from './HelpPanel';
import { useStuckDetection } from './useStuckDetection';
import {
  HELP_CONTENT,
  getHelpContent,
  getHelpContentIds,
} from './helpContent';
import { renderHook, act } from '@testing-library/react';

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => {
  const React = require('react');
  return {
    AnimatePresence: ({ children }: any) => <>{children}</>,
    motion: {
      div: React.forwardRef(({ children, initial, animate, exit, transition, ...props }: any, ref: any) => (
        <div ref={ref} {...props}>
          {children}
        </div>
      )),
    },
  };
});

// ─── HelpIcon Tests ───

describe('HelpIcon', () => {
  it('renders with correct test id', () => {
    render(<HelpIcon contextId="dashboard" />);
    expect(screen.getByTestId('help-icon-dashboard')).toBeInTheDocument();
  });

  it('has accessible aria-label', () => {
    render(<HelpIcon contextId="asset-inventory" />);
    const btn = screen.getByTestId('help-icon-asset-inventory');
    expect(btn).toHaveAttribute('aria-label', 'Help for asset inventory');
  });

  it('calls onClick with contextId when clicked', () => {
    const onClick = vi.fn();
    render(<HelpIcon contextId="dashboard" onClick={onClick} />);
    fireEvent.click(screen.getByTestId('help-icon-dashboard'));
    expect(onClick).toHaveBeenCalledWith('dashboard');
  });

  it('renders small size by default', () => {
    render(<HelpIcon contextId="dashboard" />);
    const btn = screen.getByTestId('help-icon-dashboard');
    expect(btn.className).toContain('h-6');
    expect(btn.className).toContain('w-6');
  });

  it('renders medium size when specified', () => {
    render(<HelpIcon contextId="dashboard" size="md" />);
    const btn = screen.getByTestId('help-icon-dashboard');
    expect(btn.className).toContain('h-7');
    expect(btn.className).toContain('w-7');
  });

  it('applies custom className', () => {
    render(<HelpIcon contextId="dashboard" className="ml-2" />);
    const btn = screen.getByTestId('help-icon-dashboard');
    expect(btn.className).toContain('ml-2');
  });

  it('does not call onClick when no handler provided', () => {
    render(<HelpIcon contextId="dashboard" />);
    // Should not throw
    fireEvent.click(screen.getByTestId('help-icon-dashboard'));
  });
});

// ─── HelpPanel Tests ───

describe('HelpPanel', () => {
  it('renders nothing when closed', () => {
    render(<HelpPanel isOpen={false} onClose={vi.fn()} contextId="dashboard" />);
    expect(screen.queryByTestId('help-panel')).not.toBeInTheDocument();
  });

  it('renders panel when open', () => {
    render(<HelpPanel isOpen={true} onClose={vi.fn()} contextId="dashboard" />);
    expect(screen.getByTestId('help-panel')).toBeInTheDocument();
  });

  it('displays correct title from help content', () => {
    render(<HelpPanel isOpen={true} onClose={vi.fn()} contextId="dashboard" />);
    expect(screen.getByText('Dashboard Overview')).toBeInTheDocument();
  });

  it('displays description', () => {
    render(<HelpPanel isOpen={true} onClose={vi.fn()} contextId="dashboard" />);
    expect(
      screen.getByText(/Your dashboard is the central hub/),
    ).toBeInTheDocument();
  });

  it('displays tips section', () => {
    render(<HelpPanel isOpen={true} onClose={vi.fn()} contextId="dashboard" />);
    expect(screen.getByText('Tips')).toBeInTheDocument();
    expect(
      screen.getByText(/Check the dashboard daily/),
    ).toBeInTheDocument();
  });

  it('displays FAQ section with questions', () => {
    render(<HelpPanel isOpen={true} onClose={vi.fn()} contextId="dashboard" />);
    expect(screen.getByText('Frequently Asked Questions')).toBeInTheDocument();
    expect(screen.getByText('What should I do first?')).toBeInTheDocument();
  });

  it('expands FAQ answer on click', () => {
    render(<HelpPanel isOpen={true} onClose={vi.fn()} contextId="dashboard" />);
    const question = screen.getByText('What should I do first?');
    fireEvent.click(question);
    expect(
      screen.getByText(/Start by completing your Estate Profile/),
    ).toBeInTheDocument();
  });

  it('displays related links', () => {
    render(<HelpPanel isOpen={true} onClose={vi.fn()} contextId="dashboard" />);
    expect(screen.getByText('Related')).toBeInTheDocument();
    expect(screen.getByText('Estate Profile')).toBeInTheDocument();
    expect(screen.getByText('Asset Inventory')).toBeInTheDocument();
  });

  it('calls onClose when close button clicked', () => {
    const onClose = vi.fn();
    render(<HelpPanel isOpen={true} onClose={onClose} contextId="dashboard" />);
    fireEvent.click(screen.getByTestId('help-panel-close'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when backdrop clicked', () => {
    const onClose = vi.fn();
    render(<HelpPanel isOpen={true} onClose={onClose} contextId="dashboard" />);
    fireEvent.click(screen.getByTestId('help-panel-backdrop'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose on Escape key', () => {
    const onClose = vi.fn();
    render(<HelpPanel isOpen={true} onClose={onClose} contextId="dashboard" />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('has role="dialog" and aria-modal', () => {
    render(<HelpPanel isOpen={true} onClose={vi.fn()} contextId="dashboard" />);
    const panel = screen.getByTestId('help-panel');
    expect(panel).toHaveAttribute('role', 'dialog');
    expect(panel).toHaveAttribute('aria-modal', 'true');
  });

  it('shows fallback when contextId has no content', () => {
    render(
      <HelpPanel isOpen={true} onClose={vi.fn()} contextId="nonexistent" />,
    );
    expect(
      screen.getByText('No help content available for this section.'),
    ).toBeInTheDocument();
  });

  it('renders different content for different contextIds', () => {
    const { rerender } = render(
      <HelpPanel isOpen={true} onClose={vi.fn()} contextId="dashboard" />,
    );
    expect(screen.getByText('Dashboard Overview')).toBeInTheDocument();

    rerender(
      <HelpPanel isOpen={true} onClose={vi.fn()} contextId="probate-hub" />,
    );
    expect(screen.getByText('Probate Hub')).toBeInTheDocument();
  });
});

// ─── Help Content Database Tests ───

describe('helpContent', () => {
  it('getHelpContent returns content for known ids', () => {
    const content = getHelpContent('dashboard');
    expect(content).toBeDefined();
    expect(content!.title).toBe('Dashboard Overview');
  });

  it('getHelpContent returns undefined for unknown ids', () => {
    expect(getHelpContent('nonexistent')).toBeUndefined();
  });

  it('getHelpContentIds returns all content keys', () => {
    const ids = getHelpContentIds();
    expect(ids.length).toBeGreaterThan(0);
    expect(ids).toContain('dashboard');
    expect(ids).toContain('probate-hub');
    expect(ids).toContain('asset-inventory');
  });

  it('all entries have required fields', () => {
    for (const [key, content] of Object.entries(HELP_CONTENT)) {
      expect(content.id).toBe(key);
      expect(content.title).toBeTruthy();
      expect(content.description).toBeTruthy();
      expect(Array.isArray(content.tips)).toBe(true);
      expect(content.tips.length).toBeGreaterThan(0);
      expect(Array.isArray(content.faq)).toBe(true);
      expect(content.faq.length).toBeGreaterThan(0);
      expect(Array.isArray(content.relatedLinks)).toBe(true);
      expect(content.relatedLinks.length).toBeGreaterThan(0);
    }
  });

  it('all FAQ items have question and answer', () => {
    for (const content of Object.values(HELP_CONTENT)) {
      for (const faq of content.faq) {
        expect(faq.question).toBeTruthy();
        expect(faq.answer).toBeTruthy();
      }
    }
  });

  it('all related links have label and path', () => {
    for (const content of Object.values(HELP_CONTENT)) {
      for (const link of content.relatedLinks) {
        expect(link.label).toBeTruthy();
        expect(link.path).toBeTruthy();
        expect(link.path.startsWith('/')).toBe(true);
      }
    }
  });

  it('covers all expected navigation sections', () => {
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
      expect(HELP_CONTENT[id]).toBeDefined();
    }
  });
});

// ─── useStuckDetection Tests ───

describe('useStuckDetection', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns isStuck=false on first visit', () => {
    const { result } = renderHook(() => useStuckDetection());
    expect(result.current.isStuck).toBe(false);
  });

  it('sets initial timestamp in localStorage on first visit', () => {
    renderHook(() => useStuckDetection());
    expect(localStorage.getItem('ee_last_activity_timestamp')).toBeTruthy();
  });

  it('returns isStuck=true when last activity exceeds threshold', () => {
    const thirtyOneMinutesAgo = Date.now() - 31 * 60 * 1000;
    localStorage.setItem(
      'ee_last_activity_timestamp',
      String(thirtyOneMinutesAgo),
    );

    const { result } = renderHook(() => useStuckDetection());
    expect(result.current.isStuck).toBe(true);
  });

  it('returns isStuck=false when last activity is within threshold', () => {
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
    localStorage.setItem(
      'ee_last_activity_timestamp',
      String(fiveMinutesAgo),
    );

    const { result } = renderHook(() => useStuckDetection());
    expect(result.current.isStuck).toBe(false);
  });

  it('supports custom threshold', () => {
    const twoMinutesAgo = Date.now() - 2 * 60 * 1000;
    localStorage.setItem(
      'ee_last_activity_timestamp',
      String(twoMinutesAgo),
    );

    const { result } = renderHook(() =>
      useStuckDetection({ thresholdMs: 60 * 1000 }),
    );
    expect(result.current.isStuck).toBe(true);
  });

  it('recordActivity resets stuck state', () => {
    const thirtyOneMinutesAgo = Date.now() - 31 * 60 * 1000;
    localStorage.setItem(
      'ee_last_activity_timestamp',
      String(thirtyOneMinutesAgo),
    );

    const { result } = renderHook(() => useStuckDetection());
    expect(result.current.isStuck).toBe(true);

    act(() => {
      result.current.recordActivity();
    });

    expect(result.current.isStuck).toBe(false);
  });

  it('dismiss hides stuck state', () => {
    const thirtyOneMinutesAgo = Date.now() - 31 * 60 * 1000;
    localStorage.setItem(
      'ee_last_activity_timestamp',
      String(thirtyOneMinutesAgo),
    );

    const { result } = renderHook(() => useStuckDetection());
    expect(result.current.isStuck).toBe(true);

    act(() => {
      result.current.dismiss();
    });

    expect(result.current.isStuck).toBe(false);
    expect(localStorage.getItem('ee_stuck_dismissed')).toBe('true');
  });

  it('dismissed state persists across re-renders', () => {
    const thirtyOneMinutesAgo = Date.now() - 31 * 60 * 1000;
    localStorage.setItem(
      'ee_last_activity_timestamp',
      String(thirtyOneMinutesAgo),
    );
    localStorage.setItem('ee_stuck_dismissed', 'true');

    const { result } = renderHook(() => useStuckDetection());
    expect(result.current.isStuck).toBe(false);
  });

  it('recordActivity clears dismissed flag', () => {
    localStorage.setItem('ee_stuck_dismissed', 'true');

    const { result } = renderHook(() => useStuckDetection());
    act(() => {
      result.current.recordActivity();
    });

    expect(localStorage.getItem('ee_stuck_dismissed')).toBeNull();
  });

  it('returns null lastActivityTimestamp when disabled', () => {
    const { result } = renderHook(() =>
      useStuckDetection({ enabled: false }),
    );
    expect(result.current.isStuck).toBe(false);
    expect(result.current.lastActivityTimestamp).toBeNull();
  });

  it('provides lastActivityTimestamp', () => {
    const now = Date.now();
    localStorage.setItem('ee_last_activity_timestamp', String(now));

    const { result } = renderHook(() => useStuckDetection());
    expect(result.current.lastActivityTimestamp).toBe(now);
  });
});
