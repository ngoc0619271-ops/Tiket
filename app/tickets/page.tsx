'use client';

import { ExternalLink, Loader2, ShieldCheck, Ticket, Wallet } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { ConnectButton } from '@/components/connect-button';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { useWallet } from '@/components/wallet-provider';
import { get, post } from '@/lib/api';
import { type EventDTO, formatDate, type TicketDTO } from '@/lib/format';
import { explorerContract, explorerTx } from '@/lib/stellar-client';

export default function TicketsPage() {
  const { address, status, signXdr } = useWallet();
  const [tickets, setTickets] = useState<TicketDTO[] | null>(null);
  const [eventMap, setEventMap] = useState<Record<string, EventDTO>>({});
  const [busy, setBusy] = useState<string | null>(null);

  function load() {
    if (status !== 'connected' || !address) return;
    setTickets(null);
    Promise.all([
      get<{ tickets: TicketDTO[] }>(`/api/tickets?buyer=${address}`),
      get<{ events: EventDTO[] }>('/api/events'),
    ])
      .then(([t, e]) => {
        setTickets(t.tickets);
        setEventMap(Object.fromEntries(e.events.map((ev) => [ev.id, ev])));
      })
      .catch(() => setTickets([]));
  }

  // biome-ignore lint/correctness/useExhaustiveDependencies: load reads address/status
  useEffect(load, [address, status]);

  async function refund(ticketId: string) {
    setBusy(ticketId);
    try {
      const { xdr } = await post<{ xdr: string }>('/api/refund/build', { ticketId });
      const signedXdr = await signXdr(xdr);
      const res = await post<{ explorer: string | null }>('/api/refund/submit', {
        ticketId,
        signedXdr,
      });
      toast.success('Refunded on-chain', {
        action: res.explorer
          ? { label: 'View tx', onClick: () => window.open(res.explorer ?? '', '_blank') }
          : undefined,
      });
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Refund failed');
    } finally {
      setBusy(null);
    }
  }

  async function enableUsdc() {
    setBusy('usdc');
    try {
      const { xdr } = await post<{ xdr: string }>('/api/usdc/build');
      const signed = await signXdr(xdr);
      await post('/api/usdc/submit', { signedXdr: signed });
      toast.success('USDC trustline added to your wallet');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not enable USDC');
    } finally {
      setBusy(null);
    }
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-ink">My tickets</h1>
          <p className="mt-2 text-muted-foreground">
            Passes recorded on-chain by the Tiket contract. Refund any pass before its event starts.
          </p>
        </div>
        {status === 'connected' && (
          <button
            type="button"
            onClick={enableUsdc}
            disabled={busy === 'usdc'}
            className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-primary/40 px-3 py-2 text-xs font-medium text-primary hover:bg-primary/5 disabled:opacity-60"
          >
            <ShieldCheck className="h-3.5 w-3.5" /> Enable USDC on my wallet
          </button>
        )}
      </header>

      {status !== 'connected' ? (
        <div className="rounded-2xl border border-dashed border-border bg-card py-16 text-center">
          <Wallet className="mx-auto h-10 w-10 text-muted-foreground" />
          <h2 className="mt-4 font-display text-lg font-bold text-ink">
            Connect to see your passes
          </h2>
          <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
            Sign in with your Stellar wallet to view the passes tied to your account.
          </p>
          <div className="mt-5 flex justify-center">
            <ConnectButton size="lg" />
          </div>
        </div>
      ) : tickets === null ? (
        <div className="space-y-4">
          {[0, 1].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-2xl border border-border bg-card" />
          ))}
        </div>
      ) : tickets.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card py-16 text-center">
          <Ticket className="mx-auto h-10 w-10 text-muted-foreground" />
          <h2 className="mt-4 font-display text-lg font-bold text-ink">No passes yet</h2>
          <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
            Browse events and grab your first on-chain pass.
          </p>
          <Button asChild className="mt-5">
            <Link href="/events">Browse events</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {tickets.map((t) => {
            const ev = eventMap[t.eventId];
            return (
              <article
                key={t.id}
                className="tk-stub flex flex-col overflow-hidden rounded-2xl border border-border shadow-sm sm:flex-row"
              >
                <div className="flex-1 p-5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h2 className="font-display text-lg font-bold text-ink">
                        {ev?.name ?? 'Event'}
                      </h2>
                      {ev && (
                        <p className="mt-0.5 text-sm text-muted-foreground">
                          {formatDate(ev.eventDate)} · {ev.venue}
                          {ev.city ? `, ${ev.city}` : ''}
                        </p>
                      )}
                    </div>
                    <StatusBadge status={t.status} />
                  </div>
                  <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-sm">
                    <a
                      href={explorerContract()}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 font-mono font-semibold text-primary hover:underline"
                    >
                      {t.onchainTicketId ? `Ticket #${t.onchainTicketId}` : 'On-chain'}{' '}
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                    <span className="text-muted-foreground">Holder: {t.buyerName}</span>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
                    {t.buyTxHash && (
                      <a
                        href={explorerTx(t.buyTxHash)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-1 font-medium text-foreground hover:bg-muted"
                      >
                        Buy tx <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                    {t.checkinTxHash && (
                      <a
                        href={explorerTx(t.checkinTxHash)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-1 font-medium text-foreground hover:bg-muted"
                      >
                        Check-in tx <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                    {t.refundTxHash && (
                      <a
                        href={explorerTx(t.refundTxHash)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-1 font-medium text-foreground hover:bg-muted"
                      >
                        Refund tx <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                    {t.status === 'issued' && (
                      <button
                        type="button"
                        onClick={() => refund(t.id)}
                        disabled={busy === t.id}
                        className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 font-medium text-foreground hover:bg-secondary disabled:opacity-60"
                      >
                        {busy === t.id ? <Loader2 className="h-3 w-3 animate-spin" /> : null} Refund
                      </button>
                    )}
                  </div>
                </div>
                <div className="tk-perf flex items-center justify-center bg-secondary p-5 sm:w-40">
                  <div className="text-center">
                    <p className="font-display text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Pass
                    </p>
                    <p className="mt-1 font-display text-2xl font-bold text-ink">
                      {t.onchainTicketId ? `#${t.onchainTicketId}` : '—'}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {t.status === 'used'
                        ? 'Checked in'
                        : t.status === 'refunded'
                          ? 'Refunded'
                          : 'In escrow'}
                    </p>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </main>
  );
}
