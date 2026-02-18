import { Router, Request, Response } from "express";
import { AdvisorMarketplaceService } from "../services/advisorMarketplaceService.js";
import { AvailabilityService } from "../services/availabilityService.js";
import { logger } from "../lib/logger.js";
import { z } from "zod";

const router = Router();

// ─── Validation schemas ─────────────────────────────────────────────────────

const searchSchema = z.object({
  specialty: z.string().optional(),
  state: z.string().optional(),
  advisorType: z.string().optional(),
  minRate: z.coerce.number().min(0).optional(),
  maxRate: z.coerce.number().min(0).optional(),
  minRating: z.coerce.number().min(0).max(5).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

const slotsQuerySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "date must be YYYY-MM-DD"),
  ratePlanId: z.string().optional(),
});

const availabilityQuerySchema = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "from must be YYYY-MM-DD"),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "to must be YYYY-MM-DD"),
  ratePlanId: z.string().optional(),
});

/** GET /marketplace - search advisors */
router.get("/", async (req: Request, res: Response) => {
  try {
    const query = searchSchema.parse(req.query);
    const result = await AdvisorMarketplaceService.searchAdvisors({
      specialty: query.specialty,
      state: query.state,
      advisorType: query.advisorType,
      minRate: query.minRate,
      maxRate: query.maxRate,
      minRating: query.minRating,
      page: query.page,
      limit: query.limit,
    });
    res.json(result);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid query parameters", details: error.errors });
    }
    logger.error("marketplaceRoutes searchAdvisors error:", error.message);
    res.status(500).json({ error: "Failed to search advisors" });
  }
});

/** GET /marketplace/:id - public advisor profile */
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const profile = await AdvisorMarketplaceService.getPublicProfile(req.params.id as string);
    if (!profile) return res.status(404).json({ error: "Advisor not found" });
    res.json(profile);
  } catch (error: any) {
    logger.error("marketplaceRoutes getPublicProfile error:", error.message);
    res.status(500).json({ error: "Failed to fetch advisor profile" });
  }
});

/** GET /marketplace/:id/slots */
router.get("/:id/slots", async (req: Request, res: Response) => {
  try {
    const query = slotsQuerySchema.parse(req.query);
    const advisorId = req.params.id as string;
    let durationMinutes = 60;
    if (query.ratePlanId) {
      const { prisma } = await import("../db.js");
      const plan = await prisma.advisorRatePlan.findUnique({ where: { id: query.ratePlanId } });
      if (!plan) return res.status(404).json({ error: "Rate plan not found" });
      durationMinutes = plan.durationMinutes;
    }
    const slots = await AvailabilityService.getSlotsForDate(advisorId, query.date, durationMinutes);
    res.json({ date: query.date, durationMinutes, slots });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid query parameters", details: error.errors });
    }
    logger.error("marketplaceRoutes getSlotsForDate error:", error.message);
    res.status(500).json({ error: "Failed to fetch available slots" });
  }
});

/** GET /marketplace/:id/availability */
router.get("/:id/availability", async (req: Request, res: Response) => {
  try {
    const query = availabilityQuerySchema.parse(req.query);
    const advisorId = req.params.id as string;
    const diffDays = Math.ceil((new Date(query.to).getTime() - new Date(query.from).getTime()) / 86400000);
    if (diffDays < 0) return res.status(400).json({ error: "from must be before to" });
    if (diffDays > 60) return res.status(400).json({ error: "Date range cannot exceed 60 days" });
    let durationMinutes = 60;
    if (query.ratePlanId) {
      const { prisma } = await import("../db.js");
      const plan = await prisma.advisorRatePlan.findUnique({ where: { id: query.ratePlanId } });
      if (!plan) return res.status(404).json({ error: "Rate plan not found" });
      durationMinutes = plan.durationMinutes;
    }
    const result = await AvailabilityService.getSlotsForRange(advisorId, query.from, query.to, durationMinutes);
    res.json({ from: query.from, to: query.to, durationMinutes, availability: result });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid query parameters", details: error.errors });
    }
    logger.error("marketplaceRoutes getSlotsForRange error:", error.message);
    res.status(500).json({ error: "Failed to fetch availability" });
  }
});

export default router;
