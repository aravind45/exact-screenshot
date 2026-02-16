import { ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { PAGE_TRANSITION } from './animationConstants';

export interface PageTransitionProps {
  children: ReactNode;
  /** Transition mode: 'fade' for opacity only, 'slide' for opacity + vertical slide */
  mode?: 'fade' | 'slide';
}

const fadeVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

const slideVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

/**
 * Wraps page content with smooth fade/slide transitions on route changes.
 * Uses framer-motion AnimatePresence keyed on the current pathname.
 *
 * Design spec: opacity 200ms ease-in-out, transform 200ms ease-in-out
 */
export function PageTransition({ children, mode = 'slide' }: PageTransitionProps) {
  const location = useLocation();
  const variants = mode === 'fade' ? fadeVariants : slideVariants;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        variants={variants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={PAGE_TRANSITION}
        data-testid="page-transition"
        style={{ willChange: 'transform, opacity' }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
