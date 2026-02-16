import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNavigation } from '@/contexts/NavigationContext';
import { useKeyboardShortcuts, type KeyboardShortcut } from './useKeyboardShortcuts';
import type { Phase } from '@/types/navigation';

/** Default landing page for each phase */
const PHASE_PATHS: Record<Phase, string> = {
  setup: '/dashboard',
  discovery: '/assets',
  settlement: '/roadmap',
  close: '/distribution',
};

const PHASE_ORDER: Phase[] = ['setup', 'discovery', 'settlement', 'close'];

export interface NavigationShortcutsOptions {
  /** Callback to open the help panel (Cmd/Ctrl + /) */
  onOpenHelp?: () => void;
  /** Callback to open the keyboard shortcuts modal */
  onOpenShortcutsModal?: () => void;
  /** Whether shortcuts are enabled (default: true) */
  enabled?: boolean;
}

/**
 * Registers all global navigation keyboard shortcuts:
 * - 1-4: Jump to phase (Setup, Discovery, Settlement, Close)
 * - Cmd/Ctrl + /: Open Help
 * - Esc: Close any open menu/modal
 */
export function useNavigationShortcuts(options: NavigationShortcutsOptions = {}): void {
  const { onOpenHelp, onOpenShortcutsModal, enabled = true } = options;
  const navigate = useNavigate();
  const {
    state,
    closeQuickActions,
    closeNotificationCenter,
    togglePhase,
  } = useNavigation();

  const shortcuts = useMemo<KeyboardShortcut[]>(() => {
    if (!enabled) return [];

    const list: KeyboardShortcut[] = [];

    // Phase shortcuts: 1-4
    PHASE_ORDER.forEach((phase, index) => {
      list.push({
        id: `phase-${phase}`,
        description: `Jump to ${phase.charAt(0).toUpperCase() + phase.slice(1)} phase`,
        key: String(index + 1),
        ignoreInInput: true,
        handler: () => {
          // Expand the target phase in the sidebar
          if (!state.expandedPhases.includes(phase)) {
            togglePhase(phase);
          }
          navigate(PHASE_PATHS[phase]);
        },
      });
    });

    // Cmd/Ctrl + / → Open Help
    if (onOpenHelp) {
      list.push({
        id: 'open-help',
        description: 'Open Help',
        key: '/',
        metaKey: true,
        ignoreInInput: false,
        handler: onOpenHelp,
      });
    }

    // Cmd/Ctrl + Shift + / → Open Keyboard Shortcuts modal
    if (onOpenShortcutsModal) {
      list.push({
        id: 'open-shortcuts-modal',
        description: 'Show Keyboard Shortcuts',
        key: '?',
        metaKey: true,
        shiftKey: true,
        ignoreInInput: false,
        handler: onOpenShortcutsModal,
      });
    }

    // Esc → Close any open menu/modal
    list.push({
      id: 'close-menus',
      description: 'Close open menu or modal',
      key: 'Escape',
      ignoreInInput: false,
      handler: () => {
        if (state.isQuickActionsOpen) {
          closeQuickActions();
        } else if (state.isNotificationCenterOpen) {
          closeNotificationCenter();
        }
      },
      // Only fire when something is actually open
      enabled: state.isQuickActionsOpen || state.isNotificationCenterOpen,
    });

    return list;
  }, [
    enabled,
    state.expandedPhases,
    state.isQuickActionsOpen,
    state.isNotificationCenterOpen,
    navigate,
    togglePhase,
    closeQuickActions,
    closeNotificationCenter,
    onOpenHelp,
    onOpenShortcutsModal,
  ]);

  useKeyboardShortcuts(shortcuts);
}

export { PHASE_PATHS, PHASE_ORDER };
