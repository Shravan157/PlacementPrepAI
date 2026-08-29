import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function Splash() {
    const navigate = useNavigate();

    return (
        <div className="splash-container">
            <h1 className="splash-title">Placement Prep AI</h1>
            <p className="splash-subtitle">
                The matching engine behind careers that actually fit. A structured RAG-based mock interview and resume evaluation system designed for Indian campus placements.
            </p>

            <div className="splash-grid">
                <div className="splash-card">
                    <h3>Reflective RAG Pipeline</h3>
                    <p>Advanced implementation using retrieval, relevance filtering, and groundedness checking to ensure rigorous and accurate mock interviews.</p>
                </div>
                <div className="splash-card">
                    <h3>5 Core CS Subjects</h3>
                    <p>Comprehensive coverage of Data Structures & Algorithms, Operating Systems, Database Management Systems, Computer Networks, and OOP.</p>
                </div>
                <div className="splash-card">
                    <h3>Academic Ledger Focus</h3>
                    <p>No chat bubbles or generic AI wrapping. A structured evaluation system with normalized databases recording questions, answers, and evaluations.</p>
                </div>
            </div>

            <div className="splash-actions">
                <button className="btn btn-primary btn-large" onClick={() => navigate('/login')}>
                    Sign In
                </button>
                <button className="btn btn-outline btn-large" onClick={() => navigate('/signup')}>
                    Create Account
                </button>
            </div>
        </div>
    );
}
