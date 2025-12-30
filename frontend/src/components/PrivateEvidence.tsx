// Private Evidence Submission with MPC Encryption
import React, { useState } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { Program, AnchorProvider, web3 } from '@project-serum/anchor';
import { encryptEvidenceForMPC } from '../utils/zkProofs';

interface PrivateEvidenceProps {
  caseId: number;
  jurorPublicKeys: PublicKey[];
  threshold: number;
  programId: PublicKey;
  idl: any;
}

export default function PrivateEvidence({
  caseId,
  jurorPublicKeys,
  threshold,
  programId,
  idl,
}: PrivateEvidenceProps) {
  const { connection } = useConnection();
  const wallet = useWallet();
  const [evidence, setEvidence] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const submitPrivateEvidence = async () => {
    if (!wallet.publicKey || !wallet.signTransaction) {
      setMessage('Please connect your wallet');
      return;
    }

    if (!evidence.trim()) {
      setMessage('Please enter evidence');
      return;
    }

    if (jurorPublicKeys.length < threshold) {
      setMessage(`Need at least ${threshold} jurors for MPC encryption`);
      return;
    }

    setLoading(true);
    setMessage('Encrypting evidence with Arcium MPC...');

    try {
      // Encrypt evidence using MPC threshold encryption
      const { encryptedEvidence, evidenceHash, shares } = await encryptEvidenceForMPC(
        evidence,
        jurorPublicKeys,
        threshold
      );

      setMessage('Submitting private evidence to blockchain...');

      const provider = new AnchorProvider(connection, wallet as any, {
        commitment: 'confirmed',
      });
      const program = new Program(idl, programId, provider);

      const [evidenceCommitment] = await PublicKey.findProgramAddress(
        [Buffer.from('evidence_commitment'), Buffer.from(new BigUint64Array([BigInt(caseId)]).buffer)],
        programId
      );

      // Submit private evidence
      const tx = await program.methods
        .initializePrivateEvidence(
          caseId,
          Array.from(evidenceHash),
          Array.from(encryptedEvidence),
          threshold
        )
        .accounts({
          reporter: wallet.publicKey,
          evidenceCommitment,
          systemProgram: web3.SystemProgram.programId,
        })
        .rpc();

      setMessage(`Private evidence submitted! Only ${threshold}/${jurorPublicKeys.length} jurors needed to decrypt. Tx: ${tx}`);
      setEvidence('');
      console.log('Private evidence submitted:', tx);
    } catch (error: any) {
      console.error('Error submitting private evidence:', error);
      setMessage(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="private-evidence-container" style={{
      padding: '20px',
      border: '2px solid #8b5cf6',
      borderRadius: '8px',
      background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(236, 72, 153, 0.1))',
      marginTop: '20px',
    }}>
      <h3 style={{ color: '#8b5cf6', marginBottom: '10px' }}>
        🔐 Private Evidence with MPC Encryption
      </h3>
      
      <div style={{ marginBottom: '15px', padding: '10px', background: 'rgba(255,255,255,0.7)', borderRadius: '4px' }}>
        <p style={{ fontSize: '14px', margin: '5px 0' }}>
          <strong>Arcium MPC:</strong> Evidence encrypted with threshold cryptography
        </p>
        <p style={{ fontSize: '14px', margin: '5px 0' }}>
          <strong>Threshold: {threshold}/{jurorPublicKeys.length}</strong> jurors needed to decrypt
        </p>
        <p style={{ fontSize: '14px', margin: '5px 0' }}>
          <strong>Privacy:</strong> Evidence only viewable by selected jurors
        </p>
      </div>

      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
          Evidence (will be encrypted):
        </label>
        <textarea
          value={evidence}
          onChange={(e) => setEvidence(e.target.value)}
          placeholder="Enter sensitive evidence details..."
          disabled={loading}
          rows={4}
          style={{
            width: '100%',
            padding: '10px',
            borderRadius: '4px',
            border: '1px solid #ddd',
            fontSize: '14px',
            fontFamily: 'monospace',
          }}
        />
        <p style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
          Max 1KB. Evidence will be encrypted before submission.
        </p>
      </div>

      <button
        onClick={submitPrivateEvidence}
        disabled={loading || !evidence.trim()}
        style={{
          width: '100%',
          padding: '12px 24px',
          background: loading || !evidence.trim() ? '#ccc' : '#8b5cf6',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: loading || !evidence.trim() ? 'not-allowed' : 'pointer',
          fontSize: '16px',
          fontWeight: 'bold',
        }}
      >
        {loading ? 'Encrypting & Submitting...' : 'Submit Private Evidence'}
      </button>

      {message && (
        <div style={{
          marginTop: '15px',
          padding: '10px',
          background: 'rgba(255,255,255,0.9)',
          borderRadius: '4px',
          fontSize: '14px',
          wordBreak: 'break-word',
        }}>
          {message}
        </div>
      )}
    </div>
  );
}
