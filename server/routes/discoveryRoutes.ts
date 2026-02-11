import { Router } from 'express';
import multer from 'multer';
import * as pdfLib from 'pdf-parse';
import { DiscoveryService } from '../services/discoveryService.js';
import { DiscoveryIntelligenceService } from '../services/discoveryIntelligenceService.js';
import { z } from 'zod';
import { logger } from '../lib/logger.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

const categoryUpdateSchema = z.object({
    status: z.string(),
    evidenceSource: z.string().optional()
});

const negativeAssuranceSchema = z.object({
    statement: z.string().min(10)
});

// Get estate-wide discovery insights
router.get('/:estateId/insights', async (req, res) => {
    try {
        const insights = await DiscoveryIntelligenceService.getDiscoveryInsights(req.params.estateId);
        res.json(insights);
    } catch (error: any) {
        logger.error("Error fetching discovery insights:", error.message);
        res.status(500).json({ error: 'Failed to fetch discovery insights' });
    }
});

// Get discovery status and categories for an estate
router.get('/:estateId', async (req, res) => {
    try {
        const status = await DiscoveryService.getDiscoveryStatus(req.params.estateId);
        res.json(status);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch discovery status' });
    }
});

// Initialize categories for an estate
router.post('/:estateId/initialize', async (req, res) => {
    try {
        const categories = await DiscoveryService.initializeCategories(req.params.estateId);
        res.json(categories);
    } catch (error) {
        res.status(500).json({ error: 'Failed to initialize categories' });
    }
});

// Update category status
router.patch('/category/:id', async (req: any, res) => {
    try {
        const { status, evidenceSource } = categoryUpdateSchema.parse(req.body);
        const updated = await DiscoveryService.updateCategoryStatus(req.params.id, req.user.id, status, evidenceSource);
        res.json(updated);
    } catch (error: any) {
        if (error instanceof z.ZodError) return res.status(400).json({ error: "Invalid status update" });
        logger.error("Error updating discovery category:", error.message);
        res.status(500).json({ error: 'Failed to update category' });
    }
});

// Add negative assurance log
router.post('/category/:id/negative-assurance', async (req: any, res) => {
    try {
        const { statement } = negativeAssuranceSchema.parse(req.body);
        const log = await DiscoveryService.addNegativeAssurance(req.params.id, req.user.id, statement);
        res.json(log);
    } catch (error: any) {
        if (error instanceof z.ZodError) return res.status(400).json({ error: "Statement must be at least 10 characters" });
        logger.error("Error adding negative assurance:", error.message);
        res.status(500).json({ error: 'Failed to add negative assurance' });
    }
});

// Analyze uploaded document
router.post('/analyze', upload.single('file'), async (req: any, res) => {
    try {
        logger.debug(`[DiscoveryRoute] ========== NEW UPLOAD REQUEST ==========`);

        if (!req.file) {
            return res.status(400).json({ error: "No file uploaded" });
        }

        logger.debug(`[DiscoveryRoute] File details:`, {
            originalname: req.file.originalname,
            mimetype: req.file.mimetype,
            size: req.file.size
        });

        let text = "";
        let imageBase64 = "";

        // Extract content based on file type
        if (req.file.mimetype === 'application/pdf') {
            try {
                const pdfParse = (pdfLib as any).default || pdfLib;
                const data = await pdfParse(req.file.buffer);
                text = data.text;
                logger.debug(`[DiscoveryRoute] Extracted characters from PDF: ${text.length}`);

                if (text.length === 0) {
                    logger.warn(`[DiscoveryRoute] WARNING: PDF text extraction returned 0 characters.`);
                }
            } catch (pdfErr: any) {
                logger.error(`[DiscoveryRoute] PDF Parsing Failed:`, pdfErr.message);
            }
        } else if (req.file.mimetype.startsWith('image/')) {
            imageBase64 = req.file.buffer.toString('base64');
            logger.debug(`[DiscoveryRoute] Image processed`);
        } else {
            text = req.file.buffer.toString('utf-8');
            logger.debug(`[DiscoveryRoute] Text file processed`);
        }

        const estateId = req.query.estateId as string;
        if (!estateId) return res.status(400).json({ error: "Missing estateId query parameter" });

        const result = await DiscoveryService.analyzeDocument({
            text,
            imageBase64,
            estateId
        });

        logger.info(`[DiscoveryRoute] Analysis complete. Found ${result.findings.length} findings.`);
        res.json(result);
    } catch (error: any) {
        logger.error("[DiscoveryRoute] Discovery Analysis Failed:", error.message);
        res.status(500).json({
            error: 'Failed to analyze document',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

export default router;
