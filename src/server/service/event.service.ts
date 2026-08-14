import { and, desc, eq, lt, sql } from 'drizzle-orm';
import { env } from '@/server/config/env';
import { db } from '@/server/db/client';
import { events } from '@/server/db/schema';
import type { Event } from '@/server/db/schema/events';
import { AppError } from '@/server/lib/http';
import { logger } from '@/server/lib/logger';
import {
  buildCreateEventXdr,
  generateAssetCode,
  idToString,
  submitAndPoll,
  toStroops,
} from '@/server/stellar';

type EventInput = {
  organizerPublicKey: string;
  name: string;
  description: string;
  venue: string;
  city: string;
  eventDate: Date;
  price: string;
  priceAsset: string;
  totalCapacity: number;
};

function startTimeSeconds(eventDate: Date): number {
  return Math.floor(eventDate.getTime() / 1000);
}

export const eventService = {
  /**
   * Step 1: build the organizer-signed Soroban `create_event` invoke.
   * (Validates the future start time so the contract won't reject it.)
   */
  async buildCreate(input: {
    organizerPublicKey: string;
    eventDate: Date;
    price: string;
    totalCapacity: number;
  }): Promise<{ xdr: string }> {
    const start = startTimeSeconds(input.eventDate);
    if (start <= Math.floor(Date.now() / 1000)) {
      throw new AppError('INVALID_INPUT', 'Event date must be in the future', 400);
    }
    const xdr = await buildCreateEventXdr({
      organizer: input.organizerPublicKey,
      priceStroops: toStroops(input.price),
      capacity: input.totalCapacity,
      startTime: start,
    });
    return { xdr };
  },

  /**
   * Step 2: submit the signed invoke, read the on-chain event id from the
   * return value, then persist the event row mirroring on-chain state.
   */
  async createFromSigned(input: EventInput & { signedXdr: string }): Promise<Event> {
    const { hash, returnValue } = await submitAndPoll(input.signedXdr);
    const onchainEventId = idToString(returnValue);
    if (!onchainEventId) {
      throw new AppError('CONFLICT', 'Contract did not return an event id', 409);
    }

    const [event] = await db
      .insert(events)
      .values({
        organizerPublicKey: input.organizerPublicKey,
        name: input.name,
        description: input.description,
        venue: input.venue,
        city: input.city,
        eventDate: input.eventDate,
        price: input.price,
        priceAsset: 'XLM', // contract settles in native XLM
        totalCapacity: input.totalCapacity,
        assetCode: generateAssetCode(),
        assetIssuer: env.STELLAR_ISSUER_PUBLIC,
        onchainEventId,
        createTxHash: hash,
        status: 'active',
      })
      .returning();
    return event;
  },

  async getEvent(id: string): Promise<Event> {
    const [event] = await db.select().from(events).where(eq(events.id, id));
    if (!event) throw new AppError('NOT_FOUND', 'Event not found', 404);
    return event;
  },

  async listEvents(
    organizerPublicKey?: string,
    opts: { cursor?: string; limit?: number } = {},
  ): Promise<{ events: Event[]; nextCursor: string | null }> {
    const limit = opts.limit ?? 20;
    const conditions = [];
    if (organizerPublicKey) conditions.push(eq(events.organizerPublicKey, organizerPublicKey));
    if (opts.cursor) conditions.push(lt(events.createdAt, new Date(opts.cursor)));

    const rows = await db
      .select()
      .from(events)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(events.createdAt))
      .limit(limit + 1);

    const hasMore = rows.length > limit;
    const page = hasMore ? rows.slice(0, limit) : rows;
    const nextCursor = hasMore ? page[page.length - 1].createdAt.toISOString() : null;
    return { events: page, nextCursor };
  },

  async incrementSoldCount(eventId: string): Promise<void> {
    const [updated] = await db
      .update(events)
      .set({ soldCount: sql`${events.soldCount} + 1` })
      .where(and(eq(events.id, eventId), lt(events.soldCount, events.totalCapacity)))
      .returning({ id: events.id });

    if (!updated) {
      logger.warn(
        'incrementSoldCount: capacity already reached in the DB mirror',
        'eventId=',
        eventId,
      );
    }
  },

  async incrementUsedCount(eventId: string): Promise<void> {
    await db
      .update(events)
      .set({ usedCount: sql`${events.usedCount} + 1` })
      .where(eq(events.id, eventId));
  },
};
