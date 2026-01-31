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

        let report = `ESTATE COMPLIANCE DOSSIER: ${estate.deceasedFirstName} ${estate.deceasedLastName}\n`;
        report += `DATE OF DEATH: ${estate.deceasedDateOfDeath.toISOString().split('T')[0]}\n`;
        report += `JURISDICTION: ${estate.deceasedState}\n`;
        report += `AUTHORITY TRACK: ${estate.authorityType}\n`;
        report += `-------------------------------------------\n\n`;

        report += `FINANCIAL SUMMARY\n`;
        report += `Total Inventory Value: $${summary.totalAssets.toLocaleString()}\n`;
        report += `Total Valid Claims: $${summary.totalDebt.toLocaleString()}\n`;
        report += `Net Estate Value: $${summary.netValue.toLocaleString()}\n`;
        report += `Status: ${summary.status}\n\n`;

        report += `ASSET LEDGER (${assets.length})\n`;
        assets.forEach(a => {
            report += `- ${a.institution}: $${(a.value || 0).toLocaleString()} [${a.status}]\n`;
        });
        report += `\n`;

        report += `LIABILITY & CREDITOR LOG (${liabilities.length})\n`;
        liabilities.forEach(l => {
            report += `- ${l.name}: $${Number(l.amount).toLocaleString()} [${l.status}] - Priority: ${l.priorityClass}\n`;
        });
        report += `\n`;

        report += `FIDUCIARY ACTIVITY TRAIL\n`;
        activityLogs.slice(0, 10).forEach(log => {
            report += `[${log.occurredAt.toISOString()}] ${log.action} - ${log.notes}\n`;
        });

        report += `ASSET DISCOVERY & DILIGENCE LOG\n`;
        data.discoveryCategories.forEach(cat => {
            if (cat.status === 'NOT_FOUND') {
                report += `[NOT FOUND] ${cat.category}: Systematically searched. Findings: negative.\n`;
                cat.negativeFindings?.forEach((f: any) => {
                    report += `  - Assurance statement: "${f.statement}"\n`;
                });
            } else if (cat.status === 'REVIEWED') {
                report += `[REVIEWED] ${cat.category}: Assets discovered and logged. Evidence: ${cat.evidenceSource || 'Records examined'}\n`;
            } else if (cat.status === 'NA') {
                report += `[N/A] ${cat.category}: Not applicable to this estate.\n`;
            }
        });

        report += `\n--- END OF DOSSIER ---`;
        return report;
    }
}
