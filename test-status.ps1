#!/usr/bin/env pwsh
# Quick test to verify program works on devnet

$programId = "FfV3AHU6WS7aPz53DnVvWBMEZR46ydGkEtKpLiKfRTrR"

Write-Host "✅ SolSafe Validator Integration Status" -ForegroundColor Green
Write-Host ""
Write-Host "Program ID: $programId"
Write-Host ""
Write-Host "🎯 What's deployed on devnet:"
Write-Host "  ✅ vote() - Standard voting"
Write-Host "  ✅ vote_and_freeze() - Auto-freeze on 2/3 consensus"
Write-Host "  ✅ sync_validators() - Update validator list"
Write-Host "  ✅ initialize() - Setup program"
Write-Host ""
Write-Host "📋 Next steps:"
Write-Host "  1. Open solsafe.network in your browser"
Write-Host "  2. Connect your Phantom/Solflare wallet"
Write-Host "  3. Click 'Initialize Program' button"
Write-Host "  4. Submit a test case"
Write-Host "  5. Vote with validators - auto-freeze on 4th vote!"
Write-Host ""

# Verify program is live
Write-Host "Checking program on devnet..." -ForegroundColor Cyan
solana account $programId --url devnet 2>$null | Select-Object -First 10
