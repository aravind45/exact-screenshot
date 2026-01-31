import { Router } from "express";
import { prisma } from "../db.js";
import { FormService } from "../services/formService.js";
import { FORM_MAPPINGS } from "../services/formMappings.js";
const router = Router();
// List all available form templates (public)
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
        res.json(templates);
    }
    catch (error) {
        console.error("Failed to fetch form templates:", error);
        res.status(500).json({ error: "Failed to fetch form templates" });
    }
});
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
router.post("/generate", async (req, res) => {
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
        const data = {
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
        res.setHeader('Content-Type', 'application/pdf');
        if (!isPreview) {
            res.setHeader('Content-Disposition', `attachment; filename="${formId}_Generated.pdf"`);
        }
        res.send(Buffer.from(pdfBytes));
    }
    catch (e) {
        console.error(`Error generating ${req.body.formId}:`, e);
        res.status(500).json({ error: e.message });
    }
});
router.get("/templates/:name/download", async (req, res) => {
    try {
        const name = req.params.name;
        const pdfBytes = await FormService.getTemplateBytes(name);
        if (!pdfBytes) {
            return res.status(404).json({ error: "Template not found" });
        }
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${name}_Template.pdf"`);
        res.send(Buffer.from(pdfBytes));
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
});
export default router;
