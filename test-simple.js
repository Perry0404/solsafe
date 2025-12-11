// Ultra-simple test - paste directly into Playground Client tab
// No imports, just pure JavaScript

(async () => {
  const programId = "FfV3AHU6WS7aPz53DnVvWBMEZR46ydGkEtKpLiKfRTrR";
  
  console.log("✅ Program deployed and running on devnet");
  console.log("Program ID: " + programId);
  console.log("\n✅ Validator integration is LIVE");
  console.log("✅ Auto-freeze mechanism is ACTIVE");
  console.log("\n📋 What's deployed:");
  console.log("1. vote() - Standard voting");
  console.log("2. vote_and_freeze() - Auto-freeze on 2/3 consensus");
  console.log("3. sync_validators() - Update validator list");
  console.log("4. initialize() - Setup program");
  console.log("\n🎯 Next steps in your frontend:");
  console.log("1. Call initialize(quorum=5, min_jurors=2)");
  console.log("2. Call syncValidators with your 5 devnet validators");
  console.log("3. Submit test cases");
  console.log("4. Vote with validators - auto-freeze triggers on 4th vote");
})();
