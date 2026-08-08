import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),

  NEXT_PUBLIC_APP_NAME: z.string().default('Tiket'),
  NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3001'),
  NEXT_PUBLIC_STELLAR_NETWORK: z.enum(['testnet', 'public']).default('testnet'),

  DRIZZLE_DATABASE_URL: z.string().url(),

  STELLAR_NETWORK: z.enum(['testnet', 'public', 'futurenet']).default('testnet'),
  STELLAR_HORIZON_URL: z.string().url().default('https://horizon-testnet.stellar.org'),
  STELLAR_NETWORK_PASSPHRASE: z.string().default('Test SDF Network ; September 2015'),

  // Soroban: the on-chain ticketing contract (escrow buy + organizer check-in + refund).
  SOROBAN_RPC_URL: z.string().url().default('https://soroban-testnet.stellar.org'),
  SOROBAN_CONTRACT_ID: z
    .string()
    .default('CAG6O27M45PQEXW7MSAVR5VLTCGUWF2JDXSNLNKMGASM2VJZ7XXDCYL4'),
  // Native XLM Stellar Asset Contract — settlement token, no trustline needed.
  // MUST be set per-network. The default below is the testnet XLM SAC — overwrite
  // on mainnet with `stellar contract id asset --asset native --network public`.
  SOROBAN_TOKEN_SAC: z.string().default('CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC'),
  NEXT_PUBLIC_SOROBAN_CONTRACT_ID: z
    .string()
    .default('CAG6O27M45PQEXW7MSAVR5VLTCGUWF2JDXSNLNKMGASM2VJZ7XXDCYL4'),

  // Platform issuer: signs ticket-token issuance + clawback (clawback flags pre-set on-chain).
  STELLAR_ISSUER_PUBLIC: z
    .string()
    .default('GACFRKHQJTHV4UWIFGEEHABNYVWYWGEUSIG4LQYIQN2HQDUD2DRFAKLA'),
  STELLAR_ISSUER_SECRET: z.string().min(56).optional(),

  SESSION_SECRET: z.string().min(32, 'SESSION_SECRET must be at least 32 chars'),
  SESSION_COOKIE_NAME: z.string().default('tiket_session'),
  SESSION_TTL_SECONDS: z.coerce.number().int().positive().default(604800),
  NONCE_TTL_SECONDS: z.coerce.number().int().positive().default(300),

  USDC_ASSET_CODE: z.string().default('USDC'),
  USDC_ASSET_ISSUER_TESTNET: z
    .string()
    .default('GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5'),
  USDC_ASSET_ISSUER_PUBLIC: z
    .string()
    .default('GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN'),

  // Comma-separated public keys excluded from stats (e.g. internal/demo wallets).
  DEMO_PUBLIC_KEYS: z.string().default(''),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables:', parsed.error.flatten().fieldErrors);
  throw new Error('Invalid environment variables');
}

export const USDC_ASSET_ISSUER_VALUE: string = (() => {
  if (parsed.data.STELLAR_NETWORK === 'public') return parsed.data.USDC_ASSET_ISSUER_PUBLIC;
  return parsed.data.USDC_ASSET_ISSUER_TESTNET;
})();

export const DEMO_KEYS: string[] = parsed.data.DEMO_PUBLIC_KEYS.split(',')
  .map((s) => s.trim())
  .filter(Boolean);

export const env = parsed.data;
export type Env = typeof env;
