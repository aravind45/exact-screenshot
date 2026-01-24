import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import type {
  NavigationState,
  NavigationContextValue,
  Phase,
  RecentItem,
  PersistedNavigationState,
} from '@/types/navigation';

const STORAGE_KEY = 'expectedestate_navigation_state';

// Create context
const NavigationContext = createContext<NavigationContextValue | undefined>(undefined);

// Helper to get phase from path
function getPhaseFromPath(path: string): Phase {
  if (path.includes('/probate') || path.includes('/estate')) return 'setup';
  if (path.includes('/discovery') || path.includes('/upload') || path.includes('/add-asset')) return 'discovery';
  if (path.includes('/asset/') || path.includes('/settlement') || path.includes('/documents')) return 'settlement';
  if (path.includes('/close') || path.includes('/distribution')) return 'close';
  return 'setup'; // Default to setup
}

// Helper to load persisted state
function loadPersistedState(): Partial<PersistedNavigationState> {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Failed to load navigation state:', error);
  }
  return {};
}

// Helper to save persisted state
function savePersistedState(state: Partial<PersistedNavigationState>) {
  try {
    const existing = loadPersistedState();
    const updated = { ...existing, ...state };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Failed to save navigation state:', error);
  }
}

interface NavigationProviderProps {
  children: ReactNode;
}

export function NavigationProvider({ children }: NavigationProviderProps) {
  const location = useLocation();
  const persisted = loadPersistedState();

  // Initialize state
  const [state, setState] = useState<NavigationState>({
    currentPhase: getPhaseFromPath(location.pathname),
    currentPage: location.pathname,
    expandedPhases: persisted.expandedPhases || ['discovery'], // Default to discovery expanded
    recentItems: persisted.recentItems || [],
    notifications: [],
    searchQuery: '',
    isQuickActionsOpen: false,
    isNotificationCenterOpen: false,
    unreadCount: 0,
  });

  // Update current phase and page when location changes
  useEffect(() => {
    const newPhase = getPhaseFromPath(location.pathname);
    setState(prev => ({
      ...prev,
      currentPhase: newPhase,
      currentPage: location.pathname,
    }));

    // Auto-expand current phase
    setState(prev => {
      if (!prev.expandedPhases.includes(newPhase)) {
        const newExpanded = [...prev.expandedPhases, newPhase];
        savePersistedState({ expandedPhases: newExpanded });
        return { ...prev, expandedPhases: newExpanded };
      }
      return prev;
    });
  }, [location.pathname]);

  // Calculate unread count whenever notifications change
  useEffect(() => {
    const unread = state.notifications.filter(n => !n.read).length;
    setState(prev => ({ ...prev, unreadCount: unread }));
  }, [state.notifications]);

  // Methods
  const setCurrentPhase = useCallback((phase: Phase) => {
    setState(prev => ({ ...prev, currentPhase: phase }));
  }, []);

  const togglePhase = useCallback((phase: Phase) => {
    setState(prev => {
      const isExpanded = prev.expandedPhases.includes(phase);
      const newExpanded = isExpanded
        ? prev.expandedPhases.filter(p => p !== phase)
        : [...prev.expandedPhases, phase];
      
      savePersistedState({ expandedPhases: newExpanded });
      return { ...prev, expandedPhases: newExpanded };
    });
  }, []);

  const addRecentItem = useCallback((item: RecentItem) => {
    setState(prev => {
      // Remove duplicates and keep only last 5
      const filtered = prev.recentItems.filter(i => i.id !== item.id);
      const newRecent = [item, ...filtered].slice(0, 5);
      
      savePersistedState({ recentItems: newRecent });
      return { ...prev, recentItems: newRecent };
    });
  }, []);

  const markNotificationRead = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      notifications: prev.notifications.map(n =>
        n.id === id ? { ...n, read: true } : n
      ),
    }));
  }, []);

  const markAllNotificationsRead = useCallback(() => {
    setState(prev => ({
      ...prev,
      notifications: prev.notifications.map(n => ({ ...n, read: true })),
    }));
  }, []);

  const openQuickActions = useCallback(() => {
    setState(prev => ({ ...prev, isQuickActionsOpen: true }));
  }, []);

  const closeQuickActions = useCallback(() => {
    setState(prev => ({ ...prev, isQuickActionsOpen: false, searchQuery: '' }));
  }, []);

  const openNotificationCenter = useCallback(() => {
    setState(prev => ({ ...prev, isNotificationCenterOpen: true }));
  }, []);

  const closeNotificationCenter = useCallback(() => {
    setState(prev => ({ ...prev, isNotificationCenterOpen: false }));
  }, []);

  const setSearchQuery = useCallback((query: string) => {
    setState(prev => ({ ...prev, searchQuery: query }));
  }, []);

  const addNotification = useCallback((notification: NavigationState['notifications'][0]) => {
    setState(prev => ({
      ...prev,
      notifications: [...prev.notifications, notification],
    }));
  }, []);

  const value: NavigationContextValue = {
    state,
    setCurrentPhase,
    togglePhase,
    addRecentItem,
    markNotificationRead,
    markAllNotificationsRead,
    openQuickActions,
    closeQuickActions,
    openNotificationCenter,
    closeNotificationCenter,
    setSearchQuery,
    addNotification,
  };

  return (
    <NavigationContext.Provider value={value}>
      {children}
    </NavigationContext.Provider>
  );
}

// Custom hook to use navigation context
export function useNavigation() {
  const context = useContext(NavigationContext);
  if (context === undefined) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
}

// Custom hook to get current phase
export function useCurrentPhase(): Phase {
  const { state } = useNavigation();
  return state.currentPhase;
}
