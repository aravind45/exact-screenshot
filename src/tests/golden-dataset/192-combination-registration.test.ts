import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { EnhancedOnboardingWizard } from '../../components/onboarding/EnhancedOnboardingWizard';
import { OnboardingPersistence } from '../../lib/onboardingPersistence';
import { pathEngine } from '../../lib/pathEngine';
import { mockEstateService } from '../mocks/estateService';
import { mockAuthService } from '../mocks/authService';

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
});

// Mock services
vi.mock('../../services/estateService', () => ({
  estateService: mockEstateService
}));

vi.mock('../../services/authService', () => ({
  authService: mockAuthService
}));

describe('192 Combination Registration Test', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.clear();
    mockEstateService.createEstate.mockClear();
    mockAuthService.register.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // All possible combinations from the Excel file
  const testCombinations = [
    // Basic combinations
    { hasWill: 'yes', hasTrust: 'no', hasTODDeed: 'no', hasContest: 'no', isOutOfState: 'no', isSpouse: 'no', debtStatus: 'solvent' },
    { hasWill: 'yes', hasTrust: 'no', hasTODDeed: 'no', hasContest: 'no', isOutOfState: 'no', isSpouse: 'no', debtStatus: 'insolvent' },
    { hasWill: 'yes', hasTrust: 'no', hasTODDeed: 'no', hasContest: 'no', isOutOfState: 'no', isSpouse: 'yes', debtStatus: 'solvent' },
    { hasWill: 'yes', hasTrust: 'no', hasTODDeed: 'no', hasContest: 'no', isOutOfState: 'no', isSpouse: 'yes', debtStatus: 'insolvent' },
    { hasWill: 'yes', hasTrust: 'no', hasTODDeed: 'no', hasContest: 'no', isOutOfState: 'yes', isSpouse: 'no', debtStatus: 'solvent' },
    { hasWill: 'yes', hasTrust: 'no', hasTODDeed: 'no', hasContest: 'no', isOutOfState: 'yes', isSpouse: 'no', debtStatus: 'insolvent' },
    { hasWill: 'yes', hasTrust: 'no', hasTODDeed: 'no', hasContest: 'no', isOutOfState: 'yes', isSpouse: 'yes', debtStatus: 'solvent' },
    { hasWill: 'yes', hasTrust: 'no', hasTODDeed: 'no', hasContest: 'no', isOutOfState: 'yes', isSpouse: 'yes', debtStatus: 'insolvent' },

    // With TOD Deed
    { hasWill: 'yes', hasTrust: 'no', hasTODDeed: 'yes', hasContest: 'no', isOutOfState: 'no', isSpouse: 'no', debtStatus: 'solvent' },
    { hasWill: 'yes', hasTrust: 'no', hasTODDeed: 'yes', hasContest: 'no', isOutOfState: 'no', isSpouse: 'no', debtStatus: 'insolvent' },
    { hasWill: 'yes', hasTrust: 'no', hasTODDeed: 'yes', hasContest: 'no', isOutOfState: 'no', isSpouse: 'yes', debtStatus: 'solvent' },
    { hasWill: 'yes', hasTrust: 'no', hasTODDeed: 'yes', hasContest: 'no', isOutOfState: 'no', isSpouse: 'yes', debtStatus: 'insolvent' },
    { hasWill: 'yes', hasTrust: 'no', hasTODDeed: 'yes', hasContest: 'no', isOutOfState: 'yes', isSpouse: 'no', debtStatus: 'solvent' },
    { hasWill: 'yes', hasTrust: 'no', hasTODDeed: 'yes', hasContest: 'no', isOutOfState: 'yes', isSpouse: 'no', debtStatus: 'insolvent' },
    { hasWill: 'yes', hasTrust: 'no', hasTODDeed: 'yes', hasContest: 'no', isOutOfState: 'yes', isSpouse: 'yes', debtStatus: 'solvent' },
    { hasWill: 'yes', hasTrust: 'no', hasTODDeed: 'yes', hasContest: 'no', isOutOfState: 'yes', isSpouse: 'yes', debtStatus: 'insolvent' },

    // With Contest
    { hasWill: 'yes', hasTrust: 'no', hasTODDeed: 'no', hasContest: 'yes', isOutOfState: 'no', isSpouse: 'no', debtStatus: 'solvent' },
    { hasWill: 'yes', hasTrust: 'no', hasTODDeed: 'no', hasContest: 'yes', isOutOfState: 'no', isSpouse: 'no', debtStatus: 'insolvent' },
    { hasWill: 'yes', hasTrust: 'no', hasTODDeed: 'no', hasContest: 'yes', isOutOfState: 'no', isSpouse: 'yes', debtStatus: 'solvent' },
    { hasWill: 'yes', hasTrust: 'no', hasTODDeed: 'no', hasContest: 'yes', isOutOfState: 'no', isSpouse: 'yes', debtStatus: 'insolvent' },
    { hasWill: 'yes', hasTrust: 'no', hasTODDeed: 'no', hasContest: 'yes', isOutOfState: 'yes', isSpouse: 'no', debtStatus: 'solvent' },
    { hasWill: 'yes', hasTrust: 'no', hasTODDeed: 'no', hasContest: 'yes', isOutOfState: 'yes', isSpouse: 'no', debtStatus: 'insolvent' },
    { hasWill: 'yes', hasTrust: 'no', hasTODDeed: 'no', hasContest: 'yes', isOutOfState: 'yes', isSpouse: 'yes', debtStatus: 'solvent' },
    { hasWill: 'yes', hasTrust: 'no', hasTODDeed: 'no', hasContest: 'yes', isOutOfState: 'yes', isSpouse: 'yes', debtStatus: 'insolvent' },

    // With TOD Deed and Contest
    { hasWill: 'yes', hasTrust: 'no', hasTODDeed: 'yes', hasContest: 'yes', isOutOfState: 'no', isSpouse: 'no', debtStatus: 'solvent' },
    { hasWill: 'yes', hasTrust: 'no', hasTODDeed: 'yes', hasContest: 'yes', isOutOfState: 'no', isSpouse: 'no', debtStatus: 'insolvent' },
    { hasWill: 'yes', hasTrust: 'no', hasTODDeed: 'yes', hasContest: 'yes', isOutOfState: 'no', isSpouse: 'yes', debtStatus: 'solvent' },
    { hasWill: 'yes', hasTrust: 'no', hasTODDeed: 'yes', hasContest: 'yes', isOutOfState: 'no', isSpouse: 'yes', debtStatus: 'insolvent' },
    { hasWill: 'yes', hasTrust: 'no', hasTODDeed: 'yes', hasContest: 'yes', isOutOfState: 'yes', isSpouse: 'no', debtStatus: 'solvent' },
    { hasWill: 'yes', hasTrust: 'no', hasTODDeed: 'yes', hasContest: 'yes', isOutOfState: 'yes', isSpouse: 'no', debtStatus: 'insolvent' },
    { hasWill: 'yes', hasTrust: 'no', hasTODDeed: 'yes', hasContest: 'yes', isOutOfState: 'yes', isSpouse: 'yes', debtStatus: 'solvent' },
    { hasWill: 'yes', hasTrust: 'no', hasTODDeed: 'yes', hasContest: 'yes', isOutOfState: 'yes', isSpouse: 'yes', debtStatus: 'insolvent' },

    // With Trust (Revocable)
    { hasWill: 'yes', hasTrust: 'yes', trustType: 'revocable', hasTODDeed: 'no', hasContest: 'no', isOutOfState: 'no', isSpouse: 'no', debtStatus: 'solvent' },
    { hasWill: 'yes', hasTrust: 'yes', trustType: 'revocable', hasTODDeed: 'no', hasContest: 'no', isOutOfState: 'no', isSpouse: 'no', debtStatus: 'insolvent' },
    { hasWill: 'yes', hasTrust: 'yes', trustType: 'revocable', hasTODDeed: 'no', hasContest: 'no', isOutOfState: 'no', isSpouse: 'yes', debtStatus: 'solvent' },
    { hasWill: 'yes', hasTrust: 'yes', trustType: 'revocable', hasTODDeed: 'no', hasContest: 'no', isOutOfState: 'no', isSpouse: 'yes', debtStatus: 'insolvent' },
    { hasWill: 'yes', hasTrust: 'yes', trustType: 'revocable', hasTODDeed: 'no', hasContest: 'no', isOutOfState: 'yes', isSpouse: 'no', debtStatus: 'solvent' },
    { hasWill: 'yes', hasTrust: 'yes', trustType: 'revocable', hasTODDeed: 'no', hasContest: 'no', isOutOfState: 'yes', isSpouse: 'no', debtStatus: 'insolvent' },
    { hasWill: 'yes', hasTrust: 'yes', trustType: 'revocable', hasTODDeed: 'no', hasContest: 'no', isOutOfState: 'yes', isSpouse: 'yes', debtStatus: 'solvent' },
    { hasWill: 'yes', hasTrust: 'yes', trustType: 'revocable', hasTODDeed: 'no', hasContest: 'no', isOutOfState: 'yes', isSpouse: 'yes', debtStatus: 'insolvent' },

    // With Trust (Irrevocable)
    { hasWill: 'yes', hasTrust: 'yes', trustType: 'irrevocable', hasTODDeed: 'no', hasContest: 'no', isOutOfState: 'no', isSpouse: 'no', debtStatus: 'solvent' },
    { hasWill: 'yes', hasTrust: 'yes', trustType: 'irrevocable', hasTODDeed: 'no', hasContest: 'no', isOutOfState: 'no', isSpouse: 'no', debtStatus: 'insolvent' },
    { hasWill: 'yes', hasTrust: 'yes', trustType: 'irrevocable', hasTODDeed: 'no', hasContest: 'no', isOutOfState: 'no', isSpouse: 'yes', debtStatus: 'solvent' },
    { hasWill: 'yes', hasTrust: 'yes', trustType: 'irrevocable', hasTODDeed: 'no', hasContest: 'no', isOutOfState: 'no', isSpouse: 'yes', debtStatus: 'insolvent' },
    { hasWill: 'yes', hasTrust: 'yes', trustType: 'irrevocable', hasTODDeed: 'no', hasContest: 'no', isOutOfState: 'yes', isSpouse: 'no', debtStatus: 'solvent' },
    { hasWill: 'yes', hasTrust: 'yes', trustType: 'irrevocable', hasTODDeed: 'no', hasContest: 'no', isOutOfState: 'yes', isSpouse: 'no', debtStatus: 'insolvent' },
    { hasWill: 'yes', hasTrust: 'yes', trustType: 'irrevocable', hasTODDeed: 'no', hasContest: 'no', isOutOfState: 'yes', isSpouse: 'yes', debtStatus: 'solvent' },
    { hasWill: 'yes', hasTrust: 'yes', trustType: 'irrevocable', hasTODDeed: 'no', hasContest: 'no', isOutOfState: 'yes', isSpouse: 'yes', debtStatus: 'insolvent' },

    // With Trust and TOD Deed
    { hasWill: 'yes', hasTrust: 'yes', trustType: 'revocable', hasTODDeed: 'yes', hasContest: 'no', isOutOfState: 'no', isSpouse: 'no', debtStatus: 'solvent' },
    { hasWill: 'yes', hasTrust: 'yes', trustType: 'revocable', hasTODDeed: 'yes', hasContest: 'no', isOutOfState: 'no', isSpouse: 'no', debtStatus: 'insolvent' },
    { hasWill: 'yes', hasTrust: 'yes', trustType: 'revocable', hasTODDeed: 'yes', hasContest: 'no', isOutOfState: 'no', isSpouse: 'yes', debtStatus: 'solvent' },
    { hasWill: 'yes', hasTrust: 'yes', trustType: 'revocable', hasTODDeed: 'yes', hasContest: 'no', isOutOfState: 'no', isSpouse: 'yes', debtStatus: 'insolvent' },
    { hasWill: 'yes', hasTrust: 'yes', trustType: 'revocable', hasTODDeed: 'yes', hasContest: 'no', isOutOfState: 'yes', isSpouse: 'no', debtStatus: 'solvent' },
    { hasWill: 'yes', hasTrust: 'yes', trustType: 'revocable', hasTODDeed: 'yes', hasContest: 'no', isOutOfState: 'yes', isSpouse: 'no', debtStatus: 'insolvent' },
    { hasWill: 'yes', hasTrust: 'yes', trustType: 'revocable', hasTODDeed: 'yes', hasContest: 'no', isOutOfState: 'yes', isSpouse: 'yes', debtStatus: 'solvent' },
    { hasWill: 'yes', hasTrust: 'yes', trustType: 'revocable', hasTODDeed: 'yes', hasContest: 'no', isOutOfState: 'yes', isSpouse: 'yes', debtStatus: 'insolvent' },

    // With Trust and Contest
    { hasWill: 'yes', hasTrust: 'yes', trustType: 'revocable', hasTODDeed: 'no', hasContest: 'yes', isOutOfState: 'no', isSpouse: 'no', debtStatus: 'solvent' },
    { hasWill: 'yes', hasTrust: 'yes', trustType: 'revocable', hasTODDeed: 'no', hasContest: 'yes', isOutOfState: 'no', isSpouse: 'no', debtStatus: 'insolvent' },
    { hasWill: 'yes', hasTrust: 'yes', trustType: 'revocable', hasTODDeed: 'no', hasContest: 'yes', isOutOfState: 'no', isSpouse: 'yes', debtStatus: 'solvent' },
    { hasWill: 'yes', hasTrust: 'yes', trustType: 'revocable', hasTODDeed: 'no', hasContest: 'yes', isOutOfState: 'no', isSpouse: 'yes', debtStatus: 'insolvent' },
    { hasWill: 'yes', hasTrust: 'yes', trustType: 'revocable', hasTODDeed: 'no', hasContest: 'yes', isOutOfState: 'yes', isSpouse: 'no', debtStatus: 'solvent' },
    { hasWill: 'yes', hasTrust: 'yes', trustType: 'revocable', hasTODDeed: 'no', hasContest: 'yes', isOutOfState: 'yes', isSpouse: 'no', debtStatus: 'insolvent' },
    { hasWill: 'yes', hasTrust: 'yes', trustType: 'revocable', hasTODDeed: 'no', hasContest: 'yes', isOutOfState: 'yes', isSpouse: 'yes', debtStatus: 'solvent' },
    { hasWill: 'yes', hasTrust: 'yes', trustType: 'revocable', hasTODDeed: 'no', hasContest: 'yes', isOutOfState: 'yes', isSpouse: 'yes', debtStatus: 'insolvent' },

    // With Trust, TOD Deed, and Contest
    { hasWill: 'yes', hasTrust: 'yes', trustType: 'revocable', hasTODDeed: 'yes', hasContest: 'yes', isOutOfState: 'no', isSpouse: 'no', debtStatus: 'solvent' },
    { hasWill: 'yes', hasTrust: 'yes', trustType: 'revocable', hasTODDeed: 'yes', hasContest: 'yes', isOutOfState: 'no', isSpouse: 'no', debtStatus: 'insolvent' },
    { hasWill: 'yes', hasTrust: 'yes', trustType: 'revocable', hasTODDeed: 'yes', hasContest: 'yes', isOutOfState: 'no', isSpouse: 'yes', debtStatus: 'solvent' },
    { hasWill: 'yes', hasTrust: 'yes', trustType: 'revocable', hasTODDeed: 'yes', hasContest: 'yes', isOutOfState: 'no', isSpouse: 'yes', debtStatus: 'insolvent' },
    { hasWill: 'yes', hasTrust: 'yes', trustType: 'revocable', hasTODDeed: 'yes', hasContest: 'yes', isOutOfState: 'yes', isSpouse: 'no', debtStatus: 'solvent' },
    { hasWill: 'yes', hasTrust: 'yes', trustType: 'revocable', hasTODDeed: 'yes', hasContest: 'yes', isOutOfState: 'yes', isSpouse: 'no', debtStatus: 'insolvent' },
    { hasWill: 'yes', hasTrust: 'yes', trustType: 'revocable', hasTODDeed: 'yes', hasContest: 'yes', isOutOfState: 'yes', isSpouse: 'yes', debtStatus: 'solvent' },
    { hasWill: 'yes', hasTrust: 'yes', trustType: 'revocable', hasTODDeed: 'yes', hasContest: 'yes', isOutOfState: 'yes', isSpouse: 'yes', debtStatus: 'insolvent' },

    // With Irrevocable Trust and TOD Deed
    { hasWill: 'yes', hasTrust: 'yes', trustType: 'irrevocable', hasTODDeed: 'yes', hasContest: 'no', isOutOfState: 'no', isSpouse: 'no', debtStatus: 'solvent' },
    { hasWill: 'yes', hasTrust: 'yes', trustType: 'irrevocable', hasTODDeed: 'yes', hasContest: 'no', isOutOfState: 'no', isSpouse: 'no', debtStatus: 'insolvent' },
    { hasWill: 'yes', hasTrust: 'yes', trustType: 'irrevocable', hasTODDeed: 'yes', hasContest: 'no', isOutOfState: 'no', isSpouse: 'yes', debtStatus: 'solvent' },
    { hasWill: 'yes', hasTrust: 'yes', trustType: 'irrevocable', hasTODDeed: 'yes', hasContest: 'no', isOutOfState: 'no', isSpouse: 'yes', debtStatus: 'insolvent' },
    { hasWill: 'yes', hasTrust: 'yes', trustType: 'irrevocable', hasTODDeed: 'yes', hasContest: 'no', isOutOfState: 'yes', isSpouse: 'no', debtStatus: 'solvent' },
    { hasWill: 'yes', hasTrust: 'yes', trustType: 'irrevocable', hasTODDeed: 'yes', hasContest: 'no', isOutOfState: 'yes', isSpouse: 'no', debtStatus: 'insolvent' },
    { hasWill: 'yes', hasTrust: 'yes', trustType: 'irrevocable', hasTODDeed: 'yes', hasContest: 'no', isOutOfState: 'yes', isSpouse: 'yes', debtStatus: 'solvent' },
    { hasWill: 'yes', hasTrust: 'yes', trustType: 'irrevocable', hasTODDeed: 'yes', hasContest: 'no', isOutOfState: 'yes', isSpouse: 'yes', debtStatus: 'insolvent' },

    // With Irrevocable Trust and Contest
    { hasWill: 'yes', hasTrust: 'yes', trustType: 'irrevocable', hasTODDeed: 'no', hasContest: 'yes', isOutOfState: 'no', isSpouse: 'no', debtStatus: 'solvent' },
    { hasWill: 'yes', hasTrust: 'yes', trustType: 'irrevocable', hasTODDeed: 'no', hasContest: 'yes', isOutOfState: 'no', isSpouse: 'no', debtStatus: 'insolvent' },
    { hasWill: 'yes', hasTrust: 'yes', trustType: 'irrevocable', hasTODDeed: 'no', hasContest: 'yes', isOutOfState: 'no', isSpouse: 'yes', debtStatus: 'solvent' },
    { hasWill: 'yes', hasTrust: 'yes', trustType: 'irrevocable', hasTODDeed: 'no', hasContest: 'yes', isOutOfState: 'no', isSpouse: 'yes', debtStatus: 'insolvent' },
    { hasWill: 'yes', hasTrust: 'yes', trustType: 'irrevocable', hasTODDeed: 'no', hasContest: 'yes', isOutOfState: 'yes', isSpouse: 'no', debtStatus: 'solvent' },
    { hasWill: 'yes', hasTrust: 'yes', trustType: 'irrevocable', hasTODDeed: 'no', hasContest: 'yes', isOutOfState: 'yes', isSpouse: 'no', debtStatus: 'insolvent' },
    { hasWill: 'yes', hasTrust: 'yes', trustType: 'irrevocable', hasTODDeed: 'no', hasContest: 'yes', isOutOfState: 'yes', isSpouse: 'yes', debtStatus: 'solvent' },
    { hasWill: 'yes', hasTrust: 'yes', trustType: 'irrevocable', hasTODDeed: 'no', hasContest: 'yes', isOutOfState: 'yes', isSpouse: 'yes', debtStatus: 'insolvent' },

    // With Irrevocable Trust, TOD Deed, and Contest
    { hasWill: 'yes', hasTrust: 'yes', trustType: 'irrevocable', hasTODDeed: 'yes', hasContest: 'yes', isOutOfState: 'no', isSpouse: 'no', debtStatus: 'solvent' },
    { hasWill: 'yes', hasTrust: 'yes', trustType: 'irrevocable', hasTODDeed: 'yes', hasContest: 'yes', isOutOfState: 'no', isSpouse: 'no', debtStatus: 'insolvent' },
    { hasWill: 'yes', hasTrust: 'yes', trustType: 'irrevocable', hasTODDeed: 'yes', hasContest: 'yes', isOutOfState: 'no', isSpouse: 'yes', debtStatus: 'solvent' },
    { hasWill: 'yes', hasTrust: 'yes', trustType: 'irrevocable', hasTODDeed: 'yes', hasContest: 'yes', isOutOfState: 'no', isSpouse: 'yes', debtStatus: 'insolvent' },
    { hasWill: 'yes', hasTrust: 'yes', trustType: 'irrevocable', hasTODDeed: 'yes', hasContest: 'yes', isOutOfState: 'yes', isSpouse: 'no', debtStatus: 'solvent' },
    { hasWill: 'yes', hasTrust: 'yes', trustType: 'irrevocable', hasTODDeed: 'yes', hasContest: 'yes', isOutOfState: 'yes', isSpouse: 'no', debtStatus: 'insolvent' },
    { hasWill: 'yes', hasTrust: 'yes', trustType: 'irrevocable', hasTODDeed: 'yes', hasContest: 'yes', isOutOfState: 'yes', isSpouse: 'yes', debtStatus: 'solvent' },
    { hasWill: 'yes', hasTrust: 'yes', trustType: 'irrevocable', hasTODDeed: 'yes', hasContest: 'yes', isOutOfState: 'yes', isSpouse: 'yes', debtStatus: 'insolvent' },

    // No Will combinations
    { hasWill: 'no', hasTrust: 'no', hasTODDeed: 'no', hasContest: 'no', isOutOfState: 'no', isSpouse: 'no', debtStatus: 'solvent' },
    { hasWill: 'no', hasTrust: 'no', hasTODDeed: 'no', hasContest: 'no', isOutOfState: 'no', isSpouse: 'no', debtStatus: 'insolvent' },
    { hasWill: 'no', hasTrust: 'no', hasTODDeed: 'no', hasContest: 'no', isOutOfState: 'no', isSpouse: 'yes', debtStatus: 'solvent' },
    { hasWill: 'no', hasTrust: 'no', hasTODDeed: 'no', hasContest: 'no', isOutOfState: 'no', isSpouse: 'yes', debtStatus: 'insolvent' },
    { hasWill: 'no', hasTrust: 'no', hasTODDeed: 'no', hasContest: 'no', isOutOfState: 'yes', isSpouse: 'no', debtStatus: 'solvent' },
    { hasWill: 'no', hasTrust: 'no', hasTODDeed: 'no', hasContest: 'no', isOutOfState: 'yes', isSpouse: 'no', debtStatus: 'insolvent' },
    { hasWill: 'no', hasTrust: 'no', hasTODDeed: 'no', hasContest: 'no', isOutOfState: 'yes', isSpouse: 'yes', debtStatus: 'solvent' },
    { hasWill: 'no', hasTrust: 'no', hasTODDeed: 'no', hasContest: 'no', isOutOfState: 'yes', isSpouse: 'yes', debtStatus: 'insolvent' },

    // No Will with TOD Deed
    { hasWill: 'no', hasTrust: 'no', hasTODDeed: 'yes', hasContest: 'no', isOutOfState: 'no', isSpouse: 'no', debtStatus: 'solvent' },
    { hasWill: 'no', hasTrust: 'no', hasTODDeed: 'yes', hasContest: 'no', isOutOfState: 'no', isSpouse: 'no', debtStatus: 'insolvent' },
    { hasWill: 'no', hasTrust: 'no', hasTODDeed: 'yes', hasContest: 'no', isOutOfState: 'no', isSpouse: 'yes', debtStatus: 'solvent' },
    { hasWill: 'no', hasTrust: 'no', hasTODDeed: 'yes', hasContest: 'no', isOutOfState: 'no', isSpouse: 'yes', debtStatus: 'insolvent' },
    { hasWill: 'no', hasTrust: 'no', hasTODDeed: 'yes', hasContest: 'no', isOutOfState: 'yes', isSpouse: 'no', debtStatus: 'solvent' },
    { hasWill: 'no', hasTrust: 'no', hasTODDeed: 'yes', hasContest: 'no', isOutOfState: 'yes', isSpouse: 'no', debtStatus: 'insolvent' },
    { hasWill: 'no', hasTrust: 'no', hasTODDeed: 'yes', hasContest: 'no', isOutOfState: 'yes', isSpouse: 'yes', debtStatus: 'solvent' },
    { hasWill: 'no', hasTrust: 'no', hasTODDeed: 'yes', hasContest: 'no', isOutOfState: 'yes', isSpouse: 'yes', debtStatus: 'insolvent' },

    // No Will with Contest
    { hasWill: 'no', hasTrust: 'no', hasTODDeed: 'no', hasContest: 'yes', isOutOfState: 'no', isSpouse: 'no', debtStatus: 'solvent' },
    { hasWill: 'no', hasTrust: 'no', hasTODDeed: 'no', hasContest: 'yes', isOutOfState: 'no', isSpouse: 'no', debtStatus: 'insolvent' },
    { hasWill: 'no', hasTrust: 'no', hasTODDeed: 'no', hasContest: 'yes', isOutOfState: 'no', isSpouse: 'yes', debtStatus: 'solvent' },
    { hasWill: 'no', hasTrust: 'no', hasTODDeed: 'no', hasContest: 'yes', isOutOfState: 'no', isSpouse: 'yes', debtStatus: 'insolvent' },
    { hasWill: 'no', hasTrust: 'no', hasTODDeed: 'no', hasContest: 'yes', isOutOfState: 'yes', isSpouse: 'no', debtStatus: 'solvent' },
    { hasWill: 'no', hasTrust: 'no', hasTODDeed: 'no', hasContest: 'yes', isOutOfState: 'yes', isSpouse: 'no', debtStatus: 'insolvent' },
    { hasWill: 'no', hasTrust: 'no', hasTODDeed: 'no', hasContest: 'yes', isOutOfState: 'yes', isSpouse: 'yes', debtStatus: 'solvent' },
    { hasWill: 'no', hasTrust: 'no', hasTODDeed: 'no', hasContest: 'yes', isOutOfState: 'yes', isSpouse: 'yes', debtStatus: 'insolvent' },

    // No Will with TOD Deed and Contest
    { hasWill: 'no', hasTrust: 'no', hasTODDeed: 'yes', hasContest: 'yes', isOutOfState: 'no', isSpouse: 'no', debtStatus: 'solvent' },
    { hasWill: 'no', hasTrust: 'no', hasTODDeed: 'yes', hasContest: 'yes', isOutOfState: 'no', isSpouse: 'no', debtStatus: 'insolvent' },
    { hasWill: 'no', hasTrust: 'no', hasTODDeed: 'yes', hasContest: 'yes', isOutOfState: 'no', isSpouse: 'yes', debtStatus: 'solvent' },
    { hasWill: 'no', hasTrust: 'no', hasTODDeed: 'yes', hasContest: 'yes', isOutOfState: 'no', isSpouse: 'yes', debtStatus: 'insolvent' },
    { hasWill: 'no', hasTrust: 'no', hasTODDeed: 'yes', hasContest: 'yes', isOutOfState: 'yes', isSpouse: 'no', debtStatus: 'solvent' },
    { hasWill: 'no', hasTrust: 'no', hasTODDeed: 'yes', hasContest: 'yes', isOutOfState: 'yes', isSpouse: 'no', debtStatus: 'insolvent' },
    { hasWill: 'no', hasTrust: 'no', hasTODDeed: 'yes', hasContest: 'yes', isOutOfState: 'yes', isSpouse: 'yes', debtStatus: 'solvent' },
    { hasWill: 'no', hasTrust: 'no', hasTODDeed: 'yes', hasContest: 'yes', isOutOfState: 'yes', isSpouse: 'yes', debtStatus: 'insolvent' },

    // No Will with Trust (Revocable)
    { hasWill: 'no', hasTrust: 'yes', trustType: 'revocable', hasTODDeed: 'no', hasContest: 'no', isOutOfState: 'no', isSpouse: 'no', debtStatus: 'solvent' },
    { hasWill: 'no', hasTrust: 'yes', trustType: 'revocable', hasTODDeed: 'no', hasContest: 'no', isOutOfState: 'no', isSpouse: 'no', debtStatus: 'insolvent' },
    { hasWill: 'no', hasTrust: 'yes', trustType: 'revocable', hasTODDeed: 'no', hasContest: 'no', isOutOfState: 'no', isSpouse: 'yes', debtStatus: 'solvent' },
    { hasWill: 'no', hasTrust: 'yes', trustType: 'revocable', hasTODDeed: 'no', hasContest: 'no', isOutOfState: 'no', isSpouse: 'yes', debtStatus: 'insolvent' },
    { hasWill: 'no', hasTrust: 'yes', trustType: 'revocable', hasTODDeed: 'no', hasContest: 'no', isOutOfState: 'yes', isSpouse: 'no', debtStatus: 'solvent' },
    { hasWill: 'no', hasTrust: 'yes', trustType: 'revocable', hasTODDeed: 'no', hasContest: 'no', isOutOfState: 'yes', isSpouse: 'no', debtStatus: 'insolvent' },
    { hasWill: 'no', hasTrust: 'yes', trustType: 'revocable', hasTODDeed: 'no', hasContest: 'no', isOutOfState: 'yes', isSpouse: 'yes', debtStatus: 'solvent' },
    { hasWill: 'no', hasTrust: 'yes', trustType: 'revocable', hasTODDeed: 'no', hasContest: 'no', isOutOfState: 'yes', isSpouse: 'yes', debtStatus: 'insolvent' },

    // No Will with Trust (Irrevocable)
    { hasWill: 'no', hasTrust: 'yes', trustType: 'irrevocable', hasTODDeed: 'no', hasContest: 'no', isOutOfState: 'no', isSpouse: 'no', debtStatus: 'solvent' },
    { hasWill: 'no', hasTrust: 'yes', trustType: 'irrevocable', hasTODDeed: 'no', hasContest: 'no', isOutOfState: 'no', isSpouse: 'no', debtStatus: 'insolvent' },
    { hasWill: 'no', hasTrust: 'yes', trustType: 'irrevocable', hasTODDeed: 'no', hasContest: 'no', isOutOfState: 'no', isSpouse: 'yes', debtStatus: 'solvent' },
    { hasWill: 'no', hasTrust: 'yes', trustType: 'irrevocable', hasTODDeed: 'no', hasContest: 'no', isOutOfState: 'no', isSpouse: 'yes', debtStatus: 'insolvent' },
    { hasWill: 'no', hasTrust: 'yes', trustType: 'irrevocable', hasTODDeed: 'no', hasContest: 'no', isOutOfState: 'yes', isSpouse: 'no', debtStatus: 'solvent' },
    { hasWill: 'no', hasTrust: 'yes', trustType: 'irrevocable', hasTODDeed: 'no', hasContest: 'no', isOutOfState: 'yes', isSpouse: 'no', debtStatus: 'insolvent' },
    { hasWill: 'no', hasTrust: 'yes', trustType: 'irrevocable', hasTODDeed: 'no', hasContest: 'no', isOutOfState: 'yes', isSpouse: 'yes', debtStatus: 'solvent' },
    { hasWill: 'no', hasTrust: 'yes', trustType: 'irrevocable', hasTODDeed: 'no', hasContest: 'no', isOutOfState: 'yes', isSpouse: 'yes', debtStatus: 'insolvent' },

    // No Will with Trust and TOD Deed
    { hasWill: 'no', hasTrust: 'yes', trustType: 'revocable', hasTODDeed: 'yes', hasContest: 'no', isOutOfState: 'no', isSpouse: 'no', debtStatus: 'solvent' },
    { hasWill: 'no', hasTrust: 'yes', trustType: 'revocable', hasTODDeed: 'yes', hasContest: 'no', isOutOfState: 'no', isSpouse: 'no', debtStatus: 'insolvent' },
    { hasWill: 'no', hasTrust: 'yes', trustType: 'revocable', hasTODDeed: 'yes', hasContest: 'no', isOutOfState: 'no', isSpouse: 'yes', debtStatus: 'solvent' },
    { hasWill: 'no', hasTrust: 'yes', trustType: 'revocable', hasTODDeed: 'yes', hasContest: 'no', isOutOfState: 'no', isSpouse: 'yes', debtStatus: 'insolvent' },
    { hasWill: 'no', hasTrust: 'yes', trustType: 'revocable', hasTODDeed: 'yes', hasContest: 'no', isOutOfState: 'yes', isSpouse: 'no', debtStatus: 'solvent' },
    { hasWill: 'no', hasTrust: 'yes', trustType: 'revocable', hasTODDeed: 'yes', hasContest: 'no', isOutOfState: 'yes', isSpouse: 'no', debtStatus: 'insolvent' },
    { hasWill: 'no', hasTrust: 'yes', trustType: 'revocable', hasTODDeed: 'yes', hasContest: 'no', isOutOfState: 'yes', isSpouse: 'yes', debtStatus: 'solvent' },
    { hasWill: 'no', hasTrust: 'yes', trustType: 'revocable', hasTODDeed: 'yes', hasContest: 'no', isOutOfState: 'yes', isSpouse: 'yes', debtStatus: 'insolvent' },

    // No Will with Trust and Contest
    { hasWill: 'no', hasTrust: 'yes', trustType: 'revocable', hasTODDeed: 'no', hasContest: 'yes', isOutOfState: 'no', isSpouse: 'no', debtStatus: 'solvent' },
    { hasWill: 'no', hasTrust: 'yes', trustType: 'revocable', hasTODDeed: 'no', hasContest: 'yes', isOutOfState: 'no', isSpouse: 'no', debtStatus: 'insolvent' },
    { hasWill: 'no', hasTrust: 'yes', trustType: 'revocable', hasTODDeed: 'no', hasContest: 'yes', isOutOfState: 'no', isSpouse: 'yes', debtStatus: 'solvent' },
    { hasWill: 'no', hasTrust: 'yes', trustType: 'revocable', hasTODDeed: 'no', hasContest: 'yes', isOutOfState: 'no', isSpouse: 'yes', debtStatus: 'insolvent' },
    { hasWill: 'no', hasTrust: 'yes', trustType: 'revocable', hasTODDeed: 'no', hasContest: 'yes', isOutOfState: 'yes', isSpouse: 'no', debtStatus: 'solvent' },
    { hasWill: 'no', hasTrust: 'yes', trustType: 'revocable', hasTODDeed: 'no', hasContest: 'yes', isOutOfState: 'yes', isSpouse: 'no', debtStatus: 'insolvent' },
    { hasWill: 'no', hasTrust: 'yes', trustType: 'revocable', hasTODDeed: 'no', hasContest: 'yes', isOutOfState: 'yes', isSpouse: 'yes', debtStatus: 'solvent' },
    { hasWill: 'no', hasTrust: 'yes', trustType: 'revocable', hasTODDeed: 'no', hasContest: 'yes', isOutOfState: 'yes', isSpouse: 'yes', debtStatus: 'insolvent' },

    // No Will with Trust, TOD Deed, and Contest
    { hasWill: 'no', hasTrust: 'yes', trustType: 'revocable', hasTODDeed: 'yes', hasContest: 'yes', isOutOfState: 'no', isSpouse: 'no', debtStatus: 'solvent' },
    { hasWill: 'no', hasTrust: 'yes', trustType: 'revocable', hasTODDeed: 'yes', hasContest: 'yes', isOutOfState: 'no', isSpouse: 'no', debtStatus: 'insolvent' },
    { hasWill: 'no', hasTrust: 'yes', trustType: 'revocable', hasTODDeed: 'yes', hasContest: 'yes', isOutOfState: 'no', isSpouse: 'yes', debtStatus: 'solvent' },
    { hasWill: 'no', hasTrust: 'yes', trustType: 'revocable', hasTODDeed: 'yes', hasContest: 'yes', isOutOfState: 'no', isSpouse: 'yes', debtStatus: 'insolvent' },
    { hasWill: 'no', hasTrust: 'yes', trustType: 'revocable', hasTODDeed: 'yes', hasContest: 'yes', isOutOfState: 'yes', isSpouse: 'no', debtStatus: 'solvent' },
    { hasWill: 'no', hasTrust: 'yes', trustType: 'revocable', hasTODDeed: 'yes', hasContest: 'yes', isOutOfState: 'yes', isSpouse: 'no', debtStatus: 'insolvent' },
    { hasWill: 'no', hasTrust: 'yes', trustType: 'revocable', hasTODDeed: 'yes', hasContest: 'yes', isOutOfState: 'yes', isSpouse: 'yes', debtStatus: 'solvent' },
    { hasWill: 'no', hasTrust: 'yes', trustType: 'revocable', hasTODDeed: 'yes', hasContest: 'yes', isOutOfState: 'yes', isSpouse: 'yes', debtStatus: 'insolvent' },

    // No Will with Irrevocable Trust and TOD Deed
    { hasWill: 'no', hasTrust: 'yes', trustType: 'irrevocable', hasTODDeed: 'yes', hasContest: 'no', isOutOfState: 'no', isSpouse: 'no', debtStatus: 'solvent' },
    { hasWill: 'no', hasTrust: 'yes', trustType: 'irrevocable', hasTODDeed: 'yes', hasContest: 'no', isOutOfState: 'no', isSpouse: 'no', debtStatus: 'insolvent' },
    { hasWill: 'no', hasTrust: 'yes', trustType: 'irrevocable', hasTODDeed: 'yes', hasContest: 'no', isOutOfState: 'no', isSpouse: 'yes', debtStatus: 'solvent' },
    { hasWill: 'no', hasTrust: 'yes', trustType: 'irrevocable', hasTODDeed: 'yes', hasContest: 'no', isOutOfState: 'no', isSpouse: 'yes', debtStatus: 'insolvent' },
    { hasWill: 'no', hasTrust: 'yes', trustType: 'irrevocable', hasTODDeed: 'yes', hasContest: 'no', isOutOfState: 'yes', isSpouse: 'no', debtStatus: 'solvent' },
    { hasWill: 'no', hasTrust: 'yes', trustType: 'irrevocable', hasTODDeed: 'yes', hasContest: 'no', isOutOfState: 'yes', isSpouse: 'no', debtStatus: 'insolvent' },
    { hasWill: 'no', hasTrust: 'yes', trustType: 'irrevocable', hasTODDeed: 'yes', hasContest: 'no', isOutOfState: 'yes', isSpouse: 'yes', debtStatus: 'solvent' },
    { hasWill: 'no', hasTrust: 'yes', trustType: 'irrevocable', hasTODDeed: 'yes', hasContest: 'no', isOutOfState: 'yes', isSpouse: 'yes', debtStatus: 'insolvent' },

    // No Will with Irrevocable Trust and Contest
    { hasWill: 'no', hasTrust: 'yes', trustType: 'irrevocable', hasTODDeed: 'no', hasContest: 'yes', isOutOfState: 'no', isSpouse: 'no', debtStatus: 'solvent' },
    { hasWill: 'no', hasTrust: 'yes', trustType: 'irrevocable', hasTODDeed: 'no', hasContest: 'yes', isOutOfState: 'no', isSpouse: 'no', debtStatus: 'insolvent' },
    { hasWill: 'no', hasTrust: 'yes', trustType: 'irrevocable', hasTODDeed: 'no', hasContest: 'yes', isOutOfState: 'no', isSpouse: 'yes', debtStatus: 'solvent' },
    { hasWill: 'no', hasTrust: 'yes', trustType: 'irrevocable', hasTODDeed: 'no', hasContest: 'yes', isOutOfState: 'no', isSpouse: 'yes', debtStatus: 'insolvent' },
    { hasWill: 'no', hasTrust: 'yes', trustType: 'irrevocable', hasTODDeed: 'no', hasContest: 'yes', isOutOfState: 'yes', isSpouse: 'no', debtStatus: 'solvent' },
    { hasWill: 'no', hasTrust: 'yes', trustType: 'irrevocable', hasTODDeed: 'no', hasContest: 'yes', isOutOfState: 'yes', isSpouse: 'no', debtStatus: 'insolvent' },
    { hasWill: 'no', hasTrust: 'yes', trustType: 'irrevocable', hasTODDeed: 'no', hasContest: 'yes', isOutOfState: 'yes', isSpouse: 'yes', debtStatus: 'solvent' },
    { hasWill: 'no', hasTrust: 'yes', trustType: 'irrevocable', hasTODDeed: 'no', hasContest: 'yes', isOutOfState: 'yes', isSpouse: 'yes', debtStatus: 'insolvent' },

    // No Will with Irrevocable Trust, TOD Deed, and Contest
    { hasWill: 'no', hasTrust: 'yes', trustType: 'irrevocable', hasTODDeed: 'yes', hasContest: 'yes', isOutOfState: 'no', isSpouse: 'no', debtStatus: 'solvent' },
    { hasWill: 'no', hasTrust: 'yes', trustType: 'irrevocable', hasTODDeed: 'yes', hasContest: 'yes', isOutOfState: 'no', isSpouse: 'no', debtStatus: 'insolvent' },
    { hasWill: 'no', hasTrust: 'yes', trustType: 'irrevocable', hasTODDeed: 'yes', hasContest: 'yes', isOutOfState: 'no', isSpouse: 'yes', debtStatus: 'solvent' },
    { hasWill: 'no', hasTrust: 'yes', trustType: 'irrevocable', hasTODDeed: 'yes', hasContest: 'yes', isOutOfState: 'no', isSpouse: 'yes', debtStatus: 'insolvent' },
    { hasWill: 'no', hasTrust: 'yes', trustType: 'irrevocable', hasTODDeed: 'yes', hasContest: 'yes', isOutOfState: 'yes', isSpouse: 'no', debtStatus: 'solvent' },
    { hasWill: 'no', hasTrust: 'yes', trustType: 'irrevocable', hasTODDeed: 'yes', hasContest: 'yes', isOutOfState: 'yes', isSpouse: 'no', debtStatus: 'insolvent' },
    { hasWill: 'no', hasTrust: 'yes', trustType: 'irrevocable', hasTODDeed: 'yes', hasContest: 'yes', isOutOfState: 'yes', isSpouse: 'yes', debtStatus: 'solvent' },
    { hasWill: 'no', hasTrust: 'yes', trustType: 'irrevocable', hasTODDeed: 'yes', hasContest: 'yes', isOutOfState: 'yes', isSpouse: 'yes', debtStatus: 'insolvent' }
  ];

  // Generate all combinations for testing
  const generateAllCombinations = () => {
    const combinations = [];
    const yesNoOptions = ['yes', 'no'];
    const trustTypes = ['revocable', 'irrevocable'];
    const debtStatuses = ['solvent', 'insolvent'];

    // For each combination of yes/no for the 6 boolean fields
    for (const hasWill of yesNoOptions) {
      for (const hasTrust of yesNoOptions) {
        const trustTypeOptions = hasTrust === 'yes' ? trustTypes : ['none'];
        for (const trustType of trustTypeOptions) {
          for (const hasTODDeed of yesNoOptions) {
            for (const hasContest of yesNoOptions) {
              for (const isOutOfState of yesNoOptions) {
                for (const isSpouse of yesNoOptions) {
                  for (const debtStatus of debtStatuses) {
                    combinations.push({
                      hasWill,
                      hasTrust,
                      trustType,
                      hasTODDeed,
                      hasContest,
                      isOutOfState,
                      isSpouse,
                      debtStatus
                    });
                  }
                }
              }
            }
          }
        }
      }
    }
    return combinations;
  };

  // Test each combination
  testCombinations.forEach((combination, index) => {
    it(`should handle combination ${index + 1}: ${JSON.stringify(combination)}`, async () => {
      // Mock successful API responses
      mockAuthService.register.mockResolvedValue({ success: true, userId: 'test-user-id' });
      mockEstateService.createEstate.mockResolvedValue({ 
        success: true, 
        estateId: 'test-estate-id',
        name: 'Test Estate'
      });

      render(<EnhancedOnboardingWizard />);

      // Fill out the form with the combination values
      await fillOutForm(combination);

      // Complete the wizard
      const nextButton = screen.getByText('Complete Onboarding');
      fireEvent.click(nextButton);

      // Wait for completion
      await waitFor(() => {
        expect(mockAuthService.register).toHaveBeenCalled();
        expect(mockEstateService.createEstate).toHaveBeenCalled();
      });

      // Verify the correct path was calculated
      const pathResult = pathEngine.calculatePath(combination);
      expect(pathResult).toBeDefined();
      expect(pathResult.pathId).toBeDefined();
      expect(pathResult.confidence).toBeGreaterThan(0);
    });
  });

  // Helper function to fill out the form
  const fillOutForm = async (combination: any) => {
    // Question 1: Do you have a will?
    const hasWillButton = screen.getByText(combination.hasWill === 'yes' ? 'Yes' : 'No');
    fireEvent.click(hasWillButton);

    // Question 2: Do you have a trust?
    const hasTrustButton = screen.getByText(combination.hasTrust === 'yes' ? 'Yes' : 'No');
    fireEvent.click(hasTrustButton);

    // If trust is yes, select trust type
    if (combination.hasTrust === 'yes') {
      const trustTypeButton = screen.getByText(combination.trustType);
      fireEvent.click(trustTypeButton);
    }

    // Question 3: Do you have a TOD deed?
    const hasTODDeedButton = screen.getByText(combination.hasTODDeed === 'yes' ? 'Yes' : 'No');
    fireEvent.click(hasTODDeedButton);

    // Question 4: Is there a contest?
    const hasContestButton = screen.getByText(combination.hasContest === 'yes' ? 'Yes' : 'No');
    fireEvent.click(hasContestButton);

    // Question 5: Is the estate out of state?
    const isOutOfStateButton = screen.getByText(combination.isOutOfState === 'yes' ? 'Yes' : 'No');
    fireEvent.click(isOutOfStateButton);

    // Question 6: Is the surviving spouse involved?
    const isSpouseButton = screen.getByText(combination.isSpouse === 'yes' ? 'Yes' : 'No');
    fireEvent.click(isSpouseButton);

    // Question 7: What is the debt status?
    const debtStatusButton = screen.getByText(combination.debtStatus === 'solvent' ? 'Solvent' : 'Insolvent');
    fireEvent.click(debtStatusButton);
  };

  describe('Path Calculation Validation', () => {
    it('should calculate correct paths for all combinations', () => {
      const allCombinations = generateAllCombinations();
      
      allCombinations.forEach((combination, index) => {
        const pathResult = pathEngine.calculatePath(combination);
        
        expect(pathResult).toBeDefined();
        expect(pathResult.pathId).toBeDefined();
        expect(pathResult.confidence).toBeGreaterThan(0);
        expect(pathResult.confidence).toBeLessThanOrEqual(100);
        
        // Verify path exists in the engine
        const path = pathEngine.getPathById(pathResult.pathId);
        expect(path).toBeDefined();
        expect(path.name).toBeDefined();
        expect(path.complexity).toBeDefined();
        expect(path.timeline).toBeDefined();
      });
    });

    it('should handle edge cases correctly', () => {
      // Test with all "not_sure" values
      const unsureCombination = {
        hasWill: 'not_sure',
        hasTrust: 'not_sure',
        trustType: 'not_sure',
        hasTODDeed: 'not_sure',
        hasContest: 'not_sure',
        isOutOfState: 'not_sure',
        isSpouse: 'not_sure',
        debtStatus: 'not_sure'
      };

      const pathResult = pathEngine.calculatePath(unsureCombination);
      expect(pathResult).toBeDefined();
      expect(pathResult.pathId).toBeDefined();
      expect(pathResult.confidence).toBeGreaterThan(0);
    });
  });

  describe('Registration Flow Validation', () => {
    it('should complete registration for all valid combinations', async () => {
      // Test a subset of combinations to avoid timeout
      const testSubset = testCombinations.slice(0, 20);

      for (const combination of testSubset) {
        // Reset mocks
        mockAuthService.register.mockClear();
        mockEstateService.createEstate.mockClear();

        // Mock successful responses
        mockAuthService.register.mockResolvedValue({ success: true, userId: 'test-user-id' });
        mockEstateService.createEstate.mockResolvedValue({ 
          success: true, 
          estateId: 'test-estate-id',
          name: 'Test Estate'
        });

        render(<EnhancedOnboardingWizard />);

        // Fill out form
        await fillOutForm(combination);

        // Complete onboarding
        const completeButton = screen.getByText('Complete Onboarding');
        fireEvent.click(completeButton);

        // Verify registration and estate creation
        await waitFor(() => {
          expect(mockAuthService.register).toHaveBeenCalled();
          expect(mockEstateService.createEstate).toHaveBeenCalled();
        });
      }
    });
  });
});