
import React, { useEffect, useState } from 'react';
import { Link } from "react-router-dom";
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useCases, formatCaseStatus, formatCaseState } from './hooks/useCases';

export default function Dashboard() {
  const { publicKey, connected } = useWallet();
  const { cases, loading, error, fetchCases, submitCase, submitCaseWithPrivacy, voteOnCase, voteWithPrivacy, program } = useCases();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submitSuccess, setSubmitSuccess] = useState(null);

  // Form states
  const [caseId, setCaseId] = useState('');
  const [scamAddress, setScamAddress] = useState('');
  const [evidenceUrl, setEvidenceUrl] = useState('');
  const [selectedCaseId, setSelectedCaseId] = useState('');
  
  // ZK Privacy toggles
  const [usePrivacySubmit, setUsePrivacySubmit] = useState(false);
  const [usePrivacyVote, setUsePrivacyVote] = useState(false);

  // Auto-fetch cases when wallet connects
  useEffect(() => {
    if (connected && program) {
      console.log('🔄 Fetching cases on wallet connect...');
      fetchCases();
    }
  }, [connected, program, fetchCases]);

  // Auto-generate next case ID
  useEffect(() => {
    if (cases.length > 0 && !caseId) {
      const maxId = Math.max(...cases.map(c => Number(c.account.caseId) || 0));
      setCaseId(String(maxId + 1));
    } else if (cases.length === 0 && !caseId) {
      setCaseId('1');
    }
  }, [cases, caseId]);

  const handleSubmitCase = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(null);

    try {
      const id = parseInt(caseId);
      if (isNaN(id)) {
        throw new Error('Case ID must be a number');
      }

      const submitFn = usePrivacySubmit ? submitCaseWithPrivacy : submitCase;
      const tx = await submitFn(id, evidenceUrl, scamAddress, usePrivacySubmit);
      
      const privacyMsg = usePrivacySubmit ? ' 🔐 (Evidence encrypted with ZK proof)' : '';
      setSubmitSuccess(`Case submitted successfully!${privacyMsg} Transaction: ${tx}`);
      
      // Reset form
      setCaseId('');
      setScamAddress('');
      setEvidenceUrl('');
      
      // Refresh cases
      await fetchCases();
    } catch (err) {
      console.error('Submit error:', err);
      setSubmitError(err.message || 'Failed to submit case');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVote = async (caseId, approve) => {
    try {
      const voteFn = usePrivacyVote ? voteWithPrivacy : voteOnCase;
      const tx = await voteFn(caseId, approve, usePrivacyVote);
      
      const privacyMsg = usePrivacyVote ? ' 🔐 (Private vote with ZK commitment)' : '';
      alert(`Vote submitted successfully!${privacyMsg} Transaction: ${tx}`);
      await fetchCases();
    } catch (err) {
      console.error('Vote error:', err);
      alert('Failed to submit vote: ' + (err.message || 'Unknown error'));
    }
  };

  return (
    <div className="app-root">
      <nav className="navbar">
        <div className="logo">
          <img src="/logoo.png" alt="SolSafe Logo" className="logo-img" />
        </div>
        <WalletMultiButton />
      </nav>

      <main>
        <Link
          to="/"
          style={{
            display: "inline-block",
            margin: "20px 40px",
            padding: "10px 20px",
            backgroundColor: "#8a2be2",
            color: "white",
            borderRadius: "8px",
            textDecoration: "none",
            fontWeight: "600",
          }}
        >
          ← Home
        </Link>

        <div className="hero">
          <h1>SolSafe Dashboard</h1>
          <p>Decentralized Scam Protection on Solana</p>
        </div>

        <section style={{ paddingTop: 40 }}>
          <div className="dashboard-shell">
            <div className="sidebar">
              <button 
                className={`nav-button ${activeTab === 'dashboard' ? 'active' : ''}`}
                onClick={() => setActiveTab('dashboard')}
              >
                📊 Dashboard
              </button>
              <button 
                className={`nav-button ${activeTab === 'submit' ? 'active' : ''}`}
                onClick={() => setActiveTab('submit')}
                disabled={!connected}
              >
                📝 Submit Case
              </button>
              <button 
                className={`nav-button ${activeTab === 'cases' ? 'active' : ''}`}
                onClick={() => setActiveTab('cases')}
                disabled={!connected}
              >
                🔍 View Cases
              </button>
              <button 
                className={`nav-button ${activeTab === 'vote' ? 'active' : ''}`}
                onClick={() => setActiveTab('vote')}
                disabled={!connected}
              >
                🗳️ Vote
              </button>
            </div>

            <div className="content">
              {!publicKey && (
                <div className="notice">
                  <h3>⚠️ Wallet Not Connected</h3>
                  <p>Please connect your Solana wallet using the button at the top right to use the dashboard.</p>
                </div>
              )}

              {activeTab === 'dashboard' && (
                <div>
                  <h2>Dashboard</h2>
                  {publicKey ? (
                    <div>
                      <p><strong>Address:</strong> {publicKey.toBase58()}</p>
                      <p><strong>Network:</strong> Devnet</p>
                      <p><strong>Total Cases:</strong> {cases.length}</p>
                      <p><strong>Program:</strong> {program ? '✅ Connected' : '❌ Not loaded'}</p>
                      <p><strong>Validator Role:</strong> Can vote on cases</p>
                    </div>
                  ) : (
                    <p>Connect your wallet to view your profile.</p>
                  )}
                </div>
              )}

              {activeTab === 'submit' && connected && (
                <div>
                  <h2>Submit New Case</h2>
                  <p style={{ marginBottom: '20px', color: '#aaa' }}>
                    Report a scam by submitting evidence to the blockchain. Each case requires a unique ID.
                  </p>
                  
                  <form onSubmit={handleSubmitCase} className="case-form">
                    <div className="form-group">
                      <label>Case ID: <span style={{ color: '#8a2be2' }}>*</span></label>
                      <input
                        type="number"
                        value={caseId}
                        onChange={(e) => setCaseId(e.target.value)}
                        placeholder="Auto-generated next available ID"
                        required
                        disabled={submitting}
                      />
                      <small style={{ color: '#888', display: 'block', marginTop: '5px' }}>
                        This ID is auto-generated. Use this number: <strong style={{ color: '#8a2be2' }}>{caseId || '1'}</strong>
                      </small>
                    </div>
                    <div className="form-group">
                      <label>Scam Address: <span style={{ color: '#8a2be2' }}>*</span></label>
                      <input
                        type="text"
                        value={scamAddress}
                        onChange={(e) => setScamAddress(e.target.value)}
                        placeholder="Solana public key of the scammer's wallet"
                        required
                        disabled={submitting}
                      />
                      <small style={{ color: '#888', display: 'block', marginTop: '5px' }}>
                        Example: 7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU
                      </small>
                    </div>
                    <div className="form-group">
                      <label>Evidence URL: <span style={{ color: '#8a2be2' }}>*</span></label>
                      <input
                        type="text"
                        value={evidenceUrl}
                        onChange={(e) => setEvidenceUrl(e.target.value)}
                        placeholder="Link to evidence (IPFS, screenshot, etc.)"
                        required
                        disabled={submitting}
                      />
                      <small style={{ color: '#888', display: 'block', marginTop: '5px' }}>
                        Example: ipfs://QmXyz... or https://example.com/evidence.jpg
                      </small>
                    </div>
                    
                    {/* ZK Privacy Toggle */}
                    <div className="form-group" style={{ 
                      padding: '15px', 
                      background: 'linear-gradient(135deg, rgba(138, 43, 226, 0.1), rgba(236, 72, 153, 0.1))',
                      borderRadius: '8px',
                      border: '2px solid #8a2be2'
                    }}>
                      <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={usePrivacySubmit}
                          onChange={(e) => setUsePrivacySubmit(e.target.checked)}
                          style={{ marginRight: '10px', width: '18px', height: '18px', cursor: 'pointer' }}
                        />
                        <span style={{ fontWeight: 'bold', color: '#8a2be2' }}>
                          🔐 Enable ZK Privacy (Encrypt Evidence)
                        </span>
                      </label>
                      <small style={{ color: '#666', display: 'block', marginTop: '8px', marginLeft: '28px' }}>
                        Uses Zero-Knowledge proofs to hash evidence. Only the hash is stored on-chain, protecting sensitive information.
                      </small>
                    </div>
                    
                    {submitError && (
                      <div className="error-message">{submitError}</div>
                    )}
                    {submitSuccess && (
                      <div className="success-message">{submitSuccess}</div>
                    )}
                    <button 
                      type="submit" 
                      className="cta-button"
                      disabled={submitting}
                    >
                      {submitting ? 'Submitting...' : 'Submit Case'}
                    </button>
                  </form>
                </div>
              )}

              {activeTab === 'cases' && publicKey && (
                <div>
                  <h2>All Cases</h2>
                  {loading && <p>Loading cases from blockchain...</p>}
                  {error && <div className="error-message">{error}</div>}
                  {!loading && !error && cases.length === 0 && (
                    <p>No cases found. Submit the first case!</p>
                  )}
                  {!loading && cases.length > 0 && (
                    <div className="cases-list">
                      {cases.map((caseData, idx) => (
                        <div key={idx} className="case-card">
                          <h3>Case #{caseData.account.caseId.toString()}</h3>
                          <p><strong>Status:</strong> {formatCaseStatus(caseData.account.status)}</p>
                          <p><strong>State:</strong> {formatCaseState(caseData.account.state)}</p>
                          <p><strong>Scam Address:</strong> {caseData.account.scamAddress.toBase58().slice(0, 20)}...</p>
                          <p><strong>Evidence:</strong> <a href={caseData.account.evidence} target="_blank" rel="noopener noreferrer">View</a></p>
                          <p><strong>Votes For:</strong> {caseData.account.votesFor} | <strong>Against:</strong> {caseData.account.votesAgainst}</p>
                          <p><strong>Jurors:</strong> {caseData.account.jurors.length}/5</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'vote' && publicKey && (
                <div>
                  <h2>Vote on Case</h2>
                  <div className="form-group">
                    <label>Case ID:</label>
                    <input
                      type="number"
                      value={selectedCaseId}
                      onChange={(e) => setSelectedCaseId(e.target.value)}
                      placeholder="Enter case ID to vote on"
                    />
                  </div>
                  
                  {/* ZK Privacy Toggle for Voting */}
                  <div className="form-group" style={{ 
                    padding: '15px', 
                    background: 'linear-gradient(135deg, rgba(138, 43, 226, 0.1), rgba(236, 72, 153, 0.1))',
                    borderRadius: '8px',
                    border: '2px solid #8a2be2',
                    marginBottom: '20px'
                  }}>
                    <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={usePrivacyVote}
                        onChange={(e) => setUsePrivacyVote(e.target.checked)}
                        style={{ marginRight: '10px', width: '18px', height: '18px', cursor: 'pointer' }}
                      />
                      <span style={{ fontWeight: 'bold', color: '#8a2be2' }}>
                        🔐 Enable Private Voting (ZK Commitment)
                      </span>
                    </label>
                    <small style={{ color: '#666', display: 'block', marginTop: '8px', marginLeft: '28px' }}>
                      Creates a zero-knowledge commitment to your vote. Your vote is stored locally and can be revealed later while preventing double-voting.
                    </small>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                    <button
                      className="cta-button"
                      onClick={() => selectedCaseId && handleVote(parseInt(selectedCaseId), true)}
                      disabled={!selectedCaseId}
                    >
                      ✅ Vote Approve
                    </button>
                    <button
                      className="cta-button"
                      style={{ backgroundColor: '#dc3545' }}
                      onClick={() => selectedCaseId && handleVote(parseInt(selectedCaseId), false)}
                      disabled={!selectedCaseId}
                    >
                      ❌ Vote Reject
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'dashboard' && (
                <div>
                  <h2>Profile</h2>
                  {publicKey ? (
                    <div>
                      <p><strong>Address:</strong> {publicKey.toBase58()}</p>
                      <p><strong>Network:</strong> Devnet</p>
                      <p><strong>Total Cases:</strong> {cases.length}</p>
                      <p><strong>Program:</strong> {program ? '✅ Connected' : '❌ Not loaded'}</p>
                    </div>
                  ) : (
                    <p>Connect your wallet to view your profile.</p>
                  )}
                </div>
              )}

              {activeTab === 'cases' && publicKey && (
                <div>
                  <h2>All Cases</h2>
                  {loading && <p>Loading cases from blockchain...</p>}
                  {error && <div className="error-message">{error}</div>}
                  {!loading && !error && cases.length === 0 && (
                    <p>No cases found. Submit the first case!</p>
                  )}
                  {!loading && cases.length > 0 && (
                    <div className="cases-list">
                      {cases.map((caseData, idx) => (
                        <div key={idx} className="case-card">
                          <h3>Case #{caseData.account.caseId.toString()}</h3>
                          <p><strong>Status:</strong> {formatCaseStatus(caseData.account.status)}</p>
                          <p><strong>State:</strong> {formatCaseState(caseData.account.state)}</p>
                          <p><strong>Scam Address:</strong> {caseData.account.scamAddress.toBase58().slice(0, 20)}...</p>
                          <p><strong>Evidence:</strong> <a href={caseData.account.evidence} target="_blank" rel="noopener noreferrer">View</a></p>
                          <p><strong>Votes For:</strong> {caseData.account.votesFor} | <strong>Against:</strong> {caseData.account.votesAgainst}</p>
                          <p><strong>Jurors:</strong> {caseData.account.jurors.length}/5</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'vote' && publicKey && (
                <div>
                  <h2>Vote on Case</h2>
                  <div className="form-group">
                    <label>Case ID:</label>
                    <input
                      type="number"
                      value={selectedCaseId}
                      onChange={(e) => setSelectedCaseId(e.target.value)}
                      placeholder="Enter case ID to vote on"
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                    <button
                      className="cta-button"
                      onClick={() => selectedCaseId && handleVote(parseInt(selectedCaseId), true)}
                      disabled={!selectedCaseId}
                    >
                      ? Vote Approve
                    </button>
                    <button
                      className="cta-button"
                      style={{ backgroundColor: '#dc3545' }}
                      onClick={() => selectedCaseId && handleVote(parseInt(selectedCaseId), false)}
                      disabled={!selectedCaseId}
                    >
                      ? Vote Reject
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      <footer style={{ textAlign: 'center', padding: '40px 20px', marginTop: '60px' }}>
        <p>© 2025 SolSafe. Powered by Solana & Switchboard VRF.</p>
      </footer>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap');
        
        * { box-sizing: border-box; margin: 0; padding: 0; }
        
        .app-root {
          background: linear-gradient(135deg, #1c0030, #4b0082, #9932cc);
          color: #fff;
          min-height: 100vh;
          font-family: 'Poppins', sans-serif;
        }
        
        .navbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 40px;
          background: rgba(28, 0, 48, 0.85);
          position: sticky;
          top: 0;
          z-index: 100;
        }
        
        .logo-img {
          height: 48px;
        }
        
        .hero {
          padding: 60px 20px 40px;
          text-align: center;
        }
        
        .hero h1 {
          font-size: 3rem;
          margin-bottom: 10px;
          text-shadow: 0 0 20px #9932cc;
        }
        
        .dashboard-shell {
          display: flex;
          gap: 24px;
          padding: 20px 40px;
          max-width: 1400px;
          margin: 0 auto;
        }
        
        .sidebar {
          width: 240px;
          background: rgba(0, 0, 0, 0.2);
          padding: 20px;
          border-radius: 12px;
          height: fit-content;
        }
        
        .nav-button {
          display: block;
          width: 100%;
          padding: 14px 16px;
          margin-bottom: 10px;
          border-radius: 10px;
          font-weight: 600;
          cursor: pointer;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: #fff;
          text-align: left;
          transition: all 0.3s;
        }
        
        .nav-button:hover:not(:disabled) {
          background: rgba(138, 43, 226, 0.3);
          border-color: #8a2be2;
        }
        
        .nav-button.active {
          background: #8a2be2;
          border-color: #8a2be2;
        }
        
        .nav-button:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
        
        .content {
          flex: 1;
          background: rgba(0, 0, 0, 0.15);
          padding: 30px;
          border-radius: 12px;
          min-height: 500px;
        }
        
        .content h2 {
          margin-bottom: 24px;
          font-size: 1.8rem;
        }
        
        .notice {
          background: rgba(255, 193, 7, 0.15);
          border: 1px solid rgba(255, 193, 7, 0.4);
          padding: 20px;
          border-radius: 10px;
          text-align: center;
        }
        
        .case-form {
          max-width: 600px;
        }
        
        .form-group {
          margin-bottom: 20px;
        }
        
        .form-group label {
          display: block;
          margin-bottom: 8px;
          font-weight: 600;
        }
        
        .form-group input {
          width: 100%;
          padding: 12px 16px;
          border-radius: 8px;
          border: 1px solid rgba(255, 255, 255, 0.2);
          background: rgba(0, 0, 0, 0.3);
          color: #fff;
          font-size: 1rem;
        }
        
        .form-group input:focus {
          outline: none;
          border-color: #8a2be2;
        }
        
        .cta-button {
          padding: 12px 30px;
          background: #8a2be2;
          color: #fff;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          font-size: 1rem;
          transition: all 0.3s;
        }
        
        .cta-button:hover:not(:disabled) {
          background: #7a1fd2;
          transform: translateY(-2px);
        }
        
        .cta-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        
        .cases-list {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 20px;
        }
        
        .case-card {
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(255, 255, 255, 0.1);
          padding: 20px;
          border-radius: 10px;
        }
        
        .case-card h3 {
          margin-bottom: 12px;
          color: #8a2be2;
        }
        
        .case-card p {
          margin-bottom: 8px;
          font-size: 0.9rem;
        }
        
        .case-card a {
          color: #8a2be2;
          text-decoration: none;
        }
        
        .case-card a:hover {
          text-decoration: underline;
        }
        
        .error-message {
          background: rgba(220, 53, 69, 0.15);
          border: 1px solid rgba(220, 53, 69, 0.4);
          padding: 12px 16px;
          border-radius: 8px;
          margin-bottom: 20px;
          color: #ff6b6b;
        }
        
        .success-message {
          background: rgba(40, 167, 69, 0.15);
          border: 1px solid rgba(40, 167, 69, 0.4);
          padding: 12px 16px;
          border-radius: 8px;
          margin-bottom: 20px;
          color: #51cf66;
        }
      `}</style>
    </div>
  );
}
