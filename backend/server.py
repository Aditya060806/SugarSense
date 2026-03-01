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
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from datetime import datetime
from sklearn.ensemble import IsolationForest
from sklearn.metrics import mean_squared_error, r2_score
from scipy.spatial.distance import mahalanobis
from fastapi.responses import StreamingResponse
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from reportlab.lib.utils import ImageReader
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
ann_model = None
wavelengths = None
wavelengths_plot = None
X_test = None
X_test_prep = None
y_test = None
iso_forest = None
model_info_cache = None
ann_info_cache = None
train_cov_inv = None
train_mean = None
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

    train_mean = np.mean(X_test_prep, axis=0)
    cov = np.cov(X_test_prep.T)
    try:
        train_cov_inv = np.linalg.pinv(cov)
    except Exception:
        train_cov_inv = np.eye(cov.shape[0])
    print("Mahalanobis confidence scoring initialized.")

    try:
        ann_model = joblib.load(os.path.join(root_dir, 'ann_model.pkl'))
        y_pred_ann = ann_model.predict(X_test_prep)
        rmse_ann = float(np.sqrt(mean_squared_error(y_test, y_pred_ann)))
        r2_ann = float(r2_score(y_test, y_pred_ann))
        bias_ann = float(np.mean(y_pred_ann - y_test))
        rpd_ann = sd_y / rmse_ann if rmse_ann > 0 else 0.0
        ann_info_cache = {
            "model_type": "Artificial Neural Network (MLP Regressor)",
            "rmse": round(rmse_ann, 4),
            "r2": round(r2_ann, 4),
            "rpd": round(rpd_ann, 2),
            "bias": round(bias_ann, 4),
            "architecture": "64 → 32 (ReLU, early stopping)",
        }
        print(f"ANN Model: RMSE={rmse_ann:.4f}, R²={r2_ann:.4f}")
    except Exception as e:
        print(f"ANN model not found: {e}")
        ann_info_cache = None

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

@app.get("/api/model-comparison")
def get_model_comparison():
    if model_info_cache is None:
        return {"error": "Model not loaded"}
    result = {"pls": model_info_cache}
    if ann_info_cache:
        result["ann"] = ann_info_cache
        y_pred_pls = np.squeeze(pls_model.predict(X_test_prep)).tolist()
        y_pred_ann = ann_model.predict(X_test_prep).tolist()
        result["predictions"] = {
            "pls": y_pred_pls,
            "ann": y_pred_ann,
            "actual": y_test.tolist(),
        }
    return result

@app.get("/api/roi")
def get_roi():
    n = session_stats["total_predictions"]
    cost_per_lab_test = 15.0
    lab_time_minutes = 180
    pol_improvement_pct = 0.2
    hourly_mill_revenue = 5000.0

    money_saved = n * cost_per_lab_test
    time_saved_hrs = round((n * lab_time_minutes) / 60, 1)
    avg_inference = session_stats["sum_inference_ms"] / n if n > 0 else 0
    yield_gain = n * pol_improvement_pct * 0.01 * hourly_mill_revenue / 60
    annual_projection = money_saved * (525600 / max(time.time() - server_start_time, 1)) if n > 0 else 0

    return {
        "samples_analyzed": n,
        "money_saved_usd": round(money_saved, 2),
        "time_saved_hours": time_saved_hrs,
        "yield_improvement_usd": round(yield_gain, 2),
        "annual_projection_usd": round(min(annual_projection, 999999), 0),
        "avg_inference_ms": round(avg_inference, 2),
        "cost_per_lab_test": cost_per_lab_test,
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
            
            confidence = 95.0
            if train_cov_inv is not None and train_mean is not None:
                try:
                    sample = X_live_prep[0]
                    dist = mahalanobis(sample, train_mean, train_cov_inv)
                    max_dist = 10.0
                    confidence = max(0, min(100, 100 * (1 - dist / max_dist)))
                except Exception:
                    confidence = 50.0
            
            is_alert = pred_pol < threshold
            
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
                "confidence": round(confidence, 1),
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

def generate_prediction_chart(predicted, actual, threshold):
    fig, ax = plt.subplots(figsize=(7, 2.8), dpi=120)
    ax.plot(predicted, color='#16a34a', linewidth=1.5, label='Predicted Pol')
    if actual:
        ax.plot(actual, color='#94a3b8', linewidth=1, linestyle='--', label='Actual Pol', alpha=0.7)
    if threshold:
        ax.axhline(y=threshold, color='#ef4444', linewidth=1, linestyle=':', label=f'Threshold ({threshold}%)')
    ax.set_xlabel('Sample #', fontsize=9)
    ax.set_ylabel('Pol %', fontsize=9)
    ax.set_title('Prediction History', fontsize=11, fontweight='bold')
    ax.legend(fontsize=8, loc='lower right')
    ax.grid(True, alpha=0.3)
    ax.tick_params(labelsize=8)
    fig.tight_layout()
    img_buf = io.BytesIO()
    fig.savefig(img_buf, format='png', bbox_inches='tight')
    plt.close(fig)
    img_buf.seek(0)
    return img_buf

@app.post("/api/report")
async def generate_report(data: ReportData):
    buffer = io.BytesIO()
    c = canvas.Canvas(buffer, pagesize=letter)
    w, h = letter

    c.setFont("Helvetica-Bold", 28)
    c.setFillColorRGB(0.04, 0.72, 0.31)
    c.drawString(50, h - 60, "SugarSense Shift Report")

    c.setFont("Helvetica", 10)
    c.setFillColorRGB(0.5, 0.5, 0.5)
    c.drawString(50, h - 80, f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    c.drawString(50, h - 94, "Precision AI for Cane Quality Assessment")

    c.setStrokeColorRGB(0.04, 0.72, 0.31)
    c.setLineWidth(2)
    c.line(50, h - 105, w - 50, h - 105)

    c.setFillColorRGB(0, 0, 0)
    y_pos = h - 130

    c.setFont("Helvetica-Bold", 16)
    c.drawString(50, y_pos, "Session Summary")
    y_pos -= 28

    avg_pol = sum(data.predicted_pol) / len(data.predicted_pol) if data.predicted_pol else 0
    threshold = data.threshold or 13.0
    breaches = sum(1 for p in data.predicted_pol if p < threshold)
    alert_rate = (breaches / len(data.predicted_pol) * 100) if data.predicted_pol else 0
    min_pol = min(data.predicted_pol) if data.predicted_pol else 0
    max_pol = max(data.predicted_pol) if data.predicted_pol else 0

    rows = [
        ("Total Samples Processed", str(len(data.predicted_pol))),
        ("Average Predicted Pol", f"{avg_pol:.2f}%"),
        ("Pol Range", f"{min_pol:.2f}% — {max_pol:.2f}%"),
        ("Quality Threshold", f"{threshold:.1f}%"),
        ("Low-Pol Alerts", str(breaches)),
        ("Alert Rate", f"{alert_rate:.1f}%"),
    ]

    if data.actual_pol:
        pred_arr = np.array(data.predicted_pol)
        act_arr = np.array(data.actual_pol)
        rmse = float(np.sqrt(np.mean((pred_arr - act_arr) ** 2)))
        rows.append(("Session RMSEP", f"{rmse:.4f}"))

    c.setFont("Helvetica", 11)
    for label, value in rows:
        c.setFillColorRGB(0.4, 0.4, 0.4)
        c.drawString(60, y_pos, label)
        c.setFillColorRGB(0, 0, 0)
        c.setFont("Helvetica-Bold", 11)
        c.drawString(300, y_pos, value)
        c.setFont("Helvetica", 11)
        y_pos -= 20

    y_pos -= 15

    try:
        chart_img = generate_prediction_chart(data.predicted_pol, data.actual_pol, threshold)
        img = ImageReader(chart_img)
        chart_h = 200
        c.drawImage(img, 50, y_pos - chart_h, width=w - 100, height=chart_h)
        y_pos -= chart_h + 20
    except Exception:
        pass

    c.setFont("Helvetica-Bold", 14)
    c.setFillColorRGB(0, 0, 0)
    c.drawString(50, y_pos, "Model & Technical Details")
    y_pos -= 22

    c.setFont("Helvetica", 10)
    details = [
        "Model: Partial Least Squares (PLS) Regression",
        "Preprocessing: Savitzky-Golay (drv=1, w=15, p=2) + SNV",
        "Anomaly Detection: Isolation Forest (contamination=2%)",
        "Spectrometer: Scio (740–1070 nm, 331 wavelengths)",
    ]
    if model_info_cache:
        details.insert(1, f"PLS Components: {model_info_cache['n_components']} | R²: {model_info_cache['r2']:.4f} | RMSEP: {model_info_cache['rmse']:.4f}")

    for line in details:
        c.setFillColorRGB(0.3, 0.3, 0.3)
        c.drawString(60, y_pos, f"• {line}")
        y_pos -= 16

    y_pos -= 15
    money_saved = len(data.predicted_pol) * 15.0
    c.setFont("Helvetica-Bold", 14)
    c.setFillColorRGB(0.04, 0.72, 0.31)
    c.drawString(50, y_pos, "ROI Impact")
    y_pos -= 20
    c.setFont("Helvetica", 11)
    c.setFillColorRGB(0, 0, 0)
    c.drawString(60, y_pos, f"Estimated Lab Cost Savings: ${money_saved:.0f}")
    y_pos -= 18
    c.drawString(60, y_pos, f"Lab Tests Replaced: {len(data.predicted_pol)} (@ $15/test)")

    c.save()
    buffer.seek(0)

    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=sugarsense_shift_report.pdf"}
    )
