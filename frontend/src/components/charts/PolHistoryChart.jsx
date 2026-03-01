import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { TrendingUp } from 'lucide-react';
import GlassCard from '../common/GlassCard';
import { useSimulationContext } from '../../context/SimulationContext';

export default function PolHistoryChart() {
  const { predictions, threshold } = useSimulationContext();

  return (
    <GlassCard className="chart-card" delay={0.2}>
      <h3 className="card-title"><TrendingUp size={20} /> Pol Flow — Predicted vs Actual</h3>
      <div className="chart-container">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={predictions}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="time" stroke="#94a3b8" tick={{ fill: '#64748b', fontSize: 11 }} />
            <YAxis domain={['auto', 'auto']} stroke="#94a3b8" tick={{ fill: '#64748b', fontSize: 11 }} />
            <Tooltip
              contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', color: '#1e293b', borderRadius: '10px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
              formatter={(value, name) => [`${Number(value).toFixed(2)}%`, name === 'predicted' ? 'Predicted' : 'Actual']}
            />
            <ReferenceLine
              y={threshold}
              label={{ position: 'top', value: `Threshold ${threshold}%`, fill: '#ef4444', fontSize: 11 }}
              stroke="#ef4444"
              strokeDasharray="3 3"
            />
            <Line type="monotone" dataKey="predicted" stroke="#16a34a" strokeWidth={2.5} dot={false} isAnimationActive={false} name="predicted" />
            <Line type="monotone" dataKey="actual" stroke="#94a3b8" strokeWidth={1.5} dot={false} strokeDasharray="5 3" isAnimationActive={false} name="actual" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </GlassCard>
  );
}
