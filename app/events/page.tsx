'use client';

import { CalendarDays, MapPin, TicketX, Users } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { PurchaseDialog } from '@/components/purchase-dialog';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { get } from '@/lib/api';
import { type EventDTO, formatDate, formatPrice } from '@/lib/format';

export default function EventsPage() {
  const [events, setEvents] = useState<EventDTO[] | null>(null);
  const [active, setActive] = useState<EventDTO | null>(null);

  async function load() {
    const d = await get<{ events: EventDTO[] }>('/api/events');
    setEvents(d.events);
  }

  useEffect(() => {
    load().catch(() => setEvents([]));
  }, []);

  return (
    <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <header className="mb-8">
        <h1 className="font-display text-3xl font-bold tracking-tight text-ink">Upcoming events</h1>
        <p className="mt-2 text-muted-foreground">
          Every pass is escrowed on-chain by the Tiket Soroban contract. Connect your wallet only
          when you buy.
        </p>
      </header>

      {events === null ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-64 animate-pulse rounded-2xl border border-border bg-card" />
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card py-16 text-center">
          <TicketX className="mx-auto h-10 w-10 text-muted-foreground" />
          <h2 className="mt-4 font-display text-lg font-bold text-ink">No events yet</h2>
          <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
            Be the first to host one — create an event and start issuing on-chain passes.
          </p>
          <Button asChild className="mt-5">
            <Link href="/dashboard">Host an event</Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((ev) => {
            const remaining = ev.totalCapacity - ev.soldCount;
            const soldOut = remaining <= 0;
            return (
              <article
                key={ev.id}
                className="flex flex-col rounded-2xl border border-border bg-card p-5 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="mb-3 flex items-start justify-between gap-2">
                  <h2 className="font-display text-lg font-bold leading-snug text-ink">
                    {ev.name}
                  </h2>
                  <span className="shrink-0 rounded-full bg-primary/10 px-2.5 py-0.5 font-mono text-xs font-semibold text-primary">
                    {ev.onchainEventId ? `#${ev.onchainEventId}` : 'On-chain'}
                  </span>
                </div>
                <p className="mb-4 line-clamp-2 text-sm text-muted-foreground">{ev.description}</p>
                <dl className="mb-4 space-y-1.5 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-primary/70" /> {formatDate(ev.eventDate)}
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary/70" /> {ev.venue}
                    {ev.city ? `, ${ev.city}` : ''}
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-primary/70" /> {remaining} of {ev.totalCapacity}{' '}
                    left
                  </div>
                </dl>
                <div className="mt-auto flex items-center justify-between border-t border-border pt-4">
                  <span className="font-display text-lg font-bold text-ink">
                    {formatPrice(ev.price, ev.priceAsset)}
                  </span>
                  {soldOut ? (
                    <StatusBadge status="cancelled" />
                  ) : (
                    <Button size="sm" onClick={() => setActive(ev)}>
                      Get pass
                    </Button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {active && (
        <PurchaseDialog
          event={active}
          open={!!active}
          onClose={() => setActive(null)}
          onPurchased={() => load().catch(() => {})}
        />
      )}
    </main>
  );
}
