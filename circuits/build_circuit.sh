#!/bin/bash
# Build Circom circuit and generate proving/verifying keys

set -e

echo "🔧 Building vote commitment ZK circuit..."

cd circuits

# Compile circuit
circom vote_commitment.circom --r1cs --wasm --sym --c

echo "✅ Circuit compiled"

# Generate trusted setup (Powers of Tau ceremony)
echo "📦 Generating Powers of Tau..."
snarkjs powersoftau new bn128 14 pot14_0000.ptau -v
snarkjs powersoftau contribute pot14_0000.ptau pot14_0001.ptau --name="First contribution" -v -e="random entropy"
snarkjs powersoftau prepare phase2 pot14_0001.ptau pot14_final.ptau -v

echo "✅ Powers of Tau ceremony complete"

# Generate proving and verifying keys
echo "🔑 Generating circuit-specific keys..."
snarkjs groth16 setup vote_commitment.r1cs pot14_final.ptau vote_commitment_0000.zkey
snarkjs zkey contribute vote_commitment_0000.zkey vote_commitment_0001.zkey --name="Second contribution" -v -e="more random entropy"
snarkjs zkey export verificationkey vote_commitment_0001.zkey verification_key.json

echo "✅ Keys generated"

# Export verifying key to Solana format
echo "📤 Exporting verifying key for on-chain use..."
snarkjs zkey export solidityverifier vote_commitment_0001.zkey ../solana_verifier.sol

# Generate Rust verifying key
echo "🦀 Converting to Rust format..."
node ../scripts/export_vk_rust.js verification_key.json > ../solsafe-program/programs/solsafe-program/src/zk_proofs/vk_embedded.rs

echo "🎉 Circuit build complete!"
echo ""
echo "Files generated:"
echo "  - vote_commitment.r1cs (constraint system)"
echo "  - vote_commitment_js/ (WASM prover)"
echo "  - vote_commitment_0001.zkey (proving key)"
echo "  - verification_key.json (verifying key)"
echo ""
echo "Next steps:"
echo "  1. Test proof generation: npm run test:zkproof"
echo "  2. Deploy verifying key on-chain"
echo "  3. Update frontend with proof generation"
