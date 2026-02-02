
import { generateRoadmap } from './src/config/roadmapGenerator';

function verifyRoadmap() {
    console.log("Verifying Roadmap Generation...");

    // Case 1: Standard Roadmap (No International)
    const standard = generateRoadmap("FORMAL_PROBATE", "CA", []);
    const internationalTaskInStandard = standard.flatMap(p => p.tasks).find(t => t.id === "confirm_us_rep");

    if (internationalTaskInStandard) {
        console.error("FAILURE: International task found in standard roadmap.");
    } else {
        console.log("SUCCESS: Standard roadmap clean.");
    }

    // Case 2: International Roadmap
    const international = generateRoadmap("FORMAL_PROBATE", "CA", ["INTERNATIONAL_MODE"]);
    const internationalTaskInIntl = international.flatMap(p => p.tasks).find(t => t.id === "confirm_us_rep");

    if (internationalTaskInIntl) {
        console.log("SUCCESS: International task 'confirm_us_rep' found.");
    } else {
        console.error("FAILURE: International task NOT found in international roadmap.");
    }
}

verifyRoadmap();
