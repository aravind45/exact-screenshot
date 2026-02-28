import { PrismaClient } from '@prisma/client';
import { generateRoadmap } from '../../src/config/roadmapGenerator.js';
import { getEstateRoadmap } from '../services/roadmapService.js';
import {
    SETTLEMENT_PHASE_TASKS,
    TRUST_PHASE_TASKS,
} from '../../src/config/settlementPhases.js';
import { filterTasksByAuthorityScope } from '../../src/shared/filterByJurisdiction.js';

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
        const frontendRoadmap = generateRoadmap("FORMAL_PROBATE", mockProfile.state, [], [], false);

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
        const dummyUser = await prisma.user.findFirst();
        if (!dummyUser) {
            console.log("No users found to create a test estate.");
            return;
        }

        const estate = await prisma.estate.create({
            data: {
                userId: dummyUser.id,
                name: "Test NY Estate 123",
                deceasedFirstName: "Test",
                deceasedLastName: "Doe",
                state: "NY",
                hasWill: false,
                settlementPath: "INTESTATE"
            }
        });

        const backendResult = await getEstateRoadmap(estate.id);
        const backendRoadmap = backendResult.phases || [];

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

// ─────────────────────────────────────────────────────────────────────────────
// WA Probate Fixture Tests
// Verifies that trust-only tasks do NOT appear in PROBATE roadmaps
// ─────────────────────────────────────────────────────────────────────────────
function verifyWAProbateFixture() {
    console.log("\n--- WA Probate Fixture: Authority Scope Leak Prevention ---");

    const allTasks = [
        ...SETTLEMENT_PHASE_TASKS.flatMap(p => p.tasks),
        ...TRUST_PHASE_TASKS.flatMap(p => p.tasks),
    ];

    const { kept, dropped } = filterTasksByAuthorityScope(allTasks, "PROBATE");

    // Assert issue_cert_trust does NOT appear in PROBATE roadmap
    const certTrustInKept = kept.find(t => t.id === "issue_cert_trust");
    if (certTrustInKept) {
        console.error(`🚨 FAILED [WA-PROBATE-1]: "issue_cert_trust" leaked into PROBATE roadmap!`);
    } else {
        console.log(`✅ PASS [WA-PROBATE-1]: "issue_cert_trust" is NOT in PROBATE roadmap.`);
    }

    const certTrustDropped = dropped.find(d => d.id === "issue_cert_trust");
    if (certTrustDropped) {
        console.log(`✅ PASS [WA-PROBATE-2]: "issue_cert_trust" was correctly dropped — reason: ${certTrustDropped.reason}`);
    } else {
        console.error(`🚨 FAILED [WA-PROBATE-2]: "issue_cert_trust" was NOT in the dropped list for PROBATE.`);
    }

    // Assert no kept tasks require "Trust Agreement" (trust-only document) in PROBATE fixture
    const trustDocTasks = kept.filter(t =>
        (t as any).requiredDocs && (t as any).requiredDocs.includes("Trust Agreement")
    );
    if (trustDocTasks.length > 0) {
        console.error(`🚨 FAILED [WA-PROBATE-3]: Tasks requiring "Trust Agreement" found in PROBATE roadmap:`);
        trustDocTasks.forEach(t => console.error(`   - ${t.id}: ${(t as any).title}`));
    } else {
        console.log(`✅ PASS [WA-PROBATE-3]: No tasks with "Trust Agreement" in requiredDocs leaked into PROBATE roadmap.`);
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Schema Audit: Verify no roadmap_tasks rows have authorityScope = null
// for trust/probate-specific task codes
// ─────────────────────────────────────────────────────────────────────────────
async function verifySchemaAudit() {
    console.log("\n--- Schema Audit: roadmap_tasks authorityScope null check ---");

    const TRUST_SPECIFIC_TASK_CODES = [
        "issue_cert_trust",
        "locate_trust",
        "identify_successor_trustee",
        "sign_trustee_acceptance",
        "prepare_certification_of_trust",
        "notify_trust_beneficiaries",
        "distribute_trust_assets",
        "file_trust_tax_return",
    ];

    const PROBATE_SPECIFIC_TASK_CODES = [
        "file_probate_petition",
        "file_administration_petition",
        "attend_probate_hearing",
        "attend_administration_hearing",
        "receive_letters_testamentary",
        "receive_letters_administration",
        "file_inventory_appraisal",
        "file_final_accounting",
    ];

    const allSpecificCodes = [...TRUST_SPECIFIC_TASK_CODES, ...PROBATE_SPECIFIC_TASK_CODES];

    try {
        const nullScopedTasks = await prisma.roadmapTask.findMany({
            where: {
                taskCode: { in: allSpecificCodes },
                authorityScope: null,
            },
            select: { taskCode: true, authorityScope: true },
        });

        if (nullScopedTasks.length > 0) {
            console.error(`🚨 FAILED [SCHEMA-AUDIT]: Found ${nullScopedTasks.length} trust/probate-specific tasks with authorityScope = null:`);
            nullScopedTasks.forEach(t => console.error(`   - taskCode="${t.taskCode}" authorityScope=${t.authorityScope}`));
        } else {
            console.log(`✅ PASS [SCHEMA-AUDIT]: No trust/probate-specific roadmap_tasks have authorityScope = null.`);
        }
    } catch (e) {
        console.warn(`⚠️  SCHEMA-AUDIT skipped (DB not available): ${(e as Error).message}`);
    }
}

async function main() {
    await verifyNYRoadmap();
    verifyWAProbateFixture();
    await verifySchemaAudit();
}

main().catch(console.error);
