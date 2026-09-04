import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { registerUser } from '../../api/auth';

export default function Signup() {
    const navigate = useNavigate();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleSignup = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            await registerUser({ email, password, name });
            navigate('/login');
        } catch (err) {
            if (err.response && err.response.data && err.response.data.detail) {
                setError(err.response.data.detail);
            } else {
                setError('Signup failed. Please try a different email or check requirements.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-layout">
            <div className="auth-left">
                <div className="auth-brand">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect width="24" height="24" rx="4" fill="var(--accent-primary)" />
                        <path d="M7 17V7h4a4 4 0 0 1 0 8H9v2H7z" fill="white" />
                    </svg>
                    PlacementAI
                </div>

                <div className="auth-hero-text">
                    <h1>Join the next-generation preparation system.</h1>
                    <p>
                        Placement Prep AI uses a Reflective RAG pipeline — retrieving context and checking groundedness — to conduct rigorous mock interviews and identify resume gaps.
                    </p>

                    <div className="auth-stats">
                        <div className="auth-stat-item">
                            <h4>PostgreSQL + FastAPI</h4>
                            <p>Normalized enterprise backend</p>
                        </div>
                        <div className="auth-stat-item">
                            <h4>5 Core Subjects</h4>
                            <p>DSA, OS, DBMS, CN, OOP</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="auth-right">
                <div className="auth-form-container">
                    <h2>Create Account</h2>
                    <p className="subtitle">Already have an account? <Link to="/login">Sign in</Link></p>

                    <form onSubmit={handleSignup}>
                        <div className="form-group">
                            <label htmlFor="signup-name">Full Name</label>
                            <input
                                id="signup-name"
                                type="text"
                                className="form-input"
                                placeholder="Ada Lovelace"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="signup-email">Email Address</label>
                            <input
                                id="signup-email"
                                type="email"
                                className="form-input"
                                placeholder="student@university.edu"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="signup-password">Password</label>
                            <div className="password-input-wrapper" style={{ position: 'relative' }}>
                                <input
                                    id="signup-password"
                                    type={showPassword ? 'text' : 'password'}
                                    className="form-input"
                                    placeholder="At least 8 characters"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    style={{ paddingRight: '40px' }}
                                    required
                                    minLength={8}
                                />
                                <button
                                    type="button"
                                    className="password-toggle-btn"
                                    onClick={() => setShowPassword(!showPassword)}
                                    title={showPassword ? 'Hide password' : 'Show password'}
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                    style={{
                                        position: 'absolute',
                                        right: '10px',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        background: 'none',
                                        border: 'none',
                                        cursor: 'pointer',
                                        color: '#6b7280',
                                        display: 'flex',
                                        alignItems: 'center',
                                        padding: '4px',
                                    }}
                                >
                                    {showPassword ? (
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                                            <line x1="1" y1="1" x2="23" y2="23"></line>
                                        </svg>
                                    ) : (
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                            <circle cx="12" cy="12" r="3"></circle>
                                        </svg>
                                    )}
                                </button>
                            </div>
                            <div style={{ fontSize: '.75rem', color: password.length >= 8 ? '#16a34a' : '#6b7280', marginTop: '4px' }}>
                                {password ? (password.length >= 8 ? '✓ Minimum 8 characters met' : `Need ${8 - password.length} more characters`) : 'Must be at least 8 characters long'}
                            </div>
                        </div>

                        {error && <div className="input-error mb-4" style={{ color: '#dc2626', fontSize: '.85rem', marginTop: '6px' }}>{error}</div>}

                        <button type="submit" className="btn btn-primary mt-4" disabled={loading || password.length < 8} style={{ width: '100%', marginTop: '16px' }}>
                            {loading ? 'Registering...' : 'Sign up →'}
                        </button>
                    </form>

                    <div style={{ marginTop: '3rem', fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                        Protected by secure JWT authentication · Phase 1 Build
                    </div>
                </div>
            </div>
        </div>
    );
}
