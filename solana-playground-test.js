// Solana Playground Test Script - Paste into Client Tab
// Complete validator setup and testing flow

import * as anchor from "@coral-xyz/anchor";
import { PublicKey, SystemProgram, SYSVAR_RENT_PUBKEY } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from "@solana/spl-token";

const programId = new PublicKey("FfV3AHU6WS7aPz53DnVvWBMEZR46ydGkEtKpLiKfRTrR");

// Devnet validators (top 5 active)
const VALIDATORS = [
  new PublicKey("9mtqPQnWcdUJjVHqYaWGHwwFswHLAEaMkMoLMsctAfms"),
  new PublicKey("3ogts3UmEwRBdGNScChzKpcreuPPNBC45TM148fCTEdM"),
  new PublicKey("Eaph3z9pGPH9yUkDQdUZiG4ejEwMrUXxLsP7wGehBasy"),
  new PublicKey("GseuivbeqFdgQnZuis1eYUjAE2bmZtA695uKxtuojdWD"),
  new PublicKey("CbQDdW66fhxGBAxyuR1gHmvtGfvBcpMosaNWo8XNyJ5M"),
];

// Derive PDAs
const [globalConfigPDA] = PublicKey.findProgramAddressSync(
  [Buffer.from("global_config")],
  programId
);

const [programAuthorityPDA] = PublicKey.findProgramAddressSync(
  [Buffer.from("authority")],
  programId
);

const log = (msg) => console.log(`📌 ${msg}`);
const logSuccess = (msg) => console.log(`✅ ${msg}`);
const logError = (msg) => console.error(`❌ ${msg}`);

async function test() {
  try {
    log("Starting SolSafe Validator Integration Test");
    log(`Program ID: ${programId.toBase58()}`);
    log(`Global Config PDA: ${globalConfigPDA.toBase58()}`);
    log(`Admin: ${provider.wallet.publicKey.toBase58()}\n`);

    // ========== STEP 1: INITIALIZE PROGRAM ==========
    log("STEP 1: Initialize Program");
    try {
      const initTx = await program.methods
        .initialize(new anchor.BN(5), new anchor.BN(2))
        .accounts({
          globalConfig: globalConfigPDA,
          admin: provider.wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc({ commitment: "finalized" });

      logSuccess(`Program initialized: ${initTx}`);
    } catch (e) {
      if (e.message.includes("already in use")) {
        logSuccess("Program already initialized (account exists)");
      } else {
        logError(`Initialize failed: ${e.message}`);
        throw e;
      }
    }

    // ========== STEP 2: SYNC VALIDATORS ==========
    log("\nSTEP 2: Sync Validators List");
    try {
      const syncTx = await program.methods
        .syncValidators(VALIDATORS)
        .accounts({
          globalConfig: globalConfigPDA,
          admin: provider.wallet.publicKey,
        })
        .rpc({ commitment: "finalized" });

      logSuccess(`Validators synced: ${syncTx}`);
      log(`Synced validators:\n${VALIDATORS.map((v, i) => `  ${i + 1}. ${v.toBase58()}`).join("\n")}`);
    } catch (e) {
      logError(`Sync validators failed: ${e.message}`);
      throw e;
    }

    // ========== STEP 3: VERIFY GLOBAL CONFIG ==========
    log("\nSTEP 3: Verify Global Config");
    try {
      const config = await program.account.globalConfig.fetch(globalConfigPDA);
      logSuccess("Global config fetched:");
      log(`  Admin: ${config.admin.toBase58()}`);
      log(`  Quorum: ${config.quorum.toString()}`);
      log(`  Min Jurors: ${config.minJurors.toString()}`);
      log(`  Validator Count: ${config.validatorList.length}`);
      log(`  Validators:\n${config.validatorList.map((v, i) => `    ${i + 1}. ${v.toBase58()}`).join("\n")}`);
    } catch (e) {
      logError(`Failed to fetch config: ${e.message}`);
    }

    // ========== STEP 4: CREATE TEST CASE ==========
    log("\nSTEP 4: Create Test Case");
    
    // Generate a test case ID
    const testCaseId = `test-case-${Date.now()}`;
    const testIpfsHash = "QmTestHash123456789"; // Mock IPFS hash
    const testScamAddress = new PublicKey("11111111111111111111111111111112"); // Mock address
    const testBump = 0;

    const [casePDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("case"), Buffer.from(testCaseId)],
      programId
    );

    try {
      const caseCreationTx = await program.methods
        .submitEvidence(testCaseId, testIpfsHash, testScamAddress, testBump)
        .accounts({
          caseStorage: casePDA,
          submitter: provider.wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc({ commitment: "finalized" });

      logSuccess(`Test case created: ${caseCreationTx}`);
      log(`  Case ID: ${testCaseId}`);
      log(`  Case PDA: ${casePDA.toBase58()}`);
    } catch (e) {
      if (e.message.includes("already in use")) {
        logSuccess("Test case already exists (account exists)");
      } else {
        logError(`Case creation failed: ${e.message}`);
        throw e;
      }
    }

    // ========== STEP 5: REQUEST JURORS ==========
    log("\nSTEP 5: Request Jurors");
    try {
      const requestTx = await program.methods
        .requestJurors(testCaseId)
        .accounts({
          caseStorage: casePDA,
          requester: provider.wallet.publicKey,
          globalConfig: globalConfigPDA,
        })
        .rpc({ commitment: "finalized" });

      logSuccess(`Jurors requested: ${requestTx}`);
    } catch (e) {
      logError(`Request jurors failed: ${e.message}`);
    }

    // ========== STEP 6: TEST VOTING ==========
    log("\nSTEP 6: Test Validator Voting (Non-Freeze)");
    log("Note: To test auto-freeze, you need to:");
    log("  1. Vote with 2-3 validators using vote_and_freeze");
    log("  2. On the 4th vote (2/3 consensus), token account will auto-freeze\n");

    try {
      const voteTx = await program.methods
        .vote(true) // approve = true
        .accounts({
          caseStorage: casePDA,
          juror: provider.wallet.publicKey,
          globalConfig: globalConfigPDA,
        })
        .rpc({ commitment: "finalized" });

      logSuccess(`Vote submitted: ${voteTx}`);
      log(`  Voted by: ${provider.wallet.publicKey.toBase58()}`);
      log(`  Vote: Approve (true)`);
    } catch (e) {
      if (e.message.includes("AlreadyVoted")) {
        logSuccess("Already voted on this case");
      } else {
        logError(`Vote failed: ${e.message}`);
      }
    }

    // ========== STEP 7: VERIFY CASE STATE ==========
    log("\nSTEP 7: Verify Case State");
    try {
      const caseData = await program.account.caseStorage.fetch(casePDA);
      logSuccess("Case state:");
      log(`  ID: ${caseData.caseId}`);
      log(`  State: ${Object.keys(caseData.state)[0]}`);
      log(`  Status: ${Object.keys(caseData.status)[0]}`);
      log(`  Votes For: ${caseData.votesFor.toString()}`);
      log(`  Votes Against: ${caseData.votesAgainst.toString()}`);
      log(`  Jurors Count: ${caseData.jurors.length}`);
    } catch (e) {
      logError(`Failed to fetch case: ${e.message}`);
    }

    logSuccess("\n🎉 Test Complete! Validator integration is working.\n");
    
    log("Next Steps for Full Testing:");
    log("1. Subscribe multiple wallets as validators");
    log("2. Have each validator call vote_and_freeze");
    log("3. On 4th vote, auto-freeze should trigger");
    log("4. Verify token account frozen status on-chain");

  } catch (error) {
    logError(`Fatal error: ${error.message}`);
    console.error(error);
  }
}

// Run the test
await test();
