import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';

function formatBytes(b) {
  if (!b) return '';
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1024 / 1024).toFixed(1)} MB`;
}

export default function NewAsset() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: '', description: '', owner: '',
    event_name: '', event_date: '', tags: '',
  });
  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleFile = (f) => {
    if (f && (f.type.startsWith('video/') || f.type.startsWith('image/'))) {
      setFile(f);
      setError('');
    } else {
      setError('Please upload a video or image file.');
    }
  };

  const handleDrop = e => {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!file) { setError('Please select a file to upload.'); return; }
    if (!form.title.trim()) { setError('Title is required.'); return; }

    setLoading(true);
    setError('');
    try {
      const data = new FormData();
      data.append('file', file);
      Object.entries(form).forEach(([k, v]) => data.append(k, v));
      await api.createOfficialAsset(data);
      setSuccess(true);
      setTimeout(() => navigate('/'), 1200);
    } catch (err) {
      setError('Upload failed. Make sure the backend is running and try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 640, margin: '0 auto' }}>
      <div className="page-header">
        <h1 className="page-title">Register Official Asset</h1>
        <p className="page-desc">Upload a protected sports clip or image with rights metadata.</p>
      </div>

      {error && <div className="alert alert-error">⚠ {error}</div>}
      {success && <div className="alert alert-success">✓ Asset registered! Redirecting to dashboard...</div>}

      <form onSubmit={handleSubmit}>
        <div className="card">
          {/* File Upload */}
          <div className="form-group">
            <label className="form-label">Media File <span className="required">*</span></label>
            <div
              className={`file-drop${dragging ? ' dragging' : ''}`}
              onDragOver={e => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              onClick={() => document.getElementById('file-input').click()}
            >
              <input
                id="file-input"
                type="file"
                accept="video/*,image/*"
                onChange={e => handleFile(e.target.files[0])}
              />
              <div className="file-drop-icon">🎬</div>
              <div className="file-drop-text">
                <span>Click to browse</span> or drag & drop your file here
              </div>
              <div className="form-hint" style={{ marginTop: 4 }}>MP4, MOV, JPG, PNG supported</div>
            </div>
            {file && (
              <div className="file-selected">
                <span>📁</span>
                <div>
                  <div className="file-selected-name">{file.name}</div>
                  <div className="file-selected-size">{formatBytes(file.size)}</div>
                </div>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  style={{ marginLeft: 'auto' }}
                  onClick={e => { e.stopPropagation(); setFile(null); }}
                >✕</button>
              </div>
            )}
          </div>

          {/* Title */}
          <div className="form-group">
            <label className="form-label">Title <span className="required">*</span></label>
            <input
              className="form-input"
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="e.g. UEFA Champions League Final 2024"
              required
            />
          </div>

          {/* Description */}
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              className="form-textarea"
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Brief description of the content..."
              rows={3}
            />
          </div>

          {/* Owner + Event Name side by side */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Rights Holder / Owner</label>
              <input
                className="form-input"
                name="owner"
                value={form.owner}
                onChange={handleChange}
                placeholder="e.g. UEFA"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Event Name</label>
              <input
                className="form-input"
                name="event_name"
                value={form.event_name}
                onChange={handleChange}
                placeholder="e.g. Champions League Final"
              />
            </div>
          </div>

          {/* Event Date + Tags */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Event Date</label>
              <input
                className="form-input"
                type="date"
                name="event_date"
                value={form.event_date}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Tags</label>
              <input
                className="form-input"
                name="tags"
                value={form.tags}
                onChange={handleChange}
                placeholder="football, highlights, 2024"
              />
              <div className="form-hint">Comma-separated</div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-1" style={{ marginTop: '0.5rem' }}>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ flex: 1 }}
            >
              {loading ? <><span className="spinner" /> Uploading...</> : '⬆ Register Asset'}
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate('/')}
            >
              Cancel
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
