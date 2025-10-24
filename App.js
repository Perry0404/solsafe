import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import "./App.css";
import Dashboard from "./Dashboard";

export default function App() {
  const [menuOpen, setMenuOpen] = useState(false);

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
                      src="logoo.png"
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
                    <li>
                      <a href="#community" onClick={() => setMenuOpen(false)}>
                        Community
                      </a>
                    </li>
                    <li>
                      <a href="#waitlist" onClick={() => setMenuOpen(false)}>
                        Waitlist
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
                <a href="#whitepaper" className="cta-button">
                  Join the Waitlist
                </a>
              </section>

              {/* Waitlist Section */}
              <section
                id="whitepaper"
                className="waitlist"
                style={{ background: "#2e004d" }}
              >
                <h2>Join the Waitlist</h2>
                <p>
                  Be the first to know when SOLSAFE launches. Enter your email
                  below — no spam, ever.
                </p>
                <form
                  id="waitlist-form"
                  action="waitlist.php"
                  method="POST"
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    gap: "10px",
                    marginTop: "20px",
                    flexWrap: "wrap",
                  }}
                >
                  <input
                    type="email"
                    name="email"
                    placeholder="you@domain.com"
                    required
                    style={{
                      flex: "1 1 320px",
                      padding: "14px 18px",
                      borderRadius: "50px",
                      border: "1px solid rgba(255,255,255,0.12)",
                      background: "rgba(255,255,255,0.03)",
                      color: "#fff",
                      outline: "none",
                      fontSize: "1rem",
                    }}
                  />
                  <button type="submit" className="cta-button">
                    Join Waitlist
                  </button>
                </form>
              </section>

              {/* Footer */}
              <footer>
                <p>© 2025 SOLSAFE. All rights reserved.</p>
                <p>
                  <a href="https://x.com/Solsafe_io">X</a> |{" "}
                  <a href="https://t.me/">Telegram</a> |{" "}
                  <a href="#whitepaper">Whitepaper</a>
                </p>
              </footer>
            </div>
          }
        />

        {/* ✅ Dashboard page */}
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </Router>
  );
}
