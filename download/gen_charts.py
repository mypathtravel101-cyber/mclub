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

# ── Historical Data ──
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
    2005:87.0,  2006:88.0,  2007:88.0,  2008:86.0,  2009:84.0,
    2010:84.0,  2011:82.0,  2012:83.0,  2013:86.0,  2014:90.0,
    2015:100.0, 2016:103.0, 2017:107.0, 2018:110.0, 2019:112.0,
    2020:110.0, 2021:113.0, 2022:117.0, 2023:122.0, 2024:130.0,
    2025:136.0
}
years = list(range(1995, 2026))
jpy_hkd = [usd_jpy[y]*7.80 for y in years]
pvals = [prop_idx[y] for y in years]

# 10-year rolling returns
fx_10yr = [(jpy_hkd[i+10]-jpy_hkd[i])/jpy_hkd[i]*100 for i in range(len(years)-10)]
pr_10yr = [(pvals[i+10]-pvals[i])/pvals[i]*100 for i in range(len(years)-10)]
yr_10_start = [years[i] for i in range(len(years)-10)]

# CRITICAL: For HKD investor, JPY/HKD going UP = JPY weakens = BAD
# So worst FX = max(fx_10yr) = JPY weakened most
# Best FX = min(fx_10yr) = JPY strengthened most
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

print(f"FX 10yr Worst (for investor): {fx_w_yr}-{fx_w_yr+10}: {fx_w_val:.1f}% (JPY weakened)")
print(f"FX 10yr Best (for investor): {fx_b_yr}-{fx_b_yr+10}: {fx_b_val:.1f}% (JPY strengthened)")
print(f"FX 10yr Average: {fx_a_val:.1f}%")
print(f"Prop 10yr Worst: {pr_w_yr}-{pr_w_yr+10}: {pr_w_val:.1f}%")
print(f"Prop 10yr Best: {pr_b_yr}-{pr_b_yr+10}: {pr_b_val:.1f}%")
print(f"Prop 10yr Average: {pr_a_val:.1f}%")

# ── Chart 1: Dual-axis History ──
fig, ax1 = plt.subplots(figsize=(10, 4.2))
c1, c2 = '#207591', '#82713e'
ax1.plot(years, jpy_hkd, color=c1, lw=2, label='JPY/HKD')
ax1.set_ylabel('JPY/HKD', color=c1, fontsize=10)
ax1.tick_params(axis='y', labelcolor=c1)
ax1.set_ylim(550, 1250)
ax2 = ax1.twinx()
ax2.plot(years, pvals, color=c2, lw=2, ls='--', label='Property Index (2015=100)')
ax2.set_ylabel('Property Index', color=c2, fontsize=10)
ax2.tick_params(axis='y', labelcolor=c2)
ax2.set_ylim(70, 170)
h1, l1 = ax1.get_legend_handles_labels()
h2, l2 = ax2.get_legend_handles_labels()
ax1.legend(h1+h2, l1+l2, loc='upper left', fontsize=9)
ax1.set_title('30-Year Trend: JPY/HKD vs Japan Residential Property Price', fontsize=11, fontweight='bold', pad=12)
ax1.grid(True, alpha=0.3, ls='--')
ax1.set_xlim(1995, 2025)
plt.tight_layout()
plt.savefig(f'{OUT}/chart_history.png', dpi=200, bbox_inches='tight', facecolor='white')
plt.close()
print("Chart 1 done")

# ── Model parameters ──
ENTRY_FX = 19.5
PRICE = 78_000_000
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

print(f"\nModel: Price={PRICE/1e6:.0f}M, Loan={LOAN/1e6:.1f}M, Equity_JPY={EQ_JPY/1e6:.1f}M, Equity_HKD={EQ_HKD/1e6:.2f}M")
print(f"Rental={AR/1e6:.2f}M, Costs={AC/1e6:.3f}M, Mortgage/yr={AM/1e6:.2f}M, Net CF/yr={CF/1e6:.2f}M")

def lb(t):
    ct = (1+MR)**(t*12)
    return LOAN * (CN - ct) / (CN - 1)

FXS = [13.0, 15.0, 17.0, 19.5, 22.0, 25.0, 28.0]
FXL = ['13.0 (JPY+33%)', '15.0 (JPY+23%)', '17.0 (JPY+13%)', '19.5 (Current)', '22.0 (JPY-13%)', '25.0 (JPY-28%)', '28.0 (JPY-44%)']
PAS = [-0.03, -0.01, 0.01, 0.03]
PAL = ['-3%/year', '-1%/year', '+1%/year', '+3%/year']
HS = [5, 7, 10]

# Compute 84 scenarios
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

# Print sample to verify
for s in scens:
    if s['fx']==19.5 and s['pa']==0.01 and s['t']==10:
        print(f"Sample: FX=19.5, Prop=+1%/yr, 10yr => Exit={s['ev']/1e6:.1f}M, Loan={s['bl']/1e6:.1f}M, Net={s['ne']/1e6:.1f}M, Rental={s['ar']/1e6:.1f}M, Total={s['th']/1e6:.2f}M HKD, ROI={s['roi']:.1f}%")

# ── Chart 2: Heatmap 10yr ──
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
ax.set_yticklabels(PAL, fontsize=9)
ax.set_xlabel('Exit JPY/HKD Rate', fontsize=10)
ax.set_ylabel('Property Price Change', fontsize=10)
ax.set_title('84-Scenario ROI Heatmap (10-Year Holding, % Return on Equity)', fontsize=11, fontweight='bold', pad=10)
for i in range(4):
    for j in range(7):
        v = mat[i][j]
        c = 'white' if abs(v)>50 or v<0 else 'black'
        ax.text(j, i, f'{v:.0f}%', ha='center', va='center', fontsize=9, color=c, fontweight='bold')
plt.colorbar(im, ax=ax, label='ROI (%)', shrink=0.8)
plt.tight_layout()
plt.savefig(f'{OUT}/chart_heatmap.png', dpi=200, bbox_inches='tight', facecolor='white')
plt.close()
print("Chart 2 done")

# ── Historical scenario summary ──
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

print(f"\nHistorical 10yr Scenarios:")
print(f"  WORST:  FX {fx_w_val:.1f}% ({fx_w_yr}-{fx_w_yr+10}) + Prop {pr_w_val:.1f}% ({pr_w_yr}-{pr_w_yr+10}) => ROI {hw['roi']:.1f}%, Gain HKD {hw['gain']/1e6:.2f}M")
print(f"  AVERAGE: FX {fx_a_val:.1f}% + Prop {pr_a_val:.1f}% => ROI {ha['roi']:.1f}%, Gain HKD {ha['gain']/1e6:.2f}M")
print(f"  BEST:   FX {fx_b_val:.1f}% ({fx_b_yr}-{fx_b_yr+10}) + Prop {pr_b_val:.1f}% ({pr_b_yr}-{pr_b_yr+10}) => ROI {hb['roi']:.1f}%, Gain HKD {hb['gain']/1e6:.2f}M")

# Save all data
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
    'hist':{
        'worst':{k:round(v,2) for k,v in hw.items()},
        'avg':{k:round(v,2) for k,v in ha.items()},
        'best':{k:round(v,2) for k,v in hb.items()},
    },
    'scenarios':[{k:round(v,2) if isinstance(v,float) else v for k,v in s.items()} for s in scens],
    'loan_bal':{t:round(lb(t),0) for t in HS},
}
with open(f'{OUT}/scenario_data.json','w') as f:
    json.dump(out, f, indent=2)
print("\nAll data saved.")
