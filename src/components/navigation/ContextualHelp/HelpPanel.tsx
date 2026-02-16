import { useEffect, useRef, useCallback, useState } from 'react';
import { X, ChevronRight, Lightbulb, ChevronDown, ChevronUp } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import type { HelpPanelProps, HelpFAQItem } from '@/types/navigation';
import { getHelpContent } from './helpContent';

function FAQItem({ item }: { item: HelpFAQItem }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-slate-100 last:border-b-0">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between py-2.5 text-left text-sm font-medium text-slate-700 hover:text-slate-900 transition-all duration-150 ease-out"
        aria-expanded={isOpen}
      >
        <span>{item.question}</span>
        {isOpen ? (
          <ChevronUp className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
        ) : (
          <ChevronDown className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
        )}
      </button>
      {isOpen && (
        <p className="pb-3 text-sm text-slate-600 leading-relaxed">
          {item.answer}
        </p>
      )}
    </div>
  );
}

/**
 * Slide-out help panel from the right side of the screen.
 * Shows contextual help content including title, description, tips, FAQ, and related links.
 * Supports keyboard shortcut Cmd/Ctrl + / to toggle, Esc to close.
 */
export function HelpPanel({ isOpen, onClose, contextId }: HelpPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const content = getHelpContent(contextId);

  // Focus trap: focus the panel when it opens
  useEffect(() => {
    if (isOpen) {
      // Small delay to let animation start
      const timer = setTimeout(() => panelRef.current?.focus(), 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Close on Escape
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    },
    [isOpen, onClose],
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            data-testid="help-panel-backdrop"
            className="fixed inset-0 z-40 bg-black/20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Panel */}
          <motion.div
            ref={panelRef}
            data-testid="help-panel"
            role="dialog"
            aria-modal="true"
            aria-label={content ? `Help: ${content.title}` : 'Help'}
            tabIndex={-1}
            className="fixed right-0 top-0 z-50 h-full w-full max-w-md bg-white shadow-2xl outline-none overflow-y-auto"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          >
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
              <h2 className="text-lg font-semibold text-slate-800">
                {content?.title ?? 'Help'}
              </h2>
              <button
                data-testid="help-panel-close"
                type="button"
                onClick={onClose}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 active:bg-slate-200 transition-all duration-150 ease-out"
                aria-label="Close help panel"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            {content ? (
              <div className="px-6 py-5 space-y-6">
                {/* Description */}
                <p className="text-sm text-slate-600 leading-relaxed">
                  {content.description}
                </p>

                {/* Tips */}
                {content.tips.length > 0 && (
                  <section>
                    <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-800 mb-3">
                      <Lightbulb className="h-4 w-4 text-amber-500" aria-hidden="true" />
                      Tips
                    </h3>
                    <ul className="space-y-2">
                      {content.tips.map((tip, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-2 text-sm text-slate-600"
                        >
                          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-400" aria-hidden="true" />
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </section>
                )}

                {/* FAQ */}
                {content.faq.length > 0 && (
                  <section>
                    <h3 className="text-sm font-semibold text-slate-800 mb-2">
                      Frequently Asked Questions
                    </h3>
                    <div>
                      {content.faq.map((item, i) => (
                        <FAQItem key={i} item={item} />
                      ))}
                    </div>
                  </section>
                )}

                {/* Related Links */}
                {content.relatedLinks.length > 0 && (
                  <section>
                    <h3 className="text-sm font-semibold text-slate-800 mb-2">
                      Related
                    </h3>
                    <ul className="space-y-1">
                      {content.relatedLinks.map((link) => (
                        <li key={link.path}>
                          <a
                            href={link.path}
                            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 active:bg-blue-100 transition-all duration-150 ease-out"
                          >
                            <ChevronRight className="h-4 w-4" aria-hidden="true" />
                            {link.label}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}

                {/* Keyboard shortcut hint */}
                <p className="text-xs text-slate-400 pt-2 border-t border-slate-100">
                  Press <kbd className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 font-mono text-[11px]">Esc</kbd> to close
                  {' · '}
                  <kbd className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 font-mono text-[11px]">⌘/</kbd> to toggle help
                </p>
              </div>
            ) : (
              <div className="px-6 py-12 text-center">
                <p className="text-sm text-slate-500">
                  No help content available for this section.
                </p>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
