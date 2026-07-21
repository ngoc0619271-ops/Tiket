// Client-side Stellar constants. The signing network is PINNED to the app's
// configured network (NEXT_PUBLIC_STELLAR_NETWORK), never the wallet's active one.
const TESTNET_PASSPHRASE = 'Test SDF Network ; September 2015';
const PUBLIC_PASSPHRASE = 'Public Global Stellar Network ; September 2015';

export const APP_NETWORK =
  process.env.NEXT_PUBLIC_STELLAR_NETWORK === 'public' ? 'public' : 'testnet';

export const NETWORK_PASSPHRASE = APP_NETWORK === 'public' ? PUBLIC_PASSPHRASE : TESTNET_PASSPHRASE;

export const CONTRACT_ID = process.env.NEXT_PUBLIC_SOROBAN_CONTRACT_ID ?? '';

export function explorerContract(id: string = CONTRACT_ID): string {
  return `https://stellar.expert/explorer/${APP_NETWORK}/contract/${id}`;
}

export function shortKey(pk: string | null | undefined): string {
  if (!pk) return '';
  return `${pk.slice(0, 4)}…${pk.slice(-4)}`;
}

export function explorerTx(hash: string): string {
  return `https://stellar.expert/explorer/${APP_NETWORK}/tx/${hash}`;
}

export function explorerAsset(code: string, issuer: string): string {
  return `https://stellar.expert/explorer/${APP_NETWORK}/asset/${code}-${issuer}`;
}

export function explorerAccount(pk: string): string {
  return `https://stellar.expert/explorer/${APP_NETWORK}/account/${pk}`;
}
