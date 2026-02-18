import { prisma } from "../db.js";
import { getRulesForTrack, resolveStateOverride, } from "../lib/deadlineRules.js";
// ─────────────────────────────────────────────────────────────────────────────
// Helper: add N days to a date
// ─────────────────────────────────────────────────────────────────────────────
function addDays(date, days) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}
// ─────────────────────────────────────────────────────────────────────────────
// Helper: compute April 15 of the year AFTER the given date
// (for TAX_YEAR anchor deadlines like Form 1040, 1041)
// ─────────────────────────────────────────────────────────────────────────────
function nextApril15After(date) {
    const nextYear = date.getFullYear() + 1;
    return new Date(nextYear, 3, 15); // April = month index 3
}
// ─────────────────────────────────────────────────────────────────────────────
// Helper: resolve actual due date from rule + estate anchor dates
// Returns null if the required anchor date is missing
// ─────────────────────────────────────────────────────────────────────────────
function computeDueDate(rule, stateCode, anchors) {
    const { offsetDays } = resolveStateOverride(rule, stateCode);
    switch (rule.anchorType) {
        case "DOD": {
            if (!anchors.dod)
                return { missingAnchor: "Date of Death" };
            return { dueDate: addDays(anchors.dod, offsetDays) };
        }
        case "LETTERS": {
            if (!anchors.letters)
                return { missingAnchor: "Letters Testamentary / Appointment Date" };
            return { dueDate: addDays(anchors.letters, offsetDays) };
        }
        case "HEARING": {
            if (!anchors.hearing)
                return { missingAnchor: "Court Hearing Date" };
            return { dueDate: addDays(anchors.hearing, offsetDays) };
        }
        case "TAX_YEAR": {
            // April 15 of year following DOD (or letters date as fallback)
            const anchor = anchors.dod || anchors.letters;
            if (!anchor)
                return { missingAnchor: "Date of Death (for tax year calculation)" };
            return { dueDate: nextApril15After(anchor) };
        }
        default:
            return { missingAnchor: "Unknown anchor type" };
    }
}
// ─────────────────────────────────────────────────────────────────────────────
// Public service
// ─────────────────────────────────────────────────────────────────────────────
export const DeadlineService = {
    async getDeadlines(estateId) {
        return await prisma.deadline.findMany({
            where: { estateId },
            orderBy: { dueDate: "asc" },
        });
    },
    async createDeadline(estateId, data) {
        return await prisma.deadline.create({
            data: {
                estateId,
                title: data.title,
                dueDate: data.dueDate,
                isStatutory: data.isStatutory ?? false,
                // Store rich metadata in the `status` field as a JSON string for now
                // (avoids schema migration — we parse it on read)
                status: JSON.stringify({
                    description: data.description,
                    legalBasis: data.legalBasis,
                    priority: data.priority ?? "MEDIUM",
                    ruleId: data.ruleId,
                    missingAnchor: data.missingAnchor,
                }),
            },
        });
    },
    async updateDeadline(id, estateId, data) {
        const deadline = await prisma.deadline.findFirst({ where: { id, estateId } });
        if (!deadline)
            throw new Error("Deadline not found");
        return await prisma.deadline.update({
            where: { id },
            data,
        });
    },
    async deleteDeadline(id, estateId) {
        const deadline = await prisma.deadline.findFirst({ where: { id, estateId } });
        if (!deadline)
            throw new Error("Deadline not found");
        return await prisma.deadline.delete({ where: { id } });
    },
    /**
     * generateStatutoryDeadlines
     *
     * Computes real calendar dates for all applicable statutory deadlines
     * based on:
     *   • estate.authorityType   — which of the 13 tracks
     *   • estate.deceasedState   — state-specific rule overrides
     *   • estate.deceasedDateOfDeath  — DOD anchor
     *   • estate.appointedDate   — Letters / appointment anchor (primary)
     *   • estate.authorityEffectiveDate — Letters anchor (fallback)
     *   • estate.hearingDate     — court hearing anchor
     *
     * Deadlines that cannot be computed (missing anchor date) are still
     * created but flagged with `missingAnchor` so the UI can prompt the
     * executor to provide the date.
     *
     * Skips deadlines that already exist (idempotent — safe to re-run).
     */
    async generateStatutoryDeadlines(estateId) {
        const estate = await prisma.estate.findUnique({ where: { id: estateId } });
        if (!estate)
            throw new Error("Estate not found");
        const stateCode = estate.deceasedState || "CA";
        const authorityType = estate.authorityType || "FORMAL_PROBATE";
        // Anchor dates
        const anchors = {
            dod: estate.deceasedDateOfDeath ? new Date(estate.deceasedDateOfDeath) : null,
            letters: estate.appointedDate
                ? new Date(estate.appointedDate)
                : estate.authorityEffectiveDate
                    ? new Date(estate.authorityEffectiveDate)
                    : null,
            hearing: estate.hearingDate ? new Date(estate.hearingDate) : null,
        };
        // Fetch applicable rules for this track
        const rules = getRulesForTrack(authorityType);
        // Fetch existing deadline rule IDs so we don't duplicate
        const existing = await prisma.deadline.findMany({
            where: { estateId },
            select: { status: true },
        });
        const existingRuleIds = new Set(existing
            .map((d) => {
            try {
                const meta = JSON.parse(d.status || "{}");
                return meta.ruleId;
            }
            catch {
                return undefined;
            }
        })
            .filter(Boolean));
        const created = [];
        const skipped = [];
        const pendingAnchor = [];
        for (const rule of rules) {
            // Skip already-generated rules
            if (existingRuleIds.has(rule.id)) {
                skipped.push(rule.id);
                continue;
            }
            const { title, legalBasis } = resolveStateOverride(rule, stateCode);
            const priority = rule.priority;
            const result = computeDueDate(rule, stateCode, anchors);
            if ("missingAnchor" in result && result.missingAnchor) {
                // We still create a placeholder deadline so the executor knows what's pending
                // and can enter the missing anchor date to auto-recompute
                pendingAnchor.push({
                    ruleId: rule.id,
                    title,
                    missingAnchor: result.missingAnchor,
                });
                // Create a placeholder with a far-future date (signals "not computed yet")
                const placeholder = await this.createDeadline(estateId, {
                    title: `⚠️ ${title} (date needed)`,
                    dueDate: new Date("2099-01-01"),
                    isStatutory: rule.isStatutory,
                    description: rule.description,
                    legalBasis,
                    priority,
                    ruleId: rule.id,
                    missingAnchor: result.missingAnchor,
                });
                created.push(placeholder);
            }
            else if ("dueDate" in result && result.dueDate) {
                const deadline = await this.createDeadline(estateId, {
                    title,
                    dueDate: result.dueDate,
                    isStatutory: rule.isStatutory,
                    description: rule.description,
                    legalBasis,
                    priority,
                    ruleId: rule.id,
                });
                created.push(deadline);
            }
        }
        return {
            created,
            skipped: skipped.length,
            pendingAnchorDates: pendingAnchor,
            anchorsUsed: {
                dod: anchors.dod?.toISOString() ?? null,
                letters: anchors.letters?.toISOString() ?? null,
                hearing: anchors.hearing?.toISOString() ?? null,
            },
        };
    },
    /**
     * recomputeDeadlines
     *
     * Called when the executor updates an anchor date (e.g., enters the
     * appointedDate after receiving Letters). Finds all placeholder deadlines
     * with a missingAnchor that is now available, recomputes their due dates,
     * and updates them in the database.
     */
    async recomputeDeadlines(estateId) {
        const estate = await prisma.estate.findUnique({ where: { id: estateId } });
        if (!estate)
            throw new Error("Estate not found");
        const stateCode = estate.deceasedState || "CA";
        const anchors = {
            dod: estate.deceasedDateOfDeath ? new Date(estate.deceasedDateOfDeath) : null,
            letters: estate.appointedDate
                ? new Date(estate.appointedDate)
                : estate.authorityEffectiveDate
                    ? new Date(estate.authorityEffectiveDate)
                    : null,
            hearing: estate.hearingDate ? new Date(estate.hearingDate) : null,
        };
        // Find placeholder deadlines (dueDate = 2099-01-01 = pending)
        const placeholders = await prisma.deadline.findMany({
            where: {
                estateId,
                dueDate: new Date("2099-01-01"),
            },
        });
        const updated = [];
        const { ALL_DEADLINE_RULES } = await import("../lib/deadlineRules.js");
        for (const placeholder of placeholders) {
            let meta = {};
            try {
                meta = JSON.parse(placeholder.status || "{}");
            }
            catch {
                continue;
            }
            if (!meta.ruleId)
                continue;
            const rule = ALL_DEADLINE_RULES.find((r) => r.id === meta.ruleId);
            if (!rule)
                continue;
            const result = computeDueDate(rule, stateCode, anchors);
            if ("dueDate" in result && result.dueDate) {
                const { title, legalBasis } = resolveStateOverride(rule, stateCode);
                const updatedMeta = { ...meta, missingAnchor: undefined };
                const updated_deadline = await prisma.deadline.update({
                    where: { id: placeholder.id },
                    data: {
                        title,
                        dueDate: result.dueDate,
                        status: JSON.stringify(updatedMeta),
                    },
                });
                updated.push(updated_deadline);
            }
        }
        return { recomputed: updated.length, updatedDeadlines: updated };
    },
};
