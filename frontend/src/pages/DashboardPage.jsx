import React from 'react';
import { motion } from 'framer-motion';
import HeroBanner from '../components/dashboard/HeroBanner';
import KPIRow from '../components/dashboard/KPIRow';
import QuickActions from '../components/dashboard/QuickActions';
import ControlPanel from '../components/dashboard/ControlPanel';
import PolMetric from '../components/dashboard/PolMetric';
import DigitalTwin from '../components/dashboard/DigitalTwin';
import SystemHealth from '../components/dashboard/SystemHealth';
import ROICalculator from '../components/dashboard/ROICalculator';
import SpectrumChart from '../components/charts/SpectrumChart';
import PolHistoryChart from '../components/charts/PolHistoryChart';

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
};

export default function DashboardPage() {
  return (
    <motion.div className="page" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.3 }}>
      <HeroBanner />

      <KPIRow />

      <QuickActions />

      <div className="dashboard-grid-top">
        <ControlPanel />
        <PolMetric />
        <DigitalTwin />
      </div>

      <SystemHealth />

      <ROICalculator />

      <div className="dashboard-grid-bottom">
        <SpectrumChart />
        <PolHistoryChart />
      </div>
    </motion.div>
  );
}
