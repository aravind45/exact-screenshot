import { prisma } from "../db.js";
import { PriorityFactory } from "./priority/priorityFactory.js";
export class AccountingService {
    /**
     * Aggregates financial readiness for the accounting phase.
     */
    static async getReadiness(estateId) {
        const estate = await prisma.estate.findUnique({
            where: { id: estateId },
            select: { appointedDate: true, deceasedState: true }
        });
        if (!estate)
            throw new Error("Estate not found");
        const assets = await prisma.asset.findMany({ where: { estateId } });
        const liabilities = await prisma.liability.findMany({ where: { estateId } });
        const documents = await prisma.estateDocument.findMany({ where: { estateId } });
        // 1. Inventory Check
        const inventoryObtained = documents.some(d => d.documentType === 'INVENTORY_APPRAISAL' && d.status === 'OBTAINED');
        // 2. Asset Verification Check
        const assetsVerified = assets.length > 0 && assets.every(a => a.status !== 'DISCOVERED');
        // 3. Notice Period Check
        const system = PriorityFactory.getSystem(estate.deceasedState || "");
        let noticePeriodClosed = false;
        if (estate.appointedDate) {
            const appointed = new Date(estate.appointedDate);
            const now = new Date();
            const diffDays = Math.floor((now.getTime() - appointed.getTime()) / (1000 * 60 * 60 * 24));
            noticePeriodClosed = diffDays >= system.creditorNoticePeriodDays;
        }
        // 4. Claims Resolution Check (All approved claims must be paid)
        const claimsResolved = liabilities.every(l => l.status === 'PAID' || l.status === 'REJECTED');
        const checks = {
            inventoryObtained,
            assetsVerified,
            noticePeriodClosed,
            claimsResolved
        };
        const details = [];
        if (!inventoryObtained)
            details.push("Final Inventory & Appraisal not yet filed.");
        if (!assetsVerified)
            details.push("Some discovered assets have not been verified.");
        if (!noticePeriodClosed)
            details.push("Creditor notice period is still open.");
        if (!claimsResolved)
            details.push("There are unpaid or unresolved liabilities.");
        let status = 'INCOMPLETE';
        if (inventoryObtained && assetsVerified && noticePeriodClosed && claimsResolved) {
            status = 'READY_FOR_REVIEW';
        }
        else if (!inventoryObtained || !assetsVerified) {
            status = 'DRAFT';
        }
        else {
            status = 'INCOMPLETE';
        }
        return { status, checks, details };
    }
}
