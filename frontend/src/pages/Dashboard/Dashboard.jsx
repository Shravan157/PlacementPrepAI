import React, { useEffect, useState } from 'react';
import { getCurrentUser } from '../../api/auth';

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCurrentUser()
      .then((data) => setUser(data))
      .catch((err) => console.log('Not logged in or error loading user:', err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="dashboard-page">
      <div className="ledger-card">
        <h2 className="ledger-card-title">Placement Prep AI — Student Overview</h2>
        {loading ? (
          <p>Loading user session...</p>
        ) : user ? (
          <div>
            <p>Welcome back, <strong>{user.name}</strong> ({user.email})</p>
            <p className="text-muted" style={{ marginTop: '0.5rem', fontSize: '0.85rem' }}>
              Account Created: {new Date(user.created_at).toLocaleDateString()}
            </p>
          </div>
        ) : (
          <p>Please log in to view your mock interview progress.</p>
        )}
      </div>

      <div className="ledger-card">
        <h3 className="ledger-card-title">Core CS Subjects Ledger</h3>
        <table className="ledger-table">
          <thead>
            <tr>
              <th>Subject</th>
              <th>Ingestion Status</th>
              <th>Sessions Completed</th>
              <th>Avg Score</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>DBMS (Database Systems)</td>
              <td><span style={{ color: 'var(--accent-success)' }}>Active (Ingested)</span></td>
              <td>0</td>
              <td>—</td>
            </tr>
            <tr>
              <td>DSA (Data Structures)</td>
              <td><span style={{ color: 'var(--text-muted)' }}>Pending</span></td>
              <td>0</td>
              <td>—</td>
            </tr>
            <tr>
              <td>OS (Operating Systems)</td>
              <td><span style={{ color: 'var(--text-muted)' }}>Pending</span></td>
              <td>0</td>
              <td>—</td>
            </tr>
            <tr>
              <td>CN (Computer Networks)</td>
              <td><span style={{ color: 'var(--text-muted)' }}>Pending</span></td>
              <td>0</td>
              <td>—</td>
            </tr>
            <tr>
              <td>OOP (Object Oriented Prog)</td>
              <td><span style={{ color: 'var(--text-muted)' }}>Pending</span></td>
              <td>0</td>
              <td>—</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
