# SolSafe Live Testing Setup Guide

## 🎯 Quick Start Checklist

Your program is already deployed on Devnet:
- **Program ID**: `FfV3AHU6WS7aPz53DnVvWBMEZR46ydGkEtKpLiKfRTrR`
- **Network**: Solana Devnet
- **Frontend**: Configured for Devnet
- **Backend**: Optional (for validator sync)

---

## ✅ Prerequisites

1. **Solana CLI Installed**
   ```powershell
   solana --version
   # Should show: solana-cli 1.18.x or higher
   ```

2. **Node.js & NPM**
   ```powershell
   node --version  # v18.x or higher
   npm --version   # v9.x or higher
   ```

3. **Phantom or Solflare Wallet**
   - Install browser extension
   - Create/import wallet
   - Switch to Devnet in wallet settings

---

## 🔑 Step 1: Get Devnet SOL

Your wallet needs SOL for transaction fees on Devnet:

```powershell
# Check your Solana config
solana config get

# If not on devnet, switch:
solana config set --url devnet

# Check your wallet address
solana address

# Airdrop SOL (2 SOL per request, can run multiple times)
solana airdrop 2
solana airdrop 2

# Check balance
solana balance
```

**For Phantom/Solflare wallet:**
1. Copy your wallet address from the extension
2. Go to: https://faucet.solana.com
3. Paste your address and request SOL

---

## 🚀 Step 2: Start the Frontend

```powershell
# Navigate to frontend directory
cd "c:\Users\HP SPECTRE X360 13\solsafe\frontend"

# Install dependencies (if not done)
npm install

# Start the development server
npm start
```

The app will open at: http://localhost:3000

---

## 🔗 Step 3: Connect Your Wallet

1. Click **"Select Wallet"** button in the top right
2. Choose **Phantom** or **Solflare**
3. Approve the connection in the wallet popup
4. **IMPORTANT**: Ensure your wallet is set to **Devnet** (not Mainnet)

---

## 📝 Step 4: Test Case Submission

### Submit a Test Case:

1. Go to the **"Submit Case"** tab
2. Fill in the form:
   - **Case ID**: Any unique number (e.g., `12345`)
   - **Evidence URL**: IPFS hash or URL (e.g., `QmTest123...` or `https://example.com/proof.pdf`)
   - **Scam Address**: Valid Solana address to report
   - **Privacy Option**: Check to enable ZK proof (evidence hash only on-chain)

3. Click **"Submit Case"**
4. Approve the transaction in your wallet
5. Wait for confirmation (~1-2 seconds on Devnet)

---

## 🗳️ Step 5: Test Voting

### Vote on a Case:

1. Go to the **"Vote"** tab
2. View the list of cases
3. Click on a case to expand details
4. Choose **Approve** or **Reject**
5. **Privacy Option**: Check to use ZK vote commitment
6. Approve the transaction
7. Wait for confirmation

---

## 🔧 Step 6: Backend Setup (Optional)

The backend is only needed for:
- Automatic validator synchronization
- IPFS file uploads
- API endpoints for external integrations

### Start the Backend:

```powershell
# Navigate to backend directory
cd "c:\Users\HP SPECTRE X360 13\solsafe\backend"

# Create .env file
Copy-Item .env.example .env

# Edit .env with your settings
notepad .env
```

**Required .env settings:**
```env
PORT=3001
RPC_URL=https://api.devnet.solana.com
PROGRAM_ID=FfV3AHU6WS7aPz53DnVvWBMEZR46ydGkEtKpLiKfRTrR
SOL_KEYPAIR=C:\Users\HP SPECTRE X360 13\.config\solana\id.json
```

**Start the server:**
```powershell
npm install
npm start
```

---

## 🐛 Troubleshooting

### Issue: "Wallet not connected"
- ✅ Ensure wallet extension is installed
- ✅ Check wallet is set to Devnet
- ✅ Refresh page and reconnect wallet

### Issue: "Insufficient funds"
- ✅ Airdrop more SOL: `solana airdrop 2`
- ✅ Check balance: `solana balance`

### Issue: "Program not found"
- ✅ Verify network is Devnet in wallet
- ✅ Check RPC endpoint: https://api.devnet.solana.com

### Issue: "Transaction failed"
- ✅ Increase priority fee in wallet settings
- ✅ Wait a few seconds and retry
- ✅ Check Solana network status: https://status.solana.com

### Issue: Cases not loading
- ✅ Open browser console (F12) to see errors
- ✅ Check if program has any accounts created
- ✅ Try submitting a test case first

---

## 🔍 Verify Deployment

Check your program on Solana Explorer:
https://explorer.solana.com/address/FfV3AHU6WS7aPz53DnVvWBMEZR46ydGkEtKpLiKfRTrR?cluster=devnet

---

## 📊 Testing Workflow

1. **Initial Setup** (5 min)
   - Airdrop SOL
   - Connect wallet
   - Verify connection

2. **Submit Cases** (2 min each)
   - Test public submission
   - Test private submission (ZK proof)
   - Verify on blockchain

3. **Vote on Cases** (1 min each)
   - Test public voting
   - Test private voting (ZK commitment)
   - Check vote tallies

4. **Test Edge Cases**
   - Invalid addresses
   - Duplicate case IDs
   - Voting without juror selection

---

## 🎨 UI Features to Test

- ✅ Wallet connection/disconnection
- ✅ Case list display
- ✅ Privacy toggle functionality
- ✅ Transaction status messages
- ✅ Error handling
- ✅ Loading states
- ✅ Responsive design

---

## 📝 Test Data Examples

### Valid Solana Addresses:
- `11111111111111111111111111111111` (System Program)
- `TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA` (Token Program)
- Your own wallet address

### Sample IPFS Hashes:
- `QmTest123ABC...` (mock hash)
- `Qmf412jQZiuVUtdgnB36FXFX7xg5V6KEbSJ4dpQuhkLyfD` (real hash format)

### Case IDs:
- Use sequential numbers: 1, 2, 3...
- Or timestamps: 1704197824000
- Must be unique per case

---

## 🚀 Next Steps

After successful testing:
1. **Mainnet Deployment**: Deploy to Mainnet-Beta
2. **Domain Setup**: Configure custom domain
3. **Production RPC**: Use paid RPC service (Helius, QuickNode)
4. **Monitoring**: Set up error tracking (Sentry)
5. **Analytics**: Add usage analytics

---

## 📞 Support

- **GitHub Issues**: https://github.com/Perry0404/solsafe/issues
- **Solana Discord**: https://discord.gg/solana
- **Anchor Docs**: https://www.anchor-lang.com

---

## 🔐 Security Notes

⚠️ **Devnet is for testing only!**
- Do not use real funds
- Do not store sensitive data
- All data is public and temporary
- Devnet resets periodically

✅ **Best Practices:**
- Test with small amounts
- Use test wallets only
- Never share private keys
- Keep wallet extension updated
