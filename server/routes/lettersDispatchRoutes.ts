import { Router } from "express";
import { prisma } from "../db.js";
import { logger } from "../lib/logger.js";

const router = Router();

// Default institution list — seeded when estate has no dispatches yet
const DEFAULT_INSTITUTIONS = [
  { name: "Primary Bank / Checking", type: "Bank", needsOriginal: true },
  { name: "Secondary Bank / Savings", type: "Bank", needsOriginal: false },
  { name: "Investment / Brokerage Account", type: "Brokerage", needsOriginal: true },
  { name: "Retirement Account (IRA/401k)", type: "Financial", needsOriginal: false },
  { name: "Life Insurance Company", type: "Insurance", needsOriginal: false },
  { name: "Title Company / Real Estate", type: "Real Estate", needsOriginal: true },
  { name: "Safe Deposit Box Access", type: "Bank", needsOriginal: true },
  { name: "IRS / Tax Authorities", type: "Government", needsOriginal: false },
  { name: "Social Security Administration", type: "Government", needsOriginal: true },
  { name: "DMV / Vehicle Transfer", type: "Government", needsOriginal: false },
  { name: "Employer (Final Pay / Benefits)", type: "Employer", needsOriginal: false },
  { name: "Estate Attorney", type: "Legal", needsOriginal: false },
];

/**
 * GET /api/letters-dispatch/my
 * Returns all LettersDispatch rows for the authenticated user's estate.
 * Auto-seeds defaults if the estate has no rows yet.
 */
router.get("/my", async (req: any, res) => {
  try {
    const estate = await prisma.estate.findFirst({ where: { userId: req.user.id } });
    if (!estate) return res.status(404).json({ error: "No estate found" });

    let dispatches = await prisma.lettersDispatch.findMany({
      where: { estateId: estate.id },
      orderBy: [{ status: "asc" }, { createdAt: "asc" }],
    });

    // Auto-seed defaults on first access
    if (dispatches.length === 0) {
      await prisma.lettersDispatch.createMany({
        data: DEFAULT_INSTITUTIONS.map((inst) => ({
          estateId: estate.id,
          institutionName: inst.name,
          institutionType: inst.type,
          needsOriginal: inst.needsOriginal,
          status: "not_sent",
          isCustom: false,
        })),
      });
      dispatches = await prisma.lettersDispatch.findMany({
        where: { estateId: estate.id },
        orderBy: [{ status: "asc" }, { createdAt: "asc" }],
      });
    }

    res.json(dispatches);
  } catch (err) {
    logger.error("GET /letters-dispatch/my error:", err);
    res.status(500).json({ error: "Failed to fetch letters dispatches" });
  }
});

/**
 * POST /api/letters-dispatch/my
 * Add a custom institution to the list.
 */
router.post("/my", async (req: any, res) => {
  try {
    const estate = await prisma.estate.findFirst({ where: { userId: req.user.id } });
    if (!estate) return res.status(404).json({ error: "No estate found" });

    const { institutionName, institutionType, needsOriginal, notes } = req.body;
    if (!institutionName || !institutionType) {
      return res.status(400).json({ error: "institutionName and institutionType are required" });
    }

    const dispatch = await prisma.lettersDispatch.create({
      data: {
        estateId: estate.id,
        institutionName,
        institutionType,
        needsOriginal: needsOriginal ?? false,
        notes: notes || null,
        status: "not_sent",
        isCustom: true,
      },
    });

    res.status(201).json(dispatch);
  } catch (err) {
    logger.error("POST /letters-dispatch/my error:", err);
    res.status(500).json({ error: "Failed to create dispatch" });
  }
});

/**
 * PATCH /api/letters-dispatch/my/:id
 * Update the status of a dispatch item.
 * Business rules:
 *   - status → "sent": auto-set sentAt = now, followUpDueAt = now + 10 days
 *   - status → "acknowledged": auto-set acknowledgedAt = now, clear followUpDueAt
 *   - status → "not_sent": clear sentAt, acknowledgedAt, followUpDueAt
 */
router.patch("/my/:id", async (req: any, res) => {
  try {
    const estate = await prisma.estate.findFirst({ where: { userId: req.user.id } });
    if (!estate) return res.status(404).json({ error: "No estate found" });

    const existing = await prisma.lettersDispatch.findFirst({
      where: { id: req.params.id, estateId: estate.id },
    });
    if (!existing) return res.status(404).json({ error: "Dispatch not found" });

    const { status, notes, certifiedCopyRef, needsOriginal } = req.body;

    const updateData: any = {};

    if (notes !== undefined) updateData.notes = notes;
    if (certifiedCopyRef !== undefined) updateData.certifiedCopyRef = certifiedCopyRef;
    if (needsOriginal !== undefined) updateData.needsOriginal = needsOriginal;

    if (status !== undefined) {
      updateData.status = status;

      if (status === "sent") {
        const now = new Date();
        updateData.sentAt = now;
        // Auto follow-up in 10 business days (14 calendar days — conservative)
        const followUpDate = new Date(now);
        followUpDate.setDate(followUpDate.getDate() + 14);
        updateData.followUpDueAt = followUpDate;
        updateData.acknowledgedAt = null;
      } else if (status === "acknowledged") {
        updateData.acknowledgedAt = new Date();
        updateData.followUpDueAt = null;
      } else if (status === "not_sent") {
        updateData.sentAt = null;
        updateData.acknowledgedAt = null;
        updateData.followUpDueAt = null;
      }
    }

    const updated = await prisma.lettersDispatch.update({
      where: { id: req.params.id },
      data: updateData,
    });

    res.json(updated);
  } catch (err) {
    logger.error("PATCH /letters-dispatch/my/:id error:", err);
    res.status(500).json({ error: "Failed to update dispatch" });
  }
});

/**
 * DELETE /api/letters-dispatch/my/:id
 * Remove a dispatch (only allowed for custom ones).
 */
router.delete("/my/:id", async (req: any, res) => {
  try {
    const estate = await prisma.estate.findFirst({ where: { userId: req.user.id } });
    if (!estate) return res.status(404).json({ error: "No estate found" });

    const existing = await prisma.lettersDispatch.findFirst({
      where: { id: req.params.id, estateId: estate.id },
    });
    if (!existing) return res.status(404).json({ error: "Dispatch not found" });
    if (!existing.isCustom) {
      return res.status(400).json({ error: "Cannot delete a default institution. Use the 'not_sent' status to skip it." });
    }

    await prisma.lettersDispatch.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) {
    logger.error("DELETE /letters-dispatch/my/:id error:", err);
    res.status(500).json({ error: "Failed to delete dispatch" });
  }
});

/**
 * POST /api/letters-dispatch/my/reset
 * Hard-reset to defaults: deletes all rows, re-seeds.
 */
router.post("/my/reset", async (req: any, res) => {
  try {
    const estate = await prisma.estate.findFirst({ where: { userId: req.user.id } });
    if (!estate) return res.status(404).json({ error: "No estate found" });

    await prisma.lettersDispatch.deleteMany({ where: { estateId: estate.id } });

    await prisma.lettersDispatch.createMany({
      data: DEFAULT_INSTITUTIONS.map((inst) => ({
        estateId: estate.id,
        institutionName: inst.name,
        institutionType: inst.type,
        needsOriginal: inst.needsOriginal,
        status: "not_sent",
        isCustom: false,
      })),
    });

    const dispatches = await prisma.lettersDispatch.findMany({
      where: { estateId: estate.id },
      orderBy: [{ status: "asc" }, { createdAt: "asc" }],
    });

    res.json(dispatches);
  } catch (err) {
    logger.error("POST /letters-dispatch/my/reset error:", err);
    res.status(500).json({ error: "Failed to reset dispatches" });
  }
});

/**
 * GET /api/letters-dispatch/my/pending-followups
 * Returns dispatches with status "sent" and followUpDueAt <= now + 3 days.
 * Used by FollowUps page to surface overdue/approaching items.
 */
router.get("/my/pending-followups", async (req: any, res) => {
  try {
    const estate = await prisma.estate.findFirst({ where: { userId: req.user.id } });
    if (!estate) return res.status(404).json({ error: "No estate found" });

    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

    const dispatches = await prisma.lettersDispatch.findMany({
      where: {
        estateId: estate.id,
        status: "sent",
        followUpDueAt: { lte: threeDaysFromNow },
      },
      orderBy: { followUpDueAt: "asc" },
    });

    res.json(dispatches);
  } catch (err) {
    logger.error("GET /letters-dispatch/my/pending-followups error:", err);
    res.status(500).json({ error: "Failed to fetch pending follow-ups" });
  }
});

export default router;
