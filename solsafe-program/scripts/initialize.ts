import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import fs from "fs";

async function initialize() {
  // Load the provider from Anchor.toml or environment
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  // Get program ID from environment or use default
  const programId = new PublicKey(
    process.env.PROGRAM_ID || "ReplaceAfterDeploy1234567890"
  );

  console.log("🚀 Initializing SolSafe Program");
  console.log("Program ID:", programId.toString());
  console.log("Admin:", provider.wallet.publicKey.toString());

  // Load the IDL
  let idl;
  try {
    // Try to fetch IDL from chain (if deployed with IDL)
    idl = await Program.fetchIdl(programId, provider);
  } catch (e) {
    // Fall back to local IDL
    const idlPath = "../target/idl/solsafe_program.json";
    if (fs.existsSync(idlPath)) {
      idl = JSON.parse(fs.readFileSync(idlPath, "utf8"));
    } else {
      throw new Error(
        "IDL not found. Please build the program first with 'anchor build'"
      );
    }
  }

  const program = new Program(idl as anchor.Idl, programId, provider);

  // Derive the config PDA
  const [configPda, configBump] = PublicKey.findProgramAddressSync(
    [Buffer.from("config")],
    program.programId
  );

  console.log("Config PDA:", configPda.toString());

  // Check if config already exists
  try {
    const configAccount = await program.account.globalConfig.fetch(configPda);
    console.log("⚠️  Config account already initialized!");
    console.log("Current admin:", configAccount.admin.toString());
    console.log("Validators:", configAccount.validatorList.length);
    return;
  } catch (e) {
    // Account doesn't exist, proceed with initialization
    console.log("✅ Config account not found, proceeding with initialization...");
  }

  // Initialize the program
  try {
    const tx = await program.methods
      .initialize()
      .accounts({
        config: configPda,
        admin: provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    console.log("✅ Program initialized successfully!");
    console.log("Transaction signature:", tx);
    console.log("Config PDA:", configPda.toString());
    console.log("Admin:", provider.wallet.publicKey.toString());
  } catch (error) {
    console.error("❌ Initialization failed:", error);
    throw error;
  }
}

initialize()
  .then(() => {
    console.log("\n🎉 Initialization complete!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Initialization failed:", error);
    process.exit(1);
  });
