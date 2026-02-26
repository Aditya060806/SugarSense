import React from 'react';
import StatCard from '../common/StatCard';
import { Activity, TrendingUp, AlertTriangle, Zap } from 'lucide-react';
import { useSimulationContext } from '../../context/SimulationContext';

export default function KPIRow() {
  const { kpis } = useSimulationContext();

  return (
    <div className="kpi-row">
      <StatCard
        icon={Activity}
        label="Samples Processed"
        value={kpis.totalSamples}
        color="var(--accent-blue)"
        delay={0}
      />
      <StatCard
        icon={TrendingUp}
        label="Average Pol"
        value={kpis.avgPol > 0 ? kpis.avgPol.toFixed(2) : '--'}
        unit="%"
        color="var(--accent-green)"
        delay={0.05}
      />
      <StatCard
        icon={AlertTriangle}
        label="Alert Rate"
        value={kpis.alertRate > 0 ? kpis.alertRate.toFixed(1) : '0.0'}
        unit="%"
        color={kpis.alertRate > 10 ? 'var(--accent-red)' : 'var(--accent-orange)'}
        delay={0.1}
      />
      <StatCard
        icon={Zap}
        label="Avg Inference"
        value={kpis.avgInferenceMs > 0 ? kpis.avgInferenceMs.toFixed(1) : '--'}
        unit="ms"
        color="var(--accent-purple)"
        delay={0.15}
      />
    </div>
  );
}
