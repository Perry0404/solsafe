# SolSafe 🔒

[![Solana](https://img.shields.io/badge/Solana-Devnet-14F195?logo=solana)](https://solana.com)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Anchor](https://img.shields.io/badge/Anchor-0.30.1-blueviolet)](https://www.anchor-lang.com/)

**The decentralized juror protocol on Solana.**

> SolSafe is the first system to deliver *proof of justice* in crypto:  
> - Scams are detected with on-chain evidence stored on IPFS
> - Cases are judged by randomly selected staked jurors using VRF
> - Illicit funds are frozen by smart contract upon consensus
>  
> No courts. No admins. No centralized authority. Just code and community.

---

## 🌟 Features

- **🎲 VRF-Based Juror Selection** - Cryptographically secure random selection from validator pool
- **📊 Configurable Voting System** - Customizable quorum and minimum juror requirements
- **🔗 IPFS Evidence Storage** - Immutable, decentralized evidence with content addressing
- **⚡ Automatic Case Resolution** - Smart contract auto-executes based on vote threshold
- **🔐 Double-Vote Prevention** - Built-in safeguards against manipulation
- **🏗️ Modular Architecture** - Clean, maintainable instruction-based design
- **🧪 Comprehensive Testing** - Full test suite for all voting scenarios
- **📱 React Frontend** - Modern UI with wallet integration

---

## 📁 Project Structure

```
solsafe/
├── solsafe-program/          # Solana smart contract (Anchor)
│   ├── programs/
│   │   └── solsafe-program/
│   │       └── src/
│   │           ├── lib.rs              # Program entry point
│   │           ├── state.rs            # State definitions
│   │           └── instructions/       # Modular instruction handlers
│   │               ├── initialize.rs
│   │               ├── submit_evidence.rs
│   │               ├── select_jurors.rs
│   │               ├── vote.rs
│   │               └── ...
│   └── tests/                # Integration tests
├── frontend/                 # React web application
│   ├── src/
│   │   ├── components/      # UI components
│   │   ├── hooks/           # Custom React hooks (useCases, etc.)
│   │   └── utils/           # IPFS utilities
│   └── package.json
├── backend/                  # Express API server
│   ├── api-server.ts        # IPFS upload endpoints
│   └── server.ts            # Validator update script
└── docs/
    ├── ARCHITECTURE.md              # Code structure guide
    ├── BLOCKCHAIN_INTEGRATION.md    # Frontend integration
    ├── DEPLOYMENT_CHECKLIST.md      # Deployment guide
    ├── IPFS_SETUP.md               # IPFS configuration
    └── VOTING_IMPLEMENTATION.md     # Voting system details
```

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ and npm
- **Rust** 1.75+ and Cargo
- **Solana CLI** 1.18+
- **Anchor** 0.30.1
- **Git**

### Installation

```bash
# Clone the repository
git clone https://github.com/Perry0404/solsafe.git
cd solsafe

# Install Solana program dependencies
cd solsafe-program
anchor build

# Install frontend dependencies
cd ../frontend
npm install

# Install backend dependencies
cd ../backend
npm install
```

### Build and Test

```bash
# Build the Solana program
cd solsafe-program
anchor build

# Run tests
anchor test

# Expected output:
# ✓ Config initialized with quorum: 2, min jurors: 3
# ✓ Validators updated: 5
# ✓ Case submitted - ID: 1
# ✓ Jurors selected: 3
# ✓ Case approved - Quorum reached!
# ✓ Double voting prevented successfully
```

### Run Locally

```bash
# Terminal 1: Start backend API (for IPFS uploads)
cd backend
npm run dev
# Server running on http://localhost:3001

# Terminal 2: Start frontend
cd frontend
npm start
# App running on http://localhost:3000
```

---

## 🎯 How It Works

### 1. **Submit Evidence**
Users submit evidence of scam/fraud with IPFS-stored proof:
```typescript
await submitCase(caseId, ipfsMetadataUrl, scammerAddress);
```

### 2. **Random Juror Selection**
3 jurors are randomly selected from the validator pool using VRF:
```typescript
await selectJurors(caseId, vrfResult);
```

### 3. **Voting**
Selected jurors review evidence and vote:
```typescript
await voteOnCase(caseId, approve: true/false);
```

### 4. **Automatic Resolution**
- **Approved**: When votes reach quorum (e.g., 2 of 3)
  - Case status → `Frozen`
  - Assets locked by smart contract
- **Rejected**: When all votes cast but quorum not met
  - Case status → `Closed`

---

## 📖 Documentation

| Document | Description |
|----------|-------------|
| [**ARCHITECTURE.md**](ARCHITECTURE.md) | Modular code structure and design patterns |
| [**BLOCKCHAIN_INTEGRATION.md**](BLOCKCHAIN_INTEGRATION.md) | Frontend integration with `useCases` hook |
| [**DEPLOYMENT_CHECKLIST.md**](DEPLOYMENT_CHECKLIST.md) | Complete deployment guide for devnet/mainnet |
| [**IPFS_SETUP.md**](IPFS_SETUP.md) | IPFS configuration and evidence uploads |
| [**VOTING_IMPLEMENTATION.md**](VOTING_IMPLEMENTATION.md) | Voting system technical details |
| [**backend/README.md**](backend/README.md) | API server documentation |

---

## 🔧 Configuration

### Smart Contract
Edit `solsafe-program/Anchor.toml`:
```toml
[programs.devnet]
solsafe_program = "YOUR_PROGRAM_ID_HERE"

[provider]
cluster = "devnet"  # or "mainnet-beta"
wallet = "~/.config/solana/id.json"
```

### Backend API
Create `backend/.env`:
```env
PORT=3001
IPFS_URL=https://ipfs.infura.io:5001/api/v0
INFURA_PROJECT_ID=your_project_id
INFURA_PROJECT_SECRET=your_project_secret
```

### Frontend
Update `frontend/src/hooks/useCases.ts`:
```typescript
const PROGRAM_ID = new PublicKey('YOUR_PROGRAM_ID_HERE');
```

---

## 🧪 Testing

### Unit Tests
```bash
cd solsafe-program
anchor test
```

### Frontend Tests
```bash
cd frontend
npm test
```

### Integration Tests
```bash
# Test complete workflow: Submit → Select Jurors → Vote → Resolve
anchor test tests/complete-vote.test.ts
```

---

## 🚀 Deployment

### Deploy to Devnet

```bash
# Configure Solana CLI for devnet
solana config set --url devnet

# Airdrop SOL for deployment
solana airdrop 2

# Build and deploy
cd solsafe-program
anchor build
anchor deploy

# Copy program ID to configuration files
# Update Anchor.toml and frontend/src/hooks/useCases.ts
```

### Deploy Backend & Frontend

```bash
# Backend (Railway, Heroku, DigitalOcean)
cd backend
npm run build
npm start

# Frontend (Vercel, Netlify, or any static host)
cd frontend
npm run build
# Deploy the 'build/' directory
```

For detailed deployment steps, see [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md).

---

## 🛠️ Development

### Adding a New Instruction

1. Create instruction file:
```bash
touch solsafe-program/programs/solsafe-program/src/instructions/my_instruction.rs
```

2. Define handler and accounts:
```rust
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct MyInstruction<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
}

pub fn handler(ctx: Context<MyInstruction>) -> Result<()> {
    // Your logic here
    Ok(())
}
```

3. Export in `instructions/mod.rs`:
```rust
pub mod my_instruction;
pub use my_instruction::*;
```

4. Add to program in `lib.rs`:
```rust
pub fn my_instruction(ctx: Context<MyInstruction>) -> Result<()> {
    instructions::my_instruction::handler(ctx)
}
```

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Write tests for new features
- Follow existing code style
- Update documentation
- Ensure all tests pass before submitting PR

---

## 🔐 Security

### Current Security Features
- ✅ VRF-based randomness for juror selection
- ✅ PDA-based account validation
- ✅ Double-vote prevention
- ✅ State machine validation
- ✅ Signer verification

### Before Mainnet
- ⚠️ Complete security audit required
- ⚠️ Implement token freeze CPI
- ⚠️ Add rate limiting to backend
- ⚠️ Use multisig for admin operations

**Report security vulnerabilities**: Please open a security issue on GitHub or contact the maintainers directly.

---

## 📊 Architecture Overview

```
┌─────────────┐
│   Frontend  │ ← React + Wallet Adapter
│  (React UI) │
└──────┬──────┘
       │
       ├─────────────────────┐
       │                     │
       ▼                     ▼
┌──────────────┐    ┌─────────────────┐
│ Backend API  │    │ Solana Program  │
│ (IPFS Upload)│    │ (Anchor/Rust)   │
└──────┬───────┘    └────────┬────────┘
       │                     │
       ▼                     ▼
┌──────────────┐    ┌─────────────────┐
│     IPFS     │    │ Solana Blockchain│
│  (Evidence)  │    │  (Vote Records)  │
└──────────────┘    └─────────────────┘
```

---

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Solana Foundation** - Blockchain infrastructure
- **Anchor Framework** - Smart contract development
- **IPFS** - Decentralized storage
- **Switchboard** - VRF oracle services

---

## 📞 Support & Contact

- **Issues**: [GitHub Issues](https://github.com/Perry0404/solsafe/issues)
- **Discussions**: [GitHub Discussions](https://github.com/Perry0404/solsafe/discussions)

---

## 🗺️ Roadmap

- [x] Core voting system with VRF juror selection
- [x] IPFS evidence storage integration
- [x] Frontend dashboard with wallet integration
- [x] Comprehensive test suite
- [ ] Token freeze CPI implementation
- [ ] Validator rewards distribution
- [ ] Appeal system for rejected cases
- [ ] Multi-chain support (Ethereum L2s)
- [ ] Mobile application
- [ ] Governance token launch

---

**Built with ❤️ for a safer, more transparent crypto ecosystem.**
