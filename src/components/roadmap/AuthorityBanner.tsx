import React from 'react';
import { AlertTriangle, Info, Shield } from 'lucide-react';

interface AuthorityBannerProps {
  estateAuthorityType: 'PROBATE' | 'TRUST' | 'BOTH';
  authoritySource: 'USER_SELECTION' | 'ENGINE_HIGH_CONFIDENCE' | 'ENGINE_LOW_CONFIDENCE' | 'DEFAULT_FAIL_CLOSED';
  confidence: number;
  userSelectedAuthorityType?: 'PROBATE' | 'TRUST' | 'BOTH';
  onCompleteTrackSelection?: () => void;
}

export function AuthorityBanner({
  estateAuthorityType,
  authoritySource,
  confidence,
  userSelectedAuthorityType,
  onCompleteTrackSelection,
}: AuthorityBannerProps) {
  // Don't show banner if user has explicitly selected a track
  if (authoritySource === 'USER_SELECTION' && userSelectedAuthorityType) {
    return null;
  }

  // Show DEFAULT_FAIL_CLOSED banner
  if (authoritySource === 'DEFAULT_FAIL_CLOSED') {
    return (
      <div className="bg-amber-50 border-2 border-amber-300 rounded-lg p-6 mb-6">
        <div className="flex items-start gap-4">
          <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-amber-900 mb-2">
              We Need More Information
            </h3>
            <p className="text-amber-800 mb-4">
              We couldn't automatically determine the best track for your estate with high confidence. 
              We've defaulted to the <strong>Probate</strong> track for safety.
            </p>
            <div className="space-y-3">
              <div className="flex items-start gap-2 text-sm text-amber-700">
                <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>
                  Your confidence score is <strong>{confidence}%</strong>. A score of 70% or higher is recommended for accurate track selection.
                </span>
              </div>
              <div className="flex items-start gap-2 text-sm text-amber-700">
                <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>
                  Adding more asset information (especially trust assets or wills) will improve our recommendation.
                </span>
              </div>
              {onCompleteTrackSelection && (
                <button
                  onClick={onCompleteTrackSelection}
                  className="mt-4 px-6 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors font-medium"
                >
                  Complete Track Selection
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show ENGINE_LOW_CONFIDENCE banner
  if (authoritySource === 'ENGINE_LOW_CONFIDENCE') {
    return (
      <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-6 mb-6">
        <div className="flex items-start gap-4">
          <Info className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-yellow-900 mb-2">
              Track Selection With Moderate Confidence
            </h3>
            <p className="text-yellow-800 mb-3">
              We've determined your track based on available information, but our confidence is moderate 
              ({confidence}%).
            </p>
            <p className="text-sm text-yellow-700">
              <strong>Recommendation:</strong> Add more asset details or complete explicit track selection for the most accurate roadmap.
            </p>
            {onCompleteTrackSelection && (
              <button
                onClick={onCompleteTrackSelection}
                className="mt-4 px-6 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors font-medium"
              selection
              >
                Review Track Selection
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Show ENGINE_HIGH_CONFIDENCE banner (informational)
  if (authoritySource === 'ENGINE_HIGH_CONFIDENCE' && confidence < 100) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
        <div className="flex items-center gap-3">
          <Shield className="w-5 h-5 text-green-600 flex-shrink-0" />
          <div>
            <p className="text-sm text-green-800">
              <strong>High confidence track detection</strong> ({confidence}%). Your roadmap is based on clear asset signals.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Show BOTH mode banner
  if (estateAuthorityType === 'BOTH' && authoritySource !== 'USER_SELECTION') {
    return (
      <div className="bg-purple-50 border-2 border-purple-300 rounded-lg p-6 mb-6">
        <div className="flex items-start gap-4">
          <Info className="w-6 h-6 text-purple-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-purple-900 mb-2">
              Mixed Estate Track
            </h3>
            <p className="text-purple-800 mb-3">
              Your estate has both probate and trust assets. You'll see tasks for both tracks in your roadmap.
            </p>
            <div className="space-y-2 text-sm text-purple-700">
              <p>
                <strong>Probate Track:</strong> For assets requiring court supervision (Letters Testamentary, inventory, court filings).
              </p>
              <p>
                <strong>Trust Track:</strong> For assets managed through your trust document (trustee administration, beneficiary distributions).
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show USER_SELECTION confirmation
  if (authoritySource === 'USER_SELECTION' && userSelectedAuthorityType) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-center gap-3">
          <Shield className="w-5 h-5 text-blue-600 flex-shrink-0" />
          <div>
            <p className="text-sm text-blue-800">
              <strong>Track Locked:</strong> You've selected the <strong>{userSelectedAuthorityType}</strong> track. 
              Your roadmap is customized for this track.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
