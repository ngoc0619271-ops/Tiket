#!/usr/bin/env bash
#
# Deploy TiketTicketing to Stellar Testnet (or Mainnet) with the Stellar CLI.
#
# Prereqs:
#   - Rust 1.89.0 + wasm32-unknown-unknown target
#   - Stellar CLI (v27+)
#   - A funded identity named by $IDENTITY
#
# Usage:
#   IDENTITY=tiket-deployer ./scripts/deploy.sh
#   NETWORK=mainnet IDENTITY=prod TOKEN=<XLM_SAC> ./scripts/deploy.sh
set -euo pipefail

NETWORK="${NETWORK:-testnet}"
IDENTITY="${IDENTITY:-tiket-deployer}"
# Native XLM SAC (testnet) by default.
TOKEN="${TOKEN:-CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC}"
WASM="target/wasm32-unknown-unknown/release/tiket_ticketing.optimized.wasm"

cd "$(dirname "$0")/.."

ADMIN_ADDR="$(stellar keys address "$IDENTITY")"
echo "▶ Network: $NETWORK   Admin: $ADMIN_ADDR"

echo "▶ Building + optimizing…"
cargo +1.89.0 build --release --target wasm32-unknown-unknown
stellar contract optimize --wasm target/wasm32-unknown-unknown/release/tiket_ticketing.wasm

echo "▶ Deploying…"
CONTRACT_ID=$(stellar contract deploy --wasm "$WASM" --source "$IDENTITY" --network "$NETWORK")
echo "▶ Contract id: $CONTRACT_ID"

echo "▶ Initializing…"
stellar contract invoke --id "$CONTRACT_ID" --source "$IDENTITY" --network "$NETWORK" \
  -- initialize --admin "$ADMIN_ADDR" --token "$TOKEN"

echo ""
echo "✅ Done. Add to your app env (.env.local / Vercel):"
echo "   SOROBAN_CONTRACT_ID=$CONTRACT_ID"
echo "   SOROBAN_TOKEN_SAC=$TOKEN"
echo "   SOROBAN_RPC_URL=https://soroban-${NETWORK}.stellar.org"
