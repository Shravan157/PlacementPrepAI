import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { registerUser } from '../../api/auth';

export default function Signup() {
    const navigate = useNavigate();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
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
                            <label>Full Name</label>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="Ada Lovelace"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                            />
                        </div>

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
                                placeholder="At least 8 characters"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                minLength={8}
                            />
                        </div>

                        {error && <div className="input-error mb-4">{error}</div>}

                        <button type="submit" className="btn btn-primary mt-4" disabled={loading}>
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
