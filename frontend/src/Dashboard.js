/* Dashboard.js - Complete implementation */
import React, { useEffect, useState, createContext, useContext } from 'react';
import { Link } from "react-router-dom";

export const WalletContext = createContext();

export default function App() {
  return (
    <WalletProvider>
      <MainApp />
    </WalletProvider>
  );
}

function WalletProvider({ children }) {
  const [connected, setConnected] = useState(false);
  const [walletType, setWalletType] = useState(null);
  const [address, setAddress] = useState(null);

  const validatorAddresses = [
    'ValidatorSolanaExamplePublicKey',
    '0xValidatorEvmExampleAddress'
  ];

  const isValidator = address && validatorAddresses.includes(address);

  function connectSolana() {
    const provider = window.solana;
    if (!provider) {
      alert('No Solana wallet found (Phantom). Please install Phantom or another Solana wallet.');
      return;
    }
    provider.connect().then((resp) => {
      setConnected(true);
      setWalletType('solana');
      setAddress(resp.publicKey?.toString?.() || resp.publicKey);
    }).catch((err) => console.error('Solana connect error', err));
  }

  function connectEVM() {
    const provider = window.ethereum;
    if (!provider) {
      alert('No EVM wallet found (MetaMask). Please install MetaMask or another EVM wallet.');
      return;
    }
    provider.request({ method: 'eth_requestAccounts' }).then((accounts) => {
      setConnected(true);
      setWalletType('evm');
      setAddress(accounts[0]);
    }).catch((err) => console.error('EVM connect error', err));
  }

  function disconnect() {
    setConnected(false);
    setWalletType(null);
    setAddress(null);
  }

  return (
    <WalletContext.Provider value={{ connected, walletType, address, isValidator, connectSolana, connectEVM, disconnect }}>
      {children}
    </WalletContext.Provider>
  );
}

function MainApp() {
  const { connected } = useContext(WalletContext);
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    if (!connected) setActiveTab('dashboard');
  }, [connected]);

  return (
    <div className="app-root">
      <HeadNav />
      <main>
        <Link
          to="/"
          style={{
            display: "inline-block",
            marginBottom: "20px",
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
        <Hero />
        <section style={{ paddingTop: 40 }}>
          <div className="dashboard-shell">
            <div className="sidebar">
              <Sidebar setActiveTab={setActiveTab} activeTab={activeTab} />
            </div>
            <div className="content">
              {!connected && <DisabledNotice />}
              {activeTab === 'dashboard' && <ProfilePanel />}
              {activeTab === 'submit' && <SubmitCase />}
              {activeTab === 'details' && <CaseDetails />}
              {activeTab === 'vote' && <VoteCase />}
              {activeTab === 'freeze' && <FreezeUnfreeze />}
            </div>
          </div>
        </section>
      </main>
      <Footer />
      <DashboardStyles />
    </div>
  );
}

function HeadNav() {
  const { connected, connectSolana, connectEVM, disconnect, walletType, address } = useContext(WalletContext);
  return (
    <nav className="navbar">
      <div className="logo">
        <img src="/logoo.png" alt="SolSafe Logo" className="logo-img" />
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        {!connected ? (
          <>
            <button className="cta-button" onClick={connectSolana}>Connect Solana</button>
            <button className="cta-button" onClick={connectEVM}>Connect EVM</button>
          </>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: '0.9rem' }}>
              {walletType?.toUpperCase()} • {address?.slice(0, 6)}...{address?.slice(-4)}
            </span>
            <button className="cta-button" onClick={disconnect}>Disconnect</button>
          </div>
        )}
      </div>
    </nav>
  );
}

function Hero() {
  return (
    <div className="hero">
      <h1>Dashboard</h1>
      <p>Manage cases, vote, and freeze scam assets.</p>
    </div>
  );
}

function Sidebar({ setActiveTab, activeTab }) {
  const { connected } = useContext(WalletContext);
  const tabs = [
    { key: 'dashboard', label: 'Profile' },
    { key: 'submit', label: 'Submit Case' },
    { key: 'details', label: 'Case Details' },
    { key: 'vote', label: 'Vote' },
    { key: 'freeze', label: 'Freeze/Unfreeze' }
  ];
  return (
    <>
      {tabs.map(tab => (
        <div
          key={tab.key}
          className={`nav-button ${activeTab === tab.key ? 'active' : ''} ${!connected && tab.key !== 'dashboard' ? 'disabled' : ''}`}
          onClick={() => connected || tab.key === 'dashboard' ? setActiveTab(tab.key) : null}
        >
          {tab.label}
        </div>
      ))}
    </>
  );
}

function DisabledNotice() {
  const { connectSolana, connectEVM } = useContext(WalletContext);
  return (
    <div style={{ padding: 20, textAlign: 'center', background: 'rgba(255,255,0,0.1)', borderRadius: 8 }}>
      <h3>Connect Wallet</h3>
      <p>Please connect your wallet to access dashboard features.</p>
      <button className="cta-button" onClick={connectSolana} style={{ marginRight: 10 }}>Connect Solana</button>
      <button className="cta-button" onClick={connectEVM}>Connect EVM</button>
    </div>
  );
}

function ProfilePanel() {
  const { connected, address, walletType, isValidator } = useContext(WalletContext);
  if (!connected) return <DisabledNotice />;
  return (
    <div>
      <h2>Your Profile</h2>
      <p><strong>Wallet Type:</strong> {walletType?.toUpperCase()}</p>
      <p><strong>Address:</strong> {address}</p>
      <p><strong>Validator Status:</strong> {isValidator ? '✅ Yes' : '❌ No'}</p>
    </div>
  );
}

function SubmitCase() {
  const { connected } = useContext(WalletContext);
  const [scamAddress, setScamAddress] = useState('');
  const [evidence, setEvidence] = useState('');
  if (!connected) return <DisabledNotice />;
  const handleSubmit = (e) => {
    e.preventDefault();
    alert('Case submitted (blockchain integration needed)');
  };
  return (
    <div>
      <h2>Submit a Scam Case</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 15 }}>
          <label>Scam Address</label>
          <input type="text" value={scamAddress} onChange={(e) => setScamAddress(e.target.value)} style={{ width: '100%', padding: 10 }} required />
        </div>
        <div style={{ marginBottom: 15 }}>
          <label>Evidence</label>
          <textarea value={evidence} onChange={(e) => setEvidence(e.target.value)} style={{ width: '100%', padding: 10, minHeight: 100 }} required />
        </div>
        <button type="submit" className="cta-button">Submit Case</button>
      </form>
    </div>
  );
}

function CaseDetails() {
  const { connected } = useContext(WalletContext);
  const [caseId, setCaseId] = useState('');
  if (!connected) return <DisabledNotice />;
  const handleFetch = () => {
    alert('Fetching case details (blockchain integration needed)');
  };
  return (
    <div>
      <h2>Case Details</h2>
      <div style={{ marginBottom: 15 }}>
        <label>Case ID</label>
        <input type="text" value={caseId} onChange={(e) => setCaseId(e.target.value)} style={{ width: '100%', padding: 10 }} />
      </div>
      <button onClick={handleFetch} className="cta-button">Fetch Details</button>
      <div style={{ marginTop: 20, padding: 15, background: 'rgba(0,0,0,0.2)', borderRadius: 8 }}>
        <p>Case details will appear here...</p>
      </div>
    </div>
  );
}

function VoteCase() {
  const { connected, isValidator } = useContext(WalletContext);
  const [caseId, setCaseId] = useState('');
  if (!connected) return <DisabledNotice />;
  if (!isValidator) {
    return (
      <div style={{ padding: 20, textAlign: 'center', background: 'rgba(255,0,0,0.1)', borderRadius: 8 }}>
        <h3>Validator Only</h3>
        <p>Only validators can vote on cases.</p>
      </div>
    );
  }
  const handleVote = (voteFor) => {
    alert(`Voted ${voteFor ? 'FOR' : 'AGAINST'} case ${caseId} (blockchain integration needed)`);
  };
  return (
    <div>
      <h2>Vote on Case</h2>
      <div style={{ marginBottom: 15 }}>
        <label>Case ID</label>
        <input type="text" value={caseId} onChange={(e) => setCaseId(e.target.value)} style={{ width: '100%', padding: 10 }} />
      </div>
      <button onClick={() => handleVote(true)} className="cta-button" style={{ marginRight: 10 }}>Vote FOR</button>
      <button onClick={() => handleVote(false)} className="cta-button">Vote AGAINST</button>
    </div>
  );
}

function FreezeUnfreeze() {
  const { connected, isValidator } = useContext(WalletContext);
  const [targetAddress, setTargetAddress] = useState('');
  if (!connected) return <DisabledNotice />;
  if (!isValidator) {
    return (
      <div style={{ padding: 20, textAlign: 'center', background: 'rgba(255,0,0,0.1)', borderRadius: 8 }}>
        <h3>Validator Only</h3>
        <p>Only validators can freeze/unfreeze assets.</p>
      </div>
    );
  }
  const handleFreeze = () => {
    alert(`Freezing ${targetAddress} (blockchain integration needed)`);
  };
  const handleUnfreeze = () => {
    alert(`Unfreezing ${targetAddress} (blockchain integration needed)`);
  };
  return (
    <div>
      <h2>Freeze/Unfreeze Assets</h2>
      <div style={{ marginBottom: 15 }}>
        <label>Target Address</label>
        <input type="text" value={targetAddress} onChange={(e) => setTargetAddress(e.target.value)} style={{ width: '100%', padding: 10 }} />
      </div>
      <button onClick={handleFreeze} className="cta-button" style={{ marginRight: 10 }}>Freeze</button>
      <button onClick={handleUnfreeze} className="cta-button">Unfreeze</button>
    </div>
  );
}

function Footer() {
  return (
    <footer style={{ textAlign: 'center', padding: '30px 20px', background: 'rgba(0,0,0,0.3)', marginTop: 60 }}>
      <p>© 2025 SOLSAFE. All rights reserved.</p>
      <p>
        <a href="https://x.com/Solsafe_io" style={{ color: '#9932cc', marginRight: 20 }}>X</a>
        <a href="https://t.me/" style={{ color: '#9932cc', marginRight: 20 }}>Telegram</a>
        <a href="#whitepaper" style={{ color: '#9932cc' }}>Whitepaper</a>
      </p>
    </footer>
  );
}

function DashboardStyles() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;700&display=swap');
      * { box-sizing: border-box; }
      body, html, #root { height: 100%; margin: 0; font-family: 'Poppins', sans-serif; }
      .app-root { background: linear-gradient(135deg, #1c0030, #4b0082, #9932cc); color: #fff; min-height: 100vh; }
      .navbar { display:flex; justify-content:space-between; align-items:center; padding:20px 40px; background: rgba(28,0,48,0.85); position:sticky; top:0; z-index:100; }
      .logo-img { height:48px; }
      .hero { height: 320px; display:flex; flex-direction:column; justify-content:center; align-items:center; text-align:center; padding:20px; }
      .hero h1 { font-size: 2.8rem; text-shadow:0 0 15px #9932cc; margin-bottom:6px; }
      .dashboard-shell { display:flex; gap:24px; padding:20px; max-width:1200px; margin:0 auto; }
      .sidebar { width:240px; background: rgba(0,0,0,0.15); padding:16px; border-radius:12px; }
      .content { flex:1; background: rgba(0,0,0,0.12); padding:18px; border-radius:12px; min-height:420px; }
      .nav-button { display:block; padding:12px 14px; margin-bottom:10px; border-radius:10px; font-weight:700; cursor:pointer; background:transparent; border:1px solid rgba(255,255,255,0.06); color: #fff; text-align:left; }
      .nav-button:hover { background: rgba(138,43,226,0.2); border-color: rgba(138,43,226,0.5); }
      .nav-button.active { background: rgba(138,43,226,0.4); border-color: #8a2be2; }
      .nav-button.disabled { opacity:0.3; cursor:not-allowed; }
      .cta-button { padding:12px 24px; background:#8a2be2; color:#fff; border:none; border-radius:8px; font-weight:700; cursor:pointer; font-size:1rem; }
      .cta-button:hover { background:#9932cc; }
      input, textarea { background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); color: #fff; border-radius:8px; font-family: 'Poppins', sans-serif; }
      label { display:block; margin-bottom:5px; font-weight:600; }
    `}</style>
  );
}
