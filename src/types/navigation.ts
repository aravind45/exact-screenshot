// Navigation type definitions

export type Phase = 'setup' | 'discovery' | 'settlement' | 'close';

export type NotificationType = 'urgent' | 'follow-up' | 'update';

export type BadgeType = 'urgent' | 'attention' | 'info';

export interface NavigationItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
  badge?: number;
  badgeType?: BadgeType;
  tooltip?: string;
  isActive?: boolean;
}

export interface PhaseProgress {
  completed: boolean;
  percentage: number;
  pendingCount: number;
  completedCount: number;
  totalCount: number;
}

export interface RecentItem {
  id: string;
  type: 'asset' | 'communication' | 'document';
  title: string;
  url: string;
  timestamp: Date;
}

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  actionUrl: string;
  read: boolean;
  createdAt: Date;
  metadata?: {
    assetId?: string;
    assetName?: string;
    daysSinceContact?: number;
  };
}

export interface NavigationState {
  currentPhase: Phase;
  currentPage: string;
  expandedPhases: Phase[];
  recentItems: RecentItem[];
  notifications: Notification[];
  searchQuery: string;
  isQuickActionsOpen: boolean;
  isNotificationCenterOpen: boolean;
  unreadCount: number;
}

export interface NavigationContextValue {
  state: NavigationState;
  setCurrentPhase: (phase: Phase) => void;
  togglePhase: (phase: Phase) => void;
  addRecentItem: (item: RecentItem) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  openQuickActions: () => void;
  closeQuickActions: () => void;
  openNotificationCenter: () => void;
  closeNotificationCenter: () => void;
  setSearchQuery: (query: string) => void;
  addNotification: (notification: Notification) => void;
}

export interface PersistedNavigationState {
  expandedPhases: Phase[];
  collapsedSidebar: boolean;
  recentItems: RecentItem[];
  dismissedNotifications: string[];
}
