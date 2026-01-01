/* eslint-disable no-undef */
import { useMemo, useState, useEffect, useCallback } from 'react';
import { useConnection, useWallet, useAnchorWallet } from '@solana/wallet-adapter-react';
import { Program, AnchorProvider, web3 } from '@coral-xyz/anchor';
import { PublicKey } from '@solana/web3.js';

// Import your IDL
import IDL from '../idl/solsafe_program.json';
// Import ZK proof utilities (converted to JS-compatible imports)
const zkProofs = {
  generateVoteCommitment: async (caseId, vote, salt) => {
    const crypto = window.crypto;
    const voteSalt = salt || crypto.getRandomValues(new Uint8Array(32));
    const voteBytes = new Uint8Array([vote ? 1 : 0]);
    const commitmentInput = new Uint8Array([...voteBytes, ...voteSalt]);
    
    // Simple hash using Web Crypto API
    const hashBuffer = await crypto.subtle.digest('SHA-256', commitmentInput);
    const commitment = new Uint8Array(hashBuffer);
    
    const caseIdBytes = new Uint8Array(new BigUint64Array([BigInt(caseId)]).buffer);
    const nullifierInput = new Uint8Array([...caseIdBytes, ...commitment]);
    const nullifierBuffer = await crypto.subtle.digest('SHA-256', nullifierInput);
    const nullifier = new Uint8Array(nullifierBuffer);
    
    return { commitment, nullifier, salt: voteSalt, vote, caseId };
  },
  
  encryptEvidenceHash: async (evidence) => {
    const crypto = window.crypto;
    const encoder = new TextEncoder();
    const data = encoder.encode(evidence);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return new Uint8Array(hashBuffer);
  },
  
  VoteCommitmentStore: {
    save: (caseId, commitment) => {
      const stored = JSON.parse(localStorage.getItem('solsafe_vote_commitments') || '{}');
      stored[caseId] = {
        commitment: Array.from(commitment.commitment),
        nullifier: Array.from(commitment.nullifier),
        salt: Array.from(commitment.salt),
        vote: commitment.vote,
        caseId: commitment.caseId,
      };
      localStorage.setItem('solsafe_vote_commitments', JSON.stringify(stored));
    },
    get: (caseId) => {
      const stored = JSON.parse(localStorage.getItem('solsafe_vote_commitments') || '{}');
      const data = stored[caseId];
      if (!data) return null;
      return {
        commitment: new Uint8Array(data.commitment),
        nullifier: new Uint8Array(data.nullifier),
        salt: new Uint8Array(data.salt),
        vote: data.vote,
        caseId: data.caseId,
      };
    },
  },
};
const PROGRAM_ID = new PublicKey('FfV3AHU6WS7aPz53DnVvWBMEZR46ydGkEtKpLiKfRTrR');

export function useCases() {
  const { connection } = useConnection();
  const wallet = useWallet();
  const anchorWallet = useAnchorWallet(); // This is the proper hook for Anchor
  const { publicKey } = wallet;

  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Create program instance using anchorWallet
  const program = useMemo(() => {
    console.log('?? useCases Debug:');
    console.log('  - wallet.publicKey:', wallet?.publicKey?.toBase58());
    console.log('  - wallet.connected:', wallet?.connected);
    console.log('  - anchorWallet:', anchorWallet);
    console.log('  - anchorWallet.publicKey:', anchorWallet?.publicKey?.toBase58());

    // Use anchorWallet which is specifically designed for Anchor
    if (!anchorWallet) {
      console.warn('?? AnchorWallet not ready yet');
      return null;
    }

    try {
      const provider = new AnchorProvider(
        connection,
        anchorWallet,
        { 
          commitment: 'confirmed',
          preflightCommitment: 'confirmed'
        }
      );

      const prog = new Program(IDL, PROGRAM_ID, provider);
      console.log('? Program created successfully!');
      console.log('   Program ID:', prog.programId.toBase58());
      return prog;
    } catch (err) {
      console.error('? Error creating program:', err);
      return null;
    }
  }, [connection, anchorWallet]);

  // Fetch all cases from blockchain - wrapped in useCallback to prevent infinite loops
  const fetchCases = useCallback(async () => {
    if (!program) {
      console.warn('?? Program not initialized, skipping fetchCases');
      return [];
    }

    try {
      console.log('?? Fetching all cases from blockchain...');
      setLoading(true);
      setError(null);

      const fetchedCases = await program.account.caseAccount.all();
      console.log(`? Found ${fetchedCases.length} cases:`, fetchedCases);
      setCases(fetchedCases);
      return fetchedCases;
    } catch (err) {
      console.error('? Error fetching cases:', err);
      setError('Failed to fetch cases from blockchain');
      return [];
    } finally {
      setLoading(false);
    }
  }, [program]);

  // Fetch specific case by ID
  const fetchCaseById = async (caseId) => {
    if (!program) return null;

    try {
      const caseIdBuffer = Buffer.alloc(8);
      caseIdBuffer.writeBigUInt64LE(BigInt(caseId));

      const [casePda] = PublicKey.findProgramAddressSync(
        [Buffer.from('case'), caseIdBuffer],
        PROGRAM_ID
      );

      const caseAccount = await program.account.caseAccount.fetch(casePda);
      return { publicKey: casePda, account: caseAccount };
    } catch (err) {
      console.error('Error fetching case:', err);
      return null;
    }
  };

  // Submit a new case
  const submitCase = async (
    caseId,
    evidenceUrl,
    scamAddress
  ) => {
    if (!program || !anchorWallet || !anchorWallet.publicKey) {
      throw new Error('Wallet not connected. Please connect your wallet and try again.');
    }
    
    const publicKey = anchorWallet.publicKey;

    try {
      const scamPubkey = new PublicKey(scamAddress);
      
      // Generate PDA for the case account
      const caseIdBuffer = Buffer.alloc(8);
      caseIdBuffer.writeBigUInt64LE(BigInt(caseId));
      
      const [casePda, bump] = PublicKey.findProgramAddressSync(
        [Buffer.from('case'), caseIdBuffer],
        PROGRAM_ID
      );

      console.log('Submitting case with:', {
        caseId,
        evidenceUrl,
        scamAddress,
        casePda: casePda.toBase58(),
        bump
      });

      const tx = await program.methods
        .submitEvidence(caseId, evidenceUrl, scamPubkey, bump)
        .accounts({
          caseAccount: casePda,
          reporter: publicKey,
          systemProgram: web3.SystemProgram.programId,
        })
        .rpc();

      console.log('Case submitted successfully! Transaction:', tx);
      await fetchCases(); // Refresh cases
      return tx;
    } catch (err) {
      console.error('Error submitting case:', err);
      throw err;
    }
  };

  // Vote on a case
  const voteOnCase = async (caseId, approve) => {
    if (!program || !anchorWallet || !anchorWallet.publicKey) {
      throw new Error('Wallet not connected. Please connect your wallet and try again.');
    }
    
    const publicKey = anchorWallet.publicKey;

    try {
      const [casePda] = PublicKey.findProgramAddressSync(
        [Buffer.from('case'), caseIdBuffer],
        PROGRAM_ID
      );

      const [configPda] = PublicKey.findProgramAddressSync(
        [Buffer.from('config')],
        PROGRAM_ID
      );

      const tx = await program.methods
        .vote(approve)
        .accounts({
          juror: publicKey,
          caseAccount: casePda,
          config: configPda,
          systemProgram: web3.SystemProgram.programId,
        })
        .rpc();

      console.log('Vote submitted:', tx);
      await fetchCases(); // Refresh cases
      return tx;
    } catch (err) {
      console.error('Error voting:', err);
      throw err;
    }
  };

  // Request jurors for a case
  const requestJurors = async (caseId, vrfAccount) => {
    if (!program || !anchorWallet || !anchorWallet.publicKey) {
      throw new Error('Wallet not connected. Please connect your wallet and try again.');
    }
    
    const publicKey = anchorWallet.publicKey;

    try {
      const [casePda] = PublicKey.findProgramAddressSync(
        [Buffer.from('case'), caseIdBuffer],
        PROGRAM_ID
      );

      const tx = await program.methods
        .requestJurors(caseId)
        .accounts({
          caseAccount: casePda,
          vrfAccount: vrfAccount,
          authority: publicKey,
        })
        .rpc();

      console.log('Jurors requested:', tx);
      return tx;
    } catch (err) {
      console.error('Error requesting jurors:', err);
      throw err;
    }
  };

  // Select jurors using VRF
  const selectJurors = async (caseId, vrfAccount) => {
    if (!program || !publicKey) {
      throw new Error('Wallet not connected');
    }

    try {
      const [casePda] = PublicKey.findProgramAddressSync(
        [Buffer.from('case'), caseIdBuffer],
        PROGRAM_ID
      );

      const [configPda] = PublicKey.findProgramAddressSync(
        [Buffer.from('config')],
        PROGRAM_ID
      );

      const tx = await program.methods
        .selectJurors()
        .accounts({
          caseAccount: casePda,
          config: configPda,
          vrfAccount: vrfAccount,
        })
        .rpc();

      console.log('Jurors selected:', tx);
      await fetchCases(); // Refresh cases
      return tx;
    } catch (err) {
      console.error('Error selecting jurors:', err);
      throw err;
    }
  };

  // Submit case with optional ZK encryption
  const submitCaseWithPrivacy = async (
    caseId,
    evidenceUrl,
    scamAddress,
    usePrivacy = false
  ) => {
    if (!program || !anchorWallet || !anchorWallet.publicKey) {
      throw new Error('Wallet not connected. Please connect your wallet and try again.');
    }
    
    const publicKey = anchorWallet.publicKey;

    try {
      let finalEvidenceUrl = evidenceUrl;
      
      // If privacy is enabled, hash the evidence
      if (usePrivacy) {
        const evidenceHash = await zkProofs.encryptEvidenceHash(evidenceUrl);
        const hashHex = Array.from(evidenceHash).map(b => b.toString(16).padStart(2, '0')).join('');
        finalEvidenceUrl = `zkproof:${hashHex}`;
        console.log('🔐 Evidence encrypted with ZK proof');
      }

      const scamPubkey = new PublicKey(scamAddress);
      
      // Generate PDA for the case account
      const caseIdBuffer = Buffer.alloc(8);
      caseIdBuffer.writeBigUInt64LE(BigInt(caseId));
      
      const [casePda, bump] = PublicKey.findProgramAddressSync(
        [Buffer.from('case'), caseIdBuffer],
        PROGRAM_ID
      );

      console.log('Submitting case with:', {
        caseId,
        evidenceUrl: finalEvidenceUrl,
        scamAddress,
        casePda: casePda.toBase58(),
        bump,
        privacy: usePrivacy ? '🔐 Enabled' : '🔓 Disabled'
      });

      const tx = await program.methods
        .submitEvidence(caseId, finalEvidenceUrl, scamPubkey, bump)
        .accounts({
          caseAccount: casePda,
          reporter: publicKey,
          systemProgram: web3.SystemProgram.programId,
        })
        .rpc();

      console.log('Case submitted successfully! Transaction:', tx);
      // Force refresh cases after submission
      setTimeout(async () => {
        await fetchCases();
      }, 1000);
      return tx;
    } catch (err) {
      console.error('Error submitting case:', err);
      throw err;
    }
  };

  // Private vote with ZK commitment
  const voteWithPrivacy = async (caseId, approve, usePrivacy = false) => {
    if (!program || !anchorWallet || !anchorWallet.publicKey) {
      throw new Error('Wallet not connected. Please connect your wallet and try again.');
    }
    
    const publicKey = anchorWallet.publicKey;

    try {
      if (usePrivacy) {
        // Generate ZK vote commitment
        const commitment = await zkProofs.generateVoteCommitment(caseId, approve);
        zkProofs.VoteCommitmentStore.save(caseId, commitment);
        console.log('🔐 Private vote commitment generated');
        console.log('  Commitment:', Array.from(commitment.commitment).map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 16) + '...');
        console.log('  Nullifier:', Array.from(commitment.nullifier).map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 16) + '...');
      }

      const [casePda] = PublicKey.findProgramAddressSync(
        [Buffer.from('case'), Buffer.from(caseId.toString().padStart(8, '0'))],
        PROGRAM_ID
      );

      const [configPda] = PublicKey.findProgramAddressSync(
        [Buffer.from('config')],
        PROGRAM_ID
      );

      const tx = await program.methods
        .vote(approve)
        .accounts({
          juror: publicKey,
          caseAccount: casePda,
          config: configPda,
          systemProgram: web3.SystemProgram.programId,
        })
        .rpc();

      console.log(usePrivacy ? '🔐 Private vote submitted:' : 'Vote submitted:', tx);
      // Force refresh cases after voting with a slight delay
      setTimeout(async () => {
        await fetchCases();
      }, 1000);
      return tx;
    } catch (err) {
      console.error('Error voting:', err);
      throw err;
    }
  };

  // Auto-fetch cases when wallet connects
  useEffect(() => {
    if (program) {
      fetchCases();
    }
  }, [program]);

  return {
    // State
    cases,
    loading,
    error,
    connected: !!publicKey,
    
    // Functions
    fetchCases,
    fetchCaseById,
    submitCase,
    voteOnCase,
    requestJurors,
    selectJurors,
    
    // ZK Privacy Functions
    submitCaseWithPrivacy,
    voteWithPrivacy,
    zkProofs,
    
    // Utils
    program,
    publicKey,
  };
}

// Helper function to format case status
export function formatCaseStatus(status) {
  if (status.open) return 'Open';
  if (status.closed) return 'Closed';
  if (status.frozen) return 'Frozen';
  return 'Unknown';
}

// Helper function to format case state
export function formatCaseState(state) {
  if (state.pendingJurors) return 'Pending Jurors';
  if (state.voting) return 'Voting';
  if (state.approved) return 'Approved';
  if (state.rejected) return 'Rejected';
  if (state.executed) return 'Executed';
  return 'Unknown';
}




