import { useState, useCallback, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { WizardStep, WizardState, OnboardingWizardProps } from '@/types/navigation';
import { WelcomeStep } from './steps/WelcomeStep';
import { EstateProfileStep } from './steps/EstateProfileStep';
import { ProbateStatusStep } from './steps/ProbateStatusStep';
import { FirstAssetStep } from './steps/FirstAssetStep';
import { DashboardTourStep } from './steps/DashboardTourStep';
import { WizardProgressIndicator } from './WizardProgressIndicator';
import { X } from 'lucide-react';

const WIZARD_STORAGE_KEY = 'expectedestate-onboarding-wizard';
const TOTAL_STEPS = 5;

export function getWizardState(): WizardState | null {
  try {
    const stored = localStorage.getItem(WIZARD_STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {
    // ignore parse errors
  }
  return null;
}

export function saveWizardState(state: WizardState): void {
  try {
    localStorage.setItem(WIZARD_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore storage errors
  }
}

export function isWizardCompleted(): boolean {
  const state = getWizardState();
  return state?.isCompleted ?? false;
}

const defaultWizardState: WizardState = {
  currentStep: 1,
  isOpen: true,
  isCompleted: false,
  estateProfile: {
    deceasedName: '',
    executorName: '',
    state: '',
    deathCertificateUploaded: false,
  },
  probateStatus: {
    probateRequired: '',
    probateType: '',
  },
  firstAsset: {
    assetName: '',
    institution: '',
    assetType: '',
  },
};

export function OnboardingWizard({
  isOpen,
  onClose,
  onComplete,
  onSkip,
  initialStep = 1,
}: OnboardingWizardProps) {
  const [wizardState, setWizardState] = useState<WizardState>(() => {
    const saved = getWizardState();
    if (saved && !saved.isCompleted) {
      return { ...saved, currentStep: initialStep || saved.currentStep };
    }
    return { ...defaultWizardState, currentStep: initialStep };
  });

  const [showSkipConfirm, setShowSkipConfirm] = useState(false);
  const [direction, setDirection] = useState<1 | -1>(1);

  const currentStep = wizardState.currentStep;

  // Persist state changes
  useEffect(() => {
    saveWizardState(wizardState);
  }, [wizardState]);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Handle Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowSkipConfirm(true);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const goToNext = useCallback(() => {
    if (currentStep < TOTAL_STEPS) {
      setDirection(1);
      setWizardState((prev) => ({
        ...prev,
        currentStep: (prev.currentStep + 1) as WizardStep,
      }));
    }
  }, [currentStep]);

  const goToBack = useCallback(() => {
    if (currentStep > 1) {
      setDirection(-1);
      setWizardState((prev) => ({
        ...prev,
        currentStep: (prev.currentStep - 1) as WizardStep,
      }));
    }
  }, [currentStep]);

  const handleComplete = useCallback(() => {
    setWizardState((prev) => ({
      ...prev,
      isCompleted: true,
      isOpen: false,
    }));
    onComplete();
  }, [onComplete]);

  const handleSkip = useCallback(() => {
    setWizardState((prev) => ({
      ...prev,
      isOpen: false,
    }));
    onSkip();
    setShowSkipConfirm(false);
  }, [onSkip]);

  const updateEstateProfile = useCallback(
    (data: Partial<WizardState['estateProfile']>) => {
      setWizardState((prev) => ({
        ...prev,
        estateProfile: { ...prev.estateProfile, ...data },
      }));
    },
    []
  );

  const updateProbateStatus = useCallback(
    (data: Partial<WizardState['probateStatus']>) => {
      setWizardState((prev) => ({
        ...prev,
        probateStatus: { ...prev.probateStatus, ...data },
      }));
    },
    []
  );

  const updateFirstAsset = useCallback(
    (data: Partial<WizardState['firstAsset']>) => {
      setWizardState((prev) => ({
        ...prev,
        firstAsset: { ...prev.firstAsset, ...data },
      }));
    },
    []
  );

  if (!isOpen) return null;

  const slideVariants = {
    enter: (dir: number) => ({ x: dir > 0 ? 80 : -80, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? -80 : 80, opacity: 0 }),
  };

  return (
    <div
      data-testid="wizard-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label="Onboarding wizard"
    >
      {/* Backdrop */}
      <div
        data-testid="wizard-backdrop"
        className="absolute inset-0 bg-black/50"
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        data-testid="wizard-modal"
        className="relative z-10 w-full max-w-lg mx-4 bg-white rounded-xl shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div
          data-testid="wizard-header"
          className="flex items-center justify-between px-6 py-4 border-b border-slate-200"
        >
          <WizardProgressIndicator
            currentStep={currentStep}
            totalSteps={TOTAL_STEPS}
          />
          <button
            data-testid="wizard-close-button"
            onClick={() => setShowSkipConfirm(true)}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 active:bg-slate-200 transition-all duration-150 ease-out"
            aria-label="Close wizard"
            style={{ minWidth: 44, minHeight: 44 }}
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Step Content */}
        <div
          data-testid="wizard-content"
          className="relative overflow-hidden"
          style={{ minHeight: 360 }}
        >
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentStep}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.2, ease: 'easeInOut' }}
              className="px-6 py-6"
            >
              {currentStep === 1 && (
                <WelcomeStep
                  onNext={goToNext}
                  onBack={goToBack}
                  onSkip={() => setShowSkipConfirm(true)}
                />
              )}
              {currentStep === 2 && (
                <EstateProfileStep
                  onNext={goToNext}
                  onBack={goToBack}
                  onSkip={() => setShowSkipConfirm(true)}
                  data={wizardState.estateProfile}
                  onUpdate={updateEstateProfile}
                />
              )}
              {currentStep === 3 && (
                <ProbateStatusStep
                  onNext={goToNext}
                  onBack={goToBack}
                  onSkip={() => setShowSkipConfirm(true)}
                  data={wizardState.probateStatus}
                  onUpdate={updateProbateStatus}
                />
              )}
              {currentStep === 4 && (
                <FirstAssetStep
                  onNext={goToNext}
                  onBack={goToBack}
                  onSkip={() => setShowSkipConfirm(true)}
                  data={wizardState.firstAsset}
                  onUpdate={updateFirstAsset}
                />
              )}
              {currentStep === 5 && (
                <DashboardTourStep
                  onNext={handleComplete}
                  onBack={goToBack}
                  onSkip={() => setShowSkipConfirm(true)}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Skip Confirmation Dialog */}
      {showSkipConfirm && (
        <div
          data-testid="wizard-skip-confirm"
          className="fixed inset-0 z-[60] flex items-center justify-center"
          role="dialog"
          aria-modal="true"
          aria-label="Skip setup wizard confirmation"
        >
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setShowSkipConfirm(false)}
            aria-hidden="true"
          />
          <div className="relative z-10 bg-white rounded-xl shadow-xl p-6 mx-4 max-w-sm w-full">
            <h3 className="text-lg font-semibold text-slate-800 mb-2">
              Skip setup wizard?
            </h3>
            <p className="text-sm text-slate-600 mb-4">
              We recommend completing the wizard to get the most out of
              ExpectedEstate. You can restart it later from Settings.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                data-testid="wizard-skip-cancel"
                onClick={() => setShowSkipConfirm(false)}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 active:bg-slate-300 transition-all duration-150 ease-out"
              >
                Continue wizard
              </button>
              <button
                data-testid="wizard-skip-confirm-button"
                onClick={handleSkip}
                className="px-4 py-2 text-sm font-medium text-white bg-slate-600 rounded-lg hover:bg-slate-700 active:bg-slate-800 transition-all duration-150 ease-out"
              >
                Skip for now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
