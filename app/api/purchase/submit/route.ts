import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { created, fromError } from '@/server/lib/http';
import { requireSessionKey } from '@/server/lib/session';
import { ticketService } from '@/server/service/ticket.service';
import { explorerTx } from '@/server/stellar';

export const maxDuration = 60;

const schema = z.object({
  eventId: z.string().uuid(),
  buyerName: z.string().max(80).optional(),
  signedXdr: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const buyer = await requireSessionKey(req);
    const body = schema.parse(await req.json());
    const ticket = await ticketService.submitPurchase({
      eventId: body.eventId,
      buyer,
      buyerName: body.buyerName?.trim() || `${buyer.slice(0, 4)}…${buyer.slice(-4)}`,
      signedXdr: body.signedXdr,
    });
    return created({
      ticket,
      explorer: {
        buy: ticket.buyTxHash ? explorerTx(ticket.buyTxHash) : null,
      },
    });
  } catch (err) {
    return fromError(err);
  }
}
