# SolSafe Deployment Guide

This guide walks you through deploying SolSafe to Solana devnet and mainnet.

## Prerequisites

Before deploying, ensure you have:

1. **Anchor Framework** installed (v0.30.1 or later)
   ```bash
   cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
   avm install 0.30.1
   avm use 0.30.1
   ```

2. **Solana CLI** installed
   ```bash
   sh -c "$(curl -sSfL https://release.solana.com/stable/install)"
   ```

3. **Node.js** (v16 or later) and npm/yarn

4. **A funded Solana wallet**
   - Devnet: Request airdrops with `solana airdrop 2`
   - Mainnet: Ensure you have at least 5 SOL for deployment and testing

## Project Structure

```
solsafe/
├── solsafe-program/          # Anchor smart contract
│   ├── programs/
│   │   └── solsafe-program/
│   │       ├── src/
│   │       │   ├── lib.rs    # Main program logic
│   │       │   └── state.rs  # Account structures
│   │       └── Cargo.toml
│   ├── Anchor.toml           # Anchor configuration
│   └── scripts/
│       └── deploy.sh         # Deployment script
├── backend/                  # Backend server
│   └── server.ts
└── frontend/                 # React frontend
    └── src/
```

## Step 1: Configure Your Wallet

1. **Create or use existing Solana wallet:**
   ```bash
   solana-keygen new --outfile ~/.config/solana/id.json
   ```

2. **Set your wallet as default:**
   ```bash
   solana config set --keypair ~/.config/solana/id.json
   ```

3. **Check your wallet address:**
   ```bash
   solana address
   ```

## Step 2: Deploy to Devnet

### 2.1 Set Network to Devnet
```bash
solana config set --url https://api.devnet.solana.com
```

### 2.2 Fund Your Wallet
```bash
solana airdrop 2
solana balance
```

### 2.3 Build and Deploy
```bash
cd solsafe-program
anchor build
anchor deploy
```

Or use the deployment script:
```bash
cd solsafe-program/scripts
./deploy.sh devnet
```

### 2.4 Update Configuration

After deployment, the script will output your program ID. Update it in:

1. **Anchor.toml** - Update the program ID under `[programs.devnet]`
2. **lib.rs** - Update the `declare_id!` macro with your program ID
3. **backend/server.ts** - Set the `PROGRAM_ID` environment variable

### 2.5 Initialize the Program

Create an initialization script `solsafe-program/scripts/initialize.ts`:

```typescript
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";

async function initialize() {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const programId = new PublicKey("YOUR_PROGRAM_ID");
  const idl = await Program.fetchIdl(programId, provider);
  const program = new Program(idl, programId, provider);

  const [configPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("config")],
    program.programId
  );

  await program.methods
    .initialize()
    .accounts({
      config: configPda,
      admin: provider.wallet.publicKey,
      systemProgram: anchor.web3.SystemProgram.programId,
    })
    .rpc();

  console.log("✅ Program initialized!");
  console.log("Config PDA:", configPda.toString());
}

initialize().catch(console.error);
```

Run initialization:
```bash
ts-node scripts/initialize.ts
```

### 2.6 Update Validators

Run the backend server to populate the validator list:
```bash
cd backend
export PROGRAM_ID="YOUR_PROGRAM_ID"
export RPC_URL="https://api.devnet.solana.com"
ts-node server.ts
```

## Step 3: Deploy to Mainnet

### 3.1 Prepare for Mainnet

Before deploying to mainnet:

1. **Thoroughly test on devnet** - Ensure all functionality works correctly
2. **Security audit** - Have your smart contract audited
3. **Fund your wallet** - Ensure you have at least 5 SOL
4. **Backup your keypair** - Store deployment keypair securely

### 3.2 Set Network to Mainnet
```bash
solana config set --url https://api.mainnet-beta.solana.com
```

### 3.3 Check Balance
```bash
solana balance
```

### 3.4 Deploy to Mainnet
```bash
cd solsafe-program/scripts
./deploy.sh mainnet
```

### 3.5 Update Mainnet Configuration

After deployment:

1. **Update Anchor.toml** - Add/update `[programs.mainnet]` section
2. **Update environment variables** in production:
   ```bash
   export PROGRAM_ID="YOUR_MAINNET_PROGRAM_ID"
   export RPC_URL="https://api.mainnet-beta.solana.com"
   ```

3. **Initialize the mainnet program** - Run the initialization script with mainnet config

4. **Update validators** - Run the backend server with mainnet config

## Step 4: Deploy Frontend and Backend

### 4.1 Frontend Deployment

1. **Update configuration:**
   Create `frontend/.env.production`:
   ```
   REACT_APP_PROGRAM_ID=YOUR_PROGRAM_ID
   REACT_APP_NETWORK=mainnet-beta
   ```

2. **Build the frontend:**
   ```bash
   cd frontend
   npm install
   npm run build
   ```

3. **Deploy to hosting** (Vercel, Netlify, etc.):
   ```bash
   # Example for Vercel
   vercel --prod
   ```

### 4.2 Backend Deployment

1. **Set environment variables:**
   ```bash
   export PROGRAM_ID="YOUR_PROGRAM_ID"
   export RPC_URL="https://api.mainnet-beta.solana.com"
   export SOL_KEYPAIR="/path/to/keypair.json"
   ```

2. **Deploy to server** (PM2, Docker, etc.):
   ```bash
   # Example with PM2
   pm2 start backend/server.ts --name solsafe-backend
   ```

## Troubleshooting

### Issue: "Insufficient funds"
**Solution:** Fund your wallet with more SOL

### Issue: "Program already exists"
**Solution:** Use `anchor upgrade` instead of `anchor deploy`:
```bash
anchor upgrade target/deploy/solsafe_program.so --program-id YOUR_PROGRAM_ID
```

### Issue: "Account already in use"
**Solution:** The program or config account may already be initialized. Check existing accounts.

### Issue: Build errors
**Solution:** Ensure you have the correct Rust and Anchor versions:
```bash
rustc --version  # Should be 1.70+
anchor --version # Should be 0.30.1
```

## Post-Deployment Checklist

- [ ] Program deployed successfully
- [ ] Program ID updated in all configuration files
- [ ] Program initialized with admin account
- [ ] Validator list populated
- [ ] Frontend deployed and accessible
- [ ] Backend server running
- [ ] Test all functionality:
  - [ ] Submit evidence
  - [ ] Request jurors
  - [ ] Select jurors
  - [ ] Vote on cases
  - [ ] Freeze assets
- [ ] Monitor program logs for errors
- [ ] Set up monitoring and alerting

## Environment Variables Reference

### Backend
```bash
PROGRAM_ID=<Your deployed program ID>
RPC_URL=<Solana RPC endpoint>
SOL_KEYPAIR=<Path to your keypair file>
```

### Frontend
```bash
REACT_APP_PROGRAM_ID=<Your deployed program ID>
REACT_APP_NETWORK=<devnet|mainnet-beta>
```

## Security Considerations

1. **Never commit private keys** - Use environment variables or secure key management
2. **Use secure RPC endpoints** - Consider using private RPC providers for mainnet
3. **Monitor the program** - Set up alerts for unusual activity
4. **Regular audits** - Keep the smart contract audited and updated
5. **Access control** - Ensure only authorized accounts can update validators

## Additional Resources

- [Anchor Documentation](https://www.anchor-lang.com/)
- [Solana Documentation](https://docs.solana.com/)
- [Solana Program Library](https://spl.solana.com/)

## Support

For issues or questions:
- GitHub Issues: https://github.com/Perry0404/solsafe/issues
- Telegram: https://t.me/
- Twitter: https://x.com/Solsafe_io
