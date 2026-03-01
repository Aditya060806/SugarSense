import React from 'react';
import { motion } from 'framer-motion';
import { Leaf, Wifi, WifiOff } from 'lucide-react';
import { useSimulationContext } from '../../context/SimulationContext';

export default function HeroBanner() {
  const { wsStatus, kpis, isRunning } = useSimulationContext();

  const isConnected = wsStatus === 'connected';

  return (
    <motion.div
      className="hero-banner"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="hero-content">
        <div className="hero-text">
          <h1>🌾 SugarSense</h1>
          <p>
            Real-time NIR spectroscopy engine for non-invasive sugarcane Pol prediction.
            Monitor quality, detect anomalies, and optimize mill throughput — all from one dashboard.
          </p>
          <div className="hero-badge">
            {isConnected ? (
              <>
                <Wifi size={14} />
                <span className="hero-badge-dot" style={{ background: '#4ade80' }} />
                Sensor Online
              </>
            ) : (
              <>
                <WifiOff size={14} />
                <span className="hero-badge-dot" style={{ background: 'rgba(255,255,255,0.5)' }} />
                {wsStatus === 'connecting' ? 'Connecting...' : 'Sensor Offline'}
              </>
            )}
          </div>
        </div>

        <div className="hero-stats">
          <div className="hero-stat">
            <span className="hero-stat-value">{kpis.totalSamples}</span>
            <span className="hero-stat-label">Samples</span>
          </div>
          <div className="hero-stat">
            <span className="hero-stat-value">
              {kpis.avgPol > 0 ? kpis.avgPol.toFixed(1) + '%' : '--'}
            </span>
            <span className="hero-stat-label">Avg Pol</span>
          </div>
          <div className="hero-stat">
            <span className="hero-stat-value">
              {kpis.avgInferenceMs > 0 ? kpis.avgInferenceMs.toFixed(0) : '--'}
            </span>
            <span className="hero-stat-label">ms Latency</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
