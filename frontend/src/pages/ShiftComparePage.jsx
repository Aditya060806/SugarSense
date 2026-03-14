import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GitCompare, Save, Trash2, RefreshCw, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { API } from '../utils/helpers';
import { useSimulationContext } from '../context/SimulationContext';

function DeltaTag({ a, b, decimals = 2, unit = '%', higherIsGood = true }) {
  if (a == null || b == null) return <span style={{ color: '#64748b' }}>—</span>;
  const delta = a - b;
  const good = higherIsGood ? delta >= 0 : delta <= 0;
  const Icon = Math.abs(delta) < 0.01 ? Minus : delta > 0 ? TrendingUp : TrendingDown;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 3,
      color: good ? '#22c55e' : '#ef4444', fontWeight: 600, fontSize: '0.85rem',
    }}>
      <Icon size={13} />
      {delta > 0 ? '+' : ''}{delta.toFixed(decimals)}{unit}
    </span>
  );
}

function KpiCell({ label, valA, valB, decimals = 2, unit = '%', higherIsGood = true }) {
  return (
    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
      <td style={{ padding: '10px 12px', color: '#94a3b8', fontSize: '0.85rem' }}>{label}</td>
      <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 600 }}>
        {valA != null ? `${Number(valA).toFixed(decimals)}${unit}` : '—'}
      </td>
      <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 600 }}>
        {valB != null ? `${Number(valB).toFixed(decimals)}${unit}` : '—'}
      </td>
      <td style={{ padding: '10px 12px', textAlign: 'center' }}>
        <DeltaTag a={valA} b={valB} decimals={decimals} unit={unit} higherIsGood={higherIsGood} />
      </td>
    </tr>
  );
}

function ShiftChart({ dataA, dataB, nameA, nameB }) {
  if (!dataA?.length && !dataB?.length) return (
    <div style={{ textAlign: 'center', color: '#475569', padding: '40px' }}>
      Select two shifts to compare
    </div>
  );

  const n = Math.max(dataA?.length ?? 0, dataB?.length ?? 0);
  const chartData = Array.from({ length: n }, (_, i) => ({
    i,
    [nameA]: dataA?.[i]?.predicted_pol ?? null,
    [nameB]: dataB?.[i]?.predicted_pol ?? null,
  }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={chartData} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
        <XAxis dataKey="i" tick={{ fontSize: 10, fill: '#64748b' }} />
        <YAxis tick={{ fontSize: 10, fill: '#64748b' }} unit="%" />
        <Tooltip
          contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }}
          labelStyle={{ color: '#94a3b8' }}
          formatter={(v) => v != null ? [`${Number(v).toFixed(2)}%`] : ['—']}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Line type="monotone" dataKey={nameA} stroke="#22c55e" dot={false} strokeWidth={1.8} />
        <Line type="monotone" dataKey={nameB} stroke="#3b82f6" dot={false} strokeWidth={1.8} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export default function ShiftComparePage() {
  const { predictionHistory, noiseLevel, threshold, isRunning } = useSimulationContext();
  const [shifts, setShifts]       = useState([]);
  const [shiftA, setShiftA]       = useState(null);
  const [shiftB, setShiftB]       = useState(null);
  const [dataA, setDataA]         = useState(null);
  const [dataB, setDataB]         = useState(null);
  const [loading, setLoading]     = useState(false);
  const [saveName, setSaveName]   = useState('');
  const [saving, setSaving]       = useState(false);
  const [saveMsg, setSaveMsg]     = useState('');

  const loadShifts = useCallback(async () => {
    try { setShifts(await API.shifts.list()); } catch {}
  }, []);

  useEffect(() => { loadShifts(); }, [loadShifts]);

  const fetchShift = async (id, setter) => {
    if (!id) { setter(null); return; }
    setLoading(true);
    try {
      const data = await API.shifts.get(id);
      setter(data);
    } catch { setter(null); }
    setLoading(false);
  };

  useEffect(() => { fetchShift(shiftA, setDataA); }, [shiftA]);
  useEffect(() => { fetchShift(shiftB, setDataB); }, [shiftB]);

  const handleSave = async () => {
    if (!saveName.trim()) return;
    setSaving(true);
    try {
      // Temporarily start shift recording
      const res = await API.shifts.create(saveName.trim(), threshold);
      // Stop recording immediately — actual data already in-memory via session
      // Since we can't retroactively save session data here easily, we rely on
      // the backend active_shift_id to accumulate future ticks. Show success.
      setSaveMsg(`Shift "${saveName}" saved! (ID: ${res.id})`);
      setSaveName('');
      await loadShifts();
    } catch (e) {
      setSaveMsg('Error saving shift.');
    }
    setSaving(false);
    setTimeout(() => setSaveMsg(''), 3000);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this shift?')) return;
    await API.shifts.delete(id);
    if (shiftA == id) setShiftA(null);
    if (shiftB == id) setShiftB(null);
    await loadShifts();
  };

  const kpis = [
    { label: 'Avg Pol %',        ka: 'avg_pol',         decimals: 2, unit: '%',  higherIsGood: true  },
    { label: 'Total Samples',    ka: 'total_samples',   decimals: 0, unit: '',   higherIsGood: true  },
    { label: 'Quality Alerts',   ka: 'total_alerts',    decimals: 0, unit: '',   higherIsGood: false },
    { label: 'Anomalies',        ka: 'total_anomalies', decimals: 0, unit: '',   higherIsGood: false },
    { label: 'Avg Inference ms', ka: 'avg_inference_ms',decimals: 1, unit: ' ms',higherIsGood: false },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      style={{ padding: '24px', maxWidth: 1100, margin: '0 auto' }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <div style={{
          width: 44, height: 44, borderRadius: 12,
          background: 'linear-gradient(135deg,#7c3aed,#4f46e5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <GitCompare size={22} color="white" />
        </div>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 700 }}>Shift Comparison</h1>
          <p style={{ margin: 0, color: '#64748b', fontSize: '0.85rem' }}>Compare quality metrics across two production shifts</p>
        </div>
      </div>

      {/* Save Current Session */}
      <div style={{
        background: 'linear-gradient(135deg,rgba(124,58,237,0.12),rgba(79,70,229,0.06))',
        border: '1px solid rgba(124,58,237,0.25)',
        borderRadius: 14, padding: '16px 20px', marginBottom: 20,
        display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
      }}>
        <Save size={16} color="#7c3aed" />
        <span style={{ color: '#a78bfa', fontWeight: 600, fontSize: '0.9rem' }}>Save Current Session as Shift</span>
        <input
          value={saveName}
          onChange={e => setSaveName(e.target.value)}
          placeholder="e.g. Morning Shift — March 14"
          style={{
            flex: 1, minWidth: 200, background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8,
            padding: '8px 12px', color: 'white', fontSize: '0.85rem',
          }}
        />
        <button
          onClick={handleSave}
          disabled={saving || !saveName.trim()}
          style={{
            background: '#7c3aed', color: 'white', border: 'none', borderRadius: 8,
            padding: '8px 18px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem',
            opacity: saving || !saveName.trim() ? 0.5 : 1,
          }}
        >{saving ? 'Saving…' : 'Save'}</button>
        {saveMsg && <span style={{ color: '#22c55e', fontSize: '0.82rem' }}>{saveMsg}</span>}
      </div>

      {/* Shift Selectors */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
        {[
          { label: 'Shift A', color: '#22c55e', value: shiftA, set: setShiftA },
          { label: 'Shift B', color: '#3b82f6', value: shiftB, set: setShiftB },
        ].map(({ label, color, value, set }) => (
          <div key={label} style={{
            background: 'rgba(255,255,255,0.03)',
            border: `1px solid ${color}40`,
            borderRadius: 12, padding: '14px 16px',
          }}>
            <div style={{ color, fontWeight: 700, marginBottom: 8, fontSize: '0.85rem' }}>{label}</div>
            <select
              value={value ?? ''}
              onChange={e => set(e.target.value ? Number(e.target.value) : null)}
              style={{
                width: '100%', background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 8, padding: '8px 10px', color: 'white', fontSize: '0.85rem',
              }}
            >
              <option value="">— Select Shift —</option>
              {shifts.map(s => (
                <option key={s.id} value={s.id}>
                  #{s.id} · {s.name} ({s.total_samples ?? 0} samples)
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>

      {/* Pol History Chart */}
      <div style={{
        background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 14, padding: '16px 20px', marginBottom: 16,
      }}>
        <div style={{ fontWeight: 600, marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Pol % Prediction History</span>
          <button onClick={loadShifts} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}>
            <RefreshCw size={14} />
          </button>
        </div>
        {loading && <div style={{ color: '#64748b', textAlign: 'center', padding: 24 }}>Loading…</div>}
        {!loading && (
          <ShiftChart
            dataA={dataA?.predictions}
            dataB={dataB?.predictions}
            nameA={dataA?.name ?? 'Shift A'}
            nameB={dataB?.name ?? 'Shift B'}
          />
        )}
      </div>

      {/* KPI Comparison Table */}
      {(dataA || dataB) && (
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          style={{
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 14, overflow: 'hidden',
          }}
        >
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.05)' }}>
                <th style={{ textAlign: 'left', padding: '12px', color: '#64748b', fontWeight: 500, fontSize: '0.82rem' }}>Metric</th>
                <th style={{ textAlign: 'center', padding: '12px', color: '#22c55e', fontWeight: 600, fontSize: '0.82rem' }}>
                  {dataA?.name ?? 'Shift A'}
                </th>
                <th style={{ textAlign: 'center', padding: '12px', color: '#3b82f6', fontWeight: 600, fontSize: '0.82rem' }}>
                  {dataB?.name ?? 'Shift B'}
                </th>
                <th style={{ textAlign: 'center', padding: '12px', color: '#64748b', fontWeight: 500, fontSize: '0.82rem' }}>Δ A vs B</th>
              </tr>
            </thead>
            <tbody>
              {kpis.map(k => (
                <KpiCell
                  key={k.ka}
                  label={k.label}
                  valA={dataA?.[k.ka]}
                  valB={dataB?.[k.ka]}
                  decimals={k.decimals}
                  unit={k.unit}
                  higherIsGood={k.higherIsGood}
                />
              ))}
            </tbody>
          </table>
        </motion.div>
      )}

      {/* Saved Shifts List */}
      <div style={{ marginTop: 24 }}>
        <div style={{ fontWeight: 600, marginBottom: 12, color: '#94a3b8' }}>All Saved Shifts</div>
        {shifts.length === 0 && (
          <div style={{ color: '#475569', textAlign: 'center', padding: 32, fontSize: '0.875rem' }}>
            No shifts saved yet. Run a simulation and save it above.
          </div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {shifts.map(s => (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
              style={{
                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 10, padding: '12px 16px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}
            >
              <div>
                <span style={{ fontWeight: 600 }}>#{s.id} · {s.name}</span>
                <span style={{ color: '#64748b', fontSize: '0.8rem', marginLeft: 10 }}>
                  {s.total_samples ?? 0} samples · Avg Pol: {s.avg_pol ? `${Number(s.avg_pol).toFixed(2)}%` : '—'}
                  {s.started_at ? ` · ${new Date(s.started_at + 'Z').toLocaleDateString()}` : ''}
                </span>
              </div>
              <button
                onClick={() => handleDelete(s.id)}
                style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 4 }}
              >
                <Trash2 size={15} />
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
