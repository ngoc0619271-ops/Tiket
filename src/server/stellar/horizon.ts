/**
 * Classic Horizon flows.
 *
 * The CORE ticketing flow (buy / check-in / refund) runs through the Soroban
 * contract in `./soroban`. These helpers cover the RETAINED secondary features:
 *  - the one-tap USDC trustline opt-in (`buildEnableUsdcXdr`),
 *  - the clawback-enabled per-event token utilities (issue / clawback),
 *  - and a generic wallet-signed-XDR submitter.
 */
import { BASE_FEE, Keypair, Operation, TransactionBuilder } from '@stellar/stellar-sdk';
import { env } from '@/server/config/env';
import { AppError } from '@/server/lib/http';
import { horizon, NETWORK_PASSPHRASE, ticketAsset, usdcAsset } from './config';

function issuerKeypair(): Keypair {
  if (!env.STELLAR_ISSUER_SECRET) {
    throw new AppError('INTERNAL', 'Issuer signing key is not configured', 500);
  }
  return Keypair.fromSecret(env.STELLAR_ISSUER_SECRET);
}

async function loadAccount(publicKey: string) {
  try {
    return await horizon.loadAccount(publicKey);
  } catch (err) {
    const status = (err as { response?: { status?: number } })?.response?.status;
    if (status === 404) {
      throw new AppError(
        'INVALID_INPUT',
        'Wallet account not found on the network. Fund it with testnet XLM first.',
        400,
      );
    }
    throw err;
  }
}

function mapTxError(err: unknown): never {
  const codes = (err as { response?: { data?: { extras?: { result_codes?: unknown } } } })?.response
    ?.data?.extras?.result_codes;
  if (codes) {
    const flat = JSON.stringify(codes);
    if (flat.includes('op_no_trust')) {
      throw new AppError(
        'CONFLICT',
        'Missing trustline for the selected asset (op_no_trust).',
        409,
      );
    }
    if (flat.includes('op_underfunded') || flat.includes('tx_insufficient_balance')) {
      throw new AppError('CONFLICT', 'Insufficient balance to complete this transaction.', 409);
    }
    throw new AppError('CONFLICT', `Transaction failed on-chain: ${flat}`, 409);
  }
  throw err;
}

/** Submit a wallet-signed classic XDR and return the confirmed hash. */
export async function submitSignedXdr(signedXdr: string): Promise<string> {
  let tx: ReturnType<typeof TransactionBuilder.fromXDR>;
  try {
    tx = TransactionBuilder.fromXDR(signedXdr, NETWORK_PASSPHRASE);
  } catch {
    throw new AppError('INVALID_INPUT', 'Malformed signed transaction.', 400);
  }
  try {
    const res = await horizon.submitTransaction(tx);
    return res.hash;
  } catch (err) {
    return mapTxError(err);
  }
}

/** Build a wallet-signed changeTrust to USDC (one-tap "Enable USDC" helper). */
export async function buildEnableUsdcXdr(account: string): Promise<string> {
  const acct = await loadAccount(account);
  return new TransactionBuilder(acct, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(Operation.changeTrust({ asset: usdcAsset(), limit: '1000000' }))
    .setTimeout(180)
    .build()
    .toXDR();
}

/** Retained secondary: issuer mints exactly 1 clawback-enabled token to a holder. */
export async function issueTicketToken(params: {
  holder: string;
  assetCode: string;
}): Promise<string> {
  const issuer = issuerKeypair();
  const account = await loadAccount(issuer.publicKey());
  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(
      Operation.payment({
        destination: params.holder,
        asset: ticketAsset(params.assetCode),
        amount: '1',
      }),
    )
    .setTimeout(120)
    .build();
  tx.sign(issuer);
  try {
    const res = await horizon.submitTransaction(tx);
    return res.hash;
  } catch (err) {
    return mapTxError(err);
  }
}

/** Retained secondary: issuer claws back the 1 token from a holder. */
export async function clawbackTicketToken(params: {
  holder: string;
  assetCode: string;
}): Promise<string> {
  const issuer = issuerKeypair();
  const account = await loadAccount(issuer.publicKey());
  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(
      Operation.clawback({
        asset: ticketAsset(params.assetCode),
        from: params.holder,
        amount: '1',
      }),
    )
    .setTimeout(120)
    .build();
  tx.sign(issuer);
  try {
    const res = await horizon.submitTransaction(tx);
    return res.hash;
  } catch (err) {
    return mapTxError(err);
  }
}
