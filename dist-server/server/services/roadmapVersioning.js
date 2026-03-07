import { createHash } from "node:crypto";
function sortObjectKeys(value) {
    if (Array.isArray(value)) {
        return value.map(sortObjectKeys);
    }
    if (value && typeof value === "object") {
        return Object.keys(value)
            .sort()
            .reduce((acc, key) => {
            acc[key] = sortObjectKeys(value[key]);
            return acc;
        }, {});
    }
    return value;
}
export function stableStringify(value) {
    return JSON.stringify(sortObjectKeys(value));
}
export function hashStable(value) {
    return createHash("sha256").update(stableStringify(value)).digest("hex");
}
export function normalizeRoadmapForSnapshot(phases) {
    return phases.map((phase) => ({
        phase: phase.phase,
        title: phase.title,
        subtitle: phase.subtitle,
        milestone: phase.milestone,
        isEscalationPath: !!phase.isEscalationPath,
        tasks: phase.tasks.map((task) => ({
            id: task.id,
            title: task.title,
            description: task.description,
            authorityScope: task.authorityScope,
            requiredDocs: [...(task.requiredDocs || [])].sort(),
            dependencies: [...(task.dependencies || [])].sort(),
            formNames: [...(task.formNames || [])].sort(),
            outputs: [...(task.outputs || [])].sort(),
            primaryActionLabel: task.primaryActionLabel,
            primaryActionUrl: task.primaryActionUrl,
        })),
    }));
}
export function buildTaskSignatureMap(phases) {
    const signatures = new Map();
    for (const phase of phases) {
        for (const task of phase.tasks) {
            const descriptor = {
                phase: phase.phase,
                title: task.title,
                description: task.description,
                authorityScope: task.authorityScope,
                requiredDocs: [...(task.requiredDocs || [])].sort(),
                dependencies: [...(task.dependencies || [])].sort(),
                formNames: [...(task.formNames || [])].sort(),
                outputs: [...(task.outputs || [])].sort(),
                primaryActionLabel: task.primaryActionLabel,
                primaryActionUrl: task.primaryActionUrl,
            };
            signatures.set(task.id, hashStable(descriptor));
        }
    }
    return signatures;
}
export function detectInputChanges(previous, next) {
    if (!previous) {
        return ["INITIAL_SNAPSHOT"];
    }
    const changed = [];
    const comparableKeys = [
        "deceasedState",
        "probateCounty",
        "settlementTypeCode",
        "estateAuthorityType",
        "procedureType",
        "distributionModel",
        "activeEngines",
        "hasWill",
        "hasMinorBeneficiaries",
        "hasContest",
        "hasUnknownHeirs",
        "hasPrimaryResidence",
        "estimatedValue",
        "totalDebts",
        "solvencyRatio",
        "assetCount",
        "liabilityCount",
        "stateRulesetHash",
        "countyOverrideHash",
        "ssotRoadmapVersion",
    ];
    for (const key of comparableKeys) {
        const before = previous[key];
        const after = next[key];
        if (stableStringify(before) !== stableStringify(after)) {
            changed.push(String(key));
        }
    }
    return changed;
}
function materialTriggerReasons(changedInputFields) {
    const reasons = new Set();
    if (changedInputFields.includes("deceasedState") || changedInputFields.includes("probateCounty")) {
        reasons.add("JURISDICTION_CHANGED");
    }
    if (changedInputFields.includes("estateAuthorityType") ||
        changedInputFields.includes("procedureType") ||
        changedInputFields.includes("distributionModel") ||
        changedInputFields.includes("activeEngines")) {
        reasons.add("TRACK_CHANGED");
    }
    if (changedInputFields.includes("estimatedValue") ||
        changedInputFields.includes("totalDebts") ||
        changedInputFields.includes("solvencyRatio") ||
        changedInputFields.includes("assetCount") ||
        changedInputFields.includes("liabilityCount")) {
        reasons.add("ESTATE_FINANCIALS_CHANGED");
    }
    if (changedInputFields.includes("stateRulesetHash") ||
        changedInputFields.includes("countyOverrideHash") ||
        changedInputFields.includes("ssotRoadmapVersion")) {
        reasons.add("RULESET_UPDATED");
    }
    if (changedInputFields.includes("hasWill") ||
        changedInputFields.includes("hasMinorBeneficiaries") ||
        changedInputFields.includes("hasContest") ||
        changedInputFields.includes("hasUnknownHeirs") ||
        changedInputFields.includes("hasPrimaryResidence")) {
        reasons.add("FACT_PATTERN_CHANGED");
    }
    if (reasons.size === 0 && changedInputFields.length > 0) {
        reasons.add("MATERIAL_CHANGE");
    }
    return Array.from(reasons);
}
export function computeRoadmapVersionDiff(params) {
    const { previousPhases, nextPhases, completedTaskIds, previousInputSnapshot, nextInputSnapshot, } = params;
    const previousMap = previousPhases ? buildTaskSignatureMap(previousPhases) : new Map();
    const nextMap = buildTaskSignatureMap(nextPhases);
    const previousIds = new Set(previousMap.keys());
    const nextIds = new Set(nextMap.keys());
    const addedTaskIds = Array.from(nextIds).filter((taskId) => !previousIds.has(taskId)).sort();
    const removedTaskIds = Array.from(previousIds).filter((taskId) => !nextIds.has(taskId)).sort();
    const changedTaskIds = Array.from(nextIds)
        .filter((taskId) => previousIds.has(taskId) && previousMap.get(taskId) !== nextMap.get(taskId))
        .sort();
    const unchangedTaskIds = Array.from(nextIds)
        .filter((taskId) => previousIds.has(taskId) && previousMap.get(taskId) === nextMap.get(taskId))
        .sort();
    const unchangedSet = new Set(unchangedTaskIds);
    const carriedCompletedTaskIds = completedTaskIds
        .filter((taskId) => unchangedSet.has(taskId))
        .sort();
    const carriedSet = new Set(carriedCompletedTaskIds);
    const invalidatedCompletedTaskIds = completedTaskIds
        .filter((taskId) => !carriedSet.has(taskId))
        .sort();
    const changedInputFields = detectInputChanges(previousInputSnapshot, nextInputSnapshot);
    const triggerReasons = materialTriggerReasons(changedInputFields);
    return {
        addedTaskIds,
        removedTaskIds,
        changedTaskIds,
        unchangedTaskIds,
        carriedCompletedTaskIds,
        invalidatedCompletedTaskIds,
        changedInputFields,
        triggerReasons,
    };
}
export function shouldCreateNewRoadmapVersion(params) {
    const { previousInputHash, nextInputHash, previousRoadmapHash, nextRoadmapHash, force } = params;
    if (force)
        return true;
    if (!previousInputHash || !previousRoadmapHash)
        return true;
    return previousInputHash !== nextInputHash || previousRoadmapHash !== nextRoadmapHash;
}
export function computeCompletedPhases(phases, completedTaskIds) {
    const completedSet = new Set(completedTaskIds);
    return phases
        .filter((phase) => {
        const taskIds = phase.tasks.map((task) => task.id);
        if (taskIds.length === 0)
            return false;
        return taskIds.every((taskId) => completedSet.has(taskId));
    })
        .map((phase) => phase.phase);
}
