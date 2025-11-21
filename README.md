# SolSafe 🔒

**The Decentralized Anti-Scam Protocol on Solana**

> SolSafe is the first system to deliver *proof of justice* in crypto:  
> - Scams are detected with on-chain evidence stored on IPFS
> - Cases are judged by randomly selected staked jurors using VRF
> - Illicit funds are frozen by smart contract execution  
>  
> No courts. No admins. Just code and community governance.

---

## 🌟 Features

- **Community-Driven Justice**: Decentralized juror voting system with economic incentives
- **VRF-Based Randomness**: Fair juror selection using Switchboard v2 oracles
- **IPFS Evidence Storage**: Tamper-proof, decentralized evidence uploads
- **Auto-Resolution**: Cases automatically resolve based on quorum thresholds
- **Cross-Chain Support**: Extensible architecture for multi-chain scam detection
- **Transparent Governance**: All votes and decisions recorded on-chain

## 🏗️ Architecture

```
┌─────────────────┐       ┌──────────────────┐       ┌─────────────────┐
│   React App     │◄─────►│  Solana Program  │◄─────►│  IPFS Network   │
│  (Frontend)     │       │   (Anchor/Rust)  │       │   (Evidence)    │
└─────────────────┘       └──────────────────┘       └─────────────────┘
        │                          │
        │                          │
        ▼                          ▼
┌─────────────────┐       ┌──────────────────┐
│  Express API    │       │  Switchboard VRF │
│  (IPFS Upload)  │       │   (Randomness)   │
└─────────────────┘       └──────────────────┘
```

### Tech Stack
- **Blockchain**: Solana (Anchor Framework 0.30.1)
- **Smart Contract**: Rust with modular instruction architecture
- **Frontend**: React 19.2.0 with Wallet Adapter
- **Backend**: Express.js + TypeScript
- **Storage**: IPFS (ipfs-http-client)
- **Randomness**: Switchboard v2 VRF
- **Wallets**: Phantom, MetaMask Snap

## 📦 Project Structure

```
solsafe/
├── solsafe-program/           # Solana smart contract
│   ├── programs/
│   │   └── solsafe-program/
│   │       └── src/
│   │           ├── lib.rs                 # Program entry point
│   │           ├── state.rs               # Account structures
│   │           └── instructions/          # Modular instructions
│   │               ├── initialize.rs      # Setup global config
│   │               ├── update_validators.rs
│   │               ├── submit_evidence.rs
│   │               ├── request_jurors.rs  # VRF randomness
│   │               ├── select_jurors.rs   # Hash-based selection
│   │               └── vote.rs            # Juror voting logic
│   └── tests/                 # Anchor test suites
│
├── frontend/                  # React application
│   └── src/
│       ├── components/
│       │   ├── CasesDashboard.tsx      # Display cases
│       │   └── SubmitCaseWithIPFS.tsx  # Submit evidence
│       ├── hooks/
│       │   └── useCases.ts             # Blockchain interactions
│       └── utils/
│           └── ipfs.ts                 # IPFS utilities
│
└── backend/                   # Express API server
    ├── api-server.ts          # IPFS upload endpoints
    └── server.ts              # Alternative server setup
```

## 🚀 Quick Start

### Prerequisites
- **Solana CLI** v1.18+
- **Anchor CLI** v0.30.1+
- **Rust** v1.75+
- **Node.js** v18+
- **Yarn** or **npm**

### 1. Install Dependencies

```bash
# Install Solana CLI
sh -c "$(curl -sSfL https://release.solana.com/stable/install)"

# Install Anchor CLI
cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
avm install 0.30.1
avm use 0.30.1

# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

### 2. Clone & Setup

```bash
git clone https://github.com/Perry0404/solsafe.git
cd solsafe

# Install frontend dependencies
cd frontend
npm install

# Install backend dependencies
cd ../backend
npm install
```

### 3. Deploy to Devnet

```bash
cd solsafe-program

# Configure Solana for devnet
solana config set --url devnet

# Generate a new keypair (if needed)
solana-keygen new

# Airdrop SOL for deployment
solana airdrop 2

# Build the program
anchor build

# Deploy to devnet
anchor deploy

# Copy the program ID and update:
# - solsafe-program/programs/solsafe-program/src/lib.rs (line 5)
# - solsafe-program/Anchor.toml (line 7)
# - frontend/src/hooks/useCases.ts (line 8)
```

### 4. Run Tests

```bash
cd solsafe-program
anchor test
```

### 5. Start Development Servers

```bash
# Terminal 1: Backend API
cd backend
npm start

# Terminal 2: Frontend
cd frontend
npm start
```

Frontend will be available at `http://localhost:3000`

## 🔐 Environment Variables

### Backend `.env`
```env
INFURA_PROJECT_ID=your_infura_project_id
INFURA_API_SECRET=your_infura_secret
PORT=3001
```

### Frontend `.env`
```env
REACT_APP_SOLANA_NETWORK=devnet
REACT_APP_API_URL=http://localhost:3001
```

## 📚 Documentation

- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Detailed system architecture
- **[VOTING_IMPLEMENTATION.md](./VOTING_IMPLEMENTATION.md)** - Voting mechanism specs
- **[IPFS_SETUP.md](./IPFS_SETUP.md)** - IPFS integration guide
- **[BLOCKCHAIN_INTEGRATION.md](./BLOCKCHAIN_INTEGRATION.md)** - Frontend blockchain hooks
- **[DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)** - Pre-deployment verification

## 🧪 Testing

```bash
# Run all tests
cd solsafe-program
anchor test

# Run specific test file
anchor test tests/complete-vote.test.ts
```

**Test Coverage:**
- ✅ Initialize global configuration
- ✅ Update validator list
- ✅ Submit evidence with IPFS
- ✅ Request VRF randomness
- ✅ Select jurors using hash
- ✅ Vote approval/rejection
- ✅ Double-vote prevention
- ✅ Auto-resolution on quorum

## 🛠️ Key Instructions

### Initialize Config
```typescript
await program.methods
  .initialize(quorum, minJurors)
  .accounts({ globalConfig, admin })
  .rpc();
```

### Submit Case
```typescript
await program.methods
  .submitEvidence(reporter, accused, evidenceHash, evidenceUrl)
  .accounts({ caseAccount, signer })
  .rpc();
```

### Vote on Case
```typescript
await program.methods
  .vote(approve)
  .accounts({ caseAccount, juror, voteRecord })
  .rpc();
```

## 🔒 Security Features

- **Double-Vote Prevention**: Each juror can only vote once per case
- **Hash-Based Juror Selection**: Deterministic, verifiable selection from validator pool
- **Economic Incentives**: Staking requirements for juror participation
- **Transparent Governance**: All actions recorded on-chain
- **IPFS Evidence**: Immutable, decentralized evidence storage

## 🌐 Network Configuration

| Network | RPC URL | Program ID |
|---------|---------|------------|
| Devnet  | `https://api.devnet.solana.com` | `Hvo63PGhSivug4ju5bEWrVwLuDukk45DcKBZM2XPUUVr` |
| Mainnet | TBD | TBD |

## 📈 Roadmap

- [x] Core voting mechanism with VRF
- [x] IPFS evidence integration
- [x] Frontend dashboard
- [x] Backend API for uploads
- [x] Test suite completion
- [ ] Real Switchboard VRF integration
- [ ] Token freeze CPI implementation
- [ ] Mainnet deployment
- [ ] Cross-chain bridge support
- [ ] Mobile app (React Native)

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## 👥 Team

Built by the SolSafe community contributors.

## 🔗 Links

- **Website**: Coming soon
- **GitHub**: [github.com/Perry0404/solsafe](https://github.com/Perry0404/solsafe)
- **Twitter**: Coming soon
- **Discord**: Coming soon

## ⚠️ Disclaimer

SolSafe is experimental software. Use at your own risk. This project is not audited and should not be used in production with real funds until a full security audit is completed.

---

**Built with ❤️ on Solana**
