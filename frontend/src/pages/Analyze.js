import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { RiskBadge, ClassificationBadge } from '../components/Badge';
import { SimilarityBar } from '../components/SimilarityBar';

const PLATFORM_ICONS = {
  YouTube:   { icon: '▶', color: '#ff0000', bg: 'rgba(255,0,0,0.12)' },
  TikTok:    { icon: '♪', color: '#69c9d0', bg: 'rgba(105,201,208,0.12)' },
  Twitter:   { icon: '𝕏', color: '#1d9bf0', bg: 'rgba(29,155,240,0.12)' },
  Instagram: { icon: '◈', color: '#e1306c', bg: 'rgba(225,48,108,0.12)' },
  Facebook:  { icon: 'f', color: '#1877f2', bg: 'rgba(24,119,242,0.12)' },
};

function PlatformBadge({ platform }) {
  const cfg = PLATFORM_ICONS[platform] || { icon: '●', color: '#94a3b8', bg: 'rgba(148,163,184,0.12)' };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
      padding: '0.2rem 0.55rem', borderRadius: '999px',
      background: cfg.bg, color: cfg.color,
      fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.02em',
    }}>
      <span>{cfg.icon}</span>{platform}
    </span>
  );
}

function ViewCount({ count }) {
  if (!count) return null;
  const fmt = count >= 1_000_000
    ? `${(count / 1_000_000).toFixed(1)}M`
    : count >= 1_000
    ? `${(count / 1_000).toFixed(0)}K`
    : count;
  return <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>👁 {fmt} views</span>;
}

export default function Analyze() {
  const navigate = useNavigate();
  const [officialAssets, setOfficialAssets] = useState([]);
  const [suspects, setSuspects] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [analyzing, setAnalyzing] = useState({});
  const [results, setResults] = useState({});
  const [openingCase, setOpeningCase] = useState({});
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [searchMsg, setSearchMsg] = useState('');
  const [error, setError] = useState('');

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [off, sus] = await Promise.all([api.getOfficialAssets(), api.getSuspects()]);
      setOfficialAssets(off);
      setSuspects(sus);
      if (off.length > 0) setSelectedId(String(off[0].id));
    } catch (e) {
      setError('Failed to load data. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchInternet = async () => {
    if (!selectedId) { alert('Select an official asset first.'); return; }
    setSearching(true);
    setSearchMsg('');
    setError('');
    try {
      const res = await api.searchSuspects(parseInt(selectedId));
      setSearchMsg(`✅ Found ${res.found} real clips on YouTube. ${res.saved} added to database.`);
      // Reload suspects from DB so we show the new results
      const sus = await api.getSuspects();
      setSuspects(sus);
    } catch (e) {
      const detail = e.message.includes('{')
        ? JSON.parse(e.message.match(/\{.*\}/s)?.[0] || '{}').detail
        : e.message;
      setError(`Search failed: ${detail || e.message}`);
    } finally {
      setSearching(false);
    }
  };

  const handleAnalyze = async (suspectId) => {
    if (!selectedId) { alert('Select an official asset first.'); return; }
    setAnalyzing(a => ({ ...a, [suspectId]: true }));
    setError('');
    try {
      const result = await api.analyzeDetection(parseInt(selectedId), suspectId);
      setResults(r => ({ ...r, [suspectId]: result }));
    } catch (e) {
      setError(`Analysis failed: ${e.message}`);
    } finally {
      setAnalyzing(a => ({ ...a, [suspectId]: false }));
    }
  };

  const handleOpenCase = async (suspectId, detectionId) => {
    setOpeningCase(o => ({ ...o, [suspectId]: true }));
    try {
      const c = await api.createCase(detectionId);
      navigate(`/cases/${c.id}`);
    } catch (e) {
      alert('Failed to create case: ' + e.message);
      setOpeningCase(o => ({ ...o, [suspectId]: false }));
    }
  };

  if (loading) {
    return (
      <div>
        <div className="page-header">
          <h1 className="page-title">Analyze Suspect Clips</h1>
        </div>
        <div className="card" style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
          <div className="spinner" style={{ width: 28, height: 28, borderWidth: 3 }} />
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Analyze Suspect Clips</h1>
        <p className="page-desc">
          Select your official asset, search the internet for matching clips, then run AI analysis.
        </p>
      </div>

      {error && <div className="alert alert-error">⚠ {error}</div>}
      {searchMsg && <div className="alert alert-success">{searchMsg}</div>}

      {officialAssets.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🎬</div>
          <h3>No official assets registered</h3>
          <p>You need to register at least one official asset before searching for suspects.</p>
          <button className="btn btn-primary" onClick={() => navigate('/assets/new')}>
            Register First Asset
          </button>
        </div>
      ) : (
        <>
          {/* Official Asset Selector + Search Button */}
          <div className="selector-card">
            <span className="selector-label">Protecting:</span>
            <select
              className="form-select selector-select"
              value={selectedId}
              onChange={e => setSelectedId(e.target.value)}
            >
              {officialAssets.map(a => (
                <option key={a.id} value={a.id}>{a.title}</option>
              ))}
            </select>
            {selectedId && (() => {
              const asset = officialAssets.find(a => String(a.id) === selectedId);
              return asset ? (
                <span className="text-muted text-sm">
                  {asset.owner && `${asset.owner}`}
                  {asset.event_name && ` · ${asset.event_name}`}
                </span>
              ) : null;
            })()}

            {/* 🔍 Search Internet Button */}
            <button
              className="btn btn-primary"
              onClick={handleSearchInternet}
              disabled={searching || !selectedId}
              style={{ marginLeft: 'auto', whiteSpace: 'nowrap' }}
            >
              {searching ? (
                <><span className="spinner" /> Searching YouTube…</>
              ) : (
                '🌐 Search Internet'
              )}
            </button>
          </div>

          {/* How it works hint */}
          {suspects.length === 0 && !searching && (
            <div className="alert alert-info" style={{ marginBottom: '1.5rem' }}>
              ℹ Click <strong>🌐 Search Internet</strong> to scan YouTube for real unauthorized clips
              matching your official asset. Results are pulled live from the YouTube API.
            </div>
          )}

          {/* Suspects List */}
          <div className="table-container">
            <div className="table-header">
              <div>
                <div className="card-title">
                  Suspect Content ({suspects.length})
                  {suspects.length > 0 && (
                    <span style={{
                      marginLeft: '0.6rem', fontSize: '0.7rem',
                      background: 'rgba(99,102,241,0.15)', color: 'var(--accent)',
                      padding: '0.1rem 0.5rem', borderRadius: '999px', fontWeight: 600,
                    }}>
                      LIVE FROM INTERNET
                    </span>
                  )}
                </div>
                <div className="card-subtitle">
                  {suspects.length > 0
                    ? 'Real clips found on the internet. Click Analyze to run AI copyright detection.'
                    : 'Click "Search Internet" to find real suspect clips on YouTube.'}
                </div>
              </div>
              {suspects.length > 0 && (
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={handleSearchInternet}
                  disabled={searching}
                >
                  {searching ? <><span className="spinner" /> Searching…</> : '↺ Refresh'}
                </button>
              )}
            </div>

            {suspects.length === 0 ? (
              <div className="table-empty">
                <div className="empty-icon">🌐</div>
                <p>No suspect clips yet. Click <strong>Search Internet</strong> above to scan YouTube.</p>
              </div>
            ) : (
              suspects.map(suspect => {
                const result = results[suspect.id];
                const isAnalyzing = analyzing[suspect.id];
                const isOpening = openingCase[suspect.id];

                return (
                  <div key={suspect.id} className="suspect-row">
                    {/* Real Thumbnail from YouTube */}
                    <div className="suspect-thumb">
                      {suspect.thumbnail_url ? (
                        <img
                          src={suspect.thumbnail_url}
                          alt={suspect.title}
                          onError={e => {
                            e.target.style.display = 'none';
                            e.target.parentNode.innerHTML = '<span style="font-size:1.4rem">▶</span>';
                          }}
                        />
                      ) : (
                        <span style={{ fontSize: '1.25rem' }}>▶</span>
                      )}
                    </div>

                    {/* Info */}
                    <div className="suspect-info">
                      <div className="suspect-title">
                        {suspect.source_url ? (
                          <a
                            href={suspect.source_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: 'var(--text-primary)', textDecoration: 'none' }}
                            onMouseOver={e => e.target.style.color = 'var(--accent)'}
                            onMouseOut={e => e.target.style.color = 'var(--text-primary)'}
                          >
                            {suspect.title}
                          </a>
                        ) : suspect.title}
                      </div>
                      <div className="suspect-meta" style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', flexWrap: 'wrap', marginTop: '0.35rem' }}>
                        <PlatformBadge platform={suspect.source_platform} />
                        {suspect.uploader && (
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                            @{suspect.uploader}
                          </span>
                        )}
                        <ViewCount count={suspect.view_count} />
                      </div>
                      {result && (
                        <div className="suspect-result">
                          <SimilarityBar score={result.similarity_score} />
                          <ClassificationBadge value={result.classification} />
                          <RiskBadge level={result.risk_level} />
                        </div>
                      )}
                      {result?.short_reason && (
                        <div className="text-muted text-sm" style={{ marginTop: 4 }}>
                          {result.short_reason}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="suspect-actions">
                      {!result ? (
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => handleAnalyze(suspect.id)}
                          disabled={isAnalyzing}
                        >
                          {isAnalyzing
                            ? <><span className="spinner" /> Analyzing…</>
                            : '🔍 Analyze'}
                        </button>
                      ) : (
                        <>
                          <button
                            className="btn btn-success btn-sm"
                            onClick={() => handleOpenCase(suspect.id, result.id)}
                            disabled={isOpening}
                          >
                            {isOpening
                              ? <><span className="spinner" /> Opening…</>
                              : '📋 Open Case'}
                          </button>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => setResults(r => { const n = { ...r }; delete n[suspect.id]; return n; })}
                          >
                            Re-analyze
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </>
      )}
    </div>
  );
}
