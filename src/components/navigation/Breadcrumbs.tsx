import { useMemo, memo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home, MoreHorizontal } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export interface BreadcrumbItem {
  label: string;
  path?: string;
  icon?: React.ComponentType<{ className?: string }>;
}

export interface BreadcrumbsProps {
  items?: BreadcrumbItem[];
  separator?: React.ReactNode;
  maxItems?: number;
}

const MAX_LABEL_LENGTH = 30;

/**
 * Route-to-breadcrumb mapping. Maps path segments to human-readable labels
 * and assigns them to phases per the navigation design.
 */
const ROUTE_LABELS: Record<string, { label: string; phase?: string }> = {
  dashboard: { label: 'Dashboard', phase: 'Setup' },
  assets: { label: 'Asset Inventory', phase: 'Discovery' },
  'add-asset': { label: 'Add Asset', phase: 'Discovery' },
  upload: { label: 'Document Scanner', phase: 'Discovery' },
  discovery: { label: 'Asset Detective', phase: 'Discovery' },
  documents: { label: 'Document Vault', phase: 'Settlement' },
  inbox: { label: 'Communications', phase: 'Settlement' },
  'follow-ups': { label: 'Follow-ups', phase: 'Settlement' },
  'settlement-trail': { label: 'Settlement Trail', phase: 'Settlement' },
  roadmap: { label: 'Settlement Roadmap', phase: 'Settlement' },
  distribution: { label: 'Final Distribution', phase: 'Close' },
  'tax-management': { label: 'Tax Documents', phase: 'Close' },
  accounting: { label: 'Accounting', phase: 'Close' },
  receipts: { label: 'Receipts', phase: 'Settlement' },
  liabilities: { label: 'Liabilities', phase: 'Discovery' },
  'non-probate': { label: 'Non-Probate Assets', phase: 'Settlement' },
  forms: { label: 'Probate Hub', phase: 'Setup' },
  probate: { label: 'Probate', phase: 'Setup' },
  settings: { label: 'Settings' },
  profile: { label: 'Profile' },
  help: { label: 'Help Center' },
  'estate-agent': { label: 'Estate Agent' },
  asset: { label: 'Asset Detail', phase: 'Settlement' },
};

/** Truncate a label to maxLen characters, adding ellipsis if needed. */
export function truncateLabel(label: string, maxLen: number = MAX_LABEL_LENGTH): string {
  if (label.length <= maxLen) return label;
  return label.slice(0, maxLen - 1).trimEnd() + '…';
}

/** Generate breadcrumb items from a pathname. */
export function generateBreadcrumbs(pathname: string): BreadcrumbItem[] {
  const items: BreadcrumbItem[] = [{ label: 'Home', path: '/dashboard', icon: Home }];

  const segments = pathname.split('/').filter(Boolean);
  if (segments.length === 0 || (segments.length === 1 && segments[0] === 'dashboard')) {
    // On home/dashboard, just show Home as current (no path)
    return [{ label: 'Home', icon: Home }];
  }

  let accumulatedPath = '';
  let phaseAdded = false;

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    accumulatedPath += `/${segment}`;
    const routeInfo = ROUTE_LABELS[segment];
    const isLast = i === segments.length - 1;

    // Add phase breadcrumb if this route belongs to a phase and we haven't added one yet
    if (routeInfo?.phase && !phaseAdded) {
      phaseAdded = true;
      // Don't add phase as a separate clickable item — it's contextual only
      // We include it as a non-clickable segment
      items.push({ label: routeInfo.phase });
    }

    if (routeInfo) {
      items.push({
        label: routeInfo.label,
        path: isLast ? undefined : accumulatedPath,
      });
    } else {
      // Unknown segment — use it as-is (e.g., asset IDs, dynamic segments)
      // Capitalize first letter and replace hyphens with spaces
      const label = segment
        .replace(/-/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase());
      items.push({
        label,
        path: isLast ? undefined : accumulatedPath,
      });
    }
  }

  // Ensure the last item has no path (current page)
  if (items.length > 0) {
    items[items.length - 1] = { ...items[items.length - 1], path: undefined };
  }

  return items;
}

/** Collapse middle items when there are more than maxItems. */
export function collapseItems(
  items: BreadcrumbItem[],
  maxItems: number,
): { visible: BreadcrumbItem[]; collapsed: BreadcrumbItem[] } {
  if (items.length <= maxItems) {
    return { visible: items, collapsed: [] };
  }

  // Show first item, ellipsis, and last two items
  const first = items[0];
  const lastTwo = items.slice(-2);
  const collapsed = items.slice(1, -2);

  return {
    visible: [first, ...lastTwo],
    collapsed,
  };
}

function BreadcrumbSegment({
  item,
  isLast,
}: {
  item: BreadcrumbItem;
  isLast: boolean;
}) {
  const Icon = item.icon;
  const needsTruncation = item.label.length > MAX_LABEL_LENGTH;
  const displayLabel = truncateLabel(item.label);

  const content = (
    <span className="flex items-center gap-1.5">
      {Icon && <Icon className="h-3.5 w-3.5 shrink-0" />}
      <span>{displayLabel}</span>
    </span>
  );

  // Wrap in tooltip if truncated
  const wrappedContent = needsTruncation ? (
    <Tooltip>
      <TooltipTrigger asChild>
        {isLast || !item.path ? (
          <span
            className="max-w-[200px] truncate cursor-default"
            data-testid="breadcrumb-truncated"
          >
            {content}
          </span>
        ) : (
          <Link
            to={item.path}
            className="max-w-[200px] truncate text-slate-500 hover:text-slate-700 transition-colors"
            data-testid="breadcrumb-truncated"
          >
            {content}
          </Link>
        )}
      </TooltipTrigger>
      <TooltipContent side="bottom">
        <p className="text-sm">{item.label}</p>
      </TooltipContent>
    </Tooltip>
  ) : isLast || !item.path ? (
    <span
      className="flex items-center gap-1.5 text-slate-900 font-medium"
      aria-current="page"
    >
      {Icon && <Icon className="h-3.5 w-3.5 shrink-0" />}
      <span>{displayLabel}</span>
    </span>
  ) : (
    <Link
      to={item.path}
      className="flex items-center gap-1.5 text-slate-500 hover:text-slate-700 transition-colors"
    >
      {Icon && <Icon className="h-3.5 w-3.5 shrink-0" />}
      <span>{displayLabel}</span>
    </Link>
  );

  return wrappedContent;
}

function CollapsedIndicator({ items }: { items: BreadcrumbItem[] }) {
  const tooltipContent = items.map((item) => item.label).join(' > ');

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          className="flex items-center justify-center h-6 w-6 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
          aria-label={`${items.length} collapsed items: ${tooltipContent}`}
          data-testid="breadcrumb-collapsed"
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        <p className="text-sm">{tooltipContent}</p>
      </TooltipContent>
    </Tooltip>
  );
}

export const Breadcrumbs = memo(function Breadcrumbs({
  items: propItems,
  separator,
  maxItems = 4,
}: BreadcrumbsProps) {
  const location = useLocation();

  const items = useMemo(
    () => propItems ?? generateBreadcrumbs(location.pathname),
    [propItems, location.pathname],
  );

  const { visible, collapsed } = useMemo(
    () => collapseItems(items, maxItems),
    [items, maxItems],
  );

  const separatorElement = separator ?? (
    <ChevronRight className="h-3.5 w-3.5 text-slate-400 shrink-0 mx-1.5" aria-hidden="true" />
  );

  if (visible.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" data-testid="breadcrumbs">
      <ol className="flex items-center flex-wrap text-sm">
        {visible.map((item, index) => {
          const isLast = index === visible.length - 1;
          // Insert collapsed indicator after the first item
          const showCollapsed = collapsed.length > 0 && index === 1;

          return (
            <li key={`${item.label}-${index}`} className="flex items-center">
              {index > 0 && separatorElement}
              {showCollapsed && (
                <>
                  <CollapsedIndicator items={collapsed} />
                  {separatorElement}
                </>
              )}
              <BreadcrumbSegment item={item} isLast={isLast} />
            </li>
          );
        })}
      </ol>
    </nav>
  );
});
