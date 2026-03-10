export const SITE_NAME = "ExpectedEstate";
export const SITE_URL = "https://www.expectedestate.com";
export const SITE_HOSTNAME = "www.expectedestate.com";
export const DEFAULT_META_DESCRIPTION =
  "Simplify estate settlement with clarity and peace of mind. ExpectedEstate helps executors navigate probate, track assets, and manage paperwork.";
export const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image-v2.png`;
export const DEFAULT_OG_IMAGE_ALT =
  "ExpectedEstate dashboard preview for probate and estate settlement.";
export const DEFAULT_ROBOTS =
  "index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1";

export function normalizeSiteUrl(input?: string): string | undefined {
  if (!input) return undefined;

  try {
    const normalizedInput = input.startsWith("/")
      ? new URL(input, SITE_URL)
      : new URL(input);

    if (
      normalizedInput.hostname === "expectedestate.com" ||
      normalizedInput.hostname === SITE_HOSTNAME
    ) {
      normalizedInput.protocol = "https:";
      normalizedInput.hostname = SITE_HOSTNAME;
      normalizedInput.port = "";
    }

    if (normalizedInput.pathname !== "/" && normalizedInput.pathname.endsWith("/")) {
      normalizedInput.pathname = normalizedInput.pathname.replace(/\/+$/, "");
    }

    normalizedInput.hash = "";
    return normalizedInput.toString();
  } catch {
    return input;
  }
}

export function withSiteName(title?: string): string {
  if (!title) return SITE_NAME;
  return title.toLowerCase().includes(SITE_NAME.toLowerCase())
    ? title
    : `${title} | ${SITE_NAME}`;
}

export function stripSiteName(title: string): string {
  const normalizedTitle = title.trim();
  if (!normalizedTitle) return SITE_NAME;

  return normalizedTitle
    .replace(new RegExp(`\\s*[|\\-]\\s*${SITE_NAME}$`, "i"), "")
    .trim();
}

function humanizeSegment(segment: string): string {
  return decodeURIComponent(segment)
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (match) => match.toUpperCase());
}

export function buildDefaultBreadcrumbs(canonical: string, currentPageName: string) {
  const url = new URL(canonical);
  const segments = url.pathname.split("/").filter(Boolean);

  if (segments.length === 0) {
    return [];
  }

  const breadcrumbs = [
    {
      name: "Home",
      item: SITE_URL,
    },
  ];

  let runningPath = "";
  segments.forEach((segment, index) => {
    runningPath += `/${segment}`;
    const isLast = index === segments.length - 1;
    breadcrumbs.push({
      name: isLast ? currentPageName : humanizeSegment(segment),
      item: `${SITE_URL}${runningPath}`,
    });
  });

  return breadcrumbs;
}
