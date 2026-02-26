import React from 'react';
import { TrendingUp, AlertTriangle, CheckCircle2, ShieldAlert } from 'lucide-react';
import { useSimulationContext } from '../../context/SimulationContext';
import GlassCard from '../common/GlassCard';

export default function PolMetric() {
  const { latestData, threshold } = useSimulationContext();

  const polValue = latestData ? latestData.predicted_pol.toFixed(2) : '--.--.';
  const isAlert = latestData?.alert;
  const isAnomaly = latestData?.anomaly;

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
      </div>

      {/* Status Banner */}
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
