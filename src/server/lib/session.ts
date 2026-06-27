import type { NextRequest } from 'next/server';
import { readSessionCookie } from '@/server/lib/cookies';
import { AppError } from '@/server/lib/http';
import { authService } from '@/server/service/auth.service';

export async function getSessionKey(req: NextRequest): Promise<string | null> {
  const sessionId = readSessionCookie(req);
  if (!sessionId) return null;
  const session = await authService.getSession(sessionId);
  return session?.publicKey ?? null;
}

export async function requireSessionKey(req: NextRequest): Promise<string> {
  const key = await getSessionKey(req);
  if (!key) throw new AppError('UNAUTHORIZED', 'Connect your wallet to continue', 401);
  return key;
}
