# SolSafe Deployment Checklist

## ✅ Completed Items

### Code Fixes
- [x] Fixed missing `VoteRecord` struct in state.rs
- [x] Added `LEN` constants for all account structures (GlobalConfig, CaseAccount, VoteRecord)
- [x] Fixed typo in package.json: "hompage" → "homepage"
- [x] Added `spl-token` dependency to Cargo.toml
- [x] Removed incompatible `switchboard-v2` dependency
- [x] Fixed workspace resolver configuration
- [x] Fixed base58 program ID format (using placeholder)
- [x] Fixed mutable payer requirement in Vote struct
- [x] Fixed borrow checker issues in select_jurors function
- [x] Fixed PartialEq comparison in update_validators
- [x] Completed Dashboard.js implementation with all components

### Infrastructure
- [x] Created deployment script (`scripts/deploy.sh`)
- [x] Created initialization script (`scripts/initialize.ts`)
- [x] Added comprehensive DEPLOYMENT.md guide
- [x] Added environment template files (.env.example)
- [x] Updated .gitignore for Rust/Anchor artifacts
- [x] Added mainnet configuration to Anchor.toml

### Validation
- [x] Program compiles successfully with `cargo check`
- [x] All compilation errors resolved
- [x] Code structure validated

## 📋 Pre-Deployment Requirements

### 1. Install Required Tools

#### Anchor Framework (v0.30.1)
```bash
cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
avm install 0.30.1
avm use 0.30.1
```

#### Solana CLI (Latest Stable)
```bash
sh -c "$(curl -sSfL https://release.solana.com/stable/install)"
```

#### Node.js & TypeScript
```bash
# Node.js v16 or later
npm install -g typescript ts-node
```

### 2. Wallet Setup

#### Create/Configure Wallet
```bash
# Create new wallet (or use existing)
solana-keygen new --outfile ~/.config/solana/id.json

# View your address
solana address

# Set as default
solana config set --keypair ~/.config/solana/id.json
```

#### Fund Wallet

**For Devnet:**
```bash
solana config set --url https://api.devnet.solana.com
solana airdrop 2
solana balance
```

**For Mainnet:**
- Transfer at least 5 SOL to your wallet address
- Verify: `solana balance`

## 🚀 Deployment Steps

### Phase 1: Devnet Deployment

#### Step 1: Build the Program
```bash
cd solsafe-program
anchor build
```

#### Step 2: Deploy to Devnet
```bash
# Using deploy script (recommended)
cd scripts
./deploy.sh devnet

# OR manually
anchor deploy --provider.cluster devnet
```

#### Step 3: Update Configuration
The deploy script will automatically update:
- `Anchor.toml` - Program ID under [programs.devnet]
- `lib.rs` - declare_id! macro
- Note the Program ID for the next steps

#### Step 4: Initialize the Program
```bash
# Set environment variable
export PROGRAM_ID="<your-devnet-program-id>"

# Run initialization
cd scripts
ts-node initialize.ts
```

#### Step 5: Update Validators
```bash
cd ../../backend
export PROGRAM_ID="<your-devnet-program-id>"
export RPC_URL="https://api.devnet.solana.com"
ts-node server.ts
```

#### Step 6: Test on Devnet
Test all functionality:
- [ ] Submit evidence
- [ ] Request jurors
- [ ] Select jurors
- [ ] Vote on cases
- [ ] Freeze assets

### Phase 2: Mainnet Deployment (After Thorough Testing)

#### Step 1: Security Audit
- [ ] Complete security audit of smart contract
- [ ] Review and test all functionality
- [ ] Verify access controls
- [ ] Check for vulnerabilities

#### Step 2: Prepare Mainnet Wallet
```bash
solana config set --url https://api.mainnet-beta.solana.com
solana balance  # Ensure at least 5 SOL
```

#### Step 3: Deploy to Mainnet
```bash
cd solsafe-program/scripts
./deploy.sh mainnet
```

#### Step 4: Initialize Mainnet Program
```bash
export PROGRAM_ID="<your-mainnet-program-id>"
export RPC_URL="https://api.mainnet-beta.solana.com"
ts-node initialize.ts
```

#### Step 5: Update Mainnet Validators
```bash
cd ../../backend
export PROGRAM_ID="<your-mainnet-program-id>"
export RPC_URL="https://api.mainnet-beta.solana.com"
ts-node server.ts
```

### Phase 3: Frontend & Backend Deployment

#### Frontend
1. Create `frontend/.env.production`:
```env
REACT_APP_PROGRAM_ID=<your-program-id>
REACT_APP_NETWORK=mainnet-beta
```

2. Build and deploy:
```bash
cd frontend
npm install
npm run build

# Deploy to hosting provider (Vercel, Netlify, etc.)
vercel --prod
# OR
netlify deploy --prod
```

#### Backend
1. Set production environment variables
2. Deploy to server (PM2, Docker, etc.)
```bash
pm2 start backend/server.ts --name solsafe-backend
```

## 🔍 Post-Deployment Verification

### Devnet Checklist
- [ ] Program deployed successfully
- [ ] Program ID updated in all config files
- [ ] GlobalConfig initialized
- [ ] Validators populated
- [ ] Can submit evidence
- [ ] Juror selection works
- [ ] Voting mechanism works
- [ ] Asset freezing works
- [ ] Frontend connects to devnet
- [ ] Backend APIs functional

### Mainnet Checklist
- [ ] All devnet tests passed
- [ ] Security audit completed
- [ ] Program deployed to mainnet
- [ ] Mainnet program initialized
- [ ] Mainnet validators configured
- [ ] Frontend deployed and functional
- [ ] Backend deployed and running
- [ ] Monitoring and alerting set up
- [ ] Documentation updated with mainnet IDs

## 🛡️ Security Considerations

### Before Mainnet Launch
- [ ] Complete smart contract security audit
- [ ] Review all access controls
- [ ] Test with production-like data
- [ ] Set up monitoring and alerting
- [ ] Backup all keypairs securely
- [ ] Document emergency procedures
- [ ] Test upgrade procedures

### Ongoing Security
- [ ] Monitor program activity
- [ ] Regular security reviews
- [ ] Keep dependencies updated
- [ ] Log analysis and anomaly detection
- [ ] Incident response plan

## 📝 Important Notes

### Program ID Management
- The placeholder program ID `11111111111111111111111111111111` MUST be replaced after deployment
- Each deployment generates a new program ID
- Update all references to the program ID across:
  - Anchor.toml
  - lib.rs
  - backend/server.ts
  - frontend environment variables

### RPC Endpoints
- **Devnet:** https://api.devnet.solana.com (free, rate-limited)
- **Mainnet:** Consider using:
  - https://api.mainnet-beta.solana.com (free, rate-limited)
  - Or private RPC providers for production (Helius, Triton, QuickNode, etc.)

### Estimated Costs
- **Devnet:** Free (use airdrops)
- **Mainnet:**
  - Initial deployment: ~2-3 SOL
  - Initialization: ~0.5 SOL
  - Operations: Variable based on usage

## 🆘 Troubleshooting

### Common Issues

**Issue:** "Insufficient funds for deployment"
```bash
# Solution: Fund your wallet
solana balance
# For devnet: solana airdrop 2
# For mainnet: Transfer SOL to your address
```

**Issue:** "Program already deployed"
```bash
# Solution: Use upgrade instead
anchor upgrade target/deploy/solsafe_program.so --program-id <PROGRAM_ID>
```

**Issue:** "Account already initialized"
```bash
# Solution: Account exists, skip initialization or use different seeds
```

**Issue:** "Build failures"
```bash
# Solution: Verify tool versions
anchor --version  # Should be 0.30.1
rustc --version   # Should be 1.70+
cargo --version

# Clean and rebuild
cargo clean
anchor build
```

## 📚 Additional Resources

- [Full Deployment Guide](./DEPLOYMENT.md)
- [Anchor Documentation](https://www.anchor-lang.com/)
- [Solana Documentation](https://docs.solana.com/)
- [Project README](./README.md)

## 🎯 Quick Start Commands

### Devnet Deployment (Quick)
```bash
# 1. Build
cd solsafe-program && anchor build

# 2. Deploy
./scripts/deploy.sh devnet

# 3. Initialize
export PROGRAM_ID="<from-deploy-output>"
ts-node scripts/initialize.ts

# 4. Update validators
cd ../backend
export RPC_URL="https://api.devnet.solana.com"
ts-node server.ts
```

### Mainnet Deployment (After Testing)
```bash
# Same as devnet but with mainnet
./scripts/deploy.sh mainnet
# Then follow initialization steps with mainnet RPC
```
