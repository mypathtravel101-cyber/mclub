# -*- coding: utf-8 -*-
import os, json, math
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.font_manager as fm
import numpy as np

fm.fontManager.addfont('/usr/share/fonts/truetype/wqy/wqy-zenhei.ttc')
fm.fontManager.addfont('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf')
plt.rcParams['font.sans-serif'] = ['WenQuanYi Zen Hei', 'DejaVu Sans']
plt.rcParams['axes.unicode_minus'] = False

OUT = '/home/z/my-project/download'

# Historical Data
usd_jpy = {
    1995:93.97, 1996:108.78, 1997:120.99, 1998:130.91, 1999:113.73,
    2000:107.77, 2001:121.53, 2002:125.22, 2003:115.94, 2004:108.15,
    2005:110.11, 2006:116.35, 2007:117.76, 2008:103.39, 2009:93.68,
    2010:87.78,  2011:79.70,  2012:79.82,  2013:97.56,  2014:105.74,
    2015:120.95, 2016:108.72, 2017:112.16, 2018:110.44, 2019:108.84,
    2020:106.76, 2021:109.84, 2022:131.50, 2023:140.94, 2024:151.48,
    2025:149.67
}
prop_idx = {
    1995:145.0, 1996:138.0, 1997:130.0, 1998:120.0, 1999:112.0,
    2000:105.0, 2001:98.0,  2002:93.0,  2003:89.0,  2004:87.0,
    2005:87.0, 2006:88.0, 2007:88.0, 2008:86.0, 2009:84.0,
    2010:84.0, 2011:82.0, 2012:83.0, 2013:86.0, 2014:90.0,
    2015:100.0, 2016:103.0, 2017:107.0, 2018:110.0, 2019:112.0,
    2020:110.0, 2021:113.0, 2022:117.0, 2023:122.0, 2024:130.0,
    2025:136.0
}
years = list(range(1995, 2026))
jpy_hkd = [usd_jpy[y]*7.80 for y in years]
pvals = [prop_idx[y] for y in years]

fx_10yr = [(jpy_hkd[i+10]-jpy_hkd[i])/jpy_hkd[i]*100 for i in range(len(years)-10)]
pr_10yr = [(pvals[i+10]-pvals[i])/pvals[i]*100 for i in range(len(years)-10)]
yr_10_start = [years[i] for i in range(len(years)-10)]

idx_fx_worst = max(range(len(fx_10yr)), key=lambda i: fx_10yr[i])
idx_fx_best = min(range(len(fx_10yr)), key=lambda i: fx_10yr[i])
idx_pr_worst = min(range(len(pr_10yr)), key=lambda i: pr_10yr[i])
idx_pr_best = max(range(len(pr_10yr)), key=lambda i: pr_10yr[i])

fx_w_val = fx_10yr[idx_fx_worst]; fx_w_yr = yr_10_start[idx_fx_worst]
fx_b_val = fx_10yr[idx_fx_best]; fx_b_yr = yr_10_start[idx_fx_best]
fx_a_val = sum(fx_10yr)/len(fx_10yr)
pr_w_val = pr_10yr[idx_pr_worst]; pr_w_yr = yr_10_start[idx_pr_worst]
pr_b_val = pr_10yr[idx_pr_best]; pr_b_yr = yr_10_start[idx_pr_best]
pr_a_val = sum(pr_10yr)/len(pr_10yr)

# Chart 1: 30-year dual-axis
fig, ax1 = plt.subplots(figsize=(10, 4.2))
c1, c2 = '#1f7692', '#8b7a3a'
ax1.plot(years, jpy_hkd, color=c1, lw=2, label='JPY/HKD')
ax1.set_ylabel('JPY/HKD', color=c1, fontsize=10)
ax1.tick_params(axis='y', labelcolor=c1)
ax1.set_ylim(550, 1250)
ax2 = ax1.twinx()
ax2.plot(years, pvals, color=c2, lw=2, ls='--', label='日本住宅物業指數 (2015=100)')
ax2.set_ylabel('物業指數', color=c2, fontsize=10)
ax2.tick_params(axis='y', labelcolor=c2)
ax2.set_ylim(70, 170)
h1, l1 = ax1.get_legend_handles_labels()
h2, l2 = ax2.get_legend_handles_labels()
ax1.legend(h1+h2, l1+l2, loc='upper left', fontsize=9)
ax1.set_title('30年趨勢：JPY/HKD 匯率 vs 日本住宅物業價格', fontsize=11, fontweight='bold', pad=12)
ax1.grid(True, alpha=0.3, ls='--')
ax1.set_xlim(1995, 2025)
plt.tight_layout()
plt.savefig(f'{OUT}/chart_history.png', dpi=200, bbox_inches='tight', facecolor='white')
plt.close()

# Model params: HKD 3.2M
ENTRY_FX = 19.5
PRICE = 62_400_000  # HKD 3.2M * 19.5
LTV = 0.40
LOAN = PRICE * LTV
EQ_JPY = PRICE - LOAN
EQ_HKD = EQ_JPY / ENTRY_FX
MR = 0.03/12; NM = 180
MP = LOAN * MR * (1+MR)**NM / ((1+MR)**NM - 1)
AM = MP * 12
AR = PRICE * 0.06
AC = PRICE * 0.003
ANR = AR - AC
CF = ANR - AM
CN = (1+MR)**NM

def lb(t):
    ct = (1+MR)**(t*12)
    return LOAN * (CN - ct) / (CN - 1)

FXS = [13.0, 15.0, 17.0, 19.5, 22.0, 25.0, 28.0]
PAS = [-0.03, -0.01, 0.01, 0.03]
HS = [5, 7, 10]

scens = []
for fx in FXS:
    for pa in PAS:
        for t in HS:
            ev = PRICE * (1+pa)**t
            bl = lb(t)
            ne = ev - bl
            ar2 = CF * t
            tj = ne + ar2
            th = tj / fx
            roi = (th - EQ_HKD)/EQ_HKD*100
            scens.append({'fx':fx,'pa':pa,'t':t,'ev':ev,'bl':bl,'ne':ne,'ar':ar2,'tj':tj,'th':th,'roi':roi,'gain':th-EQ_HKD})

# Heatmap 10yr
t10 = [s for s in scens if s['t']==10]
mat = np.zeros((4,7))
for s in t10:
    mat[PAS.index(s['pa'])][FXS.index(s['fx'])] = s['roi']

fig, ax = plt.subplots(figsize=(10, 3.8))
norm = plt.Normalize(vmin=min(mat.min(), -20), vmax=mat.max())
im = ax.imshow(mat, cmap='RdYlGn', norm=norm, aspect='auto')
ax.set_xticks(range(7))
ax.set_xticklabels([f'{f:.1f}' for f in FXS], fontsize=9)
ax.set_yticks(range(4))
ax.set_yticklabels([f'{r*100:+.0f}%/年' for r in PAS], fontsize=9)
ax.set_xlabel('退出時 JPY/HKD 匯率', fontsize=10)
ax.set_ylabel('物業價格年變動', fontsize=10)
ax.set_title('投資回報率熱力圖（持有10年，股本回報率%）', fontsize=11, fontweight='bold', pad=10)
for i in range(4):
    for j in range(7):
        v = mat[i][j]
        c = 'white' if abs(v)>50 or v<0 else 'black'
        ax.text(j, i, f'{v:.0f}%', ha='center', va='center', fontsize=9, color=c, fontweight='bold')
plt.colorbar(im, ax=ax, label='回報率 (%)', shrink=0.8)
plt.tight_layout()
plt.savefig(f'{OUT}/chart_heatmap.png', dpi=200, bbox_inches='tight', facecolor='white')
plt.close()

# Chart 3: Historical 3-scenario summary
def hist_sc(fx_pct, pr_pct, t=10):
    efx = ENTRY_FX*(1+fx_pct/100)
    pa2 = (1+pr_pct/100)**(1/t)-1
    ev = PRICE*(1+pa2)**t
    bl = lb(t)
    ne = ev - bl
    ar2 = CF*t
    tj = ne + ar2
    th = tj/efx
    roi = (th-EQ_HKD)/EQ_HKD*100
    return {'fx_pct':fx_pct,'pr_pct':pr_pct,'efx':efx,'ev':ev,'bl':bl,'ne':ne,'ar':ar2,'tj':tj,'th':th,'roi':roi,'gain':th-EQ_HKD}

hw = hist_sc(fx_w_val, pr_w_val)
ha = hist_sc(fx_a_val, pr_a_val)
hb = hist_sc(fx_b_val, pr_b_val)

fig, axes = plt.subplots(1, 2, figsize=(10, 4), gridspec_kw={'width_ratios': [1, 1.2]})

# Left: 30-year change bars
categories = ['JPY/HKD\n10年變動', '物業價格\n10年變動']
worst_vals = [fx_w_val, pr_w_val]
avg_vals = [fx_a_val, pr_a_val]
best_vals = [fx_b_val, pr_b_val]
x = np.arange(len(categories))
w = 0.25
bars1 = axes[0].bar(x - w, worst_vals, w, label='最差10年', color='#904c46', alpha=0.85)
bars2 = axes[0].bar(x, avg_vals, w, label='平均10年', color='#a5884e', alpha=0.85)
bars3 = axes[0].bar(x + w, best_vals, w, label='最佳10年', color='#3b8754', alpha=0.85)
axes[0].set_xticks(x)
axes[0].set_xticklabels(categories, fontsize=8.5)
axes[0].set_ylabel('10年變動 (%)', fontsize=9)
axes[0].set_title('歷史10年實際變動幅度', fontsize=10, fontweight='bold')
axes[0].axhline(y=0, color='gray', lw=0.5)
axes[0].legend(loc='best', fontsize=8)
axes[0].grid(axis='y', alpha=0.3, ls='--')
for bars in [bars1, bars2, bars3]:
    for bar in bars:
        h = bar.get_height()
        axes[0].text(bar.get_x() + bar.get_width()/2, h + (1 if h >= 0 else -3),
                    f'{h:+.1f}%', ha='center', va='bottom' if h >= 0 else 'top', fontsize=7.5)

# Right: Investment ROI outcomes
scenarios = ['最差情景', '平均情景', '最佳情景']
roi_vals = [hw['roi'], ha['roi'], hb['roi']]
gain_vals = [hw['gain']/1e4, ha['gain']/1e4, hb['gain']/1e4]
bar_colors = ['#904c46', '#a5884e', '#3b8754']
bars = axes[1].bar(scenarios, roi_vals, color=bar_colors, alpha=0.85, width=0.55)
axes[1].set_ylabel('回報率 (%)', fontsize=9)
axes[1].set_title('您的投資回報（10年，基於歷史數據）', fontsize=10, fontweight='bold')
axes[1].axhline(y=0, color='gray', lw=0.5)
axes[1].grid(axis='y', alpha=0.3, ls='--')
for bar, roi, gain in zip(bars, roi_vals, gain_vals):
    h = bar.get_height()
    sign = '+' if gain >= 0 else ''
    axes[1].text(bar.get_x() + bar.get_width()/2, h + (3 if h >= 0 else -8),
                f'{roi:+.1f}%\n{sign}HKD {gain:.0f}萬',
                ha='center', va='bottom' if h >= 0 else 'top', fontsize=8, fontweight='bold')

plt.tight_layout()
plt.savefig(f'{OUT}/chart_summary.png', dpi=200, bbox_inches='tight', facecolor='white')
plt.close()
print("Summary chart saved")

# Chart 4: Cashflow breakdown bar chart
fig, ax = plt.subplots(figsize=(6, 3.5))
cf_items = ['毛租金收入', '稅+保險', '按揭供款', '淨現金流']
cf_vals = [AR/1e4, -AC/1e4, -AM/1e4, CF/1e4]
cf_colors = ['#3b8754', '#904c46', '#904c46', '#1f7692']
bars = ax.barh(cf_items, cf_vals, color=cf_colors, alpha=0.85, height=0.5)
ax.set_xlabel('金額（萬日元/年）', fontsize=9)
ax.set_title('年度現金流結構', fontsize=10, fontweight='bold')
ax.axvline(x=0, color='gray', lw=0.5)
ax.grid(axis='x', alpha=0.3, ls='--')
for bar, val in zip(bars, cf_vals):
    sign = '+' if val >= 0 else ''
    ax.text(val + (1 if val >= 0 else -1), bar.get_y() + bar.get_height()/2,
            f'{sign}{val:.1f}萬', ha='left' if val >= 0 else 'right', va='center', fontsize=8)
plt.tight_layout()
plt.savefig(f'{OUT}/chart_cashflow.png', dpi=200, bbox_inches='tight', facecolor='white')
plt.close()
print("Cashflow chart saved")

# Save data
out = {
    'params':{
        'entry_fx':ENTRY_FX,'price_jpy':PRICE,'ltv':LTV,'loan_jpy':LOAN,'eq_jpy':EQ_JPY,'eq_hkd':EQ_HKD,
        'monthly_payment':MP,'annual_mortgage':AM,'annual_rental':AR,'annual_costs':AC,
        'annual_net_rental':ANR,'annual_cashflow':CF,
        'fx_30yr_pct':(jpy_hkd[-1]-jpy_hkd[0])/jpy_hkd[0]*100,
        'pr_30yr_pct':(pvals[-1]-pvals[0])/pvals[0]*100,
        'fx_worst10':fx_w_val,'fx_worst10_yr':f"{fx_w_yr}-{fx_w_yr+10}",
        'fx_best10':fx_b_val,'fx_best10_yr':f"{fx_b_yr}-{fx_b_yr+10}",
        'fx_avg10':fx_a_val,
        'pr_worst10':pr_w_val,'pr_worst10_yr':f"{pr_w_yr}-{pr_w_yr+10}",
        'pr_best10':pr_b_val,'pr_best10_yr':f"{pr_b_yr}-{pr_b_yr+10}",
        'pr_avg10':pr_a_val,
    },
    'hist':{'worst':{k:round(v,2) if isinstance(v,float) else v for k,v in hw.items()},'avg':{k:round(v,2) if isinstance(v,float) else v for k,v in ha.items()},'best':{k:round(v,2) if isinstance(v,float) else v for k,v in hb.items()}},
    'scenarios':[{k:round(v,2) if isinstance(v,float) else v for k,v in s.items()} for s in scens],
    'loan_bal':{t:round(lb(t),0) for t in HS},
}
with open(f'{OUT}/scenario_data.json','w') as f:
    json.dump(out, f, indent=2)

print(f"EQ_HKD={EQ_HKD:,.0f} ({EQ_HKD/1e4:.2f}M), CF/yr={CF/1e4:.1f} wan JPY")
print(f"Hist: Worst={hw['roi']:+.1f}%, Avg={ha['roi']:+.1f}%, Best={hb['roi']:+.1f}%")
print(f"Hist HKD: Worst={hw['gain']/1e4:+.0f} wan, Avg={ha['gain']/1e4:+.0f} wan, Best={hb['gain']/1e4:+.0f} wan")