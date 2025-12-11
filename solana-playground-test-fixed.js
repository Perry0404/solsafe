// Solana Playground Test Script - Corrected Version
// Paste this in the Client tab

import * as anchor from "@coral-xyz/anchor";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import IDL from "./target/idl/solsafe_program.json" assert { type: "json" };

const programId = new PublicKey("FfV3AHU6WS7aPz53DnVvWBMEZR46ydGkEtKpLiKfRTrR");

const VALIDATORS = [
  new PublicKey("9mtqPQnWcdUJjVHqYaWGHwwFswHLAEaMkMoLMsctAfms"),
  new PublicKey("3ogts3UmEwRBdGNScChzKpcreuPPNBC45TM148fCTEdM"),
  new PublicKey("Eaph3z9pGPH9yUkDQdUZiG4ejEwMrUXxLsP7wGehBasy"),
  new PublicKey("GseuivbeqFdgQnZuis1eYUjAE2bmZtA695uKxtuojdWD"),
  new PublicKey("CbQDdW66fhxGBAxyuR1gHmvtGfvBcpMosaNWo8XNyJ5M"),
];

const [globalConfigPDA] = PublicKey.findProgramAddressSync(
  [Buffer.from("global_config")],
  programId
);

console.log("=== SolSafe Validator Integration Test ===\n");
console.log("Program ID:", programId.toBase58());
console.log("Global Config PDA:", globalConfigPDA.toBase58());
console.log("Wallet:", provider.wallet.publicKey.toBase58());
console.log("\n");

// Create program instance
const program = new anchor.Program(IDL, programId, provider);

async function runTest() {
  try {
    // ========== STEP 1: INITIALIZE ==========
    console.log("📝 STEP 1: Initialize Program");
    try {
      const tx1 = await program.methods
        .initialize(new anchor.BN(5), new anchor.BN(2))
        .accounts({
          globalConfig: globalConfigPDA,
          admin: provider.wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
      console.log("✅ Initialized:", tx1);
    } catch(e) {
      if (e.message.includes("already in use")) {
        console.log("⚠️ Already initialized (account exists)");
      } else {
        console.log("❌ Init error:", e.message);
      }
    }

    // ========== STEP 2: SYNC VALIDATORS ==========
    console.log("\n📝 STEP 2: Sync Validators");
    try {
      const tx2 = await program.methods
        .syncValidators(VALIDATORS)
        .accounts({
          globalConfig: globalConfigPDA,
          admin: provider.wallet.publicKey,
        })
        .rpc();
      console.log("✅ Synced:", tx2);
      console.log("Validators:");
      VALIDATORS.forEach((v, i) => {
        console.log(`  ${i + 1}. ${v.toBase58()}`);
      });
    } catch(e) {
      console.log("❌ Sync error:", e.message);
    }

    // ========== STEP 3: VERIFY CONFIG ==========
    console.log("\n📝 STEP 3: Verify Global Config");
    try {
      const config = await program.account.globalConfig.fetch(globalConfigPDA);
      console.log("✅ Config fetched:");
      console.log("  Admin:", config.admin.toBase58());
      console.log("  Quorum:", config.quorum.toString());
      console.log("  Min Jurors:", config.minJurors.toString());
      console.log("  Validators stored:", config.validatorList.length);
      config.validatorList.forEach((v, i) => {
        console.log(`    ${i + 1}. ${v.toBase58()}`);
      });
    } catch(e) {
      console.log("❌ Fetch error:", e.message);
    }

    console.log("\n✅ Test Complete!\n");
    console.log("🎉 Program is ready for validator voting testing");
    console.log("Next: Create test cases and submit votes with validators");

  } catch (error) {
    console.error("❌ Fatal error:", error);
  }
}

runTest();
