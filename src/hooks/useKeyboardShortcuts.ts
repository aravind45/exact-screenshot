import { useEffect, useCallback, useRef } from 'react';

export interface KeyboardShortcut {
  /** Unique identifier for the shortcut */
  id: string;
  /** Human-readable description */
  description: string;
  /** The key to listen for (e.g. 'k', '/', '1', 'Escape') */
  key: string;
  /** Require Cmd (Mac) / Ctrl (Win/Linux) modifier */
  metaKey?: boolean;
  /** Require Shift modifier */
  shiftKey?: boolean;
  /** Require Alt modifier */
  altKey?: boolean;
  /** Handler to invoke when the shortcut fires */
  handler: () => void;
  /** If true, shortcut is ignored when user is typing in an input/textarea */
  ignoreInInput?: boolean;
  /** Whether the shortcut is currently enabled (default: true) */
  enabled?: boolean;
}

/** Returns true when the active element is a text input, textarea, or contenteditable */
function isEditableElement(el: Element | null): boolean {
  if (!el) return false;
  const tag = el.tagName.toLowerCase();
  if (tag === 'input') {
    const type = (el as HTMLInputElement).type.toLowerCase();
    const textTypes = ['text', 'search', 'url', 'tel', 'email', 'password', 'number'];
    return textTypes.includes(type);
  }
  if (tag === 'textarea') return true;
  if ((el as HTMLElement).isContentEditable) return true;
  return false;
}

/**
 * Hook that registers global keyboard shortcuts.
 *
 * Shortcuts are matched by key + modifier combination. When a match is found
 * the default browser action is prevented and the handler is called.
 *
 * @param shortcuts Array of shortcut definitions to register.
 */
export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]): void {
  // Keep a stable ref so the event listener always sees the latest shortcuts
  // without needing to re-attach on every render.
  const shortcutsRef = useRef(shortcuts);
  shortcutsRef.current = shortcuts;

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    for (const shortcut of shortcutsRef.current) {
      if (shortcut.enabled === false) continue;

      // Check modifiers
      const needsMeta = shortcut.metaKey ?? false;
      const needsShift = shortcut.shiftKey ?? false;
      const needsAlt = shortcut.altKey ?? false;

      const metaMatch = needsMeta ? (e.metaKey || e.ctrlKey) : !(e.metaKey || e.ctrlKey);
      const shiftMatch = needsShift ? e.shiftKey : !e.shiftKey;
      const altMatch = needsAlt ? e.altKey : !e.altKey;

      if (!metaMatch || !shiftMatch || !altMatch) continue;

      // Check key (case-insensitive)
      if (e.key.toLowerCase() !== shortcut.key.toLowerCase()) continue;

      // Skip if user is typing in an input and shortcut says to ignore
      if (shortcut.ignoreInInput !== false && isEditableElement(document.activeElement)) {
        continue;
      }

      e.preventDefault();
      shortcut.handler();
      return; // Only fire the first matching shortcut
    }
  }, []);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}

/**
 * Returns a platform-aware modifier label (⌘ on Mac, Ctrl on others).
 */
export function getModifierKey(): string {
  if (typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform)) {
    return '⌘';
  }
  return 'Ctrl';
}

/**
 * Formats a shortcut for display (e.g. "⌘K", "⌘/", "1").
 */
export function formatShortcut(shortcut: Pick<KeyboardShortcut, 'key' | 'metaKey' | 'shiftKey' | 'altKey'>): string {
  const parts: string[] = [];
  if (shortcut.metaKey) parts.push(getModifierKey());
  if (shortcut.altKey) parts.push('Alt');
  if (shortcut.shiftKey) parts.push('Shift');
  parts.push(shortcut.key.toUpperCase());
  return parts.join('+');
}
