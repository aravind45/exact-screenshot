import { Router, Response } from "express";
import { authenticate } from "../middleware/auth.js";
import { AdvisorMarketplaceService } from "../services/advisorMarketplaceService.js";
import { RoleUtils } from "../utils/userUtils.js";
import { logger } from "../lib/logger.js";
import { z } from "zod";

const router = Router();

// ─── isAdmin middleware ───────────────────────────────────────────────────

const isAdmin = (req: any, res: Response, next: any) => {
  if (!req.user) return res.status(401).json({ error: "Authentication required" });
  if (!RoleUtils.isAdmin(req.user)) return res.status(403).json({ error: "Admin access required" });
  next();
};

// All admin routes require authentication + admin role
router.use(authenticate as any, isAdmin);

// ─── Validation schemas ───────────────────────────────────────────────────

const approveSchema = z.object({ reason: z.string().optional() });
const rejectSchema = z.object({ reason: z.string().min(1) });
const pauseSchema = z.object({ reason: z.string().optional() });
const verifyDocSchema = z.object({
  status: z.enum(["VERIFIED", "REJECTED"]),
  reason: z.string().optional(),
});
const resolveDisputeSchema = z.object({
  resolution: z.string().min(1),
  refundType: z.enum(["REFUND", "RELEASE"]),
  refundAmount: z.number().int().min(0).optional(),
});

// ─── Routes ──────────────────────────────────────────────────────────────

/** GET /admin/marketplace/advisors - paginated advisor queue */
router.get("/advisors", async (req: any, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status as string | undefined;

    // Use the service queue method (all statuses) or filter by status
    if (status) {
      const { prisma } = await import("../db.js");
      const skip = (page - 1) * limit;
      const where = { status: status as any };
      const [advisors, total] = await Promise.all([
        prisma.advisorProfile.findMany({
          where,
          include: { user: { select: { fullName: true, email: true } }, licenseDocuments: { select: { id: true, documentType: true, status: true, expirationDate: true } } },
          orderBy: { updatedAt: "desc" },
          skip, take: limit,
        }),
        prisma.advisorProfile.count({ where }),
      ]);
      return res.json({ advisors, total, page, limit, totalPages: Math.ceil(total / limit) });
    }

    const result = await AdvisorMarketplaceService.getAdminQueue(page, limit);
    res.json(result);
  } catch (error: any) {
    logger.error("adminMarketplaceRoutes getAdvisors error:", error.message);
    res.status(500).json({ error: "Failed to fetch advisors" });
  }
});

/** GET /admin/marketplace/advisors/:id */
router.get("/advisors/:id", async (req: any, res: Response) => {
  try {
    const advisor = await AdvisorMarketplaceService.adminGetAdvisorDetail(req.params.id);
    if (!advisor) return res.status(404).json({ error: "Advisor not found" });
    res.json(advisor);
  } catch (error: any) {
    logger.error("adminMarketplaceRoutes getAdvisorDetail error:", error.message);
    res.status(500).json({ error: "Failed to fetch advisor" });
  }
});

/** POST /admin/marketplace/advisors/:id/approve */
router.post("/advisors/:id/approve", async (req: any, res: Response) => {
  try {
    const { reason } = approveSchema.parse(req.body);
    const profile = await AdvisorMarketplaceService.adminApproveAdvisor(req.user.id, req.params.id, reason);
    res.json(profile);
  } catch (error: any) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: "Invalid data", details: error.errors });
    logger.error("adminMarketplaceRoutes approve error:", error.message);
    res.status(400).json({ error: error.message || "Failed to approve advisor" });
  }
});

/** POST /admin/marketplace/advisors/:id/reject */
router.post("/advisors/:id/reject", async (req: any, res: Response) => {
  try {
    const { reason } = rejectSchema.parse(req.body);
    const profile = await AdvisorMarketplaceService.adminRejectAdvisor(req.user.id, req.params.id, reason);
    res.json(profile);
  } catch (error: any) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: "Invalid data", details: error.errors });
    logger.error("adminMarketplaceRoutes reject error:", error.message);
    res.status(400).json({ error: error.message || "Failed to reject advisor" });
  }
});

/** POST /admin/marketplace/advisors/:id/pause */
router.post("/advisors/:id/pause", async (req: any, res: Response) => {
  try {
    const { reason } = pauseSchema.parse(req.body);
    const profile = await AdvisorMarketplaceService.adminPauseAdvisor(req.user.id, req.params.id, reason);
    res.json(profile);
  } catch (error: any) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: "Invalid data", details: error.errors });
    logger.error("adminMarketplaceRoutes pause error:", error.message);
    res.status(400).json({ error: error.message || "Failed to pause advisor" });
  }
});

/** POST /admin/marketplace/advisors/:id/unpause */
router.post("/advisors/:id/unpause", async (req: any, res: Response) => {
  try {
    const profile = await AdvisorMarketplaceService.adminUnpauseAdvisor(req.user.id, req.params.id);
    res.json(profile);
  } catch (error: any) {
    logger.error("adminMarketplaceRoutes unpause error:", error.message);
    res.status(400).json({ error: error.message || "Failed to unpause advisor" });
  }
});

/** POST /admin/marketplace/documents/:id/verify */
router.post("/documents/:id/verify", async (req: any, res: Response) => {
  try {
    const { status, reason } = verifyDocSchema.parse(req.body);
    const doc = await AdvisorMarketplaceService.adminVerifyDocument(req.user.id, req.params.id, status, reason);
    res.json(doc);
  } catch (error: any) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: "Invalid data", details: error.errors });
    logger.error("adminMarketplaceRoutes verifyDocument error:", error.message);
    res.status(400).json({ error: error.message || "Failed to verify document" });
  }
});

/** GET /admin/marketplace/disputes */
router.get("/disputes", async (req: any, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status as string | undefined;
    const result = await AdvisorMarketplaceService.getDisputes(page, limit, status);
    res.json(result);
  } catch (error: any) {
    logger.error("adminMarketplaceRoutes getDisputes error:", error.message);
    res.status(500).json({ error: "Failed to fetch disputes" });
  }
});

/** POST /admin/marketplace/disputes/:id/resolve */
router.post("/disputes/:id/resolve", async (req: any, res: Response) => {
  try {
    const { resolution, refundType, refundAmount } = resolveDisputeSchema.parse(req.body);
    const result = await AdvisorMarketplaceService.adminResolveDispute(
      req.user.id,
      req.params.id,
      refundType,
      { resolution, refundAmount },
    );
    res.json(result);
  } catch (error: any) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: "Invalid data", details: error.errors });
    logger.error("adminMarketplaceRoutes resolveDispute error:", error.message);
    res.status(400).json({ error: error.message || "Failed to resolve dispute" });
  }
});

/** GET /admin/marketplace/audit-log */
router.get("/audit-log", async (req: any, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const filters = {
      action: req.query.action as string | undefined,
      targetType: req.query.targetType as string | undefined,
      adminId: req.query.adminId as string | undefined,
    };
    const result = await AdvisorMarketplaceService.getAuditLog(page, limit, filters);
    res.json(result);
  } catch (error: any) {
    logger.error("adminMarketplaceRoutes auditLog error:", error.message);
    res.status(500).json({ error: "Failed to fetch audit log" });
  }
});

export default router;