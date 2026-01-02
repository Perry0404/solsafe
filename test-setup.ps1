Write-Host 'Testing SolSafe Connection' -ForegroundColor Cyan
Write-Host '======================================' -ForegroundColor Cyan
Write-Host ''

Write-Host 'Checking Solana CLI...' -ForegroundColor Yellow
try {
    solana --version
    solana config get | Select-String 'RPC URL'
    solana address
    solana balance
} catch {
    Write-Host 'Solana CLI not found!' -ForegroundColor Red
}

Write-Host ''
Write-Host 'Checking Node.js...' -ForegroundColor Yellow
node --version
npm --version

Write-Host ''
Write-Host 'Program ID: FfV3AHU6WS7aPz53DnVvWBMEZR46ydGkEtKpLiKfRTrR' -ForegroundColor Cyan
Write-Host 'Network: Devnet' -ForegroundColor Cyan
Write-Host ''
Write-Host 'Ready to start!' -ForegroundColor Green
