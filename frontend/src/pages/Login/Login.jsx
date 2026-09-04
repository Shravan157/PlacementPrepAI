import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { loginUser } from '../../api/auth';

export default function Login() {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            await loginUser({ email, password });
            navigate('/dashboard');
        } catch (err) {
            if (err.response && err.response.data && err.response.data.detail) {
                setError(err.response.data.detail);
            } else {
                setError('Login failed. Please check your credentials.');
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
                    <h1>The evaluation engine behind placements that actually fit.</h1>
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
                    <h2>Welcome Back</h2>
                    <p className="subtitle">New to the platform? <Link to="/signup">Create an account</Link></p>

                    <form onSubmit={handleLogin}>
                        <div className="form-group">
                            <label htmlFor="login-email">Email Address</label>
                            <input
                                id="login-email"
                                type="email"
                                className="form-input"
                                placeholder="student@university.edu"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="login-password">Password</label>
                            <div className="password-input-wrapper" style={{ position: 'relative' }}>
                                <input
                                    id="login-password"
                                    type={showPassword ? 'text' : 'password'}
                                    className="form-input"
                                    placeholder="Enter your password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    style={{ paddingRight: '40px' }}
                                    required
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
                                        /* Eye Off Icon */
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                                            <line x1="1" y1="1" x2="23" y2="23"></line>
                                        </svg>
                                    ) : (
                                        /* Eye Icon */
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                            <circle cx="12" cy="12" r="3"></circle>
                                        </svg>
                                    )}
                                </button>
                            </div>
                        </div>

                        {error && <div className="input-error mb-4" style={{ color: '#dc2626', fontSize: '.85rem', marginTop: '6px' }}>{error}</div>}

                        <button type="submit" className="btn btn-primary mt-4" disabled={loading} style={{ width: '100%', marginTop: '16px' }}>
                            {loading ? 'Authenticating...' : 'Sign in →'}
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
