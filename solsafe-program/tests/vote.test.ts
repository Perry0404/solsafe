import * as anchor from "@coral-xyz/anchor";
import { Program, BN } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import { expect } from "chai";
import { SolsafeProgram } from "../target/types/solsafe_program";

describe("vote one-vote-per-wallet enforcement", () => {
  // Configure the client to use the local cluster
  const provider = anchor.AnchorProvider.local();
  anchor.setProvider(provider);

  const program = anchor.workspace.SolsafeProgram as Program<SolsafeProgram>;

  let configPda: PublicKey;
  let casePda: PublicKey;
  let voteRecordPda: PublicKey;
  const caseId = new BN(1);

  before(async () => {
    // Derive config PDA
    [configPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("config")],
      program.programId
    );

    // Derive case PDA for case_id = 1
    const caseIdBuffer = Buffer.alloc(8);
    caseIdBuffer.writeBigUInt64LE(BigInt(caseId.toString()));
    [casePda] = PublicKey.findProgramAddressSync(
      [Buffer.from("case"), provider.wallet.publicKey.toBuffer(), caseIdBuffer],
      program.programId
    );

    // Derive vote record PDA
    [voteRecordPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("vote"), casePda.toBuffer(), provider.wallet.publicKey.toBuffer()],
      program.programId
    );
  });

  it("initializes global config", async () => {
    try {
      await program.methods
        .initialize()
        .accounts({
          config: configPda,
          admin: provider.wallet.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();
    } catch (err) {
      // If already initialized, that's ok for test purposes
      console.log("Config may already be initialized:", err.message);
    }
  });

  it("updates validators with provider wallet at index 1", async () => {
    // Include provider.wallet.publicKey at index 1 so select_jurors picks it deterministically
    const validators = [
      PublicKey.unique(),
      provider.wallet.publicKey,
      PublicKey.unique(),
    ];

    await program.methods
      .updateValidators(validators)
      .accounts({
        config: configPda,
        admin: provider.wallet.publicKey,
      })
      .rpc();
  });

  it("submits evidence for case_id = 1", async () => {
    const evidence = "Test evidence string";
    const scamAddress = PublicKey.unique();

    await program.methods
      .submitEvidence(caseId, evidence, scamAddress)
      .accounts({
        caseAccount: casePda,
        submitter: provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();
  });

  it("requests jurors for the case", async () => {
    // Use a placeholder VRF account
    const vrfAccount = PublicKey.unique();

    await program.methods
      .requestJurors(caseId)
      .accounts({
        caseAccount: casePda,
        vrfAccount: vrfAccount,
        programAuthority: provider.wallet.publicKey,
      })
      .rpc();
  });

  it("selects jurors (deterministically includes provider wallet)", async () => {
    const vrfAccount = PublicKey.unique();

    await program.methods
      .selectJurors()
      .accounts({
        caseAccount: casePda,
        config: configPda,
        vrfAccount: vrfAccount,
      })
      .rpc();

    // Verify that jurors were selected
    const caseAccount = await program.account.caseAccount.fetch(casePda);
    expect(caseAccount.jurors.length).to.equal(3);
    
    // With the placeholder randomness based on case_id and validator at index 1,
    // provider.wallet should be selected as a juror
    const isJuror = caseAccount.jurors.some(
      (j) => j.toString() === provider.wallet.publicKey.toString()
    );
    expect(isJuror).to.be.true;
  });

  it("allows first vote from provider wallet (should succeed)", async () => {
    await program.methods
      .vote(true)
      .accounts({
        caseAccount: casePda,
        validator: provider.wallet.publicKey,
        voteRecord: voteRecordPda,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    // Verify vote was recorded
    const caseAccount = await program.account.caseAccount.fetch(casePda);
    expect(caseAccount.votesFor.toNumber()).to.equal(1);
  });

  it("prevents second vote from same wallet (should fail)", async () => {
    let errorOccurred = false;
    let errorMessage = "";

    try {
      await program.methods
        .vote(false)
        .accounts({
          caseAccount: casePda,
          validator: provider.wallet.publicKey,
          voteRecord: voteRecordPda,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();
    } catch (err) {
      errorOccurred = true;
      errorMessage = err.message || err.toString();
    }

    expect(errorOccurred).to.be.true;
    // Anchor will throw an error about the account already being initialized
    expect(errorMessage.toLowerCase()).to.satisfy((msg: string) =>
      msg.includes("already") ||
      msg.includes("initialized") ||
      msg.includes("duplicate") ||
      msg.includes("0x0")
    );
  });
});
