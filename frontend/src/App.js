import React, { useState, useEffect, useMemo } from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { clusterApiUrl } from '@solana/web3.js';
import "./App.css";
import Dashboard from "./Dashboard";

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
        {/* ✅ Home page */}
        <Route
          path="/"
          element={
            <div>
              <header>
                <nav className="navbar">
                  <div className="logo">
                    <img
                      src="%PUBLIC_URL%/logoo.png"
                      alt="solsafe logo"
                      className="logo-img"
                    />
                  </div>

                  {/* Navigation Links */}
                  <ul className={`nav-links ${menuOpen ? "nav-active" : ""}`}> 
                    <li>
                      <a href="#home" onClick={() => setMenuOpen(false)}>
                        Home
                      </a>
                    </li>
                    <li>
                      <a href="#solsafe" onClick={() => setMenuOpen(false)}>
                        Why SOLSAFE
                      </a>
                    </li>
                    {/* ✅ React Router navigation to Dashboard */}
                    <li>
                      <Link to="/dashboard" onClick={() => setMenuOpen(false)}>
                        Dashboard
                      </Link>
                    </li>
                  </ul>

                  {/* Burger Button */}
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

              {/* Hero Section */}
              <section id="home" className="hero">
                <div className="hero-overlay"></div>
                <h1>SOLSAFE</h1>
                <p>
                  SolSafe is a decentralized, juror-based DeFi protocol built on
                  Solana to combat crypto scams like rug pulls, drainers, and
                  wallet hacks across blockchains.
                </p>
                <p>
                  By empowering the community to submit on-chain evidence, vote
                  on scam cases, and freeze illicit assets.
                </p>
                <Link to="/dashboard" className="cta-button">
                  Launch Dashboard
                </Link>
              </section>

              {/* Footer */}
              <footer>
                <p>© 2025 SOLSAFE. All rights reserved.</p>
                <p>
                  <a href="https://x.com/Solsafe_io">X</a> | <a href="https://t.me/">Telegram</a> | <a href="#whitepaper">Whitepaper</a>
                </p>
              </footer>
            </div>
          }
        />

        {/* ✅ Dashboard page */}
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
          </Router>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}

