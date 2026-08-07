import { TicketCheck } from 'lucide-react';
import Link from 'next/link';

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-border bg-card">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <TicketCheck className="h-4 w-4 text-primary" />
          <span className="font-display font-semibold text-foreground">Tiket</span>
          <span>
            — on-chain escrow event passes on Stellar{' '}
            {process.env.NEXT_PUBLIC_STELLAR_NETWORK === 'public' ? 'mainnet' : 'testnet'}.
          </span>
        </div>
        <nav className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
          <Link href="/events" className="hover:text-foreground">
            Events
          </Link>
          <Link href="/tickets" className="hover:text-foreground">
            My tickets
          </Link>
          <Link href="/dashboard" className="hover:text-foreground">
            Organize
          </Link>
          <Link href="/stats" className="hover:text-foreground">
            Stats
          </Link>
        </nav>
      </div>
    </footer>
  );
}
