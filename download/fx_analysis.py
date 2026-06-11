# -*- coding: utf-8 -*-
"""
PZC Group — JPY Property FX Risk Scenario Analysis
HKD 4,000,000 property, 6% yield, 40% LTV mortgage @ 3%, 15-year term
"""

import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.ticker as mticker
import matplotlib.font_manager as fm
import numpy as np
import os, json

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
JPY_PROP     = HKD_PROP * JPY_PER_HKD   # ~78M JPY
YIELD_PCT    = 0.06               # Gross yield 6%
LTV          = 0.40               # 40% loan
RATE_ANNUAL  = 0.03               # 3% mortgage rate
TERM_YEARS   = 15                 # 15-year mortgage
CLIENT_AGE   = 45

# ── Mortgage calculation ──
LOAN_JPY = JPY_PROP * LTV
DOWN_JPY = JPY_PROP * (1 - LTV)
r_m = RATE_ANNUAL / 12
n   = TERM_YEARS * 180  # months ... wait
n   = TERM_YEARS * 12

monthly_payment = LOAN_JPY * (r_m * (1 + r_m)**n) / ((1 + r_m)**n - 1)
annual_payment  = monthly_payment * 12

# Gross rent in JPY
gross_rent_jpy = JPY_PROP * YIELD_PCT

# Net rent after mortgage
net_rent_jpy = gross_rent_jpy - annual_payment

# Net yield on invested capital
net_yield_base = net_rent_jpy / DOWN_JPY * 100

# ── Print summary ──
summary = {
    "property_hkd": HKD_PROP,
    "property_jpy": JPY_PROP,
    "fx_rate": JPY_PER_HKD,
    "down_payment_jpy": DOWN_JPY,
    "down_payment_hkd": DOWN_JPY / JPY_PER_HKD,
    "loan_jpy": LOAN_JPY,
    "loan_hkd": LOAN_JPY / JPY_PER_HKD,
    "monthly_payment_jpy": monthly_payment,
    "annual_payment_jpy": annual_payment,
    "gross_rent_jpy": gross_rent_jpy,
    "net_rent_jpy": net_rent_jpy,
    "net_yield_pct": net_yield_base,
    "mortgage_term_years": TERM_YEARS,
}
for k, v in summary.items():
    if isinstance(v, float):
        print(f"{k}: {v:,.2f}")
    else:
        print(f"{k}: {v:,}")

# ══════════════════════════════════════════════════════
# 2. FX SCENARIOS
# ══════════════════════════════════════════════════════
# Rate drops = JPY appreciates (stronger yen = each JPY worth more HKD = GOOD for HKD investor)
# Rate rises  = JPY depreciates (weaker yen = each JPY worth less HKD = BAD for HKD investor)
fx_rate_changes = [-0.20, -0.10, -0.05, 0, 0.05, 0.10, 0.20]  # change in JPY/HKD rate
fx_labels  = ['JPY大幅升值\n(+20%)', 'JPY升值\n(+10%)', 'JPY小幅升值\n(+5%)',
              '基準情景\n(現匯率)', 'JPY小幅貶值\n(-5%)', 'JPY貶值\n(-10%)', 'JPY大幅貶值\n(-20%)']
fx_rates   = [JPY_PER_HKD * (1 + c) for c in fx_rate_changes]

# Colors: green = JPY appreciation (good), red = JPY depreciation (bad)
scenario_colors = ['#1E8449', '#27AE60', '#82E0AA', GOLD, '#F1948A', '#E74C3C', '#C0392B']

# ── Amortization schedule ──
years = np.arange(1, TERM_YEARS + 1)
balance = np.zeros(TERM_YEARS)
interest_paid = np.zeros(TERM_YEARS)
principal_paid = np.zeros(TERM_YEARS)
cum_interest = np.zeros(TERM_YEARS)

remaining = LOAN_JPY
for i, y in enumerate(years):
    year_interest = 0
    year_principal = 0
    for m in range(12):
        interest_m = remaining * r_m
        principal_m = monthly_payment - interest_m
        remaining -= principal_m
        year_interest += interest_m
        year_principal += principal_m
    interest_paid[i] = year_interest
    principal_paid[i] = year_principal
    balance[i] = max(remaining, 0)
    cum_interest[i] = cum_interest[i-1] + year_interest if i > 0 else year_interest

# ── Net income under each FX scenario (per year) ──
# The FX rate at exit matters for conversion
# For annual income: convert net_rent_jpy to HKD at scenario rate
# For exit: (property_value_jpy - remaining_balance) / fx_rate → HKD

# Assume property value stays constant in JPY (conservative)
# At exit year 15: remaining balance ≈ 0 (fully amortized)

exit_property_jpy = JPY_PROP  # assume no JPY capital gain/loss

# 15-year cumulative analysis per scenario
cum_net_income_hkd = []
total_return_hkd = []
annual_net_income_hkd = []

for rate in fx_rates:
    # Annual net rent in HKD
    ann_hkd = net_rent_jpy / rate
    annual_net_income_hkd.append(ann_hkd)
    # 15-year cumulative (no compounding)
    cum = ann_hkd * TERM_YEARS
    cum_net_income_hkd.append(cum)
    # Total return = cumulative rent + (exit value - down payment converted)
    # Exit: sell property at JPY_PROP, no remaining mortgage at year 15
    exit_hkd = exit_property_jpy / rate
    # Down payment was DOWN_JPY / JPY_PER_HKD in HKD at base rate
    # But FX risk is about what you GET BACK in HKD
    total = cum + exit_hkd  # gross return in HKD
    total_return_hkd.append(total)

# ROI
invested_hkd = HKD_PROP * (1 - LTV)  # HKD 2,400,000 down payment
roi = [(t - invested_hkd) / invested_hkd * 100 for t in total_return_hkd]
annualized_roi = [((t / invested_hkd) ** (1/TERM_YEARS) - 1) * 100 for t in total_return_hkd]

# ══════════════════════════════════════════════════════
# 3. CHART 1 — Mortgage Amortization
# ══════════════════════════════════════════════════════
fig, ax1 = plt.subplots(figsize=(12, 6.5))
fig.patch.set_facecolor(LIGHT_BG)
ax1.set_facecolor(LIGHT_BG)

bar_w = 0.5
bars1 = ax1.bar(years - bar_w/4, principal_paid/1e6, bar_w/2, color=BLUE, label='本金償還', alpha=0.85)
bars2 = ax1.bar(years + bar_w/4, interest_paid/1e6, bar_w/2, color=GOLD, label='利息支出', alpha=0.85)

ax2 = ax1.twinx()
ax2.plot(years, balance/1e6, color=RED, linewidth=2.5, marker='o', markersize=5, label='貸款餘額', zorder=5)
ax2.set_ylabel('貸款餘額 (百萬日圓)', fontsize=12, fontweight='bold')
ax2.tick_params(axis='y', labelsize=10)

ax1.set_xlabel('年份', fontsize=12, fontweight='bold')
ax1.set_ylabel('金額 (百萬日圓)', fontsize=12, fontweight='bold')
ax1.set_title('15年按揭攤還計劃', fontsize=16, fontweight='bold', color=DARK, pad=15)
ax1.set_xticks(years)

lines1, labels1 = ax1.get_legend_handles_labels()
lines2, labels2 = ax2.get_legend_handles_labels()
ax1.legend(lines1 + lines2, labels1 + labels2, loc='upper right', fontsize=11,
           facecolor='white', edgecolor=GOLD, framealpha=0.9)

ax1.grid(axis='y', alpha=0.3)
ax1.tick_params(axis='x', labelsize=9)
ax1.tick_params(axis='y', labelsize=10)
plt.tight_layout()
plt.savefig(f'{OUT}/mortgage_amortization.png', dpi=200, bbox_inches='tight', facecolor=LIGHT_BG)
plt.close()
print("✓ mortgage_amortization.png")

# ══════════════════════════════════════════════════════
# 4. CHART 2 — Annual Net Income HKD by FX Scenario
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
ax.axhline(y=annual_net_income_hkd[3]/1000, color=GOLD, linestyle='--', alpha=0.5, label=f'基準: HKD {annual_net_income_hkd[3]/1000:,.0f}K/年')
ax.legend(loc='best', fontsize=10, facecolor='white', edgecolor=GOLD)
ax.grid(axis='y', alpha=0.3)
plt.tight_layout()
plt.savefig(f'{OUT}/fx_annual_income.png', dpi=200, bbox_inches='tight', facecolor=LIGHT_BG)
plt.close()
print("✓ fx_annual_income.png")

# ══════════════════════════════════════════════════════
# 5. CHART 3 — 15-Year Cumulative Return Waterfall by Scenario
# ══════════════════════════════════════════════════════
fig, ax = plt.subplots(figsize=(13, 7))
fig.patch.set_facecolor(LIGHT_BG)
ax.set_facecolor(LIGHT_BG)

# Stacked bar: down payment + cumulative interest + cumulative rent + exit gain
x = np.arange(len(fx_labels))
down_hkd = invested_hkd / 1000  # in thousands

# Total interest paid in HKD (at base rate, since mortgage is in JPY and paid by JPY rent)
# Interest is in JPY, effectively hedged (rent covers mortgage in JPY)
# So FX risk on interest is minimal — the real FX risk is on NET rent and EXIT value

# For visualization: show components
net_rent_15y_hkd = [c/1000 for c in cum_net_income_hkd]
exit_val_hkd = [(exit_property_jpy / rate) / 1000 for rate in fx_rates]
exit_gain_hkd = [ev - down_hkd - sum(interest_paid)/JPY_PER_HKD/1000 for ev in exit_val_hkd]  # simplified

# Simplified: show total return breakdown
total_hkd = [t/1000 for t in total_return_hkd]
profit_hkd = [(t - invested_hkd)/1000 for t in total_return_hkd]

colors_profit = [c for c in scenario_colors]
bars_invested = ax.bar(x, [down_hkd]*len(x), 0.55, color=GREY, alpha=0.6, label='投入本金 (HKD 2,400K)', edgecolor='white')
bars_profit = ax.bar(x, profit_hkd, 0.55, bottom=[down_hkd]*len(x), color=colors_profit,
                     alpha=0.85, label='15年總回報利潤', edgecolor='white')

for i, (p, t) in enumerate(zip(profit_hkd, total_hkd)):
    ax.text(i, t + 50, f'HKD {t:,.0f}K\n(ROI: {roi[i]:+.1f}%)',
            ha='center', va='bottom', fontsize=8.5, fontweight='bold', color=DARK)

ax.set_xticks(x)
ax.set_xticklabels(fx_labels, fontsize=9.5)
ax.set_ylabel('金額 (千港元)', fontsize=12, fontweight='bold')
ax.set_title('15年投資總回報 — 不同匯率情景', fontsize=14, fontweight='bold', color=DARK, pad=15)
ax.legend(loc='upper left', fontsize=10, facecolor='white', edgecolor=GOLD)
ax.grid(axis='y', alpha=0.3)
plt.tight_layout()
plt.savefig(f'{OUT}/fx_total_return.png', dpi=200, bbox_inches='tight', facecolor=LIGHT_BG)
plt.close()
print("✓ fx_total_return.png")

# ══════════════════════════════════════════════════════
# 6. CHART 4 — FX Sensitivity (Exit Value + Net Yield)
# ══════════════════════════════════════════════════════
fig, ax1 = plt.subplots(figsize=(12, 6.5))
fig.patch.set_facecolor(LIGHT_BG)
ax1.set_facecolor(LIGHT_BG)

# Continuous FX curve
fx_range = np.linspace(JPY_PER_HKD * 0.75, JPY_PER_HKD * 1.25, 100)
exit_hkd_curve = [(JPY_PROP / r) / 1e6 for r in fx_range]  # in millions HKD
net_income_curve = [(net_rent_jpy / r) / 1000 for r in fx_range]  # in K HKD

color1 = BLUE
color2 = GOLD

ax1.plot(fx_range, exit_hkd_curve, color=color1, linewidth=2.5, label='物業套現價值 (百萬港元)')
ax1.fill_between(fx_range, exit_hkd_curve, alpha=0.1, color=color1)
ax1.set_xlabel('日圓/港元匯率 (JPY/HKD)', fontsize=12, fontweight='bold')
ax1.set_ylabel('套現價值 (百萬港元)', fontsize=12, fontweight='bold', color=color1)
ax1.tick_params(axis='y', labelcolor=color1)

ax2 = ax1.twinx()
ax2.plot(fx_range, net_income_curve, color=color2, linewidth=2.5, linestyle='--', label='每年淨收入 (千港元)')
ax2.set_ylabel('每年淨收入 (千港元)', fontsize=12, fontweight='bold', color=color2)
ax2.tick_params(axis='y', labelcolor=color2)

# Mark base scenario
ax1.axvline(x=JPY_PER_HKD, color=RED, linestyle=':', alpha=0.7, linewidth=1.5)
ax1.annotate(f'基準: {JPY_PER_HKD}', xy=(JPY_PER_HKD, JPY_PROP/JPY_PER_HKD/1e6),
             xytext=(JPY_PER_HKD+1.5, JPY_PROP/JPY_PER_HKD/1e6 - 0.3),
             fontsize=10, color=RED, fontweight='bold',
             arrowprops=dict(arrowstyle='->', color=RED))

# Scenario dots
for i, (rate, c) in enumerate(zip(fx_rates, scenario_colors)):
    ax1.plot(rate, (JPY_PROP/rate)/1e6, 'o', color=c, markersize=10, zorder=5, markeredgecolor='white', markeredgewidth=1.5)

lines1, labels1 = ax1.get_legend_handles_labels()
lines2, labels2 = ax2.get_legend_handles_labels()
ax1.legend(lines1 + lines2, labels1 + labels2, loc='upper right', fontsize=10,
           facecolor='white', edgecolor=GOLD, framealpha=0.9)

ax1.set_title('匯率敏感度分析 — 套現價值與淨收入', fontsize=14, fontweight='bold', color=DARK, pad=15)
ax1.grid(alpha=0.3)
plt.tight_layout()
plt.savefig(f'{OUT}/fx_sensitivity.png', dpi=200, bbox_inches='tight', facecolor=LIGHT_BG)
plt.close()
print("✓ fx_sensitivity.png")

# ══════════════════════════════════════════════════════
# 7. CHART 5 — Summary Dashboard (compact)
# ══════════════════════════════════════════════════════
fig, axes = plt.subplots(1, 2, figsize=(13, 6))
fig.patch.set_facecolor(LIGHT_BG)
fig.suptitle('JPY物業投資 — 關鍵指標摘要', fontsize=15, fontweight='bold', color=DARK, y=1.02)

# Left: Net yield comparison
ax = axes[0]
ax.set_facecolor(LIGHT_BG)
yields_hkd = [(net_rent_jpy / rate) / invested_hkd * 100 for rate in fx_rates]
bars = ax.barh(range(len(fx_labels)), yields_hkd, color=scenario_colors, edgecolor='white', height=0.6)
for i, (y, bar) in enumerate(zip(yields_hkd, bars)):
    ax.text(y + 0.1, bar.get_y() + bar.get_height()/2,
            f'{y:.2f}%', va='center', fontsize=10, fontweight='bold', color=DARK)
ax.set_yticks(range(len(fx_labels)))
ax.set_yticklabels([l.replace('\n', ' ') for l in fx_labels], fontsize=9.5)
ax.set_xlabel('淨回報率 (%)', fontsize=11, fontweight='bold')
ax.set_title('淨租金回報率（相對投入本金）', fontsize=12, fontweight='bold', color=DARK)
ax.axvline(x=yields_hkd[3], color=RED, linestyle='--', alpha=0.5)
ax.grid(axis='x', alpha=0.3)

# Right: Annualized ROI
ax = axes[1]
ax.set_facecolor(LIGHT_BG)
bars = ax.barh(range(len(fx_labels)), annualized_roi, color=scenario_colors, edgecolor='white', height=0.6)
for i, (r, bar) in enumerate(zip(annualized_roi, bars)):
    ax.text(max(r, 0) + 0.2, bar.get_y() + bar.get_height()/2,
            f'{r:+.2f}%', va='center', fontsize=10, fontweight='bold', color=DARK)
ax.set_yticks(range(len(fx_labels)))
ax.set_yticklabels([l.replace('\n', ' ') for l in fx_labels], fontsize=9.5)
ax.set_xlabel('年化回報率 (%)', fontsize=11, fontweight='bold')
ax.set_title('15年年化總回報率', fontsize=12, fontweight='bold', color=DARK)
ax.axvline(x=0, color=RED, linewidth=1)
ax.grid(axis='x', alpha=0.3)

plt.tight_layout()
plt.savefig(f'{OUT}/fx_summary_dashboard.png', dpi=200, bbox_inches='tight', facecolor=LIGHT_BG)
plt.close()
print("✓ fx_summary_dashboard.png")

# ── Save data for PPTX ──
data = {
    "summary": {k: round(v, 2) if isinstance(v, float) else v for k, v in summary.items()},
    "scenarios": [],
}
for i, (label, rate, change) in enumerate(zip(fx_labels, fx_rates, fx_rate_changes)):
    data["scenarios"].append({
        "label": label.replace('\n', ' '),
        "fx_rate": round(rate, 2),
        "change_pct": round(change * 100, 1),  # rate change %
        "jpy_move": round(-change * 100, 1),   # JPY direction (opposite)
        "annual_net_hkd": round(annual_net_income_hkd[i], 2),
        "net_yield_pct": round(yields_hkd[i], 2),
        "cum_15y_hkd": round(cum_net_income_hkd[i], 2),
        "exit_value_hkd": round(exit_property_jpy / rate, 2),
        "total_return_hkd": round(total_return_hkd[i], 2),
        "roi_pct": round(roi[i], 2),
        "annualized_roi": round(annualized_roi[i], 2),
    })

with open(f'{OUT}/fx_analysis_data.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print("\n✓ All 5 charts generated + data exported")
print(f"\nKey metrics at base rate:")
print(f"  Property: HKD {HKD_PROP:,} / JPY {JPY_PROP:,.0f}")
print(f"  Down payment: HKD {invested_hkd:,}")
print(f"  Loan: JPY {LOAN_JPY:,.0f} (40% LTV @ 3%, 15yr)")
print(f"  Monthly mortgage: JPY {monthly_payment:,.0f}")
print(f"  Annual mortgage: JPY {annual_payment:,.0f}")
print(f"  Gross rent: JPY {gross_rent_jpy:,.0f}/yr")
print(f"  Net rent: JPY {net_rent_jpy:,.0f}/yr")
print(f"  Net rent (HKD): {annual_net_income_hkd[3]:,.0f}/yr")
print(f"  Net yield: {yields_hkd[3]:.2f}%")
print(f"  15yr ROI (base): {roi[3]:+.2f}%")
print(f"  15yr Annualized: {annualized_roi[3]:+.2f}%")
