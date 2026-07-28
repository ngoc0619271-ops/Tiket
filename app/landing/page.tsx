import {
  ArrowRight,
  Blocks,
  Building2,
  CheckCircle2,
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

const lifecycleSteps = [
  {
    icon: Wallet,
    title: 'Buy',
    body: 'Price escrows into the contract the moment you buy, and it stays there. No one else can touch it.',
  },
  {
    icon: ScanLine,
    title: 'Check in',
    body: 'The organizer scans you at the door. That scan releases the escrow to them and marks your pass Used.',
  },
  {
    icon: Undo2,
    title: 'Or refund',
    body: 'Change your mind before the event starts and you can pull your escrow back yourself, no support ticket. Once the event starts, that door closes.',
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
    highlight: true,
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
  'Default settlement is native XLM through the Stellar Asset Contract, so buying a ticket never requires a trustline. Want to hold USDC too? A one-tap trustline adds that, whenever you want it.';

const roadmapLiveNow = [
  'Escrowed purchase, price locks into the contract on buy',
  'Settle-on-attendance, escrow releases to the organizer on check-in',
  'Pre-event refund, buyers reclaim escrow directly from the contract',
  'Organizer cancel, stops further sales while existing tickets stay refundable',
  'Wallet auth via Freighter, session-backed',
  'Native XLM by default, USDC as an opt-in trustline',
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
    body: 'Organizer-signed. Sets up the event on-chain. Won’t accept a zero capacity, and won’t accept a start time that’s already in the past.',
    signer: 'organizer',
  },
  {
    fn: 'buy(event_id, buyer)',
    body: 'Buyer-signed. Moves the price from the buyer into the contract’s own address and logs a Valid ticket. Free events skip that transfer entirely.',
    signer: 'buyer',
  },
  {
    fn: 'check_in(ticket_id)',
    body: 'Organizer-signed, and only the organizer can call it. Pays the escrowed price out to them and flips the ticket to Used. Won’t run on a ticket that’s already Used or Refunded.',
    signer: 'organizer',
  },
  {
    fn: 'refund(ticket_id)',
    body: 'Ticket-owner-signed, and only before the event’s start_time. Sends the escrow back to the buyer and flips the ticket to Refunded. Once the event starts, or the ticket’s already moved, this stops working.',
    signer: 'buyer',
  },
];

function EscrowStateDiagram() {
  return (
    <div className="relative mx-auto mt-10 aspect-[16/8] w-full max-w-3xl sm:aspect-[16/6]">
      <svg
        viewBox="0 0 320 160"
        preserveAspectRatio="none"
        className="absolute inset-0 h-full w-full"
        aria-hidden="true"
      >
        <defs>
          <marker
            id="escrow-arrow-success"
            markerWidth="6"
            markerHeight="6"
            refX="5"
            refY="3"
            orient="auto"
          >
            <path d="M0,0 L6,3 L0,6 z" fill="hsl(var(--success))" />
          </marker>
          <marker
            id="escrow-arrow-accent"
            markerWidth="6"
            markerHeight="6"
            refX="5"
            refY="3"
            orient="auto"
          >
            <path d="M0,0 L6,3 L0,6 z" fill="hsl(var(--accent))" />
          </marker>
        </defs>
        <path
          d="M 96 80 C 144 80, 144 27, 189 27"
          fill="none"
          stroke="hsl(var(--success))"
          strokeWidth="2"
          markerEnd="url(#escrow-arrow-success)"
        />
        <path
          d="M 96 80 C 144 80, 144 133, 189 133"
          fill="none"
          stroke="hsl(var(--accent))"
          strokeWidth="2"
          markerEnd="url(#escrow-arrow-accent)"
        />
      </svg>
      {lifecycleSteps.map((s, i) => {
        const position =
          i === 0
            ? 'left-0 top-[38%] w-[30%]'
            : i === 1
              ? 'right-0 top-0 w-[38%]'
              : 'right-0 bottom-0 w-[38%]';
        return (
          <div
            key={s.title}
            className={`absolute ${position} rounded-2xl border border-primary-foreground/25 bg-primary-foreground/10 p-3 backdrop-blur sm:p-4`}
          >
            <div className="flex items-center gap-2">
              <s.icon className="h-4 w-4 shrink-0 text-primary-foreground" />
              <span className="font-display text-sm font-bold text-primary-foreground">
                {i === 0 ? 'Bought' : i === 1 ? 'Checked in' : 'Refunded'}
              </span>
            </div>
            <p className="mt-1 hidden text-xs text-primary-foreground/70 sm:block">
              {i === 0 ? 'Held in escrow' : i === 1 ? 'Released to organizer' : 'Returned to buyer'}
            </p>
          </div>
        );
      })}
    </div>
  );
}

export default function LandingPage() {
  return (
    <main>
      <section id="intro" className="tk-grid scroll-mt-20 border-b border-border">
        <div className="px-4 py-16 sm:px-6 lg:py-24">
          <div className="mx-auto grid max-w-5xl grid-cols-1 overflow-visible rounded-2xl border border-border bg-card shadow-xl sm:grid-cols-[1fr_auto]">
            <div className="p-8 sm:p-10 lg:p-12">
              <span className="mb-5 inline-flex w-fit items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-sm font-medium text-primary">
                <ShieldCheck className="h-4 w-4" /> Built on Stellar{' '}
                {process.env.NEXT_PUBLIC_STELLAR_NETWORK === 'public' ? 'mainnet' : 'testnet'}
              </span>
              <h1 className="font-display text-4xl font-bold leading-[1.05] tracking-tight text-ink sm:text-6xl">
                Admission that <span className="text-primary">settles itself.</span>
              </h1>
              <p className="mt-5 max-w-xl text-lg text-muted-foreground">
                A Tiket pass isn&apos;t a QR code you screenshot and hope works — it&apos;s an
                escrow. The price sits inside a Soroban contract from the second you buy until you
                walk through the door, or until you change your mind.
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

            <div className="tk-seam flex flex-col gap-6 p-6 sm:w-72 sm:p-8 lg:w-80">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-primary">
                  <Ticket className="h-5 w-5" />
                  <span className="font-display text-sm font-semibold uppercase tracking-wider">
                    General admission
                  </span>
                </div>
                <QrCode className="h-8 w-8 text-muted-foreground" />
              </div>
              <div>
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
        </div>
      </section>

      <section className="relative overflow-hidden border-y border-border bg-ink">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/35 via-ink to-ink" />
        <div className="tk-grid absolute inset-0 opacity-30" />
        <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <h2 className="font-display text-3xl font-bold tracking-tight text-primary-foreground">
            Where your money actually sits
          </h2>
          <p className="mt-2 max-w-2xl text-primary-foreground/80">
            Every pass moves through one of three states below. No one behind a desk picks which one
            — the contract does.
          </p>
          <EscrowStateDiagram />
          <div className="mt-10 grid gap-8 sm:grid-cols-3 sm:gap-6">
            {lifecycleSteps.map((s, i) => (
              <div key={s.title} className="relative">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary-foreground/10 text-primary-foreground ring-1 ring-primary-foreground/30 backdrop-blur">
                    <s.icon className="h-5 w-5" />
                  </div>
                  <span className="font-display text-xs font-semibold uppercase tracking-wider text-primary-foreground/50">
                    Step {i + 1}
                  </span>
                </div>
                <h3 className="mt-3 font-display text-lg font-bold text-primary-foreground">
                  {s.title}
                </h3>
                <p className="mt-1 text-sm text-primary-foreground/75">{s.body}</p>
                {i < lifecycleSteps.length - 1 && (
                  <div className="mt-6 hidden h-px w-full bg-primary-foreground/20 sm:block" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="ecosystem" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-16 sm:px-6">
        <div>
          <h2 className="font-display text-3xl font-bold tracking-tight text-ink">
            Who&apos;s actually in this
          </h2>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Five parties touch an escrowed ticket, start to finish. That&apos;s the entire list —
            nothing gets bolted on later.
          </p>
        </div>
        <div
          className="mt-10 flex snap-x snap-mandatory gap-3 overflow-x-auto px-1 pb-4 pt-3"
          style={{
            maskImage:
              'linear-gradient(to right, transparent, black 24px, black calc(100% - 24px), transparent)',
            WebkitMaskImage:
              'linear-gradient(to right, transparent, black 24px, black calc(100% - 24px), transparent)',
          }}
        >
          {ecosystemActors.map((a, i) => (
            <div
              key={a.title}
              className={`tk-stub flex w-[240px] shrink-0 snap-start flex-col gap-3 rounded-2xl border p-5 shadow-sm ${
                a.highlight ? 'border-accent/50 ring-1 ring-accent/30' : 'border-border'
              }`}
            >
              <span className="font-mono text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Party {String(i + 1).padStart(2, '0')}
              </span>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                <a.icon className="h-5 w-5" />
              </div>
              <h3 className="font-display text-lg font-bold text-ink">{a.title}</h3>
              <p className="text-sm text-muted-foreground">{a.body}</p>
            </div>
          ))}
          <div className="tk-stub flex w-[280px] shrink-0 snap-start flex-col gap-3 rounded-2xl border border-dashed border-border bg-secondary/40 p-5">
            <span className="font-mono text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Settlement
            </span>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/15 text-accent">
              <Coins className="h-5 w-5" />
            </div>
            <h3 className="font-display text-lg font-bold text-ink">Default asset</h3>
            <p className="text-sm text-muted-foreground">{settlementNote}</p>
          </div>
        </div>
      </section>

      <section id="roadmap" className="border-t border-border bg-secondary/30">
        <div className="mx-auto max-w-6xl scroll-mt-20 px-4 py-16 sm:px-6">
          <h2 className="font-display text-3xl font-bold tracking-tight text-ink">
            Live now, and where it&apos;s headed
          </h2>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Nothing below has a date on it. This is direction, and direction can change.
          </p>
          <div className="mt-10 divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            {roadmapLiveNow.map((item) => (
              <div key={item} className="flex items-center gap-4 p-4 sm:p-5">
                <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-success/10 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-success">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Live
                </span>
                <span className="text-sm text-ink">{item}</span>
              </div>
            ))}
            {roadmapNext.map((item) => (
              <div key={item} className="flex items-center gap-4 p-4 sm:p-5">
                <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-primary">
                  <Compass className="h-3.5 w-3.5" /> Next
                </span>
                <span className="text-sm text-muted-foreground">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-16 sm:px-6">
        <h2 className="font-display text-3xl font-bold tracking-tight text-ink">
          How the escrow actually works
        </h2>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Four entrypoints on the deployed contract. Nothing happens off it.
        </p>
        <div className="mt-10 overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <div className="px-6 pt-6 pb-8">
            <span className="font-display text-sm font-bold uppercase tracking-widest text-primary">
              Escrow receipt
            </span>
          </div>
          <div className="tk-tear mx-6" />
          <div className="px-6">
            {contractSteps.map((s, i) => (
              <div
                key={s.fn}
                className="grid grid-cols-[auto_1fr_auto] items-baseline gap-3 border-b border-dashed border-border py-4"
              >
                <span className="font-mono text-sm tabular-nums text-muted-foreground">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <div>
                  <p className="font-mono text-sm font-semibold text-ink">{s.fn}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{s.body}</p>
                </div>
                <span className="rounded bg-primary/10 px-2 py-0.5 text-xs font-semibold uppercase tracking-wider text-primary">
                  {s.signer}
                </span>
              </div>
            ))}
          </div>
          <div className="px-6 py-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Contract ID — total settled here
            </p>
            <p className="mt-1 break-all font-mono text-sm font-semibold text-ink">{CONTRACT_ID}</p>
            <a
              href={explorerContract()}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
            >
              Read the deployed contract on stellar.expert <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-secondary/30">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <h2 className="font-display text-3xl font-bold tracking-tight text-ink">
            What&apos;s actually happened here
          </h2>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Straight from this deployment&apos;s sessions and the ticket records on-chain.
          </p>
          <div className="mt-8">
            <LiveBoard />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="relative flex flex-col items-start justify-between gap-4 overflow-hidden rounded-2xl px-6 py-7 text-primary-foreground sm:flex-row sm:items-center">
          <div className="absolute inset-0 bg-gradient-to-br from-primary to-ink" />
          <div className="relative">
            <p className="font-display text-xl font-bold">Go find something worth going to.</p>
            <p className="mt-1 text-sm text-primary-foreground/80">
              Browse events and buy an escrowed pass. You don&apos;t need a wallet until checkout.
            </p>
          </div>
          <Button asChild variant="accent" size="lg" className="relative">
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
