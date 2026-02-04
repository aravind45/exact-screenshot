
import { Router } from 'express';
import multer from 'multer';
import * as pdfLib from 'pdf-parse';
import { DiscoveryService } from '../services/discoveryService.js';
import { DiscoveryIntelligenceService } from '../services/discoveryIntelligenceService.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// Get estate-wide discovery insights
router.get('/:estateId/insights', async (req, res) => {
    try {
        const insights = await DiscoveryIntelligenceService.getDiscoveryInsights(req.params.estateId);
        res.json(insights);
    } catch (error) {
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
        const { status, evidenceSource } = req.body;
        const updated = await DiscoveryService.updateCategoryStatus(req.params.id, req.user.id, status, evidenceSource);
        res.json(updated);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update category' });
    }
});

// Add negative assurance log
router.post('/category/:id/negative-assurance', async (req: any, res) => {
    try {
        const { statement } = req.body;
        const log = await DiscoveryService.addNegativeAssurance(req.params.id, req.user.id, statement);
        res.json(log);
    } catch (error) {
        res.status(500).json({ error: 'Failed to add negative assurance' });
    }
});

// Analyze uploaded document
router.post('/analyze', upload.single('file'), async (req: any, res) => {
    try {
        console.log(`[DiscoveryRoute] ========== NEW UPLOAD REQUEST ==========`);
        console.log(`[DiscoveryRoute] Timestamp:`, new Date().toISOString());

        if (!req.file) {
            console.log(`[DiscoveryRoute] ERROR: No file in request`);
            return res.status(400).json({ error: "No file uploaded" });
        }

        console.log(`[DiscoveryRoute] File details:`, {
            originalname: req.file.originalname,
            mimetype: req.file.mimetype,
            size: req.file.size
        });

        let text = "";
        let imageBase64 = "";

        // Extract content based on file type
        if (req.file.mimetype === 'application/pdf') {
            console.log(`[DiscoveryRoute] Processing PDF file`);
            try {
                // pdf-parse import compatibility handle
                const pdfParse = (pdfLib as any).default || pdfLib;
                const data = await pdfParse(req.file.buffer);
                text = data.text;
                console.log(`[DiscoveryRoute] Extracted ${text.length} characters from PDF`);
                console.log(`[DiscoveryRoute] PDF text preview:`, text.substring(0, 200));

                if (text.length === 0) {
                    console.log(`[DiscoveryRoute] WARNING: PDF text extraction returned 0 characters. PDF might be image-based or encrypted.`);
                }
            } catch (pdfErr) {
                console.error(`[DiscoveryRoute] PDF Parsing Failed:`, pdfErr);
                console.error(`[DiscoveryRoute] PDF Error stack:`, pdfErr instanceof Error ? pdfErr.stack : 'No stack');
                // Don't crash, just continue with empty text (or maybe try OCR if available in future)
                // We rely on user to upload readable PDF
            }
        } else if (req.file.mimetype.startsWith('image/')) {
            console.log(`[DiscoveryRoute] Processing image file`);
            imageBase64 = req.file.buffer.toString('base64');
            console.log(`[DiscoveryRoute] Image base64 length: ${imageBase64.length}`);
        } else {
            console.log(`[DiscoveryRoute] Processing as text file`);
            // For other text files, try simple string
            text = req.file.buffer.toString('utf-8');
            console.log(`[DiscoveryRoute] Text file length: ${text.length}`);
        }

        console.log(`[DiscoveryRoute] Content ready for analysis. Text length: ${text.length}, Image present: ${!!imageBase64}`);

        // Send to DiscoveryService (handling Real AI)
        console.log(`[DiscoveryRoute] Calling DiscoveryService.analyzeDocument...`);
        const estateId = req.query.estateId as string;
        const result = await DiscoveryService.analyzeDocument({
            text,
            imageBase64,
            estateId
        });
        console.log(`[DiscoveryRoute] Analysis complete. Found ${result.findings.length} findings.`);

        if (result.findings.length > 0) {
            console.log(`[DiscoveryRoute] Findings:`, JSON.stringify(result.findings, null, 2));
        } else {
            console.log(`[DiscoveryRoute] No findings returned. This could mean:`);
            console.log(`[DiscoveryRoute]   1. The document doesn't contain financial institution names`);
            console.log(`[DiscoveryRoute]   2. The AI service is not working correctly`);
            console.log(`[DiscoveryRoute]   3. The text extraction failed`);
        }

        console.log(`[DiscoveryRoute] ========== REQUEST COMPLETE ==========`);
        res.json(result);
    } catch (error) {
        console.error("[DiscoveryRoute] ========== REQUEST FAILED ==========");
        console.error("[DiscoveryRoute] Discovery Analysis Failed:", error);
        console.error("[DiscoveryRoute] Error stack:", error instanceof Error ? error.stack : 'No stack trace');
        console.error("[DiscoveryRoute] ========================================");
        res.status(500).json({
            error: 'Failed to analyze document',
            details: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined
        });
    }
});

export default router;
