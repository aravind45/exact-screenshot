import { prisma } from "../db.js";
import { getEstateRoadmap } from "../services/roadmapService.js";
import { TASK_ACTIONS } from "../../src/config/taskActions.js";
import { STATE_RULES } from "../../src/lib/stateRules.js";
import fs from "fs/promises";

type Issue = {
  type: "error" | "warning";
  message: string;
};

type Jurisdiction = {
  state: string;
  county?: string;
};

type JurisdictionReport = {
  state: string;
  county: string | null;
  phaseCount: number;
  taskCount: number;
  duplicateTaskIds: string[];
  tasksMissingActionCount: number;
  missingActionTaskIds: string[];
  confidence: number;
  issues: Issue[];
};

function parseArgs(): { state?: string; limit?: number; out?: string } {
  const args = process.argv.slice(2);
  const stateIdx = args.findIndex((arg) => arg === "--state");
  const limitIdx = args.findIndex((arg) => arg === "--limit");
  const outIdx = args.findIndex((arg) => arg === "--out");

  const state = stateIdx >= 0 ? args[stateIdx + 1]?.toUpperCase() : undefined;
  const limitRaw = limitIdx >= 0 ? Number(args[limitIdx + 1]) : undefined;
  const limit = Number.isFinite(limitRaw) && (limitRaw as number) > 0 ? Math.floor(limitRaw as number) : undefined;
  const out = outIdx >= 0 ? args[outIdx + 1] : undefined;

  return { state, limit, out };
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

function hasActionPath(task: any): boolean {
  if (task.primaryActionUrl) return true;
  if (TASK_ACTIONS[task.id]) return true;
  if (Array.isArray(task.requiredDocs) && task.requiredDocs.length > 0) return true;
  if (Array.isArray(task.links) && task.links.length > 0) return true;
  if (Array.isArray(task.formNames) && task.formNames.length > 0) return true;
  if (task.countyMetadata?.primaryActionUrl) return true;
  return false;
}

function computeConfidence(issues: Issue[], taskCount: number, tasksMissingActionCount: number): number {
  const errorCount = issues.filter((i) => i.type === "error").length;
  const warningCount = issues.filter((i) => i.type === "warning").length;

  let score = 100;
  score -= errorCount * 12;
  score -= warningCount * 4;

  const actionGapRatio = taskCount > 0 ? tasksMissingActionCount / taskCount : 1;
  score -= Math.round(actionGapRatio * 30);

  return Math.max(0, Math.min(100, score));
}

async function loadJurisdictions(stateFilter?: string): Promise<Jurisdiction[]> {
  const allStates = Object.keys(STATE_RULES).sort();
  const states = stateFilter ? allStates.filter((s) => s === stateFilter) : allStates;

  let countyRows: Array<{ stateCode: string; countyName: string }> = [];
  try {
    countyRows = await (prisma as any).countyOverride.findMany({
      where: { status: "APPROVED" },
      select: { stateCode: true, countyName: true },
      distinct: ["stateCode", "countyName"],
      orderBy: [{ stateCode: "asc" }, { countyName: "asc" }],
    });
  } catch {
    countyRows = [];
  }

  let estateCountyRows: Array<{ deceasedState: string | null; probateCounty: string | null }> = [];
  try {
    estateCountyRows = await prisma.estate.findMany({
      where: {
        probateCounty: { not: null },
      },
      select: { deceasedState: true, probateCounty: true },
      distinct: ["deceasedState", "probateCounty"],
      orderBy: [{ deceasedState: "asc" }, { probateCounty: "asc" }],
      take: 5000,
    });
  } catch {
    estateCountyRows = [];
  }

  const normalizeCounty = (value: string): string => value.trim().replace(/\s+/g, " ");
  const toDisplayCounty = (value: string): string =>
    value
      .split(" ")
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join(" ");
  const countiesByState = new Map<string, Map<string, string>>();

  const addCounty = (stateCode: string | undefined, rawCounty: string | null | undefined): void => {
    if (!stateCode || !rawCounty) return;

    const normalizedCounty = normalizeCounty(rawCounty);
    if (!normalizedCounty) return;

    if (!countiesByState.has(stateCode)) {
      countiesByState.set(stateCode, new Map<string, string>());
    }

    const key = normalizedCounty.toLowerCase();
    const stateCounties = countiesByState.get(stateCode)!;
    if (!stateCounties.has(key)) {
      stateCounties.set(key, toDisplayCounty(normalizedCounty));
    }
  };

  for (const row of countyRows) {
    addCounty(row.stateCode?.toUpperCase().trim(), row.countyName);
  }

  for (const row of estateCountyRows) {
    addCounty(row.deceasedState?.toUpperCase().trim(), row.probateCounty);
  }

  const jurisdictions: Jurisdiction[] = [];
  for (const state of states) {
    jurisdictions.push({ state });
    const counties = [...(countiesByState.get(state)?.values() || [])].sort((a, b) =>
      a.localeCompare(b)
    );
    for (const county of counties) {
      jurisdictions.push({ state, county });
    }
  }

  return jurisdictions;
}

async function runJurisdiction(userId: string, jurisdiction: Jurisdiction): Promise<JurisdictionReport> {
  const suffix = jurisdiction.county ? ` ${jurisdiction.county}` : "";

  const estate = await prisma.estate.create({
    data: {
      userId,
      name: `Matrix ${jurisdiction.state}${suffix}`,
      deceasedFirstName: "Matrix",
      deceasedLastName: "Case",
      deceasedState: jurisdiction.state,
      hasWill: true,
      settlementPath: "FORMAL_PROBATE",
      authorityType: "PROBATE",
      probateCounty: jurisdiction.county || null,
    },
    select: { id: true },
  });

  try {
    const roadmap = await getEstateRoadmap(estate.id);
    const phases = roadmap.phases || [];
    const tasks = phases.flatMap((phase) => phase.tasks || []);

    const issues: Issue[] = [];
    if (phases.length === 0) {
      issues.push({ type: "error", message: "Roadmap has zero phases" });
    }
    if (tasks.length === 0) {
      issues.push({ type: "error", message: "Roadmap has zero tasks" });
    }

    const duplicateTaskIds = findDuplicateIds(tasks.map((task) => task.id));
    if (duplicateTaskIds.length > 0) {
      issues.push({
        type: "error",
        message: `Duplicate task IDs: ${duplicateTaskIds.join(", ")}`,
      });
    }

    const tasksMissingBasics = tasks.filter((task: any) => !task.id || !task.title || !task.description);
    if (tasksMissingBasics.length > 0) {
      issues.push({
        type: "error",
        message: `Tasks missing id/title/description: ${tasksMissingBasics.length}`,
      });
    }

    const tasksMissingAction = tasks.filter((task: any) => !hasActionPath(task));
    const missingActionTaskIds = [...new Set(tasksMissingAction.map((task: any) => task.id))].sort();
    if (tasksMissingAction.length > 0) {
      issues.push({
        type: "warning",
        message: `Tasks without any actionable path (mapped action/url/docs/links/forms): ${tasksMissingAction.length}`,
      });
    }

    const confidence = computeConfidence(issues, tasks.length, tasksMissingAction.length);

    return {
      state: jurisdiction.state,
      county: jurisdiction.county || null,
      phaseCount: phases.length,
      taskCount: tasks.length,
      duplicateTaskIds,
      tasksMissingActionCount: tasksMissingAction.length,
      missingActionTaskIds,
      confidence,
      issues,
    };
  } finally {
    await prisma.estate.delete({ where: { id: estate.id } }).catch(() => undefined);
  }
}

function aggregateByState(reports: JurisdictionReport[]) {
  const stateMap = new Map<string, JurisdictionReport[]>();
  for (const report of reports) {
    if (!stateMap.has(report.state)) {
      stateMap.set(report.state, []);
    }
    stateMap.get(report.state)!.push(report);
  }

  return [...stateMap.entries()]
    .map(([state, list]) => {
      const avgConfidence = Math.round(
        list.reduce((sum, item) => sum + item.confidence, 0) / Math.max(list.length, 1)
      );
      const minConfidence = Math.min(...list.map((item) => item.confidence));
      const worst = [...list].sort((a, b) => a.confidence - b.confidence)[0];

      return {
        state,
        jurisdictions: list.length,
        avgConfidence,
        minConfidence,
        worstCounty: worst.county,
        worstIssues: worst.issues,
      };
    })
    .sort((a, b) => a.avgConfidence - b.avgConfidence);
}

function aggregateMissingActionIds(reports: JurisdictionReport[]) {
  const counts = new Map<string, number>();
  for (const report of reports) {
    for (const id of report.missingActionTaskIds) {
      counts.set(id, (counts.get(id) || 0) + 1);
    }
  }

  return [...counts.entries()]
    .map(([id, count]) => ({ id, count }))
    .sort((a, b) => b.count - a.count || a.id.localeCompare(b.id));
}

async function main() {
  const { state, limit, out } = parseArgs();
  const user = await prisma.user.findFirst({ select: { id: true } });

  if (!user) {
    console.error("No users found. Cannot run matrix confidence audit.");
    process.exit(1);
  }

  const allJurisdictions = await loadJurisdictions(state);
  const jurisdictions = typeof limit === "number" ? allJurisdictions.slice(0, limit) : allJurisdictions;

  if (jurisdictions.length === 0) {
    console.error(`No jurisdictions found for state filter: ${state || "(none)"}`);
    process.exit(1);
  }

  const reports: JurisdictionReport[] = [];

  for (const jurisdiction of jurisdictions) {
    const label = jurisdiction.county ? `${jurisdiction.state}/${jurisdiction.county}` : `${jurisdiction.state}/(state)`;
    process.stdout.write(`Running ${label} ... `);

    try {
      const report = await runJurisdiction(user.id, jurisdiction);
      reports.push(report);
      process.stdout.write(`confidence=${report.confidence}`);
      process.stdout.write("\n");
    } catch (error: any) {
      process.stdout.write(`FAILED: ${error?.message || String(error)}\n`);
      reports.push({
        state: jurisdiction.state,
        county: jurisdiction.county || null,
        phaseCount: 0,
        taskCount: 0,
        duplicateTaskIds: [],
        tasksMissingActionCount: 0,
        missingActionTaskIds: [],
        confidence: 0,
        issues: [{ type: "error", message: error?.message || String(error) }],
      });
    }
  }

  const stateSummary = aggregateByState(reports);
  const topMissingActionIds = aggregateMissingActionIds(reports).slice(0, 50);

  const output = {
    generatedAt: new Date().toISOString(),
    filters: { state: state || null, limit: limit || null },
    totals: {
      jurisdictions: reports.length,
      avgConfidence: Math.round(reports.reduce((sum, r) => sum + r.confidence, 0) / Math.max(reports.length, 1)),
      failingJurisdictions: reports.filter((r) => r.confidence < 80).length,
    },
    lowestJurisdictions: [...reports]
      .sort((a, b) => a.confidence - b.confidence)
      .slice(0, 15),
    byState: stateSummary,
    topMissingActionIds,
    jurisdictions: reports,
  };

  if (out) {
    await fs.writeFile(out, JSON.stringify(output, null, 2), "utf8");
  }

  console.log(JSON.stringify(output, null, 2));
}

main()
  .catch((error) => {
    console.error("Matrix confidence audit crashed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

