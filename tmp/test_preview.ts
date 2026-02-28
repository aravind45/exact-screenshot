import { previewRoadmap } from '../server/services/jurisdictionDiagnosticsService';

async function main() {
    try {
        console.log("Running previewRoadmap...");
        const profile = {
            stateCode: 'NY',
            authorityType: 'PROBATE',
            hasRealProperty: true,
            estateValue: 250000,
            hasWill: true,
            county: 'New York',
            characteristics: {}
        };
        // @ts-ignore
        const roadmap = await previewRoadmap(profile);
        console.log("Success! Preview generated.");
        console.log("Phases count:", roadmap.phases.length);
        console.log("Total tasks:", roadmap.totalCount);
        console.log("Filtered tasks:", roadmap.filteredCount);
    } catch (error) {
        console.error("FAILED with error:", error);
    }
}

main();
