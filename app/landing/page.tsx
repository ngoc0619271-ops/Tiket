import {
  ArrowRight,
  ExternalLink,
  QrCode,
  ScanLine,
  ShieldCheck,
  Ticket,
  Undo2,
  Wallet,
} from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { APP_NETWORK, CONTRACT_ID, explorerContract } from '@/lib/stellar-client';
import { LiveBoard } from './live-board';

export const metadata: Metadata = {
  title: 'Tiket — Admission that settles itself',
};

const contractShort = CONTRACT_ID
  ? `${CONTRACT_ID.slice(0, 6)}…${CONTRACT_ID.slice(-6)}`
  : 'not configured';

const lifecycle = [
  {
    icon: Wallet,
    title: 'Buy',
    body: 'Price escrows into the contract the moment you buy. Nobody holds it — the ledger does.',
  },
  {
    icon: ScanLine,
    title: 'Check in',
    body: 'The organizer scans you at the door. The contract releases escrow to them and marks the pass Used.',
  },
];

export default function LandingPage() {
  return (
    <main>
      <section className="tk-grid border-b border-border">
        <div className="mx-auto grid max-w-6xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:py-24">
          <div>
            <span className="mb-5 inline-flex w-fit items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-sm font-medium text-primary">
              <ShieldCheck className="h-4 w-4" /> Built on Stellar{' '}
              {process.env.NEXT_PUBLIC_STELLAR_NETWORK === 'public' ? 'mainnet' : 'testnet'}
            </span>
            <h1 className="font-display text-4xl font-bold leading-[1.05] tracking-tight text-ink sm:text-6xl">
              Admission that <span className="text-primary">settles itself.</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg text-muted-foreground">
              A Tiket pass isn&apos;t a QR code someone screenshots — it&apos;s an escrow. The price
              sits in a Soroban contract from the moment you buy until the moment you walk in, or
              the moment you change your mind.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link href="/events">
                  Get a pass <ArrowRight />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <a href={explorerContract()} target="_blank" rel="noopener noreferrer">
                  Verify the contract <ExternalLink />
                </a>
              </Button>
            </div>
          </div>

          <div className="mx-auto w-full max-w-sm overflow-visible rounded-2xl border border-border bg-card shadow-xl">
            <div className="flex items-center justify-between p-6">
              <div className="flex items-center gap-2 text-primary">
                <Ticket className="h-5 w-5" />
                <span className="font-display text-sm font-semibold uppercase tracking-wider">
                  General admission
                </span>
              </div>
              <QrCode className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="tk-tear" />
            <div className="p-6">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Escrow contract
              </p>
              <p className="mt-1 font-mono text-sm font-semibold text-ink">{contractShort}</p>
              <dl className="mt-4 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <dt className="text-muted-foreground">Network</dt>
                  <dd className="font-semibold capitalize text-ink">
                    {APP_NETWORK === 'public' ? 'mainnet' : 'testnet'}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Status</dt>
                  <dd className="font-semibold text-success">Escrowed</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <h2 className="font-display text-3xl font-bold tracking-tight text-ink">
          Not held. Escrowed.
        </h2>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Two ways a pass ends: you attend, or you don&apos;t. Either way the contract — not an
          intermediary — decides where the money goes.
        </p>
        <div className="mt-10 flex flex-col gap-0 md:flex-row md:items-stretch">
          {lifecycle.map((s, i) => (
            <div key={s.title} className="flex flex-1 items-start gap-4 md:items-center">
              <div className="flex flex-col items-center gap-2">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <s.icon className="h-5 w-5" />
                </div>
                {i < lifecycle.length - 1 && (
                  <div className="hidden h-px flex-1 bg-border md:block md:h-px md:w-full" />
                )}
              </div>
              <div className="rounded-2xl border border-border bg-card p-5 shadow-sm md:flex-1">
                <h3 className="font-display text-lg font-bold text-ink">{s.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{s.body}</p>
              </div>
              {i < lifecycle.length - 1 && (
                <div className="hidden h-px w-10 self-center bg-border md:block" />
              )}
            </div>
          ))}
        </div>
        <div className="mt-6 flex items-start gap-4 rounded-2xl border border-dashed border-border bg-secondary/40 p-5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent">
            <Undo2 className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-display text-lg font-bold text-ink">Or refund</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Plans change before the event starts — reclaim your escrowed price directly from the
              contract, no support ticket required.
            </p>
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-secondary/30">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <h2 className="font-display text-3xl font-bold tracking-tight text-ink">
            Real numbers, not projections
          </h2>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Pulled live from this deployment&apos;s sessions and on-chain ticket records.
          </p>
          <div className="mt-8">
            <LiveBoard />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="flex flex-col items-start justify-between gap-4 rounded-2xl bg-primary px-6 py-7 text-primary-foreground sm:flex-row sm:items-center">
          <div>
            <p className="font-display text-xl font-bold">Your money, your contract, your call.</p>
            <p className="mt-1 text-sm text-primary-foreground/80">
              Browse events and buy an escrowed pass — no wallet needed until checkout.
            </p>
          </div>
          <Button asChild variant="accent" size="lg">
            <Link href="/events">
              Browse events <ArrowRight />
            </Link>
          </Button>
        </div>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Follow{' '}
          <a
            href="https://x.com/TiketXLM"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-primary hover:underline"
          >
            @TiketXLM
          </a>{' '}
          for launches and updates.
        </p>
      </section>
    </main>
  );
}
