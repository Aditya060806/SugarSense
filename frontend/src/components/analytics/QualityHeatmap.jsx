import React, { useEffect, useState } from 'react';
import { Flame } from 'lucide-react';
import GlassCard from '../common/GlassCard';
import { API } from '../../utils/helpers';

export default function QualityHeatmap() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([API.predictionsHistory(), API.plsLoadings()])
            .then(([history, loadings]) => {
                setData({ history, loadings });
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    if (loading || !data) {
        return (
            <GlassCard delay={0.3}>
                <h3 className="card-title"><Flame size={20} /> Quality Heatmap</h3>
                <p className="chart-empty">Loading heatmap data...</p>
            </GlassCard>
        );
    }

    const { loadings } = data;
    const coeffs = loadings.abs_coefficients || [];
    const wavelengths = loadings.wavelengths || [];
    const maxCoeff = Math.max(...coeffs, 0.001);

    const step = Math.max(1, Math.floor(wavelengths.length / 50));
    const cells = wavelengths
        .filter((_, i) => i % step === 0)
        .map((wv, idx) => {
            const origIdx = idx * step;
            const intensity = coeffs[origIdx] / maxCoeff;
            return { wv: Math.round(wv), intensity, coeff: coeffs[origIdx] };
        });

    const getColor = (intensity) => {
        if (intensity > 0.7) return '#16a34a';
        if (intensity > 0.4) return '#f59e0b';
        if (intensity > 0.2) return '#fb923c';
        return '#e2e8f0';
    };

    return (
        <GlassCard delay={0.3}>
            <h3 className="card-title"><Flame size={20} /> Spectral Contribution Heatmap</h3>
            <p className="chart-subtitle">Brighter regions indicate wavelengths with higher predictive contribution to Pol estimation</p>

            <div style={{ display: 'flex', gap: 2, alignItems: 'flex-end', height: 120, padding: '0.5rem 0', marginBottom: '0.75rem' }}>
                {cells.map((cell, idx) => (
                    <div
                        key={idx}
                        title={`${cell.wv} nm — Coefficient: ${cell.coeff.toFixed(4)}`}
                        style={{
                            flex: 1,
                            height: `${Math.max(8, cell.intensity * 100)}%`,
                            backgroundColor: getColor(cell.intensity),
                            borderRadius: '3px 3px 0 0',
                            opacity: 0.4 + cell.intensity * 0.6,
                            transition: 'all 0.2s ease',
                            cursor: 'pointer',
                        }}
                        onMouseEnter={(e) => { e.target.style.opacity = 1; e.target.style.transform = 'scaleY(1.1)'; }}
                        onMouseLeave={(e) => { e.target.style.opacity = 0.4 + cell.intensity * 0.6; e.target.style.transform = 'scaleY(1)'; }}
                    />
                ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#94a3b8' }}>
                <span>{wavelengths[0]} nm</span>
                <span>{wavelengths[Math.floor(wavelengths.length / 2)]} nm</span>
                <span>{wavelengths[wavelengths.length - 1]} nm</span>
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
                {[{ color: '#16a34a', label: 'High Impact' }, { color: '#f59e0b', label: 'Medium' }, { color: '#fb923c', label: 'Low-Medium' }, { color: '#e2e8f0', label: 'Minimal' }].map(item => (
                    <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', color: '#64748b' }}>
                        <div style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: item.color }} />
                        {item.label}
                    </div>
                ))}
            </div>
        </GlassCard>
    );
}
