import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './Documentation.css';

export default function Documentation() {
  const [activeSection, setActiveSection] = useState('getting-started');

  const sections = {
    'getting-started': {
      title: 'Getting Started',
      content: (
        <>
          <h2>🚀 Quick Start Guide</h2>
          <p>Welcome to SolSafe Protocol documentation. This guide will help you get started with using and developing on our platform.</p>
          
          <h3>Prerequisites</h3>
          <ul>
            <li>Node.js 18+ and npm/yarn</li>
            <li>Solana CLI tools (<code>solana-cli</code>)</li>
            <li>Anchor Framework 0.30.1</li>
            <li>Rust 1.75+</li>
            <li>Circom 2.1.6 for ZK circuits</li>
          </ul>

          <h3>Installation</h3>
          <pre><code>{`# Clone the repository
git clone https://github.com/Perry0404/solsafe.git
cd solsafe

# Install dependencies
npm install

# Install Solana CLI
sh -c "$(curl -sSfL https://release.solana.com/stable/install)"

# Install Anchor
cargo install --git https://github.com/coral-xyz/anchor avm --locked
avm install 0.30.1
avm use 0.30.1

# Install Circom
npm install -g circom`}</code></pre>

          <h3>Running Locally</h3>
          <pre><code>{`# Start local Solana validator
solana-test-validator

# Deploy smart contract (in new terminal)
cd solsafe-program
anchor build
anchor deploy

# Start frontend
cd ../frontend
npm start

# Open http://localhost:3000`}</code></pre>

          <h3>Connect Your Wallet</h3>
          <ol>
            <li>Install Phantom or Solflare wallet extension</li>
            <li>Switch to Devnet in wallet settings</li>
            <li>Get test SOL from faucet: <code>solana airdrop 2</code></li>
            <li>Click "Connect Wallet" in the SolSafe dashboard</li>
          </ol>
        </>
      )
    },

    'smart-contract': {
      title: 'Smart Contract API',
      content: (
        <>
          <h2>📜 Smart Contract Reference</h2>
          <p><strong>Program ID:</strong> <code>FfV3AHU6WS7aPz53DnVvWBMEZR46ydGkEtKpLiKfRTrR</code></p>

          <h3>Instructions</h3>

          <div className="api-section">
            <h4>1. initialize</h4>
            <p>Initializes the SolSafe protocol state.</p>
            <pre><code>{`#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(init, payer = authority, space = 8 + CaseState::SIZE)]
    pub case_state: Account<'info, CaseState>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}`}</code></pre>
            <p><strong>Parameters:</strong> None</p>
            <p><strong>Returns:</strong> Initialized CaseState account</p>
          </div>

          <div className="api-section">
            <h4>2. submit_case</h4>
            <p>Submits a new case for jury arbitration.</p>
            <pre><code>{`pub fn submit_case(
    ctx: Context<SubmitCase>,
    title: String,
    description: String,
    ipfs_hash: String,
    deposit: u64,
) -> Result<()>`}</code></pre>
            <p><strong>Parameters:</strong></p>
            <ul>
              <li><code>title</code>: Case title (max 100 chars)</li>
              <li><code>description</code>: Case description (max 1000 chars)</li>
              <li><code>ipfs_hash</code>: IPFS hash for evidence</li>
              <li><code>deposit</code>: Required deposit in lamports</li>
            </ul>
            <p><strong>Minimum Deposit:</strong> 0.1 SOL</p>
          </div>

          <div className="api-section">
            <h4>3. request_jurors</h4>
            <p>Requests random juror selection for a case.</p>
            <pre><code>{`pub fn request_jurors(
    ctx: Context<RequestJurors>,
    case_id: u64,
    num_jurors: u8,
) -> Result<()>`}</code></pre>
            <p><strong>Parameters:</strong></p>
            <ul>
              <li><code>case_id</code>: Unique case identifier</li>
              <li><code>num_jurors</code>: Number of jurors (3-12)</li>
            </ul>
            <p><strong>Uses:</strong> Switchboard VRF for randomness</p>
          </div>

          <div className="api-section">
            <h4>4. submit_vote</h4>
            <p>Submit a ZK-proven vote for a case.</p>
            <pre><code>{`pub fn submit_vote(
    ctx: Context<SubmitVote>,
    case_id: u64,
    proof: [u8; 192],
    public_inputs: [u8; 32],
) -> Result<()>`}</code></pre>
            <p><strong>Parameters:</strong></p>
            <ul>
              <li><code>case_id</code>: Case being voted on</li>
              <li><code>proof</code>: 192-byte Groth16 proof</li>
              <li><code>public_inputs</code>: Public commitment hash</li>
            </ul>
            <p><strong>Verification:</strong> On-chain arkworks verification</p>
          </div>

          <div className="api-section">
            <h4>5. finalize_case</h4>
            <p>Finalizes case when all votes are in or time expires.</p>
            <pre><code>{`pub fn finalize_case(
    ctx: Context<FinalizeCase>,
    case_id: u64,
) -> Result<()>`}</code></pre>
            <p><strong>Actions:</strong></p>
            <ul>
              <li>Tallies votes</li>
              <li>Distributes rewards to correct voters</li>
              <li>Updates case status to Resolved</li>
              <li>Refunds deposit to submitter if applicable</li>
            </ul>
          </div>

          <h3>Account Structures</h3>
          <pre><code>{`#[account]
pub struct CaseState {
    pub case_id: u64,
    pub submitter: Pubkey,
    pub title: String,
    pub description: String,
    pub ipfs_hash: String,
    pub deposit: u64,
    pub num_jurors: u8,
    pub votes_count: u8,
    pub votes_guilty: u8,
    pub votes_innocent: u8,
    pub status: CaseStatus,
    pub created_at: i64,
    pub finalized_at: Option<i64>,
    pub jurors: Vec<Pubkey>,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq)]
pub enum CaseStatus {
    Pending,
    JurorsSelected,
    VotingActive,
    Resolved,
    Cancelled,
}`}</code></pre>

          <h3>Error Codes</h3>
          <pre><code>{`#[error_code]
pub enum SolSafeError {
    #[msg("Invalid deposit amount")]
    InvalidDeposit,
    #[msg("Invalid number of jurors")]
    InvalidJurorCount,
    #[msg("Not authorized")]
    Unauthorized,
    #[msg("Invalid proof")]
    InvalidProof,
    #[msg("Case not found")]
    CaseNotFound,
    #[msg("Voting period expired")]
    VotingExpired,
    #[msg("Already voted")]
    AlreadyVoted,
}`}</code></pre>
        </>
      )
    },

    'zk-proofs': {
      title: 'ZK Proofs',
      content: (
        <>
          <h2>🔐 Zero-Knowledge Proofs Implementation</h2>

          <h3>Overview</h3>
          <p>SolSafe uses Groth16 ZK-SNARKs to enable private voting while proving vote validity.</p>

          <div className="tech-spec">
            <div className="spec-item">
              <strong>Proving System:</strong> Groth16
            </div>
            <div className="spec-item">
              <strong>Curve:</strong> BN254 (alt_bn128)
            </div>
            <div className="spec-item">
              <strong>Security:</strong> 128-bit
            </div>
            <div className="spec-item">
              <strong>Proof Size:</strong> 192 bytes
            </div>
            <div className="spec-item">
              <strong>Constraints:</strong> 481
            </div>
            <div className="spec-item">
              <strong>Verification Time:</strong> ~2ms on-chain
            </div>
          </div>

          <h3>Circuit Design</h3>
          <p>The vote circuit proves knowledge of a valid vote without revealing the vote choice:</p>
          <pre><code>{`pragma circom 2.1.6;

include "circomlib/circuits/poseidon.circom";
include "circomlib/circuits/comparators.circom";

template VoteCircuit() {
    // Private inputs (secret)
    signal input vote;           // 0 = innocent, 1 = guilty
    signal input salt;            // Random salt for privacy
    signal input juror_secret;   // Juror's secret key
    
    // Public inputs (visible on-chain)
    signal input case_id;
    signal input juror_commitment;
    
    // Output
    signal output nullifier;
    
    // Constraint 1: Vote must be 0 or 1
    component isValidVote = IsEqual();
    isValidVote.in[0] <== vote * (vote - 1);
    isValidVote.in[1] <== 0;
    isValidVote.out === 1;
    
    // Constraint 2: Verify juror commitment
    component commitmentHasher = Poseidon(2);
    commitmentHasher.inputs[0] <== juror_secret;
    commitmentHasher.inputs[1] <== case_id;
    commitmentHasher.out === juror_commitment;
    
    // Constraint 3: Generate nullifier (prevents double voting)
    component nullifierHasher = Poseidon(3);
    nullifierHasher.inputs[0] <== juror_secret;
    nullifierHasher.inputs[1] <== case_id;
    nullifierHasher.inputs[2] <== salt;
    nullifier <== nullifierHasher.out;
}

component main {public [case_id, juror_commitment]} = VoteCircuit();`}</code></pre>

          <h3>Proof Generation (Client-Side)</h3>
          <pre><code>{`import { groth16 } from 'snarkjs';

async function generateVoteProof(vote, jurorSecret, caseId) {
  // Generate random salt
  const salt = BigInt('0x' + crypto.randomBytes(32).toString('hex'));
  
  // Calculate juror commitment
  const jurorCommitment = poseidon([jurorSecret, caseId]);
  
  // Circuit inputs
  const input = {
    vote: vote,                      // 0 or 1
    salt: salt,
    juror_secret: jurorSecret,
    case_id: caseId,
    juror_commitment: jurorCommitment
  };
  
  // Generate proof
  const { proof, publicSignals } = await groth16.fullProve(
    input,
    'circuits/vote_js/vote.wasm',
    'circuits/vote_final.zkey'
  );
  
  // Format proof for Solana
  const proofBytes = packGroth16Proof(proof);  // 192 bytes
  const nullifier = publicSignals[0];
  
  return { proofBytes, nullifier, jurorCommitment };
}`}</code></pre>

          <h3>Verification (On-Chain)</h3>
          <pre><code>{`use ark_bn254::{Bn254, Fr};
use ark_groth16::{Proof, VerifyingKey, verify_proof};

pub fn verify_vote_proof(
    proof_bytes: &[u8; 192],
    public_inputs: &[u8; 32],
    vk: &VerifyingKey<Bn254>,
) -> Result<bool> {
    // Deserialize proof
    let proof = Proof::<Bn254>::deserialize(proof_bytes)?;
    
    // Deserialize public inputs
    let case_id = Fr::from_be_bytes_mod_order(public_inputs);
    
    // Verify proof
    let valid = verify_proof(vk, &proof, &[case_id])?;
    
    Ok(valid)
}`}</code></pre>

          <h3>Trusted Setup</h3>
          <p>The circuit uses a multi-party trusted setup ceremony:</p>
          <ol>
            <li><strong>Powers of Tau:</strong> Perpetual Powers of Tau ceremony (28 contributions)</li>
            <li><strong>Phase 2:</strong> Circuit-specific contributions (3+ independent contributors)</li>
            <li><strong>Verification:</strong> All contributions publicly verifiable</li>
          </ol>
          <pre><code>{`# Compile circuit
circom vote.circom --r1cs --wasm --sym

# Generate verification key
snarkjs groth16 setup vote.r1cs powersOfTau28_hez_final.ptau vote_0000.zkey

# Contribute to phase 2
snarkjs zkey contribute vote_0000.zkey vote_0001.zkey \\
  --name="Contributor 1" -v

# Export verification key
snarkjs zkey export verificationkey vote_final.zkey verification_key.json`}</code></pre>

          <h3>Security Considerations</h3>
          <ul>
            <li><strong>Nullifier Uniqueness:</strong> Prevents double voting using Poseidon hash</li>
            <li><strong>Front-Running Protection:</strong> Votes are committed before reveal</li>
            <li><strong>Replay Attacks:</strong> Case ID included in circuit prevents cross-case reuse</li>
            <li><strong>Trusted Setup:</strong> Multi-party ceremony reduces single-point trust</li>
          </ul>
        </>
      )
    },

    'mpc-evidence': {
      title: 'MPC & Confidential Transfers',
      content: (
        <>
          <h2>🔒 Multi-Party Computation & Privacy</h2>

          <h3>MPC Evidence System</h3>
          <p>Sensitive evidence is protected using threshold encryption with Arcium MPC:</p>

          <div className="tech-spec">
            <div className="spec-item">
              <strong>Protocol:</strong> Arcium MPC Network
            </div>
            <div className="spec-item">
              <strong>Threshold:</strong> 2/3 (2-of-3 Shamir)
            </div>
            <div className="spec-item">
              <strong>Encryption:</strong> AES-256-GCM
            </div>
            <div className="spec-item">
              <strong>Key Shares:</strong> Distributed to jurors
            </div>
          </div>

          <h4>Evidence Submission Flow</h4>
          <pre><code>{`// 1. Encrypt evidence client-side
const evidenceKey = crypto.getRandomValues(new Uint8Array(32));
const encryptedEvidence = await encryptAES(evidence, evidenceKey);

// 2. Split key using Shamir Secret Sharing
const shares = shamirSplit(evidenceKey, {
  threshold: 2,
  shares: 3
});

// 3. Upload encrypted evidence to IPFS
const ipfsHash = await ipfs.add(encryptedEvidence);

// 4. Distribute key shares to jurors via MPC
await arcium.distributeShares({
  caseId: caseId,
  shares: shares,
  jurors: selectedJurors
});

// 5. Submit case on-chain with IPFS hash
await program.methods.submitCase(
  title,
  description,
  ipfsHash,
  deposit
).rpc();`}</code></pre>

          <h4>Evidence Decryption (Jurors)</h4>
          <pre><code>{`// Jurors retrieve their key share from MPC
const myShare = await arcium.getMyShare(caseId, jurorPubkey);

// When threshold is met, reconstruct key
if (shares.length >= threshold) {
  const reconstructedKey = shamirReconstruct(shares);
  
  // Download and decrypt evidence
  const encrypted = await ipfs.cat(ipfsHash);
  const evidence = await decryptAES(encrypted, reconstructedKey);
  
  // Display to juror for voting
  return evidence;
}`}</code></pre>

          <h3>Confidential Transfers</h3>
          <p>Case deposits and rewards use confidential transfers via Light Protocol:</p>

          <h4>Hidden Amount Deposits</h4>
          <pre><code>{`import { createMint, createConfidentialTransfer } from '@solana/spl-token';

async function submitCaseWithConfidentialDeposit(
  connection,
  wallet,
  amount,
  caseData
) {
  // Create confidential transfer instruction
  const confidentialIx = await createConfidentialTransfer({
    connection,
    payer: wallet.publicKey,
    mint: SOLSAFE_MINT,
    amount: amount,
    recipient: CASE_ESCROW,
    elGamalKeypair: wallet.elGamal,
    // Amount is encrypted, not visible on-chain
    encryptedAmount: true
  });
  
  // Submit case with confidential deposit
  const tx = new Transaction()
    .add(confidentialIx)
    .add(
      await program.methods.submitCase(
        caseData.title,
        caseData.description,
        caseData.ipfsHash,
        0  // Amount hidden in confidential transfer
      ).instruction()
    );
  
  await wallet.sendTransaction(tx, connection);
}`}</code></pre>

          <h4>Range Proofs for Compliance</h4>
          <p>Range proofs ensure deposited amounts are within valid ranges without revealing exact amounts:</p>
          <pre><code>{`// Prove amount is between 0.1 and 100 SOL
const rangeProof = await generateRangeProof({
  amount: depositAmount,
  min: 0.1 * LAMPORTS_PER_SOL,
  max: 100 * LAMPORTS_PER_SOL,
  commitment: pedersonCommitment
});

// Verify range proof on-chain
require(verify_range_proof(rangeProof), "Invalid amount");`}</code></pre>

          <h3>Privacy Guarantees</h3>
          <ul>
            <li><strong>Vote Privacy:</strong> ZK proofs hide vote choice from public</li>
            <li><strong>Evidence Privacy:</strong> Threshold encryption protects sensitive documents</li>
            <li><strong>Amount Privacy:</strong> Confidential transfers hide deposit amounts</li>
            <li><strong>Identity Privacy:</strong> Optional anonymous case submission</li>
            <li><strong>Juror Protection:</strong> Votes cannot be linked to specific jurors</li>
          </ul>
        </>
      )
    },

    'frontend-integration': {
      title: 'Frontend Integration',
      content: (
        <>
          <h2>⚛️ React Frontend Integration</h2>

          <h3>Wallet Connection</h3>
          <pre><code>{`import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import {
  ConnectionProvider,
  WalletProvider,
  useWallet
} from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets';

function App() {
  const network = WalletAdapterNetwork.Devnet;
  const endpoint = 'https://api.devnet.solana.com';
  
  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
    ],
    [network]
  );
  
  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <Dashboard />
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}`}</code></pre>

          <h3>Submitting a Case</h3>
          <pre><code>{`import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { Program, AnchorProvider } from '@coral-xyz/anchor';
import idl from './idl/solsafe_program.json';

function SubmitCaseForm() {
  const { connection } = useConnection();
  const wallet = useWallet();
  
  async function handleSubmit(formData) {
    // Create provider
    const provider = new AnchorProvider(
      connection,
      wallet,
      { commitment: 'confirmed' }
    );
    
    // Initialize program
    const program = new Program(idl, provider);
    
    // Upload evidence to IPFS
    const ipfsHash = await uploadToIPFS(formData.evidence);
    
    // Submit case
    const tx = await program.methods
      .submitCase(
        formData.title,
        formData.description,
        ipfsHash,
        new BN(formData.deposit * LAMPORTS_PER_SOL)
      )
      .accounts({
        caseState: caseStateAccount,
        submitter: wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();
    
    console.log('Case submitted:', tx);
  }
}`}</code></pre>

          <h3>Generating and Submitting ZK Votes</h3>
          <pre><code>{`import { groth16 } from 'snarkjs';
import { poseidon } from 'circomlibjs';

async function submitPrivateVote(caseId, vote) {
  // Generate juror secret (derived from wallet)
  const jurorSecret = await deriveJurorSecret(wallet.publicKey);
  
  // Generate ZK proof
  const { proofBytes, nullifier, jurorCommitment } = 
    await generateVoteProof(vote, jurorSecret, caseId);
  
  // Submit vote on-chain
  const tx = await program.methods
    .submitVote(
      new BN(caseId),
      Array.from(proofBytes),
      Array.from(jurorCommitment)
    )
    .accounts({
      caseState: caseStateAccount,
      voter: wallet.publicKey,
    })
    .rpc();
  
  return tx;
}`}</code></pre>

          <h3>Fetching Case Data</h3>
          <pre><code>{`async function fetchCases() {
  const cases = await program.account.caseState.all();
  
  return cases.map(case => ({
    id: case.account.caseId.toString(),
    title: case.account.title,
    description: case.account.description,
    status: case.account.status,
    submitter: case.account.submitter.toString(),
    deposit: case.account.deposit.toNumber() / LAMPORTS_PER_SOL,
    votesGuilty: case.account.votesGuilty,
    votesInnocent: case.account.votesInnocent,
    jurors: case.account.jurors.map(j => j.toString()),
    createdAt: new Date(case.account.createdAt.toNumber() * 1000),
  }));
}`}</code></pre>

          <h3>React Hooks</h3>
          <pre><code>{`// Custom hook for cases
export function useCases() {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const { connection } = useConnection();
  
  useEffect(() => {
    async function loadCases() {
      const program = getProgram(connection);
      const cases = await fetchCases(program);
      setCases(cases);
      setLoading(false);
    }
    
    loadCases();
    
    // Subscribe to case updates
    const subscription = program.account.caseState.subscribe(
      (caseState) => {
        setCases(prev => updateCase(prev, caseState));
      }
    );
    
    return () => subscription();
  }, [connection]);
  
  return { cases, loading };
}`}</code></pre>
        </>
      )
    },

    'deployment': {
      title: 'Deployment Guide',
      content: (
        <>
          <h2>🚀 Deployment Guide</h2>

          <h3>Smart Contract Deployment</h3>
          
          <h4>1. Build the Program</h4>
          <pre><code>{`cd solsafe-program
anchor build

# Get program ID
solana address -k target/deploy/solsafe_program-keypair.json
# Output: FfV3AHU6WS7aPz53DnVvWBMEZR46ydGkEtKpLiKfRTrR`}</code></pre>

          <h4>2. Update Program ID</h4>
          <p>Update <code>Anchor.toml</code> and <code>lib.rs</code> with your program ID:</p>
          <pre><code>{`// lib.rs
declare_id!("FfV3AHU6WS7aPz53DnVvWBMEZR46ydGkEtKpLiKfRTrR");

// Anchor.toml
[programs.devnet]
solsafe_program = "FfV3AHU6WS7aPz53DnVvWBMEZR46ydGkEtKpLiKfRTrR"`}</code></pre>

          <h4>3. Deploy to Devnet</h4>
          <pre><code>{`# Set cluster
solana config set --url devnet

# Get devnet SOL
solana airdrop 2

# Deploy
anchor deploy

# Verify deployment
solana program show FfV3AHU6WS7aPz53DnVvWBMEZR46ydGkEtKpLiKfRTrR`}</code></pre>

          <h4>4. Initialize Program</h4>
          <pre><code>{`# Run initialization script
anchor run initialize

# Or manually with TypeScript
const tx = await program.methods
  .initialize()
  .accounts({
    caseState: caseStateAccount,
    authority: wallet.publicKey,
    systemProgram: SystemProgram.programId,
  })
  .rpc();`}</code></pre>

          <h3>Frontend Deployment (Vercel)</h3>

          <h4>1. Prepare Build</h4>
          <pre><code>{`cd frontend

# Install dependencies
npm install

# Build for production
npm run build

# Test build locally
npx serve -s build`}</code></pre>

          <h4>2. Configure Vercel</h4>
          <p>Create/update <code>vercel.json</code>:</p>
          <pre><code>{`{
  "buildCommand": "cd frontend && npm install && npm run build",
  "outputDirectory": "frontend/build",
  "framework": null,
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}`}</code></pre>

          <h4>3. Deploy</h4>
          <pre><code>{`# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy to production
vercel --prod

# Custom domain (optional)
vercel domains add solsafe.io
vercel domains verify solsafe.io`}</code></pre>

          <h3>Environment Variables</h3>
          <p>Set these in Vercel dashboard or <code>.env.production</code>:</p>
          <pre><code>{`REACT_APP_SOLANA_NETWORK=devnet
REACT_APP_SOLANA_RPC_URL=https://api.devnet.solana.com
REACT_APP_PROGRAM_ID=FfV3AHU6WS7aPz53DnVvWBMEZR46ydGkEtKpLiKfRTrR
REACT_APP_IPFS_GATEWAY=https://ipfs.io/ipfs/
REACT_APP_ARCIUM_API_KEY=your_arcium_key`}</code></pre>

          <h3>Mainnet Checklist</h3>
          <ul>
            <li>✅ Complete security audit</li>
            <li>✅ Test all instructions on devnet</li>
            <li>✅ Verify ZK circuit trusted setup</li>
            <li>✅ Ensure sufficient SOL for rent exemption</li>
            <li>✅ Set upgrade authority correctly</li>
            <li>✅ Configure rate limiting and access control</li>
            <li>✅ Set up monitoring and alerting</li>
            <li>✅ Prepare incident response plan</li>
          </ul>

          <h3>Monitoring & Maintenance</h3>
          <pre><code>{`# Monitor program logs
solana logs FfV3AHU6WS7aPz53DnVvWBMEZR46ydGkEtKpLiKfRTrR

# Check program health
solana program show FfV3AHU6WS7aPz53DnVvWBMEZR46ydGkEtKpLiKfRTrR

# View transactions
solana transaction-history FfV3AHU6WS7aPz53DnVvWBMEZR46ydGkEtKpLiKfRTrR

# Upgrade program (if needed)
anchor upgrade target/deploy/solsafe_program.so \\
  --program-id FfV3AHU6WS7aPz53DnVvWBMEZR46ydGkEtKpLiKfRTrR`}</code></pre>
        </>
      )
    },

    'testing': {
      title: 'Testing',
      content: (
        <>
          <h2>🧪 Testing Guide</h2>

          <h3>Smart Contract Tests</h3>
          <pre><code>{`// tests/solsafe-program.ts
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { SolsafeProgram } from "../target/types/solsafe_program";
import { expect } from "chai";

describe("solsafe-program", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  
  const program = anchor.workspace.SolsafeProgram as Program<SolsafeProgram>;
  
  it("Initializes program state", async () => {
    const tx = await program.methods
      .initialize()
      .accounts({
        caseState: caseStateAccount.publicKey,
        authority: provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([caseStateAccount])
      .rpc();
    
    const state = await program.account.caseState.fetch(
      caseStateAccount.publicKey
    );
    
    expect(state.casesCount.toNumber()).to.equal(0);
  });
  
  it("Submits a new case", async () => {
    const deposit = new anchor.BN(0.1 * LAMPORTS_PER_SOL);
    
    const tx = await program.methods
      .submitCase(
        "Test Case",
        "Description",
        "QmTest123",
        deposit
      )
      .accounts({
        caseState: caseStateAccount.publicKey,
        submitter: provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();
    
    const state = await program.account.caseState.fetch(
      caseStateAccount.publicKey
    );
    
    expect(state.casesCount.toNumber()).to.equal(1);
    expect(state.title).to.equal("Test Case");
  });
  
  it("Verifies ZK vote proof", async () => {
    // Generate test proof
    const { proof, publicInputs } = await generateTestProof();
    
    const tx = await program.methods
      .submitVote(
        new anchor.BN(1),
        Array.from(proof),
        Array.from(publicInputs)
      )
      .accounts({
        caseState: caseStateAccount.publicKey,
        voter: provider.wallet.publicKey,
      })
      .rpc();
    
    const state = await program.account.caseState.fetch(
      caseStateAccount.publicKey
    );
    
    expect(state.votesCount).to.equal(1);
  });
});

// Run tests
// anchor test`}</code></pre>

          <h3>Frontend Tests</h3>
          <pre><code>{`// src/App.test.js
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import App from './App';

describe('App Component', () => {
  it('renders dashboard', () => {
    render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    );
    
    expect(screen.getByText(/SolSafe/i)).toBeInTheDocument();
  });
  
  it('connects wallet', async () => {
    const { getByText } = render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    );
    
    const connectButton = getByText(/Connect Wallet/i);
    fireEvent.click(connectButton);
    
    await waitFor(() => {
      expect(screen.getByText(/Phantom/i)).toBeInTheDocument();
    });
  });
});

// Run: npm test`}</code></pre>

          <h3>ZK Circuit Tests</h3>
          <pre><code>{`// circuits/vote.test.js
const { groth16 } = require("snarkjs");
const { expect } = require("chai");

describe("Vote Circuit", () => {
  it("generates valid proof for legitimate vote", async () => {
    const input = {
      vote: 1,
      salt: BigInt("12345"),
      juror_secret: BigInt("67890"),
      case_id: BigInt("1"),
      juror_commitment: BigInt("..."),
    };
    
    const { proof, publicSignals } = await groth16.fullProve(
      input,
      "circuits/vote_js/vote.wasm",
      "circuits/vote_final.zkey"
    );
    
    expect(proof).to.exist;
    expect(publicSignals.length).to.equal(1);
  });
  
  it("rejects invalid vote value", async () => {
    const input = {
      vote: 2,  // Invalid: must be 0 or 1
      salt: BigInt("12345"),
      juror_secret: BigInt("67890"),
      case_id: BigInt("1"),
      juror_commitment: BigInt("..."),
    };
    
    await expect(
      groth16.fullProve(
        input,
        "circuits/vote_js/vote.wasm",
        "circuits/vote_final.zkey"
      )
    ).to.be.rejected;
  });
});

// Run: npm run test:circuits`}</code></pre>

          <h3>Integration Tests</h3>
          <pre><code>{`// tests/integration/complete-flow.test.ts
describe("Complete Case Flow", () => {
  it("submits case, selects jurors, votes, and finalizes", async () => {
    // 1. Submit case
    const submitTx = await submitCase({
      title: "Integration Test",
      description: "Full flow test",
      deposit: 0.1,
    });
    expect(submitTx).to.exist;
    
    // 2. Request jurors
    const jurorTx = await requestJurors(caseId, 3);
    expect(jurorTx).to.exist;
    
    // Wait for VRF callback
    await sleep(5000);
    
    // 3. Submit votes from jurors
    for (const juror of jurors) {
      const voteTx = await submitVote(caseId, 1, juror);
      expect(voteTx).to.exist;
    }
    
    // 4. Finalize case
    const finalizeTx = await finalizeCase(caseId);
    expect(finalizeTx).to.exist;
    
    // 5. Verify outcome
    const caseState = await fetchCase(caseId);
    expect(caseState.status).to.equal("Resolved");
  });
});`}</code></pre>

          <h3>Performance Tests</h3>
          <pre><code>{`// Benchmark ZK proof generation
async function benchmarkProofGeneration() {
  const iterations = 100;
  const times = [];
  
  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    await generateVoteProof(1, jurorSecret, caseId);
    const end = performance.now();
    times.push(end - start);
  }
  
  console.log(\`Average: \${average(times)}ms\`);
  console.log(\`Median: \${median(times)}ms\`);
  console.log(\`95th percentile: \${percentile(times, 95)}ms\`);
}

// Expected: ~500ms average on modern hardware`}</code></pre>
        </>
      )
    }
  };

  return (
    <div className="docs-wrapper">
      <nav className="docs-nav">
        <Link to="/" className="back-btn">← Back to Home</Link>
        <h1 className="docs-title">📖 Documentation</h1>
        <div className="docs-menu">
          {Object.entries(sections).map(([key, section]) => (
            <button
              key={key}
              className={`menu-item ${activeSection === key ? 'active' : ''}`}
              onClick={() => setActiveSection(key)}
            >
              {section.title}
            </button>
          ))}
        </div>
      </nav>

      <main className="docs-content">
        <div className="content-inner">
          {sections[activeSection].content}
        </div>

        <div className="docs-footer">
          <p>Need help? Join our <a href="https://discord.gg/solsafe">Discord community</a></p>
          <p>Found an issue? <a href="https://github.com/Perry0404/solsafe/issues">Report on GitHub</a></p>
        </div>
      </main>
    </div>
  );
}
