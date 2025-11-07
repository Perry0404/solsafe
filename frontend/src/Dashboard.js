/* Dashboard.js moved unchanged */
import React, { useEffect, useState, createContext, useContext } from 'react';
import { Link } from "react-router-dom";

// Default export a React component (single-file App) — copy the look & feel from the provided HTML/CSS
// Note: This is a client-side UI-only implementation. Blockchain actions (freeze/unfreeze) are *stubbed*
// and would need backend/validator-on-chain integration in a production app.

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
  const [walletType, setWalletType] = useState(null); // 'solana' | 'evm'
  const [address, setAddress] = useState(null);

  // simple validator whitelist — in production, verify on-chain or via backend
  const validatorAddresses = [
    // example public keys / addresses for testing. Replace with real validator addresses.
    'ValidatorSolanaExamplePublicKey',
    '0xValidatorEvmExampleAddress'
  ];

  const isValidator = address && validatorAddresses.includes(address);

  function connectSolana() {
    // Phantom-compatible
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
    // note: many wallets don't provide programmatic disconnect; this clears local UI state
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
    // If not connected, force dashboard view and keep pages disabled.
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

      <style>{`
        /* keep the original design/colors/fonts (Poppins) */
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;700&display=swap');
        * { box-sizing: border-box; }
        body, html, #root { height: 100%; margin: 0; font-family: 'Poppins', sans-serif; }
        .app-root { background: linear-gradient(135deg, #1c0030, #4b0082, #9932cc); color: #fff; min-height: 100vh; }
        .navbar { display:flex; justify-content:space-between; align-items:center; padding:20px 40px; background: rgba(28,0,48,0.85); position:sticky; top:0; z-index:100; }
        .logo-img { height:48px }
        .hero { height: 320px; display:flex; flex-direction:column; justify-content:center; align-items:center; text-align:center; padding:20px; }
        .hero h1 { font-size: 2.8rem; text-shadow:0 0 15px #9932cc; margin-bottom:6px }
        .dashboard-shell { display:flex; gap:24px; padding:20px; max-width:1200px; margin:0 auto; }
        .sidebar { width:240px; background: rgba(0,0,0,0.15); padding:16px; border-radius:12px; }
        .content { flex:1; background: rgba(0,0,0,0.12); padding:18px; border-radius:12px; min-height:420px; }
        .nav-button { display:block; padding:12px 14px; margin-bottom:10px; border-radius:10px; font-weight:700; cursor:pointer; background:transparent; border:1px solid rgba(255,255,255,0.06); }[...]`
      }</style>
    </div>
  );
}

/* The rest of Dashboard.js (SubmitCase, CaseDetails, VoteCase, FreezeUnfreeze, Footer, Helpers, Hero) is included unchanged in this file. */