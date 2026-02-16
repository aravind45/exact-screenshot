import { ArrowRight, ArrowLeft, Scale, FileText, HelpCircle } from 'lucide-react';
import type { WizardStepProps, ProbateStatusData } from '@/types/navigation';

interface ProbateStatusStepProps extends WizardStepProps {
  data: ProbateStatusData;
  onUpdate: (data: Partial<ProbateStatusData>) => void;
}

export function ProbateStatusStep({
  onNext,
  onBack,
  data,
  onUpdate,
}: ProbateStatusStepProps) {
  return (
    <div data-testid="wizard-step-probate-status">
      <h2 className="text-xl font-bold text-slate-800 mb-1">Probate Status</h2>
      <p className="text-sm text-slate-500 mb-6">
        Let's determine the probate requirements for this estate.
      </p>

      <div className="space-y-4">
        <div>
          <p className="text-sm font-medium text-slate-700 mb-3">
            Is probate required?
          </p>
          <div className="space-y-2">
            {([
              { value: 'yes', label: 'Yes, probate is required', icon: Scale },
              { value: 'no', label: 'No, probate is not needed', icon: FileText },
              { value: 'unsure', label: "I'm not sure", icon: HelpCircle },
            ] as const).map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                data-testid={`wizard-probate-${value}`}
                onClick={() => onUpdate({ probateRequired: value })}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm text-left border rounded-lg transition-all duration-150 ease-out ${
                  data.probateRequired === value
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
                {label}
              </button>
            ))}
          </div>
        </div>

        {data.probateRequired === 'yes' && (
          <div>
            <p className="text-sm font-medium text-slate-700 mb-3">
              What type of probate?
            </p>
            <div className="space-y-2">
              <button
                data-testid="wizard-probate-type-full"
                onClick={() => onUpdate({ probateType: 'full' })}
                className={`w-full text-left px-4 py-3 text-sm border rounded-lg transition-all duration-150 ease-out ${
                  data.probateType === 'full'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <span className="font-medium">Full Probate</span>
                <p className="text-xs text-slate-500 mt-0.5">
                  For larger estates that require court supervision
                </p>
              </button>
              <button
                data-testid="wizard-probate-type-small"
                onClick={() => onUpdate({ probateType: 'small-estate' })}
                className={`w-full text-left px-4 py-3 text-sm border rounded-lg transition-all duration-150 ease-out ${
                  data.probateType === 'small-estate'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <span className="font-medium">Small Estate Affidavit</span>
                <p className="text-xs text-slate-500 mt-0.5">
                  Simplified process for estates under the state threshold
                </p>
              </button>
            </div>
          </div>
        )}

        {data.probateRequired === 'unsure' && (
          <div
            data-testid="wizard-probate-help"
            className="p-4 bg-amber-50 border border-amber-200 rounded-lg"
          >
            <p className="text-sm text-amber-800">
              <strong>Not sure?</strong> That's okay. Probate requirements vary
              by state and estate size. You can update this later, or contact our
              support team for guidance.
            </p>
          </div>
        )}
      </div>

      <div className="flex justify-between mt-6">
        <button
          data-testid="wizard-probate-back"
          onClick={onBack}
          className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 transition-all duration-150 ease-out"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          Back
        </button>
        <button
          data-testid="wizard-probate-next"
          onClick={onNext}
          className="flex items-center gap-2 px-6 py-2 text-sm font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600 active:bg-blue-700 transition-all duration-150 ease-out"
        >
          Continue
          <ArrowRight className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
