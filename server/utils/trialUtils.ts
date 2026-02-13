export const TRIAL_DAYS = 7;

/**
 * Calculates if a user is currently in their 7-day trial period.
 * @param trialStartedAt The date the trial started
 * @returns boolean indicating if the user is trialing
 */
export function calculateIsTrialing(trialStartedAt: Date | string | null | undefined): boolean {
    if (!trialStartedAt) return false;

    const startTime = new Date(trialStartedAt).getTime();
    const now = new Date().getTime();
    const trialDurationMs = TRIAL_DAYS * 24 * 60 * 60 * 1000;

    return (now - startTime < trialDurationMs) && (now - startTime >= 0);
}
