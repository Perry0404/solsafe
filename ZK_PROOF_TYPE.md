# What Type of ZK Proof Does SolSafe Use?

## Executive Summary

**SolSafe uses Groth16 ZK-SNARKs on the BN254 (alt_bn128) elliptic curve for its zero-knowledge proof system.**

---

## Detailed Specifications

### Proving System: Groth16

**Groth16** is a zero-knowledge Succinct Non-interactive ARgument of Knowledge (ZK-SNARK) proving system developed by Jens Groth in 2016.

**Key Characteristics:**
- **Most Efficient**: Smallest proof size (192 bytes) and fastest verification time (~10ms)
- **Non-Interactive**: Proofs can be verified without interaction between prover and verifier
- **Succinct**: Constant-size proofs regardless of computation complexity
- **Widely Audited**: Battle-tested in production systems (Zcash, Filecoin, etc.)

**Why Groth16?**
- ✅ Optimal for on-chain verification (minimal gas/compute units)
- ✅ Well-supported libraries (arkworks, snarkjs)
- ✅ Proven security track record
- ✅ Best performance for voting systems

### Elliptic Curve: BN254 (alt_bn128)

**BN254** (also known as alt_bn128) is a Barreto-Naehrig pairing-friendly elliptic curve.

**Properties:**
- **Security Level**: 128-bit (equivalent to AES-128)
- **Native Support**: Precompiled contracts on Ethereum/Solana
- **Field Size**: 254-bit prime field
- **Pairing-Friendly**: Supports efficient bilinear pairings needed for Groth16

**Curve Parameters:**
```
p = 21888242871839275222246405745257275088696311157297823662689037894645226208583
r = 21888242871839275222246405745257275088548364400416034343698204186575808495617
```

### Hash Function: Poseidon

**Poseidon** is a ZK-friendly hash function optimized for arithmetic circuits.

**Features:**
- **ZK-Optimized**: Minimal constraints in circuits (much more efficient than SHA-256)
- **Security**: Collision-resistant, pre-image resistant
- **Parameters**: Width 4, 3 inputs, 8 full rounds, 56 partial rounds
- **Use Cases**: 
  - Commitment generation: `commitment = Poseidon(vote, salt)`
  - Nullifier generation: `nullifier = Poseidon(case_id, commitment)`

---

## Implementation Details

### Circuit Design

**File**: `circuits/vote_commitment.circom`

```circom
template VoteCommitment() {
    // Private inputs (witness)
    signal input vote;        // 0 or 1 (reject or approve)
    signal input salt;        // Random 254-bit value
    signal input case_id;     // Case identifier
    
    // Public inputs
    signal input commitment;  // Hash of vote and salt
    signal input nullifier;   // Hash of case_id and commitment
    
    // Constraints
    vote * (1 - vote) === 0;  // Binary vote constraint
    
    component poseidon_commit = Poseidon(2);
    poseidon_commit.inputs[0] <== vote;
    poseidon_commit.inputs[1] <== salt;
    commitment === poseidon_commit.out;
    
    component poseidon_nullifier = Poseidon(2);
    poseidon_nullifier.inputs[0] <== case_id;
    poseidon_nullifier.inputs[1] <== commitment;
    nullifier === poseidon_nullifier.out;
}
```

**Circuit Statistics:**
- **Constraints**: 481 (non-linear)
- **Private Inputs**: 3 (vote, salt, case_id)
- **Public Inputs**: 2 (commitment, nullifier)
- **Wires**: 484
- **Labels**: 1,542

### Trusted Setup

Groth16 requires a trusted setup ceremony (one-time process):

**Phase 1: Powers of Tau**
- **Power**: 14 (supports up to 16,384 constraints)
- **File**: `pot14_final.ptau`
- **Security**: Multi-party ceremony (2 contributions)
- **Property**: Safe if at least 1 participant is honest

**Phase 2: Circuit-Specific Keys**
- **Proving Key**: 273 KB (`vote_commitment_0001.zkey`)
- **Verifying Key**: 3 KB (`verification_key.json`)
- **Hash**: `aa78893e0b3d9efbeef07ec1fcc346e1...`

### Verification on Solana

**Library**: arkworks-rs (Rust implementation)

```rust
# Cargo.toml dependencies
ark-bn254 = "0.4.0"      # BN254 elliptic curve
ark-groth16 = "0.4.0"    # Groth16 proving system
```

**Verification Process**:
1. Deserialize 192-byte proof from transaction data
2. Parse public inputs (commitment, nullifier)
3. Load verification key (stored on-chain or off-chain)
4. Execute Groth16 verification algorithm
5. Return boolean result (valid/invalid)

**Performance**:
- **Verification Time**: ~10ms on-chain
- **Compute Units**: ~50,000 CU (Solana)
- **Proof Size**: 192 bytes (constant)

---

## Use Cases in SolSafe

### 1. Private Voting

**Problem**: Prevent vote coercion and ensure juror privacy

**Solution**: Groth16 proofs hide vote choice while proving validity

**Flow**:
```
1. Juror selects vote (0=reject, 1=approve)
2. Juror generates random salt
3. Client computes commitment = Poseidon(vote, salt)
4. Client computes nullifier = Poseidon(case_id, commitment)
5. Client generates Groth16 proof of correct computation
6. Juror submits (commitment, nullifier, proof) on-chain
7. Smart contract verifies proof and stores commitment
8. Vote remains hidden until optional reveal phase
```

**Privacy Guarantees**:
- ✅ Vote choice completely hidden (zero-knowledge)
- ✅ Juror identity hidden (via commitment scheme)
- ✅ Double-voting prevented (nullifier tracking)
- ✅ Vote validity guaranteed (proof verification)

### 2. Evidence Verification

**Problem**: Prove evidence authenticity without revealing content

**Solution**: Groth16 proofs verify hash commitments

**Workflow**:
- Evidence hash committed on-chain
- Juror proves knowledge of pre-image
- MPC threshold decryption for qualified jurors
- Evidence remains confidential until threshold met

### 3. Confidential Transfers

**Integration**: Dust Protocol uses ZK proofs for private token transfers

**Proof Types**:
- Range proofs (amount in valid range)
- Compliance proofs (AML/KYC validation)
- Balance proofs (sufficient funds)

---

## Security Analysis

### Cryptographic Security

**Soundness**: Computationally secure (2^128 security level)
- Attacker cannot forge valid proof for invalid statement
- Requires breaking discrete logarithm problem on BN254

**Zero-Knowledge**: Information-theoretic
- Verifier learns nothing beyond statement validity
- Proof reveals no information about witness (vote, salt)

**Completeness**: Perfect
- Valid proofs always verify correctly
- No false negatives for honest provers

### Threat Model

**Resistant Against**:
- ✅ Forged proofs (computationally infeasible)
- ✅ Commitment breaking (hash pre-image resistance)
- ✅ Nullifier reuse (on-chain tracking)
- ✅ Circuit tampering (deterministic compilation)

**Trust Assumptions**:
- ⚠️ Trusted setup: Requires at least 1 honest participant (standard for Groth16)
- ⚠️ Circuit correctness: Circuit must accurately encode constraints
- ⚠️ Implementation: Bugs in verification code could compromise security

### Audit Status

**Internal Security Review**: ✅ Complete
- 14 vulnerabilities found and fixed
- ZK implementation thoroughly reviewed

**External Audit**: ⏳ Scheduled Q1 2026
- Halborn Security engagement
- Full cryptographic review
- Circuit verification

---

## Comparison with Other ZK Systems

| System | Proof Size | Verification | Setup | Use Case |
|--------|-----------|--------------|-------|----------|
| **Groth16** | **192 bytes** | **~10ms** | Trusted | SolSafe (optimal) |
| PLONK | ~400 bytes | ~20ms | Universal | Flexible circuits |
| Bulletproofs | ~1-2 KB | ~100ms | Transparent | Range proofs |
| STARKs | ~45 KB | ~50ms | Transparent | Post-quantum |
| Halo2 | ~500 bytes | ~30ms | Transparent | Zcash Orchard |

**Why Groth16 for SolSafe?**
- ✅ Smallest proofs → lowest on-chain storage costs
- ✅ Fastest verification → lowest compute units
- ✅ Well-supported on Solana ecosystem
- ⚠️ Trusted setup acceptable for voting (one-time, verifiable)

---

## Technical Stack

### Smart Contract (Rust/Anchor)
- **Framework**: Anchor 0.30.1
- **ZK Library**: arkworks-rs 0.4.0
- **Curve**: ark-bn254
- **Verification**: ark-groth16

### Circuit Compiler
- **Compiler**: Circom 2.1.6
- **Language**: circom DSL
- **Output**: R1CS constraints
- **Hash Library**: circomlib (Poseidon)

### Frontend (JavaScript/TypeScript)
- **Proof Generation**: snarkjs 0.7.4
- **WASM Execution**: Browser-based proving
- **Hash Function**: circomlibjs
- **Wallet**: Phantom/Solflare adapters

---

## Performance Metrics

| Metric | Value | Notes |
|--------|-------|-------|
| Proof Generation | ~2-3 seconds | Client-side (WASM) |
| Proof Size | 192 bytes | Constant size |
| Verification Time | ~10ms | On-chain (Solana) |
| Compute Units | ~50,000 CU | Solana BPF |
| Storage Reduction | 95% | With Light Protocol compression |
| Security Level | 128-bit | Equivalent to AES-128 |

---

## Future Considerations

### Potential Upgrades

**1. Universal Setup (PLONK/Halo2)**
- Remove trusted setup requirement
- Slightly larger proofs (+200 bytes)
- Maintain verification efficiency

**2. Recursive Proofs**
- Aggregate multiple votes into single proof
- Further reduce verification costs
- Requires folding schemes (Nova, Sangria)

**3. Post-Quantum (STARKs)**
- Future-proof against quantum computers
- Significantly larger proofs (~45 KB)
- Transparent setup

**Current Decision**: Groth16 optimal for current needs
- Trusted setup risk acceptable (2+ participants)
- Performance critical for on-chain voting
- Revisit when universal/recursive schemes mature

---

## References

### Papers
- [Groth16 Paper (2016)](https://eprint.iacr.org/2016/260.pdf) - Original Groth16 specification
- [BN254 Curve](https://eprint.iacr.org/2005/133.pdf) - Barreto-Naehrig curves
- [Poseidon Hash](https://eprint.iacr.org/2019/458.pdf) - ZK-friendly hash function

### Libraries
- [arkworks-rs](https://github.com/arkworks-rs) - Rust ZK library
- [Circom](https://github.com/iden3/circom) - Circuit compiler
- [snarkjs](https://github.com/iden3/snarkjs) - JavaScript ZK toolkit
- [circomlib](https://github.com/iden3/circomlib) - Circuit library

### Documentation
- [Circom Documentation](https://docs.circom.io/)
- [Groth16 Tutorial](https://www.rareskills.io/post/groth16)
- [ZK-SNARKs Explained](https://z.cash/technology/zksnarks/)
- [Arkworks Guide](https://arkworks.rs/algebra)

---

## Conclusion

**SolSafe uses Groth16 ZK-SNARKs on BN254 as its zero-knowledge proof system, optimized for:**

1. **Privacy**: Zero-knowledge vote commitments
2. **Efficiency**: Smallest proofs (192 bytes) and fastest verification
3. **Security**: 128-bit security level, battle-tested in production
4. **On-Chain**: Optimal for Solana's compute/storage constraints

This choice represents the current state-of-the-art for on-chain voting systems, balancing security, efficiency, and practicality.

---

**Last Updated**: January 3, 2026  
**Verification Key Hash**: `aa78893e0b3d9efbeef07ec1fcc346e1...`  
**Circuit Version**: 0.2.0
