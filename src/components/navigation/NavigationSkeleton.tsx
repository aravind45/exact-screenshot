/**
 * Loading skeleton components for navigation async states.
 * Used as Suspense fallbacks for lazy-loaded navigation components.
 */

export function NavigationSidebarSkeleton() {
  return (
    <div
      className="flex flex-col gap-6 p-4 animate-pulse"
      data-testid="navigation-sidebar-skeleton"
      role="status"
      aria-label="Loading navigation"
    >
      {/* Phase sections */}
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="flex flex-col gap-2">
          {/* Phase header */}
          <div className="flex items-center gap-3">
            <div className="h-5 w-5 rounded bg-slate-200" />
            <div className="h-3 w-24 rounded bg-slate-200" />
          </div>
          {/* Nav items */}
          {i <= 2 &&
            [1, 2, 3].map((j) => (
              <div key={j} className="flex items-center gap-3 py-2 px-4">
                <div className="h-4 w-4 rounded bg-slate-100" />
                <div className="h-3 w-32 rounded bg-slate-100" />
              </div>
            ))}
        </div>
      ))}
    </div>
  );
}

export function QuickActionsMenuSkeleton() {
  return (
    <div
      className="flex flex-col gap-3 p-4 animate-pulse"
      data-testid="quick-actions-skeleton"
      role="status"
      aria-label="Loading quick actions"
    >
      {/* Search bar */}
      <div className="h-10 w-full rounded-md bg-slate-200" />
      {/* Items */}
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-3 py-2">
          <div className="h-4 w-4 rounded bg-slate-100" />
          <div className="h-3 w-36 rounded bg-slate-100" />
        </div>
      ))}
    </div>
  );
}

export function NotificationCenterSkeleton() {
  return (
    <div
      className="flex flex-col gap-2 p-4 animate-pulse"
      data-testid="notification-center-skeleton"
      role="status"
      aria-label="Loading notifications"
    >
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-start gap-3 py-2">
          <div className="h-4 w-4 rounded-full bg-slate-200 mt-0.5" />
          <div className="flex-1 flex flex-col gap-1.5">
            <div className="h-3 w-40 rounded bg-slate-200" />
            <div className="h-2.5 w-56 rounded bg-slate-100" />
            <div className="h-2 w-16 rounded bg-slate-100" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function GenericNavigationSkeleton() {
  return (
    <div
      className="flex items-center justify-center p-6 animate-pulse"
      data-testid="navigation-generic-skeleton"
      role="status"
      aria-label="Loading"
    >
      <div className="h-5 w-5 rounded-full border-2 border-slate-300 border-t-transparent animate-spin" />
    </div>
  );
}
