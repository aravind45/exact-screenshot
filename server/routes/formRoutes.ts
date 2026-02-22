import { Router, Request, Response } from "express";
import { prisma } from "../db.js";
import { DocumentService } from "../services/DocumentService.js";
import { FORM_AUTHORITIES, FORM_MAPPINGS } from "../services/formMappings.js";
import { DistributionService } from "../services/distributionService.js";
import { AccountingService } from "../services/accountingService.js";
import { logger } from "../lib/logger.js";
import { requireSubscription } from "../middleware/subscription.js";

const router = Router();
router.use(requireSubscription);

const getEstateId = async (userId: string) => {
    const grant = await prisma.estateGrant.findFirst({
        where: { userId },
        include: { estate: true }
    });
    if (grant) return grant.estateId;
    const estate = await prisma.estate.findFirst({ where: { userId } });
    return estate?.id;
};

// GET /api/forms/templates - List all form templates from DB
router.get("/templates", async (req: Request, res: Response) => {
    try {
        const templates = await prisma.formTemplate.findMany({
            select: {
                id: true,
                name: true,
                title: true,
                description: true,
                icon: true,
                state: true,
                category: true,
                updatedAt: true
            }
        });

        const enriched = templates.map((t: any) => ({
            ...t,
            authorityTier: FORM_AUTHORITIES[t.name] || 'COURT_REQUIRED'
        }));

        res.json(enriched);
    } catch (error: any) {
        logger.error("Failed to fetch form templates:", error.message);
        res.status(500).json({ error: "Failed to fetch form templates" });
    }
});

// GET /api/forms/readiness - Consolidated form readiness checks
router.get("/readiness", async (req: any, res: Response) => {
    try {
        const estateId = await getEstateId(req.user.id);
        if (!estateId) return res.status(404).json({ error: "Estate not found" });

        const estate = await prisma.estate.findUnique({ where: { id: estateId } });
        const accountingReadiness = await AccountingService.getReadiness(estateId);

        const readiness = {
            'DE-111': {
                ready: !!(estate?.deceasedFirstName && estate?.deceasedLastName),
                reason: "Requires decedent name and address.",
                status: !!(estate?.deceasedFirstName && estate?.deceasedLastName) ? "READY" : "LOCKED",
                authorityTier: "COURT_REQUIRED"
            },
            'DE-121': {
                ready: !!(estate?.deceasedFirstName && estate?.deceasedLastName),
                reason: "Requires decedent name and address.",
                status: !!(estate?.deceasedFirstName && estate?.deceasedLastName) ? "READY" : "LOCKED",
                authorityTier: "COURT_REQUIRED"
            },
            'DE-150': {
                ready: estate?.status === 'APPOINTED' || estate?.status === 'SETTLEMENT',
                reason: "Can be prepared once the court has issued appointment orders.",
                status: (estate?.status === 'APPOINTED' || estate?.status === 'SETTLEMENT')
                    ? "READY (Letters Issued)" : "PENDING COURT ORDER",
                authorityTier: "COURT_REQUIRED"
            },
            'DE-160': {
                ready: accountingReadiness.checks.inventoryObtained || estate?.status === 'SETTLEMENT',
                reason: "Appropriate once assets have been discovered and valued.",
                status: (accountingReadiness.checks.inventoryObtained || estate?.status === 'SETTLEMENT')
                    ? "READY (Inventory Open)" : "COLLECTING ASSETS",
                authorityTier: "COURT_REQUIRED"
            }
        };

        res.json(readiness);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

// GET /api/forms/templates/:name/download - Serve blank PDF from DB bytes
router.get("/templates/:name/download", async (req: Request, res: Response) => {
    try {
        const templateName = String(req.params.name);
        const template = await prisma.formTemplate.findUnique({
            where: { name: templateName }
        });

        if (!template) {
            return res.status(404).json({ error: `Template '${templateName}' not found` });
        }

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader(
            "Content-Disposition",
            `attachment; filename="${templateName}.pdf"`
        );
        res.send(Buffer.from(template.data));
    } catch (e: any) {
        logger.error("Failed to download template:", e.message);
        res.status(500).json({ error: "Failed to download template" });
    }
});

// POST /api/forms/generate - Generate a filled form PDF and return binary
router.post("/generate", async (req: any, res: Response) => {
    try {
        const { formId, isPreview, overrides } = req.body;
        if (!formId) return res.status(400).json({ error: "formId is required" });

        const estateId = await getEstateId(req.user.id);
        if (!estateId) return res.status(404).json({ error: "Estate not found" });

        const estate = await prisma.estate.findUnique({
            where: { id: estateId },
            include: { user: true }
        });
        if (!estate) return res.status(404).json({ error: "Estate data not found" });

        const mergedData = { ...estate, ...overrides };
        let pdfBytes: Uint8Array;

        const specializedGenerators: Record<string, Function> = {
            'DE-111': DocumentService.generateDE111,
            'DE-160': async (data: any) => {
                const assets = await prisma.asset.findMany({ where: { estateId } });
                return DocumentService.generateDE160(data, assets);
            },
            'DE-121': DocumentService.generateDE121,
            'DE-150': DocumentService.generateDE150,
            'DE-221': DocumentService.generateDE221,
            'DE-120': DocumentService.generateDE120,
            'DE-226': DocumentService.generateDE226,
            'DE-310': async (data: any) => {
                const assets = await prisma.asset.findMany({ where: { estateId } });
                const total = assets.reduce(
                    (sum: number, a: any) => sum + Number(a.inventoryValue || 0), 0
                );
                return DocumentService.generateDE310(data, total);
            },
            'DE-315': DocumentService.generateDE315,
            'DE-350': DocumentService.generateDE350,
            'DE-351': DocumentService.generateDE351,
            'DE-142': DocumentService.generateDE142,
            'DE-143': DocumentService.generateDE143,
            'DE-174': async (data: any) => {
                if (overrides?.liabilityId) {
                    const liability = await prisma.liability.findUnique({
                        where: { id: overrides.liabilityId }
                    });
                    return DocumentService.generateDE174(data, liability);
                }
                return DocumentService.generateDE174(data, {});
            }
        };

        if (specializedGenerators[formId]) {
            pdfBytes = await specializedGenerators[formId](mergedData);
        } else {
            const mapping = FORM_MAPPINGS[formId];
            if (!mapping) {
                return res.status(400).json({
                    error: `No generation path found for form ${formId}`
                });
            }

            const overlayData: Record<string, any> = {
                'estateOf': `${estate.deceasedFirstName || ''} ${estate.deceasedLastName || ''}`.toUpperCase(),
                'partyName': estate.user?.fullName || '',
                'attorneyName': estate.user?.fullName || '',
                'petitionerName': estate.user?.fullName || '',
                ...overrides
            };
            pdfBytes = await DocumentService.generateOverlayPdf(formId, overlayData, mapping);
        }

        // Log audit trail
        await DistributionService.logEvent(
            estateId,
            req.user.id,
            isPreview ? 'VIEWED' : 'PREPARED',
            `${isPreview ? 'PREVIEWED' : 'PREPARED'} – ${formId} (ProForms page)`
        );

        // Return raw PDF binary so the browser can createObjectURL from it
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader(
            "Content-Disposition",
            `${isPreview ? 'inline' : 'attachment'}; filename="${formId}.pdf"`
        );
        res.send(Buffer.from(pdfBytes));
    } catch (e: any) {
        logger.error(`Error generating form ${req.body?.formId}:`, e.message);
        res.status(500).json({ error: "Failed to generate form" });
    }
});

export default router;
