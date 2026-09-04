import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink, useLocation, useNavigate } from 'react-router-dom';
import Splash from './pages/Splash/Splash';
import Login from './pages/Login/Login';
import Signup from './pages/Signup/Signup';
import Dashboard from './pages/Dashboard/Dashboard';
import Practice from './pages/Practice/Practice';
import History from './pages/History/History';
import ResumeMatch from './pages/ResumeMatch/ResumeMatch';
import ProfileDrawer from './components/ProfileDrawer';
import { getCurrentUser } from './api/auth';

const mark = (
  <svg width="23" height="23" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <rect width="24" height="24" rx="5" fill="var(--blue, #2563eb)" />
    <path d="M7 17V7h4a4 4 0 0 1 0 8H9v2H7Z" fill="white" />
  </svg>
);

function NavigationLayout({ children }) {
  const { pathname } = useLocation();
  const [currentUser, setCurrentUser] = useState(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!['/', '/login', '/signup'].includes(pathname)) {
      loadUser();
    }
  }, [pathname]);

  const loadUser = async () => {
    try {
      const u = await getCurrentUser();
      setCurrentUser(u);
    } catch {
      // Unauthenticated or token expired
    }
  };

  if (['/', '/login', '/signup'].includes(pathname)) return children;

  return (
    <div className="app-container">
      <header className="navbar">
        <div className="navbar-brand">
          {mark}
          <span>Placement Prep</span>
          <span className="badge-studio">STUDIO / 01</span>
        </div>

        {/* Desktop & Mobile Navigation Links */}
        <nav aria-label="Primary navigation" className={`nav-wrapper ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
          <ul className="nav-links">
            <li>
              <NavLink to="/dashboard" onClick={() => setIsMobileMenuOpen(false)}>
                <span className="nav-wide">Dashboard</span>
                <span className="nav-compact">Home</span>
              </NavLink>
            </li>
            <li>
              <NavLink to="/practice" onClick={() => setIsMobileMenuOpen(false)}>
                Practice
              </NavLink>
            </li>
            <li>
              <NavLink to="/history" onClick={() => setIsMobileMenuOpen(false)}>
                History
              </NavLink>
            </li>
            <li>
              <NavLink to="/resume" onClick={() => setIsMobileMenuOpen(false)}>
                <span className="nav-wide">Resume Match</span>
                <span className="nav-compact">Resume</span>
              </NavLink>
            </li>
          </ul>
        </nav>

        {/* Right Header Actions (User Badge & Mobile Toggle) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            type="button"
            className="user-profile-badge"
            onClick={() => setIsProfileOpen(true)}
            title="View & Edit Profile"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: '#f8fafc',
              border: '1px solid #cbd5e1',
              borderRadius: '20px',
              padding: '4px 12px 4px 6px',
              cursor: 'pointer',
              fontSize: '.85rem',
              fontWeight: 600,
              color: '#334155',
            }}
          >
            <div
              style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                backgroundColor: '#2563eb',
                color: '#ffffff',
                fontSize: '.75rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <span>{currentUser?.name ? currentUser.name.split(' ')[0] : 'Profile'}</span>
          </button>

          {/* Mobile Hamburger Menu Button */}
          <button
            type="button"
            className="mobile-menu-toggle"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle navigation menu"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '6px',
              display: 'none', // Controlled via CSS media query
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>
        </div>
      </header>

      <main className="main-content">{children}</main>

      {/* User Profile Drawer */}
      <ProfileDrawer
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        onProfileUpdated={(updated) => setCurrentUser(updated)}
      />
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <NavigationLayout>
        <Routes>
          <Route path="/" element={<Splash />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/practice" element={<Practice />} />
          <Route path="/history" element={<History />} />
          <Route path="/resume" element={<ResumeMatch />} />
        </Routes>
      </NavigationLayout>
    </Router>
  );
}
