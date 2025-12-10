import React, { useEffect, useState } from 'react';


<div style={{ display: 'flex', gap: 10, marginTop: 12, flexWrap: 'wrap' }}>
<button className="cta-button" onClick={() => selectedCaseId && handleVote(parseInt(selectedCaseId), true)} disabled={!selectedCaseId}>✅ Vote Approve</button>
<button className="cta-button" style={{ backgroundColor: '#dc3545' }} onClick={() => selectedCaseId && handleVote(parseInt(selectedCaseId), false)} disabled={!selectedCaseId}>❌ Vote Reject</button>
</div>
</div>
)}
</div>
</div>
</section>
</main>


<footer style={{ textAlign: 'center', padding: '28px 20px', marginTop: 40 }}>
<p>© 2025 SolSafe. Powered by Solana & Switchboard VRF.</p>
</footer>


{/* Responsive styles included to keep component self-contained + preserve original look on desktop */}
<style>{`
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap');
* { box-sizing: border-box; }
.responsive-container { padding: 0; }
.app-root { background: linear-gradient(135deg, #1c0030, #4b0082, #9932cc); color: #fff; min-height: 100vh; font-family: 'Poppins', sans-serif; }
.navbar { display:flex; justify-content:space-between; align-items:center; padding:14px 20px; background: rgba(28,0,48,0.85); position:sticky; top:0; z-index:100; }
.logo-img { height:44px; }
.hero { padding:32px 18px; text-align:center; }
.hero h1 { font-size:2.25rem; margin-bottom:6px; }
.dashboard-shell { display:flex; gap:18px; padding:18px; max-width:1400px; margin:0 auto; }
.sidebar { width:240px; background: rgba(0,0,0,0.2); padding:12px; border-radius:10px; }
.nav-button { display:block; width:100%; padding:12px 14px; margin-bottom:10px; border-radius:8px; font-weight:600; background: rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); color:#fff; text-align:left; }
.nav-button.active { background:#8a2be2; border-color:#8a2be2; }
.nav-button:disabled { opacity:0.45; cursor:not-allowed; }
.content { flex:1; background: rgba(0,0,0,0.12); padding:20px; border-radius:10px; min-height:420px; }
.notice { background: rgba(255,193,7,0.12); border:1px solid rgba(255,193,7,0.35); padding:12px; border-radius:8px; }
.case-form { max-width:640px; }
.form-group { margin-bottom:14px; }
input[type='text'], input[type='number'] { width:100%; padding:10px 12px; border-radius:8px; border:1px solid rgba(255,255,255,0.16); background: rgba(0,0,0,0.25); color:#fff; }
.cases-list { display:grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap:12px; }
.case-card { background: rgba(0,0,0,0.3); border:1px solid rgba(255,255,255,0.06); padding:12px; border-radius:8px; }
.error-message { background: rgba(220,53,69,0.12); border:1px solid rgba(220,53,69,0.3); padding:10px; border-radius:8px; color:#ff8a8a; }
.success-message { background: rgba(40,167,69,0.12); border:1px solid rgba(40,167,69,0.25); padding:10px; border-radius:8px; color:#9ff0b2; }
.cta-button { padding:10px 18px; background:#8a2be2; color:#fff; border:none; border-radius:8px; font-weight:600; cursor:pointer; }


/* Responsive rules */
@media (max-width: 1000px) {
.dashboard-shell { flex-direction:column; padding:12px; }
.sidebar { width:100%; display:flex; gap:8px; overflow-x:auto; padding:10px; }
.nav-button { flex:0 0 auto; min-width:140px; }
.content { width:100%; }
}


@media (max-width: 520px) {
.hero h1 { font-size:1.6rem; }
.navbar { padding:10px 12px; }
.logo-img { height:36px; }
.case-card p, .case-card h3 { font-size:0.9rem; }
.cta-button { width:100%; }
}


@media (orientation: landscape) and (max-height: 500px) {
.dashboard-shell { gap:10px; }
.sidebar { padding:8px; }
.content { padding:12px; }
}
`}</style>
</div>
);
}
