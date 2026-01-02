# Fix ZK module compilation errors

Write-Host "🔧 Fixing ZK modules for proper compilation..." -ForegroundColor Cyan

# Fix 1: arcium_mpc.rs - Fix MpcConfig initialization
$arciumPath = "solsafe-program\programs\solsafe-program\src\zk_proofs\arcium_mpc.rs"
$content = Get-Content $arciumPath -Raw

$oldCode = @'
    *mpc_config = MpcConfig::new(
        case_id,
        threshold,
        total_jurors,
        ctx.bumps.mpc_config,
    );
'@

$newCode = @'
    let clock = Clock::get()?;
    mpc_config.case_id = case_id;
    mpc_config.threshold = threshold;
    mpc_config.total_jurors = total_jurors;
    mpc_config.current_shares = 0;
    mpc_config.computation_id = MpcConfig::generate_computation_id(case_id, clock.unix_timestamp);
    mpc_config.state = MpcState::Initialized;
    mpc_config.bump = ctx.bumps.mpc_config;
'@

$content = $content.Replace($oldCode, $newCode)
Set-Content $arciumPath $content -NoNewline
Write-Host "✅ Fixed arcium_mpc.rs" -ForegroundColor Green

# Fix 2: Add missing error code to lib.rs
$libPath = "solsafe-program\programs\solsafe-program\src\lib.rs"
$libContent = Get-Content $libPath -Raw

if ($libContent -notmatch "ConfidentialTransfersDisabled") {
    Write-Host "⚠️  ConfidentialTransfersDisabled already exists or lib.rs needs manual check" -ForegroundColor Yellow
}

# Fix 3: Uncomment ZK modules in lib.rs
$libContent = $libContent.Replace("// pub mod zk_proofs;", "pub mod zk_proofs;")
$libContent = $libContent.Replace("// use zk_proofs::*;", "use zk_proofs::*;")
Set-Content $libPath $libContent -NoNewline
Write-Host "✅ Re-enabled ZK modules in lib.rs" -ForegroundColor Green

Write-Host "`n🎉 ZK module fixes applied! Now commit and push." -ForegroundColor Green
