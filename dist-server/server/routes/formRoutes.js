import { Router } from "express";
import { prisma } from "../db.js";
import { DocumentService } from "../services/DocumentService.js";
import { FORM_AUTHORITIES, FORM_MAPPINGS } from "../services/formMappings.js";
import { DistributionService } from "../services/distributionService.js";
import { AccountingService } from "../services/accountingService.js";
import { logger } from "../lib/logger.js";
import { requireSubscription } from "../middleware/subscription.js";
const router = Router();
router.use(requireSubscription);
const getEstateId = async (userId) => {
    const grant = await prisma.estateGrant.findFirst({
        where: { userId },
        include: { estate: true }
    });
    if (grant)
        return grant.estateId;
    const estate = await prisma.estate.findFirst({ where: { userId } });
    return estate?.id;
};
// GET /api/forms/templates - List all form templates from DB
router.get("/templates", async (req, res) => {
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
        const enriched = templates.map((t) => ({
            ...t,
            authorityTier: FORM_AUTHORITIES[t.name] || 'COURT_REQUIRED'
        }));
        res.json(enriched);
    }
    catch (error) {
        logger.error("Failed to fetch form templates:", error.message);
        res.status(500).json({ error: "Failed to fetch form templates" });
    }
});
// GET /api/forms/readiness - Consolidated form readiness checks (multi-state)
router.get("/readiness", async (req, res) => {
    try {
        const estateId = await getEstateId(req.user.id);
        if (!estateId)
            return res.status(404).json({ error: "Estate not found" });
        const estate = await prisma.estate.findUnique({ where: { id: estateId } });
        const accountingReadiness = await AccountingService.getReadiness(estateId);
        const hasDecedentInfo = !!(estate?.deceasedFirstName && estate?.deceasedLastName);
        const isAppointed = estate?.status === 'APPOINTED' || estate?.status === 'SETTLEMENT';
        const hasInventory = accountingReadiness.checks.inventoryObtained || estate?.status === 'SETTLEMENT';
        const estateState = estate?.deceasedState || '';
        // --- Helper to build a standard readiness entry ---
        const entry = (ready, reason, statusYes, statusNo, tier = "COURT_REQUIRED") => ({
            ready,
            reason,
            status: ready ? statusYes : statusNo,
            authorityTier: tier
        });
        // --- California (DE-*) ---
        const caReadiness = {
            'DE-111': entry(hasDecedentInfo, "Requires decedent name and address.", "READY", "LOCKED"),
            'DE-121': entry(hasDecedentInfo, "Requires decedent name and address.", "READY", "LOCKED"),
            'DE-150': entry(isAppointed, "Can be prepared once the court has issued appointment orders.", "READY (Letters Issued)", "PENDING COURT ORDER"),
            'DE-160': entry(hasInventory, "Appropriate once assets have been discovered and valued.", "READY (Inventory Open)", "COLLECTING ASSETS"),
        };
        // --- New York (ET-*) ---
        const nyReadiness = {
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
        const txReadiness = {
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
        const flReadiness = {
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
        // Return readiness for the estate's state, or all states if query param requests it
        const requestedState = req.query.state?.toUpperCase() || estateState;
        const stateMap = {
            CA: caReadiness,
            NY: nyReadiness,
            TX: txReadiness,
            FL: flReadiness
        };
        // Always include the estate's state; if "all" requested, merge everything
        let readiness;
        if (requestedState === 'ALL') {
            readiness = { ...caReadiness, ...nyReadiness, ...txReadiness, ...flReadiness };
        }
        else {
            readiness = stateMap[requestedState] || caReadiness;
        }
        res.json(readiness);
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
});
// GET /api/forms/templates/:name/download - Serve blank PDF from DB bytes
router.get("/templates/:name/download", async (req, res) => {
    try {
        const templateName = String(req.params.name);
        const template = await prisma.formTemplate.findUnique({
            where: { name: templateName }
        });
        if (!template) {
            return res.status(404).json({ error: `Template '${templateName}' not found` });
        }
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `attachment; filename="${templateName}.pdf"`);
        res.send(Buffer.from(template.data));
    }
    catch (e) {
        logger.error("Failed to download template:", e.message);
        res.status(500).json({ error: "Failed to download template" });
    }
});
// POST /api/forms/generate - Generate a filled form PDF and return binary
router.post("/generate", async (req, res) => {
    try {
        const { formId, isPreview, overrides } = req.body;
        if (!formId)
            return res.status(400).json({ error: "formId is required" });
        const estateId = await getEstateId(req.user.id);
        if (!estateId)
            return res.status(404).json({ error: "Estate not found" });
        const estate = await prisma.estate.findUnique({
            where: { id: estateId },
            include: { user: true }
        });
        if (!estate)
            return res.status(404).json({ error: "Estate data not found" });
        const mergedData = { ...estate, ...overrides };
        let pdfBytes;
        const specializedGenerators = {
            'DE-111': DocumentService.generateDE111,
            'DE-160': async (data) => {
                const assets = await prisma.asset.findMany({ where: { estateId } });
                return DocumentService.generateDE160(data, assets);
            },
            'DE-121': DocumentService.generateDE121,
            'DE-150': DocumentService.generateDE150,
            'DE-221': DocumentService.generateDE221,
            'DE-120': DocumentService.generateDE120,
            'DE-226': DocumentService.generateDE226,
            'DE-310': async (data) => {
                const assets = await prisma.asset.findMany({ where: { estateId } });
                const total = assets.reduce((sum, a) => sum + Number(a.inventoryValue || 0), 0);
                return DocumentService.generateDE310(data, total);
            },
            'DE-315': DocumentService.generateDE315,
            'DE-350': DocumentService.generateDE350,
            'DE-351': DocumentService.generateDE351,
            'DE-142': DocumentService.generateDE142,
            'DE-143': DocumentService.generateDE143,
            'DE-174': async (data) => {
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
        }
        else {
            const mapping = FORM_MAPPINGS[formId];
            if (!mapping) {
                return res.status(400).json({
                    error: `No generation path found for form ${formId}`
                });
            }
            const overlayData = {
                'estateOf': `${estate.deceasedFirstName || ''} ${estate.deceasedLastName || ''}`.toUpperCase(),
                'partyName': estate.user?.fullName || '',
                'attorneyName': estate.user?.fullName || '',
                'petitionerName': estate.user?.fullName || '',
                ...overrides
            };
            pdfBytes = await DocumentService.generateOverlayPdf(formId, overlayData, mapping);
        }
        // Log audit trail
        await DistributionService.logEvent(estateId, req.user.id, isPreview ? 'VIEWED' : 'PREPARED', `${isPreview ? 'PREVIEWED' : 'PREPARED'} – ${formId} (ProForms page)`);
        // Return raw PDF binary so the browser can createObjectURL from it
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `${isPreview ? 'inline' : 'attachment'}; filename="${formId}.pdf"`);
        res.send(Buffer.from(pdfBytes));
    }
    catch (e) {
        logger.error(`Error generating form ${req.body?.formId}:`, e.message);
        res.status(500).json({ error: "Failed to generate form" });
    }
});
export default router;
