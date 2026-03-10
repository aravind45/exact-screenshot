import { createReadStream, existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import path from "node:path";
import { chromium, type Browser, type BrowserContext } from "playwright";

import { INDEXABLE_PUBLIC_ROUTES } from "../src/seo/publicRoutes";
import {
  buildDefaultBreadcrumbs,
  DEFAULT_META_DESCRIPTION,
  DEFAULT_OG_IMAGE,
  DEFAULT_OG_IMAGE_ALT,
  DEFAULT_ROBOTS,
  normalizeSiteUrl,
  SITE_NAME,
  SITE_URL,
  withSiteName,
} from "../src/seo/siteConfig";

const DIST_DIR = path.resolve(process.cwd(), "dist");
const PRERENDER_PORT = 4173;
const PRERENDER_BASE_URL = `http://127.0.0.1:${PRERENDER_PORT}`;
const NOT_FOUND_CAPTURE_ROUTE = "/__generated-404__";
const STRICT_PUBLIC_PRERENDER = process.env.PUBLIC_SEO_PRERENDER_STRICT === "1";

const MIME_TYPES: Record<string, string> = {
  ".css": "text/css; charset=utf-8",
  ".gif": "image/gif",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".map": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
  ".webp": "image/webp",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

type FallbackSnapshotOptions = {
  path: string;
  title: string;
  description: string;
  noindex?: boolean;
};

async function resolveRequestPath(urlPath: string): Promise<string> {
  const safePath = decodeURIComponent(urlPath).replace(/^\/+/, "");
  const directPath = path.join(DIST_DIR, safePath);
  const extension = path.extname(safePath);

  if (safePath && existsSync(directPath)) {
    return directPath;
  }

  if (safePath && !extension) {
    const htmlPath = path.join(DIST_DIR, safePath, "index.html");
    if (existsSync(htmlPath)) {
      return htmlPath;
    }
  }

  return path.join(DIST_DIR, "index.html");
}

function sendNotFound(res: ServerResponse) {
  res.statusCode = 404;
  res.end("Not found");
}

async function requestHandler(req: IncomingMessage, res: ServerResponse) {
  if (!req.url) {
    sendNotFound(res);
    return;
  }

  const parsedUrl = new URL(req.url, PRERENDER_BASE_URL);
  const filePath = await resolveRequestPath(parsedUrl.pathname);

  if (!existsSync(filePath)) {
    sendNotFound(res);
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] ?? "application/octet-stream";

  res.setHeader("Content-Type", contentType);
  createReadStream(filePath).pipe(res);
}

function routeOutputPath(routePath: string): string {
  if (routePath === "/") {
    return path.join(DIST_DIR, "index.html");
  }

  const cleanPath = routePath.replace(/^\/+/, "");
  return path.join(DIST_DIR, cleanPath, "index.html");
}

async function writeRouteSnapshot(routePath: string, html: string) {
  const outputPath = routeOutputPath(routePath);
  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, html, "utf8");
}

function buildSitemapXml() {
  const lastmod = new Date().toISOString().slice(0, 10);
  const urls = INDEXABLE_PUBLIC_ROUTES.map((route) => {
    const loc = `${SITE_URL}${route.path === "/" ? "/" : route.path}`;
    return `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>${route.changefreq}</changefreq>\n    <priority>${route.priority.toFixed(1)}</priority>\n  </url>`;
  }).join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

function buildLlmsText() {
  const routeLines = INDEXABLE_PUBLIC_ROUTES.map(
    (route) =>
      `- ${SITE_URL}${route.path}: ${route.title}. ${route.description}`,
  ).join("\n");

  return `# ExpectedEstate\n\nExpectedEstate is probate and estate settlement software for executors, administrators, heirs, and families handling estate logistics.\n\nImportant notes:\n- ExpectedEstate is not a law firm and does not provide legal advice.\n- Public guides are educational resources and should be paired with licensed legal counsel for state-specific advice.\n- The canonical public domain is ${SITE_URL}.\n\nPrimary public resources:\n${routeLines}\n`;
}

async function writeStaticMachineReadableAssets() {
  await writeFile(path.join(DIST_DIR, "sitemap.xml"), buildSitemapXml(), "utf8");
  await writeFile(path.join(DIST_DIR, "llms.txt"), buildLlmsText(), "utf8");

  const robotsPath = path.join(process.cwd(), "public", "robots.txt");
  if (existsSync(robotsPath)) {
    await writeFile(
      path.join(DIST_DIR, "robots.txt"),
      await readFile(robotsPath, "utf8"),
      "utf8",
    );
  }
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function replaceTitleTag(html: string, title: string) {
  if (/<title>[\s\S]*?<\/title>/i.test(html)) {
    return html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(title)}</title>`);
  }

  return html.replace(/<\/head>/i, `<title>${escapeHtml(title)}</title>\n</head>`);
}

function buildFallbackSnapshotHtml(baseHtml: string, options: FallbackSnapshotOptions) {
  const canonical =
    normalizeSiteUrl(`${SITE_URL}${options.path === "/" ? "/" : options.path}`) ?? SITE_URL;
  const pageTitle = options.title.trim() || SITE_NAME;
  const finalTitle = withSiteName(pageTitle);
  const description = options.description.trim() || DEFAULT_META_DESCRIPTION;
  const robots = options.noindex ? "noindex,nofollow" : DEFAULT_ROBOTS;
  const breadcrumbs = buildDefaultBreadcrumbs(canonical, pageTitle);

  const graph: Array<Record<string, unknown>> = [
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`.replace(/\/$/, "#organization"),
      name: SITE_NAME,
      url: SITE_URL,
      logo: {
        "@type": "ImageObject",
        "@id": `${SITE_URL}/#logo`.replace(/\/$/, "#logo"),
        url: `${SITE_URL}/apple-touch-icon.svg`,
      },
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`.replace(/\/$/, "#website"),
      url: SITE_URL,
      name: SITE_NAME,
      publisher: { "@id": `${SITE_URL}/#organization`.replace(/\/$/, "#organization") },
      inLanguage: "en-US",
    },
    {
      "@type": "WebPage",
      "@id": `${canonical}#webpage`,
      url: canonical,
      name: pageTitle,
      description,
      isPartOf: { "@id": `${SITE_URL}/#website`.replace(/\/$/, "#website") },
      about: { "@id": `${SITE_URL}/#organization`.replace(/\/$/, "#organization") },
      primaryImageOfPage: {
        "@type": "ImageObject",
        url: DEFAULT_OG_IMAGE,
      },
    },
  ];

  if (breadcrumbs.length > 0) {
    graph.push({
      "@type": "BreadcrumbList",
      itemListElement: breadcrumbs.map((breadcrumb, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: breadcrumb.name,
        item: breadcrumb.item,
      })),
    });
  }

  const serializedJsonLd = JSON.stringify(
    {
      "@context": "https://schema.org",
      "@graph": graph,
    },
  ).replace(/</g, "\\u003c");

  const headTags = [
    `<link rel="canonical" href="${escapeHtml(canonical)}">`,
    `<meta name="description" content="${escapeHtml(description)}">`,
    `<meta name="robots" content="${escapeHtml(robots)}">`,
    `<meta name="googlebot" content="${escapeHtml(robots)}">`,
    `<meta property="og:type" content="website">`,
    `<meta property="og:title" content="${escapeHtml(finalTitle)}">`,
    `<meta property="og:description" content="${escapeHtml(description)}">`,
    `<meta property="og:url" content="${escapeHtml(canonical)}">`,
    `<meta property="og:image" content="${escapeHtml(DEFAULT_OG_IMAGE)}">`,
    `<meta property="og:image:alt" content="${escapeHtml(DEFAULT_OG_IMAGE_ALT)}">`,
    `<meta property="og:image:width" content="1200">`,
    `<meta property="og:image:height" content="630">`,
    `<meta property="og:site_name" content="${escapeHtml(SITE_NAME)}">`,
    `<meta property="og:locale" content="en_US">`,
    `<meta name="twitter:card" content="summary_large_image">`,
    `<meta name="twitter:title" content="${escapeHtml(finalTitle)}">`,
    `<meta name="twitter:description" content="${escapeHtml(description)}">`,
    `<meta name="twitter:image" content="${escapeHtml(DEFAULT_OG_IMAGE)}">`,
    `<meta name="twitter:image:alt" content="${escapeHtml(DEFAULT_OG_IMAGE_ALT)}">`,
    `<meta name="twitter:site" content="@ExpectedEstate">`,
    `<meta name="twitter:creator" content="@ExpectedEstate">`,
    `<script type="application/ld+json">${serializedJsonLd}</script>`,
  ].join("\n  ");

  return replaceTitleTag(baseHtml, finalTitle).replace(/<\/head>/i, `  ${headTags}\n</head>`);
}

async function writeFallbackSnapshots() {
  const baseHtml = await readFile(path.join(DIST_DIR, "index.html"), "utf8");

  for (const route of INDEXABLE_PUBLIC_ROUTES) {
    await writeRouteSnapshot(
      route.path,
      buildFallbackSnapshotHtml(baseHtml, {
        path: route.path,
        title: route.title,
        description: route.description,
      }),
    );
  }

  await writeFile(
    path.join(DIST_DIR, "404.html"),
    buildFallbackSnapshotHtml(baseHtml, {
      path: NOT_FOUND_CAPTURE_ROUTE,
      title: "Page Not Found",
      description: "The requested page could not be found on ExpectedEstate.",
      noindex: true,
    }),
    "utf8",
  );
}

function isMissingPlaywrightBrowserError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return /Executable doesn't exist|Please run the following command|playwright install|download new browsers|browser executable/i.test(
    message,
  );
}

async function tryCreatePrerenderContext(): Promise<
  | { browser: Browser; context: BrowserContext }
  | null
> {
  try {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      viewport: { width: 1440, height: 1200 },
    });

    await context.route("**/*", async (route) => {
      const requestUrl = new URL(route.request().url());
      if (requestUrl.origin === PRERENDER_BASE_URL) {
        await route.continue();
        return;
      }

      await route.abort();
    });

    return { browser, context };
  } catch (error) {
    if (STRICT_PUBLIC_PRERENDER || !isMissingPlaywrightBrowserError(error)) {
      throw error;
    }

    console.warn(
      "Playwright Chromium is not available in this build environment. Skipping full route prerender and generating fallback route HTML instead. Install Chromium with `npx playwright install chromium` or set PUBLIC_SEO_PRERENDER_STRICT=1 to fail hard.",
    );
    return null;
  }
}

async function prerenderRouteSnapshots(context: BrowserContext) {
  for (const route of INDEXABLE_PUBLIC_ROUTES) {
    const page = await context.newPage();
    try {
      await page.goto(`${PRERENDER_BASE_URL}${route.path}`, {
        waitUntil: "domcontentloaded",
      });

      try {
        await page.waitForLoadState("networkidle", { timeout: 15000 });
      } catch {
        // Third-party scripts are intentionally blocked during prerender.
      }

      await page.waitForFunction(
        () => document.title.trim().length > 0 && document.querySelector("h1") !== null,
        undefined,
        { timeout: 10000 },
      );
      await page.waitForTimeout(600);

      const html = await page.content();
      await writeRouteSnapshot(route.path, html);
    } finally {
      await page.close();
    }
  }
}

async function prerenderNotFoundSnapshot(context: BrowserContext) {
  const notFoundPage = await context.newPage();
  try {
    await notFoundPage.goto(`${PRERENDER_BASE_URL}${NOT_FOUND_CAPTURE_ROUTE}`, {
      waitUntil: "domcontentloaded",
    });
    try {
      await notFoundPage.waitForLoadState("networkidle", { timeout: 15000 });
    } catch {
      // Expected if third-party scripts are blocked.
    }
    await notFoundPage.waitForTimeout(600);
    await writeFile(path.join(DIST_DIR, "404.html"), await notFoundPage.content(), "utf8");
  } finally {
    await notFoundPage.close();
  }
}

async function closeServer(server: ReturnType<typeof createServer>) {
  await new Promise<void>((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
}

async function main() {
  const server = createServer((req, res) => {
    void requestHandler(req, res);
  });

  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(PRERENDER_PORT, "127.0.0.1", () => resolve());
  });

  try {
    await writeStaticMachineReadableAssets();

    const prerenderSession = await tryCreatePrerenderContext();
    if (!prerenderSession) {
      await writeFallbackSnapshots();
      return;
    }

    const { browser, context } = prerenderSession;
    try {
      await prerenderRouteSnapshots(context);
      await prerenderNotFoundSnapshot(context);
    } finally {
      await context.close();
      await browser.close();
    }
  } finally {
    await closeServer(server);
  }
}

void main().catch((error) => {
  console.error("Failed to build public SEO assets", error);
  process.exit(1);
});
