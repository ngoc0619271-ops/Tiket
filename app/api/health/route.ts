import { ok } from '@/server/lib/http';

export const dynamic = 'force-dynamic';

export async function GET() {
  return ok({ status: 'healthy', service: 'tiket', ts: new Date().toISOString() });
}
