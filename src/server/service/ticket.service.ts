import { and, desc, eq, lt } from 'drizzle-orm';
import { db } from '@/server/db/client';
import { tickets } from '@/server/db/schema';
import type { Ticket } from '@/server/db/schema/tickets';
import { AppError } from '@/server/lib/http';
import {
  buildBuyXdr,
  buildCheckinXdr,
  buildRefundXdr,
  idToString,
  submitAndPoll,
} from '@/server/stellar';
import { eventService } from './event.service';

function onchainEventId(eventOnchainId: string | null): bigint {
  if (!eventOnchainId) {
    throw new AppError('CONFLICT', 'Event is not registered on-chain yet', 409);
  }
  return BigInt(eventOnchainId);
}

export const ticketService = {
  /** Step 1 of purchase: build the buyer-signed Soroban `buy` invoke (escrow). */
  async buildPurchase(eventId: string, buyer: string): Promise<{ xdr: string }> {
    const event = await eventService.getEvent(eventId);
    if (event.status !== 'active') throw new AppError('CONFLICT', 'Event is not on sale', 409);
    if (event.soldCount >= event.totalCapacity) {
      throw new AppError('CONFLICT', 'Event is sold out', 409);
    }
    const xdr = await buildBuyXdr({
      buyer,
      eventId: onchainEventId(event.onchainEventId),
    });
    return { xdr };
  },

  /** Step 2 of purchase: submit the signed invoke, record the on-chain ticket. */
  async submitPurchase(params: {
    eventId: string;
    buyer: string;
    buyerName: string;
    signedXdr: string;
  }): Promise<Ticket> {
    const event = await eventService.getEvent(params.eventId);
    if (event.soldCount >= event.totalCapacity) {
      throw new AppError('CONFLICT', 'Event is sold out', 409);
    }

    const { hash, returnValue } = await submitAndPoll(params.signedXdr);
    const onchainTicketId = idToString(returnValue);

    const [ticket] = await db
      .insert(tickets)
      .values({
        eventId: params.eventId,
        buyerPublicKey: params.buyer,
        buyerName: params.buyerName,
        assetCode: event.assetCode,
        assetIssuer: event.assetIssuer,
        paymentAsset: 'XLM',
        pricePaid: event.price,
        status: 'issued',
        onchainTicketId: onchainTicketId || null,
        buyTxHash: hash,
      })
      .returning();

    await eventService.incrementSoldCount(params.eventId);
    return ticket;
  },

  async getTicket(id: string): Promise<Ticket> {
    const [ticket] = await db.select().from(tickets).where(eq(tickets.id, id));
    if (!ticket) throw new AppError('NOT_FOUND', 'Ticket not found', 404);
    return ticket;
  },

  async listByEvent(
    eventId: string,
    opts: { status?: string; cursor?: string; limit?: number } = {},
  ): Promise<{ tickets: Ticket[]; nextCursor: string | null }> {
    const limit = opts.limit ?? 20;
    const conditions = [eq(tickets.eventId, eventId)];
    if (opts.status) conditions.push(eq(tickets.status, opts.status));
    if (opts.cursor) conditions.push(lt(tickets.createdAt, new Date(opts.cursor)));

    const rows = await db
      .select()
      .from(tickets)
      .where(and(...conditions))
      .orderBy(desc(tickets.createdAt))
      .limit(limit + 1);

    const hasMore = rows.length > limit;
    const page = hasMore ? rows.slice(0, limit) : rows;
    const nextCursor = hasMore ? page[page.length - 1].createdAt.toISOString() : null;
    return { tickets: page, nextCursor };
  },

  async listByBuyer(buyer: string): Promise<Ticket[]> {
    return db
      .select()
      .from(tickets)
      .where(eq(tickets.buyerPublicKey, buyer))
      .orderBy(desc(tickets.createdAt));
  },

  // --- Check-in (organizer-signed) -----------------------------------------

  /** Step 1: build the organizer-signed Soroban `check_in` invoke. */
  async buildCheckin(ticketId: string, organizer: string): Promise<{ xdr: string }> {
    const ticket = await this.getTicket(ticketId);
    const event = await eventService.getEvent(ticket.eventId);
    if (event.organizerPublicKey !== organizer) {
      throw new AppError('FORBIDDEN', 'Only the event organizer can check in tickets', 403);
    }
    if (ticket.status === 'used') throw new AppError('CONFLICT', 'Ticket already checked in', 409);
    if (ticket.status === 'refunded') throw new AppError('CONFLICT', 'Ticket was refunded', 409);
    if (!ticket.onchainTicketId) {
      throw new AppError('CONFLICT', 'Ticket is not on-chain', 409);
    }
    const xdr = await buildCheckinXdr({
      organizer,
      ticketId: BigInt(ticket.onchainTicketId),
    });
    return { xdr };
  },

  /** Step 2: submit the signed invoke, flip the ticket to used. */
  async submitCheckin(params: {
    ticketId: string;
    organizer: string;
    signedXdr: string;
  }): Promise<Ticket> {
    const ticket = await this.getTicket(params.ticketId);
    const event = await eventService.getEvent(ticket.eventId);
    if (event.organizerPublicKey !== params.organizer) {
      throw new AppError('FORBIDDEN', 'Only the event organizer can check in tickets', 403);
    }

    const { hash } = await submitAndPoll(params.signedXdr);

    const [updated] = await db
      .update(tickets)
      .set({
        status: 'used',
        checkinTxHash: hash,
        checkinAt: new Date(),
        updatedAt: new Date(),
      })
      .where(and(eq(tickets.id, params.ticketId), eq(tickets.status, 'issued')))
      .returning();

    if (!updated) throw new AppError('CONFLICT', 'Ticket was already checked in', 409);
    await eventService.incrementUsedCount(updated.eventId);
    return updated;
  },

  // --- Refund (owner-signed, before the event) -----------------------------

  /** Step 1: build the owner-signed Soroban `refund` invoke. */
  async buildRefund(ticketId: string, owner: string): Promise<{ xdr: string }> {
    const ticket = await this.getTicket(ticketId);
    if (ticket.buyerPublicKey !== owner) {
      throw new AppError('FORBIDDEN', 'Only the ticket holder can refund it', 403);
    }
    if (ticket.status === 'used') throw new AppError('CONFLICT', 'Ticket already checked in', 409);
    if (ticket.status === 'refunded')
      throw new AppError('CONFLICT', 'Ticket already refunded', 409);
    if (!ticket.onchainTicketId) {
      throw new AppError('CONFLICT', 'Ticket is not on-chain', 409);
    }
    const xdr = await buildRefundXdr({ owner, ticketId: BigInt(ticket.onchainTicketId) });
    return { xdr };
  },

  /** Step 2: submit the signed invoke, flip the ticket to refunded. */
  async submitRefund(params: {
    ticketId: string;
    owner: string;
    signedXdr: string;
  }): Promise<Ticket> {
    const ticket = await this.getTicket(params.ticketId);
    if (ticket.buyerPublicKey !== params.owner) {
      throw new AppError('FORBIDDEN', 'Only the ticket holder can refund it', 403);
    }

    const { hash } = await submitAndPoll(params.signedXdr);

    const [updated] = await db
      .update(tickets)
      .set({ status: 'refunded', refundTxHash: hash, updatedAt: new Date() })
      .where(and(eq(tickets.id, params.ticketId), eq(tickets.status, 'issued')))
      .returning();

    if (!updated) throw new AppError('CONFLICT', 'Ticket could not be refunded', 409);
    return updated;
  },
};
