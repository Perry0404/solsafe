#!/bin/bash

# SolSafe Deployment Script
# This script deploys the SolSafe program to devnet or mainnet

set -e

# Check if network is provided
if [ -z "$1" ]; then
  echo "Usage: ./deploy.sh [devnet|mainnet]"
  exit 1
fi

NETWORK=$1

# Validate network
if [ "$NETWORK" != "devnet" ] && [ "$NETWORK" != "mainnet" ]; then
  echo "Error: Network must be 'devnet' or 'mainnet'"
  exit 1
fi

echo "🚀 Deploying SolSafe to $NETWORK..."

# Set Solana config to the specified network
if [ "$NETWORK" = "devnet" ]; then
  solana config set --url https://api.devnet.solana.com
else
  solana config set --url https://api.mainnet-beta.solana.com
fi

# Check wallet balance
BALANCE=$(solana balance | awk '{print $1}')
echo "📊 Wallet balance: $BALANCE SOL"

if (( $(echo "$BALANCE < 1" | bc -l) )); then
  echo "⚠️  Warning: Low balance. You may need at least 1 SOL for deployment."
  if [ "$NETWORK" = "devnet" ]; then
    echo "💡 Request airdrop: solana airdrop 2"
  fi
  read -p "Continue anyway? (y/n) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
  fi
fi

# Build the program
echo "🔨 Building program..."
anchor build

# Deploy the program
echo "🚀 Deploying program..."
anchor deploy --provider.cluster $NETWORK

# Get the program ID
PROGRAM_ID=$(solana address -k target/deploy/solsafe_program-keypair.json)
echo "✅ Program deployed!"
echo "📝 Program ID: $PROGRAM_ID"

# Update Anchor.toml with the new program ID
echo "📝 Updating Anchor.toml..."
if [ "$NETWORK" = "devnet" ]; then
  sed -i "s/solsafe_program = \".*\"/solsafe_program = \"$PROGRAM_ID\"/" ../Anchor.toml
else
  # For mainnet, add a new section if it doesn't exist
  if ! grep -q "\[programs.mainnet\]" ../Anchor.toml; then
    echo "" >> ../Anchor.toml
    echo "[programs.mainnet]" >> ../Anchor.toml
  fi
  sed -i "/\[programs.mainnet\]/a solsafe_program = \"$PROGRAM_ID\"" ../Anchor.toml
fi

# Update lib.rs with the new program ID
echo "📝 Updating lib.rs..."
sed -i "s/declare_id!(\".*\")/declare_id!(\"$PROGRAM_ID\")/" programs/solsafe-program/src/lib.rs

echo ""
echo "✨ Deployment complete!"
echo ""
echo "Next steps:"
echo "1. Update the PROGRAM_ID environment variable in your backend"
echo "2. Initialize the program: anchor run initialize"
echo "3. Update validators: node backend/server.ts"
echo ""
echo "Configuration updated in:"
echo "  - Anchor.toml"
echo "  - programs/solsafe-program/src/lib.rs"
