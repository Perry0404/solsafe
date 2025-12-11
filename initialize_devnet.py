#!/usr/bin/env python3
"""
Initialize SolSafe program on devnet with validator list
"""
import subprocess
import json
from solders.pubkey import Pubkey
from solders.system_program import ID as SYSTEM_PROGRAM_ID
from solders.rpc.responses import GetAccountInfoResp
from solana.rpc.api import Client

# Configuration
PROGRAM_ID = "FfV3AHU6WS7aPz53DnVvWBMEZR46ydGkEtKpLiKfRTrR"
RPC_ENDPOINT = "https://api.devnet.solana.com"

# Devnet validators (top 5 active)
VALIDATORS = [
    "9mtqPQnWcdUJjVHqYaWGHwwFswHLAEaMkMoLMsctAfms",
    "3ogts3UmEwRBdGNScChzKpcreuPPNBC45TM148fCTEdM",
    "Eaph3z9pGPH9yUkDQdUZiG4ejEwMrUXxLsP7wGehBasy",
    "GseuivbeqFdgQnZuis1eYUjAE2bmZtA695uKxtuojdWD",
    "CbQDdW66fhxGBAxyuR1gHmvtGfvBcpMosaNWo8XNyJ5M",
]

def run_cmd(cmd):
    """Run shell command and return output"""
    try:
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True, check=False)
        return result.returncode, result.stdout, result.stderr
    except Exception as e:
        return 1, "", str(e)

def main():
    print("🚀 SolSafe Devnet Initialization")
    print(f"Program ID: {PROGRAM_ID}")
    print(f"RPC: {RPC_ENDPOINT}\n")
    
    # Get wallet address
    rc, out, err = run_cmd("solana address")
    if rc != 0:
        print(f"❌ Failed to get wallet: {err}")
        return
    
    wallet = out.strip()
    print(f"✅ Wallet: {wallet}\n")
    
    # Calculate global_config PDA
    rc, out, err = run_cmd(
        f'solana-keygen grind-validator --starts-with global:1 --starts-with global'
    )
    
    # Alternative: Just use anchor-computed PDA manually
    print("📋 Validator List:")
    for i, v in enumerate(VALIDATORS, 1):
        print(f"  {i}. {v}")
    
    print("\n⏳ Next Steps:")
    print("1. Use Solana Playground to call initialize instruction")
    print("   - Quorum: 5 validators")
    print("   - Min jurors: 2 (2/3 of 5 = 3.33 → 4 required)")
    print("\n2. Call sync_validators with the validator list above")
    print("\n3. Submit a test case and vote with validators")
    
    print(f"\n📝 Validator list JSON:")
    print(json.dumps(VALIDATORS, indent=2))

if __name__ == "__main__":
    main()
