import express from "express";
import { OrchestratorService } from "../services/orchestratorService.js";
import { prisma } from "../db.js";
import { z } from "zod";
import { logger } from "../lib/logger.js";

const router = express.Router();

// Validation schemas
const fillFormSchema = z.object({
    formType: z.enum(['DE-111', 'DE-221', 'DE-150', 'DE-160'])
});

/**
 * Form-Filling Agent Endpoint
 * POST /api/agents/estates/:estateId/forms/fill
 */
router.post("/estates/:estateId/forms/fill", async (req: any, res) => {
    try {
        const validated = fillFormSchema.parse(req.body);
        const { formType } = validated;
        
        // Get estate data
        const estate = await prisma.estate.findUnique({
            where: { id: req.params.estateId },
            include: {
                user: true,
                heirs: true,
                assets: true
            }
        });
        
        if (!estate) {
            return res.status(404).json({ error: "Estate not found" });
        }
        
        // Check authorization
        if (estate.userId !== req.user.id) {
            return res.status(403).json({ error: "Not authorized to access this estate" });
        }
        
        // Run Form-Filling Agent
        const result = await OrchestratorService.fillForm(estate, formType);
        
        res.json(result);
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: "Invalid form type", details: error.errors });
        }
        logger.error("Form-filling agent error:", error.message);
        res.status(500).json({ error: "Failed to fill form" });
    }
});

/**
 * Checklist Agent Endpoint
 * GET /api/agents/estates/:estateId/checklist
 */
router.get("/estates/:estateId/checklist", async (req: any, res) => {
    try {
        // Get estate data
        const estate = await prisma.estate.findUnique({
            where: { id: req.params.estateId },
            include: {
                user: true,
                heirs: true,
                assets: true,
                liabilities: true
            }
        });
        
        if (!estate) {
            return res.status(404).json({ error: "Estate not found" });
        }
        
        // Check authorization
        if (estate.userId !== req.user.id) {
            return res.status(403).json({ error: "Not authorized to access this estate" });
        }
        
        // Get user context (current phase, progress)
        const userContext = {
            currentPhase: req.query.phase || 'discovery',
            completedTasks: req.query.completed ? JSON.parse(req.query.completed as string) : []
        };
        
        // Run Checklist Agent
        const result = await OrchestratorService.createChecklist(estate, userContext);
        
        res.json(result);
    } catch (error: any) {
        logger.error("Checklist agent error:", error.message);
        res.status(500).json({ error: "Failed to generate checklist" });
    }
});

/**
 * Timeline Agent Endpoint
 * GET /api/agents/estates/:estateId/timeline
 */
router.get("/estates/:estateId/timeline", async (req: any, res) => {
    try {
        // Get estate data
        const estate = await prisma.estate.findUnique({
            where: { id: req.params.estateId },
            include: {
                user: true,
                deadlines: true
            }
        });
        
        if (!estate) {
            return res.status(404).json({ error: "Estate not found" });
        }
        
        // Check authorization
        if (estate.userId !== req.user.id) {
            return res.status(403).json({ error: "Not authorized to access this estate" });
        }
        
        // Run Timeline Agent
        const result = await OrchestratorService.createTimeline(estate);
        
        res.json(result);
    } catch (error: any) {
        logger.error("Timeline agent error:", error.message);
        res.status(500).json({ error: "Failed to generate timeline" });
    }
});

/**
 * Get all available forms for an estate
 * GET /api/agents/estates/:estateId/forms/available
 */
router.get("/estates/:estateId/forms/available", async (req: any, res) => {
    try {
        const estate = await prisma.estate.findUnique({
            where: { id: req.params.estateId }
        });
        
        if (!estate) {
            return res.status(404).json({ error: "Estate not found" });
        }
        
        // Check authorization
        if (estate.userId !== req.user.id) {
            return res.status(403).json({ error: "Not authorized to access this estate" });
        }
        
        // Determine which forms are relevant based on estate type
        const availableForms = [];
        
        if (estate.estateType === 'FULL_PROBATE') {
            availableForms.push({
                code: 'DE-111',
                name: 'Petition for Probate',
                description: 'Start the probate process',
                required: true
            });
            availableForms.push({
                code: 'DE-150',
                name: 'Letters of Administration',
                description: 'Court authority to act as executor',
                required: true
            });
            availableForms.push({
                code: 'DE-160',
                name: 'Inventory and Appraisal',
                description: 'List all estate assets',
                required: true
            });
        }
        
        if (estate.authorityType === 'SPOUSAL_PETITION') {
            availableForms.push({
                code: 'DE-221',
                name: 'Spousal Property Petition',
                description: 'Transfer property to surviving spouse',
                required: true
            });
        }
        
        res.json({ forms: availableForms });
    } catch (error: any) {
        logger.error("Available forms error:", error.message);
        res.status(500).json({ error: "Failed to get available forms" });
    }
});

export default router;
