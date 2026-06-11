# -*- coding: utf-8 -*-
"""
PZC Group — JPY Property FX Risk Scenario Analysis (10-Year Holding Period)
Mortgage: 15 years (client 45→60), but HOLDING/EXIT at year 10 (client 45→55)
At year 10, remaining mortgage balance is repaid from sale proceeds.
"""

import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.ticker as mticker
import matplotlib.font_manager as fm
import matplotlib.colors as mcolors
import numpy as np
import os, json, math

# ── Font setup ──
fm.fontManager.addfont('/usr/share/fonts/truetype/chinese/SarasaMonoSC-Regular.ttf')
fm.fontManager.addfont('/usr/share/fonts/truetype/chinese/SarasaMonoSC-Bold.ttf')
fm.fontManager.addfont('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf')
plt.rcParams['font.sans-serif'] = ['Sarasa Mono SC', 'DejaVu Sans']
plt.rcParams['axes.unicode_minus'] = False

GOLD   = '#C9A84C'
DARK   = '#1A1A1A'
BLUE   = '#1E3A5F'
LIGHT_BG = '#F5F2E8'
GREEN  = '#2ECC71'
RED    = '#E74C3C'
ORANGE = '#F39C12'
GREY   = '#95A5A6'

OUT = '/home/z/my-project/download/ppt_charts'
os.makedirs(OUT, exist_ok=True)

# ══════════════════════════════════════════════════════
# 1. CORE ASSUMPTIONS
# ══════════════════════════════════════════════════════
HKD_PROP     = 4_000_000          # Property price in HKD
JPY_PER_HKD  = 19.5               # Base FX rate (JPY/HKD)
JPY_PROP     = HKD_PROP * JPY_PER_HKD   # 78M JPY
YIELD_PCT    = 0.06               # Gross yield 6%
LTV          = 0.40               # 40% loan
RATE_ANNUAL  = 0.03               # 3% mortgage rate
TERM_YEARS   = 15                 # 15-year mortgage (contractual)
HOLD_YEARS   = 10                 # 10-year holding period (exit at year 10)
CLIENT_AGE   = 45

# ── Mortgage calculation (15-year term) ──
LOAN_JPY = JPY_PROP * LTV
DOWN_JPY = JPY_PROP * (1 - LTV)
INVESTED_HKD = DOWN_JPY / JPY_PER_HKD   # HKD 2,400,000
r_m = RATE_ANNUAL / 12
n_total = TERM_YEARS * 12

monthly_payment = LOAN_JPY * (r_m * (1 + r_m)**n_total) / ((1 + r_m)**n_total - 1)
annual_payment  = monthly_payment * 12

# Gross rent in JPY
gross_rent_jpy = JPY_PROP * YIELD_PCT
net_rent_jpy = gross_rent_jpy - annual_payment

# ── Amortization schedule (full 15 years) ──
years_all = np.arange(1, TERM_YEARS + 1)
balance_all = np.zeros(TERM_YEARS)
interest_paid_all = np.zeros(TERM_YEARS)
principal_paid_all = np.zeros(TERM_YEARS)

remaining = LOAN_JPY
for i, y in enumerate(years_all):
    year_interest = 0
    year_principal = 0
    for m in range(12):
        interest_m = remaining * r_m
        principal_m = monthly_payment - interest_m
        remaining -= principal_m
        year_interest += interest_m
        year_principal += principal_m
    interest_paid_all[i] = year_interest
    principal_paid_all[i] = year_principal
    balance_all[i] = max(remaining, 0)

# Balance at end of year 10 (HOLD_YEARS)
balance_at_exit = balance_all[HOLD_YEARS - 1]  # index 9
total_principal_paid_10y = sum(principal_paid_all[:HOLD_YEARS])

print(f"=== 10-Year Holding Period Analysis ===")
print(f"Property: HKD {HKD_PROP:,} / JPY {JPY_PROP:,.0f}")
print(f"Down payment: HKD {INVESTED_HKD:,}")
print(f"Loan: JPY {LOAN_JPY:,.0f} ({LTV*100:.0f}% LTV @ {RATE_ANNUAL*100:.0f}%, {TERM_YEARS}yr)")
print(f"Monthly mortgage: JPY {monthly_payment:,.0f}")
print(f"Annual mortgage: JPY {annual_payment:,.0f}")
print(f"Gross rent: JPY {gross_rent_jpy:,.0f}/yr")
print(f"Net rent: JPY {net_rent_jpy:,.0f}/yr")
print(f"Mortgage balance at year 10: JPY {balance_at_exit:,.0f}")
print(f"Principal paid in 10yr: JPY {total_principal_paid_10y:,.0f}")

# ══════════════════════════════════════════════════════
# 2. FX SCENARIOS (7 base scenarios)
# ══════════════════════════════════════════════════════
fx_rate_changes = [-0.20, -0.10, -0.05, 0, 0.05, 0.10, 0.20]
fx_labels  = ['JPY大幅升值\n(+20%)', 'JPY升值\n(+10%)', 'JPY小幅升值\n(+5%)',
              '基準情景\n(現匯率)', 'JPY小幅貶值\n(-5%)', 'JPY貶值\n(-10%)', 'JPY大幅貶值\n(-20%)']
fx_rates   = [JPY_PER_HKD * (1 + c) for c in fx_rate_changes]
scenario_colors = ['#1E8449', '#27AE60', '#82E0AA', GOLD, '#F1948A', '#E74C3C', '#C0392B']

# ══════════════════════════════════════════════════════
# 3. RETURN CALCULATIONS (10-year holding)
# ══════════════════════════════════════════════════════
# At year 10 exit:
#   - Property sold at exit_property_jpy (which may differ from JPY_PROP based on price change)
#   - Remaining mortgage balance repaid: balance_at_exit
#   - Net exit proceeds in JPY = exit_property_jpy - balance_at_exit
#   - Convert to HKD at exit FX rate
#   - Total HKD return = cumulative net rent (10yr) + net exit proceeds (HKD)
#   - ROI = (total HKD return - invested HKD) / invested HKD

# Base scenario (no price change, base FX)
exit_property_jpy_base = JPY_PROP
net_exit_jpy_base = exit_property_jpy_base - balance_at_exit
net_exit_hkd_base = net_exit_jpy_base / JPY_PER_HKD
cum_net_rent_hkd_base = (net_rent_jpy / JPY_PER_HKD) * HOLD_YEARS
total_return_hkd_base = cum_net_rent_hkd_base + net_exit_hkd_base
roi_base = (total_return_hkd_base - INVESTED_HKD) / INVESTED_HKD * 100
annualized_base = ((total_return_hkd_base / INVESTED_HKD) ** (1/HOLD_YEARS) - 1) * 100

print(f"\n--- Base Scenario (10yr) ---")
print(f"Net exit (JPY): {net_exit_jpy_base:,.0f}")
print(f"Net exit (HKD): {net_exit_hkd_base:,.0f}")
print(f"Cum net rent (HKD, 10yr): {cum_net_rent_hkd_base:,.0f}")
print(f"Total return (HKD): {total_return_hkd_base:,.0f}")
print(f"ROI: {roi_base:+.2f}%")
print(f"Annualized: {annualized_base:+.2f}%")

# Per-scenario (FX only, no price change)
cum_net_income_hkd = []
total_return_hkd = []
annual_net_income_hkd = []
roi_list = []
annualized_roi = []

for rate in fx_rates:
    ann_hkd = net_rent_jpy / rate
    annual_net_income_hkd.append(ann_hkd)
    cum = ann_hkd * HOLD_YEARS
    cum_net_income_hkd.append(cum)
    net_exit_hkd = net_exit_jpy_base / rate
    total = cum + net_exit_hkd
    total_return_hkd.append(total)
    r = (total - INVESTED_HKD) / INVESTED_HKD * 100
    roi_list.append(r)
    a = ((total / INVESTED_HKD) ** (1/HOLD_YEARS) - 1) * 100
    annualized_roi.append(a)

# ══════════════════════════════════════════════════════
# 4. CHART 1 — Mortgage Amortization (full 15yr, highlight 10yr)
# ══════════════════════════════════════════════════════
fig, ax1 = plt.subplots(figsize=(12, 6.5))
fig.patch.set_facecolor(LIGHT_BG)
ax1.set_facecolor(LIGHT_BG)

bar_w = 0.5
# Color years 1-10 differently from 11-15
for i, y in enumerate(years_all):
    alpha = 0.85 if y <= HOLD_YEARS else 0.35
    c_p = BLUE if y <= HOLD_YEARS else '#5B7BA5'
    c_i = GOLD if y <= HOLD_YEARS else '#D4BC7A'
    ax1.bar(y - bar_w/4, principal_paid_all[i]/1e6, bar_w/2, color=c_p, alpha=alpha)
    ax1.bar(y + bar_w/4, interest_paid_all[i]/1e6, bar_w/2, color=c_i, alpha=alpha)

# Add vertical line at year 10
ax1.axvline(x=HOLD_YEARS + 0.5, color=RED, linestyle='--', linewidth=2, alpha=0.7)
ax1.text(HOLD_YEARS + 0.7, max(principal_paid_all/1e6) * 0.9, '第10年\n退出點',
         fontsize=10, color=RED, fontweight='bold', va='top')

ax2 = ax1.twinx()
ax2.plot(years_all, balance_all/1e6, color=RED, linewidth=2.5, marker='o', markersize=5,
         label='貸款餘額', zorder=5)
# Highlight year 10 balance
ax2.plot(HOLD_YEARS, balance_at_exit/1e6, 's', color=RED, markersize=12, zorder=6,
         markeredgecolor='white', markeredgewidth=2)
ax2.annotate(f'剩餘: {balance_at_exit/1e6:.1f}M',
             xy=(HOLD_YEARS, balance_at_exit/1e6),
             xytext=(HOLD_YEARS + 1.5, balance_at_exit/1e6 + 3),
             fontsize=10, color=RED, fontweight='bold',
             arrowprops=dict(arrowstyle='->', color=RED, lw=1.5))

ax2.set_ylabel('貸款餘額 (百萬日圓)', fontsize=12, fontweight='bold')
ax2.tick_params(axis='y', labelsize=10)
ax1.set_xlabel('年份', fontsize=12, fontweight='bold')
ax1.set_ylabel('金額 (百萬日圓)', fontsize=12, fontweight='bold')
ax1.set_title('15年按揭攤還計劃 (第10年退出)', fontsize=16, fontweight='bold', color=DARK, pad=15)
ax1.set_xticks(years_all)

# Custom legend
from matplotlib.patches import Patch
legend_elements = [
    Patch(facecolor=BLUE, alpha=0.85, label='本金償還 (1-10年)'),
    Patch(facecolor=GOLD, alpha=0.85, label='利息支出 (1-10年)'),
    Patch(facecolor='#5B7BA5', alpha=0.35, label='本金償還 (11-15年)'),
    Patch(facecolor='#D4BC7A', alpha=0.35, label='利息支出 (11-15年)'),
    plt.Line2D([0],[0], color=RED, linewidth=2.5, marker='o', label='貸款餘額'),
]
ax1.legend(handles=legend_elements, loc='upper right', fontsize=9.5,
           facecolor='white', edgecolor=GOLD, framealpha=0.9)
ax1.grid(axis='y', alpha=0.3)
ax1.tick_params(axis='x', labelsize=9)
ax1.tick_params(axis='y', labelsize=10)
plt.tight_layout()
plt.savefig(f'{OUT}/mortgage_amortization.png', dpi=200, bbox_inches='tight', facecolor=LIGHT_BG)
plt.close()
print("OK mortgage_amortization.png")

# ══════════════════════════════════════════════════════
# 5. CHART 2 — Annual Net Income HKD by FX Scenario
# ══════════════════════════════════════════════════════
fig, ax = plt.subplots(figsize=(12, 6.5))
fig.patch.set_facecolor(LIGHT_BG)
ax.set_facecolor(LIGHT_BG)

bars = ax.bar(range(len(fx_labels)), [x/1000 for x in annual_net_income_hkd],
              color=scenario_colors, edgecolor='white', linewidth=1.5, width=0.65)

for bar, val in zip(bars, annual_net_income_hkd):
    ax.text(bar.get_x() + bar.get_width()/2, bar.get_height() + 2,
            f'HKD {val/1000:,.0f}K', ha='center', va='bottom', fontsize=9, fontweight='bold', color=DARK)

ax.set_xticks(range(len(fx_labels)))
ax.set_xticklabels(fx_labels, fontsize=9.5)
ax.set_ylabel('每年淨收入 (千港元)', fontsize=12, fontweight='bold')
ax.set_title('不同匯率情景下的每年淨租金收入（港元）', fontsize=14, fontweight='bold', color=DARK, pad=15)
ax.axhline(y=annual_net_income_hkd[3]/1000, color=GOLD, linestyle='--', alpha=0.5,
           label=f'基準: HKD {annual_net_income_hkd[3]/1000:,.0f}K/年')
ax.legend(loc='best', fontsize=10, facecolor='white', edgecolor=GOLD)
ax.grid(axis='y', alpha=0.3)
plt.tight_layout()
plt.savefig(f'{OUT}/fx_annual_income.png', dpi=200, bbox_inches='tight', facecolor=LIGHT_BG)
plt.close()
print("OK fx_annual_income.png")

# ══════════════════════════════════════════════════════
# 6. CHART 3 — 10-Year Cumulative Return by FX Scenario
# ══════════════════════════════════════════════════════
fig, ax = plt.subplots(figsize=(13, 7))
fig.patch.set_facecolor(LIGHT_BG)
ax.set_facecolor(LIGHT_BG)

x = np.arange(len(fx_labels))
down_hkd = INVESTED_HKD / 1000
total_hkd = [t/1000 for t in total_return_hkd]
profit_hkd = [(t - INVESTED_HKD)/1000 for t in total_return_hkd]

bars_invested = ax.bar(x, [down_hkd]*len(x), 0.55, color=GREY, alpha=0.6,
                       label='投入本金 (HKD 2,400K)', edgecolor='white')
bars_profit = ax.bar(x, profit_hkd, 0.55, bottom=[down_hkd]*len(x), color=scenario_colors,
                     alpha=0.85, label='10年總回報利潤', edgecolor='white')

for i, (p, t) in enumerate(zip(profit_hkd, total_hkd)):
    ax.text(i, t + 50, f'HKD {t:,.0f}K\n(ROI: {roi_list[i]:+.1f}%)',
            ha='center', va='bottom', fontsize=8.5, fontweight='bold', color=DARK)

ax.set_xticks(x)
ax.set_xticklabels(fx_labels, fontsize=9.5)
ax.set_ylabel('金額 (千港元)', fontsize=12, fontweight='bold')
ax.set_title('10年投資總回報 — 不同匯率情景', fontsize=14, fontweight='bold', color=DARK, pad=15)
ax.legend(loc='upper left', fontsize=10, facecolor='white', edgecolor=GOLD)
ax.grid(axis='y', alpha=0.3)
plt.tight_layout()
plt.savefig(f'{OUT}/fx_total_return.png', dpi=200, bbox_inches='tight', facecolor=LIGHT_BG)
plt.close()
print("OK fx_total_return.png")

# ══════════════════════════════════════════════════════
# 7. CHART 4 — FX Sensitivity (Exit Value + Net Yield)
# ══════════════════════════════════════════════════════
fig, ax1 = plt.subplots(figsize=(12, 6.5))
fig.patch.set_facecolor(LIGHT_BG)
ax1.set_facecolor(LIGHT_BG)

fx_range = np.linspace(JPY_PER_HKD * 0.75, JPY_PER_HKD * 1.25, 100)
# Net exit value = (JPY_PROP - balance_at_exit) / rate
exit_hkd_curve = [(net_exit_jpy_base / r) / 1e6 for r in fx_range]
net_income_curve = [(net_rent_jpy / r) / 1000 for r in fx_range]

ax1.plot(fx_range, exit_hkd_curve, color=BLUE, linewidth=2.5, label='淨套現價值 (百萬港元)')
ax1.fill_between(fx_range, exit_hkd_curve, alpha=0.1, color=BLUE)
ax1.set_xlabel('日圓/港元匯率 (JPY/HKD)', fontsize=12, fontweight='bold')
ax1.set_ylabel('淨套現價值 (百萬港元)', fontsize=12, fontweight='bold', color=BLUE)
ax1.tick_params(axis='y', labelcolor=BLUE)

ax2 = ax1.twinx()
ax2.plot(fx_range, net_income_curve, color=GOLD, linewidth=2.5, linestyle='--', label='每年淨收入 (千港元)')
ax2.set_ylabel('每年淨收入 (千港元)', fontsize=12, fontweight='bold', color=GOLD)
ax2.tick_params(axis='y', labelcolor=GOLD)

ax1.axvline(x=JPY_PER_HKD, color=RED, linestyle=':', alpha=0.7, linewidth=1.5)
ax1.annotate(f'基準: {JPY_PER_HKD}', xy=(JPY_PER_HKD, net_exit_jpy_base/JPY_PER_HKD/1e6),
             xytext=(JPY_PER_HKD+1.5, net_exit_jpy_base/JPY_PER_HKD/1e6 - 0.3),
             fontsize=10, color=RED, fontweight='bold',
             arrowprops=dict(arrowstyle='->', color=RED))

for i, (rate, c) in enumerate(zip(fx_rates, scenario_colors)):
    ax1.plot(rate, (net_exit_jpy_base/rate)/1e6, 'o', color=c, markersize=10, zorder=5,
             markeredgecolor='white', markeredgewidth=1.5)

lines1, labels1 = ax1.get_legend_handles_labels()
lines2, labels2 = ax2.get_legend_handles_labels()
ax1.legend(lines1 + lines2, labels1 + labels2, loc='upper right', fontsize=10,
           facecolor='white', edgecolor=GOLD, framealpha=0.9)
ax1.set_title('匯率敏感度分析 — 淨套現價值與淨收入 (第10年退出)', fontsize=14, fontweight='bold', color=DARK, pad=15)
ax1.grid(alpha=0.3)
plt.tight_layout()
plt.savefig(f'{OUT}/fx_sensitivity.png', dpi=200, bbox_inches='tight', facecolor=LIGHT_BG)
plt.close()
print("OK fx_sensitivity.png")

# ══════════════════════════════════════════════════════
# 8. CHART 5 — Summary Dashboard
# ══════════════════════════════════════════════════════
fig, axes = plt.subplots(1, 2, figsize=(13, 6))
fig.patch.set_facecolor(LIGHT_BG)
fig.suptitle('JPY物業投資 — 關鍵指標摘要 (10年持倉)', fontsize=15, fontweight='bold', color=DARK, y=1.02)

yields_hkd = [(net_rent_jpy / rate) / INVESTED_HKD * 100 for rate in fx_rates]

ax = axes[0]
ax.set_facecolor(LIGHT_BG)
bars = ax.barh(range(len(fx_labels)), yields_hkd, color=scenario_colors, edgecolor='white', height=0.6)
for i, (y, bar) in enumerate(zip(yields_hkd, bars)):
    ax.text(y + 0.1, bar.get_y() + bar.get_height()/2,
            '{:.2f}%'.format(y), va='center', fontsize=10, fontweight='bold', color=DARK)
ax.set_yticks(range(len(fx_labels)))
ax.set_yticklabels([l.replace('\n', ' ') for l in fx_labels], fontsize=9.5)
ax.set_xlabel('淨回報率 (%)', fontsize=11, fontweight='bold')
ax.set_title('淨租金回報率（相對投入本金）', fontsize=12, fontweight='bold', color=DARK)
ax.axvline(x=yields_hkd[3], color=RED, linestyle='--', alpha=0.5)
ax.grid(axis='x', alpha=0.3)

ax = axes[1]
ax.set_facecolor(LIGHT_BG)
bars = ax.barh(range(len(fx_labels)), annualized_roi, color=scenario_colors, edgecolor='white', height=0.6)
for i, (r, bar) in enumerate(zip(annualized_roi, bars)):
    ax.text(max(r, 0) + 0.2, bar.get_y() + bar.get_height()/2,
            '{:+.2f}%'.format(r), va='center', fontsize=10, fontweight='bold', color=DARK)
ax.set_yticks(range(len(fx_labels)))
ax.set_yticklabels([l.replace('\n', ' ') for l in fx_labels], fontsize=9.5)
ax.set_xlabel('年化回報率 (%)', fontsize=11, fontweight='bold')
ax.set_title('10年年化總回報率', fontsize=12, fontweight='bold', color=DARK)
ax.axvline(x=0, color=RED, linewidth=1)
ax.grid(axis='x', alpha=0.3)

plt.tight_layout()
plt.savefig(f'{OUT}/fx_summary_dashboard.png', dpi=200, bbox_inches='tight', facecolor=LIGHT_BG)
plt.close()
print("OK fx_summary_dashboard.png")

# ══════════════════════════════════════════════════════
# 9. RETURN DECOMPOSITION CHART
# ══════════════════════════════════════════════════════
# Show return sources under 3 property price scenarios
fig, axes = plt.subplots(1, 3, figsize=(15, 6), sharey=True)
fig.patch.set_facecolor(LIGHT_BG)
fig.suptitle('回報來源分解 — 10年持倉期', fontsize=15, fontweight='bold', color=DARK, y=1.02)

price_scenarios = [
    ('房價年跌-2.47%', -0.0247),
    ('房價持平0%', 0.0),
    ('房價年增+1.77%', 0.0177),
]

for idx, (label, annual_price_growth) in enumerate(price_scenarios):
    ax = axes[idx]
    ax.set_facecolor(LIGHT_BG)
    
    # Property value at year 10
    prop_10y = JPY_PROP * (1 + annual_price_growth) ** HOLD_YEARS
    net_exit = prop_10y - balance_at_exit
    net_exit_hkd = net_exit / JPY_PER_HKD
    
    # Capital gain from price change (in HKD)
    price_gain_hkd = (prop_10y - JPY_PROP) / JPY_PER_HKD
    
    # Equity from mortgage paydown (principal paid)
    equity_paydown_hkd = total_principal_paid_10y / JPY_PER_HKD
    
    # Cash yield from net rent
    cash_yield_hkd = (net_rent_jpy / JPY_PER_HKD) * HOLD_YEARS
    
    # Total
    total_hkd_val = net_exit_hkd + cash_yield_hkd
    roi_val = (total_hkd_val - INVESTED_HKD) / INVESTED_HKD * 100
    
    # Stacked bar
    categories = ['租金現金流\n(10年)', '按揭本金\n償還', '房價變動']
    values = [cash_yield_hkd, equity_paydown_hkd, price_gain_hkd]
    colors = [GOLD, BLUE, GREEN if price_gain_hkd >= 0 else RED]
    
    bottoms = [0, values[0], values[0] + values[1]]
    
    for i, (cat, val, c, b) in enumerate(zip(categories, values, colors, bottoms)):
        ax.bar(0, val/1000, bottom=b/1000, color=c, alpha=0.85, width=0.5, edgecolor='white', linewidth=1.5)
        if abs(val) > 10000:
            y_pos = (b + val/2) / 1000
            ax.text(0, y_pos, 'HKD {:.0f}K\n({:.1f}%)'.format(val/1000, val/INVESTED_HKD*100),
                    ha='center', va='center', fontsize=9, fontweight='bold', color='white')
    
    # Invested capital line
    ax.axhline(y=INVESTED_HKD/1000, color=RED, linestyle='--', linewidth=1.5, alpha=0.7)
    ax.text(0.35, INVESTED_HKD/1000, '投入本金', fontsize=8, color=RED, va='bottom')
    
    ax.set_title('{}\nROI: {:+.1f}%'.format(label, roi_val), fontsize=12, fontweight='bold', color=DARK)
    ax.set_xticks([])
    ax.set_ylabel('金額 (千港元)' if idx == 0 else '')
    ax.grid(axis='y', alpha=0.3)

plt.tight_layout()
plt.savefig(f'{OUT}/return_decomposition.png', dpi=200, bbox_inches='tight', facecolor=LIGHT_BG)
plt.close()
print("OK return_decomposition.png")

# ══════════════════════════════════════════════════════
# 10. 2-VARIABLE STRESS TEST (FX x Property Value)
# ══════════════════════════════════════════════════════
# Variable 1: FX Rate (12 scenarios)
var1_fx = [
    {"label": "JPY升+25%", "rate_change": -0.25, "tier": "T3"},
    {"label": "JPY升+20%", "rate_change": -0.20, "tier": "T3"},
    {"label": "JPY升+15%", "rate_change": -0.15, "tier": "T2"},
    {"label": "JPY升+10%", "rate_change": -0.10, "tier": "T2"},
    {"label": "JPY升+5%",  "rate_change": -0.05, "tier": "T1"},
    {"label": "基準",      "rate_change":  0.00, "tier": "T1"},
    {"label": "JPY貶-5%",  "rate_change":  0.05, "tier": "T1"},
    {"label": "JPY貶-10%", "rate_change":  0.10, "tier": "T2"},
    {"label": "JPY貶-15%", "rate_change":  0.15, "tier": "T2"},
    {"label": "JPY貶-20%", "rate_change":  0.20, "tier": "T3"},
    {"label": "JPY貶-30%", "rate_change":  0.30, "tier": "T3"},
    {"label": "2022危機-31%", "rate_change": 0.31, "tier": "H"},
]

# Variable 2: Property Value (7 scenarios)
# Use SAME annual rates as 15-year model; 10-yr total is naturally smaller
# Labels show the ORIGINAL 15-year target for consistency; total_change shows actual 10-yr
var2_prop = [
    {"label": "崩盤 -22%",  "annual_rate": -0.0247},  # 15yr label "崩盤 -30%"
    {"label": "下跌 -10%",  "annual_rate": -0.0108},  # 15yr label "下跌 -15%"
    {"label": "持平 0%",    "annual_rate":  0.0},
    {"label": "增長 +10%",  "annual_rate":  0.0094},  # 15yr label "增長 +15%"
    {"label": "增長 +19%",  "annual_rate":  0.0177},  # 15yr label "增長 +30%"
    {"label": "增長 +31%",  "annual_rate":  0.0274},  # 15yr label "增長 +50%"
    {"label": "增長 +48%",  "annual_rate":  0.0398},  # 15yr label "增長 +80%"
]

# Calculate 10-year total changes
for p in var2_prop:
    total_change = (1 + p['annual_rate']) ** HOLD_YEARS - 1
    p['total_change'] = total_change

# Calculate 84-scenario matrix
n_fx = len(var1_fx)
n_prop = len(var2_prop)
matrix_annualized = np.zeros((n_prop, n_fx))
matrix_total_roi = np.zeros((n_prop, n_fx))
loss_count = 0

worst_ann = 999
worst_prop = ""
worst_fx = ""
best_ann = -999
best_prop = ""
best_fx = ""

for pi, prop in enumerate(var2_prop):
    prop_value_10y = JPY_PROP * (1 + prop['total_change'])
    for fi, fx in enumerate(var1_fx):
        exit_rate = JPY_PER_HKD * (1 + fx['rate_change'])
        
        # Net rent in HKD per year
        net_rent_hkd_yr = net_rent_jpy / exit_rate
        cum_rent_hkd = net_rent_hkd_yr * HOLD_YEARS
        
        # Net exit = property value - remaining mortgage balance
        net_exit_jpy = prop_value_10y - balance_at_exit
        net_exit_hkd = net_exit_jpy / exit_rate
        
        total_hkd = cum_rent_hkd + net_exit_hkd
        roi = (total_hkd - INVESTED_HKD) / INVESTED_HKD * 100
        ann = ((total_hkd / INVESTED_HKD) ** (1/HOLD_YEARS) - 1) * 100
        
        matrix_annualized[pi][fi] = ann
        matrix_total_roi[pi][fi] = roi
        
        if ann < worst_ann:
            worst_ann = ann
            worst_prop = prop['label']
            worst_fx = fx['label']
        if ann > best_ann:
            best_ann = ann
            best_prop = prop['label']
            best_fx = fx['label']
        if roi < 0:
            loss_count += 1

print(f"\n=== 2-Variable Stress Test (10yr) ===")
print(f"Scenarios: {n_fx} x {n_prop} = {n_fx*n_prop}")
print(f"Loss scenarios: {loss_count}")
print(f"Worst: {worst_prop} + {worst_fx} = {worst_ann:.2f}% annualized")
print(f"Best: {best_prop} + {best_fx} = {best_ann:.2f}% annualized")
print(f"Base (0%, 0%): {matrix_annualized[2][5]:.2f}% annualized")

# ── CHART 6: 2-Variable Heatmap ──
fig, ax = plt.subplots(figsize=(14, 7))
fig.patch.set_facecolor(LIGHT_BG)

# Custom colormap
cmap = mcolors.LinearSegmentedColormap.from_list('pzc', [
    '#C0392B', '#E74C3C', '#F39C12', '#F1C40F', '#C9A84C',
    '#82E0AA', '#27AE60', '#1E8449'
], N=256)

im = ax.imshow(matrix_annualized, cmap=cmap, aspect='auto', vmin=0, vmax=max(best_ann, 10))

# Labels
fx_labels_short = [f['label'] for f in var1_fx]
prop_labels_short = [p['label'] for p in var2_prop]

ax.set_xticks(range(n_fx))
ax.set_xticklabels(fx_labels_short, fontsize=8.5, rotation=45, ha='right')
ax.set_yticks(range(n_prop))
ax.set_yticklabels(prop_labels_short, fontsize=9.5)

# Add text annotations
for pi in range(n_prop):
    for fi in range(n_fx):
        v = matrix_annualized[pi][fi]
        text_color = 'white' if v < 4 or v > 10 else DARK
        ax.text(fi, pi, '{:.1f}%'.format(v), ha='center', va='center',
                fontsize=7.5, fontweight='bold', color=text_color)

# Highlight base scenario
ax.add_patch(plt.Rectangle((5-0.5, 2-0.5), 1, 1, fill=False, edgecolor='white', linewidth=2.5))

cbar = plt.colorbar(im, ax=ax, shrink=0.8, pad=0.02)
cbar.set_label('年化回報率 (%)', fontsize=11, fontweight='bold')

ax.set_xlabel('匯率情景 (FX Rate)', fontsize=12, fontweight='bold')
ax.set_ylabel('物業價值情景', fontsize=12, fontweight='bold')
ax.set_title('雙變量壓力測試 — 84個情景年化回報矩陣 (10年持倉)', fontsize=14, fontweight='bold', color=DARK, pad=15)

plt.tight_layout()
plt.savefig(f'{OUT}/stress_2var_heatmap.png', dpi=200, bbox_inches='tight', facecolor=LIGHT_BG)
plt.close()
print("OK stress_2var_heatmap.png")

# ── CHART 7: Sensitivity Lines ──
fig, ax = plt.subplots(figsize=(13, 7))
fig.patch.set_facecolor(LIGHT_BG)
ax.set_facecolor(LIGHT_BG)

prop_colors = ['#C0392B', '#E74C3C', '#F39C12', GOLD, '#82E0AA', '#27AE60', '#1E8449']
fx_rate_range = [JPY_PER_HKD * (1 + f['rate_change']) for f in var1_fx]

for pi, (prop, color) in enumerate(zip(var2_prop, prop_colors)):
    anns = matrix_annualized[pi]
    ax.plot(fx_rate_range, anns, 'o-', color=color, linewidth=2, markersize=6,
            label=prop['label'], markeredgecolor='white', markeredgewidth=1)

ax.axvline(x=JPY_PER_HKD, color=RED, linestyle=':', alpha=0.6, linewidth=1.5)
ax.text(JPY_PER_HKD + 0.3, best_ann * 0.95, '基準匯率', fontsize=9, color=RED)
ax.axhline(y=0, color=RED, linewidth=1, alpha=0.5)

ax.set_xlabel('JPY/HKD 匯率', fontsize=12, fontweight='bold')
ax.set_ylabel('年化回報率 (%)', fontsize=12, fontweight='bold')
ax.set_title('不同房價情景下的匯率敏感度曲線 (10年持倉)', fontsize=14, fontweight='bold', color=DARK, pad=15)
ax.legend(loc='best', fontsize=9, facecolor='white', edgecolor=GOLD, ncol=2)
ax.grid(alpha=0.3)
plt.tight_layout()
plt.savefig(f'{OUT}/stress_2var_lines.png', dpi=200, bbox_inches='tight', facecolor=LIGHT_BG)
plt.close()
print("OK stress_2var_lines.png")

# ── CHART 8: Contour / Risk Map ──
fig, ax = plt.subplots(figsize=(13, 7))
fig.patch.set_facecolor(LIGHT_BG)
ax.set_facecolor(LIGHT_BG)

# Create grid for contour
fx_grid = np.array([JPY_PER_HKD * (1 + f['rate_change']) for f in var1_fx])
prop_total_grid = np.array([(1 + p['total_change']) for p in var2_prop])

FX_G, PROP_G = np.meshgrid(fx_grid, prop_total_grid)

# Interpolate for smooth contour
from scipy.interpolate import RegularGridInterpolator
interp = RegularGridInterpolator((prop_total_grid, fx_grid), matrix_annualized, method='cubic')

fx_fine = np.linspace(min(fx_grid), max(fx_grid), 200)
prop_fine = np.linspace(min(prop_total_grid), max(prop_total_grid), 200)
FX_F, PROP_F = np.meshgrid(fx_fine, prop_fine)
pts = np.column_stack([PROP_F.ravel(), FX_F.ravel()])
Z = interp(pts).reshape(PROP_F.shape)

levels = np.arange(0, max(best_ann, 12), 1)
cs = ax.contourf(FX_F, PROP_F, Z, levels=levels, cmap=cmap, extend='both')
ax.contour(FX_F, PROP_F, Z, levels=[0], colors=['#FF0000'], linewidths=3)

# Mark the base scenario
ax.plot(JPY_PER_HKD, 1.0, 's', color='white', markersize=12, zorder=5, markeredgecolor=DARK, markeredgewidth=2)
ax.annotate('基準', xy=(JPY_PER_HKD, 1.0), xytext=(JPY_PER_HKD + 1.5, 1.05),
            fontsize=11, fontweight='bold', color=DARK,
            arrowprops=dict(arrowstyle='->', color=DARK, lw=1.5))

# Mark 2022 crisis
crisis_rate = JPY_PER_HKD * 1.31
ax.plot(crisis_rate, 0.70, 'X', color=RED, markersize=14, zorder=5, markeredgecolor='white', markeredgewidth=2)
ax.annotate('2022危機', xy=(crisis_rate, 0.70), xytext=(crisis_rate - 2, 0.62),
            fontsize=10, fontweight='bold', color=RED,
            arrowprops=dict(arrowstyle='->', color=RED, lw=1.5))

cbar = plt.colorbar(cs, ax=ax, shrink=0.8, pad=0.02)
cbar.set_label('年化回報率 (%)', fontsize=11, fontweight='bold')

ax.set_xlabel('JPY/HKD 匯率', fontsize=12, fontweight='bold')
ax.set_ylabel('物業價值倍數 (10年)', fontsize=12, fontweight='bold')
ax.set_title('盈虧平衡風險地圖 — FX Rate x Property Value (10年)', fontsize=14, fontweight='bold', color=DARK, pad=15)
ax.grid(alpha=0.2, color='white')

plt.tight_layout()
plt.savefig(f'{OUT}/stress_2var_contour.png', dpi=200, bbox_inches='tight', facecolor=LIGHT_BG)
plt.close()
print("OK stress_2var_contour.png")

# ══════════════════════════════════════════════════════
# SAVE DATA FOR PPTX
# ══════════════════════════════════════════════════════
data = {
    "constants": {
        "property_hkd": HKD_PROP,
        "property_jpy": JPY_PROP,
        "fx_base": JPY_PER_HKD,
        "ltv": LTV,
        "rate": RATE_ANNUAL,
        "mortgage_term_years": TERM_YEARS,
        "hold_years": HOLD_YEARS,
        "monthly_payment_jpy": round(monthly_payment, 0),
        "annual_rent_jpy": gross_rent_jpy,
        "net_rent_jpy": round(net_rent_jpy, 0),
        "invested_hkd": INVESTED_HKD,
        "balance_at_exit_jpy": round(balance_at_exit, 0),
        "principal_paid_10y_jpy": round(total_principal_paid_10y, 0),
    },
    "variable1_fx": var1_fx,
    "variable2_property": var2_prop,
    "matrix_annualized": matrix_annualized.tolist(),
    "matrix_total_roi_pct": matrix_total_roi.tolist(),
    "worst": {"property": worst_prop, "fx": worst_fx, "annualized": round(worst_ann, 2)},
    "best": {"property": best_prop, "fx": best_fx, "annualized": round(best_ann, 2)},
    "loss_scenarios": loss_count,
    "total_scenarios": n_fx * n_prop,
    "base_annualized": round(matrix_annualized[2][5], 2),
}

with open('{}/stress_2var_data.json'.format(OUT), 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

# Also save FX scenario data
fx_data = {
    "summary": {
        "property_hkd": HKD_PROP,
        "property_jpy": JPY_PROP,
        "fx_rate": JPY_PER_HKD,
        "down_payment_jpy": round(DOWN_JPY, 0),
        "down_payment_hkd": round(INVESTED_HKD, 0),
        "loan_jpy": round(LOAN_JPY, 0),
        "loan_hkd": round(LOAN_JPY / JPY_PER_HKD, 0),
        "monthly_payment_jpy": round(monthly_payment, 0),
        "annual_payment_jpy": round(annual_payment, 0),
        "gross_rent_jpy": gross_rent_jpy,
        "net_rent_jpy": round(net_rent_jpy, 0),
        "net_yield_pct": round(net_rent_jpy / DOWN_JPY * 100, 2),
        "mortgage_term_years": TERM_YEARS,
        "hold_years": HOLD_YEARS,
        "balance_at_exit_jpy": round(balance_at_exit, 0),
    },
    "scenarios": [],
}
for i, (label, rate, change) in enumerate(zip(fx_labels, fx_rates, fx_rate_changes)):
    fx_data["scenarios"].append({
        "label": label.replace('\n', ' '),
        "fx_rate": round(rate, 2),
        "change_pct": round(change * 100, 1),
        "jpy_move": round(-change * 100, 1),
        "annual_net_hkd": round(annual_net_income_hkd[i], 2),
        "net_yield_pct": round(yields_hkd[i], 2),
        "cum_10y_hkd": round(cum_net_income_hkd[i], 2),
        "exit_value_hkd": round(net_exit_jpy_base / rate, 2),
        "total_return_hkd": round(total_return_hkd[i], 2),
        "roi_pct": round(roi_list[i], 2),
        "annualized_roi": round(annualized_roi[i], 2),
    })

with open('{}/fx_analysis_data.json'.format(OUT), 'w', encoding='utf-8') as f:
    json.dump(fx_data, f, ensure_ascii=False, indent=2)

print("\n=== ALL CHARTS + DATA GENERATED (10-Year) ===")
print(f"Base annualized return: {data['base_annualized']}%")
print(f"Total scenarios: {data['total_scenarios']}, Loss: {data['loss_scenarios']}")
print(f"Range: {data['worst']['annualized']}% ~ {data['best']['annualized']}%")