'use client';

import { LogOut, Wallet } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useWallet } from '@/components/wallet-provider';
import { shortKey } from '@/lib/stellar-client';

export function ConnectButton({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const { address, status, connect, disconnect } = useWallet();
  const [busy, setBusy] = useState(false);

  if (status === 'loading') {
    return (
      <Button variant="outline" size={size} disabled data-testid="connect-loading">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        Loading
      </Button>
    );
  }

  if (status === 'connected' && address) {
    return (
      <div className="flex items-center gap-2">
        <span
          className="hidden items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 font-mono text-xs text-muted-foreground sm:inline-flex"
          data-testid="wallet-address"
        >
          <span className="h-2 w-2 rounded-full bg-success" />
          {shortKey(address)}
        </span>
        <Button
          variant="ghost"
          size={size}
          onClick={() => disconnect()}
          aria-label="Disconnect wallet"
        >
          <LogOut /> <span className="hidden sm:inline">Disconnect</span>
        </Button>
      </div>
    );
  }

  return (
    <Button
      variant="primary"
      size={size}
      data-testid="connect-button"
      disabled={busy || status === 'connecting'}
      onClick={async () => {
        setBusy(true);
        try {
          await connect();
          toast.success('Wallet connected');
        } catch (err) {
          toast.error(err instanceof Error ? err.message : 'Could not connect wallet');
        } finally {
          setBusy(false);
        }
      }}
    >
      {busy || status === 'connecting' ? (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : (
        <Wallet />
      )}
      {busy || status === 'connecting' ? 'Connecting' : 'Connect wallet'}
    </Button>
  );
}
