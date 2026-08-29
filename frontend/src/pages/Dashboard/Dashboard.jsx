import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getCurrentUser, logoutUser } from '../../api/auth';

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  useEffect(() => { getCurrentUser().then(setUser).catch(() => {}).finally(() => setLoading(false)); }, []);
  const greeting = loading ? 'Preparing your workspace' : user?.name ? `Welcome back, ${user.name.split(' ')[0]}.` : 'Your preparation workspace.';
  return <div className="dashboard-page">
    <section className="ledger-card dashboard-hero">
      <div><p className="eyebrow">Interview preparation studio</p><h1 className="page-heading">{greeting}</h1><p className="page-lede">A focused route through your core CS preparation—structured for practice, reflection, and steady progress.</p><div className="hero-action"><Link className="btn btn-primary" to="/practice">Continue practice <span aria-hidden="true">→</span></Link><small>Practice flow is currently a static preview while the live module is connected.</small></div></div>
      <aside className="session-slip"><p className="eyebrow">Current route</p><strong>DBMS foundations</strong><p className="small">Start at the configuration step, then move through interview and evaluation.</p>{user && <button type="button" className="btn btn-outline" onClick={() => { logoutUser(); navigate('/'); }} style={{ marginTop: 16 }}>Sign out</button>}</aside>
    </section>
    <section className="dashboard-grid">
      <article className="ledger-card route-card"><div className="section-label"><div><p className="eyebrow">Preparation route</p><h2>Map the next session</h2></div><span className="status-tag status-preview">Preview</span></div><div className="route-list">
        <div className="route-item active"><span className="route-index">01</span><div><h3>Set a DBMS focus</h3><p>Choose the subject and interview track.</p></div><span className="status-tag status-active">Ready</span></div>
        <div className="route-item"><span className="route-index">02</span><div><h3>Respond to a generated prompt</h3><p>Questions will be grounded in retrieved material.</p></div><span className="status-tag status-preview">Soon</span></div>
        <div className="route-item"><span className="route-index">03</span><div><h3>Review the evaluation</h3><p>Structured rubric feedback will appear here.</p></div><span className="status-tag status-preview">Soon</span></div>
      </div></article>
      <aside className="ledger-card activity-card"><div className="section-label"><div><p className="eyebrow">Studio notes</p><h2>Workspace status</h2></div></div><div className="activity-line"><i className="activity-dot"/><div><strong>Core subject path</strong><span>DSA · OS · DBMS · CN · OOP</span></div></div><div className="activity-line"><i className="activity-dot"/><div><strong>Historical results</strong><span>Available after evaluated sessions</span></div></div><div className="activity-line"><i className="activity-dot"/><div><strong>Resume skill-gap</strong><span>Preview surface; analysis coming soon</span></div></div></aside>
    </section>
    <section className="action-row" aria-label="Next actions"><Link className="action-card" to="/practice"><span className="status-tag status-active">Practice</span><h3>Open mock interview</h3><p>Configure a staged practice session.</p></Link><Link className="action-card" to="/resume"><span className="status-tag status-preview">Preview</span><h3>Inspect resume match</h3><p>See the skill-gap analysis layout.</p></Link><Link className="action-card" to="/history"><span className="status-tag status-neutral">History</span><h3>Review progress</h3><p>Your score history will collect here.</p></Link></section>
  </div>;
}
