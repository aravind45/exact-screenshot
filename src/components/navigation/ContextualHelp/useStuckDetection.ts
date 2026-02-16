import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'ee_last_activity_timestamp';
const DISMISSED_KEY = 'ee_stuck_dismissed';

/** Default threshold: 30 minutes of inactivity (in ms) */
const DEFAULT_THRESHOLD_MS = 30 * 60 * 1000;

export interface UseStuckDetectionOptions {
  /** Inactivity threshold in milliseconds before showing "Need help?" */
  thresholdMs?: number;
  /** Whether detection is enabled */
  enabled?: boolean;
}

export interface UseStuckDetectionResult {
  /** Whether the user appears stuck (inactive beyond threshold) */
  isStuck: boolean;
  /** Dismiss the stuck notification until next activity cycle */
  dismiss: () => void;
  /** Record user activity (resets the timer) */
  recordActivity: () => void;
  /** Get the last activity timestamp */
  lastActivityTimestamp: number | null;
}

/**
 * Hook that detects when a user hasn't progressed in a while.
 * Checks localStorage for the last activity timestamp and compares
 * against a configurable threshold.
 *
 * Activity is recorded on meaningful user actions (navigation, form submissions, etc.)
 * and the hook shows a "Need help?" prompt after the threshold is exceeded.
 */
export function useStuckDetection({
  thresholdMs = DEFAULT_THRESHOLD_MS,
  enabled = true,
}: UseStuckDetectionOptions = {}): UseStuckDetectionResult {
  const [isStuck, setIsStuck] = useState(false);
  const [lastActivityTimestamp, setLastActivityTimestamp] = useState<number | null>(null);

  // Read initial timestamp from localStorage
  useEffect(() => {
    if (!enabled) return;

    const stored = localStorage.getItem(STORAGE_KEY);
    const dismissed = localStorage.getItem(DISMISSED_KEY);

    if (stored) {
      const ts = parseInt(stored, 10);
      setLastActivityTimestamp(ts);
      const elapsed = Date.now() - ts;
      setIsStuck(elapsed >= thresholdMs && dismissed !== 'true');
    } else {
      // First visit — record now
      const now = Date.now();
      localStorage.setItem(STORAGE_KEY, String(now));
      setLastActivityTimestamp(now);
      setIsStuck(false);
    }
  }, [thresholdMs, enabled]);

  const recordActivity = useCallback(() => {
    const now = Date.now();
    localStorage.setItem(STORAGE_KEY, String(now));
    localStorage.removeItem(DISMISSED_KEY);
    setLastActivityTimestamp(now);
    setIsStuck(false);
  }, []);

  const dismiss = useCallback(() => {
    localStorage.setItem(DISMISSED_KEY, 'true');
    setIsStuck(false);
  }, []);

  // Periodic check (every 60s) to detect if user becomes stuck during session
  useEffect(() => {
    if (!enabled) return;

    const interval = setInterval(() => {
      const stored = localStorage.getItem(STORAGE_KEY);
      const dismissed = localStorage.getItem(DISMISSED_KEY);
      if (stored && dismissed !== 'true') {
        const elapsed = Date.now() - parseInt(stored, 10);
        setIsStuck(elapsed >= thresholdMs);
      }
    }, 60_000);

    return () => clearInterval(interval);
  }, [thresholdMs, enabled]);

  return { isStuck, dismiss, recordActivity, lastActivityTimestamp };
}
