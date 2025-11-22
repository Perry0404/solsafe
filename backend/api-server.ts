import express, { Request, Response } from 'express';
import cors from 'cors';
import multer from 'multer';
import dotenv from 'dotenv';

dotenv.config();

// IPFS client will be initialized lazily when needed
let ipfs: any = null;
async function getIPFSClient() {
  if (!ipfs) {
    const { create } = await import('ipfs-http-client/src/index.js');
    ipfs = create({
      url: process.env.IPFS_URL || 'https://ipfs.infura.io:5001/api/v0',
      headers: process.env.INFURA_PROJECT_ID ? {
        authorization: `Basic ${Buffer.from(
          `${process.env.INFURA_PROJECT_ID}:${process.env.INFURA_PROJECT_SECRET}`
        ).toString('base64')}`,
      } : undefined,
    });
  }
  return ipfs;
}

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept images and PDFs only
    if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only images and PDFs are allowed'));
    }
  },
});

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', message: 'SolSafe API server is running' });
});

// Upload file from base64
app.post('/api/upload-base64', async (req: Request, res: Response) => {
  try {
    const { fileBase64, fileName, fileType } = req.body;

    if (!fileBase64) {
      return res.status(400).json({ error: 'No file data provided' });
    }

    // Convert base64 to buffer
    const buffer = Buffer.from(fileBase64, 'base64');

    // Upload to IPFS
    const ipfsClient = await getIPFSClient();
    const result = await ipfsClient.add(buffer);
    const cid = result.cid.toString();
    const url = `https://ipfs.io/ipfs/${cid}`;

    console.log(`File uploaded: ${fileName} -> ${cid}`);

    res.json({
      success: true,
      cid,
      url,
      fileName: fileName || 'unknown',
      fileType: fileType || 'unknown',
      size: buffer.length,
    });
  } catch (error: any) {
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to upload to IPFS',
      message: error.message,
    });
  }
});

// Upload file using multipart form
app.post('/api/upload', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Upload to IPFS
    const ipfsClient = await getIPFSClient();
    const result = await ipfsClient.add(req.file.buffer);
    const cid = result.cid.toString();
    const url = `https://ipfs.io/ipfs/${cid}`;

    console.log(`File uploaded: ${req.file.originalname} -> ${cid}`);

    res.json({
      success: true,
      cid,
      url,
      fileName: req.file.originalname,
      fileType: req.file.mimetype,
      size: req.file.size,
    });
  } catch (error: any) {
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to upload to IPFS',
      message: error.message,
    });
  }
});

// Upload evidence with metadata
app.post('/api/upload-evidence', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { caseId, reporter, scamAddress, description } = req.body;

    // Upload file to IPFS
    const ipfsClient = await getIPFSClient();
    const fileResult = await ipfsClient.add(req.file.buffer);
    const fileCid = fileResult.cid.toString();
    const fileUrl = `https://ipfs.io/ipfs/${fileCid}`;

    // Create metadata object
    const metadata = {
      caseId,
      reporter,
      scamAddress,
      description,
      timestamp: Date.now(),
      evidenceFile: {
        name: req.file.originalname,
        type: req.file.mimetype,
        size: req.file.size,
        ipfsCid: fileCid,
        url: fileUrl,
      },
      uploadedAt: Date.now(),
    };

    // Upload metadata to IPFS
    const metadataResult = await ipfsClient.add(JSON.stringify(metadata, null, 2));
    const metadataCid = metadataResult.cid.toString();
    const metadataUrl = `https://ipfs.io/ipfs/${metadataCid}`;

    console.log(`Evidence uploaded: Case #${caseId} -> File: ${fileCid}, Metadata: ${metadataCid}`);

    res.json({
      success: true,
      fileUrl,
      fileCid,
      metadataUrl,
      metadataCid,
      metadata,
    });
  } catch (error: any) {
    console.error('Evidence upload error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to upload evidence',
      message: error.message,
    });
  }
});

// Upload JSON data
app.post('/api/upload-json', async (req: Request, res: Response) => {
  try {
    const { data } = req.body;

    if (!data) {
      return res.status(400).json({ error: 'No data provided' });
    }

    // Upload JSON to IPFS
    const ipfsClient = await getIPFSClient();
    const result = await ipfsClient.add(JSON.stringify(data, null, 2));
    const cid = result.cid.toString();
    const url = `https://ipfs.io/ipfs/${cid}`;

    console.log(`JSON uploaded: ${cid}`);

    res.json({
      success: true,
      cid,
      url,
    });
  } catch (error: any) {
    console.error('JSON upload error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to upload JSON',
      message: error.message,
    });
  }
});

// Fetch data from IPFS
app.get('/api/fetch/:cid', async (req: Request, res: Response) => {
  try {
    const { cid } = req.params;

    // Fetch from public gateway
    const response = await fetch(`https://ipfs.io/ipfs/${cid}`);
    if (!response.ok) {
      throw new Error('Failed to fetch from IPFS');
    }

    const data = await response.json();
    res.json({ success: true, data });
  } catch (error: any) {
    console.error('Fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch from IPFS',
      message: error.message,
    });
  }
});

// Error handling middleware
app.use((err: any, req: Request, res: Response, next: any) => {
  console.error('Server error:', err);
  res.status(500).json({
    success: false,
    error: err.message || 'Internal server error',
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 SolSafe API Server running on port ${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/health`);
  console.log(`📤 Upload endpoint: http://localhost:${PORT}/api/upload`);
  console.log(`🔗 IPFS gateway: ${process.env.IPFS_URL || 'https://ipfs.infura.io:5001'}`);
});

export default app;
