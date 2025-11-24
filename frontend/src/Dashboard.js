import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

export default function Dashboard() {
  const { publicKey, connected } = useWallet();
  const [activeTab, setActiveTab] = useState('submit');

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '30px',
          background: 'rgba(255, 255, 255, 0.1)',
          padding: '20px',
          borderRadius: '15px',
          backdropFilter: 'blur(10px)'
        }}>
          <div>
            <h1 style={{ color: 'white', margin: '0 0 10px 0' }}>SolSafe Dashboard</h1>
            <Link to="/" style={{ color: '#fff', textDecoration: 'none', opacity: 0.8 }}>
              ← Back to Home
            </Link>
          </div>
          <div>
            <WalletMultiButton />
          </div>
        </div>

        {/* Connection Status */}
        {!connected && (
          <div style={{
            background: 'rgba(255, 255, 255, 0.1)',
            padding: '30px',
            borderRadius: '15px',
            color: 'white',
            textAlign: 'center',
            fontSize: '18px'
          }}>
            <h2>Welcome to SolSafe!</h2>
            <p>Please connect your Solana wallet to continue</p>
            <p style={{ marginTop: '20px', opacity: 0.8 }}>
              Click the "Select Wallet" button above to get started
            </p>
          </div>
        )}

        {connected && (
          <>
            {/* Connected Message */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.1)',
              padding: '30px',
              borderRadius: '15px',
              color: 'white',
              textAlign: 'center'
            }}>
              <h2>Wallet Connected! ✅</h2>
              <p style={{ marginTop: '10px', wordBreak: 'break-all' }}>
                {publicKey?.toBase58()}
              </p>
              <p style={{ marginTop: '20px', fontSize: '16px', opacity: 0.9 }}>
                You are now connected to SolSafe on Solana Devnet
              </p>
              <div style={{ marginTop: '30px' }}>
                <p style={{ fontSize: '14px', lineHeight: '1.6' }}>
                  This dashboard is connected to the Solana blockchain. 
                  The full case management system with case submission, 
                  voting, and validator features will be displayed here.
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
