'use client';

import {
  ArrowLeft,
  ExternalLink,
  Loader2,
  ScanLine,
  TicketCheck,
  Users,
  Wallet,
} from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { ConnectButton } from '@/components/connect-button';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { useWallet } from '@/components/wallet-provider';
import { get, post } from '@/lib/api';
import { type EventDTO, formatDate, formatPrice, type TicketDTO } from '@/lib/format';
import { explorerContract, explorerTx, shortKey } from '@/lib/stellar-client';

type Detail = {
  event: EventDTO & { remaining: number };
  isOrganizer: boolean;
  tickets: TicketDTO[];
};

export default function ManageEventPage() {
  const { id } = useParams<{ id: string }>();
  const { status, signXdr } = useWallet();
  const [data, setData] = useState<Detail | null>(null);
  const [checking, setChecking] = useState<string | null>(null);

  const load = useCallback(() => {
    get<Detail>(`/api/events/${id}`)
      .then(setData)
      .catch(() => toast.error('Could not load event'));
  }, [id]);

  useEffect(() => {
    if (status === 'loading') return;
    load();
  }, [load, status]);

  async function checkin(ticketId: string) {
    setChecking(ticketId);
    try {
      // Organizer signs the Soroban `check_in` invoke; the escrow settles to them.
      const { xdr } = await post<{ xdr: string }>('/api/checkin/build', { ticketId });
      const signedXdr = await signXdr(xdr);
      const res = await post<{ explorer: string | null }>('/api/checkin/submit', {
        ticketId,
        signedXdr,
      });
      toast.success('Checked in — settled on-chain', {
        action: res.explorer
          ? { label: 'View tx', onClick: () => window.open(res.explorer ?? '', '_blank') }
          : undefined,
      });
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Check-in failed');
    } finally {
      setChecking(null);
    }
  }

  if (!data) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        <div className="h-40 animate-pulse rounded-2xl border border-border bg-card" />
      </main>
    );
  }

  const { event, isOrganizer, tickets } = data;

  return (
    <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <Link
        href="/dashboard"
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to console
      </Link>

      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display text-2xl font-bold text-ink">{event.name}</h1>
              <StatusBadge status={event.status} />
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {formatDate(event.eventDate)} · {event.venue}
              {event.city ? `, ${event.city}` : ''}
            </p>
          </div>
          <a
            href={explorerContract()}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 rounded-lg bg-primary/10 px-3 py-1.5 font-mono text-sm font-semibold text-primary hover:bg-primary/15"
          >
            {event.onchainEventId ? `Event #${event.onchainEventId}` : 'On-chain'}{' '}
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
        <p className="mt-4 text-sm text-foreground">{event.description}</p>
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: 'Price', value: formatPrice(event.price, event.priceAsset) },
            { label: 'Capacity', value: event.totalCapacity },
            { label: 'Sold', value: event.soldCount },
            { label: 'Checked in', value: event.usedCount },
          ].map((s) => (
            <div key={s.label} className="rounded-xl bg-secondary/50 p-3">
              <p className="font-display text-xl font-bold text-ink">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      <section className="mt-8">
        <div className="mb-4 flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          <h2 className="font-display text-lg font-bold text-ink">Attendees &amp; check-in</h2>
        </div>

        {status !== 'connected' ? (
          <div className="rounded-2xl border border-dashed border-border bg-card py-12 text-center">
            <Wallet className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="mt-3 text-sm text-muted-foreground">
              Connect as the organizer to see attendees and check them in.
            </p>
            <div className="mt-4 flex justify-center">
              <ConnectButton />
            </div>
          </div>
        ) : !isOrganizer ? (
          <div className="rounded-2xl border border-dashed border-border bg-card py-12 text-center text-sm text-muted-foreground">
            Only this event&apos;s organizer can view attendees and check them in.
          </div>
        ) : tickets.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card py-12 text-center">
            <ScanLine className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="mt-3 text-sm text-muted-foreground">
              No passes sold yet. Share your event page to start selling.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-border bg-card">
            <ul className="divide-y divide-border">
              {tickets.map((t) => (
                <li key={t.id} className="flex flex-wrap items-center gap-3 p-4">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-ink">{t.buyerName}</p>
                    <p className="font-mono text-xs text-muted-foreground">
                      {shortKey(t.buyerPublicKey)}
                    </p>
                  </div>
                  <StatusBadge status={t.status} />
                  {t.checkinTxHash && (
                    <a
                      href={explorerTx(t.checkinTxHash)}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                    >
                      tx <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                  {t.status === 'issued' ? (
                    <Button size="sm" onClick={() => checkin(t.id)} disabled={checking === t.id}>
                      {checking === t.id ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" /> Checking in…
                        </>
                      ) : (
                        <>
                          <TicketCheck className="h-4 w-4" /> Check in
                        </>
                      )}
                    </Button>
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      {t.status === 'refunded' ? 'refunded' : 'done'}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>
    </main>
  );
}
