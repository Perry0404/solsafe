# SolSafe 🔒

Decentralized Juror Protocol on Solana  
Fight rug pulls, drainers & hacks via on-chain evidence + community voting.

## Architecture

- On-chain program (solsafe-program)
  - Anchor-based Solana program implementing case submission, juror selection, voting, and asset-freeze via SPL Token authority.
  - Key accounts: GlobalConfig (admin + validator list), CaseAccount (case metadata, jurors, votes), VoteRecord (one per case+validator to prevent double-votes).
  - VRF integration: currently a placeholder for deterministic selection; Switchboard (or other VRF) integration is planned for unbiased juror selection.
- Backend (backend/)
  - Anchor/TypeScript scripts to administer validators, seed juror selection requests, and interact with the program.
- Frontend (frontend/)
  - React app to submit evidence, show case status and allow juror interactions.
- Tests
  - Anchor / ts-mocha tests live under solsafe-program/tests (e.g. vote.test.ts checks double-vote prevention).

## Quickstart

Requirements
- Rust + Cargo
- Anchor CLI
- Node.js + npm/yarn
- Solana CLI (configurable to devnet/localnet)

Build & test locally (recommended)

1. Build the program
   cd solsafe-program
   anchor build

2. Run tests
   anchor test

3. To deploy to devnet
   - Configure solana CLI to devnet and fund deploying wallet
   - anchor deploy --provider.cluster devnet
   - After deploy update declare_id! in the program and Anchor.toml [programs.devnet] with the deployed program id

## Notes / TODO

- Replace placeholder declare_id! and Anchor.toml program id with the real deployed program pubkey before running clients on devnet.
- Integrate real VRF result decoding (Switchboard or other) for non-deterministic juror selection.
- Adjust account sizing constants (CaseAccount::LEN, GlobalConfig::LEN) to match expected evidence and juror sizes in production.
- Ensure token freeze CPI uses correct authorities and signer seeds; test freeze/unfreeze flows on devnet.
- Do NOT commit private keys; secure your deployer and upgrade authority keys.

License: Eclipse Public License 2.0
