import React from "react";
import { Link } from "react-router-dom";
import "./Whitepaper.css";

export default function Whitepaper() {
  return (
    <div className="whitepaper-wrapper">
      <div className="whitepaper-container">
        <nav className="whitepaper-nav">
          <Link to="/" className="back-btn">← Back to Home</Link>
        </nav>

        <h1 className="whitepaper-title">SolSafe Whitepaper</h1>
        <p className="subtitle">Decentralized Justice with Zero-Knowledge Privacy</p>

        <section className="section">
          <h2>Abstract</h2>
          <p>
            SolSafe is a decentralized justice protocol on Solana with zero-knowledge cryptography. 
            Using Groth16 ZK-SNARKs, MPC, and confidential transfers, we enable private jury voting, 
            secure evidence handling, and anonymous case resolution.
          </p>
        </section>

        <section className="section">
          <h2>The Problem</h2>
          <ul>
            <li>Centralized courts create bias and single points of failure</li>
            <li>Privacy violations expose sensitive case details</li>
            <li>High costs make justice inaccessible</li>
            <li>Limited transparency in proceedings</li>
          </ul>
        </section>

        <section className="section">
          <h2>Our Solution</h2>
          
          <div className="solution-grid">
            <div className="solution-item">
              <h3>🗳️ Private Voting</h3>
              <p>ZK-SNARKs with 481-constraint circuits prove vote validity without revealing choices</p>
            </div>

            <div className="solution-item">
              <h3>🔒 MPC Evidence</h3>
              <p>Threshold encryption splits sensitive evidence across multiple parties</p>
            </div>

            <div className="solution-item">
              <h3>💸 Confidential Transfers</h3>
              <p>Dust Protocol hides transaction amounts while maintaining auditability</p>
            </div>

            <div className="solution-item">
              <h3>🎲 Random Selection</h3>
              <p>Switchboard VRF ensures unbiased, anonymous juror selection</p>
            </div>
          </div>
        </section>

        <section className="section">
          <h2>Tokenomics</h2>
          
          <div className="tokenomics-grid">
            <div className="token-item">
              <div className="percentage">40%</div>
              <div className="label">Community</div>
            </div>

            <div className="token-item">
              <div className="percentage">30%</div>
              <div className="label">Treasury</div>
            </div>

            <div className="token-item">
              <div className="percentage">10%</div>
              <div className="label">Investors</div>
            </div>

            <div className="token-item">
              <div className="percentage">10%</div>
              <div className="label">Team</div>
            </div>

            <div className="token-item">
              <div className="percentage">7%</div>
              <div className="label">Marketing</div>
            </div>

            <div className="token-item">
              <div className="percentage">3%</div>
              <div className="label">Contributors</div>
            </div>
          </div>
        </section>

        <section className="section">
          <h2>Technology</h2>
          <div className="tech-grid">
            <div className="tech-item">
              <strong>Smart Contracts:</strong> Anchor 0.30.1, Rust
            </div>
            <div className="tech-item">
              <strong>ZK Proofs:</strong> Circom 2.1.6, Groth16
            </div>
            <div className="tech-item">
              <strong>Verification:</strong> arkworks (BN254)
            </div>
            <div className="tech-item">
              <strong>Frontend:</strong> React 18, Wallet Adapter
            </div>
          </div>
        </section>

        <section className="section">
          <h2>Security</h2>
          <ul>
            <li>✅ Trusted setup with 2+ contributions</li>
            <li>✅ 481 verified circuit constraints</li>
            <li>✅ 192-byte proofs, 128-bit security</li>
            <li>🔜 Smart contract audits planned</li>
          </ul>
        </section>

        <section className="section contact-section">
          <h2>Get Involved</h2>
          <div className="contact-links">
            <a href="https://github.com/Perry0404/solsafe" target="_blank" rel="noopener noreferrer" className="contact-btn">
              GitHub
            </a>
            <a href="https://twitter.com/Solsafe_io" target="_blank" rel="noopener noreferrer" className="contact-btn">
              X (Twitter)
            </a>
            <a href="mailto:perrypaschal0404@gmail.com" className="contact-btn">
              Email Us
            </a>
          </div>
        </section>

        <footer className="whitepaper-footer">
          <p>© 2026 SolSafe Protocol</p>
        </footer>
      </div>
    </div>
  );
}
