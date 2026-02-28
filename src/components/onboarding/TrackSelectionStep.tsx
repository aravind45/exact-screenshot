import React, { useState } from 'react';
import { CheckCircle, HelpCircle, Scale, FileText, Users, Landmark } from 'lucide-react';

interface TrackSelectionStepProps {
  onSelect: (selection: TrackSelection) => void;
  initialSelection?: 'PROBATE' | 'TRUST' | 'BOTH';
  loading?: boolean;
}

export interface TrackSelection {
  estateAuthorityType: 'PROBATE' | 'TRUST' | 'BOTH';
  hasProbateAssets: boolean;
  hasTrustAssets: boolean;
  hasBeneficiaryAssets: boolean;
}

interface TrackOption {
  type: 'PROBATE' | 'TRUST' | 'BOTH';
  title: string;
  description: string;
  icon: React.ReactNode;
  features: string[];
  color: string;
  bgColor: string;
}

const TRACK_OPTIONS: TrackOption[] = [
  {
    type: 'PROBATE',
    title: 'Probate Only',
    description: 'For estates that will go through court-supervised probate proceedings',
    icon: <Scale className="w-8 h-8" />,
    features: [
      'Court supervision required',
      'Letters Testamentary needed',
      'Standard probate timeline',
      'Full court oversight',
    ],
    color: 'blue',
    bgColor: 'bg-blue-50',
  },
  {
    type: 'TRUST',
    title: 'Trust Administration',
    description: 'For estates managed primarily through a trust document',
    icon: <FileText className="w-8 h-8" />,
    features: [
      'No court supervision required',
      'Trustee manages distribution',
      'Faster, private process',
      'Follows trust terms',
    ],
    color: 'green',
    bgColor: 'bg-green-50',
  },
  {
    type: 'BOTH',
    title: 'Mixed - Both',
    description: 'For estates with both probate and trust assets',
    icon: <Users className="w-8 h-8" />,
    features: [
      'Some assets in trust',
      'Some assets require probate',
      'Two-track administration',
      'Coordinated timelines',
    ],
    color: 'purple',
    bgColor: 'bg-purple-50',
  },
];

export function TrackSelectionStep({ onSelect, initialSelection, loading = false }: TrackSelectionStepProps) {
  const [selected, setSelected] = useState<'PROBATE' | 'TRUST' | 'BOTH' | null>(initialSelection || null);
  const [showHelp, setShowHelp] = useState(false);

  const handleSelect = (type: 'PROBATE' | 'TRUST' | 'BOTH') => {
    setSelected(type);

    // Default asset flags based on selection
    const selection: TrackSelection = {
      estateAuthorityType: type,
      hasProbateAssets: type === 'PROBATE' || type === 'BOTH',
      hasTrustAssets: type === 'TRUST' || type === 'BOTH',
      hasBeneficiaryAssets: false,
    };

    onSelect(selection);
  };

  const handleHelpMeDecide = () => {
    setShowHelp(true);
  };

  const getBorderColor = (type: 'PROBATE' | 'TRUST' | 'BOTH') => {
    if (!selected) return 'border-gray-200';
    return selected === type
      ? `border-${TRACK_OPTIONS.find(o => o.type === type)?.color}-500`
      : 'border-gray-200';
  };

  const getRingColor = (type: 'PROBATE' | 'TRUST' | 'BOTH') => {
    if (!selected) return '';
    return selected === type
      ? `ring-${TRACK_OPTIONS.find(o => o.type === type)?.color}-500`
      : '';
  };

  if (showHelp) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => setShowHelp(false)}
            className="text-gray-500 hover:text-gray-700 flex items-center gap-2"
          >
            <CheckCircle className="w-5 h-5" />
            <span>Back to Track Selection</span>
          </button>
        </div>
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg border border-gray-200 p-8 shadow-sm">
            <h2 className="text-2xl font-semibold mb-4">Help Me Decide</h2>
            <p className="text-gray-600 mb-6">
              Answer a few questions to help us determine the right track for your estate.
            </p>

            {/* Assisted Decision Questions would be implemented here */}
            <div className="space-y-6">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-gray-600">
                  <strong>Question 1:</strong> Did the deceased have a will?
                </p>
                <div className="mt-3 flex gap-3">
                  <button
                    onClick={() => setShowHelp(false)}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Yes
                  </button>
                  <button
                    onClick={() => setShowHelp(false)}
                    className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    No
                  </button>
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-gray-600">
                  <strong>Question 2:</strong> Did the deceased have a living trust?
                </p>
                <div className="mt-3 flex gap-3">
                  <button
                    onClick={() => {
                      handleSelect('TRUST');
                      setShowHelp(false);
                    }}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Yes
                  </button>
                  <button
                    onClick={() => setShowHelp(false)}
                    className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    No
                  </button>
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-gray-600">
                  <strong>Question 3:</strong> Are there assets owned personally (not in trust)?
                </p>
                <div className="mt-3 flex gap-3">
                  <button
                    onClick={() => {
                      handleSelect('BOTH');
                      setShowHelp(false);
                    }}
                    className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    Yes (I have both)
                  </button>
                  <button
                    onClick={() => setShowHelp(false)}
                    className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    No
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2 mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Select Your Estate Settlement Track
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Choose the track that best matches your estate situation. This helps us provide you with the right roadmap and tasks.
        </p>
      </div>

      {/* Help Button */}
      <div className="flex justify-center mb-6">
        <button
          onClick={handleHelpMeDecide}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-700 transition-colors"
        >
          <HelpCircle className="w-5 h-5" />
          <span className="font-medium">Help me decide</span>
        </button>
      </div>

      {/* Track Options */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto px-4">
        {TRACK_OPTIONS.map((option) => (
          <button
            key={option.type}
            onClick={() => handleSelect(option.type)}
            disabled={loading}
            className={`
              relative p-6 rounded-xl border-2 transition-all duration-200
              ${getBorderColor(option.type)}
              ${option.bgColor}
              hover:shadow-md hover:scale-[1.02]
              focus:outline-none focus:ring-4 ${getRingColor(option.type)}
              disabled:opacity-50 disabled:cursor-not-allowed
            `}
          >
            {/* Selection Checkmark */}
            {selected === option.type && (
              <div className={`absolute top-4 right-4 bg-${option.color}-500 rounded-full p-1`}>
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
            )}

            {/* Icon */}
            <div className="flex justify-center mb-4">
              <div className={`p-3 rounded-lg bg-white shadow-sm ${option.color === 'blue' ? 'text-blue-600' : option.color === 'green' ? 'text-green-600' : 'text-purple-600'}`}>
                {option.icon}
              </div>
            </div>

            {/* Title */}
            <h3 className={`text-xl font-semibold text-gray-900 mb-2 ${option.color === 'blue' ? 'text-blue-600' : option.color === 'green' ? 'text-green-600' : 'text-purple-600'}`}>
              {option.title}
            </h3>

            {/* Description */}
            <p className="text-sm text-gray-600 mb-4">
              {option.description}
            </p>

            {/* Features */}
            <ul className="space-y-2 text-sm text-gray-700">
              {option.features.map((feature, index) => (
                <li key={index} className="flex items-start gap-2">
                  <CheckCircle className={`w-4 h-4 mt-0.5 flex-shrink-0 ${option.color === 'blue' ? 'text-blue-500' : option.color === 'green' ? 'text-green-500' : 'text-purple-500'}`} />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </button>
        ))}
      </div>

      {/* Selection Summary */}
      {selected && (
        <div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-lg max-w-2xl mx-auto">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-6 h-6 text-blue-600 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-blue-900 text-lg">
                You selected: {TRACK_OPTIONS.find(o => o.type === selected)?.title}
              </h3>
              <p className="text-sm text-blue-700 mt-1">
                Click continue to proceed with this track. You can change this later if needed.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
