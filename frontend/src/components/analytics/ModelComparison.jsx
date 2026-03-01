import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell } from 'recharts';
import { GitBranch } from 'lucide-react';
import GlassCard from '../common/GlassCard';
import { API } from '../../utils/helpers';

export default function ModelComparison() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        API.modelComparison()
            .then(d => { setData(d); setLoading(false); })
            .catch(() => setLoading(false));
    }, []);

    if (loading || !data || data.error) {
        return (
            <GlassCard className="chart-card" delay={0.25}>
                <h3 className="card-title"><GitBranch size={20} /> Model Comparison</h3>
                <p className="chart-empty">{loading ? 'Loading...' : 'Run trainer.py to generate both PLS and ANN models for comparison.'}</p>
            </GlassCard>
        );
    }

    const pls = data.pls;
    const ann = data.ann;

    if (!ann) {
        return (
            <GlassCard className="chart-card" delay={0.25}>
                <h3 className="card-title"><GitBranch size={20} /> Model Comparison</h3>
                <p className="chart-empty">ANN model not found. Re-run trainer.py to save both PLS and ANN models.</p>
            </GlassCard>
        );
    }

    const metrics = [
        { metric: 'R²', PLS: pls.r2, ANN: ann.r2, higher: true },
        { metric: 'RPD', PLS: pls.rpd, ANN: ann.rpd, higher: true },
        { metric: 'RMSE', PLS: pls.rmse, ANN: ann.rmse, higher: false },
        { metric: '|Bias|', PLS: Math.abs(pls.bias), ANN: Math.abs(ann.bias), higher: false },
    ];

    return (
        <GlassCard className="chart-card" delay={0.25}>
            <h3 className="card-title"><GitBranch size={20} /> PLS Regression vs Neural Network</h3>
            <p className="chart-subtitle">Side-by-side comparison on the same test dataset</p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
                <div style={{ background: 'rgba(22, 163, 74, 0.06)', borderRadius: 12, padding: '1rem', border: '1px solid rgba(22, 163, 74, 0.15)' }}>
                    <div style={{ fontSize: '0.78rem', color: '#64748b', marginBottom: 4 }}>PLS Regression</div>
                    <div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#16a34a' }}>R² = {pls.r2}</div>
                    <div style={{ fontSize: '0.78rem', color: '#64748b' }}>RMSE: {pls.rmse} | RPD: {pls.rpd}</div>
                </div>
                <div style={{ background: 'rgba(139, 92, 246, 0.06)', borderRadius: 12, padding: '1rem', border: '1px solid rgba(139, 92, 246, 0.15)' }}>
                    <div style={{ fontSize: '0.78rem', color: '#64748b', marginBottom: 4 }}>Neural Network (MLP)</div>
                    <div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#8b5cf6' }}>R² = {ann.r2}</div>
                    <div style={{ fontSize: '0.78rem', color: '#64748b' }}>RMSE: {ann.rmse} | RPD: {ann.rpd}</div>
                </div>
            </div>

            <div className="chart-container" style={{ height: 260 }}>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={metrics} barCategoryGap="25%">
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="metric" stroke="#94a3b8" tick={{ fill: '#64748b', fontSize: 12 }} />
                        <YAxis stroke="#94a3b8" tick={{ fill: '#64748b', fontSize: 11 }} />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', color: '#1e293b', borderRadius: '10px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                            formatter={(v, name) => [Number(v).toFixed(4), name]}
                        />
                        <Legend wrapperStyle={{ fontSize: 12 }} />
                        <Bar dataKey="PLS" fill="#16a34a" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="ANN" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </GlassCard>
    );
}
