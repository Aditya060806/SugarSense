import React from 'react';
import { motion } from 'framer-motion';
import { Play, BarChart3, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSimulationContext } from '../../context/SimulationContext';
import toast from 'react-hot-toast';

export default function QuickActions() {
    const navigate = useNavigate();
    const { isRunning, setIsRunning, allPredictions, threshold } = useSimulationContext();

    const downloadReport = async () => {
        if (allPredictions.length === 0) {
            toast.error('No data collected yet! Run simulation first.');
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
            toast.success('Shift report downloaded!');
        } catch {
            toast.error('Report generation failed');
        }
    };

    const actions = [
        {
            icon: Play,
            title: isRunning ? 'Simulation Running' : 'Start Simulation',
            desc: isRunning ? 'Live data is streaming from the NIR sensor' : 'Begin real-time NIR sensor data streaming',
            color: '#16a34a',
            bg: 'rgba(22, 163, 74, 0.08)',
            onClick: () => { if (!isRunning) setIsRunning(true); },
        },
        {
            icon: BarChart3,
            title: 'View Analytics',
            desc: 'Explore model performance and spectral analysis',
            color: '#0891b2',
            bg: 'rgba(8, 145, 178, 0.08)',
            onClick: () => navigate('/analytics'),
        },
        {
            icon: FileText,
            title: 'Download Report',
            desc: 'Export a PDF shift report with session data',
            color: '#8b5cf6',
            bg: 'rgba(139, 92, 246, 0.08)',
            onClick: downloadReport,
        },
    ];

    return (
        <div className="quick-actions-grid">
            {actions.map((action, idx) => (
                <motion.div
                    key={action.title}
                    className="quick-action-card"
                    onClick={action.onClick}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: idx * 0.07 }}
                    whileHover={{ scale: 1.01 }}
                >
                    <div className="quick-action-icon" style={{ background: action.bg, color: action.color }}>
                        <action.icon size={22} />
                    </div>
                    <div className="quick-action-body">
                        <span className="quick-action-title">{action.title}</span>
                        <span className="quick-action-desc">{action.desc}</span>
                    </div>
                </motion.div>
            ))}
        </div>
    );
}
