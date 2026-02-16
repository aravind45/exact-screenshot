import { ReactNode } from 'react';
import { NavigationTooltip } from './NavigationTooltip';
import { getTooltipContent } from './navigationTooltipData';
import type { NavigationTooltipContent } from '@/types/navigation';

export interface NavigationItemWithTooltipProps {
  /** The navigation item id used to look up tooltip content */
  itemId: string;
  /** The navigation item element to wrap */
  children: ReactNode;
  /** Override tooltip content instead of using the data lookup */
  tooltipContent?: NavigationTooltipContent;
  /** Whether tooltips are enabled. Defaults to true. */
  enabled?: boolean;
  /** Side to position the tooltip. Defaults to 'right'. */
  side?: 'top' | 'right' | 'bottom' | 'left';
}

/**
 * Wraps a navigation item with a rich tooltip.
 * Automatically looks up tooltip content by item id from the centralized data,
 * or accepts explicit tooltipContent as an override.
 *
 * If no tooltip content is found and none is provided, renders children as-is.
 */
export function NavigationItemWithTooltip({
  itemId,
  children,
  tooltipContent,
  enabled = true,
  side = 'right',
}: NavigationItemWithTooltipProps) {
  const content = tooltipContent ?? getTooltipContent(itemId);

  if (!enabled || !content) {
    return <>{children}</>;
  }

  return (
    <NavigationTooltip content={content} side={side}>
      {children}
    </NavigationTooltip>
  );
}
