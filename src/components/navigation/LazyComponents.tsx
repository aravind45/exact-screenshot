/**
 * Lazy-loaded navigation components for code splitting.
 * These secondary components are loaded on-demand to reduce initial bundle size.
 *
 * Per design doc section 8.1:
 * - QuickActionsMenu, NotificationCenter, OnboardingWizard are lazy loaded
 * - KeyboardShortcutsModal is also lazy loaded as a secondary component
 */
import { lazy } from 'react';

export const LazyQuickActionsMenu = lazy(() =>
  import('./QuickActionsMenu').then((m) => ({ default: m.QuickActionsMenu }))
);

export const LazyNotificationCenter = lazy(() =>
  import('./NotificationCenter').then((m) => ({ default: m.NotificationCenter }))
);

export const LazyOnboardingWizard = lazy(() =>
  import('./OnboardingWizard/OnboardingWizard').then((m) => ({
    default: m.OnboardingWizard,
  }))
);

export const LazyKeyboardShortcutsModal = lazy(() =>
  import('./KeyboardShortcutsModal').then((m) => ({
    default: m.KeyboardShortcutsModal,
  }))
);
