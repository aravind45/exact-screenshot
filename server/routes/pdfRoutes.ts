import { Router, Response } from "express";
import { prisma } from "../db.js";
import { PdfService } from "../services/pdfService.js";

const router = Router();

const getEstateId = async (userId: string) => {
    const grant = await prisma.estateGrant.findFirst({
        where: { userId },
        include: { estate: true }
    });
    return grant?.estateId || (await prisma.estate.findFirst({ where: { userId } }))?.id;
};

// POST /api/pdf/preview - Generate PDF for preview (no save)
router.post("/preview", async (req: any, res: Response) => {
    try {
        const estateId = await getEstateId(req.user.id);
        if (!estateId) return res.status(404).json({ error: "Estate not found" });

        // Merge DB estate data with form override data from request
        const dbEstate = await prisma.estate.findUnique({ where: { id: estateId } });
        const mergedData = { ...dbEstate, ...req.body };

        let pdfBytes;
        if (req.body.formType === "DE-160") {
            // For DE-160, we also need assets
            const assets = await prisma.asset.findMany({ where: { estateId } });
            pdfBytes = await PdfService.generateDE160(mergedData, assets);
        } else if (req.body.formType === "DE-121") {
            pdfBytes = await PdfService.generateDE121(mergedData);
        } else if (req.body.formType === "DE-150") {
            pdfBytes = await PdfService.generateDE150(mergedData);
        } else {
            // Default to DE-111
            pdfBytes = await PdfService.generateDE111(mergedData);
        }

        // Return base64 for easy frontend preview
        const base64Pdf = Buffer.from(pdfBytes).toString('base64');
        res.json({ pdfBase64: base64Pdf });

    } catch (e: any) {
        console.error("PDF Preview Error:", e);
        res.status(500).json({ error: e.message });
    }
});

export const pdfRoutes = router;
