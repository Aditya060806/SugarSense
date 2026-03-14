// ── Formatting Helpers ───────────────────────────────────────

export function formatPol(value) {
  if (value == null || isNaN(value)) return '--.--%';
  return `${Number(value).toFixed(2)}%`;
}

export function formatMs(value) {
  if (value == null || isNaN(value)) return '--';
  return `${Number(value).toFixed(1)} ms`;
}

export function formatUptime(seconds) {
  if (!seconds || seconds < 0) return '0s';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export function formatTimestamp(ts) {
  if (!ts) return '--:--:--';
  const d = new Date(ts * 1000);
  return d.toLocaleTimeString();
}

// ── Color Helpers ────────────────────────────────────────────

export function polColor(value, threshold = 13.0) {
  if (value == null) return 'var(--text-secondary)';
  return value < threshold ? 'var(--accent-red)' : 'var(--accent-green)';
}

export function statusLabel(data) {
  if (!data) return { text: 'Standby', type: 'standby' };
  if (data.anomaly) return { text: 'Anomaly Detected', type: 'anomaly' };
  if (data.alert) return { text: 'Low-Pol Alert', type: 'danger' };
  return { text: 'Nominal', type: 'success' };
}

// ── SPC Calculations ────────────────────────────────────────

export function calculateSPCLimits(values, sigma = 3) {
  if (!values || values.length < 2) return { cl: 0, ucl: 0, lcl: 0 };
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const std = Math.sqrt(values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / (values.length - 1));
  return {
    cl: mean,
    ucl: mean + sigma * std,
    lcl: mean - sigma * std,
  };
}

// ── Data Export ──────────────────────────────────────────────

export function downloadCSV(predictions, filename = 'sugarsense_data.csv') {
  if (!predictions.length) return;
  const headers = 'Index,Predicted_Pol,Actual_Pol,Residual\n';
  const rows = predictions.map((p, i) =>
    `${i},${p.predicted.toFixed(4)},${p.actual.toFixed(4)},${(p.predicted - p.actual).toFixed(4)}`
  ).join('\n');
  const blob = new Blob([headers + rows], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function downloadJSON(predictions, filename = 'sugarsense_data.json') {
  if (!predictions.length) return;
  const blob = new Blob([JSON.stringify(predictions, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// ── API helpers ─────────────────────────────────────────────

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export async function fetchJSON(path) {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export const API = {
  config: () => fetchJSON('/api/config'),
  modelInfo: () => fetchJSON('/api/model-info'),
  preprocessingDemo: (idx = 0) => fetchJSON(`/api/preprocessing-demo?sample_idx=${idx}`),
  plsLoadings: () => fetchJSON('/api/pls-loadings'),
  stats: () => fetchJSON('/api/stats'),
  predictionsHistory: () => fetchJSON('/api/predictions-history'),
  roi: () => fetchJSON('/api/roi'),
  modelComparison: () => fetchJSON('/api/model-comparison'),
  mqttStatus: () => fetchJSON('/api/mqtt-status'),
  shifts: {
    list: () => fetchJSON('/api/shifts'),
    get: (id) => fetchJSON(`/api/shifts/${id}`),
    create: (name, threshold = 13.0) =>
      fetch(`${API_BASE}/api/shifts/active`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, threshold }),
      }).then(r => r.json()),
    stopRecording: () =>
      fetch(`${API_BASE}/api/shifts/active`, { method: 'DELETE' }).then(r => r.json()),
    delete: (id) =>
      fetch(`${API_BASE}/api/shifts/${id}`, { method: 'DELETE' }),
  },
};

const wsProtocol = API_BASE.startsWith('https') ? 'wss' : 'ws';
const wsHost = API_BASE.replace(/^https?:\/\//, '');
export const WS_URL = `${wsProtocol}://${wsHost}/ws/simulation`;

export { API_BASE };

