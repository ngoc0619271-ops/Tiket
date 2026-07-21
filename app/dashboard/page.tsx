'use client';

import { CalendarPlus, LayoutGrid, Users, Wallet } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ConnectButton } from '@/components/connect-button';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { useWallet } from '@/components/wallet-provider';
import { get } from '@/lib/api';
import { type EventDTO, formatDate, formatPrice } from '@/lib/format';

export default function DashboardPage() {
  const { address, status } = useWallet();
  const [events, setEvents] = useState<EventDTO[] | null>(null);

  useEffect(() => {
    if (status !== 'connected' || !address) return;
    setEvents(null);
    get<{ events: EventDTO[] }>(`/api/events?organizer=${address}`)
      .then((d) => setEvents(d.events))
      .catch(() => setEvents([]));
  }, [address, status]);

  if (status !== 'connected') {
    return (
      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        <div className="rounded-2xl border border-dashed border-border bg-card py-16 text-center">
          <Wallet className="mx-auto h-10 w-10 text-muted-foreground" />
          <h1 className="mt-4 font-display text-xl font-bold text-ink">Organizer console</h1>
          <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
            Connect your Stellar wallet to create events and check attendees in — settling each
            escrowed payment on-chain.
          </p>
          <div className="mt-5 flex justify-center">
            <ConnectButton size="lg" />
          </div>
        </div>
      </main>
    );
  }

  const totalSold = events?.reduce((a, e) => a + e.soldCount, 0) ?? 0;
  const totalIn = events?.reduce((a, e) => a + e.usedCount, 0) ?? 0;

  return (
    <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-ink">
            Organizer console
          </h1>
          <p className="mt-2 text-muted-foreground">Your events, passes sold, and check-ins.</p>
        </div>
        <Button asChild size="lg">
          <Link href="/dashboard/events/new">
            <CalendarPlus /> New event
          </Link>
        </Button>
      </div>

      <div className="mb-8 grid grid-cols-3 gap-4">
        {[
          { label: 'Events', value: events?.length ?? 0, icon: LayoutGrid },
          { label: 'Passes sold', value: totalSold, icon: Users },
          { label: 'Checked in', value: totalIn, icon: Users },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-card p-4 sm:p-5">
            <s.icon className="h-5 w-5 text-primary" />
            <p className="mt-3 font-display text-2xl font-bold text-ink sm:text-3xl">{s.value}</p>
            <p className="text-xs text-muted-foreground sm:text-sm">{s.label}</p>
          </div>
        ))}
      </div>

      {events === null ? (
        <div className="space-y-3">
          {[0, 1].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl border border-border bg-card" />
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card py-16 text-center">
          <CalendarPlus className="mx-auto h-10 w-10 text-muted-foreground" />
          <h2 className="mt-4 font-display text-lg font-bold text-ink">No events yet</h2>
          <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
            Create your first event to start selling on-chain escrowed passes.
          </p>
          <Button asChild className="mt-5">
            <Link href="/dashboard/events/new">Create event</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {events.map((ev) => (
            <Link
              key={ev.id}
              href={`/dashboard/events/${ev.id}`}
              className="flex items-center justify-between gap-4 rounded-xl border border-border bg-card p-4 shadow-sm transition-colors hover:border-primary/40 sm:p-5"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="truncate font-display text-base font-bold text-ink">{ev.name}</h3>
                  <StatusBadge status={ev.status} />
                </div>
                <p className="mt-0.5 truncate text-sm text-muted-foreground">
                  {formatDate(ev.eventDate)} · {ev.venue} · {formatPrice(ev.price, ev.priceAsset)}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="font-display text-lg font-bold text-ink">
                  {ev.soldCount}/{ev.totalCapacity}
                </p>
                <p className="text-xs text-muted-foreground">{ev.usedCount} in</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
