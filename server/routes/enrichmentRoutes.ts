import { Router, Request, Response } from "express";
import { prisma } from "../db.js";
import { enrichInstitutionData } from "../services/enrichment.js";

const router = Router();

router.get("/search", async (req, res) => {
    try {
        const { query } = req.query;
        if (!query || typeof query !== 'string' || query.length < 2) return res.json([]);

        const institutions = await prisma.institution.findMany({
            where: { name: { contains: query, mode: 'insensitive' } },
            take: 5
        });
        res.json(institutions);
    } catch (error) {
        res.status(500).json({ error: "Search failed" });
    }
});

router.post("/asset/:id", async (req: any, res: Response) => {
    try {
        const { id } = req.params;
        const asset = await prisma.asset.findFirst({ where: { id, userId: req.user.id } });
        if (!asset || !asset.institution) return res.status(400).json({ error: "Invalid asset" });

        const enriched = await enrichInstitutionData(asset.institution);
        if (enriched) {
            // Update logic moved from index.ts
            const updates: any = {};
            if (enriched.extracted?.institutionPhone) updates.institutionPhone = enriched.extracted.institutionPhone;
            if (enriched.extracted?.institutionEmail) updates.institutionEmail = enriched.extracted.institutionEmail;
            if (enriched.extracted?.institutionFax) updates.institutionFax = enriched.extracted.institutionFax;
            if (enriched.extracted?.mailingAddress) updates.institutionAddress = enriched.extracted.mailingAddress;
            if (enriched.sourceUrl) updates.institutionUrl = enriched.sourceUrl;

            await prisma.asset.update({ where: { id }, data: updates });
        }
        res.json(enriched);
    } catch (error) {
        res.status(500).json({ error: "Enrichment failed" });
    }
});

export default router;
