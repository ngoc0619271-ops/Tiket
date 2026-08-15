import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { fromError, ok } from '@/server/lib/http';
import { ticketService } from '@/server/service/ticket.service';

const querySchema = z.object({
  eventId: z.string().uuid().optional(),
  buyer: z.string().min(1).optional(),
  cursor: z.string().datetime().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = querySchema.parse(Object.fromEntries(searchParams));

    if (query.eventId) {
      const { tickets, nextCursor } = await ticketService.listByEvent(query.eventId, {
        cursor: query.cursor,
        limit: query.limit,
      });
      return ok({ tickets, nextCursor });
    }
    if (query.buyer) {
      const { tickets, nextCursor } = await ticketService.listByBuyer(query.buyer, {
        cursor: query.cursor,
        limit: query.limit,
      });
      return ok({ tickets, nextCursor });
    }
    return ok({ tickets: [], nextCursor: null });
  } catch (err) {
    return fromError(err);
  }
}
