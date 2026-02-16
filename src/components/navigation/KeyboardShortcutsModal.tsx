import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { getModifierKey } from '@/hooks/useKeyboardShortcuts';

export interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ShortcutEntry {
  keys: string[];
  description: string;
}

interface ShortcutGroup {
  title: string;
  shortcuts: ShortcutEntry[];
}

function getShortcutGroups(): ShortcutGroup[] {
  const mod = getModifierKey();
  return [
    {
      title: 'Global',
      shortcuts: [
        { keys: [mod, 'K'], description: 'Open Quick Actions' },
        { keys: [mod, '/'], description: 'Open Help' },
        { keys: ['Esc'], description: 'Close any open menu or modal' },
      ],
    },
    {
      title: 'Navigation',
      shortcuts: [
        { keys: ['1'], description: 'Jump to Setup phase' },
        { keys: ['2'], description: 'Jump to Discovery phase' },
        { keys: ['3'], description: 'Jump to Settlement phase' },
        { keys: ['4'], description: 'Jump to Close phase' },
      ],
    },
    {
      title: 'General',
      shortcuts: [
        { keys: ['Tab'], description: 'Navigate through items' },
        { keys: ['Enter', 'Space'], description: 'Activate item' },
        { keys: ['↑', '↓'], description: 'Navigate within section' },
      ],
    },
  ];
}

function Kbd({ children }: { children: string }) {
  return (
    <kbd className="inline-flex items-center justify-center min-w-[24px] h-6 px-1.5 rounded bg-slate-100 border border-slate-200 text-xs font-mono font-medium text-slate-600">
      {children}
    </kbd>
  );
}

export function KeyboardShortcutsModal({ isOpen, onClose }: KeyboardShortcutsModalProps) {
  const groups = getShortcutGroups();

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent
        data-testid="keyboard-shortcuts-modal"
        className="max-w-md"
        aria-label="Keyboard shortcuts"
      >
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
          <DialogDescription>
            Use these shortcuts to navigate faster.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 mt-2">
          {groups.map((group) => (
            <section key={group.title}>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                {group.title}
              </h3>
              <ul className="space-y-1.5" role="list">
                {group.shortcuts.map((shortcut) => (
                  <li
                    key={shortcut.description}
                    className="flex items-center justify-between py-1"
                  >
                    <span className="text-sm text-slate-700">
                      {shortcut.description}
                    </span>
                    <span className="flex items-center gap-1 shrink-0 ml-4">
                      {shortcut.keys.map((key, i) => (
                        <span key={i} className="flex items-center gap-0.5">
                          {i > 0 && (
                            <span className="text-xs text-slate-300 mx-0.5">+</span>
                          )}
                          <Kbd>{key}</Kbd>
                        </span>
                      ))}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
