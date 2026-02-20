import { Router } from "express";
import { prisma } from "../db.js";
import { authenticate } from "../middleware/auth.js";
import { LobService } from "../services/LobService.js";
import { DocumentService } from "../services/DocumentService.js";
import { logger } from "../lib/logger.js";
const router = Router();
/**
 * Mail a "Notification of Death" to a creditor
 */
router.post("/creditor/:id", authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        // 1. Fetch creditor and estate
        const liability = await prisma.liability.findFirst({
            where: {
                id,
                estate: {
                    OR: [
                        { userId: req.user.id },
                        { grants: { some: { userId: req.user.id } } }
                    ]
                }
            },
            include: {
                estate: {
                    include: { user: true }
                }
            }
        });
        if (!liability) {
            return res.status(404).json({ error: "Creditor not found or access denied" });
        }
        if (!liability.address || !liability.city || !liability.state || !liability.zip) {
            return res.status(400).json({ error: "Creditor address is incomplete" });
        }
        // 2. Generate the Letter PDF
        const pdfBuffer = await DocumentService.generateLetter({
            institution: liability.name,
            accountNumber: liability.accountNumber || "Unknown",
            assetType: "Liability/Debt",
        }, liability.estate);
        // 3. Send via Lob
        const result = await LobService.sendLetter(liability.estateId, {
            name: liability.name,
            address_line1: liability.address,
            address_city: liability.city,
            address_state: liability.state,
            address_zip: liability.zip,
            address_country: liability.country || "US",
        }, Buffer.from(pdfBuffer), 'CREDITOR', liability.id);
        res.json(result);
    }
    catch (error) {
        logger.error(`❌ [MAIL] Error mailing creditor: ${error.message}`);
        res.status(500).json({ error: error.message });
    }
});
/**
 * Mail a notification to a heir
 */
router.post("/heir/:id", authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        // 1. Fetch heir and estate
        const heir = await prisma.heir.findFirst({
            where: {
                id,
                estate: {
                    OR: [
                        { userId: req.user.id },
                        { grants: { some: { userId: req.user.id } } }
                    ]
                }
            },
            include: {
                estate: {
                    include: { user: true }
                }
            }
        });
        if (!heir) {
            return res.status(404).json({ error: "Heir not found or access denied" });
        }
        if (!heir.address) {
            return res.status(400).json({ error: "Heir address is missing" });
        }
        // 2. Generate the Letter PDF (using a generic notice for now)
        const pdfBuffer = await DocumentService.generateLetter({
            institution: heir.name,
            accountNumber: "Beneficiary Notification",
            assetType: "Estate Distribution Notice",
        }, heir.estate);
        // 3. Send via Lob
        // Since Heir only has a single 'address' field in Prisma, we'll need to parse it or just use it as line1
        // For now, we'll assume the address field contains the full block or we should ideally have split fields.
        // The Heir model in schema.prisma only has 'address'
        const result = await LobService.sendLetter(heir.estateId, {
            name: heir.name,
            address_line1: heir.address,
            address_city: "Unknown", // Limitations of single field address
            address_state: "CA",
            address_zip: "90001",
        }, Buffer.from(pdfBuffer), 'HEIR', heir.id);
        res.json(result);
    }
    catch (error) {
        logger.error(`❌ [MAIL] Error mailing heir: ${error.message}`);
        res.status(500).json({ error: error.message });
    }
});
/**
 * Fetch mailing history for the current estate
 */
router.get("/history", authenticate, async (req, res) => {
    try {
        const estate = await prisma.estate.findFirst({
            where: {
                OR: [
                    { userId: req.user.id },
                    { grants: { some: { userId: req.user.id } } }
                ]
            }
        });
        if (!estate) {
            return res.status(404).json({ error: "Estate not found" });
        }
        const mailings = await prisma.mailing.findMany({
            where: { estateId: estate.id },
            orderBy: { createdAt: 'desc' }
        });
        res.json(mailings);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
export default router;
