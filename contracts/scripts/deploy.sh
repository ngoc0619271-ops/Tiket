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
#   ./scripts/deploy.sh                                           # testnet
#   NETWORK=mainnet IDENTITY=prod ./scripts/deploy.sh             # mainnet
#   # XLM SAC resolves automatically (testnet + mainnet), or override with TOKEN=...
#
set -euo pipefail

NETWORK="${NETWORK:-testnet}"
IDENTITY="${IDENTITY:-tiket-deployer}"
WASM="target/wasm32-unknown-unknown/release/tiket_ticketing.optimized.wasm"

cd "$(dirname "$0")/.."

echo "▶ Network: $NETWORK"

# 1. Ensure a funded identity exists (Testnet auto-funds via friendbot).
if ! stellar keys address "$IDENTITY" >/dev/null 2>&1; then
  echo "▶ Creating identity '$IDENTITY'…"
  if [ "$NETWORK" = "testnet" ]; then
    stellar keys generate "$IDENTITY" --network testnet --fund
  else
    stellar keys generate "$IDENTITY"
    echo "  Fund $(stellar keys address "$IDENTITY") on mainnet, then re-run."
    exit 1
  fi
fi
ADMIN_ADDR="$(stellar keys address "$IDENTITY")"
echo "▶ Admin: $ADMIN_ADDR"

# 2. Resolve the native XLM SAC for this network (or honour TOKEN override).
if [ -n "${TOKEN:-}" ]; then
  echo "▶ TOKEN override: $TOKEN"
else
  echo "▶ Resolving native XLM SAC for $NETWORK…"
  TOKEN=$(stellar contract id asset --asset native --network "$NETWORK")
  echo "▶ XLM SAC: $TOKEN"
fi

# 3. Build the optimized Wasm.
echo "▶ Building + optimizing…"
cargo +1.89.0-x86_64-pc-windows-gnu build --release --target wasm32-unknown-unknown
stellar contract optimize --wasm target/wasm32-unknown-unknown/release/tiket_ticketing.wasm

# 4. Deploy → contract id.
echo "▶ Deploying…"
# Use the public RPC for mainnet (or whatever is configured), pass network/passphrase
# explicitly so the script works even when 'network' aliases lack RPC.
RPC_URL="${SOROBAN_RPC_URL:-}"
if [ "$NETWORK" = "public" ]; then
  RPC_URL="${RPC_URL:-https://mainnet.sorobanrpc.com}"
  PASSPHRASE="Public Global Stellar Network ; September 2015"
else
  RPC_URL="${RPC_URL:-https://soroban-testnet.stellar.org}"
  PASSPHRASE="Test SDF Network ; September 2015"
fi

CONTRACT_ID=$(stellar contract deploy \
  --wasm "$WASM" \
  --source "$IDENTITY" \
  --rpc-url "$RPC_URL" \
  --network-passphrase "$PASSPHRASE")
echo "▶ Contract id: $CONTRACT_ID"

# 5. Initialize with admin + settlement token.
echo "▶ Initializing…"
stellar contract invoke \
  --id "$CONTRACT_ID" \
  --source "$IDENTITY" \
  --rpc-url "$RPC_URL" \
  --network-passphrase "$PASSPHRASE" \
  -- initialize --admin "$ADMIN_ADDR" --token "$TOKEN"

echo ""
echo "✅ Done. Add to your app env (.env.local / Vercel):"
echo "   SOROBAN_CONTRACT_ID=$CONTRACT_ID"
echo "   SOROBAN_TOKEN_SAC=$TOKEN"
echo "   SOROBAN_RPC_URL=$RPC_URL"
echo "   STELLAR_NETWORK=$NETWORK"
echo "   NEXT_PUBLIC_STELLAR_NETWORK=$NETWORK"
echo "   STELLAR_HORIZON_URL=https://horizon$( [ "$NETWORK" = "public" ] && echo '' || echo -testnet ).stellar.org"