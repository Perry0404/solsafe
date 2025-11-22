# Backend API Server - Setup & Usage Guide

## 🎯 Overview

Express.js API server for SolSafe that handles:
- **IPFS Evidence Uploads** - Upload images/PDFs to IPFS
- **Metadata Management** - Generate and store case metadata
- **Blockchain Integration** - Update Solana validators
- **File Processing** - Base64 and multipart form uploads

---

## 📦 Installation

### Step 1: Install Dependencies

```bash
cd backend
npm install
```

### Step 2: Configure Environment

```bash
# Copy example env file
cp .env.example .env

# Edit .env with your settings
```

**Required Configuration:**
```env
PORT=3001
IPFS_URL=https://ipfs.infura.io:5001/api/v0

# Optional: For production Infura usage
INFURA_PROJECT_ID=your_project_id
INFURA_PROJECT_SECRET=your_project_secret
```

### Step 3: Start Server

```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm run build
npm start
```

Server will start on `http://localhost:3001`

---

## 🚀 API Endpoints

### 1. Health Check

**GET** `/health`

Check if server is running.

**Response:**
```json
{
  "status": "ok",
  "message": "SolSafe API server is running"
}
```

**Example:**
```bash
curl http://localhost:3001/health
```

---

### 2. Upload File (Multipart)

**POST** `/api/upload`

Upload a single file using multipart form data.

**Request:**
- Method: `POST`
- Content-Type: `multipart/form-data`
- Body: Form data with `file` field

**Response:**
```json
{
  "success": true,
  "cid": "QmX...",
  "url": "https://ipfs.io/ipfs/QmX...",
  "fileName": "evidence.png",
  "fileType": "image/png",
  "size": 245678
}
```

**Example (curl):**
```bash
curl -X POST http://localhost:3001/api/upload \
  -F "file=@/path/to/evidence.png"
```

**Example (JavaScript):**
```javascript
const formData = new FormData();
formData.append('file', fileInput.files[0]);

const response = await fetch('http://localhost:3001/api/upload', {
  method: 'POST',
  body: formData,
});

const data = await response.json();
console.log('IPFS URL:', data.url);
```

---

### 3. Upload File (Base64)

**POST** `/api/upload-base64`

Upload a file encoded as base64.

**Request:**
```json
{
  "fileBase64": "iVBORw0KGgoAAAANSUhEUgA...",
  "fileName": "screenshot.png",
  "fileType": "image/png"
}
```

**Response:**
```json
{
  "success": true,
  "cid": "QmX...",
  "url": "https://ipfs.io/ipfs/QmX...",
  "fileName": "screenshot.png",
  "fileType": "image/png",
  "size": 245678
}
```

**Example:**
```javascript
// Convert file to base64
const reader = new FileReader();
reader.readAsDataURL(file);
reader.onload = async () => {
  const base64 = reader.result.split(',')[1]; // Remove data:image/png;base64, prefix
  
  const response = await fetch('http://localhost:3001/api/upload-base64', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fileBase64: base64,
      fileName: file.name,
      fileType: file.type,
    }),
  });
  
  const data = await response.json();
  console.log('Uploaded:', data.url);
};
```

---

### 4. Upload Evidence with Metadata

**POST** `/api/upload-evidence`

Upload evidence file and automatically generate metadata JSON.

**Request:**
- Method: `POST`
- Content-Type: `multipart/form-data`
- Fields:
  - `file` - Evidence file (image/PDF)
  - `caseId` - Case ID
  - `reporter` - Reporter wallet address
  - `scamAddress` - Scammer wallet address
  - `description` - Case description

**Response:**
```json
{
  "success": true,
  "fileUrl": "https://ipfs.io/ipfs/QmFile...",
  "fileCid": "QmFile...",
  "metadataUrl": "https://ipfs.io/ipfs/QmMeta...",
  "metadataCid": "QmMeta...",
  "metadata": {
    "caseId": "123",
    "reporter": "7xKXt...",
    "scamAddress": "3dP9w...",
    "description": "Phishing attack",
    "timestamp": 1732233456789,
    "evidenceFile": {
      "name": "evidence.png",
      "type": "image/png",
      "size": 245678,
      "ipfsCid": "QmFile...",
      "url": "https://ipfs.io/ipfs/QmFile..."
    },
    "uploadedAt": 1732233456790
  }
}
```

**Example:**
```javascript
const formData = new FormData();
formData.append('file', evidenceFile);
formData.append('caseId', '123');
formData.append('reporter', walletAddress);
formData.append('scamAddress', scammerAddress);
formData.append('description', 'Phishing attack - stole 10 SOL');

const response = await fetch('http://localhost:3001/api/upload-evidence', {
  method: 'POST',
  body: formData,
});

const { metadataUrl, fileUrl } = await response.json();

// Use metadataUrl in blockchain transaction
await program.methods
  .submitEvidence(caseId, metadataUrl, scamAddress, bump)
  .rpc();
```

---

### 5. Upload JSON

**POST** `/api/upload-json`

Upload any JSON data to IPFS.

**Request:**
```json
{
  "data": {
    "caseId": 123,
    "votes": [
      { "juror": "ABC...", "vote": true },
      { "juror": "DEF...", "vote": false }
    ]
  }
}
```

**Response:**
```json
{
  "success": true,
  "cid": "QmX...",
  "url": "https://ipfs.io/ipfs/QmX..."
}
```

---

### 6. Fetch from IPFS

**GET** `/api/fetch/:cid`

Retrieve data from IPFS by CID.

**Response:**
```json
{
  "success": true,
  "data": { /* Retrieved data */ }
}
```

**Example:**
```bash
curl http://localhost:3001/api/fetch/QmX...
```

---

## 🔧 Frontend Integration

### React Component Example

```typescript
import { useState } from 'react';

function UploadEvidence() {
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (file: File, caseData: any) => {
    setUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('caseId', caseData.caseId);
      formData.append('reporter', caseData.reporter);
      formData.append('scamAddress', caseData.scamAddress);
      formData.append('description', caseData.description);

      const response = await fetch('http://localhost:3001/api/upload-evidence', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Upload failed');

      const result = await response.json();
      console.log('Evidence uploaded!');
      console.log('File URL:', result.fileUrl);
      console.log('Metadata URL:', result.metadataUrl);

      // Submit to blockchain
      await submitToBlockchain(result.metadataUrl);
      
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload evidence');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <input
        type="file"
        accept="image/*,.pdf"
        onChange={(e) => {
          if (e.target.files?.[0]) {
            handleUpload(e.target.files[0], {
              caseId: '123',
              reporter: walletAddress,
              scamAddress: '...',
              description: '...',
            });
          }
        }}
        disabled={uploading}
      />
      {uploading && <p>Uploading to IPFS...</p>}
    </div>
  );
}
```

### Update SubmitCaseWithIPFS Component

Replace direct IPFS calls with API calls:

```typescript
// Before: Direct IPFS
import { uploadEvidenceWithMetadata } from '../utils/ipfs';
const { fileUrl, metadataUrl } = await uploadEvidenceWithMetadata(file, metadata);

// After: Via API
const formData = new FormData();
formData.append('file', file);
formData.append('caseId', metadata.caseId);
formData.append('reporter', metadata.reporter);
formData.append('scamAddress', metadata.scamAddress);
formData.append('description', metadata.description);

const response = await fetch('http://localhost:3001/api/upload-evidence', {
  method: 'POST',
  body: formData,
});

const { fileUrl, metadataUrl } = await response.json();
```

---

## 🔐 Security Considerations

### 1. File Validation

Server validates:
- ✅ File types (images and PDFs only)
- ✅ File size (10MB limit)
- ✅ Content-Type headers

### 2. CORS Configuration

Update CORS for production:

```typescript
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  credentials: true,
}));
```

### 3. Rate Limiting

Add rate limiting for production:

```bash
npm install express-rate-limit
```

```typescript
import rateLimit from 'express-rate-limit';

const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 uploads per window
  message: 'Too many uploads, please try again later',
});

app.post('/api/upload', uploadLimiter, upload.single('file'), ...);
```

### 4. Environment Variables

Never commit `.env` file. Always use `.env.example` as template.

---

## 🧪 Testing

### Test Endpoints

```bash
# Health check
curl http://localhost:3001/health

# Upload test file
curl -X POST http://localhost:3001/api/upload \
  -F "file=@test.png"

# Upload JSON
curl -X POST http://localhost:3001/api/upload-json \
  -H "Content-Type: application/json" \
  -d '{"data":{"test":"value"}}'
```

### Test with Postman

1. Import collection from `backend/postman_collection.json` (create it)
2. Test each endpoint
3. Verify IPFS uploads at `https://ipfs.io/ipfs/{CID}`

---

## 📊 Monitoring & Logs

### Server Logs

```bash
# View logs
npm run dev

# Output example:
🚀 SolSafe API Server running on port 3001
📡 Health check: http://localhost:3001/health
📤 Upload endpoint: http://localhost:3001/api/upload
🔗 IPFS gateway: https://ipfs.infura.io:5001

File uploaded: evidence.png -> QmX...
Evidence uploaded: Case #123 -> File: QmFile..., Metadata: QmMeta...
```

### Error Handling

All errors return:
```json
{
  "success": false,
  "error": "Error description",
  "message": "Detailed error message"
}
```

---

## 🚀 Production Deployment

### 1. Build for Production

```bash
npm run build
```

### 2. Deploy Options

**Option A: Docker**
```dockerfile
FROM node:18
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3001
CMD ["npm", "start"]
```

**Option B: PM2**
```bash
npm install -g pm2
pm2 start dist/api-server.js --name solsafe-api
```

**Option C: Cloud Platforms**
- Heroku: `git push heroku main`
- Railway: Connect GitHub repo
- DigitalOcean App Platform: One-click deploy

### 3. Environment Variables

Set production env vars:
```env
NODE_ENV=production
PORT=3001
INFURA_PROJECT_ID=your_production_id
INFURA_PROJECT_SECRET=your_production_secret
ALLOWED_ORIGINS=https://your-frontend.com
```

---

## 🔄 Update Validators Script

Run the validator update script:

```bash
npm run update-validators
```

This fetches current Solana validators and updates the smart contract.

---

## 📝 API Summary

| Endpoint | Method | Purpose | Auth |
|----------|--------|---------|------|
| `/health` | GET | Health check | No |
| `/api/upload` | POST | Upload file (multipart) | No |
| `/api/upload-base64` | POST | Upload file (base64) | No |
| `/api/upload-evidence` | POST | Upload with metadata | No |
| `/api/upload-json` | POST | Upload JSON data | No |
| `/api/fetch/:cid` | GET | Fetch from IPFS | No |

---

## 🎯 Next Steps

1. **Start server**: `npm run dev`
2. **Test health check**: Visit `http://localhost:3001/health`
3. **Update frontend**: Point IPFS uploads to API
4. **Deploy to production**: Choose deployment platform
5. **Monitor**: Set up logging and error tracking

---

Your backend API server is ready for production! 🚀
