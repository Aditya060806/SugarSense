import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Legend } from 'recharts';
import { TrendingUp } from 'lucide-react';
import GlassCard from '../common/GlassCard';
import { useSimulationContext } from '../../context/SimulationContext';

function computeMA(data, key, window) {
  return data.map((_, i) => {
    if (i < window - 1) return null;
    let sum = 0;
    for (let j = i - window + 1; j <= i; j++) sum += data[j][key];
    return sum / window;
  });
}

export default function PolHistoryChart() {
  const { predictions, threshold } = useSimulationContext();

  const enriched = predictions.map((p, i) => ({
    ...p,
    ma5: null,
    ma10: null,
  }));

  const ma5 = computeMA(predictions, 'predicted', 5);
  const ma10 = computeMA(predictions, 'predicted', 10);
  enriched.forEach((p, i) => {
    p.ma5 = ma5[i];
    p.ma10 = ma10[i];
  });

  return (
    <GlassCard className="chart-card" delay={0.2}>
      <h3 className="card-title"><TrendingUp size={20} /> Pol Flow — Predicted vs Actual</h3>
      <div className="chart-container">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={enriched}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="time" stroke="#94a3b8" tick={{ fill: '#64748b', fontSize: 11 }} />
            <YAxis domain={['auto', 'auto']} stroke="#94a3b8" tick={{ fill: '#64748b', fontSize: 11 }} />
            <Tooltip
              contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', color: '#1e293b', borderRadius: '10px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
              formatter={(value, name) => {
                if (value === null) return ['-', name];
                const label = { predicted: 'Predicted', actual: 'Actual', ma5: 'MA-5', ma10: 'MA-10' }[name] || name;
                return [`${Number(value).toFixed(2)}%`, label];
              }}
            />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <ReferenceLine
              y={threshold}
              label={{ position: 'top', value: `Threshold ${threshold}%`, fill: '#ef4444', fontSize: 11 }}
              stroke="#ef4444"
              strokeDasharray="3 3"
            />
            <Line type="monotone" dataKey="predicted" stroke="#16a34a" strokeWidth={2.5} dot={false} isAnimationActive={false} name="predicted" />
            <Line type="monotone" dataKey="actual" stroke="#94a3b8" strokeWidth={1.5} dot={false} strokeDasharray="5 3" isAnimationActive={false} name="actual" />
            <Line type="monotone" dataKey="ma5" stroke="#0891b2" strokeWidth={1.5} dot={false} isAnimationActive={false} name="ma5" connectNulls />
            <Line type="monotone" dataKey="ma10" stroke="#8b5cf6" strokeWidth={1.5} dot={false} isAnimationActive={false} name="ma10" connectNulls />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </GlassCard>
  );
}
