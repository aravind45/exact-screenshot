import { Router } from 'express';
import { DiscoveryService } from '../services/discoveryService.js';

const router = Router();

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
router.patch('/category/:id', async (req, res) => {
    try {
        const { status, evidenceSource } = req.body;
        const updated = await DiscoveryService.updateCategoryStatus(req.params.id, status, evidenceSource);
        res.json(updated);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update category' });
    }
});

// Add negative assurance log
router.post('/category/:id/negative-assurance', async (req, res) => {
    try {
        const { statement } = req.body;
        const log = await DiscoveryService.addNegativeAssurance(req.params.id, statement);
        res.json(log);
    } catch (error) {
        res.status(500).json({ error: 'Failed to add negative assurance' });
    }
});

export default router;
