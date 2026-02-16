import { HelpCircle } from 'lucide-react';
import type { HelpIconProps } from '@/types/navigation';

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
} as const;

const buttonSizeClasses = {
  sm: 'h-6 w-6',
  md: 'h-7 w-7',
} as const;

/**
 * Small circular help icon (?) button that opens contextual help
 * for a specific page or section.
 */
export function HelpIcon({
  contextId,
  size = 'sm',
  className = '',
  onClick,
}: HelpIconProps & { onClick?: (contextId: string) => void }) {
  return (
    <button
      type="button"
      data-testid={`help-icon-${contextId}`}
      aria-label={`Help for ${contextId.replace(/-/g, ' ')}`}
      onClick={() => onClick?.(contextId)}
      className={`inline-flex items-center justify-center rounded-full text-slate-400 hover:text-blue-500 hover:bg-blue-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 ${buttonSizeClasses[size]} ${className}`}
    >
      <HelpCircle className={sizeClasses[size]} aria-hidden="true" />
    </button>
  );
}
