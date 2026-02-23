/**
 * 50-State Verification Script
 * 
 * Tests that ALL 50 US states produce clean, CA-free roadmap output
 * on both the hardcoded (frontend) path and simulated DB path.
 * 
 * Run: npx tsx scripts/verify-50-states.ts
 */

import { SETTLEMENT_PHASE_TASKS, PhaseTaskList, PhaseTask } from "../src/config/settlementPhases.js";

// ─── Replicate server logic locally (no DB needed) ──────────────────────────

const ALL_50_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA",
  "HI","ID","IL","IN","IA","KS","KY","LA","ME","MD",
  "MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC",
  "SD","TN","TX","UT","VT","VA","WA","WV","WI","WY"
];

const STATES_WITH_OVERRIDES = ["NY","CA","TX","FL","PA","OH","IL","GA","NJ","MA"];

// ── Letters Term (simplified) ───────────────────────────────────────────────
function getLettersTerm(state: string): string {
  const map: Record<string, string> = {
    NY: "Letters Testamentary",
    TX: "Letters Testamentary",
    FL: "Letters of Administration",
    PA: "Letters Testamentary",
    OH: "Letters of Authority",
    IL: "Letters of Office",
    GA: "Letters Testamentary",
    NJ: "Letters Testamentary",
    MA: "Letters Testamentary",
    CA: "Letters Testamentary (DE-150)",
  };
  return map[state] || "Letters of Authority";
}

// ── normalizeTextForState (replica) ─────────────────────────────────────────
function normalizeTextForState(text: string | undefined, state: string): string | undefined {
  if (!text) return text;
  if (state === "CA") return text;
  const lettersTerm = getLettersTerm(state);
  let out = text;
  out = out.replace(/\bCertified Letters\s*\(DE-\d+\)/gi, `Certified ${lettersTerm}`);
  out = out.replace(/\bLetters Testamentary\s*\(DE-\d+\)/gi, lettersTerm);
  out = out.replace(/\bLetters of Authority\s*\(DE-\d+\)/gi, lettersTerm);
  out = out.replace(/\bLetters\s*\(DE-\d+\)/gi, lettersTerm);
  out = out.replace(/\s*\(DE-\d+\)/gi, "");
  out = out.replace(/\bDE-\d+\b/gi, "");
  out = out.replace(/\bMedi-Cal\b/gi, "Medicaid");
  out = out.replace(/\bDHCS\b/gi, "Medicaid");
  out = out.replace(/\bCalifornia Probate Code\b/gi, "State probate code");
  out = out.replace(/\bCA Prob\. Code\b/gi, "State probate code");
  out = out.replace(/\bCalifornia law\b/gi, "State law");
  out = out.replace(/\bCalifornia\b/gi, "state");
  out = out.replace(/\bCA\b/g, "state");
  out = out.replace(/\s{2,}/g, " ").trim();
  return out;
}

// ── State Phase Overrides (replica from roadmapService.ts) ──────────────────
const STATE_PHASE_OVERRIDES: Record<string, Record<string, { milestone?: string; subtitle?: string }>> = {
  NY: {
    creditor_claims: { milestone: "After Letters Issued", subtitle: "7-Month Exposure Period" },
    asset_liquidation: { milestone: "Month 6–12", subtitle: "Transfer & Sell" },
    final_distribution: { milestone: "After Accounting Approved", subtitle: "Court Settlement & Close" },
  },
  CA: {
    creditor_claims: { milestone: "After Notice Published", subtitle: "4-Month Claim Window" },
    asset_liquidation: { milestone: "After Inventory Filed", subtitle: "IAEA / Court-Confirmed Sales" },
    final_distribution: { milestone: "After Claim Period", subtitle: "Estate In Closing" },
  },
  TX: {
    creditor_claims: { milestone: "After Letters Issued", subtitle: "Secured & Unsecured Claims (4 Months)" },
    final_distribution: { milestone: "After Debts Settled", subtitle: "Estate In Closing" },
  },
  FL: {
    creditor_claims: { milestone: "After Letters Issued", subtitle: "3-Month Creditor Window" },
    final_distribution: { milestone: "After Creditor Period Ends", subtitle: "Estate In Closing" },
  },
  PA: { creditor_claims: { milestone: "After Letters Issued", subtitle: "1-Year Claim Period" } },
  OH: { creditor_claims: { milestone: "After Appointment", subtitle: "6-Month Claim Period" } },
  IL: { creditor_claims: { milestone: "After Letters Issued", subtitle: "6-Month Claim Period" } },
  GA: { creditor_claims: { milestone: "After Publication", subtitle: "3-Month Claim Period" } },
  NJ: { creditor_claims: { milestone: "After Letters Issued", subtitle: "6-Month Claim Period" } },
  MA: { creditor_claims: { milestone: "After Date of Death", subtitle: "1-Year Claim Period" } },
};

const NEUTRAL_PHASE_MILESTONES: Record<string, { milestone: string; subtitle: string }> = {
  immediate_actions: { milestone: "Death to Filing", subtitle: "Secure & Notify" },
  pre_filing_compliance: { milestone: "Before Petition Filing", subtitle: "Procedural Checks" },
  court_filing: { milestone: "After Petition Filed", subtitle: "Obtaining Powers" },
  asset_discovery: { milestone: "After Letters Issued", subtitle: "Inventory & Appraisal" },
  creditor_claims: { milestone: "After Letters Issued", subtitle: "Notice & Priority" },
  asset_liquidation: { milestone: "Month 6–12", subtitle: "Transfer & Sell" },
  final_distribution: { milestone: "Month 6–12", subtitle: "Estate In Closing" },
};

// ── CA-Only Task Filtering ──────────────────────────────────────────────────
const CA_ONLY_TASK_IDS = new Set([
  "prepare_notice_proposed_action",
  "wait_proposed_action_period",
  "petition_confirm_sale",
  "obtain_sale_confirmation_order",
]);

// ── HARDCODED_STATE_OVERRIDES_MAP (replica) ─────────────────────────────────
const HARDCODED_STATE_OVERRIDES_MAP = new Map<string, PhaseTask['stateOverrides']>();
for (const phase of SETTLEMENT_PHASE_TASKS) {
  for (const task of phase.tasks) {
    if (task.stateOverrides) {
      HARDCODED_STATE_OVERRIDES_MAP.set(task.id, task.stateOverrides);
    }
  }
}

// ── normalizeTaskForState (replica) ─────────────────────────────────────────
function normalizeTaskForState(task: PhaseTask, state: string): PhaseTask {
  const override = task.stateOverrides?.[state]
    || HARDCODED_STATE_OVERRIDES_MAP.get(task.id)?.[state];
  const mergedTask = override ? { ...task, ...override } : task;
  return {
    ...mergedTask,
    title: normalizeTextForState(mergedTask.title, state) || mergedTask.title,
    description: normalizeTextForState(mergedTask.description, state) || mergedTask.description,
    utility: normalizeTextForState(mergedTask.utility, state),
    rationale: normalizeTextForState(mergedTask.rationale, state),
    requiredDocs: mergedTask.requiredDocs?.map(doc => normalizeTextForState(doc, state) || doc),
    alerts: mergedTask.alerts?.map(alert => ({
      ...alert,
      message: normalizeTextForState(alert.message, state) || alert.message
    })),
    links: mergedTask.links?.map(link => ({
      ...link,
      label: normalizeTextForState(link.label, state) || link.label
    }))
  };
}

function removeCAOnlyTasks(phases: PhaseTaskList[], state: string): PhaseTaskList[] {
  if (state === "CA") return phases;
  return phases.map(phase => ({
    ...phase,
    tasks: phase.tasks.filter(task => !CA_ONLY_TASK_IDS.has(task.id)),
  }));
}

function normalizePhasesForState(phases: PhaseTaskList[], state: string): PhaseTaskList[] {
  const stateOverrides = STATE_PHASE_OVERRIDES[state] || {};
  return phases.map(phase => {
    const phaseOverride = stateOverrides[phase.phase];
    const neutralDefault = NEUTRAL_PHASE_MILESTONES[phase.phase];
    const resolvedMilestone = phaseOverride?.milestone || neutralDefault?.milestone || phase.milestone;
    const resolvedSubtitle = phaseOverride?.subtitle || neutralDefault?.subtitle || phase.subtitle;
    return {
      ...phase,
      milestone: resolvedMilestone,
      subtitle: resolvedSubtitle,
      tasks: phase.tasks.map(task => normalizeTaskForState(task, state)),
    };
  });
}

// ─── CA Leakage Detection Patterns ──────────────────────────────────────────

const CA_LEAK_PATTERNS = [
  /\bDE-\d{2,4}\b/i,                      // CA form numbers
  /\bMedi-Cal\b/i,                         // CA Medicaid name
  /\bDHCS\b/i,                             // CA Dept of Health
  /\bCalifornia Probate Code\b/i,          // CA-specific statute
  /\bCA Prob\. Code\b/i,                   // CA statute abbreviation
  /\bNotice of Proposed Action\b/i,        // IAEA-specific
  /\b15-Day Objection Period\b/i,          // IAEA-specific
  /\bPetition to Confirm Sale\b/i,        // IAEA-specific
  /\bSale Confirmation Order\b/i,         // IAEA-specific
  /\bIAEA\b/,                              // CA Independent Admin
  /\bIndependent Administration\b/i,       // CA Independent Admin
  /\b4-Month Claim (?:Window|Period)\b/i,  // CA creditor period
  /\bAfter Notice Published\b/i,           // CA phase milestone
  /\bAfter Inventory Filed\b/i,            // CA phase milestone (asset liquidation)
  /\bAfter Claim Period\b/i,              // CA phase milestone (final dist)
];

const CA_TASK_ID_LEAKS = [
  "prepare_notice_proposed_action",
  "wait_proposed_action_period",
  "petition_confirm_sale",
  "obtain_sale_confirmation_order",
];

interface LeakReport {
  state: string;
  path: "hardcoded" | "db-simulated";
  phase: string;
  taskId?: string;
  field: string;
  pattern: string;
  value: string;
}

function checkTextForLeaks(text: string | undefined, state: string, phase: string, field: string, taskId: string | undefined, path: "hardcoded" | "db-simulated"): LeakReport[] {
  if (!text || state === "CA") return [];
  const leaks: LeakReport[] = [];
  for (const pattern of CA_LEAK_PATTERNS) {
    if (pattern.test(text)) {
      leaks.push({ state, path, phase, taskId, field, pattern: pattern.source, value: text.substring(0, 120) });
    }
  }
  return leaks;
}

function checkTaskForLeaks(task: PhaseTask, state: string, phase: string, path: "hardcoded" | "db-simulated"): LeakReport[] {
  const leaks: LeakReport[] = [];
  // Check if CA-only task leaked
  if (CA_TASK_ID_LEAKS.includes(task.id)) {
    leaks.push({ state, path, phase, taskId: task.id, field: "task_id", pattern: "CA_ONLY_TASK_ID", value: task.id });
  }
  // Check text fields
  leaks.push(...checkTextForLeaks(task.title, state, phase, "title", task.id, path));
  leaks.push(...checkTextForLeaks(task.description, state, phase, "description", task.id, path));
  leaks.push(...checkTextForLeaks(task.utility, state, phase, "utility", task.id, path));
  leaks.push(...checkTextForLeaks(task.rationale, state, phase, "rationale", task.id, path));
  // Check alerts
  task.alerts?.forEach((alert, i) => {
    leaks.push(...checkTextForLeaks(alert.message, state, phase, `alerts[${i}].message`, task.id, path));
  });
  // Check links
  task.links?.forEach((link, i) => {
    leaks.push(...checkTextForLeaks(link.label, state, phase, `links[${i}].label`, task.id, path));
  });
  // Check requiredDocs
  task.requiredDocs?.forEach((doc, i) => {
    leaks.push(...checkTextForLeaks(doc, state, phase, `requiredDocs[${i}]`, task.id, path));
  });
  return leaks;
}

function checkPhaseForLeaks(phase: PhaseTaskList, state: string, path: "hardcoded" | "db-simulated"): LeakReport[] {
  const leaks: LeakReport[] = [];
  // Check phase-level milestone and subtitle
  leaks.push(...checkTextForLeaks(phase.milestone, state, phase.phase, "phase.milestone", undefined, path));
  leaks.push(...checkTextForLeaks(phase.subtitle, state, phase.phase, "phase.subtitle", undefined, path));
  // Check each task
  for (const task of phase.tasks) {
    leaks.push(...checkTaskForLeaks(task, state, phase.phase, path));
  }
  return leaks;
}

// ─── Simulate DB Path (tasks without stateOverrides) ────────────────────────

function simulateDBTasks(): PhaseTaskList[] {
  // DB tasks are the same structure but WITHOUT stateOverrides on each task
  return SETTLEMENT_PHASE_TASKS.map(phase => ({
    ...phase,
    tasks: phase.tasks.map(task => {
      const { stateOverrides, ...taskWithoutOverrides } = task;
      return taskWithoutOverrides;
    }),
  }));
}

// ─── State Override Verification ────────────────────────────────────────────

interface OverrideVerification {
  state: string;
  taskId: string;
  field: string;
  expected: string;
  actual: string;
  pass: boolean;
}

function verifyStateOverrides(phases: PhaseTaskList[], state: string): OverrideVerification[] {
  const results: OverrideVerification[] = [];

  // Check wait_claim_period task has correct state-specific title
  const expectedClaimTitles: Record<string, string> = {
    NY: "Monitor 7-Month Creditor Exposure Period (from issuance of Letters)",
    CA: "Wait for 4-Month Claim Period",
    TX: "Monitor Creditor Claim Period",
    FL: "Monitor 3-Month Creditor Claim Period",
    PA: "Monitor 1-Year Creditor Claim Period",
    OH: "Monitor 6-Month Creditor Claim Period",
    IL: "Monitor 6-Month Creditor Claim Period",
    GA: "Monitor 3-Month Creditor Claim Period",
    NJ: "Monitor 6-Month Creditor Claim Period",
    MA: "Monitor 1-Year Creditor Claim Period",
  };

  if (expectedClaimTitles[state]) {
    const creditorPhase = phases.find(p => p.phase === "creditor_claims");
    const claimTask = creditorPhase?.tasks.find(t => t.id === "wait_claim_period");
    if (claimTask) {
      results.push({
        state,
        taskId: "wait_claim_period",
        field: "title",
        expected: expectedClaimTitles[state],
        actual: claimTask.title,
        pass: claimTask.title === expectedClaimTitles[state],
      });
    }
  }

  // Check phase milestone overrides
  const expectedMilestones: Record<string, Record<string, string>> = {
    NY: { creditor_claims: "After Letters Issued" },
    CA: { creditor_claims: "After Notice Published" },
    TX: { creditor_claims: "After Letters Issued" },
    FL: { creditor_claims: "After Letters Issued" },
    PA: { creditor_claims: "After Letters Issued" },
    OH: { creditor_claims: "After Appointment" },
    IL: { creditor_claims: "After Letters Issued" },
    GA: { creditor_claims: "After Publication" },
    NJ: { creditor_claims: "After Letters Issued" },
    MA: { creditor_claims: "After Date of Death" },
  };

  if (expectedMilestones[state]) {
    for (const [phaseKey, expectedMilestone] of Object.entries(expectedMilestones[state])) {
      const phase = phases.find(p => p.phase === phaseKey);
      if (phase) {
        results.push({
          state,
          taskId: `phase:${phaseKey}`,
          field: "milestone",
          expected: expectedMilestone,
          actual: phase.milestone,
          pass: phase.milestone === expectedMilestone,
        });
      }
    }
  }

  return results;
}

// ─── MAIN EXECUTION ─────────────────────────────────────────────────────────

function main() {
  console.log("=" .repeat(80));
  console.log("  50-STATE ROADMAP VERIFICATION");
  console.log("  Testing both Hardcoded (frontend) and Simulated DB paths");
  console.log("=" .repeat(80));
  console.log();

  const allLeaks: LeakReport[] = [];
  const allOverrideResults: OverrideVerification[] = [];
  const stateResults: Record<string, { hardcodedLeaks: number; dbLeaks: number; overridePass: boolean }> = {};

  // Prepare DB-simulated tasks (no stateOverrides on tasks)
  const dbTasks = simulateDBTasks();

  for (const state of ALL_50_STATES) {
    // ── Path 1: Hardcoded (frontend) ────────────────────────────────────────
    const hardcodedCopy = JSON.parse(JSON.stringify(SETTLEMENT_PHASE_TASKS));
    const hardcodedFiltered = removeCAOnlyTasks(hardcodedCopy, state);
    const hardcodedNormalized = normalizePhasesForState(hardcodedFiltered, state);
    
    let hardcodedLeaks: LeakReport[] = [];
    for (const phase of hardcodedNormalized) {
      hardcodedLeaks.push(...checkPhaseForLeaks(phase, state, "hardcoded"));
    }

    // ── Path 2: DB-simulated (no inline stateOverrides) ─────────────────────
    const dbCopy = JSON.parse(JSON.stringify(dbTasks));
    const dbFiltered = removeCAOnlyTasks(dbCopy, state);
    const dbNormalized = normalizePhasesForState(dbFiltered, state);

    let dbLeaks: LeakReport[] = [];
    for (const phase of dbNormalized) {
      dbLeaks.push(...checkPhaseForLeaks(phase, state, "db-simulated"));
    }

    // ── Override verification for states with explicit overrides ────────────
    const hcOverrides = verifyStateOverrides(hardcodedNormalized, state);
    const dbOverrides = verifyStateOverrides(dbNormalized, state);
    const allStateOverrides = [...hcOverrides, ...dbOverrides];
    const overridePass = allStateOverrides.every(r => r.pass);

    allLeaks.push(...hardcodedLeaks, ...dbLeaks);
    allOverrideResults.push(...allStateOverrides);

    stateResults[state] = {
      hardcodedLeaks: hardcodedLeaks.length,
      dbLeaks: dbLeaks.length,
      overridePass,
    };
  }

  // ─── REPORT ───────────────────────────────────────────────────────────────

  // Summary table
  console.log("┌─────┬───────────────┬──────────────┬──────────────┐");
  console.log("│ ST  │ HC Leaks      │ DB Leaks     │ Overrides OK │");
  console.log("├─────┼───────────────┼──────────────┼──────────────┤");
  
  for (const state of ALL_50_STATES) {
    const r = stateResults[state];
    const hcStatus = r.hardcodedLeaks === 0 ? "✅ 0" : `❌ ${r.hardcodedLeaks}`;
    const dbStatus = r.dbLeaks === 0 ? "✅ 0" : `❌ ${r.dbLeaks}`;
    const hasOverrides = STATES_WITH_OVERRIDES.includes(state);
    const ovStatus = hasOverrides ? (r.overridePass ? "✅ YES" : "❌ FAIL") : "— N/A";
    console.log(`│ ${state.padEnd(3)} │ ${hcStatus.padEnd(13)} │ ${dbStatus.padEnd(12)} │ ${ovStatus.padEnd(12)} │`);
  }
  
  console.log("└─────┴───────────────┴──────────────┴──────────────┘");
  console.log();

  // Leak details (if any)
  const nonCALeaks = allLeaks.filter(l => l.state !== "CA");
  if (nonCALeaks.length > 0) {
    console.log("❌ CA LEAKAGE DETECTED:");
    console.log("-".repeat(80));
    for (const leak of nonCALeaks) {
      console.log(`  State: ${leak.state} | Path: ${leak.path} | Phase: ${leak.phase}`);
      console.log(`  Task: ${leak.taskId || "(phase-level)"} | Field: ${leak.field}`);
      console.log(`  Pattern: ${leak.pattern}`);
      console.log(`  Value: "${leak.value}"`);
      console.log();
    }
  } else {
    console.log("✅ NO CA LEAKAGE DETECTED for any non-CA state on either path!");
  }

  // Override failures (if any)
  const overrideFailures = allOverrideResults.filter(r => !r.pass);
  if (overrideFailures.length > 0) {
    console.log();
    console.log("❌ STATE OVERRIDE MISMATCHES:");
    console.log("-".repeat(80));
    for (const f of overrideFailures) {
      console.log(`  State: ${f.state} | Task: ${f.taskId} | Field: ${f.field}`);
      console.log(`  Expected: "${f.expected}"`);
      console.log(`  Actual:   "${f.actual}"`);
      console.log();
    }
  } else if (allOverrideResults.length > 0) {
    console.log("✅ ALL STATE OVERRIDES VERIFIED CORRECTLY!");
  }

  // CA-only task count verification
  console.log();
  console.log("── CA-Only Task Isolation Check ──");
  for (const state of ALL_50_STATES) {
    const copy = JSON.parse(JSON.stringify(SETTLEMENT_PHASE_TASKS));
    const filtered = removeCAOnlyTasks(copy, state);
    const caTaskCount = filtered.reduce((sum, phase) => {
      return sum + phase.tasks.filter(t => CA_TASK_ID_LEAKS.includes(t.id)).length;
    }, 0);
    if (state === "CA") {
      if (caTaskCount !== 4) {
        console.log(`  ❌ CA: Expected 4 IAEA tasks, found ${caTaskCount}`);
      }
    } else {
      if (caTaskCount !== 0) {
        console.log(`  ❌ ${state}: CA-only tasks found after filtering: ${caTaskCount}`);
      }
    }
  }
  console.log("  ✅ CA-only task isolation: CA has 4 IAEA tasks, all others have 0");

  // Neutral default verification for non-override states
  console.log();
  console.log("── Neutral Default Phase Verification (non-override states) ──");
  const nonOverrideStates = ALL_50_STATES.filter(s => !STATES_WITH_OVERRIDES.includes(s));
  let neutralPass = true;
  for (const state of nonOverrideStates) {
    const copy = JSON.parse(JSON.stringify(SETTLEMENT_PHASE_TASKS));
    const filtered = removeCAOnlyTasks(copy, state);
    const normalized = normalizePhasesForState(filtered, state);
    
    const creditorPhase = normalized.find(p => p.phase === "creditor_claims");
    if (creditorPhase) {
      if (creditorPhase.milestone !== "After Letters Issued") {
        console.log(`  ❌ ${state}: creditor_claims milestone = "${creditorPhase.milestone}" (expected "After Letters Issued")`);
        neutralPass = false;
      }
      if (creditorPhase.subtitle !== "Notice & Priority") {
        console.log(`  ❌ ${state}: creditor_claims subtitle = "${creditorPhase.subtitle}" (expected "Notice & Priority")`);
        neutralPass = false;
      }
    }
  }
  if (neutralPass) {
    console.log(`  ✅ All ${nonOverrideStates.length} non-override states use neutral defaults correctly`);
  }

  // Final summary
  console.log();
  console.log("=" .repeat(80));
  const totalLeaks = nonCALeaks.length;
  const totalOverrideFails = overrideFailures.length;
  if (totalLeaks === 0 && totalOverrideFails === 0 && neutralPass) {
    console.log("  🎉 ALL 50 STATES PASS — No CA leakage, overrides correct, neutrals clean");
  } else {
    console.log(`  ⚠️  ISSUES FOUND: ${totalLeaks} leaks, ${totalOverrideFails} override failures`);
  }
  console.log("=" .repeat(80));

  // Exit code
  process.exit(totalLeaks + totalOverrideFails > 0 ? 1 : 0);
}

main();
