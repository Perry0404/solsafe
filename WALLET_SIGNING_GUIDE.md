# Solana Wallet Adapter - Transaction Signing Guide

## Overview

You're already using the **official Solana wallet adapter library** (`@solana/wallet-adapter-react`), which is the recommended approach for wallet integration in Solana dApps.

## ✅ What's Working

Your current implementation uses the **Anchor framework** with the `.rpc()` method, which automatically handles transaction signing through the wallet adapter. This is perfectly fine and is the standard approach.

## Transaction Signing Methods

### Method 1: Using `.rpc()` (Auto-Signing) ✅ **Current Approach**

```typescript
const tx = await program.methods
  .submitEvidence(caseId, evidenceUrl, scamPubkey, bump)
  .accounts({
    caseAccount: casePda,
    reporter: publicKey,
    systemProgram: web3.SystemProgram.programId,
  })
  .rpc(); // This automatically signs with wallet.signTransaction()
```

**Pros:**
- Simple and clean code
- Anchor handles all the complexity
- Automatically uses `wallet.signTransaction()`
- Recommended for most use cases

**Cons:**
- Less control over transaction details
- Can't easily batch transactions

---

### Method 2: Manual `signTransaction` ✅ **Also Works**

```typescript
// Build the instruction
const instruction = await program.methods
  .submitEvidence(caseId, evidenceUrl, scamPubkey, bump)
  .accounts({
    caseAccount: casePda,
    reporter: publicKey,
    systemProgram: web3.SystemProgram.programId,
  })
  .instruction();

// Create transaction
const transaction = new Transaction().add(instruction);

// Get recent blockhash
const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
transaction.recentBlockhash = blockhash;
transaction.feePayer = publicKey;

// Sign the transaction - THIS WILL TRIGGER WALLET POPUP
const signedTransaction = await wallet.signTransaction(transaction);

// Send the signed transaction
const signature = await connection.sendRawTransaction(signedTransaction.serialize());

// Confirm the transaction
await connection.confirmTransaction({
  signature,
  blockhash,
  lastValidBlockHeight,
});
```

**Pros:**
- Full control over transaction details
- Can inspect transaction before signing
- Can batch multiple instructions

**Cons:**
- More verbose code
- Need to handle blockhash and confirmation manually

---

### Method 3: Batch Signing with `signAllTransactions`

```typescript
// For multiple transactions
if (wallet.signAllTransactions) {
  const signedTransactions = await wallet.signAllTransactions([tx1, tx2, tx3]);
  // Send all signed transactions
}
```

**Pros:**
- One wallet popup for multiple transactions
- Better UX for batch operations

**Cons:**
- Not all wallets support this (but Phantom and Solflare do)

---

## ✅ Will `signTransaction` Work?

**YES!** Both methods work because:

1. **Phantom Wallet** supports `signTransaction` and `signAllTransactions`
2. **Solflare Wallet** supports `signTransaction` and `signAllTransactions`
3. The Solana wallet adapter standardizes the interface
4. Your current `.rpc()` method **already uses** `signTransaction` under the hood

---

## Wallet Capabilities Check

```typescript
import { useWallet } from '@solana/wallet-adapter-react';

const wallet = useWallet();

// Check if wallet can sign
const canSign = !!(wallet.publicKey && wallet.signTransaction);

// Check if wallet can batch sign
const canBatchSign = !!(wallet.publicKey && wallet.signAllTransactions);
```

---

## When to Use Each Method

### Use `.rpc()` (Current Method) When:
- ✅ You want simple, clean code
- ✅ Single transaction per operation
- ✅ Standard Anchor program calls
- ✅ **Recommended for most cases**

### Use Manual `signTransaction` When:
- ✅ Need to inspect transaction before signing
- ✅ Adding custom logic before/after signing
- ✅ Combining multiple instructions in one transaction
- ✅ Need transaction size optimization
- ✅ Implementing complex transaction flows

### Use `signAllTransactions` When:
- ✅ Submitting multiple cases at once
- ✅ Batch voting operations
- ✅ Any bulk operations requiring multiple transactions

---

## Updated Dependencies

The `package.json` has been updated with all required packages:

```json
{
  "@coral-xyz/anchor": "^0.30.1",
  "@solana/wallet-adapter-base": "^0.9.23",
  "@solana/wallet-adapter-react": "^0.15.35",
  "@solana/wallet-adapter-react-ui": "^0.9.35",
  "@solana/wallet-adapter-wallets": "^0.19.32",
  "@solana/web3.js": "^1.95.8"
}
```

---

## Installation

```bash
cd frontend
npm install
```

---

## Example Files Created

1. **`transactionUtils.ts`** - Utility functions for manual transaction signing
2. **`useCasesWithManualSigning.ts`** - Hook demonstrating all three methods

---

## Testing Transaction Signing

1. **Current Method** (works out of the box):
   ```typescript
   import { useCases } from './hooks/useCases';
   const { submitCase } = useCases();
   await submitCase(caseId, evidenceUrl, scamAddress);
   ```

2. **Manual Signing** (if you need more control):
   ```typescript
   import { useCasesWithManualSigning } from './hooks/useCasesWithManualSigning';
   const { submitCaseManualSign } = useCasesWithManualSigning();
   await submitCaseManualSign(caseId, evidenceUrl, scamAddress);
   ```

---

## Wallet Popup Behavior

Both methods trigger the **same wallet popup**:
- Phantom: Shows transaction details with Approve/Reject
- Solflare: Shows transaction details with Approve/Reject

The popup appears when:
- `.rpc()` is called → wallet signs automatically
- `wallet.signTransaction()` is called → manual signing

---

## Recommendation

**Keep using your current `.rpc()` method!** It's:
- ✅ Cleaner code
- ✅ Less error-prone
- ✅ Standard Anchor approach
- ✅ Already uses `signTransaction` under the hood

Switch to manual signing only if you need:
- Transaction inspection
- Custom transaction logic
- Multiple instructions in one transaction

---

## Error Handling

```typescript
try {
  const signature = await submitCase(...);
  console.log('Transaction successful:', signature);
} catch (error) {
  if (error.message.includes('User rejected')) {
    // User declined to sign
    console.log('User cancelled transaction');
  } else if (error.message.includes('insufficient funds')) {
    // Not enough SOL
    console.log('Insufficient SOL for transaction');
  } else {
    // Other errors
    console.error('Transaction failed:', error);
  }
}
```

---

## Summary

✅ **Your current code is already using the official Solana wallet adapter**  
✅ **`signTransaction` works perfectly with Phantom and Solflare**  
✅ **`.rpc()` automatically uses `signTransaction` under the hood**  
✅ **Manual signing methods are available if you need more control**  
✅ **All dependencies have been added to package.json**

You can continue with your current approach, or switch to manual signing if you need more control over the transaction flow!
