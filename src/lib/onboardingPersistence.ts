// Onboarding Answers type based on EnhancedOnboardingWizard state
export type OnboardingAnswers = {
    hasWill: 'yes' | 'no' | 'not_sure';
    hasTrust: 'yes' | 'no' | 'not_sure';
    trustType?: 'revocable' | 'irrevocable' | 'none' | 'not_sure';
    hasTODDeed: 'yes' | 'no' | 'not_sure';
    hasContest: 'yes' | 'no' | 'not_sure';
    isOutOfState: 'yes' | 'no' | 'not_sure';
    isSpouse: 'yes' | 'no' | 'not_sure';
    debtStatus: 'solvent' | 'insolvent' | 'not_sure';
};

export interface OnboardingSession {
    answers: OnboardingAnswers;
    currentStep: number;
    pathResult: any;
    timestamp: number;
    estateId?: string;
}

const STORAGE_KEY = 'onboarding_session';

export const OnboardingPersistence = {
    /**
     * Save current onboarding session to localStorage
     */
    saveSession(session: Partial<OnboardingSession>): void {
        try {
            const existing = this.getSession();
            const updatedSession: OnboardingSession = {
                answers: session.answers || existing?.answers || this.getDefaultAnswers(),
                currentStep: session.currentStep ?? existing?.currentStep ?? 0,
                pathResult: session.pathResult ?? existing?.pathResult ?? null,
                timestamp: Date.now(),
                estateId: session.estateId || existing?.estateId
            };
            
            localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedSession));
        } catch (error) {
            console.warn('Failed to save onboarding session:', error);
        }
    },

    /**
     * Get saved onboarding session from localStorage
     */
    getSession(): OnboardingSession | null {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (!saved) return null;
            
            const session = JSON.parse(saved) as OnboardingSession;
            
            // Check if session is too old (older than 7 days)
            const age = Date.now() - session.timestamp;
            const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
            
            if (age > maxAge) {
                this.clearSession();
                return null;
            }
            
            return session;
        } catch (error) {
            console.warn('Failed to load onboarding session:', error);
            return null;
        }
    },

    /**
     * Clear saved onboarding session
     */
    clearSession(): void {
        try {
            localStorage.removeItem(STORAGE_KEY);
        } catch (error) {
            console.warn('Failed to clear onboarding session:', error);
        }
    },

    /**
     * Check if there's a saved session that can be resumed
     */
    hasSavedSession(): boolean {
        const session = this.getSession();
        return !!session && session.currentStep > 0;
    },

    /**
     * Get default answers for new sessions
     */
    getDefaultAnswers(): OnboardingAnswers {
        return {
            hasWill: 'not_sure',
            hasTrust: 'not_sure',
            trustType: 'not_sure',
            hasTODDeed: 'not_sure',
            hasContest: 'not_sure',
            isOutOfState: 'not_sure',
            isSpouse: 'not_sure',
            debtStatus: 'not_sure'
        };
    },

    /**
     * Complete onboarding and clear session
     */
    completeOnboarding(): void {
        this.clearSession();
    }
};