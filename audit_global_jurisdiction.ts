import { STATE_RULES } from "../src/lib/stateRules";
import { SETTLEMENT_PHASE_TASKS, TRUST_PHASE_TASKS, MODIFIER_PHASE_TASKS, PROBATE_ESCALATION_PHASE, PhaseTaskList } from "../src/config/settlementPhases";
import { filterTasksForEstate, resolvePhaseHeader, RoadmapResponse } from "../server/services/roadmapService";
import { filterPhasesByAuthorityScope } from "../src/shared/filterByJurisdiction";
import { CountyOverrideService } from "../server/services/countyOverrideService";
import { prisma as db } from "../server/db";
import * as fs from 'fs';

async function runAudit() {
    console.log("Starting Global Jurisdiction Compliance Audit...");
    const states = Object.keys(STATE_RULES);

    const report = {
        summary: {
            totalStates: states.length,
            totalRoadmapsTested: 0,
            statesPassing: 0,
            statesFailing: 0
        },
        ranking: [] as any[],
        violationsByState: {} as any
    };

    const stateScores = new Map<string, number>();

    for (const state of states) {
        console.log(`Auditing state: ${state}`);
        let score = 10.0;
        const violations = {
            crossStateLeaks: [] as any[],
            authorityLeaks: [] as any[],
            placeholders: [] as any[],
            invariantFailures: [] as any[],
            scopeIntegrity: [] as any[],
            countyOverrideSafety: [] as any[]
        };

        const rule = STATE_RULES[state];

        // Ensure we load county if exists
        const override = await db.countyOverride.findFirst({ where: { stateCode: state } });
        const county = override ? override.countyName : undefined;

        const testCases = [
            { type: "PROBATE_REAL_PROP", hasRealProperty: true, authorityType: "PROBATE", procedureType: "FORMAL_PROBATE", county: undefined },
            { type: "PROBATE_NO_REAL_PROP", hasRealProperty: false, authorityType: "PROBATE", procedureType: "FORMAL_PROBATE", county: undefined },
            { type: "TRUST", hasRealProperty: true, authorityType: "TRUST", procedureType: "TRUST_ADMINISTRATION", county: undefined }
        ];

        if (county) {
            testCases.push({ type: "PROBATE_COUNTY_OVERRIDE", hasRealProperty: true, authorityType: "PROBATE", procedureType: "FORMAL_PROBATE", county });
        }

        for (const tc of testCases) {
            report.summary.totalRoadmapsTested++;

            // Create fake profile
            const profile: any = {
                id: `test-${state}-${tc.type}`,
                state: state,
                hasMinorBeneficiaries: false,
                isSmallEstate: false,
                isPrimaryResidence: tc.hasRealProperty,
                isContested: false,
                estimatedValue: 500000,
                totalDebts: 10000,
                solvencyRatio: 50,
                authoritySource: "COURT",
                procedureType: tc.procedureType,
                distributionModel: "INTESTATE",
                activeEngines: [tc.authorityType],
                estateAuthorityType: tc.authorityType,
                hasWill: false,
                hasUnknownHeirs: false,
                has_foreign_beneficiary: false,
                executor_non_us_resident: false,
                [`is${state}`]: true
            };

            // Base un-filtered tasks
            const allPhases = [
                ...SETTLEMENT_PHASE_TASKS,
                ...TRUST_PHASE_TASKS,
                ...MODIFIER_PHASE_TASKS,
                PROBATE_ESCALATION_PHASE
            ].filter(Boolean) as PhaseTaskList[];

            // 1. Task filter for estate
            let roadmapPhases = filterTasksForEstate(allPhases, profile);

            // 2. Authority scope filter
            roadmapPhases = filterPhasesByAuthorityScope(roadmapPhases, profile.estateAuthorityType);

            // 3. County overrides
            if (tc.county) {
                // Apply county overrides
                for (let i = 0; i < roadmapPhases.length; i++) {
                    roadmapPhases[i].tasks = await CountyOverrideService.applyOverrides(state, tc.county, roadmapPhases[i].tasks);
                }
            }

            // --- VALIDATION RULES ---

            // Flatten tasks for easy scanning
            const flatTasks = roadmapPhases.flatMap(p => p.tasks);
            const flatText = JSON.stringify(roadmapPhases);

            // 1. Cross-State Leakage (Super basic check: look for mentions of other states' codes/statutes)
            const otherStates = states.filter(s => s !== state);
            for (const task of flatTasks) {
                const textToCheck = `${task.title} ${task.description} ${task.alerts?.map(a => a.message).join(' ')} ${task.links?.map(l => l.label).join(' ')}`;

                // CA leak check
                if (state !== 'CA' && (textToCheck.includes("Notice of Proposed Action") || textToCheck.includes("IAEA") || textToCheck.includes("DE-") || textToCheck.includes("California Prop"))) {
                    violations.crossStateLeaks.push({ taskId: task.id, pattern: "CA Leak", type: tc.type });
                    score -= 2.0;
                }
                // GA leak check
                if (state !== 'GA' && textToCheck.includes("Year's Support")) {
                    violations.crossStateLeaks.push({ taskId: task.id, pattern: "GA Leak", type: tc.type });
                    score -= 2.0;
                }
                // NY leak check
                if (state !== 'NY' && (textToCheck.includes("SCPA") || textToCheck.includes("Surrogate's Court"))) {
                    if (state !== 'NJ' || !textToCheck.includes("Surrogate's Court")) { // NJ also has Surrogate's Court
                        violations.crossStateLeaks.push({ taskId: task.id, pattern: "NY Leak", type: tc.type });
                        score -= 2.0;
                    }
                }
                // TX leak check
                if (state !== 'TX' && textToCheck.includes("Muniment of Title")) {
                    violations.crossStateLeaks.push({ taskId: task.id, pattern: "TX Leak", type: tc.type });
                    score -= 2.0;
                }
            }

            // 2. Authority Leakage
            for (const task of flatTasks) {
                if (tc.authorityType === "PROBATE" && task.authorityScope === "TRUST") {
                    violations.authorityLeaks.push({ taskId: task.id, reason: "TRUST task in PROBATE roadmap", type: tc.type });
                    score -= 3.0;
                }
                if (tc.authorityType === "TRUST" && task.authorityScope === "PROBATE") {
                    violations.authorityLeaks.push({ taskId: task.id, reason: "PROBATE task in TRUST roadmap", type: tc.type });
                    score -= 3.0;
                }
            }

            // 3. Placeholder / Template Integrity
            const placeholderKeywords = ["{{", "}}", "TBD", "insert statute", "varies by state"];
            for (const task of flatTasks) {
                const textToCheck = `${task.title} ${task.description} ${task.alerts?.map(a => a.message).join(' ')} ${task.links?.map(l => l.label).join(' ')}`;
                for (const kw of placeholderKeywords) {
                    if (textToCheck.includes(kw)) {
                        violations.placeholders.push({ taskId: task.id, keyword: kw, type: tc.type });
                        if (kw === "varies by state") {
                            score -= 0.5;
                        } else {
                            score -= 2.0;
                        }
                    }
                }
            }

            // 4. Structural Invariants
            // If real property exists: Must include that state's transfer mechanism
            if (tc.hasRealProperty && tc.authorityType === "PROBATE") {
                const hasPropertyTask = flatTasks.some(t =>
                    t.id.includes("deed") || t.id.includes("property") || t.id.includes("sale") || t.id.includes("transfer_real_estate")
                );
                // We're a bit loose here because real property might just be handled in general distribution, but let's check for sell_property
                const hasSellProperty = flatTasks.some(t => t.id === "sell_property" || t.id === "petition_confirm_sale" || t.id === "transfer_assets");
                if (!hasSellProperty) {
                    violations.invariantFailures.push({ reason: "No real property transfer mechanism found", type: tc.type });
                    score -= 1.5;
                }
            }

            // 5. Scope Integrity
            for (const task of flatTasks) {
                if (!task.scope || task.scope === "UNSCOPED") {
                    violations.scopeIntegrity.push({ taskId: task.id, reason: "Missing or UNSCOPED stateScope", type: tc.type });
                    // No explicit score penalty defined for this, but treating as structural invariant or just logging
                }
                if (!task.authorityScope) {
                    violations.scopeIntegrity.push({ taskId: task.id, reason: "Missing authorityScope", type: tc.type });
                }
                if (task.scope === "CORE") {
                    const textToCheck = `${task.title} ${task.description}`;
                    // Generic regex for statues in core tasks
                    if (textToCheck.match(/§|Statute|Code/i) && !textToCheck.includes("IRS")) {
                        // Some exceptions for federal/general stuff, but core shouldn't have specific state statutes
                        // Let's rely on Cross-State Leaks for specific state codes
                    }
                }
            }

            // 6. County Override Safety
            if (tc.county) {
                // If the test case is a county override, we ensure the structural properties weren't affected.
                // Since CountyOverrideService inherently only updates whitelisted fields, 
                // we can just check if any forbidden keys leaked in somehow.
                const dbOverrides = await db.countyOverride.findMany({ where: { stateCode: state, countyName: tc.county } });
                for (const ov of dbOverrides) {
                    const keys = Object.keys(ov);
                    const forbidden = ["scope", "authorityScope", "gating", "phase", "deadlines"];
                    for (const f of forbidden) {
                        if (keys.includes(f) && ov[f as keyof typeof ov] !== null && ov[f as keyof typeof ov] !== undefined && f !== 'id' && f !== 'taskId' && f !== 'createdAt' && f !== 'updatedAt' && f !== 'stateCode' && f !== 'countyName' && f !== 'title' && f !== 'description' && f !== 'feeAmount' && f !== 'primaryActionUrl' && f !== 'formNames' && f !== 'attachments') {
                            violations.countyOverrideSafety.push({ taskId: ov.taskId, reason: `Forbidden key ${f} found in override`, type: tc.type });
                            score -= 1.0;
                        }
                    }
                }
            }
        }

        // Bound score to 0
        score = Math.max(0, score);

        // Dedup violations
        const dedup = (arr: any[]) => Array.from(new Set(arr.map(a => JSON.stringify(a)))).map(a => JSON.parse(a));
        violations.crossStateLeaks = dedup(violations.crossStateLeaks);
        violations.authorityLeaks = dedup(violations.authorityLeaks);
        violations.placeholders = dedup(violations.placeholders);
        violations.invariantFailures = dedup(violations.invariantFailures);
        violations.scopeIntegrity = dedup(violations.scopeIntegrity);
        violations.countyOverrideSafety = dedup(violations.countyOverrideSafety);

        let riskLevel = "Production Ready";
        if (score < 6.0) riskLevel = "HIGH RISK";
        else if (score < 8.0) riskLevel = "Structural Weakness";
        else if (score < 9.5) riskLevel = "Minor Gaps";

        report.violationsByState[state] = violations;
        stateScores.set(state, score);

        report.ranking.push({
            state,
            score,
            riskLevel,
            majorIssues: violations.crossStateLeaks.length + violations.authorityLeaks.length,
            minorIssues: violations.placeholders.length + violations.invariantFailures.length + violations.scopeIntegrity.length
        });

        if (score >= 9.5) report.summary.statesPassing++;
        else report.summary.statesFailing++;
    }

    // Sort ranking
    report.ranking.sort((a, b) => b.score - a.score); // Highest first

    const top5Risk = [...report.ranking].sort((a, b) => a.score - b.score).slice(0, 5);

    // Identify systemic patterns
    const allViolations = [];
    for (const state in report.violationsByState) {
        const v = report.violationsByState[state];
        allViolations.push(...v.crossStateLeaks.map((x: any) => `Cross State Leak: ${x.pattern} in ${x.taskId}`));
        allViolations.push(...v.authorityLeaks.map((x: any) => `Authority Leak: ${x.reason} in ${x.taskId}`));
        allViolations.push(...v.placeholders.map((x: any) => `Placeholder: ${x.keyword} in ${x.taskId}`));
        allViolations.push(...v.invariantFailures.map((x: any) => `Invariant: ${x.reason}`));
        allViolations.push(...v.scopeIntegrity.map((x: any) => `Scope: ${x.reason} in ${x.taskId}`));
    }

    // Count occurrences
    const frequency = allViolations.reduce((acc, val) => {
        acc[val] = (acc[val] || 0) + 1;
        return acc;
    }, {});

    const top5Patterns = Object.entries(frequency).sort((a: any, b: any) => b[1] - a[1]).slice(0, 5).map(x => `${x[0]} (${x[1]} occurrences)`);

    const finalOutput = {
        ...report,
        top5HighestRiskStates: top5Risk.map(r => r.state),
        top5SystemicPatterns: top5Patterns,
        recommendedArchitecturalFix: "Implement a centralized template binding system that automatically resolves state rules (statutes, thresholds, deadlines) at runtime based on the EstateProfile, rather than hardcoding text into task definitions or relying on ad-hoc regex replacements. This would eliminate placeholder leaks and standardize invariant injection across all phase tasks globally."
    };

    fs.writeFileSync('global_jurisdiction_audit_report.json', JSON.stringify(finalOutput, null, 2));
    console.log("Audit complete. Report written to global_jurisdiction_audit_report.json");
}

runAudit().catch(console.error);
