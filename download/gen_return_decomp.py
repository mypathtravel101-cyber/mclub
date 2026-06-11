# -*- coding: utf-8 -*-
"""
PZC Group — Return Decomposition (10-Year)
4 separate horizontal bars per panel, matching reference layout exactly
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
DARK = '#1A1A1A'

# ── Parameters ──
invested_hkd = 2_400_000
jpy_prop = 78_000_000
fx_base = 19.5
net_rent_jpy = 2_094_462
hold = 10
balance_at_exit = 11_990_939
principal_paid_10y = 19_209_061
loan_jpy = 31_200_000

# ── 3 Scenarios ──
scenarios = [
    {'label': '保守 -1.5%/年', 'prop_ann': -0.015},
    {'label': '最可能 +2.5%/年', 'prop_ann': 0.025},
    {'label': '樂觀 +5.0%/年',  'prop_ann': 0.050},
]

for s in scenarios:
    prop_10y = jpy_prop * (1 + s['prop_ann'])**hold
    
    # Component 1: Net exit value (property - mortgage balance) in HKD
    net_exit_hkd = (prop_10y - balance_at_exit) / fx_base
    
    # Component 2: Principal paid (equity build) in HKD
    equity_hkd = principal_paid_10y / fx_base
    
    # Component 3: Capital gain/loss (price change) in HKD
    price_change_hkd = (prop_10y - jpy_prop) / fx_base
    
    # Component 4: 10-year net rent in HKD
    rent_hkd = (net_rent_jpy / fx_base) * hold
    
    # Total
    total_hkd = rent_hkd + net_exit_hkd
    roi = (total_hkd - invested_hkd) / invested_hkd * 100
    ann = ((total_hkd / invested_hkd)**(1/hold) - 1) * 100
    
    s['net_exit_hkd'] = net_exit_hkd
    s['equity_hkd'] = equity_hkd
    s['price_change_hkd'] = price_change_hkd
    s['rent_hkd'] = rent_hkd
    s['total_hkd'] = total_hkd
    s['roi'] = roi
    s['ann'] = ann

# ── Colors (matching reference) ──
GREY_BAR   = '#BDC3C7'   # 物業淨套現
BLUE_BAR   = '#1E3A5F'   # 按揭本金償還
GOLD_BAR   = '#C9A84C'   # 淨租金
GREEN_BAR  = '#27AE60'   # 資本增值 (positive)
RED_BAR    = '#E74C3C'   # 資本增值 (negative)
ZERO_BAR   = '#95A5A6'   # 資本增值 (zero)

# ── Chart ──
fig, axes = plt.subplots(1, 3, figsize=(18, 7))
fig.patch.set_facecolor(BG)
fig.suptitle('回報來源分解 — 客戶投入 HKD 2,400,000（基準匯率）',
             fontsize=18, fontweight='bold', color=DARK, y=1.01)

categories = [
    '物業淨套現價值',
    '按揭本金償還',
    '資本增值（房價變動）',
    '10年淨租金',
]

for idx, (ax, s) in enumerate(zip(axes, scenarios)):
    ax.set_facecolor(BG)
    
    vals_k = [s['net_exit_hkd']/1000, s['equity_hkd']/1000,
              s['price_change_hkd']/1000, s['rent_hkd']/1000]
    pcts = [v*1000/invested_hkd*100 for v in vals_k]
    
    colors = [GREY_BAR, BLUE_BAR, GOLD_BAR, '#2980B9']
    # Capital gain color
    if s['price_change_hkd'] < -1000:
        colors[2] = RED_BAR
    elif s['price_change_hkd'] > 1000:
        colors[2] = GREEN_BAR
    else:
        colors[2] = ZERO_BAR
    
    y_pos = [3, 2, 1, 0]
    
    for i, (cat, val, pct, c, y) in enumerate(zip(categories, vals_k, pcts, colors, y_pos)):
        ax.barh(y, val, height=0.55, color=c, alpha=0.85, edgecolor='white', linewidth=1.2)
        
        sign = '+' if val >= 0 else ''
        # Text label at end of bar
        if val >= 0:
            txt_x = val + 40
            ha = 'left'
        else:
            txt_x = val - 40
            ha = 'right'
        
        ax.text(txt_x, y,
                'HKD {}{:.0f}K\n({}{}%)'.format(sign, abs(val), sign, pct),
                ha=ha, va='center', fontsize=8.5, fontweight='bold', color=DARK)
    
    # Zero line
    ax.axvline(x=0, color=DARK, linewidth=1.2, alpha=0.5)
    
    # Scenario title
    subtitle = '10年總計: +{:.1f}% ｜ 年化: {:.2f}%'.format(s['roi'], s['ann'])
    ax.set_title('{}\n{}'.format(s['label'], subtitle),
                 fontsize=12, fontweight='bold', color=DARK, pad=10)
    
    ax.set_yticks([0, 1, 2, 3])
    ax.set_yticklabels(categories, fontsize=10, fontweight='bold')
    ax.set_xlabel('回報率（%）', fontsize=10)
    ax.grid(axis='x', alpha=0.25)
    
    # Consistent x range across all 3
    ax.set_xlim(-800, 4500)
    
    # Format x-axis as percentage of invested
    # x values are in HKD thousands, invested = 2400K
    # So x=2400 means 100% return
    ticks = np.arange(-600, 4200, 600)
    ax.set_xticks(ticks)
    ax.set_xticklabels(['{}%'.format(int(t/2400*100)) for t in ticks], fontsize=8)

plt.tight_layout()
plt.savefig('{}/return_decomposition.png'.format(OUT), dpi=200, bbox_inches='tight', facecolor=BG)
plt.close()

print("OK return_decomposition.png")
for s in scenarios:
    print("\n{} (ROI +{:.1f}%, 年化 {:.2f}%)".format(s['label'], s['roi'], s['ann']))
    print("  物業淨套現: HKD {:,.0f}K ({:.1f}%)".format(s['net_exit_hkd']/1000, s['net_exit_hkd']/invested_hkd*100))
    print("  按揭本金:   HKD {:,.0f}K ({:.1f}%)".format(s['equity_hkd']/1000, s['equity_hkd']/invested_hkd*100))
    print("  資本增值:   HKD {:,.0f}K ({:+.1f}%)".format(s['price_change_hkd']/1000, s['price_change_hkd']/invested_hkd*100))
    print("  淨租金:     HKD {:,.0f}K ({:.1f}%)".format(s['rent_hkd']/1000, s['rent_hkd']/invested_hkd*100))
    print("  總計:       HKD {:,.0f}K".format(s['total_hkd']/1000))