import { prisma } from "../db.js";
import { discoverRelatedAssets, analyzeDocument, generateCommunicationDraft } from "./ai.js";
import { enrichInstitutionData } from "./enrichment.js";

export class AgentService {
    /**
     * The Watchdog: Scans all active assets and identifies those in the "14-day black hole".
     */
    static async runWatchdogScan(estateId: string) {
        const assets = await prisma.asset.findMany({
            where: {
                estateId,
                status: { notIn: ["CLOSED", "DISTRIBUTED"] },
                lastContactDate: {
                    lt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
                }
            }
        });

        const insights = assets.map(asset => ({
            assetId: asset.id,
            type: "ESCALATION_RECOMMENDED",
            title: `Limbo Alert: ${asset.institution}`,
            message: `It has been over 14 days since the last contact. Statistical data for ${asset.institution} suggests an escalation is now required to prevent further delays.`,
            priority: "high"
        }));

        return insights;
    }

    /**
     * The Concierge: Finds missing data for a new asset and prepares the first step.
     */
    static async runConciergeEnrichment(assetId: string) {
        const asset = await prisma.asset.findUnique({ where: { id: assetId } });
        if (!asset || !asset.institution) return null;

        const enriched = await enrichInstitutionData(asset.institution);

        if (enriched?.extracted) {
            await prisma.asset.update({
                where: { id: assetId },
                data: {
                    institutionPhone: enriched.extracted.institutionPhone || asset.institutionPhone,
                    institutionFax: enriched.extracted.institutionFax || asset.institutionFax,
                    institutionEmail: enriched.extracted.institutionEmail || asset.institutionEmail,
                    institutionUrl: enriched.sourceUrl || asset.institutionUrl,
                    institutionAddress: enriched.extracted.mailingAddress || asset.institutionAddress,
                }
            });

            return {
                type: "DATA_ENRICHED",
                message: `I've automatically located the ${asset.institution} estate unit contact details and updated your asset record.`,
            };
        }

        return null;
    }

    /**
     * The Detective: Deep scan of a document to find hidden assets.
     */
    static async runDetectiveDiscovery(text: string, estateId: string) {
        const clues = await discoverRelatedAssets(text);

        const findings = clues.filter(c => c.confidence >= 0.7).map(clue => ({
            type: "HIDDEN_ASSET_DISCOVERED",
            title: `Potential Asset Found`,
            message: `While scanning your document, I found a clue pointing to a ${clue.potentialAsset} at ${clue.institution}. Evidence: "${clue.sourceClue}"`,
            data: {
                institution: clue.institution,
                type: clue.potentialAsset,
                confidence: clue.confidence
            }
        }));

        return findings;
    }
}
