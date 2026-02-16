import { ArrowRight, ArrowLeft, Landmark } from 'lucide-react';
import type { WizardStepProps, FirstAssetData } from '@/types/navigation';

interface FirstAssetStepProps extends WizardStepProps {
  data: FirstAssetData;
  onUpdate: (data: Partial<FirstAssetData>) => void;
}

const ASSET_TYPES = [
  'Bank Account',
  'Investment / Brokerage',
  'Retirement Account (401k, IRA)',
  'Life Insurance',
  'Real Estate',
  'Vehicle',
  'Other',
];

export function FirstAssetStep({
  onNext,
  onBack,
  data,
  onUpdate,
}: FirstAssetStepProps) {
  return (
    <div data-testid="wizard-step-first-asset">
      <div className="flex items-center gap-3 mb-1">
        <Landmark className="w-5 h-5 text-blue-500" aria-hidden="true" />
        <h2 className="text-xl font-bold text-slate-800">Add Your First Asset</h2>
      </div>
      <p className="text-sm text-slate-500 mb-6">
        Start by adding one asset. You can add more later from the Asset
        Inventory.
      </p>

      <div className="space-y-4">
        <div>
          <label
            htmlFor="asset-name"
            className="block text-sm font-medium text-slate-700 mb-1"
          >
            Asset name
          </label>
          <input
            id="asset-name"
            data-testid="wizard-input-asset-name"
            type="text"
            value={data.assetName}
            onChange={(e) => onUpdate({ assetName: e.target.value })}
            placeholder='e.g., "Fidelity 401k" or "Chase Checking"'
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label
            htmlFor="institution"
            className="block text-sm font-medium text-slate-700 mb-1"
          >
            Institution
          </label>
          <input
            id="institution"
            data-testid="wizard-input-institution"
            type="text"
            value={data.institution}
            onChange={(e) => onUpdate({ institution: e.target.value })}
            placeholder="e.g., Fidelity, Chase, State Farm"
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label
            htmlFor="asset-type"
            className="block text-sm font-medium text-slate-700 mb-1"
          >
            Asset type
          </label>
          <select
            id="asset-type"
            data-testid="wizard-input-asset-type"
            value={data.assetType}
            onChange={(e) => onUpdate({ assetType: e.target.value })}
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
          >
            <option value="">Select asset type</option>
            {ASSET_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        <div className="p-3 bg-slate-50 rounded-lg">
          <p className="text-xs text-slate-500">
            💡 After setup, you'll find all your assets in the{' '}
            <strong>Asset Inventory</strong> under the Discovery phase. You can
            add details, track status, and log communications for each asset.
          </p>
        </div>
      </div>

      <div className="flex justify-between mt-6">
        <button
          data-testid="wizard-asset-back"
          onClick={onBack}
          className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          Back
        </button>
        <button
          data-testid="wizard-asset-next"
          onClick={onNext}
          className="flex items-center gap-2 px-6 py-2 text-sm font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors"
        >
          Continue
          <ArrowRight className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
