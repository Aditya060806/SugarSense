import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { ShieldCheck } from 'lucide-react';
import GlassCard from '../common/GlassCard';
import { calculateSPCLimits } from '../../utils/helpers';

export default function SPCChart({ predictions, threshold }) {
  const polValues = predictions.map(p => p.predicted);
  const limits = calculateSPCLimits(polValues);

  const data = predictions.map((p, i) => ({
    sample: i + 1,
    pol: p.predicted,
    cl: limits.cl,
    ucl: limits.ucl,
    lcl: limits.lcl,
  }));

  return (
    <GlassCard className="chart-card" delay={0.1}>
      <h3 className="card-title"><ShieldCheck size={20} /> Statistical Process Control (Shewhart Chart)</h3>
      <div className="spc-legend">
        <span className="spc-legend-item"><span className="spc-dot" style={{ background: '#09b850' }} />Pol Values</span>
        <span className="spc-legend-item"><span className="spc-dot" style={{ background: '#00d2ff' }} />Center Line (CL): {limits.cl.toFixed(2)}%</span>
        <span className="spc-legend-item"><span className="spc-dot" style={{ background: '#ff3366' }} />UCL/LCL (±3σ)</span>
      </div>
      <div className="chart-container" style={{ height: 300 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#21262d" />
            <XAxis dataKey="sample" stroke="#8b949e" tick={{ fill: '#8b949e', fontSize: 11 }} label={{ value: 'Sample #', position: 'insideBottom', offset: -5, fill: '#8b949e' }} />
            <YAxis domain={['auto', 'auto']} stroke="#8b949e" tick={{ fill: '#8b949e', fontSize: 11 }} />
            <Tooltip contentStyle={{ backgroundColor: '#161b22', borderColor: '#30363d', color: '#c9d1d9', borderRadius: '8px' }} formatter={(v) => `${Number(v).toFixed(2)}%`} />
            <ReferenceLine y={limits.ucl} stroke="#ff3366" strokeDasharray="6 3" label={{ value: 'UCL', fill: '#ff3366', position: 'right', fontSize: 10 }} />
            <ReferenceLine y={limits.cl} stroke="#00d2ff" strokeDasharray="3 3" label={{ value: 'CL', fill: '#00d2ff', position: 'right', fontSize: 10 }} />
            <ReferenceLine y={limits.lcl} stroke="#ff3366" strokeDasharray="6 3" label={{ value: 'LCL', fill: '#ff3366', position: 'right', fontSize: 10 }} />
            {threshold && (
              <ReferenceLine y={threshold} stroke="#ff7b00" strokeDasharray="3 3" label={{ value: 'Threshold', fill: '#ff7b00', position: 'left', fontSize: 10 }} />
            )}
            <Line type="monotone" dataKey="pol" stroke="#09b850" strokeWidth={2} dot={{ r: 3, fill: '#09b850' }} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </GlassCard>
  );
}
