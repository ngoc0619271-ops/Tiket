import type { NextRequest } from 'next/server';
import { verifyChallenge } from '@/server/controller/auth.controller';
import { fromError } from '@/server/lib/http';

export async function POST(req: NextRequest) {
  try {
    return await verifyChallenge(req);
  } catch (err) {
    return fromError(err);
  }
}
