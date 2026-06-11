# -*- coding: utf-8 -*-
"""
PZC Group — JPY Property 3-Scenario Comparison Card
Matching the style of the uploaded reference image
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
CONSERVATIVE = '#F39C12'   # orange
LIKELY      = '#2ECC71'   # green
OPTIMISTIC  = '#1E8449'   # dark green
WHITE  = '#FFFFFF'
GREY   = '#888888'
GOLD   = '#C9A84C'

# ── Data (10-year holding) ──
# Conservative: worst stress test (崩盤-22% + JPY貶31%) = 1.29% annualized
# Most Likely: base (持平0% + 基準匯率) = 6.39% annualized  
# Optimistic: best (增長+48% + JPY升+25%) = 13.47% annualized

invested = 2_400_000
ann_cons = 1.29
ann_likely = 6.39
ann_opt = 13.47

total_cons = invested * (1 + ann_cons/100)**10
total_likely = invested * (1 + ann_likely/100)**10
total_opt = invested * (1 + ann_opt/100)**10

roi_cons = (total_cons - invested) / invested * 100
roi_likely = (total_likely - invested) / invested * 100
roi_opt = (total_opt - invested) / invested * 100

scenarios = [
    {
        'label': '保守',
        'subtitle': '年化回報率 1.29%\n(房價跌22% + JPY貶31%)',
        'total': total_cons,
        'roi': roi_cons,
        'note': '240萬投入 → 10年後 {:,.0f}萬'.format(total_cons/10000),
        'color': CONSERVATIVE,
        'ann_display': '1.29%',
    },
    {
        'label': '最可能',
        'subtitle': '年化回報率 6.39%\n(房價持平 + 基準匯率)',
        'total': total_likely,
        'roi': roi_likely,
        'note': '240萬投入 → 10年後 {:,.0f}萬'.format(total_likely/10000),
        'color': LIKELY,
        'ann_display': '6.39%',
    },
    {
        'label': '樂觀',
        'subtitle': '年化回報率 13.47%\n(房價漲48% + JPY升25%)',
        'total': total_opt,
        'roi': roi_opt,
        'note': '240萬投入 → 10年後 {:,.0f}萬'.format(total_opt/10000),
        'color': OPTIMISTIC,
        'ann_display': '13.47%',
    },
]

fig, ax = plt.subplots(figsize=(14, 7))
fig.patch.set_facecolor(DARK_BG)
ax.set_facecolor(DARK_BG)
ax.set_xlim(0, 14)
ax.set_ylim(0, 7)
ax.axis('off')

# ── Title ──
ax.text(7, 6.5, '10年後你有幾多錢？', fontsize=28, fontweight='bold',
        color=WHITE, ha='center', va='center', fontfamily='Sarasa Mono SC')
ax.text(7, 6.05, '日本物業投資 HKD 2,400,000 | 40% LTV @ 3% | 6%租金回報 | 10年持倉期',
        fontsize=11, color=GREY, ha='center', va='center', fontfamily='Sarasa Mono SC')

# ── 3 Cards ──
card_w = 3.8
card_h = 4.5
card_y = 0.8
gap = 0.55
start_x = (14 - 3*card_w - 2*gap) / 2

for i, s in enumerate(scenarios):
    x = start_x + i * (card_w + gap)
    c = s['color']
    
    # Card background
    card = patches.FancyBboxPatch((x, card_y), card_w, card_h,
                                   boxstyle="round,pad=0.15",
                                   facecolor=CARD_BG, edgecolor=c,
                                   linewidth=2.5)
    ax.add_patch(card)
    
    # Strategy label (colored bar at top)
    label_bar = patches.FancyBboxPatch((x + 0.3, card_y + card_h - 0.7), card_w - 0.6, 0.5,
                                        boxstyle="round,pad=0.08",
                                        facecolor=c, edgecolor='none', alpha=0.9)
    ax.add_patch(label_bar)
    ax.text(x + card_w/2, card_y + card_h - 0.45, s['label'],
            fontsize=16, fontweight='bold', color=WHITE, ha='center', va='center')
    
    # Subtitle (scenario description)
    ax.text(x + card_w/2, card_y + card_h - 1.1, s['subtitle'],
            fontsize=9, color=GREY, ha='center', va='center', linespacing=1.4)
    
    # Total amount (big number)
    total_str = 'HKD {:,.0f}'.format(s['total'])
    ax.text(x + card_w/2, card_y + card_h/2 - 0.2, total_str,
            fontsize=22, fontweight='bold', color=WHITE, ha='center', va='center')
    
    # Annualized return
    ax.text(x + card_w/2, card_y + card_h/2 - 0.7, '年化回報 {}'.format(s['ann_display']),
            fontsize=13, fontweight='bold', color=c, ha='center', va='center')
    
    # ROI
    ax.text(x + card_w/2, card_y + card_h/2 - 1.15, '10年總回報 +{:.1f}%'.format(s['roi']),
            fontsize=11, color='#AAAAAA', ha='center', va='center')
    
    # Bottom note
    ax.text(x + card_w/2, card_y + 0.45, s['note'],
            fontsize=9.5, color=GREY, ha='center', va='center')

# ── Bottom disclaimer ──
ax.text(7, 0.3, 'PZC Group 百盛大通 | MCLUB FX Risk Modeling Service | 基於84個壓力測試情景分析，0個蝕本情景 | 本資料僅供參考分析',
        fontsize=8, color='#555555', ha='center', va='center')

plt.tight_layout(pad=0.5)
plt.savefig('{}/ten_year_3scenarios.png'.format(OUT), dpi=200, bbox_inches='tight',
            facecolor=DARK_BG, edgecolor='none')
plt.close()

print("OK ten_year_3scenarios.png")
print(f"Conservative: HKD {total_cons:,.0f} (年化 {ann_cons}%)")
print(f"Most Likely:  HKD {total_likely:,.0f} (年化 {ann_likely}%)")
print(f"Optimistic:   HKD {total_opt:,.0f} (年化 {ann_opt}%)")