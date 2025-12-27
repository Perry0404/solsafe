import { Connection, Transaction, TransactionInstruction, sendAndConfirmTransaction } from '@solana/web3.js';
import { WalletContextState } from '@solana/wallet-adapter-react';

/**
 * Sign and send a transaction using the wallet adapter
 * This demonstrates how signTransaction works with Solana wallet adapter
 */
export async function signAndSendTransaction(
  connection: Connection,
  wallet: WalletContextState,
  instructions: TransactionInstruction[]
): Promise<string> {
  if (!wallet.publicKey || !wallet.signTransaction) {
    throw new Error('Wallet not connected or does not support signing');
  }

  // Create a new transaction
  const transaction = new Transaction();
  
  // Add instructions to the transaction
  instructions.forEach(instruction => {
    transaction.add(instruction);
  });

  // Get recent blockhash
  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
  transaction.recentBlockhash = blockhash;
  transaction.feePayer = wallet.publicKey;

  // Sign the transaction using wallet.signTransaction
  // This will trigger the wallet popup (Phantom, Solflare, etc.)
  const signedTransaction = await wallet.signTransaction(transaction);

  // Send the signed transaction
  const signature = await connection.sendRawTransaction(signedTransaction.serialize());

  // Confirm the transaction
  await connection.confirmTransaction({
    signature,
    blockhash,
    lastValidBlockHeight,
  });

  return signature;
}

/**
 * Sign multiple transactions at once using signAllTransactions
 * This is more efficient for batch operations
 */
export async function signAndSendMultipleTransactions(
  connection: Connection,
  wallet: WalletContextState,
  transactionGroups: TransactionInstruction[][]
): Promise<string[]> {
  if (!wallet.publicKey || !wallet.signAllTransactions) {
    throw new Error('Wallet not connected or does not support batch signing');
  }

  // Get recent blockhash
  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');

  // Create transactions
  const transactions = transactionGroups.map(instructions => {
    const transaction = new Transaction();
    instructions.forEach(instruction => transaction.add(instruction));
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = wallet.publicKey!;
    return transaction;
  });

  // Sign all transactions at once
  const signedTransactions = await wallet.signAllTransactions(transactions);

  // Send all signed transactions
  const signatures = await Promise.all(
    signedTransactions.map(async (signedTx) => {
      const signature = await connection.sendRawTransaction(signedTx.serialize());
      
      // Confirm transaction
      await connection.confirmTransaction({
        signature,
        blockhash,
        lastValidBlockHeight,
      });
      
      return signature;
    })
  );

  return signatures;
}

/**
 * Check if wallet supports signing transactions
 */
export function canSignTransactions(wallet: WalletContextState): boolean {
  return !!(wallet.publicKey && wallet.signTransaction);
}

/**
 * Check if wallet supports batch signing
 */
export function canSignAllTransactions(wallet: WalletContextState): boolean {
  return !!(wallet.publicKey && wallet.signAllTransactions);
}
