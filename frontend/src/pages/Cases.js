import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { RiskBadge, ClassificationBadge, StatusBadge } from '../components/Badge';
import { SimilarityBar } from '../components/SimilarityBar';

export default function Cases() {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');

  useEffect(() => { loadCases(); }, []);

  const loadCases = async () => {
    try {
      const data = await api.getCases();
      setCases(data);
    } catch (e) {
      console.error('Failed to load cases:', e);
    } finally {
      setLoading(false);
    }
  };

  const filtered = filter === 'ALL' ? cases : cases.filter(c => c.status === filter);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Cases</h1>
        <p className="page-desc">Track takedown cases and their enforcement status.</p>
      </div>

      <div className="table-container">
        <div className="table-header">
          <div>
            <div className="card-title">All Cases</div>
            <div className="card-subtitle">{cases.length} total cases</div>
          </div>
          <div className="flex gap-1">
            {['ALL', 'OPEN', 'ACTIONED', 'IGNORED'].map(s => (
              <button
                key={s}
                className={`btn btn-sm ${filter === s ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setFilter(s)}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Case ID</th>
              <th>Official Content</th>
              <th>Platform</th>
              <th>Similarity</th>
              <th>Classification</th>
              <th>Risk</th>
              <th>Status</th>
              <th>Last Updated</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <tr key={i} className="skeleton-row">
                  {Array.from({ length: 9 }).map((__, j) => (
                    <td key={j}><div className="skeleton skeleton-cell skeleton-md" /></td>
                  ))}
                </tr>
              ))
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan="9">
                  <div className="table-empty">
                    <div className="empty-icon">📁</div>
                    <p>
                      {filter === 'ALL'
                        ? <>No cases yet. <Link to="/analyze">Analyze a suspect clip</Link> and open a case.</>
                        : `No ${filter.toLowerCase()} cases.`}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              filtered.map(c => (
                <tr key={c.id}>
                  <td style={{ fontWeight: 700, color: 'var(--accent)' }}>#{c.id}</td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{c.official_title}</div>
                  </td>
                  <td>{c.suspect_platform}</td>
                  <td style={{ minWidth: 130 }}>
                    <SimilarityBar score={c.similarity_score} />
                  </td>
                  <td><ClassificationBadge value={c.classification} /></td>
                  <td><RiskBadge level={c.risk_level} /></td>
                  <td><StatusBadge status={c.status} /></td>
                  <td className="text-muted text-sm">
                    {c.last_updated ? new Date(c.last_updated).toLocaleDateString() : '—'}
                  </td>
                  <td>
                    <Link to={`/cases/${c.id}`} className="btn btn-secondary btn-sm">
                      View →
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
