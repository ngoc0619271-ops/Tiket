import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { fromError, ok } from '@/server/lib/http';
import { requireSessionKey } from '@/server/lib/session';
import { explorerTx, submitSignedXdr } from '@/server/stellar';

const schema = z.object({ signedXdr: z.string().min(1) });

export async function POST(req: NextRequest) {
  try {
    await requireSessionKey(req);
    const { signedXdr } = schema.parse(await req.json());
    const hash = await submitSignedXdr(signedXdr);
    return ok({ hash, explorer: explorerTx(hash) });
  } catch (err) {
    return fromError(err);
  }
}
