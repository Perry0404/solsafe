import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import Dashboard from "./Dashboard";

export default function App() {
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const navbar = document.querySelector(".navbar");
      if (navbar) navbar.classList.toggle("scrolled", window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 768) {
        document.body.classList.add("mobile");
        document.body.classList.remove("tablet", "desktop");
      } else if (width >= 768 && width <= 1024) {
        document.body.classList.add("tablet");
        document.body.classList.remove("mobile", "desktop");
      } else {
        document.body.classList.add("desktop");
        document.body.classList.remove("mobile", "tablet");
      }
    };

    const fixIOSViewport = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty("--vh", `${vh}px`);
    };

    handleResize();
    fixIOSViewport();

    window.addEventListener("resize", handleResize);
    window.addEventListener("orientationchange", fixIOSViewport);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("orientationchange", fixIOSViewport);
    };
  }, []);

  return (
    <Router>
      <style>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }

        .navbar { display: flex; justify-content: space-between; align-items: center; padding: 20px 40px; transition: 0.3s; }
        .navbar.scrolled { background: #000; }

        .logo-img { width: 140px; }

        .nav-links { display: flex; list-style: none; gap: 25px; }
        .nav-links li a { color: #fff; text-decoration: none; font-size: 1rem; }

        .burger { display: none; flex-direction: column; gap: 5px; cursor: pointer; }
        .burger div { width: 30px; height: 3px; background: #fff; }

        .hero { height: calc(var(--vh, 1vh) * 100); background: url('hero.jpg'); background-size: cover; padding: 120px 40px; text-align: center; }
        .hero h1 { font-size: 3.5rem; color: #fff; }
        .hero p { margin-top: 10px; font-size: 1.2rem; color: #fff; }

        .cta-button { display: inline-block; padding: 14px 30px; margin-top: 25px; background: #9c27b0; color: #fff; border-radius: 50px; text-decoration: none; }

        .waitlist { padding: 80px 40px; text-align: center; color: #fff; }

        footer { text-align: center; padding: 20px; color: #fff; background: #000; }

        body.mobile .navbar { padding: 10px 20px; }
        body.mobile .nav-links { 
          position: absolute; 
          top: 70px; 
          right: 0; 
          flex-direction: column; 
          background: #000; 
          width: 70%; 
          padding: 20px; 
          display: none;
        }
        body.mobile .nav-active { display: flex; }

        body.mobile .burger { display: flex; }

        body.mobile .hero h1 { font-size: 2rem; }

        body.tablet .hero h1 { font-size: 2.4rem; }

        :root { height: calc(var(--vh, 1vh) * 100); }
      `}</style>

      <Routes>
        <Route
          path="/"
          element={
            <div>
              <header>
                <nav className="navbar">
                  <div className="logo">
                    <img src="logoo.png" alt="solsafe logo" className="logo-img" />
                  </div>

                  <ul className={`nav-links ${menuOpen ? "nav-active" : ""}`}>
                    <li><a href="#home" onClick={() => setMenuOpen(false)}>Home</a></li>
                    <li><a href="#solsafe" onClick={() => setMenuOpen(false)}>Why SOLSAFE</a></li>
                    <li><a href="#community" onClick={() => setMenuOpen(false)}>Community</a></li>
                    <li><a href="#waitlist" onClick={() => setMenuOpen(false)}>Waitlist</a></li>
                    <li><Link to="/dashboard" onClick={() => setMenuOpen(false)}>Dashboard</Link></li>
                  </ul>

                  <div className={`burger ${menuOpen ? "toggle" : ""}`} onClick={() => setMenuOpen(!menuOpen)}>
                    <div></div><div></div><div></div>
                  </div>
                </nav>
              </header>

              <section id="home" className="hero">
                <div className="hero-overlay"></div>
                <h1>SOLSAFE</h1>
                <p>SolSafe is a decentralized, juror-based DeFi protocol built on Solana.</p>
                <p>By empowering the community to submit evidence and freeze illicit assets.</p>
                <a href="#whitepaper" className="cta-button">Join the Waitlist</a>
              </section>

              <section id="whitepaper" className="waitlist" style={{ background: "#2e004d" }}>
                <h2>Join the Waitlist</h2>
                <p>Be the first to know when SOLSAFE launches.</p>
                <form
                  id="waitlist-form"
                  action="waitlist.php"
                  method="POST"
                  style={{ display: "flex", justifyContent: "center", gap: "10px", marginTop: "20px", flexWrap: "wrap" }}
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
                  <button type="submit" className="cta-button">Join Waitlist</button>
                </form>
              </section>

              <footer>
                <p>© 2025 SOLSAFE. All rights reserved.</p>
                <p>
                  <a href="https://x.com/Solsafe_io">X</a> | 
                  <a href="https://t.me/">Telegram</a> | 
                  <a href="#whitepaper">Whitepaper</a>
                </p>
              </footer>
            </div>
          }
        />

        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </Router>
  );
}
