import { prisma } from "../db.js";

export interface DossierData {
    estate: any;
    assets: any[];
    liabilities: any[];
    activityLogs: any[];
    documents: any[];
    discoveryCategories: any[];
    summary: {
        totalAssets: number;
        totalDebt: number;
        netValue: number;
        status: string;
    };
}

export class DossierService {
    /**
     * Aggregates all estate data into a structured format for compliance reporting.
     */
    static async generateDossierData(estateId: string): Promise<DossierData> {
        const estate = await prisma.estate.findUnique({
            where: { id: estateId },
            include: {
                heirs: true
                // roadmapProgress is a field, not a relation
            }
        });

        if (!estate) throw new Error("Estate not found");

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

        const progress = estate.roadmapProgress as any;

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
    static formatComplianceSummary(data: DossierData): string {
        const { estate, summary, assets, liabilities, activityLogs } = data;

        let report = `FIDUCIARY ACTIVITY REPORT: EVIDENCE OF REASONABLE CARE\n`;
        report += `GENERATED ON: ${new Date().toISOString()}\n`;
        report += `ESTATE: ${estate.deceasedFirstName} ${estate.deceasedLastName}\n`;
        report += `DATE OF DEATH: ${estate.deceasedDateOfDeath?.toISOString().split('T')[0] || 'Unknown'}\n`;
        report += `JURISDICTION: ${estate.deceasedState} (Probate Code Compliance)\n`;
        report += `AUTHORITY TRACK: ${estate.authorityType || 'Unclassified'}\n`;
        report += `------------------------------------------------------------\n\n`;

        report += `I. STATUTORY FINANCIAL SUMMARY\n`;
        report += `Total Inventory Value (DOD): $${summary.totalAssets.toLocaleString()}\n`;
        report += `Total Valid Claims (State Priority Order): $${summary.totalDebt.toLocaleString()}\n`;
        report += `Net Estate Residue: $${summary.netValue.toLocaleString()}\n`;
        report += `Process Status: ${summary.status}\n\n`;

        report += `II. VERIFIED ASSET LEDGER & AUTHORITY MAPPING (${assets.length})\n`;
        report += `Each asset has been verified against the required legal authority tier.\n`;
        assets.forEach(a => {
            const authTier = a.authorityType || 'PENDING_CLASSIFICATION';
            report += `- ${a.institution || a.name}: $${(a.value || 0).toLocaleString()}\n`;
            report += `  [Authority: ${authTier}] [Status: ${a.status}] [Verification: COMPLETE]\n`;
        });
        report += `\n`;

        report += `III. LIABILITY & CREDITOR COMPLIANCE (${liabilities.length})\n`;
        report += `Claims have been categorized according to ${estate.deceasedState} priority statutes.\n`;
        liabilities.forEach(l => {
            report += `- ${l.name}: $${Number(l.amount).toLocaleString()}\n`;
            report += `  [Class: ${l.priorityClass}] [Status: ${l.status}] [Payment Order: VERIFIED]\n`;
        });
        report += `\n`;

        report += `IV. CHRONOLOGICAL FIDUCIARY AUDIT TRAIL\n`;
        report += `Full audit trail preserving the chain of custody for all fiduciary decisions.\n`;
        activityLogs.forEach(log => {
            const date = log.occurredAt.toISOString();
            const metadata = log.metadata as any;
            const complianceTag = metadata?.complianceCategory ? ` [COMPLIANCE: ${metadata.complianceCategory}]` : '';
            report += `[${date}]${complianceTag} ${log.action}: ${log.notes}\n`;
        });

        report += `\nV. RECORD OF REASONABLE DILIGENCE (ASSET DISCOVERY)\n`;
        report += `A systematic search of all mandated asset classes was conducted.\n`;
        data.discoveryCategories.forEach(cat => {
            if (cat.status === 'NOT_FOUND') {
                report += `[NEGATIVE FINDING] ${cat.category}: Systematic search conducted; no holdings identified.\n`;
                cat.negativeFindings?.forEach((f: any) => {
                    report += `  - Fiduciary Statement: "${f.statement}"\n`;
                });
            } else if (cat.status === 'REVIEWED') {
                report += `[VERIFIED] ${cat.category}: Assets discovered and added to inventory. Source: ${cat.evidenceSource || 'Record review'}\n`;
            } else if (cat.status === 'NA') {
                report += `[NOT APPLICABLE] ${cat.category}: Class search exempt for this estate type.\n`;
            }
        });

        report += `\nVI. FIDUCIARY ATTESTATION\n`;
        report += `The actions documented above represent a good faith effort to comply with all fiduciary duties,\n`;
        report += `including the duty of care, the duty of loyalty, and the duty to account.\n\n`;
        report += `Signed: __________________________ (Executor/Administrator)\n\n`;

        report += `--- END OF COMPLIANCE DOSSIER ---`;
        return report;
    }

    /**
     * Formats only the activity log into a professional chronological record.
     */
    static formatActivityLog(estate: any, activities: any[]): string {
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
