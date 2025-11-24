import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useCases, formatCaseStatus, formatCaseState } from './hooks/useCases';

export default function Dashboard() {
  const { publicKey, connected } = useWallet();
  const { cases, loading, error, submitCase } = useCases();
  const [activeTab, setActiveTab] = useState('submit');
  
  // Form state
  const [caseId, setCaseId] = useState('1');
  const [scamAddress, setScamAddress] = useState('');
  const [evidenceUrl, setEvidenceUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage('');

    try {
      const id = parseInt(caseId);
      const tx = await submitCase(id, evidenceUrl, scamAddress);
      setMessage(`✅ Case submitted! Transaction: ${tx.slice(0, 20)}...`);
      setCaseId(String(id + 1));
      setScamAddress('');
      setEvidenceUrl('');
    } catch (err: any) {
      setMessage(`❌ Error: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #1c0030, #4b0082, #9932cc)', color: '#fff', fontFamily: 'sans-serif' }}>
      {/* Navbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 40px', background: 'rgba(28,0,48,0.85)' }}>
        <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>SolSafe</div>
        <WalletMultiButton />
      </div>

      {/* Back to Home */}
      <div style={{ padding: '20px 40px' }}>
        <Link to="/" style={{ color: '#8a2be2', textDecoration: 'none', fontSize: '1.1rem' }}>← Back to Home</Link>
      </div>

      {/* Hero */}
      <div style={{ textAlign: 'center', padding: '40px 20px' }}>
        <h1 style={{ fontSize: '3rem', textShadow: '0 0 20px #9932cc' }}>SolSafe Dashboard</h1>
        <p style={{ fontSize: '1.2rem' }}>Submit scam reports to Solana blockchain</p>
      </div>

      {/* Main Content */}
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '0 20px 60px' }}>
        {!connected ? (
          <div style={{ textAlign: 'center', padding: '40px', background: 'rgba(255,193,7,0.15)', border: '1px solid rgba(255,193,7,0.4)', borderRadius: '12px' }}>
            <h3>⚠️ Connect Your Wallet</h3>
            <p>Please connect your Solana wallet (Devnet) to submit cases</p>
          </div>
        ) : (
          <>
            {/* Tabs */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '30px' }}>
              <button
                onClick={() => setActiveTab('submit')}
                style={{
                  padding: '12px 24px',
                  background: activeTab === 'submit' ? '#8a2be2' : 'rgba(255,255,255,0.1)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: activeTab === 'submit' ? 'bold' : 'normal'
                }}
              >
                📝 Submit Case
              </button>
              <button
                onClick={() => setActiveTab('cases')}
                style={{
                  padding: '12px 24px',
                  background: activeTab === 'cases' ? '#8a2be2' : 'rgba(255,255,255,0.1)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: activeTab === 'cases' ? 'bold' : 'normal'
                }}
              >
                🔍 View Cases ({cases.length})
              </button>
            </div>

            {/* Submit Form */}
            {activeTab === 'submit' && (
              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '30px', borderRadius: '12px' }}>
                <h2>Submit New Scam Case</h2>
                <p style={{ color: '#aaa', marginBottom: '20px' }}>Report a scam by submitting evidence to the blockchain</p>

                <form onSubmit={handleSubmit}>
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                      Case ID: <span style={{ color: '#8a2be2' }}>*</span>
                    </label>
                    <input
                      type="number"
                      value={caseId}
                      onChange={(e) => setCaseId(e.target.value)}
                      required
                      disabled={submitting}
                      style={{
                        width: '100%',
                        padding: '12px',
                        borderRadius: '8px',
                        border: '1px solid rgba(255,255,255,0.2)',
                        background: 'rgba(0,0,0,0.3)',
                        color: '#fff',
                        fontSize: '1rem'
                      }}
                    />
                    <small style={{ color: '#888' }}>Use unique number: {caseId}</small>
                  </div>

                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                      Scam Address: <span style={{ color: '#8a2be2' }}>*</span>
                    </label>
                    <input
                      type="text"
                      value={scamAddress}
                      onChange={(e) => setScamAddress(e.target.value)}
                      placeholder="Solana public key of scammer"
                      required
                      disabled={submitting}
                      style={{
                        width: '100%',
                        padding: '12px',
                        borderRadius: '8px',
                        border: '1px solid rgba(255,255,255,0.2)',
                        background: 'rgba(0,0,0,0.3)',
                        color: '#fff',
                        fontSize: '1rem'
                      }}
                    />
                    <small style={{ color: '#888' }}>Example: 7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU</small>
                  </div>

                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                      Evidence URL: <span style={{ color: '#8a2be2' }}>*</span>
                    </label>
                    <input
                      type="text"
                      value={evidenceUrl}
                      onChange={(e) => setEvidenceUrl(e.target.value)}
                      placeholder="Link to evidence"
                      required
                      disabled={submitting}
                      style={{
                        width: '100%',
                        padding: '12px',
                        borderRadius: '8px',
                        border: '1px solid rgba(255,255,255,0.2)',
                        background: 'rgba(0,0,0,0.3)',
                        color: '#fff',
                        fontSize: '1rem'
                      }}
                    />
                    <small style={{ color: '#888' }}>Example: https://example.com/proof.jpg</small>
                  </div>

                  {message && (
                    <div style={{
                      padding: '12px',
                      borderRadius: '8px',
                      marginBottom: '20px',
                      background: message.includes('✅') ? 'rgba(40,167,69,0.15)' : 'rgba(220,53,69,0.15)',
                      border: `1px solid ${message.includes('✅') ? 'rgba(40,167,69,0.4)' : 'rgba(220,53,69,0.4)'}`,
                      color: message.includes('✅') ? '#51cf66' : '#ff6b6b'
                    }}>
                      {message}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={submitting}
                    style={{
                      padding: '14px 32px',
                      background: submitting ? '#666' : '#8a2be2',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '1.1rem',
                      fontWeight: 'bold',
                      cursor: submitting ? 'not-allowed' : 'pointer',
                      width: '100%'
                    }}
                  >
                    {submitting ? 'Submitting...' : '🚀 Submit Case to Blockchain'}
                  </button>
                </form>
              </div>
            )}

            {/* Cases List */}
            {activeTab === 'cases' && (
              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '30px', borderRadius: '12px' }}>
                <h2>All Cases on Blockchain</h2>
                {loading && <p>Loading cases...</p>}
                {error && <p style={{ color: '#ff6b6b' }}>Error: {error}</p>}
                {!loading && !error && cases.length === 0 && (
                  <p style={{ color: '#aaa' }}>No cases yet. Submit the first one!</p>
                )}
                {!loading && cases.length > 0 && (
                  <div style={{ display: 'grid', gap: '20px', marginTop: '20px' }}>
                    {cases.map((caseData: any, idx: number) => (
                      <div key={idx} style={{ background: 'rgba(0,0,0,0.3)', padding: '20px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <h3 style={{ color: '#8a2be2', marginBottom: '10px' }}>Case #{caseData.account.caseId.toString()}</h3>
                        <p><strong>Status:</strong> {formatCaseStatus(caseData.account.status)}</p>
                        <p><strong>State:</strong> {formatCaseState(caseData.account.state)}</p>
                        <p><strong>Scam Address:</strong> {caseData.account.scamAddress.toBase58().slice(0, 30)}...</p>
                        <p><strong>Evidence:</strong> <a href={caseData.account.evidence} target="_blank" rel="noopener noreferrer" style={{ color: '#8a2be2' }}>View</a></p>
                        <p><strong>Votes:</strong> For: {caseData.account.votesFor} | Against: {caseData.account.votesAgainst}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
