# Tiket Ticketing — Deployment Record

## Testnet (live)

- **Contract ID:** `CAG6O27M45PQEXW7MSAVR5VLTCGUWF2JDXSNLNKMGASM2VJZ7XXDCYL4`
- **Wasm hash:** `7603595e9c3541f66d7ef65f5ed51a895162433241eab8303a646ce7c55a8044`
- **Admin / deployer:** `GBL5RJKF4QNJ4ZPLJZ7PS7K5A4J44VEZJRV2CRTFFDRVSY2N76AIIE47`
- **Settlement token (native XLM SAC):** `CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC`
- **Network passphrase:** `Test SDF Network ; September 2015`
- **Soroban RPC:** `https://soroban-testnet.stellar.org`
- **Deploy date:** 2026-06-27

### On-chain proof transactions
- Deploy: `87d1c27049f9f624b15530834519e9d4b1086696132bbbe94c3fe219e7c12254`
- Initialize: `c99085f95344327f33b08198506c41fccd20f7a8f1dd4a1246fd07337f06a256`
- Smoke create_event: `54a8a9498a864f2d31c8f7853acfe5a484b2761d0c102c3b44f2b71c4e34cb65`
- Smoke buy: `c2e878cb4f7257fcc29a63f0714950e9663bc80421e5e40b4b7792e6701028bd`
- Smoke check_in: `8e2809857020b1e0590f5fd4bad9288d30c9e9939a4d27b846f6d016c23b3698`

Explorer: https://stellar.expert/explorer/testnet/contract/CAG6O27M45PQEXW7MSAVR5VLTCGUWF2JDXSNLNKMGASM2VJZ7XXDCYL4

## Build / deploy commands

```bash
cd contracts
cargo +1.89.0 test                       # 15 passing
cargo +1.89.0 build --release --target wasm32-unknown-unknown
stellar contract optimize --wasm target/wasm32-unknown-unknown/release/tiket_ticketing.wasm
stellar contract deploy --wasm <optimized.wasm> --source tiket-deployer --network testnet
stellar contract invoke --id <CID> --source tiket-deployer --network testnet -- \
  initialize --admin <ADMIN> --token CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC
```

## Entrypoints

| Fn | Auth | Effect |
|---|---|---|
| `initialize(admin, token)` | once | set admin + settlement token |
| `create_event(organizer, price, capacity, start_time) -> u64` | organizer | record event, return id |
| `buy(event_id, buyer) -> u64` | buyer | escrow price into contract, record ticket, return id |
| `check_in(ticket_id)` | organizer | settle escrow to organizer, mark Used |
| `refund(ticket_id) -> i128` | owner | return escrow to buyer before start, mark Refunded |
| `cancel_event(event_id)` | organizer | stop further sales |
| `get_event / get_ticket / total_events / total_tickets / get_admin / get_token` | read | views |

## Mainnet
Not deployed. Switch: rebuild, `stellar contract deploy ... --network mainnet`,
re-`initialize` with the mainnet XLM SAC, set `SOROBAN_CONTRACT_ID` + `STELLAR_NETWORK=public`.
