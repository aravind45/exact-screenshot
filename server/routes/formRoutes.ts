
import { Router, Response } from "express";
import { prisma } from "../db.js";
import { FormService } from "../services/formService.js";
import { FORM_MAPPINGS } from "../services/formMappings.js";

const router = Router();

const getEstateId = async (userId: string) => {
    const grant = await prisma.estateGrant.findFirst({
        where: { userId },
        include: { estate: true }
    });
    if (grant) return grant.estateId;

    const estate = await prisma.estate.findFirst({ where: { userId } });
    return estate?.id;
};

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

        // Prepare data for mapping
        const data: Record<string, any> = {
            'estateOf': `ESTATE OF ${estate.deceasedFirstName || ''} ${estate.deceasedLastName || ''}`.toUpperCase(),
            'partyName': estate.user?.fullName || '',
            'attorneyName': estate.user?.fullName || '',
            // Add more common mappings here
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

        // Template naming convention: DE-160 INVENTORY AND APPRAISAL.pdf
        const templateMap: Record<string, string> = {
            'DE-111': 'DE-111.pdf',
            'DE-150': 'DE-150 LETTERS (Probate).pdf',
            'DE-160': 'DE-160 INVENTORY AND APPRAISAL.pdf',
        };

        const templateName = templateMap[formId];
        if (!templateName) {
            return res.status(400).json({ error: `No template found for form ${formId}` });
        }

        const pdfBytes = await FormService.generateOverlayPdf(templateName, data, mapping);

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

export default router;
