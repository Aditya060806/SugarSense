import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import ModelMetrics from '../components/analytics/ModelMetrics';
import PreprocessingViz from '../components/analytics/PreprocessingViz';
import WavelengthImportance from '../components/analytics/WavelengthImportance';
import { ResidualChart, ErrorDistribution } from '../components/charts/ResidualChart';
import { API } from '../utils/helpers';

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
};

export default function AnalyticsPage() {
  const [historyData, setHistoryData] = useState({ predicted: [], actual: [], residuals: [] });

  useEffect(() => {
    API.predictionsHistory()
      .then(data => setHistoryData(data))
      .catch(err => console.error('Failed to load prediction history:', err));
  }, []);

  return (
    <motion.div className="page" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.3 }}>
      <div className="page-header">
        <h1 className="page-title">Model Analytics</h1>
        <p className="page-subtitle">PLS model performance, spectral preprocessing pipeline & wavelength importance analysis</p>
      </div>

      <ModelMetrics />

      <PreprocessingViz />

      <WavelengthImportance />

      <div className="analytics-grid">
        <ResidualChart predicted={historyData.predicted} actual={historyData.actual} />
        <ErrorDistribution predicted={historyData.predicted} actual={historyData.actual} />
      </div>
    </motion.div>
  );
}
