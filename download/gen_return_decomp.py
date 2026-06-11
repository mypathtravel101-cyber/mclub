# -*- coding: utf-8 -*-
"""
PZC Group — Return Decomposition Horizontal Bar Chart (10-Year)
Matching the reference image style: 3 panels, horizontal stacked bars
"""
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.font_manager as fm
import numpy as np

fm.fontManager.addfont('/usr/share/fonts/truetype/chinese/SarasaMonoSC-Regular.ttf')
fm.fontManager.addfont('/usr/share/fonts/truetype/chinese/SarasaMonoSC-Bold.ttf')
fm.fontManager.addfont('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf')
plt.rcParams['font.sans-serif'] = ['Sarasa Mono SC', 'DejaVu Sans']
plt.rcParams['axes.unicode_minus'] = False

OUT = '/home/z/my-project/download/ppt_charts'
BG = '#F5F2E8'

# ── Parameters ──
invested_hkd = 2_400_000
jpy_prop = 78_000_000
fx_base = 19.5
net_rent_jpy = 2_094_462
hold = 10
balance_at_exit = 11_990_939
principal_paid_10y = 19_209_061
loan_jpy = 31_200_000

# ── 3 Scenarios (research-based property forecasts) ──
scenarios = [
    {'label': '保守 -1.5%/年', 'prop_ann': -0.015},
    {'label': '最可能 +2.5%/年', 'prop_ann': 0.025},
    {'label': '樂觀 +5.0%/年',  'prop_ann': 0.050},
]

# Calculate components for each scenario
for s in scenarios:
    prop_10y = jpy_prop * (1 + s['prop_ann'])**hold
    
    # Component 1: 10-year net rent in HKD
    rent_hkd = (net_rent_jpy / fx_base) * hold
    
    # Component 2: Mortgage principal paid (equity build-up) in HKD
    equity_hkd = principal_paid_10y / fx_base
    
    # Component 3: Property price change in HKD
    price_change_jpy = prop_10y - jpy_prop
    price_change_hkd = price_change_jpy / fx_base
    
    # Total value at exit = net rent + (property - remaining mortgage) in HKD
    net_exit_hkd = (prop_10y - balance_at_exit) / fx_base
    total_hkd = rent_hkd + net_exit_hkd
    
    # ROI & annualized
    roi = (total_hkd - invested_hkd) / invested_hkd * 100
    ann = ((total_hkd / invested_hkd)**(1/hold) - 1) * 100
    
    s['rent_hkd'] = rent_hkd
    s['equity_hkd'] = equity_hkd
    s['price_change_hkd'] = price_change_hkd
    s['total_hkd'] = total_hkd
    s['roi'] = roi
    s['ann'] = ann
    s['prop_10y_jpy'] = prop_10y

# ── Colors ──
GREY_BAR  = '#BDC3C7'
BLUE_BAR  = '#1E3A5F'
GOLD_BAR  = '#C9A84C'
GREEN_BAR = '#27AE60'
RED_BAR   = '#E74C3C'
DARK      = '#1A1A1A'

# ── Chart ──
fig, axes = plt.subplots(1, 3, figsize=(16, 7), sharey=True)
fig.patch.set_facecolor(BG)
fig.suptitle('回報來源分解 — 客戶投入 HKD 2,400,000（基準匯率）',
             fontsize=18, fontweight='bold', color=DARK, y=1.01)

categories = ['10年淨租金', '按揭本金償還', '房價變動']

for idx, (ax, s) in enumerate(zip(axes, scenarios)):
    ax.set_facecolor(BG)
    
    vals = [s['rent_hkd']/1000, s['equity_hkd']/1000, s['price_change_hkd']/1000]
    pcts = [v*1000/invested_hkd*100 for v in vals]
    
    # Colors: rent=gold, equity=blue, price=green/red
    if vals[2] >= 0:
        colors = [GOLD_BAR, BLUE_BAR, GREEN_BAR]
    else:
        colors = [GOLD_BAR, BLUE_BAR, RED_BAR]
    
    y_pos = [2, 1, 0]
    labels_detail = []
    
    for i, (cat, val, pct, c, y) in enumerate(zip(categories, vals, pcts, colors, y_pos)):
        sign = '+' if val >= 0 else ''
        ax.barh(y, val, height=0.5, color=c, alpha=0.85, edgecolor='white', linewidth=1.2)
        
        # Label: HKD amount + percentage
        if abs(val) > 50:
            txt_x = val + 30 if val >= 0 else val - 30
            ha = 'left' if val >= 0 else 'right'
            ax.text(txt_x, y, 'HKD {}{:.0f}K\n({}{}%)'.format(sign, abs(val), sign, pct),
                    ha=ha, va='center', fontsize=9, fontweight='bold', color=DARK)
    
    # Invested capital reference line
    ax.axvline(x=0, color=DARK, linewidth=1.5)
    
    # Scenario title
    subtitle = '10年總計: +{:.1f}% ｜ 年化: {:.2f}%'.format(s['roi'], s['ann'])
    ax.set_title('{}\n{}'.format(s['label'], subtitle),
                 fontsize=12, fontweight='bold', color=DARK, pad=12)
    
    ax.set_yticks([0, 1, 2])
    ax.set_yticklabels(categories, fontsize=11, fontweight='bold')
    ax.set_xlabel('金額 (千港元)', fontsize=10)
    ax.grid(axis='x', alpha=0.3)
    
    # Set symmetric x range
    all_vals = [s2['rent_hkd']/1000 for s2 in scenarios] + \
               [s2['equity_hkd']/1000 for s2 in scenarios] + \
               [s2['price_change_hkd']/1000 for s2 in scenarios]
    xmin = min(all_vals) * 1.3
    xmax = max(all_vals) * 1.3
    ax.set_xlim(xmin, xmax)

plt.tight_layout()
plt.savefig('{}/return_decomposition.png'.format(OUT), dpi=200, bbox_inches='tight', facecolor=BG)
plt.close()

print("OK return_decomposition.png")
for s in scenarios:
    print("{}: 總回報 HKD {:,.0f}, 年化 {:.2f}%, ROI +{:.1f}%".format(
        s['label'], s['total_hkd'], s['ann'], s['roi']))