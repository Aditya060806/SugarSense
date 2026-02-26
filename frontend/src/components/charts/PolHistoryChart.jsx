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
            <CartesianGrid strokeDasharray="3 3" stroke="#21262d" />
            <XAxis dataKey="time" stroke="#8b949e" tick={{ fill: '#8b949e', fontSize: 11 }} />
            <YAxis domain={['auto', 'auto']} stroke="#8b949e" tick={{ fill: '#8b949e', fontSize: 11 }} />
            <Tooltip
              contentStyle={{ backgroundColor: '#161b22', borderColor: '#30363d', color: '#c9d1d9', borderRadius: '8px' }}
              formatter={(value, name) => [`${Number(value).toFixed(2)}%`, name === 'predicted' ? 'Predicted' : 'Actual']}
            />
            <ReferenceLine
              y={threshold}
              label={{ position: 'top', value: `Threshold ${threshold}%`, fill: '#ff3366', fontSize: 11 }}
              stroke="#ff3366"
              strokeDasharray="3 3"
            />
            <Line type="monotone" dataKey="predicted" stroke="#09b850" strokeWidth={2.5} dot={false} isAnimationActive={false} name="predicted" />
            <Line type="monotone" dataKey="actual" stroke="rgba(255,255,255,0.5)" strokeWidth={1.5} dot={false} strokeDasharray="5 3" isAnimationActive={false} name="actual" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </GlassCard>
  );
}
