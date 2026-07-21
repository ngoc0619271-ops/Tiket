'use client';

import { APP_NETWORK } from '@/lib/stellar-client';

const label = APP_NETWORK === 'public' ? 'Mainnet' : APP_NETWORK === 'testnet' ? 'Testnet' : APP_NETWORK;
const isMainnet = APP_NETWORK === 'public';

export function NetworkBadge() {
  // Match the app's violet theme on mainnet; amber on testnet for contrast.
  return (
    <span
      className={
        isMainnet
          ? 'inline-flex items-center gap-1.5 rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 text-xs font-semibold uppercase tracking-wider text-violet-700 dark:border-violet-900/40 dark:bg-violet-900/30 dark:text-violet-200'
          : 'inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold uppercase tracking-wider text-amber-700 dark:border-amber-900/40 dark:bg-amber-900/30 dark:text-amber-300'
      }
      title={`App is configured for Stellar ${label}`}
      data-testid="network-badge"
    >
      <span
        className={
          isMainnet
            ? 'h-1.5 w-1.5 rounded-full bg-violet-500'
            : 'h-1.5 w-1.5 rounded-full bg-amber-500'
        }
      />
      {label}
    </span>
  );
}