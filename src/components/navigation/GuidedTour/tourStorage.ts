import type { TourId, TourCompletionRecord } from '@/types/navigation';

const TOUR_STORAGE_KEY = 'expectedestate-guided-tours';

export function getTourCompletionRecord(): TourCompletionRecord {
  try {
    const stored = localStorage.getItem(TOUR_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return { completedTours: parsed.completedTours ?? {} };
    }
  } catch {
    // ignore parse errors
  }
  return { completedTours: {} };
}

export function saveTourCompletionRecord(record: TourCompletionRecord): void {
  try {
    localStorage.setItem(TOUR_STORAGE_KEY, JSON.stringify(record));
  } catch {
    // ignore storage errors
  }
}

export function markTourCompleted(tourId: TourId): void {
  const record = getTourCompletionRecord();
  record.completedTours[tourId] = new Date().toISOString();
  saveTourCompletionRecord(record);
}

export function isTourCompleted(tourId: TourId): boolean {
  const record = getTourCompletionRecord();
  return tourId in record.completedTours;
}

export function resetTourCompletion(tourId: TourId): void {
  const record = getTourCompletionRecord();
  delete record.completedTours[tourId];
  saveTourCompletionRecord(record);
}

export function resetAllTours(): void {
  saveTourCompletionRecord({ completedTours: {} });
}
