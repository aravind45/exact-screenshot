import { Router } from "express";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
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

/**
 * POST /api/letters-dispatch/my/:id/generate-letter
 * Generates a professional "Notification of Death" letter PDF for a specific institution.
 * Uses estate data (executor name, case number, deceased info) + LettersDispatch institution name.
 * Returns application/pdf — client downloads directly.
 */
router.post("/my/:id/generate-letter", async (req: any, res) => {
  try {
    const estate = await (prisma as any).estate.findFirst({
      where: { userId: req.user.id },
      include: { user: true },
    });
    if (!estate) return res.status(404).json({ error: "No estate found" });

    const dispatch = await (prisma as any).lettersDispatch.findFirst({
      where: { id: req.params.id, estateId: estate.id },
    });
    if (!dispatch) return res.status(404).json({ error: "Dispatch item not found" });

    // ── Build the PDF ──────────────────────────────────────────────────────
    const doc = await PDFDocument.create();
    const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
    const fontRegular = await doc.embedFont(StandardFonts.Helvetica);

    const page = doc.addPage([612, 792]); // US Letter
    const { width, height } = page.getSize();
    const margin = 72; // 1-inch margins
    let y = height - margin;

    const executorName = String(estate.user?.fullName || "The Executor");
    const deceasedName = `${String(estate.deceasedFirstName || "")} ${String(estate.deceasedLastName || "")}`.trim();
    const caseNumber = String(estate.courtCaseNumber || "[Case Number Pending]");
    const jurisdiction = String(estate.deceasedState || "");
    const institution = String(dispatch.institutionName);
    const institutionType = String(dispatch.institutionType || "");
    const dateOfDeath = estate.deceasedDateOfDeath
      ? new Date(estate.deceasedDateOfDeath).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
      : "[Date of Death]";
    const today = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

    const draw = (text: string, size = 11, font = fontRegular, xOff = 0) => {
      if (y < margin + 20) {
        // overflow protection — in practice letters fit on one page
        y = height - margin;
      }
      page.drawText(text, { x: margin + xOff, y, size, font, color: rgb(0, 0, 0) });
      y -= size + 6;
    };

    const gap = (n = 12) => { y -= n; };

    // ── Header: Sender block ───────────────────────────────────────────────
    draw(executorName, 11, fontBold);
    draw("Executor / Personal Representative", 10);
    draw(`Estate of ${deceasedName}`, 10);
    if (caseNumber !== "[Case Number Pending]") {
      draw(`Case No: ${caseNumber}`, 10);
    }

    gap(20);

    // ── Date ──────────────────────────────────────────────────────────────
    draw(today, 11);
    gap(16);

    // ── Recipient block ───────────────────────────────────────────────────
    draw("TO:", 10, fontBold);
    draw(institution, 11, fontBold);
    if (institutionType) draw(`(${institutionType})`, 10);
    gap(16);

    // ── Subject ──────────────────────────────────────────────────────────
    draw(`RE: Estate of ${deceasedName} — Notification of Death`, 11, fontBold);
    if (caseNumber !== "[Case Number Pending]") {
      draw(`Case No: ${caseNumber}`, 11);
    }
    gap(16);

    // ── Salutation ───────────────────────────────────────────────────────
    draw("To Whom It May Concern:", 11);
    gap(8);

    // ── Body paragraphs ───────────────────────────────────────────────────
    const wrapText = (text: string, maxWidth: number, size: number, font: any): string[] => {
      const words = text.split(" ");
      const lines: string[] = [];
      let current = "";
      for (const word of words) {
        const test = current ? `${current} ${word}` : word;
        const w = font.widthOfTextAtSize(test, size);
        if (w > maxWidth && current) {
          lines.push(current);
          current = word;
        } else {
          current = test;
        }
      }
      if (current) lines.push(current);
      return lines;
    };

    const bodyWidth = width - margin * 2;

    const para1 = `Please be advised that ${deceasedName} passed away on ${dateOfDeath}. I have been appointed as the Executor and Personal Representative of the Estate of ${deceasedName}${jurisdiction ? `, a resident of ${jurisdiction}` : ""}. A copy of my Letters Testamentary / Letters of Administration is enclosed for your records.`;
    for (const line of wrapText(para1, bodyWidth, 11, fontRegular)) {
      draw(line, 11);
    }
    gap(10);

    const para2 = `I am writing to formally notify your institution of this death and to request that you place a hold or "estate freeze" on all accounts, safe deposit boxes, or assets held in the name of the deceased to prevent unauthorized transactions pending formal estate administration.`;
    for (const line of wrapText(para2, bodyWidth, 11, fontRegular)) {
      draw(line, 11);
    }
    gap(10);

    const para3 = `Please provide the following information at your earliest convenience:`;
    draw(para3, 11);
    gap(4);
    const requests = [
      "1. A certified date-of-death balance statement for all accounts",
      "2. A list of all documentation required to transfer or close the account(s)",
      "3. Any outstanding balances, fees, or obligations owed to your institution",
    ];
    for (const req of requests) {
      draw(req, 11, fontRegular, 16);
    }
    gap(10);

    const para4 = `If there are any outstanding balances or claims against the estate, please provide written notice within thirty (30) days of receipt of this letter. Please direct all future correspondence regarding this matter to the address provided above.`;
    for (const line of wrapText(para4, bodyWidth, 11, fontRegular)) {
      draw(line, 11);
    }
    gap(10);

    draw("We appreciate your prompt attention to this matter.", 11);
    gap(20);

    // ── Closing ───────────────────────────────────────────────────────────
    draw("Respectfully,", 11);
    gap(32); // signature space
    draw("___________________________________", 11);
    draw(executorName, 11, fontBold);
    draw("Executor / Personal Representative", 10);
    draw(`Estate of ${deceasedName}`, 10);
    gap(20);

    // ── Footer ────────────────────────────────────────────────────────────
    page.drawLine({
      start: { x: margin, y: margin - 10 },
      end: { x: width - margin, y: margin - 10 },
      thickness: 0.5,
      color: rgb(0.7, 0.7, 0.7),
    });
    page.drawText("Generated by ExpectedEstate · This letter is for informational purposes and does not constitute legal advice.", {
      x: margin,
      y: margin - 24,
      size: 7,
      font: fontRegular,
      color: rgb(0.5, 0.5, 0.5),
    });

    const pdfBytes = await doc.save();

    const safeName = institution.replace(/[^a-zA-Z0-9]/g, "_").toLowerCase();
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="letter_${safeName}.pdf"`);
    res.send(Buffer.from(pdfBytes));
  } catch (err) {
    logger.error("POST /letters-dispatch/my/:id/generate-letter error:", err);
    res.status(500).json({ error: "Failed to generate letter" });
  }
});

export default router;
