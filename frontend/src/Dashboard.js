import React from 'react';
import { Link } from 'react-router-dom';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

export default function Dashboard() {
  const { publicKey, connected } = useWallet();

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1c0030, #4b0082, #9932cc)',
      padding: '0',
      fontFamily: "'Inter', 'Segoe UI', 'Roboto', sans-serif"
    }}>
      {/* Header */}
      <nav style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '20px 50px',
        background: 'rgba(28, 0, 48, 0.95)',
        backdropFilter: 'blur(10px)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
        position: 'sticky',
        top: 0,
        zIndex: 1000
      }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
          <img src="/logoo.png" alt="SolSafe" style={{ height: '50px' }} />
        </Link>
        <WalletMultiButton />
      </nav>

      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '60px 20px'
      }}>

        {!connected && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '70vh',
            textAlign: 'center'
          }}>
            <div style={{
              background: 'rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(20px)',
              borderRadius: '30px',
              padding: '60px 80px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
              maxWidth: '600px'
            }}>
              <div style={{ fontSize: '60px', marginBottom: '20px' }}>🔐</div>
              <h1 style={{
                color: 'white',
                fontSize: '42px',
                fontWeight: '700',
                marginBottom: '20px',
                letterSpacing: '-0.5px'
              }}>Welcome to SolSafe</h1>
              <p style={{
                color: 'rgba(255, 255, 255, 0.8)',
                fontSize: '18px',
                lineHeight: '1.6',
                marginBottom: '30px'
              }}>
                Connect your Solana wallet to access the decentralized<br />
                scam prevention and asset protection dashboard
              </p>
              <div style={{
                background: 'rgba(153, 50, 204, 0.2)',
                borderRadius: '15px',
                padding: '20px',
                marginTop: '30px'
              }}>
                <p style={{
                  color: 'rgba(255, 255, 255, 0.7)',
                  fontSize: '14px',
                  margin: 0
                }}>
                  💡 Click <strong style={{ color: '#d1a3ff' }}>"Connect Wallet"</strong> at the top right to get started
                </p>
              </div>
            </div>
          </div>
        )}

        {connected && (
          <>
            {/* Success Banner */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(76, 175, 80, 0.2), rgba(56, 142, 60, 0.2))',
              border: '1px solid rgba(76, 175, 80, 0.3)',
              borderRadius: '20px',
              padding: '25px 35px',
              marginBottom: '40px',
              display: 'flex',
              alignItems: 'center',
              gap: '20px'
            }}>
              <span style={{ fontSize: '32px' }}>✅</span>
              <div style={{ flex: 1 }}>
                <h3 style={{ color: '#a5d6a7', margin: '0 0 8px 0', fontSize: '18px', fontWeight: '600' }}>
                  Wallet Connected Successfully
                </h3>
                <p style={{ color: 'rgba(255, 255, 255, 0.7)', margin: 0, fontSize: '14px', fontFamily: 'monospace' }}>
                  {publicKey?.toBase58()}
                </p>
              </div>
              <span style={{ 
                background: 'rgba(76, 175, 80, 0.2)',
                padding: '8px 16px',
                borderRadius: '20px',
                fontSize: '13px',
                color: '#a5d6a7',
                fontWeight: '600'
              }}>Devnet</span>
            </div>

            {/* Dashboard Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '30px',
              marginBottom: '40px'
            }}>
              {/* Submit Case Card */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(20px)',
                borderRadius: '25px',
                padding: '40px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
                transition: 'transform 0.3s ease'
              }}>
                <div style={{ fontSize: '48px', marginBottom: '20px' }}>📝</div>
                <h2 style={{ color: 'white', fontSize: '24px', marginBottom: '15px', fontWeight: '700' }}>
                  Submit Case
                </h2>
                <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '15px', lineHeight: '1.6', marginBottom: '25px' }}>
                  Report scams, rug pulls, and fraudulent activities on the Solana blockchain
                </p>
                <button style={{
                  background: 'linear-gradient(90deg, #7b1fa2, #9932cc)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '15px',
                  padding: '14px 28px',
                  fontSize: '15px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  width: '100%'
                }}>Submit New Case</button>
              </div>

              {/* View Cases Card */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(20px)',
                borderRadius: '25px',
                padding: '40px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)'
              }}>
                <div style={{ fontSize: '48px', marginBottom: '20px' }}>🔍</div>
                <h2 style={{ color: 'white', fontSize: '24px', marginBottom: '15px', fontWeight: '700' }}>
                  View Cases
                </h2>
                <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '15px', lineHeight: '1.6', marginBottom: '25px' }}>
                  Browse reported cases and participate in community voting as a juror
                </p>
                <button style={{
                  background: 'linear-gradient(90deg, #7b1fa2, #9932cc)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '15px',
                  padding: '14px 28px',
                  fontSize: '15px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  width: '100%'
                }}>Browse Cases</button>
              </div>

              {/* Validator Card */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(20px)',
                borderRadius: '25px',
                padding: '40px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)'
              }}>
                <div style={{ fontSize: '48px', marginBottom: '20px' }}>⚖️</div>
                <h2 style={{ color: 'white', fontSize: '24px', marginBottom: '15px', fontWeight: '700' }}>
                  Become Validator
                </h2>
                <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '15px', lineHeight: '1.6', marginBottom: '25px' }}>
                  Join as a validator to help protect the community
                </p>
                <button style={{
                  background: 'linear-gradient(90deg, #7b1fa2, #9932cc)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '15px',
                  padding: '14px 28px',
                  fontSize: '15px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  width: '100%'
                }}>Apply Now</button>
              </div>
            </div>

            {/* Stats Section */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.03)',
              backdropFilter: 'blur(20px)',
              borderRadius: '25px',
              padding: '40px',
              border: '1px solid rgba(255, 255, 255, 0.08)'
            }}>
              <h3 style={{ color: 'white', fontSize: '20px', marginBottom: '30px', fontWeight: '600' }}>
                Platform Statistics
              </h3>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '30px'
              }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '32px', color: '#9932cc', fontWeight: '700', marginBottom: '8px' }}>0</div>
                  <div style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '14px' }}>Total Cases</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '32px', color: '#9932cc', fontWeight: '700', marginBottom: '8px' }}>0</div>
                  <div style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '14px' }}>Active Jurors</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '32px', color: '#9932cc', fontWeight: '700', marginBottom: '8px' }}>0</div>
                  <div style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '14px' }}>Frozen Assets</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '32px', color: '#9932cc', fontWeight: '700', marginBottom: '8px' }}>0</div>
                  <div style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '14px' }}>Validators</div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
