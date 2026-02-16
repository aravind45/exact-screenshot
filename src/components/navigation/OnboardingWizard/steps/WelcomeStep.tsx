import { Heart, ArrowRight } from 'lucide-react';
import type { WizardStepProps } from '@/types/navigation';

export function WelcomeStep({ onNext, onSkip }: WizardStepProps) {
  return (
    <div data-testid="wizard-step-welcome" className="text-center">
      <div className="flex justify-center mb-6">
        <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center">
          <Heart className="w-8 h-8 text-blue-500" aria-hidden="true" />
        </div>
      </div>

      <h2 className="text-2xl font-bold text-slate-800 mb-3">
        We're sorry for your loss.
      </h2>
      <p className="text-lg text-slate-600 mb-2">We're here to help.</p>

      <p className="text-sm text-slate-500 mb-8 max-w-sm mx-auto">
        ExpectedEstate guides you through the estate settlement process step by
        step — from gathering assets to final distribution. Let's get you set up
        in just a few minutes.
      </p>

      <div className="flex flex-col gap-3">
        <button
          data-testid="wizard-welcome-start"
          onClick={onNext}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 text-sm font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600 active:bg-blue-700 transition-all duration-150 ease-out"
        >
          Get started
          <ArrowRight className="w-4 h-4" aria-hidden="true" />
        </button>
        <button
          data-testid="wizard-welcome-skip"
          onClick={onSkip}
          className="text-sm text-slate-400 hover:text-slate-600 transition-all duration-150 ease-out"
        >
          Skip wizard (not recommended)
        </button>
      </div>
    </div>
  );
}
