# SolSafe Connection Test Script
Write-Host "🔍 SolSafe Connection Test" -ForegroundColor Cyan
Write-Host "================================`n" -ForegroundColor Cyan

# Test 1: Solana CLI
Write-Host "✓ Testing Solana CLI..." -ForegroundColor Yellow
try {
    $solanaVersion = solana --version 2>$null
    Write-Host "  ✅ Solana CLI: $solanaVersion" -ForegroundColor Green
    
    $config = solana config get 2>$null | Select-String "RPC URL"
    Write-Host "  ✅ $config" -ForegroundColor Green
    
    $wallet = solana address 2>$null
    Write-Host "  ✅ Wallet: $wallet" -ForegroundColor Green
    
    $balance = solana balance 2>$null
    Write-Host "  ✅ Balance: $balance" -ForegroundColor Green
    
    if ($balance -match "^0") {
        Write-Host "  ⚠️  Low balance! Run: solana airdrop 2" -ForegroundColor Yellow
    }
} catch {
    Write-Host "  ❌ Solana CLI not installed or not in PATH" -ForegroundColor Red
}

Write-Host ""

# Test 2: Node.js & NPM
Write-Host "✓ Testing Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version 2>$null
    Write-Host "  ✅ Node.js: $nodeVersion" -ForegroundColor Green
    
    $npmVersion = npm --version 2>$null
    Write-Host "  ✅ NPM: v$npmVersion" -ForegroundColor Green
} catch {
    Write-Host "  ❌ Node.js not installed" -ForegroundColor Red
}

Write-Host ""

# Test 3: Frontend Dependencies
Write-Host "✓ Checking Frontend..." -ForegroundColor Yellow
if (Test-Path ".\frontend\node_modules") {
    Write-Host "  ✅ Frontend dependencies installed" -ForegroundColor Green
} else {
    Write-Host "  ⚠️  Run: cd frontend; npm install" -ForegroundColor Yellow
}

if (Test-Path ".\frontend\src\idl\solsafe_program.json") {
    Write-Host "  ✅ Program IDL found" -ForegroundColor Green
} else {
    Write-Host "  ❌ Program IDL missing!" -ForegroundColor Red
}

Write-Host ""

# Test 4: Backend Setup
Write-Host "✓ Checking Backend..." -ForegroundColor Yellow
if (Test-Path ".\backend\.env") {
    Write-Host "  ✅ Backend .env configured" -ForegroundColor Green
    $envContent = Get-Content ".\backend\.env" -Raw
    if ($envContent -match "FfV3AHU6WS7aPz53DnVvWBMEZR46ydGkEtKpLiKfRTrR") {
        Write-Host "  ✅ Program ID configured" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️  Program ID may need update" -ForegroundColor Yellow
    }
} else {
    Write-Host "  ⚠️  Backend .env not found (optional)" -ForegroundColor Yellow
}

Write-Host ""

# Test 5: Program Deployment
Write-Host "✓ Checking Program Deployment..." -ForegroundColor Yellow
$programId = "FfV3AHU6WS7aPz53DnVvWBMEZR46ydGkEtKpLiKfRTrR"
Write-Host "  📍 Program ID: $programId" -ForegroundColor Cyan
Write-Host "  🔗 Explorer: https://explorer.solana.com/address/$programId`?cluster=devnet" -ForegroundColor Cyan

Write-Host ""

# Test 6: Wallet Files
Write-Host "✓ Checking Wallet Configuration..." -ForegroundColor Yellow
$walletPath = "$env:USERPROFILE\.config\solana\id.json"
if (Test-Path $walletPath) {
    Write-Host "  ✅ Wallet keypair found" -ForegroundColor Green
} else {
    Write-Host "  ⚠️  Wallet keypair not found at: $walletPath" -ForegroundColor Yellow
    Write-Host "     Run: solana-keygen new" -ForegroundColor Gray
}

Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host "🚀 Ready to Test!" -ForegroundColor Green
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "  1. cd frontend" -ForegroundColor White
Write-Host "  2. npm start" -ForegroundColor White
Write-Host "  3. Open http://localhost:3000" -ForegroundColor White
Write-Host "  4. Connect wallet (Phantom or Solflare on Devnet)" -ForegroundColor White
Write-Host ""
