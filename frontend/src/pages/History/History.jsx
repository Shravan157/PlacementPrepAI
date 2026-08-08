import React from 'react';

export default function History() {
  return (
    <div className="history-page">
      <div className="ledger-card">
        <h2 className="ledger-card-title">Performance History & Evaluation Log</h2>
        <p className="text-muted" style={{ fontSize: '0.9rem', marginBottom: '1rem' }}>
          Historical score breakdown across subjects and rubric evaluations.
        </p>

        <table className="ledger-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Subject</th>
              <th>Question Generated</th>
              <th>Rubric Score</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                No completed evaluation history yet.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
