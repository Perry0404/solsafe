import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Whitepaper.css';

export default function Whitepaper() {
  useEffect(() => {
    // Scroll animations
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-in');
        }
      });
    }, observerOptions);

    document.querySelectorAll('.section').forEach(section => {
      observer.observe(section);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div className="whitepaper-wrapper">
      <div className="whitepaper-container">
        <nav className="whitepaper-nav">
          <Link to="/" className="back-btn">← Back to Home</Link>
        </nav>

        <h1 className="whitepaper-title">SolSafe Protocol</h1>
        <p className="subtitle">Decentralized Justice with Zero-Knowledge Privacy</p>
        <p className="version">Version 1.0 | January 2026</p>

        <section className="section">
          <h2>Executive Summary</h2>
          <p>
            SolSafe is a revolutionary decentralized justice protocol built on Solana, leveraging cutting-edge zero-knowledge cryptography to provide transparent, private, and fair dispute resolution. Our protocol combines Groth16 ZK-SNARKs, multi-party computation (MPC), confidential transfers, and verifiable randomness to create a trustless justice system.
          </p>
          <div className="highlight-box">
            <p><strong>Smart Contract Address:</strong> <code>FfV3AHU6WS7aPz53DnVvWBMEZR46ydGkEtKpLiKfRTrR</code></p>
            <p><strong>Network:</strong> Solana Devnet (Mainnet Coming Soon)</p>
          </div>
        </section>

        <section className="section">
          <h2>The Problem</h2>
          <p>Traditional justice systems and centralized dispute resolution platforms face critical challenges:</p>
          <ul>
            <li><strong>Centralization Risk:</strong> Single points of failure create bias and vulnerability to manipulation</li>
            <li><strong>Privacy Violations:</strong> Sensitive case details and votes are exposed, compromising whistleblowers and jurors</li>
            <li><strong>High Costs:</strong> Legal fees and arbitration costs make justice inaccessible to many</li>
            <li><strong>Lack of Transparency:</strong> Closed proceedings prevent public oversight and accountability</li>
            <li><strong>Geographic Limitations:</strong> Cross-border disputes require expensive international arbitration</li>
            <li><strong>Slow Resolution:</strong> Court backlogs lead to justice delayed being justice denied</li>
          </ul>
        </section>

        <section className="section">
          <h2>Our Solution</h2>
          <p>SolSafe addresses these challenges through a comprehensive technical stack:</p>
          
          <div className="solution-grid">
            <div className="solution-item">
              <h3>🗳️ Private Voting with ZK-SNARKs</h3>
              <p><strong>Technology:</strong> Groth16 proofs on BN254 curve</p>
              <p><strong>Circuit:</strong> 481 constraints, Circom 2.1.6</p>
              <p><strong>Proof Size:</strong> 192 bytes</p>
              <p>Jurors cast votes privately using zero-knowledge proofs that prove vote validity without revealing the vote choice. This protects jurors from retaliation while ensuring votes are legitimate.</p>
            </div>

            <div className="solution-item">
              <h3>🔒 MPC Evidence Protection</h3>
              <p><strong>Technology:</strong> Arcium MPC, Threshold Encryption</p>
              <p><strong>Threshold:</strong> 2/3 consensus required</p>
              <p>Sensitive evidence is encrypted and split across multiple parties using threshold encryption. Evidence can only be decrypted when the threshold of jurors agree, preventing single-party data breaches.</p>
            </div>

            <div className="solution-item">
              <h3>💸 Confidential Transfers</h3>
              <p><strong>Technology:</strong> Dust Protocol, Light Protocol</p>
              <p><strong>Privacy:</strong> Amount hiding with range proofs</p>
              <p>Case deposits and payouts use confidential transfers that hide transaction amounts while maintaining regulatory compliance through range proofs.</p>
            </div>

            <div className="solution-item">
              <h3>🎲 Verifiable Random Selection</h3>
              <p><strong>Technology:</strong> Switchboard VRF</p>
              <p><strong>Randomness:</strong> On-chain verifiable</p>
              <p>Jurors are selected randomly from a pool of validators using Switchboard's verifiable random function, ensuring unbiased and tamper-proof selection.</p>
            </div>
          </div>
        </section>

        <section className="section">
          <h2>Technical Architecture</h2>
          
          <h3>Smart Contract Stack</h3>
          <div className="tech-stack">
            <div className="stack-item">
              <strong>Platform:</strong> Solana (High-speed, low-cost blockchain)
            </div>
            <div className="stack-item">
              <strong>Framework:</strong> Anchor 0.30.1 (Solana's smart contract framework)
            </div>
            <div className="stack-item">
              <strong>Language:</strong> Rust (Memory-safe, high-performance)
            </div>
            <div className="stack-item">
              <strong>Program ID:</strong> FfV3AHU6WS7aPz53DnVvWBMEZR46ydGkEtKpLiKfRTrR
            </div>
          </div>

          <h3>Zero-Knowledge Proofs</h3>
          <div className="tech-stack">
            <div className="stack-item">
              <strong>Proving System:</strong> Groth16 (Most efficient ZK-SNARK)
            </div>
            <div className="stack-item">
              <strong>Elliptic Curve:</strong> BN254 (128-bit security)
            </div>
            <div className="stack-item">
              <strong>Circuit Compiler:</strong> Circom 2.1.6
            </div>
            <div className="stack-item">
              <strong>Verification Library:</strong> arkworks-rs (On-chain verification)
            </div>
            <div className="stack-item">
              <strong>Proof Generation:</strong> Client-side (Browser-based)
            </div>
          </div>

          <h3>Frontend Stack</h3>
          <div className="tech-stack">
            <div className="stack-item">
              <strong>Framework:</strong> React 18
            </div>
            <div className="stack-item">
              <strong>Wallet:</strong> Solana Wallet Adapter (Phantom, Solflare)
            </div>
            <div className="stack-item">
              <strong>RPC:</strong> Devnet via rpcpool.com
            </div>
            <div className="stack-item">
              <strong>ZK Library:</strong> snarkjs, circomlibjs
            </div>
          </div>
        </section>

        <section className="section">
          <h2>Tokenomics</h2>
          <p>The SOLSAFE token powers the protocol's governance and incentive mechanisms:</p>
          
          <div className="tokenomics-grid">
            <div className="token-item">
              <div className="percentage">40%</div>
              <div className="label">Community</div>
              <div className="description">Rewards for jurors, validators, and active participants</div>
            </div>

            <div className="token-item">
              <div className="percentage">30%</div>
              <div className="label">Treasury</div>
              <div className="description">Protocol development and security audits</div>
            </div>

            <div className="token-item">
              <div className="percentage">10%</div>
              <div className="label">Investors</div>
              <div className="description">Early supporters with 4-year vesting</div>
            </div>

            <div className="token-item">
              <div className="percentage">10%</div>
              <div className="label">Team</div>
              <div className="description">Core contributors with 4-year vesting</div>
            </div>

            <div className="token-item">
              <div className="percentage">7%</div>
              <div className="label">Marketing</div>
              <div className="description">Ecosystem growth and partnerships</div>
            </div>

            <div className="token-item">
              <div className="percentage">3%</div>
              <div className="label">Contributors</div>
              <div className="description">Bug bounties and open-source developers</div>
            </div>
          </div>

          <h3>Utility & Incentives</h3>
          <ul>
            <li><strong>Case Deposits:</strong> Required to submit disputes (anti-spam)</li>
            <li><strong>Juror Staking:</strong> Validators stake tokens to participate in jury selection</li>
            <li><strong>Vote Rewards:</strong> Jurors earn tokens for accurate verdicts</li>
            <li><strong>Governance:</strong> Token holders vote on protocol upgrades</li>
            <li><strong>Fee Reduction:</strong> Stakers receive discounted platform fees</li>
          </ul>
        </section>

        <section className="section">
          <h2>Security & Audits</h2>
          <div className="security-checklist">
            <div className="security-item">
              <span className="status completed">✅</span>
              <div>
                <strong>ZK Circuit Verification:</strong> 481 constraints verified with 2+ trusted setup contributions
              </div>
            </div>
            <div className="security-item">
              <span className="status completed">✅</span>
              <div>
                <strong>Proof System:</strong> Groth16 with 192-byte proofs, 128-bit security level
              </div>
            </div>
            <div className="security-item">
              <span className="status completed">✅</span>
              <div>
                <strong>On-chain Verification:</strong> arkworks BN254 pairing verification
              </div>
            </div>
            <div className="security-item">
              <span className="status pending">🔜</span>
              <div>
                <strong>Smart Contract Audit:</strong> Third-party security audit scheduled
              </div>
            </div>
            <div className="security-item">
              <span className="status pending">🔜</span>
              <div>
                <strong>Bug Bounty Program:</strong> Up to $50,000 for critical vulnerabilities
              </div>
            </div>
          </div>
        </section>

        <section className="section">
          <h2>Roadmap</h2>
          <div className="roadmap">
            <div className="roadmap-phase">
              <h3>Q1 2026 - Foundation (Current)</h3>
              <ul>
                <li>✅ Smart contract deployment on Devnet</li>
                <li>✅ ZK circuit implementation (481 constraints)</li>
                <li>✅ Frontend dashboard with wallet integration</li>
                <li>🔄 Community testing and feedback</li>
              </ul>
            </div>

            <div className="roadmap-phase">
              <h3>Q2 2026 - Security & Mainnet</h3>
              <ul>
                <li>Security audit completion</li>
                <li>Mainnet deployment</li>
                <li>Token generation event (TGE)</li>
                <li>Initial DEX listing</li>
              </ul>
            </div>

            <div className="roadmap-phase">
              <h3>Q3 2026 - Ecosystem Growth</h3>
              <ul>
                <li>Mobile app launch (iOS/Android)</li>
                <li>Partnership with DAOs for governance arbitration</li>
                <li>Integration with major DeFi protocols</li>
                <li>Multi-language support</li>
              </ul>
            </div>

            <div className="roadmap-phase">
              <h3>Q4 2026 - Advanced Features</h3>
              <ul>
                <li>Cross-chain bridge (Ethereum, BSC)</li>
                <li>AI-powered case categorization</li>
                <li>Appeals system with super-jurors</li>
                <li>Enterprise API for businesses</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="section">
          <h2>Use Cases</h2>
          <div className="use-cases">
            <div className="use-case">
              <h3>🏛️ DAO Governance Disputes</h3>
              <p>Resolve conflicts in decentralized autonomous organizations with private voting and transparent outcomes.</p>
            </div>

            <div className="use-case">
              <h3>💼 Freelancer Arbitration</h3>
              <p>Settle payment disputes between clients and contractors with escrow protection and fair jury decisions.</p>
            </div>

            <div className="use-case">
              <h3>🔐 Whistleblower Protection</h3>
              <p>Enable anonymous reporting of misconduct with ZK proofs protecting reporter identity while proving claims.</p>
            </div>

            <div className="use-case">
              <h3>🤝 Smart Contract Disputes</h3>
              <p>Resolve DeFi protocol disagreements, NFT authenticity claims, and token distribution conflicts.</p>
            </div>

            <div className="use-case">
              <h3>🌐 International Trade</h3>
              <p>Facilitate cross-border commerce with neutral, cost-effective dispute resolution.</p>
            </div>

            <div className="use-case">
              <h3>📱 Content Moderation</h3>
              <p>Decentralized appeals for platform bans with community-driven verdicts.</p>
            </div>
          </div>
        </section>

        <section className="section">
          <h2>Team & Advisors</h2>
          <p>SolSafe is built by a team of blockchain engineers, cryptographers, and legal tech experts committed to democratizing access to justice.</p>
          <div className="team-note">
            <p>🔒 <strong>Anonymity by Design:</strong> Core team identities protected until mainnet launch for security reasons.</p>
          </div>
        </section>

        <section className="section contact-section">
          <h2>Get Involved</h2>
          <p>Join our community and help build the future of decentralized justice:</p>
          <div className="contact-links">
            <a href="https://github.com/Perry0404/solsafe" target="_blank" rel="noopener noreferrer" className="contact-btn">
              📚 GitHub - View Code
            </a>
            <a href="https://twitter.com/solsafe" target="_blank" rel="noopener noreferrer" className="contact-btn">
              🐦 Twitter - Latest Updates
            </a>
            <a href="https://discord.gg/solsafe" target="_blank" rel="noopener noreferrer" className="contact-btn">
              💬 Discord - Join Community
            </a>
            <Link to="/docs" className="contact-btn">
              📖 Documentation - Developer Guides
            </Link>
          </div>
        </section>

        <footer className="whitepaper-footer">
          <p>© 2026 SolSafe Protocol | Building Fair, Private, and Accessible Justice</p>
          <p className="disclaimer">This whitepaper is for informational purposes only and does not constitute financial advice.</p>
        </footer>
      </div>
    </div>
  );
}
