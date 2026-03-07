import { Router, Request, Response } from "express";
import { prisma } from "../db.js";
import { DocumentService } from "../services/DocumentService.js";
import { FORM_AUTHORITIES, FORM_MAPPINGS } from "../services/formMappings.js";
import { DistributionService } from "../services/distributionService.js";
import { AccountingService } from "../services/accountingService.js";
import { logger } from "../lib/logger.js";
import { requireSubscription } from "../middleware/subscription.js";
import { CAFormService } from "../services/caFormService.js";
import { CA_FORM_REGISTRY, CA_FORM_TITLES, type CAFormId } from "../services/caFormRegistry.js";
import { NYFormService } from "../services/nyFormService.js";
import { NY_FORM_REGISTRY, NY_FORM_TITLES, type NYFormId } from "../services/nyFormRegistry.js";
import { TXFormService } from "../services/txFormService.js";
import { TX_FORM_REGISTRY, TX_FORM_TITLES, type TXFormId } from "../services/txFormRegistry.js";
import { FLFormService } from "../services/flFormService.js";
import { FL_FORM_REGISTRY, FL_FORM_TITLES, type FLFormId } from "../services/flFormRegistry.js";
import { NJFormService } from "../services/njFormService.js";
import { NJ_FORM_REGISTRY, NJ_FORM_TITLES, type NJFormId } from "../services/njFormRegistry.js";

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

// GET /api/forms/readiness - Consolidated form readiness checks (multi-state)
router.get("/readiness", async (req: any, res: Response) => {
    try {
        const estateId = await getEstateId(req.user.id);
        if (!estateId) return res.status(404).json({ error: "Estate not found" });

        const estate = await prisma.estate.findUnique({ where: { id: estateId } });
        const accountingReadiness = await AccountingService.getReadiness(estateId);

        const hasDecedentInfo = !!(estate?.deceasedFirstName && estate?.deceasedLastName);
        const isAppointed = estate?.status === 'APPOINTED' || estate?.status === 'SETTLEMENT';
        const hasInventory = accountingReadiness.checks.inventoryObtained || estate?.status === 'SETTLEMENT';
        const estateState = (estate as any)?.deceasedState || '';

        // --- Helper to build a standard readiness entry ---
        const entry = (ready: boolean, reason: string, statusYes: string, statusNo: string, tier = "COURT_REQUIRED") => ({
            ready,
            reason,
            status: ready ? statusYes : statusNo,
            authorityTier: tier
        });

        // --- California (DE-*) ---
        const caReadiness: Record<string, any> = {
            'DE-111': entry(hasDecedentInfo, "Requires decedent name and address.", "READY", "LOCKED"),
            'DE-121': entry(hasDecedentInfo, "Requires decedent name and address.", "READY", "LOCKED"),
            'DE-150': entry(isAppointed, "Can be prepared once the court has issued appointment orders.", "READY (Letters Issued)", "PENDING COURT ORDER"),
            'DE-160': entry(hasInventory, "Appropriate once assets have been discovered and valued.", "READY (Inventory Open)", "COLLECTING ASSETS"),
        };

        // --- New York (ET-*) ---
        const nyReadiness: Record<string, any> = {
            'ET-1': entry(hasDecedentInfo, "Requires decedent name, address, and date of death.", "READY", "LOCKED"),
            'ET-2': entry(hasDecedentInfo, "Requires decedent and heir information.", "READY", "LOCKED"),
            'ET-3': entry(hasDecedentInfo, "Requires decedent name and domicile.", "READY", "LOCKED"),
            'ET-4': entry(isAppointed, "Requires Letters Testamentary or Administration to be issued.", "READY (Letters Issued)", "PENDING COURT ORDER"),
            'ET-5': entry(isAppointed, "Requires court appointment before filing.", "READY", "PENDING COURT ORDER"),
            'ET-6': entry(isAppointed, "Can be prepared after appointment.", "READY", "PENDING COURT ORDER"),
            'ET-7': entry(hasInventory, "Appropriate once assets have been discovered and valued.", "READY (Inventory Open)", "COLLECTING ASSETS"),
            'ET-8': entry(isAppointed, "Requires Letters to be issued for creditor notice.", "READY", "PENDING COURT ORDER"),
            'ET-9': entry(hasInventory, "Requires accounting data from estate administration.", "READY", "COLLECTING DATA"),
            'ET-10': entry(hasInventory, "Requires accounting data.", "READY", "COLLECTING DATA"),
            'ET-11': entry(hasInventory, "Requires estate accounting to be completed.", "READY", "COLLECTING DATA"),
            'ET-12': entry(hasInventory, "Requires final accounting.", "READY", "COLLECTING DATA"),
            'ET-13': entry(hasDecedentInfo, "Requires estate value information.", "READY", "LOCKED"),
            'ET-14': entry(hasDecedentInfo, "Small estate affidavit — requires decedent info and asset values.", "READY", "LOCKED", "AFFIDAVIT_SMALL"),
            'ET-15': entry(hasDecedentInfo, "Voluntary administration affidavit.", "READY", "LOCKED", "AFFIDAVIT_SMALL"),
        };

        // --- Texas (TX-*) ---
        const txReadiness: Record<string, any> = {
            'TX-1': entry(hasDecedentInfo, "Requires decedent name, date of death, and county.", "READY", "LOCKED"),
            'TX-2': entry(hasDecedentInfo, "Requires decedent and heir information.", "READY", "LOCKED"),
            'TX-3': entry(hasDecedentInfo, "Requires will and decedent information.", "READY", "LOCKED"),
            'TX-4': entry(isAppointed, "Requires court appointment.", "READY (Letters Issued)", "PENDING COURT ORDER"),
            'TX-5': entry(hasInventory, "Requires asset inventory data.", "READY (Inventory Open)", "COLLECTING ASSETS"),
            'TX-6': entry(isAppointed, "Requires Letters Testamentary.", "READY", "PENDING COURT ORDER"),
            'TX-7': entry(isAppointed, "Requires appointment for creditor notice.", "READY", "PENDING COURT ORDER"),
            'TX-8': entry(hasInventory, "Requires estate accounting.", "READY", "COLLECTING DATA"),
            'TX-9': entry(hasInventory, "Requires final accounting.", "READY", "COLLECTING DATA"),
            'TX-10': entry(hasInventory, "Requires completed administration for closing.", "READY", "COLLECTING DATA"),
            'TX-11': entry(hasDecedentInfo, "Small estate affidavit — requires decedent info and asset values.", "READY", "LOCKED", "AFFIDAVIT_SMALL"),
            'TX-12': entry(hasDecedentInfo, "Requires estate and beneficiary info for Muniment of Title.", "READY", "LOCKED"),
        };

        // --- Florida (FL-*) ---
        const flReadiness: Record<string, any> = {
            'FL-1': entry(hasDecedentInfo, "Requires decedent name, date of death, and county.", "READY", "LOCKED"),
            'FL-2': entry(hasDecedentInfo, "Summary administration — requires decedent info and estate value.", "READY", "LOCKED", "AFFIDAVIT_SMALL"),
            'FL-3': entry(hasDecedentInfo, "Requires decedent and estate information.", "READY", "LOCKED"),
            'FL-4': entry(isAppointed, "Requires court appointment.", "READY (Letters Issued)", "PENDING COURT ORDER"),
            'FL-5': entry(hasDecedentInfo, "Requires will and decedent information.", "READY", "LOCKED"),
            'FL-6': entry(isAppointed, "Requires Letters of Administration.", "READY", "PENDING COURT ORDER"),
            'FL-7': entry(isAppointed, "Requires appointment for creditor notice.", "READY", "PENDING COURT ORDER"),
            'FL-8': entry(hasInventory, "Requires asset inventory data.", "READY (Inventory Open)", "COLLECTING ASSETS"),
            'FL-9': entry(hasInventory, "Requires estate accounting data.", "READY", "COLLECTING DATA"),
            'FL-10': entry(hasInventory, "Requires accounting data.", "READY", "COLLECTING DATA"),
            'FL-11': entry(hasInventory, "Requires final accounting.", "READY", "COLLECTING DATA"),
            'FL-12': entry(hasInventory, "Requires completed administration for closing.", "READY", "COLLECTING DATA"),
            'FL-13': entry(hasDecedentInfo, "Requires estate and beneficiary info.", "READY", "LOCKED"),
            'FL-14': entry(hasDecedentInfo, "Disposition without administration affidavit.", "READY", "LOCKED", "AFFIDAVIT_SMALL"),
            'FL-15': entry(hasDecedentInfo, "Requires estate information for family allowance.", "READY", "LOCKED"),
        };

        // --- New Jersey (NJ-*) ---
        const njReadiness: Record<string, any> = {
            'NJ-1': entry(hasDecedentInfo, "Requires decedent information.", "READY", "LOCKED"),
            'NJ-2': entry(hasDecedentInfo, "Requires petitioner and decedent information.", "READY", "LOCKED"),
        };

        // Return readiness for the estate's state, or all states if query param requests it
        const requestedState = (req.query.state as string)?.toUpperCase() || estateState;

        const stateMap: Record<string, Record<string, any>> = {
            CA: caReadiness,
            NY: nyReadiness,
            TX: txReadiness,
            FL: flReadiness,
            NJ: njReadiness
        };

        // Always include the estate's state; if "all" requested, merge everything
        let readiness: Record<string, any>;
        if (requestedState === 'ALL') {
            readiness = { ...caReadiness, ...nyReadiness, ...txReadiness, ...flReadiness, ...njReadiness };
        } else {
            readiness = stateMap[requestedState] || caReadiness;
        }

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
            include: { user: true, heirs: true }
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

        const isCARegistryForm = Object.prototype.hasOwnProperty.call(CA_FORM_REGISTRY, formId);

        if (isCARegistryForm) {
            const assets = await prisma.asset.findMany({ where: { estateId } });
            const heirs = estate.heirs || await prisma.heir.findMany({ where: { estateId } });
            const caResult = await CAFormService.generate({
                formId: formId as CAFormId,
                estate: mergedData,
                assets,
                heirs,
                overrides,
            });
            pdfBytes = caResult.pdfBytes;
        } else if (specializedGenerators[formId]) {
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

// ── CA Form Auto-Fill Endpoints ───────────────────────────────────────────────

// GET /api/forms/ca/schema/:formId - Return UI field schema for a CA form
router.get("/ca/schema/:formId", async (req: Request, res: Response) => {
    try {
        const formId = req.params.formId as CAFormId;
        if (!CA_FORM_REGISTRY[formId]) {
            return res.status(404).json({ error: `No schema found for form ${formId}` });
        }
        const schema = CAFormService.getUISchema(formId);
        res.json({ formId, title: CA_FORM_TITLES[formId] || formId, schema });
    } catch (e: any) {
        logger.error(`Error fetching CA form schema for ${req.params.formId}:`, e.message);
        res.status(500).json({ error: "Failed to fetch form schema" });
    }
});

// POST /api/forms/ca/preview - Resolve field values without generating PDF (for UI preview)
router.post("/ca/preview", async (req: any, res: Response) => {
    try {
        const { formId, overrides = {} } = req.body;
        if (!formId) return res.status(400).json({ error: "formId is required" });
        if (!CA_FORM_REGISTRY[formId as CAFormId]) {
            return res.status(400).json({ error: `Unsupported CA form: ${formId}` });
        }

        const estateId = await getEstateId(req.user.id);
        if (!estateId) return res.status(404).json({ error: "Estate not found" });

        const estate = await prisma.estate.findUnique({
            where: { id: estateId },
            include: { user: true, heirs: true },
        });
        if (!estate) return res.status(404).json({ error: "Estate data not found" });

        const assets = await prisma.asset.findMany({ where: { estateId } });

        const { fieldValues, validationErrors } = CAFormService.resolveFields({
            formId: formId as CAFormId,
            estate: { ...estate, ...overrides },
            assets,
            overrides,
        });

        res.json({ formId, fieldValues, validationErrors });
    } catch (e: any) {
        logger.error(`Error previewing CA form ${req.body?.formId}:`, e.message);
        res.status(500).json({ error: "Failed to preview form fields" });
    }
});

// POST /api/forms/ca/generate - Generate and return filled CA form PDF
router.post("/ca/generate", async (req: any, res: Response) => {
    try {
        const { formId, isPreview = false, overrides = {} } = req.body;
        if (!formId) return res.status(400).json({ error: "formId is required" });
        if (!CA_FORM_REGISTRY[formId as CAFormId]) {
            return res.status(400).json({ error: `Unsupported CA form: ${formId}` });
        }

        const estateId = await getEstateId(req.user.id);
        if (!estateId) return res.status(404).json({ error: "Estate not found" });

        const estate = await prisma.estate.findUnique({
            where: { id: estateId },
            include: { user: true, heirs: true },
        });
        if (!estate) return res.status(404).json({ error: "Estate data not found" });

        const assets = await prisma.asset.findMany({ where: { estateId } });
        const heirs = await prisma.heir.findMany({ where: { estateId } });

        const result = await CAFormService.generate({
            formId: formId as CAFormId,
            estate,
            assets,
            heirs,
            overrides,
        });

        await DistributionService.logEvent(
            estateId,
            req.user.id,
            isPreview ? 'VIEWED' : 'PREPARED',
            `${isPreview ? 'PREVIEWED' : 'PREPARED'} – ${formId} (CA Auto-Fill)`,
        );

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader(
            "Content-Disposition",
            `${isPreview ? 'inline' : 'attachment'}; filename="${formId}.pdf"`,
        );
        res.send(Buffer.from(result.pdfBytes));
    } catch (e: any) {
        logger.error(`Error generating CA form ${req.body?.formId}:`, e.message);
        res.status(500).json({ error: "Failed to generate CA form" });
    }
});

// ── NY Form Auto-Fill Endpoints ───────────────────────────────────────────────

// GET /api/forms/ny/schema/:formId - Return UI field schema for a NY form
router.get("/ny/schema/:formId", async (req: Request, res: Response) => {
    try {
        const formId = req.params.formId as NYFormId;
        if (!NY_FORM_REGISTRY[formId]) {
            return res.status(404).json({ error: `No schema found for form ${formId}` });
        }
        const schema = NYFormService.getUISchema(formId);
        res.json({ formId, title: NY_FORM_TITLES[formId] || formId, schema });
    } catch (e: any) {
        logger.error(`Error fetching NY form schema for ${req.params.formId}:`, e.message);
        res.status(500).json({ error: "Failed to fetch form schema" });
    }
});

// POST /api/forms/ny/preview - Resolve field values without generating PDF (for UI preview)
router.post("/ny/preview", async (req: any, res: Response) => {
    try {
        const { formId, overrides = {} } = req.body;
        if (!formId) return res.status(400).json({ error: "formId is required" });
        if (!NY_FORM_REGISTRY[formId as NYFormId]) {
            return res.status(400).json({ error: `Unsupported NY form: ${formId}` });
        }

        const estateId = await getEstateId(req.user.id);
        if (!estateId) return res.status(404).json({ error: "Estate not found" });

        const estate = await prisma.estate.findUnique({
            where: { id: estateId },
            include: { user: true, heirs: true },
        });
        if (!estate) return res.status(404).json({ error: "Estate data not found" });

        const assets = await prisma.asset.findMany({ where: { estateId } });
        const heirs = await prisma.heir.findMany({ where: { estateId } });

        const { fieldValues, validationErrors } = NYFormService.resolveFields({
            formId: formId as NYFormId,
            estate: { ...estate, ...overrides },
            assets,
            heirs,
            overrides,
        });

        res.json({ formId, fieldValues, validationErrors });
    } catch (e: any) {
        logger.error(`Error previewing NY form ${req.body?.formId}:`, e.message);
        res.status(500).json({ error: "Failed to preview form fields" });
    }
});

// POST /api/forms/ny/generate - Generate and return filled NY form PDF
router.post("/ny/generate", async (req: any, res: Response) => {
    try {
        const { formId, isPreview = false, overrides = {} } = req.body;
        if (!formId) return res.status(400).json({ error: "formId is required" });
        if (!NY_FORM_REGISTRY[formId as NYFormId]) {
            return res.status(400).json({ error: `Unsupported NY form: ${formId}` });
        }

        const estateId = await getEstateId(req.user.id);
        if (!estateId) return res.status(404).json({ error: "Estate not found" });

        const estate = await prisma.estate.findUnique({
            where: { id: estateId },
            include: { user: true, heirs: true },
        });
        if (!estate) return res.status(404).json({ error: "Estate data not found" });

        const assets = await prisma.asset.findMany({ where: { estateId } });
        const heirs = await prisma.heir.findMany({ where: { estateId } });

        const result = await NYFormService.generate({
            formId: formId as NYFormId,
            estate,
            assets,
            heirs,
            overrides,
        });

        await DistributionService.logEvent(
            estateId,
            req.user.id,
            isPreview ? 'VIEWED' : 'PREPARED',
            `${isPreview ? 'PREVIEWED' : 'PREPARED'} – ${formId} (NY Auto-Fill)`,
        );

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader(
            "Content-Disposition",
            `${isPreview ? 'inline' : 'attachment'}; filename="${formId}.pdf"`,
        );
        res.send(Buffer.from(result.pdfBytes));
    } catch (e: any) {
        logger.error(`Error generating NY form ${req.body?.formId}:`, e.message);
        res.status(500).json({ error: "Failed to generate NY form" });
    }
});

// ── TX Form Auto-Fill Endpoints ───────────────────────────────────────────────

// GET /api/forms/tx/schema/:formId - Return UI field schema for a TX form
router.get("/tx/schema/:formId", async (req: Request, res: Response) => {
    try {
        const formId = req.params.formId as TXFormId;
        if (!TX_FORM_REGISTRY[formId]) {
            return res.status(404).json({ error: `No schema found for form ${formId}` });
        }
        const schema = TXFormService.getUISchema(formId);
        res.json({ formId, title: TX_FORM_TITLES[formId] || formId, schema });
    } catch (e: any) {
        logger.error(`Error fetching TX form schema for ${req.params.formId}:`, e.message);
        res.status(500).json({ error: "Failed to fetch form schema" });
    }
});

// POST /api/forms/tx/preview - Resolve field values without generating PDF (for UI preview)
router.post("/tx/preview", async (req: any, res: Response) => {
    try {
        const { formId, overrides = {} } = req.body;
        if (!formId) return res.status(400).json({ error: "formId is required" });
        if (!TX_FORM_REGISTRY[formId as TXFormId]) {
            return res.status(400).json({ error: `Unsupported TX form: ${formId}` });
        }

        const estateId = await getEstateId(req.user.id);
        if (!estateId) return res.status(404).json({ error: "Estate not found" });

        const estate = await prisma.estate.findUnique({
            where: { id: estateId },
            include: { user: true, heirs: true },
        });
        if (!estate) return res.status(404).json({ error: "Estate data not found" });

        const assets = await prisma.asset.findMany({ where: { estateId } });
        const heirs = await prisma.heir.findMany({ where: { estateId } });

        const { fieldValues, validationErrors } = TXFormService.resolveFields({
            formId: formId as TXFormId,
            estate: { ...estate, ...overrides },
            assets,
            heirs,
            overrides,
        });

        res.json({ formId, fieldValues, validationErrors });
    } catch (e: any) {
        logger.error(`Error previewing TX form ${req.body?.formId}:`, e.message);
        res.status(500).json({ error: "Failed to preview form fields" });
    }
});

// POST /api/forms/tx/generate - Generate and return filled TX form PDF
router.post("/tx/generate", async (req: any, res: Response) => {
    try {
        const { formId, isPreview = false, overrides = {} } = req.body;
        if (!formId) return res.status(400).json({ error: "formId is required" });
        if (!TX_FORM_REGISTRY[formId as TXFormId]) {
            return res.status(400).json({ error: `Unsupported TX form: ${formId}` });
        }

        const estateId = await getEstateId(req.user.id);
        if (!estateId) return res.status(404).json({ error: "Estate not found" });

        const estate = await prisma.estate.findUnique({
            where: { id: estateId },
            include: { user: true, heirs: true },
        });
        if (!estate) return res.status(404).json({ error: "Estate data not found" });

        const assets = await prisma.asset.findMany({ where: { estateId } });
        const heirs = await prisma.heir.findMany({ where: { estateId } });

        const result = await TXFormService.generate({
            formId: formId as TXFormId,
            estate,
            assets,
            heirs,
            overrides,
        });

        await DistributionService.logEvent(
            estateId,
            req.user.id,
            isPreview ? 'VIEWED' : 'PREPARED',
            `${isPreview ? 'PREVIEWED' : 'PREPARED'} – ${formId} (TX Auto-Fill)`,
        );

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader(
            "Content-Disposition",
            `${isPreview ? 'inline' : 'attachment'}; filename="${formId}.pdf"`,
        );
        res.send(Buffer.from(result.pdfBytes));
    } catch (e: any) {
        logger.error(`Error generating TX form ${req.body?.formId}:`, e.message);
        res.status(500).json({ error: "Failed to generate TX form" });
    }
});

// ── FL Form Auto-Fill Endpoints ───────────────────────────────────────────────

// GET /api/forms/fl/schema/:formId - Return UI field schema for a FL form
router.get("/fl/schema/:formId", async (req: Request, res: Response) => {
    try {
        const formId = req.params.formId as FLFormId;
        if (!FL_FORM_REGISTRY[formId]) {
            return res.status(404).json({ error: `No schema found for form ${formId}` });
        }
        const schema = FLFormService.getUISchema(formId);
        res.json({ formId, title: FL_FORM_TITLES[formId] || formId, schema });
    } catch (e: any) {
        logger.error(`Error fetching FL form schema for ${req.params.formId}:`, e.message);
        res.status(500).json({ error: "Failed to fetch form schema" });
    }
});

// POST /api/forms/fl/preview - Resolve field values without generating PDF (for UI preview)
router.post("/fl/preview", async (req: any, res: Response) => {
    try {
        const { formId, overrides = {} } = req.body;
        if (!formId) return res.status(400).json({ error: "formId is required" });
        if (!FL_FORM_REGISTRY[formId as FLFormId]) {
            return res.status(400).json({ error: `Unsupported FL form: ${formId}` });
        }

        const estateId = await getEstateId(req.user.id);
        if (!estateId) return res.status(404).json({ error: "Estate not found" });

        const estate = await prisma.estate.findUnique({
            where: { id: estateId },
            include: { user: true, heirs: true },
        });
        if (!estate) return res.status(404).json({ error: "Estate data not found" });

        const assets = await prisma.asset.findMany({ where: { estateId } });
        const heirs = await prisma.heir.findMany({ where: { estateId } });

        const { fieldValues, validationErrors } = FLFormService.resolveFields({
            formId: formId as FLFormId,
            estate: { ...estate, ...overrides },
            assets,
            heirs,
            overrides,
        });

        res.json({ formId, fieldValues, validationErrors });
    } catch (e: any) {
        logger.error(`Error previewing FL form ${req.body?.formId}:`, e.message);
        res.status(500).json({ error: "Failed to preview form fields" });
    }
});

// POST /api/forms/fl/generate - Generate and return filled FL form PDF
router.post("/fl/generate", async (req: any, res: Response) => {
    try {
        const { formId, isPreview = false, overrides = {} } = req.body;
        if (!formId) return res.status(400).json({ error: "formId is required" });
        if (!FL_FORM_REGISTRY[formId as FLFormId]) {
            return res.status(400).json({ error: `Unsupported FL form: ${formId}` });
        }

        const estateId = await getEstateId(req.user.id);
        if (!estateId) return res.status(404).json({ error: "Estate not found" });

        const estate = await prisma.estate.findUnique({
            where: { id: estateId },
            include: { user: true, heirs: true },
        });
        if (!estate) return res.status(404).json({ error: "Estate data not found" });

        const assets = await prisma.asset.findMany({ where: { estateId } });
        const heirs = await prisma.heir.findMany({ where: { estateId } });

        const result = await FLFormService.generate({
            formId: formId as FLFormId,
            estate,
            assets,
            heirs,
            overrides,
        });

        await DistributionService.logEvent(
            estateId,
            req.user.id,
            isPreview ? 'VIEWED' : 'PREPARED',
            `${isPreview ? 'PREVIEWED' : 'PREPARED'} – ${formId} (FL Auto-Fill)`,
        );

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader(
            "Content-Disposition",
            `${isPreview ? 'inline' : 'attachment'}; filename="${formId}.pdf"`,
        );
        res.send(Buffer.from(result.pdfBytes));
    } catch (e: any) {
        logger.error(`Error generating FL form ${req.body?.formId}:`, e.message);
        res.status(500).json({ error: "Failed to generate FL form" });
    }
});

// ─── NJ Form Auto-Fill Endpoints ───────────────────────────────────────────────

// GET /api/forms/nj/schema/:formId - Return UI field schema for a NJ form
router.get("/nj/schema/:formId", async (req: Request, res: Response) => {
    try {
        const formId = req.params.formId as NJFormId;
        if (!NJ_FORM_REGISTRY[formId]) {
            return res.status(404).json({ error: `No schema found for form ${formId}` });
        }
        const schema = NJFormService.getUISchema(formId);
        res.json({ formId, title: NJ_FORM_TITLES[formId] || formId, schema });
    } catch (e: any) {
        logger.error(`Error fetching NJ form schema for ${req.params.formId}:`, e.message);
        res.status(500).json({ error: "Failed to fetch form schema" });
    }
});

// POST /api/forms/nj/preview - Resolve field values without generating PDF (for UI preview)
router.post("/nj/preview", async (req: any, res: Response) => {
    try {
        const { formId, overrides = {} } = req.body;
        if (!formId) return res.status(400).json({ error: "formId is required" });
        if (!NJ_FORM_REGISTRY[formId as NJFormId]) {
            return res.status(400).json({ error: `Unsupported NJ form: ${formId}` });
        }

        const estateId = await getEstateId(req.user.id);
        if (!estateId) return res.status(404).json({ error: "Estate not found" });

        const estate = await prisma.estate.findUnique({
            where: { id: estateId },
            include: { user: true, heirs: true },
        });
        if (!estate) return res.status(404).json({ error: "Estate data not found" });

        const assets = await prisma.asset.findMany({ where: { estateId } });
        const heirs = await prisma.heir.findMany({ where: { estateId } });

        const { fieldValues, validationErrors } = NJFormService.resolveFields({
            formId: formId as NJFormId,
            estate: { ...estate, ...overrides },
            assets,
            heirs,
            overrides,
        });

        res.json({ formId, fieldValues, validationErrors });
    } catch (e: any) {
        logger.error(`Error previewing NJ form ${req.body?.formId}:`, e.message);
        res.status(500).json({ error: "Failed to preview form fields" });
    }
});

// POST /api/forms/nj/generate - Generate and return filled NJ form PDF
router.post("/nj/generate", async (req: any, res: Response) => {
    try {
        const { formId, isPreview = false, overrides = {} } = req.body;
        if (!formId) return res.status(400).json({ error: "formId is required" });
        if (!NJ_FORM_REGISTRY[formId as NJFormId]) {
            return res.status(400).json({ error: `Unsupported NJ form: ${formId}` });
        }

        const estateId = await getEstateId(req.user.id);
        if (!estateId) return res.status(404).json({ error: "Estate not found" });

        const estate = await prisma.estate.findUnique({
            where: { id: estateId },
            include: { user: true, heirs: true },
        });
        if (!estate) return res.status(404).json({ error: "Estate data not found" });

        const assets = await prisma.asset.findMany({ where: { estateId } });
        const heirs = await prisma.heir.findMany({ where: { estateId } });

        const result = await NJFormService.generate({
            formId: formId as NJFormId,
            estate,
            assets,
            heirs,
            overrides,
        });

        await DistributionService.logEvent(
            estateId,
            req.user.id,
            isPreview ? 'VIEWED' : 'PREPARED',
            `${isPreview ? 'PREVIEWED' : 'PREPARED'} – ${formId} (NJ Auto-Fill)`,
        );

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader(
            "Content-Disposition",
            `${isPreview ? 'inline' : 'attachment'}; filename="${formId}.pdf"`,
        );
        res.send(Buffer.from(result.pdfBytes));
    } catch (e: any) {
        logger.error(`Error generating NJ form ${req.body?.formId}:`, e.message);
        res.status(500).json({ error: "Failed to generate NJ form" });
    }
});

export default router;

