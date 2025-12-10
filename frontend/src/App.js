import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import "./App.css"; // keep your existing CSS file (we'll rely on inline + App.css)
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


// Close mobile menu on route change (basic safeguard)
useEffect(() => {
const closeOnNavigate = () => setMenuOpen(false);
window.addEventListener("popstate", closeOnNavigate);
return () => window.removeEventListener("popstate", closeOnNavigate);
}, []);


return (
<Router>
<Routes>
<Route
path="/"
element={
<div className="page-root">
<header>
<nav className="navbar">
<div className="nav-left">
<div className="logo">
<img src="/logoo.png" alt="solsafe logo" className="logo-img" />
</div>
<button
className={`burger ${menuOpen ? "toggle" : ""}`}
onClick={() => setMenuOpen(!menuOpen)}
aria-label="Toggle menu"
>
<div />
<div />
<div />
</button>
</div>


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
<li>
<Link to="/dashboard" onClick={() => setMenuOpen(false)}>
Dashboard
</Link>
</li>
</ul>
</nav>
</header>


<main>
{/* Hero Section */}
<section id="home" className="hero">
<div className="hero-overlay" />
<h1>SOLSAFE</h1>
}
