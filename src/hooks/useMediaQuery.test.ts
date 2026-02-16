import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useMediaQuery, getBreakpoint, BREAKPOINTS } from './useMediaQuery';

// Helper to mock matchMedia and window.innerWidth
function mockWindowWidth(width: number) {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width,
  });
}

type MatchMediaListener = (event: { matches: boolean }) => void;

function createMatchMediaMock() {
  const listeners: Map<string, MatchMediaListener[]> = new Map();

  const matchMediaMock = vi.fn((query: string) => {
    if (!listeners.has(query)) {
      listeners.set(query, []);
    }

    return {
      matches: evaluateQuery(query, window.innerWidth),
      media: query,
      onchange: null,
      addEventListener: vi.fn((_event: string, handler: MatchMediaListener) => {
        listeners.get(query)!.push(handler);
      }),
      removeEventListener: vi.fn((_event: string, handler: MatchMediaListener) => {
        const queryListeners = listeners.get(query)!;
        const idx = queryListeners.indexOf(handler);
        if (idx >= 0) queryListeners.splice(idx, 1);
      }),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    } as unknown as MediaQueryList;
  });

  function evaluateQuery(query: string, width: number): boolean {
    const maxMatch = query.match(/max-width:\s*(\d+)px/);
    const minMatch = query.match(/min-width:\s*(\d+)px/);
    const maxWidthMatch = query.match(/max-width:\s*(\d+)px/);

    if (maxMatch && minMatch && maxWidthMatch) {
      const min = parseInt(minMatch[1]);
      const max = parseInt(maxWidthMatch[1]);
      return width >= min && width <= max;
    }
    if (maxMatch) {
      return width <= parseInt(maxMatch[1]);
    }
    if (minMatch) {
      return width >= parseInt(minMatch[1]);
    }
    return false;
  }

  function simulateResize(newWidth: number) {
    mockWindowWidth(newWidth);
    // Fire all registered listeners
    listeners.forEach((handlers, query) => {
      const matches = evaluateQuery(query, newWidth);
      handlers.forEach((handler) => handler({ matches }));
    });
  }

  return { matchMediaMock, simulateResize };
}

describe('getBreakpoint', () => {
  it('returns "mobile" for widths below 768px', () => {
    expect(getBreakpoint(0)).toBe('mobile');
    expect(getBreakpoint(320)).toBe('mobile');
    expect(getBreakpoint(767)).toBe('mobile');
  });

  it('returns "tablet" for widths 768px to 1024px', () => {
    expect(getBreakpoint(768)).toBe('tablet');
    expect(getBreakpoint(900)).toBe('tablet');
    expect(getBreakpoint(1024)).toBe('tablet');
  });

  it('returns "desktop" for widths above 1024px', () => {
    expect(getBreakpoint(1025)).toBe('desktop');
    expect(getBreakpoint(1440)).toBe('desktop');
    expect(getBreakpoint(1920)).toBe('desktop');
  });
});

describe('useMediaQuery', () => {
  let matchMediaMock: ReturnType<typeof createMatchMediaMock>['matchMediaMock'];
  let simulateResize: ReturnType<typeof createMatchMediaMock>['simulateResize'];
  const originalMatchMedia = window.matchMedia;

  beforeEach(() => {
    const mock = createMatchMediaMock();
    matchMediaMock = mock.matchMediaMock;
    simulateResize = mock.simulateResize;
    window.matchMedia = matchMediaMock;
  });

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
  });

  it('returns "desktop" for desktop width', () => {
    mockWindowWidth(1200);
    const { result } = renderHook(() => useMediaQuery());
    expect(result.current).toBe('desktop');
  });

  it('returns "tablet" for tablet width', () => {
    mockWindowWidth(900);
    const { result } = renderHook(() => useMediaQuery());
    expect(result.current).toBe('tablet');
  });

  it('returns "mobile" for mobile width', () => {
    mockWindowWidth(500);
    const { result } = renderHook(() => useMediaQuery());
    expect(result.current).toBe('mobile');
  });

  it('updates when resizing from desktop to mobile', () => {
    mockWindowWidth(1200);
    const { result } = renderHook(() => useMediaQuery());
    expect(result.current).toBe('desktop');

    act(() => {
      simulateResize(500);
    });
    expect(result.current).toBe('mobile');
  });

  it('updates when resizing from mobile to tablet', () => {
    mockWindowWidth(500);
    const { result } = renderHook(() => useMediaQuery());
    expect(result.current).toBe('mobile');

    act(() => {
      simulateResize(900);
    });
    expect(result.current).toBe('tablet');
  });

  it('updates when resizing from tablet to desktop', () => {
    mockWindowWidth(900);
    const { result } = renderHook(() => useMediaQuery());
    expect(result.current).toBe('tablet');

    act(() => {
      simulateResize(1200);
    });
    expect(result.current).toBe('desktop');
  });

  it('handles rapid breakpoint transitions', () => {
    mockWindowWidth(1200);
    const { result } = renderHook(() => useMediaQuery());
    expect(result.current).toBe('desktop');

    act(() => {
      simulateResize(900);
    });
    expect(result.current).toBe('tablet');

    act(() => {
      simulateResize(500);
    });
    expect(result.current).toBe('mobile');

    act(() => {
      simulateResize(1200);
    });
    expect(result.current).toBe('desktop');
  });

  it('cleans up event listeners on unmount', () => {
    mockWindowWidth(1200);
    const { unmount } = renderHook(() => useMediaQuery());

    unmount();

    // matchMedia was called twice (mobile query + tablet query)
    expect(matchMediaMock).toHaveBeenCalledTimes(2);
    // Each returned object should have had removeEventListener called
    const calls = matchMediaMock.mock.results;
    calls.forEach((call) => {
      expect(call.value.removeEventListener).toHaveBeenCalledWith('change', expect.any(Function));
    });
  });

  it('returns correct breakpoint at exact boundary 768px', () => {
    mockWindowWidth(768);
    const { result } = renderHook(() => useMediaQuery());
    expect(result.current).toBe('tablet');
  });

  it('returns correct breakpoint at exact boundary 1024px', () => {
    mockWindowWidth(1024);
    const { result } = renderHook(() => useMediaQuery());
    expect(result.current).toBe('tablet');
  });

  it('returns correct breakpoint at 767px (just below tablet)', () => {
    mockWindowWidth(767);
    const { result } = renderHook(() => useMediaQuery());
    expect(result.current).toBe('mobile');
  });

  it('returns correct breakpoint at 1025px (just above tablet)', () => {
    mockWindowWidth(1025);
    const { result } = renderHook(() => useMediaQuery());
    expect(result.current).toBe('desktop');
  });
});
