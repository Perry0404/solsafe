import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PublicKey, Keypair, SystemProgram } from "@solana/web3.js";
import { assert } from "chai";

describe("SolSafe Voting System", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.SolsafeProgram as Program<any>;
  
  let configPda: PublicKey;
  let configBump: number;
  let admin: Keypair;
  let validators: Keypair[];
  let reporter: Keypair;
  let scammer: PublicKey;

  before(async () => {
    // Setup accounts
    admin = Keypair.generate();
    reporter = Keypair.generate();
    scammer = Keypair.generate().publicKey;

    // Create 5 mock validators
    validators = Array.from({ length: 5 }, () => Keypair.generate());

    // Airdrop SOL to test accounts
    await provider.connection.requestAirdrop(
      admin.publicKey,
      10 * anchor.web3.LAMPORTS_PER_SOL
    );
    await provider.connection.requestAirdrop(
      reporter.publicKey,
      10 * anchor.web3.LAMPORTS_PER_SOL
    );

    for (const validator of validators) {
      await provider.connection.requestAirdrop(
        validator.publicKey,
        2 * anchor.web3.LAMPORTS_PER_SOL
      );
    }

    // Wait for airdrops
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Find config PDA
    [configPda, configBump] = PublicKey.findProgramAddressSync(
      [Buffer.from("config")],
      program.programId
    );
  });

  it("Initializes the global config", async () => {
    const quorum = 2; // Need 2 votes to approve
    const minJurors = 3; // Need at least 3 jurors to vote

    await program.methods
      .initialize(quorum, minJurors)
      .accounts({
        config: configPda,
        admin: admin.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([admin])
      .rpc();

    const config = await program.account.globalConfig.fetch(configPda);
    assert.equal(config.admin.toString(), admin.publicKey.toString());
    assert.equal(config.quorum, quorum);
    assert.equal(config.minJurors, minJurors);
    console.log("✓ Config initialized with quorum:", quorum, "min jurors:", minJurors);
  });

  it("Updates validator list", async () => {
    const validatorPubkeys = validators.map((v) => v.publicKey);

    await program.methods
      .updateValidators(validatorPubkeys)
      .accounts({
        config: configPda,
        admin: admin.publicKey,
      })
      .signers([admin])
      .rpc();

    const config = await program.account.globalConfig.fetch(configPda);
    assert.equal(config.validatorList.length, 5);
    console.log("✓ Validators updated:", config.validatorList.length);
  });

  it("Submits evidence for a scam case", async () => {
    const caseId = new anchor.BN(1);
    const evidence = "Phishing attack - stole 10 SOL via fake airdrop link";

    const [casePda, caseBump] = PublicKey.findProgramAddressSync(
      [Buffer.from("case"), caseId.toArrayLike(Buffer, "le", 8)],
      program.programId
    );

    await program.methods
      .submitEvidence(caseId, evidence, scammer, caseBump)
      .accounts({
        caseAccount: casePda,
        reporter: reporter.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([reporter])
      .rpc();

    const caseAccount = await program.account.caseAccount.fetch(casePda);
    assert.equal(caseAccount.caseId.toString(), caseId.toString());
    assert.equal(caseAccount.scamAddress.toString(), scammer.toString());
    assert.equal(caseAccount.evidence, evidence);
    assert.equal(caseAccount.state.pendingJurors !== undefined, true);
    console.log("✓ Case submitted - ID:", caseId.toString());
  });

  it("Selects jurors for the case", async () => {
    const caseId = new anchor.BN(1);
    const [casePda] = PublicKey.findProgramAddressSync(
      [Buffer.from("case"), caseId.toArrayLike(Buffer, "le", 8)],
      program.programId
    );

    // Mock VRF account (in production, this would be a real Switchboard VRF)
    const vrfAccount = Keypair.generate();
    await provider.connection.requestAirdrop(
      vrfAccount.publicKey,
      anchor.web3.LAMPORTS_PER_SOL
    );
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Request jurors
    await program.methods
      .requestJurors(caseId)
      .accounts({
        caseAccount: casePda,
        vrfAccount: vrfAccount.publicKey,
        authority: reporter.publicKey,
      })
      .signers([reporter])
      .rpc();

    // Select jurors
    await program.methods
      .selectJurors()
      .accounts({
        caseAccount: casePda,
        config: configPda,
        vrfAccount: vrfAccount.publicKey,
      })
      .rpc();

    const caseAccount = await program.account.caseAccount.fetch(casePda);
    assert.equal(caseAccount.jurors.length, 3);
    assert.equal(caseAccount.state.voting !== undefined, true);
    console.log("✓ Jurors selected:", caseAccount.jurors.length);
    console.log("  Selected jurors:", caseAccount.jurors.map((j: any) => j.toString()));
  });

  it("Jurors vote on the case - Approval scenario", async () => {
    const caseId = new anchor.BN(1);
    const [casePda] = PublicKey.findProgramAddressSync(
      [Buffer.from("case"), caseId.toArrayLike(Buffer, "le", 8)],
      program.programId
    );

    let caseAccount = await program.account.caseAccount.fetch(casePda);
    const selectedJurors = caseAccount.jurors;

    // Find which validators were selected as jurors
    const jurorSigners = validators.filter((v) =>
      selectedJurors.some((j: PublicKey) => j.equals(v.publicKey))
    );

    console.log("\n--- Voting Process ---");

    // First juror votes to approve
    await program.methods
      .vote(true)
      .accounts({
        juror: jurorSigners[0].publicKey,
        caseAccount: casePda,
        config: configPda,
        systemProgram: SystemProgram.programId,
      })
      .signers([jurorSigners[0]])
      .rpc();

    caseAccount = await program.account.caseAccount.fetch(casePda);
    console.log("✓ Juror 1 voted: APPROVE");
    console.log("  Votes for:", caseAccount.votesFor.toString());
    console.log("  Votes against:", caseAccount.votesAgainst.toString());

    // Second juror votes to approve (reaches quorum)
    await program.methods
      .vote(true)
      .accounts({
        juror: jurorSigners[1].publicKey,
        caseAccount: casePda,
        config: configPda,
        systemProgram: SystemProgram.programId,
      })
      .signers([jurorSigners[1]])
      .rpc();

    caseAccount = await program.account.caseAccount.fetch(casePda);
    console.log("✓ Juror 2 voted: APPROVE");
    console.log("  Votes for:", caseAccount.votesFor.toString());
    console.log("  Votes against:", caseAccount.votesAgainst.toString());

    // Check if case was approved (quorum = 2)
    assert.equal(caseAccount.votesFor.toString(), "2");
    assert.equal(caseAccount.state.approved !== undefined, true);
    assert.equal(caseAccount.status.frozen !== undefined, true);
    console.log("\n✓ CASE APPROVED - Quorum reached!");
    console.log("  Final status:", Object.keys(caseAccount.status)[0]);
    console.log("  Final state:", Object.keys(caseAccount.state)[0]);
  });

  it("Prevents double voting", async () => {
    const caseId = new anchor.BN(2);
    const evidence = "Rug pull - project disappeared with 100 SOL";

    // Create new case
    const [casePda, caseBump] = PublicKey.findProgramAddressSync(
      [Buffer.from("case"), caseId.toArrayLike(Buffer, "le", 8)],
      program.programId
    );

    await program.methods
      .submitEvidence(caseId, evidence, Keypair.generate().publicKey, caseBump)
      .accounts({
        caseAccount: casePda,
        reporter: reporter.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([reporter])
      .rpc();

    // Setup VRF and select jurors
    const vrfAccount = Keypair.generate();
    await provider.connection.requestAirdrop(
      vrfAccount.publicKey,
      anchor.web3.LAMPORTS_PER_SOL
    );
    await new Promise((resolve) => setTimeout(resolve, 1000));

    await program.methods
      .requestJurors(caseId)
      .accounts({
        caseAccount: casePda,
        vrfAccount: vrfAccount.publicKey,
        authority: reporter.publicKey,
      })
      .signers([reporter])
      .rpc();

    await program.methods
      .selectJurors()
      .accounts({
        caseAccount: casePda,
        config: configPda,
        vrfAccount: vrfAccount.publicKey,
      })
      .rpc();

    const caseAccount = await program.account.caseAccount.fetch(casePda);
    const selectedJurors = caseAccount.jurors;
    const jurorSigners = validators.filter((v) =>
      selectedJurors.some((j: PublicKey) => j.equals(v.publicKey))
    );

    // First vote succeeds
    await program.methods
      .vote(true)
      .accounts({
        juror: jurorSigners[0].publicKey,
        caseAccount: casePda,
        config: configPda,
        systemProgram: SystemProgram.programId,
      })
      .signers([jurorSigners[0]])
      .rpc();

    // Second vote from same juror should fail
    try {
      await program.methods
        .vote(true)
        .accounts({
          juror: jurorSigners[0].publicKey,
          caseAccount: casePda,
          config: configPda,
          systemProgram: SystemProgram.programId,
        })
        .signers([jurorSigners[0]])
        .rpc();
      assert.fail("Should have thrown error for double voting");
    } catch (error: any) {
      assert.include(error.toString(), "AlreadyVoted");
      console.log("✓ Double voting prevented successfully");
    }
  });

  it("Rejects case when not enough approval votes", async () => {
    const caseId = new anchor.BN(3);
    const evidence = "Fake NFT marketplace";

    const [casePda, caseBump] = PublicKey.findProgramAddressSync(
      [Buffer.from("case"), caseId.toArrayLike(Buffer, "le", 8)],
      program.programId
    );

    await program.methods
      .submitEvidence(caseId, evidence, Keypair.generate().publicKey, caseBump)
      .accounts({
        caseAccount: casePda,
        reporter: reporter.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([reporter])
      .rpc();

    const vrfAccount = Keypair.generate();
    await provider.connection.requestAirdrop(
      vrfAccount.publicKey,
      anchor.web3.LAMPORTS_PER_SOL
    );
    await new Promise((resolve) => setTimeout(resolve, 1000));

    await program.methods
      .requestJurors(caseId)
      .accounts({
        caseAccount: casePda,
        vrfAccount: vrfAccount.publicKey,
        authority: reporter.publicKey,
      })
      .signers([reporter])
      .rpc();

    await program.methods
      .selectJurors()
      .accounts({
        caseAccount: casePda,
        config: configPda,
        vrfAccount: vrfAccount.publicKey,
      })
      .rpc();

    let caseAccount = await program.account.caseAccount.fetch(casePda);
    const selectedJurors = caseAccount.jurors;
    const jurorSigners = validators.filter((v) =>
      selectedJurors.some((j: PublicKey) => j.equals(v.publicKey))
    );

    // All 3 jurors vote to reject
    for (let i = 0; i < 3; i++) {
      await program.methods
        .vote(false)
        .accounts({
          juror: jurorSigners[i].publicKey,
          caseAccount: casePda,
          config: configPda,
          systemProgram: SystemProgram.programId,
        })
        .signers([jurorSigners[i]])
        .rpc();
    }

    caseAccount = await program.account.caseAccount.fetch(casePda);
    assert.equal(caseAccount.votesAgainst.toString(), "3");
    assert.equal(caseAccount.state.rejected !== undefined, true);
    assert.equal(caseAccount.status.closed !== undefined, true);
    console.log("✓ Case rejected - Not enough approval votes");
  });
});
