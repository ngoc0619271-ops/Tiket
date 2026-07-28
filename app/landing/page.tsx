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
  },
  {
    fn: 'buy(event_id, buyer)',
    body: 'Buyer-signed. Moves the price from the buyer into the contract’s own address and logs a Valid ticket. Free events skip that transfer entirely.',
  },
  {
    fn: 'check_in(ticket_id)',
    body: 'Organizer-signed, and only the organizer can call it. Pays the escrowed price out to them and flips the ticket to Used. Won’t run on a ticket that’s already Used or Refunded.',
  },
  {
    fn: 'refund(ticket_id)',
    body: 'Ticket-owner-signed, and only before the event’s start_time. Sends the escrow back to the buyer and flips the ticket to Refunded. Once the event starts, or the ticket’s already moved, this stops working.',
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
              A Tiket pass isn&apos;t a QR code you screenshot and hope works — it&apos;s an escrow.
              The price sits inside a Soroban contract from the second you buy until you walk
              through the door, or until you change your mind.
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

      <section className="relative overflow-hidden border-y border-border">
        <div className="absolute inset-0">
          <img
            src="/images/landing/panoramic-concert-crowd-248963.jpg"
            alt="A band on stage, seen past a crowd of raised hands under white stage lights"
            width={1600}
            height={763}
            loading="lazy"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-primary/40 via-ink/80 to-ink/95" />
        </div>
        <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <h2 className="font-display text-3xl font-bold tracking-tight text-primary-foreground">
            Where your money actually sits
          </h2>
          <p className="mt-2 max-w-2xl text-primary-foreground/80">
            Every pass moves through one of three states below. No one behind a desk picks which one
            — the contract does.
          </p>
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
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="font-display text-3xl font-bold tracking-tight text-ink">
              Who&apos;s actually in this
            </h2>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              Five parties touch an escrowed ticket, start to finish. That&apos;s the entire list —
              nothing gets bolted on later.
            </p>
          </div>
          <figure className="hidden w-40 shrink-0 overflow-hidden rounded-2xl border border-border shadow-sm sm:block">
            <img
              src="/images/landing/kadayawan-festival-22622230.jpg"
              alt="Dancers in traditional costume at the Kadayawan Festival in Davao, Philippines"
              width={1600}
              height={1067}
              loading="lazy"
              className="h-28 w-full object-cover"
            />
            <figcaption className="bg-card px-3 py-2 text-xs text-muted-foreground">
              Concerts, fun runs, town fiestas — wherever a door needs checking.
            </figcaption>
          </figure>
        </div>
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
        <div className="mt-8 rounded-2xl border border-border bg-card p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Contract ID
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
          <div className="absolute inset-0">
            <img
              src="/images/landing/stage-silhouette-1763067.jpg"
              alt="Silhouetted crowd with hands raised against blue stage lighting"
              width={1600}
              height={1068}
              loading="lazy"
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-primary/85" />
          </div>
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
