# -*- coding: utf-8 -*-
"""
PZC Group - Japan Property Investment Risk Model V2
Chart Generation
"""
import json, math, os, sys
import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.font_manager as fm
from matplotlib.patches import FancyBboxPatch
import matplotlib.colors as mcolors
from pathlib import Path

OUT_DIR = Path("/home/z/my-project/download/risk_model_v2")
OUT_DIR.mkdir(exist_ok=True)

fm.fontManager.addfont('/usr/share/fonts/truetype/chinese/SarasaMonoSC-Regular.ttf')
fm.fontManager.addfont('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf')
plt.rcParams['font.sans-serif'] = ['Sarasa Mono SC', 'DejaVu Sans']
plt.rcParams['axes.unicode_minus'] = False

C_ACCENT = '#5d3ac7'
C_DARK = '#242321'
C_MUTED = '#78746d'
C_SURFACE = '#e4e1dd'
C_BG = '#eeece9'
C_WHITE = '#ffffff'
C_GOLD = '#C9A84C'
C_BLUE = '#1E3A5F'
C_GREEN = '#2d8a4e'
C_RED = '#c0392b'
C_ORANGE = '#e67e22'

# ── Core Model ──
PROP_JPY = 78_000_000
FX_BASE = 19.5
PROP_HKD = PROP_JPY / FX_BASE
LTV = 0.40
RATE = 0.03
MTG_YEARS = 15
HOLD_YEARS = 10
RENT_GROSS_YIELD = 0.06
MGMT_TAX_PCT = 0.025

DOWN_JPY = PROP_JPY * (1 - LTV)
DOWN_HKD = DOWN_JPY / FX_BASE
LOAN_JPY = PROP_JPY * LTV
LOAN_HKD = LOAN_JPY / FX_BASE

mr = RATE / 12
n = MTG_YEARS * 12
MPMT_JPY = LOAN_JPY * mr * (1+mr)**n / ((1+mr)**n - 1)
BAL_JPY = LOAN_JPY * ((1+mr)**n - (1+mr)**(HOLD_YEARS*12)) / ((1+mr)**n - 1)

GROSS_RENT_ANNUAL_JPY = PROP_JPY * RENT_GROSS_YIELD
NET_RENT_ANNUAL_JPY = GROSS_RENT_ANNUAL_JPY * (1 - MGMT_TAX_PCT)

FX_SCENARIOS = [
    {"label": "JPY +20%\n(15.6)", "rate": 15.6, "short": "JPY+20%"},
    {"label": "JPY 0%\n(19.5)", "rate": 19.5, "short": "JPY 0%"},
    {"label": "JPY -20%\n(23.4)", "rate": 23.4, "short": "JPY-20%"},
]
PRICE_SCENARIOS = [
    {"label": "-1.5%/yr\n(-13.9%)", "annual": -0.015, "total": (1-0.015)**10 - 1, "short": "-13.9%"},
    {"label": "0%/yr\n(0%)", "annual": 0.0, "total": 0.0, "short": "0%"},
    {"label": "+2.5%/yr\n(+28.0%)", "annual": 0.025, "total": (1.025)**10 - 1, "short": "+28.0%"},
]

def calc_return(fx_exit, price_total_chg):
    exit_prop_jpy = PROP_JPY * (1 + price_total_chg)
    net_exit_jpy = exit_prop_jpy - BAL_JPY
    net_exit_hkd = net_exit_jpy / fx_exit
    cum_rent_jpy = NET_RENT_ANNUAL_JPY * HOLD_YEARS
    cum_rent_hkd = cum_rent_jpy / fx_exit
    total_return_hkd = net_exit_hkd + cum_rent_hkd
    roi_pct = (total_return_hkd / DOWN_HKD - 1) * 100
    annualized = (1 + total_return_hkd / DOWN_HKD) ** (1/HOLD_YEARS) - 1
    return {"exit_prop_hkd": exit_prop_jpy / fx_exit, "net_exit_hkd": net_exit_hkd,
            "cum_rent_hkd": cum_rent_hkd, "total_return_hkd": total_return_hkd,
            "roi_pct": roi_pct, "annualized": annualized * 100}

matrix = []
for pi, ps in enumerate(PRICE_SCENARIOS):
    row = []
    for fi, fs in enumerate(FX_SCENARIOS):
        r = calc_return(fs["rate"], ps["total"])
        row.append(r)
    matrix.append(row)

# ═══════ CHART 1: Heatmap ═══════
def draw_heatmap():
    data = np.array([[matrix[r][c]["annualized"] for c in range(3)] for r in range(3)])
    fig, ax = plt.subplots(figsize=(7, 4.2))
    cmap = matplotlib.colors.LinearSegmentedColormap.from_list('c', ['#e8d5f5','#b388d9','#5d3ac7','#3a2175'], N=256)
    im = ax.imshow(data, cmap=cmap, aspect='auto', vmin=0, vmax=data.max())
    fx_labels = [f"JPY {s['short']}" for s in FX_SCENARIOS]
    pr_labels = [f"{s['short']}" for s in PRICE_SCENARIOS]
    ax.set_xticks(range(3)); ax.set_xticklabels(fx_labels, fontsize=9, fontweight='bold')
    ax.set_yticks(range(3)); ax.set_yticklabels(pr_labels, fontsize=9, fontweight='bold')
    ax.set_xlabel("FX Rate (Exit)", fontsize=10, fontweight='bold', labelpad=8)
    ax.set_ylabel("Property Value Change (10Y)", fontsize=10, fontweight='bold', labelpad=8)
    for r in range(3):
        for c in range(3):
            val = data[r, c]
            txt_color = 'white' if val > 7 else C_DARK
            ax.text(c, r, f"{val:.1f}%", ha='center', va='center', fontsize=14, fontweight='bold', color=txt_color)
    ax.set_title("9-Scenario Return Matrix (Annualized IRR)", fontsize=12, fontweight='bold', pad=12, color=C_DARK)
    cbar = plt.colorbar(im, ax=ax, shrink=0.8, pad=0.02)
    cbar.set_label("Annualized Return %", fontsize=9)
    plt.tight_layout()
    p = OUT_DIR / "chart_heatmap_3x3.png"
    fig.savefig(p, dpi=200, bbox_inches='tight', facecolor='white')
    plt.close()
    return str(p)

# ═══════ CHART 2: Cashflow ═══════
def draw_cashflow():
    months = np.arange(1, 121)
    monthly_rent_jpy = GROSS_RENT_ANNUAL_JPY / 12 * (1 - MGMT_TAX_PCT)
    cum = 0; cumulative = []
    for m in months:
        cum += (monthly_rent_jpy - MPMT_JPY) / FX_BASE
        cumulative.append(cum)
    y = np.array(cumulative)
    exit_net_hkd = (PROP_JPY - BAL_JPY) / FX_BASE
    final_total = y[-1] + exit_net_hkd

    fig, ax = plt.subplots(figsize=(7, 3.5))
    ax.fill_between(months, y, 0, where=(y >= 0), alpha=0.15, color=C_GREEN, interpolate=True)
    ax.fill_between(months, y, 0, where=(y < 0), alpha=0.15, color=C_RED, interpolate=True)
    ax.plot(months, y, color=C_ACCENT, linewidth=2)
    ax.axhline(y=0, color=C_MUTED, linewidth=0.8, linestyle='--')
    for i, v in enumerate(y):
        if v >= 0:
            ax.annotate(f"Breakeven\nMonth {i+1}", xy=(i+1, 0), xytext=(i+18, -DOWN_HKD*0.18),
                        fontsize=8, fontweight='bold', color=C_GREEN,
                        arrowprops=dict(arrowstyle='->', color=C_GREEN, lw=1.2))
            break
    ax.annotate(f"+Exit: HKD {exit_net_hkd/10000:.0f}K\nTotal: HKD {final_total/10000:.0f}K",
                xy=(120, final_total), xytext=(92, final_total + DOWN_HKD*0.3),
                fontsize=8, fontweight='bold', color=C_BLUE,
                arrowprops=dict(arrowstyle='->', color=C_BLUE, lw=1.2))
    ax.set_xlabel("Month", fontsize=10, fontweight='bold')
    ax.set_ylabel("Cumulative Net Cash Flow (HKD)", fontsize=10, fontweight='bold')
    ax.set_title("Monthly Cash Flow: Rent vs Mortgage (Base Case)", fontsize=11, fontweight='bold', color=C_DARK, pad=10)
    ax.set_xlim(1, 128); ax.grid(axis='y', alpha=0.3)
    plt.tight_layout()
    p = OUT_DIR / "chart_cashflow.png"
    fig.savefig(p, dpi=200, bbox_inches='tight', facecolor='white')
    plt.close()
    return str(p)

# ═══════ CHART 3: 3-Scenario Bars ═══════
def draw_3scenarios():
    vals = [matrix[0][2]["annualized"], matrix[1][1]["annualized"], matrix[2][0]["annualized"]]
    total_hkd = [matrix[0][2]["total_return_hkd"]/10000, matrix[1][1]["total_return_hkd"]/10000, matrix[2][0]["total_return_hkd"]/10000]
    rent_hkd = [matrix[0][2]["cum_rent_hkd"]/10000, matrix[1][1]["cum_rent_hkd"]/10000, matrix[2][0]["cum_rent_hkd"]/10000]
    exit_hkd = [matrix[0][2]["net_exit_hkd"]/10000, matrix[1][1]["net_exit_hkd"]/10000, matrix[2][0]["net_exit_hkd"]/10000]
    bar_colors = [C_RED, C_ACCENT, C_GREEN]

    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(7, 3.2), gridspec_kw={'width_ratios': [1, 1.3]})
    bars = ax1.barh(range(3), vals, color=bar_colors, height=0.55, edgecolor='white', linewidth=1.5)
    ax1.set_yticks(range(3)); ax1.set_yticklabels(['Optimistic', 'Base', 'Conservative'], fontsize=9, fontweight='bold')
    ax1.set_xlabel("Annualized IRR %", fontsize=9, fontweight='bold')
    ax1.set_title("Return Comparison", fontsize=10, fontweight='bold', color=C_DARK)
    for i, (v, bar) in enumerate(zip(vals, bars)):
        ax1.text(v + 0.3, i, f"{v:.1f}%", va='center', fontsize=10, fontweight='bold', color=bar_colors[i])
    ax1.set_xlim(0, max(vals)*1.25)

    ax2.bar(range(3), rent_hkd, color=C_ACCENT, label='Cumulative Rent', width=0.5)
    ax2.bar(range(3), exit_hkd, bottom=rent_hkd, color=C_GOLD, label='Net Exit Proceeds', width=0.5)
    ax2.set_xticks(range(3)); ax2.set_xticklabels(['Conservative', 'Base', 'Optimistic'], fontsize=8, fontweight='bold')
    ax2.set_ylabel("HKD (thousands)", fontsize=9, fontweight='bold')
    ax2.set_title("Total Return Breakdown", fontsize=10, fontweight='bold', color=C_DARK)
    ax2.legend(loc='upper left', fontsize=7, framealpha=0.8)
    for i in range(3):
        ax2.text(i, rent_hkd[i]+exit_hkd[i]+10, f"HKD {total_hkd[i]:.0f}K", ha='center', fontsize=9, fontweight='bold', color=C_DARK)
    plt.tight_layout()
    p = OUT_DIR / "chart_3scenarios.png"
    fig.savefig(p, dpi=200, bbox_inches='tight', facecolor='white')
    plt.close()
    return str(p)

# ═══════ CHART 4: Risk Scorecard ═══════
def draw_risk_scorecard():
    fig, ax = plt.subplots(figsize=(7, 2.8))
    ax.set_xlim(0, 10); ax.set_ylim(0, 3.2); ax.axis('off')
    cats = [
        ("FX Risk", 6.5, "Medium", C_ORANGE, "JPY historically volatile\nbut favorable for HKD investors"),
        ("Property Price", 8.0, "Low", C_GREEN, "Osaka less bubbly than Tokyo\n+154.53 sqm land, clean title"),
        ("Liquidity", 5.5, "Medium", C_ORANGE, "Japan RE takes 3-6 months\nto sell typically"),
        ("Policy / Legal", 9.0, "Very Low", C_GREEN, "No foreign buyer restrictions\n2026 FEFTA = reporting only"),
        ("Interest Rate", 7.5, "Low-Med", '#b388d9', "BOJ at 0.75%, fixed 3% mortgage\nrate locked for 15 years"),
    ]
    for i, (name, score, level, color, desc) in enumerate(cats):
        y = 2.6 - i * 0.52
        ax.barh(y, 10, height=0.38, color=C_SURFACE, left=0, zorder=1)
        ax.barh(y, score, height=0.38, color=color, left=0, alpha=0.85, zorder=2)
        ax.text(0.1, y, name, va='center', fontsize=8.5, fontweight='bold', color=C_WHITE, zorder=3)
        ax.text(score + 0.15, y, f"{score}/10  {level}", va='center', fontsize=8, fontweight='bold', color=C_DARK, zorder=3)
        ax.text(10, y - 0.06, desc, va='top', ha='right', fontsize=6.5, color=C_MUTED, zorder=3, style='italic')
    avg = np.mean([c[1] for c in cats])
    ax.text(5, 0.15, f"Overall Risk Score: {avg:.1f}/10", ha='center', fontsize=12, fontweight='bold', color=C_ACCENT,
            bbox=dict(boxstyle='round,pad=0.4', facecolor=C_ACCENT, alpha=0.1, edgecolor=C_ACCENT))
    plt.tight_layout()
    p = OUT_DIR / "chart_risk_scorecard.png"
    fig.savefig(p, dpi=200, bbox_inches='tight', facecolor='white')
    plt.close()
    return str(p)

# ═══════ CHART 5: Concept Diagram ═══════
def draw_concept():
    fig, ax = plt.subplots(figsize=(7, 3.5))
    ax.set_xlim(0, 10); ax.set_ylim(0, 4); ax.axis('off')
    b1 = FancyBboxPatch((0.3, 0.5), 4.2, 3.0, boxstyle="round,pad=0.15", facecolor='#e8e5ff', edgecolor=C_ACCENT, linewidth=2)
    ax.add_patch(b1)
    ax.text(2.4, 3.15, "FIXED DATA", ha='center', fontsize=11, fontweight='bold', color=C_ACCENT)
    ax.text(2.4, 2.75, "(You Control)", ha='center', fontsize=8, color=C_MUTED, style='italic')
    for i, t in enumerate(["Property Price: JPY 78M", "FX Rate (Entry): 19.5", "LTV: 40%", "Mortgage Rate: 3.0%", "Term: 15Y / Hold: 10Y", "Gross Yield: 6.0%"]):
        ax.text(0.7, 2.35 - i*0.32, t, fontsize=8, color=C_DARK, fontweight='bold')
    b2 = FancyBboxPatch((5.5, 0.5), 4.2, 3.0, boxstyle="round,pad=0.15", facecolor='#fff3e0', edgecolor=C_ORANGE, linewidth=2)
    ax.add_patch(b2)
    ax.text(7.6, 3.15, "VARIABLE DATA", ha='center', fontsize=11, fontweight='bold', color=C_ORANGE)
    ax.text(7.6, 2.75, "(Market Decides)", ha='center', fontsize=8, color=C_MUTED, style='italic')
    for i, t in enumerate(["FX Rate at Exit:", "  Strong / Base / Weak JPY", "", "Property Value at Exit:", "  Decline / Flat / Growth"]):
        w = 'bold' if not t.startswith('  ') and t else 'normal'
        ax.text(5.9, 2.35 - i*0.32, t, fontsize=8, color=C_DARK, fontweight=w)
    ax.annotate('', xy=(5.3, 2.0), xytext=(4.7, 2.0), arrowprops=dict(arrowstyle='->', lw=2.5, color=C_MUTED))
    ax.text(5.0, 2.25, "9\nOutcomes", ha='center', va='center', fontsize=8, fontweight='bold', color=C_ACCENT)
    plt.tight_layout()
    p = OUT_DIR / "chart_concept.png"
    fig.savefig(p, dpi=200, bbox_inches='tight', facecolor='white')
    plt.close()
    return str(p)

print("Generating charts...")
ch1 = draw_heatmap()
ch2 = draw_cashflow()
ch3 = draw_3scenarios()
ch4 = draw_risk_scorecard()
ch5 = draw_concept()
print("All charts done.")

calc_data = {
    "fixed": {"prop_jpy": PROP_JPY, "prop_hkd": round(PROP_HKD), "fx_base": FX_BASE,
              "ltv": LTV, "rate": RATE, "mtg_years": MTG_YEARS, "hold_years": HOLD_YEARS,
              "down_jpy": DOWN_JPY, "down_hkd": round(DOWN_HKD),
              "loan_jpy": LOAN_JPY, "loan_hkd": round(LOAN_HKD),
              "monthly_payment_jpy": round(MPMT_JPY),
              "gross_rent_annual_jpy": GROSS_RENT_ANNUAL_JPY,
              "net_rent_annual_jpy": round(NET_RENT_ANNUAL_JPY),
              "balance_at_exit_jpy": round(BAL_JPY)},
    "matrix": [[{"annualized": round(matrix[r][c]["annualized"], 2),
                 "total_return_hkd": round(matrix[r][c]["total_return_hkd"]),
                 "cum_rent_hkd": round(matrix[r][c]["cum_rent_hkd"]),
                 "net_exit_hkd": round(matrix[r][c]["net_exit_hkd"])} for c in range(3)] for r in range(3)],
}
with open(OUT_DIR / "calc_data.json", "w") as f:
    json.dump(calc_data, f, indent=2)
print("Data saved.")