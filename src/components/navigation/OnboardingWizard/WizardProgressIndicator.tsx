interface WizardProgressIndicatorProps {
  currentStep: number;
  totalSteps: number;
}

export function WizardProgressIndicator({
  currentStep,
  totalSteps,
}: WizardProgressIndicatorProps) {
  return (
    <div data-testid="wizard-progress" className="flex items-center gap-3">
      <span
        data-testid="wizard-step-label"
        className="text-sm font-medium text-slate-600"
      >
        Step {currentStep} of {totalSteps}
      </span>
      <div className="flex gap-1.5">
        {Array.from({ length: totalSteps }, (_, i) => (
          <div
            key={i}
            data-testid={`wizard-progress-dot-${i + 1}`}
            className={`h-2 rounded-full transition-all duration-300 ${
              i + 1 === currentStep
                ? 'w-6 bg-blue-500'
                : i + 1 < currentStep
                  ? 'w-2 bg-blue-500'
                  : 'w-2 bg-slate-200'
            }`}
            aria-label={
              i + 1 === currentStep
                ? `Step ${i + 1}, current`
                : i + 1 < currentStep
                  ? `Step ${i + 1}, completed`
                  : `Step ${i + 1}, upcoming`
            }
          />
        ))}
      </div>
    </div>
  );
}
