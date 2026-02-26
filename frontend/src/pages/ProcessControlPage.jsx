import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Clock, ShieldCheck } from 'lucide-react';
import { useSimulationContext } from '../context/SimulationContext';
import SPCChart from '../components/charts/SPCChart';
import GlassCard from '../components/common/GlassCard';
import { formatTimestamp, calculateSPCLimits } from '../utils/helpers';

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
};

export default function ProcessControlPage() {
  const { allPredictions, alertTimeline, threshold, kpis } = useSimulationContext();

  const polValues = allPredictions.map(p => p.predicted);
  const limits = calculateSPCLimits(polValues);

  // Process capability
  const withinLimits = polValues.filter(v => v >= limits.lcl && v <= limits.ucl).length;
  const cpkPercent = polValues.length > 0 ? ((withinLimits / polValues.length) * 100).toFixed(1) : '--';

  // Out of control signals (Western Electric Rule 1 — beyond ±3σ)
  const oocCount = polValues.filter(v => v > limits.ucl || v < limits.lcl).length;

  return (
    <motion.div className="page" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.3 }}>
      <div className="page-header">
        <h1 className="page-title">Process Control</h1>
        <p className="page-subtitle">Statistical process control (SPC) monitoring & alert management</p>
      </div>

      {/* SPC Summary Row */}
      <div className="spc-summary-row">
        <GlassCard className="spc-stat" delay={0}>
          <ShieldCheck size={28} style={{ color: 'var(--accent-green)' }} />
          <div>
            <span className="spc-stat-value">{cpkPercent}%</span>
            <span className="spc-stat-label">Within Control Limits</span>
          </div>
        </GlassCard>

        <GlassCard className="spc-stat" delay={0.05}>
          <AlertTriangle size={28} style={{ color: 'var(--accent-red)' }} />
          <div>
            <span className="spc-stat-value">{oocCount}</span>
            <span className="spc-stat-label">Out-of-Control Signals</span>
          </div>
        </GlassCard>

        <GlassCard className="spc-stat" delay={0.1}>
          <Clock size={28} style={{ color: 'var(--accent-orange)' }} />
          <div>
            <span className="spc-stat-value">{kpis.totalAlerts}</span>
            <span className="spc-stat-label">Quality Alerts</span>
          </div>
        </GlassCard>

        <GlassCard className="spc-stat" delay={0.15}>
          <ShieldCheck size={28} style={{ color: 'var(--accent-purple)' }} />
          <div>
            <span className="spc-stat-value">{kpis.totalAnomalies}</span>
            <span className="spc-stat-label">Anomalies Detected</span>
          </div>
        </GlassCard>
      </div>

      {/* SPC Chart */}
      {allPredictions.length > 2 ? (
        <SPCChart predictions={allPredictions} threshold={threshold} />
      ) : (
        <GlassCard delay={0.1}>
          <h3 className="card-title"><ShieldCheck size={20} /> SPC Chart</h3>
          <p className="chart-empty">Start the simulation to generate SPC data. At least 3 samples needed.</p>
        </GlassCard>
      )}

      {/* Alert Timeline */}
      <GlassCard className="alert-timeline-card" delay={0.2}>
        <h3 className="card-title"><AlertTriangle size={20} /> Alert Timeline</h3>
        {alertTimeline.length === 0 ? (
          <p className="chart-empty">No alerts recorded yet.</p>
        ) : (
          <div className="alert-timeline">
            {alertTimeline.map((entry, i) => (
              <div key={i} className={`timeline-entry timeline-${entry.type}`}>
                <div className="timeline-dot" />
                <div className="timeline-content">
                  <span className="timeline-time">{formatTimestamp(entry.timestamp)}</span>
                  <span className="timeline-msg">
                    {entry.type === 'anomaly'
                      ? 'Optical anomaly detected — sensor inspection recommended'
                      : `Low-Pol alert: ${entry.pol.toFixed(2)}% (below threshold)`}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </GlassCard>
    </motion.div>
  );
}
