import { ArrowRight, ArrowLeft, Upload } from 'lucide-react';
import type { WizardStepProps, EstateProfileData } from '@/types/navigation';

interface EstateProfileStepProps extends WizardStepProps {
  data: EstateProfileData;
  onUpdate: (data: Partial<EstateProfileData>) => void;
}

const US_STATES = [
  'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado',
  'Connecticut', 'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho',
  'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana',
  'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota',
  'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada',
  'New Hampshire', 'New Jersey', 'New Mexico', 'New York',
  'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon',
  'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota',
  'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington',
  'West Virginia', 'Wisconsin', 'Wyoming',
];

export function EstateProfileStep({
  onNext,
  onBack,
  data,
  onUpdate,
}: EstateProfileStepProps) {
  return (
    <div data-testid="wizard-step-estate-profile">
      <h2 className="text-xl font-bold text-slate-800 mb-1">Estate Profile</h2>
      <p className="text-sm text-slate-500 mb-6">
        Tell us about the estate you're managing.
      </p>

      <div className="space-y-4">
        <div>
          <label
            htmlFor="deceased-name"
            className="block text-sm font-medium text-slate-700 mb-1"
          >
            Name of deceased
          </label>
          <input
            id="deceased-name"
            data-testid="wizard-input-deceased-name"
            type="text"
            value={data.deceasedName}
            onChange={(e) => onUpdate({ deceasedName: e.target.value })}
            placeholder="Full legal name"
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label
            htmlFor="executor-name"
            className="block text-sm font-medium text-slate-700 mb-1"
          >
            Executor / Administrator name
          </label>
          <input
            id="executor-name"
            data-testid="wizard-input-executor-name"
            type="text"
            value={data.executorName}
            onChange={(e) => onUpdate({ executorName: e.target.value })}
            placeholder="Your full name"
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label
            htmlFor="state-select"
            className="block text-sm font-medium text-slate-700 mb-1"
          >
            State / Jurisdiction
          </label>
          <select
            id="state-select"
            data-testid="wizard-input-state"
            value={data.state}
            onChange={(e) => onUpdate({ state: e.target.value })}
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
          >
            <option value="">Select a state</option>
            {US_STATES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Death certificate
          </label>
          <button
            data-testid="wizard-upload-death-cert"
            onClick={() => onUpdate({ deathCertificateUploaded: !data.deathCertificateUploaded })}
            className={`w-full flex items-center justify-center gap-2 px-3 py-3 text-sm border-2 border-dashed rounded-lg transition-all duration-150 ease-out ${
              data.deathCertificateUploaded
                ? 'border-green-300 bg-green-50 text-green-700'
                : 'border-slate-300 text-slate-500 hover:border-blue-300 hover:text-blue-500'
            }`}
          >
            <Upload className="w-4 h-4" aria-hidden="true" />
            {data.deathCertificateUploaded
              ? 'Death certificate uploaded ✓'
              : 'Upload death certificate (optional)'}
          </button>
        </div>
      </div>

      <div className="flex justify-between mt-6">
        <button
          data-testid="wizard-estate-back"
          onClick={onBack}
          className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 transition-all duration-150 ease-out"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          Back
        </button>
        <button
          data-testid="wizard-estate-next"
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
