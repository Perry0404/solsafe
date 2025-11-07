import * as anchor from "@coral-xyz/anchor";
import { Program, BN, AnchorProvider } from "@coral-xyz/anchor";
import { SolsafeProgram } from "../target/types/solsafe_program";
import { PublicKey, Keypair, SystemProgram } from "@solana/web3.js";
import { expect } from "chai";

describe("vote one-vote-per-wallet enforcement", () => {
  // Use local provider
  const provider = AnchorProvider.local();
  anchor.setProvider(provider);

  const program = anchor.workspace.SolsafeProgram as Program<SolsafeProgram>;

  let configPda: PublicKey;
  let caseAccountPda: PublicKey;
  let voteRecordPda: PublicKey;
  const caseId = new BN(1);
  const submitter = provider.wallet.publicKey;

  before(async () => {
    // Derive config PDA (though Initialize doesn't use seeds in current code, we'll call initialize)
    // Note: The Initialize context doesn't use seeds, so config must be a new keypair or we use a PDA pattern.
    // Looking at the code, Initialize uses init without seeds, so we need a keypair for config.
    // However, for consistency with typical Anchor patterns, let's assume a PDA pattern if needed.
    // Since the code uses `init` without seeds for config, we'll create a Keypair for it.
    
    // Actually, reviewing Initialize struct: it uses init without seeds, so config is a new account.
    // We'll create it as a Keypair for this test.
  });

  it("initializes GlobalConfig and sets up validators", async () => {
    // Create config account as Keypair
    const configKeypair = Keypair.generate();
    configPda = configKeypair.publicKey;

    await program.methods
      .initialize()
      .accounts({
        config: configPda,
        admin: provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([configKeypair])
      .rpc();

    // Update validators to include the provider wallet at index 1
    // This ensures select_jurors will deterministically pick the payer as a juror
    const validators = [
      Keypair.generate().publicKey,
      provider.wallet.publicKey,
      Keypair.generate().publicKey,
    ];

    await program.methods
      .updateValidators(validators)
      .accounts({
        config: configPda,
        admin: provider.wallet.publicKey,
      })
      .rpc();

    const configAccount = await program.account.globalConfig.fetch(configPda);
    expect(configAccount.validatorList).to.have.lengthOf(3);
    expect(configAccount.validatorList[1].toString()).to.equal(
      provider.wallet.publicKey.toString()
    );
  });

  it("submits a case with case_id = 1", async () => {
    // Derive case PDA: seeds = [b"case", submitter.key(), &case_id.to_le_bytes()]
    const [casePda, _bump] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("case"),
        submitter.toBuffer(),
        caseId.toArrayLike(Buffer, "le", 8),
      ],
      program.programId
    );
    caseAccountPda = casePda;

    const scamAddress = Keypair.generate().publicKey;
    const evidence = "Evidence of scam activity";

    await program.methods
      .submitEvidence(caseId, evidence, scamAddress)
      .accounts({
        caseAccount: caseAccountPda,
        submitter: provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    const caseAccount = await program.account.caseAccount.fetch(caseAccountPda);
    expect(caseAccount.caseId.toString()).to.equal(caseId.toString());
    expect(caseAccount.evidence).to.equal(evidence);
  });

  it("requests and selects jurors for the case", async () => {
    // Request jurors - needs a VRF account (we'll use a dummy unchecked account)
    const vrfAccount = Keypair.generate().publicKey;

    await program.methods
      .requestJurors(caseId)
      .accounts({
        caseAccount: caseAccountPda,
        vrfAccount: vrfAccount,
        programAuthority: provider.wallet.publicKey,
      })
      .rpc();

    // Select jurors - this will use placeholder randomness based on case_id
    await program.methods
      .selectJurors()
      .accounts({
        caseAccount: caseAccountPda,
        config: configPda,
        vrfAccount: vrfAccount,
      })
      .rpc();

    const caseAccount = await program.account.caseAccount.fetch(caseAccountPda);
    expect(caseAccount.jurors).to.have.lengthOf(3);
    
    // Since select_jurors uses case_id as randomness seed, it should be deterministic
    // Check that provider.wallet is among the jurors
    const isJuror = caseAccount.jurors.some(
      (j) => j.toString() === provider.wallet.publicKey.toString()
    );
    expect(isJuror).to.be.true;
  });

  it("allows validator to vote once", async () => {
    // Derive VoteRecord PDA: seeds = [b"vote", case.key(), validator.key()]
    const [votePda, _bump] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("vote"),
        caseAccountPda.toBuffer(),
        provider.wallet.publicKey.toBuffer(),
      ],
      program.programId
    );
    voteRecordPda = votePda;

    // First vote should succeed
    await program.methods
      .vote(true)
      .accounts({
        caseAccount: caseAccountPda,
        validator: provider.wallet.publicKey,
        voteRecord: voteRecordPda,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    const caseAccount = await program.account.caseAccount.fetch(caseAccountPda);
    expect(caseAccount.votesFor.toString()).to.equal("1");
  });

  it("prevents validator from voting twice (duplicate vote)", async () => {
    // Attempting to vote again with the same VoteRecord PDA should fail
    // because the account already exists (init will fail)
    try {
      await program.methods
        .vote(true)
        .accounts({
          caseAccount: caseAccountPda,
          validator: provider.wallet.publicKey,
          voteRecord: voteRecordPda,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      // If we reach here, the test should fail
      expect.fail("Expected vote to fail due to duplicate VoteRecord");
    } catch (error) {
      // Check that the error is related to account already initialized
      const errorMessage = error.toString();
      expect(
        errorMessage.includes("already in use") ||
        errorMessage.includes("custom program error: 0x0") ||
        errorMessage.includes("AccountAlreadyInitialized")
      ).to.be.true;
    }
  });
});
