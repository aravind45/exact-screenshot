import { prisma } from '../db.js';
import { logger } from '../lib/logger.js';
import { StripeService } from './stripeService.js';

const WORKFLOW_TYPE = 'BOOKING_TO_PAYOUT';

type StepStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'SKIPPED';

const STEP_PAYMENT_CAPTURE = 'PAYMENT_CAPTURE';
const STEP_SESSION_COMPLETED = 'SESSION_COMPLETED';
const STEP_PAYOUT_RELEASE = 'PAYOUT_RELEASE';

export class BookingPayoutSagaService {
  private static async getOrCreateRun(bookingId: string, correlationId?: string) {
    return prisma.workflowRun.upsert({
      where: {
        workflowType_aggregateId: {
          workflowType: WORKFLOW_TYPE,
          aggregateId: bookingId,
        },
      },
      update: {
        correlationId: correlationId ?? undefined,
        updatedAt: new Date(),
      },
      create: {
        workflowType: WORKFLOW_TYPE,
        correlationId,
        aggregateType: 'BOOKING',
        aggregateId: bookingId,
        state: 'STARTED',
        status: 'RUNNING',
      },
    });
  }

  private static async markStep(
    workflowRunId: string,
    stepName: string,
    status: StepStatus,
    payload?: Record<string, unknown>,
    errorMessage?: string,
  ) {
    const now = new Date();
    const existing = await prisma.workflowStep.findUnique({
      where: {
        workflowRunId_stepName: {
          workflowRunId,
          stepName,
        },
      },
    });

    const shouldIncrementAttempt = status === 'RUNNING' || status === 'FAILED';
    const terminalStatus = status === 'COMPLETED' || status === 'FAILED' || status === 'SKIPPED';

    if (!existing) {
      await prisma.workflowStep.create({
        data: {
          workflowRunId,
          stepName,
          status,
          attempt: shouldIncrementAttempt ? 1 : 0,
          startedAt: status === 'RUNNING' ? now : null,
          endedAt: terminalStatus ? now : null,
          lastError: errorMessage,
          payload: (payload as any) ?? undefined,
        },
      });
      return;
    }

    await prisma.workflowStep.update({
      where: {
        workflowRunId_stepName: {
          workflowRunId,
          stepName,
        },
      },
      data: {
        status,
        attempt: shouldIncrementAttempt ? { increment: 1 } : undefined,
        startedAt: status === 'RUNNING' ? (existing.startedAt ?? now) : existing.startedAt,
        endedAt: terminalStatus ? now : null,
        lastError: errorMessage,
        payload: (payload as any) ?? undefined,
      },
    });
  }

  private static async updateRun(
    workflowRunId: string,
    data: {
      state: string;
      status: 'RUNNING' | 'COMPLETED' | 'FAILED';
      lastError?: string | null;
      finishedAt?: Date | null;
    }
  ) {
    await prisma.workflowRun.update({
      where: { id: workflowRunId },
      data: {
        state: data.state,
        status: data.status,
        lastError: data.lastError ?? null,
        finishedAt: data.finishedAt ?? null,
      },
    });
  }

  static async enqueueBookingCompletedEvent(params: {
    bookingId: string;
    correlationId?: string;
    source?: string;
    availableAt?: Date;
  }) {
    const dedupeKey = `booking:${params.bookingId}:completed`;

    try {
      await prisma.outboxEvent.create({
        data: {
          eventType: 'booking.completed',
          aggregateType: 'BOOKING',
          aggregateId: params.bookingId,
          correlationId: params.correlationId,
          dedupeKey,
          payload: {
            bookingId: params.bookingId,
            source: params.source ?? 'unknown',
            occurredAt: new Date().toISOString(),
          },
          nextAttemptAt: params.availableAt ?? new Date(),
        },
      });
      return { queued: true };
    } catch (error: any) {
      if (error?.code === 'P2002') {
        return { queued: false, duplicate: true };
      }
      throw error;
    }
  }

  static async enqueuePayoutReleaseEvent(params: {
    bookingId: string;
    correlationId?: string;
    source?: string;
    availableAt?: Date;
  }) {
    const dedupeKey = `booking:${params.bookingId}:payout-release`;

    try {
      await prisma.outboxEvent.create({
        data: {
          eventType: 'booking.payout.release_due',
          aggregateType: 'BOOKING',
          aggregateId: params.bookingId,
          correlationId: params.correlationId,
          dedupeKey,
          payload: {
            bookingId: params.bookingId,
            source: params.source ?? 'unknown',
            requestedAt: new Date().toISOString(),
          },
          nextAttemptAt: params.availableAt ?? new Date(),
        },
      });
      return { queued: true };
    } catch (error: any) {
      if (error?.code === 'P2002') {
        const existing = await prisma.outboxEvent.findUnique({ where: { dedupeKey } });
        if (existing && existing.status !== 'PROCESSED' && existing.status !== 'DEAD_LETTER') {
          await prisma.outboxEvent.update({
            where: { id: existing.id },
            data: {
              status: 'PENDING',
              nextAttemptAt: params.availableAt ?? new Date(),
              lastError: null,
            },
          });
          return { queued: false, duplicate: true, reactivated: true };
        }

        return { queued: false, duplicate: true };
      }
      throw error;
    }
  }

  static async handlePaymentIntentSucceeded(paymentIntentId: string, correlationId?: string) {
    const capture = await StripeService.captureBookingPayment(paymentIntentId);
    if (!capture.bookingId) {
      throw new Error(`Missing bookingId while capturing payment intent ${paymentIntentId}`);
    }

    const run = await this.getOrCreateRun(capture.bookingId, correlationId ?? paymentIntentId);

    if (capture.skipped) {
      await this.markStep(run.id, STEP_PAYMENT_CAPTURE, 'SKIPPED', {
        paymentIntentId,
        reason: 'Booking is already cancelled/refunded',
      });
      await this.updateRun(run.id, {
        state: 'PAYMENT_CAPTURE_SKIPPED',
        status: 'FAILED',
        lastError: 'Payment capture skipped because booking is cancelled/refunded',
        finishedAt: new Date(),
      });

      return { bookingId: capture.bookingId, skipped: true };
    }

    await this.markStep(run.id, STEP_PAYMENT_CAPTURE, 'COMPLETED', {
      paymentIntentId,
      escrowReleaseDate: capture.escrowReleaseDate,
    });

    await this.updateRun(run.id, {
      state: 'AWAITING_SESSION_COMPLETION',
      status: 'RUNNING',
      lastError: null,
      finishedAt: null,
    });

    return { bookingId: capture.bookingId, skipped: false };
  }

  static async handlePaymentIntentFailed(params: {
    bookingId: string;
    paymentIntentId?: string;
    correlationId?: string;
  }) {
    const run = await this.getOrCreateRun(params.bookingId, params.correlationId ?? params.paymentIntentId);

    await this.markStep(
      run.id,
      STEP_PAYMENT_CAPTURE,
      'FAILED',
      {
        bookingId: params.bookingId,
        paymentIntentId: params.paymentIntentId,
      },
      'Stripe payment intent failed',
    );

    await prisma.booking.updateMany({
      where: {
        id: params.bookingId,
        status: {
          notIn: ['CANCELLED', 'REFUNDED'],
        },
      },
      data: {
        status: 'CANCELLED',
      },
    });

    await this.updateRun(run.id, {
      state: 'PAYMENT_FAILED',
      status: 'FAILED',
      lastError: 'Stripe payment intent failed',
      finishedAt: new Date(),
    });
  }

  static async handleBookingCompleted(params: {
    bookingId: string;
    correlationId?: string;
    source?: string;
  }) {
    const booking = await prisma.booking.findUnique({
      where: { id: params.bookingId },
      select: {
        id: true,
        status: true,
        payoutStatus: true,
        escrowReleaseDate: true,
      },
    });

    if (!booking) {
      throw new Error(`Booking ${params.bookingId} not found`);
    }

    const run = await this.getOrCreateRun(booking.id, params.correlationId);

    if (booking.status !== 'COMPLETED') {
      await this.markStep(
        run.id,
        STEP_SESSION_COMPLETED,
        'SKIPPED',
        { bookingId: booking.id, status: booking.status },
        'Booking is not completed; skipping completion event',
      );
      return { bookingId: booking.id, queuedPayoutRelease: false };
    }

    await this.markStep(run.id, STEP_SESSION_COMPLETED, 'COMPLETED', {
      bookingId: booking.id,
      source: params.source ?? 'unknown',
      escrowReleaseDate: booking.escrowReleaseDate?.toISOString?.() ?? null,
    });

    if (booking.payoutStatus === 'PAID') {
      await this.markStep(run.id, STEP_PAYOUT_RELEASE, 'COMPLETED', {
        bookingId: booking.id,
        alreadyPaid: true,
      });
      await this.updateRun(run.id, {
        state: 'PAYOUT_RELEASED',
        status: 'COMPLETED',
        lastError: null,
        finishedAt: new Date(),
      });
      return { bookingId: booking.id, queuedPayoutRelease: false, alreadyPaid: true };
    }

    await this.updateRun(run.id, {
      state: 'ESCROW_PENDING',
      status: 'RUNNING',
      lastError: null,
      finishedAt: null,
    });

    await this.enqueuePayoutReleaseEvent({
      bookingId: booking.id,
      correlationId: params.correlationId,
      source: params.source ?? 'booking-completed',
      availableAt: booking.escrowReleaseDate ?? new Date(),
    });

    return { bookingId: booking.id, queuedPayoutRelease: true };
  }

  static async handlePayoutReleaseDue(params: {
    bookingId: string;
    correlationId?: string;
    source?: string;
  }) {
    const booking = await prisma.booking.findUnique({
      where: { id: params.bookingId },
      select: {
        id: true,
        status: true,
        payoutStatus: true,
        escrowReleaseDate: true,
      },
    });

    if (!booking) {
      throw new Error(`Booking ${params.bookingId} not found`);
    }

    const run = await this.getOrCreateRun(booking.id, params.correlationId);

    if (booking.payoutStatus === 'PAID') {
      await this.markStep(run.id, STEP_PAYOUT_RELEASE, 'COMPLETED', {
        bookingId: booking.id,
        alreadyPaid: true,
      });
      await this.updateRun(run.id, {
        state: 'PAYOUT_RELEASED',
        status: 'COMPLETED',
        lastError: null,
        finishedAt: new Date(),
      });
      return { bookingId: booking.id, alreadyPaid: true };
    }

    if (booking.status !== 'COMPLETED') {
      throw new Error(`Booking ${booking.id} is in ${booking.status}; payout requires COMPLETED`);
    }

    if (!booking.escrowReleaseDate || booking.escrowReleaseDate > new Date()) {
      throw new Error(`Booking ${booking.id} escrow hold period has not ended`);
    }

    await this.markStep(run.id, STEP_PAYOUT_RELEASE, 'RUNNING', {
      bookingId: booking.id,
      source: params.source ?? 'outbox',
    });

    try {
      const release = await StripeService.releaseBookingEscrow(booking.id);

      await this.markStep(run.id, STEP_PAYOUT_RELEASE, 'COMPLETED', {
        bookingId: booking.id,
        transferId: release.transferId,
      });

      await this.updateRun(run.id, {
        state: 'PAYOUT_RELEASED',
        status: 'COMPLETED',
        lastError: null,
        finishedAt: new Date(),
      });

      return { bookingId: booking.id, transferId: release.transferId };
    } catch (error: any) {
      await this.markStep(
        run.id,
        STEP_PAYOUT_RELEASE,
        'FAILED',
        {
          bookingId: booking.id,
          source: params.source ?? 'outbox',
        },
        error?.message || 'Payout release failed',
      );

      await this.updateRun(run.id, {
        state: 'PAYOUT_RETRY_PENDING',
        status: 'RUNNING',
        lastError: error?.message || 'Payout release failed',
        finishedAt: null,
      });

      throw error;
    }
  }

  static async markWorkflowFailedForBooking(bookingId: string, reason: string) {
    const run = await prisma.workflowRun.findUnique({
      where: {
        workflowType_aggregateId: {
          workflowType: WORKFLOW_TYPE,
          aggregateId: bookingId,
        },
      },
    });

    if (!run) return;

    await prisma.workflowRun.update({
      where: { id: run.id },
      data: {
        state: 'MANUAL_INTERVENTION_REQUIRED',
        status: 'FAILED',
        lastError: reason,
        finishedAt: new Date(),
      },
    });

    logger.warn({ bookingId, reason }, 'Booking payout saga moved to manual intervention');
  }
}


