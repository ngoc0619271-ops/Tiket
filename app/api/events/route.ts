import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { created, fromError, ok } from '@/server/lib/http';
import { requireSessionKey } from '@/server/lib/session';
import { eventService } from '@/server/service/event.service';
import { explorerTx } from '@/server/stellar';

export const maxDuration = 60;

const createEventSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().min(1).max(600),
  venue: z.string().min(1).max(200),
  city: z.string().max(100).default(''),
  eventDate: z.string().datetime(),
  price: z
    .string()
    .regex(/^\d+(\.\d{1,7})?$/, 'Price must be a non-negative number')
    .default('0'),
  totalCapacity: z.number().int().positive().max(100000),
  signedXdr: z.string().min(1),
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const organizer = searchParams.get('organizer');
    const eventList = await eventService.listEvents(organizer ?? undefined);
    return ok({ events: eventList });
  } catch (err) {
    return fromError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const organizerPublicKey = await requireSessionKey(req);
    const body = createEventSchema.parse(await req.json());
    const event = await eventService.createFromSigned({
      organizerPublicKey,
      name: body.name,
      description: body.description,
      venue: body.venue,
      city: body.city,
      eventDate: new Date(body.eventDate),
      price: body.price,
      priceAsset: 'XLM',
      totalCapacity: body.totalCapacity,
      signedXdr: body.signedXdr,
    });
    return created({
      event,
      explorer: event.createTxHash ? explorerTx(event.createTxHash) : null,
    });
  } catch (err) {
    return fromError(err);
  }
}
