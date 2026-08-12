'use client';

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

const rows: { key: keyof Stats; label: string }[] = [
  { key: 'uniqueWallets', label: 'Wallets' },
  { key: 'events', label: 'Events' },
  { key: 'ticketsIssued', label: 'Passes issued' },
  { key: 'checkIns', label: 'Check-ins' },
  { key: 'settlements', label: 'Settlements' },
  { key: 'logins', label: 'Sign-ins' },
];

export function LiveBoard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    get<Stats>('/api/stats')
      .then(setStats)
      .catch(() => setFailed(true));
  }, []);

  return (
    <div className="rounded-2xl border border-ink/10 bg-ink shadow-xl">
      <div className="flex items-center justify-between border-b border-background/10 px-6 py-4">
        <span className="font-display text-sm font-semibold uppercase tracking-widest text-background">
          Live activity board
        </span>
        <span className="flex items-center gap-1.5 text-xs font-medium text-background/60">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-success" />
          {failed ? 'unavailable' : stats ? 'on-chain + sessions' : 'loading'}
        </span>
      </div>
      <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-b-2xl bg-background/10 sm:grid-cols-3">
        {rows.map((r) => (
          <div key={r.key} className="bg-ink px-6 py-5">
            <dt className="text-xs font-medium uppercase tracking-wider text-background/50">
              {r.label}
            </dt>
            <dd className="mt-1 font-mono text-2xl font-bold tabular-nums text-background">
              {stats ? stats[r.key].toLocaleString('en-US') : '—'}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
