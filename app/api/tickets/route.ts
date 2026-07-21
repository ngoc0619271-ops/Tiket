import type { NextRequest } from 'next/server';
import { fromError, ok } from '@/server/lib/http';
import { ticketService } from '@/server/service/ticket.service';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const eventId = searchParams.get('eventId');
    const buyer = searchParams.get('buyer');

    if (eventId) return ok({ tickets: await ticketService.listByEvent(eventId) });
    if (buyer) return ok({ tickets: await ticketService.listByBuyer(buyer) });
    return ok({ tickets: [] });
  } catch (err) {
    return fromError(err);
  }
}
