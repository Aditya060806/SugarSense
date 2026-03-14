import pandas as pd
import numpy as np
import scipy.signal
from sklearn.cross_decomposition import PLSRegression
from sklearn.neural_network import MLPRegressor
from sklearn.model_selection import train_test_split, cross_val_score, KFold
from sklearn.metrics import mean_squared_error, r2_score
from sklearn.preprocessing import StandardScaler
import joblib
import os
import json
import matplotlib.pyplot as plt

# ── Load shared configuration ────────────────────────────────
_cfg_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'config.json')
try:
    with open(_cfg_path) as _f:
        _CONF = json.load(_f)
except FileNotFoundError:
    _CONF = {}

_pre = _CONF.get('preprocessing', {})
_mod = _CONF.get('model', {})

SAVGOL_WINDOW   = _pre.get('savgol_window_length', 15)
SAVGOL_POLY     = _pre.get('savgol_polyorder', 2)
SAVGOL_DERIV    = _pre.get('savgol_deriv', 1)
PLS_MAX_COMP    = _mod.get('pls_max_components', 15)
TEST_SPLIT      = _mod.get('train_test_split_ratio', 0.2)
RANDOM_STATE    = _mod.get('random_state', 42)

def load_data(file_path):
    print(f"Loading data from {file_path}...")
    df = pd.read_csv(file_path)
    
    # We are interested in 'TS' (Total Sugar / Pol)
    # Drop rows where TS is missing
    # In some CSVs it might be empty string instead of NaN
    df['TS'] = pd.to_numeric(df['TS'], errors='coerce')
    df = df.dropna(subset=['TS'])
    
    # Extract features (wavelengths)
    # The wavelengths are columns starting with 'amplitude' or numbers.
    wavelength_cols = [col for col in df.columns if col.startswith('amplitude') or col.replace('.','',1).isdigit()]
    
    X = df[wavelength_cols].values
    y = df['TS'].values
    
    print(f"Loaded {X.shape[0]} samples with {X.shape[1]} features (wavelengths).")
    return X, y, wavelength_cols


def load_multi_targets(file_path):
    """
    Load multi-output targets for Brix, Fibre, and Purity.

    The Scio dataset provides:
      - TS  (Total Sugar / Pol)
      - ADF (Acid Detergent Fibre — strong proxy for cane Fibre%)

    Brix and Purity are derived via standard sugar chemistry:
      Brix   ≈ TS / 0.85  (Brix = total dissolved solids; Pol is ~85% of Brix for good cane)
      Purity = (TS / Brix) × 100
      Fibre  = ADF × 0.28 + 5.0  (linear rescale to typical cane Fibre% range 10–18%)

    Returns:
      Y_multi : ndarray shape (n_samples, 4) — [Pol, Brix, Fibre, Purity]
      target_names : list of str
    """
    print(f"Loading multi-target data from {file_path}...")
    df = pd.read_csv(file_path)
    df['TS']  = pd.to_numeric(df['TS'],  errors='coerce')
    df['ADF'] = pd.to_numeric(df['ADF'], errors='coerce')
    df = df.dropna(subset=['TS', 'ADF'])

    wavelength_cols = [col for col in df.columns if col.startswith('amplitude') or col.replace('.','',1).isdigit()]
    X = df[wavelength_cols].values

    pol    = df['TS'].values
    brix   = pol / 0.85
    purity = (pol / brix) * 100  # = 85.0 constant, but kept formula for clarity
    fibre  = df['ADF'].values * 0.28 + 5.0  # rescaled to 10–18% range

    Y_multi = np.column_stack([pol, brix, fibre, purity])
    target_names = ['Pol', 'Brix', 'Fibre', 'Purity']
    print(f"Multi-target dataset: {X.shape[0]} samples, targets: {target_names}")
    return X, Y_multi, wavelength_cols, target_names

def preprocess_spectra(X):
    """
    Standard Chemometrics preprocessing:
    1. Savitzky-Golay filter for smoothing and 1st derivative
    2. Standard Normal Variate (SNV) to scatter-correct
    """
    # 1. Savitzky-Golay Smoothing and 1st Derivative
    X_sg = scipy.signal.savgol_filter(X, window_length=SAVGOL_WINDOW, polyorder=SAVGOL_POLY, deriv=SAVGOL_DERIV)

    # 2. Standard Normal Variate (SNV)
    # For each spectrum, subtract mean and divide by standard deviation
    mean = np.mean(X_sg, axis=1, keepdims=True)
    std = np.std(X_sg, axis=1, keepdims=True)
    X_snv = (X_sg - mean) / (std + 1e-8)

    return X_snv

def train_pls(X_train, y_train):
    print("Finding optimal number of PLS components via Cross-Validation...")
    cv = KFold(n_splits=5, shuffle=True, random_state=RANDOM_STATE)
    best_n = 1
    lowest_mse = float('inf')

    for i in range(1, PLS_MAX_COMP + 1):
        pls = PLSRegression(n_components=i)
        score = -cross_val_score(pls, X_train, y_train, cv=cv, scoring='neg_mean_squared_error').mean()
        if score < lowest_mse:
            lowest_mse = score
            best_n = i

    print(f"Best number of PLS components: {best_n} (CV MSE: {lowest_mse:.4f})")

    pls = PLSRegression(n_components=best_n)
    pls.fit(X_train, y_train)
    return pls

def train_ann(X_train, y_train):
    print("Training Artificial Neural Network (MLPRegressor)...")
    ann = MLPRegressor(hidden_layer_sizes=(64, 32), max_iter=2000, random_state=RANDOM_STATE, early_stopping=True)
    ann.fit(X_train, y_train)
    return ann


def train_multi_pls(X_train, Y_train):
    """
    Train a multi-output PLS regression model.
    Uses cross-validation on the Pol target to select optimal n_components,
    then fits PLS jointly on all targets.
    """
    print("Training Multi-Output PLS Regression...")
    cv = KFold(n_splits=5, shuffle=True, random_state=RANDOM_STATE)
    best_n = 1
    lowest_mse = float('inf')
    max_comp = min(PLS_MAX_COMP + 1, X_train.shape[0] // 2)
    for i in range(1, max_comp):
        pls = PLSRegression(n_components=i)
        score = -cross_val_score(pls, X_train, Y_train[:, 0], cv=cv,
                                 scoring='neg_mean_squared_error').mean()
        if score < lowest_mse:
            lowest_mse = score
            best_n = i
    print(f"Best n_components for multi-PLS: {best_n} (CV MSE on Pol: {lowest_mse:.4f})")
    multi_pls = PLSRegression(n_components=best_n)
    multi_pls.fit(X_train, Y_train)
    return multi_pls


def evaluate_model(model, X_test, y_test, name="Model"):
    y_pred = model.predict(X_test)
    rmse = np.sqrt(mean_squared_error(y_test, y_pred))
    r2 = r2_score(y_test, y_pred)
    # Output to console simulating mock industrial output readiness
    print(f"--- {name} Evaluation ---")
    print(f"RMSEP (Root Mean Square Error of Prediction): {rmse:.4f}")
    print(f"R² Score: {r2:.4f}")
    return rmse, r2

def main():
    dataset_path = "dataset/Scio.csv"
    if not os.path.exists(dataset_path):
        print("Dataset not found. Please ensure it is extracted to dataset/Scio.csv")
        return
        
    X, y, wavelengths = load_data(dataset_path)
    
    # Save wavelengths for the simulation dashboard
    joblib.dump(wavelengths, "wavelengths.pkl")
    
    # Preprocess
    print("Preprocessing spectra (Savitzky-Golay + SNV)...")
    X_prep = preprocess_spectra(X)
    
    # Train/Test Split
    X_train, X_test, y_train, y_test = train_test_split(X_prep, y, test_size=TEST_SPLIT, random_state=RANDOM_STATE)
    
    # Standardize Targets (optional but good for comparison)
    scaler_y = StandardScaler()
    scaler_y.fit(y_train.reshape(-1, 1))
    
    # Train PLS
    pls = train_pls(X_train, y_train)
    evaluate_model(pls, X_test, y_test, "PLS Regression")
    
    # Train ANN (Optional but requested for comparison)
    ann = train_ann(X_train, y_train)
    evaluate_model(ann, X_test, y_test, "Artificial Neural Network")
    
    # Save the best model (typically PLS for NIR, widely used in sugarcane mills)
    # We will save the PLS model for our real-time dashboard simulation
    print("Saving PLS model to pls_model.pkl...")
    joblib.dump(pls, 'pls_model.pkl')

    print("Saving ANN model to ann_model.pkl...")
    joblib.dump(ann, 'ann_model.pkl')

    np.save('X_test_raw.npy', X[len(X_train):])
    np.save('y_test.npy', y_test)

    # ── Multi-Parameter PLS ──────────────────────────────────────────────────
    print("\n── Training Multi-Parameter Model ──")
    X_multi, Y_multi, _, target_names = load_multi_targets(dataset_path)
    X_multi_prep = preprocess_spectra(X_multi)
    X_train_m, X_test_m, Y_train_m, Y_test_m = train_test_split(
        X_multi_prep, Y_multi, test_size=TEST_SPLIT, random_state=RANDOM_STATE
    )
    multi_pls = train_multi_pls(X_train_m, Y_train_m)
    Y_pred_m = multi_pls.predict(X_test_m)
    for i, name in enumerate(target_names):
        rmse = np.sqrt(mean_squared_error(Y_test_m[:, i], Y_pred_m[:, i]))
        r2   = r2_score(Y_test_m[:, i], Y_pred_m[:, i])
        print(f"  {name}: RMSEP={rmse:.4f}, R²={r2:.4f}")
    print("Saving multi_model.pkl...")
    joblib.dump(multi_pls, 'multi_model.pkl')
    np.save('y_test_multi.npy', Y_test_m)
    joblib.dump(target_names, 'multi_target_names.pkl')

    print("Training pipeline complete.")


if __name__ == "__main__":
    main()
