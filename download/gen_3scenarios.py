# -*- coding: utf-8 -*-
"""
PZC Group — JPY Property 3-Scenario Comparison Card (10-Year)
Based on research-backed property price forecasts
保守: 房價-1.5%/年  |  最可能: 房價+2.5%/年  |  樂觀: 房價+5.0%/年
All at base FX rate (JPY/HKD 19.5)
"""
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.patches as patches
import matplotlib.font_manager as fm
import numpy as np

fm.fontManager.addfont('/usr/share/fonts/truetype/chinese/SarasaMonoSC-Regular.ttf')
fm.fontManager.addfont('/usr/share/fonts/truetype/chinese/SarasaMonoSC-Bold.ttf')
fm.fontManager.addfont('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf')
plt.rcParams['font.sans-serif'] = ['Sarasa Mono SC', 'DejaVu Sans']
plt.rcParams['axes.unicode_minus'] = False

OUT = '/home/z/my-project/download/ppt_charts'

# ── Colors ──
DARK_BG   = '#0F0F0F'
CARD_BG   = '#1A1A1E'
CONSERVATIVE = '#F39C12'
LIKELY      = '#2ECC71'
OPTIMISTIC  = '#1E8449'
WHITE  = '#FFFFFF'
GREY   = '#888888'
GOLD   = '#C9A84C'

# ── Investment parameters ──
invested_hkd = 2_400_000
jpy_prop = 78_000_000
fx_base = 19.5
net_rent_jpy = 2_094_462  # per year
hold = 10
balance_at_exit = 11_990_939  # mortgage remaining at year 10

# ── 3 Scenarios: property price annual change at base FX ──
scenarios_data = [
    {
        'label': '保守',
        'prop_ann': -0.015,
        'color': CONSERVATIVE,
        'reason': '人口下降加速\nBOJ加息超預期\n全球经济衰退',
    },
    {
        'label': '最可能',
        'prop_ann': 0.025,
        'color': LIKELY,
        'reason': '延續當前趨勢\n通脹2~3%支撐\n供應持續減少',
    },
    {
        'label': '樂觀',
        'prop_ann': 0.05,
        'color': OPTIMISTIC,
        'reason': '日圓偏弱吸引外資\n通脹超預期\n供應嚴重不足',
    },
]

for s in scenarios_data:
    prop_10y = jpy_prop * (1 + s['prop_ann'])**hold
    net_exit_jpy = prop_10y - balance_at_exit
    net_exit_hkd = net_exit_jpy / fx_base
    rent_10y_hkd = (net_rent_jpy / fx_base) * hold
    total_hkd = rent_10y_hkd + net_exit_hkd
    roi = (total_hkd - invested_hkd) / invested_hkd * 100
    ann = ((total_hkd / invested_hkd)**(1/hold) - 1) * 100
    s['prop_10y'] = prop_10y
    s['total_hkd'] = total_hkd
    s['roi'] = roi
    s['ann'] = ann
    s['prop_change_pct'] = (prop_10y / jpy_prop - 1) * 100

# ── Draw ──
fig, ax = plt.subplots(figsize=(14, 7.5))
fig.patch.set_facecolor(DARK_BG)
ax.set_facecolor(DARK_BG)
ax.set_xlim(0, 14)
ax.set_ylim(0, 7.5)
ax.axis('off')

# ── Title ──
ax.text(7, 7.0, '10年後你有幾多錢？', fontsize=30, fontweight='bold',
        color=WHITE, ha='center', va='center')
ax.text(7, 6.5, '日本物業投資 HKD 2,400,000 ｜ 40% LTV @ 3% ｜ 6%租金回報 ｜ 10年持倉期',
        fontsize=10.5, color=GREY, ha='center', va='center')
ax.text(7, 6.2, '假設儲蓄不變，基準匯率（JPY/HKD 19.5）下作預測',
        fontsize=9.5, color='#666666', ha='center', va='center')

# ── 3 Cards ──
card_w = 3.8
card_h = 4.8
card_y = 0.65
gap = 0.55
start_x = (14 - 3*card_w - 2*gap) / 2

for i, s in enumerate(scenarios_data):
    x = start_x + i * (card_w + gap)
    c = s['color']
    
    # Card background
    card = patches.FancyBboxPatch((x, card_y), card_w, card_h,
                                   boxstyle="round,pad=0.15",
                                   facecolor=CARD_BG, edgecolor=c,
                                   linewidth=2.5)
    ax.add_patch(card)
    
    # Strategy label bar
    label_bar = patches.FancyBboxPatch((x + 0.3, card_y + card_h - 0.65), card_w - 0.6, 0.45,
                                        boxstyle="round,pad=0.08",
                                        facecolor=c, edgecolor='none', alpha=0.9)
    ax.add_patch(label_bar)
    ax.text(x + card_w/2, card_y + card_h - 0.425, s['label'],
            fontsize=16, fontweight='bold', color=WHITE, ha='center', va='center')
    
    # Property price change
    prop_sign = '+' if s['prop_change_pct'] >= 0 else ''
    ax.text(x + card_w/2, card_y + card_h - 1.05,
            '10年房價變動: {}{:.1f}%'.format(prop_sign, s['prop_change_pct']),
            fontsize=10, color=GREY, ha='center', va='center')
    
    # Reason bullets
    ax.text(x + card_w/2, card_y + card_h - 1.55, s['reason'],
            fontsize=8.5, color='#777777', ha='center', va='center', linespacing=1.5)
    
    # Total amount (big number)
    total_str = 'HKD {:,.0f}'.format(s['total_hkd'])
    ax.text(x + card_w/2, card_y + card_h/2 - 0.45, total_str,
            fontsize=23, fontweight='bold', color=WHITE, ha='center', va='center')
    
    # Annualized return
    ax.text(x + card_w/2, card_y + card_h/2 - 1.0,
            '年化回報 {:.2f}%'.format(s['ann']),
            fontsize=14, fontweight='bold', color=c, ha='center', va='center')
    
    # Total ROI
    ax.text(x + card_w/2, card_y + card_h/2 - 1.45,
            '10年總回報 +{:.1f}%'.format(s['roi']),
            fontsize=11, color='#AAAAAA', ha='center', va='center')
    
    # Bottom note
    ax.text(x + card_w/2, card_y + 0.4,
            '240萬投入，10年後 {:,.0f}萬'.format(s['total_hkd']/10000),
            fontsize=9.5, color=GREY, ha='center', va='center')

# ── Bottom disclaimer ──
ax.text(7, 0.25,
        'PZC Group 百盛大通 ｜ MCLUB FX Risk Modeling Service ｜ '
        '房價預測基於2025-2026市場數據及業界CAGR 2.74% ｜ 本資料僅供參考分析',
        fontsize=7.5, color='#444444', ha='center', va='center')

plt.tight_layout(pad=0.3)
plt.savefig('{}/ten_year_3scenarios.png'.format(OUT), dpi=200, bbox_inches='tight',
            facecolor=DARK_BG, edgecolor='none')
plt.close()

print("OK ten_year_3scenarios.png")
for s in scenarios_data:
    print("{}: HKD {:,.0f} (年化 {:.2f}%, ROI +{:.1f}%, 房價{:+.1f}%)".format(
        s['label'], s['total_hkd'], s['ann'], s['roi'], s['prop_change_pct']))