import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Flame } from 'lucide-react';
import GlassCard from '../common/GlassCard';
import { API } from '../../utils/helpers';

export default function WavelengthImportance() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.plsLoadings()
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading || !data) {
    return (
      <GlassCard className="chart-card" delay={0.2}>
        <h3 className="card-title"><Flame size={20} /> Wavelength Importance</h3>
        <p className="chart-empty">Loading PLS loadings...</p>
      </GlassCard>
    );
  }

  const step = Math.max(1, Math.floor(data.wavelengths.length / 60));
  const chartData = data.wavelengths
    .filter((_, i) => i % step === 0)
    .map((wv, idx) => {
      const origIdx = idx * step;
      return {
        wv: Math.round(wv),
        coeff: data.coefficients[origIdx],
        absCoeff: data.abs_coefficients[origIdx],
      };
    });

  const maxAbs = Math.max(...chartData.map(d => d.absCoeff));

  return (
    <GlassCard className="chart-card" delay={0.2}>
      <h3 className="card-title"><Flame size={20} /> Wavelength Importance (PLS Coefficients)</h3>
      <p className="chart-subtitle">Higher absolute coefficients indicate wavelengths most predictive of sugar content</p>
      <div className="chart-container" style={{ height: 280 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis
              dataKey="wv"
              stroke="#94a3b8"
              tick={{ fill: '#64748b', fontSize: 9 }}
              label={{ value: 'Wavelength (nm)', position: 'insideBottom', offset: -5, fill: '#64748b', fontSize: 11 }}
            />
            <YAxis
              stroke="#94a3b8"
              tick={{ fill: '#64748b', fontSize: 10 }}
              label={{ value: 'Coefficient', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 11 }}
            />
            <Tooltip
              contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', color: '#1e293b', borderRadius: '10px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
              labelFormatter={v => `${v} nm`}
              formatter={(v) => [Number(v).toFixed(6), 'Coefficient']}
            />
            <Bar dataKey="coeff" radius={[2, 2, 0, 0]}>
              {chartData.map((entry, index) => {
                const intensity = Math.min(1, entry.absCoeff / (maxAbs * 0.5));
                const color = entry.coeff >= 0
                  ? `rgba(22, 163, 74, ${0.3 + 0.7 * intensity})`
                  : `rgba(239, 68, 68, ${0.3 + 0.7 * intensity})`;
                return <Cell key={index} fill={color} />;
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </GlassCard>
  );
}
