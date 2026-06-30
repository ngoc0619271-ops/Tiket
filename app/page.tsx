import {
  ArrowRight,
  BadgeCheck,
  CalendarPlus,
  Landmark,
  QrCode,
  Ticket,
  Wallet,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

const steps = [
  {
    icon: Wallet,
    title: 'Buy a pass',
    body: 'One signed transaction escrows the ticket price into the Tiket Soroban contract and records your ticket on-chain — no intermediary holds your money.',
  },
  {
    icon: QrCode,
    title: 'Show up',
    body: 'Your ticket lives on-chain, not in a screenshot. Anyone can verify it on Stellar — it cannot be forged or duplicated.',
  },
  {
    icon: Landmark,
    title: 'Check in = settle',
    body: 'At the door the organizer checks you in: the contract marks the ticket Used and releases the escrowed price to them. Spent exactly once. Change of plans? Refund before the event.',
  },
];

const facts = [
  { k: 'Soroban contract', v: 'Escrow buy, check-in, refund' },
  { k: 'XLM escrow', v: 'Native settlement, no trustline' },
  { k: 'Refundable', v: 'Reclaim your price before the event' },
  { k: 'SEP-10', v: 'Sign-in by wallet signature' },
];

export default function HomePage() {
  return (
    <main>
      {/* Hero */}
      <section className="tk-grid border-b border-border">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:py-24">
          <div className="flex flex-col justify-center">
            <span className="mb-5 inline-flex w-fit items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-sm font-medium text-primary">
              <BadgeCheck className="h-4 w-4" /> Built on Stellar {process.env.NEXT_PUBLIC_STELLAR_NETWORK === 'public' ? 'mainnet' : 'testnet'}
            </span>
            <h1 className="font-display text-4xl font-bold leading-[1.05] tracking-tight text-ink sm:text-6xl">
              Tickets that <span className="text-primary">can&apos;t be faked</span>,
              <br className="hidden sm:block" /> spent only once.
            </h1>
            <p className="mt-5 max-w-xl text-lg text-muted-foreground">
              Tiket escrows every ticket on a Soroban smart contract. Buyers pay into the contract,
              organizers settle on check-in, and unused passes refund before the event. No scalping,
              no screenshots, no double entry.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link href="/events">
                  Browse events <ArrowRight />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/dashboard">
                  <CalendarPlus /> Host an event
                </Link>
              </Button>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              No wallet needed to browse — connect only when you buy or host.
            </p>
          </div>

          {/* Ticket-stub visual */}
          <div className="flex items-center justify-center">
            <div className="tk-stub flex w-full max-w-sm overflow-hidden rounded-2xl border border-border shadow-xl">
              <div className="flex-1 p-6">
                <div className="flex items-center gap-2 text-primary">
                  <Ticket className="h-5 w-5" />
                  <span className="font-display text-sm font-semibold uppercase tracking-wider">
                    Access pass
                  </span>
                </div>
                <p className="mt-4 font-display text-2xl font-bold text-ink">
                  Stellar Builders Night
                </p>
                <p className="mt-1 text-sm text-muted-foreground">Testnet · General admission</p>
                <dl className="mt-6 grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <dt className="text-muted-foreground">Asset</dt>
                    <dd className="font-mono font-semibold text-ink">TKT••••</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Status</dt>
                    <dd className="font-semibold text-success">Valid on-chain</dd>
                  </div>
                </dl>
              </div>
              <div className="tk-perf flex w-16 flex-col items-center justify-center bg-secondary p-3">
                <QrCode className="h-8 w-8 text-primary" />
                <span className="mt-2 text-[10px] font-medium text-muted-foreground">verify</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <h2 className="font-display text-3xl font-bold tracking-tight text-ink">How Tiket works</h2>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Three steps, all settled on Stellar. The escrow is the whole point — it makes a ticket
          behave like a ticket.
        </p>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {steps.map((s, i) => (
            <div key={s.title} className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <s.icon className="h-5 w-5" />
              </div>
              <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Step {i + 1}
              </p>
              <h3 className="mt-1 font-display text-lg font-bold text-ink">{s.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Tech strip */}
      <section className="border-t border-border bg-card">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {facts.map((f) => (
              <div key={f.k}>
                <p className="font-mono text-sm font-semibold text-primary">{f.k}</p>
                <p className="mt-1 text-sm text-muted-foreground">{f.v}</p>
              </div>
            ))}
          </div>
          <div className="mt-10 flex flex-col items-start justify-between gap-4 rounded-2xl bg-primary px-6 py-7 text-primary-foreground sm:flex-row sm:items-center">
            <div>
              <p className="font-display text-xl font-bold">Run your next event on-chain.</p>
              <p className="mt-1 text-sm text-primary-foreground/80">
                Create an event, sell escrowed passes, settle on check-in.
              </p>
            </div>
            <Button asChild variant="accent" size="lg">
              <Link href="/dashboard">
                Open organizer console <ArrowRight />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
