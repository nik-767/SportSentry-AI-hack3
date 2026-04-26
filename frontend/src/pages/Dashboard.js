import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { RiskBadge, ClassificationBadge, StatusBadge } from '../components/Badge';
import { SimilarityBar } from '../components/SimilarityBar';

function SkeletonRows() {
  return Array.from({ length: 4 }).map((_, i) => (
    <tr key={i} className="skeleton-row">
      <td><div className="skeleton skeleton-cell skeleton-md" /></td>
      <td><div className="skeleton skeleton-cell skeleton-sm" /></td>
      <td><div className="skeleton skeleton-cell skeleton-lg" /></td>
      <td><div className="skeleton skeleton-cell skeleton-sm" /></td>
      <td><div className="skeleton skeleton-cell skeleton-sm" /></td>
      <td><div className="skeleton skeleton-cell skeleton-sm" /></td>
      <td><div className="skeleton skeleton-cell skeleton-sm" /></td>
    </tr>
  ));
}

export default function Dashboard() {
  const [detections, setDetections] = useState([]);
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [d, c] = await Promise.all([api.getDetections(), api.getCases()]);
      setDetections(d);
      setCases(c);
    } catch (e) {
      console.error('Dashboard load error:', e);
    } finally {
      setLoading(false);
    }
  };

  const caseMap = {};
  cases.forEach(c => { caseMap[c.detection_id] = c; });

  const highRiskOpen = cases.filter(c => c.risk_level === 'HIGH' && c.status === 'OPEN').length;
  const officialAssetCount = new Set(detections.map(d => d.official_asset?.id)).size;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-desc">Monitor unauthorized sports content across platforms in real time.</p>
      </div>

      {/* KPI Cards */}
      <div className="kpi-grid">
        <div className="kpi-card accent">
          <div className="kpi-label">Official Assets</div>
          <div className="kpi-value">{loading ? '—' : officialAssetCount}</div>
          <div className="kpi-meta">Registered protected content</div>
        </div>
        <div className="kpi-card info">
          <div className="kpi-label">Total Detections</div>
          <div className="kpi-value">{loading ? '—' : detections.length}</div>
          <div className="kpi-meta">AI comparisons run</div>
        </div>
        <div className="kpi-card warning">
          <div className="kpi-label">Open Cases</div>
          <div className="kpi-value">{loading ? '—' : cases.filter(c => c.status === 'OPEN').length}</div>
          <div className="kpi-meta">Awaiting action</div>
        </div>
        <div className="kpi-card danger">
          <div className="kpi-label">High-Risk Open</div>
          <div className="kpi-value">{loading ? '—' : highRiskOpen}</div>
          <div className="kpi-meta">Requires immediate action</div>
        </div>
      </div>

      {/* Detections Table */}
      <div className="table-container">
        <div className="table-header">
          <div>
            <div className="card-title">Latest Detections</div>
            <div className="card-subtitle">AI-analyzed comparisons between official and suspect content</div>
          </div>
          <Link to="/analyze" className="btn btn-primary btn-sm">+ New Analysis</Link>
        </div>

        <table>
          <thead>
            <tr>
              <th>Official Asset</th>
              <th>Platform</th>
              <th>Similarity</th>
              <th>Classification</th>
              <th>Risk</th>
              <th>Case Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <SkeletonRows />
            ) : detections.length === 0 ? (
              <tr>
                <td colSpan="7">
                  <div className="table-empty">
                    <div className="empty-icon">🔍</div>
                    <p>No detections yet. <Link to="/analyze">Start an analysis</Link> to compare content.</p>
                  </div>
                </td>
              </tr>
            ) : (
              detections.map(d => {
                const relatedCase = caseMap[d.id];
                return (
                  <tr key={d.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{d.official_asset?.title}</div>
                      <div className="cell-sub">{d.official_asset?.owner}</div>
                    </td>
                    <td>
                      <div>{d.suspect_asset?.source_platform}</div>
                      <div className="cell-sub">{d.suspect_asset?.uploader}</div>
                    </td>
                    <td style={{ minWidth: 140 }}>
                      <SimilarityBar score={d.similarity_score} />
                    </td>
                    <td><ClassificationBadge value={d.classification} /></td>
                    <td><RiskBadge level={d.risk_level} /></td>
                    <td>
                      {relatedCase
                        ? <StatusBadge status={relatedCase.status} />
                        : <span className="text-muted text-sm">No case</span>}
                    </td>
                    <td>
                      {relatedCase ? (
                        <Link to={`/cases/${relatedCase.id}`} className="btn btn-secondary btn-sm">
                          View Case
                        </Link>
                      ) : (
                        <Link to="/analyze" className="btn btn-primary btn-sm">Analyze</Link>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
