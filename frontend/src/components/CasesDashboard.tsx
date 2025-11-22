import React from 'react';
import { useCases, formatCaseStatus, formatCaseState } from '../hooks/useCases';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

export default function CasesDashboard() {
  const {
    cases,
    loading,
    error,
    connected,
    fetchCases,
    voteOnCase,
  } = useCases();

  if (!connected) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <h2>Connect Your Wallet</h2>
        <p>Please connect your Solana wallet to view and interact with cases.</p>
        <WalletMultiButton />
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <div className="spinner">Loading cases from blockchain...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '20px', background: 'rgba(255,0,0,0.1)', borderRadius: '8px' }}>
        <strong>Error:</strong> {error}
        <button onClick={fetchCases} style={{ marginLeft: '10px' }}>
          Retry
        </button>
      </div>
    );
  }

  const handleVote = async (caseId: number, approve: boolean) => {
    try {
      await voteOnCase(caseId, approve);
      alert(`Vote submitted successfully!`);
    } catch (err: any) {
      alert(`Failed to vote: ${err.message}`);
    }
  };

  return (
    <div className="cases-dashboard">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Cases on Blockchain</h2>
        <button onClick={fetchCases} className="refresh-btn">
          🔄 Refresh
        </button>
      </div>

      {cases.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', opacity: 0.7 }}>
          No cases found. Submit the first case!
        </div>
      ) : (
        <div className="cases-grid">
          {cases.map((caseData) => (
            <div key={caseData.publicKey.toString()} className="case-card">
              <div className="case-header">
                <div>
                  <strong>Case #{caseData.account.caseId}</strong>
                  <div className="case-status">
                    <span className={`badge ${formatCaseStatus(caseData.account.status).toLowerCase()}`}>
                      {formatCaseStatus(caseData.account.status)}
                    </span>
                    <span className={`badge ${formatCaseState(caseData.account.state).toLowerCase()}`}>
                      {formatCaseState(caseData.account.state)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="case-details">
                <div className="detail-row">
                  <span className="label">Scammer:</span>
                  <span className="value">
                    {caseData.account.scamAddress.toString().slice(0, 8)}...
                    {caseData.account.scamAddress.toString().slice(-8)}
                  </span>
                </div>

                <div className="detail-row">
                  <span className="label">Evidence:</span>
                  <a 
                    href={caseData.account.evidence} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="evidence-link"
                  >
                    View on IPFS →
                  </a>
                </div>

                <div className="detail-row">
                  <span className="label">Votes:</span>
                  <span className="value">
                    👍 {caseData.account.votesFor} | 👎 {caseData.account.votesAgainst}
                  </span>
                </div>

                {caseData.account.jurors.length > 0 && (
                  <div className="detail-row">
                    <span className="label">Jurors:</span>
                    <span className="value">{caseData.account.jurors.length} selected</span>
                  </div>
                )}
              </div>

              {formatCaseState(caseData.account.state) === 'Voting' && (
                <div className="vote-actions">
                  <button
                    onClick={() => handleVote(caseData.account.caseId, true)}
                    className="vote-btn approve"
                  >
                    ✓ Approve
                  </button>
                  <button
                    onClick={() => handleVote(caseData.account.caseId, false)}
                    className="vote-btn reject"
                  >
                    ✗ Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <style>{`
        .cases-dashboard {
          padding: 20px;
          max-width: 1200px;
          margin: 0 auto;
        }

        .refresh-btn {
          padding: 8px 16px;
          background: rgba(138, 43, 226, 0.2);
          border: 1px solid rgba(138, 43, 226, 0.5);
          border-radius: 8px;
          color: white;
          cursor: pointer;
          transition: all 0.3s;
        }

        .refresh-btn:hover {
          background: rgba(138, 43, 226, 0.4);
          transform: scale(1.05);
        }

        .cases-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
          gap: 20px;
        }

        .case-card {
          background: rgba(0, 0, 0, 0.2);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 20px;
          transition: transform 0.3s, box-shadow 0.3s;
        }

        .case-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 10px 30px rgba(138, 43, 226, 0.3);
        }

        .case-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 15px;
          padding-bottom: 15px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .case-status {
          display: flex;
          gap: 8px;
          margin-top: 8px;
        }

        .badge {
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 0.85rem;
          font-weight: 600;
        }

        .badge.open {
          background: rgba(0, 150, 255, 0.2);
          color: #4fc3f7;
        }

        .badge.closed {
          background: rgba(150, 150, 150, 0.2);
          color: #aaa;
        }

        .badge.frozen {
          background: rgba(255, 0, 0, 0.2);
          color: #ff6b6b;
        }

        .badge.voting {
          background: rgba(255, 193, 7, 0.2);
          color: #ffd54f;
        }

        .badge.approved {
          background: rgba(76, 175, 80, 0.2);
          color: #81c784;
        }

        .badge.rejected {
          background: rgba(244, 67, 54, 0.2);
          color: #e57373;
        }

        .case-details {
          margin: 15px 0;
        }

        .detail-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }

        .detail-row:last-child {
          border-bottom: none;
        }

        .label {
          font-weight: 600;
          opacity: 0.8;
          font-size: 0.9rem;
        }

        .value {
          font-family: 'Courier New', monospace;
          font-size: 0.9rem;
        }

        .evidence-link {
          color: #8a2be2;
          text-decoration: none;
          font-weight: 600;
          transition: color 0.3s;
        }

        .evidence-link:hover {
          color: #9d4edd;
          text-decoration: underline;
        }

        .vote-actions {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          margin-top: 15px;
          padding-top: 15px;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }

        .vote-btn {
          padding: 10px;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
        }

        .vote-btn.approve {
          background: linear-gradient(135deg, #4caf50, #81c784);
          color: white;
        }

        .vote-btn.approve:hover {
          transform: scale(1.05);
          box-shadow: 0 5px 15px rgba(76, 175, 80, 0.4);
        }

        .vote-btn.reject {
          background: linear-gradient(135deg, #f44336, #e57373);
          color: white;
        }

        .vote-btn.reject:hover {
          transform: scale(1.05);
          box-shadow: 0 5px 15px rgba(244, 67, 54, 0.4);
        }

        .spinner {
          font-size: 1.2rem;
          color: #8a2be2;
        }

        @media (max-width: 768px) {
          .cases-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
