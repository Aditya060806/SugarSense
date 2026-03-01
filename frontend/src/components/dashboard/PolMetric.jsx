import React from 'react';
import { TrendingUp, AlertTriangle, CheckCircle2, ShieldAlert } from 'lucide-react';
import { useSimulationContext } from '../../context/SimulationContext';
import GlassCard from '../common/GlassCard';

function ConfidenceGauge({ value }) {
  const radius = 32;
  const circumference = 2 * Math.PI * radius;
  const progress = (value / 100) * circumference;
  const color = value > 80 ? '#16a34a' : value > 50 ? '#f59e0b' : '#ef4444';

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8 }}>
      <svg width="78" height="78" viewBox="0 0 78 78">
        <circle cx="39" cy="39" r={radius} fill="none" stroke="#e2e8f0" strokeWidth="5" />
        <circle
          cx="39" cy="39" r={radius} fill="none"
          stroke={color} strokeWidth="5" strokeLinecap="round"
          strokeDasharray={`${progress} ${circumference}`}
          transform="rotate(-90 39 39)"
          style={{ transition: 'stroke-dasharray 0.5s ease' }}
        />
        <text x="39" y="36" textAnchor="middle" fontSize="14" fontWeight="700" fill={color}>
          {value.toFixed(0)}%
        </text>
        <text x="39" y="50" textAnchor="middle" fontSize="7" fill="#94a3b8">
          CONFIDENCE
        </text>
      </svg>
      <div style={{ fontSize: '0.75rem', color: '#64748b', lineHeight: 1.5 }}>
        <div style={{ fontWeight: 600, color }}>
          {value > 80 ? 'High Reliability' : value > 50 ? 'Moderate' : 'Low Confidence'}
        </div>
        Mahalanobis distance to PLS training space
      </div>
    </div>
  );
}

export default function PolMetric() {
  const { latestData, threshold } = useSimulationContext();

  const polValue = latestData ? latestData.predicted_pol.toFixed(2) : '--.--';
  const isAlert = latestData?.alert;
  const isAnomaly = latestData?.anomaly;
  const confidence = latestData?.confidence ?? 0;

  return (
    <GlassCard className="pol-metric-card" delay={0.1}>
      <h3 className="card-title"><TrendingUp size={20} /> Live Pol & Telemetry</h3>

      <div className="metric-wrapper">
        <span className="metric-label">Predicted TS / Pol %</span>
        <div className={`metric-value ${isAlert ? 'low-pol' : latestData ? 'high-pol' : ''}`}>
          {polValue} %
        </div>
        {latestData && (
          <span className="metric-sub">
            Lab Ref: {latestData.actual_pol.toFixed(2)}% &nbsp;|&nbsp; Inf: {latestData.inference_ms.toFixed(1)} ms
          </span>
        )}

        {latestData && <ConfidenceGauge value={confidence} />}
      </div>

      {isAnomaly ? (
        <div className="alert-box alert-anomaly">
          <ShieldAlert size={18} /> OPTICAL ANOMALY — SENSOR MAINTENANCE REQUIRED
        </div>
      ) : isAlert ? (
        <div className="alert-box alert-danger">
          <AlertTriangle size={18} /> Low-Pol Alert! Threshold {threshold}% breached.
        </div>
      ) : latestData ? (
        <div className="alert-box alert-success">
          <CheckCircle2 size={18} /> Quality Control Nominal
        </div>
      ) : (
        <div className="alert-box alert-standby">Standby</div>
      )}
    </GlassCard>
  );
}
