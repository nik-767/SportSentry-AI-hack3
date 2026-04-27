const BASE = process.env.REACT_APP_API_URL || 'https://sportsentry-ai-hack3-production.up.railway.app/api';

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, options);
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || `HTTP ${res.status}`);
  }
  return res.json();
}

export const api = {
  // Official Assets
  getOfficialAssets: () => request('/official-assets/'),
  getOfficialAsset: (id) => request(`/official-assets/${id}`),
  createOfficialAsset: (formData) =>
    request('/official-assets/', { method: 'POST', body: formData }),

  // Suspects
  getSuspects: () => request('/suspects/'),
  getSuspect: (id) => request(`/suspects/${id}`),

  // 🔍 Real internet search — searches YouTube and saves results to DB
  searchSuspects: (officialAssetId) =>
    request('/suspects/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ official_asset_id: officialAssetId }),
    }),

  // Detections
  getDetections: () => request('/detections/'),
  getDetection: (id) => request(`/detections/${id}`),
  analyzeDetection: (officialId, suspectId) =>
    request('/detections/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ official_asset_id: officialId, suspect_asset_id: suspectId }),
    }),

  // Cases
  getCases: () => request('/cases/'),
  getCase: (id) => request(`/cases/${id}`),
  createCase: (detectionId) =>
    request(`/cases/${detectionId}/create`, { method: 'POST' }),
  updateCase: (id, status) =>
    request(`/cases/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    }),

  // Dashboard — single call for all KPIs
  getDashboardStats: () => request('/dashboard/stats'),
};
