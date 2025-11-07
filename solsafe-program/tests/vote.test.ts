import * as anchor from "@coral-xyz/anchor";
import { Program, AnchorProvider } from "@coral-xyz/anchor";
import { SolsafeProgram } from "../target/types/solsafe_program";
import { PublicKey, Keypair, SystemProgram } from "@solana/web3.js";
import { expect } from "chai";
import * as BN from "bn.js";

describe("vote - one-vote-per-wallet enforcement", () => {
  // Configure the client to use the local cluster
  const provider = AnchorProvider.local();
  anchor.setProvider(provider);

  const program = anchor.workspace.SolsafeProgram as Program<SolsafeProgram>;

  let configAccount: Keypair;
  let submitter: Keypair;
  let caseId: BN;
  let casePda: PublicKey;
  let caseBump: number;

  before(async () => {
    configAccount = Keypair.generate();
    submitter = Keypair.generate();
    caseId = new BN(1);

    // Airdrop SOL to test accounts
    const airdropSubmitter = await provider.connection.requestAirdrop(
      submitter.publicKey,
      2 * anchor.web3.LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(airdropSubmitter);

    // Derive the case PDA
    const caseIdBuffer = Buffer.alloc(8);
    caseIdBuffer.writeBigUInt64LE(BigInt(caseId.toString()));
    
    [casePda, caseBump] = PublicKey.findProgramAddressSync(
      [Buffer.from("case"), submitter.publicKey.toBuffer(), caseIdBuffer],
      program.programId
    );

    // Initialize the GlobalConfig account
    await program.methods
      .initialize()
      .accounts({
        config: configAccount.publicKey,
        admin: provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([configAccount])
      .rpc();

    // Update validators list - put payer as second validator so select_jurors picks them
    const validator1 = Keypair.generate().publicKey;
    const validator2 = provider.wallet.publicKey; // Test payer as juror
    const validator3 = Keypair.generate().publicKey;
    
    await program.methods
      .updateValidators([validator1, validator2, validator3])
      .accounts({
        config: configAccount.publicKey,
        admin: provider.wallet.publicKey,
      })
      .rpc();

    // Submit a case
    await program.methods
      .submitEvidence(
        caseId,
        "Test evidence for scam case",
        Keypair.generate().publicKey // scam_address
      )
      .accounts({
        caseAccount: casePda,
        submitter: submitter.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([submitter])
      .rpc();

    // Request jurors (VRF account is placeholder)
    const vrfAccount = Keypair.generate().publicKey;
    await program.methods
      .requestJurors(caseId)
      .accounts({
        caseAccount: casePda,
        vrfAccount: vrfAccount,
        programAuthority: provider.wallet.publicKey,
      })
      .rpc();

    // Select jurors - will deterministically pick validators based on case_id
    await program.methods
      .selectJurors()
      .accounts({
        caseAccount: casePda,
        config: configAccount.publicKey,
        vrfAccount: vrfAccount,
      })
      .rpc();
  });

  it("allows a juror to vote once", async () => {
    // Derive the VoteRecord PDA for this validator
    const [voteRecordPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("vote"),
        casePda.toBuffer(),
        provider.wallet.publicKey.toBuffer(),
      ],
      program.programId
    );

    // First vote should succeed
    await program.methods
      .vote(true) // vote_for = true
      .accounts({
        caseAccount: casePda,
        validator: provider.wallet.publicKey,
        voteRecord: voteRecordPda,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    // Verify the vote was recorded
    const caseAccount = await program.account.caseAccount.fetch(casePda);
    expect(caseAccount.votesFor.toNumber()).to.equal(1);
    expect(caseAccount.votesAgainst.toNumber()).to.equal(0);
  });

  it("prevents the same validator from voting twice", async () => {
    // Derive the same VoteRecord PDA
    const [voteRecordPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("vote"),
        casePda.toBuffer(),
        provider.wallet.publicKey.toBuffer(),
      ],
      program.programId
    );

    // Second vote should fail due to duplicate VoteRecord init
    try {
      await program.methods
        .vote(false) // Try to vote again
        .accounts({
          caseAccount: casePda,
          validator: provider.wallet.publicKey,
          voteRecord: voteRecordPda,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
      
      // If we reach here, the test should fail
      expect.fail("Expected transaction to fail but it succeeded");
    } catch (error) {
      // Check that the error is related to account already being initialized
      const errorMessage = error.toString();
      const isExpectedError = 
        errorMessage.includes("already in use") ||
        errorMessage.includes("Account already initialized") ||
        errorMessage.includes("custom program error: 0x0");
      
      expect(isExpectedError).to.be.true;
    }

    // Verify vote count hasn't changed
    const caseAccount = await program.account.caseAccount.fetch(casePda);
    expect(caseAccount.votesFor.toNumber()).to.equal(1);
    expect(caseAccount.votesAgainst.toNumber()).to.equal(0);
  });
});
