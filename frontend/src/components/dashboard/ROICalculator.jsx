import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { IndianRupee, Clock, TrendingUp, Zap } from 'lucide-react';
import GlassCard from '../common/GlassCard';
import { API } from '../../utils/helpers';
import { useSimulationContext } from '../../context/SimulationContext';

function AnimatedCounter({ value, prefix = '', suffix = '', color }) {
    const [display, setDisplay] = useState(0);

    useEffect(() => {
        const target = Number(value) || 0;
        if (target === display) return;
        const step = (target - display) / 15;
        const timer = setInterval(() => {
            setDisplay(prev => {
                const next = prev + step;
                if (Math.abs(next - target) < Math.abs(step)) {
                    clearInterval(timer);
                    return target;
                }
                return next;
            });
        }, 30);
        return () => clearInterval(timer);
    }, [value]);

    const formatted = display >= 10000000
        ? `${(display / 10000000).toFixed(1)} Cr`
        : display >= 100000
            ? `${(display / 100000).toFixed(1)} L`
            : display >= 1000
                ? `${(display / 1000).toFixed(1)}k`
                : Number.isInteger(display) ? display.toString() : display.toFixed(1);

    return (
        <span style={{ color, fontSize: '1.8rem', fontWeight: 800, lineHeight: 1.2 }}>
            {prefix}{formatted}{suffix}
        </span>
    );
}

export default function ROICalculator() {
    const { kpis, isRunning } = useSimulationContext();
    const [roi, setRoi] = useState(null);

    useEffect(() => {
        if (kpis.totalSamples === 0 && !isRunning) return;
        const interval = setInterval(() => {
            API.roi().then(setRoi).catch(() => { });
        }, 2000);
        API.roi().then(setRoi).catch(() => { });
        return () => clearInterval(interval);
    }, [kpis.totalSamples, isRunning]);

    const cards = [
        {
            icon: IndianRupee,
            label: 'Lab Cost Savings',
            value: roi?.money_saved_inr || 0,
            prefix: '₹',
            suffix: '',
            color: '#16a34a',
            bg: 'rgba(22, 163, 74, 0.08)',
            desc: `${roi?.samples_analyzed || 0} lab tests replaced @ ₹${(roi?.cost_per_lab_test || 1250).toLocaleString('en-IN')}/test`,
        },
        {
            icon: Clock,
            label: 'Time Saved',
            value: roi?.time_saved_hours || 0,
            prefix: '',
            suffix: 'h',
            color: '#0891b2',
            bg: 'rgba(8, 145, 178, 0.08)',
            desc: 'vs traditional 3-hour lab polarimetry',
        },
        {
            icon: TrendingUp,
            label: 'Yield Improvement',
            value: roi?.yield_improvement_inr || 0,
            prefix: '₹',
            suffix: '',
            color: '#8b5cf6',
            bg: 'rgba(139, 92, 246, 0.08)',
            desc: '0.2% recovery improvement per measurement',
        },
        {
            icon: Zap,
            label: 'Annual Projection',
            value: roi?.annual_projection_inr || 0,
            prefix: '₹',
            suffix: '',
            color: '#f59e0b',
            bg: 'rgba(245, 158, 11, 0.08)',
            desc: 'Extrapolated annual savings at current rate',
        },
    ];

    return (
        <GlassCard delay={0.1}>
            <h3 className="card-title"><IndianRupee size={20} /> ROI & Cost Savings — NIR vs Lab Testing</h3>
            <div className="kpi-row">
                {cards.map((card, idx) => (
                    <motion.div
                        key={card.label}
                        className="stat-card"
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: idx * 0.06 }}
                        style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 8 }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%' }}>
                            <div style={{ background: card.bg, color: card.color, borderRadius: 10, padding: 8, display: 'flex' }}>
                                <card.icon size={20} />
                            </div>
                            <span className="stat-card-label" style={{ fontSize: '0.82rem' }}>{card.label}</span>
                        </div>
                        <AnimatedCounter value={card.value} prefix={card.prefix} suffix={card.suffix} color={card.color} />
                        <span style={{ fontSize: '0.72rem', color: '#94a3b8', lineHeight: 1.3 }}>{card.desc}</span>
                    </motion.div>
                ))}
            </div>
        </GlassCard>
    );
}
