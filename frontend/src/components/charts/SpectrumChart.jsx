import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity } from 'lucide-react';
import GlassCard from '../common/GlassCard';
import { useSimulationContext } from '../../context/SimulationContext';

export default function SpectrumChart() {
  const { currentSpectrum } = useSimulationContext();

  return (
    <GlassCard className="chart-card" delay={0.15}>
      <h3 className="card-title"><Activity size={20} /> Live NIR Spectrum</h3>
      <div className="chart-container">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={currentSpectrum}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis
              dataKey="wavelength"
              stroke="#94a3b8"
              tick={{ fill: '#64748b', fontSize: 11 }}
              label={{ value: 'Wavelength (nm)', position: 'insideBottom', offset: -5, fill: '#64748b', fontSize: 11 }}
            />
            <YAxis
              dataKey="absorbance"
              stroke="#94a3b8"
              tick={{ fill: '#64748b', fontSize: 11 }}
              domain={['auto', 'auto']}
              label={{ value: 'Absorbance', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 11 }}
            />
            <Tooltip
              contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', color: '#1e293b', borderRadius: '10px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
              labelFormatter={(v) => `${v} nm`}
            />
            <Line type="monotone" dataKey="absorbance" stroke="#0891b2" dot={false} strokeWidth={2} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </GlassCard>
  );
}
