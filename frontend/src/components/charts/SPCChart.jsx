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
        <span className="spc-legend-item"><span className="spc-dot" style={{ background: '#16a34a' }} />Pol Values</span>
        <span className="spc-legend-item"><span className="spc-dot" style={{ background: '#0891b2' }} />Center Line (CL): {limits.cl.toFixed(2)}%</span>
        <span className="spc-legend-item"><span className="spc-dot" style={{ background: '#ef4444' }} />UCL/LCL (±3σ)</span>
      </div>
      <div className="chart-container" style={{ height: 300 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="sample" stroke="#94a3b8" tick={{ fill: '#64748b', fontSize: 11 }} label={{ value: 'Sample #', position: 'insideBottom', offset: -5, fill: '#64748b' }} />
            <YAxis domain={['auto', 'auto']} stroke="#94a3b8" tick={{ fill: '#64748b', fontSize: 11 }} />
            <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', color: '#1e293b', borderRadius: '10px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }} formatter={(v) => `${Number(v).toFixed(2)}%`} />
            <ReferenceLine y={limits.ucl} stroke="#ef4444" strokeDasharray="6 3" label={{ value: 'UCL', fill: '#ef4444', position: 'right', fontSize: 10 }} />
            <ReferenceLine y={limits.cl} stroke="#0891b2" strokeDasharray="3 3" label={{ value: 'CL', fill: '#0891b2', position: 'right', fontSize: 10 }} />
            <ReferenceLine y={limits.lcl} stroke="#ef4444" strokeDasharray="6 3" label={{ value: 'LCL', fill: '#ef4444', position: 'right', fontSize: 10 }} />
            {threshold && (
              <ReferenceLine y={threshold} stroke="#f59e0b" strokeDasharray="3 3" label={{ value: 'Threshold', fill: '#f59e0b', position: 'left', fontSize: 10 }} />
            )}
            <Line type="monotone" dataKey="pol" stroke="#16a34a" strokeWidth={2} dot={{ r: 3, fill: '#16a34a' }} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </GlassCard>
  );
}
