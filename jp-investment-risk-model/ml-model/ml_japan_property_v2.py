#!/usr/bin/env python3
"""
日本物業投資 ML 預測模型 V2 — 真實 FRED 數據版
===================================================
用 FRED 真實月度/季度數據（非估計）：
  - EXJPUS: JPY/USD 月度匯率 (1971-2026, 665 點)
  - QJPN628BIS: 日本住宅價格指數 季度 (1955-2025, 284 點)
  - FEDFUNDS: 美國聯邦基金利率 月度 (1954-2026, 863 點)
  - IRSTCI01JPM156N: 日本政策利率 月度 (1985-2026, 490 點)

用季度匯率做對齊，預測 10 年變化率
訓練樣本：從 16 個 → 80+ 個
"""

import json
import io
import numpy as np
import pandas as pd
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.font_manager as fm
from sklearn.ensemble import GradientBoostingRegressor, RandomForestRegressor
from sklearn.model_selection import TimeSeriesSplit, cross_val_score
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
import xgboost as xgb
import lightgbm as lgb
from statsmodels.tsa.arima.model import ARIMA
from scipy import stats
import requests
import warnings
warnings.filterwarnings('ignore')

# ── Chinese font setup ──
fm.fontManager.addfont('/usr/share/fonts/truetype/wqy/wqy-zenhei.ttc')
fm.fontManager.addfont('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf')
plt.rcParams['font.sans-serif'] = ['WenQuanYi Zen Hei', 'DejaVu Sans']
plt.rcParams['axes.unicode_minus'] = False

OUT = '/home/z/my-project/download/ml_charts/'

# ═══════════════════════════════════════════════════════════════════════
# 1. DOWNLOAD REAL DATA FROM FRED
# ═══════════════════════════════════════════════════════════════════════
print("="*60)
print("  DOWNLOADING REAL DATA FROM FRED")
print("="*60)

FRED_SERIES = {
    'EXJPUS': 'JPY per USD (monthly)',
    'QJPN628BIS': 'Japan Residential Property Price (quarterly)',
    'FEDFUNDS': 'US Federal Funds Rate (monthly)',
    'IRSTCI01JPM156N': 'Japan Policy Rate (monthly)',
}

dataframes = {}
for code, name in FRED_SERIES.items():
    url = f"https://fred.stlouisfed.org/graph/fredgraph.csv?id={code}"
    try:
        resp = requests.get(url, timeout=60)
        if resp.status_code == 200:
            df = pd.read_csv(io.StringIO(resp.text), parse_dates=['observation_date'])
            df = df.rename(columns={code: 'value'})
            df = df.dropna()
            df = df.set_index('observation_date').sort_index()
            dataframes[code] = df
            print(f"  OK {code:25s} ({name}): {len(df):4d} points, "
                  f"{df.index[0].strftime('%Y-%m')} to {df.index[-1].strftime('%Y-%m')}")
        else:
            print(f"  FAIL {code}: HTTP {resp.status_code}")
    except Exception as e:
        print(f"  FAIL {code}: {e}")

# ═══════════════════════════════════════════════════════════════════════
# 2. PREPARE ANALYSIS DATASET (Quarterly frequency, 1990-2025)
# ═══════════════════════════════════════════════════════════════════════
print("\n" + "="*60)
print("  PREPARING QUARTERLY DATASET")
print("="*60)

# Resample everything to quarterly
import io

def to_quarterly(df):
    """Resample to quarterly end-of-period"""
    return df.resample('QS').last()

fx_q = to_quarterly(dataframes['EXJPUS'])
prop_q = dataframes['QJPN628BIS']  # already quarterly
us_rate_q = to_quarterly(dataframes['FEDFUNDS'])
jp_rate_q = to_quarterly(dataframes['IRSTCI01JPM156N'])

# Merge on date
df = pd.DataFrame({
    'usd_jpy': fx_q['value'],
    'prop_idx': prop_q['value'],
    'us_rate': us_rate_q['value'],
    'jp_rate': jp_rate_q['value'],
})

# Filter to 1990-2025 and drop NaN
df = df.loc['1990':'2025'].dropna()
print(f"\nQuarterly dataset: {len(df)} quarters")
if len(df) > 0:
    print(f"  Range: {df.index[0].strftime('%Y-%m')} to {df.index[-1].strftime('%Y-%m')}")

# Convert to JPY/HKD (USD/HKD pegged at 7.80)
df['jpy_hkd'] = df['usd_jpy'] * 7.80

# Derived features
df['rate_spread'] = df['us_rate'] - df['jp_rate']
df['fx_change_1q'] = df['jpy_hkd'].pct_change(1) * 100
df['fx_change_4q'] = df['jpy_hkd'].pct_change(4) * 100
df['fx_change_8q'] = df['jpy_hkd'].pct_change(8) * 100
df['fx_ma4'] = df['jpy_hkd'].rolling(4).mean()
df['fx_ma8'] = df['jpy_hkd'].rolling(8).mean()
df['fx_vol8'] = df['jpy_hkd'].rolling(8).std() / df['fx_ma8'] * 100
df['fx_meanrev'] = (df['jpy_hkd'] - df['fx_ma8']) / df['fx_ma8'] * 100

df['prop_change_1q'] = df['prop_idx'].pct_change(1) * 100
df['prop_change_4q'] = df['prop_idx'].pct_change(4) * 100
df['prop_change_8q'] = df['prop_idx'].pct_change(8) * 100
df['prop_ma4'] = df['prop_idx'].rolling(4).mean()
df['prop_ma8'] = df['prop_idx'].rolling(8).mean()
df['prop_vol8'] = df['prop_idx'].rolling(8).std() / df['prop_ma8'] * 100
df['prop_meanrev'] = (df['prop_idx'] - df['prop_ma8']) / df['prop_ma8'] * 100

df['spread_change_4q'] = df['rate_spread'].diff(4)
df['us_rate_change_4q'] = df['us_rate'].diff(4)
df['jp_rate_change_4q'] = df['jp_rate'].diff(4)

# Target: 10-year (40 quarter) forward return
HORIZON = 40  # 10 years in quarters
df['fx_target_10y'] = df['jpy_hkd'].shift(-HORIZON).pct_change(HORIZON) * 100
df['prop_target_10y'] = df['prop_idx'].shift(-HORIZON).pct_change(HORIZON) * 100

df = df.dropna()
print(f"Training samples: {len(df)} (after feature creation + dropna)")

# ═══════════════════════════════════════════════════════════════════════
# 3. FEATURE SELECTION & SPLIT
# ═══════════════════════════════════════════════════════════════════════
print("\n" + "="*60)
print("  FEATURE ENGINEERING")
print("="*60)

FX_FEATURES = [
    'jpy_hkd', 'fx_change_1q', 'fx_change_4q', 'fx_change_8q',
    'fx_ma4', 'fx_ma8', 'fx_vol8', 'fx_meanrev',
    'rate_spread', 'spread_change_4q',
    'us_rate', 'jp_rate', 'us_rate_change_4q', 'jp_rate_change_4q',
    'prop_change_4q',  # cross-feature: property momentum affects FX
]

PR_FEATURES = [
    'prop_idx', 'prop_change_1q', 'prop_change_4q', 'prop_change_8q',
    'prop_ma4', 'prop_ma8', 'prop_vol8', 'prop_meanrev',
    'jp_rate', 'jp_rate_change_4q', 'rate_spread',
    'fx_change_4q',  # cross-feature: FX momentum affects property
]

X_fx = df[FX_FEATURES].values
y_fx = df['fx_target_10y'].values
X_pr = df[PR_FEATURES].values
y_pr = df['prop_target_10y'].values

print(f"FX features ({len(FX_FEATURES)}): {FX_FEATURES}")
print(f"Property features ({len(PR_FEATURES)}): {PR_FEATURES}")
print(f"\nFX:   X={X_fx.shape}, y range=[{y_fx.min():.1f}%, {y_fx.max():.1f}%]")
print(f"Prop: X={X_pr.shape}, y range=[{y_pr.min():.1f}%, {y_pr.max():.1f}%]")

# ═══════════════════════════════════════════════════════════════════════
# 4. TRAIN ML MODELS
# ═══════════════════════════════════════════════════════════════════════
print("\n" + "="*60)
print("  MODEL TRAINING (TimeSeries CV)")
print("="*60)

def train_models(X, y, name, feature_names):
    tscv = TimeSeriesSplit(n_splits=5)
    models = {}
    
    configs = {
        'XGBoost': xgb.XGBRegressor(
            n_estimators=300, max_depth=4, learning_rate=0.03,
            subsample=0.8, colsample_bytree=0.7, random_state=42,
            min_child_weight=3, reg_alpha=0.3, reg_lambda=2.0
        ),
        'LightGBM': lgb.LGBMRegressor(
            n_estimators=300, max_depth=4, learning_rate=0.03,
            subsample=0.8, colsample_bytree=0.7, random_state=42,
            reg_alpha=0.3, reg_lambda=2.0, verbose=-1,
            num_leaves=15
        ),
        'RandomForest': RandomForestRegressor(
            n_estimators=500, max_depth=5, min_samples_leaf=3, random_state=42
        ),
        'GBR': GradientBoostingRegressor(
            n_estimators=300, max_depth=4, learning_rate=0.03,
            subsample=0.8, min_samples_leaf=3, random_state=42
        ),
    }
    
    print(f"\n--- {name} ({len(X)} samples, {len(feature_names)} features) ---")
    for mname, model in configs.items():
        scores = cross_val_score(model, X, y, cv=tscv, scoring='neg_mean_absolute_error')
        model.fit(X, y)
        models[mname] = {
            'model': model,
            'cv_mae': -scores.mean(),
            'cv_std': scores.std(),
        }
        print(f"  {mname:15s}: CV MAE = {models[mname]['cv_mae']:7.2f}% (std={models[mname]['cv_std']:.2f})")
    
    best_name = min(models.keys(), key=lambda k: models[k]['cv_mae'])
    print(f"  >>> Best: {best_name} (MAE={models[best_name]['cv_mae']:.2f}%)")
    
    # Feature importance
    best_model = models[best_name]['model']
    if hasattr(best_model, 'feature_importances_'):
        imp = best_model.feature_importances_
        print(f"\n  Top Features ({best_name}):")
        pairs = sorted(zip(feature_names, imp), key=lambda x: -x[1])
        for fname, fimp in pairs[:8]:
            bar = '#' * int(fimp * 50)
            print(f"    {fname:25s} {fimp:.4f} {bar}")
    
    return models, best_name

fx_models, fx_best = train_models(X_fx, y_fx, "JPY/HKD FX (10yr)", FX_FEATURES)
pr_models, pr_best = train_models(X_pr, y_pr, "Property Price (10yr)", PR_FEATURES)

# ═══════════════════════════════════════════════════════════════════════
# 5. ARIMA BASELINES (on quarterly data)
# ═══════════════════════════════════════════════════════════════════════
print("\n" + "="*60)
print("  ARIMA BASELINES")
print("="*60)

try:
    fx_arima = ARIMA(df['jpy_hkd'].values, order=(2,1,2))
    fx_arima_fit = fx_arima.fit()
    fx_arima_fc = fx_arima_fit.forecast(steps=HORIZON)
    fx_arima_pct = (fx_arima_fc[-1] - df['jpy_hkd'].values[-1]) / df['jpy_hkd'].values[-1] * 100
    print(f"FX ARIMA(2,1,2): {fx_arima_pct:+.1f}% (current {df['jpy_hkd'].values[-1]:.2f} -> {fx_arima_fc[-1]:.2f})")
except Exception as e:
    fx_arima_pct = 0
    print(f"FX ARIMA failed: {e}")

try:
    pr_arima = ARIMA(df['prop_idx'].values, order=(1,1,1))
    pr_arima_fit = pr_arima.fit()
    pr_arima_fc = pr_arima_fit.forecast(steps=HORIZON)
    pr_arima_pct = (pr_arima_fc[-1] - df['prop_idx'].values[-1]) / df['prop_idx'].values[-1] * 100
    print(f"Property ARIMA(1,1,1): {pr_arima_pct:+.1f}% (current {df['prop_idx'].values[-1]:.1f} -> {pr_arima_fc[-1]:.1f})")
except Exception as e:
    pr_arima_pct = 0
    print(f"Property ARIMA failed: {e}")

# ═══════════════════════════════════════════════════════════════════════
# 6. ENSEMBLE PREDICTION + MONTE CARLO
# ═══════════════════════════════════════════════════════════════════════
print("\n" + "="*60)
print("  ENSEMBLE PREDICTION & PROBABILITY DISTRIBUTION")
print("="*60)

def ensemble_predict(models_dict, X):
    total_weight = sum(1.0/(m['cv_mae']**2) for m in models_dict.values())
    pred = 0
    for mname, mdict in models_dict.items():
        w = (1.0/(mdict['cv_mae']**2)) / total_weight
        pred += w * mdict['model'].predict(X)[0]
    return pred

def monte_carlo_v2(models_dict, X_now, y_train, n_sims=10000, seed=42, ml_weight=0.55):
    """
    V2 MC: blend ML prediction with historical distribution
    Use t-distribution for heavier tails (robust with ~80 samples)
    """
    np.random.seed(seed)
    ml_point = ensemble_predict(models_dict, X_now)
    hist_mean = np.mean(y_train)
    hist_std = np.std(y_train, ddof=1)
    
    best_name = min(models_dict.keys(), key=lambda k: models_dict[k]['cv_mae'])
    cv_mae = models_dict[best_name]['cv_mae']
    n = len(y_train)
    
    # Blended mean
    blended_mean = ml_weight * ml_point + (1 - ml_weight) * hist_mean
    
    # Uncertainty: combine CV error with historical vol + prediction penalty
    pred_std = cv_mae * np.sqrt(1 + 1/n)
    total_std = np.sqrt(0.5 * hist_std**2 + 0.5 * pred_std**2)
    
    # t-distribution (heavier tails, better for financial data)
    df_t = max(n - len(X_now[0]) - 1, 5)
    t_samples = stats.t.rvs(df_t, loc=0, scale=1, size=n_sims, random_state=seed)
    sims = blended_mean + total_std * t_samples
    
    return ml_point, blended_mean, sims

# Current features
fx_now = X_fx[-1:].copy()
pr_now = X_pr[-1:].copy()
fx_ml_point, fx_blended, fx_sims = monte_carlo_v2(fx_models, fx_now, y_fx)
pr_ml_point, pr_blended, pr_sims = monte_carlo_v2(pr_models, pr_now, y_pr)

print(f"\nML Ensemble Predictions (10yr forward):")
print(f"  JPY/HKD FX:    ML={fx_ml_point:+.1f}%, Blended={fx_blended:+.1f}%")
print(f"  Property:      ML={pr_ml_point:+.1f}%, Blended={pr_blended:+.1f}%")
print(f"  ARIMA FX:      {fx_arima_pct:+.1f}%")
print(f"  ARIMA Property:{pr_arima_pct:+.1f}%")

print(f"\nMonte Carlo ({len(fx_sims)} sims):")
for label, sims in [("FX", fx_sims), ("Property", pr_sims)]:
    pcts = [np.percentile(sims, p) for p in [5, 25, 50, 75, 95]]
    print(f"  {label:10s}: mean={np.mean(sims):+6.1f}%, "
          f"P5={pcts[0]:+6.1f}%, P25={pcts[1]:+6.1f}%, "
          f"P50={pcts[2]:+6.1f}%, P75={pcts[3]:+6.1f}%, P95={pcts[4]:+6.1f}%")

# ═══════════════════════════════════════════════════════════════════════
# 7. 84 SCENARIO PROBABILITY WEIGHTING
# ═══════════════════════════════════════════════════════════════════════
print("\n" + "="*60)
print("  84 SCENARIO PROBABILITY WEIGHTING")
print("="*60)

ENTRY_FX = 19.5
FX_LEVELS = [13.0, 16.0, 19.5, 22.0, 24.0, 26.0, 28.0]
PRICE_RATES = [-0.03, 0.0, 0.015, 0.03]
HOLD_YEARS = [5, 7, 10]

def calc_scenario_roi(exit_fx, price_rate, hold_years, price_jpy=62400000):
    eq_jpy = price_jpy * 0.60
    eq_hkd = eq_jpy / ENTRY_FX
    loan = price_jpy * 0.40
    mr = 0.03 / 12
    nm = hold_years * 12
    mp = loan * mr * (1+mr)**nm / ((1+mr)**nm - 1)
    end_value = price_jpy * (1 + price_rate)**hold_years
    paid = sum([(1+mr)**i for i in range(nm)])
    remaining = max(loan * (1+mr)**nm - mp * paid, 0)
    net_eq = end_value - remaining
    annual_rent = price_jpy * 0.06
    annual_cost = price_jpy * 0.003
    annual_cf = annual_rent - annual_cost - mp * 12
    total_cf = annual_cf * hold_years
    total_jpy = net_eq + total_cf
    total_hkd = total_jpy / exit_fx
    roi = (total_hkd - eq_hkd) / eq_hkd * 100
    return roi, total_hkd - eq_hkd

def gauss_w(val, mean, std):
    return np.exp(-0.5 * ((val - mean) / max(std, 1))**2)

fx_mean_mc = np.mean(fx_sims)
fx_std_mc = np.std(fx_sims)
pr_mean_mc = np.mean(pr_sims)
pr_std_mc = np.std(pr_sims)

print(f"  FX dist:   mean={fx_mean_mc:+.1f}%, std={fx_std_mc:.1f}%")
print(f"  Prop dist: mean={pr_mean_mc:+.1f}%, std={pr_std_mc:.1f}%")

# Scale property prediction to 10yr for scenario matching
pr_10yr_mean = pr_mean_mc  # already 10yr
pr_10yr_std = pr_std_mc

fx_level_changes = [(fx - ENTRY_FX) / ENTRY_FX * 100 for fx in FX_LEVELS]
pr_level_annual = [r for r in PRICE_RATES]
pr_level_10yr = [r * 100 for r in PRICE_RATES]  # total 10yr change

scenario_probs = {}
for fi in range(len(FX_LEVELS)):
    fx_p = gauss_w(fx_level_changes[fi], fx_mean_mc, fx_std_mc)
    for pi in range(len(PRICE_RATES)):
        pr_p = gauss_w(pr_level_10yr[pi], pr_10yr_mean, pr_10yr_std)
        scenario_probs[(fi, pi)] = fx_p * pr_p

total_p = sum(scenario_probs.values())
for k in scenario_probs:
    scenario_probs[k] /= total_p

# Calculate weighted returns
print(f"\n{'Hold':>5s} | {'Weighted ROI':>14s} | {'Simple Avg':>12s} | {'Diff':>8s}")
print("-" * 50)
weighted_results = {}
for hy in HOLD_YEARS:
    w_roi, s_roi, count = 0, 0, 0
    scenarios = []
    for (fi, pi), prob in scenario_probs.items():
        roi, gain = calc_scenario_roi(FX_LEVELS[fi], PRICE_RATES[pi], hy)
        w_roi += prob * roi
        s_roi += roi
        count += 1
        scenarios.append({'fx': FX_LEVELS[fi], 'pr': PRICE_RATES[pi],
                         'hold': hy, 'roi': roi, 'gain': gain, 'prob': prob})
    s_roi /= count
    print(f"  {hy:3d}y | {w_roi:+13.1f}% | {s_roi:+11.1f}% | {w_roi-s_roi:+7.1f}%")
    weighted_results[hy] = {'weighted_roi': w_roi, 'simple_roi': s_roi, 'scenarios': scenarios}

# ═══════════════════════════════════════════════════════════════════════
# 8. GENERATE CHARTS
# ═══════════════════════════════════════════════════════════════════════
print("\n" + "="*60)
print("  GENERATING CHARTS")
print("="*60)

C1, C2, C3, C4 = '#1f7692', '#3b8754', '#a5884e', '#904c46'
CL = '#e8f0f2'

# ── Chart 1: Historical Data Overview ──
fig, axes = plt.subplots(2, 2, figsize=(14, 9))

# FX history
ax = axes[0, 0]
ax.plot(df.index, df['jpy_hkd'], color=C1, linewidth=1.2)
ax.set_title('JPY/HKD 匯率 (季度, FRED EXJPUS)', fontsize=12, fontweight='bold')
ax.set_ylabel('JPY/HKD')
ax.axhline(ENTRY_FX * 7.80, color=C4, linestyle='--', alpha=0.5, label=f'Entry level ({ENTRY_FX*7.80:.1f})')
ax.legend(loc='best', fontsize=9)

# Property index
ax = axes[0, 1]
ax.plot(df.index, df['prop_idx'], color=C2, linewidth=1.2)
ax.set_title('日本住宅價格指數 (季度, BIS QJPN628BIS)', fontsize=12, fontweight='bold')
ax.set_ylabel('指數')

# Rate spread
ax = axes[1, 0]
ax.fill_between(df.index, df['us_rate'], df['jp_rate'], alpha=0.3, color=C3, label='息差')
ax.plot(df.index, df['us_rate'], color=C3, linewidth=1, label='美國利率')
ax.plot(df.index, df['jp_rate'], color=C1, linewidth=1, label='日本利率')
ax.set_title('日美利率 (FRED FEDFUNDS / IRSTCI01JPM156N)', fontsize=12, fontweight='bold')
ax.set_ylabel('利率 (%)')
ax.legend(loc='best', fontsize=9)

# 10yr rolling returns
ax = axes[1, 1]
fx_10yr = df['jpy_hkd'].pct_change(HORIZON) * 100
pr_10yr = df['prop_idx'].pct_change(HORIZON) * 100
ax.bar(fx_10yr.dropna().index, fx_10yr.dropna().values, width=80, color=C1, alpha=0.6, label='FX 10yr 變化%')
ax.bar(pr_10yr.dropna().index, pr_10yr.dropna().values, width=80, color=C2, alpha=0.6, label='樓價 10yr 變化%')
ax.axhline(0, color='gray', linewidth=0.5)
ax.set_title('歷史 10 年滾動變化率', fontsize=12, fontweight='bold')
ax.set_ylabel('變化率 (%)')
ax.legend(loc='best', fontsize=9)

plt.tight_layout()
plt.savefig(f'{OUT}v2_data_overview.png', dpi=150, bbox_inches='tight', facecolor='white')
plt.close()
print("  Saved: v2_data_overview.png")

# ── Chart 2: Model Comparison ──
fig, axes = plt.subplots(1, 2, figsize=(14, 5))

for ax, models_dict, best, title, color in [
    (axes[0], fx_models, fx_best, 'FX 模型比較 (V2: 80+ samples)', C1),
    (axes[1], pr_models, pr_best, '物業價格模型比較 (V2: 80+ samples)', C2),
]:
    names = list(models_dict.keys())
    maes = [models_dict[k]['cv_mae'] for k in names]
    stds = [models_dict[k]['cv_std'] for k in names]
    colors = [color if k == best else CL for k in names]
    bars = ax.barh(names, maes, xerr=stds, color=colors, edgecolor='#333', linewidth=0.5, capsize=3)
    ax.set_xlabel('CV MAE (%)', fontsize=11)
    ax.set_title(title, fontsize=12, fontweight='bold')
    for bar, val in zip(bars, maes):
        ax.text(bar.get_width() + 0.5, bar.get_y() + bar.get_height()/2,
                f'{val:.1f}%', va='center', fontsize=10)
    ax.set_xlim(0, max(maes) * 1.6)

plt.tight_layout()
plt.savefig(f'{OUT}v2_model_comparison.png', dpi=150, bbox_inches='tight', facecolor='white')
plt.close()
print("  Saved: v2_model_comparison.png")

# ── Chart 3: Probability Distributions ──
fig, axes = plt.subplots(1, 2, figsize=(14, 5.5))

ax = axes[0]
ax.hist(fx_sims, bins=60, color=C1, alpha=0.7, edgecolor='white', density=True, label='Monte Carlo')
xmin, xmax = ax.get_xlim()
x_grid = np.linspace(xmin, xmax, 200)
ax.plot(x_grid, stats.t.pdf(x_grid, df=20, loc=fx_blended, scale=fx_std_mc),
        color=C4, linewidth=2, label=f'ML 預測: {fx_blended:+.1f}%')
ax.axvline(fx_arima_pct, color=C3, linewidth=2, linestyle='--', label=f'ARIMA: {fx_arima_pct:+.1f}%')
for fl, chg in zip(FX_LEVELS, fx_level_changes):
    ax.axvline(chg, color='gray', linewidth=0.5, linestyle=':')
    ax.text(chg, ax.get_ylim()[1]*0.95, f'{fl}', ha='center', fontsize=7, color='gray')
ax.set_xlabel('JPY/HKD 10 年變化率 (%)', fontsize=11)
ax.set_ylabel('機率密度', fontsize=11)
ax.set_title('匯率預測分佈 (V2)', fontsize=13, fontweight='bold')
ax.legend(loc='best', fontsize=9)

ax = axes[1]
ax.hist(pr_sims, bins=60, color=C2, alpha=0.7, edgecolor='white', density=True, label='Monte Carlo')
xmin, xmax = ax.get_xlim()
x_grid = np.linspace(xmin, xmax, 200)
ax.plot(x_grid, stats.t.pdf(x_grid, df=20, loc=pr_blended, scale=pr_std_mc),
        color=C4, linewidth=2, label=f'ML 預測: {pr_blended:+.1f}%')
ax.axvline(pr_arima_pct, color=C3, linewidth=2, linestyle='--', label=f'ARIMA: {pr_arima_pct:+.1f}%')
for pr, chg in zip(PRICE_RATES, pr_level_10yr):
    ax.axvline(chg, color='gray', linewidth=0.5, linestyle=':')
    ax.text(chg, ax.get_ylim()[1]*0.95, f'{pr*100:+.0f}%', ha='center', fontsize=7, color='gray')
ax.set_xlabel('物業價格 10 年變化率 (%)', fontsize=11)
ax.set_ylabel('機率密度', fontsize=11)
ax.set_title('物業價格預測分佈 (V2)', fontsize=13, fontweight='bold')
ax.legend(loc='best', fontsize=9)

plt.tight_layout()
plt.savefig(f'{OUT}v2_probability_distribution.png', dpi=150, bbox_inches='tight', facecolor='white')
plt.close()
print("  Saved: v2_probability_distribution.png")

# ── Chart 4: Probability-Weighted Heatmap ──
fig, ax = plt.subplots(figsize=(10, 6))

prob_matrix = np.zeros((len(PRICE_RATES), len(FX_LEVELS)))
roi_matrix = np.zeros((len(PRICE_RATES), len(FX_LEVELS)))
for (fi, pi), prob in scenario_probs.items():
    roi, _ = calc_scenario_roi(FX_LEVELS[fi], PRICE_RATES[pi], 10)
    prob_matrix[pi][fi] = prob
    roi_matrix[pi][fi] = roi

sizes = prob_matrix / prob_matrix.max() * 2500
sc = ax.scatter(
    [fx_level_changes[f] for f in range(len(FX_LEVELS)) for p in range(len(PRICE_RATES))],
    [pr_level_10yr[p] for f in range(len(FX_LEVELS)) for p in range(len(PRICE_RATES))],
    s=sizes.flatten(), c=roi_matrix.flatten(), cmap='RdYlGn',
    vmin=-50, vmax=250, edgecolors='#333', linewidth=0.5, alpha=0.8
)
cbar = plt.colorbar(sc, ax=ax)
cbar.set_label('ROI (%)', fontsize=11)
ax.set_xlabel('JPY/HKD 10 年匯率變化 (%)', fontsize=11)
ax.set_ylabel('物業價格 10 年變化 (%)', fontsize=11)
ax.set_title('ML 機率加權 84 情景 (氣泡=機率, 顏色=回報)\n持有 10 年 [V2 真實數據版]',
             fontsize=13, fontweight='bold')
ax.axvline(fx_mean_mc, color=C1, linewidth=1.5, linestyle='--', alpha=0.7,
           label=f'ML FX: {fx_mean_mc:+.1f}%')
ax.axhline(pr_mean_mc, color=C2, linewidth=1.5, linestyle='--', alpha=0.7,
           label=f'ML Prop: {pr_mean_mc:+.1f}%')
ax.legend(loc='upper left', fontsize=9)
plt.tight_layout()
plt.savefig(f'{OUT}v2_probability_heatmap.png', dpi=150, bbox_inches='tight', facecolor='white')
plt.close()
print("  Saved: v2_probability_heatmap.png")

# ── Chart 5: Weighted vs Simple + V1 vs V2 ──
fig, ax = plt.subplots(figsize=(10, 6))

x = np.arange(len(HOLD_YEARS))
w = 0.25
simple = [weighted_results[hy]['simple_roi'] for hy in HOLD_YEARS]
weighted = [weighted_results[hy]['weighted_roi'] for hy in HOLD_YEARS]
# V1 results for comparison
v1_simple = [43.4, 62.1, 90.7]
v1_weighted = [46.6, 65.8, 95.2]

bars1 = ax.bar(x - 1.5*w, v1_simple, w, label='V1 簡單平均 (31年年度)', color='#ccc', edgecolor='#333', linewidth=0.5)
bars2 = ax.bar(x - 0.5*w, v1_weighted, w, label='V1 ML加權', color='#aaa', edgecolor='#333', linewidth=0.5)
bars3 = ax.bar(x + 0.5*w, simple, w, label='V2 簡單平均 (FRED季度)', color=CL, edgecolor='#333', linewidth=0.5)
bars4 = ax.bar(x + 1.5*w, weighted, w, label='V2 ML加權', color=C1, edgecolor='#333', linewidth=0.5)

for bars in [bars1, bars2, bars3, bars4]:
    for bar in bars:
        ax.text(bar.get_x() + bar.get_width()/2, bar.get_height() + 1,
                f'{bar.get_height():+.0f}%', ha='center', fontsize=8)

ax.set_xlabel('持有年期', fontsize=11)
ax.set_ylabel('回報率 (%)', fontsize=11)
ax.set_title('V1 (年度估計數據) vs V2 (FRED 真實季度數據)', fontsize=13, fontweight='bold')
ax.set_xticks(x)
ax.set_xticklabels([f'{y} 年' for y in HOLD_YEARS])
ax.legend(loc='best', fontsize=9)
ax.axhline(0, color='gray', linewidth=0.5)
plt.tight_layout()
plt.savefig(f'{OUT}v2_v1_comparison.png', dpi=150, bbox_inches='tight', facecolor='white')
plt.close()
print("  Saved: v2_v1_comparison.png")

# ── Chart 6: Feature Importance ──
fig, axes = plt.subplots(1, 2, figsize=(14, 5))

for ax, models_dict, best, features, title, color in [
    (axes[0], fx_models, fx_best, FX_FEATURES, f'FX 特徵重要性 ({fx_best})', C1),
    (axes[1], pr_models, pr_best, PR_FEATURES, f'物業特徵重要性 ({pr_best})', C2),
]:
    model = models_dict[best]['model']
    imp = model.feature_importances_
    idx = np.argsort(imp)
    ax.barh(range(len(features)), imp[idx], color=color, alpha=0.85)
    ax.set_yticks(range(len(features)))
    ax.set_yticklabels([features[i] for i in idx], fontsize=8)
    ax.set_title(title, fontsize=12, fontweight='bold')
    ax.set_xlabel('重要性', fontsize=10)

plt.tight_layout()
plt.savefig(f'{OUT}v2_feature_importance.png', dpi=150, bbox_inches='tight', facecolor='white')
plt.close()
print("  Saved: v2_feature_importance.png")

# ═══════════════════════════════════════════════════════════════════════
# 9. SUMMARY
# ═══════════════════════════════════════════════════════════════════════
print("\n" + "="*60)
print("  FINAL SUMMARY (V2)")
print("="*60)

summary = f"""
ML V2 真實數據版 — 日本物業投資風險分析
========================================

數據來源 (全部 FRED/BIS 真實數據):
  EXJPUS:        JPY/USD 月度匯率     665 點 (1971-2026)
  QJPN628BIS:    日本住宅價格指數     284 點 (1955-2025, 季度)
  FEDFUNDS:      美國聯邦基金利率     863 點 (1954-2026, 月度)
  IRSTCI01JPM156N: 日本政策利率       490 點 (1985-2026, 月度)

訓練數據: {len(df)} 個季度樣本 (1990-2025)
  V1 版本: 16 個年度樣本
  V2 版本: {len(df)} 個季度樣本 (增加 {len(df)-16} 個, +{((len(df)-16)/16*100):.0f}%)

ML 模型表現 (5-fold TimeSeries CV):
  FX 最佳: {fx_best} (MAE={fx_models[fx_best]['cv_mae']:.1f}%) [V1: 23.4%]
  物業最佳: {pr_best} (MAE={pr_models[pr_best]['cv_mae']:.1f}%) [V1: 20.2%]

預測 (10 年):
  匯率:  ML={fx_ml_point:+.1f}%, Blended={fx_blended:+.1f}%, ARIMA={fx_arima_pct:+.1f}%
  物業:  ML={pr_ml_point:+.1f}%, Blended={pr_blended:+.1f}%, ARIMA={pr_arima_pct:+.1f}%
"""

for hy in HOLD_YEARS:
    wr = weighted_results[hy]
    top5 = sorted(wr['scenarios'], key=lambda s: -s['prob'])[:5]
    summary += f"\n持有 {hy} 年:\n"
    summary += f"  簡單平均 ROI: {wr['simple_roi']:+.1f}%\n"
    summary += f"  ML 加權 ROI:  {wr['weighted_roi']:+.1f}%\n"
    summary += f"  最高機率情景:\n"
    for s in top5:
        summary += f"    FX={s['fx']}, 年變幅={s['pr']*100:+.1f}%, ROI={s['roi']:+.1f}%, P={s['prob']*100:.1f}%\n"

print(summary)

# Save results
output = {
    'version': 'V2',
    'data_sources': {
        'EXJPUS': f"JPY/USD, {len(dataframes['EXJPUS'])} monthly points (FRED)",
        'QJPN628BIS': f"Japan Property, {len(dataframes['QJPN628BIS'])} quarterly points (BIS/FRED)",
        'FEDFUNDS': f"US Rate, {len(dataframes['FEDFUNDS'])} monthly points (FRED)",
        'IRSTCI01JPM156N': f"Japan Rate, {len(dataframes['IRSTCI01JPM156N'])} monthly points (FRED)",
    },
    'training_samples': int(len(df)),
    'v1_samples': 16,
    'ml_predictions': {
        'fx_10yr': {
            'ml_point': round(float(fx_ml_point), 1),
            'blended': round(float(fx_blended), 1),
            'arima': round(float(fx_arima_pct), 1),
            'mc_mean': round(float(np.mean(fx_sims)), 1),
            'mc_p5': round(float(np.percentile(fx_sims, 5)), 1),
            'mc_p50': round(float(np.percentile(fx_sims, 50)), 1),
            'mc_p95': round(float(np.percentile(fx_sims, 95)), 1),
        },
        'property_10yr': {
            'ml_point': round(float(pr_ml_point), 1),
            'blended': round(float(pr_blended), 1),
            'arima': round(float(pr_arima_pct), 1),
            'mc_mean': round(float(np.mean(pr_sims)), 1),
            'mc_p5': round(float(np.percentile(pr_sims, 5)), 1),
            'mc_p50': round(float(np.percentile(pr_sims, 50)), 1),
            'mc_p95': round(float(np.percentile(pr_sims, 95)), 1),
        },
    },
    'model_performance': {
        'fx': {k: {'cv_mae': round(v['cv_mae'], 2)} for k, v in fx_models.items()},
        'property': {k: {'cv_mae': round(v['cv_mae'], 2)} for k, v in pr_models.items()},
    },
    'weighted_returns': {
        str(hy): {
            'weighted_roi': round(wr['weighted_roi'], 1),
            'simple_roi': round(wr['simple_roi'], 1),
        } for hy, wr in weighted_results.items()
    },
    'v1_comparison': {
        'v1_fx_mae': 23.36,
        'v2_fx_mae': round(fx_models[fx_best]['cv_mae'], 2),
        'v1_prop_mae': 20.17,
        'v2_prop_mae': round(pr_models[pr_best]['cv_mae'], 2),
    }
}

with open(f'{OUT}v2_ml_results.json', 'w', encoding='utf-8') as f:
    json.dump(output, f, ensure_ascii=False, indent=2)
print("Saved: v2_ml_results.json")
print("\nDone!")