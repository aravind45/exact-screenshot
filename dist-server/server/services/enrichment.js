import FirecrawlApp from "@mendable/firecrawl-js";
import { extractContactInfo } from "./ai.js";
import { logger } from "../lib/logger.js";
let app = null;
export async function enrichInstitutionData(institutionName) {
    try {
        if (!app) {
            app = new FirecrawlApp({ apiKey: process.env.FIRECRAWL_API_KEY });
        }
        console.log(`Enriching data for: ${institutionName}`);
        // Search for "Death Notification Number" or "Estate Resolution Fax"
        // Target specific keywords that often appear in institutional estate guides
        const query = `${institutionName} "Estate Services" death notification contact fax number mailing address for letters`;
        // @ts-ignore 
        const searchResults = await app.search(query, {
            limit: 3, // Fetch top 3 results to increase chance of finding specific forms/details
            scrapeOptions: { formats: ['markdown'] }
        });
        // Debug response structure
        logger.debug("Firecrawl Response Keys:", Object.keys(searchResults || {}));
        // Handle different response formats (SDK v0 vs v1/Raw)
        // @ts-ignore
        const data = searchResults.data || searchResults.web || [];
        if (!data || data.length === 0) {
            logger.info("Firecrawl: No search results found.");
            return null;
        }
        // Combine content from top 3 results
        let combinedContent = "";
        const mainUrl = data[0].url;
        for (const result of data) {
            const text = result.markdown || result.content || "";
            if (text) {
                combinedContent += `\n\n--- Source: ${result.url} ---\n${text.substring(0, 4000)}`;
            }
        }
        if (!combinedContent) {
            return { sourceUrl: mainUrl, extracted: null };
        }
        const extracted = await extractContactInfo(combinedContent);
        logger.debug("Extracted Data (sanitized check)");
        return {
            sourceUrl: mainUrl,
            extracted,
            content: combinedContent // Return content for debugging
        };
    }
    catch (error) {
        logger.error("Firecrawl Error:", error);
        return null; // Don't crash the server
    }
}
