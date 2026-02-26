import React, { useEffect, useState } from 'react';
import { Cpu, Target, TrendingUp, Crosshair } from 'lucide-react';
import GlassCard from '../common/GlassCard';
import { API } from '../../utils/helpers';

export default function ModelMetrics() {
  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.modelInfo()
      .then(data => { setInfo(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <GlassCard className="model-metrics-card" delay={0.05}>
        <h3 className="card-title"><Cpu size={20} /> Model Performance</h3>
        <div className="metrics-loading">Loading model data...</div>
      </GlassCard>
    );
  }

  if (!info || info.error) {
    return (
      <GlassCard className="model-metrics-card" delay={0.05}>
        <h3 className="card-title"><Cpu size={20} /> Model Performance</h3>
        <div className="metrics-loading">Model not available. Run trainer.py first.</div>
      </GlassCard>
    );
  }

  return (
    <GlassCard className="model-metrics-card" delay={0.05}>
      <h3 className="card-title"><Cpu size={20} /> Model Performance Metrics</h3>

      <div className="metrics-grid">
        <div className="metric-item">
          <Target size={24} className="metric-icon" style={{ color: 'var(--accent-green)' }} />
          <div className="metric-detail">
            <span className="metric-big" style={{ color: 'var(--accent-green)' }}>{info.r2.toFixed(4)}</span>
            <span className="metric-name">R² Score</span>
            <span className="metric-desc">Coefficient of Determination</span>
          </div>
        </div>

        <div className="metric-item">
          <Crosshair size={24} className="metric-icon" style={{ color: 'var(--accent-blue)' }} />
          <div className="metric-detail">
            <span className="metric-big" style={{ color: 'var(--accent-blue)' }}>{info.rmse.toFixed(4)}</span>
            <span className="metric-name">RMSEP</span>
            <span className="metric-desc">Root Mean Square Error of Prediction</span>
          </div>
        </div>

        <div className="metric-item">
          <TrendingUp size={24} className="metric-icon" style={{ color: 'var(--accent-purple)' }} />
          <div className="metric-detail">
            <span className="metric-big" style={{ color: 'var(--accent-purple)' }}>{info.rpd.toFixed(2)}</span>
            <span className="metric-name">RPD</span>
            <span className="metric-desc">Ratio of Performance to Deviation</span>
          </div>
        </div>

        <div className="metric-item">
          <Cpu size={24} className="metric-icon" style={{ color: 'var(--accent-orange)' }} />
          <div className="metric-detail">
            <span className="metric-big" style={{ color: 'var(--accent-orange)' }}>{info.bias >= 0 ? '+' : ''}{info.bias.toFixed(4)}</span>
            <span className="metric-name">Bias</span>
            <span className="metric-desc">Systematic prediction error</span>
          </div>
        </div>
      </div>

      <div className="model-details">
        <div className="detail-row"><span>Model</span><span>{info.model_type}</span></div>
        <div className="detail-row"><span>PLS Components</span><span>{info.n_components}</span></div>
        <div className="detail-row"><span>Wavelengths</span><span>{info.n_wavelengths} ({info.wavelength_range[0]}–{info.wavelength_range[1]} nm)</span></div>
        <div className="detail-row"><span>Preprocessing</span><span>{info.preprocessing}</span></div>
        <div className="detail-row"><span>Anomaly Detection</span><span>{info.anomaly_detector}</span></div>
        <div className="detail-row"><span>Dataset</span><span>{info.dataset}</span></div>
      </div>
    </GlassCard>
  );
}
