/**
 * Generates the OG image from og-image-template.html using Playwright.
 * Run with: npx tsx scripts/generate-og.ts
 */
import { chromium } from "@playwright/test";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function generateOgImage() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  // Exact OG image dimensions
  await page.setViewportSize({ width: 1200, height: 630 });

  const templatePath = path.resolve(__dirname, "..", "og-image-template.html");
  const fileUrl = `file:///${templatePath.replace(/\\/g, "/")}`;

  console.log(`📄  Loading: ${fileUrl}`);
  await page.goto(fileUrl, { waitUntil: "networkidle" });

  // Give Google Fonts an extra moment to render
  await page.waitForTimeout(1500);

  const outputPath = path.resolve(__dirname, "..", "public", "og-image-v2.png");
  await page.screenshot({
    path: outputPath,
    clip: { x: 0, y: 0, width: 1200, height: 630 },
  });

  await browser.close();
  console.log(`✅  OG image saved → ${outputPath}`);
}

generateOgImage().catch((err) => {
  console.error("❌ Failed to generate OG image:", err);
  process.exit(1);
});
