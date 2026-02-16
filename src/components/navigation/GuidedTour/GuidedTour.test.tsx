import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { GuidedTour } from './GuidedTour';
import { ShowMeAroundButton } from './ShowMeAroundButton';
import {
  getTourCompletionRecord,
  markTourCompleted,
  isTourCompleted,
  resetTourCompletion,
  resetAllTours,
  saveTourCompletionRecord,
} from './tourStorage';
import {
  dashboardTour,
  assetDetailTour,
  navigationTour,
  allTours,
  getTourById,
} from './tourDefinitions';
import type { TourDefinition } from '@/types/navigation';

const testTour: TourDefinition = {
  id: 'dashboard',
  name: 'Test Tour',
  description: 'A test tour',
  steps: [
    {
      target: '[data-tour="step-one"]',
      title: 'Step One',
      description: 'First step description',
      placement: 'bottom',
    },
    {
      target: '[data-tour="step-two"]',
      title: 'Step Two',
      description: 'Second step description',
      placement: 'right',
    },
    {
      target: '[data-tour="step-three"]',
      title: 'Step Three',
      description: 'Third step description',
      placement: 'top',
    },
  ],
};

// ─── Tour Storage Tests ───

describe('tourStorage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns empty completedTours when nothing is stored', () => {
    const record = getTourCompletionRecord();
    expect(record.completedTours).toEqual({});
  });

  it('marks a tour as completed', () => {
    markTourCompleted('dashboard');
    expect(isTourCompleted('dashboard')).toBe(true);
  });

  it('isTourCompleted returns false for uncompleted tour', () => {
    expect(isTourCompleted('navigation')).toBe(false);
  });

  it('stores completion timestamp as ISO string', () => {
    markTourCompleted('dashboard');
    const record = getTourCompletionRecord();
    const timestamp = record.completedTours['dashboard'];
    expect(timestamp).toBeDefined();
    expect(new Date(timestamp).toISOString()).toBe(timestamp);
  });

  it('can mark multiple tours as completed', () => {
    markTourCompleted('dashboard');
    markTourCompleted('navigation');
    expect(isTourCompleted('dashboard')).toBe(true);
    expect(isTourCompleted('navigation')).toBe(true);
    expect(isTourCompleted('asset-detail')).toBe(false);
  });

  it('resetTourCompletion removes a single tour', () => {
    markTourCompleted('dashboard');
    markTourCompleted('navigation');
    resetTourCompletion('dashboard');
    expect(isTourCompleted('dashboard')).toBe(false);
    expect(isTourCompleted('navigation')).toBe(true);
  });

  it('resetAllTours clears all completions', () => {
    markTourCompleted('dashboard');
    markTourCompleted('navigation');
    markTourCompleted('asset-detail');
    resetAllTours();
    expect(isTourCompleted('dashboard')).toBe(false);
    expect(isTourCompleted('navigation')).toBe(false);
    expect(isTourCompleted('asset-detail')).toBe(false);
  });

  it('handles corrupted localStorage gracefully', () => {
    localStorage.setItem('expectedestate-guided-tours', 'not-json');
    const record = getTourCompletionRecord();
    expect(record.completedTours).toEqual({});
  });

  it('handles missing completedTours key gracefully', () => {
    localStorage.setItem('expectedestate-guided-tours', '{}');
    const record = getTourCompletionRecord();
    expect(record.completedTours).toEqual({});
  });
});

// ─── Tour Definitions Tests ───

describe('tourDefinitions', () => {
  it('dashboardTour has correct id', () => {
    expect(dashboardTour.id).toBe('dashboard');
  });

  it('assetDetailTour has correct id', () => {
    expect(assetDetailTour.id).toBe('asset-detail');
  });

  it('navigationTour has correct id', () => {
    expect(navigationTour.id).toBe('navigation');
  });

  it('allTours contains all three tours', () => {
    expect(allTours).toHaveLength(3);
    const ids = allTours.map((t) => t.id);
    expect(ids).toContain('dashboard');
    expect(ids).toContain('asset-detail');
    expect(ids).toContain('navigation');
  });

  it('each tour has at least one step', () => {
    for (const tour of allTours) {
      expect(tour.steps.length).toBeGreaterThan(0);
    }
  });

  it('every step has target, title, and description', () => {
    for (const tour of allTours) {
      for (const step of tour.steps) {
        expect(step.target).toBeTruthy();
        expect(step.title).toBeTruthy();
        expect(step.description).toBeTruthy();
      }
    }
  });

  it('every step target uses data-tour attribute selector', () => {
    for (const tour of allTours) {
      for (const step of tour.steps) {
        expect(step.target).toMatch(/^\[data-tour="/);
      }
    }
  });

  it('getTourById returns correct tour', () => {
    expect(getTourById('dashboard')).toBe(dashboardTour);
    expect(getTourById('navigation')).toBe(navigationTour);
    expect(getTourById('asset-detail')).toBe(assetDetailTour);
  });

  it('getTourById returns undefined for unknown id', () => {
    expect(getTourById('nonexistent')).toBeUndefined();
  });
});

// ─── GuidedTour Component Tests ───

describe('GuidedTour', () => {
  const defaultProps = {
    tour: testTour,
    onComplete: vi.fn(),
    onSkip: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the tour overlay', () => {
    render(<GuidedTour {...defaultProps} />);
    expect(screen.getByTestId('guided-tour-overlay')).toBeInTheDocument();
  });

  it('has role="dialog" and aria-modal', () => {
    render(<GuidedTour {...defaultProps} />);
    const overlay = screen.getByTestId('guided-tour-overlay');
    expect(overlay).toHaveAttribute('role', 'dialog');
    expect(overlay).toHaveAttribute('aria-modal', 'true');
  });

  it('has aria-label with tour name and step info', () => {
    render(<GuidedTour {...defaultProps} />);
    const overlay = screen.getByTestId('guided-tour-overlay');
    expect(overlay).toHaveAttribute(
      'aria-label',
      'Test Tour: Step 1 of 3'
    );
  });

  it('renders the backdrop SVG', () => {
    render(<GuidedTour {...defaultProps} />);
    expect(screen.getByTestId('guided-tour-backdrop')).toBeInTheDocument();
  });

  it('renders the tooltip', () => {
    render(<GuidedTour {...defaultProps} />);
    expect(screen.getByTestId('guided-tour-tooltip')).toBeInTheDocument();
  });

  it('shows the first step title', () => {
    render(<GuidedTour {...defaultProps} />);
    expect(screen.getByTestId('guided-tour-step-title')).toHaveTextContent(
      'Step One'
    );
  });

  it('shows the first step description', () => {
    render(<GuidedTour {...defaultProps} />);
    expect(
      screen.getByTestId('guided-tour-step-description')
    ).toHaveTextContent('First step description');
  });

  it('shows step counter "1 of 3"', () => {
    render(<GuidedTour {...defaultProps} />);
    expect(screen.getByTestId('guided-tour-step-counter')).toHaveTextContent(
      '1 of 3'
    );
  });

  it('does not show Back button on first step', () => {
    render(<GuidedTour {...defaultProps} />);
    expect(screen.queryByTestId('guided-tour-back')).not.toBeInTheDocument();
  });

  it('shows Next button on first step', () => {
    render(<GuidedTour {...defaultProps} />);
    expect(screen.getByTestId('guided-tour-next')).toHaveTextContent('Next');
  });

  it('advances to next step when Next is clicked', () => {
    render(<GuidedTour {...defaultProps} />);
    fireEvent.click(screen.getByTestId('guided-tour-next'));
    expect(screen.getByTestId('guided-tour-step-title')).toHaveTextContent(
      'Step Two'
    );
    expect(screen.getByTestId('guided-tour-step-counter')).toHaveTextContent(
      '2 of 3'
    );
  });

  it('shows Back button on second step', () => {
    render(<GuidedTour {...defaultProps} />);
    fireEvent.click(screen.getByTestId('guided-tour-next'));
    expect(screen.getByTestId('guided-tour-back')).toBeInTheDocument();
  });

  it('goes back to previous step when Back is clicked', () => {
    render(<GuidedTour {...defaultProps} />);
    fireEvent.click(screen.getByTestId('guided-tour-next'));
    fireEvent.click(screen.getByTestId('guided-tour-back'));
    expect(screen.getByTestId('guided-tour-step-title')).toHaveTextContent(
      'Step One'
    );
  });

  it('shows "Finish" on the last step', () => {
    render(<GuidedTour {...defaultProps} />);
    fireEvent.click(screen.getByTestId('guided-tour-next'));
    fireEvent.click(screen.getByTestId('guided-tour-next'));
    expect(screen.getByTestId('guided-tour-next')).toHaveTextContent(
      'Finish'
    );
  });

  it('calls onComplete when Finish is clicked', () => {
    const onComplete = vi.fn();
    render(<GuidedTour {...defaultProps} onComplete={onComplete} />);
    fireEvent.click(screen.getByTestId('guided-tour-next'));
    fireEvent.click(screen.getByTestId('guided-tour-next'));
    fireEvent.click(screen.getByTestId('guided-tour-next'));
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('renders skip button', () => {
    render(<GuidedTour {...defaultProps} />);
    expect(screen.getByTestId('guided-tour-skip')).toBeInTheDocument();
  });

  it('skip button has aria-label', () => {
    render(<GuidedTour {...defaultProps} />);
    expect(screen.getByTestId('guided-tour-skip')).toHaveAttribute(
      'aria-label',
      'Skip tour'
    );
  });

  it('calls onSkip when skip button is clicked', () => {
    const onSkip = vi.fn();
    render(<GuidedTour {...defaultProps} onSkip={onSkip} />);
    fireEvent.click(screen.getByTestId('guided-tour-skip'));
    expect(onSkip).toHaveBeenCalledTimes(1);
  });

  // Keyboard navigation
  it('calls onSkip when Escape is pressed', () => {
    const onSkip = vi.fn();
    render(<GuidedTour {...defaultProps} onSkip={onSkip} />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onSkip).toHaveBeenCalledTimes(1);
  });

  it('advances step on ArrowRight', () => {
    render(<GuidedTour {...defaultProps} />);
    fireEvent.keyDown(document, { key: 'ArrowRight' });
    expect(screen.getByTestId('guided-tour-step-title')).toHaveTextContent(
      'Step Two'
    );
  });

  it('goes back on ArrowLeft', () => {
    render(<GuidedTour {...defaultProps} />);
    fireEvent.keyDown(document, { key: 'ArrowRight' });
    fireEvent.keyDown(document, { key: 'ArrowLeft' });
    expect(screen.getByTestId('guided-tour-step-title')).toHaveTextContent(
      'Step One'
    );
  });

  it('does not go before first step on ArrowLeft', () => {
    render(<GuidedTour {...defaultProps} />);
    fireEvent.keyDown(document, { key: 'ArrowLeft' });
    expect(screen.getByTestId('guided-tour-step-title')).toHaveTextContent(
      'Step One'
    );
  });

  it('calls onComplete on Enter at last step', () => {
    const onComplete = vi.fn();
    render(<GuidedTour {...defaultProps} onComplete={onComplete} />);
    fireEvent.keyDown(document, { key: 'ArrowRight' });
    fireEvent.keyDown(document, { key: 'ArrowRight' });
    fireEvent.keyDown(document, { key: 'Enter' });
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('tooltip has role="alertdialog"', () => {
    render(<GuidedTour {...defaultProps} />);
    expect(screen.getByTestId('guided-tour-tooltip')).toHaveAttribute(
      'role',
      'alertdialog'
    );
  });

  it('tooltip has aria-label matching step title', () => {
    render(<GuidedTour {...defaultProps} />);
    expect(screen.getByTestId('guided-tour-tooltip')).toHaveAttribute(
      'aria-label',
      'Step One'
    );
  });
});

// ─── ShowMeAroundButton Tests ───

describe('ShowMeAroundButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('renders the button', () => {
    render(<ShowMeAroundButton />);
    expect(screen.getByTestId('show-me-around-button')).toBeInTheDocument();
  });

  it('button has aria-label', () => {
    render(<ShowMeAroundButton />);
    expect(screen.getByTestId('show-me-around-button')).toHaveAttribute(
      'aria-label',
      'Show me around'
    );
  });

  it('button text says "Show me around"', () => {
    render(<ShowMeAroundButton />);
    expect(screen.getByTestId('show-me-around-button')).toHaveTextContent(
      'Show me around'
    );
  });

  it('opens tour menu when clicked (no tourId)', () => {
    render(<ShowMeAroundButton />);
    fireEvent.click(screen.getByTestId('show-me-around-button'));
    expect(screen.getByTestId('tour-menu')).toBeInTheDocument();
  });

  it('tour menu has role="menu"', () => {
    render(<ShowMeAroundButton />);
    fireEvent.click(screen.getByTestId('show-me-around-button'));
    expect(screen.getByTestId('tour-menu')).toHaveAttribute('role', 'menu');
  });

  it('shows all three tour options in menu', () => {
    render(<ShowMeAroundButton />);
    fireEvent.click(screen.getByTestId('show-me-around-button'));
    expect(screen.getByTestId('tour-menu-item-dashboard')).toBeInTheDocument();
    expect(
      screen.getByTestId('tour-menu-item-asset-detail')
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('tour-menu-item-navigation')
    ).toBeInTheDocument();
  });

  it('starts a tour when menu item is clicked', () => {
    render(<ShowMeAroundButton />);
    fireEvent.click(screen.getByTestId('show-me-around-button'));
    fireEvent.click(screen.getByTestId('tour-menu-item-dashboard'));
    expect(screen.getByTestId('guided-tour-overlay')).toBeInTheDocument();
  });

  it('closes menu when backdrop is clicked', () => {
    render(<ShowMeAroundButton />);
    fireEvent.click(screen.getByTestId('show-me-around-button'));
    expect(screen.getByTestId('tour-menu')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('tour-menu-backdrop'));
    expect(screen.queryByTestId('tour-menu')).not.toBeInTheDocument();
  });

  it('starts specific tour directly when tourId is provided', () => {
    render(<ShowMeAroundButton tourId="navigation" />);
    fireEvent.click(screen.getByTestId('show-me-around-button'));
    // Should start tour directly, no menu
    expect(screen.queryByTestId('tour-menu')).not.toBeInTheDocument();
    expect(screen.getByTestId('guided-tour-overlay')).toBeInTheDocument();
  });

  it('shows completed badge for finished tours', () => {
    markTourCompleted('dashboard');
    render(<ShowMeAroundButton />);
    fireEvent.click(screen.getByTestId('show-me-around-button'));
    expect(
      screen.getByTestId('tour-completed-badge-dashboard')
    ).toBeInTheDocument();
    expect(
      screen.queryByTestId('tour-completed-badge-navigation')
    ).not.toBeInTheDocument();
  });

  it('calls onTourComplete callback when tour finishes', () => {
    const onTourComplete = vi.fn();
    const singleStepTour: TourDefinition = {
      id: 'dashboard',
      name: 'Quick Tour',
      description: 'One step',
      steps: [
        {
          target: '[data-tour="x"]',
          title: 'Only Step',
          description: 'Done',
          placement: 'bottom',
        },
      ],
    };

    // We need to use the tourId prop to start a specific tour
    // But ShowMeAroundButton uses allTours internally, so let's start via menu
    render(<ShowMeAroundButton onTourComplete={onTourComplete} />);
    fireEvent.click(screen.getByTestId('show-me-around-button'));
    fireEvent.click(screen.getByTestId('tour-menu-item-dashboard'));

    // The dashboard tour has multiple steps, click through them all
    const dashSteps = dashboardTour.steps.length;
    for (let i = 0; i < dashSteps; i++) {
      fireEvent.click(screen.getByTestId('guided-tour-next'));
    }

    expect(onTourComplete).toHaveBeenCalledWith('dashboard');
  });

  it('closes tour when skip is clicked', () => {
    render(<ShowMeAroundButton tourId="dashboard" />);
    fireEvent.click(screen.getByTestId('show-me-around-button'));
    expect(screen.getByTestId('guided-tour-overlay')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('guided-tour-skip'));
    expect(
      screen.queryByTestId('guided-tour-overlay')
    ).not.toBeInTheDocument();
  });

  it('has aria-haspopup when no tourId', () => {
    render(<ShowMeAroundButton />);
    expect(screen.getByTestId('show-me-around-button')).toHaveAttribute(
      'aria-haspopup',
      'true'
    );
  });
});
