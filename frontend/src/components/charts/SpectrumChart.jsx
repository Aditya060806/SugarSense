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
            <CartesianGrid strokeDasharray="3 3" stroke="#21262d" />
            <XAxis
              dataKey="wavelength"
              stroke="#8b949e"
              tick={{ fill: '#8b949e', fontSize: 11 }}
              label={{ value: 'Wavelength (nm)', position: 'insideBottom', offset: -5, fill: '#8b949e', fontSize: 11 }}
            />
            <YAxis
              dataKey="absorbance"
              stroke="#8b949e"
              tick={{ fill: '#8b949e', fontSize: 11 }}
              domain={['auto', 'auto']}
              label={{ value: 'Absorbance', angle: -90, position: 'insideLeft', fill: '#8b949e', fontSize: 11 }}
            />
            <Tooltip
              contentStyle={{ backgroundColor: '#161b22', borderColor: '#30363d', color: '#c9d1d9', borderRadius: '8px' }}
              labelFormatter={(v) => `${v} nm`}
            />
            <Line type="monotone" dataKey="absorbance" stroke="#00d2ff" dot={false} strokeWidth={2} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </GlassCard>
  );
}
