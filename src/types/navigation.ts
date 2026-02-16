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


// Onboarding Wizard Types

export type WizardStep = 1 | 2 | 3 | 4 | 5;

export interface WizardState {
  currentStep: WizardStep;
  isOpen: boolean;
  isCompleted: boolean;
  estateProfile: EstateProfileData;
  probateStatus: ProbateStatusData;
  firstAsset: FirstAssetData;
}

export interface EstateProfileData {
  deceasedName: string;
  executorName: string;
  state: string;
  deathCertificateUploaded: boolean;
}

export interface ProbateStatusData {
  probateRequired: 'yes' | 'no' | 'unsure' | '';
  probateType: 'full' | 'small-estate' | '';
}

export interface FirstAssetData {
  assetName: string;
  institution: string;
  assetType: string;
}

export interface OnboardingWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
  onSkip: () => void;
  initialStep?: WizardStep;
}

export interface WizardStepProps {
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
}


// Guided Tour Types

export type TourId = 'dashboard' | 'asset-detail' | 'navigation';

export interface TourStep {
  /** CSS selector for the target element to highlight */
  target: string;
  /** Title shown in the tooltip */
  title: string;
  /** Description shown in the tooltip */
  description: string;
  /** Preferred placement of the tooltip relative to the target */
  placement?: 'top' | 'bottom' | 'left' | 'right';
}

export interface TourDefinition {
  id: TourId;
  name: string;
  description: string;
  steps: TourStep[];
}

export interface TourState {
  /** Which tour is currently active, or null if none */
  activeTour: TourId | null;
  /** Current step index within the active tour */
  currentStepIndex: number;
}

export interface TourCompletionRecord {
  /** Map of tour IDs to completion timestamps (ISO strings) */
  completedTours: Record<string, string>;
}

export interface GuidedTourProps {
  tour: TourDefinition;
  onComplete: () => void;
  onSkip: () => void;
}


// Contextual Help System Types

export interface HelpFAQItem {
  question: string;
  answer: string;
}

export interface HelpContent {
  id: string;
  title: string;
  description: string;
  tips: string[];
  faq: HelpFAQItem[];
  relatedLinks: { label: string; path: string }[];
}

export interface HelpPanelProps {
  isOpen: boolean;
  onClose: () => void;
  contextId: string;
}

export interface HelpIconProps {
  contextId: string;
  size?: 'sm' | 'md';
  className?: string;
}
