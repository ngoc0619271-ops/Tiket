import { desc, eq, sql } from 'drizzle-orm';
import { env } from '@/server/config/env';
import { db } from '@/server/db/client';
import { events } from '@/server/db/schema';
import type { Event } from '@/server/db/schema/events';
import { AppError } from '@/server/lib/http';
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

  async listEvents(organizerPublicKey?: string): Promise<Event[]> {
    if (organizerPublicKey) {
      return db
        .select()
        .from(events)
        .where(eq(events.organizerPublicKey, organizerPublicKey))
        .orderBy(desc(events.createdAt));
    }
    return db.select().from(events).orderBy(desc(events.createdAt));
  },

  async incrementSoldCount(eventId: string): Promise<void> {
    await db
      .update(events)
      .set({ soldCount: sql`${events.soldCount} + 1` })
      .where(eq(events.id, eventId));
  },

  async incrementUsedCount(eventId: string): Promise<void> {
    await db
      .update(events)
      .set({ usedCount: sql`${events.usedCount} + 1` })
      .where(eq(events.id, eventId));
  },
};
