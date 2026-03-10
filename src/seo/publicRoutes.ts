export type SitemapChangeFrequency =
  | "daily"
  | "weekly"
  | "monthly"
  | "yearly";

export interface PublicRouteDefinition {
  path: string;
  title: string;
  description: string;
  changefreq: SitemapChangeFrequency;
  priority: number;
}

export const INDEXABLE_PUBLIC_ROUTES: PublicRouteDefinition[] = [
  {
    path: "/",
    title: "ExpectedEstate Home",
    description:
      "Primary marketing entry point for executor-focused probate and estate settlement software.",
    changefreq: "weekly",
    priority: 1.0,
  },
  {
    path: "/pricing",
    title: "Pricing",
    description: "Public pricing and plan details for ExpectedEstate.",
    changefreq: "monthly",
    priority: 0.8,
  },
  {
    path: "/terms",
    title: "Terms of Service",
    description: "ExpectedEstate terms of service and usage policies.",
    changefreq: "yearly",
    priority: 0.2,
  },
  {
    path: "/privacy",
    title: "Privacy Policy",
    description: "ExpectedEstate privacy policy and data handling disclosures.",
    changefreq: "yearly",
    priority: 0.2,
  },
  {
    path: "/probate-process",
    title: "Probate Process Guide",
    description: "Master guide to the probate process and executor workflow.",
    changefreq: "monthly",
    priority: 0.9,
  },
  {
    path: "/what-to-do-when-someone-dies",
    title: "What To Do When Someone Dies",
    description: "Immediate after-death checklist and executor first steps guide.",
    changefreq: "monthly",
    priority: 0.9,
  },
  {
    path: "/executor-checklist",
    title: "Executor Checklist",
    description: "Detailed executor checklist covering the first days, weeks, and months.",
    changefreq: "monthly",
    priority: 0.9,
  },
  {
    path: "/estate-settlement-checklist",
    title: "Estate Settlement Checklist",
    description: "Master estate settlement workflow for executors and administrators.",
    changefreq: "monthly",
    priority: 0.9,
  },
  {
    path: "/probate-timeline",
    title: "Probate Timeline",
    description: "Month-by-month probate timeline and delay analysis.",
    changefreq: "monthly",
    priority: 0.8,
  },
  {
    path: "/probate-cost",
    title: "Probate Cost Guide",
    description: "Guide to probate fees, costs, and the financial tradeoffs of manual administration.",
    changefreq: "monthly",
    priority: 0.8,
  },
  {
    path: "/small-estate-affidavit",
    title: "Small Estate Affidavit Guide",
    description: "State threshold guide and filing workflow for small estate affidavits.",
    changefreq: "monthly",
    priority: 0.8,
  },
  {
    path: "/intestate-without-will",
    title: "Intestate Without a Will",
    description: "Guide to settling estates when no will exists.",
    changefreq: "monthly",
    priority: 0.8,
  },
  {
    path: "/probate-california",
    title: "California Probate Guide",
    description: "California-specific probate rules, fees, and procedures.",
    changefreq: "monthly",
    priority: 0.8,
  },
  {
    path: "/probate-texas",
    title: "Texas Probate Guide",
    description: "Texas-specific probate rules, shortcuts, and executor expectations.",
    changefreq: "monthly",
    priority: 0.8,
  },
  {
    path: "/probate-florida",
    title: "Florida Probate Guide",
    description: "Florida-specific probate rules, timelines, and settlement paths.",
    changefreq: "monthly",
    priority: 0.8,
  },
  {
    path: "/transfer-car-title-after-death",
    title: "Transfer Car Title After Death",
    description: "Guide to transferring vehicle titles after someone dies.",
    changefreq: "monthly",
    priority: 0.7,
  },
  {
    path: "/life-insurance-claim-process",
    title: "Life Insurance Claim Process",
    description: "Guide to filing life insurance claims and understanding non-probate benefits.",
    changefreq: "monthly",
    priority: 0.7,
  },
  {
    path: "/guides/probate",
    title: "Probate Guides Hub",
    description: "Hub page for public probate guides and executor resources.",
    changefreq: "monthly",
    priority: 0.8,
  },
  {
    path: "/guides/california-probate-deadlines",
    title: "California Probate Deadlines",
    description: "California executor deadline guide with anchor dates and statutory windows.",
    changefreq: "monthly",
    priority: 0.8,
  },
  {
    path: "/guides/texas-probate-deadlines",
    title: "Texas Probate Deadlines",
    description: "Texas executor deadline guide and statutory timing reference.",
    changefreq: "monthly",
    priority: 0.8,
  },
  {
    path: "/guides/florida-probate-deadlines",
    title: "Florida Probate Deadlines",
    description: "Florida executor deadline guide and probate timing reference.",
    changefreq: "monthly",
    priority: 0.8,
  },
  {
    path: "/estate-path-guide",
    title: "Estate Path Guide",
    description: "Guide to the major estate administration paths and qualifying signals.",
    changefreq: "monthly",
    priority: 0.7,
  },

];

