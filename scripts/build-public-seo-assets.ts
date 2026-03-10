import { createReadStream, existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import path from "node:path";
import { chromium } from "playwright";

import { INDEXABLE_PUBLIC_ROUTES } from "../src/seo/publicRoutes";
import { SITE_URL } from "../src/seo/siteConfig";

const DIST_DIR = path.resolve(process.cwd(), "dist");
const PRERENDER_PORT = 4173;
const PRERENDER_BASE_URL = `http://127.0.0.1:${PRERENDER_PORT}`;
const NOT_FOUND_CAPTURE_ROUTE = "/__generated-404__";

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

async function main() {
  const server = createServer((req, res) => {
    void requestHandler(req, res);
  });

  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(PRERENDER_PORT, "127.0.0.1", () => resolve());
  });

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

  try {
    for (const route of INDEXABLE_PUBLIC_ROUTES) {
      const page = await context.newPage();
      await page.goto(`${PRERENDER_BASE_URL}${route.path}`, {
        waitUntil: "domcontentloaded",
      });

      try {
        await page.waitForLoadState("networkidle", { timeout: 15000 });
      } catch {
        // Third-party scripts are intentionally blocked during prerender.
      }

      await page.waitForFunction(() => document.title.trim().length > 0, undefined, {
        timeout: 10000,
      });
      await page.waitForTimeout(250);

      const html = await page.content();
      await writeRouteSnapshot(route.path, html);
      await page.close();
    }

    const notFoundPage = await context.newPage();
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
    await notFoundPage.close();

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
  } finally {
    await context.close();
    await browser.close();
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
}

void main().catch((error) => {
  console.error("Failed to build public SEO assets", error);
  process.exit(1);
});

