import React from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink, useLocation } from 'react-router-dom';
import Splash from './pages/Splash/Splash';
import Login from './pages/Login/Login';
import Signup from './pages/Signup/Signup';
import Dashboard from './pages/Dashboard/Dashboard';
import Practice from './pages/Practice/Practice';
import History from './pages/History/History';
import ResumeMatch from './pages/ResumeMatch/ResumeMatch';

const mark = <svg width="23" height="23" viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect width="24" height="24" rx="5" fill="var(--blue)"/><path d="M7 17V7h4a4 4 0 0 1 0 8H9v2H7Z" fill="white"/></svg>;
function NavigationLayout({ children }) {
  const { pathname } = useLocation();
  if (['/', '/login', '/signup'].includes(pathname)) return children;
  return <div className="app-container"><header className="navbar"><div className="navbar-brand">{mark}<span>Placement Prep</span><span>STUDIO / 01</span></div><nav aria-label="Primary navigation"><ul className="nav-links"><li><NavLink to="/dashboard"><span className="nav-wide">Dashboard</span><span className="nav-compact">Home</span></NavLink></li><li><NavLink to="/practice">Practice</NavLink></li><li><NavLink to="/history">History</NavLink></li><li><NavLink to="/resume"><span className="nav-wide">Resume Match</span><span className="nav-compact">Resume</span></NavLink></li></ul></nav></header><main className="main-content">{children}</main></div>;
}
export default function App() { return <Router><NavigationLayout><Routes><Route path="/" element={<Splash />} /><Route path="/login" element={<Login />} /><Route path="/signup" element={<Signup />} /><Route path="/dashboard" element={<Dashboard />} /><Route path="/practice" element={<Practice />} /><Route path="/history" element={<History />} /><Route path="/resume" element={<ResumeMatch />} /></Routes></NavigationLayout></Router>; }
