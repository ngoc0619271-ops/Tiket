/**
 * On-chain ticketing contract client (Soroban).
 *
 * The CORE flow runs here:
 *   - `create_event` (organizer-signed)  → returns on-chain event id
 *   - `buy`          (buyer-signed)       → escrows the price, returns ticket id
 *   - `check_in`     (organizer-signed)   → settles escrow to organizer, marks Used
 *   - `refund`       (owner-signed)       → returns escrow before start, marks Refunded
 *
 * Each write is a two-step flow: the server builds + simulates ("prepares") the
 * invoke XDR, Freighter signs it (source-account auth covers `require_auth`),
 * and the server submits it through Soroban RPC and polls to confirmation,
 * retrying transient `TRY_AGAIN_LATER` / network drops.
 */
import {
  Account,
  Address,
  BASE_FEE,
  Contract,
  nativeToScVal,
  rpc,
  scValToNative,
  TransactionBuilder,
  type xdr,
} from '@stellar/stellar-sdk';
import { AppError } from '@/server/lib/http';
import { CONTRACT_ID, NETWORK_PASSPHRASE, SOROBAN_RPC_URL } from './config';

// A valid public key used only as the source for read-only simulations. It does
// not sign anything and need not be funded — simulation ignores its sequence.
const READ_SOURCE = 'GBL5RJKF4QNJ4ZPLJZ7PS7K5A4J44VEZJRV2CRTFFDRVSY2N76AIIE47';

const server = new rpc.Server(SOROBAN_RPC_URL, {
  allowHttp: SOROBAN_RPC_URL.startsWith('http://'),
});

const contract = new Contract(CONTRACT_ID);

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const u64 = (v: bigint | number) =>
  nativeToScVal(typeof v === 'bigint' ? v : BigInt(v), { type: 'u64' });
const i128 = (v: bigint) => nativeToScVal(v, { type: 'i128' });
const u32 = (v: number) => nativeToScVal(v, { type: 'u32' });
const addr = (pk: string) => new Address(pk).toScVal();

/** Build + simulate ("prepare") an invoke whose source is the signer. */
async function buildInvoke(source: string, method: string, ...args: xdr.ScVal[]): Promise<string> {
  let account: Account;
  try {
    account = await server.getAccount(source);
  } catch {
    throw new AppError(
      'INVALID_INPUT',
      'Wallet account not found on-chain. Fund it with XLM first.',
      400,
    );
  }
  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(contract.call(method, ...args))
    .setTimeout(600)
    .build();

  try {
    const prepared = await server.prepareTransaction(tx);
    return prepared.toXDR();
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (/insufficient|underfunded|balance/i.test(msg)) {
      throw new AppError('CONFLICT', 'Insufficient XLM balance for this action.', 409);
    }
    throw new AppError('CONFLICT', `Could not prepare on-chain ${method}: ${msg}`, 409);
  }
}

export function buildCreateEventXdr(p: {
  organizer: string;
  priceStroops: bigint;
  capacity: number;
  startTime: number;
}): Promise<string> {
  return buildInvoke(
    p.organizer,
    'create_event',
    addr(p.organizer),
    i128(p.priceStroops),
    u32(p.capacity),
    u64(p.startTime),
  );
}

export function buildBuyXdr(p: { buyer: string; eventId: bigint }): Promise<string> {
  return buildInvoke(p.buyer, 'buy', u64(p.eventId), addr(p.buyer));
}

export function buildCheckinXdr(p: { organizer: string; ticketId: bigint }): Promise<string> {
  return buildInvoke(p.organizer, 'check_in', u64(p.ticketId));
}

export function buildRefundXdr(p: { owner: string; ticketId: bigint }): Promise<string> {
  return buildInvoke(p.owner, 'refund', u64(p.ticketId));
}

export type SubmitResult = { hash: string; returnValue: unknown };

/**
 * Submit a Freighter-signed invoke XDR and poll Soroban RPC to confirmation.
 * Retries transient `TRY_AGAIN_LATER` / network drops; surfaces a clean error
 * on a failed transaction.
 */
export async function submitAndPoll(signedXdr: string): Promise<SubmitResult> {
  let tx: ReturnType<typeof TransactionBuilder.fromXDR>;
  try {
    tx = TransactionBuilder.fromXDR(signedXdr, NETWORK_PASSPHRASE);
  } catch {
    throw new AppError('INVALID_INPUT', 'Malformed signed transaction.', 400);
  }

  // Send with retry on TRY_AGAIN_LATER / transient RPC errors.
  let hash = '';
  for (let attempt = 0; attempt < 6; attempt++) {
    try {
      const sent = await server.sendTransaction(tx);
      if (sent.status === 'ERROR') {
        const detail = JSON.stringify(sent.errorResult?.result?.() ?? sent.errorResult ?? '');
        if (/txBadSeq/i.test(detail)) {
          throw new AppError('CONFLICT', 'Wallet sequence changed — please retry the action.', 409);
        }
        throw new AppError('CONFLICT', `Transaction rejected by the network: ${detail}`, 409);
      }
      if (sent.status === 'TRY_AGAIN_LATER') {
        await sleep(2000);
        continue;
      }
      hash = sent.hash; // PENDING or DUPLICATE
      break;
    } catch (err) {
      if (err instanceof AppError) throw err;
      if (attempt === 5) {
        throw new AppError('CONFLICT', 'Could not reach Soroban RPC to submit. Try again.', 409);
      }
      await sleep(1500);
    }
  }
  if (!hash) throw new AppError('CONFLICT', 'Network was busy (try again later).', 409);

  // Poll for confirmation (up to ~55s, inside the route's maxDuration=60).
  const deadline = Date.now() + 55_000;
  let got = await server.getTransaction(hash);
  while (got.status === 'NOT_FOUND' && Date.now() < deadline) {
    await sleep(1500);
    got = await server.getTransaction(hash);
  }

  if (got.status === 'SUCCESS') {
    let returnValue: unknown = null;
    try {
      if (got.returnValue) returnValue = scValToNative(got.returnValue);
    } catch {
      returnValue = null;
    }
    return { hash, returnValue };
  }
  if (got.status === 'NOT_FOUND') {
    throw new AppError('CONFLICT', 'Transaction not confirmed in time. Check the explorer.', 409);
  }
  throw new AppError('CONFLICT', 'On-chain transaction failed.', 409);
}

/** Coerce a contract u64 return (bigint) to a decimal string id. */
export function idToString(v: unknown): string {
  if (typeof v === 'bigint') return v.toString();
  if (typeof v === 'number') return String(v);
  return String(v ?? '');
}

// --- Reads (simulation only, no signature) ---------------------------------

async function simulateRead(method: string, ...args: xdr.ScVal[]): Promise<unknown> {
  const account = new Account(READ_SOURCE, '0');
  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(contract.call(method, ...args))
    .setTimeout(60)
    .build();
  const sim = await server.simulateTransaction(tx);
  if (rpc.Api.isSimulationError(sim)) {
    throw new AppError('NOT_FOUND', `On-chain read failed: ${sim.error}`, 404);
  }
  const retval = sim.result?.retval;
  return retval ? scValToNative(retval) : null;
}

export type OnchainTicket = {
  event_id: bigint;
  owner: string;
  price_paid: bigint;
  status: number; // 0 Valid | 1 Used | 2 Refunded
};

export async function readTicket(ticketId: bigint): Promise<OnchainTicket> {
  return (await simulateRead('get_ticket', u64(ticketId))) as OnchainTicket;
}

export async function readEvent(eventId: bigint): Promise<unknown> {
  return simulateRead('get_event', u64(eventId));
}

export async function readTotals(): Promise<{ events: string; tickets: string }> {
  const [events, tickets] = await Promise.all([
    simulateRead('total_events'),
    simulateRead('total_tickets'),
  ]);
  return { events: idToString(events), tickets: idToString(tickets) };
}
