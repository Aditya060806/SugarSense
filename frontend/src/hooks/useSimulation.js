import { useRef, useState, useCallback, useEffect } from 'react';
import { WS_URL, API } from '../utils/helpers';
import toast from 'react-hot-toast';

/**
 * Custom hook that manages the entire simulation lifecycle:
 * - WebSocket connection with auto-reconnect
 * - Prediction state (rolling window + all-time list)
 * - Session KPIs
 * - Spectrum data
 * - MQTT mock log
 */
export default function useSimulation() {
  // ── Controls ───────────────────────────────────────────
  const [isRunning, setIsRunning] = useState(false);
  const [noiseLevel, setNoiseLevel] = useState(2.0);
  const [threshold, setThreshold] = useState(13.0);

  // ── Connection ─────────────────────────────────────────
  const [wsStatus, setWsStatus] = useState('disconnected'); // connected | connecting | disconnected
  const ws = useRef(null);
  const reconnectTimer = useRef(null);
  const reconnectAttempt = useRef(0);

  // ── Data ───────────────────────────────────────────────
  const [wavelengths, setWavelengths] = useState([]);
  const [currentSpectrum, setCurrentSpectrum] = useState([]);
  const [predictions, setPredictions] = useState([]);       // rolling 50 for chart
  const [allPredictions, setAllPredictions] = useState([]); // full session for export/analytics
  const [latestData, setLatestData] = useState(null);
  const [logs, setLogs] = useState('');
  const [alertTimeline, setAlertTimeline] = useState([]);

  // ── KPIs ───────────────────────────────────────────────
  const [kpis, setKpis] = useState({
    totalSamples: 0,
    avgPol: 0,
    alertRate: 0,
    avgInferenceMs: 0,
    totalAlerts: 0,
    totalAnomalies: 0,
  });
  const kpiAccum = useRef({ n: 0, sumPol: 0, sumMs: 0, alerts: 0, anomalies: 0 });
  const sessionStart = useRef(null);

  // Use refs for values that the WS callback needs to read (avoids stale closures)
  const noiseLevelRef = useRef(noiseLevel);
  const thresholdRef = useRef(threshold);
  useEffect(() => { noiseLevelRef.current = noiseLevel; }, [noiseLevel]);
  useEffect(() => { thresholdRef.current = threshold; }, [threshold]);

  // ── Fetch wavelengths on mount ─────────────────────────
  useEffect(() => {
    API.config()
      .then(data => setWavelengths(data.wavelengths))
      .catch(err => console.error('Config fetch error:', err));
  }, []);

  // ── Payload handler ────────────────────────────────────
  const handlePayload = useCallback((data) => {
    setLatestData(data);

    // Spectrum chart data (flat array from backend)
    setCurrentSpectrum(prev => {
      if (!wavelengths.length) return prev;
      return wavelengths.map((wv, i) => ({
        wavelength: wv,
        absorbance: data.noisy_spectrum[i],
      }));
    });

    // Rolling predictions (50 window)
    setPredictions(prev => {
      const updated = [...prev, {
        time: prev.length,
        predicted: data.predicted_pol,
        actual: data.actual_pol,
      }];
      if (updated.length > 50) updated.shift();
      return updated.map((item, idx) => ({ ...item, time: idx }));
    });

    // Full session list
    setAllPredictions(prev => [...prev, {
      timestamp: data.timestamp,
      predicted: data.predicted_pol,
      actual: data.actual_pol,
      inference_ms: data.inference_ms,
      alert: data.alert,
      anomaly: data.anomaly,
      confidence: data.confidence || 0,
    }]);

    // Alert timeline
    if (data.alert || data.anomaly) {
      setAlertTimeline(prev => {
        const entry = {
          timestamp: data.timestamp,
          type: data.anomaly ? 'anomaly' : 'alert',
          pol: data.predicted_pol,
        };
        const updated = [entry, ...prev];
        return updated.slice(0, 50);
      });
    }

    // KPIs
    const acc = kpiAccum.current;
    acc.n += 1;
    acc.sumPol += data.predicted_pol;
    acc.sumMs += data.inference_ms;
    if (data.alert) acc.alerts += 1;
    if (data.anomaly) acc.anomalies += 1;

    setKpis({
      totalSamples: acc.n,
      avgPol: acc.sumPol / acc.n,
      alertRate: (acc.alerts / acc.n) * 100,
      avgInferenceMs: acc.sumMs / acc.n,
      totalAlerts: acc.alerts,
      totalAnomalies: acc.anomalies,
    });

    // MQTT mock log
    const mqttMsg = {
      id: 'NIR_01',
      pol: Number(data.predicted_pol.toFixed(2)),
      status: data.anomaly ? 'ERR_ANOMALY' : (data.alert ? 'ALERT' : 'OK'),
    };
    setLogs(prev => {
      const newLog = `PUB: topic/sugar/mill1\n${JSON.stringify(mqttMsg, null, 2)}\n\n` + prev;
      return newLog.substring(0, 1200);
    });
  }, [wavelengths]);

  // ── Send config tick ───────────────────────────────────
  const sendConfig = useCallback(() => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({
        noiseLevel: noiseLevelRef.current,
        threshold: thresholdRef.current,
      }));
    }
  }, []);

  // ── WebSocket lifecycle ────────────────────────────────
  const connect = useCallback(() => {
    if (ws.current && ws.current.readyState <= 1) return; // already open/connecting

    setWsStatus('connecting');
    const socket = new WebSocket(WS_URL);

    socket.onopen = () => {
      setWsStatus('connected');
      reconnectAttempt.current = 0;
      toast.success('Connected to NIR Sensor Backend', { id: 'ws-status' });
      sendConfig();
    };

    socket.onmessage = (event) => {
      const payload = JSON.parse(event.data);
      handlePayload(payload);
      // Schedule next tick
      setTimeout(sendConfig, 800);
    };

    socket.onclose = () => {
      setWsStatus('disconnected');
      if (isRunning) {
        // Auto-reconnect with exponential backoff
        const delay = Math.min(1000 * 2 ** reconnectAttempt.current, 10000);
        reconnectAttempt.current += 1;
        toast.error(`Connection lost. Retrying in ${delay / 1000}s...`, { id: 'ws-status' });
        reconnectTimer.current = setTimeout(connect, delay);
      }
    };

    socket.onerror = () => {
      socket.close();
    };

    ws.current = socket;
  }, [isRunning, handlePayload, sendConfig]);

  // ── Start / Stop ───────────────────────────────────────
  useEffect(() => {
    if (isRunning) {
      sessionStart.current = Date.now();
      connect();
    } else {
      clearTimeout(reconnectTimer.current);
      if (ws.current) {
        ws.current.onclose = null; // prevent auto-reconnect on intentional close
        ws.current.close();
        ws.current = null;
      }
      setWsStatus('disconnected');
    }
    return () => {
      clearTimeout(reconnectTimer.current);
      if (ws.current) {
        ws.current.onclose = null;
        ws.current.close();
        ws.current = null;
      }
    };
  }, [isRunning, connect]);

  // ── Reset session ──────────────────────────────────────
  const resetSession = useCallback(() => {
    setPredictions([]);
    setAllPredictions([]);
    setAlertTimeline([]);
    setLatestData(null);
    setLogs('');
    kpiAccum.current = { n: 0, sumPol: 0, sumMs: 0, alerts: 0, anomalies: 0 };
    setKpis({ totalSamples: 0, avgPol: 0, alertRate: 0, avgInferenceMs: 0, totalAlerts: 0, totalAnomalies: 0 });
  }, []);

  return {
    // Controls
    isRunning, setIsRunning,
    noiseLevel, setNoiseLevel,
    threshold, setThreshold,
    // Connection
    wsStatus,
    // Data
    wavelengths, currentSpectrum, predictions, allPredictions, latestData, logs, alertTimeline,
    // KPIs
    kpis,
    sessionStart: sessionStart.current,
    // Actions
    resetSession,
  };
}
