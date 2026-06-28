import { fromError, ok } from '@/server/lib/http';
import { statsService } from '@/server/service/stats.service';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const stats = await statsService.getStats();
    return ok(stats);
  } catch (err) {
    return fromError(err);
  }
}
