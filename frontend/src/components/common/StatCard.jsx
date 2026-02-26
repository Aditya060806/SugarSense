import React from 'react';
import { motion } from 'framer-motion';

export default function StatCard({ icon: Icon, label, value, unit = '', color = 'var(--accent-blue)', delay = 0 }) {
  return (
    <motion.div
      className="stat-card"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay }}
    >
      <div className="stat-card-icon" style={{ color }}>
        {Icon && <Icon size={22} />}
      </div>
      <div className="stat-card-body">
        <span className="stat-card-value" style={{ color }}>
          {value}{unit && <span className="stat-card-unit">{unit}</span>}
        </span>
        <span className="stat-card-label">{label}</span>
      </div>
    </motion.div>
  );
}
