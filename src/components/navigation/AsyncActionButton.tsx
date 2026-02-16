import { useState, useCallback, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Check } from 'lucide-react';
import { HOVER_TRANSITION } from './animationConstants';

export interface AsyncActionButtonProps {
  /** The async action to perform on click */
  onClick: () => Promise<void>;
  /** Button content when idle */
  children: ReactNode;
  /** Additional CSS classes */
  className?: string;
  /** Accessible label */
  'aria-label'?: string;
  /** data-testid for testing */
  'data-testid'?: string;
  /** Whether the button is disabled */
  disabled?: boolean;
  /** Show success checkmark briefly after completion */
  showSuccess?: boolean;
}

type ActionState = 'idle' | 'loading' | 'success';

/**
 * A button that shows loading and success states for async actions.
 * Wraps any async onClick handler with visual feedback:
 * - idle: shows children
 * - loading: shows spinner
 * - success: shows checkmark briefly, then returns to idle
 */
export function AsyncActionButton({
  onClick,
  children,
  className = '',
  disabled = false,
  showSuccess = true,
  ...props
}: AsyncActionButtonProps) {
  const [actionState, setActionState] = useState<ActionState>('idle');

  const handleClick = useCallback(async () => {
    if (actionState !== 'idle') return;
    setActionState('loading');
    try {
      await onClick();
      if (showSuccess) {
        setActionState('success');
        setTimeout(() => setActionState('idle'), 1200);
      } else {
        setActionState('idle');
      }
    } catch {
      setActionState('idle');
    }
  }, [onClick, actionState, showSuccess]);

  return (
    <motion.button
      onClick={handleClick}
      disabled={disabled || actionState === 'loading'}
      whileTap={actionState === 'idle' ? { scale: 0.95 } : undefined}
      transition={HOVER_TRANSITION}
      className={`relative inline-flex items-center justify-center transition-all duration-150 ease-out ${className}`}
      aria-label={props['aria-label']}
      aria-busy={actionState === 'loading'}
      data-testid={props['data-testid']}
    >
      <AnimatePresence mode="wait">
        {actionState === 'idle' && (
          <motion.span
            key="idle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.1 }}
            className="flex items-center gap-2"
          >
            {children}
          </motion.span>
        )}
        {actionState === 'loading' && (
          <motion.span
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.1 }}
            className="flex items-center gap-2"
            data-testid={props['data-testid'] ? `${props['data-testid']}-loading` : 'async-loading'}
          >
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            <span className="sr-only">Loading...</span>
          </motion.span>
        )}
        {actionState === 'success' && (
          <motion.span
            key="success"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="flex items-center gap-2 text-green-600"
            data-testid={props['data-testid'] ? `${props['data-testid']}-success` : 'async-success'}
          >
            <Check className="h-4 w-4" aria-hidden="true" />
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}
