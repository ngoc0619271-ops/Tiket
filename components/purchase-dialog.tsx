'use client';

import { CheckCircle2, ExternalLink, Loader2, ShieldCheck, X } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useWallet } from '@/components/wallet-provider';
import { ApiError, post } from '@/lib/api';
import { type EventDTO, formatPrice } from '@/lib/format';

type Phase = 'form' | 'working' | 'done';

export function PurchaseDialog({
  event,
  open,
  onClose,
  onPurchased,
}: {
  event: EventDTO;
  open: boolean;
  onClose: () => void;
  onPurchased?: () => void;
}) {
  const { address, status, connect, signXdr } = useWallet();
  const [phase, setPhase] = useState<Phase>('form');
  const [name, setName] = useState('');
  const [result, setResult] = useState<{ buy: string | null } | null>(null);

  if (!open) return null;

  async function buy() {
    setPhase('working');
    try {
      let pk = address;
      if (status !== 'connected' || !pk) pk = await connect();

      // Build the buyer-signed Soroban `buy` invoke, sign it, submit on-chain.
      const { xdr } = await post<{ xdr: string }>('/api/purchase/build', { eventId: event.id });
      const signedXdr = await signXdr(xdr);
      const res = await post<{ explorer: { buy: string | null } }>('/api/purchase/submit', {
        eventId: event.id,
        buyerName: name || undefined,
        signedXdr,
      });
      setResult(res.explorer);
      setPhase('done');
      onPurchased?.();
      toast.success('Pass secured on-chain');
    } catch (err) {
      setPhase('form');
      const msg =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Purchase failed';
      toast.error(msg);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/50 p-0 backdrop-blur-sm sm:items-center sm:p-4">
      <div className="w-full max-w-md rounded-t-2xl border border-border bg-card shadow-2xl sm:rounded-2xl">
        <div className="flex items-start justify-between border-b border-border p-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">
              Get your pass
            </p>
            <h2 className="mt-1 font-display text-xl font-bold text-ink">{event.name}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {phase === 'done' && result ? (
          <div className="p-6 text-center">
            <CheckCircle2 className="mx-auto h-12 w-12 text-success" />
            <h3 className="mt-3 font-display text-lg font-bold text-ink">Pass is in your wallet</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Your ticket is recorded on-chain by the Tiket contract. The price is held in escrow
              until you&apos;re checked in.
            </p>
            <div className="mt-5 space-y-2 text-left">
              {result.buy && (
                <a
                  href={result.buy}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between rounded-lg border border-border bg-secondary/50 px-3 py-2 text-sm font-medium text-foreground hover:bg-secondary"
                >
                  On-chain buy tx <ExternalLink className="h-4 w-4 text-primary" />
                </a>
              )}
            </div>
            <Button asChild className="mt-6 w-full">
              <Link href="/tickets">View my tickets</Link>
            </Button>
          </div>
        ) : (
          <div className="p-5">
            <dl className="mb-5 space-y-3 rounded-xl bg-secondary/50 p-4 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Price</dt>
                <dd className="font-semibold text-ink">
                  {formatPrice(event.price, event.priceAsset)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Settles</dt>
                <dd className="font-semibold text-ink">Into the Tiket contract (escrow)</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Remaining</dt>
                <dd className="font-semibold text-ink">
                  {event.totalCapacity - event.soldCount} / {event.totalCapacity}
                </dd>
              </div>
            </dl>

            <label className="mb-1.5 block text-sm font-medium text-foreground" htmlFor="buyerName">
              Display name <span className="text-muted-foreground">(optional)</span>
            </label>
            <input
              id="buyerName"
              value={name}
              maxLength={80}
              onChange={(e) => setName(e.target.value)}
              placeholder="Shown to the organizer at the door"
              className="mb-4 w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-ring"
            />

            <Button onClick={buy} disabled={phase === 'working'} className="w-full" size="lg">
              {phase === 'working' ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Signing &amp; settling…
                </>
              ) : status === 'connected' ? (
                'Pay & get pass'
              ) : (
                'Connect wallet & buy'
              )}
            </Button>
            <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
              <ShieldCheck className="h-3.5 w-3.5" /> One wallet signature. Escrowed by the Soroban
              contract on Stellar testnet. Refundable before the event.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
