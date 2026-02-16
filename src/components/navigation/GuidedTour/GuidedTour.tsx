import { useState, useEffect, useCallback, useRef } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import type { GuidedTourProps } from '@/types/navigation';

interface TargetRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

const SPOTLIGHT_PADDING = 8;

function getTargetRect(selector: string): TargetRect | null {
  const el = document.querySelector(selector);
  if (!el) return null;
  const rect = el.getBoundingClientRect();
  return {
    top: rect.top + window.scrollY,
    left: rect.left + window.scrollX,
    width: rect.width,
    height: rect.height,
  };
}

function computeTooltipStyle(
  targetRect: TargetRect | null,
  placement: 'top' | 'bottom' | 'left' | 'right' = 'bottom'
): React.CSSProperties {
  if (!targetRect) {
    // Center on screen when no target found
    return {
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
    };
  }

  const viewportTop = targetRect.top - window.scrollY;
  const viewportLeft = targetRect.left - window.scrollX;
  const gap = 12;

  switch (placement) {
    case 'top':
      return {
        position: 'fixed',
        top: viewportTop - gap,
        left: viewportLeft + targetRect.width / 2,
        transform: 'translate(-50%, -100%)',
      };
    case 'bottom':
      return {
        position: 'fixed',
        top: viewportTop + targetRect.height + gap,
        left: viewportLeft + targetRect.width / 2,
        transform: 'translateX(-50%)',
      };
    case 'left':
      return {
        position: 'fixed',
        top: viewportTop + targetRect.height / 2,
        left: viewportLeft - gap,
        transform: 'translate(-100%, -50%)',
      };
    case 'right':
      return {
        position: 'fixed',
        top: viewportTop + targetRect.height / 2,
        left: viewportLeft + targetRect.width + gap,
        transform: 'translateY(-50%)',
      };
  }
}

export function GuidedTour({ tour, onComplete, onSkip }: GuidedTourProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<TargetRect | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const step = tour.steps[stepIndex];
  const isFirst = stepIndex === 0;
  const isLast = stepIndex === tour.steps.length - 1;

  // Measure target element position
  const measureTarget = useCallback(() => {
    if (!step) return;
    const rect = getTargetRect(step.target);
    setTargetRect(rect);

    // Scroll target into view if needed
    if (rect) {
      const el = document.querySelector(step.target);
      el?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [step]);

  useEffect(() => {
    measureTarget();
    window.addEventListener('resize', measureTarget);
    window.addEventListener('scroll', measureTarget, true);
    return () => {
      window.removeEventListener('resize', measureTarget);
      window.removeEventListener('scroll', measureTarget, true);
    };
  }, [measureTarget]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onSkip();
      } else if (e.key === 'ArrowRight' || e.key === 'Enter') {
        if (isLast) {
          onComplete();
        } else {
          setStepIndex((i) => i + 1);
        }
      } else if (e.key === 'ArrowLeft') {
        if (!isFirst) {
          setStepIndex((i) => i - 1);
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isFirst, isLast, onComplete, onSkip]);

  // Focus tooltip on step change for screen readers
  useEffect(() => {
    tooltipRef.current?.focus();
  }, [stepIndex]);

  if (!step) return null;

  const tooltipStyle = computeTooltipStyle(targetRect, step.placement);

  return (
    <div
      data-testid="guided-tour-overlay"
      className="fixed inset-0 z-[100]"
      role="dialog"
      aria-modal="true"
      aria-label={`${tour.name}: Step ${stepIndex + 1} of ${tour.steps.length}`}
    >
      {/* SVG overlay with spotlight cutout */}
      <svg
        data-testid="guided-tour-backdrop"
        className="fixed inset-0 w-full h-full"
        style={{ zIndex: 100 }}
        aria-hidden="true"
      >
        <defs>
          <mask id="tour-spotlight-mask">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {targetRect && (
              <rect
                data-testid="guided-tour-spotlight"
                x={targetRect.left - window.scrollX - SPOTLIGHT_PADDING}
                y={targetRect.top - window.scrollY - SPOTLIGHT_PADDING}
                width={targetRect.width + SPOTLIGHT_PADDING * 2}
                height={targetRect.height + SPOTLIGHT_PADDING * 2}
                rx="8"
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="rgba(0,0,0,0.5)"
          mask="url(#tour-spotlight-mask)"
        />
      </svg>

      {/* Tooltip */}
      <div
        ref={tooltipRef}
        data-testid="guided-tour-tooltip"
        className="bg-white rounded-xl shadow-2xl p-5 w-80 max-w-[90vw]"
        style={{ ...tooltipStyle, zIndex: 101 }}
        role="alertdialog"
        aria-label={step.title}
        aria-describedby="guided-tour-step-desc"
        tabIndex={-1}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-2">
          <h3
            data-testid="guided-tour-step-title"
            className="text-base font-semibold text-slate-800"
          >
            {step.title}
          </h3>
          <button
            data-testid="guided-tour-skip"
            onClick={onSkip}
            className="p-1 -mr-1 -mt-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100 active:bg-slate-200 transition-all duration-150 ease-out"
            aria-label="Skip tour"
            style={{ minWidth: 32, minHeight: 32 }}
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        {/* Description */}
        <p
          id="guided-tour-step-desc"
          data-testid="guided-tour-step-description"
          className="text-sm text-slate-600 leading-relaxed mb-4"
        >
          {step.description}
        </p>

        {/* Footer: step counter + nav buttons */}
        <div className="flex items-center justify-between">
          <span
            data-testid="guided-tour-step-counter"
            className="text-xs text-slate-400"
          >
            {stepIndex + 1} of {tour.steps.length}
          </span>

          <div className="flex gap-2">
            {!isFirst && (
              <button
                data-testid="guided-tour-back"
                onClick={() => setStepIndex((i) => i - 1)}
                className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 active:bg-slate-300 transition-all duration-150 ease-out"
                aria-label="Previous step"
              >
                <ChevronLeft className="w-4 h-4" aria-hidden="true" />
                Back
              </button>
            )}
            <button
              data-testid="guided-tour-next"
              onClick={() => {
                if (isLast) {
                  onComplete();
                } else {
                  setStepIndex((i) => i + 1);
                }
              }}
              className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600 active:bg-blue-700 transition-all duration-150 ease-out"
              aria-label={isLast ? 'Finish tour' : 'Next step'}
            >
              {isLast ? 'Finish' : 'Next'}
              {!isLast && (
                <ChevronRight className="w-4 h-4" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
