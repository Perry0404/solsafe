# IPFS Integration Setup Guide

## 📦 What Was Added

### 1. **IPFS Utility Module** (`frontend/src/utils/ipfs.ts`)
Handles all IPFS operations for evidence uploads:

- `uploadEvidence(file)` - Simple file upload
- `uploadEvidenceWithMetadata(file, metadata)` - Upload file + metadata JSON
- `uploadJSON(data)` - Upload JSON data
- `fetchFromIPFS(cid)` - Retrieve data from IPFS

### 2. **React Component** (`frontend/src/components/SubmitCaseWithIPFS.tsx`)
Enhanced case submission form with IPFS integration:

- File upload (images/PDFs)
- Automatic IPFS upload with progress feedback
- Metadata generation and storage
- Form validation

### 3. **Updated Dependencies** (`frontend/package.json`)
Added required packages:
- `ipfs-http-client` - IPFS client library
- `@solana/web3.js` - Solana blockchain interaction
- `@solana/wallet-adapter-*` - Wallet integration

---

## 🚀 Installation

### Step 1: Install Frontend Dependencies
```bash
cd frontend
npm install
```

### Step 2: Configure IPFS Provider (Optional)

The default configuration uses Infura's free IPFS gateway. For production, consider:

**Option A: Infura (requires API key)**
1. Sign up at https://infura.io
2. Create an IPFS project
3. Update `ipfs.ts`:
```typescript
const ipfs = create({
    host: 'ipfs.infura.io',
    port: 5001,
    protocol: 'https',
    headers: {
        authorization: `Basic ${Buffer.from(
            projectId + ':' + projectSecret
        ).toString('base64')}`
    }
});
```

**Option B: Web3.Storage (recommended for production)**
```bash
npm install web3.storage
```

**Option C: Local IPFS Node**
```bash
ipfs daemon
# Then use: create({ url: 'http://localhost:5001' })
```

---

## 💻 Usage

### Basic Implementation

```typescript
import SubmitCaseWithIPFS from './components/SubmitCaseWithIPFS';

function App() {
  const handleCaseSubmit = async (caseData) => {
    console.log('Evidence URL:', caseData.evidenceUrl);
    console.log('Metadata URL:', caseData.metadataUrl);
    
    // Submit to Solana blockchain
    await program.methods
      .submitEvidence(
        caseId,
        caseData.metadataUrl, // Store metadata URL on-chain
        scamAddress,
        bump
      )
      .accounts({...})
      .rpc();
  };

  return (
    <SubmitCaseWithIPFS
      walletAddress={wallet.publicKey.toString()}
      onSubmit={handleCaseSubmit}
    />
  );
}
```

### Advanced: Direct IPFS Functions

```typescript
import { uploadEvidence, fetchFromIPFS } from './utils/ipfs';

// Upload evidence
const url = await uploadEvidence(file);
// Returns: "https://ipfs.io/ipfs/QmX..."

// Upload with metadata
const { fileUrl, metadataUrl } = await uploadEvidenceWithMetadata(file, {
  caseId: '123',
  reporter: 'wallet_address',
  scamAddress: 'scammer_address',
  description: 'Phishing attack',
  timestamp: Date.now()
});

// Fetch metadata
const metadata = await fetchFromIPFS('QmX...');
```

---

## 📊 Metadata Structure

When using `uploadEvidenceWithMetadata`, the following JSON is stored on IPFS:

```json
{
  "caseId": "case_1732233456789",
  "reporter": "7xKXt...9fGxU",
  "scamAddress": "3dP9w...8aHsK",
  "description": "Phishing attack - stole 10 SOL",
  "timestamp": 1732233456789,
  "evidenceFile": {
    "name": "screenshot.png",
    "type": "image/png",
    "size": 245678,
    "ipfsCid": "QmX...",
    "url": "https://ipfs.io/ipfs/QmX..."
  },
  "uploadedAt": 1732233456890
}
```

---

## 🔗 Integration with Smart Contract

### Update `submit_evidence` to store IPFS URL

**Current:**
```rust
pub fn submit_evidence(
    ctx: Context<SubmitEvidence>,
    case_id: u64,
    evidence: String,  // Plain text
    scam_address: Pubkey,
    bump: u8,
)
```

**Enhanced:**
```rust
pub fn submit_evidence(
    ctx: Context<SubmitEvidence>,
    case_id: u64,
    evidence_url: String,  // IPFS URL (metadata)
    scam_address: Pubkey,
    bump: u8,
)
```

### Frontend Call Example

```typescript
const tx = await program.methods
  .submitEvidence(
    new BN(caseId),
    metadataUrl,  // "https://ipfs.io/ipfs/Qm..."
    new PublicKey(scamAddress),
    bump
  )
  .accounts({
    caseAccount: casePda,
    reporter: wallet.publicKey,
    systemProgram: SystemProgram.programId,
  })
  .rpc();
```

---

## 🎨 Component Features

### SubmitCaseWithIPFS Component

**Props:**
- `walletAddress: string` - Connected wallet address
- `onSubmit: (caseData) => void` - Callback when case is ready

**Features:**
- ✅ File validation (images/PDFs only)
- ✅ Upload progress feedback
- ✅ Form validation
- ✅ Automatic metadata generation
- ✅ IPFS error handling
- ✅ Responsive design matching SolSafe theme

**States:**
- `uploading` - Shows upload in progress
- `uploadProgress` - Progress message
- Form resets after successful submission

---

## 🔒 Security Considerations

### 1. **Content Addressing**
IPFS uses content-addressing (CID), making files immutable and verifiable.

### 2. **Pinning Services**
Free IPFS gateways may not persist files permanently. For production:

```typescript
// Use pinning service like Pinata, Web3.Storage, or NFT.Storage
import { Web3Storage } from 'web3.storage';

const client = new Web3Storage({ token: API_TOKEN });
const cid = await client.put([file]);
```

### 3. **File Size Limits**
- Infura: 100 MB per file
- Web3.Storage: Unlimited (recommended)
- Consider implementing client-side validation

### 4. **Privacy**
IPFS files are public by default. For sensitive evidence:
- Encrypt files before upload
- Use private IPFS networks
- Store encryption key on-chain (only for authorized parties)

---

## 🧪 Testing

### Test IPFS Upload
```bash
cd frontend
npm start

# Or test standalone
node -e "
const { create } = require('ipfs-http-client');
const ipfs = create({ url: 'https://ipfs.infura.io:5001/api/v0' });
ipfs.add('Hello IPFS').then(res => console.log(res.cid.toString()));
"
```

---

## 🚨 Troubleshooting

### Error: "Failed to upload to IPFS"
**Solutions:**
1. Check Infura gateway status: https://status.infura.io
2. Try alternative gateway:
   ```typescript
   const ipfs = create({ url: 'https://ipfs.io/api/v0' });
   ```
3. Use local IPFS node for development

### Error: "CORS Policy"
Add to `.env`:
```
REACT_APP_IPFS_GATEWAY=https://ipfs.infura.io:5001
```

Configure CORS on IPFS node:
```bash
ipfs config --json API.HTTPHeaders.Access-Control-Allow-Origin '["*"]'
```

### Large File Uploads Fail
Implement chunked uploads:
```typescript
const fileStream = fs.createReadStream(file);
for await (const chunk of ipfs.addAll(fileStream, { chunker: 'size-262144' })) {
  console.log('Uploaded chunk:', chunk.cid);
}
```

---

## 📋 Next Steps

1. **Install dependencies:**
   ```bash
   cd frontend
   npm install
   ```

2. **Update smart contract** to accept IPFS URLs

3. **Test IPFS uploads** in development

4. **Choose production IPFS provider** (Web3.Storage recommended)

5. **Implement file encryption** for sensitive evidence

6. **Add IPFS pinning** for permanent storage

---

## 🌐 IPFS Gateways

**Public Gateways:**
- `https://ipfs.io/ipfs/{CID}`
- `https://cloudflare-ipfs.com/ipfs/{CID}`
- `https://gateway.pinata.cloud/ipfs/{CID}`

**Usage in Code:**
```typescript
const GATEWAY = 'https://ipfs.io/ipfs/';
const url = `${GATEWAY}${cid.toString()}`;
```

---

## ✅ Summary

You now have:
- ✅ Complete IPFS upload utilities
- ✅ React component for evidence submission
- ✅ Automatic metadata generation
- ✅ Updated package.json with dependencies
- ✅ Integration guide for smart contract

**Next:** Run `npm install` in the frontend directory!
