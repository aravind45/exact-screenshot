import { useEffect, useRef, useCallback, memo } from 'react';
import {
  X,
  Settings,
  Search,
  ClipboardList,
  Trophy,
  LayoutDashboard,
  Landmark,
  FileSearch,
  Zap,
  MessageSquare,
  FileText,
  Bell,
  Award,
  Receipt,
  CheckCircle,
  HelpCircle,
  MessageCircle,
  LogOut,
  Plus,
  Upload,
} from 'lucide-react';
import { motion, AnimatePresence, type PanInfo } from 'framer-motion';
import type {
  HamburgerMenuProps,
  HamburgerMenuGroup,
  NavigationItem,
} from '@/types/navigation';

const SWIPE_CLOSE_THRESHOLD = 80;

const animationConfig = {
  duration: 0.3,
  ease: [0.4, 0, 0.2, 1] as const,
};

const defaultPhaseGroups: HamburgerMenuGroup[] = [
  {
    id: 'setup',
    title: 'Phase 1: Setup',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
      { id: 'estate-profile', label: 'Estate Profile', icon: Settings, path: '/estate-profile' },
      { id: 'probate-hub', label: 'Probate Hub', icon: ClipboardList, path: '/probate' },
    ],
  },
  {
    id: 'discovery',
    title: 'Phase 2: Discovery',
    items: [
      { id: 'asset-inventory', label: 'Asset Inventory', icon: Landmark, path: '/assets' },
      { id: 'document-scanner', label: 'Document Scanner', icon: FileSearch, path: '/upload' },
      { id: 'asset-detective', label: 'Asset Detective', icon: Zap, path: '/asset-detective' },
    ],
  },
  {
    id: 'settlement',
    title: 'Phase 3: Settlement',
    items: [
      { id: 'active-assets', label: 'Active Assets', icon: Landmark, path: '/settlement/assets' },
      { id: 'communications', label: 'Communications', icon: MessageSquare, path: '/communications' },
      { id: 'document-vault', label: 'Document Vault', icon: FileText, path: '/documents' },
      { id: 'follow-ups', label: 'Follow-ups', icon: Bell, path: '/follow-ups' },
    ],
  },
  {
    id: 'close',
    title: 'Phase 4: Close',
    items: [
      { id: 'final-distribution', label: 'Final Distribution', icon: Award, path: '/distribution' },
      { id: 'tax-documents', label: 'Tax Documents', icon: Receipt, path: '/tax' },
      { id: 'close-estate', label: 'Close Estate', icon: CheckCircle, path: '/close' },
    ],
  },
];

const defaultQuickActions: NavigationItem[] = [
  { id: 'add-asset', label: 'Add Asset', icon: Plus, path: '/add-asset' },
  { id: 'log-communication', label: 'Log Communication', icon: MessageSquare, path: '/log-communication' },
  { id: 'upload-document', label: 'Upload Document', icon: Upload, path: '/upload' },
  { id: 'search', label: 'Search Everything', icon: Search, path: '/search' },
];

const defaultFooterItems: NavigationItem[] = [
  { id: 'settings', label: 'Settings', icon: Settings, path: '/settings' },
  { id: 'help', label: 'Help & Support', icon: HelpCircle, path: '/help' },
  { id: 'contact', label: 'Contact Support', icon: MessageCircle, path: '/support' },
  { id: 'sign-out', label: 'Sign Out', icon: LogOut, path: '/sign-out' },
];

export const HamburgerMenu = memo(function HamburgerMenu({
  isOpen,
  onClose,
  groups = defaultPhaseGroups,
  quickActions = defaultQuickActions,
  footerItems = defaultFooterItems,
  onItemClick,
}: HamburgerMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const firstFocusableRef = useRef<HTMLButtonElement>(null);
  const lastFocusableRef = useRef<HTMLButtonElement>(null);

  // Focus trap: when menu opens, focus the close button
  useEffect(() => {
    if (isOpen) {
      // Small delay to let animation start
      const timer = setTimeout(() => {
        firstFocusableRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Esc key to close
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }

      // Focus trap
      if (e.key === 'Tab') {
        const focusableElements = menuRef.current?.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (!focusableElements || focusableElements.length === 0) return;

        const firstEl = focusableElements[0];
        const lastEl = focusableElements[focusableElements.length - 1];

        if (e.shiftKey && document.activeElement === firstEl) {
          e.preventDefault();
          lastEl.focus();
        } else if (!e.shiftKey && document.activeElement === lastEl) {
          e.preventDefault();
          firstEl.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleDragEnd = useCallback(
    (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      if (info.offset.x > SWIPE_CLOSE_THRESHOLD || info.velocity.x > 500) {
        onClose();
      }
    },
    [onClose]
  );

  const handleItemClick = useCallback(
    (item: NavigationItem) => {
      onItemClick(item);
      onClose();
    },
    [onItemClick, onClose]
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-[70] md:hidden"
          data-testid="hamburger-menu-container"
          role="dialog"
          aria-modal="true"
          aria-label="Navigation menu"
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/50"
            data-testid="hamburger-menu-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: animationConfig.duration, ease: animationConfig.ease }}
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Slide-out panel */}
          <motion.div
            ref={menuRef}
            className="absolute top-0 right-0 bottom-0 w-full max-w-sm bg-white shadow-xl flex flex-col"
            data-testid="hamburger-menu-panel"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: animationConfig.duration, ease: animationConfig.ease }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragEnd={handleDragEnd}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-4 border-b border-slate-200"
              style={{ height: '56px', minHeight: '56px' }}
              data-testid="hamburger-menu-header"
            >
              <span className="text-base font-semibold text-slate-800">Menu</span>
              <button
                ref={firstFocusableRef}
                onClick={onClose}
                className="flex items-center justify-center rounded-md text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-blue-500 focus-visible:outline-offset-2"
                style={{ minWidth: '44px', minHeight: '44px' }}
                data-testid="hamburger-menu-close"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto" data-testid="hamburger-menu-content">
              {/* Phase groups */}
              <nav aria-label="Phase navigation">
                {groups.map((group) => (
                  <div key={group.id} className="py-3" data-testid={`hamburger-group-${group.id}`}>
                    <h3
                      className="px-4 pb-1 text-xs font-bold uppercase tracking-wider text-slate-400"
                      id={`hamburger-group-label-${group.id}`}
                    >
                      {group.title}
                    </h3>
                    <ul role="list" aria-labelledby={`hamburger-group-label-${group.id}`}>
                      {group.items.map((item) => {
                        const Icon = item.icon;
                        return (
                          <li key={item.id} role="listitem">
                            <button
                              onClick={() => handleItemClick(item)}
                              className={`
                                flex items-center gap-3 w-full px-4 text-left
                                text-sm font-medium transition-colors duration-150
                                focus-visible:outline-2 focus-visible:outline-blue-500 focus-visible:outline-offset-[-2px]
                                ${item.isActive
                                  ? 'text-blue-500 bg-blue-50 border-l-4 border-blue-500'
                                  : 'text-slate-700 hover:bg-slate-100 border-l-4 border-transparent'
                                }
                              `}
                              style={{ minHeight: '44px' }}
                              data-testid={`hamburger-item-${item.id}`}
                              aria-current={item.isActive ? 'page' : undefined}
                            >
                              <Icon className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
                              <span className="flex-1">{item.label}</span>
                              {item.badge != null && item.badge > 0 && (
                                <span
                                  className={`
                                    flex items-center justify-center min-w-[20px] h-5 px-1.5
                                    text-xs font-bold text-white rounded-full
                                    ${item.badgeType === 'urgent' ? 'bg-red-500' : ''}
                                    ${item.badgeType === 'attention' ? 'bg-amber-500' : ''}
                                    ${item.badgeType === 'info' || !item.badgeType ? 'bg-blue-500' : ''}
                                  `}
                                  data-testid={`hamburger-badge-${item.id}`}
                                  aria-label={`${item.badge} pending`}
                                >
                                  {item.badge > 99 ? '99+' : item.badge}
                                </span>
                              )}
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}
              </nav>

              {/* Divider */}
              <div className="mx-4 border-t border-slate-200" role="separator" />

              {/* Quick Actions */}
              <div className="py-3" data-testid="hamburger-quick-actions">
                <h3
                  className="px-4 pb-1 text-xs font-bold uppercase tracking-wider text-slate-400"
                  id="hamburger-quick-actions-label"
                >
                  Quick Actions
                </h3>
                <ul role="list" aria-labelledby="hamburger-quick-actions-label">
                  {quickActions.map((item) => {
                    const Icon = item.icon;
                    return (
                      <li key={item.id} role="listitem">
                        <button
                          onClick={() => handleItemClick(item)}
                          className="flex items-center gap-3 w-full px-4 text-left text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-blue-500 focus-visible:outline-offset-[-2px]"
                          style={{ minHeight: '44px' }}
                          data-testid={`hamburger-item-${item.id}`}
                        >
                          <Icon className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
                          <span>{item.label}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>

              {/* Divider */}
              <div className="mx-4 border-t border-slate-200" role="separator" />
            </div>

            {/* Footer items (Settings, Help, Sign Out) - pinned to bottom */}
            <div
              className="border-t border-slate-200 py-2"
              data-testid="hamburger-footer"
            >
              <ul role="list" aria-label="Settings and support">
                {footerItems.map((item, index) => {
                  const Icon = item.icon;
                  const isLast = index === footerItems.length - 1;
                  return (
                    <li key={item.id} role="listitem">
                      <button
                        ref={isLast ? lastFocusableRef : undefined}
                        onClick={() => handleItemClick(item)}
                        className={`
                          flex items-center gap-3 w-full px-4 text-left text-sm font-medium
                          transition-colors duration-150
                          focus-visible:outline-2 focus-visible:outline-blue-500 focus-visible:outline-offset-[-2px]
                          ${item.id === 'sign-out'
                            ? 'text-red-600 hover:bg-red-50'
                            : 'text-slate-700 hover:bg-slate-100'
                          }
                        `}
                        style={{ minHeight: '44px' }}
                        data-testid={`hamburger-item-${item.id}`}
                      >
                        <Icon className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
                        <span>{item.label}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
});

export { defaultPhaseGroups, defaultQuickActions, defaultFooterItems };
