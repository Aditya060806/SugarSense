import React from 'react';
import { motion } from 'framer-motion';
import { FileText, Download, FileJson, FileSpreadsheet } from 'lucide-react';
import { useSimulationContext } from '../context/SimulationContext';
import GlassCard from '../components/common/GlassCard';
import { downloadCSV, downloadJSON } from '../utils/helpers';
import toast from 'react-hot-toast';

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
};

export default function ReportsPage() {
  const { allPredictions, threshold, kpis } = useSimulationContext();

  const downloadReport = async () => {
    if (allPredictions.length === 0) {
      toast.error('No data collected! Run the simulation first.');
      return;
    }
    const data = {
      timestamp: allPredictions.map(p => p.timestamp),
      actual_pol: allPredictions.map(p => p.actual),
      predicted_pol: allPredictions.map(p => p.predicted),
      threshold,
    };
    try {
      const response = await fetch('http://localhost:8000/api/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'sugarsense_shift_report.pdf';
      document.body.appendChild(a);
      a.click();
      a.remove();
      toast.success('PDF report downloaded');
    } catch {
      toast.error('Report generation failed');
    }
  };

  const hasData = allPredictions.length > 0;

  return (
    <motion.div className="page" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.3 }}>
      <div className="page-header">
        <h1 className="page-title">Reports & Export</h1>
        <p className="page-subtitle">Generate shift reports and export session data</p>
      </div>

      {/* Session Summary */}
      <GlassCard delay={0}>
        <h3 className="card-title"><FileText size={20} /> Current Session Summary</h3>
        {hasData ? (
          <div className="report-summary">
            <div className="report-row"><span>Total Samples</span><span>{kpis.totalSamples}</span></div>
            <div className="report-row"><span>Average Predicted Pol</span><span>{kpis.avgPol.toFixed(2)}%</span></div>
            <div className="report-row"><span>Alert Threshold</span><span>{threshold}%</span></div>
            <div className="report-row"><span>Total Alerts</span><span>{kpis.totalAlerts}</span></div>
            <div className="report-row"><span>Alert Rate</span><span>{kpis.alertRate.toFixed(1)}%</span></div>
            <div className="report-row"><span>Total Anomalies</span><span>{kpis.totalAnomalies}</span></div>
            <div className="report-row"><span>Avg Inference Time</span><span>{kpis.avgInferenceMs.toFixed(1)} ms</span></div>
          </div>
        ) : (
          <p className="chart-empty">No data collected yet. Start the simulation from the Dashboard.</p>
        )}
      </GlassCard>

      {/* Export Actions */}
      <GlassCard delay={0.1}>
        <h3 className="card-title"><Download size={20} /> Export Data</h3>
        <div className="export-buttons">
          <button className="btn-export btn-pdf" onClick={downloadReport} disabled={!hasData}>
            <FileText size={20} />
            <div>
              <strong>PDF Shift Report</strong>
              <span>Full formatted report for plant managers</span>
            </div>
          </button>

          <button className="btn-export btn-csv" onClick={() => { downloadCSV(allPredictions); toast.success('CSV downloaded'); }} disabled={!hasData}>
            <FileSpreadsheet size={20} />
            <div>
              <strong>CSV Data Export</strong>
              <span>Prediction data in spreadsheet format</span>
            </div>
          </button>

          <button className="btn-export btn-json" onClick={() => { downloadJSON(allPredictions); toast.success('JSON downloaded'); }} disabled={!hasData}>
            <FileJson size={20} />
            <div>
              <strong>JSON Data Export</strong>
              <span>Raw prediction data for integration</span>
            </div>
          </button>
        </div>
      </GlassCard>
    </motion.div>
  );
}
