/**
 * Shared animation constants for navigation components.
 * Ensures consistent durations, easings, and patterns across all navigation UI.
 *
 * Based on design doc section 3.5:
 * - Hover: 150ms ease-out
 * - Expand/Collapse: 200ms ease-in-out
 * - FAB Expand: 300ms cubic-bezier(0.4, 0, 0.2, 1)
 * - Page Transitions: 200ms ease-in-out (opacity + transform)
 * - Badge Pulse: 2s ease-in-out infinite
 */

/** Hover effect transition (background-color, color) */
export const HOVER_TRANSITION = {
  duration: 0.15,
  ease: 'easeOut' as const,
};

/** Expand/collapse transition (max-height, sections) */
export const EXPAND_TRANSITION = {
  duration: 0.2,
  ease: 'easeInOut' as const,
};

/** FAB and modal expand transition */
export const FAB_TRANSITION = {
  duration: 0.3,
  ease: [0.4, 0, 0.2, 1] as const,
};

/** Page transition (opacity + transform) */
export const PAGE_TRANSITION = {
  duration: 0.2,
  ease: 'easeInOut' as const,
};

/** Micro-interaction for button press (whileTap) */
export const TAP_SCALE = { scale: 0.95 };

/** Micro-interaction for hover lift */
export const HOVER_LIFT = { scale: 1.02 };

/** Subtle hover for nav items */
export const NAV_ITEM_HOVER = { scale: 1.01 };

/** Mobile touch active feedback */
export const TOUCH_ACTIVE = { scale: 0.97, opacity: 0.85 };

/** CSS transition string for hover effects (Tailwind-compatible) */
export const HOVER_CSS = 'transition-colors duration-150 ease-out';

/** CSS transition string for all interactive properties */
export const INTERACTIVE_CSS = 'transition-all duration-150 ease-out';
