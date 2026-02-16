import type { TourDefinition } from '@/types/navigation';

export const dashboardTour: TourDefinition = {
  id: 'dashboard',
  name: 'Dashboard Tour',
  description: 'Learn how to use your estate dashboard',
  steps: [
    {
      target: '[data-tour="dashboard-overview"]',
      title: 'Your Dashboard',
      description:
        'This is your estate overview. It shows your progress and what needs attention next.',
      placement: 'bottom',
    },
    {
      target: '[data-tour="phase-progress"]',
      title: 'Phase Progress',
      description:
        'Track your estate settlement journey across four phases: Setup, Discovery, Settlement, and Close.',
      placement: 'right',
    },
    {
      target: '[data-tour="pending-actions"]',
      title: 'Pending Actions',
      description:
        'Items that need your attention appear here. Stay on top of follow-ups and deadlines.',
      placement: 'left',
    },
    {
      target: '[data-tour="quick-actions"]',
      title: 'Quick Actions',
      description:
        'Use these shortcuts to add assets, log communications, or upload documents without navigating away.',
      placement: 'bottom',
    },
  ],
};

export const assetDetailTour: TourDefinition = {
  id: 'asset-detail',
  name: 'Asset Detail Tour',
  description: 'Learn how to manage individual assets',
  steps: [
    {
      target: '[data-tour="asset-header"]',
      title: 'Asset Overview',
      description:
        'See the asset name, institution, and current status at a glance.',
      placement: 'bottom',
    },
    {
      target: '[data-tour="asset-status"]',
      title: 'Asset Status',
      description:
        'Track where this asset is in the settlement process. Update the status as you make progress.',
      placement: 'left',
    },
    {
      target: '[data-tour="asset-communications"]',
      title: 'Communications',
      description:
        'Log every call, email, and letter with the institution here. This creates a paper trail.',
      placement: 'top',
    },
    {
      target: '[data-tour="asset-documents"]',
      title: 'Documents',
      description:
        'Upload and manage documents related to this asset, like statements and claim forms.',
      placement: 'top',
    },
  ],
};

export const navigationTour: TourDefinition = {
  id: 'navigation',
  name: 'Navigation Tour',
  description: 'Learn how to navigate the application',
  steps: [
    {
      target: '[data-tour="nav-sidebar"]',
      title: 'Navigation Sidebar',
      description:
        'Your main navigation is organized by estate settlement phases. Click any section to expand it.',
      placement: 'right',
    },
    {
      target: '[data-tour="nav-phase-setup"]',
      title: 'Setup Phase',
      description:
        'Start here. Set up your estate profile, upload the death certificate, and check probate status.',
      placement: 'right',
    },
    {
      target: '[data-tour="nav-phase-discovery"]',
      title: 'Discovery Phase',
      description:
        'Find and catalog all estate assets. Use the Document Scanner and Asset Detective to help.',
      placement: 'right',
    },
    {
      target: '[data-tour="nav-notifications"]',
      title: 'Notifications',
      description:
        'The bell icon shows items that need your attention. Click it to see urgent tasks and follow-ups.',
      placement: 'bottom',
    },
    {
      target: '[data-tour="nav-search"]',
      title: 'Quick Search',
      description:
        'Press Cmd+K (or Ctrl+K) anytime to search for assets, documents, or actions.',
      placement: 'bottom',
    },
  ],
};

export const allTours: TourDefinition[] = [
  dashboardTour,
  assetDetailTour,
  navigationTour,
];

export function getTourById(id: string): TourDefinition | undefined {
  return allTours.find((t) => t.id === id);
}
