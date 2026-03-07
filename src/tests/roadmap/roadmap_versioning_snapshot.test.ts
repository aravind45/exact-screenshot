import { describe, expect, it } from "vitest";
import {
  computeRoadmapVersionDiff,
  shouldCreateNewRoadmapVersion,
  type EstateRoadmapInputSnapshot,
} from "../../../server/services/roadmapVersioning";

const snapshotBase: EstateRoadmapInputSnapshot = {
  deceasedState: "TX",
  probateCounty: "Harris",
  settlementTypeCode: "FORMAL_PROBATE",
  estateAuthorityType: "PROBATE",
  procedureType: "FORMAL_PROBATE",
  distributionModel: "COURT_SUPERVISED",
  activeEngines: ["PROBATE"],
  hasWill: true,
  hasMinorBeneficiaries: false,
  hasContest: false,
  hasUnknownHeirs: false,
  hasPrimaryResidence: true,
  estimatedValue: 500000,
  totalDebts: 10000,
  solvencyRatio: 50,
  assetCount: 4,
  liabilityCount: 1,
  stateRulesetHash: "state-hash-1",
  countyOverrideHash: "county-hash-1",
  ssotRoadmapVersion: "1.2.0",
};

const previousPhases: any[] = [
  {
    phase: "immediate_actions",
    title: "Immediate",
    subtitle: "",
    milestone: "",
    tasks: [
      {
        id: "task_a",
        title: "Locate will",
        description: "Locate original will",
        authorityScope: "PROBATE",
        requiredDocs: ["death certificate"],
        dependencies: [],
        formNames: [],
        outputs: [],
      },
      {
        id: "task_b",
        title: "File petition",
        description: "File probate petition",
        authorityScope: "PROBATE",
        requiredDocs: ["petition"],
        dependencies: ["task_a"],
        formNames: ["Form P-1"],
        outputs: [],
      },
      {
        id: "task_c",
        title: "Notify heirs",
        description: "Send notice",
        authorityScope: "PROBATE",
        requiredDocs: [],
        dependencies: [],
        formNames: [],
        outputs: [],
      },
    ],
  },
];

const nextPhases: any[] = [
  {
    phase: "immediate_actions",
    title: "Immediate",
    subtitle: "",
    milestone: "",
    tasks: [
      {
        id: "task_a",
        title: "Locate will",
        description: "Locate original will",
        authorityScope: "PROBATE",
        requiredDocs: ["death certificate"],
        dependencies: [],
        formNames: [],
        outputs: [],
      },
      {
        id: "task_b",
        title: "File petition",
        description: "File probate petition with county cover sheet",
        authorityScope: "PROBATE",
        requiredDocs: ["petition", "cover-sheet"],
        dependencies: ["task_a"],
        formNames: ["Form P-1"],
        outputs: [],
      },
      {
        id: "task_d",
        title: "Request tax ID",
        description: "Apply for EIN",
        authorityScope: "PROBATE",
        requiredDocs: [],
        dependencies: ["task_b"],
        formNames: [],
        outputs: [],
      },
    ],
  },
];

describe("roadmapVersioning", () => {
  it("computes task diff and completion revalidation correctly", () => {
    const diff = computeRoadmapVersionDiff({
      previousPhases: previousPhases as any,
      nextPhases: nextPhases as any,
      completedTaskIds: ["task_a", "task_b", "task_c"],
      previousInputSnapshot: snapshotBase,
      nextInputSnapshot: {
        ...snapshotBase,
        assetCount: 5,
        estimatedValue: 650000,
      },
    });

    expect(diff.addedTaskIds).toEqual(["task_d"]);
    expect(diff.removedTaskIds).toEqual(["task_c"]);
    expect(diff.changedTaskIds).toEqual(["task_b"]);
    expect(diff.unchangedTaskIds).toContain("task_a");
    expect(diff.carriedCompletedTaskIds).toEqual(["task_a"]);
    expect(diff.invalidatedCompletedTaskIds).toEqual(["task_b", "task_c"]);
    expect(diff.triggerReasons).toContain("ESTATE_FINANCIALS_CHANGED");
  });

  it("does not create a new version when hashes are unchanged unless forced", () => {
    expect(
      shouldCreateNewRoadmapVersion({
        previousInputHash: "aaa",
        nextInputHash: "aaa",
        previousRoadmapHash: "bbb",
        nextRoadmapHash: "bbb",
      })
    ).toBe(false);

    expect(
      shouldCreateNewRoadmapVersion({
        previousInputHash: "aaa",
        nextInputHash: "aaa",
        previousRoadmapHash: "bbb",
        nextRoadmapHash: "bbb",
        force: true,
      })
    ).toBe(true);
  });
});
