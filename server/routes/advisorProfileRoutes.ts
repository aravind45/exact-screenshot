import { Router, Response } from "express";
import { authenticate } from "../middleware/auth.js";
import { AdvisorMarketplaceService } from "../services/advisorMarketplaceService.js";
import { logger } from "../lib/logger.js";
import { z } from "zod";

const router = Router();
router.use(authenticate as any);

// ─── Validation schemas ───────────────────────────────────────────────

const upsertProfileSchema = z.object({
  bio: z.string().optional(),
  specialties: z.array(z.string()).optional(),
  statesServed: z.array(z.string()).optional(),
  languages: z.array(z.string()).optional(),
  advisorType: z.string().optional(),
  hourlyRate: z.number().min(0).optional(),
  requiresApproval: z.boolean().optional(),
  cancellationHours: z.number().int().min(0).optional(),
  noShowPolicy: z.string().optional(),
  profileImage: z.string().optional(),
  timezone: z.string().optional(),
  maxSessionsPerDay: z.number().int().min(1).max(20).optional(),
  bufferMinutes: z.number().int().min(0).max(120).optional(),
  meetingLink: z.string().optional(),
  publicNotes: z.string().optional(),
  expertise: z.array(z.string()).optional(),
  licenseNumber: z.string().optional(),
  licenseDocument: z.string().optional(),
});

const createRatePlanSchema = z.object({
  serviceName: z.string().min(1),
  durationMinutes: z.number().int().min(5).max(480),
  priceCents: z.number().int().min(0),
  currency: z.string().length(3).default("USD"),
  description: z.string().optional(),
  sortOrder: z.number().int().min(0).optional(),
});

const updateRatePlanSchema = createRatePlanSchema.partial().extend({
  isActive: z.boolean().optional(),
});

const setRulesSchema = z.object({
  rules: z.array(z.object({
    dayOfWeek: z.number().int().min(0).max(6),
    startTime: z.string().regex(/^[0-9]{2}:[0-9]{2}$/),
    endTime: z.string().regex(/^[0-9]{2}:[0-9]{2}$/),
    isActive: z.boolean().optional(),
  })),
});

const createExceptionSchema = z.object({
  date: z.string().regex(/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/),
  isBlackout: z.boolean(),
  startTime: z.string().regex(/^[0-9]{2}:[0-9]{2}$/).optional(),
  endTime: z.string().regex(/^[0-9]{2}:[0-9]{2}$/).optional(),
  reason: z.string().optional(),
});

const recordDocumentSchema = z.object({
  documentType: z.string().min(1),
  storageKey: z.string().min(1),
  fileName: z.string().min(1),
  mimeType: z.string().min(1),
  sizeBytes: z.number().int().min(0).optional(),
  licenseNumber: z.string().optional(),
  issuingState: z.string().optional(),
  expirationDate: z.string().datetime().optional(),
});

// ─── Routes ──────────────────────────────────────────────────────────────

/** GET /advisor/me */
router.get("/me", async (req: any, res: Response) => {
  try {
    const profile = await AdvisorMarketplaceService.getProfile(req.user.id);
    res.json(profile ?? null);
  } catch (error: any) {
    logger.error("advisorProfileRoutes getProfile error:", error.message);
    res.status(500).json({ error: "Failed to fetch advisor profile" });
  }
});

/** POST /advisor/profile */
router.post("/profile", async (req: any, res: Response) => {
  try {
    const data = upsertProfileSchema.parse(req.body);
    const profile = await AdvisorMarketplaceService.upsertProfile(req.user.id, data);
    res.json(profile);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid profile data", details: error.errors });
    }
    logger.error("advisorProfileRoutes upsertProfile error:", error.message);
    res.status(500).json({ error: "Failed to update profile" });
  }
});

/** POST /advisor/submit-review */
router.post("/submit-review", async (req: any, res: Response) => {
  try {
    const profile = await AdvisorMarketplaceService.submitForReview(req.user.id);
    res.json(profile);
  } catch (error: any) {
    logger.error("advisorProfileRoutes submitForReview error:", error.message);
    res.status(400).json({ error: error.message || "Failed to submit for review" });
  }
});

/** GET /advisor/rates */
router.get("/rates", async (req: any, res: Response) => {
  try {
    const plans = await AdvisorMarketplaceService.getRatePlans(req.user.id);
    res.json(plans);
  } catch (error: any) {
    logger.error("advisorProfileRoutes getRatePlans error:", error.message);
    res.status(500).json({ error: "Failed to fetch rate plans" });
  }
});

/** POST /advisor/rates */
router.post("/rates", async (req: any, res: Response) => {
  try {
    const data = createRatePlanSchema.parse(req.body) as { serviceName: string; durationMinutes: number; priceCents: number; currency?: string; description?: string; sortOrder?: number; };
    const plan = await AdvisorMarketplaceService.createRatePlan(req.user.id, data);
    res.status(201).json(plan);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid rate plan data", details: error.errors });
    }
    logger.error("advisorProfileRoutes createRatePlan error:", error.message);
    res.status(400).json({ error: error.message || "Failed to create rate plan" });
  }
});

/** PUT /advisor/rates/:id */
router.put("/rates/:id", async (req: any, res: Response) => {
  try {
    const data = updateRatePlanSchema.parse(req.body);
    const plan = await AdvisorMarketplaceService.updateRatePlan(req.user.id, req.params.id, data);
    res.json(plan);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid rate plan data", details: error.errors });
    }
    logger.error("advisorProfileRoutes updateRatePlan error:", error.message);
    res.status(400).json({ error: error.message || "Failed to update rate plan" });
  }
});

/** DELETE /advisor/rates/:id */
router.delete("/rates/:id", async (req: any, res: Response) => {
  try {
    await AdvisorMarketplaceService.deleteRatePlan(req.user.id, req.params.id);
    res.json({ success: true });
  } catch (error: any) {
    logger.error("advisorProfileRoutes deleteRatePlan error:", error.message);
    res.status(400).json({ error: error.message || "Failed to delete rate plan" });
  }
});

/** GET /advisor/availability/rules */
router.get("/availability/rules", async (req: any, res: Response) => {
  try {
    const rules = await AdvisorMarketplaceService.getAvailabilityRules(req.user.id);
    res.json(rules);
  } catch (error: any) {
    logger.error("advisorProfileRoutes getAvailabilityRules error:", error.message);
    res.status(500).json({ error: "Failed to fetch availability rules" });
  }
});

/** PUT /advisor/availability/rules */
router.put("/availability/rules", async (req: any, res: Response) => {
  try {
    const { rules } = setRulesSchema.parse(req.body);
    const result = await AdvisorMarketplaceService.setAvailabilityRules(req.user.id, rules as { dayOfWeek: number; startTime: string; endTime: string; isActive?: boolean; }[]);
    res.json(result);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid rules data", details: error.errors });
    }
    logger.error("advisorProfileRoutes setAvailabilityRules error:", error.message);
    res.status(400).json({ error: error.message || "Failed to set availability rules" });
  }
});

/** GET /advisor/availability/exceptions */
router.get("/availability/exceptions", async (req: any, res: Response) => {
  try {
    const exceptions = await AdvisorMarketplaceService.getAvailabilityExceptions(req.user.id);
    res.json(exceptions);
  } catch (error: any) {
    logger.error("advisorProfileRoutes getAvailabilityExceptions error:", error.message);
    res.status(500).json({ error: "Failed to fetch availability exceptions" });
  }
});

/** POST /advisor/availability/exceptions */
router.post("/availability/exceptions", async (req: any, res: Response) => {
  try {
    const data = createExceptionSchema.parse(req.body);
    const exception = await AdvisorMarketplaceService.createAvailabilityException(req.user.id, {
      date: new Date(data.date),
      isBlackout: data.isBlackout,
      startTime: data.startTime,
      endTime: data.endTime,
      reason: data.reason,
    });
    res.status(201).json(exception);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid exception data", details: error.errors });
    }
    logger.error("advisorProfileRoutes createAvailabilityException error:", error.message);
    res.status(400).json({ error: error.message || "Failed to create exception" });
  }
});

/** DELETE /advisor/availability/exceptions/:id */
router.delete("/availability/exceptions/:id", async (req: any, res: Response) => {
  try {
    await AdvisorMarketplaceService.deleteAvailabilityException(req.user.id, req.params.id);
    res.json({ success: true });
  } catch (error: any) {
    logger.error("advisorProfileRoutes deleteAvailabilityException error:", error.message);
    res.status(400).json({ error: error.message || "Failed to delete exception" });
  }
});

/** GET /advisor/documents */
router.get("/documents", async (req: any, res: Response) => {
  try {
    const docs = await AdvisorMarketplaceService.getLicenseDocuments(req.user.id);
    res.json(docs);
  } catch (error: any) {
    logger.error("advisorProfileRoutes getLicenseDocuments error:", error.message);
    res.status(500).json({ error: "Failed to fetch documents" });
  }
});

/** POST /advisor/documents */
router.post("/documents", async (req: any, res: Response) => {
  try {
    const data = recordDocumentSchema.parse(req.body);
    const doc = await AdvisorMarketplaceService.recordLicenseDocument(req.user.id, {
      documentType: data.documentType,
      storageKey: data.storageKey,
      fileName: data.fileName,
      mimeType: data.mimeType,
      sizeBytes: data.sizeBytes,
      licenseNumber: data.licenseNumber,
      issuingState: data.issuingState,
      expirationDate: data.expirationDate ? new Date(data.expirationDate) : undefined,
    });
    res.status(201).json(doc);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid document data", details: error.errors });
    }
    logger.error("advisorProfileRoutes recordLicenseDocument error:", error.message);
    res.status(400).json({ error: error.message || "Failed to record document" });
  }
});

/** DELETE /advisor/documents/:id */
router.delete("/documents/:id", async (req: any, res: Response) => {
  try {
    await AdvisorMarketplaceService.deleteLicenseDocument(req.user.id, req.params.id);
    res.json({ success: true });
  } catch (error: any) {
    logger.error("advisorProfileRoutes deleteLicenseDocument error:", error.message);
    res.status(400).json({ error: error.message || "Failed to delete document" });
  }
});

/** GET /advisor/earnings */
router.get("/earnings", async (req: any, res: Response) => {
  try {
    const earnings = await AdvisorMarketplaceService.getAdvisorEarnings(req.user.id);
    res.json(earnings);
  } catch (error: any) {
    logger.error("advisorProfileRoutes getAdvisorEarnings error:", error.message);
    res.status(500).json({ error: "Failed to fetch earnings" });
  }
});

/** GET /advisor/dashboard */
router.get("/dashboard", async (req: any, res: Response) => {
  try {
    const { prisma } = await import("../db.js");
    const profile = await prisma.advisorProfile.findUnique({ where: { userId: req.user.id } });
    if (!profile) return res.status(404).json({ error: "Advisor profile not found" });
    const now = new Date();
    const [totalBookings, pendingBookings, confirmedBookings, completedBookings, upcomingBookings, earningsAgg, pendingAgg] =
      await Promise.all([
        prisma.booking.count({ where: { advisorId: profile.id } }),
        prisma.booking.count({ where: { advisorId: profile.id, status: "REQUESTED" } }),
        prisma.booking.count({ where: { advisorId: profile.id, status: "CONFIRMED" } }),
        prisma.booking.count({ where: { advisorId: profile.id, status: "COMPLETED" } }),
        prisma.booking.findMany({
          where: { advisorId: profile.id, status: "CONFIRMED", startTime: { gte: now } },
          orderBy: { startTime: "asc" },
          take: 10,
          include: {
            user: { select: { fullName: true, email: true } },
            ratePlan: { select: { serviceName: true, durationMinutes: true } },
          },
        }),
        prisma.booking.aggregate({ where: { advisorId: profile.id, status: "COMPLETED" }, _sum: { advisorPayout: true } }),
        prisma.booking.aggregate({
          where: { advisorId: profile.id, status: { in: ["CONFIRMED", "COMPLETED"] }, payoutStatus: { not: "PAID" } },
          _sum: { advisorPayout: true },
        }),
      ]);
    res.json({
      stats: {
        totalBookings, pendingBookings, confirmedBookings, completedBookings,
        totalEarnings: Number(earningsAgg._sum.advisorPayout ?? 0),
        pendingEarnings: Number(pendingAgg._sum.advisorPayout ?? 0),
        avgRating: profile.avgRating,
        totalReviews: profile.totalReviews,
      },
      upcomingBookings,
    });
  } catch (error: any) {
    logger.error("advisorProfileRoutes dashboard error:", error.message);
    res.status(500).json({ error: "Failed to fetch dashboard data" });
  }
});

/** GET /advisor/bookings */
router.get("/bookings", async (req: any, res: Response) => {
  try {
    const { prisma } = await import("../db.js");
    const profile = await prisma.advisorProfile.findUnique({ where: { userId: req.user.id } });
    if (!profile) return res.status(404).json({ error: "Advisor profile not found" });
    const bookings = await prisma.booking.findMany({
      where: { advisorId: profile.id },
      include: {
        user: { select: { id: true, fullName: true, email: true } },
        ratePlan: { select: { serviceName: true, durationMinutes: true, priceCents: true } },
        estate: { select: { id: true, name: true } },
        review: { select: { rating: true, comment: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json(bookings);
  } catch (error: any) {
    logger.error("advisorProfileRoutes getBookings error:", error.message);
    res.status(500).json({ error: "Failed to fetch bookings" });
  }
});

export default router;