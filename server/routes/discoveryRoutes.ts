import { Router } from 'express';
import multer from 'multer';
import pdf from 'pdf-parse';
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
        if (!req.file) {
            return res.status(400).json({ error: "No file uploaded" });
        }

        let text = "";
        let imageBase64 = "";

        // Extract content based on file type
        if (req.file.mimetype === 'application/pdf') {
            const data = await pdf(req.file.buffer);
            text = data.text;
        } else if (req.file.mimetype.startsWith('image/')) {
            imageBase64 = req.file.buffer.toString('base64');
        } else {
            // For other text files, try simple string
            text = req.file.buffer.toString('utf-8');
        }

        console.log(`[DiscoveryRoute] Content ready for analysis. Text length: ${text.length}, Image present: ${!!imageBase64}`);

        // Send to DiscoveryService (handling Real AI)
        const result = await DiscoveryService.analyzeDocument({ text, imageBase64 });
        console.log(`[DiscoveryRoute] Analysis result: Found ${result.findings.length} findings.`);
        res.json(result);
    } catch (error) {
        console.error("Discovery Analysis Failed:", error);
        res.status(500).json({ error: 'Failed to analyze document' });
    }
});

export default router;
