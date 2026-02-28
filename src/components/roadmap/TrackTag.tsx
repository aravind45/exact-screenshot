import React from 'react';

interface TrackTagProps {
  authorityScope?: 'PROBATE' | 'TRUST' | 'BOTH';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

const TRACK_CONFIG = {
  PROBATE: {
    label: 'Probate',
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-800',
    borderColor: 'border-blue-300',
  },
  TRUST: {
    label: 'Trust',
    bgColor: 'bg-green-100',
    textColor: 'text-green-800',
    borderColor: 'border-green-300',
  },
  BOTH: {
    label: 'Both',
    bgColor: 'bg-purple-100',
    textColor: 'text-purple-800',
    borderColor: 'border-purple-300',
  },
};

const SIZE_CLASSES = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-3 py-1 text-sm',
  lg: 'px-4 py-1.5 text-base',
};

export function TrackTag({
  authorityScope,
  size = 'md',
  showLabel = true,
}: TrackTagProps) {
  if (!authorityScope) {
    return null;
  }

  const config = TRACK_CONFIG[authorityScope];
  const sizeClass = SIZE_CLASSES[size];

  return (
    <span
      className={`
        inline-flex items-center gap-1.5 rounded-md border font-medium
        ${config.bgColor} ${config.textColor} ${config.borderColor}
        ${sizeClass}
      `}
      title={`This task belongs to the ${config.label.toLowerCase()} track`}
    >
      {showLabel && <span>{config.label}</span>}
      {authorityScope === 'BOTH' && (
        <span className="inline-flex -ml-1">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500" title="Probate" />
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 ml-0.5" title="Trust" />
        </span>
      )}
    </span>
  );
}

// Export track-specific tags for convenience
export function ProbateTag({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' } = {}) {
  return <TrackTag authorityScope="PROBATE" size={size} />;
}

export function TrustTag({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' } = {}) {
  return <TrackTag authorityScope="TRUST" size={size} />;
}

export function BothTag({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' } = {}) {
  return <TrackTag authorityScope="BOTH" size={size} />;
}
