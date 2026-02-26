import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Settings, Server, Cpu, Radio, Info } from 'lucide-react';
import GlassCard from '../components/common/GlassCard';
import { useSimulationContext } from '../context/SimulationContext';
import { API, formatUptime } from '../utils/helpers';

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
};

export default function SettingsPage() {
  const { noiseLevel, setNoiseLevel, threshold, setThreshold, wsStatus } = useSimulationContext();
  const [serverStats, setServerStats] = useState(null);
  const [modelInfo, setModelInfo] = useState(null);

  useEffect(() => {
    API.stats().then(setServerStats).catch(() => {});
    API.modelInfo().then(setModelInfo).catch(() => {});
  }, []);

  const refreshStats = () => {
    API.stats().then(setServerStats).catch(() => {});
  };

  return (
    <motion.div className="page" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.3 }}>
      <div className="page-header">
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">System configuration and status</p>
      </div>

      {/* Simulation Controls */}
      <GlassCard delay={0}>
        <h3 className="card-title"><Settings size={20} /> Simulation Parameters</h3>
        <div className="settings-grid">
          <div className="setting-item">
            <label>Industrial Noise Level</label>
            <div className="setting-control">
              <input type="range" min="0" max="10" step="0.5" value={noiseLevel} onChange={e => setNoiseLevel(Number(e.target.value))} />
              <span className="setting-value">{noiseLevel}%</span>
            </div>
            <p className="setting-desc">Simulates environmental noise, sensor vibration, and optical interference typical in sugar mill operations.</p>
          </div>
          <div className="setting-item">
            <label>Quality Alert Threshold</label>
            <div className="setting-control">
              <input type="range" min="0" max="25" step="0.5" value={threshold} onChange={e => setThreshold(Number(e.target.value))} />
              <span className="setting-value">{threshold}%</span>
            </div>
            <p className="setting-desc">Minimum acceptable Pol (Total Sugar %) before triggering a quality alert. Industry typical: 12–14%.</p>
          </div>
        </div>
      </GlassCard>

      {/* System Status */}
      <GlassCard delay={0.1}>
        <h3 className="card-title"><Server size={20} /> System Status <button className="btn-text" onClick={refreshStats}>Refresh</button></h3>
        <div className="status-grid">
          <div className="status-item">
            <Radio size={16} style={{ color: wsStatus === 'connected' ? 'var(--accent-green)' : 'var(--accent-red)' }} />
            <span>WebSocket</span>
            <span className="status-val" style={{ color: wsStatus === 'connected' ? 'var(--accent-green)' : 'var(--accent-red)' }}>
              {wsStatus === 'connected' ? 'Connected' : wsStatus === 'connecting' ? 'Connecting...' : 'Disconnected'}
            </span>
          </div>
          {serverStats && (
            <>
              <div className="status-item">
                <Cpu size={16} style={{ color: 'var(--accent-blue)' }} />
                <span>Server Uptime</span>
                <span className="status-val">{formatUptime(serverStats.uptime_seconds)}</span>
              </div>
              <div className="status-item">
                <Radio size={16} style={{ color: 'var(--accent-purple)' }} />
                <span>Active Connections</span>
                <span className="status-val">{serverStats.active_connections}</span>
              </div>
              <div className="status-item">
                <Cpu size={16} style={{ color: 'var(--accent-green)' }} />
                <span>Total Server Predictions</span>
                <span className="status-val">{serverStats.total_predictions}</span>
              </div>
            </>
          )}
        </div>
      </GlassCard>

      {/* Model Info */}
      {modelInfo && !modelInfo.error && (
        <GlassCard delay={0.2}>
          <h3 className="card-title"><Cpu size={20} /> Model Configuration</h3>
          <div className="report-summary">
            <div className="report-row"><span>Model Type</span><span>{modelInfo.model_type}</span></div>
            <div className="report-row"><span>PLS Components</span><span>{modelInfo.n_components}</span></div>
            <div className="report-row"><span>Wavelength Range</span><span>{modelInfo.wavelength_range[0]}–{modelInfo.wavelength_range[1]} nm</span></div>
            <div className="report-row"><span>Number of Wavelengths</span><span>{modelInfo.n_wavelengths}</span></div>
            <div className="report-row"><span>Preprocessing</span><span>{modelInfo.preprocessing}</span></div>
            <div className="report-row"><span>Anomaly Detection</span><span>{modelInfo.anomaly_detector}</span></div>
            <div className="report-row"><span>Dataset</span><span>{modelInfo.dataset}</span></div>
          </div>
        </GlassCard>
      )}

      {/* About */}
      <GlassCard delay={0.3}>
        <h3 className="card-title"><Info size={20} /> About SugarSense</h3>
        <div className="about-content">
          <p>SugarSense is a real-time NIR spectroscopy platform for automated sugarcane quality monitoring. It uses Partial Least Squares (PLS) regression with chemometric preprocessing to predict Total Sugar (Pol %) in real-time from Near-Infrared spectra.</p>
          <div className="about-tech">
            <span className="tech-badge">FastAPI</span>
            <span className="tech-badge">React 19</span>
            <span className="tech-badge">Three.js</span>
            <span className="tech-badge">scikit-learn</span>
            <span className="tech-badge">WebSocket</span>
            <span className="tech-badge">PLS Regression</span>
            <span className="tech-badge">Isolation Forest</span>
            <span className="tech-badge">Savitzky-Golay</span>
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
}
