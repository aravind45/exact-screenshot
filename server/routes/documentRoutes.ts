import { Router, Request, Response } from "express";
import { prisma } from "../db.js";
import { DocumentService, FormMapping } from "../services/DocumentService.js";
import { FORM_MAPPINGS, FORM_AUTHORITIES } from "../services/formMappings.js";
import { DistributionService } from "../services/distributionService.js";
import { AccountingService } from "../services/accountingService.js";
import { z } from "zod";
import { logger } from "../lib/logger.js";
import { requireSubscription } from "../middleware/subscription.js";
import { CAFormService } from "../services/caFormService.js";
import { CA_FORM_REGISTRY, type CAFormId } from "../services/caFormRegistry.js";
import { mergeEstateFormContext } from "../lib/estateFormNormalization.js";
import { requireWriteAccess } from "../middleware/writeProtection.js";

const generateDocumentSchema = z.object({
    documentId: z.string().min(1), // Previously formId
    isPreview: z.boolean().optional(),
    overrides: z.record(z.any()).optional()
});

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

const safeLogDocumentEvent = async (
    estateId: string,
    userId: string,
    isPreview: boolean,
    notes: string,
) => {
    try {
        await DistributionService.logEvent(
            estateId,
            userId,
            isPreview ? 'VIEWED' : 'PREPARED',
            notes,
        );
    } catch (error: any) {
        logger.warn(`[documents] Failed to write settlement activity for document event: ${error?.message || error}`);
    }
};

const generateCAWithFallback = async (
    formId: CAFormId,
    estateData: any,
    assets: any[],
    heirs: any[],
    overrides?: Record<string, any>,
): Promise<Uint8Array> => {
    try {
        const normalizedEstate = mergeEstateFormContext(estateData, overrides);
        const result = await CAFormService.generate({
            formId,
            estate: normalizedEstate,
            assets,
            heirs,
            overrides,
        });
        return result.pdfBytes;
    } catch (error: any) {
        logger.error(`[documents] CA auto-fill failed for ${formId}. Falling back to legacy generator. ${error?.message || error}`);
        const mergedEstate = mergeEstateFormContext(estateData, overrides);

        switch (formId) {
            case 'DE-111':
                return DocumentService.generateDE111(mergedEstate);
            case 'DE-160':
                return DocumentService.generateDE160(mergedEstate, assets);
            case 'DE-310': {
                const total = assets.reduce((sum: number, a: any) => sum + Number(a.inventoryValue || a.value || 0), 0);
                return DocumentService.generateDE310(mergedEstate, total);
            }
            default:
                throw error;
        }
    }
};

// GET /api/documents/templates - List available templates
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
        logger.error("Failed to fetch document templates:", error.message);
        res.status(500).json({ error: "Failed to fetch document templates" });
    }
});

// GET /api/documents/readiness - Consolidated readiness checks
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

// POST /api/documents/generate - Unified generation endpoint
router.post("/generate", requireWriteAccess, async (req: any, res: Response) => {
    try {
        const validated = generateDocumentSchema.parse(req.body);
        const { documentId: requestedDocumentId, isPreview, overrides } = validated;
        const normalizedDocumentId = requestedDocumentId.trim().toUpperCase();
        const documentAliasMap: Record<string, string> = {
            NOTICE_OF_HEARING: 'DE-121',
            RECEIPT_DISTRIBUTION: 'RECEIPT_DISTRIBUTION',
        };
        const formId = documentAliasMap[normalizedDocumentId] || normalizedDocumentId;
        const estateId = await getEstateId(req.user.id);

        if (!estateId) return res.status(404).json({ error: "Estate not found" });

        const estate = await prisma.estate.findUnique({
            where: { id: estateId },
            include: { user: true, heirs: true }
        });

        if (!estate) return res.status(404).json({ error: "Estate data not found" });

        const mergedData = { ...estate, ...overrides };
        let pdfBytes: Uint8Array;

        // Check for specialised generator first.
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
                const total = assets.reduce((sum, a) => sum + Number(a.inventoryValue || 0), 0);
                return DocumentService.generateDE310(data, total);
            },
            'DE-315': DocumentService.generateDE315,
            'DE-350': DocumentService.generateDE350,
            'DE-351': DocumentService.generateDE351,
            'DE-142': DocumentService.generateDE142,
            'DE-143': DocumentService.generateDE143,
            'DE-154': DocumentService.generateDE154,
            'DE-115': DocumentService.generateDE115,
            'DE-116': DocumentService.generateDE116,
            'DE-295': DocumentService.generateDE295,
            'DE-165': DocumentService.generateDE165,
            'DE-260': DocumentService.generateDE260,
            'DE-265': DocumentService.generateDE265,
            'RECEIPT_DISTRIBUTION': async (data: any) => {
                const beneficiaryName = overrides?.beneficiaryName || data?.beneficiaryName;
                return DocumentService.generateReceiptOfDistribution(data, beneficiaryName);
            },
            'DE-174': async (data: any) => {
                // If overrides contains a liabilityId, fetch it.
                if (overrides?.liabilityId) {
                    const liability = await prisma.liability.findUnique({ where: { id: overrides.liabilityId } });
                    return DocumentService.generateDE174(data, liability);
                }
                return DocumentService.generateDE174(data, {});
            }
        };

        const isCARegistryForm = Object.prototype.hasOwnProperty.call(CA_FORM_REGISTRY, formId);

        if (isCARegistryForm) {
            const assets = await prisma.asset.findMany({ where: { estateId } });
            const heirs = Array.isArray((estate as any).heirs)
                ? (estate as any).heirs
                : await prisma.heir.findMany({ where: { estateId } });
            pdfBytes = await generateCAWithFallback(
                formId as CAFormId,
                mergedData,
                assets,
                heirs,
                overrides,
            );
        } else if (specializedGenerators[formId]) {
            pdfBytes = await specializedGenerators[formId](mergedData);
        } else {
            // Fallback to Overlay processing
            const mapping = FORM_MAPPINGS[formId];
            if (!mapping) {
                return res.status(400).json({ error: `No generation path found for document ${formId}` });
            }

            // Prepare baseline data for overlay
            const overlayData: Record<string, any> = {
                'estateOf': `${estate.deceasedFirstName || ''} ${estate.deceasedLastName || ''}`.toUpperCase(),
                'partyName': estate.user?.fullName || '',
                'attorneyName': estate.user?.fullName || '',
                'petitionerName': estate.user?.fullName || '',
                ...overrides
            };

            pdfBytes = await DocumentService.generateOverlayPdf(formId, overlayData, mapping);
        }

        // Audit Trail Logging
        await safeLogDocumentEvent(estateId, req.user.id, !!isPreview, `${isPreview ? 'PREVIEWED' : 'PREPARED'} – ${formId} document generated (auto-fill)`);

        // Return Base64 as the standard response contract
        const base64Pdf = Buffer.from(pdfBytes).toString('base64');
        res.json({
            documentId: formId,
            pdfBase64: base64Pdf,
            mimeType: 'application/pdf',
            filename: `${formId}_Generated.pdf`
        });

    } catch (e: any) {
        if (e instanceof z.ZodError) return res.status(400).json({ error: "Invalid document request", details: e.errors });
        logger.error(`Error generating ${req.body.documentId}:`, e.message);
        res.status(500).json({ error: "Failed to generate document" });
    }
});

export default router;
