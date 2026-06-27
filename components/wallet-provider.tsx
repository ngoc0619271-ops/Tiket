'use client';

import { getAddress, isConnected, requestAccess, signTransaction } from '@stellar/freighter-api';
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { get, post } from '@/lib/api';
import { NETWORK_PASSPHRASE } from '@/lib/stellar-client';

type Status = 'loading' | 'disconnected' | 'connecting' | 'connected';

type WalletContextValue = {
  address: string | null;
  status: Status;
  connect: () => Promise<string>;
  disconnect: () => Promise<void>;
  signXdr: (xdr: string) => Promise<string>;
};

const WalletContext = createContext<WalletContextValue | null>(null);

function pickAddress(r: { address?: string; publicKey?: string }): string | undefined {
  return r.address || r.publicKey;
}

async function freighterAddress(): Promise<string> {
  const access = (await requestAccess()) as {
    address?: string;
    publicKey?: string;
    error?: unknown;
  };
  if (access.error) throw new Error(String(access.error));
  const fromAccess = pickAddress(access);
  if (fromAccess) return fromAccess;
  const got = (await getAddress()) as { address?: string; publicKey?: string; error?: unknown };
  if (got.error) throw new Error(String(got.error));
  const fromGot = pickAddress(got);
  if (!fromGot) throw new Error('No Stellar address returned by the wallet');
  return fromGot;
}

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>('loading');

  // Restore an existing session on load.
  useEffect(() => {
    let active = true;
    get<{ publicKey: string | null }>('/api/auth/me')
      .then((d) => {
        if (!active) return;
        if (d.publicKey) {
          setAddress(d.publicKey);
          setStatus('connected');
        } else {
          setStatus('disconnected');
        }
      })
      .catch(() => active && setStatus('disconnected'));
    return () => {
      active = false;
    };
  }, []);

  const signXdr = useCallback(
    async (xdr: string): Promise<string> => {
      const addr = address ?? (await freighterAddress());
      const res = await signTransaction(xdr, {
        networkPassphrase: NETWORK_PASSPHRASE,
        address: addr,
      });
      const r = res as { signedTxXdr?: string; error?: unknown };
      if (r.error) throw new Error(String(r.error));
      if (!r.signedTxXdr) throw new Error('Wallet did not return a signed transaction');
      return r.signedTxXdr;
    },
    [address],
  );

  const connect = useCallback(async (): Promise<string> => {
    setStatus('connecting');
    try {
      const installed = await isConnected();
      if (installed && 'isConnected' in installed && !installed.isConnected) {
        // freighter-api may still allow requestAccess; fall through.
      }
      const pk = await freighterAddress();

      // SEP-10 challenge -> sign (pinned to app network) -> verify -> session cookie.
      const { txXdr } = await post<{ txXdr: string }>('/api/auth/challenge', { publicKey: pk });
      const signed = await signTransaction(txXdr, {
        networkPassphrase: NETWORK_PASSPHRASE,
        address: pk,
      });
      const sr = signed as { signedTxXdr?: string; error?: unknown };
      if (sr.error) throw new Error(String(sr.error));
      if (!sr.signedTxXdr) throw new Error('Wallet did not sign the challenge');

      await post('/api/auth/verify', { publicKey: pk, signedNonce: sr.signedTxXdr });
      setAddress(pk);
      setStatus('connected');
      return pk;
    } catch (err) {
      setStatus('disconnected');
      throw err;
    }
  }, []);

  const disconnect = useCallback(async () => {
    await post('/api/auth/logout').catch(() => {});
    setAddress(null);
    setStatus('disconnected');
  }, []);

  return (
    <WalletContext.Provider value={{ address, status, connect, disconnect, signXdr }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet(): WalletContextValue {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error('useWallet must be used within WalletProvider');
  return ctx;
}
