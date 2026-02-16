import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { NavigationContextValue, NavigationState, Notification } from '@/types/navigation';
import { groupNotifications } from './NotificationCenter';

// Mock navigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

// Mock navigation context
const mockOpenNotificationCenter = vi.fn();
const mockCloseNotificationCenter = vi.fn();
const mockMarkNotificationRead = vi.fn();
const mockMarkAllNotificationsRead = vi.fn();

let mockState: NavigationState;

vi.mock('@/contexts/NavigationContext', () => ({
  useNavigation: () =>
    ({
      state: mockState,
      openNotificationCenter: mockOpenNotificationCenter,
      closeNotificationCenter: mockCloseNotificationCenter,
      markNotificationRead: mockMarkNotificationRead,
      markAllNotificationsRead: mockMarkAllNotificationsRead,
    }) as Partial<NavigationContextValue>,
}));

// Mock Radix Popover to avoid portal/positioning issues in jsdom
vi.mock('@/components/ui/popover', () => {
  return {
    Popover: ({ open, onOpenChange, children }: any) => (
      <div data-testid="popover-root" data-open={open}>
        {children}
      </div>
    ),
    PopoverTrigger: ({ children, asChild, ...props }: any) => {
      // When asChild, just render the child directly
      if (asChild) return <>{children}</>;
      return <div {...props}>{children}</div>;
    },
    PopoverContent: ({ children, className, ...props }: any) => {
      // Only render content when parent popover is open
      // We'll check via data attribute on parent
      return (
        <div className={className} {...props}>
          {children}
        </div>
      );
    },
  };
});

// Mock ScrollArea to just render children
vi.mock('@/components/ui/scroll-area', () => ({
  ScrollArea: ({ children, className, ...props }: any) => (
    <div className={className} {...props}>
      {children}
    </div>
  ),
}));

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  AnimatePresence: ({ children }: any) => <>{children}</>,
  motion: {
    div: ({ children, ...props }: any) => {
      // Filter out framer-motion specific props
      const {
        layout, initial, animate, exit, transition,
        whileHover, whileTap, variants, ...htmlProps
      } = props;
      return <div {...htmlProps}>{children}</div>;
    },
  },
}));

// Import component after mocks
import { NotificationCenter } from './NotificationCenter';

// --- Test data ---

function makeNotification(overrides: Partial<Notification> = {}): Notification {
  return {
    id: 'n-1',
    type: 'update',
    title: 'Asset status changed',
    message: 'Fidelity 401k moved to In Progress',
    actionUrl: '/asset/1',
    read: false,
    createdAt: new Date('2026-01-20T10:00:00Z'),
    ...overrides,
  };
}

const sampleNotifications: Notification[] = [
  makeNotification({
    id: 'urgent-1',
    type: 'urgent',
    title: 'Immediate attention needed',
    message: 'Chase checking has had no contact for 35 days',
    actionUrl: '/asset/chase-1',
    read: false,
    createdAt: new Date('2026-01-22T08:00:00Z'),
  }),
  makeNotification({
    id: 'followup-1',
    type: 'follow-up',
    title: 'Follow-up due',
    message: 'Fidelity 401k follow-up overdue by 3 days',
    actionUrl: '/asset/fidelity-1',
    read: false,
    createdAt: new Date('2026-01-21T09:00:00Z'),
  }),
  makeNotification({
    id: 'update-1',
    type: 'update',
    title: 'Document uploaded',
    message: 'Death certificate was uploaded successfully',
    actionUrl: '/documents/dc-1',
    read: true,
    createdAt: new Date('2026-01-20T14:00:00Z'),
  }),
  makeNotification({
    id: 'urgent-2',
    type: 'urgent',
    title: 'Court deadline approaching',
    message: 'Probate filing due in 5 days',
    actionUrl: '/probate',
    read: false,
    createdAt: new Date('2026-01-23T07:00:00Z'),
  }),
  makeNotification({
    id: 'update-2',
    type: 'update',
    title: 'Status changed',
    message: 'Bank of America savings approved',
    actionUrl: '/asset/boa-1',
    read: false,
    createdAt: new Date('2026-01-21T16:00:00Z'),
  }),
];

function createDefaultState(overrides: Partial<NavigationState> = {}): NavigationState {
  return {
    currentPhase: 'discovery',
    currentPage: '/dashboard',
    expandedPhases: ['discovery'],
    recentItems: [],
    notifications: [],
    searchQuery: '',
    isQuickActionsOpen: false,
    isNotificationCenterOpen: false,
    unreadCount: 0,
    ...overrides,
  };
}

function renderNotificationCenter(stateOverrides: Partial<NavigationState> = {}) {
  mockState = createDefaultState(stateOverrides);
  return render(
    <MemoryRouter>
      <NotificationCenter />
    </MemoryRouter>,
  );
}

// --- Tests ---

describe('NotificationCenter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Bell icon and badge', () => {
    it('renders bell button with accessible label', () => {
      renderNotificationCenter();
      const bell = screen.getByTestId('notification-bell');
      expect(bell).toBeInTheDocument();
      expect(bell).toHaveAttribute('aria-label', 'Notifications');
    });

    it('shows badge with unread count when there are unread notifications', () => {
      renderNotificationCenter({ unreadCount: 5 });
      const badge = screen.getByTestId('notification-badge');
      expect(badge).toHaveTextContent('5');
    });

    it('does not show badge when unread count is 0', () => {
      renderNotificationCenter({ unreadCount: 0 });
      expect(screen.queryByTestId('notification-badge')).not.toBeInTheDocument();
    });

    it('caps badge display at 99+', () => {
      renderNotificationCenter({ unreadCount: 150 });
      const badge = screen.getByTestId('notification-badge');
      expect(badge).toHaveTextContent('99+');
    });

    it('includes unread count in aria-label when there are unread notifications', () => {
      renderNotificationCenter({ unreadCount: 3 });
      const bell = screen.getByTestId('notification-bell');
      expect(bell).toHaveAttribute('aria-label', 'Notifications, 3 unread');
    });

    it('has aria-haspopup and aria-expanded attributes', () => {
      renderNotificationCenter({ isNotificationCenterOpen: true });
      const bell = screen.getByTestId('notification-bell');
      expect(bell).toHaveAttribute('aria-haspopup', 'true');
      expect(bell).toHaveAttribute('aria-expanded', 'true');
    });
  });

  describe('Dropdown panel', () => {
    it('renders notification panel with header', () => {
      renderNotificationCenter({ isNotificationCenterOpen: true });
      expect(screen.getByTestId('notification-panel')).toBeInTheDocument();
      expect(screen.getByText('Notifications')).toBeInTheDocument();
    });

    it('shows empty state when there are no notifications', () => {
      renderNotificationCenter({
        isNotificationCenterOpen: true,
        notifications: [],
      });
      expect(screen.getByTestId('empty-notifications')).toBeInTheDocument();
      expect(screen.getByText('No notifications')).toBeInTheDocument();
      expect(screen.getByText("You're all caught up!")).toBeInTheDocument();
    });

    it('does not show "Mark all as read" when unread count is 0', () => {
      renderNotificationCenter({
        isNotificationCenterOpen: true,
        notifications: [makeNotification({ read: true })],
        unreadCount: 0,
      });
      expect(screen.queryByTestId('mark-all-read')).not.toBeInTheDocument();
    });

    it('shows "Mark all as read" button when there are unread notifications', () => {
      renderNotificationCenter({
        isNotificationCenterOpen: true,
        notifications: sampleNotifications,
        unreadCount: 4,
      });
      expect(screen.getByTestId('mark-all-read')).toBeInTheDocument();
    });
  });

  describe('Notification grouping', () => {
    it('groups notifications by type: Urgent, Follow-ups, Updates', () => {
      renderNotificationCenter({
        isNotificationCenterOpen: true,
        notifications: sampleNotifications,
        unreadCount: 4,
      });
      expect(screen.getByTestId('notification-group-urgent')).toBeInTheDocument();
      expect(screen.getByTestId('notification-group-follow-up')).toBeInTheDocument();
      expect(screen.getByTestId('notification-group-update')).toBeInTheDocument();
    });

    it('does not render empty groups', () => {
      const onlyUrgent = sampleNotifications.filter((n) => n.type === 'urgent');
      renderNotificationCenter({
        isNotificationCenterOpen: true,
        notifications: onlyUrgent,
        unreadCount: 2,
      });
      expect(screen.getByTestId('notification-group-urgent')).toBeInTheDocument();
      expect(screen.queryByTestId('notification-group-follow-up')).not.toBeInTheDocument();
      expect(screen.queryByTestId('notification-group-update')).not.toBeInTheDocument();
    });

    it('shows group count in parentheses', () => {
      renderNotificationCenter({
        isNotificationCenterOpen: true,
        notifications: sampleNotifications,
        unreadCount: 4,
      });
      // Urgent group has 2 notifications
      const urgentGroup = screen.getByTestId('notification-group-urgent');
      expect(urgentGroup).toHaveTextContent('(2)');
    });
  });

  describe('Notification items', () => {
    it('renders notification title and message', () => {
      renderNotificationCenter({
        isNotificationCenterOpen: true,
        notifications: [sampleNotifications[0]],
        unreadCount: 1,
      });
      expect(screen.getByText('Immediate attention needed')).toBeInTheDocument();
      expect(screen.getByText('Chase checking has had no contact for 35 days')).toBeInTheDocument();
    });

    it('shows unread dot for unread notifications', () => {
      renderNotificationCenter({
        isNotificationCenterOpen: true,
        notifications: [makeNotification({ id: 'unread-1', read: false })],
        unreadCount: 1,
      });
      expect(screen.getByTestId('unread-dot-unread-1')).toBeInTheDocument();
    });

    it('does not show unread dot for read notifications', () => {
      renderNotificationCenter({
        isNotificationCenterOpen: true,
        notifications: [makeNotification({ id: 'read-1', read: true })],
        unreadCount: 0,
      });
      expect(screen.queryByTestId('unread-dot-read-1')).not.toBeInTheDocument();
    });
  });

  describe('Mark as read/unread', () => {
    it('calls markNotificationRead when toggle button is clicked', () => {
      renderNotificationCenter({
        isNotificationCenterOpen: true,
        notifications: [makeNotification({ id: 'n-toggle', read: false })],
        unreadCount: 1,
      });
      fireEvent.click(screen.getByTestId('toggle-read-n-toggle'));
      expect(mockMarkNotificationRead).toHaveBeenCalledWith('n-toggle');
    });

    it('calls markAllNotificationsRead when "Mark all as read" is clicked', () => {
      renderNotificationCenter({
        isNotificationCenterOpen: true,
        notifications: sampleNotifications,
        unreadCount: 4,
      });
      fireEvent.click(screen.getByTestId('mark-all-read'));
      expect(mockMarkAllNotificationsRead).toHaveBeenCalled();
    });

    it('does not navigate when toggle read button is clicked', () => {
      renderNotificationCenter({
        isNotificationCenterOpen: true,
        notifications: [makeNotification({ id: 'n-stop', read: false })],
        unreadCount: 1,
      });
      fireEvent.click(screen.getByTestId('toggle-read-n-stop'));
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  describe('Click-to-navigate', () => {
    it('navigates to actionUrl when notification is clicked', () => {
      renderNotificationCenter({
        isNotificationCenterOpen: true,
        notifications: [makeNotification({ id: 'nav-1', actionUrl: '/asset/123' })],
        unreadCount: 1,
      });
      fireEvent.click(screen.getByTestId('notification-nav-1'));
      expect(mockNavigate).toHaveBeenCalledWith('/asset/123');
    });

    it('marks notification as read when clicked', () => {
      renderNotificationCenter({
        isNotificationCenterOpen: true,
        notifications: [makeNotification({ id: 'nav-2', read: false })],
        unreadCount: 1,
      });
      fireEvent.click(screen.getByTestId('notification-nav-2'));
      expect(mockMarkNotificationRead).toHaveBeenCalledWith('nav-2');
    });

    it('closes notification center when notification is clicked', () => {
      renderNotificationCenter({
        isNotificationCenterOpen: true,
        notifications: [makeNotification({ id: 'nav-3' })],
        unreadCount: 1,
      });
      fireEvent.click(screen.getByTestId('notification-nav-3'));
      expect(mockCloseNotificationCenter).toHaveBeenCalled();
    });

    it('navigates on Enter key press', () => {
      renderNotificationCenter({
        isNotificationCenterOpen: true,
        notifications: [makeNotification({ id: 'key-1', actionUrl: '/asset/key' })],
        unreadCount: 1,
      });
      fireEvent.keyDown(screen.getByTestId('notification-key-1'), { key: 'Enter' });
      expect(mockNavigate).toHaveBeenCalledWith('/asset/key');
    });
  });
});

describe('groupNotifications', () => {
  it('returns empty array for empty input', () => {
    expect(groupNotifications([])).toEqual([]);
  });

  it('groups in priority order: urgent, follow-up, update', () => {
    const notifications: Notification[] = [
      makeNotification({ id: '1', type: 'update' }),
      makeNotification({ id: '2', type: 'urgent' }),
      makeNotification({ id: '3', type: 'follow-up' }),
    ];
    const groups = groupNotifications(notifications);
    expect(groups.map((g) => g.type)).toEqual(['urgent', 'follow-up', 'update']);
  });

  it('sorts within groups by createdAt descending', () => {
    const notifications: Notification[] = [
      makeNotification({ id: 'old', type: 'urgent', createdAt: new Date('2026-01-01') }),
      makeNotification({ id: 'new', type: 'urgent', createdAt: new Date('2026-01-20') }),
    ];
    const groups = groupNotifications(notifications);
    const urgentIds = groups[0].notifications.map((n) => n.id);
    expect(urgentIds).toEqual(['new', 'old']);
  });

  it('omits groups with no notifications', () => {
    const notifications: Notification[] = [
      makeNotification({ id: '1', type: 'follow-up' }),
    ];
    const groups = groupNotifications(notifications);
    expect(groups).toHaveLength(1);
    expect(groups[0].type).toBe('follow-up');
  });
});
