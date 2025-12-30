# ZK Proofs Deployment Checklist

## Pre-Deployment

### 1. Smart Contract Preparation

- [ ] **Build ZK-enabled contract**
  ```bash
  cd solsafe-program
  anchor build --features zk-proofs
  ```

- [ ] **Update program ID**
  ```bash
  anchor keys list
  # Update declare_id!() in lib.rs
  ```

- [ ] **Test ZK instructions**
  ```bash
  anchor test
  ```

### 2. Frontend Setup

- [ ] **Install ZK dependencies**
  ```bash
  cd frontend
  npm install crypto-hash buffer @types/node
  ```

- [ ] **Configure environment**
  ```bash
  cp .env.example .env
  # Add:
  REACT_APP_PROGRAM_ID=<your_program_id>
  REACT_APP_NETWORK=devnet
  REACT_APP_ENABLE_ZK=true
  ```

- [ ] **Build and test frontend**
  ```bash
  npm run build
  npm start
  ```

## Deployment Steps

### Phase 1: Deploy Core ZK Infrastructure

#### 1.1 Initialize Compressed State Configuration

```bash
anchor run deploy-zk
```

Or manually:
```typescript
// Initialize Light Protocol compression
await program.methods
  .initializeCompressionConfig(maxTreeDepth: 20)
  .accounts({
    authority: wallet.publicKey,
    compressionConfig: compressionConfigPDA,
    systemProgram: SystemProgram.programId,
  })
  .rpc();
```

#### 1.2 Initialize Confidential Transfer Config

```typescript
// Setup Dust Protocol config
await program.methods
  .initializeConfidentialConfig({
    enabled: true,
    maxTransferAmount: new BN(1000000),
    requireProof: true,
    compliancePubkey: complianceOfficerKey,
  })
  .accounts({
    authority: wallet.publicKey,
    config: confidentialConfigPDA,
    systemProgram: SystemProgram.programId,
  })
  .rpc();
```

### Phase 2: Per-Case Setup

For each new case with ZK privacy:

#### 2.1 Initialize Compressed Vote State

```typescript
await program.methods
  .initializeCompressedState(caseId)
  .accounts({
    authority: wallet.publicKey,
    compressedState: compressedStatePDA,
    systemProgram: SystemProgram.programId,
  })
  .rpc();
```

#### 2.2 Initialize MPC Configuration

```typescript
await program.methods
  .initializeMpc(caseId, threshold: 3, totalJurors: 5)
  .accounts({
    authority: wallet.publicKey,
    mpcConfig: mpcConfigPDA,
    systemProgram: SystemProgram.programId,
  })
  .rpc();
```

#### 2.3 Distribute MPC Shares to Jurors

```typescript
// For each juror
await program.methods
  .submitMpcShare(publicShare, shareCommitment)
  .accounts({
    juror: jurorWallet.publicKey,
    mpcShare: mpcSharePDA,
    mpcConfig: mpcConfigPDA,
    systemProgram: SystemProgram.programId,
  })
  .rpc();
```

## Configuration Files

### solsafe-config.json

```json
{
  "program_id": "YOUR_PROGRAM_ID",
  "network": "devnet",
  "zk_proofs": {
    "enabled": true,
    "light_protocol": {
      "compression_enabled": true,
      "max_tree_depth": 20,
      "merkle_tree_program": "LIGHT_PROTOCOL_PROGRAM_ID"
    },
    "arcium_mpc": {
      "default_threshold": 3,
      "max_jurors": 20,
      "timeout_seconds": 3600
    },
    "dust_protocol": {
      "confidential_transfers_enabled": true,
      "max_transfer_amount": 1000000,
      "require_compliance_proof": true,
      "compliance_officer": "COMPLIANCE_OFFICER_PUBKEY"
    }
  },
  "vote_commitment": {
    "hash_algorithm": "sha256",
    "commitment_scheme": "pedersen",
    "reveal_timeout_seconds": 86400
  }
}
```

## Security Checklist

### Pre-Production

- [ ] **Audit ZK circuits**
  - Verify commitment scheme implementation
  - Check nullifier uniqueness enforcement
  - Validate range proof constraints

- [ ] **Test MPC threshold security**
  - Verify t-of-n threshold enforcement
  - Test with malicious minority
  - Validate share reconstruction

- [ ] **Compliance verification**
  - Test audit trail completeness
  - Verify compliance officer access
  - Check regulatory reporting

### Key Management

- [ ] **Secure vote salt storage**
  - Client-side only
  - Never transmitted to server
  - Backup mechanism for vote reveal

- [ ] **MPC key distribution**
  - Secure channel for share distribution
  - Verify share commitments
  - Test threshold reconstruction

- [ ] **Compliance keys**
  - Multi-sig for compliance officer
  - Key rotation policy
  - Emergency access procedures

## Monitoring

### Metrics to Track

1. **Performance**
   - Average proof generation time
   - Vote commitment latency
   - MPC reconstruction time
   - Compressed state tree size

2. **Usage**
   - Private votes per day
   - MPC encryptions per case
   - Confidential transfers volume
   - Compression ratio achieved

3. **Security**
   - Failed proof verifications
   - Nullifier collision attempts
   - MPC threshold violations
   - Compliance audit triggers

### Monitoring Setup

```typescript
// Add to frontend
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: 'YOUR_SENTRY_DSN',
  integrations: [
    new Sentry.BrowserTracing(),
  ],
  tracesSampleRate: 1.0,
});

// Track ZK operations
Sentry.addBreadcrumb({
  category: 'zk-proof',
  message: 'Vote commitment generated',
  level: 'info',
  data: { caseId, proofType: 'vote_commitment' }
});
```

## Testing Checklist

### Unit Tests

- [ ] Vote commitment generation
- [ ] Nullifier uniqueness
- [ ] Proof verification
- [ ] MPC share distribution
- [ ] Confidential transfer encryption

### Integration Tests

- [ ] End-to-end private voting
- [ ] MPC threshold decryption
- [ ] Confidential transfer flow
- [ ] Compliance audit access

### Security Tests

- [ ] Double-voting prevention
- [ ] Malicious proof rejection
- [ ] MPC collusion resistance
- [ ] Range proof validation

## Rollback Plan

If issues detected:

1. **Disable ZK features**
   ```typescript
   await program.methods
     .setZkEnabled(false)
     .accounts({ authority: adminWallet.publicKey })
     .rpc();
   ```

2. **Fallback to public voting**
   - Switch frontend to traditional vote instruction
   - Maintain existing cases
   - Preserve vote commitments for later reveal

3. **Preserve privacy data**
   - Keep compressed state trees
   - Archive MPC configurations
   - Maintain vote commitments

## Production Readiness

### Required Integrations

Before production, replace placeholder implementations:

1. **Light Protocol SDK**
   ```bash
   npm install @lightprotocol/zk-compression
   ```
   - Implement real merkle tree operations
   - Use production state compression

2. **Arcium MPC SDK**
   ```bash
   npm install @arcium/mpc-sdk
   ```
   - Integrate actual threshold encryption
   - Use production MPC protocol

3. **Dust Protocol SDK**
   ```bash
   npm install @dustprotocol/confidential-transfers
   ```
   - Implement ElGamal encryption
   - Use production range proofs

### Circuit Deployment

1. **Compile circuits**
   ```bash
   cd circuits
   circom vote_commitment.circom --r1cs --wasm --sym
   ```

2. **Generate proving/verification keys**
   ```bash
   snarkjs groth16 setup vote_commitment.r1cs pot12_final.ptau vote_commitment_0000.zkey
   snarkjs zkey contribute vote_commitment_0000.zkey vote_commitment_final.zkey
   snarkjs zkey export verificationkey vote_commitment_final.zkey verification_key.json
   ```

3. **Deploy verifier contract**
   ```bash
   snarkjs zkey export solidityverifier vote_commitment_final.zkey verifier.sol
   # Convert to Anchor/Solana format
   ```

## Support Contacts

- **Technical Issues**: tech@solsafe.io
- **Security Concerns**: security@solsafe.io
- **Compliance Questions**: compliance@solsafe.io

## Additional Resources

- [ZK Proofs Guide](./ZK_PROOFS_GUIDE.md)
- [Architecture Overview](./ARCHITECTURE.md)
- [API Documentation](./docs/API.md)
