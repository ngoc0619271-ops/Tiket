import type { NextRequest } from 'next/server';
import { fromError, ok } from '@/server/lib/http';
import { getSessionKey } from '@/server/lib/session';
import { eventService } from '@/server/service/event.service';
import { ticketService } from '@/server/service/ticket.service';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const event = await eventService.getEvent(id);
    const remaining = event.totalCapacity - event.soldCount;

    // Only the organizer sees the attendee list (with on-chain proofs + check-in controls).
    const sessionKey = await getSessionKey(req);
    const isOrganizer = sessionKey === event.organizerPublicKey;
    const tickets = isOrganizer ? await ticketService.listByEvent(id) : [];

    return ok({ event: { ...event, remaining }, isOrganizer, tickets });
  } catch (err) {
    return fromError(err);
  }
}
