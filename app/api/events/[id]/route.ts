import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { fromError, ok } from '@/server/lib/http';
import { getSessionKey } from '@/server/lib/session';
import { eventService } from '@/server/service/event.service';
import { ticketService } from '@/server/service/ticket.service';

const listTicketsQuerySchema = z.object({
  status: z.enum(['issued', 'used', 'refunded']).optional(),
  cursor: z.string().datetime().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
});

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const query = listTicketsQuerySchema.parse(Object.fromEntries(searchParams));
    const event = await eventService.getEvent(id);
    const remaining = event.totalCapacity - event.soldCount;

    // Only the organizer sees the attendee list (with on-chain proofs + check-in controls).
    const sessionKey = await getSessionKey(req);
    const isOrganizer = sessionKey === event.organizerPublicKey;
    const { tickets, nextCursor } = isOrganizer
      ? await ticketService.listByEvent(id, query)
      : { tickets: [], nextCursor: null };

    return ok({ event: { ...event, remaining }, isOrganizer, tickets, nextCursor });
  } catch (err) {
    return fromError(err);
  }
}
