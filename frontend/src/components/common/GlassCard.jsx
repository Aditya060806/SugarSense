import React from 'react';
import { motion } from 'framer-motion';

export default function GlassCard({ children, className = '', style = {}, delay = 0 }) {
  return (
    <motion.div
      className={`glass-card ${className}`}
      style={style}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
    >
      {children}
    </motion.div>
  );
}
