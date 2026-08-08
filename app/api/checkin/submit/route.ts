import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { fromError, ok } from '@/server/lib/http';
import { requireSessionKey } from '@/server/lib/session';
import { ticketService } from '@/server/service/ticket.service';
import { explorerTx } from '@/server/stellar';

export const maxDuration = 60;

const schema = z.object({ ticketId: z.string().uuid(), signedXdr: z.string().min(1) });

export async function POST(req: NextRequest) {
  try {
    const organizer = await requireSessionKey(req);
    const { ticketId, signedXdr } = schema.parse(await req.json());
    const ticket = await ticketService.submitCheckin({ ticketId, organizer, signedXdr });
    return ok({
      ticket,
      explorer: ticket.checkinTxHash ? explorerTx(ticket.checkinTxHash) : null,
      message: 'Checked in. The escrowed price settled to the organizer on-chain.',
    });
  } catch (err) {
    return fromError(err);
  }
}
