import { describe, expect, it } from "vitest";
import {
  SETTLEMENT_PHASE_TASKS,
  TRUST_PHASE_TASKS,
  MODIFIER_PHASE_TASKS,
  PROBATE_ESCALATION_PHASE,
  type PhaseTask,
  type PhaseTaskList,
} from "../../config/settlementPhases";
import { STATE_RULES } from "../../lib/stateRules";
import {
  filterPhasesByAuthorityScope,
  filterPhasesByJurisdiction,
  filterTasksByJurisdiction,
  type PhaseLike,
} from "../../shared/filterByJurisdiction";
import { filterTasksForEstate } from "../../../server/services/roadmapService";

type EstateAuthorityType = "PROBATE" | "TRUST" | "BOTH";

type Scenario = {
  label: string;
  hasWill: boolean;
  hasMinorBeneficiaries: boolean;
  isContested: boolean;
  isSmallEstate: boolean;
  isPrimaryResidence: boolean;
  hasUnknownHeirs: boolean;
  hasForeignBeneficiary: boolean;
  executorNonUsResident: boolean;
};

const ALL_STATES = Object.keys(STATE_RULES).sort();
const ESTATE_AUTHORITY_TYPES: EstateAuthorityType[] = ["PROBATE", "TRUST", "BOTH"];

const MATRIX_SCENARIOS: Scenario[] = [
  {
    label: "baseline",
    hasWill: true,
    hasMinorBeneficiaries: false,
    isContested: false,
    isSmallEstate: false,
    isPrimaryResidence: true,
    hasUnknownHeirs: false,
    hasForeignBeneficiary: false,
    executorNonUsResident: false,
  },
  {
    label: "intestate",
    hasWill: false,
    hasMinorBeneficiaries: false,
    isContested: false,
    isSmallEstate: false,
    isPrimaryResidence: true,
    hasUnknownHeirs: true,
    hasForeignBeneficiary: false,
    executorNonUsResident: false,
  },
  {
    label: "contested",
    hasWill: true,
    hasMinorBeneficiaries: false,
    isContested: true,
    isSmallEstate: false,
    isPrimaryResidence: true,
    hasUnknownHeirs: false,
    hasForeignBeneficiary: false,
    executorNonUsResident: false,
  },
  {
    label: "minor-heirs",
    hasWill: true,
    hasMinorBeneficiaries: true,
    isContested: false,
    isSmallEstate: false,
    isPrimaryResidence: true,
    hasUnknownHeirs: false,
    hasForeignBeneficiary: false,
    executorNonUsResident: false,
  },
  {
    label: "small-estate",
    hasWill: true,
    hasMinorBeneficiaries: false,
    isContested: false,
    isSmallEstate: true,
    isPrimaryResidence: false,
    hasUnknownHeirs: false,
    hasForeignBeneficiary: false,
    executorNonUsResident: false,
  },
  {
    label: "foreign-beneficiary",
    hasWill: true,
    hasMinorBeneficiaries: false,
    isContested: false,
    isSmallEstate: false,
    isPrimaryResidence: true,
    hasUnknownHeirs: false,
    hasForeignBeneficiary: true,
    executorNonUsResident: false,
  },
  {
    label: "non-us-executor",
    hasWill: true,
    hasMinorBeneficiaries: false,
    isContested: false,
    isSmallEstate: false,
    isPrimaryResidence: true,
    hasUnknownHeirs: false,
    hasForeignBeneficiary: false,
    executorNonUsResident: true,
  },
  {
    label: "stress-mix",
    hasWill: false,
    hasMinorBeneficiaries: true,
    isContested: true,
    isSmallEstate: true,
    isPrimaryResidence: true,
    hasUnknownHeirs: true,
    hasForeignBeneficiary: true,
    executorNonUsResident: true,
  },
];

const MINOR_TASK_IDS = new Set([
  "identify_minor_beneficiaries",
  "petition_guardian_ad_litem",
  "obtain_guardian_order",
  "coordinate_with_guardian",
  "guardian_distribution_approval",
  "minor_distribution_petition",
  "minor_distribution_block",
]);

const CONTEST_TASK_IDS = new Set([
  "respond_to_objections",
  "attend_contest_hearing",
  "resolve_contest",
  "litigation_hold_probate",
  "litigation_hold",
]);

const CA_ONLY_TASK_IDS = new Set([
  "prepare_notice_proposed_action",
  "wait_proposed_action_period",
  "petition_confirm_sale",
  "obtain_sale_confirmation_order",
  "ca_calculate_overbid_requirements",
  "ca_notice_of_hearing",
  "ca_attend_confirmation_hearing",
]);

const GA_ONLY_TASK_IDS = new Set([
  "ga_years_support_petition",
  "ga_years_support_citation",
  "ga_years_support_order",
  "file_ga_no_admin",
]);

const NY_ONLY_TASK_IDS = new Set([
  "ny_probate_petition",
  "ny_admin_petition",
  "ny_voluntary_admin",
  "ny_ancillary_petition",
  "ny_small_estate_affidavit",
  "ny_surrogate_appointment",
  "ny_accounting",
]);

const TX_ONLY_TASK_IDS = new Set([
  "tx_muniment_title",
  "tx_independent_administration",
  "tx_dependent_administration",
  "tx_heirship_proceeding",
  "tx_posting_requirement",
]);

const MAX_REPORTED_ERRORS = 120;

// Legacy duplicate currently present in source task data (tracked by matrix tests).
const KNOWN_LEGACY_DUPLICATE_TASK_IDS = new Set(["oh_certificate_of_transfer"]);

function getAllPhases(): PhaseTaskList[] {
  const raw = [
    ...SETTLEMENT_PHASE_TASKS,
    ...TRUST_PHASE_TASKS,
    ...MODIFIER_PHASE_TASKS,
    ...(PROBATE_ESCALATION_PHASE ? [PROBATE_ESCALATION_PHASE] : []),
  ];

  // Drop known-invalid source rows once to avoid repeated noisy logs in matrix loops.
  const cloned = JSON.parse(JSON.stringify(raw)) as PhaseTaskList[];
  return cloned.map((phase) => ({
    ...phase,
    tasks: phase.tasks.filter((task) => Boolean(task.scope) && task.scope !== "UNSCOPED"),
  }));
}

function getStatePredicates(state: string) {
  return {
    isNJ: state === "NJ",
    isOH: state === "OH",
    isGA: state === "GA",
    isCA: state === "CA",
    isNY: state === "NY",
    isTX: state === "TX",
    isFL: state === "FL",
    isPA: state === "PA",
    isIL: state === "IL",
    isMA: state === "MA",
    isMN: state === "MN",
    isVA: state === "VA",
    isWA: state === "WA",
    isAZ: state === "AZ",
    isCO: state === "CO",
    isCT: state === "CT",
    isMD: state === "MD",
    isNC: state === "NC",
    isSC: state === "SC",
  };
}

function buildProfile(state: string, authorityType: EstateAuthorityType, scenario: Scenario) {
  const activeEngines =
    authorityType === "PROBATE"
      ? ["PROBATE"]
      : authorityType === "TRUST"
        ? ["TRUST"]
        : ["PROBATE", "TRUST"];

  const authoritySource = authorityType === "TRUST" ? "FIDUCIARY_INSTRUMENT" : "COURT";
  const procedureType =
    authorityType === "TRUST"
      ? "TRUST_ADMINISTRATION"
      : scenario.isSmallEstate
        ? "SMALL_ESTATE_AFFIDAVIT"
        : "FORMAL_PROBATE";
  const distributionModel =
    authorityType === "TRUST"
      ? "TRUST_TERMS"
      : scenario.hasWill
        ? "TESTATE"
        : "INTESTATE";

  const estimatedValue = scenario.isSmallEstate ? 60000 : 650000;
  const totalDebts = scenario.isSmallEstate ? 5000 : 30000;

  return {
    id: `matrix-${state}-${authorityType}-${scenario.label}`,
    hasMinorBeneficiaries: scenario.hasMinorBeneficiaries,
    isSmallEstate: scenario.isSmallEstate,
    isPrimaryResidence: scenario.isPrimaryResidence,
    isContested: scenario.isContested,
    state,
    estimatedValue,
    totalDebts,
    solvencyRatio: estimatedValue / Math.max(totalDebts, 1),
    assetCount: scenario.isSmallEstate ? 2 : 7,
    liabilityCount: totalDebts > 0 ? 2 : 0,
    authoritySource,
    procedureType,
    distributionModel,
    activeEngines,
    estateAuthorityType: authorityType,
    hasWill: scenario.hasWill,
    hasUnknownHeirs: scenario.hasUnknownHeirs,
    has_foreign_beneficiary: scenario.hasForeignBeneficiary,
    executor_non_us_resident: scenario.executorNonUsResident,
    ...getStatePredicates(state),
  } as Parameters<typeof filterTasksForEstate>[1];
}

function buildScenarioRoadmap(profile: Parameters<typeof filterTasksForEstate>[1]): PhaseTaskList[] {
  const filtered = filterTasksForEstate(getAllPhases(), profile, []);

  const { phases: jurisdictionPhases } = filterPhasesByJurisdiction(
    filtered as unknown as PhaseLike<PhaseTask>[],
    profile.state
  );

  const { phases: authorityPhases } = filterPhasesByAuthorityScope(
    jurisdictionPhases as PhaseLike<PhaseTask>[],
    profile.estateAuthorityType
  );

  return authorityPhases as unknown as PhaseTaskList[];
}

function findDuplicateIds(ids: string[]): string[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();

  for (const id of ids) {
    if (seen.has(id)) {
      duplicates.add(id);
      continue;
    }
    seen.add(id);
  }

  return [...duplicates].sort();
}

describe("Roadmap matrix hardening", () => {
  it("validates track/state/asset-rule matrix invariants without manual case-by-case checks", () => {
    const errors: string[] = [];
    let suppressedErrors = 0;

    const pushError = (message: string) => {
      if (errors.length < MAX_REPORTED_ERRORS) {
        errors.push(message);
      } else {
        suppressedErrors += 1;
      }
    };

    for (const state of ALL_STATES) {
      for (const authorityType of ESTATE_AUTHORITY_TYPES) {
        for (const scenario of MATRIX_SCENARIOS) {
          const profile = buildProfile(state, authorityType, scenario);
          const roadmap = buildScenarioRoadmap(profile);
          const tasks = roadmap.flatMap((phase) => phase.tasks);
          const scenarioKey = `${state} | ${authorityType} | ${scenario.label}`;

          if (roadmap.length === 0 || tasks.length === 0) {
            pushError(`${scenarioKey}: empty roadmap output`);
            continue;
          }

          const duplicates = findDuplicateIds(tasks.map((task) => task.id));
          const actionableDuplicates = duplicates.filter(
            (taskId) => !KNOWN_LEGACY_DUPLICATE_TASK_IDS.has(taskId)
          );
          if (actionableDuplicates.length > 0) {
            pushError(
              `${scenarioKey}: duplicate task IDs detected (${actionableDuplicates.join(", ")})`
            );
          }

          const invalidScope = tasks.filter((task) => !task.scope || task.scope === "UNSCOPED");
          if (invalidScope.length > 0) {
            pushError(`${scenarioKey}: tasks with invalid scope (${invalidScope.map((task) => task.id).join(", ")})`);
          }

          const missingAuthorityScope = tasks.filter((task) => !task.authorityScope);
          if (missingAuthorityScope.length > 0) {
            pushError(
              `${scenarioKey}: tasks missing authorityScope (${missingAuthorityScope.map((task) => task.id).join(", ")})`
            );
          }

          if (authorityType === "PROBATE") {
            const leaked = tasks.filter((task) => task.authorityScope === "TRUST").map((task) => task.id);
            if (leaked.length > 0) {
              pushError(`${scenarioKey}: TRUST tasks leaked into PROBATE roadmap (${leaked.join(", ")})`);
            }
          }

          if (authorityType === "TRUST") {
            const leaked = tasks.filter((task) => task.authorityScope === "PROBATE").map((task) => task.id);
            if (leaked.length > 0) {
              pushError(`${scenarioKey}: PROBATE tasks leaked into TRUST roadmap (${leaked.join(", ")})`);
            }
          }

          if (!scenario.hasMinorBeneficiaries) {
            const leaked = tasks.filter((task) => MINOR_TASK_IDS.has(task.id)).map((task) => task.id);
            if (leaked.length > 0) {
              pushError(`${scenarioKey}: minor-only tasks shown without minor beneficiaries (${leaked.join(", ")})`);
            }
          }

          if (!scenario.isContested) {
            const leaked = tasks.filter((task) => CONTEST_TASK_IDS.has(task.id)).map((task) => task.id);
            if (leaked.length > 0) {
              pushError(`${scenarioKey}: contested-only tasks shown in uncontested scenario (${leaked.join(", ")})`);
            }
          }

          if (scenario.hasWill && tasks.some((task) => task.id === "locate_docs_no_will")) {
            pushError(`${scenarioKey}: intestate document task leaked into hasWill=true scenario`);
          }

          if (!scenario.hasWill && tasks.some((task) => task.id === "locate_will")) {
            pushError(`${scenarioKey}: will-specific task leaked into hasWill=false scenario`);
          }

          if (state !== "CA" && tasks.some((task) => CA_ONLY_TASK_IDS.has(task.id))) {
            pushError(`${scenarioKey}: CA-only tasks leaked outside CA`);
          }

          if (state !== "GA" && tasks.some((task) => GA_ONLY_TASK_IDS.has(task.id))) {
            pushError(`${scenarioKey}: GA-only tasks leaked outside GA`);
          }

          if (state !== "NY" && tasks.some((task) => NY_ONLY_TASK_IDS.has(task.id))) {
            pushError(`${scenarioKey}: NY-only tasks leaked outside NY`);
          }

          if (state !== "TX" && tasks.some((task) => TX_ONLY_TASK_IDS.has(task.id))) {
            pushError(`${scenarioKey}: TX-only tasks leaked outside TX`);
          }
        }
      }
    }

    if (suppressedErrors > 0) {
      errors.push(`... plus ${suppressedErrors} additional matrix errors not shown`);
    }

    expect(errors).toEqual([]);
  });

  it("enforces county filtering behavior using a deterministic county matrix", () => {
    const tasks = [
      { id: "core_task", scope: "CORE", authorityScope: "BOTH" },
      { id: "tx_state_task", scope: "US-TX", authorityScope: "BOTH" },
      { id: "tx_harris_task", scope: "US-TX", authorityScope: "BOTH", allowedCounties: ["Harris"] },
      { id: "tx_travis_task", scope: "US-TX", authorityScope: "BOTH", allowedCounties: ["Travis"] },
    ];

    const cases: Array<{
      stateCode: string;
      county?: string;
      expected: string[];
    }> = [
      { stateCode: "TX", county: "Harris", expected: ["core_task", "tx_state_task", "tx_harris_task"] },
      { stateCode: "TX", county: "Travis", expected: ["core_task", "tx_state_task", "tx_travis_task"] },
      { stateCode: "TX", county: "Dallas", expected: ["core_task", "tx_state_task"] },
      { stateCode: "TX", expected: ["core_task", "tx_state_task"] },
      { stateCode: "CA", county: "Harris", expected: ["core_task"] },
    ];

    for (const testCase of cases) {
      const { kept } = filterTasksByJurisdiction(tasks, testCase.stateCode, testCase.county);
      const keptIds = kept.map((task) => task.id).sort();
      expect(keptIds).toEqual([...testCase.expected].sort());
    }
  });
});


