#!/usr/bin/env python3
"""
日本物業投資 ML 預測模型 (Basic Version)
=========================================
用 XGBoost + ARIMA 預測:
  1. JPY/HKD 匯率 10 年後嘅機率分佈
  2. 日本物業價格 10 年後嘅機率分佈
  3. 將 ML 預測嘅機率加權到 84 情景模型

Data sources:
  - USD/JPY annual averages 1995-2025 (FRED / Macrotrends)
  - Japan Residential Property Price Index 1995-2025 (BIS / FRED QJPN628BIS)
  - JPY/HKD = USD/JPY * 7.80 (HKD pegged)
"""

import json
import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.font_manager as fm
from sklearn.ensemble import GradientBoostingRegressor, RandomForestRegressor
from sklearn.model_selection import TimeSeriesSplit, cross_val_score
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import mean_absolute_error, mean_squared_error
import xgboost as xgb
import lightgbm as lgb
from statsmodels.tsa.arima.model import ARIMA
from statsmodels.tsa.statespace.sarimax import SARIMAX
import warnings
warnings.filterwarnings('ignore')

# ── Chinese font setup ──
fm.fontManager.addfont('/usr/share/fonts/truetype/wqy/wqy-zenhei.ttc')
fm.fontManager.addfont('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf')
plt.rcParams['font.sans-serif'] = ['WenQuanYi Zen Hei', 'DejaVu Sans']
plt.rcParams['axes.unicode_minus'] = False

OUT = '/home/z/my-project/download/'

# ═══════════════════════════════════════════════════════════════════════
# 1. HISTORICAL DATA
# ═══════════════════════════════════════════════════════════════════════
usd_jpy = {
    1995:93.97,1996:108.78,1997:120.99,1998:130.91,1999:113.73,2000:107.77,
    2001:121.53,2002:125.22,2003:115.94,2004:108.15,2005:110.11,2006:116.35,
    2007:117.76,2008:103.39,2009:93.68,2010:87.78,2011:79.70,2012:79.82,
    2013:97.56,2014:105.74,2015:120.95,2016:108.72,2017:112.16,2018:110.44,
    2019:108.84,2020:106.76,2021:109.84,2022:131.50,2023:140.94,2024:151.48,
    2025:149.67
}

# Japan Residential Property Price Index (BIS, base ~= 100)
prop_idx = {
    1995:145.0,1996:138.0,1997:130.0,1998:120.0,1999:112.0,2000:105.0,
    2001:98.0,2002:93.0,2003:89.0,2004:87.0,2005:87.0,2006:88.0,
    2007:88.0,2008:86.0,2009:84.0,2010:84.0,2011:82.0,2012:83.0,
    2013:86.0,2014:90.0,2015:100.0,2016:103.0,2017:107.0,2018:110.0,
    2019:112.0,2020:110.0,2021:113.0,2022:117.0,2023:122.0,2024:130.0,
    2025:136.0
}

# Proxy macro features (derived / estimated)
# Japan policy rate approx (simplified)
japan_rate = {
    1995:0.5,1996:0.5,1997:0.5,1998:0.25,1999:0.0,2000:0.2,2001:0.1,2002:0.05,
    2003:0.05,2004:0.0,2005:0.0,2006:0.25,2007:0.5,2008:0.3,2009:0.1,2010:0.0,
    2011:0.0,2012:0.05,2013:0.05,2014:0.05,2015:0.05,2016:-0.1,2017:-0.1,2018:-0.1,
    2019:-0.1,2020:-0.1,2021:-0.1,2022:-0.1,2023:-0.1,2024:0.25,2025:0.75
}

# US Fed funds rate approx
us_rate = {
    1995:5.8,1996:5.3,1997:5.5,1998:5.5,1999:4.7,2000:6.2,2001:3.9,2002:1.7,
    2003:1.1,2004:1.4,2005:3.2,2006:4.9,2007:5.0,2008:1.9,2009:0.2,2010:0.2,
    2011:0.1,2012:0.2,2013:0.2,2014:0.1,2015:0.1,2016:0.4,2017:1.0,2018:1.8,
    2019:2.2,2020:0.4,2021:0.1,2022:1.7,2023:5.3,2024:5.3,2025:4.5
}

years = list(range(1995, 2026))
N = len(years)

fx_arr = np.array([usd_jpy[y] * 7.80 for y in years])       # JPY/HKD
pr_arr = np.array([prop_idx[y] for y in years])              # Property index
jr_arr = np.array([japan_rate[y] for y in years])            # Japan rate
ur_arr = np.array([us_rate[y] for y in years])               # US rate
spread_arr = ur_arr - jr_arr                                 # Rate differential

# ═══════════════════════════════════════════════════════════════════════
# 2. FEATURE ENGINEERING
# ═══════════════════════════════════════════════════════════════════════
def make_features(arr, label_name, horizon=10):
    """
    從時間序列建立特徵矩陣，預測 horizon 年後嘅變化率
    回傳 (X, y, feature_names)，X 形狀 = (N-horizon, n_features)
    """
    n = len(arr)
    features = {}
    
    # Lagged values (1, 2, 3, 5 year lags)
    for lag in [1, 2, 3, 5]:
        if lag < n - horizon:
            features[f'{label_name}_lag{lag}'] = arr[lag:n-horizon]
    
    # Momentum: 1-year, 3-year, 5-year rate of change
    for window in [1, 3, 5]:
        if window < n - horizon:
            changes = []
            for i in range(window, n - horizon):
                changes.append((arr[i] - arr[i-window]) / arr[i-window] * 100)
            features[f'{label_name}_mom{window}y'] = np.array(changes)
    
    # Moving averages (3yr, 5yr)
    for window in [3, 5]:
        if window < n - horizon:
            ma = []
            for i in range(window, n - horizon):
                ma.append(np.mean(arr[i-window+1:i+1]))
            features[f'{label_name}_ma{window}y'] = np.array(ma)
    
    # Volatility: rolling std (5yr)
    window = 5
    if window < n - horizon:
        vol = []
        for i in range(window, n - horizon):
            vol.append(np.std(arr[i-window+1:i+1]) / np.mean(arr[i-window+1:i+1]) * 100)
        features[f'{label_name}_vol5y'] = np.array(vol)
    
    # Mean reversion signal: distance from 5yr MA
    window = 5
    if window < n - horizon:
        mr = []
        for i in range(window, n - horizon):
            ma = np.mean(arr[i-window+1:i+1])
            mr.append((arr[i] - ma) / ma * 100)
        features[f'{label_name}_meanrev'] = np.array(mr)
    
    # Target: horizon-year forward return %
    y = []
    for i in range(n - horizon):
        y.append((arr[i+horizon] - arr[i]) / arr[i] * 100)
    y = np.array(y)
    
    # Align all features to same length
    min_len = min(len(v) for v in features.values())
    X_dict = {k: v[-min_len:] for k, v in features.items()}
    y = y[-min_len:]
    
    X = np.column_stack([X_dict[k] for k in sorted(X_dict.keys())])
    feature_names = sorted(X_dict.keys())
    
    return X, y, feature_names


def add_macro_features(X, macro_arr, label_name):
    """Add macro features aligned to X length"""
    # Rate differential level
    n = len(macro_arr)
    start = n - len(X)
    rate_feat = macro_arr[start:start+len(X)].reshape(-1, 1)
    
    # Rate differential momentum (3yr change)
    mom = []
    for i in range(start, start+len(X)):
        if i >= 3:
            mom.append(macro_arr[i] - macro_arr[i-3])
        else:
            mom.append(0)
    rate_mom = np.array(mom).reshape(-1, 1)
    
    return np.column_stack([X, rate_feat, rate_mom]), \
           [f'{label_name}_level', f'{label_name}_mom3y']


# ── Build FX features ──
X_fx, y_fx, fx_feat_names = make_features(fx_arr, 'fx', horizon=10)
X_fx, macro_fx_names = add_macro_features(X_fx, spread_arr, 'spread')
fx_all_features = fx_feat_names + macro_fx_names

# ── Build Property features ──
X_pr, y_pr, pr_feat_names = make_features(pr_arr, 'prop', horizon=10)
X_pr, macro_pr_names = add_macro_features(X_pr, jr_arr, 'jrate')
pr_all_features = pr_feat_names + macro_pr_names

print(f"FX:   X={X_fx.shape}, y={y_fx.shape}")
print(f"Prop: X={X_pr.shape}, y={y_pr.shape}")

# ═══════════════════════════════════════════════════════════════════════
# 3. TRAIN ML MODELS
# ═══════════════════════════════════════════════════════════════════════
print("\n" + "="*60)
print("  MODEL TRAINING")
print("="*60)

def train_and_evaluate(X, y, name, features_list):
    """Train multiple models and return the best one"""
    tscv = TimeSeriesSplit(n_splits=3)
    models = {}
    
    # 1. XGBoost
    xgb_model = xgb.XGBRegressor(
        n_estimators=200, max_depth=3, learning_rate=0.05,
        subsample=0.8, colsample_bytree=0.8, random_state=42,
        min_child_weight=2, reg_alpha=0.1, reg_lambda=1.0
    )
    scores = cross_val_score(xgb_model, X, y, cv=tscv, scoring='neg_mean_absolute_error')
    xgb_model.fit(X, y)
    models['XGBoost'] = {
        'model': xgb_model,
        'cv_mae': -scores.mean(),
        'cv_std': scores.std()
    }
    
    # 2. LightGBM
    lgb_model = lgb.LGBMRegressor(
        n_estimators=200, max_depth=3, learning_rate=0.05,
        subsample=0.8, colsample_bytree=0.8, random_state=42,
        reg_alpha=0.1, reg_lambda=1.0, verbose=-1
    )
    scores = cross_val_score(lgb_model, X, y, cv=tscv, scoring='neg_mean_absolute_error')
    lgb_model.fit(X, y)
    models['LightGBM'] = {
        'model': lgb_model,
        'cv_mae': -scores.mean(),
        'cv_std': scores.std()
    }
    
    # 3. Random Forest
    rf_model = RandomForestRegressor(
        n_estimators=300, max_depth=4, min_samples_leaf=2, random_state=42
    )
    scores = cross_val_score(rf_model, X, y, cv=tscv, scoring='neg_mean_absolute_error')
    rf_model.fit(X, y)
    models['RandomForest'] = {
        'model': rf_model,
        'cv_mae': -scores.mean(),
        'cv_std': scores.std()
    }
    
    # 4. Gradient Boosting (sklearn)
    gb_model = GradientBoostingRegressor(
        n_estimators=200, max_depth=3, learning_rate=0.05,
        subsample=0.8, min_samples_leaf=2, random_state=42
    )
    scores = cross_val_score(gb_model, X, y, cv=tscv, scoring='neg_mean_absolute_error')
    gb_model.fit(X, y)
    models['GBR'] = {
        'model': gb_model,
        'cv_mae': -scores.mean(),
        'cv_std': scores.std()
    }
    
    # Print results
    print(f"\n--- {name} ---")
    best_name = None
    best_score = float('inf')
    for mname, mdict in models.items():
        print(f"  {mname:15s}: CV MAE = {mdict['cv_mae']:8.2f}% (std={mdict['cv_std']:.2f})")
        if mdict['cv_mae'] < best_score:
            best_score = mdict['cv_mae']
            best_name = mname
    
    print(f"  >>> Best: {best_name} (MAE={best_score:.2f}%)")
    
    # Feature importance
    best_model = models[best_name]['model']
    if hasattr(best_model, 'feature_importances_'):
        importances = best_model.feature_importances_
        print(f"\n  Feature Importances ({best_name}):")
        pairs = sorted(zip(features_list, importances), key=lambda x: -x[1])
        for fname, imp in pairs:
            bar = '#' * int(imp * 40)
            print(f"    {fname:25s} {imp:.4f} {bar}")
    
    return models, best_name


# Train FX model
fx_models, fx_best = train_and_evaluate(X_fx, y_fx, "JPY/HKD FX (10yr)", fx_all_features)

# Train Property model
pr_models, pr_best = train_and_evaluate(X_pr, y_pr, "Property Price (10yr)", pr_all_features)

# ═══════════════════════════════════════════════════════════════════════
# 4. ARIMA BASELINE
# ═══════════════════════════════════════════════════════════════════════
print("\n" + "="*60)
print("  ARIMA BASELINE MODELS")
print("="*60)

# FX ARIMA
try:
    fx_arima = ARIMA(fx_arr, order=(1,1,1))
    fx_arima_fit = fx_arima.fit()
    fx_arima_forecast = fx_arima_fit.forecast(steps=10)
    fx_arima_pct = (fx_arima_forecast[-1] - fx_arr[-1]) / fx_arr[-1] * 100
    print(f"\nFX ARIMA(1,1,1): 10yr forecast change = {fx_arima_pct:+.1f}%")
    print(f"  Current: {fx_arr[-1]:.2f}  ->  10yr: {fx_arima_forecast[-1]:.2f}")
except Exception as e:
    fx_arima_pct = 0
    print(f"FX ARIMA failed: {e}")

# Property ARIMA
try:
    pr_arima = ARIMA(pr_arr, order=(1,1,1))
    pr_arima_fit = pr_arima.fit()
    pr_arima_forecast = pr_arima_forecast = pr_arima_fit.forecast(steps=10)
    pr_arima_pct = (pr_arima_forecast[-1] - pr_arr[-1]) / pr_arr[-1] * 100
    print(f"\nProperty ARIMA(1,1,1): 10yr forecast change = {pr_arima_pct:+.1f}%")
    print(f"  Current: {pr_arr[-1]:.1f}  ->  10yr: {pr_arima_forecast[-1]:.1f}")
except Exception as e:
    pr_arima_pct = 0
    print(f"Property ARIMA failed: {e}")

# ═══════════════════════════════════════════════════════════════════════
# 5. ML ENSEMBLE PREDICTION + MONTE CARLO SIMULATION
# ═══════════════════════════════════════════════════════════════════════
print("\n" + "="*60)
print("  ENSEMBLE PREDICTION & PROBABILITY DISTRIBUTION")
print("="*60)

def ensemble_predict(models_dict, X):
    """Weighted ensemble of all models"""
    total_weight = sum(1.0/(m['cv_mae']**2) for m in models_dict.values())
    pred = 0
    for mname, mdict in models_dict.items():
        w = (1.0/(mdict['cv_mae']**2)) / total_weight
        p = mdict['model'].predict(X)
        pred += w * p
    return pred[0]


# Current features for prediction (using last data point)
def get_current_features(arr, label_name, macro_arr=None, macro_name=None):
    """Get feature vector for the most recent year"""
    n = len(arr)
    feat = {}
    
    for lag in [1, 2, 3, 5]:
        feat[f'{label_name}_lag{lag}'] = arr[n-lag]
    
    for window in [1, 3, 5]:
        feat[f'{label_name}_mom{window}y'] = (arr[-1] - arr[-window]) / arr[-window] * 100
    
    for window in [3, 5]:
        feat[f'{label_name}_ma{window}y'] = np.mean(arr[-window:])
    
    window = 5
    feat[f'{label_name}_vol5y'] = np.std(arr[-window:]) / np.mean(arr[-window:]) * 100
    feat[f'{label_name}_meanrev'] = (arr[-1] - np.mean(arr[-window:])) / np.mean(arr[-window:]) * 100
    
    if macro_arr is not None:
        feat[f'{macro_name}_level'] = macro_arr[-1]
        feat[f'{macro_name}_mom3y'] = macro_arr[-1] - macro_arr[-3]
    
    return feat


fx_now = get_current_features(fx_arr, 'fx', spread_arr, 'spread')
pr_now = get_current_features(pr_arr, 'prop', jr_arr, 'jrate')

# Build prediction vectors aligned with training features
fx_pred_vec = np.array([[fx_now[k] for k in fx_all_features]])
pr_pred_vec = np.array([[pr_now[k] for k in pr_all_features]])

# Ensemble point predictions
fx_ml_pred = ensemble_predict(fx_models, fx_pred_vec)
pr_ml_pred = ensemble_predict(pr_models, pr_pred_vec)

print(f"\nML Ensemble Point Predictions (10yr forward):")
print(f"  JPY/HKD FX change:    {fx_ml_pred:+.1f}%")
print(f"  Property price change: {pr_ml_pred:+.1f}%")
print(f"  ARIMA FX change:       {fx_arima_pct:+.1f}%")
print(f"  ARIMA Prop change:     {pr_arima_pct:+.1f}%")

# Monte Carlo: blend ML point prediction with historical 10yr change distribution
def monte_carlo_simulation(models_dict, X_pred, y_train, n_sims=10000, seed=42):
    """
    Monte Carlo simulation using:
    - ML ensemble as the central tendency (mean)
    - Historical 10yr changes to calibrate uncertainty (std)
    - Blend: 60% ML weight + 40% historical distribution weight
    """
    np.random.seed(seed)
    
    # Point prediction from ensemble
    ml_point = ensemble_predict(models_dict, X_pred)
    
    # Historical 10yr changes (actual observed)
    hist_mean = np.mean(y_train)
    hist_std = np.std(y_train, ddof=1)
    
    # ML model uncertainty (from CV MAE of best model)
    best_name = min(models_dict.keys(), key=lambda k: models_dict[k]['cv_mae'])
    ml_cv_mae = models_dict[best_name]['cv_mae']
    
    # Blend: weighted mean between ML and historical
    ml_weight = 0.6
    hist_weight = 0.4
    blended_mean = ml_weight * ml_point + hist_weight * hist_mean
    
    # Uncertainty = max(ML CV error, historical std) + extra model uncertainty
    base_uncertainty = max(ml_cv_mae, hist_std)
    # Add extra uncertainty for out-of-sample prediction (finite data penalty)
    n = len(y_train)
    extra = ml_cv_mae * np.sqrt(1 + 1/n)  # prediction interval adjustment
    total_std = np.sqrt(base_uncertainty**2 + (extra * 0.5)**2)
    
    # Sample from t-distribution (heavier tails than Gaussian, better for small samples)
    from scipy import stats
    df = max(n - len(X_pred[0]) - 1, 3)  # degrees of freedom
    t_samples = stats.t.rvs(df, loc=0, scale=1, size=n_sims, random_state=seed)
    
    sim_results = blended_mean + total_std * t_samples
    
    return blended_mean, sim_results


fx_point, fx_sims = monte_carlo_simulation(fx_models, fx_pred_vec, y_fx)
pr_point, pr_sims = monte_carlo_simulation(pr_models, pr_pred_vec, y_pr)

print(f"\nMonte Carlo Results ({len(fx_sims)} simulations):")
print(f"  FX 10yr change:  mean={np.mean(fx_sims):+.1f}%, "
      f"P5={np.percentile(fx_sims,5):+.1f}%, "
      f"P25={np.percentile(fx_sims,25):+.1f}%, "
      f"P50={np.percentile(fx_sims,50):+.1f}%, "
      f"P75={np.percentile(fx_sims,75):+.1f}%, "
      f"P95={np.percentile(fx_sims,95):+.1f}%")
print(f"  Prop 10yr change: mean={np.mean(pr_sims):+.1f}%, "
      f"P5={np.percentile(pr_sims,5):+.1f}%, "
      f"P25={np.percentile(pr_sims,25):+.1f}%, "
      f"P50={np.percentile(pr_sims,50):+.1f}%, "
      f"P75={np.percentile(pr_sims,75):+.1f}%, "
      f"P95={np.percentile(pr_sims,95):+.1f}%")

# ═══════════════════════════════════════════════════════════════════════
# 6. PROBABILITY WEIGHTING FOR 84 SCENARIOS
# ═══════════════════════════════════════════════════════════════════════
print("\n" + "="*60)
print("  84 SCENARIO PROBABILITY WEIGHTING")
print("="*60)

ENTRY_FX = 19.5
FX_LEVELS = [13.0, 16.0, 19.5, 22.0, 24.0, 26.0, 28.0]
PRICE_RATES = [-0.03, 0.0, 0.015, 0.03]
HOLD_YEARS = [5, 7, 10]

def calc_scenario_roi(exit_fx, price_rate, hold_years, price_jpy=62400000,
                       ltv=0.40, mortgage_rate=0.03, yield_pct=0.06, cost_rate=0.003):
    """Calculate ROI for a given scenario"""
    eq_jpy = price_jpy * (1 - ltv)
    eq_hkd = eq_jpy / ENTRY_FX
    loan = price_jpy * ltv
    mr = mortgage_rate / 12
    nm = hold_years * 12
    mp = loan * mr * (1+mr)**nm / ((1+mr)**nm - 1)
    
    end_value = price_jpy * (1 + price_rate)**hold_years
    paid = sum([(1+mr)**i for i in range(nm)])
    remaining = loan * (1+mr)**nm - mp * paid
    remaining = max(remaining, 0)
    net_equity = end_value - remaining
    
    annual_rent = price_jpy * yield_pct
    annual_cost = price_jpy * cost_rate
    annual_cf = annual_rent - annual_cost - mp * 12
    total_cf = annual_cf * hold_years
    
    total_jpy = net_equity + total_cf
    total_hkd = total_jpy / exit_fx
    roi = (total_hkd - eq_hkd) / eq_hkd * 100
    gain = total_hkd - eq_hkd
    return roi, gain

def gaussian_weight(value, mean, std):
    """Gaussian probability weight"""
    return np.exp(-0.5 * ((value - mean) / std)**2)

# Convert ML prediction to scenario space
fx_mean_pct = np.mean(fx_sims)
fx_std_pct = np.std(fx_sims)
pr_mean_pct = np.mean(pr_sims)
pr_std_pct = np.std(pr_sims)

print(f"\nML Distribution Parameters:")
print(f"  FX:    mean={fx_mean_pct:+.1f}%, std={fx_std_pct:.1f}%")
print(f"  Prop:  mean={pr_mean_pct:+.1f}%, std={pr_std_pct:.1f}%")

# For each FX level, compute 10yr change from entry
fx_level_changes = [(fx - ENTRY_FX) / ENTRY_FX * 100 for fx in FX_LEVELS]
pr_level_changes = [r * 100 for r in PRICE_RATES]

print(f"\nScenario | FX Level | FX Chg% | FX Prob | Pr Rate% | Pr Prob | Joint P")
print("-" * 80)

scenario_probs = {}
for fi, fx_lev in enumerate(FX_LEVELS):
    fx_chg = fx_level_changes[fi]
    fx_p = gaussian_weight(fx_chg, fx_mean_pct, fx_std_pct)
    
    for pi, pr_rate in enumerate(PRICE_RATES):
        pr_chg = pr_level_changes[pi]
        # Scale property prediction to match scenario horizon
        pr_p = gaussian_weight(pr_chg, pr_mean_pct, pr_std_pct)
        joint = fx_p * pr_p
        scenario_probs[(fi, pi)] = joint
        
        fx_bar = '#' * max(1, int(fx_p * 30))
        pr_bar = '#' * max(1, int(pr_p * 30))
        print(f"  ({fi+1},{pi+1})  |  {fx_lev:5.1f}   | {fx_chg:+6.1f}% | {fx_p:.4f} {fx_bar:15s} | {pr_chg:+5.1f}%  | {pr_p:.4f} {pr_bar:15s} | {joint:.6f}")

# Normalize probabilities
total_p = sum(scenario_probs.values())
for k in scenario_probs:
    scenario_probs[k] /= total_p

print(f"\n(Probabilities normalized, total={sum(scenario_probs.values()):.4f})")

# Calculate weighted returns for each holding period
print(f"\n{'Hold':>5s} | {'Weighted ROI':>14s} | {'Simple Avg ROI':>14s} | {'Diff':>8s}")
print("-" * 55)

weighted_results = {}
for hy in HOLD_YEARS:
    weighted_roi = 0
    simple_roi = 0
    count = 0
    scenarios = []
    
    for (fi, pi), prob in scenario_probs.items():
        exit_fx = FX_LEVELS[fi]
        pr_rate = PRICE_RATES[pi]
        
        # Scale property rate to holding period
        roi, gain = calc_scenario_roi(exit_fx, pr_rate, hy)
        weighted_roi += prob * roi
        simple_roi += roi
        count += 1
        scenarios.append({
            'fx': exit_fx, 'pr': pr_rate, 'hold': hy,
            'roi': roi, 'gain': gain, 'prob': prob
        })
    
    simple_roi /= count
    diff = weighted_roi - simple_roi
    
    print(f"  {hy:3d}y | {weighted_roi:+13.1f}% | {simple_roi:+13.1f}% | {diff:+7.1f}%")
    weighted_results[hy] = {
        'weighted_roi': weighted_roi,
        'simple_roi': simple_roi,
        'scenarios': scenarios
    }

# ═══════════════════════════════════════════════════════════════════════
# 7. GENERATE CHARTS
# ═══════════════════════════════════════════════════════════════════════
print("\n" + "="*60)
print("  GENERATING CHARTS")
print("="*60)

# Color palette
C_PRIMARY = '#1f7692'
C_SECONDARY = '#3b8754'
C_WARNING = '#a5884e'
C_ERROR = '#904c46'
C_LIGHT = '#e8f0f2'

# ── Chart 1: ML Model Comparison ──
fig, axes = plt.subplots(1, 2, figsize=(14, 5))

# FX models
fx_names = list(fx_models.keys())
fx_maes = [fx_models[k]['cv_mae'] for k in fx_names]
colors_fx = [C_PRIMARY if k == fx_best else C_LIGHT for k in fx_names]
bars = axes[0].barh(fx_names, fx_maes, color=colors_fx, edgecolor='#333', linewidth=0.5)
axes[0].set_xlabel('CV MAE (%)', fontsize=11)
axes[0].set_title('FX 模型比較 (10年預測)', fontsize=13, fontweight='bold')
for bar, val in zip(bars, fx_maes):
    axes[0].text(bar.get_width() + 0.3, bar.get_y() + bar.get_height()/2,
                 f'{val:.1f}%', va='center', fontsize=10)
axes[0].set_xlim(0, max(fx_maes) * 1.5)

# Property models
pr_names = list(pr_models.keys())
pr_maes = [pr_models[k]['cv_mae'] for k in pr_names]
colors_pr = [C_SECONDARY if k == pr_best else C_LIGHT for k in pr_names]
bars = axes[1].barh(pr_names, pr_maes, color=colors_pr, edgecolor='#333', linewidth=0.5)
axes[1].set_xlabel('CV MAE (%)', fontsize=11)
axes[1].set_title('物業價格模型比較 (10年預測)', fontsize=13, fontweight='bold')
for bar, val in zip(bars, pr_maes):
    axes[1].text(bar.get_width() + 0.1, bar.get_y() + bar.get_height()/2,
                 f'{val:.1f}%', va='center', fontsize=10)
axes[1].set_xlim(0, max(pr_maes) * 1.5)

plt.tight_layout()
plt.savefig(f'{OUT}ml_charts/model_comparison.png', dpi=150, bbox_inches='tight',
            facecolor='white', edgecolor='none')
plt.close()
print("  Saved: ml_charts/model_comparison.png")

# ── Chart 2: Probability Distribution (FX & Property) ──
fig, axes = plt.subplots(1, 2, figsize=(14, 5.5))

# FX distribution
ax = axes[0]
ax.hist(fx_sims, bins=50, color=C_PRIMARY, alpha=0.7, edgecolor='white', density=True)
ax.axvline(fx_mean_pct, color=C_ERROR, linewidth=2, linestyle='-', label=f'ML 預測: {fx_mean_pct:+.1f}%')
ax.axvline(fx_arima_pct, color=C_WARNING, linewidth=2, linestyle='--', label=f'ARIMA: {fx_arima_pct:+.1f}%')
for fl, chg in zip(FX_LEVELS, fx_level_changes):
    ax.axvline(chg, color='gray', linewidth=0.5, linestyle=':')
ax.set_xlabel('JPY/HKD 10年變化率 (%)', fontsize=11)
ax.set_ylabel('機率密度', fontsize=11)
ax.set_title('匯率預測分佈', fontsize=13, fontweight='bold')
ax.legend(loc='best', fontsize=9)

# Property distribution
ax = axes[1]
ax.hist(pr_sims, bins=50, color=C_SECONDARY, alpha=0.7, edgecolor='white', density=True)
ax.axvline(pr_mean_pct, color=C_ERROR, linewidth=2, linestyle='-', label=f'ML 預測: {pr_mean_pct:+.1f}%')
ax.axvline(pr_arima_pct, color=C_WARNING, linewidth=2, linestyle='--', label=f'ARIMA: {pr_arima_pct:+.1f}%')
for pr, chg in zip(PRICE_RATES, pr_level_changes):
    ax.axvline(chg, color='gray', linewidth=0.5, linestyle=':')
ax.set_xlabel('物業價格 10年變化率 (%)', fontsize=11)
ax.set_ylabel('機率密度', fontsize=11)
ax.set_title('物業價格預測分佈', fontsize=13, fontweight='bold')
ax.legend(loc='best', fontsize=9)

plt.tight_layout()
plt.savefig(f'{OUT}ml_charts/probability_distribution.png', dpi=150, bbox_inches='tight',
            facecolor='white', edgecolor='none')
plt.close()
print("  Saved: ml_charts/probability_distribution.png")

# ── Chart 3: Probability-Weighted Heatmap (10yr) ──
fig, ax = plt.subplots(figsize=(10, 6))

prob_matrix = np.zeros((len(PRICE_RATES), len(FX_LEVELS)))
roi_matrix = np.zeros((len(PRICE_RATES), len(FX_LEVELS)))

for (fi, pi), prob in scenario_probs.items():
    roi, gain = calc_scenario_roi(FX_LEVELS[fi], PRICE_RATES[pi], 10)
    prob_matrix[pi][fi] = prob
    roi_matrix[pi][fi] = roi

# Size = probability, Color = ROI
sizes = prob_matrix / prob_matrix.max() * 2000
scatter = ax.scatter(
    [fx_level_changes[f] for f in range(len(FX_LEVELS)) for p in range(len(PRICE_RATES))],
    [pr_level_changes[p] for f in range(len(FX_LEVELS)) for p in range(len(PRICE_RATES))],
    s=sizes.flatten(),
    c=roi_matrix.flatten(),
    cmap='RdYlGn',
    vmin=-50, vmax=200,
    edgecolors='#333', linewidth=0.5,
    alpha=0.8
)
cbar = plt.colorbar(scatter, ax=ax)
cbar.set_label('ROI (%)', fontsize=11)

ax.set_xlabel('JPY/HKD 10年匯率變化 (%)', fontsize=11)
ax.set_ylabel('物業價格 10年變化 (%)', fontsize=11)
ax.set_title('ML 機率加權 84 情景 (氣泡大小=機率, 顏色=回報)\n持有 10 年', 
             fontsize=13, fontweight='bold')

# Add ML prediction crosshair
ax.axvline(fx_mean_pct, color=C_PRIMARY, linewidth=1.5, linestyle='--', alpha=0.7, label=f'ML FX: {fx_mean_pct:+.1f}%')
ax.axhline(pr_mean_pct, color=C_SECONDARY, linewidth=1.5, linestyle='--', alpha=0.7, label=f'ML Prop: {pr_mean_pct:+.1f}%')
ax.legend(loc='upper left', fontsize=9)

plt.tight_layout()
plt.savefig(f'{OUT}ml_charts/probability_heatmap.png', dpi=150, bbox_inches='tight',
            facecolor='white', edgecolor='none')
plt.close()
print("  Saved: ml_charts/probability_heatmap.png")

# ── Chart 4: Weighted vs Simple ROI Comparison ──
fig, ax = plt.subplots(figsize=(10, 6))

x = np.arange(len(HOLD_YEARS))
width = 0.35

simple_vals = [weighted_results[hy]['simple_roi'] for hy in HOLD_YEARS]
weighted_vals = [weighted_results[hy]['weighted_roi'] for hy in HOLD_YEARS]

bars1 = ax.bar(x - width/2, simple_vals, width, label='簡單平均', color=C_LIGHT, 
               edgecolor='#333', linewidth=0.5)
bars2 = ax.bar(x + width/2, weighted_vals, width, label='ML 機率加權', color=C_PRIMARY,
               edgecolor='#333', linewidth=0.5)

ax.set_xlabel('持有年期', fontsize=11)
ax.set_ylabel('回報率 (%)', fontsize=11)
ax.set_title('簡單平均 vs ML 機率加權回報比較', fontsize=13, fontweight='bold')
ax.set_xticks(x)
ax.set_xticklabels([f'{y} 年' for y in HOLD_YEARS])
ax.legend(loc='best', fontsize=10)
ax.axhline(0, color='gray', linewidth=0.5)

for bar, val in zip(bars1, simple_vals):
    ax.text(bar.get_x() + bar.get_width()/2, bar.get_height() + 1,
            f'{val:+.1f}%', ha='center', fontsize=9)
for bar, val in zip(bars2, weighted_vals):
    ax.text(bar.get_x() + bar.get_width()/2, bar.get_height() + 1,
            f'{val:+.1f}%', ha='center', fontsize=9)

plt.tight_layout()
plt.savefig(f'{OUT}ml_charts/weighted_vs_simple.png', dpi=150, bbox_inches='tight',
            facecolor='white', edgecolor='none')
plt.close()
print("  Saved: ml_charts/weighted_vs_simple.png")

# ── Chart 5: Feature Importance ──
fig, axes = plt.subplots(1, 2, figsize=(14, 5))

# FX feature importance
best_fx = fx_models[fx_best]['model']
if hasattr(best_fx, 'feature_importances_'):
    imp = best_fx.feature_importances_
    sorted_idx = np.argsort(imp)
    axes[0].barh(range(len(fx_all_features)), imp[sorted_idx], color=C_PRIMARY, alpha=0.8)
    axes[0].set_yticks(range(len(fx_all_features)))
    axes[0].set_yticklabels([fx_all_features[i] for i in sorted_idx], fontsize=8)
    axes[0].set_title(f'FX 特徵重要性 ({fx_best})', fontsize=12, fontweight='bold')
    axes[0].set_xlabel('重要性', fontsize=10)

# Property feature importance
best_pr = pr_models[pr_best]['model']
if hasattr(best_pr, 'feature_importances_'):
    imp = best_pr.feature_importances_
    sorted_idx = np.argsort(imp)
    axes[1].barh(range(len(pr_all_features)), imp[sorted_idx], color=C_SECONDARY, alpha=0.8)
    axes[1].set_yticks(range(len(pr_all_features)))
    axes[1].set_yticklabels([pr_all_features[i] for i in sorted_idx], fontsize=8)
    axes[1].set_title(f'物業特徵重要性 ({pr_best})', fontsize=12, fontweight='bold')
    axes[1].set_xlabel('重要性', fontsize=10)

plt.tight_layout()
plt.savefig(f'{OUT}ml_charts/feature_importance.png', dpi=150, bbox_inches='tight',
            facecolor='white', edgecolor='none')
plt.close()
print("  Saved: ml_charts/feature_importance.png")

# ═══════════════════════════════════════════════════════════════════════
# 8. SUMMARY OUTPUT
# ═══════════════════════════════════════════════════════════════════════
print("\n" + "="*60)
print("  FINAL SUMMARY")
print("="*60)

print(f"""
ML 預測模型版本 - 日本物業投資風險分析
========================================

投入參數:
  物業價值: JPY 62,400,000 (HKD 3,200,000)
  入場匯率: JPY/HKD {ENTRY_FX}
  持有年期: {', '.join(str(y)+'年' for y in HOLD_YEARS)}

ML 模型表現:
  FX 最佳模型: {fx_best} (CV MAE = {fx_models[fx_best]['cv_mae']:.1f}%)
  物業最佳模型: {pr_best} (CV MAE = {pr_models[pr_best]['cv_mae']:.1f}%)
  ARIMA FX: {fx_arima_pct:+.1f}%
  ARIMA Prop: {pr_arima_pct:+.1f}%

ML 預測 (10 年):
  匯率變化: {fx_mean_pct:+.1f}% (P5={np.percentile(fx_sims,5):+.1f}%, P95={np.percentile(fx_sims,95):+.1f}%)
  物業價格變化: {pr_mean_pct:+.1f}% (P5={np.percentile(pr_sims,5):+.1f}%, P95={np.percentile(pr_sims,95):+.1f}%)
""")

for hy in HOLD_YEARS:
    wr = weighted_results[hy]
    print(f"持有 {hy} 年:")
    print(f"  簡單平均 ROI: {wr['simple_roi']:+.1f}%")
    print(f"  ML 加權 ROI:  {wr['weighted_roi']:+.1f}%")
    # Top 5 most probable scenarios
    top5 = sorted(wr['scenarios'], key=lambda s: -s['prob'])[:5]
    print(f"  最高機率 5 個情景:")
    for s in top5:
        print(f"    FX={s['fx']:.1f}, 樓價年變幅={s['pr']*100:+.1f}%, "
              f"ROI={s['roi']:+.1f}%, 機率={s['prob']*100:.1f}%")
    print()

# Save results to JSON
output = {
    'ml_predictions': {
        'fx_10yr': {'mean': round(fx_mean_pct, 1), 'std': round(fx_std_pct, 1),
                    'p5': round(float(np.percentile(fx_sims, 5)), 1),
                    'p25': round(float(np.percentile(fx_sims, 25)), 1),
                    'p50': round(float(np.percentile(fx_sims, 50)), 1),
                    'p75': round(float(np.percentile(fx_sims, 75)), 1),
                    'p95': round(float(np.percentile(fx_sims, 95)), 1)},
        'property_10yr': {'mean': round(pr_mean_pct, 1), 'std': round(pr_std_pct, 1),
                         'p5': round(float(np.percentile(pr_sims, 5)), 1),
                         'p25': round(float(np.percentile(pr_sims, 25)), 1),
                         'p50': round(float(np.percentile(pr_sims, 50)), 1),
                         'p75': round(float(np.percentile(pr_sims, 75)), 1),
                         'p95': round(float(np.percentile(pr_sims, 95)), 1)},
        'arima_fx': round(fx_arima_pct, 1),
        'arima_property': round(pr_arima_pct, 1),
    },
    'model_performance': {
        'fx': {k: {'cv_mae': round(v['cv_mae'], 2)} for k, v in fx_models.items()},
        'property': {k: {'cv_mae': round(v['cv_mae'], 2)} for k, v in pr_models.items()},
        'fx_best': fx_best,
        'property_best': pr_best,
    },
    'weighted_returns': {
        str(hy): {
            'weighted_roi': round(wr['weighted_roi'], 1),
            'simple_roi': round(wr['simple_roi'], 1),
            'top5_scenarios': [
                {'fx': s['fx'], 'price_rate': s['pr'], 'roi': round(s['roi'], 1),
                 'prob_pct': round(s['prob']*100, 1)}
                for s in sorted(wr['scenarios'], key=lambda s: -s['prob'])[:5]
            ]
        } for hy, wr in weighted_results.items()
    }
}

with open(f'{OUT}ml_charts/ml_prediction_results.json', 'w', encoding='utf-8') as f:
    json.dump(output, f, ensure_ascii=False, indent=2)
print("Saved: ml_charts/ml_prediction_results.json")
print("\nDone!")