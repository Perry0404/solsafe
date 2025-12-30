// Confidential Transfer Component using Dust Protocol
import React, { useState } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { Program, AnchorProvider, web3 } from '@project-serum/anchor';
import {
  encryptAmount,
  generateRangeProof,
  generateComplianceProof,
} from '../utils/zkProofs';

interface ConfidentialTransferProps {
  programId: PublicKey;
  idl: any;
  maxAmount?: number;
}

export default function ConfidentialTransfer({
  programId,
  idl,
  maxAmount = 1000000,
}: ConfidentialTransferProps) {
  const { connection } = useConnection();
  const wallet = useWallet();
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const initiateTransfer = async () => {
    if (!wallet.publicKey || !wallet.signTransaction) {
      setMessage('Please connect your wallet');
      return;
    }

    if (!recipient || !amount) {
      setMessage('Please enter recipient and amount');
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setMessage('Please enter a valid amount');
      return;
    }

    setLoading(true);
    setMessage('Preparing confidential transfer...');

    try {
      const recipientPubkey = new PublicKey(recipient);
      const transferId = Date.now();

      setMessage('Encrypting amount with Dust Protocol...');
      
      // Encrypt the amount
      const encryptedAmount = await encryptAmount(amountNum, recipientPubkey);
      
      setMessage('Generating range proof...');
      
      // Generate range proof (proves amount is valid without revealing it)
      const rangeProof = await generateRangeProof(amountNum, maxAmount);
      
      setMessage('Generating compliance proof...');
      
      // Generate compliance proof
      const complianceProof = await generateComplianceProof(
        amountNum,
        wallet.publicKey,
        recipientPubkey
      );

      setMessage('Submitting confidential transfer to blockchain...');

      const provider = new AnchorProvider(connection, wallet as any, {
        commitment: 'confirmed',
      });
      const program = new Program(idl, programId, provider);

      const [transferRecord] = await PublicKey.findProgramAddress(
        [Buffer.from('confidential_transfer'), Buffer.from(new BigUint64Array([BigInt(transferId)]).buffer)],
        programId
      );

      const [senderBalance] = await PublicKey.findProgramAddress(
        [Buffer.from('conf_balance'), wallet.publicKey.toBuffer()],
        programId
      );

      const [recipientBalance] = await PublicKey.findProgramAddress(
        [Buffer.from('conf_balance'), recipientPubkey.toBuffer()],
        programId
      );

      const [config] = await PublicKey.findProgramAddress(
        [Buffer.from('conf_transfer_config')],
        programId
      );

      // Initiate confidential transfer
      const tx = await program.methods
        .initiateConfidentialTransfer(
          transferId,
          Array.from(encryptedAmount),
          Array.from(rangeProof),
          Array.from(complianceProof)
        )
        .accounts({
          sender: wallet.publicKey,
          senderBalance,
          recipientBalance,
          transferRecord,
          config,
          systemProgram: web3.SystemProgram.programId,
        })
        .rpc();

      setMessage(`Confidential transfer initiated! Amount hidden from public view. Tx: ${tx}`);
      setRecipient('');
      setAmount('');
      console.log('Confidential transfer:', tx);
    } catch (error: any) {
      console.error('Error initiating transfer:', error);
      setMessage(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="confidential-transfer-container" style={{
      padding: '20px',
      border: '2px solid #ec4899',
      borderRadius: '8px',
      background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.1), rgba(249, 115, 22, 0.1))',
      marginTop: '20px',
    }}>
      <h3 style={{ color: '#ec4899', marginBottom: '10px' }}>
        💰 Confidential Transfer (Dust Protocol)
      </h3>
      
      <div style={{ marginBottom: '15px', padding: '10px', background: 'rgba(255,255,255,0.7)', borderRadius: '4px' }}>
        <p style={{ fontSize: '14px', margin: '5px 0' }}>
          <strong>Dust Protocol:</strong> Privacy-preserving transfers with compliance
        </p>
        <p style={{ fontSize: '14px', margin: '5px 0' }}>
          <strong>Range Proofs:</strong> Prove amount validity without revealing value
        </p>
        <p style={{ fontSize: '14px', margin: '5px 0' }}>
          <strong>Compliance:</strong> Regulatory requirements maintained
        </p>
      </div>

      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
          Recipient Address:
        </label>
        <input
          type="text"
          value={recipient}
          onChange={(e) => setRecipient(e.target.value)}
          placeholder="Enter recipient's public key"
          disabled={loading}
          style={{
            width: '100%',
            padding: '10px',
            borderRadius: '4px',
            border: '1px solid #ddd',
            fontSize: '14px',
            fontFamily: 'monospace',
          }}
        />
      </div>

      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
          Amount (will be encrypted):
        </label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.00"
          disabled={loading}
          min="0"
          step="0.01"
          style={{
            width: '100%',
            padding: '10px',
            borderRadius: '4px',
            border: '1px solid #ddd',
            fontSize: '14px',
          }}
        />
        <p style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
          Amount will be encrypted. Only you and recipient can see the value.
        </p>
      </div>

      <button
        onClick={initiateTransfer}
        disabled={loading || !recipient || !amount}
        style={{
          width: '100%',
          padding: '12px 24px',
          background: loading || !recipient || !amount ? '#ccc' : '#ec4899',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: loading || !recipient || !amount ? 'not-allowed' : 'pointer',
          fontSize: '16px',
          fontWeight: 'bold',
        }}
      >
        {loading ? 'Processing...' : 'Send Confidential Transfer'}
      </button>

      {message && (
        <div style={{
          marginTop: '15px',
          padding: '10px',
          background: 'rgba(255,255,255,0.9)',
          borderRadius: '4px',
          fontSize: '14px',
          wordBreak: 'break-word',
        }}>
          {message}
        </div>
      )}
    </div>
  );
}
