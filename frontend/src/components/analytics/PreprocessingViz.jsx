import React, { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Layers } from 'lucide-react';
import GlassCard from '../common/GlassCard';
import { API } from '../../utils/helpers';

export default function PreprocessingViz() {
  const [data, setData] = useState(null);
  const [sampleIdx, setSampleIdx] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    API.preprocessingDemo(sampleIdx)
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [sampleIdx]);

  if (loading || !data) {
    return (
      <GlassCard className="preprocess-card" delay={0.1}>
        <h3 className="card-title"><Layers size={20} /> Preprocessing Pipeline</h3>
        <p className="chart-empty">Loading...</p>
      </GlassCard>
    );
  }

  const chartData = data.wavelengths.map((wv, i) => ({
    wv,
    raw: data.raw[i],
    sg: data.savgol[i],
    snv: data.snv[i],
  }));

  return (
    <GlassCard className="preprocess-card" delay={0.1}>
      <h3 className="card-title"><Layers size={20} /> Preprocessing Pipeline Visualization</h3>
      <div className="preprocess-controls">
        <label>Sample Index: <strong>{sampleIdx}</strong></label>
        <input type="range" min={0} max={12} step={1} value={sampleIdx} onChange={e => setSampleIdx(Number(e.target.value))} />
      </div>

      <div className="preprocess-stages">
        {/* Stage 1: Raw */}
        <div className="stage-panel">
          <h4>1. Raw Spectrum</h4>
          <div className="chart-container" style={{ height: 180 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#21262d" />
                <XAxis dataKey="wv" stroke="#8b949e" tick={{ fill: '#8b949e', fontSize: 9 }} />
                <YAxis stroke="#8b949e" tick={{ fill: '#8b949e', fontSize: 9 }} domain={['auto', 'auto']} />
                <Tooltip contentStyle={{ backgroundColor: '#161b22', borderColor: '#30363d', color: '#c9d1d9', borderRadius: '8px', fontSize: '12px' }} />
                <Line type="monotone" dataKey="raw" stroke="#8b949e" dot={false} strokeWidth={1.5} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="stage-arrow">→</div>

        {/* Stage 2: SG */}
        <div className="stage-panel">
          <h4>2. Savitzky-Golay (1st Derivative)</h4>
          <div className="chart-container" style={{ height: 180 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#21262d" />
                <XAxis dataKey="wv" stroke="#8b949e" tick={{ fill: '#8b949e', fontSize: 9 }} />
                <YAxis stroke="#8b949e" tick={{ fill: '#8b949e', fontSize: 9 }} domain={['auto', 'auto']} />
                <Tooltip contentStyle={{ backgroundColor: '#161b22', borderColor: '#30363d', color: '#c9d1d9', borderRadius: '8px', fontSize: '12px' }} />
                <Line type="monotone" dataKey="sg" stroke="#ff7b00" dot={false} strokeWidth={1.5} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="stage-arrow">→</div>

        {/* Stage 3: SNV */}
        <div className="stage-panel">
          <h4>3. Standard Normal Variate</h4>
          <div className="chart-container" style={{ height: 180 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#21262d" />
                <XAxis dataKey="wv" stroke="#8b949e" tick={{ fill: '#8b949e', fontSize: 9 }} />
                <YAxis stroke="#8b949e" tick={{ fill: '#8b949e', fontSize: 9 }} domain={['auto', 'auto']} />
                <Tooltip contentStyle={{ backgroundColor: '#161b22', borderColor: '#30363d', color: '#c9d1d9', borderRadius: '8px', fontSize: '12px' }} />
                <Line type="monotone" dataKey="snv" stroke="#09b850" dot={false} strokeWidth={1.5} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </GlassCard>
  );
}
