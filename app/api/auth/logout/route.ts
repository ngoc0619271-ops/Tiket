import type { NextRequest } from 'next/server';
import { logout } from '@/server/controller/auth.controller';
import { fromError } from '@/server/lib/http';

export async function POST(req: NextRequest) {
  try {
    return await logout(req);
  } catch (err) {
    return fromError(err);
  }
}
