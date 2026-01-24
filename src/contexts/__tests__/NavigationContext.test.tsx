import { renderHook, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { NavigationProvider, useNavigation } from '../NavigationContext';
import type { RecentItem } from '@/types/navigation';

// Wrapper component for tests
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>
    <NavigationProvider>{children}</NavigationProvider>
  </BrowserRouter>
);

describe('NavigationContext', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('useNavigation hook', () => {
    it('throws error when used outside provider', () => {
      // Suppress console.error for this test
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      expect(() => {
        renderHook(() => useNavigation());
      }).toThrow('useNavigation must be used within a NavigationProvider');
      
      consoleSpy.mockRestore();
    });

    it('returns navigation context when used within provider', () => {
      const { result } = renderHook(() => useNavigation(), { wrapper });
      
      expect(result.current).toBeDefined();
      expect(result.current.state).toBeDefined();
      expect(result.current.setCurrentPhase).toBeDefined();
    });
  });

  describe('Initial state', () => {
    it('initializes with default values', () => {
      const { result } = renderHook(() => useNavigation(), { wrapper });
      
      expect(result.current.state.currentPhase).toBe('setup');
      expect(result.current.state.expandedPhases).toContain('discovery');
      expect(result.current.state.recentItems).toEqual([]);
      expect(result.current.state.notifications).toEqual([]);
      expect(result.current.state.isQuickActionsOpen).toBe(false);
      expect(result.current.state.isNotificationCenterOpen).toBe(false);
    });

    it('loads persisted state from localStorage', () => {
      const persistedState = {
        expandedPhases: ['setup', 'settlement'],
        recentItems: [
          {
            id: '1',
            type: 'asset' as const,
            title: 'Test Asset',
            url: '/asset/1',
            timestamp: new Date(),
          },
        ],
      };
      
      localStorage.setItem('expectedestate_navigation_state', JSON.stringify(persistedState));
      
      const { result } = renderHook(() => useNavigation(), { wrapper });
      
      expect(result.current.state.expandedPhases).toEqual(['setup', 'settlement']);
      expect(result.current.state.recentItems).toHaveLength(1);
    });
  });

  describe('Phase management', () => {
    it('sets current phase', () => {
      const { result } = renderHook(() => useNavigation(), { wrapper });
      
      act(() => {
        result.current.setCurrentPhase('discovery');
      });
      
      expect(result.current.state.currentPhase).toBe('discovery');
    });

    it('toggles phase expansion', () => {
      const { result } = renderHook(() => useNavigation(), { wrapper });
      
      // Initial state has 'discovery' expanded, so 'setup' should not be in expandedPhases
      const initiallyHasSetup = result.current.state.expandedPhases.includes('setup');
      
      act(() => {
        result.current.togglePhase('setup');
      });
      
      // After toggle, setup should be in the opposite state
      if (initiallyHasSetup) {
        expect(result.current.state.expandedPhases).not.toContain('setup');
      } else {
        expect(result.current.state.expandedPhases).toContain('setup');
      }
      
      act(() => {
        result.current.togglePhase('setup');
      });
      
      // After second toggle, should be back to initial state
      if (initiallyHasSetup) {
        expect(result.current.state.expandedPhases).toContain('setup');
      } else {
        expect(result.current.state.expandedPhases).not.toContain('setup');
      }
    });

    it('persists expanded phases to localStorage', () => {
      const { result } = renderHook(() => useNavigation(), { wrapper });
      
      act(() => {
        result.current.togglePhase('settlement');
      });
      
      const stored = JSON.parse(localStorage.getItem('expectedestate_navigation_state') || '{}');
      expect(stored.expandedPhases).toContain('settlement');
    });
  });

  describe('Recent items', () => {
    it('adds recent item', () => {
      const { result } = renderHook(() => useNavigation(), { wrapper });
      
      const item: RecentItem = {
        id: '1',
        type: 'asset',
        title: 'Fidelity 401k',
        url: '/asset/1',
        timestamp: new Date(),
      };
      
      act(() => {
        result.current.addRecentItem(item);
      });
      
      expect(result.current.state.recentItems).toHaveLength(1);
      expect(result.current.state.recentItems[0]).toEqual(item);
    });

    it('removes duplicates when adding recent item', () => {
      const { result } = renderHook(() => useNavigation(), { wrapper });
      
      const item: RecentItem = {
        id: '1',
        type: 'asset',
        title: 'Fidelity 401k',
        url: '/asset/1',
        timestamp: new Date(),
      };
      
      act(() => {
        result.current.addRecentItem(item);
        result.current.addRecentItem(item);
      });
      
      expect(result.current.state.recentItems).toHaveLength(1);
    });

    it('keeps only last 5 recent items', () => {
      const { result } = renderHook(() => useNavigation(), { wrapper });
      
      act(() => {
        for (let i = 0; i < 7; i++) {
          result.current.addRecentItem({
            id: `${i}`,
            type: 'asset',
            title: `Asset ${i}`,
            url: `/asset/${i}`,
            timestamp: new Date(),
          });
        }
      });
      
      expect(result.current.state.recentItems).toHaveLength(5);
    });

    it('persists recent items to localStorage', () => {
      const { result } = renderHook(() => useNavigation(), { wrapper });
      
      const item: RecentItem = {
        id: '1',
        type: 'asset',
        title: 'Test',
        url: '/asset/1',
        timestamp: new Date(),
      };
      
      act(() => {
        result.current.addRecentItem(item);
      });
      
      const stored = JSON.parse(localStorage.getItem('expectedestate_navigation_state') || '{}');
      expect(stored.recentItems).toHaveLength(1);
    });
  });

  describe('Notifications', () => {
    it('marks notification as read', () => {
      const { result } = renderHook(() => useNavigation(), { wrapper });
      
      // Add a notification using the new method
      act(() => {
        result.current.addNotification({
          id: '1',
          type: 'urgent',
          title: 'Test',
          message: 'Test message',
          actionUrl: '/test',
          read: false,
          createdAt: new Date(),
        });
      });
      
      act(() => {
        result.current.markNotificationRead('1');
      });
      
      expect(result.current.state.notifications[0].read).toBe(true);
    });

    it('marks all notifications as read', () => {
      const { result } = renderHook(() => useNavigation(), { wrapper });
      
      // Add notifications using the new method
      act(() => {
        result.current.addNotification({
          id: '1',
          type: 'urgent',
          title: 'Test 1',
          message: 'Message 1',
          actionUrl: '/test1',
          read: false,
          createdAt: new Date(),
        });
        result.current.addNotification({
          id: '2',
          type: 'follow-up',
          title: 'Test 2',
          message: 'Message 2',
          actionUrl: '/test2',
          read: false,
          createdAt: new Date(),
        });
      });
      
      act(() => {
        result.current.markAllNotificationsRead();
      });
      
      expect(result.current.state.notifications.every(n => n.read)).toBe(true);
    });

    it('calculates unread count correctly', () => {
      const { result } = renderHook(() => useNavigation(), { wrapper });
      
      // Add notifications using the new method
      act(() => {
        result.current.addNotification({
          id: '1',
          type: 'urgent',
          title: 'Test 1',
          message: 'Message 1',
          actionUrl: '/test1',
          read: false,
          createdAt: new Date(),
        });
        result.current.addNotification({
          id: '2',
          type: 'follow-up',
          title: 'Test 2',
          message: 'Message 2',
          actionUrl: '/test2',
          read: true,
          createdAt: new Date(),
        });
      });
      
      expect(result.current.state.unreadCount).toBe(1);
    });
  });

  describe('Quick Actions', () => {
    it('opens quick actions', () => {
      const { result } = renderHook(() => useNavigation(), { wrapper });
      
      act(() => {
        result.current.openQuickActions();
      });
      
      expect(result.current.state.isQuickActionsOpen).toBe(true);
    });

    it('closes quick actions and clears search', () => {
      const { result } = renderHook(() => useNavigation(), { wrapper });
      
      act(() => {
        result.current.openQuickActions();
        result.current.setSearchQuery('test');
      });
      
      expect(result.current.state.searchQuery).toBe('test');
      
      act(() => {
        result.current.closeQuickActions();
      });
      
      expect(result.current.state.isQuickActionsOpen).toBe(false);
      expect(result.current.state.searchQuery).toBe('');
    });
  });

  describe('Notification Center', () => {
    it('opens notification center', () => {
      const { result } = renderHook(() => useNavigation(), { wrapper });
      
      act(() => {
        result.current.openNotificationCenter();
      });
      
      expect(result.current.state.isNotificationCenterOpen).toBe(true);
    });

    it('closes notification center', () => {
      const { result } = renderHook(() => useNavigation(), { wrapper });
      
      act(() => {
        result.current.openNotificationCenter();
        result.current.closeNotificationCenter();
      });
      
      expect(result.current.state.isNotificationCenterOpen).toBe(false);
    });
  });

  describe('Search', () => {
    it('sets search query', () => {
      const { result } = renderHook(() => useNavigation(), { wrapper });
      
      act(() => {
        result.current.setSearchQuery('fidelity');
      });
      
      expect(result.current.state.searchQuery).toBe('fidelity');
    });
  });
});
