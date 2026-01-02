@echo off
echo =======================================
echo SolSafe - Quick Start Testing Guide
echo =======================================
echo.

echo Step 1: Get Your Wallet Address
echo --------------------------------
solana-keygen pubkey "C:\Users\HP SPECTRE X360 13\.config\solana\id.json" 2>nul
if %errorlevel% neq 0 (
    echo Creating new wallet...
    solana-keygen new --outfile "C:\Users\HP SPECTRE X360 13\.config\solana\id.json" --no-bip39-passphrase --force
)

echo.
echo Step 2: Get Devnet SOL
echo ----------------------
echo Requesting airdrop...
solana airdrop 2
timeout /t 2 /nobreak >nul
solana airdrop 2

echo.
echo Step 3: Check Balance
echo ---------------------
solana balance

echo.
echo =======================================
echo Setup Complete!
echo =======================================
echo.
echo Program ID: FfV3AHU6WS7aPz53DnVvWBMEZR46ydGkEtKpLiKfRTrR
echo Network: Devnet
echo.
echo Next: Start the frontend
echo   cd frontend
echo   npm start
echo.
echo Then connect your Phantom/Solflare wallet (on Devnet)
echo.
pause
