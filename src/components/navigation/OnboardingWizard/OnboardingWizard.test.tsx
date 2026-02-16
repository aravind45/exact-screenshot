import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  OnboardingWizard,
  isWizardCompleted,
  getWizardState,
  saveWizardState,
} from './OnboardingWizard';
import { WizardProgressIndicator } from './WizardProgressIndicator';
import type { WizardState } from '@/types/navigation';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, custom, variants, initial, animate, exit, transition, ...props }: any) => (
      <div {...props}>{children}</div>
    ),
  },
  AnimatePresence: ({ children }: any) => children,
}));

const defaultProps = {
  isOpen: true,
  onClose: vi.fn(),
  onComplete: vi.fn(),
  onSkip: vi.fn(),
};

describe('OnboardingWizard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    document.body.style.overflow = '';
  });

  // --- 13.1 Wizard Modal Component ---
  describe('13.1 Wizard Modal Component', () => {
    it('renders the modal overlay when open', () => {
      render(<OnboardingWizard {...defaultProps} />);
      expect(screen.getByTestId('wizard-overlay')).toBeInTheDocument();
    });

    it('renders the backdrop', () => {
      render(<OnboardingWizard {...defaultProps} />);
      expect(screen.getByTestId('wizard-backdrop')).toBeInTheDocument();
    });

    it('renders the modal container', () => {
      render(<OnboardingWizard {...defaultProps} />);
      expect(screen.getByTestId('wizard-modal')).toBeInTheDocument();
    });

    it('does not render when isOpen is false', () => {
      render(<OnboardingWizard {...defaultProps} isOpen={false} />);
      expect(screen.queryByTestId('wizard-overlay')).not.toBeInTheDocument();
    });

    it('has role="dialog" and aria-modal="true"', () => {
      render(<OnboardingWizard {...defaultProps} />);
      const overlay = screen.getByTestId('wizard-overlay');
      expect(overlay).toHaveAttribute('role', 'dialog');
      expect(overlay).toHaveAttribute('aria-modal', 'true');
    });

    it('has aria-label on the dialog', () => {
      render(<OnboardingWizard {...defaultProps} />);
      expect(screen.getByTestId('wizard-overlay')).toHaveAttribute(
        'aria-label',
        'Onboarding wizard'
      );
    });

    it('locks body scroll when open', () => {
      render(<OnboardingWizard {...defaultProps} />);
      expect(document.body.style.overflow).toBe('hidden');
    });

    it('restores body scroll on unmount', () => {
      const { unmount } = render(<OnboardingWizard {...defaultProps} />);
      expect(document.body.style.overflow).toBe('hidden');
      unmount();
      expect(document.body.style.overflow).toBe('');
    });

    it('renders close button', () => {
      render(<OnboardingWizard {...defaultProps} />);
      expect(screen.getByTestId('wizard-close-button')).toBeInTheDocument();
    });

    it('close button has aria-label', () => {
      render(<OnboardingWizard {...defaultProps} />);
      expect(screen.getByTestId('wizard-close-button')).toHaveAttribute(
        'aria-label',
        'Close wizard'
      );
    });
  });

  // --- 13.2 Five-Step Wizard Flow ---
  describe('13.2 Five-Step Wizard Flow', () => {
    it('starts on step 1 (Welcome) by default', () => {
      render(<OnboardingWizard {...defaultProps} />);
      expect(screen.getByTestId('wizard-step-welcome')).toBeInTheDocument();
    });

    it('navigates from step 1 to step 2', () => {
      render(<OnboardingWizard {...defaultProps} />);
      fireEvent.click(screen.getByTestId('wizard-welcome-start'));
      expect(screen.getByTestId('wizard-step-estate-profile')).toBeInTheDocument();
    });

    it('navigates from step 2 to step 3', () => {
      render(<OnboardingWizard {...defaultProps} initialStep={2} />);
      fireEvent.click(screen.getByTestId('wizard-estate-next'));
      expect(screen.getByTestId('wizard-step-probate-status')).toBeInTheDocument();
    });

    it('navigates from step 3 to step 4', () => {
      render(<OnboardingWizard {...defaultProps} initialStep={3} />);
      fireEvent.click(screen.getByTestId('wizard-probate-next'));
      expect(screen.getByTestId('wizard-step-first-asset')).toBeInTheDocument();
    });

    it('navigates from step 4 to step 5', () => {
      render(<OnboardingWizard {...defaultProps} initialStep={4} />);
      fireEvent.click(screen.getByTestId('wizard-asset-next'));
      expect(screen.getByTestId('wizard-step-dashboard-tour')).toBeInTheDocument();
    });

    it('can navigate back from step 2 to step 1', () => {
      render(<OnboardingWizard {...defaultProps} initialStep={2} />);
      fireEvent.click(screen.getByTestId('wizard-estate-back'));
      expect(screen.getByTestId('wizard-step-welcome')).toBeInTheDocument();
    });

    it('can navigate back from step 5 to step 4', () => {
      render(<OnboardingWizard {...defaultProps} initialStep={5} />);
      fireEvent.click(screen.getByTestId('wizard-tour-back'));
      expect(screen.getByTestId('wizard-step-first-asset')).toBeInTheDocument();
    });

    it('accepts initialStep prop', () => {
      render(<OnboardingWizard {...defaultProps} initialStep={3} />);
      expect(screen.getByTestId('wizard-step-probate-status')).toBeInTheDocument();
    });
  });

  // --- 13.3 Progress Indicator ---
  describe('13.3 Progress Indicator (Step X of 5)', () => {
    it('renders the progress indicator', () => {
      render(<OnboardingWizard {...defaultProps} />);
      expect(screen.getByTestId('wizard-progress')).toBeInTheDocument();
    });

    it('shows "Step 1 of 5" on first step', () => {
      render(<OnboardingWizard {...defaultProps} />);
      expect(screen.getByTestId('wizard-step-label')).toHaveTextContent('Step 1 of 5');
    });

    it('updates step label when navigating', () => {
      render(<OnboardingWizard {...defaultProps} />);
      fireEvent.click(screen.getByTestId('wizard-welcome-start'));
      expect(screen.getByTestId('wizard-step-label')).toHaveTextContent('Step 2 of 5');
    });

    it('renders 5 progress dots', () => {
      render(<OnboardingWizard {...defaultProps} />);
      for (let i = 1; i <= 5; i++) {
        expect(screen.getByTestId(`wizard-progress-dot-${i}`)).toBeInTheDocument();
      }
    });

    it('progress dots have correct aria-labels', () => {
      render(<OnboardingWizard {...defaultProps} initialStep={3} />);
      expect(screen.getByTestId('wizard-progress-dot-1')).toHaveAttribute(
        'aria-label',
        'Step 1, completed'
      );
      expect(screen.getByTestId('wizard-progress-dot-3')).toHaveAttribute(
        'aria-label',
        'Step 3, current'
      );
      expect(screen.getByTestId('wizard-progress-dot-5')).toHaveAttribute(
        'aria-label',
        'Step 5, upcoming'
      );
    });
  });

  // --- 13.4 Step 1: Welcome ---
  describe('13.4 Step 1: Welcome Message', () => {
    it('renders the welcome step', () => {
      render(<OnboardingWizard {...defaultProps} />);
      expect(screen.getByTestId('wizard-step-welcome')).toBeInTheDocument();
    });

    it('shows empathetic message', () => {
      render(<OnboardingWizard {...defaultProps} />);
      expect(screen.getByText("We're sorry for your loss.")).toBeInTheDocument();
      expect(screen.getByText("We're here to help.")).toBeInTheDocument();
    });

    it('explains what ExpectedEstate does', () => {
      render(<OnboardingWizard {...defaultProps} />);
      expect(
        screen.getByText(/guides you through the estate settlement process/)
      ).toBeInTheDocument();
    });

    it('has a "Get started" button', () => {
      render(<OnboardingWizard {...defaultProps} />);
      expect(screen.getByTestId('wizard-welcome-start')).toHaveTextContent('Get started');
    });

    it('has a skip option', () => {
      render(<OnboardingWizard {...defaultProps} />);
      expect(screen.getByTestId('wizard-welcome-skip')).toHaveTextContent(
        'Skip wizard (not recommended)'
      );
    });
  });

  // --- 13.5 Step 2: Estate Profile ---
  describe('13.5 Step 2: Estate Profile Form', () => {
    it('renders the estate profile step', () => {
      render(<OnboardingWizard {...defaultProps} initialStep={2} />);
      expect(screen.getByTestId('wizard-step-estate-profile')).toBeInTheDocument();
    });

    it('has deceased name input', () => {
      render(<OnboardingWizard {...defaultProps} initialStep={2} />);
      expect(screen.getByTestId('wizard-input-deceased-name')).toBeInTheDocument();
    });

    it('has executor name input', () => {
      render(<OnboardingWizard {...defaultProps} initialStep={2} />);
      expect(screen.getByTestId('wizard-input-executor-name')).toBeInTheDocument();
    });

    it('has state/jurisdiction select', () => {
      render(<OnboardingWizard {...defaultProps} initialStep={2} />);
      expect(screen.getByTestId('wizard-input-state')).toBeInTheDocument();
    });

    it('has death certificate upload button', () => {
      render(<OnboardingWizard {...defaultProps} initialStep={2} />);
      expect(screen.getByTestId('wizard-upload-death-cert')).toBeInTheDocument();
    });

    it('updates deceased name on input', () => {
      render(<OnboardingWizard {...defaultProps} initialStep={2} />);
      const input = screen.getByTestId('wizard-input-deceased-name');
      fireEvent.change(input, { target: { value: 'John Doe' } });
      expect(input).toHaveValue('John Doe');
    });

    it('toggles death certificate upload state', () => {
      render(<OnboardingWizard {...defaultProps} initialStep={2} />);
      const btn = screen.getByTestId('wizard-upload-death-cert');
      expect(btn).toHaveTextContent('Upload death certificate (optional)');
      fireEvent.click(btn);
      expect(btn).toHaveTextContent('Death certificate uploaded ✓');
    });

    it('has labeled form fields', () => {
      render(<OnboardingWizard {...defaultProps} initialStep={2} />);
      expect(screen.getByLabelText('Name of deceased')).toBeInTheDocument();
      expect(screen.getByLabelText('Executor / Administrator name')).toBeInTheDocument();
      expect(screen.getByLabelText('State / Jurisdiction')).toBeInTheDocument();
    });
  });

  // --- 13.6 Step 3: Probate Status ---
  describe('13.6 Step 3: Probate Status Selection', () => {
    it('renders the probate status step', () => {
      render(<OnboardingWizard {...defaultProps} initialStep={3} />);
      expect(screen.getByTestId('wizard-step-probate-status')).toBeInTheDocument();
    });

    it('has three probate options: yes, no, unsure', () => {
      render(<OnboardingWizard {...defaultProps} initialStep={3} />);
      expect(screen.getByTestId('wizard-probate-yes')).toBeInTheDocument();
      expect(screen.getByTestId('wizard-probate-no')).toBeInTheDocument();
      expect(screen.getByTestId('wizard-probate-unsure')).toBeInTheDocument();
    });

    it('shows probate type options when "yes" is selected', () => {
      render(<OnboardingWizard {...defaultProps} initialStep={3} />);
      fireEvent.click(screen.getByTestId('wizard-probate-yes'));
      expect(screen.getByTestId('wizard-probate-type-full')).toBeInTheDocument();
      expect(screen.getByTestId('wizard-probate-type-small')).toBeInTheDocument();
    });

    it('shows help message when "unsure" is selected', () => {
      render(<OnboardingWizard {...defaultProps} initialStep={3} />);
      fireEvent.click(screen.getByTestId('wizard-probate-unsure'));
      expect(screen.getByTestId('wizard-probate-help')).toBeInTheDocument();
      expect(screen.getByText(/Not sure\?/)).toBeInTheDocument();
    });

    it('does not show probate type options when "no" is selected', () => {
      render(<OnboardingWizard {...defaultProps} initialStep={3} />);
      fireEvent.click(screen.getByTestId('wizard-probate-no'));
      expect(screen.queryByTestId('wizard-probate-type-full')).not.toBeInTheDocument();
    });

    it('highlights selected probate option', () => {
      render(<OnboardingWizard {...defaultProps} initialStep={3} />);
      fireEvent.click(screen.getByTestId('wizard-probate-yes'));
      expect(screen.getByTestId('wizard-probate-yes').className).toContain('border-blue-500');
    });
  });

  // --- 13.7 Step 4: First Asset ---
  describe('13.7 Step 4: Add First Asset', () => {
    it('renders the first asset step', () => {
      render(<OnboardingWizard {...defaultProps} initialStep={4} />);
      expect(screen.getByTestId('wizard-step-first-asset')).toBeInTheDocument();
    });

    it('has asset name input', () => {
      render(<OnboardingWizard {...defaultProps} initialStep={4} />);
      expect(screen.getByTestId('wizard-input-asset-name')).toBeInTheDocument();
    });

    it('has institution input', () => {
      render(<OnboardingWizard {...defaultProps} initialStep={4} />);
      expect(screen.getByTestId('wizard-input-institution')).toBeInTheDocument();
    });

    it('has asset type select', () => {
      render(<OnboardingWizard {...defaultProps} initialStep={4} />);
      expect(screen.getByTestId('wizard-input-asset-type')).toBeInTheDocument();
    });

    it('updates asset name on input', () => {
      render(<OnboardingWizard {...defaultProps} initialStep={4} />);
      const input = screen.getByTestId('wizard-input-asset-name');
      fireEvent.change(input, { target: { value: 'Fidelity 401k' } });
      expect(input).toHaveValue('Fidelity 401k');
    });

    it('shows helpful tip about Asset Inventory', () => {
      render(<OnboardingWizard {...defaultProps} initialStep={4} />);
      expect(screen.getAllByText(/Asset Inventory/).length).toBeGreaterThanOrEqual(1);
    });

    it('has labeled form fields', () => {
      render(<OnboardingWizard {...defaultProps} initialStep={4} />);
      expect(screen.getByLabelText('Asset name')).toBeInTheDocument();
      expect(screen.getByLabelText('Institution')).toBeInTheDocument();
      expect(screen.getByLabelText('Asset type')).toBeInTheDocument();
    });
  });

  // --- 13.8 Step 5: Dashboard Tour ---
  describe('13.8 Step 5: Dashboard Tour', () => {
    it('renders the dashboard tour step', () => {
      render(<OnboardingWizard {...defaultProps} initialStep={5} />);
      expect(screen.getByTestId('wizard-step-dashboard-tour')).toBeInTheDocument();
    });

    it('shows all navigation phase sections', () => {
      render(<OnboardingWizard {...defaultProps} initialStep={5} />);
      expect(screen.getByTestId('wizard-tour-section-setup-phase')).toBeInTheDocument();
      expect(screen.getByTestId('wizard-tour-section-discovery-phase')).toBeInTheDocument();
      expect(screen.getByTestId('wizard-tour-section-settlement-phase')).toBeInTheDocument();
      expect(screen.getByTestId('wizard-tour-section-close-phase')).toBeInTheDocument();
    });

    it('shows help section', () => {
      render(<OnboardingWizard {...defaultProps} initialStep={5} />);
      expect(screen.getByTestId('wizard-tour-section-need-help?')).toBeInTheDocument();
    });

    it('has a "Complete setup" button', () => {
      render(<OnboardingWizard {...defaultProps} initialStep={5} />);
      expect(screen.getByTestId('wizard-tour-complete')).toHaveTextContent('Complete setup');
    });

    it('calls onComplete when "Complete setup" is clicked', () => {
      const onComplete = vi.fn();
      render(<OnboardingWizard {...defaultProps} onComplete={onComplete} initialStep={5} />);
      fireEvent.click(screen.getByTestId('wizard-tour-complete'));
      expect(onComplete).toHaveBeenCalledTimes(1);
    });
  });

  // --- 13.9 Skip Wizard Option ---
  describe('13.9 Skip Wizard Option', () => {
    it('shows skip option on welcome step', () => {
      render(<OnboardingWizard {...defaultProps} />);
      expect(screen.getByTestId('wizard-welcome-skip')).toBeInTheDocument();
    });

    it('shows skip confirmation when skip is clicked', () => {
      render(<OnboardingWizard {...defaultProps} />);
      fireEvent.click(screen.getByTestId('wizard-welcome-skip'));
      expect(screen.getByTestId('wizard-skip-confirm')).toBeInTheDocument();
    });

    it('shows skip confirmation when close button is clicked', () => {
      render(<OnboardingWizard {...defaultProps} />);
      fireEvent.click(screen.getByTestId('wizard-close-button'));
      expect(screen.getByTestId('wizard-skip-confirm')).toBeInTheDocument();
    });

    it('shows skip confirmation when Escape is pressed', () => {
      render(<OnboardingWizard {...defaultProps} />);
      fireEvent.keyDown(document, { key: 'Escape' });
      expect(screen.getByTestId('wizard-skip-confirm')).toBeInTheDocument();
    });

    it('skip confirmation has "Continue wizard" and "Skip for now" buttons', () => {
      render(<OnboardingWizard {...defaultProps} />);
      fireEvent.click(screen.getByTestId('wizard-close-button'));
      expect(screen.getByTestId('wizard-skip-cancel')).toHaveTextContent('Continue wizard');
      expect(screen.getByTestId('wizard-skip-confirm-button')).toHaveTextContent('Skip for now');
    });

    it('dismisses skip confirmation when "Continue wizard" is clicked', () => {
      render(<OnboardingWizard {...defaultProps} />);
      fireEvent.click(screen.getByTestId('wizard-close-button'));
      fireEvent.click(screen.getByTestId('wizard-skip-cancel'));
      expect(screen.queryByTestId('wizard-skip-confirm')).not.toBeInTheDocument();
    });

    it('calls onSkip when "Skip for now" is clicked', () => {
      const onSkip = vi.fn();
      render(<OnboardingWizard {...defaultProps} onSkip={onSkip} />);
      fireEvent.click(screen.getByTestId('wizard-close-button'));
      fireEvent.click(screen.getByTestId('wizard-skip-confirm-button'));
      expect(onSkip).toHaveBeenCalledTimes(1);
    });

    it('skip confirmation mentions restarting from Settings', () => {
      render(<OnboardingWizard {...defaultProps} />);
      fireEvent.click(screen.getByTestId('wizard-close-button'));
      expect(screen.getByText(/restart it later from Settings/)).toBeInTheDocument();
    });
  });

  // --- 13.10 Wizard Completion Tracking ---
  describe('13.10 Wizard Completion Tracking', () => {
    it('persists wizard state to localStorage', () => {
      render(<OnboardingWizard {...defaultProps} />);
      const stored = localStorage.getItem('expectedestate-onboarding-wizard');
      expect(stored).not.toBeNull();
      const parsed = JSON.parse(stored!);
      expect(parsed.currentStep).toBe(1);
    });

    it('updates localStorage when navigating steps', () => {
      render(<OnboardingWizard {...defaultProps} />);
      fireEvent.click(screen.getByTestId('wizard-welcome-start'));
      const stored = JSON.parse(
        localStorage.getItem('expectedestate-onboarding-wizard')!
      );
      expect(stored.currentStep).toBe(2);
    });

    it('marks wizard as completed when finishing', () => {
      render(<OnboardingWizard {...defaultProps} initialStep={5} />);
      fireEvent.click(screen.getByTestId('wizard-tour-complete'));
      const stored = JSON.parse(
        localStorage.getItem('expectedestate-onboarding-wizard')!
      );
      expect(stored.isCompleted).toBe(true);
    });

    it('isWizardCompleted returns false initially', () => {
      expect(isWizardCompleted()).toBe(false);
    });

    it('isWizardCompleted returns true after completion', () => {
      const state: WizardState = {
        currentStep: 5,
        isOpen: false,
        isCompleted: true,
        estateProfile: { deceasedName: '', executorName: '', state: '', deathCertificateUploaded: false },
        probateStatus: { probateRequired: '', probateType: '' },
        firstAsset: { assetName: '', institution: '', assetType: '' },
      };
      saveWizardState(state);
      expect(isWizardCompleted()).toBe(true);
    });

    it('getWizardState returns null when no state saved', () => {
      expect(getWizardState()).toBeNull();
    });

    it('getWizardState returns saved state', () => {
      const state: WizardState = {
        currentStep: 3,
        isOpen: true,
        isCompleted: false,
        estateProfile: { deceasedName: 'Test', executorName: '', state: '', deathCertificateUploaded: false },
        probateStatus: { probateRequired: '', probateType: '' },
        firstAsset: { assetName: '', institution: '', assetType: '' },
      };
      saveWizardState(state);
      const retrieved = getWizardState();
      expect(retrieved?.currentStep).toBe(3);
      expect(retrieved?.estateProfile.deceasedName).toBe('Test');
    });

    it('persists form data across steps', () => {
      render(<OnboardingWizard {...defaultProps} initialStep={2} />);
      fireEvent.change(screen.getByTestId('wizard-input-deceased-name'), {
        target: { value: 'Jane Smith' },
      });
      const stored = JSON.parse(
        localStorage.getItem('expectedestate-onboarding-wizard')!
      );
      expect(stored.estateProfile.deceasedName).toBe('Jane Smith');
    });
  });
});

// --- WizardProgressIndicator standalone tests ---
describe('WizardProgressIndicator', () => {
  it('renders step label', () => {
    render(<WizardProgressIndicator currentStep={2} totalSteps={5} />);
    expect(screen.getByTestId('wizard-step-label')).toHaveTextContent('Step 2 of 5');
  });

  it('renders correct number of dots', () => {
    render(<WizardProgressIndicator currentStep={1} totalSteps={5} />);
    for (let i = 1; i <= 5; i++) {
      expect(screen.getByTestId(`wizard-progress-dot-${i}`)).toBeInTheDocument();
    }
  });

  it('marks current dot as current', () => {
    render(<WizardProgressIndicator currentStep={3} totalSteps={5} />);
    expect(screen.getByTestId('wizard-progress-dot-3')).toHaveAttribute(
      'aria-label',
      'Step 3, current'
    );
  });

  it('marks previous dots as completed', () => {
    render(<WizardProgressIndicator currentStep={3} totalSteps={5} />);
    expect(screen.getByTestId('wizard-progress-dot-1')).toHaveAttribute(
      'aria-label',
      'Step 1, completed'
    );
    expect(screen.getByTestId('wizard-progress-dot-2')).toHaveAttribute(
      'aria-label',
      'Step 2, completed'
    );
  });

  it('marks future dots as upcoming', () => {
    render(<WizardProgressIndicator currentStep={3} totalSteps={5} />);
    expect(screen.getByTestId('wizard-progress-dot-4')).toHaveAttribute(
      'aria-label',
      'Step 4, upcoming'
    );
  });
});
