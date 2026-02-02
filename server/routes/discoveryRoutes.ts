
import { Router } from 'express';
import multer from 'multer';
import * as pdfLib from 'pdf-parse';
import { DiscoveryService } from '../services/discoveryService.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

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
        console.log(`[DiscoveryRoute] Received file upload request`);

        if (!req.file) {
            console.log(`[DiscoveryRoute] No file in request`);
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
            } catch (pdfErr) {
                console.error(`[DiscoveryRoute] PDF Parsing Failed:`, pdfErr);
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
        }

        console.log(`[DiscoveryRoute] Content ready for analysis. Text length: ${text.length}, Image present: ${!!imageBase64}`);

        // Send to DiscoveryService (handling Real AI)
        const result = await DiscoveryService.analyzeDocument({ text, imageBase64 });
        console.log(`[DiscoveryRoute] Analysis result: Found ${result.findings.length} findings.`);

        if (result.findings.length > 0) {
            console.log(`[DiscoveryRoute] Findings:`, JSON.stringify(result.findings, null, 2));
        }

        res.json(result);
    } catch (error) {
        console.error("[DiscoveryRoute] Discovery Analysis Failed:", error);
        res.status(500).json({ error: 'Failed to analyze document', details: error instanceof Error ? error.message : 'Unknown error' });
    }
});

export default router;
