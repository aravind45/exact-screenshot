import { useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, AlertTriangle, Clock, Info, Check, CheckCheck } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNavigation } from '@/contexts/NavigationContext';
import type { Notification, NotificationType } from '@/types/navigation';
import { formatDistanceToNow } from 'date-fns';

/** Group notifications by type in priority order: urgent → follow-up → update */
export function groupNotifications(
  notifications: Notification[],
): { type: NotificationType; label: string; notifications: Notification[] }[] {
  const groups: { type: NotificationType; label: string; notifications: Notification[] }[] = [
    { type: 'urgent', label: 'Urgent', notifications: [] },
    { type: 'follow-up', label: 'Follow-ups', notifications: [] },
    { type: 'update', label: 'Updates', notifications: [] },
  ];

  for (const n of notifications) {
    const group = groups.find((g) => g.type === n.type);
    if (group) group.notifications.push(n);
  }

  // Sort each group by createdAt descending (newest first)
  for (const group of groups) {
    group.notifications.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }

  // Only return groups that have notifications
  return groups.filter((g) => g.notifications.length > 0);
}

const TYPE_CONFIG: Record<
  NotificationType,
  {
    icon: React.ComponentType<{ className?: string }>;
    badgeClass: string;
    dotClass: string;
    headerClass: string;
  }
> = {
  urgent: {
    icon: AlertTriangle,
    badgeClass: 'bg-red-500',
    dotClass: 'bg-red-500',
    headerClass: 'text-red-600',
  },
  'follow-up': {
    icon: Clock,
    badgeClass: 'bg-amber-500',
    dotClass: 'bg-amber-500',
    headerClass: 'text-amber-600',
  },
  update: {
    icon: Info,
    badgeClass: 'bg-blue-500',
    dotClass: 'bg-blue-500',
    headerClass: 'text-blue-600',
  },
};

function NotificationItem({
  notification,
  onNavigate,
  onToggleRead,
}: {
  notification: Notification;
  onNavigate: (notification: Notification) => void;
  onToggleRead: (id: string) => void;
}) {
  const config = TYPE_CONFIG[notification.type];
  const Icon = config.icon;
  const timeAgo = formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true });

  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.15 }}
      style={{ willChange: 'transform, opacity' }}
      className={`group flex items-start gap-3 px-3 py-2.5 cursor-pointer rounded-md transition-colors hover:bg-slate-50 ${
        !notification.read ? 'bg-blue-50/50' : ''
      }`}
      data-testid={`notification-${notification.id}`}
      onClick={() => onNavigate(notification)}
      role="button"
      tabIndex={0}
      aria-label={`${notification.read ? '' : 'Unread: '}${notification.title}. ${notification.message}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onNavigate(notification);
        }
      }}
    >
      {/* Unread dot indicator */}
      <div className="mt-2 shrink-0 w-2">
        {!notification.read && (
          <span
            className="block h-2 w-2 rounded-full bg-blue-500"
            data-testid={`unread-dot-${notification.id}`}
            aria-hidden="true"
          />
        )}
      </div>

      {/* Type icon */}
      <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${config.headerClass}`} aria-hidden="true" />

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm leading-tight ${!notification.read ? 'font-semibold text-slate-900' : 'font-medium text-slate-700'}`}>
          {notification.title}
        </p>
        <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{notification.message}</p>
        <p className="text-xs text-slate-400 mt-1">{timeAgo}</p>
      </div>

      {/* Mark read/unread button */}
      <button
        className="mt-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-slate-200"
        onClick={(e) => {
          e.stopPropagation();
          onToggleRead(notification.id);
        }}
        aria-label={notification.read ? 'Mark as unread' : 'Mark as read'}
        data-testid={`toggle-read-${notification.id}`}
      >
        {notification.read ? (
          <Bell className="h-3.5 w-3.5 text-slate-400" />
        ) : (
          <Check className="h-3.5 w-3.5 text-blue-500" />
        )}
      </button>
    </motion.div>
  );
}

function NotificationGroup({
  type,
  label,
  notifications,
  onNavigate,
  onToggleRead,
}: {
  type: NotificationType;
  label: string;
  notifications: Notification[];
  onNavigate: (notification: Notification) => void;
  onToggleRead: (id: string) => void;
}) {
  const config = TYPE_CONFIG[type];

  return (
    <div data-testid={`notification-group-${type}`}>
      <div className="flex items-center gap-2 px-3 py-2">
        <span className={`inline-block h-2 w-2 rounded-full ${config.dotClass}`} aria-hidden="true" />
        <h3 className={`text-xs font-bold uppercase tracking-wider ${config.headerClass}`}>
          {label}
        </h3>
        <span className="text-xs text-slate-400">({notifications.length})</span>
      </div>
      <AnimatePresence mode="popLayout">
        {notifications.map((n) => (
          <NotificationItem
            key={n.id}
            notification={n}
            onNavigate={onNavigate}
            onToggleRead={onToggleRead}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

export function NotificationCenter() {
  const {
    state,
    openNotificationCenter,
    closeNotificationCenter,
    markNotificationRead,
    markAllNotificationsRead,
  } = useNavigation();

  const { notifications, unreadCount, isNotificationCenterOpen } = state;
  const navigate = useNavigate();

  const grouped = useMemo(() => groupNotifications(notifications), [notifications]);

  const handleNavigate = useCallback(
    (notification: Notification) => {
      markNotificationRead(notification.id);
      closeNotificationCenter();
      navigate(notification.actionUrl);
    },
    [markNotificationRead, closeNotificationCenter, navigate],
  );

  const handleToggleRead = useCallback(
    (id: string) => {
      // The context only has markNotificationRead (sets read=true).
      // For toggle, we call it — if already read, this is a no-op from context perspective.
      // A full toggle would need a toggleNotificationRead in context; for now we mark as read.
      markNotificationRead(id);
    },
    [markNotificationRead],
  );

  return (
    <Popover
      open={isNotificationCenterOpen}
      onOpenChange={(open) => {
        if (open) openNotificationCenter();
        else closeNotificationCenter();
      }}
    >
      <PopoverTrigger asChild>
        <button
          className="relative p-2 rounded-md hover:bg-slate-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
          aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
          aria-haspopup="true"
          aria-expanded={isNotificationCenterOpen}
          data-testid="notification-bell"
        >
          <Bell className="h-5 w-5 text-slate-600" />
          {unreadCount > 0 && (
            <span
              className="absolute -top-0.5 -right-0.5 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-red-500 px-1 text-[11px] font-bold text-white"
              data-testid="notification-badge"
              aria-hidden="true"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
          {/* Screen reader live region for unread count */}
          <span className="sr-only" aria-live="polite">
            {unreadCount > 0 ? `${unreadCount} unread notifications` : 'No unread notifications'}
          </span>
        </button>
      </PopoverTrigger>

      <PopoverContent
        className="w-96 p-0"
        align="end"
        sideOffset={8}
        data-testid="notification-panel"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h2 className="text-sm font-semibold text-slate-900">Notifications</h2>
          {unreadCount > 0 && (
            <button
              className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 transition-colors"
              onClick={markAllNotificationsRead}
              data-testid="mark-all-read"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Mark all as read
            </button>
          )}
        </div>

        {/* Notification list */}
        <ScrollArea className="max-h-[500px]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4" data-testid="empty-notifications">
              <Bell className="h-8 w-8 text-slate-300 mb-2" />
              <p className="text-sm text-slate-500">No notifications</p>
              <p className="text-xs text-slate-400 mt-1">You're all caught up!</p>
            </div>
          ) : (
            <div className="py-1">
              {grouped.map((group) => (
                <NotificationGroup
                  key={group.type}
                  type={group.type}
                  label={group.label}
                  notifications={group.notifications}
                  onNavigate={handleNavigate}
                  onToggleRead={handleToggleRead}
                />
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
