import { prisma } from "../db.js";
export class DossierService {
    /**
     * Aggregates all estate data into a structured format for compliance reporting.
     */
    static async generateDossierData(estateId) {
        const estate = await prisma.estate.findUnique({
            where: { id: estateId },
            include: {
                heirs: true
                // roadmapProgress is a field, not a relation
            }
        });
        if (!estate)
            throw new Error("Estate not found");
        const assets = await prisma.asset.findMany({ where: { estateId } });
        const liabilities = await prisma.liability.findMany({ where: { estateId } });
        const activityLogs = await prisma.settlementActivity.findMany({
            where: { estateId },
            orderBy: { occurredAt: "desc" }
        });
        const documents = await prisma.estateDocument.findMany({ where: { estateId } });
        const totalAssets = assets.reduce((sum, a) => sum + (a.value || 0), 0);
        const totalDebt = liabilities.reduce((sum, l) => sum + Number(l.amount), 0);
        const discoveryCategories = await prisma.discoveryCategory.findMany({
            where: { estateId },
            include: { negativeFindings: true }
        });
        const progress = estate.roadmapProgress;
        return {
            estate,
            assets,
            liabilities,
            activityLogs,
            documents,
            discoveryCategories,
            summary: {
                totalAssets,
                totalDebt,
                netValue: totalAssets - totalDebt,
                status: (progress?.completedPhases?.length === 6) ? "CLOSED" : "IN_PROGRESS"
            }
        };
    }
    /**
     * Formats the dossier data into a human-readable text report (mocking PDF/Export).
     */
    static formatComplianceSummary(data) {
        const { estate, summary, assets, liabilities, activityLogs } = data;
        let report = `FIDUCIARY ACTIVITY REPORT: EVIDENCE OF REASONABLE CARE\n`;
        report += `ESTATE: ${estate.deceasedFirstName} ${estate.deceasedLastName}\n`;
        report += `DATE OF DEATH: ${estate.deceasedDateOfDeath.toISOString().split('T')[0]}\n`;
        report += `JURISDICTION: ${estate.deceasedState} (Probate Code Compliance)\n`;
        report += `AUTHORITY TRACK: ${estate.authorityType}\n`;
        report += `-------------------------------------------\n\n`;
        report += `STATUTORY INVENTORY SUMMARY\n`;
        report += `Total Inventory Value: $${summary.totalAssets.toLocaleString()}\n`;
        report += `Total Valid Claims (State Priority Order): $${summary.totalDebt.toLocaleString()}\n`;
        report += `Net Estate Value: $${summary.netValue.toLocaleString()}\n`;
        report += `Process Status: ${summary.status}\n\n`;
        report += `VERIFIED ASSET LEDGER (${assets.length})\n`;
        assets.forEach(a => {
            report += `- ${a.institution}: $${(a.value || 0).toLocaleString()} [Verified Status: ${a.status}]\n`;
        });
        report += `\n`;
        report += `LIABILITY & CREDITOR LOG (${liabilities.length})\n`;
        report += `All claims categorized and reviewed per state priority statutes.\n`;
        liabilities.forEach(l => {
            report += `- ${l.name}: $${Number(l.amount).toLocaleString()} [${l.status}] - Class: ${l.priorityClass}\n`;
        });
        report += `\n`;
        report += `FIDUCIARY ACTIVITY TRAIL (Diligence Record)\n`;
        activityLogs.slice(0, 10).forEach(log => {
            report += `[${log.occurredAt.toISOString()}] ${log.action}: ${log.notes}\n`;
        });
        report += `\nRECORD OF REASONABLE DILIGENCE (ASSET DISCOVERY)\n`;
        report += `A systematic search of all mandated asset classes was conducted.\n`;
        data.discoveryCategories.forEach(cat => {
            if (cat.status === 'NOT_FOUND') {
                report += `[NEGATIVE FINDING] ${cat.category}: Systematic search conducted; no holdings identified.\n`;
                cat.negativeFindings?.forEach((f) => {
                    report += `  - Fiduciary Statement: "${f.statement}"\n`;
                });
            }
            else if (cat.status === 'REVIEWED') {
                report += `[VERIFIED] ${cat.category}: Assets discovered and added to inventory. Source: ${cat.evidenceSource || 'Record review'}\n`;
            }
            else if (cat.status === 'NA') {
                report += `[NOT APPLICABLE] ${cat.category}: Class search exempt for this estate type.\n`;
            }
        });
        report += `\n--- END OF FIDUCIARY REPORT ---`;
        return report;
    }
    /**
     * Formats only the activity log into a professional chronological record.
     */
    static formatActivityLog(estate, activities) {
        let report = `SETTLEMENT TRAIL: CHRONOLOGICAL FIDUCIARY RECORD\n`;
        report += `ESTATE: ${estate.deceasedFirstName} ${estate.deceasedLastName}\n`;
        report += `SYSTEM OF RECORD: ExpectedEstate\n`;
        report += `EXPORTED ON: ${new Date().toISOString().split('T')[0]}\n`;
        report += `-------------------------------------------\n\n`;
        report += `This log provides a timestamped audit trail of all fiduciary actions taken during the estate settlement process. It is intended to serve as evidence of reasonable care and procedural compliance for review by heirs, attorneys, or the probate court.\n\n`;
        activities.forEach(log => {
            const date = new Date(log.occurredAt).toLocaleString();
            const phaseStr = log.phase ? ` [Phase: ${log.phase.replace(/_/g, ' ')}]` : '';
            report += `[${date}]${phaseStr} ${log.action}: ${log.notes}\n`;
        });
        report += `\n--- END OF SETTLEMENT TRAIL ---`;
        return report;
    }
}
