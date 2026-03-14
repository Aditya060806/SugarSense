import React from 'react';
import { motion } from 'framer-motion';
import { useSimulationContext } from '../../context/SimulationContext';

const PARAM_CONFIG = [
  {
    key: 'predicted_pol',
    label: 'Pol %',
    unit: '%',
    min: 0, max: 25,
    color: '#22c55e',
    gradient: 'linear-gradient(135deg, #16a34a22, #22c55e11)',
    border: '#22c55e40',
    good: v => v >= 13,
    desc: 'Total Sugar Content',
  },
  {
    key: 'brix',
    label: 'Brix %',
    unit: '%',
    min: 0, max: 30,
    color: '#3b82f6',
    gradient: 'linear-gradient(135deg, #1d4ed822, #3b82f611)',
    border: '#3b82f640',
    good: () => true,
    desc: 'Total Dissolved Solids',
  },
  {
    key: 'fibre',
    label: 'Fibre %',
    unit: '%',
    min: 0, max: 20,
    color: '#f59e0b',
    gradient: 'linear-gradient(135deg, #b4530922, #f59e0b11)',
    border: '#f59e0b40',
    good: v => v >= 10 && v <= 16,
    desc: 'Structural Fibre Content',
  },
  {
    key: 'purity',
    label: 'Purity %',
    unit: '%',
    min: 70, max: 100,
    color: '#a855f7',
    gradient: 'linear-gradient(135deg, #7e22ce22, #a855f711)',
    border: '#a855f740',
    good: v => v >= 82,
    desc: 'Juice Purity Index',
  },
];

function GaugeMini({ value, min, max, color }) {
  const pct = Math.max(0, Math.min(1, (value - min) / (max - min)));
  const r = 32;
  const circ = 2 * Math.PI * r;
  const dash = circ * 0.75; // 75% arc
  const offset = dash * (1 - pct);
  const startAngle = 135; // degrees

  return (
    <svg width="80" height="80" viewBox="0 0 80 80" style={{ display: 'block' }}>
      {/* bg arc */}
      <circle
        cx="40" cy="40" r={r}
        fill="none"
        stroke={`${color}33`}
        strokeWidth="6"
        strokeDasharray={`${dash} ${circ}`}
        strokeDashoffset="0"
        strokeLinecap="round"
        transform={`rotate(${startAngle} 40 40)`}
      />
      {/* value arc */}
      <circle
        cx="40" cy="40" r={r}
        fill="none"
        stroke={color}
        strokeWidth="6"
        strokeDasharray={`${dash} ${circ}`}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform={`rotate(${startAngle} 40 40)`}
        style={{ transition: 'stroke-dashoffset 0.5s ease' }}
      />
    </svg>
  );
}

export default function MultiParamCard() {
  const { latestData } = useSimulationContext();

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '12px',
        marginTop: '12px',
      }}
    >
      {PARAM_CONFIG.map((param) => {
        const raw = latestData?.[param.key];
        const value = raw != null ? Number(raw) : null;
        const isGood = value != null ? param.good(value) : true;

        return (
          <motion.div
            key={param.key}
            whileHover={{ scale: 1.02 }}
            style={{
              background: param.gradient,
              border: `1px solid ${param.border}`,
              borderRadius: '14px',
              padding: '14px 14px 10px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px',
              position: 'relative',
              overflow: 'hidden',
              backdropFilter: 'blur(8px)',
            }}
          >
            {/* status dot */}
            <span style={{
              position: 'absolute', top: 12, right: 12,
              width: 8, height: 8, borderRadius: '50%',
              background: value == null ? '#64748b' : isGood ? '#22c55e' : '#ef4444',
              boxShadow: `0 0 6px ${value == null ? '#64748b' : isGood ? '#22c55e' : '#ef4444'}`,
            }} />

            {/* mini gauge */}
            <div style={{ position: 'relative', width: 80, height: 80, marginBottom: 8, marginTop: 4 }}>
              <GaugeMini
                value={value ?? param.min}
                min={param.min}
                max={param.max}
                color={param.color}
              />
              <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.9rem', fontWeight: 800,
                color: value != null ? param.color : '#475569',
              }}>
                {value != null ? `${value.toFixed(1)}${param.unit}` : '—'}
              </div>
            </div>

            <div style={{ textAlign: 'center', lineHeight: 1.3 }}>
              <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {param.label}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                {param.desc}
              </div>
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
