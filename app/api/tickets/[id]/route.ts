import type { NextRequest } from 'next/server';
import { fromError, ok } from '@/server/lib/http';
import { ticketService } from '@/server/service/ticket.service';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const ticket = await ticketService.getTicket(id);
    return ok({ ticket });
  } catch (err) {
    return fromError(err);
  }
}
