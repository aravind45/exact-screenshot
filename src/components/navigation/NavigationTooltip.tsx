import { ReactNode, useCallback, useEffect, useState } from 'react';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import { HelpCircle } from 'lucide-react';
import type { NavigationTooltipContent } from '@/types/navigation';

export interface NavigationTooltipProps {
  /** The element that triggers the tooltip on hover */
  children: ReactNode;
  /** Rich tooltip content with title, description, example, and icon */
  content: NavigationTooltipContent;
  /** Delay in ms before showing tooltip. Defaults to 500ms per spec. */
  delayDuration?: number;
  /** Side to position the tooltip. Defaults to 'right' per spec. */
  side?: 'top' | 'right' | 'bottom' | 'left';
  /** Whether the tooltip is open (controlled mode) */
  open?: boolean;
  /** Callback when open state changes */
  onOpenChange?: (open: boolean) => void;
}

/**
 * NavigationTooltip wraps a navigation item and shows a rich tooltip
 * with title, description, example use case, and optional icon.
 *
 * Built on Radix UI Tooltip primitive with:
 * - 500ms hover delay
 * - Positioned to the right of navigation items
 * - Max width 300px
 * - Dismissible with Esc key
 * - Keyboard accessible
 */
export function NavigationTooltip({
  children,
  content,
  delayDuration = 500,
  side = 'right',
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: NavigationTooltipProps) {
  const isControlled = controlledOpen !== undefined;
  const [internalOpen, setInternalOpen] = useState(false);

  const open = isControlled ? controlledOpen : internalOpen;
  const onOpenChange = isControlled
    ? controlledOnOpenChange!
    : setInternalOpen;

  // Handle Esc key to dismiss tooltip
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        onOpenChange(false);
      }
    },
    [open, onOpenChange],
  );

  useEffect(() => {
    if (open) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [open, handleKeyDown]);

  const Icon = content.icon;

  return (
    <TooltipPrimitive.Provider delayDuration={delayDuration}>
      <TooltipPrimitive.Root open={open} onOpenChange={onOpenChange}>
        <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Content
            side={side}
            sideOffset={8}
            className="z-50 max-w-[300px] rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-lg animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=right]:slide-in-from-left-2 data-[side=left]:slide-in-from-right-2 data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2"
            data-testid="navigation-tooltip"
            role="tooltip"
          >
            {/* Header with icon and title */}
            <div className="flex items-center gap-2 mb-1.5">
              {Icon && (
                <Icon
                  className="h-4 w-4 text-blue-500 shrink-0"
                  aria-hidden="true"
                />
              )}
              <span className="text-[13px] font-semibold text-slate-800 leading-tight">
                {content.title}
              </span>
            </div>

            {/* Description */}
            <p className="text-[13px] font-normal leading-[1.5] text-slate-800">
              {content.description}
            </p>

            {/* Example use case */}
            {content.example && (
              <div className="mt-2 flex items-start gap-1.5 rounded-md bg-slate-50 px-2.5 py-2">
                <HelpCircle
                  className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5"
                  aria-hidden="true"
                />
                <p className="text-xs text-slate-500 leading-relaxed">
                  <span className="font-medium text-slate-600">Example: </span>
                  {content.example}
                </p>
              </div>
            )}

            <TooltipPrimitive.Arrow className="fill-white" />
          </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  );
}
