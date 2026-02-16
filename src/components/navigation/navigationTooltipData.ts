import {
  LayoutDashboard,
  FileText,
  Scale,
  Landmark,
  FileSearch,
  Search,
  ClipboardList,
  MessageSquare,
  FolderOpen,
  Bell,
  PieChart,
  Receipt,
  Trophy,
} from 'lucide-react';
import type { NavigationTooltipContent } from '@/types/navigation';

/**
 * Tooltip content for every navigation item, keyed by item id.
 * Each entry includes a title, 1-2 sentence description, an example use case,
 * and an icon — matching the design spec requirements.
 */
export const NAVIGATION_TOOLTIP_DATA: Record<string, NavigationTooltipContent> = {
  // Phase 1: Setup
  dashboard: {
    title: 'Dashboard',
    description:
      'Your estate overview showing progress, next actions, and key metrics at a glance.',
    example: 'Check which tasks need attention today and see overall settlement progress.',
    icon: LayoutDashboard,
  },
  'estate-profile': {
    title: 'Estate Profile',
    description:
      'Manage deceased person details, executor information, and jurisdiction settings.',
    example: 'Update the estate address or add a co-executor to the case.',
    icon: FileText,
  },
  'probate-hub': {
    title: 'Probate Hub',
    description:
      'Track legal status, court filings, and authority documents for the estate.',
    example: 'Upload Letters Testamentary or check your next court deadline.',
    icon: Scale,
  },

  // Phase 2: Discovery
  'asset-inventory': {
    title: 'Asset Inventory',
    description:
      'View and manage all discovered estate assets in one place.',
    example: 'Add a newly found bank account or update the value of a property.',
    icon: Landmark,
  },
  'document-scanner': {
    title: 'Document Scanner',
    description:
      'Upload financial documents and let AI extract asset information automatically.',
    example: 'Scan a brokerage statement to auto-detect investment accounts.',
    icon: FileSearch,
  },
  'asset-detective': {
    title: 'Asset Detective',
    description:
      'Discover hidden or unknown assets by analyzing uploaded documents.',
    example: 'Find a forgotten life insurance policy mentioned in old correspondence.',
    icon: Search,
  },

  // Phase 3: Settlement
  'active-assets': {
    title: 'Active Assets',
    description:
      'Track assets currently being processed with institutions.',
    example: 'See which assets are awaiting institution response or need follow-up.',
    icon: ClipboardList,
  },
  communications: {
    title: 'Communications',
    description:
      'Log and review all contacts with financial institutions and other parties.',
    example: 'Record a phone call with Chase Bank about closing an account.',
    icon: MessageSquare,
  },
  'document-vault': {
    title: 'Document Vault',
    description:
      'Centralized storage for all estate-related documents, organized by type.',
    example: 'Find the death certificate or a specific institution\'s claim form.',
    icon: FolderOpen,
  },
  'follow-ups': {
    title: 'Follow-ups',
    description:
      'Pending actions and reminders for tasks that need your attention.',
    example: 'See which institutions haven\'t responded in over 14 days.',
    icon: Bell,
  },

  // Phase 4: Close
  'final-distribution': {
    title: 'Final Distribution',
    description:
      'Track asset distributions to beneficiaries and heirs.',
    example: 'Record a distribution of funds to a beneficiary\'s bank account.',
    icon: PieChart,
  },
  'tax-documents': {
    title: 'Tax Documents',
    description:
      'Manage estate tax returns, filings, and related documentation.',
    example: 'Prepare the estate\'s final income tax return or track filing deadlines.',
    icon: Receipt,
  },
  'close-estate': {
    title: 'Close Estate',
    description:
      'Final checklist and steps to officially close the estate.',
    example: 'Verify all assets are distributed and file the final accounting with the court.',
    icon: Trophy,
  },
};

/**
 * Get tooltip content for a navigation item by its id.
 * Returns undefined if no tooltip data exists for the given id.
 */
export function getTooltipContent(itemId: string): NavigationTooltipContent | undefined {
  return NAVIGATION_TOOLTIP_DATA[itemId];
}
