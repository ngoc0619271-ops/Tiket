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
    const owner = await requireSessionKey(req);
    const { ticketId, signedXdr } = schema.parse(await req.json());
    const ticket = await ticketService.submitRefund({ ticketId, owner, signedXdr });
    return ok({
      ticket,
      explorer: ticket.refundTxHash ? explorerTx(ticket.refundTxHash) : null,
      message: 'Refunded. The escrowed price returned to your wallet on-chain.',
    });
  } catch (err) {
    return fromError(err);
  }
}
