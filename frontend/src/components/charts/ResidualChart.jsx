import React from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, ScatterChart, Scatter, Cell } from 'recharts';
import GlassCard from '../common/GlassCard';
import { GitCompare, BarChart3 } from 'lucide-react';

export function ResidualChart({ predicted = [], actual = [] }) {
  const data = predicted.map((p, i) => ({
    index: i + 1,
    residual: p - (actual[i] || 0),
  }));

  return (
    <GlassCard className="chart-card" delay={0.15}>
      <h3 className="card-title"><GitCompare size={20} /> Prediction Residuals</h3>
      <div className="chart-container" style={{ height: 250 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#21262d" />
            <XAxis dataKey="index" stroke="#8b949e" tick={{ fill: '#8b949e', fontSize: 11 }} label={{ value: 'Sample', position: 'insideBottom', offset: -5, fill: '#8b949e' }} />
            <YAxis stroke="#8b949e" tick={{ fill: '#8b949e', fontSize: 11 }} label={{ value: 'Residual', angle: -90, position: 'insideLeft', fill: '#8b949e' }} />
            <Tooltip contentStyle={{ backgroundColor: '#161b22', borderColor: '#30363d', color: '#c9d1d9', borderRadius: '8px' }} formatter={(v) => `${Number(v).toFixed(4)}`} />
            <ReferenceLine y={0} stroke="#8b949e" strokeDasharray="3 3" />
            <Line type="monotone" dataKey="residual" stroke="#00d2ff" strokeWidth={2} dot={{ r: 3, fill: '#00d2ff' }} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </GlassCard>
  );
}

export function ErrorDistribution({ predicted = [], actual = [] }) {
  // Build histogram bins
  const residuals = predicted.map((p, i) => p - (actual[i] || 0));
  if (residuals.length < 2) {
    return (
      <GlassCard className="chart-card" delay={0.2}>
        <h3 className="card-title"><BarChart3 size={20} /> Error Distribution</h3>
        <p className="chart-empty">Waiting for data...</p>
      </GlassCard>
    );
  }

  const min = Math.min(...residuals);
  const max = Math.max(...residuals);
  const binCount = Math.max(8, Math.min(20, Math.ceil(Math.sqrt(residuals.length))));
  const binWidth = (max - min) / binCount || 0.1;
  const bins = Array.from({ length: binCount }, (_, i) => ({
    range: (min + i * binWidth).toFixed(3),
    rangeEnd: (min + (i + 1) * binWidth).toFixed(3),
    count: 0,
  }));

  residuals.forEach(r => {
    let idx = Math.floor((r - min) / binWidth);
    if (idx >= binCount) idx = binCount - 1;
    if (idx < 0) idx = 0;
    bins[idx].count += 1;
  });

  return (
    <GlassCard className="chart-card" delay={0.2}>
      <h3 className="card-title"><BarChart3 size={20} /> Error Distribution</h3>
      <div className="chart-container" style={{ height: 250 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={bins}>
            <CartesianGrid strokeDasharray="3 3" stroke="#21262d" />
            <XAxis dataKey="range" stroke="#8b949e" tick={{ fill: '#8b949e', fontSize: 9 }} angle={-30} />
            <YAxis stroke="#8b949e" tick={{ fill: '#8b949e', fontSize: 11 }} label={{ value: 'Count', angle: -90, position: 'insideLeft', fill: '#8b949e' }} />
            <Tooltip
              contentStyle={{ backgroundColor: '#161b22', borderColor: '#30363d', color: '#c9d1d9', borderRadius: '8px' }}
              labelFormatter={(v) => `Residual: ${v}`}
            />
            <Bar dataKey="count" fill="#09b850" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </GlassCard>
  );
}
