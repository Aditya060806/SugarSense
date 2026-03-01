<p align="center">
  <img src="https://img.shields.io/badge/SugarSense-NIR%20Real--Time%20Platform-16a34a?style=for-the-badge&logoColor=white" alt="SugarSense Badge" />
</p>

<h1 align="center">🌾 SugarSense</h1>
<p align="center"><strong>Precision AI for Cane Quality Assessment</strong></p>
<p align="center">
  Real-time, non-invasive sugar content prediction using Near-Infrared spectroscopy and machine learning — built for the modern sugar mill.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Python-FastAPI-009688?style=flat-square&logo=fastapi" />
  <img src="https://img.shields.io/badge/React_19-Vite-61DAFB?style=flat-square&logo=react" />
  <img src="https://img.shields.io/badge/ML-scikit--learn-F7931E?style=flat-square&logo=scikitlearn" />
  <img src="https://img.shields.io/badge/3D-Three.js-black?style=flat-square&logo=threedotjs" />
  <img src="https://img.shields.io/badge/WebSocket-Real--Time-8b5cf6?style=flat-square" />
</p>

---

## 🔍 The Problem

In traditional sugar mills, measuring **Pol (Total Sugar %)** in incoming sugarcane is slow, destructive, and happens hours after the cane has already been processed. Lab-based polarimetry requires physical sampling, juice extraction, and chemical analysis — introducing delays that make real-time quality control impossible.

**Result:** Mills cannot dynamically adjust processing parameters based on incoming cane quality, leading to suboptimal sugar recovery, wasted energy, and inconsistent product quality.

## 💡 Our Solution

**SugarSense** is a full-stack AI platform that predicts sugarcane Pol % **in real-time** using **Near-Infrared (NIR) spectroscopy** — completely non-invasive, non-destructive, and fast enough to run on every batch flowing through the conveyor belt.

```
┌─────────────────┐      ┌──────────────────┐      ┌────────────────────┐
│  NIR Sensor      │      │  Edge Device     │      │  SCADA / Mill DB   │
│  (Spectrometer)  │ ───► │  (Raspberry Pi)  │ ───► │  (MQTT / OPC-UA)   │
└────────┬────────┘      └────────┬─────────┘      └────────────────────┘
         │                        │    
         ▼                        ▼
   Optical Feed             PLS ML Engine
   Sugarcane Conveyor       < 1ms Inference
```

### How It Works

1. **NIR spectra** (740–1070 nm) are captured from sugarcane on the conveyor belt
2. **Chemometric preprocessing** cleans the signal:
   - **Savitzky-Golay filter** — smoothing + 1st derivative to remove baseline drift
   - **Standard Normal Variate (SNV)** — scatter correction across samples
3. **PLS Regression** predicts Pol % from the preprocessed spectra in **sub-millisecond** inference time
4. **Isolation Forest** flags anomalous readings (sensor degradation, foreign material)
5. **Live dashboard** streams predictions, alerts, and quality trends via WebSocket

---

## 🏗️ Architecture

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **ML Training** | scikit-learn, scipy | PLS Regression with cross-validated component selection |
| **Backend API** | FastAPI, WebSocket | Real-time data streaming, REST endpoints, PDF report generation |
| **Anomaly Detection** | Isolation Forest | Identifies abnormal spectra (2% contamination threshold) |
| **Frontend** | React 19, Vite, Recharts | Interactive dashboard with live charts and controls |
| **3D Visualization** | Three.js (React Three Fiber) | Digital twin of the conveyor belt + NIR sensor |
| **Animations** | Framer Motion | Smooth page transitions and component animations |

---

## ✨ Features

### Real-Time Dashboard
- **Live Pol prediction** with color-coded quality alerts (green = nominal, red = low-pol)
- **4 KPI cards** — Samples processed, Average Pol, Alert Rate, Inference latency
- **Quick Actions** — One-click simulation start, analytics navigation, PDF export
- **System Health Bar** — Backend, WebSocket, ML Model, and Anomaly Detector status at a glance

### Digital Twin
- **3D conveyor belt simulation** with animated sugarcane flow
- **NIR laser visualization** that activates during scanning
- Color changes dynamically based on quality alerts

### Model Analytics
- **Performance metrics** — R², RMSEP, RPD, Bias with detailed explanations
- **Preprocessing pipeline visualization** — See raw → Savitzky-Golay → SNV transformations side by side
- **Wavelength importance** — PLS coefficient heatmap showing which NIR bands drive predictions
- **Residual analysis** — Scatter plots and error distribution histograms

### Process Control (SPC)
- **Shewhart Control Chart** with dynamically computed UCL/LCL (±3σ)
- **Out-of-control signal detection** (Western Electric Rule 1)
- **Live alert timeline** with timestamped quality breaches and anomaly events

### Reporting & Export
- **PDF shift reports** generated server-side with ReportLab (session summary, metrics, model details)
- **CSV export** — Tabular prediction data for spreadsheet analysis
- **JSON export** — Raw data for downstream integration

---

## 🚀 Getting Started

### Prerequisites

- **Python 3.9+** with pip
- **Node.js 18+** with npm

### 1. Install Python Dependencies

```bash
pip install -r requirements.txt
```

### 2. Train the Model (optional — pre-trained model included)

```bash
python trainer.py
```

This reads `dataset/Scio.csv`, runs cross-validated PLS calibration, and exports:
- `pls_model.pkl` — Trained PLS regression model
- `wavelengths.pkl` — Wavelength configuration
- `X_test_raw.npy` / `y_test.npy` — Test set for simulation

### 3. Start the Backend

```bash
cd backend
uvicorn server:app --reload --port 8000
```

The API will be live at `http://localhost:8000` with auto-generated docs at `/docs`.

### 4. Start the Frontend

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

### 5. Run the Simulation

Click **Start** on the dashboard or use the Quick Actions card. The backend will stream predictions via WebSocket using the test dataset with simulated industrial noise.

---

## 📊 Model Performance

| Metric | Value | Interpretation |
|--------|-------|---------------|
| **R²** | ~0.85+ | Strong correlation between predicted and actual Pol |
| **RMSEP** | ~0.3–1.0% | Within industry-accepted range for NIR chemometrics |
| **RPD** | >2.0 | Suitable for quantitative prediction |
| **Inference** | <1 ms | Real-time capable on edge hardware |

> Literature confirms that calibrated NIR spectrometers with SG + SNV + PLS preprocessing achieve RMSEP of **0.2%–1.0%** for sugarcane Pol — making this approach highly feasible for production deployment.

---

## 📁 Project Structure

```
SugarSense/
├── backend/
│   └── server.py              # FastAPI server (REST + WebSocket + PDF reports)
├── frontend/
│   └── src/
│       ├── components/
│       │   ├── analytics/     # ModelMetrics, PreprocessingViz, WavelengthImportance
│       │   ├── charts/        # SpectrumChart, PolHistoryChart, SPCChart, ResidualChart
│       │   ├── common/        # GlassCard, StatCard
│       │   ├── dashboard/     # HeroBanner, KPIRow, QuickActions, ControlPanel,
│       │   │                  # PolMetric, DigitalTwin, SystemHealth
│       │   └── layout/        # DashboardLayout, Sidebar
│       ├── context/           # SimulationContext (global state)
│       ├── hooks/             # useSimulation (WebSocket lifecycle manager)
│       ├── pages/             # Dashboard, Analytics, ProcessControl, Reports, Settings
│       ├── styles/            # theme.css (design system)
│       └── utils/             # helpers.js (API, formatting, SPC, export functions)
├── dataset/
│   └── Scio.csv               # NIR spectroscopy dataset (Scio spectrometer)
├── trainer.py                 # ML training pipeline (PLS + ANN comparison)
├── pls_model.pkl              # Pre-trained PLS model
├── wavelengths.pkl            # Wavelength configuration
├── X_test_raw.npy             # Raw test spectra for simulation
├── y_test.npy                 # Actual Pol values for test set
└── requirements.txt           # Python dependencies
```

---

## 🛠️ API Reference

| Endpoint | Method | Description |
|----------|--------|------------|
| `/api/config` | GET | Returns wavelength configuration |
| `/api/model-info` | GET | Model metadata and performance metrics |
| `/api/preprocessing-demo` | GET | Preprocessing stages for a sample |
| `/api/pls-loadings` | GET | PLS regression coefficients per wavelength |
| `/api/stats` | GET | Running session statistics |
| `/api/predictions-history` | GET | Full test set predicted vs actual values |
| `/api/report` | POST | Generates PDF shift report |
| `/ws/simulation` | WS | Real-time prediction streaming |

---

## 🔮 Future Scope

- **Multi-harvest calibration** — Integrate spectra across seasons and ambient conditions for better generalizability
- **Site-specific bias correction** — Localize the model for specific sugarcane clones at each mill
- **Continuous learning** — Auto-update PLS components using periodic lab QA samples
- **Edge deployment** — Package the inference engine for Raspberry Pi / PLC with MQTT integration
- **Multi-parameter prediction** — Extend beyond Pol to Brix, Fibre %, and Purity simultaneously

---

## 🧰 Tech Stack

| Category | Technologies |
|----------|-------------|
| **Machine Learning** | PLS Regression, Isolation Forest, Savitzky-Golay, SNV, scikit-learn |
| **Backend** | Python, FastAPI, WebSocket, ReportLab, NumPy, SciPy, Joblib |
| **Frontend** | React 19, Vite, Recharts, Framer Motion, Lucide Icons |
| **3D Engine** | Three.js, React Three Fiber, React Three Drei |
| **Data Format** | NIR Spectroscopy (Scio, 740–1070 nm, 331 wavelengths) |

---

<p align="center">
  Built with ☕ for the <strong>SugarNXT Hackathon</strong>
</p>
