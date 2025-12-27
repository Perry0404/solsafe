import { useMemo, useState, useEffect } from 'react';
import { useConnection, useWallet, useAnchorWallet } from '@solana/wallet-adapter-react';
import { Program, AnchorProvider, Idl, web3 } from '@coral-xyz/anchor';
import { PublicKey, Transaction } from '@solana/web3.js';
import { signAndSendTransaction } from '../utils/transactionUtils';

// Import your IDL
import IDL from '../idl/solsafe_program.json';

const PROGRAM_ID = new PublicKey('FfV3AHU6WS7aPz53DnVvWBMEZR46ydGkEtKpLiKfRTrR');

interface CaseData {
  publicKey: PublicKey;
  account: {
    caseId: number;
    scamAddress: PublicKey;
    evidence: string;
    jurors: PublicKey[];
    jurorCandidates: PublicKey[];
    votesFor: number;
    votesAgainst: number;
    votedJurors: PublicKey[];
    status: any;
    state: any;
    vrfRequest: PublicKey;
    bump: number;
  };
}

/**
 * Updated useCases hook with manual transaction signing
 * This demonstrates both methods:
 * 1. Using .rpc() (auto-signing via Anchor)
 * 2. Using manual signTransaction via wallet adapter
 */
export function useCasesWithManualSigning() {
  const { connection } = useConnection();
  const wallet = useWallet();
  const anchorWallet = useAnchorWallet();
  const { publicKey } = wallet;

  const [cases, setCases] = useState<CaseData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Create program instance
  const program = useMemo(() => {
    if (!anchorWallet) {
      console.warn('AnchorWallet not ready');
      return null;
    }

    try {
      const provider = new AnchorProvider(
        connection,
        anchorWallet,
        { commitment: 'confirmed' }
      );

      return new Program(IDL as Idl, PROGRAM_ID, provider);
    } catch (err) {
      console.error('Error creating program:', err);
      return null;
    }
  }, [connection, anchorWallet]);

  // Fetch all cases from blockchain
  const fetchCases = async () => {
    if (!program) {
      console.warn('Program not initialized');
      return [];
    }

    try {
      setLoading(true);
      setError(null);

      const cases = await program.account.caseAccount.all();
      setCases(cases as CaseData[]);
      return cases;
    } catch (err) {
      console.error('Error fetching cases:', err);
      setError('Failed to fetch cases from blockchain');
      return [];
    } finally {
      setLoading(false);
    }
  };

  /**
   * METHOD 1: Using .rpc() - Auto-signing (Current approach)
   * This is the simplest method and what you're currently using
   */
  const submitCaseAutoSign = async (
    caseId: number,
    evidenceUrl: string,
    scamAddress: string
  ) => {
    if (!program || !publicKey) {
      throw new Error('Wallet not connected');
    }

    try {
      const scamPubkey = new PublicKey(scamAddress);
      const caseIdBuffer = Buffer.alloc(8);
      caseIdBuffer.writeBigUInt64LE(BigInt(caseId));
      
      const [casePda, bump] = PublicKey.findProgramAddressSync(
        [Buffer.from('case'), caseIdBuffer],
        PROGRAM_ID
      );

      // .rpc() automatically signs with the wallet and sends the transaction
      const tx = await program.methods
        .submitEvidence(caseId, evidenceUrl, scamPubkey, bump)
        .accounts({
          caseAccount: casePda,
          reporter: publicKey,
          systemProgram: web3.SystemProgram.programId,
        })
        .rpc();

      console.log('Case submitted with auto-signing:', tx);
      await fetchCases();
      return tx;
    } catch (err) {
      console.error('Error submitting case:', err);
      throw err;
    }
  };

  /**
   * METHOD 2: Using manual signTransaction
   * This gives you more control over the transaction signing process
   */
  const submitCaseManualSign = async (
    caseId: number,
    evidenceUrl: string,
    scamAddress: string
  ) => {
    if (!program || !publicKey || !wallet.signTransaction) {
      throw new Error('Wallet not connected or does not support signing');
    }

    try {
      const scamPubkey = new PublicKey(scamAddress);
      const caseIdBuffer = Buffer.alloc(8);
      caseIdBuffer.writeBigUInt64LE(BigInt(caseId));
      
      const [casePda, bump] = PublicKey.findProgramAddressSync(
        [Buffer.from('case'), caseIdBuffer],
        PROGRAM_ID
      );

      // Build the instruction
      const instruction = await program.methods
        .submitEvidence(caseId, evidenceUrl, scamPubkey, bump)
        .accounts({
          caseAccount: casePda,
          reporter: publicKey,
          systemProgram: web3.SystemProgram.programId,
        })
        .instruction();

      // Create transaction
      const transaction = new Transaction().add(instruction);
      
      // Get recent blockhash
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;

      // Sign the transaction using wallet.signTransaction
      // This will trigger the wallet popup for signature
      const signedTransaction = await wallet.signTransaction(transaction);

      // Send the signed transaction
      const signature = await connection.sendRawTransaction(signedTransaction.serialize());

      // Confirm the transaction
      await connection.confirmTransaction({
        signature,
        blockhash,
        lastValidBlockHeight,
      });

      console.log('Case submitted with manual signing:', signature);
      await fetchCases();
      return signature;
    } catch (err) {
      console.error('Error submitting case:', err);
      throw err;
    }
  };

  /**
   * METHOD 3: Using the utility function
   */
  const submitCaseWithUtils = async (
    caseId: number,
    evidenceUrl: string,
    scamAddress: string
  ) => {
    if (!program || !publicKey) {
      throw new Error('Wallet not connected');
    }

    try {
      const scamPubkey = new PublicKey(scamAddress);
      const caseIdBuffer = Buffer.alloc(8);
      caseIdBuffer.writeBigUInt64LE(BigInt(caseId));
      
      const [casePda, bump] = PublicKey.findProgramAddressSync(
        [Buffer.from('case'), caseIdBuffer],
        PROGRAM_ID
      );

      // Build the instruction
      const instruction = await program.methods
        .submitEvidence(caseId, evidenceUrl, scamPubkey, bump)
        .accounts({
          caseAccount: casePda,
          reporter: publicKey,
          systemProgram: web3.SystemProgram.programId,
        })
        .instruction();

      // Use utility function to sign and send
      const signature = await signAndSendTransaction(
        connection,
        wallet,
        [instruction]
      );

      console.log('Case submitted using utility:', signature);
      await fetchCases();
      return signature;
    } catch (err) {
      console.error('Error submitting case:', err);
      throw err;
    }
  };

  /**
   * Vote with manual signing
   */
  const voteOnCaseManualSign = async (caseId: number, approve: boolean) => {
    if (!program || !publicKey || !wallet.signTransaction) {
      throw new Error('Wallet not connected or does not support signing');
    }

    try {
      const [casePda] = PublicKey.findProgramAddressSync(
        [Buffer.from('case'), Buffer.from(caseId.toString().padStart(8, '0'))],
        PROGRAM_ID
      );

      const [configPda] = PublicKey.findProgramAddressSync(
        [Buffer.from('config')],
        PROGRAM_ID
      );

      // Build instruction
      const instruction = await program.methods
        .vote(approve)
        .accounts({
          juror: publicKey,
          caseAccount: casePda,
          config: configPda,
          systemProgram: web3.SystemProgram.programId,
        })
        .instruction();

      // Manual signing process
      const transaction = new Transaction().add(instruction);
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;

      const signedTransaction = await wallet.signTransaction(transaction);
      const signature = await connection.sendRawTransaction(signedTransaction.serialize());

      await connection.confirmTransaction({
        signature,
        blockhash,
        lastValidBlockHeight,
      });

      console.log('Vote submitted with manual signing:', signature);
      await fetchCases();
      return signature;
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
    
    // Functions with different signing methods
    fetchCases,
    
    // Auto-signing (current method)
    submitCaseAutoSign,
    
    // Manual signing methods
    submitCaseManualSign,
    submitCaseWithUtils,
    voteOnCaseManualSign,
    
    // Utils
    program,
    publicKey,
    wallet,
  };
}
