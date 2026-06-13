#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Andy Japan Property ML V2 Report — Part 1, 2, 3 Only
- Professional Chinese
- HKD/JPY exchange rate (not JPY/HKD)
- All 84 scenarios with charts
"""

import os, json, math
import numpy as np

# ── Matplotlib for heatmaps ──
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.font_manager as fm
from matplotlib.colors import LinearSegmentedColormap

# ── ReportLab for PDF ──
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import cm, mm
from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY, TA_RIGHT
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    Image, KeepTogether, HRFlowable, CondPageBreak
)
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase.pdfmetrics import registerFontFamily

# ═══════════════════════════════════════════════════════════════
# FONTS
# ═══════════════════════════════════════════════════════════════
pdfmetrics.registerFont(TTFont('NotoSerifSC', '/usr/share/fonts/truetype/noto-serif-sc/NotoSerifSC-Regular.ttf'))
pdfmetrics.registerFont(TTFont('NotoSerifSCBold', '/usr/share/fonts/truetype/noto-serif-sc/NotoSerifSC-Bold.ttf'))
pdfmetrics.registerFont(TTFont('WenQuanYi', '/usr/share/fonts/truetype/wqy/wqy-zenhei.ttc', subfontIndex=0))
registerFontFamily('NotoSerifSC', normal='NotoSerifSC', bold='NotoSerifSCBold')

# Font fallback for mixed CJK/Latin
from reportlab.pdfbase.pdfmetrics import getFont
_origGetFont = getFont
def _patchedGetFont(name):
    try:
        return _origGetFont(name)
    except:
        return _origGetFont('NotoSerifSC')
import reportlab.pdfbase.pdfmetrics as _pm
_pm.getFont = _patchedGetFont

# ═══════════════════════════════════════════════════════════════
# PALETTE (auto-generated)
# ═══════════════════════════════════════════════════════════════
ACCENT = colors.HexColor('#4f2bba')
TEXT_PRIMARY = colors.HexColor('#1e1d1b')
TEXT_MUTED = colors.HexColor('#7a776e')
BG_SURFACE = colors.HexColor('#dedcd5')
BG_PAGE = colors.HexColor('#f2f1ee')
TABLE_HEADER_COLOR = ACCENT
TABLE_HEADER_TEXT = colors.white
TABLE_ROW_EVEN = colors.white
TABLE_ROW_ODD = BG_SURFACE
GREEN_POS = colors.HexColor('#1e7a3c')
RED_NEG = colors.HexColor('#b91c1c')

# ═══════════════════════════════════════════════════════════════
# FINANCIAL CONSTANTS
# ═══════════════════════════════════════════════════════════════
ENTRY_FX = 19.5           # HKD/JPY: 1 HKD = 19.5 JPY
PRICE_JPY = 62_400_000    # JPY 6,240萬
PRICE_HKD_WAN = 320.0     # HKD 320萬
EQUITY_HKD_WAN = 192.0    # HKD 192萬 (60%)
LOAN_JPY = 24_960_000     # JPY 2,496萬 (40% LTV)
LOAN_HKD_WAN = 128.0      # HKD 128萬
RATE_ANNUAL = 0.03        # 3% annual
MONTHLY_RATE = RATE_ANNUAL / 12
RENT_GROSS_RATE = 0.06    # 6% annual gross rent
COST_RATE = 0.003         # 0.3% annual holding cost

N_MONTHS_TOTAL = 120      # 10-year mortgage term
MP_JPY = LOAN_JPY * MONTHLY_RATE * (1 + MONTHLY_RATE)**N_MONTHS_TOTAL / ((1 + MONTHLY_RATE)**N_MONTHS_TOTAL - 1)

# Scenario parameters
FX_LEVELS = [13.0, 16.0, 19.5, 22.0, 24.0, 26.0, 28.0]
PRICE_RATES = [-0.03, 0.0, 0.015, 0.03]
HOLD_YEARS = [5, 7, 10]

# Derived annual figures
ANNUAL_GROSS_RENT_JPY = PRICE_JPY * RENT_GROSS_RATE
ANNUAL_COST_JPY = PRICE_JPY * COST_RATE
ANNUAL_NET_RENT_JPY = ANNUAL_GROSS_RENT_JPY - ANNUAL_COST_JPY

# ═══════════════════════════════════════════════════════════════
# FINANCIAL CALCULATIONS
# ═══════════════════════════════════════════════════════════════

def calc_remaining_balance(loan, r, mp, months_paid):
    return loan * (1 + r)**months_paid - mp * ((1 + r)**months_paid - 1) / r

def calc_total_interest(loan, mp, months_paid, remaining):
    return mp * months_paid - (loan - remaining)

def calc_scenario(exit_fx, annual_price_rate, years):
    """Core formula: Net HKD = (exit_property - remaining_loan + net_rent - total_mortgage) / exit_fx / 10000 - 192"""
    months = years * 12
    exit_jpy = PRICE_JPY * (1 + annual_price_rate) ** years
    remaining = calc_remaining_balance(LOAN_JPY, MONTHLY_RATE, MP_JPY, months)
    total_interest_jpy = calc_total_interest(LOAN_JPY, MP_JPY, months, remaining)
    total_mortgage_paid_jpy = MP_JPY * months
    total_net_rent_jpy = ANNUAL_NET_RENT_JPY * years
    total_gross_rent_jpy = ANNUAL_GROSS_RENT_JPY * years
    total_cost_jpy = ANNUAL_COST_JPY * years

    # True net HKD (cash flow based)
    net_hkd_wan = (exit_jpy - remaining + total_net_rent_jpy - total_mortgage_paid_jpy) / exit_fx / 10000 - EQUITY_HKD_WAN

    # 5-component decomposition (all at exit FX for consistency)
    prop_chg = (exit_jpy - PRICE_JPY) / exit_fx / 10000
    fx_chg = PRICE_JPY * (1.0/exit_fx - 1.0/ENTRY_FX) / 10000
    rent_gross = total_gross_rent_jpy / exit_fx / 10000
    tax_cost = total_cost_jpy / exit_fx / 10000
    interest_cost = total_interest_jpy / exit_fx / 10000
    decomp_net = prop_chg + fx_chg + rent_gross - tax_cost - interest_cost

    return {
        'exit_fx': exit_fx, 'pr': annual_price_rate, 'years': years,
        'exit_jpy': exit_jpy, 'remaining': remaining,
        'total_gross_rent_jpy': total_gross_rent_jpy,
        'total_cost_jpy': total_cost_jpy,
        'total_net_rent_jpy': total_net_rent_jpy,
        'total_interest_jpy': total_interest_jpy,
        'total_mortgage_paid_jpy': total_mortgage_paid_jpy,
        'net': net_hkd_wan,
        'prop': prop_chg, 'fx': fx_chg,
        'rent': rent_gross, 'tax': tax_cost, 'interest': interest_cost,
        'decomp_net': decomp_net,
    }

# Pre-calculate key reference points
for yr in HOLD_YEARS:
    rem = calc_remaining_balance(LOAN_JPY, MONTHLY_RATE, MP_JPY, yr*12)
    intr = calc_total_interest(LOAN_JPY, MP_JPY, yr*12, rem)
    print(f'{yr}yr: remaining_loan={rem:,.0f} JPY, total_interest={intr:,.0f} JPY, MP={MP_JPY:,.0f}/mo')

# ML blended prediction for 10-year
FX_BLENDED_10 = 7.8   # % change in HKD/JPY
PR_BLENDED_10 = 5.0   # % total property change
ml_exit_fx = ENTRY_FX * (1 + FX_BLENDED_10/100)   # ~21.02
ml_10 = calc_scenario(ml_exit_fx, (1.03**10 - 1), 10)  # 5% annual → (1.03^10-1) ≈ 34.4% total... 

# Actually, the blended 5.0% is 10-year TOTAL change, not annual. Let me recalculate.
# V2 says property_10yr blended = 5.0%, which is the 10-year cumulative change
# So annual rate = (1.05)^(1/10) - 1 ≈ 0.489%
# But for the 84 scenarios, we use ANNUAL rates of -3%, 0%, 1.5%, 3%
# For ML blended, 10yr total = 5%, so exit_jpy = 6240 * 1.05 = 6552
# This matches PR_BLENDED_10 = 5.0 (10-year total %)
ml_10 = calc_scenario(ml_exit_fx, 0.0, 10)  # 0% annual for now
# We'll manually set the property value
ml_exit_jpy = PRICE_JPY * (1 + PR_BLENDED_10/100)  # 5% total over 10 years
ml_10['exit_jpy'] = ml_exit_jpy
ml_10['prop'] = (ml_exit_jpy - PRICE_JPY) / ml_exit_fx / 10000
ml_10['net'] = (ml_exit_jpy - 0 + ml_10['total_net_rent_jpy'] - ml_10['total_mortgage_paid_jpy']) / ml_exit_fx / 10000 - EQUITY_HKD_WAN

print(f'\nML 10yr: exit_fx={ml_exit_fx:.2f}, net=HKD {ml_10["net"]:.1f}萬')
print(f'  prop={ml_10["prop"]:.1f}, fx={ml_10["fx"]:.1f}, rent={ml_10["rent"]:.1f}, tax={ml_10["tax"]:.1f}, interest={ml_10["interest"]:.1f}')

# ═══════════════════════════════════════════════════════════════
# GENERATE HEATMAP CHARTS (matplotlib)
# ═══════════════════════════════════════════════════════════════

fm.fontManager.addfont('/usr/share/fonts/truetype/chinese/SarasaMonoSC-Regular.ttf')
fm.fontManager.addfont('/usr/share/fonts/truetype/chinese/SarasaMonoSC-Bold.ttf')
fm.fontManager.addfont('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf')
plt.rcParams['font.sans-serif'] = ['Sarasa Mono SC', 'DejaVu Sans']
plt.rcParams['axes.unicode_minus'] = False

CHART_DIR = '/home/z/my-project/download/ml_charts'

for years in HOLD_YEARS:
    matrix = np.zeros((len(FX_LEVELS), len(PRICE_RATES)))
    for i, fx in enumerate(FX_LEVELS):
        for j, pr in enumerate(PRICE_RATES):
            s = calc_scenario(fx, pr, years)
            matrix[i, j] = s['net']

    fig, ax = plt.subplots(figsize=(10, 6.5))
    cmap = LinearSegmentedColormap.from_list('rg',
        ['#b91c1c', '#ef4444', '#fca5a5', '#f5f5f5', '#86efac', '#22c55e', '#15803d'])
    vmax = max(abs(matrix.min()), abs(matrix.max()))
    norm = plt.Normalize(vmin=-vmax, vmax=vmax)

    im = ax.imshow(matrix, cmap=cmap, norm=norm, aspect='auto')

    ax.set_xticks(range(len(PRICE_RATES)))
    ax.set_xticklabels([f'{r*100:+.1f}%/年' for r in PRICE_RATES], fontsize=11)
    ax.set_yticks(range(len(FX_LEVELS)))
    ax.set_yticklabels([f'{fx:.1f}' for fx in FX_LEVELS], fontsize=11)
    ax.set_xlabel('年房價變幅', fontsize=13, fontweight='bold', labelpad=10)
    ax.set_ylabel('HKD/JPY 出場匯率', fontsize=13, fontweight='bold', labelpad=10)
    ax.set_title(f'{years}年持有期 — 84情景淨回報 (HKD萬)', fontsize=15, fontweight='bold', pad=15)

    for i in range(len(FX_LEVELS)):
        for j in range(len(PRICE_RATES)):
            val = matrix[i, j]
            tc = 'white' if abs(val) > vmax * 0.55 else ('#1e1d1b' if abs(val) > vmax * 0.15 else '#555')
            ax.text(j, i, f'{val:+.0f}', ha='center', va='center',
                    fontsize=11, fontweight='bold', color=tc)

    cbar = plt.colorbar(im, ax=ax, shrink=0.82, pad=0.02)
    cbar.set_label('淨回報 (HKD萬)', fontsize=11)

    plt.tight_layout()
    path = os.path.join(CHART_DIR, f'scenario_heatmap_{years}yr.png')
    plt.savefig(path, dpi=200, bbox_inches='tight', facecolor='white')
    plt.close()
    print(f'Chart: {path}')

# ═══════════════════════════════════════════════════════════════
# PDF STYLES
# ═══════════════════════════════════════════════════════════════
W, H = A4
LM, RM, TM, BM = 2.0*cm, 2.0*cm, 2.2*cm, 2.2*cm
CW = W - LM - RM

def make_styles():
    s = {}
    s['h1'] = ParagraphStyle('H1', fontName='NotoSerifSC', fontSize=18, leading=26,
        textColor=TEXT_PRIMARY, spaceBefore=18, spaceAfter=10, alignment=TA_LEFT)
    s['h2'] = ParagraphStyle('H2', fontName='NotoSerifSC', fontSize=13, leading=20,
        textColor=ACCENT, spaceBefore=14, spaceAfter=8, alignment=TA_LEFT)
    s['h3'] = ParagraphStyle('H3', fontName='NotoSerifSC', fontSize=11.5, leading=17,
        textColor=TEXT_PRIMARY, spaceBefore=10, spaceAfter=6, alignment=TA_LEFT)
    s['body'] = ParagraphStyle('Body', fontName='NotoSerifSC', fontSize=10.5, leading=18,
        textColor=TEXT_PRIMARY, spaceBefore=2, spaceAfter=6, alignment=TA_JUSTIFY, wordWrap='CJK')
    s['body_l'] = ParagraphStyle('BodyL', fontName='NotoSerifSC', fontSize=10.5, leading=18,
        textColor=TEXT_PRIMARY, spaceBefore=2, spaceAfter=6, alignment=TA_LEFT, wordWrap='CJK')
    s['caption'] = ParagraphStyle('Cap', fontName='NotoSerifSC', fontSize=9, leading=14,
        textColor=TEXT_MUTED, spaceBefore=4, spaceAfter=10, alignment=TA_CENTER, wordWrap='CJK')
    s['formula'] = ParagraphStyle('Formula', fontName='NotoSerifSC', fontSize=11, leading=18,
        textColor=ACCENT, spaceBefore=8, spaceAfter=8, alignment=TA_CENTER, wordWrap='CJK',
        leftIndent=12, borderColor=ACCENT, borderWidth=2, borderPadding=8)
    s['callout'] = ParagraphStyle('Callout', fontName='NotoSerifSCBold', fontSize=12, leading=19,
        textColor=ACCENT, spaceBefore=6, spaceAfter=6, alignment=TA_CENTER, wordWrap='CJK')
    s['small'] = ParagraphStyle('Small', fontName='NotoSerifSC', fontSize=8.5, leading=13,
        textColor=TEXT_MUTED, spaceBefore=2, spaceAfter=3, alignment=TA_LEFT, wordWrap='CJK')
    return s

STY = make_styles()

# ── Helpers ──
def h1(t): return Paragraph(f'<b>{t}</b>', STY['h1'])
def h2(t): return Paragraph(f'<b>{t}</b>', STY['h2'])
def h3(t): return Paragraph(f'<b>{t}</b>', STY['h3'])
def p(t): return Paragraph(t, STY['body'])
def pl(t): return Paragraph(t, STY['body_l'])
def cap(t): return Paragraph(t, STY['caption'])
def formula(t): return Paragraph(t, STY['formula'])
def callout(t): return Paragraph(t, STY['callout'])

def fmt_wan(val, show_sign=True):
    """Format HKD value in 萬."""
    sign = '+' if val > 0 and show_sign else ''
    if val < 0:
        return f'HKD {val:.1f}萬'
    return f'HKD {sign}{val:.1f}萬'

def make_table(headers, rows, col_widths=None, font_size=9):
    cw = col_widths or [CW / len(headers)] * len(headers)
    th = ParagraphStyle('TH', fontName='NotoSerifSCBold', fontSize=font_size, leading=font_size+4,
        textColor=TABLE_HEADER_TEXT, alignment=TA_CENTER, wordWrap='CJK')
    td = ParagraphStyle('TD', fontName='NotoSerifSC', fontSize=font_size, leading=font_size+4,
        textColor=TEXT_PRIMARY, alignment=TA_CENTER, wordWrap='CJK')
    tdl = ParagraphStyle('TDL', fontName='NotoSerifSC', fontSize=font_size, leading=font_size+4,
        textColor=TEXT_PRIMARY, alignment=TA_LEFT, wordWrap='CJK')
    data = [[Paragraph(h, th) for h in headers]]
    for row in rows:
        data.append([Paragraph(str(c), tdl if i == 0 else td) for i, c in enumerate(row)])
    t = Table(data, colWidths=cw, repeatRows=1, hAlign='CENTER')
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), TABLE_HEADER_COLOR),
        ('TEXTCOLOR', (0, 0), (-1, 0), TABLE_HEADER_TEXT),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 6),
        ('TOPPADDING', (0, 0), (-1, 0), 6),
        ('BOTTOMPADDING', (0, 1), (-1, -1), 4),
        ('TOPPADDING', (0, 1), (-1, -1), 4),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#cccccc')),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [TABLE_ROW_EVEN, TABLE_ROW_ODD]),
    ]))
    return t

def make_highlight_table(headers, rows, col_widths=None, font_size=9):
    """Table with green/red coloring for net return column (last column)."""
    cw = col_widths or [CW / len(headers)] * len(headers)
    th = ParagraphStyle('TH', fontName='NotoSerifSCBold', fontSize=font_size, leading=font_size+4,
        textColor=TABLE_HEADER_TEXT, alignment=TA_CENTER, wordWrap='CJK')
    td = ParagraphStyle('TD', fontName='NotoSerifSC', fontSize=font_size, leading=font_size+4,
        textColor=TEXT_PRIMARY, alignment=TA_CENTER, wordWrap='CJK')
    tdl = ParagraphStyle('TDL', fontName='NotoSerifSC', fontSize=font_size, leading=font_size+4,
        textColor=TEXT_PRIMARY, alignment=TA_LEFT, wordWrap='CJK')
    tdg = ParagraphStyle('TDG', fontName='NotoSerifSCBold', fontSize=font_size, leading=font_size+4,
        textColor=GREEN_POS, alignment=TA_CENTER, wordWrap='CJK')
    tdr = ParagraphStyle('TDR', fontName='NotoSerifSCBold', fontSize=font_size, leading=font_size+4,
        textColor=RED_NEG, alignment=TA_CENTER, wordWrap='CJK')

    data = [[Paragraph(h, th) for h in headers]]
    for row in rows:
        r = []
        for i, c in enumerate(row):
            if i == 0:
                r.append(Paragraph(str(c), tdl))
            elif i == len(row) - 1:  # last column = net
                try:
                    val = float(str(c).replace('+','').replace('HKD ','').replace('萬',''))
                    style = tdg if val >= 0 else tdr
                except:
                    style = td
                r.append(Paragraph(str(c), style))
            else:
                r.append(Paragraph(str(c), td))
        data.append(r)

    t = Table(data, colWidths=cw, repeatRows=1, hAlign='CENTER')
    cmds = [
        ('BACKGROUND', (0, 0), (-1, 0), TABLE_HEADER_COLOR),
        ('TEXTCOLOR', (0, 0), (-1, 0), TABLE_HEADER_TEXT),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 6),
        ('TOPPADDING', (0, 0), (-1, 0), 6),
        ('BOTTOMPADDING', (0, 1), (-1, -1), 4),
        ('TOPPADDING', (0, 1), (-1, -1), 4),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#cccccc')),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [TABLE_ROW_EVEN, TABLE_ROW_ODD]),
    ]
    t.setStyle(TableStyle(cmds))
    return t

def make_decomp_table(rows, col_widths=None):
    """5-component decomposition table for Part 2."""
    cw = col_widths or [CW*0.20, CW*0.18, CW*0.62]
    th = ParagraphStyle('TH', fontName='NotoSerifSCBold', fontSize=10, leading=15,
        textColor=TABLE_HEADER_TEXT, alignment=TA_CENTER, wordWrap='CJK')
    td = ParagraphStyle('TD', fontName='NotoSerifSC', fontSize=10, leading=15,
        textColor=TEXT_PRIMARY, alignment=TA_CENTER, wordWrap='CJK')
    tdl = ParagraphStyle('TDL', fontName='NotoSerifSC', fontSize=10, leading=15,
        textColor=TEXT_PRIMARY, alignment=TA_LEFT, wordWrap='CJK')
    tdb = ParagraphStyle('TDB', fontName='NotoSerifSCBold', fontSize=10.5, leading=15,
        textColor=ACCENT, alignment=TA_CENTER, wordWrap='CJK')
    tdbl = ParagraphStyle('TDBL', fontName='NotoSerifSCBold', fontSize=10.5, leading=15,
        textColor=ACCENT, alignment=TA_LEFT, wordWrap='CJK')

    data = [[Paragraph(h, th) for h in ['項目', '金額 (HKD)', '說明']]]
    for i, (label, amount, explain) in enumerate(rows):
        is_last = (i == len(rows) - 1)
        if is_last:
            data.append([Paragraph(label, tdbl), Paragraph(amount, tdb), Paragraph(explain, tdl)])
        else:
            data.append([Paragraph(label, tdl), Paragraph(amount, td), Paragraph(explain, tdl)])

    t = Table(data, colWidths=cw, hAlign='CENTER')
    cmds = [
        ('BACKGROUND', (0, 0), (-1, 0), TABLE_HEADER_COLOR),
        ('TEXTCOLOR', (0, 0), (-1, 0), TABLE_HEADER_TEXT),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#cccccc')),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 7),
        ('TOPPADDING', (0, 0), (-1, -1), 7),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('BACKGROUND', (0, -1), (-1, -1), colors.HexColor('#e8e0f7')),
        ('LINEABOVE', (0, -1), (-1, -1), 1.5, ACCENT),
    ]
    if len(rows) > 2:
        cmds.append(('ROWBACKGROUNDS', (0, 1), (-1, -2), [TABLE_ROW_EVEN, TABLE_ROW_ODD]))
    t.setStyle(TableStyle(cmds))
    return t


# ═══════════════════════════════════════════════════════════════
# BUILD PDF CONTENT
# ═══════════════════════════════════════════════════════════════
OUT_PDF = '/home/z/my-project/download/andy_report_v6_part123.pdf'

doc = SimpleDocTemplate(OUT_PDF, pagesize=A4,
    leftMargin=LM, rightMargin=RM, topMargin=TM, bottomMargin=BM,
    title='日本物業投資評估報告 — 第1-3章', author='Z.ai', subject='Andy 日本物業 ML V2 投資分析')

story = []

# ───────────────────────────────────────────────────────────
# PART 1: 客戶入場決策
# ───────────────────────────────────────────────────────────
story.append(h1('一、客戶入場決策'))

story.append(h2('1.1 客戶投入資金'))
story.append(p('本報告以投資者 Andy 為對象，評估以港幣購買日本物業的投資回報。投資者計劃投入港幣 320 萬元購買一套日本住宅物業，其中 192 萬元為自有資金（佔總價 60%），餘下 128 萬元通過銀行按揭貸款（佔總價 40%）。入場時的匯率設定為 HKD/JPY = 19.5，即每 1 港元可兌換 19.5 日元。因此，320 萬港幣按入場匯率可兌換為 6,240 萬日元，恰好覆蓋物業的日元標價。'))

story.append(Spacer(1, 6))
story.append(make_table(
    ['項目', '金額', '說明'],
    [
        ['物業總價', 'HKD 320萬 / JPY 6,240萬', '入場匯率 HKD/JPY = 19.5'],
        ['自有資金（首期）', 'HKD 192萬', '佔總價 60%'],
        ['銀行按揭貸款', 'HKD 128萬 (JPY 2,496萬)', '佔總價 40%，LTV = 40%'],
        ['入場匯率', 'HKD/JPY = 19.5', '即 1 HKD = 19.5 JPY'],
    ],
    col_widths=[CW*0.26, CW*0.38, CW*0.36]
))
story.append(cap('表 1-1：客戶入場資金結構'))

story.append(h2('1.2 貸款條件'))
story.append(p('銀行按揭貸款的金額為 JPY 2,496 萬（等值 HKD 128 萬），貸款利率為年利率 3%，採用等額本息還款方式，貸款期限為 10 年（120 個月）。經計算，每月需向銀行還款 JPY {:,}（約 HKD {:,.0f}）。10 年總還款額為 JPY {:,.0f} 萬，其中本金 JPY 2,496 萬，利息 JPY {:,.0f} 萬（約 HKD {:.1f} 萬）。物業的預期年租金回報率為 6%，即每年可收取租金 JPY {:,.0f} 萬；每年持有成本（含物業稅、管理費等）約為物業價值的 0.3%，即每年 JPY {:,.0f} 萬。扣除持有成本後，每年淨租金收入為 JPY {:,.0f} 萬。'.format(
    round(MP_JPY),
    MP_JPY / ENTRY_FX,
    MP_JPY * 120 / 10000,
    calc_total_interest(LOAN_JPY, MP_JPY, 120, 0) / 10000,
    calc_total_interest(LOAN_JPY, MP_JPY, 120, 0) / ENTRY_FX / 10000,
    ANNUAL_GROSS_RENT_JPY / 10000,
    ANNUAL_COST_JPY / 10000,
    ANNUAL_NET_RENT_JPY / 10000,
)))

story.append(Spacer(1, 6))
story.append(make_table(
    ['貸款參數', '數值', '備註'],
    [
        ['貸款成數 (LTV)', '40%', 'HKD 128萬 / HKD 320萬'],
        ['年利率', '3%', '固定利率'],
        ['還款期限', '10 年（120 月）', '等額本息'],
        ['每月供款', f'JPY {MP_JPY:,.0f}', f'約 HKD {MP_JPY/ENTRY_FX:,.0f}'],
        ['10 年總利息', f'HKD {calc_total_interest(LOAN_JPY, MP_JPY, 120, 0)/ENTRY_FX/10000:.1f}萬', '貸款總成本'],
        ['年租金回報率', '6%', 'JPY {:,.0f}萬/年'.format(ANNUAL_GROSS_RENT_JPY/10000)],
        ['年持有成本', '0.3%', 'JPY {:,.0f}萬/年'.format(ANNUAL_COST_JPY/10000)],
    ],
    col_widths=[CW*0.26, CW*0.32, CW*0.42]
))
story.append(cap('表 1-2：貸款條件及物業收益參數'))

story.append(h2('1.3 核心問題'))
story.append(p('作為投資者，Andy 最關心的核心問題是：<b>「投入 192 萬港幣，持有若干年後出售，最終能收回多少？」</b>這個問題無法用一個簡單的數字回答，因為最終回報取決於兩個關鍵的不確定因素——日本物業價格的未來走勢，以及港元兌日元的匯率變動。租金收入和銀行利息是相對確定的因素，可以精確計算。因此，本報告後續章節將逐步拆解各項回報驅動因素，並通過 84 個情景的壓力測試，全面展示在不同市場環境下 Andy 的投資結果。'))


# ───────────────────────────────────────────────────────────
# PART 2: 回報驅動因素拆解
# ───────────────────────────────────────────────────────────
story.append(h1('二、回報驅動因素拆解'))

story.append(p('Andy 的投資回報可以分解為五個獨立組成部分。每一部分對最終回報的影響程度不同，有些是確定的、可以精確計算的，有些則充滿不確定性、需要通過模型預測。理解這五個組成部分，是評估這筆投資的基礎。'))

story.append(formula('<b>投資淨回報 = 房價變動 + 匯率變動 + 租金收入 - 稅費 - 銀行利息</b>'))
story.append(cap('（以上各項均以 HKD 萬元為單位）'))

story.append(h2('2.1 確定因素：租金收入與銀行利息'))

story.append(h3('2.1.1 租金收入（正向回報）'))
story.append(p('租金收入是這筆投資最穩定、最可預測的回報來源。物業購入後即出租，預期年租金回報率為 6%，即每年可收取 JPY {:,.0f} 萬的租金。扣除每年 JPY {:,.0f} 萬的持有成本（物業稅及管理費）後，每年淨租金收入為 JPY {:,.0f} 萬。以 10 年持有期計算，累計淨租金收入達 JPY {:,.0f} 萬。需要注意的是，租金的港元價值受出場匯率影響——如果出場時日元升值（HKD/JPY 數值下降），同樣的日元租金可兌換更多港元；反之則減少。'.format(
    ANNUAL_GROSS_RENT_JPY/10000, ANNUAL_COST_JPY/10000, ANNUAL_NET_RENT_JPY/10000, ANNUAL_NET_RENT_JPY*10/10000)))

story.append(p('此外，每月租金收入（JPY {:,.0f}）足以覆蓋每月按揭供款（JPY {:,.0f}），盈餘 JPY {:,.0f}。這意味着 Andy 無需額外貼錢供樓，物業在持有期間能夠實現現金流自給自足，這對投資者而言是一個重要的安全保障。'.format(
    ANNUAL_GROSS_RENT_JPY/12, MP_JPY, ANNUAL_GROSS_RENT_JPY/12 - MP_JPY)))

story.append(h3('2.1.2 銀行利息（負向成本）'))
story.append(p('銀行按揭利息是一項固定的、確定的成本支出。不論物業價格升跌或匯率變動，Andy 都必須按月向銀行還款。以 10 年期、年利率 3% 的條件計算，10 年累計支付利息 JPY {:,.0f} 萬（約 HKD {:.1f} 萬）。若持有期較短（如 5 年或 7 年），累計利息支出相應減少，但出售物業時需一次性償還剩餘貸款本金。這一點在後續的 84 情景計算中已作充分考慮。'.format(
    calc_total_interest(LOAN_JPY, MP_JPY, 120, 0)/10000,
    calc_total_interest(LOAN_JPY, MP_JPY, 120, 0)/ENTRY_FX/10000)))

story.append(h2('2.2 不確定因素：匯率變動與物業價格'))

story.append(h3('2.2.1 匯率變動（最大風險來源）'))
story.append(p('匯率是這筆投資中<b>影響最大、最不可控</b>的因素。Andy 以港幣購買日本物業，持有期間資產以日元計價，出售時需將日元兌換回港幣。如果持有期內日元相對港元貶值（即 HKD/JPY 數值上升，例如從 19.5 升至 28），同樣的日元資產換回的港元會大幅減少，造成匯率損失。反之，如果日元升值（HKD/JPY 數值下降，例如從 19.5 降至 13），則匯率變動會帶來額外收益。'))
story.append(p('舉例說明：假設物業價格不變（仍為 JPY 6,240 萬），如果出場匯率從入場時的 19.5 變為 28，該物業的港元價值將從 320 萬降至約 223 萬，匯率損失達 HKD 97 萬。相反，如果匯率降至 13，物業港元價值將升至約 480 萬，匯率收益達 HKD 160 萬。匯率的波動幅度可以輕鬆超過物業本身的價格變動，這是海外物業投資者必須認識到的核心風險。'))

story.append(h3('2.2.2 物業價格變動'))
story.append(p('日本住宅物業價格的未來走勢是第二個不確定因素。歷史上，日本房地產市場經歷過劇烈波動——1990 年代泡沫破裂後，部分地區房價累計下跌超過 50%，花費數十年才逐步恢復。然而，近年來在超低利率環境和外國投資需求推動下，日本主要城市的住宅價格呈現溫和上升趨勢。本報告的機器學習模型預測，未來 10 年日本住宅價格累計變動約為 +5%，但這一預測存在顯著不確定性（5% 至 95% 區間為 -25% 至 +35%）。'))

story.append(h2('2.3 核心公式'))

story.append(p('綜合以上分析，投資淨回報的計算公式如下。該公式將所有收入和支出統一折算為港幣，使 Andy 能夠直觀地理解每項因素對最終回報的貢獻。'))

story.append(formula('<b>投資淨回報 (HKD) = 房價變動 + 匯率變動 + 租金收入 - 稅費 - 銀行利息</b>'))

story.append(p('其中：'))
story.append(pl('<b>房價變動</b> = （N 年後物業日元價值 - 入場日元價值） / 出場匯率'))
story.append(pl('<b>匯率變動</b> = 入場日元價格 x （1/出場匯率 - 1/入場匯率）'))
story.append(pl('<b>租金收入</b> = N 年累計毛租金 / 出場匯率'))
story.append(pl('<b>稅費</b> = N 年累計持有成本 / 出場匯率'))
story.append(pl('<b>銀行利息</b> = N 年累計按揭利息 / 入場匯率'))
story.append(Spacer(1, 6))

story.append(p('公式中，「房價變動」衡量的是物業自身價值的升跌（以日元計價後折算為港元）；「匯率變動」衡量的是匯率波動對原有資產價值的影響；「租金收入」和「稅費」反映持有期間的經營性現金流；「銀行利息」則是借貸的固定成本。五項相加，即為 Andy 在扣除 192 萬首期後的淨投資回報。'))

story.append(p('以下以機器學習模型對 10 年持有期的預測結果為例，展示五項回報的具體數值。模型預測 10 年後 HKD/JPY 匯率約為 {:.2f}（日元貶值約 7.8%），物業價格累計上升約 5%。'.format(ml_exit_fx)))

story.append(make_decomp_table([
    ('房價變動', fmt_wan(ml_10['prop']),
     '物業由 JPY 6,240萬升至 JPY {:,.0f}萬，折算港元'.format(ml_exit_jpy/10000)),
    ('匯率變動', fmt_wan(ml_10['fx']),
     'HKD/JPY 由 19.5 升至 {:.2f}，日元貶值造成匯率損失'.format(ml_exit_fx)),
    ('租金收入', fmt_wan(ml_10['rent']),
     '10 年累計毛租金 JPY {:,.0f}萬，按出場匯率折算'.format(ANNUAL_GROSS_RENT_JPY*10/10000)),
    ('稅費', fmt_wan(-ml_10['tax']),
     '10 年持有成本 JPY {:,.0f}萬，按出場匯率折算'.format(ANNUAL_COST_JPY*10/10000)),
    ('銀行利息', fmt_wan(-ml_10['interest']),
     '10 年累計按揭利息 JPY {:,.0f}萬，按入場匯率折算'.format(ml_10['total_interest_jpy']/10000)),
    ('投資淨回報', fmt_wan(ml_10['decomp_net']),
     '五項合計：192 萬首期的 10 年預期淨回報'),
]))
story.append(cap('表 2-1：ML 預測 10 年投資回報五項分解（HKD）'))


# ───────────────────────────────────────────────────────────
# PART 3: 84 情景壓力測試
# ───────────────────────────────────────────────────────────
story.append(h1('三、84 情景壓力測試'))

story.append(p('第二章的回報分解基於機器學習模型的單一預測，但未來充滿不確定性。為全面評估投資風險與回報，本報告構建了 84 個獨立情景，覆蓋匯率、房價和持有期的各種可能組合。每個情景均按照核心公式計算最終的港元淨回報，確保 Andy 能夠了解在最好、最差以及中間各種情況下的投資結果。'))

story.append(h2('3.1 情景設定'))
story.append(p('84 個情景由三個維度的參數組合而成：'))

story.append(pl('<b>維度一：出場匯率（HKD/JPY），7 級</b>'))
story.append(pl('13.0 / 16.0 / 19.5（入場匯率） / 22.0 / 24.0 / 26.0 / 28.0'))
story.append(p('HKD/JPY = 13.0 代表日元大幅升值（1 港元僅兌 13 日元），對持有日元資產的投資者有利；HKD/JPY = 28.0 代表日元大幅貶值（1 港元可兌 28 日元），對投資者不利。7 個匯率級別覆蓋了從日元強勢到日元弱勢的完整光譜。'))

story.append(pl('<b>維度二：年房價變幅，4 級</b>'))
story.append(pl('-3.0% / 0% / +1.5% / +3.0%（每年複利計算）'))
story.append(p('年跌幅 3% 代表物業價格持續下行的壓力情景，年升幅 3% 代表物業價格穩健增長的樂觀情景。0% 和 +1.5% 則分別代表持平與溫和增長的中間情況。'))

story.append(pl('<b>維度三：持有年期，3 級</b>'))
story.append(pl('5 年 / 7 年 / 10 年'))
story.append(p('持有年期越長，租金累積越多，但同時匯率和房價的不確定性也越大。此外，不同持有年期的剩餘貸款金額不同——5 年後出售需償還較多剩餘貸款，10 年後則貸款已全部清償。'))

story.append(Spacer(1, 6))
story.append(callout('7 x 4 x 3 = 84 個情景，全面覆蓋匯率、房價與時間的交叉組合'))
story.append(Spacer(1, 6))

# ── For each holding period: heatmap + table ──
for yr_idx, years in enumerate(HOLD_YEARS):
    story.append(h2(f'3.{yr_idx+2} {years} 年持有期情景分析'))

    story.append(p(f'以下展示持有 {years} 年的全部 28 個情景（7 個匯率 x 4 個房價變幅）。熱力圖以顏色直觀顯示每個情景的淨回報：綠色代表盈利，紅色代表虧損，顏色越深代表數值越大。表格則列出每個情景的精確數值。'))

    # Heatmap chart
    chart_path = os.path.join(CHART_DIR, f'scenario_heatmap_{years}yr.png')
    if os.path.exists(chart_path):
        story.append(Spacer(1, 6))
        img_w = CW * 0.92
        img_h = img_w * 0.65
        story.append(Image(chart_path, width=img_w, height=img_h, hAlign='CENTER'))
        story.append(cap(f'圖 3-{yr_idx+1}：{years} 年持有期 28 情景淨回報熱力圖 (HKD萬)'))

    # Build scenario table
    rows = []
    for fx in FX_LEVELS:
        for pr in PRICE_RATES:
            s = calc_scenario(fx, pr, years)
            net_val = s['net']
            net_str = fmt_wan(net_val)
            final_val = EQUITY_HKD_WAN + net_val
            rows.append([
                f'{fx:.1f}',
                f'{pr*100:+.1f}%',
                net_str,
                f'HKD {final_val:.1f}萬',
            ])

    # Sub-tables: 4 rows per FX level (grouped by FX)
    # Show all 28 in one table
    tbl = make_highlight_table(
        ['HKD/JPY', '年房價變幅', '淨回報 (HKD)', '192萬變成'],
        rows,
        col_widths=[CW*0.18, CW*0.20, CW*0.30, CW*0.32],
        font_size=8.5
    )
    story.append(Spacer(1, 8))
    story.append(tbl)
    story.append(cap(f'表 3-{yr_idx+1}：{years} 年持有期全部 28 個情景淨回報 (HKD萬)'))

    # Summary stats for this holding period
    nets = [calc_scenario(fx, pr, years)['net'] for fx in FX_LEVELS for pr in PRICE_RATES]
    story.append(p(f'{years} 年持有期的 28 個情景中：淨回報最高為 <b>HKD {max(nets):.1f} 萬</b>（192 萬變成 HKD {EQUITY_HKD_WAN+max(nets):.1f} 萬），最低為 <b>HKD {min(nets):.1f} 萬</b>（192 萬變成 HKD {EQUITY_HKD_WAN+min(nets):.1f} 萬），簡單平均為 HKD {sum(nets)/len(nets):.1f} 萬。28 個情景中，盈利情景佔 {sum(1 for n in nets if n > 0)} 個（{sum(1 for n in nets if n > 0)/28*100:.0f}%），虧損情景佔 {sum(1 for n in nets if n <= 0)} 個（{sum(1 for n in nets if n <= 0)/28*100:.0f}%）。'))

    story.append(Spacer(1, 6))


# ═══════════════════════════════════════════════════════════════
# BUILD PDF
# ═══════════════════════════════════════════════════════════════
doc.build(story)
print(f'\nPDF generated: {OUT_PDF}')

# Also print summary
for years in HOLD_YEARS:
    nets = [calc_scenario(fx, pr, years)['net'] for fx in FX_LEVELS for pr in PRICE_RATES]
    print(f'{years}yr: best={max(nets):.1f}, worst={min(nets):.1f}, avg={sum(nets)/len(nets):.1f}, positive={sum(1 for n in nets if n>0)}/28')