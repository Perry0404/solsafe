import * as anchor from "@coral-xyz/anchor";
import { PublicKey, SystemProgram, Keypair } from "@solana/web3.js";
import { Program } from "@coral-xyz/anchor";
import { SolsafeProgram } from "../target/types/solsafe_program";

describe("Validator Setup & Voting", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.SolsafeProgram as Program<SolsafeProgram>;

  // Devnet validators (first 5 from active list)
  const VALIDATORS = [
    new PublicKey("9mtqPQnWcdUJjVHqYaWGHwwFswHLAEaMkMoLMsctAfms"),
    new PublicKey("3ogts3UmEwRBdGNScChzKpcreuPPNBC45TM148fCTEdM"),
    new PublicKey("Eaph3z9pGPH9yUkDQdUZiG4ejEwMrUXxLsP7wGehBasy"),
    new PublicKey("GseuivbeqFdgQnZuis1eYUjAE2bmZtA695uKxtuojdWD"),
    new PublicKey("CbQDdW66fhxGBAxyuR1gHmvtGfvBcpMosaNWo8XNyJ5M"),
  ];

  const admin = provider.wallet.publicKey;
  const globalConfigKey = PublicKey.findProgramAddressSync(
    [Buffer.from("global_config")],
    program.programId
  )[0];

  it("Initialize program with quorum and min_jurors", async () => {
    try {
      const tx = await program.methods
        .initialize(
          new anchor.BN(5), // quorum - 5 validators total
          new anchor.BN(2)  // min_jurors - 2/3 consensus = 4 required
        )
        .accounts({
          globalConfig: globalConfigKey,
          admin: admin,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      console.log("✅ Program initialized");
      console.log("Transaction:", tx);
    } catch (e) {
      console.error("❌ Initialization failed:", e.message);
      throw e;
    }
  });

  it("Sync validators list", async () => {
    try {
      const tx = await program.methods
        .syncValidators(VALIDATORS)
        .accounts({
          globalConfig: globalConfigKey,
          admin: admin,
        })
        .rpc();

      console.log("✅ Validators synced");
      console.log("Transaction:", tx);
      console.log("Validators:", VALIDATORS.map(v => v.toBase58()));
    } catch (e) {
      console.error("❌ Validator sync failed:", e.message);
      throw e;
    }
  });

  it("Verify validators are stored", async () => {
    try {
      const config = await program.account.globalConfig.fetch(globalConfigKey);
      console.log("✅ Global config retrieved");
      console.log("Stored validators count:", config.validatorList.length);
      console.log("Validators:", config.validatorList.map((v: any) => v.toBase58?.() || v));
    } catch (e) {
      console.error("❌ Config fetch failed:", e.message);
      throw e;
    }
  });
});
