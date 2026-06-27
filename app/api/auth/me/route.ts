import type { NextRequest } from 'next/server';
import { me } from '@/server/controller/auth.controller';
import { readSessionCookie } from '@/server/lib/cookies';
import { fromError } from '@/server/lib/http';
import { authService } from '@/server/service/auth.service';

export async function GET(req: NextRequest) {
  try {
    const sessionId = readSessionCookie(req);
    let publicKey: string | undefined;
    if (sessionId) {
      const session = await authService.getSession(sessionId);
      publicKey = session?.publicKey;
    }
    return await me(req, { publicKey });
  } catch (err) {
    return fromError(err);
  }
}
