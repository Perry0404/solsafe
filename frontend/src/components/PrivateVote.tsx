// Private Voting Component with ZK Proofs
import React, { useState } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey, Transaction } from '@solana/web3.js';
import { Program, AnchorProvider, web3 } from '@project-serum/anchor';
import {
  generateVoteCommitment,
  generateVoteProof,
  verifyVoteReveal,
  VoteCommitmentStore,
  ZkProof,
} from '../utils/zkProofs';

interface PrivateVoteProps {
  caseId: number;
  programId: PublicKey;
  idl: any;
}

export default function PrivateVote({ caseId, programId, idl }: PrivateVoteProps) {
  const { connection } = useConnection();
  const wallet = useWallet();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [voteCommitted, setVoteCommitted] = useState(false);
  const [showReveal, setShowReveal] = useState(false);

  const commitVote = async (vote: boolean) => {
    if (!wallet.publicKey || !wallet.signTransaction) {
      setMessage('Please connect your wallet');
      return;
    }

    setLoading(true);
    setMessage('Generating ZK proof...');

    try {
      // Generate vote commitment and ZK proof
      const commitment = await generateVoteCommitment(caseId, vote);
      const zkProof = await generateVoteProof(commitment);

      // Save commitment locally (keep salt secret!)
      VoteCommitmentStore.save(caseId, commitment);

      setMessage('Submitting private vote to blockchain...');

      // Create Anchor provider and program
      const provider = new AnchorProvider(connection, wallet as any, {
        commitment: 'confirmed',
      });
      const program = new Program(idl, programId, provider);

      // Derive PDAs
      const [voteCommitmentAccount] = await PublicKey.findProgramAddress(
        [
          Buffer.from('vote_commitment'),
          Buffer.from(new BigUint64Array([BigInt(caseId)]).buffer),
          wallet.publicKey.toBuffer(),
        ],
        programId
      );

      const [caseAccount] = await PublicKey.findProgramAddress(
        [Buffer.from('case'), Buffer.from(new BigUint64Array([BigInt(caseId)]).buffer)],
        programId
      );

      const [compressedState] = await PublicKey.findProgramAddress(
        [Buffer.from('compressed_votes'), Buffer.from(new BigUint64Array([BigInt(caseId)]).buffer)],
        programId
      );

      // Prepare ZK proof for Anchor
      const zkProofFormatted = {
        proofData: Array.from(zkProof.proofData),
        publicInputs: Array.from(zkProof.publicInputs),
        proofType: { voteCommitment: {} },
      };

      // Submit private vote
      const tx = await program.methods
        .privateVote(
          caseId,
          Array.from(commitment.commitment),
          Array.from(commitment.nullifier),
          zkProofFormatted
        )
        .accounts({
          juror: wallet.publicKey,
          voteCommitmentAccount,
          caseAccount,
          compressedState,
          systemProgram: web3.SystemProgram.programId,
        })
        .rpc();

      setMessage(`Vote committed privately! Signature: ${tx}`);
      setVoteCommitted(true);
      console.log('Private vote committed:', tx);
    } catch (error: any) {
      console.error('Error committing vote:', error);
      setMessage(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const revealVote = async () => {
    if (!wallet.publicKey || !wallet.signTransaction) {
      setMessage('Please connect your wallet');
      return;
    }

    const storedCommitment = VoteCommitmentStore.get(caseId);
    if (!storedCommitment) {
      setMessage('No stored commitment found. Cannot reveal vote.');
      return;
    }

    setLoading(true);
    setMessage('Revealing vote...');

    try {
      // Verify the reveal locally first
      const isValid = await verifyVoteReveal(
        storedCommitment.commitment,
        storedCommitment.vote,
        storedCommitment.salt
      );

      if (!isValid) {
        throw new Error('Vote reveal verification failed');
      }

      const provider = new AnchorProvider(connection, wallet as any, {
        commitment: 'confirmed',
      });
      const program = new Program(idl, programId, provider);

      const [voteAccount] = await PublicKey.findProgramAddress(
        [
          Buffer.from('vote_commitment'),
          Buffer.from(new BigUint64Array([BigInt(caseId)]).buffer),
          wallet.publicKey.toBuffer(),
        ],
        programId
      );

      const [caseAccount] = await PublicKey.findProgramAddress(
        [Buffer.from('case'), Buffer.from(new BigUint64Array([BigInt(caseId)]).buffer)],
        programId
      );

      // Reveal vote
      const tx = await program.methods
        .revealVote(storedCommitment.vote, Array.from(storedCommitment.salt))
        .accounts({
          juror: wallet.publicKey,
          voteAccount,
          caseAccount,
        })
        .rpc();

      setMessage(`Vote revealed! Your vote: ${storedCommitment.vote ? 'APPROVE' : 'REJECT'}. Tx: ${tx}`);
      console.log('Vote revealed:', tx);
      
      // Clean up stored commitment
      VoteCommitmentStore.remove(caseId);
    } catch (error: any) {
      console.error('Error revealing vote:', error);
      setMessage(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="private-vote-container" style={{
      padding: '20px',
      border: '2px solid #6366f1',
      borderRadius: '8px',
      background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(168, 85, 247, 0.1))',
      marginTop: '20px',
    }}>
      <h3 style={{ color: '#6366f1', marginBottom: '10px' }}>
        🔒 Private Voting with Zero-Knowledge Proofs
      </h3>
      
      <div style={{ marginBottom: '15px', padding: '10px', background: 'rgba(255,255,255,0.7)', borderRadius: '4px' }}>
        <p style={{ fontSize: '14px', margin: '5px 0' }}>
          <strong>Light Protocol:</strong> Your vote is compressed into an efficient state tree
        </p>
        <p style={{ fontSize: '14px', margin: '5px 0' }}>
          <strong>ZK Proofs:</strong> Vote validity proven without revealing your choice
        </p>
        <p style={{ fontSize: '14px', margin: '5px 0' }}>
          <strong>Privacy:</strong> Only you can reveal your vote later
        </p>
      </div>

      {!voteCommitted ? (
        <div>
          <p style={{ marginBottom: '15px' }}>Cast your private vote for Case #{caseId}</p>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
            <button
              onClick={() => commitVote(true)}
              disabled={loading}
              style={{
                flex: 1,
                padding: '12px 24px',
                background: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '16px',
                fontWeight: 'bold',
              }}
            >
              ✓ Approve (Private)
            </button>
            <button
              onClick={() => commitVote(false)}
              disabled={loading}
              style={{
                flex: 1,
                padding: '12px 24px',
                background: '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '16px',
                fontWeight: 'bold',
              }}
            >
              ✗ Reject (Private)
            </button>
          </div>
        </div>
      ) : (
        <div>
          <p style={{ color: '#10b981', fontWeight: 'bold', marginBottom: '15px' }}>
            ✓ Vote committed privately!
          </p>
          <button
            onClick={() => setShowReveal(!showReveal)}
            style={{
              padding: '10px 20px',
              background: '#6366f1',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              marginBottom: '10px',
            }}
          >
            {showReveal ? 'Hide Reveal Option' : 'Reveal Vote (Optional)'}
          </button>
          
          {showReveal && (
            <div style={{ marginTop: '10px', padding: '10px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '4px' }}>
              <p style={{ fontSize: '14px', marginBottom: '10px' }}>
                ⚠️ Warning: Revealing your vote will make it public
              </p>
              <button
                onClick={revealVote}
                disabled={loading}
                style={{
                  padding: '10px 20px',
                  background: '#f59e0b',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                }}
              >
                Reveal My Vote
              </button>
            </div>
          )}
        </div>
      )}

      {loading && (
        <div style={{ textAlign: 'center', marginTop: '10px' }}>
          <div className="spinner" style={{ display: 'inline-block' }}>Loading...</div>
        </div>
      )}

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
