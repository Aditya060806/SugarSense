import React from 'react';
import { Play, Square, Download, RotateCcw, Settings } from 'lucide-react';
import { useSimulationContext } from '../../context/SimulationContext';
import { API_BASE } from '../../utils/helpers';
import GlassCard from '../common/GlassCard';
import toast from 'react-hot-toast';

export default function ControlPanel() {
  const {
    isRunning, setIsRunning,
    noiseLevel, setNoiseLevel,
    threshold, setThreshold,
    allPredictions,
    resetSession,
    logs,
  } = useSimulationContext();

  const downloadReport = async () => {
    if (allPredictions.length === 0) {
      toast.error('No data collected yet! Run simulation first.');
      return;
    }
    const data = {
      timestamp: allPredictions.map(p => p.timestamp),
      actual_pol: allPredictions.map(p => p.actual),
      predicted_pol: allPredictions.map(p => p.predicted),
      threshold,
    };
    try {
      const response = await fetch(`${API_BASE}/api/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'sugarsense_shift_report.pdf';
      document.body.appendChild(a);
      a.click();
      a.remove();
      toast.success('Shift report downloaded!');
    } catch {
      toast.error('Report generation failed');
    }
  };

  return (
    <GlassCard className="control-panel-card" delay={0}>
      <h3 className="card-title"><Settings size={20} /> Simulation Controls</h3>

      <div className="control-group">
        <label>Industrial Noise: <strong>{noiseLevel}%</strong></label>
        <input
          type="range" min="0" max="10" step="0.5"
          value={noiseLevel}
          onChange={(e) => setNoiseLevel(Number(e.target.value))}
        />
      </div>

      <div className="control-group">
        <label>Pol Alert Threshold: <strong>{threshold}%</strong></label>
        <input
          type="range" min="0" max="25" step="0.5"
          value={threshold}
          onChange={(e) => setThreshold(Number(e.target.value))}
        />
      </div>

      <div className="control-buttons">
        <button
          className={`btn-primary ${isRunning ? 'btn-stop' : ''}`}
          onClick={() => setIsRunning(!isRunning)}
        >
          {isRunning ? <><Square size={16} /> Stop</> : <><Play size={16} /> Start</>}
        </button>

        <button className="btn-secondary" onClick={downloadReport} title="Download PDF Shift Report">
          <Download size={16} /> PDF
        </button>

        <button className="btn-secondary" onClick={resetSession} title="Reset Session Data">
          <RotateCcw size={16} />
        </button>
      </div>

      <div className="mqtt-section">
        <label className="mqtt-label">MQTT Output Log</label>
        <div className="console-mock">
          {logs || 'Awaiting simulation data...'}
        </div>
      </div>
    </GlassCard>
  );
}
