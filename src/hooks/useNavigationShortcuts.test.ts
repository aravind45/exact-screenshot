import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { fireEvent } from '@testing-library/react';
import { useNavigationShortcuts } from './useNavigationShortcuts';

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

// Mock NavigationContext
const mockCloseQuickActions = vi.fn();
const mockCloseNotificationCenter = vi.fn();
const mockTogglePhase = vi.fn();

let mockState = {
  currentPhase: 'discovery' as const,
  currentPage: '/assets',
  expandedPhases: ['discovery'] as string[],
  recentItems: [],
  notifications: [],
  searchQuery: '',
  isQuickActionsOpen: false,
  isNotificationCenterOpen: false,
  unreadCount: 0,
};

vi.mock('@/contexts/NavigationContext', () => ({
  useNavigation: () => ({
    state: mockState,
    closeQuickActions: mockCloseQuickActions,
    closeNotificationCenter: mockCloseNotificationCenter,
    togglePhase: mockTogglePhase,
  }),
}));

describe('useNavigationShortcuts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockState = {
      currentPhase: 'discovery',
      currentPage: '/assets',
      expandedPhases: ['discovery'],
      recentItems: [],
      notifications: [],
      searchQuery: '',
      isQuickActionsOpen: false,
      isNotificationCenterOpen: false,
      unreadCount: 0,
    };
  });

  describe('Phase shortcuts (1-4)', () => {
    it('navigates to /dashboard on key 1 (Setup)', () => {
      renderHook(() => useNavigationShortcuts());
      fireEvent.keyDown(document, { key: '1' });
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });

    it('navigates to /assets on key 2 (Discovery)', () => {
      renderHook(() => useNavigationShortcuts());
      fireEvent.keyDown(document, { key: '2' });
      expect(mockNavigate).toHaveBeenCalledWith('/assets');
    });

    it('navigates to /roadmap on key 3 (Settlement)', () => {
      renderHook(() => useNavigationShortcuts());
      fireEvent.keyDown(document, { key: '3' });
      expect(mockNavigate).toHaveBeenCalledWith('/roadmap');
    });

    it('navigates to /distribution on key 4 (Close)', () => {
      renderHook(() => useNavigationShortcuts());
      fireEvent.keyDown(document, { key: '4' });
      expect(mockNavigate).toHaveBeenCalledWith('/distribution');
    });

    it('expands the target phase if not already expanded', () => {
      mockState.expandedPhases = [];
      renderHook(() => useNavigationShortcuts());
      fireEvent.keyDown(document, { key: '1' });
      expect(mockTogglePhase).toHaveBeenCalledWith('setup');
    });

    it('does not toggle phase if already expanded', () => {
      mockState.expandedPhases = ['setup'];
      renderHook(() => useNavigationShortcuts());
      fireEvent.keyDown(document, { key: '1' });
      expect(mockTogglePhase).not.toHaveBeenCalled();
    });

    it('does not fire phase shortcuts when typing in an input', () => {
      renderHook(() => useNavigationShortcuts());
      const input = document.createElement('input');
      input.type = 'text';
      document.body.appendChild(input);
      input.focus();

      fireEvent.keyDown(document, { key: '1' });
      expect(mockNavigate).not.toHaveBeenCalled();

      document.body.removeChild(input);
    });
  });

  describe('Cmd/Ctrl + / (Help)', () => {
    it('calls onOpenHelp when Cmd+/ is pressed', () => {
      const onOpenHelp = vi.fn();
      renderHook(() => useNavigationShortcuts({ onOpenHelp }));
      fireEvent.keyDown(document, { key: '/', metaKey: true });
      expect(onOpenHelp).toHaveBeenCalledTimes(1);
    });

    it('calls onOpenHelp when Ctrl+/ is pressed', () => {
      const onOpenHelp = vi.fn();
      renderHook(() => useNavigationShortcuts({ onOpenHelp }));
      fireEvent.keyDown(document, { key: '/', ctrlKey: true });
      expect(onOpenHelp).toHaveBeenCalledTimes(1);
    });

    it('does not call onOpenHelp on plain / key', () => {
      const onOpenHelp = vi.fn();
      renderHook(() => useNavigationShortcuts({ onOpenHelp }));
      fireEvent.keyDown(document, { key: '/' });
      expect(onOpenHelp).not.toHaveBeenCalled();
    });
  });

  describe('Escape (close menus)', () => {
    it('closes quick actions when Escape is pressed and quick actions is open', () => {
      mockState.isQuickActionsOpen = true;
      renderHook(() => useNavigationShortcuts());
      fireEvent.keyDown(document, { key: 'Escape' });
      expect(mockCloseQuickActions).toHaveBeenCalled();
    });

    it('closes notification center when Escape is pressed and it is open', () => {
      mockState.isNotificationCenterOpen = true;
      renderHook(() => useNavigationShortcuts());
      fireEvent.keyDown(document, { key: 'Escape' });
      expect(mockCloseNotificationCenter).toHaveBeenCalled();
    });

    it('does not call close functions when nothing is open', () => {
      renderHook(() => useNavigationShortcuts());
      fireEvent.keyDown(document, { key: 'Escape' });
      expect(mockCloseQuickActions).not.toHaveBeenCalled();
      expect(mockCloseNotificationCenter).not.toHaveBeenCalled();
    });
  });

  describe('enabled option', () => {
    it('does not register shortcuts when enabled is false', () => {
      renderHook(() => useNavigationShortcuts({ enabled: false }));
      fireEvent.keyDown(document, { key: '1' });
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });
});
