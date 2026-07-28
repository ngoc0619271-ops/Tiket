import {
  ArrowRight,
  Blocks,
  Building2,
  CheckCircle2,
  Code2,
  Coins,
  Compass,
  ExternalLink,
  Globe,
  KeyRound,
  QrCode,
  ScanLine,
  ShieldCheck,
  Ticket,
  Undo2,
  Users,
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

const networkLabel = APP_NETWORK === 'public' ? 'mainnet' : 'testnet';

const ecosystemActors = [
  {
    icon: Users,
    title: 'Ticket buyers',
    body: 'Connect a wallet, buy a pass, get refunded pre-event — no account or custodian in between.',
  },
  {
    icon: Building2,
    title: 'Event organizers',
    body: 'Create an event on-chain and get paid the moment you check an attendee in, straight from escrow.',
  },
  {
    icon: Blocks,
    title: 'Tiket contract',
    body: `The escrow itself, deployed on ${networkLabel} at ${contractShort}. Holds every price until an event resolves.`,
  },
  {
    icon: Globe,
    title: 'Stellar network',
    body: `Every buy, check-in, and refund is a Soroban transaction settled on Stellar ${networkLabel}.`,
  },
  {
    icon: KeyRound,
    title: 'Freighter',
    body: 'The wallet extension that signs each transaction — the app never holds your keys.',
  },
];

const settlementNote =
  'Default settlement is native XLM via the Stellar Asset Contract — no trustline required to buy. USDC support is opt-in: a one-tap trustline lets a wallet hold USDC alongside its XLM.';

const roadmapLiveNow = [
  'Escrowed purchase — price locks into the contract on buy',
  'Settle-on-attendance — escrow releases to the organizer on check-in',
  'Pre-event refund — buyers reclaim escrow directly from the contract',
  'Organizer cancel — stops further sales, existing tickets stay refundable',
  'Wallet auth via Freighter, session-backed',
  'Native XLM default settlement, USDC opt-in trustline',
  'Live on-chain usage stats and explorer receipts',
  'Deployed and running on Stellar mainnet',
];

const roadmapNext = [
  'Transferable tickets, so a pass can move between wallets',
  'Organizer payout scheduling beyond per-ticket settlement',
  'Independent contract audit',
  'Broader wallet support beyond Freighter',
];

const contractSteps = [
  {
    fn: 'create_event(organizer, price, capacity, start_time)',
    body: 'Organizer-signed. Records the event; rejects a zero capacity or a start time in the past.',
  },
  {
    fn: 'buy(event_id, buyer)',
    body: 'Buyer-signed. Transfers the price from buyer to the contract’s own address and records a Valid ticket. Free events skip the transfer.',
  },
  {
    fn: 'check_in(ticket_id)',
    body: 'Organizer-signed, organizer-only. Transfers the escrowed price from the contract to the organizer and flips the ticket to Used. Fails if already Used or Refunded.',
  },
  {
    fn: 'refund(ticket_id)',
    body: 'Ticket-owner-signed. Only before the event’s start_time — transfers the escrow back to the buyer and flips the ticket to Refunded. Fails once the event has started or the ticket already moved.',
  },
];

export default function LandingPage() {
  return (
    <main>
      <section id="intro" className="tk-grid scroll-mt-20 border-b border-border">
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

      <section id="ecosystem" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-16 sm:px-6">
        <h2 className="font-display text-3xl font-bold tracking-tight text-ink">
          Who&apos;s actually in this
        </h2>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          No token, no partner network — just the parties an escrow ticket actually touches.
        </p>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ecosystemActors.map((a) => (
            <div key={a.title} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                <a.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-display text-lg font-bold text-ink">{a.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{a.body}</p>
            </div>
          ))}
          <div className="rounded-2xl border border-dashed border-border bg-secondary/40 p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/15 text-accent">
              <Coins className="h-5 w-5" />
            </div>
            <h3 className="mt-4 font-display text-lg font-bold text-ink">Settlement</h3>
            <p className="mt-1 text-sm text-muted-foreground">{settlementNote}</p>
          </div>
        </div>
      </section>

      <section id="roadmap" className="border-t border-border bg-secondary/30">
        <div className="mx-auto max-w-6xl scroll-mt-20 px-4 py-16 sm:px-6">
          <h2 className="font-display text-3xl font-bold tracking-tight text-ink">
            Live now, and where it&apos;s headed
          </h2>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Direction, not a promise — no dates or version numbers attached.
          </p>
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <h3 className="font-display text-sm font-bold uppercase tracking-wider text-success">
                Live now
              </h3>
              <ul className="mt-4 space-y-3">
                {roadmapLiveNow.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-dashed border-border bg-card p-6 shadow-sm">
              <h3 className="font-display text-sm font-bold uppercase tracking-wider text-primary">
                What&apos;s next
              </h3>
              <ul className="mt-4 space-y-3">
                {roadmapNext.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <Compass className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-16 sm:px-6">
        <h2 className="font-display text-3xl font-bold tracking-tight text-ink">
          How the escrow actually works
        </h2>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Four entrypoints on the deployed Soroban contract — no off-chain custodian.
        </p>
        <div className="mt-10 grid gap-4">
          {contractSteps.map((s, i) => (
            <div
              key={s.fn}
              className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5 shadow-sm sm:flex-row sm:items-start"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <span className="font-display text-sm font-bold">{i + 1}</span>
              </div>
              <div>
                <p className="flex items-center gap-2 font-mono text-sm font-semibold text-ink">
                  <Code2 className="h-4 w-4 text-muted-foreground" />
                  {s.fn}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">{s.body}</p>
              </div>
            </div>
          ))}
        </div>
        <a
          href={explorerContract()}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
        >
          Read the deployed contract on stellar.expert <ExternalLink className="h-4 w-4" />
        </a>
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
