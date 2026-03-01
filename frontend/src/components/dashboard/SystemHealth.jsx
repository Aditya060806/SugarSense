import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useSimulationContext } from '../../context/SimulationContext';
import { API } from '../../utils/helpers';

export default function SystemHealth() {
    const { wsStatus } = useSimulationContext();
    const [modelLoaded, setModelLoaded] = useState(false);
    const [modelInfo, setModelInfo] = useState(null);

    useEffect(() => {
        API.modelInfo()
            .then(data => {
                if (!data.error) {
                    setModelLoaded(true);
                    setModelInfo(data);
                }
            })
            .catch(() => setModelLoaded(false));
    }, []);

    const items = [
        {
            label: 'Backend API',
            status: modelLoaded ? 'ok' : 'err',
            value: modelLoaded ? 'Healthy' : 'Unreachable',
        },
        {
            label: 'WebSocket',
            status: wsStatus === 'connected' ? 'ok' : wsStatus === 'connecting' ? 'warn' : 'err',
            value: wsStatus === 'connected' ? 'Connected' : wsStatus === 'connecting' ? 'Connecting' : 'Disconnected',
        },
        {
            label: 'ML Model',
            status: modelLoaded ? 'ok' : 'err',
            value: modelInfo ? `PLS (${modelInfo.n_components} comp)` : 'Not Loaded',
        },
        {
            label: 'Anomaly Detector',
            status: modelLoaded ? 'ok' : 'err',
            value: modelLoaded ? 'Isolation Forest' : 'Not Loaded',
        },
    ];

    return (
        <motion.div
            className="system-health-bar"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.2 }}
        >
            {items.map((item, idx) => (
                <div className="health-item" key={item.label}>
                    <span className={`health-dot health-dot--${item.status}`} />
                    <span className="health-label">{item.label}</span>
                    <span className="health-value">{item.value}</span>
                </div>
            ))}
        </motion.div>
    );
}
