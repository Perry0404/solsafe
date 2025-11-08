import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PublicKey, Keypair, SystemProgram } from "@solana/web3.js";
import { expect } from "chai";
import BN from "bn.js";

describe("vote-guard", () => {
  // Use the local provider
  const provider = anchor.AnchorProvider.local();
  anchor.setProvider(provider);
  const program = anchor.workspace.SolsafeProgram as Program;

  it("prevents double voting by same validator", async () => {
    // 1) Initialize GlobalConfig (create a new keypair for the config account)
    const configKeypair = Keypair.generate();
    await program.methods
      .initialize()
      .accounts({
        config: configKeypair.publicKey,
        admin: provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([configKeypair])
      .rpc();

    // 2) Populate validators so provider.wallet.publicKey is index 1.
    const dummyA = Keypair.generate();
    const dummyB = Keypair.generate();
    const validators = [
      dummyA.publicKey,
      provider.wallet.publicKey, // ensure wallet is in the list (index 1)
      dummyB.publicKey,
    ];
    await program.methods
      .updateValidators(validators)
      .accounts({ config: configKeypair.publicKey, admin: provider.wallet.publicKey })
      .rpc();

    // 3) Submit a case (case_id = 1)
    const caseId = new BN(1);
    const caseIdBuf = Buffer.alloc(8);
    caseId.toArrayLike(Buffer, "le", 8).copy(caseIdBuf, 0);
    const [casePda] = PublicKey.findProgramAddressSync(
      [Buffer.from("case"), provider.wallet.publicKey.toBuffer(), caseIdBuf],
      program.programId
    );

    await program.methods
      .submitEvidence(1, "evidence CID or text", provider.wallet.publicKey)
      .accounts({
        caseAccount: casePda,
        submitter: provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    // 4) request_jurors (store vrf_request) and select_jurors (uses placeholder randomness)
    const vrfAccount = Keypair.generate();
    await program.methods
      .requestJurors(1)
      .accounts({
        caseAccount: casePda,
        vrfAccount: vrfAccount.publicKey,
        programAuthority: provider.wallet.publicKey,
      })
      .rpc();

    await program.methods
      .selectJurors()
      .accounts({
        caseAccount: casePda,
        config: configKeypair.publicKey,
        vrfAccount: vrfAccount.publicKey,
      })
      .rpc();

    // 5) Fetch case account to get jurors
    const caseAccount = await program.account.caseAccount.fetch(casePda);
    const jurors: PublicKey[] = caseAccount.jurors;
    expect(jurors.map((j: PublicKey) => j.toString())).to.include(provider.wallet.publicKey.toString());

    // 6) Cast a vote as provider.wallet (should succeed)
    const [voteRecordPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("vote"), casePda.toBuffer(), provider.wallet.publicKey.toBuffer()],
      program.programId
    );

    await program.methods
      .vote(true)
      .accounts({
        caseAccount: casePda,
        validator: provider.wallet.publicKey,
        voteRecord: voteRecordPda,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    // 7) Attempt to vote again with the same validator — should fail because voteRecord already exists
    let thrown = false;
    try {
      await program.methods
        .vote(true)
        .accounts({
          caseAccount: casePda,
          validator: provider.wallet.publicKey,
          voteRecord: voteRecordPda,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
    } catch (err) {
      thrown = true;
      const msg = err.toString();
      expect(msg).to.match(/already|in use|Account already initialized|duplicate/i);
    }
    expect(thrown).to.equal(true);
  });
});
