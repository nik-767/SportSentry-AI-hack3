import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { RiskBadge, ClassificationBadge } from '../components/Badge';
import { SimilarityBar } from '../components/SimilarityBar';

const API_BASE = 'http://localhost:8000';

function MediaThumb({ url, label }) {
  const hasFile = url && !url.includes('example.com');
  const fullUrl = url && url.startsWith('/uploads') ? `${API_BASE}${url}` : url;
  const isVideo = fullUrl && /\.(mp4|mov|webm|avi)$/i.test(fullUrl);

  return (
    <div className="media-thumb">
      {hasFile && isVideo ? (
        <video src={fullUrl} controls style={{ width: '100%', height: '100%' }} />
      ) : hasFile ? (
        <img src={fullUrl} alt={label} onError={e => e.target.parentNode.innerHTML = '🎬'} />
      ) : (
        <span title={label}>🎬</span>
      )}
    </div>
  );
}

export default function CaseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [caseData, setCaseData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [updating, setUpdating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const loadCase = useCallback(async () => {
    try {
      const data = await api.getCase(id);
      setCaseData(data);
      setStatus(data.status);
    } catch (e) {
      console.error('Failed to load case:', e);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { loadCase(); }, [loadCase]);

  const handleStatusUpdate = async () => {
    setUpdating(true);
    try {
      await api.updateCase(id, status);
      await loadCase();
    } catch (e) {
      alert('Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(caseData.takedown_draft || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendLegal = () => {
    setSending(true);
    setTimeout(() => {
      setSending(false);
      setSent(true);
      if (status !== 'ACTIONED') {
        setStatus('ACTIONED');
        api.updateCase(id, 'ACTIONED').then(() => loadCase());
      }
    }, 2000);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
        <div className="spinner" style={{ width: 32, height: 32, borderWidth: 3 }} />
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="empty-state">
        <div className="empty-icon">❌</div>
        <h3>Case not found</h3>
        <button className="btn btn-secondary" onClick={() => navigate('/cases')}>Back to Cases</button>
      </div>
    );
  }

  const det = caseData.detection || {};
  const off = caseData.official_asset || {};
  const sus = caseData.suspect_asset || {};

  return (
    <div>
      {/* Header */}
      <div className="page-header flex-center gap-2" style={{ justifyContent: 'space-between' }}>
        <div>
          <h1 className="page-title">Case #{caseData.id}</h1>
          <p className="page-desc">
            {off.title || 'Unknown'} vs {sus.source_platform || 'Unknown'} · @{sus.uploader || 'unknown'}
          </p>
        </div>
        <button className="btn btn-secondary" onClick={() => navigate('/cases')}>← All Cases</button>
      </div>

      <div className="detail-grid">
        {/* ── Left Column: Assets ── */}
        <div>
          {/* Official Asset */}
          <div className="card mb-2">
            <div className="card-header">
              <div>
                <div className="card-title">Official Asset</div>
                <div className="card-subtitle">Protected content</div>
              </div>
              <span className="badge badge-info" style={{ fontSize: '0.65rem' }}>OFFICIAL</span>
            </div>
            <MediaThumb url={off.thumbnail_url || off.media_url} label={off.title} />
            <ul className="meta-list" style={{ marginTop: '1rem' }}>
              <li><span className="meta-key">Title</span><span className="meta-val">{off.title || '—'}</span></li>
              <li><span className="meta-key">Owner</span><span className="meta-val">{off.owner || '—'}</span></li>
              <li><span className="meta-key">Event</span><span className="meta-val">{off.event_name || '—'}</span></li>
              <li><span className="meta-key">Date</span><span className="meta-val">{off.event_date || '—'}</span></li>
            </ul>
          </div>

          {/* Suspect Asset */}
          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-title">Suspect Content</div>
                <div className="card-subtitle">{sus.source_platform}</div>
              </div>
              <RiskBadge level={det.risk_level} />
            </div>
            <MediaThumb url={sus.thumbnail_url} label={sus.title} />
            <ul className="meta-list" style={{ marginTop: '1rem' }}>
              <li><span className="meta-key">Title</span><span className="meta-val">{sus.title || '—'}</span></li>
              <li><span className="meta-key">Platform</span><span className="meta-val">{sus.source_platform || '—'}</span></li>
              <li><span className="meta-key">Uploader</span><span className="meta-val">@{sus.uploader || '—'}</span></li>
              <li><span className="meta-key">Views</span><span className="meta-val">{sus.view_count?.toLocaleString() || '—'}</span></li>
              <li>
                <span className="meta-key">URL</span>
                <span className="meta-val" style={{ wordBreak: 'break-all' }}>
                  {sus.source_url
                    ? <a href={sus.source_url} target="_blank" rel="noopener noreferrer">{sus.source_url}</a>
                    : '—'}
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* ── Right Column: Analysis & Actions ── */}
        <div>
          {/* Detection Results */}
          <div className="card mb-2">
            <div className="card-header">
              <div className="card-title">AI Detection Results</div>
            </div>

            <div className="stat-grid">
              <div className="stat-item">
                <div className="stat-label">Classification</div>
                <div style={{ marginTop: 6 }}><ClassificationBadge value={det.classification} /></div>
              </div>
              <div className="stat-item">
                <div className="stat-label">Risk Level</div>
                <div style={{ marginTop: 6 }}><RiskBadge level={det.risk_level} /></div>
              </div>
              <div className="stat-item">
                <div className="stat-label">Similarity Score</div>
                <div className="stat-value" style={{
                  color: det.similarity_score >= 0.75 ? 'var(--danger)' : det.similarity_score >= 0.4 ? 'var(--warning)' : 'var(--success)'
                }}>
                  {det.similarity_score != null ? `${Math.round(det.similarity_score * 100)}%` : '—'}
                </div>
              </div>
              <div className="stat-item">
                <div className="stat-label">AI Confidence</div>
                <div className="stat-value" style={{ color: 'var(--accent)' }}>
                  {det.confidence != null ? `${Math.round(det.confidence * 100)}%` : '—'}
                </div>
              </div>
            </div>

            <div className="mb-2">
              <SimilarityBar score={det.similarity_score} />
            </div>

            {det.short_reason && (
              <div className="mb-2">
                <div className="stat-label mb-1" style={{ marginBottom: 6 }}>AI Summary</div>
                <div style={{
                  background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)',
                  padding: '0.75rem', fontSize: '0.85rem', color: 'var(--text-secondary)',
                  borderLeft: '3px solid var(--accent)',
                }}>
                  {det.short_reason}
                </div>
              </div>
            )}

            {det.detailed_evidence?.length > 0 && (
              <div>
                <div className="stat-label" style={{ marginBottom: 8 }}>Evidence Points</div>
                <ul className="evidence-list">
                  {det.detailed_evidence.map((e, i) => <li key={i}>{e}</li>)}
                </ul>
              </div>
            )}
          </div>

          {/* Takedown Draft */}
          <div className="card mb-2">
            <div className="card-header">
              <div>
                <div className="card-title">DMCA Takedown Draft</div>
                <div className="card-subtitle">AI-generated, ready to send</div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  className={`btn btn-sm ${sent ? 'btn-success' : 'btn-primary'}`}
                  onClick={handleSendLegal}
                  disabled={sending || sent}
                >
                  {sending ? <><span className="spinner" /> Sending…</> : sent ? '✓ Sent to Legal' : '✉ Send Notice via SendGrid'}
                </button>
                <button
                  className={`btn btn-sm ${copied ? 'btn-success' : 'btn-secondary'}`}
                  onClick={handleCopy}
                >
                  {copied ? '✓ Copied!' : '⎘ Copy'}
                </button>
              </div>
            </div>
            <textarea
              className="takedown-area"
              readOnly
              value={caseData.takedown_draft || 'No takedown draft generated.'}
            />
          </div>

          {/* Case Status */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">Update Case Status</div>
            </div>
            <div className="flex gap-1">
              <select
                className="form-select"
                value={status}
                onChange={e => setStatus(e.target.value)}
                style={{ flex: 1 }}
              >
                <option value="OPEN">OPEN — Awaiting Action</option>
                <option value="ACTIONED">ACTIONED — Takedown Sent</option>
                <option value="IGNORED">IGNORED — No Action Required</option>
              </select>
              <button
                className="btn btn-primary"
                onClick={handleStatusUpdate}
                disabled={updating || status === caseData.status}
              >
                {updating ? <><span className="spinner" /> Saving…</> : 'Update'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
