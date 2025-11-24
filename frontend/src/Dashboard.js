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
        .nav-button { display:block; padding:12px 14px; margin-bottom:10px; border-radius:10px; font-weight:700; cursor:pointer; background:transparent; border:1px solid rgba(255,255,255,0.06); }
        .nav-button.active { background: linear-gradient(90deg,#7b1fa2,#9932cc); box-shadow:0 6px 14px rgba(0,0,0,0.4); }
        .wallet-panel { display:flex; gap:12px; align-items:center; justify-content:space-between; margin-bottom:14px }
        .cta { background: linear-gradient(90deg,#7b1fa2,#9932cc); padding:10px 14px; border-radius:40px; font-weight:700; }
        .disabled-overlay { position:absolute; inset:0; background: rgba(0,0,0,0.5); display:flex; justify-content:center; align-items:center; border-radius:12px }
        .case-card { background: rgba(255,255,255,0.03); padding:14px; border-radius:10px; margin-bottom:12px; }
        .input, textarea { width:100%; padding:12px; border-radius:8px; border:1px solid rgba(255,255,255,0.08); background: rgba(255,255,255,0.02); color:#fff }
        .muted { opacity:0.85; font-size:0.95rem }
        .small { font-size:0.9rem }
        @media (max-width:900px) { .dashboard-shell{flex-direction:column} .sidebar{width:100%} }
      `}</style>
    </div>
  );
}

function HeadNav() {
  return (
    <header className="navbar">
      <div style={{display:'flex',alignItems:'center',gap:12}}>
        <img src={`${process.env.PUBLIC_URL}/logoo.png`} alt="solsafe logo" className="logo-img" />
        <div>
          <div style={{fontWeight:700}}>SOLSAFE</div>
          <div style={{fontSize:12,opacity:0.9}}>Decentralized juror-based DeFi protocol</div>
        </div>
      </div>
      <WalletConnectPanel />
    </header>
  );
}

function WalletConnectPanel(){
  const { connected, walletType, address, connectSolana, connectEVM, disconnect } = useContext(WalletContext);

  return (
    <div style={{display:'flex',alignItems:'center',gap:12}}>
      {!connected ? (
        <>
          <button className="cta nav-button" onClick={connectSolana}>Connect Solana</button>
          <button className="cta nav-button" onClick={connectEVM}>Connect EVM</button>
        </>
      ) : (
        <div style={{display:'flex', alignItems:'center', gap:12}}>
          <div style={{textAlign:'right'}}>
            <div style={{fontWeight:700}}>{truncate(address)}</div>
            <div className="small muted">{walletType?.toUpperCase()}</div>
          </div>
          <button className="nav-button" onClick={disconnect}>Disconnect</button>
        </div>
      )}
    </div>
  );
}

function Sidebar({ setActiveTab, activeTab }){
  const { connected } = useContext(WalletContext);

  function navTo(tab){
    // only allow non-dashboard pages when connected
    if (!connected && tab !== 'dashboard') {
      alert('Please connect a wallet to access this page.');
      return;
    }
    setActiveTab(tab);
  }

  return (
    <div>
      <button className={`nav-button ${activeTab==='dashboard' ? 'active' : ''}`} onClick={()=>navTo('dashboard')}>Profile</button>
      <button className={`nav-button ${activeTab==='submit' ? 'active' : ''}`} onClick={()=>navTo('submit')}>Submit Case</button>
      <button className={`nav-button ${activeTab==='details' ? 'active' : ''}`} onClick={()=>navTo('details')}>Case Details</button>
      <button className={`nav-button ${activeTab==='vote' ? 'active' : ''}`} onClick={()=>navTo('vote')}>Vote Case</button>
      <button className={`nav-button ${activeTab==='freeze' ? 'active' : ''}`} onClick={()=>navTo('freeze')}>Freeze / Unfreeze</button>
    </div>
  );
}

function DisabledNotice(){
  return (
    <div style={{padding:12, background:'rgba(0,0,0,0.25)', borderRadius:8, marginBottom:12}}>
      <strong>Wallet required:</strong> Connect a Solana or EVM wallet to enable Submit, Details, Vote, Freeze pages.
    </div>
  );
}

function ProfilePanel(){
  const { address, connected, walletType } = useContext(WalletContext);
  return (
    <div>
      <h3>Profile</h3>
      <div className="case-card">
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <div>
            <div style={{fontWeight:700}}>Connected: {connected ? 'Yes' : 'No'}</div>
            <div className="muted">Wallet: {walletType || '—'}</div>
            <div className="muted">Address: {address || '—'}</div>
          </div>
        </div>
      </div>

      <h4>How it works</h4>
      <p className="small muted">Users submit cases (on-chain evidence links and file uploads). Once submitted, cases appear under Vote Case for jurors to vote. The case with the highest votes will be flagged for investigation and, if proven, Solana validators (off-chain / on-chain validator action) can freeze/unfreeze guilty addresses.</p>
    </div>
  );
}

// Shared in-memory cases store (simple local state for demo; replace with backend or on-chain storage)
const useCaseStore = (() => {
  let subscribers = [];
  let cases = [];
  function notify(){ subscribers.forEach(s=>s(cases)); }
  return function useCaseStoreHook(){
    const [state, setState] = useState(cases);
    useEffect(()=>{ subscribers.push(setState); return ()=>{ subscribers = subscribers.filter(s=>s!==setState); } }, []);
    return {
      cases: state,
      addCase: (c)=>{ cases = [ { id: `case_${Date.now()}`, votes:0, status:'submitted', createdAt: new Date().toISOString(), ...c }, ...cases ]; notify(); },
      voteCase: (id)=>{ cases = cases.map(c=> c.id===id ? {...c, votes: c.votes+1} : c); notify(); },
      setStatus: (id, status)=>{ cases = cases.map(c=> c.id===id ? {...c, status} : c); notify(); }
    };
  }
})();

function SubmitCase(){
  const { address } = useContext(WalletContext);
  const store = useCaseStore();

  const [victimAddress, setVictimAddress] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  function onFile(e){
    const f = e.target.files[0];
    setFile(f);
  }

  async function onSubmit(e){
    e.preventDefault();
    if (!victimAddress) return alert('Please enter the scammer wallet address');
    setSubmitting(true);
    // In a real app: upload file to IPFS or other storage, create on-chain evidence tx, etc.
    // Here we simulate by creating a FileReader dataURL (not suitable for large files)
    let fileUrl = null;
    if (file){
      fileUrl = await readFileAsDataURL(file);
    }

    store.addCase({
      reporter: address,
      victimAddress,
      description,
      evidenceUrl: fileUrl,
      attachedFileName: file?.name || null
    });

    setVictimAddress(''); setDescription(''); setFile(null); setSubmitting(false);
    alert('Case submitted — it will appear under Vote Case for juror voting.');
  }

  return (
    <div>
      <h3>Submit Case</h3>
      <div className="case-card">
        <form onSubmit={onSubmit}>
          <label className="small muted">Scammer / Suspect Wallet Address</label>
          <input className="input" value={victimAddress} onChange={e=>setVictimAddress(e.target.value)} placeholder="Enter wallet address (Solana or EVM)" />

          <label className="small muted" style={{marginTop:10}}>Description / Case Details</label>
          <textarea className="input" rows={6} value={description} onChange={e=>setDescription(e.target.value)} placeholder="Describe what happened, tx IDs, timeline, etc."></textarea>

          <label className="small muted" style={{marginTop:10}}>Photo / PDF Evidence (optional)</label>
          <input type="file" accept="image/*,.pdf" onChange={onFile} />
          {file && <div className="muted small">Selected: {file.name}</div>}

          <div style={{display:'flex',justifyContent:'flex-end', marginTop:12}}>
            <button type="submit" className="cta">{submitting ? 'Submitting...' : 'Submit Case'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function CaseDetails(){
  const store = useCaseStore();

  return (
    <div>
      <h3>Case Details</h3>
      {store.cases.length === 0 && <div className="muted">No cases submitted yet.</div>}
      {store.cases.map(c=> (
        <div className="case-card" key={c.id}>
          <div style={{display:'flex',justifyContent:'space-between'}}>
            <div>
              <div style={{fontWeight:700}}>Victim/Target: {c.victimAddress}</div>
              <div className="small muted">Reported by: {truncate(c.reporter)}</div>
              <div className="small muted">Status: {c.status} — Votes: {c.votes}</div>
            </div>
            <div className="small muted">{new Date(c.createdAt).toLocaleString()}</div>
          </div>
          <div style={{marginTop:8}}>{c.description}</div>
          {c.evidenceUrl && (
            <div style={{marginTop:8}}>
              <strong>Evidence:</strong>
              {c.attachedFileName?.toLowerCase().endsWith('.pdf') ? (
                <div><a href={c.evidenceUrl} target="_blank" rel="noreferrer">Open PDF evidence</a></div>
              ) : (
                <div><img alt="evidence" src={c.evidenceUrl} style={{maxWidth:320, marginTop:8, borderRadius:8}}/></div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function VoteCase(){
  const store = useCaseStore();
  const { address } = useContext(WalletContext);
  const [votedCases, setVotedCases] = useState({});

  function vote(id){
    // Simple lock to prevent double-vote in this demo UI per address per session
    if (votedCases[id]) return alert('You already voted for this case in this session.');
    store.voteCase(id);
    setVotedCases(prev=> ({...prev, [id]: true}));
  }

  // compute case with highest votes
  const topCase = store.cases.reduce((acc, c) => (!acc || c.votes > acc.votes ? c : acc), null);

  return (
    <div>
      <h3>Vote Case</h3>
      {store.cases.length === 0 && <div className="muted">No submitted cases to vote on.</div>}
      {store.cases.map(c=> (
        <div className="case-card" key={c.id}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <div>
              <div style={{fontWeight:700}}>Victim: {c.victimAddress}</div>
              <div className="small muted">Votes: {c.votes}</div>
              <div className="small muted">Status: {c.status}</div>
            </div>
            <div>
              <button className="nav-button" onClick={()=>vote(c.id)}>Vote</button>
            </div>
          </div>
          <div style={{marginTop:8}}>{c.description}</div>
        </div>
      ))}

      {topCase && (
        <div style={{marginTop:14, padding:12, borderRadius:10, background:'rgba(0,0,0,0.12)'}}>
          <strong>Top voted case:</strong>
          <div>Victim: {topCase.victimAddress} — Votes: {topCase.votes}</div>
          <div className="small muted">A top-voted case can be escalated for investigation by admins/validators.</div>
        </div>
      )}
    </div>
  );
}

function FreezeUnfreeze(){
  const { isValidator, address } = useContext(WalletContext);
  const store = useCaseStore();

  function doFreeze(victimAddress){
    if (!isValidator) return alert('Only validators can perform freeze/unfreeze actions.');
    // In production: call Solana validator RPC or governance contract
    // Here we simulate by setting status of any case with that victimAddress to 'frozen'
    const target = store.cases.find(c => c.victimAddress === victimAddress);
    if (!target) return alert('No case found for that address');
    store.setStatus(target.id, 'frozen');
    alert(`Freeze request submitted for ${victimAddress}. Validators would perform the action on-chain.`);
  }

  function doUnfreeze(victimAddress){
    if (!isValidator) return alert('Only validators can perform freeze/unfreeze actions.');
    const target = store.cases.find(c => c.victimAddress === victimAddress);
    if (!target) return alert('No case found for that address');
    store.setStatus(target.id, 'unfrozen');
    alert(`Unfreeze request submitted for ${victimAddress}. Validators would perform the action on-chain.`);
  }

  return (
    <div>
      <h3>Freeze / Unfreeze</h3>
      <div className="muted small">Only validator addresses are allowed to freeze/unfreeze. This UI simulates that action; implement on-chain validator flows for production.</div>
      {!isValidator && <div style={{marginTop:12}} className="case-card">You are not a validator. Validator addresses are required to perform these actions.</div>}

      <div style={{marginTop:12}}>
        {store.cases.map(c => (
          <div className="case-card" key={c.id}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <div>
                <div style={{fontWeight:700}}>Victim: {c.victimAddress}</div>
                <div className="small muted">Status: {c.status}</div>
              </div>
              <div style={{display:'flex',gap:8}}>
                <button className="nav-button" onClick={()=>doFreeze(c.victimAddress)}>Freeze</button>
                <button className="nav-button" onClick={()=>doUnfreeze(c.victimAddress)}>Unfreeze</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Footer(){
  return (
    <footer style={{textAlign:'center', padding:40, marginTop:40, background:'#1c0030'}}>
      <div>&copy; 2025 SOLSAFE. All rights reserved.</div>
      <div style={{marginTop:8}}><a href="https://x.com/Solsafe_io">X</a> | <a href="#">Telegram</a> | <a href="#whitepaper">Whitepaper</a></div>
    </footer>
  );
}

/* Helpers */
function truncate(s){ if(!s) return '—'; return s.length>18 ? `${s.slice(0,8)}...${s.slice(-8)}` : s }
function readFileAsDataURL(file){ return new Promise((res, rej)=>{
  const fr = new FileReader(); fr.onload = ()=>res(fr.result); fr.onerror = rej; fr.readAsDataURL(file);
}); }

function Hero(){
  return (
    <section className="hero">
      <div className="hero-overlay" style={{position:'absolute', inset:0, background:'rgba(43,0,77,0.6)', zIndex:-1}} />
      <h1>SOLSAFE</h1>
      <p>Decentralized juror-based DeFi protocol on Solana to combat scams across chains.</p>
      <p className="ca-tba">By empowering the community to submit on-chain evidence, vote on scam cases, and freeze illicit assets.</p>
    </section>
  );
}
