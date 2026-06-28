'use client';

import { CalendarDays, Landmark, ScanLine, Ticket, UserCheck, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { get } from '@/lib/api';

type Stats = {
  uniqueWallets: number;
  logins: number;
  events: number;
  ticketsIssued: number;
  checkIns: number;
  settlements: number;
};

const cards = [
  {
    key: 'uniqueWallets',
    label: 'Wallets connected',
    icon: Users,
    hint: 'Distinct SEP-10 sign-ins',
  },
  { key: 'logins', label: 'Total sign-ins', icon: UserCheck, hint: 'Sessions created' },
  {
    key: 'events',
    label: 'Events created',
    icon: CalendarDays,
    hint: 'Registered on the contract',
  },
  { key: 'ticketsIssued', label: 'Passes bought', icon: Ticket, hint: 'Escrowed on-chain' },
  { key: 'checkIns', label: 'Check-ins', icon: ScanLine, hint: 'Attendees admitted' },
  {
    key: 'settlements',
    label: 'On-chain settlements',
    icon: Landmark,
    hint: 'Escrow released to organizers',
  },
] as const;

export default function StatsPage() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    get<Stats>('/api/stats')
      .then(setStats)
      .catch(() => setStats(null));
  }, []);

  return (
    <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <header className="mb-8">
        <h1 className="font-display text-3xl font-bold tracking-tight text-ink">
          Live platform stats
        </h1>
        <p className="mt-2 text-muted-foreground">
          Real interaction counts from this deployment — wallet sessions and on-chain ticketing
          activity. Internal demo keys are excluded.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <div key={c.key} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <c.icon className="h-5 w-5" />
            </div>
            <p className="mt-4 font-display text-4xl font-bold text-ink">
              {stats ? stats[c.key] : <span className="text-muted-foreground">—</span>}
            </p>
            <p className="mt-1 font-medium text-foreground">{c.label}</p>
            <p className="text-sm text-muted-foreground">{c.hint}</p>
          </div>
        ))}
      </div>

      <p className="mt-8 text-center text-sm text-muted-foreground">
        Counts update as people connect wallets, buy passes, and get checked in.
      </p>
    </main>
  );
}
