/**
 * Shared Stellar configuration and primitives for the server.
 *
 * This is the single internal Stellar module: `config` holds network constants
 * and asset helpers; `horizon` holds classic Horizon flows (USDC opt-in, the
 * retained clawback-token utilities); `soroban` holds the on-chain ticketing
 * contract client (build → sign → submit invokes + reads).
 */
import { Asset, Horizon, Networks, StrKey } from '@stellar/stellar-sdk';
import { env, USDC_ASSET_ISSUER_VALUE } from '@/server/config/env';

export const NETWORK_PASSPHRASE =
  env.STELLAR_NETWORK === 'public' ? Networks.PUBLIC : Networks.TESTNET;

export const SOROBAN_RPC_URL = env.SOROBAN_RPC_URL;
export const CONTRACT_ID = env.SOROBAN_CONTRACT_ID;
export const TOKEN_SAC = env.SOROBAN_TOKEN_SAC;

export const horizon = new Horizon.Server(env.STELLAR_HORIZON_URL);

/** XLM is 7 decimals (stroops). Convert a decimal string to integer stroops. */
export function toStroops(amount: string | number): bigint {
  const n = typeof amount === 'number' ? amount : Number(amount);
  if (!Number.isFinite(n) || n < 0) return 0n;
  return BigInt(Math.round(n * 1e7));
}

/** Convert integer stroops back to a trimmed decimal string. */
export function fromStroops(stroops: bigint | number | string): string {
  const v = typeof stroops === 'bigint' ? stroops : BigInt(stroops);
  const neg = v < 0n;
  const abs = neg ? -v : v;
  const whole = abs / 10_000_000n;
  const frac = (abs % 10_000_000n).toString().padStart(7, '0').replace(/0+$/, '');
  return `${neg ? '-' : ''}${whole}${frac ? `.${frac}` : ''}`;
}

export function usdcAsset(): Asset {
  return new Asset(env.USDC_ASSET_CODE, USDC_ASSET_ISSUER_VALUE);
}

export function settlementAsset(kind: string): Asset {
  return kind === 'USDC' ? usdcAsset() : Asset.native();
}

/** Retained: clawback-enabled per-event token asset (secondary feature). */
export function ticketAsset(code: string): Asset {
  return new Asset(code, env.STELLAR_ISSUER_PUBLIC);
}

/** A short, valid ticket-token code, e.g. TKT7F3A9 (retained secondary asset). */
export function generateAssetCode(): string {
  const rnd = Math.random()
    .toString(36)
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');
  return `TKT${(rnd + '00000').slice(0, 5)}`;
}

export function isValidPublicKey(pk: string): boolean {
  return pk.length === 56 && StrKey.isValidEd25519PublicKey(pk);
}

export function explorerTx(hash: string): string {
  const net = env.STELLAR_NETWORK === 'public' ? 'public' : 'testnet';
  return `https://stellar.expert/explorer/${net}/tx/${hash}`;
}

export function explorerContract(id: string = CONTRACT_ID): string {
  const net = env.STELLAR_NETWORK === 'public' ? 'public' : 'testnet';
  return `https://stellar.expert/explorer/${net}/contract/${id}`;
}

export function explorerAsset(code: string): string {
  const net = env.STELLAR_NETWORK === 'public' ? 'public' : 'testnet';
  return `https://stellar.expert/explorer/${net}/asset/${code}-${env.STELLAR_ISSUER_PUBLIC}`;
}
