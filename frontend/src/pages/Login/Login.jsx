import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { loginUser } from '../../api/auth';

export default function Login() {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            await loginUser({ email, password });
            navigate('/dashboard'); // Changed default redirect to dashboard
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
                            <label>Email Address</label>
                            <input
                                type="email"
                                className="form-input"
                                placeholder="student@university.edu"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Password</label>
                            <input
                                type="password"
                                className="form-input"
                                placeholder="Enter your password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>

                        {error && <div className="input-error mb-4">{error}</div>}

                        <button type="submit" className="btn btn-primary mt-4" disabled={loading}>
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
