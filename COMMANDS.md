# SolSafe Command Reference

Quick reference for common commands used in the SolSafe project.

## 🔧 Solana CLI Commands

### Wallet Management
```bash
# Create new wallet
solana-keygen new --outfile ~/.config/solana/id.json

# View wallet address
solana address

# Check balance
solana balance

# Request airdrop (devnet only)
solana airdrop 2
```

### Network Configuration
```bash
# Set to devnet
solana config set --url https://api.devnet.solana.com

# Set to mainnet
solana config set --url https://api.mainnet-beta.solana.com

# Set wallet
solana config set --keypair ~/.config/solana/id.json

# View current config
solana config get
```

### Account Information
```bash
# Get program ID from keypair
solana address -k target/deploy/solsafe_program-keypair.json

# Get account info
solana account <ACCOUNT_ADDRESS>

# Get transaction details
solana transaction <SIGNATURE>
```

## ⚓ Anchor CLI Commands

### Setup
```bash
# Install Anchor Version Manager
cargo install --git https://github.com/coral-xyz/anchor avm --locked --force

# Install specific Anchor version
avm install 0.30.1
avm use 0.30.1

# Verify installation
anchor --version
```

### Build & Test
```bash
# Build the program
anchor build

# Run tests
anchor test

# Run specific test
anchor test --skip-local-validator

# Clean build artifacts
anchor clean
```

### Deployment
```bash
# Deploy to devnet
anchor deploy --provider.cluster devnet

# Deploy to mainnet
anchor deploy --provider.cluster mainnet

# Upgrade existing program
anchor upgrade target/deploy/solsafe_program.so --program-id <PROGRAM_ID>
```

### Development
```bash
# Initialize new Anchor project
anchor init <project-name>

# Add new program
anchor new <program-name>

# Verify program
anchor verify <program-id>
```

## 🛠️ Project-Specific Commands

### Using Deployment Scripts
```bash
# Deploy to devnet
cd solsafe-program/scripts
./deploy.sh devnet

# Deploy to mainnet
./deploy.sh mainnet
```

### Initialize Program
```bash
# Set program ID
export PROGRAM_ID="<your-program-id>"

# Run initialization
cd solsafe-program/scripts
ts-node initialize.ts
```

### Update Validators
```bash
# Set environment variables
export PROGRAM_ID="<your-program-id>"
export RPC_URL="https://api.devnet.solana.com"
export SOL_KEYPAIR="~/.config/solana/id.json"

# Run validator update
cd backend
ts-node server.ts
```

## 🎨 Frontend Commands

### Development
```bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm start

# Run tests
npm test

# Build for production
npm run build
```

### Deployment
```bash
# Build production
npm run build

# Deploy to Vercel
vercel --prod

# Deploy to Netlify
netlify deploy --prod
```

## 🔍 Debugging Commands

### View Program Logs
```bash
# Stream program logs
solana logs <PROGRAM_ID>

# Get transaction logs
solana confirm <SIGNATURE> -v
```

### Account Inspection
```bash
# View account data
solana account <ACCOUNT_ADDRESS> --output json

# View program data
solana program show <PROGRAM_ID>

# Dump program account data
solana program dump <PROGRAM_ID> program.so
```

### Network Status
```bash
# Check cluster health
solana cluster-version

# Get transaction count
solana transaction-count

# View validator info
solana validators

# Get block production
solana block-production
```

## 🧪 Testing Commands

### Run Anchor Tests
```bash
# Run all tests
anchor test

# Run with logs
anchor test -- --nocapture

# Run specific test file
anchor test --skip-deploy tests/solsafe-program.ts
```

### Rust Unit Tests
```bash
cd programs/solsafe-program

# Run unit tests
cargo test

# Run with output
cargo test -- --nocapture

# Run specific test
cargo test <test_name>
```

## 📦 Package Management

### Rust Dependencies
```bash
# Update Cargo dependencies
cargo update

# Check for outdated dependencies
cargo outdated

# Audit dependencies
cargo audit
```

### Node Dependencies
```bash
# Update npm packages
npm update

# Check for vulnerabilities
npm audit

# Fix vulnerabilities
npm audit fix
```

## 🔐 Security Commands

### Keypair Management
```bash
# Generate new keypair
solana-keygen new

# Recover from seed phrase
solana-keygen recover

# Verify keypair
solana-keygen verify <PUBLIC_KEY> <KEYPAIR_FILE>

# Show public key from keypair
solana-keygen pubkey <KEYPAIR_FILE>
```

### Program Authority
```bash
# Show program authority
solana program show <PROGRAM_ID>

# Set new authority
solana program set-upgrade-authority <PROGRAM_ID> --new-upgrade-authority <NEW_AUTHORITY>
```

## 💰 Transaction Commands

### Transfer SOL
```bash
# Transfer SOL
solana transfer <RECIPIENT> <AMOUNT>

# Transfer with memo
solana transfer <RECIPIENT> <AMOUNT> --memo "message"
```

### Program Interaction
```bash
# Call program instruction (via client)
# This is typically done through TypeScript/JavaScript client
# See backend/server.ts for examples
```

## 🔄 Upgrade Commands

### Program Upgrades
```bash
# Build new version
anchor build

# Upgrade program
anchor upgrade target/deploy/solsafe_program.so \
  --program-id <PROGRAM_ID> \
  --provider.cluster <CLUSTER>

# Verify upgrade
solana program show <PROGRAM_ID>
```

## 📊 Monitoring Commands

### Account Monitoring
```bash
# Watch account changes
solana account <ACCOUNT> --watch

# Subscribe to account updates (in client)
# Use web3.js or @solana/web3.js
```

### Performance Monitoring
```bash
# Get recent performance
solana block-production

# Get transaction performance
solana transaction-history <ADDRESS>

# Get slot leader schedule
solana leader-schedule
```

## 🆘 Emergency Commands

### Close Program
```bash
# Close program and recover rent
solana program close <PROGRAM_ID> --recipient <RECIPIENT>
```

### Recover Rent
```bash
# Close account and recover rent
# This must be done through the program itself
# See program close_account instruction
```

## 📝 Environment Variables

### Common Environment Variables
```bash
# Set program ID
export PROGRAM_ID="<your-program-id>"

# Set RPC URL
export RPC_URL="https://api.devnet.solana.com"

# Set keypair path
export SOL_KEYPAIR="~/.config/solana/id.json"

# Set network
export NETWORK="devnet"

# Set Anchor provider
export ANCHOR_PROVIDER_URL="https://api.devnet.solana.com"
export ANCHOR_WALLET="~/.config/solana/id.json"
```

### For Frontend
```bash
# React environment variables
export REACT_APP_PROGRAM_ID="<program-id>"
export REACT_APP_NETWORK="devnet"
export REACT_APP_RPC_URL="https://api.devnet.solana.com"
```

## 📚 Additional Resources

- [Solana CLI Documentation](https://docs.solana.com/cli)
- [Anchor Documentation](https://www.anchor-lang.com/)
- [Solana Web3.js Documentation](https://solana-labs.github.io/solana-web3.js/)
- [Project Deployment Guide](./DEPLOYMENT.md)
- [Deployment Checklist](./DEPLOYMENT_CHECKLIST.md)
