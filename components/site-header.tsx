'use client';

import { Menu, TicketCheck, X } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { ConnectButton } from '@/components/connect-button';
import { cn } from '@/lib/utils';

const nav = [
  { href: '/events', label: 'Events' },
  { href: '/tickets', label: 'My tickets' },
  { href: '/dashboard', label: 'Organize' },
  { href: '/stats', label: 'Stats' },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2" onClick={() => setOpen(false)}>
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <TicketCheck className="h-5 w-5" />
          </span>
          <span className="font-display text-xl font-bold tracking-tight">Tiket</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                pathname.startsWith(item.href)
                  ? 'bg-secondary text-foreground'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <div className="hidden sm:block">
            <ConnectButton size="sm" />
          </div>
          <button
            type="button"
            className="rounded-lg p-2 text-muted-foreground hover:bg-secondary md:hidden"
            aria-label="Toggle menu"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-border bg-background px-4 py-3 md:hidden">
          <nav className="flex flex-col gap-1">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  'rounded-lg px-3 py-2.5 text-sm font-medium',
                  pathname.startsWith(item.href)
                    ? 'bg-secondary text-foreground'
                    : 'text-muted-foreground',
                )}
              >
                {item.label}
              </Link>
            ))}
            <div className="pt-2">
              <ConnectButton size="md" />
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
