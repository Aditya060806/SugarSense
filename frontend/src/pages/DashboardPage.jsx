import React from 'react';
import { motion } from 'framer-motion';
import KPIRow from '../components/dashboard/KPIRow';
import ControlPanel from '../components/dashboard/ControlPanel';
import PolMetric from '../components/dashboard/PolMetric';
import DigitalTwin from '../components/dashboard/DigitalTwin';
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
      <div className="page-header">
        <h1 className="page-title">Real-Time Dashboard</h1>
        <p className="page-subtitle">Live NIR spectroscopy monitoring, prediction & quality control</p>
      </div>

      <KPIRow />

      <div className="dashboard-grid-top">
        <ControlPanel />
        <PolMetric />
        <DigitalTwin />
      </div>

      <div className="dashboard-grid-bottom">
        <SpectrumChart />
        <PolHistoryChart />
      </div>
    </motion.div>
  );
}
