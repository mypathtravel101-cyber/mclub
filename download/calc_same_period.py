import json

with open('/home/z/my-project/download/scenario_data.json') as f:
    data = json.load(f)

PM = data['params']
ENTRY_FX = PM['entry_fx']
PRICE = PM['price_jpy']
LOAN = PM['loan_jpy']
EQ_JPY = PM['eq_jpy']
EQ_HKD = PM['eq_hkd']
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

usd_jpy = {1995:93.97,1996:108.78,1997:120.99,1998:130.91,1999:113.73,2000:107.77,2001:121.53,2002:125.22,2003:115.94,2004:108.15,2005:110.11,2006:116.35,2007:117.76,2008:103.39,2009:93.68,2010:87.78,2011:79.70,2012:79.82,2013:97.56,2014:105.74,2015:120.95,2016:108.72,2017:112.16,2018:110.44,2019:108.84,2020:106.76,2021:109.84,2022:131.50,2023:140.94,2024:151.48,2025:149.67}
prop_idx = {1995:145.0,1996:138.0,1997:130.0,1998:120.0,1999:112.0,2000:105.0,2001:98.0,2002:93.0,2003:89.0,2004:87.0,2005:87.0,2006:88.0,2007:88.0,2008:86.0,2009:84.0,2010:84.0,2011:82.0,2012:83.0,2013:86.0,2014:90.0,2015:100.0,2016:103.0,2017:107.0,2018:110.0,2019:112.0,2020:110.0,2021:113.0,2022:117.0,2023:122.0,2024:130.0,2025:136.0}
years = list(range(1995, 2026))
jpy_hkd = [usd_jpy[y]*7.80 for y in years]
pvals = [prop_idx[y] for y in years]
fx_10yr = [(jpy_hkd[i+10]-jpy_hkd[i])/jpy_hkd[i]*100 for i in range(16)]
pr_10yr = [(pvals[i+10]-pvals[i])/pvals[i]*100 for i in range(16)]

print("Period        FX_Chg%    Prop_Chg%    ROI%      HKD_wan")
results = []
for i in range(16):
    fx_pct = fx_10yr[i]
    pr_pct = pr_10yr[i]
    efx = ENTRY_FX*(1+fx_pct/100)
    pa2 = (1+pr_pct/100)**(1/10)-1
    ev = PRICE*(1+pa2)**10
    bl = lb(10)
    ne = ev - bl
    ar2 = CF*10
    tj = ne + ar2
    th = tj/efx
    roi = (th-EQ_HKD)/EQ_HKD*100
    gain = th - EQ_HKD
    results.append((years[i], fx_pct, pr_pct, roi, gain))
    end_yr = years[i]+10
    period = str(years[i]) + "-" + str(end_yr)
    print("%-14s %+9.1f  %+9.1f  %+8.1f  %+9.1f" % (period, fx_pct, pr_pct, roi, gain/1e4))

results_sorted = sorted(results, key=lambda x: x[3])
w = results_sorted[0]
b = results_sorted[-1]
avg_roi = sum(r[3] for r in results)/len(results)
avg_gain = sum(r[4] for r in results)/len(results)
print("\nSame-period worst: %d-%d, FX=%+.1f%%, Prop=%+.1f%%, ROI=%+.1f%%, HKD=%+.1fwan" % (w[0], w[0]+10, w[1], w[2], w[3], w[4]/1e4))
print("Same-period best:  %d-%d, FX=%+.1f%%, Prop=%+.1f%%, ROI=%+.1f%%, HKD=%+.1fwan" % (b[0], b[0]+10, b[1], b[2], b[3], b[4]/1e4))
print("Average: ROI=%+.1f%%, HKD=%+.1fwan" % (avg_roi, avg_gain/1e4))