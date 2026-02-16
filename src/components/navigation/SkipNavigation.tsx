/**
 * Skip Navigation Link
 *
 * Provides a visually hidden link that becomes visible on focus,
 * allowing keyboard and screen reader users to skip directly
 * to the main content area.
 *
 * Per design spec section 6.2:
 * <a href="#main-content" className="sr-only focus:not-sr-only">Skip to main content</a>
 */
export function SkipNavigation() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[200] focus:px-4 focus:py-2 focus:bg-white focus:text-blue-600 focus:font-medium focus:text-sm focus:rounded-md focus:shadow-lg focus:outline-2 focus:outline-blue-500 focus:outline-offset-2"
      data-testid="skip-navigation"
    >
      Skip to main content
    </a>
  );
}
