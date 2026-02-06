import { prisma } from "../db.js";
import { PriorityFactory } from "./priority/priorityFactory.js";
import { AuditService } from "../services/auditService.js";
export class DistributionService {
    /**
     * Checks if the estate is legally ready for final distribution.
     */
    static async checkReadiness(estateId) {
        const estate = await prisma.estate.findUnique({
            where: { id: estateId },
            select: { appointedDate: true, deceasedState: true }
        });
        if (!estate)
            throw new Error("Estate not found");
        const liabilities = await prisma.liability.findMany({ where: { estateId } });
        const documents = await prisma.estateDocument.findMany({ where: { estateId } });
        const assets = await prisma.asset.findMany({ where: { estateId } });
        // 1. Notice Period Check
        const system = PriorityFactory.getSystem(estate.deceasedState || "CA");
        let noticePeriodClosed = false;
        let daysRemaining = system.creditorNoticePeriodDays;
        if (estate.appointedDate) {
            const appointed = new Date(estate.appointedDate);
            const now = new Date();
            const diffDays = Math.floor((now.getTime() - appointed.getTime()) / (1000 * 60 * 60 * 24));
            daysRemaining = Math.max(0, system.creditorNoticePeriodDays - diffDays);
            noticePeriodClosed = daysRemaining === 0;
        }
        // 2. Claims Paid Check
        const allClaimsPaid = liabilities.every(l => l.status === "PAID");
        // 3. Inventory Filed Check
        const inventoryFiled = documents.some(d => d.documentType === 'INVENTORY_APPRAISAL' && d.status === 'OBTAINED');
        // 4. Assets Verified Check
        const assetsVerified = assets.length > 0 && assets.every(a => a.status !== 'DISCOVERED' && a.status !== 'LOCKED');
        // 5. Accounting Complete Check
        const accountingComplete = documents.some(d => d.documentType === 'FINAL_ACCOUNTING' && d.status === 'OBTAINED');
        // 6. Minor Beneficiary Check (Gap 11)
        const heirs = await prisma.heir.findMany({ where: { estateId } });
        const hasMinors = heirs.some(h => h.isAdult === false);
        const blockedAccountVerified = documents.some(d => d.documentType === 'BLOCKED_ACCOUNT_PROOF' && d.status === 'OBTAINED');
        const reasons = [];
        if (!noticePeriodClosed)
            reasons.push(`Creditor notice period is still open (${daysRemaining} days remaining).`);
        if (!allClaimsPaid)
            reasons.push("There are unpaid liabilities or unresolved claims.");
        if (!inventoryFiled)
            reasons.push("Final Inventory & Appraisal has not been filed with the court.");
        if (!assetsVerified)
            reasons.push("Some assets are still in 'Discovered' or 'Locked' status and must be verified.");
        if (!accountingComplete)
            reasons.push("Final Accounting has not been completed or verified.");
        let minorCheckPassed = true;
        if (hasMinors && !blockedAccountVerified) {
            reasons.push("Minor beneficiary detected. Court-approved BLOCKED ACCOUNT evidence is required before distribution.");
            minorCheckPassed = false;
        }
        const isAllowed = noticePeriodClosed && allClaimsPaid && inventoryFiled && assetsVerified && accountingComplete && minorCheckPassed;
        return {
            allowed: isAllowed,
            status: isAllowed ? 'ALLOWED' : (noticePeriodClosed ? (minorCheckPassed && accountingComplete ? 'BLOCKED' : 'RESTRICTED') : 'RESTRICTED'),
            reasons,
            checks: {
                noticePeriodClosed,
                allClaimsPaid,
                inventoryFiled,
                assetsVerified,
                accountingComplete
            },
            daysRemaining
        };
    }
    /**
     * Logs exact executor-grade language for the Settlement Trail.
     */
    static async logEvent(estateId, userId, eventType, customNotes) {
        let notes = customNotes || "";
        switch (eventType) {
            case 'DISTRIBUTION_RESTRICTED':
                notes = "DISTRIBUTION RESTRICTED – Legal prerequisites not yet satisfied";
                break;
            case 'DISTRIBUTION_ALLOWED':
                notes = "DISTRIBUTION ALLOWED – All required prerequisites satisfied";
                break;
            case 'REVIEW_INITIATED':
                notes = "REVIEW INITIATED – Preparing final distribution for review";
                break;
            case 'EXECUTOR_FEES_CALCULATED':
                notes = "CALCULATED – Executor statutory compensation determined per state rules";
                break;
            case 'ATTORNEY_FEES_RECORDED':
                notes = customNotes || "RECORDED – Attorney fees entered for final accounting";
                break;
            case 'RESIDUE_GENERATED':
                notes = "GENERATED – Residue auto-assigned based on estate inputs";
                break;
            case 'PLAN_REVIEWED':
                notes = "REVIEWED – Final distribution plan reviewed by executor";
                break;
            case 'DOSSIER_GENERATED':
                notes = "GENERATED – Fiduciary activity report prepared for review";
                break;
            case 'AFFIRMED':
                notes = "AFFIRMED – Executor confirmed accuracy of distribution under penalty of perjury";
                break;
            case 'AUTHORIZED':
                notes = "AUTHORIZED – Final distribution approved for execution";
                break;
            case 'EXECUTED':
                notes = "EXECUTED – Estate assets distributed according to final plan";
                break;
            case 'BLOCKED_ATTEMPT':
                notes = "BLOCKED – Distribution attempt prevented due to unmet legal requirements";
                break;
        }
        return await AuditService.logActivity(estateId, userId, 'ROADMAP', 'UPDATED', notes, { phase: 'DISTRIBUTION' });
    }
}
