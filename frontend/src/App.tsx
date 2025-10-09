import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
import * as anchor from "@project-serum/anchor";

const PROGRAM_ID = new PublicKey("SoLSafe111111111111111111111111111111111111111"); // Replace with your deployed program ID
const VAULT_SEED = "vault";
const JUROR_SEED = "juror";

const network = "devnet"; // Change if needed

// Helper to get the Anchor provider
function useAnchorProvider() {
  const { connection } = useConnection();
  const { publicKey, signTransaction, signAllTransactions } = useWallet();

  return useMemo(() => {
    if (!publicKey || !signTransaction || !signAllTransactions) return null;
    return new anchor.AnchorProvider(connection, { publicKey, signTransaction, signAllTransactions }, { commitment: "processed" });
  }, [connection, publicKey, signTransaction, signAllTransactions]);
}

const MIN_STAKE = 1; // 1 lamport for demo; set to 1000000000 for 1 SOL in real

export default function App() {
  const { publicKey, connected } = useWallet();
  const provider = useAnchorProvider();
  const [program, setProgram] = useState<anchor.Program | null>(null);

  // Juror staking state
  const [isJuror, setIsJuror] = useState(false);
  const [staking, setStaking] = useState(false);
  // Case submission state
  const [evidence, setEvidence] = useState("");
  const [reportedAddress, setReportedAddress] = useState("");
  const [submitting, setSubmitting] = useState(false);
  // Cases/voting
  const [cases, setCases] = useState<any[]>([]);
  const [loadingCases, setLoadingCases] = useState(false);

  // Load Anchor program
  useEffect(() => {
    if (!provider) return;
    const idl = require("./solsafe_idl.json"); // You need to export your Anchor IDL and place it here as solsafe_idl.json!
    const program = new anchor.Program(idl, PROGRAM_ID, provider);
    setProgram(program);
  }, [provider]);

  // Load juror status
  useEffect(() => {
    if (!program || !publicKey) return;
    (async () => {
      try {
        const [jurorPda] = await anchor.web3.PublicKey.findProgramAddressSync(
          [Buffer.from(JUROR_SEED), publicKey.toBuffer()],
          PROGRAM_ID
        );
        const juror = await program.account.juror.fetch(jurorPda);
        setIsJuror(juror.active);
      } catch (e) {
        setIsJuror(false);
      }
    })();
  }, [program, publicKey]);

  // Load active cases (very naive; assumes cases are stored in program accounts)
  const loadCases = useCallback(async () => {
    if (!program) return;
    setLoadingCases(true);
    try {
      const caseAccounts = await program.account.case.all();
      setCases(caseAccounts.map(a => ({ pubkey: a.publicKey, ...a.account })));
    } catch (e) {
      setCases([]);
    }
    setLoadingCases(false);
  }, [program]);

  useEffect(() => {
    if (program) loadCases();
  }, [program, loadCases]);

  // Juror staking
  const handleStake = async () => {
    if (!program || !publicKey) return;
    setStaking(true);
    try {
      const [jurorPda] = await anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from(JUROR_SEED), publicKey.toBuffer()],
        PROGRAM_ID
      );
      const [vaultPda] = await anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from(VAULT_SEED)],
        PROGRAM_ID
      );
      await program.methods
        .registerJuror("validator-proof-demo")
        .accounts({
          juror: jurorPda,
          staker: publicKey,
          programVault: vaultPda,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
      setIsJuror(true);
    } catch (e) {
      alert("Juror staking failed: " + e);
    }
    setStaking(false);
  };

  // Submit a scam case
  const handleSubmitCase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!program || !publicKey) return;
    setSubmitting(true);
    try {
      const caseKeypair = anchor.web3.Keypair.generate();
      await program.methods
        .submitCase(evidence, new PublicKey(reportedAddress))
        .accounts({
          case: caseKeypair.publicKey,
          reporter: publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([caseKeypair])
        .rpc();
      setEvidence("");
      setReportedAddress("");
      await loadCases();
    } catch (e) {
      alert("Submit case failed: " + e);
    }
    setSubmitting(false);
  };

  // Vote on a case
  const handleVote = async (casePubkey: PublicKey, vote: boolean) => {
    if (!program || !publicKey) return;
    try {
      await program.methods
        .voteCase(vote)
        .accounts({
          case: casePubkey,
          voter: publicKey,
        })
        .rpc();
      await loadCases();
    } catch (e) {
      alert("Voting failed: " + e);
    }
  };

  return (
    <div style={{ maxWidth: 700, margin: "2rem auto", padding: 24 }}>
      <h1>SolSafe DeFi Juror Protocol</h1>
      <WalletMultiButton />
      {!connected && <p>Connect your wallet to use SolSafe.</p>}

      {connected && (
        <>
          <section style={{ margin: "2rem 0" }}>
            <h2>Juror Registration</h2>
            {isJuror ? (
              <p style={{ color: "green" }}>You are a registered juror.</p>
            ) : (
              <button disabled={staking} onClick={handleStake}>
                {staking ? "Staking..." : "Stake to Register as Juror"}
              </button>
            )}
          </section>

          <section style={{ margin: "2rem 0" }}>
            <h2>Submit Scam Case</h2>
            <form onSubmit={handleSubmitCase}>
              <input
                type="text"
                placeholder="Reported Wallet Address"
                value={reportedAddress}
                onChange={e => setReportedAddress(e.target.value)}
                required
                style={{ width: 280 }}
              />
              <br />
              <textarea
                placeholder="Evidence (on-chain tx, proof, etc)"
                value={evidence}
                onChange={e => setEvidence(e.target.value)}
                required
                style={{ width: 400, height: 60 }}
              />
              <br />
              <button type="submit" disabled={submitting}>
                {submitting ? "Submitting..." : "Submit Case"}
              </button>
            </form>
          </section>

          <section>
            <h2>Active Cases</h2>
            <button onClick={loadCases} disabled={loadingCases}>
              {loadingCases ? "Loading..." : "Refresh Cases"}
            </button>
            {cases.length === 0 ? (
              <p>No active cases found.</p>
            ) : (
              <ul>
                {cases.map((c, i) => (
                  <li key={c.pubkey.toString()} style={{ border: "1px solid #aaa", margin: 8, padding: 8 }}>
                    <b>Reported:</b> {c.reportedAddress?.toBase58?.() || String(c.reportedAddress)}
                    <br />
                    <b>Evidence:</b> {c.evidence}
                    <br />
                    <b>Status:</b> {c.status}
                    <br />
                    <b>Votes:</b> Yes {c.yesVotes} / No {c.noVotes}
                    <br />
                    {isJuror && c.status === "Pending" && (
                      <>
                        <button onClick={() => handleVote(c.pubkey, true)}>Vote Scam</button>
                        <button onClick={() => handleVote(c.pubkey, false)}>Vote Not Scam</button>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
      <footer style={{ marginTop: 48, fontSize: 12, color: "#777" }}>
        <p>
          Built with Solana, Anchor, and React. <br />
          <b>Note:</b> For Anchor program interaction, make sure you have the <code>solsafe_idl.json</code> in your <code>src</code> directory and update the program ID as needed.
        </p>
      </footer>
    </div>
  );
}