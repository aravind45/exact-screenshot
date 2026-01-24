
import "dotenv/config";
import FirecrawlApp from "@mendable/firecrawl-js";

async function test() {
    console.log("Testing Direct URL Scrape for Fidelity...");
    const url = "https://digital.fidelity.com/prgw/digital/journeys/loss/decedent-information";

    // @ts-ignore
    const app = new FirecrawlApp({ apiKey: process.env.FIRECRAWL_API_KEY });

    try {
        console.log(`Scraping: ${url}`);
        const scrapeRes = await app.scrapeUrl(url, { formats: ['markdown'] });

        console.log("Success:", scrapeRes.success);
        const content = scrapeRes.markdown || "";
        console.log("Content Length:", content.length);

        const hasNumber = content.includes("800-544-0003");
        console.log("Is 800-544-0003 in content?", hasNumber);

        if (hasNumber) {
            console.log("FOUND! We should allow user to provide URL.");
        } else {
            console.log("NOT FOUND. It's likely hidden behind dynamic JS/Modal.");
            console.log("Snippet:", content.substring(0, 500));
        }
    } catch (e) {
        console.error("Error:", e);
    }
}

test();
