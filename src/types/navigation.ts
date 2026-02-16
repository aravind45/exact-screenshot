// Navigation type definitions

export type Phase = 'setup' | 'discovery' | 'settlement' | 'close';

export type NotificationType = 'urgent' | 'follow-up' | 'update';

export type BadgeType = 'urgent' | 'attention' | 'info';

export interface NavigationTooltipContent {
  title: string;
  description: string;
  example?: string;
  icon?: React.ComponentType<{ className?: string }>;
}

export interface NavigationItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
  badge?: number;
  badgeType?: BadgeType;
  tooltip?: string;
  tooltipContent?: NavigationTooltipContent;
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

export interface SearchResult {
  id: string;
  type: 'asset' | 'communication' | 'document' | 'page';
  title: string;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  url: string;
}

export interface QuickAction {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  action: () => void;
  shortcut?: string;
}

export interface BottomNavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
  badge?: number;
}

export interface BottomNavBarProps {
  items: BottomNavItem[];
  activeItem: string;
  onItemClick: (id: string) => void;
}

export interface FloatingActionButtonProps {
  isExpanded: boolean;
  onToggle: () => void;
  actions: QuickAction[];
  onActionClick: (action: QuickAction) => void;
}

export interface HamburgerMenuGroup {
  id: string;
  title: string;
  items: NavigationItem[];
}

export interface HamburgerMenuProps {
  isOpen: boolean;
  onClose: () => void;
  groups: HamburgerMenuGroup[];
  quickActions: NavigationItem[];
  footerItems: NavigationItem[];
  onItemClick: (item: NavigationItem) => void;
}
