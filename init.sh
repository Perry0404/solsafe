#!/bin/bash
# Initialize SolSafe program on devnet via Anchor

cd solsafe-program

# Set environment
export ANCHOR_PROVIDER_URL="https://api.devnet.solana.com"
export ANCHOR_WALLET="~/.config/solana/id.json"

# Initialize the program
anchor run initialize 2>&1 | head -50
