import React from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import Dashboard from './pages/Dashboard/Dashboard';
import Practice from './pages/Practice/Practice';
import History from './pages/History/History';
import ResumeMatch from './pages/ResumeMatch/ResumeMatch';

export default function App() {
  return (
    <Router>
      <div className="app-container">
        <header className="navbar">
          <div className="navbar-brand">
            Placement Prep AI <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 400 }}>v0.1</span>
          </div>
          <nav>
            <ul className="nav-links">
              <li>
                <NavLink to="/" end className={({ isActive }) => (isActive ? 'active' : '')}>
                  Dashboard
                </NavLink>
              </li>
              <li>
                <NavLink to="/practice" className={({ isActive }) => (isActive ? 'active' : '')}>
                  Practice
                </NavLink>
              </li>
              <li>
                <NavLink to="/history" className={({ isActive }) => (isActive ? 'active' : '')}>
                  History
                </NavLink>
              </li>
              <li>
                <NavLink to="/resume" className={({ isActive }) => (isActive ? 'active' : '')}>
                  Resume Match
                </NavLink>
              </li>
            </ul>
          </nav>
        </header>

        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/practice" element={<Practice />} />
            <Route path="/history" element={<History />} />
            <Route path="/resume" element={<ResumeMatch />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}
