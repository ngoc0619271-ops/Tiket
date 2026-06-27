# Tiket — spec sheet

On-chain event ticketing on Stellar. The ticket price is escrowed inside a Soroban contract on `buy`, settles to the organizer on `check_in`, and is reclaimable by the buyer via `refund` until the event starts. The contract is custodian and rulebook; no intermediary holds the money.

| | |
|---|---|
| **Product** | Tiket — escrow ticketing + on-chain settlement/refund |
| **Live** | https://tiket-mu.vercel.app (Vercel production) |
| **Network** | Stellar **testnet** only (`Test SDF Network ; September 2015`) |
| **Contract** | `CAG6O27M45PQEXW7MSAVR5VLTCGUWF2JDXSNLNKMGASM2VJZ7XXDCYL4` ([stellar.expert](https://stellar.expert/explorer/testnet/contract/CAG6O27M45PQEXW7MSAVR5VLTCGUWF2JDXSNLNKMGASM2VJZ7XXDCYL4)) |
| **Settlement** | native XLM via SAC (USDC opt-in trustline helper) |
| **Stack** | Next.js 16 / React 19 / TS · Soroban (`soroban-sdk` 22, Rust) · Drizzle + Postgres · Freighter |
| **Auth** | SEP-10-style challenge → Freighter sign → session cookie |

```
01-landing → 02-connect-popup → 03-approve → 04-create-event
           → 05-buy → 06-success → 07-stats → 08-mobile
```

<p align="center">
<img src="../screen-shot/01-landing.jpg" alt="Landing" width="780" />
</p>
<p align="center">
<img src="../screen-shot/04-create-event.jpg" alt="Create event (organizer signs create_event)" width="390" />
<img src="../screen-shot/05-buy.jpg" alt="Buy a pass (price escrows into the contract)" width="390" />
</p>
<p align="center">
<img src="../screen-shot/06-success.jpg" alt="On-chain success with explorer link" width="390" />
<img src="../screen-shot/07-stats.jpg" alt="Live usage stats" width="390" />
</p>
<p align="center">
<img src="../screen-shot/02-connect-popup.jpg" alt="Freighter connect" width="260" />
<img src="../screen-shot/03-approve.jpg" alt="Freighter sign" width="260" />
<img src="../screen-shot/08-mobile.jpg" alt="Mobile" width="240" />
</p>

---

## Features

| Feature | Where it lives | Notes |
|---|---|---|
| Escrowed purchase | contract `buy` + `/api/purchase/*` | price → contract custody, ticket marked `Valid` |
| Settle-on-attendance | contract `check_in` + `/api/checkin/*` | escrow → organizer, ticket → `Used` |
| Pre-event refund | contract `refund` + `/api/refund/*` | escrow → buyer before `start_time`, ticket → `Refunded` |
| Cancel sales | contract `cancel_event` | organizer stops further sales; issued tickets still refundable |
| Wallet auth | `/api/auth/*` | challenge XDR, Freighter sign, server-verified session |
| XLM default settlement | `SOROBAN_TOKEN_SAC` | native XLM SAC, no trustline required |
| USDC opt-in | `/api/usdc/*` | one-tap `changeTrust` builder for the USDC trustline |
| Live usage stats | `/stats` + `/api/stats` | real DB-backed counts; demo wallets excluded via `DEMO_PUBLIC_KEYS` |
| Explorer receipts | every on-chain submit | response carries `stellar.expert` tx links |
| Double-spend guard | contract state machine | a ticket is checked-in or refunded at most once |

Every core write is a **build XDR → Freighter sign → submit** round-trip through Soroban RPC; on-chain routes run `maxDuration=60`.

---

## Contract entrypoints

Rust, `soroban-sdk` 22, 15 passing unit tests. Source: [`contracts/tiket-ticketing/src/lib.rs`](contracts/tiket-ticketing/src/lib.rs). Deploy record: [`contracts/DEPLOYMENT.md`](contracts/DEPLOYMENT.md).

| Fn | Args | Auth | Returns | Effect |
|---|---|---|---|---|
| `initialize` | `admin: Address, token: Address` | once | `()` | set admin + settlement token, zero counters |
| `create_event` | `organizer: Address, price: i128, capacity: u32, start_time: u64` | organizer | `u64` | record event, return `event_id` |
| `buy` | `event_id: u64, buyer: Address` | buyer | `u64` | SAC `transfer(buyer→contract)` escrow, record `Valid` ticket, return `ticket_id` |
| `check_in` | `ticket_id: u64` | organizer | `()` | `transfer(contract→organizer)`, mark `Used` |
| `refund` | `ticket_id: u64` | ticket owner | `i128` | before `start_time`: `transfer(contract→owner)`, mark `Refunded`, return amount |
| `cancel_event` | `event_id: u64` | organizer | `()` | mark event `Cancelled` |
| `get_event` | `event_id: u64` | — | `Event` | view |
| `get_ticket` | `ticket_id: u64` | — | `Ticket` | view |
| `total_events` | — | — | `u64` | view |
| `total_tickets` | — | — | `u64` | view |
| `get_admin` | — | — | `Address` | view |
| `get_token` | — | — | `Address` | view |

Auth is enforced with `require_auth`; the source-account signature on the submitted tx covers both the contract call and its inner SAC transfer. Free events (`price == 0`) skip the token transfer. Instance + entry storage TTLs are bumped on every write so pending escrow never expires.

### On-chain deploy facts

| | |
|---|---|
| Wasm hash | `7603595e9c3541f66d7ef65f5ed51a895162433241eab8303a646ce7c55a8044` |
| Admin / deployer | `GBL5RJKF4QNJ4ZPLJZ7PS7K5A4J44VEZJRV2CRTFFDRVSY2N76AIIE47` |
| Settlement token (XLM SAC) | `CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC` |
| Soroban RPC | `https://soroban-testnet.stellar.org` |
| Deploy tx | `87d1c27049f9f624b15530834519e9d4b1086696132bbbe94c3fe219e7c12254` |
| Init tx | `c99085f95344327f33b08198506c41fccd20f7a8f1dd4a1246fd07337f06a256` |

---

## Pages

| Path | Purpose |
|---|---|
| `/` | landing — escrow model |
| `/events` | browse events, buy a pass (connect on demand) |
| `/tickets` | buyer's passes + refund |
| `/dashboard` | organizer console |
| `/dashboard/events/new` | create event (signs `create_event`) |
| `/dashboard/events/[id]` | attendee list + check-in |
| `/stats` | live usage counts |

## API

| Method | Path | Purpose |
|---|---|---|
| POST | `/api/auth/challenge` | issue challenge XDR for a public key |
| POST | `/api/auth/verify` | verify signed challenge, set session cookie |
| POST | `/api/auth/logout` | clear session |
| GET | `/api/auth/me` | current session public key |
| GET | `/api/events` | list events (optional `?organizer=`) |
| POST | `/api/events` | persist event from signed `create_event` |
| POST | `/api/events/build` | build `create_event` invoke XDR |
| GET | `/api/events/[id]` | event detail |
| POST | `/api/purchase/build` | build `buy` invoke XDR |
| POST | `/api/purchase/submit` | submit signed `buy`, persist ticket |
| POST | `/api/checkin/build` | build `check_in` invoke XDR |
| POST | `/api/checkin/submit` | submit signed `check_in` |
| POST | `/api/refund/build` | build `refund` invoke XDR |
| POST | `/api/refund/submit` | submit signed `refund` |
| POST | `/api/usdc/build` | build USDC `changeTrust` XDR |
| POST | `/api/usdc/submit` | submit signed USDC trustline tx |
| GET | `/api/tickets` | tickets by `?eventId=` or `?buyer=` |
| GET | `/api/tickets/[id]` | ticket detail |
| GET | `/api/stats` | platform usage stats |
| GET | `/api/health` | liveness probe |

All responses use the `{ ok, data }` / `{ ok, error }` envelope.

---

## Assets

| Asset | Identifier | Role |
|---|---|---|
| XLM (native) | SAC `CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC` | default settlement token; no trustline |
| USDC (testnet) | issuer `GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5` | opt-in trustline via `/api/usdc/*` |

---

## Environment

| Var | Required | Default / note |
|---|---|---|
| `DRIZZLE_DATABASE_URL` | yes | Postgres connection string |
| `SESSION_SECRET` | yes | min 32 chars |
| `NEXT_PUBLIC_APP_NAME` | no | `Tiket` |
| `NEXT_PUBLIC_APP_URL` | no | `http://localhost:3001` |
| `NEXT_PUBLIC_STELLAR_NETWORK` | no | `testnet` (or `public`) |
| `STELLAR_NETWORK` | no | `testnet` |
| `STELLAR_HORIZON_URL` | no | `https://horizon-testnet.stellar.org` |
| `STELLAR_NETWORK_PASSPHRASE` | no | `Test SDF Network ; September 2015` |
| `SOROBAN_RPC_URL` | no | `https://soroban-testnet.stellar.org` |
| `SOROBAN_CONTRACT_ID` | no | defaults to the deployed testnet id |
| `NEXT_PUBLIC_SOROBAN_CONTRACT_ID` | no | same id, client-side |
| `SOROBAN_TOKEN_SAC` | no | XLM SAC settlement token |
| `STELLAR_ISSUER_PUBLIC` | no | platform issuer public key |
| `STELLAR_ISSUER_SECRET` | no | issuer secret (optional) |
| `SESSION_COOKIE_NAME` | no | `tiket_session` |
| `SESSION_TTL_SECONDS` | no | `604800` |
| `NONCE_TTL_SECONDS` | no | `300` |
| `USDC_ASSET_CODE` | no | `USDC` |
| `USDC_ASSET_ISSUER_TESTNET` | no | testnet USDC issuer |
| `USDC_ASSET_ISSUER_PUBLIC` | no | mainnet USDC issuer (selected when `STELLAR_NETWORK=public`) |
| `DEMO_PUBLIC_KEYS` | no | comma-separated keys excluded from `/stats` |

`.env.local` is required (no `.env.example` is shipped — create it with at least `DRIZZLE_DATABASE_URL` and `SESSION_SECRET`).

---

## Commands

| Command | Does |
|---|---|
| `pnpm install` | install deps (pnpm only) |
| `pnpm dev` | dev server on `:3001` |
| `pnpm build` | production build |
| `pnpm start` | serve production build |
| `pnpm lint` | Biome check |
| `pnpm test` | Vitest unit suite |
| `pnpm test:coverage` | unit coverage |
| `pnpm test:e2e` | Playwright e2e (drives the live deploy) |
| `pnpm db:push` | apply Drizzle schema |
| `pnpm db:studio` | Drizzle Studio |

### Local quick start

```bash
pnpm install
# create .env.local with DRIZZLE_DATABASE_URL and SESSION_SECRET (>=32 chars)
pnpm db:push
pnpm dev        # http://localhost:3001
```

### Build + deploy the contract

```bash
cd contracts
cargo +1.89.0 test                                                   # 15 passing
cargo +1.89.0 build --release --target wasm32-unknown-unknown
stellar contract optimize --wasm target/wasm32-unknown-unknown/release/tiket_ticketing.wasm
stellar contract deploy --wasm <optimized.wasm> --source tiket-deployer --network testnet
stellar contract invoke --id <CID> --source tiket-deployer --network testnet -- \
  initialize --admin <ADMIN> --token CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC
```

### e2e against the live deploy

```bash
PLAYWRIGHT_BASE_URL=https://tiket-mu.vercel.app pnpm test:e2e
```

The e2e drives the deployed app through the `@stellar/freighter-api` v6 postMessage bridge, signing with a testnet key in Node.

---

## Mainnet readiness

The app is fully network-driven (`STELLAR_NETWORK` / `NEXT_PUBLIC_STELLAR_NETWORK`), so a flip to `public` swaps Horizon, RPC, passphrase, and the USDC issuer automatically. The contract is **testnet only** — going to mainnet means redeploy + re-`initialize` against the mainnet XLM SAC, then point `SOROBAN_CONTRACT_ID` at the new id. Switch steps are recorded in [`contracts/DEPLOYMENT.md`](contracts/DEPLOYMENT.md). **Not deployed to mainnet.**

<sub>Built for the Stellar APAC hackathon · testnet only · money held by the contract, never a middleman.</sub>
</content>
