import React from 'react';

export default function ResumeMatch() {
  return (
    <div className="resume-match-page">
      <div className="ledger-card">
        <h2 className="ledger-card-title">Resume & JD Skill-Gap Analysis</h2>
        <p className="text-muted" style={{ fontSize: '0.9rem', marginBottom: '1rem' }}>
          Extracts explicit skill requirements from Job Descriptions and matches against resume skills.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginTop: '1rem' }}>
          <div>
            <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>Upload Resume (PDF/TXT)</h3>
            <input type="file" style={{ color: 'var(--text-secondary)' }} />
          </div>

          <div>
            <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>Target Job Description (JD)</h3>
            <textarea
              placeholder="Paste Job Description requirements here..."
              rows="5"
              style={{
                width: '100%',
                background: 'var(--bg-surface-hover)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-color)',
                padding: '0.5rem',
                borderRadius: 'var(--radius-sm)',
              }}
            />
          </div>
        </div>

        <div style={{ marginTop: '1rem' }}>
          <button className="btn btn-primary">Run Skill-Gap Match</button>
        </div>
      </div>
    </div>
  );
}
