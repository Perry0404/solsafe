import { useMemo, useState, useEffect } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { Program, AnchorProvider, Idl, web3 } from '@coral-xyz/anchor';
import { PublicKey } from '@solana/web3.js';

// Import your IDL
// import IDL from '../idl/solsafe_program.json';

const PROGRAM_ID = new PublicKey('5cJv3iWdbqPTgXMf6iWKYJoXUwVMtMWfZYrwi2w9LWNJ');

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
    status: any; // CaseStatus enum
    state: any; // CaseState enum
    vrfRequest: PublicKey;
    bump: number;
  };
}

export function useCases() {
  const { connection } = useConnection();
  const wallet = useWallet();
  const { publicKey } = wallet;

  const [cases, setCases] = useState<CaseData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Create program instance
  const program = useMemo(() => {
    if (!wallet.publicKey) return null;

    try {
      const provider = new AnchorProvider(
        connection,
        wallet as any,
        { commitment: 'confirmed' }
      );

      // NOTE: Replace with your actual IDL
      // return new Program(IDL as Idl, PROGRAM_ID, provider);
      return null; // Placeholder until IDL is imported
    } catch (err) {
      console.error('Error creating program:', err);
      return null;
    }
  }, [connection, wallet.publicKey]);

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

  // Fetch specific case by ID
  const fetchCaseById = async (caseId: number) => {
    if (!program) return null;

    try {
      const [casePda] = PublicKey.findProgramAddressSync(
        [Buffer.from('case'), Buffer.from(caseId.toString().padStart(8, '0'))],
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
    caseId: number,
    evidenceUrl: string,
    scamAddress: string
  ) => {
    if (!program || !publicKey) {
      throw new Error('Wallet not connected');
    }

    try {
      const scamPubkey = new PublicKey(scamAddress);
      const [casePda, bump] = PublicKey.findProgramAddressSync(
        [Buffer.from('case'), Buffer.from(caseId.toString().padStart(8, '0'))],
        PROGRAM_ID
      );

      const tx = await program.methods
        .submitEvidence(caseId, evidenceUrl, scamPubkey, bump)
        .accounts({
          caseAccount: casePda,
          reporter: publicKey,
          systemProgram: web3.SystemProgram.programId,
        })
        .rpc();

      console.log('Case submitted:', tx);
      await fetchCases(); // Refresh cases
      return tx;
    } catch (err) {
      console.error('Error submitting case:', err);
      throw err;
    }
  };

  // Vote on a case
  const voteOnCase = async (caseId: number, approve: boolean) => {
    if (!program || !publicKey) {
      throw new Error('Wallet not connected');
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
  const requestJurors = async (caseId: number, vrfAccount: PublicKey) => {
    if (!program || !publicKey) {
      throw new Error('Wallet not connected');
    }

    try {
      const [casePda] = PublicKey.findProgramAddressSync(
        [Buffer.from('case'), Buffer.from(caseId.toString().padStart(8, '0'))],
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
  const selectJurors = async (caseId: number, vrfAccount: PublicKey) => {
    if (!program || !publicKey) {
      throw new Error('Wallet not connected');
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
    
    // Utils
    program,
    publicKey,
  };
}

// Helper function to format case status
export function formatCaseStatus(status: any): string {
  if (status.open) return 'Open';
  if (status.closed) return 'Closed';
  if (status.frozen) return 'Frozen';
  return 'Unknown';
}

// Helper function to format case state
export function formatCaseState(state: any): string {
  if (state.pendingJurors) return 'Pending Jurors';
  if (state.voting) return 'Voting';
  if (state.approved) return 'Approved';
  if (state.rejected) return 'Rejected';
  if (state.executed) return 'Executed';
  return 'Unknown';
}
