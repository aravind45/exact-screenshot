import { getAllJurisdictionHealth } from '../server/services/jurisdictionDiagnosticsService';

async function main() {
    try {
        console.log("Running getAllJurisdictionHealth...");
        const summaries = await getAllJurisdictionHealth();
        console.log("Success! Summaries count:", summaries.length);
        console.log("First summary:", JSON.stringify(summaries[0], null, 2));
    } catch (error) {
        console.error("FAILED with error:", error);
    }
}

main();
