import {
  Settings,
  Search,
  ClipboardList,
  Trophy,
  HelpCircle,
  PartyPopper,
} from 'lucide-react';
import type { WizardStepProps } from '@/types/navigation';

const TOUR_SECTIONS = [
  {
    icon: Settings,
    title: 'Setup Phase',
    description: 'Estate profile, probate hub, and your dashboard live here.',
  },
  {
    icon: Search,
    title: 'Discovery Phase',
    description: 'Find and catalog all estate assets using our tools.',
  },
  {
    icon: ClipboardList,
    title: 'Settlement Phase',
    description: 'Process assets, log communications, and track follow-ups.',
  },
  {
    icon: Trophy,
    title: 'Close Phase',
    description: 'Final distributions, tax documents, and estate closure.',
  },
  {
    icon: HelpCircle,
    title: 'Need Help?',
    description: 'Access help, support, and settings from the sidebar.',
  },
];

export function DashboardTourStep({ onNext, onBack }: WizardStepProps) {
  return (
    <div data-testid="wizard-step-dashboard-tour">
      <div className="flex items-center gap-3 mb-1">
        <PartyPopper className="w-5 h-5 text-blue-500" aria-hidden="true" />
        <h2 className="text-xl font-bold text-slate-800">Your Dashboard</h2>
      </div>
      <p className="text-sm text-slate-500 mb-5">
        Here's how the navigation is organized. Each phase guides you through
        the estate settlement process.
      </p>

      <div className="space-y-3">
        {TOUR_SECTIONS.map(({ icon: Icon, title, description }) => (
          <div
            key={title}
            data-testid={`wizard-tour-section-${title.toLowerCase().replace(/\s+/g, '-')}`}
            className="flex items-start gap-3 p-3 rounded-lg bg-slate-50"
          >
            <div className="w-8 h-8 rounded-md bg-white border border-slate-200 flex items-center justify-center flex-shrink-0">
              <Icon className="w-4 h-4 text-slate-600" aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-700">{title}</p>
              <p className="text-xs text-slate-500">{description}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-between mt-6">
        <button
          data-testid="wizard-tour-back"
          onClick={onBack}
          className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors"
        >
          Back
        </button>
        <button
          data-testid="wizard-tour-complete"
          onClick={onNext}
          className="flex items-center gap-2 px-6 py-2 text-sm font-medium text-white bg-green-500 rounded-lg hover:bg-green-600 transition-colors"
        >
          <PartyPopper className="w-4 h-4" aria-hidden="true" />
          Complete setup
        </button>
      </div>
    </div>
  );
}
