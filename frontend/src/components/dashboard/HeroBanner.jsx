import React from 'react';
import { motion } from 'framer-motion';
import { Leaf, Wifi, WifiOff, Activity, Clock, Layers } from 'lucide-react';
import { useSimulationContext } from '../../context/SimulationContext';

const StatCard = ({ icon: Icon, value, label, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] }}
    whileHover={{ y: -2, boxShadow: '0 12px 24px -10px rgba(0, 0, 0, 0.08)' }}
    style={{
      background: '#ffffff',
      border: '1px solid #e2e8f0',
      borderRadius: '16px',
      padding: '20px 24px',
      minWidth: '150px',
      display: 'flex',
      flexDirection: 'column',
      gap: '14px',
      boxShadow: '0 4px 12px -6px rgba(0, 0, 0, 0.04)',
      cursor: 'default',
      position: 'relative'
    }}
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <div style={{
        width: '28px', height: '28px', borderRadius: '8px',
        background: 'rgba(16, 185, 129, 0.1)',
        display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}>
        <Icon size={14} color="#059669" />
      </div>
      <span style={{ 
        fontSize: '0.75rem', 
        fontWeight: 600, 
        color: '#64748b', 
        textTransform: 'uppercase', 
        letterSpacing: '0.05em' 
      }}>
        {label}
      </span>
    </div>
    
    <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
      <span style={{ 
        fontSize: '2rem', 
        fontWeight: '800', 
        color: '#0f172a', 
        letterSpacing: '-0.02em', 
        lineHeight: 1 
      }}>
        {value.toString().replace(/[^0-9.-]/g, '')}
      </span>
      {value.toString().replace(/[0-9.-]/g, '') && (
        <span style={{ fontSize: '1rem', color: '#94a3b8', fontWeight: 600 }}>
          {value.toString().replace(/[0-9.-]/g, '')}
        </span>
      )}
    </div>
  </motion.div>
);

export default function HeroBanner() {
  const { wsStatus, kpis } = useSimulationContext();
  const isConnected = wsStatus === 'connected';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      style={{
        position: 'relative',
        background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)', // Ultra-clean light gradient
        borderRadius: '24px',
        padding: '48px 56px',
        marginBottom: '32px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 20px 40px -20px rgba(15, 23, 42, 0.05), inset 0 2px 0 rgba(255,255,255,0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        color: '#0f172a',
        overflow: 'hidden'
      }}
    >
      {/* Subtle Light Mode Background Elements */}
      <div style={{
        position: 'absolute', top: '-20%', right: '-5%',
        width: '600px', height: '600px', pointerEvents: 'none',
        background: 'radial-gradient(circle, rgba(16, 185, 129, 0.03) 0%, transparent 60%)',
        borderRadius: '50%', zIndex: 0
      }} />

      <div style={{ position: 'relative', zIndex: 1, flex: 1, maxWidth: '650px' }}>
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: 'easeOut' }}
          style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}
        >
          <img 
            src="/SugarSense_slant.svg" 
            alt="SugarSense Logo" 
            style={{ width: '46px', height: '46px', objectFit: 'contain', filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.1))' }} 
          />
          <h1 style={{
            fontSize: '2.5rem', fontWeight: 800, margin: 0,
            color: '#0f172a',
            letterSpacing: '-0.03em',
            lineHeight: 1
          }}>
            SugarSense
          </h1>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2, ease: 'easeOut' }}
          style={{
            fontSize: '1.05rem', lineHeight: 1.6, color: '#475569',
            margin: '0 0 36px 0', fontWeight: 400,
            maxWidth: '560px'
          }}
        >
          Real-time NIR spectroscopy engine for non-invasive sugarcane Pol prediction.
          Monitor quality, detect anomalies, and optimize mill throughput with industrial-grade precision.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3, ease: 'easeOut' }}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '10px',
            background: isConnected ? '#ecfdf5' : '#fef2f2',
            border: `1px solid ${isConnected ? '#a7f3d0' : '#fecaca'}`,
            padding: '8px 16px', borderRadius: '10px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
          }}
        >
          <span style={{
            width: '8px', height: '8px', borderRadius: '50%',
            background: isConnected ? '#10b981' : '#ef4444',
            boxShadow: `0 0 10px ${isConnected ? '#34d399' : '#fca5a5'}`
          }} />
          <span style={{ 
            fontSize: '0.8rem', fontWeight: 700, 
            color: isConnected ? '#065f46' : '#991b1b',
            letterSpacing: '0.03em', textTransform: 'uppercase'
          }}>
            {isConnected ? 'Live Telemetry Active' : (wsStatus === 'connecting' ? 'Establishing Link...' : 'Telemetry Offline')}
          </span>
        </motion.div>
      </div>

      <div style={{ display: 'flex', gap: '20px', position: 'relative', zIndex: 1 }}>
        <StatCard delay={0.2} icon={Layers} label="Samples" value={kpis.totalSamples} />
        <StatCard delay={0.3} icon={Activity} label="Avg Pol" value={kpis.avgPol > 0 ? kpis.avgPol.toFixed(1) + '%' : '--'} />
        <StatCard delay={0.4} icon={Clock} label="Latency" value={kpis.avgInferenceMs > 0 ? kpis.avgInferenceMs.toFixed(0) + 'ms' : '--'} />
      </div>
    </motion.div>
  );
}
