import { Router, Response } from "express";
import { authenticate } from "../middleware/auth.js";
import { prisma } from "../db.js";
import { AdvisorMarketplaceService } from "../services/advisorMarketplaceService.js";
import { logger } from "../lib/logger.js";
import { z } from "zod";
import { randomUUID } from "crypto";
import { ADVISOR_PLATFORM_FEE_PERCENT, calculateAdvisorEscrowReleaseDate } from "../config/marketplacePayments.js";
import { BookingPayoutSagaService } from "../services/bookingPayoutSagaService.js";

const router = Router();

// ─── Validation schemas ───────────────────────────────────────────────

const createBookingSchema = z.object({
  advisorId: z.string().uuid(),
  ratePlanId: z.string().uuid(),
  startTime: z.string().datetime(),
  intakeAnswers: z.record(z.unknown()).optional(),
  estateId: z.string().uuid().optional(),
  timezone: z.string().optional(),
  idempotencyKey: z.string().optional(),
});

const rescheduleSchema = z.object({
  newStartTime: z.string().datetime(),
});

const reviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().optional(),
});

const disputeSchema = z.object({
  reason: z.string().min(1),
  description: z.string().optional(),
});

const chatMessageSchema = z.object({
  message: z.string().trim().min(1).max(2000),
});

type BookingChatMessage = {
  id: string;
  senderId: string;
  senderRole: "EXECUTOR" | "ADVISOR";
  senderName: string;
  message: string;
  createdAt: string;
};

const isPlainObject = (value: unknown): value is Record<string, any> =>
  !!value && typeof value === "object" && !Array.isArray(value);

const normalizeIntakeAnswers = (value: unknown): Record<string, any> =>
  isPlainObject(value) ? { ...value } : {};

const readChatMessages = (value: unknown): BookingChatMessage[] => {
  const intake = normalizeIntakeAnswers(value);
  const raw = Array.isArray(intake.chatMessages) ? intake.chatMessages : [];

  return raw
    .map((entry: any) => {
      const role = entry?.senderRole === "ADVISOR" ? "ADVISOR" : "EXECUTOR";
      return {
        id: typeof entry?.id === "string" ? entry.id : "",
        senderId: typeof entry?.senderId === "string" ? entry.senderId : "",
        senderRole: role,
        senderName: typeof entry?.senderName === "string" && entry.senderName.trim() ? entry.senderName : role,
        message: typeof entry?.message === "string" ? entry.message : "",
        createdAt: typeof entry?.createdAt === "string" ? entry.createdAt : "",
      } as BookingChatMessage;
    })
    .filter((entry) => Boolean(entry.id && entry.senderId && entry.message && entry.createdAt))
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
};

// ─── POST /bookings ─────────────────────────────────────────────────────

/**
 * POST /bookings - Create a booking with concurrency-safe slot check
 */
router.post("/", authenticate, async (req: any, res: Response) => {
  try {
    const data = createBookingSchema.parse(req.body);

    // Check idempotency key for duplicate prevention
    if (data.idempotencyKey) {
      const existing = await prisma.booking.findUnique({ where: { idempotencyKey: data.idempotencyKey } });
      if (existing) return res.status(200).json(existing);
    }

    // Fetch advisor and rate plan
    const [advisor, ratePlan] = await Promise.all([
      prisma.advisorProfile.findUnique({ where: { id: data.advisorId } }),
      prisma.advisorRatePlan.findUnique({ where: { id: data.ratePlanId } }),
    ]);

    if (!advisor) return res.status(404).json({ error: "Advisor not found" });
    if (!advisor.status || advisor.status !== "APPROVED") {
      return res.status(400).json({ error: "Advisor is not available for booking" });
    }
    if (!ratePlan || ratePlan.advisorId !== advisor.id || !ratePlan.isActive) {
      return res.status(404).json({ error: "Rate plan not found or inactive" });
    }

    // Calculate times
    const startTime = new Date(data.startTime);
    const endTime = new Date(startTime.getTime() + ratePlan.durationMinutes * 60 * 1000);

    // Calculate amounts
    const totalAmount = ratePlan.priceCents / 100;
    const platformFee = totalAmount * ADVISOR_PLATFORM_FEE_PERCENT;
    const advisorPayout = totalAmount * (1 - ADVISOR_PLATFORM_FEE_PERCENT);

    // Concurrency-safe booking creation using pg advisory lock in a transaction
    const booking = await prisma.$transaction(async (tx: any) => {
      // Acquire advisory lock scoped to this advisor+startTime combo
      const lockKey = `${data.advisorId}${data.startTime}`;
      await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${lockKey}))`;

      // Check for overlapping REQUESTED or CONFIRMED bookings
      const conflict = await tx.booking.findFirst({
        where: {
          advisorId: data.advisorId,
          status: { in: ["REQUESTED", "CONFIRMED"] },
          AND: [
            { startTime: { lt: endTime } },
            { endTime: { gt: startTime } },
          ],
        },
      });

      if (conflict) {
        throw Object.assign(new Error("Time slot is no longer available"), { status: 409 });
      }

      // Determine initial status
      const initialStatus = advisor.requiresApproval ? "REQUESTED" : "CONFIRMED";

      return tx.booking.create({
        data: {
          userId: req.user.id,
          advisorId: data.advisorId,
          ratePlanId: data.ratePlanId,
          estateId: data.estateId,
          startTime,
          endTime,
          durationMinutes: ratePlan.durationMinutes,
          timezone: data.timezone ?? "America/New_York",
          totalAmount,
          platformFee,
          advisorPayout,
          currency: ratePlan.currency,
          intakeAnswers: data.intakeAnswers,
          idempotencyKey: data.idempotencyKey,
          status: initialStatus as any,
          payoutStatus: "UNPAID",
        },
        include: {
          advisor: { include: { user: { select: { fullName: true } } } },
          ratePlan: true,
        },
      });
    });

    logger.info(`Booking created: ${booking.id} status=${booking.status}`);
    res.status(201).json(booking);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid booking data", details: error.errors });
    }
    if (error.status === 409) return res.status(409).json({ error: error.message });
    logger.error("bookingMarketplaceRoutes createBooking error:", error.message);
    res.status(500).json({ error: error.message || "Failed to create booking" });
  }
});

/** GET /bookings/my-bookings */
router.get("/my-bookings", authenticate, async (req: any, res: Response) => {
  try {
    const bookings = await prisma.booking.findMany({
      where: { userId: req.user.id },
      include: {
        advisor: { include: { user: { select: { fullName: true, email: true } } } },
        ratePlan: { select: { serviceName: true, durationMinutes: true } },
        estate: { select: { id: true, name: true } },
        review: { select: { rating: true, comment: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json(bookings);
  } catch (error: any) {
    logger.error("bookingMarketplaceRoutes my-bookings error:", error.message);
    res.status(500).json({ error: "Failed to fetch bookings" });
  }
});

/** GET /bookings - alias for my bookings (backwards compatibility) */
router.get("/", authenticate, async (req: any, res: Response) => {
  try {
    const bookings = await prisma.booking.findMany({
      where: { userId: req.user.id },
      include: {
        advisor: { include: { user: { select: { fullName: true, email: true } } } },
        ratePlan: { select: { serviceName: true, durationMinutes: true } },
        estate: { select: { id: true, name: true } },
        review: { select: { rating: true, comment: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json(bookings);
  } catch (error: any) {
    logger.error("bookingMarketplaceRoutes bookings-root error:", error.message);
    res.status(500).json({ error: "Failed to fetch bookings" });
  }
});

/** GET /bookings/advisor-bookings */
router.get("/advisor-bookings", authenticate, async (req: any, res: Response) => {
  try {
    const profile = await prisma.advisorProfile.findUnique({ where: { userId: req.user.id } });
    if (!profile) return res.status(404).json({ error: "Advisor profile not found" });
    const bookings = await prisma.booking.findMany({
      where: { advisorId: profile.id },
      include: {
        user: { select: { id: true, fullName: true, email: true } },
        ratePlan: { select: { serviceName: true, durationMinutes: true } },
        estate: { select: { id: true, name: true } },
        review: { select: { rating: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json(bookings);
  } catch (error: any) {
    logger.error("bookingMarketplaceRoutes advisor-bookings error:", error.message);
    res.status(500).json({ error: "Failed to fetch advisor bookings" });
  }
});

/** GET /bookings/:id */
router.get("/:id", authenticate, async (req: any, res: Response) => {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: req.params.id },
      include: {
        user: { select: { id: true, fullName: true, email: true } },
        advisor: { include: { user: { select: { fullName: true, email: true } } } },
        ratePlan: true,
        estate: { select: { id: true, name: true } },
        review: true,
        dispute: true,
      },
    });
    if (!booking) return res.status(404).json({ error: "Booking not found" });
    // Authorization: must be the client or the advisor
    const isAdvisor = booking.advisor?.userId === req.user.id;
    if (booking.userId !== req.user.id && !isAdvisor) {
      return res.status(403).json({ error: "Forbidden" });
    }
    res.json(booking);
  } catch (error: any) {
    logger.error("bookingMarketplaceRoutes getBooking error:", error.message);
    res.status(500).json({ error: "Failed to fetch booking" });
  }
});

/** GET /bookings/:id/messages - booking chat history for advisor + executor */
router.get("/:id/messages", authenticate, async (req: any, res: Response) => {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: req.params.id },
      include: {
        user: { select: { id: true, fullName: true, email: true } },
        advisor: { include: { user: { select: { id: true, fullName: true, email: true } } } },
      },
    });

    if (!booking) return res.status(404).json({ error: "Booking not found" });

    const isAdvisor = booking.advisor?.userId === req.user.id;
    if (booking.userId !== req.user.id && !isAdvisor) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const messages = readChatMessages(booking.intakeAnswers);
    res.json({ messages });
  } catch (error: any) {
    logger.error("bookingMarketplaceRoutes getMessages error:", error.message);
    res.status(500).json({ error: "Failed to fetch booking messages" });
  }
});

/** POST /bookings/:id/messages - append booking chat message */
router.post("/:id/messages", authenticate, async (req: any, res: Response) => {
  try {
    const data = chatMessageSchema.parse(req.body);

    const payload = await prisma.$transaction(async (tx: any) => {
      const lockKey = `booking-chat-${req.params.id}`;
      await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${lockKey}))`;

      const booking = await tx.booking.findUnique({
        where: { id: req.params.id },
        include: {
          user: { select: { id: true, fullName: true, email: true } },
          advisor: { include: { user: { select: { id: true, fullName: true, email: true } } } },
        },
      });

      if (!booking) throw Object.assign(new Error("Booking not found"), { status: 404 });

      const isAdvisor = booking.advisor?.userId === req.user.id;
      if (booking.userId !== req.user.id && !isAdvisor) {
        throw Object.assign(new Error("Forbidden"), { status: 403 });
      }

      if (["CANCELLED", "REFUNDED"].includes(String(booking.status))) {
        throw Object.assign(new Error("Messaging is disabled for cancelled bookings"), { status: 400 });
      }

      const senderRole: "EXECUTOR" | "ADVISOR" = isAdvisor ? "ADVISOR" : "EXECUTOR";
      const senderName = isAdvisor
        ? booking.advisor?.user?.fullName || booking.advisor?.user?.email || "Advisor"
        : booking.user?.fullName || booking.user?.email || "Executor";

      const nextMessage: BookingChatMessage = {
        id: randomUUID(),
        senderId: req.user.id,
        senderRole,
        senderName,
        message: data.message,
        createdAt: new Date().toISOString(),
      };

      const intake = normalizeIntakeAnswers(booking.intakeAnswers);
      const existing = readChatMessages(booking.intakeAnswers);
      const chatMessages = [...existing, nextMessage];

      const updated = await tx.booking.update({
        where: { id: booking.id },
        data: {
          intakeAnswers: {
            ...intake,
            chatMessages,
          },
        },
        select: { id: true },
      });

      return { bookingId: updated.id, message: nextMessage, messages: chatMessages };
    });

    res.status(201).json(payload);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid message data", details: error.errors });
    }

    const status = Number(error?.status || 0);
    if (status === 403 || status === 404 || status === 400) {
      return res.status(status).json({ error: error.message });
    }

    logger.error("bookingMarketplaceRoutes postMessage error:", error.message);
    res.status(500).json({ error: "Failed to send booking message" });
  }
});
/** POST /bookings/:id/payment - create Stripe payment intent */
router.post("/:id/payment", authenticate, async (req: any, res: Response) => {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: req.params.id },
      include: { advisor: true },
    });
    if (!booking) return res.status(404).json({ error: "Booking not found" });
    if (booking.userId !== req.user.id) return res.status(403).json({ error: "Forbidden" });
    if (booking.status === "CANCELLED") return res.status(400).json({ error: "Cannot pay for a cancelled booking" });

    const { StripeService } = await import("../services/stripeService.js");
    const amountDollars = Number(booking.totalAmount);

    if (!booking.advisor.stripeAccountId) {
      return res.status(400).json({ error: "Advisor has not completed payment setup" });
    }

    const paymentIntent = await StripeService.createBookingPaymentIntent(
      req.params.id,
      amountDollars,
      booking.advisor.stripeAccountId
    );
    res.json(paymentIntent);
  } catch (error: any) {
    logger.error("bookingMarketplaceRoutes payment error:", error.message);
    res.status(500).json({ error: error.message || "Failed to create payment intent" });
  }
});

/** POST /bookings/:id/confirm - advisor confirms REQUESTED->CONFIRMED */
router.post("/:id/confirm", authenticate, async (req: any, res: Response) => {
  try {
    const advisor = await prisma.advisorProfile.findUnique({ where: { userId: req.user.id } });
    if (!advisor) return res.status(403).json({ error: "Only advisors can confirm bookings" });
    const booking = await prisma.booking.findUnique({ where: { id: req.params.id } });
    if (!booking) return res.status(404).json({ error: "Booking not found" });
    if (booking.advisorId !== advisor.id) return res.status(403).json({ error: "Forbidden" });
    if (booking.status !== "REQUESTED") return res.status(400).json({ error: "Booking is not in REQUESTED status" });
    const updated = await prisma.booking.update({
      where: { id: req.params.id },
      data: { status: "CONFIRMED" },
    });
    res.json(updated);
  } catch (error: any) {
    logger.error("bookingMarketplaceRoutes confirm error:", error.message);
    res.status(500).json({ error: error.message || "Failed to confirm booking" });
  }
});

/** POST /bookings/:id/cancel */
router.post("/:id/cancel", authenticate, async (req: any, res: Response) => {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: req.params.id },
      include: { advisor: true },
    });
    if (!booking) return res.status(404).json({ error: "Booking not found" });

    const isClient = booking.userId === req.user.id;
    const isAdvisor = booking.advisor.userId === req.user.id;
    if (!isClient && !isAdvisor) return res.status(403).json({ error: "Forbidden" });
    if (["CANCELLED", "COMPLETED", "REFUNDED"].includes(booking.status as string)) {
      return res.status(400).json({ error: "Booking cannot be cancelled in its current state" });
    }

    // Check cancellation policy
    let shouldRefund = false;
    if (isClient && booking.status === "CONFIRMED") {
      const hoursUntilSession = (booking.startTime.getTime() - Date.now()) / (1000 * 60 * 60);
      shouldRefund = hoursUntilSession >= (booking.advisor.cancellationHours ?? 24);
    } else if (isAdvisor) {
      shouldRefund = true; // Advisor cancellation always refunds
    }

    const updated = await prisma.booking.update({
      where: { id: req.params.id },
      data: {
        status: "CANCELLED",
        cancellationReason: req.body.reason,
        cancelledBy: req.user.id,
        cancelledAt: new Date(),
        refundAmount: shouldRefund ? Number(booking.totalAmount) : undefined,
        refundedAt: shouldRefund ? new Date() : undefined,
      },
    });
    res.json({ booking: updated, refunded: shouldRefund });
  } catch (error: any) {
    logger.error("bookingMarketplaceRoutes cancel error:", error.message);
    res.status(500).json({ error: error.message || "Failed to cancel booking" });
  }
});

/** POST /bookings/:id/complete - CONFIRMED->COMPLETED (advisor only) */
router.post("/:id/complete", authenticate, async (req: any, res: Response) => {
  try {
    const advisor = await prisma.advisorProfile.findUnique({ where: { userId: req.user.id } });
    if (!advisor) return res.status(403).json({ error: "Only advisors can complete bookings" });
    const booking = await prisma.booking.findUnique({ where: { id: req.params.id } });
    if (!booking) return res.status(404).json({ error: "Booking not found" });
    if (booking.advisorId !== advisor.id) return res.status(403).json({ error: "Forbidden" });
    if (booking.status !== "CONFIRMED") return res.status(400).json({ error: "Only CONFIRMED bookings can be completed" });

    const updated = await prisma.booking.update({
      where: { id: req.params.id },
      data: {
        status: "COMPLETED",
        escrowReleaseDate: calculateAdvisorEscrowReleaseDate(new Date()),
      },
    });

    await BookingPayoutSagaService.enqueueBookingCompletedEvent({
      bookingId: updated.id,
      source: "advisor-complete",
      correlationId: updated.id,
    });

    res.json(updated);
  } catch (error: any) {
    logger.error("bookingMarketplaceRoutes complete error:", error.message);
    res.status(500).json({ error: error.message || "Failed to complete booking" });
  }
});
/** POST /bookings/:id/no-show - mark NO_SHOW (advisor only) */
router.post("/:id/no-show", authenticate, async (req: any, res: Response) => {
  try {
    const advisor = await prisma.advisorProfile.findUnique({ where: { userId: req.user.id } });
    if (!advisor) return res.status(403).json({ error: "Only advisors can mark no-show" });
    const booking = await prisma.booking.findUnique({ where: { id: req.params.id } });
    if (!booking) return res.status(404).json({ error: "Booking not found" });
    if (booking.advisorId !== advisor.id) return res.status(403).json({ error: "Forbidden" });
    if (booking.status !== "CONFIRMED") return res.status(400).json({ error: "Only CONFIRMED bookings can be marked no-show" });
    const updated = await prisma.booking.update({
      where: { id: req.params.id },
      data: { status: "NO_SHOW" },
    });
    res.json(updated);
  } catch (error: any) {
    logger.error("bookingMarketplaceRoutes no-show error:", error.message);
    res.status(500).json({ error: error.message || "Failed to mark no-show" });
  }
});

/** POST /bookings/:id/reschedule */
router.post("/:id/reschedule", authenticate, async (req: any, res: Response) => {
  try {
    const { newStartTime } = rescheduleSchema.parse(req.body);
    const booking = await prisma.booking.findUnique({
      where: { id: req.params.id },
      include: { ratePlan: true, advisor: true },
    });
    if (!booking) return res.status(404).json({ error: "Booking not found" });
    const isAdvisor = booking.advisor.userId === req.user.id;
    if (booking.userId !== req.user.id && !isAdvisor) return res.status(403).json({ error: "Forbidden" });
    if (!["REQUESTED", "CONFIRMED"].includes(booking.status as string)) {
      return res.status(400).json({ error: "Booking cannot be rescheduled in its current state" });
    }
    const newStart = new Date(newStartTime);
    const newEnd = new Date(newStart.getTime() + (booking.durationMinutes * 60 * 1000));

    // Check for conflicts at new time
    const conflict = await prisma.booking.findFirst({
      where: {
        advisorId: booking.advisorId,
        id: { not: booking.id },
        status: { in: ["REQUESTED", "CONFIRMED"] },
        AND: [{ startTime: { lt: newEnd } }, { endTime: { gt: newStart } }],
      },
    });
    if (conflict) return res.status(409).json({ error: "New time slot is not available" });

    const updated = await prisma.booking.update({
      where: { id: req.params.id },
      data: { startTime: newStart, endTime: newEnd, status: "REQUESTED" },
    });
    res.json(updated);
  } catch (error: any) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: "Invalid data", details: error.errors });
    logger.error("bookingMarketplaceRoutes reschedule error:", error.message);
    res.status(500).json({ error: error.message || "Failed to reschedule booking" });
  }
});

/** POST /bookings/:id/notes - advisor saves post-call notes */
router.post("/:id/notes", authenticate, async (req: any, res: Response) => {
  try {
    const { notes } = z.object({ notes: z.string() }).parse(req.body);
    const advisor = await prisma.advisorProfile.findUnique({ where: { userId: req.user.id } });
    if (!advisor) return res.status(403).json({ error: "Only advisors can add notes" });
    const booking = await prisma.booking.findUnique({ where: { id: req.params.id } });
    if (!booking) return res.status(404).json({ error: "Booking not found" });
    if (booking.advisorId !== advisor.id) return res.status(403).json({ error: "Forbidden" });
    const updated = await prisma.booking.update({
      where: { id: req.params.id },
      data: { advisorNotes: notes },
    });
    res.json(updated);
  } catch (error: any) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: "Invalid data", details: error.errors });
    logger.error("bookingMarketplaceRoutes notes error:", error.message);
    res.status(500).json({ error: error.message || "Failed to save notes" });
  }
});

/** POST /bookings/:id/review - executor leaves review */
router.post("/:id/review", authenticate, async (req: any, res: Response) => {
  try {
    const data = reviewSchema.parse(req.body);
    const booking = await prisma.booking.findUnique({
      where: { id: req.params.id },
      include: { review: true },
    });
    if (!booking) return res.status(404).json({ error: "Booking not found" });
    if (booking.userId !== req.user.id) return res.status(403).json({ error: "Only the client can leave a review" });
    if (booking.status !== "COMPLETED") return res.status(400).json({ error: "Can only review completed bookings" });
    if (booking.review) return res.status(400).json({ error: "Review already exists for this booking" });

    const review = await prisma.review.create({
      data: {
        bookingId: req.params.id,
        userId: req.user.id,
        advisorId: booking.advisorId,
        rating: data.rating,
        comment: data.comment,
      },
    });

    // Update advisor avg rating
    const allReviews = await prisma.review.findMany({
      where: { advisorId: booking.advisorId },
      select: { rating: true },
    });
    const avgRating = allReviews.reduce((s: number, r: any) => s + r.rating, 0) / allReviews.length;
    await prisma.advisorProfile.update({
      where: { id: booking.advisorId },
      data: { avgRating, totalReviews: allReviews.length },
    });

    res.status(201).json(review);
  } catch (error: any) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: "Invalid data", details: error.errors });
    logger.error("bookingMarketplaceRoutes review error:", error.message);
    res.status(500).json({ error: error.message || "Failed to submit review" });
  }
});

/** POST /bookings/:id/dispute - open a dispute */
router.post("/:id/dispute", authenticate, async (req: any, res: Response) => {
  try {
    const data = disputeSchema.parse(req.body);
    const dispute = await AdvisorMarketplaceService.openDispute(
      req.user.id,
      req.params.id,
      data.reason,
      data.description
    );
    res.status(201).json(dispute);
  } catch (error: any) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: "Invalid data", details: error.errors });
    logger.error("bookingMarketplaceRoutes dispute error:", error.message);
    res.status(400).json({ error: error.message || "Failed to open dispute" });
  }
});

export default router;



