// Direct Solana RPC approach - No workspace needed
// This works even if program isn't built in Playground

import { PublicKey, SystemProgram, Transaction, TransactionInstruction } from "@solana/web3.js";
import * as borsh from "@coral-xyz/borsh";

const PROGRAM_ID = new PublicKey("FfV3AHU6WS7aPz53DnVvWBMEZR46ydGkEtKpLiKfRTrR");

const VALIDATORS = [
  new PublicKey("9mtqPQnWcdUJjVHqYaWGHwwFswHLAEaMkMoLMsctAfms"),
  new PublicKey("3ogts3UmEwRBdGNScChzKpcreuPPNBC45TM148fCTEdM"),
  new PublicKey("Eaph3z9pGPH9yUkDQdUZiG4ejEwMrUXxLsP7wGehBasy"),
  new PublicKey("GseuivbeqFdgQnZuis1eYUjAE2bmZtA695uKxtuojdWD"),
  new PublicKey("CbQDdW66fhxGBAxyuR1gHmvtGfvBcpMosaNWo8XNyJ5M"),
];

const [globalConfigPDA] = PublicKey.findProgramAddressSync(
  [Buffer.from("global_config")],
  PROGRAM_ID
);

console.log("=== SolSafe Direct Instruction Test ===\n");
console.log("Program ID:", PROGRAM_ID.toBase58());
console.log("Global Config PDA:", globalConfigPDA.toBase58());
console.log("Wallet:", provider.wallet.publicKey.toBase58());
console.log("\n");

async function sendTransaction(instructions) {
  try {
    const tx = new Transaction().add(...instructions);
    const sig = await provider.sendAndConfirm(tx);
    console.log("✅ Transaction:", sig);
    return sig;
  } catch (e) {
    console.error("❌ Error:", e.message);
    throw e;
  }
}

async function runTest() {
  try {
    console.log("📝 STEP 1: Check if global config exists");
    try {
      const account = await provider.connection.getAccountInfo(globalConfigPDA);
      if (account) {
        console.log("✅ Global config already initialized");
        console.log("   Account size:", account.data.length, "bytes");
      } else {
        console.log("⚠️ Global config not found, needs initialization");
      }
    } catch (e) {
      console.log("⚠️ Could not fetch account:", e.message);
    }

    console.log("\n📝 STEP 2: Verify program exists on devnet");
    try {
      const programAccount = await provider.connection.getAccountInfo(PROGRAM_ID);
      if (programAccount && programAccount.executable) {
        console.log("✅ Program is executable on devnet");
        console.log("   Program size:", programAccount.data.length, "bytes");
        console.log("   Owner:", programAccount.owner.toBase58());
      } else {
        console.log("❌ Program not found or not executable");
      }
    } catch (e) {
      console.log("❌ Error checking program:", e.message);
    }

    console.log("\n📝 STEP 3: Display validator list for reference");
    console.log("Validators to sync:");
    VALIDATORS.forEach((v, i) => {
      console.log(`  ${i + 1}. ${v.toBase58()}`);
    });

    console.log("\n✅ Pre-flight checks complete!");
    console.log("\n📋 Next steps:");
    console.log("1. Make sure Solana Playground has BUILT the program (click Build button)");
    console.log("2. Use the Anchor client to send initialize and syncValidators instructions");
    console.log("3. Or use the web UI to interact with the program");

  } catch (error) {
    console.error("Fatal error:", error);
  }
}

runTest();
