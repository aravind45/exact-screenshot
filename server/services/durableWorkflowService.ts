import Stripe from 'stripe';
import { prisma } from '../db.js';
import { logger } from '../lib/logger.js';
import { StripeService } from './stripeService.js';
import { BookingPayoutSagaService } from './bookingPayoutSagaService.js';

const DEFAULT_INBOX_BATCH = 25;
const DEFAULT_OUTBOX_BATCH = 50;
const BASE_RETRY_SECONDS = 30;
const MAX_RETRY_SECONDS = 60 * 60;

type InboxStatus = 'RECEIVED' | 'PROCESSING' | 'PROCESSED' | 'FAILED' | 'DEAD_LETTER';
type OutboxStatus = 'PENDING' | 'PROCESSING' | 'PROCESSED' | 'FAILED' | 'DEAD_LETTER';

const nextRetryTime = (attempt: number): Date => {
  const backoffSeconds = Math.min(MAX_RETRY_SECONDS, BASE_RETRY_SECONDS * Math.pow(2, Math.max(0, attempt - 1)));
  return new Date(Date.now() + backoffSeconds * 1000);
};

const isUniqueConstraintError = (error: any) => error?.code === 'P2002';

export class DurableWorkflowService {
  static async recordStripeInboxEvent(event: Stripe.Event) {
    try {
      const inboxEvent = await prisma.inboxEvent.create({
        data: {
          source: 'STRIPE',
          sourceEventId: event.id,
          eventType: event.type,
          correlationId: event.id,
          payload: event as any,
          status: 'RECEIVED',
          nextAttemptAt: new Date(),
        },
      });

      return { created: true, inboxEvent };
    } catch (error: any) {
      if (!isUniqueConstraintError(error)) {
        throw error;
      }

      const existing = await prisma.inboxEvent.findUnique({
        where: {
          source_sourceEventId: {
            source: 'STRIPE',
            sourceEventId: event.id,
          },
        },
      });

      return { created: false, inboxEvent: existing };
    }
  }

  static async enqueueOutboxEvent(params: {
    eventType: string;
    payload: Record<string, unknown>;
    aggregateType?: string;
    aggregateId?: string;
    correlationId?: string;
    dedupeKey?: string;
    nextAttemptAt?: Date;
    maxRetries?: number;
  }) {
    try {
      const outboxEvent = await prisma.outboxEvent.create({
        data: {
          eventType: params.eventType,
          payload: params.payload as any,
          aggregateType: params.aggregateType,
          aggregateId: params.aggregateId,
          correlationId: params.correlationId,
          dedupeKey: params.dedupeKey,
          nextAttemptAt: params.nextAttemptAt ?? new Date(),
          maxRetries: params.maxRetries ?? 8,
          status: 'PENDING',
        },
      });

      return { created: true, outboxEvent };
    } catch (error: any) {
      if (!isUniqueConstraintError(error) || !params.dedupeKey) {
        throw error;
      }

      const existing = await prisma.outboxEvent.findUnique({
        where: { dedupeKey: params.dedupeKey },
      });

      return { created: false, outboxEvent: existing };
    }
  }

  static async processInboxBatch(options?: { source?: string; limit?: number }) {
    const limit = Math.max(1, Math.min(200, options?.limit ?? DEFAULT_INBOX_BATCH));
    const now = new Date();

    const events = await prisma.inboxEvent.findMany({
      where: {
        source: options?.source,
        status: { in: ['RECEIVED', 'FAILED'] },
        nextAttemptAt: { lte: now },
      },
      orderBy: [{ receivedAt: 'asc' }],
      take: limit,
    });

    const summary = {
      scanned: events.length,
      processed: 0,
      failed: 0,
      deadLettered: 0,
      skippedClaim: 0,
    };

    for (const event of events) {
      const claim = await prisma.inboxEvent.updateMany({
        where: {
          id: event.id,
          status: { in: ['RECEIVED', 'FAILED'] },
        },
        data: {
          status: 'PROCESSING',
          updatedAt: new Date(),
        },
      });

      if (claim.count === 0) {
        summary.skippedClaim += 1;
        continue;
      }

      try {
        await this.handleInboxEvent(event);

        await prisma.inboxEvent.update({
          where: { id: event.id },
          data: {
            status: 'PROCESSED',
            processedAt: new Date(),
            lastError: null,
          },
        });

        summary.processed += 1;
      } catch (error: any) {
        const handled = await this.handleInboxFailure(event, error);
        if (handled.deadLettered) {
          summary.deadLettered += 1;
        } else {
          summary.failed += 1;
        }
      }
    }

    return summary;
  }

  static async processOutboxBatch(options?: { limit?: number; eventTypes?: string[] }) {
    const limit = Math.max(1, Math.min(500, options?.limit ?? DEFAULT_OUTBOX_BATCH));
    const now = new Date();

    const events = await prisma.outboxEvent.findMany({
      where: {
        status: { in: ['PENDING', 'FAILED'] },
        nextAttemptAt: { lte: now },
        eventType: options?.eventTypes?.length ? { in: options.eventTypes } : undefined,
      },
      orderBy: [{ nextAttemptAt: 'asc' }, { createdAt: 'asc' }],
      take: limit,
    });

    const summary = {
      scanned: events.length,
      processed: 0,
      failed: 0,
      deadLettered: 0,
      skippedClaim: 0,
    };

    for (const event of events) {
      const claim = await prisma.outboxEvent.updateMany({
        where: {
          id: event.id,
          status: { in: ['PENDING', 'FAILED'] },
        },
        data: {
          status: 'PROCESSING',
          updatedAt: new Date(),
        },
      });

      if (claim.count === 0) {
        summary.skippedClaim += 1;
        continue;
      }

      try {
        await this.dispatchOutboxEvent(event);

        await prisma.outboxEvent.update({
          where: { id: event.id },
          data: {
            status: 'PROCESSED',
            processedAt: new Date(),
            lastError: null,
          },
        });

        summary.processed += 1;
      } catch (error: any) {
        const handled = await this.handleOutboxFailure(event, error);
        if (handled.deadLettered) {
          summary.deadLettered += 1;
        } else {
          summary.failed += 1;
        }
      }
    }

    return summary;
  }

  static async drainOnce(options?: {
    inboxSource?: string;
    inboxLimit?: number;
    outboxLimit?: number;
    outboxEventTypes?: string[];
  }) {
    const inbox = await this.processInboxBatch({
      source: options?.inboxSource,
      limit: options?.inboxLimit,
    });

    const outbox = await this.processOutboxBatch({
      limit: options?.outboxLimit,
      eventTypes: options?.outboxEventTypes,
    });

    return { inbox, outbox };
  }

  static async replayDeadLetter(deadLetterId: string, actorId?: string) {
    const deadLetter = await prisma.deadLetterEvent.findUnique({ where: { id: deadLetterId } });
    if (!deadLetter) {
      throw new Error(`Dead letter event ${deadLetterId} not found`);
    }

    if (deadLetter.sourceTable === 'OUTBOX') {
      await prisma.outboxEvent.update({
        where: { id: deadLetter.sourceId },
        data: {
          status: 'PENDING',
          nextAttemptAt: new Date(),
          lastError: null,
        },
      });
    } else if (deadLetter.sourceTable === 'INBOX') {
      await prisma.inboxEvent.update({
        where: { id: deadLetter.sourceId },
        data: {
          status: 'RECEIVED',
          nextAttemptAt: new Date(),
          lastError: null,
        },
      });
    } else {
      throw new Error(`Unsupported source table ${deadLetter.sourceTable}`);
    }

    await prisma.deadLetterEvent.update({
      where: { id: deadLetter.id },
      data: {
        status: 'REPLAYED',
        replayedAt: new Date(),
        updatedAt: new Date(),
      },
    });

    logger.info({ deadLetterId, actorId }, 'Dead letter replay requested');
    return { ok: true };
  }

  private static async handleInboxEvent(event: {
    id: string;
    source: string;
    sourceEventId: string;
    eventType: string;
    correlationId: string | null;
    payload: unknown;
  }) {
    if (event.source !== 'STRIPE') {
      throw new Error(`Unsupported inbox source ${event.source}`);
    }

    await this.enqueueOutboxEvent({
      eventType: `stripe.${event.eventType}`,
      payload: event.payload as Record<string, unknown>,
      aggregateType: 'STRIPE_EVENT',
      aggregateId: event.sourceEventId,
      correlationId: event.correlationId ?? event.sourceEventId,
      dedupeKey: `stripe:${event.sourceEventId}`,
      nextAttemptAt: new Date(),
      maxRetries: 8,
    });
  }

  private static async dispatchOutboxEvent(event: {
    id: string;
    eventType: string;
    correlationId: string | null;
    payload: unknown;
  }) {
    if (event.eventType.startsWith('stripe.')) {
      await this.dispatchStripeEvent(event.eventType, event.payload as any, event.correlationId ?? undefined);
      return;
    }

    if (event.eventType === 'booking.completed') {
      const payload = (event.payload || {}) as Record<string, any>;
      const bookingId = String(payload.bookingId || '');
      if (!bookingId) {
        throw new Error('booking.completed missing bookingId');
      }

      await BookingPayoutSagaService.handleBookingCompleted({
        bookingId,
        source: payload.source,
        correlationId: event.correlationId ?? undefined,
      });
      return;
    }

    if (event.eventType === 'booking.payout.release_due') {
      const payload = (event.payload || {}) as Record<string, any>;
      const bookingId = String(payload.bookingId || '');
      if (!bookingId) {
        throw new Error('booking.payout.release_due missing bookingId');
      }

      await BookingPayoutSagaService.handlePayoutReleaseDue({
        bookingId,
        source: payload.source,
        correlationId: event.correlationId ?? undefined,
      });
      return;
    }

    logger.warn({ eventType: event.eventType }, 'Unhandled outbox event type; marking processed');
  }

  private static async dispatchStripeEvent(eventTypeWithPrefix: string, payload: Record<string, any>, correlationId?: string) {
    const stripeType = payload?.type || eventTypeWithPrefix.replace(/^stripe\./, '');

    switch (stripeType) {
      case 'payment_intent.succeeded': {
        const paymentIntent = payload?.data?.object as Stripe.PaymentIntent | undefined;

        if (paymentIntent?.metadata?.type === 'ADVISOR_BOOKING') {
          await BookingPayoutSagaService.handlePaymentIntentSucceeded(paymentIntent.id, correlationId);
        } else {
          await StripeService.handleWebhook(payload as unknown as Stripe.Event);
        }
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = payload?.data?.object as Stripe.PaymentIntent | undefined;

        logger.error(`❌ Payment failed for booking: ${paymentIntent?.metadata?.bookingId || 'unknown'}`);

        if (paymentIntent?.metadata?.bookingId) {
          await BookingPayoutSagaService.handlePaymentIntentFailed({
            bookingId: paymentIntent.metadata.bookingId,
            paymentIntentId: paymentIntent.id,
            correlationId,
          });
        }
        break;
      }

      case 'account.updated': {
        const account = payload?.data?.object as Stripe.Account | undefined;
        if (!account) break;

        logger.info(`Stripe Connect account updated: ${account.id}`);

        if (account.details_submitted) {
          await prisma.advisorProfile.updateMany({
            where: { stripeAccountId: account.id },
            data: { stripeOnboardingComplete: true },
          });
          logger.info(`✅ Advisor onboarding marked complete for account: ${account.id}`);
        }
        break;
      }

      case 'transfer.created': {
        const transfer = payload?.data?.object as Stripe.Transfer | undefined;
        logger.info(`✅ Transfer created to advisor: ${transfer?.id || 'unknown'}`);
        break;
      }

      default: {
        await StripeService.handleWebhook(payload as unknown as Stripe.Event);
        break;
      }
    }
  }

  private static async handleInboxFailure(
    event: {
      id: string;
      source: string;
      sourceEventId: string;
      eventType: string;
      payload: unknown;
      correlationId: string | null;
      retryCount: number;
      maxRetries: number;
    },
    error: any,
  ) {
    const nextAttempt = event.retryCount + 1;
    const message = error?.message || String(error);

    if (nextAttempt >= event.maxRetries) {
      await prisma.inboxEvent.update({
        where: { id: event.id },
        data: {
          status: 'DEAD_LETTER',
          retryCount: nextAttempt,
          lastError: message,
        },
      });

      await this.writeDeadLetter({
        sourceTable: 'INBOX',
        sourceId: event.id,
        eventType: event.eventType,
        correlationId: event.correlationId,
        payload: event.payload,
        reason: message,
        retryCount: nextAttempt,
      });

      logger.error({ eventId: event.id, source: event.source, message }, 'Inbox event moved to dead letter');
      return { deadLettered: true };
    }

    await prisma.inboxEvent.update({
      where: { id: event.id },
      data: {
        status: 'FAILED',
        retryCount: nextAttempt,
        nextAttemptAt: nextRetryTime(nextAttempt),
        lastError: message,
      },
    });

    logger.error({ eventId: event.id, source: event.source, attempt: nextAttempt, message }, 'Inbox event failed; scheduled retry');
    return { deadLettered: false };
  }

  private static async handleOutboxFailure(
    event: {
      id: string;
      eventType: string;
      payload: unknown;
      correlationId: string | null;
      retryCount: number;
      maxRetries: number;
    },
    error: any,
  ) {
    const nextAttempt = event.retryCount + 1;
    const message = error?.message || String(error);

    if (nextAttempt >= event.maxRetries) {
      await prisma.outboxEvent.update({
        where: { id: event.id },
        data: {
          status: 'DEAD_LETTER',
          retryCount: nextAttempt,
          lastError: message,
        },
      });

      await this.writeDeadLetter({
        sourceTable: 'OUTBOX',
        sourceId: event.id,
        eventType: event.eventType,
        correlationId: event.correlationId,
        payload: event.payload,
        reason: message,
        retryCount: nextAttempt,
      });

      const payload = (event.payload || {}) as Record<string, any>;
      const bookingId = typeof payload.bookingId === 'string' ? payload.bookingId : null;
      if (bookingId && event.eventType.startsWith('booking.')) {
        await BookingPayoutSagaService.markWorkflowFailedForBooking(
          bookingId,
          `Outbox dead-lettered (${event.eventType}): ${message}`,
        );
      }

      logger.error({ eventId: event.id, eventType: event.eventType, message }, 'Outbox event moved to dead letter');
      return { deadLettered: true };
    }

    await prisma.outboxEvent.update({
      where: { id: event.id },
      data: {
        status: 'FAILED',
        retryCount: nextAttempt,
        nextAttemptAt: nextRetryTime(nextAttempt),
        lastError: message,
      },
    });

    logger.error({ eventId: event.id, eventType: event.eventType, attempt: nextAttempt, message }, 'Outbox event failed; scheduled retry');
    return { deadLettered: false };
  }

  private static async writeDeadLetter(params: {
    sourceTable: string;
    sourceId: string;
    eventType: string;
    correlationId: string | null;
    payload: unknown;
    reason: string;
    retryCount: number;
  }) {
    try {
      await prisma.deadLetterEvent.create({
        data: {
          sourceTable: params.sourceTable,
          sourceId: params.sourceId,
          eventType: params.eventType,
          correlationId: params.correlationId ?? undefined,
          payload: params.payload as any,
          reason: params.reason,
          retryCount: params.retryCount,
          movedAt: new Date(),
        },
      });
    } catch (error: any) {
      if (!isUniqueConstraintError(error)) {
        throw error;
      }
    }
  }
}
