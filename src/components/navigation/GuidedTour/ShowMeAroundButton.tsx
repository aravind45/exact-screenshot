import { useState } from 'react';
import { HelpCircle } from 'lucide-react';
import type { TourId, TourDefinition } from '@/types/navigation';
import { allTours } from './tourDefinitions';
import { isTourCompleted, markTourCompleted } from './tourStorage';
import { GuidedTour } from './GuidedTour';

interface ShowMeAroundButtonProps {
  /** Optional: start a specific tour directly instead of showing the menu */
  tourId?: TourId;
  /** Optional: callback when any tour completes */
  onTourComplete?: (tourId: TourId) => void;
  /** Optional: custom class name */
  className?: string;
}

export function ShowMeAroundButton({
  tourId,
  onTourComplete,
  className = '',
}: ShowMeAroundButtonProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeTour, setActiveTour] = useState<TourDefinition | null>(null);

  const startTour = (tour: TourDefinition) => {
    setActiveTour(tour);
    setMenuOpen(false);
  };

  const handleComplete = () => {
    if (activeTour) {
      markTourCompleted(activeTour.id);
      onTourComplete?.(activeTour.id);
    }
    setActiveTour(null);
  };

  const handleSkip = () => {
    setActiveTour(null);
  };

  const handleClick = () => {
    if (tourId) {
      const tour = allTours.find((t) => t.id === tourId);
      if (tour) {
        startTour(tour);
        return;
      }
    }
    setMenuOpen((prev) => !prev);
  };

  return (
    <>
      <div className={`relative ${className}`}>
        <button
          data-testid="show-me-around-button"
          onClick={handleClick}
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 hover:text-slate-800 active:bg-slate-300 transition-all duration-150 ease-out"
          aria-label="Show me around"
          aria-haspopup={!tourId ? 'true' : undefined}
          aria-expanded={!tourId ? menuOpen : undefined}
        >
          <HelpCircle className="w-4 h-4" aria-hidden="true" />
          Show me around
        </button>

        {menuOpen && !tourId && (
          <div
            data-testid="tour-menu"
            className="absolute top-full left-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50"
            role="menu"
            aria-label="Available tours"
          >
            {allTours.map((tour) => {
              const completed = isTourCompleted(tour.id);
              return (
                <button
                  key={tour.id}
                  data-testid={`tour-menu-item-${tour.id}`}
                  onClick={() => startTour(tour)}
                  className="w-full text-left px-4 py-2.5 hover:bg-slate-50 active:bg-slate-100 transition-all duration-150 ease-out"
                  role="menuitem"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-700">
                      {tour.name}
                    </span>
                    {completed && (
                      <span
                        data-testid={`tour-completed-badge-${tour.id}`}
                        className="text-xs text-green-600 font-medium"
                      >
                        ✓ Done
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {tour.description}
                  </p>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Close menu when clicking outside */}
      {menuOpen && (
        <div
          data-testid="tour-menu-backdrop"
          className="fixed inset-0 z-40"
          onClick={() => setMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Active tour */}
      {activeTour && (
        <GuidedTour
          tour={activeTour}
          onComplete={handleComplete}
          onSkip={handleSkip}
        />
      )}
    </>
  );
}
