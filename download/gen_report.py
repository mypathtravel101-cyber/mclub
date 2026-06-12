# -*- coding: utf-8 -*-
"""
Japan Property Investment Risk Analysis - 84 Scenario Model
PDF Report Generator
"""
import os, sys, math, json
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.font_manager as fm
import numpy as np

# ── Font setup for matplotlib ──
fm.fontManager.addfont('/usr/share/fonts/truetype/chinese/NotoSansSC[wght].ttf')
fm.fontManager.addfont('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf')
plt.rcParams['font.sans-serif'] = ['Noto Sans SC', 'DejaVu Sans']
plt.rcParams['axes.unicode_minus'] = False

OUT_DIR = '/home/z/my-project/download'

# ══════════════════════════════════════════════════════════════════
# PART 1: HISTORICAL DATA & CHARTS
# ══════════════════════════════════════════════════════════════════

# USD/JPY annual averages (well-known data)
usd_jpy_yearly = {
    1995: 93.97, 1996: 108.78, 1997: 120.99, 1998: 130.91, 1999: 113.73,
    2000: 107.77, 2001: 121.53, 2002: 125.22, 2003: 115.94, 2004: 108.15,
    2005: 110.11, 2006: 116.35, 2007: 117.76, 2008: 103.39, 2009: 93.68,
    2010: 87.78,  2011: 79.70,  2012: 79.82,  2013: 97.56,  2014: 105.74,
    2015: 120.95, 2016: 108.72, 2017: 112.16, 2018: 110.44, 2019: 108.84,
    2020: 106.76, 2021: 109.84, 2022: 131.50, 2023: 140.94, 2024: 151.48,
    2025: 149.67
}

# JPY/HKD = USD/JPY * 7.80 (HKD pegged to USD)
HKD_PEG = 7.80
years = list(range(1995, 2026))
jpy_hkd = [usd_jpy_yearly[y] * HKD_PEG for y in years]
usd_jpy_vals = [usd_jpy_yearly[y] for y in years]

# Japan residential property price index (BIS, indexed 2015=100)
# Based on FRED QJPN628BIS and MLIT data
property_index = {
    1995: 145.0, 1996: 138.0, 1997: 130.0, 1998: 120.0, 1999: 112.0,
    2000: 105.0, 2001: 98.0,  2002: 93.0,  2003: 89.0,  2004: 87.0,
    2005: 87.0,  2006: 88.0,  2007: 88.0,  2008: 86.0,  2009: 84.0,
    2010: 84.0,  2011: 82.0,  2012: 83.0,  2013: 86.0,  2014: 90.0,
    2015: 100.0, 2016: 103.0, 2017: 107.0, 2018: 110.0, 2019: 112.0,
    2020: 110.0, 2021: 113.0, 2022: 117.0, 2023: 122.0, 2024: 130.0,
    2025: 136.0
}
prop_vals = [property_index[y] for y in years]

# Compute 30-year changes
fx_start = jpy_hkd[0]   # 1995
fx_end = jpy_hkd[-1]    # 2025
fx_change_pct = (fx_end - fx_start) / fx_start * 100  # JPY weakened %

prop_start = prop_vals[0]
prop_end = prop_vals[-1]
prop_change_pct = (prop_end - prop_start) / prop_start * 100

# 10-year rolling returns for FX and property
fx_10yr_returns = []
prop_10yr_returns = []
for i in range(len(years) - 10):
    fx_ret = (jpy_hkd[i+10] - jpy_hkd[i]) / jpy_hkd[i] * 100
    prop_ret = (prop_vals[i+10] - prop_vals[i]) / prop_vals[i] * 100
    fx_10yr_returns.append((years[i], years[i+10], fx_ret))
    prop_10yr_returns.append((years[i], years[i+10], prop_ret))

fx_10yr_values = [r[2] for r in fx_10yr_returns]
prop_10yr_values = [r[2] for r in prop_10yr_returns]

# Find worst, average, best for 10-year periods
fx_worst_10 = min(fx_10yr_returns, key=lambda x: x[2])
fx_best_10 = max(fx_10yr_returns, key=lambda x: x[2])
fx_avg_10 = sum(fx_10yr_values) / len(fx_10yr_values)

prop_worst_10 = min(prop_10yr_returns, key=lambda x: x[2])
prop_best_10 = max(prop_10yr_returns, key=lambda x: x[2])
prop_avg_10 = sum(prop_10yr_values) / len(prop_10yr_values)

print(f"FX 30yr change: {fx_change_pct:.1f}% (JPY/HKD went from {fx_start:.0f} to {fx_end:.0f})")
print(f"Property 30yr change: {prop_change_pct:.1f}%")
print(f"FX 10yr worst: {fx_worst_10[0]}-{fx_worst_10[1]}: {fx_worst_10[2]:.1f}%")
print(f"FX 10yr best: {fx_best_10[0]}-{fx_best_10[1]}: {fx_best_10[2]:.1f}%")
print(f"FX 10yr avg: {fx_avg_10:.1f}%")
print(f"Prop 10yr worst: {prop_worst_10[0]}-{prop_worst_10[1]}: {prop_worst_10[2]:.1f}%")
print(f"Prop 10yr best: {prop_best_10[0]}-{prop_best_10[1]}: {prop_best_10[2]:.1f}%")
print(f"Prop 10yr avg: {prop_avg_10:.1f}%")

# ── Chart 1: 30-year dual-axis FX + Property ──
fig, ax1 = plt.subplots(figsize=(10, 4.5))
color_fx = '#207591'
color_prop = '#82713e'

ax1.set_xlabel('Year', fontsize=10)
ax1.set_ylabel('JPY/HKD', color=color_fx, fontsize=10)
line1 = ax1.plot(years, jpy_hkd, color=color_fx, linewidth=2, label='JPY/HKD')
ax1.tick_params(axis='y', labelcolor=color_fx)
ax1.set_ylim(550, 1250)

ax2 = ax1.twinx()
ax2.set_ylabel('Property Price Index (2015=100)', color=color_prop, fontsize=10)
line2 = ax2.plot(years, prop_vals, color=color_prop, linewidth=2, linestyle='--', label='Property Index')
ax2.tick_params(axis='y', labelcolor=color_prop)
ax2.set_ylim(70, 170)

lines = line1 + line2
labels = [l.get_label() for l in lines]
ax1.legend(lines, labels, loc='upper left', fontsize=9, framealpha=0.9)
ax1.set_title('30-Year Trend: JPY/HKD Exchange Rate vs Japan Residential Property Price', fontsize=11, fontweight='bold', pad=12)
ax1.grid(True, alpha=0.3, linestyle='--')
ax1.set_xlim(1995, 2025)

plt.tight_layout()
chart1_path = os.path.join(OUT_DIR, 'chart_history.png')
plt.savefig(chart1_path, dpi=200, bbox_inches='tight', facecolor='white')
plt.close()
print(f"Chart 1 saved: {chart1_path}")

# ── Chart 2: 84-Scenario heatmap for 10yr holding ──
# (will be generated after computing scenarios)

# ══════════════════════════════════════════════════════════════════
# PART 2: 84-SCENARIO MODEL CALCULATION
# ══════════════════════════════════════════════════════════════════

# Fixed parameters
ENTRY_FX = 19.5          # JPY per HKD
PROPERTY_PRICE_JPY = 78_000_000
LTV = 0.40
LOAN_JPY = PROPERTY_PRICE_JPY * LTV
EQUITY_JPY = PROPERTY_PRICE_JPY - LOAN_JPY
EQUITY_HKD = EQUITY_JPY / ENTRY_FX
MORTGAGE_RATE = 0.03
LOAN_TERM_YR = 15
RENTAL_YIELD = 0.06
COST_RATE = 0.003        # tax + insurance only
MONTHLY_RATE = MORTGAGE_RATE / 12
N_MONTHS = LOAN_TERM_YR * 12

# Monthly mortgage payment
monthly_payment = LOAN_JPY * (MONTHLY_RATE * (1 + MONTHLY_RATE)**N_MONTHS) / ((1 + MONTHLY_RATE)**N_MONTHS - 1)
annual_mortgage = monthly_payment * 12

# Annual rental income and costs
annual_rental = PROPERTY_PRICE_JPY * RENTAL_YIELD
annual_costs = PROPERTY_PRICE_JPY * COST_RATE
annual_net_rental = annual_rental - annual_costs  # before mortgage
annual_cashflow = annual_net_rental - annual_mortgage  # after mortgage

# Loan balance factor: (1+r)^n
compound_n = (1 + MONTHLY_RATE) ** N_MONTHS

def loan_balance(t_years):
    t_months = int(t_years * 12)
    compound_t = (1 + MONTHLY_RATE) ** t_months
    return LOAN_JPY * (compound_n - compound_t) / (compound_n - 1)

# Variable parameters
FX_SCENARIOS = [13.0, 15.0, 17.0, 19.5, 22.0, 25.0, 28.0]
FX_LABELS = [
    'JPY +33% (13.0)',
    'JPY +23% (15.0)',
    'JPY +13% (17.0)',
    'No Change (19.5)',
    'JPY -13% (22.0)',
    'JPY -28% (25.0)',
    'JPY -44% (28.0)',
]

# Annual property change rates
PROP_ANNUAL_RATES = [-0.03, -0.01, 0.01, 0.03]
PROP_LABELS = ['-3%/year', '-1%/year', '+1%/year', '+3%/year']

HOLDING_PERIODS = [5, 7, 10]
HOLDING_LABELS = ['5 Years', '7 Years', '10 Years']

# Calculate all 84 scenarios
scenarios = []
for fx in FX_SCENARIOS:
    for pa in PROP_ANNUAL_RATES:
        for t in HOLDING_PERIODS:
            exit_value = PROPERTY_PRICE_JPY * (1 + pa) ** t
            loan_bal = loan_balance(t)
            net_exit_jpy = exit_value - loan_bal
            accumulated_rental = annual_cashflow * t
            total_jpy = net_exit_jpy + accumulated_rental
            total_hkd = total_jpy / fx
            roi_pct = (total_hkd - EQUITY_HKD) / EQUITY_HKD * 100
            abs_gain = total_hkd - EQUITY_HKD
            scenarios.append({
                'fx': fx,
                'prop_annual': pa,
                'holding': t,
                'exit_value_jpy': exit_value,
                'loan_bal': loan_bal,
                'net_exit_jpy': net_exit_jpy,
                'accum_rental': accumulated_rental,
                'total_jpy': total_jpy,
                'total_hkd': total_hkd,
                'roi_pct': roi_pct,
                'abs_gain_hkd': abs_gain,
            })

# ── Chart 2: Heatmap for 10-year scenarios (7 FX x 4 Property) ──
ten_yr = [s for s in scenarios if s['holding'] == 10]
matrix = np.zeros((4, 7))
for s in ten_yr:
    pi = PROP_ANNUAL_RATES.index(s['prop_annual'])
    fi = FX_SCENARIOS.index(s['fx'])
    matrix[pi][fi] = s['roi_pct']

fig, ax = plt.subplots(figsize=(10, 3.5))
cmap = plt.cm.RdYlGn
norm = plt.Normalize(vmin=matrix.min(), vmax=matrix.max())
im = ax.imshow(matrix, cmap=cmap, norm=norm, aspect='auto')

ax.set_xticks(range(7))
ax.set_xticklabels([f'{f:.1f}' for f in FX_SCENARIOS], fontsize=9)
ax.set_yticks(range(4))
ax.set_yticklabels(PROP_LABELS, fontsize=9)
ax.set_xlabel('Exit JPY/HKD Rate', fontsize=10)
ax.set_ylabel('Property Price Change', fontsize=10)
ax.set_title('84-Scenario ROI Matrix (10-Year Holding Period, % Return)', fontsize=11, fontweight='bold', pad=10)

# Annotate cells
for i in range(4):
    for j in range(7):
        val = matrix[i][j]
        color = 'white' if abs(val) > 40 or val < 0 else 'black'
        ax.text(j, i, f'{val:.0f}%', ha='center', va='center', fontsize=9, color=color, fontweight='bold')

plt.colorbar(im, ax=ax, label='ROI (%)', shrink=0.8)
plt.tight_layout()
chart2_path = os.path.join(OUT_DIR, 'chart_heatmap.png')
plt.savefig(chart2_path, dpi=200, bbox_inches='tight', facecolor='white')
plt.close()
print(f"Chart 2 saved: {chart2_path}")

# ── Compute historical scenario summary ──
# Worst: Worst FX + Worst Property
# Average: Average FX + Average Property
# Best: Best FX + Best Property

def compute_historical_scenario(fx_10yr_pct, prop_10yr_pct, holding=10):
    exit_fx = ENTRY_FX * (1 + fx_10yr_pct / 100)
    pa = (1 + prop_10yr_pct / 100) ** (1/holding) - 1  # annualized
    exit_value = PROPERTY_PRICE_JPY * (1 + pa) ** holding
    loan_bal = loan_balance(holding)
    net_exit_jpy = exit_value - loan_bal
    accumulated_rental = annual_cashflow * holding
    total_jpy = net_exit_jpy + accumulated_rental
    total_hkd = total_jpy / exit_fx
    roi = (total_hkd - EQUITY_HKD) / EQUITY_HKD * 100
    return {
        'fx_change_pct': fx_10yr_pct,
        'prop_change_pct': prop_10yr_pct,
        'exit_fx': exit_fx,
        'exit_value_jpy': exit_value,
        'loan_bal': loan_bal,
        'net_exit_jpy': net_exit_jpy,
        'accum_rental': accumulated_rental,
        'total_jpy': total_jpy,
        'total_hkd': total_hkd,
        'roi_pct': roi,
        'abs_gain_hkd': total_hkd - EQUITY_HKD,
    }

hist_worst = compute_historical_scenario(fx_worst_10[2], prop_worst_10[2])
hist_avg = compute_historical_scenario(fx_avg_10, prop_avg_10)
hist_best = compute_historical_scenario(fx_best_10[2], prop_best_10[2])

print(f"\nHistorical Scenarios (10yr):")
print(f"  Worst:  FX {fx_worst_10[2]:.1f}%, Prop {prop_worst_10[2]:.1f}% => ROI {hist_worst['roi_pct']:.1f}%, HKD {hist_worst['abs_gain_hkd']/10000:.1f}M")
print(f"  Average: FX {fx_avg_10:.1f}%, Prop {prop_avg_10:.1f}% => ROI {hist_avg['roi_pct']:.1f}%, HKD {hist_avg['abs_gain_hkd']/10000:.1f}M")
print(f"  Best:   FX {fx_best_10[2]:.1f}%, Prop {prop_best_10[2]:.1f}% => ROI {hist_best['roi_pct']:.1f}%, HKD {hist_best['abs_gain_hkd']/10000:.1f}M")

# Save computed data for PDF script
data = {
    'equity_hkd': EQUITY_HKD,
    'equity_jpy': EQUITY_JPY,
    'loan_jpy': LOAN_JPY,
    'annual_rental': annual_rental,
    'annual_costs': annual_costs,
    'annual_net_rental': annual_net_rental,
    'annual_mortgage': annual_mortgage,
    'annual_cashflow': annual_cashflow,
    'monthly_payment': monthly_payment,
    'fx_30yr_change': fx_change_pct,
    'prop_30yr_change': prop_change_pct,
    'fx_worst_10': fx_worst_10,
    'fx_best_10': fx_best_10,
    'fx_avg_10': fx_avg_10,
    'prop_worst_10': prop_worst_10,
    'prop_best_10': prop_best_10,
    'prop_avg_10': prop_avg_10,
    'hist_worst': hist_worst,
    'hist_avg': hist_avg,
    'hist_best': hist_best,
}

# Save scenario data as JSON for the PDF script
with open(os.path.join(OUT_DIR, 'scenario_data.json'), 'w') as f:
    json.dump({
        'params': {k: v for k, v in data.items() if not isinstance(v, tuple)},
        'scenarios': [{k: (round(v, 2) if isinstance(v, float) else v) for k, v in s.items()} for s in scenarios],
        'loan_balances': {t: round(loan_balance(t), 0) for t in HOLDING_PERIODS},
    }, f, indent=2, default=str)

print("\nScenario data saved.")
