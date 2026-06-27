import type { NextRequest } from 'next/server';
import { requestChallenge } from '@/server/controller/auth.controller';
import { fromError } from '@/server/lib/http';

export async function POST(req: NextRequest) {
  try {
    return await requestChallenge(req);
  } catch (err) {
    return fromError(err);
  }
}
