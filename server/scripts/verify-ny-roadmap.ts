import { PrismaClient } from '@prisma/client';
import { generateRoadmap } from '../../src/config/roadmapGenerator.js';
import { getRoadmap } from '../services/roadmapService.js';

const prisma = new PrismaClient();

async function verifyNYRoadmap() {
    console.log("--- Verifying NY Roadmap Generation ---");

    const mockProfile = {
        state: "NY",
        hasWill: false, // Intestate
        hasMinorBeneficiaries: false,
        hasRealEstate: true, // Should trigger CA real estate logic IF not filtered
        procedureType: "FORMAL_PROBATE" as any,
        isInternational: false,
        isSpouseSoleBeneficiary: false
    };

    try {
        // 1. Check Frontend Generator Logic
        console.log("\n[1] Testing Frontend Generator (roadmapGenerator.ts)");
        const frontendRoadmap = generateRoadmap("FORMAL_PROBATE", mockProfile.state, false, false, false);

        let foundCAInFrontend = false;
        for (const phase of frontendRoadmap) {
            for (const task of phase.tasks) {
                if (task.id === "prepare_notice_proposed_action" || task.id === "petition_confirm_sale") {
                    console.error(`🚨 FAILED: Found CA Task '${task.id}' in Frontend NY Roadmap!`);
                    foundCAInFrontend = true;
                }
                if (task.title.includes("Statutory Claim Period")) {
                    console.error(`🚨 FAILED: Found generic 4-month claim period wording in Frontend NY Roadmap!`);
                    foundCAInFrontend = true;
                }
            }
        }
        if (!foundCAInFrontend) {
            console.log("✅ PASS: Frontend Generator successfully scrubbed CA tasks for NY.");
        }

        // 2. Check Backend Database Logic
        console.log("\n[2] Testing Backend DB Generator (roadmapService.ts)");
        // We need a dummy estate ID or just bypass it. getRoadmapForEstateProfile usually requires an estate ID, 
        // but we can call getRoadmapFromDatabase directly if it was exported.
        // Let's just create a dummy estate, generate it, and delete it.
        const dummyUser = await prisma.user.findFirst();
        if (!dummyUser) {
            console.log("No users found to create a test estate.");
            return;
        }

        const estate = await prisma.estate.create({
            data: {
                userId: dummyUser.id,
                name: "Test NY Estate 123",
                state: "NY",
                hasWill: false,
                settlementPath: "INTESTATE"
            }
        });

        const backendRoadmap = await getRoadmap(estate.id);

        let foundCAInBackend = false;
        let creditorMilestone = "";
        let publicationTitle = "";

        for (const list of backendRoadmap) {
            if (list.phase === "creditor_claims" || list.phase === "court_filing") {
                if (list.milestone) creditorMilestone = list.milestone;
            }

            for (const task of list.tasks) {
                if (task.id === "prepare_notice_proposed_action" || task.id === "petition_confirm_sale") {
                    console.error(`🚨 FAILED: Found CA Task '${task.id}' in Backend NY Roadmap!`);
                    foundCAInBackend = true;
                }
                if (task.id === "publish_notice") {
                    publicationTitle = task.title;
                }
                if (task.title.includes("Statutory Claim Period")) {
                    console.error(`🚨 FAILED: Found generic 4-month claim period wording in Backend NY Roadmap!`);
                    foundCAInBackend = true;
                }
            }
        }

        if (!foundCAInBackend) {
            console.log("✅ PASS: Backend Database successfully scrubbed CA tasks for NY.");
        }

        console.log(`\n--- Exact DB Overrides Displayed ---`);
        console.log(`Creditor Phase Milestone: "${creditorMilestone}"`);
        console.log(`Publication Task Title: "${publicationTitle}"`);

        // Cleanup
        await prisma.estate.delete({ where: { id: estate.id } });

    } catch (e) {
        console.error("Test Error:", e);
    }
}

verifyNYRoadmap();
