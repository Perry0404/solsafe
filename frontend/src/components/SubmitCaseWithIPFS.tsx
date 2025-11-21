import React, { useState } from 'react';
import { uploadEvidence, uploadEvidenceWithMetadata } from '../utils/ipfs';

interface SubmitCaseWithIPFSProps {
  walletAddress: string;
  onSubmit: (caseData: {
    scamAddress: string;
    description: string;
    evidenceUrl: string;
    metadataUrl?: string;
  }) => void;
}

export default function SubmitCaseWithIPFS({ walletAddress, onSubmit }: SubmitCaseWithIPFSProps) {
  const [scamAddress, setScamAddress] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!scamAddress || !description) {
      alert('Please fill in all required fields');
      return;
    }

    if (!file) {
      alert('Please attach evidence file (image or PDF)');
      return;
    }

    try {
      setUploading(true);
      setUploadProgress('Uploading evidence to IPFS...');

      // Upload with metadata
      const { fileUrl, metadataUrl } = await uploadEvidenceWithMetadata(file, {
        caseId: `case_${Date.now()}`,
        reporter: walletAddress,
        scamAddress,
        description,
        timestamp: Date.now(),
      });

      setUploadProgress('Evidence uploaded! Submitting case...');

      // Call parent's onSubmit with IPFS URLs
      onSubmit({
        scamAddress,
        description,
        evidenceUrl: fileUrl,
        metadataUrl,
      });

      // Reset form
      setScamAddress('');
      setDescription('');
      setFile(null);
      setUploadProgress('');
      
      alert(`Case submitted successfully!\n\nEvidence URL: ${fileUrl}\nMetadata URL: ${metadataUrl}`);
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload evidence to IPFS. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="submit-case-ipfs">
      <h3>Submit Case with IPFS Evidence</h3>
      
      <form onSubmit={handleSubmit} style={{ marginTop: '20px' }}>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>
            Scammer Wallet Address *
          </label>
          <input
            type="text"
            className="input"
            value={scamAddress}
            onChange={(e) => setScamAddress(e.target.value)}
            placeholder="Enter Solana or EVM wallet address"
            disabled={uploading}
            required
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>
            Case Description *
          </label>
          <textarea
            className="input"
            rows={6}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the scam: what happened, transaction IDs, timeline, amounts stolen, etc."
            disabled={uploading}
            required
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>
            Evidence File (Image/PDF) *
          </label>
          <input
            type="file"
            accept="image/*,.pdf"
            onChange={handleFileChange}
            disabled={uploading}
            style={{
              display: 'block',
              padding: '10px',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '8px',
              width: '100%',
              background: 'rgba(255,255,255,0.05)',
              color: '#fff',
            }}
            required
          />
          {file && (
            <div style={{ marginTop: '8px', fontSize: '0.9rem', opacity: 0.8 }}>
              Selected: {file.name} ({(file.size / 1024).toFixed(2)} KB)
            </div>
          )}
        </div>

        {uploadProgress && (
          <div
            style={{
              padding: '12px',
              background: 'rgba(138, 43, 226, 0.2)',
              borderRadius: '8px',
              marginBottom: '15px',
              textAlign: 'center',
            }}
          >
            {uploadProgress}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: '0.85rem', opacity: 0.7 }}>
            * Evidence will be permanently stored on IPFS
          </div>
          <button
            type="submit"
            className="cta"
            disabled={uploading}
            style={{
              opacity: uploading ? 0.5 : 1,
              cursor: uploading ? 'not-allowed' : 'pointer',
            }}
          >
            {uploading ? 'Uploading...' : 'Submit Case'}
          </button>
        </div>
      </form>

      <style>{`
        .input {
          width: 100%;
          padding: 12px;
          border-radius: 8px;
          border: 1px solid rgba(255, 255, 255, 0.2);
          background: rgba(255, 255, 255, 0.05);
          color: #fff;
          font-family: 'Poppins', sans-serif;
        }
        .input:focus {
          outline: none;
          border-color: #8a2be2;
        }
        .input:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .cta {
          background: linear-gradient(90deg, #7b1fa2, #9932cc);
          padding: 12px 24px;
          border-radius: 8px;
          font-weight: 700;
          border: none;
          color: white;
          cursor: pointer;
          transition: transform 0.2s;
        }
        .cta:hover:not(:disabled) {
          transform: scale(1.05);
        }
      `}</style>
    </div>
  );
}
