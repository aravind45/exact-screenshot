import { memo } from 'react';
import { Plus, FileText, MessageSquare, Upload } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { FloatingActionButtonProps, QuickAction } from '@/types/navigation';
import { FAB_TRANSITION, TAP_SCALE, TOUCH_ACTIVE, HOVER_TRANSITION } from './animationConstants';

const defaultActions: QuickAction[] = [
  {
    id: 'add-asset',
    label: 'Add Asset',
    icon: Plus,
    action: () => {},
  },
  {
    id: 'log-communication',
    label: 'Log Communication',
    icon: MessageSquare,
    action: () => {},
  },
  {
    id: 'upload-document',
    label: 'Upload Document',
    icon: Upload,
    action: () => {},
  },
];

const animationConfig = {
  duration: FAB_TRANSITION.duration,
  ease: FAB_TRANSITION.ease,
};

export const FloatingActionButton = memo(function FloatingActionButton({
  isExpanded,
  onToggle,
  actions = defaultActions,
  onActionClick,
}: FloatingActionButtonProps) {
  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-[60] pointer-events-none md:hidden"
      data-testid="fab-container"
    >
      {/* Backdrop */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            className="fixed inset-0 bg-black/30 pointer-events-auto"
            data-testid="fab-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: animationConfig.duration, ease: animationConfig.ease }}
            onClick={onToggle}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      {/* Menu items */}
      <div className="relative flex flex-col items-center" style={{ bottom: '28px' }}>
        <AnimatePresence>
          {isExpanded && (
            <motion.ul
              role="list"
              aria-label="Quick actions"
              className="flex flex-col items-center gap-3 mb-3 pointer-events-auto"
              data-testid="fab-menu"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: animationConfig.duration, ease: animationConfig.ease }}
            >
              {actions.map((action, index) => {
                const Icon = action.icon;
                return (
                  <motion.li
                    key={action.id}
                    role="listitem"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{
                      duration: animationConfig.duration,
                      ease: animationConfig.ease,
                      delay: index * 0.05,
                    }}
                  >
                    <button
                      onClick={() => onActionClick(action)}
                      className="flex items-center gap-3 px-4 bg-white rounded-full shadow-lg hover:bg-slate-50 hover:shadow-xl active:bg-slate-100 transition-all duration-150 ease-out focus-visible:outline-2 focus-visible:outline-blue-500 focus-visible:outline-offset-2"
                      style={{ height: '48px', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
                      data-testid={`fab-action-${action.id}`}
                      aria-label={action.label}
                    >
                      <Icon className="w-5 h-5 text-slate-700" aria-hidden="true" />
                      <span className="text-sm font-medium text-slate-700 whitespace-nowrap">
                        {action.label}
                      </span>
                    </button>
                  </motion.li>
                );
              })}
            </motion.ul>
          )}
        </AnimatePresence>

        {/* FAB button */}
        <motion.button
          onClick={onToggle}
          whileTap={TAP_SCALE}
          className="pointer-events-auto flex items-center justify-center rounded-full bg-blue-500 text-white hover:bg-blue-600 active:bg-blue-700 transition-all duration-150 ease-out focus-visible:outline-2 focus-visible:outline-blue-500 focus-visible:outline-offset-2"
          style={{
            width: '56px',
            height: '56px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          }}
          data-testid="fab-button"
          aria-label={isExpanded ? 'Close quick actions menu' : 'Open quick actions menu'}
          aria-expanded={isExpanded}
          aria-haspopup="true"
        >
          <motion.span
            animate={{ rotate: isExpanded ? 45 : 0 }}
            transition={{ duration: animationConfig.duration, ease: animationConfig.ease }}
            className="flex items-center justify-center"
          >
            <Plus className="w-6 h-6" aria-hidden="true" />
          </motion.span>
        </motion.button>
      </div>
    </div>
  );
});

export { defaultActions };
