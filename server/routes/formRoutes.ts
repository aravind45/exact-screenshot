import { Router, Request, Response } from "express";
import { prisma } from "../db.js";
import { FormService } from "../services/formService.js";
import { FORM_MAPPINGS, FORM_AUTHORITIES } from "../services/formMappings.js";
import { DistributionService } from "../services/distributionService.js";
import { AccountingService } from "../services/accountingService.js";

const router = Router();

// List all available form templates (public)
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
            } as any
        });

        // Add authority metadata
        const enriched = templates.map((t: any) => ({
            ...t,
            authorityTier: FORM_AUTHORITIES[t.name] || 'COURT_REQUIRED'
        }));

        res.json(enriched);
    } catch (error) {
        console.error("Failed to fetch form templates:", error);
        res.status(500).json({ error: "Failed to fetch form templates" });
    }
});

const getEstateId = async (userId: string) => {
    const grant = await prisma.estateGrant.findFirst({
        where: { userId },
        include: { estate: true }
    });
    if (grant) return grant.estateId;

    const estate = await prisma.estate.findFirst({ where: { userId } });
    return estate?.id;
};

router.get("/readiness", async (req: any, res: Response) => {
    try {
        const estateId = await getEstateId(req.user.id);
        if (!estateId) return res.status(404).json({ error: "Estate not found" });

        const estate = await prisma.estate.findUnique({ where: { id: estateId } });
        const accountingReadiness = await AccountingService.getReadiness(estateId);

        // Form specific logic - mapped to Authority Engines
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
                status: (estate?.status === 'APPOINTED' || estate?.status === 'SETTLEMENT') ? "READY (Letters Issued)" : "PENDING COURT ORDER",
                authorityTier: "COURT_REQUIRED"
            },
            'DE-160': {
                ready: accountingReadiness.checks.inventoryObtained || estate?.status === 'SETTLEMENT',
                reason: "Appropriate once assets have been discovered and valued.",
                status: (accountingReadiness.checks.inventoryObtained || estate?.status === 'SETTLEMENT') ? "READY (Inventory Open)" : "COLLECTING ASSETS",
                authorityTier: "COURT_REQUIRED"
            }
        };

        res.json(readiness);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

router.post("/generate", async (req: any, res: Response) => {
    try {
        const { formId, isPreview } = req.body;
        const estateId = await getEstateId(req.user.id);

        if (!estateId) {
            return res.status(404).json({ error: "Estate not found" });
        }

        const estate = await prisma.estate.findUnique({
            where: { id: estateId },
            include: { user: true }
        });

        if (!estate) {
            return res.status(404).json({ error: "Estate data not found" });
        }

        const data: Record<string, any> = {
            'estateOf': `${estate.deceasedFirstName || ''} ${estate.deceasedLastName || ''}`.toUpperCase(),
            'partyName': estate.user?.fullName || '',
            'attorneyName': estate.user?.fullName || '',
            'petitionerName': estate.user?.fullName || '', // Map user to petitioner for now
        };

        // Form-specific data
        if (formId === 'DE-160') {
            const assets = await prisma.asset.findMany({ where: { estateId } });
            const total = assets.reduce((sum, a) => sum + Number(a.inventoryValue || 0), 0);
            data['totalInventory'] = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(total);
        }

        const mapping = FORM_MAPPINGS[formId];
        if (!mapping) {
            return res.status(400).json({ error: `No mapping found for form ${formId}` });
        }

        // The FormService now handles checking DB by name or filesystem fallback
        // We use the formId (e.g. DE-111) as the template name.
        const pdfBytes = await FormService.generateOverlayPdf(formId, data, mapping);

        // Audit Trail Logging
        await DistributionService.logEvent(estateId, req.user.id, isPreview ? 'VIEWED' : 'PREPARED',
            `${isPreview ? 'PREVIEWED' : 'PREPARED'} – Draft ${formId} generated (auto-fill)`);

        res.setHeader('Content-Type', 'application/pdf');
        if (!isPreview) {
            res.setHeader('Content-Disposition', `attachment; filename="${formId}_Generated.pdf"`);
        }

        res.send(Buffer.from(pdfBytes));

    } catch (e: any) {
        console.error(`Error generating ${req.body.formId}:`, e);
        res.status(500).json({ error: e.message });
    }
});

router.get("/templates/:name/download", async (req: Request, res: Response) => {
    try {
        const name = req.params.name as string;
        const pdfBytes = await FormService.getTemplateBytes(name);

        if (!pdfBytes) {
            return res.status(404).json({ error: "Template not found" });
        }

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${name}_Template.pdf"`);

        // Audit Trail Logging
        const estateId = await getEstateId((req as any).user.id);
        if (estateId) {
            await DistributionService.logEvent(estateId, (req as any).user.id, 'VIEWED', `VIEWED – Blank ${name} accessed`);
        }

        res.send(Buffer.from(pdfBytes));
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

export default router;
