import { memo } from 'react';
import { Home, BarChart3, Plus, ClipboardList, User } from 'lucide-react';
import { motion } from 'framer-motion';
import type { BottomNavBarProps, BottomNavItem } from '@/types/navigation';
import { HOVER_TRANSITION, TAP_SCALE, TOUCH_ACTIVE } from './animationConstants';

const defaultItems: BottomNavItem[] = [
  { id: 'home', label: 'Home', icon: Home, path: '/dashboard' },
  { id: 'assets', label: 'Assets', icon: BarChart3, path: '/assets' },
  { id: 'add', label: 'Add', icon: Plus, path: '/add-asset' },
  { id: 'tasks', label: 'Tasks', icon: ClipboardList, path: '/tasks' },
  { id: 'more', label: 'More', icon: User, path: '/more' },
];

export const BottomNavBar = memo(function BottomNavBar({
  items = defaultItems,
  activeItem,
  onItemClick,
}: BottomNavBarProps) {
  return (
    <nav
      aria-label="Mobile navigation"
      className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 md:hidden"
      style={{ height: '64px' }}
      data-testid="bottom-nav-bar"
    >
      <ul
        role="list"
        className="flex items-center justify-around h-full px-1"
        style={{ margin: 0, padding: '0 4px', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
      >
        {items.map((item) => {
          const isActive = activeItem === item.id;
          const Icon = item.icon;

          return (
            <li
              key={item.id}
              role="listitem"
              className="flex-1"
              style={{ width: '20%', maxWidth: '20%' }}
            >
              <motion.button
                onClick={() => onItemClick(item.id)}
                aria-label={item.label}
                aria-current={isActive ? 'page' : undefined}
                data-testid={`bottom-nav-item-${item.id}`}
                whileTap={TOUCH_ACTIVE}
                transition={HOVER_TRANSITION}
                className={`
                  relative flex flex-col items-center justify-center w-full
                  transition-colors duration-150 ease-out
                  focus-visible:outline-2 focus-visible:outline-blue-500 focus-visible:outline-offset-2
                  rounded-md
                  ${isActive ? 'text-blue-500' : 'text-slate-500 hover:text-slate-700 active:bg-slate-100'}
                `}
                style={{
                  minWidth: '44px',
                  minHeight: '44px',
                  padding: '6px 0',
                }}
              >
                <span className="relative">
                  <Icon
                    className="w-6 h-6"
                    aria-hidden="true"
                  />
                  {item.badge != null && item.badge > 0 && (
                    <span
                      className="absolute -top-1.5 -right-2.5 flex items-center justify-center min-w-[16px] h-4 px-1 text-[10px] font-bold text-white bg-red-500 rounded-full"
                      data-testid={`bottom-nav-badge-${item.id}`}
                      aria-label={`${item.badge} notifications`}
                    >
                      {item.badge > 99 ? '99+' : item.badge}
                    </span>
                  )}
                </span>
                <span
                  className="mt-0.5 leading-tight"
                  style={{ fontSize: '10px' }}
                >
                  {item.label}
                </span>
                {isActive && (
                  <motion.span
                    layoutId="bottomNavIndicator"
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-blue-500 rounded-full"
                    data-testid={`bottom-nav-indicator-${item.id}`}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                )}
              </motion.button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
});

export { defaultItems };
export type { BottomNavItem };
