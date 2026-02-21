import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { OnboardingPersistence } from '../onboardingPersistence';

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

describe('OnboardingPersistence', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('saveSession', () => {
    it('should save session to localStorage', () => {
      const session = {
        answers: { 
          hasWill: 'yes' as const, 
          hasTrust: 'no' as const,
          hasTODDeed: 'not_sure' as const,
          hasContest: 'not_sure' as const,
          isOutOfState: 'not_sure' as const,
          isSpouse: 'not_sure' as const,
          debtStatus: 'not_sure' as const
        },
        currentStep: 2,
        pathResult: { pathId: 'TEST' }
      };

      OnboardingPersistence.saveSession(session);

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'onboarding_session',
        expect.stringContaining('"currentStep":2')
      );
    });

    it('should handle localStorage errors gracefully', () => {
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('localStorage unavailable');
      });

      const session = {
        answers: { 
          hasWill: 'yes' as const, 
          hasTrust: 'no' as const,
          hasTODDeed: 'not_sure' as const,
          hasContest: 'not_sure' as const,
          isOutOfState: 'not_sure' as const,
          isSpouse: 'not_sure' as const,
          debtStatus: 'not_sure' as const
        },
        currentStep: 1,
        pathResult: null
      };

      // Should not throw
      expect(() => OnboardingPersistence.saveSession(session)).not.toThrow();
    });
  });

  describe('getSession', () => {
    it('should return null when no session exists', () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      const result = OnboardingPersistence.getSession();

      expect(result).toBeNull();
    });

    it('should return session data when valid session exists', () => {
      const sessionData = {
        answers: { 
          hasWill: 'yes' as const, 
          hasTrust: 'no' as const,
          hasTODDeed: 'not_sure' as const,
          hasContest: 'not_sure' as const,
          isOutOfState: 'not_sure' as const,
          isSpouse: 'not_sure' as const,
          debtStatus: 'not_sure' as const
        },
        currentStep: 2,
        pathResult: { pathId: 'TEST' },
        timestamp: Date.now()
      };

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(sessionData));

      const result = OnboardingPersistence.getSession();

      expect(result).toEqual({
        answers: sessionData.answers,
        currentStep: sessionData.currentStep,
        pathResult: sessionData.pathResult,
        timestamp: sessionData.timestamp
      });
    });

    it('should return null when session is expired', () => {
      const sessionData = {
        answers: { 
          hasWill: 'yes' as const, 
          hasTrust: 'no' as const,
          hasTODDeed: 'not_sure' as const,
          hasContest: 'not_sure' as const,
          isOutOfState: 'not_sure' as const,
          isSpouse: 'not_sure' as const,
          debtStatus: 'not_sure' as const
        },
        currentStep: 1,
        pathResult: null,
        timestamp: Date.now() - (8 * 24 * 60 * 60 * 1000) // 8 days ago
      };

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(sessionData));

      const result = OnboardingPersistence.getSession();

      expect(result).toBeNull();
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('onboarding_session');
    });

    it('should return null when JSON parsing fails', () => {
      mockLocalStorage.getItem.mockReturnValue('invalid json');

      const result = OnboardingPersistence.getSession();

      expect(result).toBeNull();
    });
  });

  describe('clearSession', () => {
    it('should clear session from localStorage', () => {
      OnboardingPersistence.clearSession();

      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('onboarding_session');
    });

    it('should handle localStorage errors gracefully', () => {
      mockLocalStorage.removeItem.mockImplementation(() => {
        throw new Error('localStorage unavailable');
      });

      // Should not throw
      expect(() => OnboardingPersistence.clearSession()).not.toThrow();
    });
  });

  describe('hasSavedSession', () => {
    it('should return false when no session exists', () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      const result = OnboardingPersistence.hasSavedSession();

      expect(result).toBe(false);
    });

    it('should return true when session exists with currentStep > 0', () => {
      const sessionData = {
        answers: { 
          hasWill: 'yes' as const, 
          hasTrust: 'no' as const,
          hasTODDeed: 'not_sure' as const,
          hasContest: 'not_sure' as const,
          isOutOfState: 'not_sure' as const,
          isSpouse: 'not_sure' as const,
          debtStatus: 'not_sure' as const
        },
        currentStep: 2,
        pathResult: null,
        timestamp: Date.now()
      };

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(sessionData));

      const result = OnboardingPersistence.hasSavedSession();

      expect(result).toBe(true);
    });

    it('should return false when session exists but currentStep is 0', () => {
      const sessionData = {
        answers: { 
          hasWill: 'yes' as const, 
          hasTrust: 'no' as const,
          hasTODDeed: 'not_sure' as const,
          hasContest: 'not_sure' as const,
          isOutOfState: 'not_sure' as const,
          isSpouse: 'not_sure' as const,
          debtStatus: 'not_sure' as const
        },
        currentStep: 0,
        pathResult: null,
        timestamp: Date.now()
      };

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(sessionData));

      const result = OnboardingPersistence.hasSavedSession();

      expect(result).toBe(false);
    });
  });

  describe('getDefaultAnswers', () => {
    it('should return default answers with all fields set to not_sure', () => {
      const result = OnboardingPersistence.getDefaultAnswers();

      expect(result).toEqual({
        hasWill: 'not_sure',
        hasTrust: 'not_sure',
        trustType: 'not_sure',
        hasTODDeed: 'not_sure',
        hasContest: 'not_sure',
        isOutOfState: 'not_sure',
        isSpouse: 'not_sure',
        debtStatus: 'not_sure'
      });
    });
  });

  describe('completeOnboarding', () => {
    it('should clear session', () => {
      OnboardingPersistence.completeOnboarding();

      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('onboarding_session');
    });
  });
});
