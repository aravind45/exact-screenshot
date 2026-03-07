import { prisma } from "../db.js";
import { getEstateRoadmap } from "../services/roadmapService.js";
import { DocumentService } from "../services/DocumentService.js";
import { TASK_ACTIONS } from "../../src/config/taskActions.js";

type SmokeIssue = {
  type: "error" | "warning";
  message: string;
};

type FormResult = {
  formId: string;
  ok: boolean;
  bytes?: number;
  error?: string;
};

const SUPPORTED_FORM_IDS = [
  "DE-111",
  "DE-115",
  "DE-116",
  "DE-120",
  "DE-121",
  "DE-142",
  "DE-143",
  "DE-150",
  "DE-154",
  "DE-160",
  "DE-165",
  "DE-174",
  "DE-221",
  "DE-226",
  "DE-260",
  "DE-265",
  "DE-295",
  "DE-310",
  "DE-315",
  "DE-350",
  "DE-351",
] as const;

const FORM_REGEX = /\bDE-\d{3}\b/g;

function parseEstateIdArg(): string | null {
  const idx = process.argv.findIndex((arg) => arg === "--estateId");
  if (idx === -1) return null;
  const value = process.argv[idx + 1];
  return value || null;
}

function parseStateArg(): string | null {
  const idx = process.argv.findIndex((arg) => arg === "--state");
  if (idx === -1) return null;
  const value = process.argv[idx + 1];
  return value ? value.toUpperCase() : null;
}

function pickRandom<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function extractFormIdsFromRoadmap(phases: any[]): Set<string> {
  const found = new Set<string>();
  for (const phase of phases) {
    for (const task of phase.tasks || []) {
      const scanStrings: string[] = [];
      if (task.title) scanStrings.push(String(task.title));
      if (task.description) scanStrings.push(String(task.description));
      if (Array.isArray(task.requiredDocs)) {
        scanStrings.push(...task.requiredDocs.map((v: any) => String(v)));
      }
      if (Array.isArray(task.formNames)) {
        scanStrings.push(...task.formNames.map((v: any) => String(v)));
      }
      if (Array.isArray(task.links)) {
        for (const link of task.links) {
          if (link?.label) scanStrings.push(String(link.label));
          if (link?.url) scanStrings.push(String(link.url));
        }
      }

      for (const text of scanStrings) {
        const matches = text.match(FORM_REGEX);
        if (!matches) continue;
        for (const m of matches) found.add(m.toUpperCase());
      }
    }
  }
  return found;
}

function toArrayBufferLength(data: Uint8Array | Buffer): number {
  return data instanceof Uint8Array ? data.byteLength : Buffer.byteLength(data);
}

async function generateFormForEstate(
  formId: string,
  estate: any,
  assets: any[],
  liabilities: any[]
): Promise<FormResult> {
  try {
    const estateData = { ...estate, user: estate.user };

    let bytes: Uint8Array;
    switch (formId) {
      case "DE-111":
        bytes = await DocumentService.generateDE111(estateData);
        break;
      case "DE-115":
        bytes = await DocumentService.generateDE115(estateData);
        break;
      case "DE-116":
        bytes = await DocumentService.generateDE116(estateData);
        break;
      case "DE-120":
        bytes = await DocumentService.generateDE120(estateData);
        break;
      case "DE-121":
        bytes = await DocumentService.generateDE121(estateData);
        break;
      case "DE-142":
        bytes = await DocumentService.generateDE142(estateData);
        break;
      case "DE-143":
        bytes = await DocumentService.generateDE143(estateData);
        break;
      case "DE-150":
        bytes = await DocumentService.generateDE150(estateData);
        break;
      case "DE-154":
        bytes = await DocumentService.generateDE154(estateData);
        break;
      case "DE-160":
        bytes = await DocumentService.generateDE160(estateData, assets);
        break;
      case "DE-165":
        bytes = await DocumentService.generateDE165(estateData);
        break;
      case "DE-174": {
        const liability = liabilities[0] || {};
        bytes = await DocumentService.generateDE174(estateData, liability);
        break;
      }
      case "DE-221":
        bytes = await DocumentService.generateDE221(estateData);
        break;
      case "DE-226":
        bytes = await DocumentService.generateDE226(estateData);
        break;
      case "DE-260":
        bytes = await DocumentService.generateDE260(estateData);
        break;
      case "DE-265":
        bytes = await DocumentService.generateDE265(estateData);
        break;
      case "DE-295":
        bytes = await DocumentService.generateDE295(estateData);
        break;
      case "DE-310": {
        const total = assets.reduce((sum, a) => sum + Number(a.inventoryValue || a.value || 0), 0);
        bytes = await DocumentService.generateDE310(estateData, total);
        break;
      }
      case "DE-315":
        bytes = await DocumentService.generateDE315(estateData);
        break;
      case "DE-350":
        bytes = await DocumentService.generateDE350(estateData);
        break;
      case "DE-351":
        bytes = await DocumentService.generateDE351(estateData);
        break;
      default:
        return { formId, ok: false, error: "Unsupported in smoke script" };
    }

    const len = toArrayBufferLength(bytes);
    if (len <= 0) return { formId, ok: false, error: "Generated empty PDF buffer" };
    return { formId, ok: true, bytes: len };
  } catch (error: any) {
    return { formId, ok: false, error: error?.message || String(error) };
  }
}

function computeConfidence(
  issues: SmokeIssue[],
  formResults: FormResult[]
): number {
  const errorCount = issues.filter((i) => i.type === "error").length;
  const warningCount = issues.filter((i) => i.type === "warning").length;
  const totalForms = formResults.length || 1;
  const failedForms = formResults.filter((r) => !r.ok).length;
  const formFailureRatio = failedForms / totalForms;

  let score = 100;
  score -= errorCount * 12;
  score -= warningCount * 3;
  score -= Math.round(formFailureRatio * 45);
  return Math.max(0, Math.min(100, score));
}

async function main() {
  const explicitEstateId = parseEstateIdArg();
  const stateFilter = parseStateArg();

  const whereClause = explicitEstateId
    ? { id: explicitEstateId }
    : stateFilter
      ? { deceasedState: stateFilter }
      : { deceasedState: { notIn: ["", "UNSET"] } };

  const estates = await prisma.estate.findMany({
    where: whereClause as any,
    include: { user: true, heirs: true },
  });

  if (estates.length === 0) {
    console.error("No estate found for smoke test.");
    process.exit(1);
  }

  const estate = explicitEstateId
    ? estates[0]
    : pickRandom(estates);

  const [assets, liabilities] = await Promise.all([
    prisma.asset.findMany({ where: { estateId: estate.id } }),
    prisma.liability.findMany({ where: { estateId: estate.id } }),
  ]);

  const roadmap = await getEstateRoadmap(estate.id);
  const phases = roadmap.phases || [];
  const tasks = phases.flatMap((p) => p.tasks || []);

  const issues: SmokeIssue[] = [];
  if (phases.length === 0) {
    issues.push({ type: "error", message: "Roadmap has zero phases" });
  }
  if (tasks.length === 0) {
    issues.push({ type: "error", message: "Roadmap has zero tasks" });
  }

  const duplicateTaskIds = Object.entries(
    tasks.reduce((acc: Record<string, number>, task: any) => {
      acc[task.id] = (acc[task.id] || 0) + 1;
      return acc;
    }, {})
  )
    .filter(([, count]) => count > 1)
    .map(([id]) => id);

  if (duplicateTaskIds.length > 0) {
    issues.push({
      type: "error",
      message: `Duplicate task IDs: ${duplicateTaskIds.join(", ")}`,
    });
  }

  const tasksMissingBasics = tasks.filter((t: any) => !t.id || !t.title || !t.description);
  if (tasksMissingBasics.length > 0) {
    issues.push({
      type: "error",
      message: `Tasks missing id/title/description: ${tasksMissingBasics.length}`,
    });
  }

  const tasksMissingAction = tasks.filter((t: any) => {
    const hasIntegratedAction =
      (Array.isArray(t.requiredDocs) && t.requiredDocs.length > 0) ||
      (Array.isArray(t.links) && t.links.length > 0) ||
      (Array.isArray(t.formNames) && t.formNames.length > 0) ||
      Boolean(t.countyMetadata?.primaryActionUrl);

    if (t.primaryActionUrl || TASK_ACTIONS[t.id] || hasIntegratedAction) return false;
    return true;
  });
  if (tasksMissingAction.length > 0) {
    issues.push({
      type: "warning",
      message: `Tasks without any actionable path (mapped action/url/docs/links/forms): ${tasksMissingAction.length}`,
    });
  }

  const formIdsFromRoadmap = extractFormIdsFromRoadmap(phases);
  const roadmapSupportedForms = Array.from(formIdsFromRoadmap).filter((id) =>
    SUPPORTED_FORM_IDS.includes(id as (typeof SUPPORTED_FORM_IDS)[number])
  );

  // Run all known CA forms only for CA estates; for other states, validate only forms
  // explicitly referenced by the generated roadmap.
  const formsToTest = estate.deceasedState === "CA"
    ? [...SUPPORTED_FORM_IDS]
    : roadmapSupportedForms;

  const formResults: FormResult[] = [];
  for (const formId of formsToTest) {
    formResults.push(await generateFormForEstate(formId, estate, assets, liabilities));
  }

  const failedForms = formResults.filter((r) => !r.ok);
  if (failedForms.length > 0) {
    issues.push({
      type: "error",
      message: `Form generation failures: ${failedForms.map((f) => f.formId).join(", ")}`,
    });
  }

  const confidence = computeConfidence(issues, formResults);

  const report = {
    pickedAt: new Date().toISOString(),
    estate: {
      id: estate.id,
      userId: estate.userId,
      userEmail: estate.user?.email || null,
      state: estate.deceasedState,
      settlementPath: estate.settlementPath,
      authorityType: estate.authorityType,
      estateAuthorityType: estate.estateAuthorityType,
    },
    roadmap: {
      version: roadmap.version,
      phases: phases.length,
      tasks: tasks.length,
      duplicateTaskIds,
      tasksMissingActionCount: tasksMissingAction.length,
    },
    forms: {
      attempted: formResults.length,
      passed: formResults.filter((r) => r.ok).length,
      failed: failedForms.length,
      results: formResults,
    },
    issues,
    confidence,
  };

  console.log(JSON.stringify(report, null, 2));
}

main()
  .catch((error) => {
    console.error("Smoke test crashed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });





