from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import numpy as np
import joblib
import json
import time
import asyncio
import sys
import os
import io
import scipy.signal
from datetime import datetime
from sklearn.ensemble import IsolationForest
from sklearn.metrics import mean_squared_error, r2_score
from fastapi.responses import StreamingResponse
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from pydantic import BaseModel
from typing import Optional

# Add parent dir to path so we can import trainer.py which contains `preprocess_spectra`
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
try:
    from trainer import preprocess_spectra
except ImportError:
    sys.path.append(os.getcwd())
    from trainer import preprocess_spectra

app = FastAPI(title="SugarSense — NIR Real-Time Prediction API", version="2.0.0")

# Enable CORS for the frontend React app
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Global state ──────────────────────────────────────────────
current_dir = os.path.dirname(os.path.abspath(__file__))
root_dir = os.path.dirname(current_dir)

pls_model = None
wavelengths = None
wavelengths_plot = None
X_test = None
X_test_prep = None
y_test = None
iso_forest = None
model_info_cache = None
server_start_time = time.time()

# Running session statistics
session_stats = {
    "total_predictions": 0,
    "total_alerts": 0,
    "total_anomalies": 0,
    "sum_inference_ms": 0.0,
    "sum_pol": 0.0,
}

print("Loading Models via Joblib...")
try:
    pls_model = joblib.load(os.path.join(root_dir, 'pls_model.pkl'))
    wavelengths = joblib.load(os.path.join(root_dir, 'wavelengths.pkl'))
    X_test = np.load(os.path.join(root_dir, 'X_test_raw.npy'))
    y_test = np.load(os.path.join(root_dir, 'y_test.npy'))
    
    wavelengths_plot = [float(str(w).replace('amplitude-', '')) for w in wavelengths]
    print(f"Loaded successfully. {len(X_test)} samples available for simulation.")
    
    print("Preprocessing test set & training Anomaly Detector...")
    X_test_prep = preprocess_spectra(X_test)
    iso_forest = IsolationForest(contamination=0.02, random_state=42)
    iso_forest.fit(X_test_prep)
    
    # Pre-compute model performance metrics for /api/model-info
    y_pred_all = np.squeeze(pls_model.predict(X_test_prep))
    rmse = float(np.sqrt(mean_squared_error(y_test, y_pred_all)))
    r2 = float(r2_score(y_test, y_pred_all))
    bias = float(np.mean(y_pred_all - y_test))
    sd_y = float(np.std(y_test))
    rpd = sd_y / rmse if rmse > 0 else 0.0
    
    model_info_cache = {
        "model_type": "Partial Least Squares (PLS) Regression",
        "n_components": int(pls_model.n_components),
        "n_training_samples": int(len(X_test)),
        "n_wavelengths": len(wavelengths_plot),
        "wavelength_range": [min(wavelengths_plot), max(wavelengths_plot)],
        "preprocessing": "Savitzky-Golay (window=15, poly=2, deriv=1) + Standard Normal Variate (SNV)",
        "rmse": round(rmse, 4),
        "r2": round(r2, 4),
        "rpd": round(rpd, 2),
        "bias": round(bias, 4),
        "anomaly_detector": "Isolation Forest (contamination=2%)",
        "dataset": "Scio Spectrometer (740–1070 nm)",
    }
    print(f"Model Info: RMSE={rmse:.4f}, R²={r2:.4f}, RPD={rpd:.2f}")
    print("All systems ready.")
except Exception as e:
    print(f"Error loading models: {e}")
    print("Please make sure you have run `python trainer.py` first.")

# ── Helpers ───────────────────────────────────────────────────
def add_industrial_noise(spectrum, noise_level=0.02):
    noise = np.random.normal(0, noise_level, spectrum.shape)
    baseline_drift = np.random.uniform(-0.01, 0.01)
    return spectrum * (1 + noise) + baseline_drift

# ── WebSocket Connection Manager ─────────────────────────────
class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            await connection.send_text(message)

manager = ConnectionManager()

# ── REST Endpoints ────────────────────────────────────────────
@app.get("/")
def read_root():
    return {"status": "SugarSense NIR Backend API is running.", "version": "2.0.0"}

@app.get("/api/config")
def get_config():
    """Returns static data required by the frontend."""
    return {"wavelengths": wavelengths_plot}

@app.get("/api/model-info")
def get_model_info():
    """Returns model metadata and performance metrics."""
    if model_info_cache is None:
        return {"error": "Model not loaded"}
    return model_info_cache

@app.get("/api/preprocessing-demo")
def get_preprocessing_demo(sample_idx: int = 0):
    """Returns the preprocessing pipeline stages for a given sample — raw, SG filtered, SNV normalized."""
    if X_test is None:
        return {"error": "Data not loaded"}
    idx = sample_idx % len(X_test)
    raw = X_test[idx]
    
    # Stage 1: Savitzky-Golay smoothing + 1st derivative
    sg = scipy.signal.savgol_filter(raw.reshape(1, -1), window_length=15, polyorder=2, deriv=1)[0]
    
    # Stage 2: SNV
    mean_val = np.mean(sg)
    std_val = np.std(sg)
    snv = (sg - mean_val) / (std_val + 1e-8)
    
    return {
        "wavelengths": wavelengths_plot,
        "raw": raw.tolist(),
        "savgol": sg.tolist(),
        "snv": snv.tolist(),
        "sample_idx": idx,
    }

@app.get("/api/pls-loadings")
def get_pls_loadings():
    """Returns PLS regression coefficients per wavelength for importance visualization."""
    if pls_model is None:
        return {"error": "Model not loaded"}
    coefficients = np.squeeze(pls_model.coef_).tolist()
    abs_coefficients = np.abs(np.squeeze(pls_model.coef_)).tolist()
    return {
        "wavelengths": wavelengths_plot,
        "coefficients": coefficients,
        "abs_coefficients": abs_coefficients,
    }

@app.get("/api/stats")
def get_stats():
    """Returns running session statistics."""
    n = session_stats["total_predictions"]
    return {
        "total_predictions": n,
        "total_alerts": session_stats["total_alerts"],
        "total_anomalies": session_stats["total_anomalies"],
        "avg_inference_ms": round(session_stats["sum_inference_ms"] / n, 2) if n > 0 else 0,
        "avg_pol": round(session_stats["sum_pol"] / n, 2) if n > 0 else 0,
        "alert_rate": round(session_stats["total_alerts"] / n * 100, 1) if n > 0 else 0,
        "uptime_seconds": round(time.time() - server_start_time, 1),
        "active_connections": len(manager.active_connections),
    }

@app.get("/api/predictions-history")
def get_prediction_pairs():
    """Returns all test set predictions vs actuals for analytics scatter/residual plots."""
    if X_test_prep is None or pls_model is None:
        return {"error": "Model not loaded"}
    y_pred = np.squeeze(pls_model.predict(X_test_prep)).tolist()
    y_act = y_test.tolist()
    residuals = (np.array(y_pred) - np.array(y_act)).tolist()
    return {
        "predicted": y_pred,
        "actual": y_act,
        "residuals": residuals,
    }

# ── WebSocket Simulation ─────────────────────────────────────
@app.websocket("/ws/simulation")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    idx = 0
    try:
        while True:
            data = await websocket.receive_text()
            config = json.loads(data)
            
            noise_pct = config.get("noiseLevel", 2.0)
            threshold = config.get("threshold", 13.0)
            
            raw_spectrum = X_test[idx]
            actual_pol = y_test[idx]
            
            noisy_spectrum = add_industrial_noise(raw_spectrum, noise_level=noise_pct / 100.0)
            X_live_prep = preprocess_spectra(noisy_spectrum.reshape(1, -1))
            
            start_time = time.time()
            pred_pol = float(np.squeeze(pls_model.predict(X_live_prep)))
            is_anomaly = iso_forest.predict(X_live_prep)[0] == -1
            inference_ms = (time.time() - start_time) * 1000
            
            is_alert = pred_pol < threshold
            
            # Update session stats
            session_stats["total_predictions"] += 1
            session_stats["sum_inference_ms"] += inference_ms
            session_stats["sum_pol"] += pred_pol
            if is_alert:
                session_stats["total_alerts"] += 1
            if is_anomaly:
                session_stats["total_anomalies"] += 1
            
            payload = {
                "timestamp": time.time(),
                "actual_pol": float(actual_pol),
                "predicted_pol": pred_pol,
                "inference_ms": inference_ms,
                "noisy_spectrum": noisy_spectrum.tolist(),
                "alert": is_alert,
                "anomaly": bool(is_anomaly),
                "sample_idx": idx,
            }
            
            await websocket.send_text(json.dumps(payload))
            idx = (idx + 1) % len(X_test)
            
    except WebSocketDisconnect:
        manager.disconnect(websocket)
        print("Client disconnected.")

# ── Report Generation ─────────────────────────────────────────
class ReportData(BaseModel):
    timestamp: list[float]
    predicted_pol: list[float]
    actual_pol: list[float]
    threshold: Optional[float] = 13.0

@app.post("/api/report")
async def generate_report(data: ReportData):
    buffer = io.BytesIO()
    c = canvas.Canvas(buffer, pagesize=letter)
    w, h = letter
    
    # Header
    c.setFont("Helvetica-Bold", 28)
    c.setFillColorRGB(0.04, 0.72, 0.31)
    c.drawString(50, h - 60, "SugarSense Shift Report")

    c.setFont("Helvetica", 10)
    c.setFillColorRGB(0.5, 0.5, 0.5)
    c.drawString(50, h - 80, f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    c.setFillColorRGB(0, 0, 0)
    y_pos = h - 120
    
    # Summary
    c.setFont("Helvetica-Bold", 16)
    c.drawString(50, y_pos, "Session Summary")
    y_pos -= 30
    
    c.setFont("Helvetica", 12)
    c.drawString(50, y_pos, f"Total Samples Processed: {len(data.predicted_pol)}")
    y_pos -= 22
    
    avg_pol = sum(data.predicted_pol) / len(data.predicted_pol) if data.predicted_pol else 0
    c.drawString(50, y_pos, f"Average Predicted Pol (TS%): {avg_pol:.2f}%")
    y_pos -= 22
    
    threshold = data.threshold or 13.0
    breaches = sum(1 for p in data.predicted_pol if p < threshold)
    c.drawString(50, y_pos, f"Quality Alert Threshold: {threshold:.1f}%")
    y_pos -= 22
    c.drawString(50, y_pos, f"Total Low-Pol Alerts: {breaches}")
    y_pos -= 22
    
    alert_rate = (breaches / len(data.predicted_pol) * 100) if data.predicted_pol else 0
    c.drawString(50, y_pos, f"Alert Rate: {alert_rate:.1f}%")
    y_pos -= 22
    
    # Prediction accuracy
    if data.actual_pol:
        pred_arr = np.array(data.predicted_pol)
        act_arr = np.array(data.actual_pol)
        rmse = float(np.sqrt(np.mean((pred_arr - act_arr) ** 2)))
        c.drawString(50, y_pos, f"Session RMSEP: {rmse:.4f}")
        y_pos -= 22
    
    min_pol = min(data.predicted_pol) if data.predicted_pol else 0
    max_pol = max(data.predicted_pol) if data.predicted_pol else 0
    c.drawString(50, y_pos, f"Pol Range: {min_pol:.2f}% — {max_pol:.2f}%")
    y_pos -= 40
    
    # Model info
    c.setFont("Helvetica-Bold", 16)
    c.drawString(50, y_pos, "Model & Technical Details")
    y_pos -= 25
    
    c.setFont("Helvetica", 11)
    details = [
        "Model: Partial Least Squares (PLS) Regression",
        "Preprocessing: Savitzky-Golay (drv=1, w=15, p=2) + Standard Normal Variate (SNV)",
        "Anomaly Detection: Isolation Forest (contamination=2%)",
        "Spectrometer: Scio (740–1070 nm, 331 wavelengths)",
        "Deployment: Edge Device / Web SCADA Interface",
    ]
    if model_info_cache:
        details.insert(1, f"PLS Components: {model_info_cache['n_components']} | Baseline R²: {model_info_cache['r2']:.4f} | RMSEP: {model_info_cache['rmse']:.4f}")
    
    for line in details:
        c.drawString(60, y_pos, f"• {line}")
        y_pos -= 18
    
    c.save()
    buffer.seek(0)
    
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=sugarsense_shift_report.pdf"}
    )
