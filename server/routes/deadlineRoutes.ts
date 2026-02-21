import { Router } from 'express';
import { DeadlineService } from '../services/deadlineService.js';
import { authenticate } from '../middleware/auth.js';
import { requireOwnership } from '../middleware/authorization.js';

const router = Router();
const deadlineService = new DeadlineService();

/**
 * GET /api/deadlines/:estateId
 * Get all deadlines for an estate
 */
router.get('/:estateId', authenticate, requireOwnership('estate'), async (req, res) => {
    try {
        const estateId = Array.isArray(req.params.estateId) ? req.params.estateId[0] : req.params.estateId;
        const deadlines = await deadlineService.getDeadlines(estateId);
        res.json(deadlines);
    } catch (error) {
        console.error('Error fetching deadlines:', error);
        res.status(500).json({ error: 'Failed to fetch deadlines' });
    }
});

/**
 * GET /api/deadlines/:estateId/upcoming
 * Get upcoming deadlines (within next 30 days) for an estate
 */
router.get('/:estateId/upcoming', authenticate, requireOwnership('estate'), async (req, res) => {
    try {
        const estateId = Array.isArray(req.params.estateId) ? req.params.estateId[0] : req.params.estateId;
        const upcomingDeadlines = await deadlineService.getUpcomingDeadlines(estateId);
        res.json(upcomingDeadlines);
    } catch (error) {
        console.error('Error fetching upcoming deadlines:', error);
        res.status(500).json({ error: 'Failed to fetch upcoming deadlines' });
    }
});

/**
 * GET /api/deadlines/:estateId/overdue
 * Get overdue deadlines for an estate
 */
router.get('/:estateId/overdue', authenticate, requireOwnership('estate'), async (req, res) => {
    try {
        const estateId = Array.isArray(req.params.estateId) ? req.params.estateId[0] : req.params.estateId;
        const overdueDeadlines = await deadlineService.getOverdueDeadlines(estateId);
        res.json(overdueDeadlines);
    } catch (error) {
        console.error('Error fetching overdue deadlines:', error);
        res.status(500).json({ error: 'Failed to fetch overdue deadlines' });
    }
});

/**
 * POST /api/deadlines/:estateId/generate
 * Generate statutory deadlines for an estate based on state rules and anchor dates
 */
router.post('/:estateId/generate', authenticate, requireOwnership('estate'), async (req, res) => {
    try {
        const estateId = Array.isArray(req.params.estateId) ? req.params.estateId[0] : req.params.estateId;
        const deadlines = await deadlineService.generateDeadlines(estateId);
        res.json({
            message: 'Deadlines generated successfully',
            deadlines
        });
    } catch (error: any) {
        console.error('Error generating deadlines:', error);
        if (error.message === 'Estate not found') {
            res.status(404).json({ error: error.message });
        } else {
            res.status(500).json({ error: 'Failed to generate deadlines' });
        }
    }
});

/**
 * PUT /api/deadlines/:deadlineId/complete
 * Mark a deadline as completed
 */
router.put('/:deadlineId/complete', authenticate, async (req, res) => {
    try {
        const deadlineId = Array.isArray(req.params.deadlineId) ? req.params.deadlineId[0] : req.params.deadlineId;
        const deadline = await deadlineService.markCompleted(deadlineId);
        res.json({
            message: 'Deadline marked as completed',
            deadline
        });
    } catch (error) {
        console.error('Error marking deadline as completed:', error);
        res.status(500).json({ error: 'Failed to mark deadline as completed' });
    }
});

/**
 * PUT /api/deadlines/:deadlineId/incomplete
 * Mark a deadline as incomplete
 */
router.put('/:deadlineId/incomplete', authenticate, async (req, res) => {
    try {
        const deadlineId = Array.isArray(req.params.deadlineId) ? req.params.deadlineId[0] : req.params.deadlineId;
        const deadline = await deadlineService.markIncomplete(deadlineId);
        res.json({
            message: 'Deadline marked as incomplete',
            deadline
        });
    } catch (error) {
        console.error('Error marking deadline as incomplete:', error);
        res.status(500).json({ error: 'Failed to mark deadline as incomplete' });
    }
});

/**
 * PUT /api/deadlines/:deadlineId
 * Update deadline due date
 */
router.put('/:deadlineId', authenticate, async (req, res) => {
    try {
        const deadlineId = Array.isArray(req.params.deadlineId) ? req.params.deadlineId[0] : req.params.deadlineId;
        const { dueDate } = req.body;
        
        if (!dueDate) {
            return res.status(400).json({ error: 'Due date is required' });
        }

        const deadline = await deadlineService.updateDeadline(deadlineId, new Date(dueDate));
        res.json({
            message: 'Deadline updated successfully',
            deadline
        });
    } catch (error) {
        console.error('Error updating deadline:', error);
        res.status(500).json({ error: 'Failed to update deadline' });
    }
});

/**
 * GET /api/deadlines/:deadlineId
 * Get deadline by ID
 */
router.get('/:deadlineId', authenticate, async (req, res) => {
    try {
        const deadlineId = Array.isArray(req.params.deadlineId) ? req.params.deadlineId[0] : req.params.deadlineId;
        const deadline = await deadlineService.getDeadline(deadlineId);
        
        if (!deadline) {
            return res.status(404).json({ error: 'Deadline not found' });
        }

        res.json(deadline);
    } catch (error) {
        console.error('Error fetching deadline:', error);
        res.status(500).json({ error: 'Failed to fetch deadline' });
    }
});

/**
 * DELETE /api/deadlines/:deadlineId
 * Delete a deadline
 */
router.delete('/:deadlineId', authenticate, async (req, res) => {
    try {
        const deadlineId = Array.isArray(req.params.deadlineId) ? req.params.deadlineId[0] : req.params.deadlineId;
        const deadline = await deadlineService.getDeadline(deadlineId);
        
        if (!deadline) {
            return res.status(404).json({ error: 'Deadline not found' });
        }

        // Delete the deadline
        await deadlineService.markIncomplete(deadlineId); // First mark as incomplete
        // Note: We don't actually delete from database, just mark as incomplete
        // If we wanted to actually delete, we'd need a delete method in the service
        
        res.json({
            message: 'Deadline marked as incomplete',
            deadline
        });
    } catch (error) {
        console.error('Error deleting deadline:', error);
        res.status(500).json({ error: 'Failed to delete deadline' });
    }
});

export default router;