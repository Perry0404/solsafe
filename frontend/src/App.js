import React, { useState, useEffect, useMemo } from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { clusterApiUrl } from '@solana/web3.js';
import "./App.css";
import "./animations.css";
import Dashboard from "./Dashboard";
import WhitepaperEnhanced from "./components/WhitepaperEnhanced";
import Documentation from "./components/Documentation";

// Import wallet adapter CSS
import '@solana/wallet-adapter-react-ui/styles.css';

export default function App() {
  const [menuOpen, setMenuOpen] = useState(false);

  // Solana devnet configuration
  const network = WalletAdapterNetwork.Devnet;
  const endpoint = useMemo(() => clusterApiUrl(network), [network]);
  
  // Configure supported wallets
  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter({ network }),
    ],
    [network]
  );

  // Scroll effect for navbar color
  useEffect(() => {
    const handleScroll = () => {
      const navbar = document.querySelector(".navbar");
      if (navbar) navbar.classList.toggle("scrolled", window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <Router>
      <Routes>
        <Route
          path="/"
          element={
            <div>
              <header>
                <nav className="navbar">
                  <div className="logo">
                    <img
                      src="/logoo.png"
                      alt="solsafe logo"
                      className="logo-img"
                    />
                  </div>

                  <ul className={`nav-links ${menuOpen ? "nav-active" : ""}`}> 
                    <li>
                      <a href="#home" onClick={() => setMenuOpen(false)}>
                        Home
                      </a>
                    </li>
                    <li>
                      <a href="#features" onClick={() => setMenuOpen(false)}>
                        Features
                      </a>
                    </li>
                    <li>
                      <a href="#solsafe" onClick={() => setMenuOpen(false)}>
                        How It Works
                      </a>
                    </li>
                    <li>
                      <Link to="/dashboard" onClick={() => setMenuOpen(false)}>
                        Dashboard
                      </Link>
                    </li>
                    <li>
                      <Link to="/whitepaper" onClick={() => setMenuOpen(false)}>
                        Whitepaper
                      </Link>
                    </li>
                    <li>
                      <Link to="/docs" onClick={() => setMenuOpen(false)}>
                        Docs
                      </Link>
                    </li>
                  </ul>

                  <div
                    className={`burger ${menuOpen ? "toggle" : ""}`}
                    onClick={() => setMenuOpen(!menuOpen)}
                  >
                    <div></div>
                    <div></div>
                    <div></div>
                  </div>
                </nav>
              </header>

              <section id="home" className="hero">
                <div className="hero-overlay"></div>
                <div className="hero-content">
                  <div className="hero-badge">🛡️ Powered by Solana & ZK Proofs</div>
                  <h1 className="hero-title">
                    Protect Your <span className="gradient-text">Crypto</span> from Scams
                  </h1>
                  <p className="hero-subtitle">
                    The first community-driven blockchain forensics platform with AI-powered 
                    evidence analysis, cross-chain tracking, and zero-knowledge privacy.
                  </p>
                  <div className="hero-stats">
                    <div className="stat-item">
                      <div className="stat-value">$2M+</div>
                      <div className="stat-label">Scams Detected</div>
                    </div>
                    <div className="stat-item">
                      <div className="stat-value">10K+</div>
                      <div className="stat-label">Addresses Tracked</div>
                    </div>
                    <div className="stat-item">
                      <div className="stat-value">8</div>
                      <div className="stat-label">Blockchains</div>
                    </div>
                  </div>
                  <div className="hero-buttons">
                    <Link to="/dashboard" className="cta-button primary">
                      🚀 Launch Dashboard
                    </Link>
                    <a href="#features" className="cta-button secondary">
                      Learn More
                    </a>
                  </div>
                </div>
                <div className="hero-illustration">
                  <div className="floating-card card-1">🔐 ZK Privacy</div>
                  <div className="floating-card card-2">🌐 Multi-Chain</div>
                  <div className="floating-card card-3">⚡ Real-Time</div>
                </div>
              </section>

              <section id="features" className="features-section">
                <h2 className="section-title">Why Choose <span className="gradient-text">SOLSAFE</span>?</h2>
                <p className="section-subtitle">Cutting-edge blockchain forensics meets community-driven justice</p>
                
                <div className="features-grid">
                  <div className="feature-card">
                    <div className="feature-icon">🔬</div>
                    <h3>AI Evidence Generator</h3>
                    <p>Analyze ANY wallet address across Solana, Ethereum, BSC, Polygon with AI-powered pattern recognition</p>
                    <Link to="/dashboard" className="feature-link">Try it now →</Link>
                  </div>
                  
                  <div className="feature-card">
                    <div className="feature-icon">🕸️</div>
                    <h3>Interactive Network Graph</h3>
                    <p>Visualize transaction flows like Arkham Intelligence with our D3.js-powered interactive visualizer</p>
                    <Link to="/dashboard" className="feature-link">Explore →</Link>
                  </div>
                  
                  <div className="feature-card">
                    <div className="feature-icon">🔐</div>
                    <h3>ZK Transaction Tracing</h3>
                    <p>Track "untraceable" ZK transactions on Tornado Cash, Aztec, Railgun with 70-95% confidence</p>
                    <Link to="/docs" className="feature-link">Read methodology →</Link>
                  </div>
                  
                  <div className="feature-card">
                    <div className="feature-icon">🌉</div>
                    <h3>Cross-Chain Detection</h3>
                    <p>Follow scammers across 8+ blockchains: Ethereum, Solana, BSC, Polygon, Arbitrum, zkSync, Avalanche</p>
                    <Link to="/dashboard" className="feature-link">Learn more →</Link>
                  </div>
                  
                  <div className="feature-card">
                    <div className="feature-icon">🗳️</div>
                    <h3>Decentralized Voting</h3>
                    <p>Community-driven case validation with juror selection powered by Switchboard VRF</p>
                    <Link to="/whitepaper" className="feature-link">Read whitepaper →</Link>
                  </div>
                  
                  <div className="feature-card">
                    <div className="feature-icon">💾</div>
                    <h3>Immutable Evidence</h3>
                    <p>Store evidence permanently on IPFS & Arweave with cryptographic proofs</p>
                    <Link to="/dashboard" className="feature-link">Upload evidence →</Link>
                  </div>
                </div>
              </section>

              <section id="solsafe" className="how-it-works">
                <h2 className="section-title">How It <span className="gradient-text">Works</span></h2>
                <div className="steps-container">
                  <div className="step">
                    <div className="step-number">1</div>
                    <h3>Analyze & Generate Evidence</h3>
                    <p>Enter any blockchain address. Our AI analyzes transaction patterns, fund flows, and ZK protocol interactions</p>
                  </div>
                  <div className="step-arrow">→</div>
                  <div className="step">
                    <div className="step-number">2</div>
                    <h3>Submit On-Chain Case</h3>
                    <p>Upload evidence to IPFS/Arweave and submit case to Solana blockchain with ZK privacy option</p>
                  </div>
                  <div className="step-arrow">→</div>
                  <div className="step">
                    <div className="step-number">3</div>
                    <h3>Community Voting</h3>
                    <p>5 randomly selected jurors vote on case validity. Majority decision determines outcome</p>
                  </div>
                  <div className="step-arrow">→</div>
                  <div className="step">
                    <div className="step-number">4</div>
                    <h3>Public Blacklist</h3>
                    <p>Confirmed scam addresses are added to permanent on-chain registry accessible to all DApps</p>
                  </div>
                </div>
              </section>

              <section className="cta-section">
                <div className="cta-content">
                  <h2>Ready to Make Crypto Safer?</h2>
                  <p>Join thousands of users protecting the blockchain ecosystem</p>
                  <div className="cta-buttons">
                    <Link to="/dashboard" className="cta-button primary large">
                      🚀 Get Started Now
                    </Link>
                    <Link to="/whitepaper" className="cta-button secondary large">
                      📄 Read Whitepaper
                    </Link>
                  </div>
                </div>
              </section>

              <footer>
                <p>© 2025 SOLSAFE. All rights reserved.</p>
                <p>
                  <a href="https://x.com/Solsafe_io">X</a> | <a href="mailto:perrypaschal0404@gmail.com">Contact</a> | <Link to="/whitepaper">Whitepaper</Link>
                </p>
              </footer>
            </div>
          }
        />

        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/whitepaper" element={<WhitepaperEnhanced />} />
        <Route path="/docs" element={<Documentation />} />
      </Routes>
          </Router>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
