# -*- coding: utf-8 -*-
"""
PZC Group — 10-Year Return Decomposition Chart (Polished Version)
3-panel horizontal bar chart: 保守 / 基準 / 樂觀
Matches reference image style with labels inside bars
"""

import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.font_manager as fm
import matplotlib.ticker as mticker
import matplotlib.patches as mpatches
import numpy as np
import math
import os

# ── Font setup ──
fm.fontManager.addfont('/usr/share/fonts/truetype/chinese/SarasaMonoSC-Regular.ttf')
fm.fontManager.addfont('/usr/share/fonts/truetype/chinese/SarasaMonoSC-Bold.ttf')
fm.fontManager.addfont('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf')
plt.rcParams['font.sans-serif'] = ['Sarasa Mono SC', 'DejaVu Sans']
plt.rcParams['axes.unicode_minus'] = False

# ── Design palette ──
GOLD      = '#C9A84C'
DARK      = '#1A1A1A'
BLUE      = '#1E3A5F'
LIGHT_BG  = '#FAFAF5'
GREEN     = '#27AE60'
RED       = '#E74C3C'
DARK_BLUE = '#2C3E7B'
GREY_BAR  = '#95A5A6'

OUT = '/home/z/my-project/download/ppt_charts'
os.makedirs(OUT, exist_ok=True)

# ══════════════════════════════════════════════════════
# CORE ASSUMPTIONS
# ══════════════════════════════════════════════════════
HKD_PROP     = 4_000_000
JPY_PER_HKD  = 19.5
JPY_PROP     = HKD_PROP * JPY_PER_HKD
YIELD_PCT    = 0.06
LTV          = 0.40
RATE_ANNUAL  = 0.03
TERM_YEARS   = 15
HOLD_YEARS   = 10

LOAN_JPY     = JPY_PROP * LTV
DOWN_JPY     = JPY_PROP * (1 - LTV)
INVESTED_HKD = DOWN_JPY / JPY_PER_HKD

r_m = RATE_ANNUAL / 12
n_total = TERM_YEARS * 12
monthly_payment = LOAN_JPY * (r_m * (1 + r_m)**n_total) / ((1 + r_m)**n_total - 1)
annual_payment  = monthly_payment * 12
gross_rent_jpy  = JPY_PROP * YIELD_PCT
net_rent_jpy    = gross_rent_jpy - annual_payment

# Amortization
remaining = LOAN_JPY
balance_at_exit = 0
total_principal_paid_10y = 0

for y in range(1, TERM_YEARS + 1):
    year_principal = 0
    for m in range(12):
        interest_m = remaining * r_m
        principal_m = monthly_payment - interest_m
        remaining -= principal_m
        year_principal += principal_m
    if y <= HOLD_YEARS:
        total_principal_paid_10y += year_principal
    if y == HOLD_YEARS:
        balance_at_exit = max(remaining, 0)

# ══════════════════════════════════════════════════════
# 3 SCENARIOS
# ══════════════════════════════════════════════════════
scenarios = [
    {'label': '保守',  'sub': '-2.47%/年',  'rate': -0.0247, 'accent': RED},
    {'label': '基準',  'sub': '0%/年',      'rate':  0.0,    'accent': GOLD},
    {'label': '樂觀',  'sub': '+1.77%/年', 'rate':  0.0177, 'accent': GREEN},
]

results = []
for sc in scenarios:
    g = sc['rate']
    prop_10y = JPY_PROP * (1 + g) ** HOLD_YEARS
    
    # 4 Components of total value (all in HKD)
    comp_original  = INVESTED_HKD                            # 本金回收
    comp_mortgage  = total_principal_paid_10y / JPY_PER_HKD  # 按揭償還
    comp_price     = (prop_10y - JPY_PROP) / JPY_PER_HKD     # 資本增值
    comp_rent      = (net_rent_jpy / JPY_PER_HKD) * HOLD_YEARS  # 10年淨租金
    
    total_val = comp_original + comp_mortgage + comp_price + comp_rent
    roi = (total_val - INVESTED_HKD) / INVESTED_HKD * 100
    annualized = ((total_val / INVESTED_HKD) ** (1/HOLD_YEARS) - 1) * 100
    
    results.append({
        'label': sc['label'], 'sub': sc['sub'], 'accent': sc['accent'],
        'comps': [
            {'name': '物業原值 (本金回收)',  'val': comp_original, 'pct': comp_original/INVESTED_HKD*100,  'color': GREY_BAR},
            {'name': '按揭償還 (已償還本金)', 'val': comp_mortgage, 'pct': comp_mortgage/INVESTED_HKD*100,  'color': BLUE},
            {'name': '資本增值 (所值變動)',   'val': comp_price,    'pct': comp_price/INVESTED_HKD*100,     'color': GREEN if comp_price >= 0 else RED},
            {'name': '10年淨租金',           'val': comp_rent,     'pct': comp_rent/INVESTED_HKD*100,      'color': DARK_BLUE},
        ],
        'total': total_val, 'roi': roi, 'annualized': annualized,
    })

# ══════════════════════════════════════════════════════
# CHART
# ══════════════════════════════════════════════════════
fig, axes = plt.subplots(1, 3, figsize=(19, 8.5))
fig.patch.set_facecolor(LIGHT_BG)

# X range
all_pcts = [c['pct'] for r in results for c in r['comps']]
x_lo = math.floor(min(all_pcts) / 10) * 10 - 15
x_hi = math.ceil(max(all_pcts) / 10) * 10 + 15

bar_h = 0.52
y_pos = np.arange(4)[::-1]  # top to bottom: 物業原值, 按揭, 資本, 租金

for idx, (ax, res) in enumerate(zip(axes, results)):
    ax.set_facecolor(LIGHT_BG)
    
    for i, comp in enumerate(res['comps']):
        y = y_pos[i]
        pct = comp['pct']
        val = comp['val']
        
        # Draw bar
        ax.barh(y, pct, height=bar_h, color=comp['color'], alpha=0.88,
                edgecolor='white', linewidth=1.2, zorder=3,
                left=0 if pct >= 0 else pct)
        
        # Labels inside bar (white) if bar is wide enough, else outside
        if abs(pct) > 30:
            # Inside bar
            text_x = pct / 2 if pct > 0 else pct / 2
            ax.text(text_x, y,
                    f'HKD {abs(val)/1000:,.0f}K  ({pct:+.1f}%)',
                    ha='center', va='center', fontsize=10.5, fontweight='bold',
                    color='white', zorder=4)
        elif pct >= 0:
            ax.text(pct + 1.5, y,
                    f'HKD {val/1000:,.0f}K  ({pct:+.1f}%)',
                    ha='left', va='center', fontsize=10, fontweight='bold',
                    color=DARK, zorder=4)
        else:
            ax.text(pct - 1.5, y,
                    f'HKD {abs(val)/1000:,.0f}K  ({pct:+.1f}%)',
                    ha='right', va='center', fontsize=10, fontweight='bold',
                    color=DARK, zorder=4)
    
    # Invested capital reference line (100%)
    ax.axvline(x=100, color=RED, linestyle='--', linewidth=1.5, alpha=0.55, zorder=2)
    
    # Zero line
    ax.axvline(x=0, color=DARK, linewidth=0.8, alpha=0.4, zorder=2)
    
    # Panel title
    roi = res['roi']
    ann = res['annualized']
    ax.set_title(f'{res["label"]} ({res["sub"]})\n'
                 f'10年總計: {roi:+.1f}%  |  年化: {ann:+.2f}%',
                 fontsize=13, fontweight='bold', color=DARK, pad=14, linespacing=1.5)
    
    # Y labels
    ax.set_yticks(y_pos)
    names = ['10年淨租金', '資本增值 (所值變動)', '按揭償還 (已償還本金)', '物業原值 (本金回收)']
    ax.set_yticklabels(names, fontsize=10.5, color=DARK)
    
    # X ticks
    ax.set_xticks(range(int(x_lo), int(x_hi)+1, 20))
    ax.xaxis.set_major_formatter(mticker.PercentFormatter())
    ax.set_xlabel('回報率 (%)', fontsize=10, color=DARK, labelpad=5)
    
    # Grid
    ax.grid(axis='x', alpha=0.25, zorder=1)
    ax.set_axisbelow(True)
    
    # Clean spines
    for sp in ['top', 'right']:
        ax.spines[sp].set_visible(False)
    ax.spines['left'].set_linewidth(0.8)
    ax.spines['bottom'].set_linewidth(0.8)
    
    ax.set_xlim(x_lo, max(x_hi, 120))

# Invested capital annotation (only on leftmost panel)
axes[0].text(105, 3.5, '投入本金\n100%', fontsize=8.5, color=RED,
             ha='left', va='center', fontstyle='italic')

# Main title
fig.suptitle('回報來源分解 — 客戶投入 HKD 2,400,000（基準匯率 19.5 JPY/HKD）',
             fontsize=17, fontweight='bold', color=DARK, y=0.99)

# Subtitle
fig.text(0.5, 0.935, '10年持倉期  |  15年按揭（第10年退出，償還剩餘貸款）  |  40% LTV @ 3%',
         ha='center', fontsize=10, color='#666666', fontstyle='italic')

plt.tight_layout(rect=[0.02, 0, 0.98, 0.91])
plt.savefig(f'{OUT}/return_decomposition_10yr.png', dpi=200, bbox_inches='tight',
            facecolor=LIGHT_BG, edgecolor='none')
plt.close()
print(f'OK: {OUT}/return_decomposition_10yr.png')