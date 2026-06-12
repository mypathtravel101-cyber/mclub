# -*- coding: utf-8 -*-
import json, os, sys
PDF_SKILL_DIR = '/home/z/my-project/skills/pdf'
sys.path.insert(0, os.path.join(PDF_SKILL_DIR, 'scripts'))
from pdf import install_font_fallback

with open('/home/z/my-project/download/scenario_data.json') as f:
    data = json.load(f)
PM = data['params']
SC = data['scenarios']
HI = data['hist']
LB = data['loan_bal']

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY
from reportlab.lib import colors
from reportlab.platypus import (SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    Image, PageBreak, HRFlowable)
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase.pdfmetrics import registerFontFamily

pdfmetrics.registerFont(TTFont('MSYH', '/usr/share/fonts/truetype/chinese/SarasaMonoSC-SemiBold.ttf'))
pdfmetrics.registerFont(TTFont('SimHei', '/usr/share/fonts/truetype/chinese/SarasaMonoSC-Regular.ttf'))
pdfmetrics.registerFont(TTFont('Carlito', '/usr/share/fonts/truetype/english/Carlito-Regular.ttf'))
pdfmetrics.registerFont(TTFont('CarlitoB', '/usr/share/fonts/truetype/english/Carlito-Bold.ttf'))
registerFontFamily('MSYH', normal='MSYH', bold='MSYH')
registerFontFamily('SimHei', normal='SimHei', bold='MSYH')
registerFontFamily('Carlito', normal='Carlito', bold='CarlitoB')
install_font_fallback()

# Palette
HEADER_FILL = colors.HexColor('#655a3a')
TABLE_STRIPE = colors.HexColor('#f4f4f3')
ACCENT = colors.HexColor('#207591')
TEXT_PRIMARY = colors.HexColor('#262523')
TEXT_MUTED = colors.HexColor('#7b7972')
BORDER = colors.HexColor('#d5cfbe')
SEM_SUCCESS = colors.HexColor('#3b8754')
SEM_WARNING = colors.HexColor('#a5884e')
SEM_ERROR = colors.HexColor('#904c46')

W = A4[0] - 50*mm - 50*mm
sH1 = ParagraphStyle('H1', fontName='MSYH', fontSize=18, leading=26, textColor=TEXT_PRIMARY, spaceAfter=10, spaceBefore=16)
sH2 = ParagraphStyle('H2', fontName='MSYH', fontSize=13, leading=20, textColor=ACCENT, spaceAfter=8, spaceBefore=12)
sH3 = ParagraphStyle('H3', fontName='MSYH', fontSize=11, leading=16, textColor=TEXT_PRIMARY, spaceAfter=6, spaceBefore=8)
sBody = ParagraphStyle('Body', fontName='SimHei', fontSize=9.5, leading=16, textColor=TEXT_PRIMARY, alignment=TA_JUSTIFY, spaceAfter=6)
sMuted = ParagraphStyle('Muted', fontName='SimHei', fontSize=8.5, leading=13, textColor=TEXT_MUTED, spaceAfter=4)
sTH = ParagraphStyle('TH', fontName='SimHei', fontSize=8, leading=11, textColor=colors.white, alignment=TA_CENTER)
sTC = ParagraphStyle('TC', fontName='SimHei', fontSize=7.5, leading=11, textColor=TEXT_PRIMARY, alignment=TA_CENTER)
sTL = ParagraphStyle('TL', fontName='SimHei', fontSize=7.5, leading=11, textColor=TEXT_PRIMARY, alignment=TA_LEFT)

OUT = '/home/z/my-project/download'
PDF_PATH = f'{OUT}/japan_property_84scenario_report.pdf'

def P(text, style=sBody): return Paragraph(text, style)
def roi_color(v):
    if v >= 50: return SEM_SUCCESS
    if v >= 0: return SEM_WARNING
    return SEM_ERROR

def tbl_style(nrows):
    cmds = [
        ('BACKGROUND', (0, 0), (-1, -1), colors.white),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, TABLE_STRIPE]),
        ('GRID', (0, 0), (-1, -1), 0.3, BORDER),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('LEFTPADDING', (0, 0), (-1, -1), 4),
        ('RIGHTPADDING', (0, 0), (-1, -1), 4),
        ('BACKGROUND', (0, 0), (-1, 0), HEADER_FILL),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
    ]
    return TableStyle(cmds)

doc = SimpleDocTemplate(PDF_PATH, pagesize=A4,
    leftMargin=50*mm, rightMargin=50*mm, topMargin=40*mm, bottomMargin=40*mm,
    title='Japan Property Investment Risk Analysis', author='Z.ai', subject='84 Scenario Risk Model')

story = []

# ═══════ PAGE 1: Understanding Our Model ═══════
story.append(P('<b>1. Understanding Our Model</b>', sH1))
story.append(HRFlowable(width='100%', thickness=1, color=BORDER, spaceAfter=10))
story.append(P(
    'When you invest in Japanese property from Hong Kong, your final return depends on two fundamentally different types of factors. '
    'Our model separates all inputs into <b>Fixed Data</b> (known today) and <b>Variable Data</b> (unknown, scenario-tested). '
    'By testing all combinations systematically, we generate 84 distinct scenarios mapping the full range of possible outcomes.', sBody))

# Fixed data table
fd = [[P('Parameter', sTH), P('Value', sTH), P('Certainty', sTH)]]
for n, v, c in [
    ('Property Purchase Price', 'JPY 62,400,000', 'Known at purchase'),
    ('Loan-to-Value (LTV)', '40%', 'Set by lender'),
    ('Mortgage Interest Rate', '3.0% per annum', 'Fixed rate loan'),
    ('Loan Term', '15 years', 'Contractual'),
    ('Rental Yield', '6.0% gross', 'Based on comparable rents'),
    ('Annual Costs (Tax + Insurance)', '0.3% of property value', 'No management fee'),
]:
    fd.append([P(n, sTL), P(v, sTC), P(c, sTC)])
story.append(P('<b>Fixed Data (Known Today)</b>', sH3))
story.append(Table(fd, colWidths=[W*0.40, W*0.30, W*0.30]).setStyle(tbl_style(len(fd))))

story.append(Spacer(1, 8))
vd = [[P('Parameter', sTH), P('Status', sTH), P('Scenario Range', sTH)]]
for n, v, r in [
    ('Exit JPY/HKD Rate', 'Unknown', '7 levels: 13.0 - 28.0'),
    ('Exit Property Value', 'Unknown', '4 rates: -3% to +3%/year'),
    ('Holding Period', 'Flexible', '3 periods: 5, 7, 10 years'),
]:
    vd.append([P(n, sTL), P(v, sTC), P(r, sTC)])
story.append(P('<b>Variable Data (Unknown - Scenario Tested)</b>', sH3))
story.append(Table(vd, colWidths=[W*0.35, W*0.25, W*0.40]).setStyle(tbl_style(len(vd))))

story.append(Spacer(1, 8))
story.append(P(
    '<b>How the 84 scenarios work:</b> We combine 7 exit exchange rates (JPY strengthening 33% to weakening 44%), '
    '4 property price trajectories (-3% to +3% annual), and 3 holding periods (5, 7, 10 years) = 84 outcomes. '
    'Each outcome is measured in ROI (%) and absolute HKD gain/loss.', sBody))
story.append(P(
    '<b>Why no management fee?</b> This analysis assumes direct ownership where the investor handles property management. '
    'The only unavoidable costs are property tax and building insurance (0.3%/year). '
    'This significantly improves net cashflow compared to fund-based investments.', sBody))

# ═══════ PAGE 2: Investment Parameters ═══════
story.append(PageBreak())
story.append(P('<b>2. Your Investment Parameters</b>', sH1))
story.append(HRFlowable(width='100%', thickness=1, color=BORDER, spaceAfter=10))
story.append(P(
    'The property is located in the Ten-no-Chaya area of Osaka. Below are the fixed financial parameters forming the base of our 84-scenario model.', sBody))

sd = [
    [P('Property Purchase Price', sTL), P('JPY 62,400,000', sTC)],
    [P('Entry Exchange Rate', sTL), P('19.5 JPY/HKD', sTC)],
    [P('Property Value in HKD', sTL), P(f'HKD {PM["price_jpy"]/PM["entry_fx"]/1e4:.1f}M', sTC)],
    [P('Loan Amount (40% LTV)', sTL), P(f'JPY {PM["loan_jpy"]/1e4:,.0f} wan', sTC)],
    [P('Your Equity (Down Payment)', sTL), P(f'JPY {PM["eq_jpy"]/1e4:,.0f} wan = HKD {PM["eq_hkd"]/1e4:.2f}M', sTC)],
    [P('Mortgage Rate', sTL), P('3.0% p.a. (fixed)', sTC)],
    [P('Loan Term', sTL), P('15 years', sTC)],
    [P('Monthly Mortgage', sTL), P(f'JPY {PM["monthly_payment"]:,.0f}', sTC)],
    [P('Annual Mortgage', sTL), P(f'JPY {PM["annual_mortgage"]/1e6:.2f}M', sTC)],
]
st2 = Table(sd, colWidths=[W*0.55, W*0.45])
st2.setStyle(tbl_style(len(sd)))
story.append(st2)

story.append(Spacer(1, 10))
story.append(P('<b>Annual Cashflow Breakdown</b>', sH2))
cf = [
    [P('Item', sTH), P('Annual (JPY)', sTH), P('Notes', sTH)],
    [P('Gross Rental Income', sTL), P(f'JPY {PM["annual_rental"]/1e6:.2f}M', sTC), P('6.0% yield', sTL)],
    [P('Less: Tax + Insurance', sTL), P(f'- JPY {PM["annual_costs"]/1e6:.3f}M', sTC), P('0.3% of value', sTL)],
    [P('Net Rental (pre-mortgage)', sTL), P(f'JPY {PM["annual_net_rental"]/1e6:.2f}M', sTC), P('', sTL)],
    [P('Less: Mortgage Payment', sTL), P(f'- JPY {PM["annual_mortgage"]/1e6:.2f}M', sTC), P('3.0%, 15yr', sTL)],
    [P('<b>Net Annual Cashflow</b>', sTL), P(f'<b>JPY {PM["annual_cashflow"]/1e6:.2f}M</b>', sTC), P('Positive cashflow', sTL)],
]
story.append(Table(cf, colWidths=[W*0.35, W*0.30, W*0.35]).setStyle(tbl_style(len(cf))))

story.append(Spacer(1, 10))
story.append(P('<b>Loan Balance at Exit</b>', sH2))
lb_data = [[P('Holding', sTH), P('Loan Balance', sTH), P('Paid Down', sTH)]]
for t in [5, 7, 10]:
    b = LB[str(t)]; p = PM['loan_jpy'] - b
    lb_data.append([P(f'{t} Years', sTC), P(f'JPY {b/1e6:.1f}M', sTC), P(f'JPY {p/1e6:.1f}M ({p/PM["loan_jpy"]*100:.0f}%)', sTC)])
story.append(Table(lb_data, colWidths=[W*0.25, W*0.35, W*0.40]).setStyle(tbl_style(len(lb_data))))

# ═══════ PAGE 3: Market Variables ═══════
story.append(PageBreak())
story.append(P('<b>3. Market Variables: The Two Unknowns</b>', sH1))
story.append(HRFlowable(width='100%', thickness=1, color=BORDER, spaceAfter=10))

story.append(P('<b>3.1 Exchange Rate Scenarios (JPY/HKD)</b>', sH2))
story.append(P(
    'The current JPY/HKD rate is ~19.5. Over 30 years, it ranged from 622 (1998, JPY very strong) to 1,181 (2024, JPY very weak). '
    'Our 7 scenarios cover JPY strengthening 33% (rate=13.0) to weakening 44% (rate=28.0).', sBody))

fx_rows = [[P('Scenario', sTH), P('Exit Rate', sTH), P('FX Change', sTH), P('Impact on HKD Investor', sTH)]]
for desc, rate, chg, imp in [
    ('JPY Strengthens Significantly', '13.0', '+33.0%', 'Highly negative'),
    ('JPY Strengthens', '15.0', '+23.1%', 'Negative'),
    ('JPY Moderately Strengthens', '17.0', '+12.8%', 'Slightly negative'),
    ('No Change (Base)', '19.5', '0.0%', 'Neutral'),
    ('JPY Moderately Weakens', '22.0', '-12.8%', 'Slightly positive'),
    ('JPY Weakens', '25.0', '-28.2%', 'Positive'),
    ('JPY Weakens Significantly', '28.0', '-43.6%', 'Highly positive'),
]:
    fx_rows.append([P(desc, sTL), P(rate, sTC), P(chg, sTC), P(imp, sTL)])
story.append(Table(fx_rows, colWidths=[W*0.30, W*0.14, W*0.14, W*0.42]).setStyle(tbl_style(len(fx_rows))))

story.append(Spacer(1, 10))
story.append(P('<b>3.2 Property Price Scenarios</b>', sH2))
story.append(P(
    'Japan property has seen dramatic cycles: post-bubble decline (1990s-2000s), stagnation, then urban recovery (2012-present). '
    'We test 4 annualized rates from -3%/yr (1995-2005 national) to +3%/yr (2015-2025 Tokyo/Osaka trend).', sBody))

pr_rows = [[P('Annual Rate', sTH), P('5yr Total', sTH), P('7yr Total', sTH), P('10yr Total', sTH), P('Historical Precedent', sTH)]]
for rate, t5, t7, t10, h in [
    (-3, -14.0, -19.3, -26.3, '1995-2005 national decline'),
    (-1, -4.9, -6.7, -9.6, '2005-2015 stagnation'),
    (1, 5.1, 7.2, 10.5, 'Conservative urban recovery'),
    (3, 15.9, 23.0, 34.4, '2015-2025 Osaka/Tokyo boom'),
]:
    pr_rows.append([P(f'{rate:+d}%/yr', sTC), P(f'{t5:+.1f}%', sTC), P(f'{t7:+.1f}%', sTC), P(f'{t10:+.1f}%', sTC), P(h, sTL)])
story.append(Table(pr_rows, colWidths=[W*0.14, W*0.14, W*0.14, W*0.16, W*0.42]).setStyle(tbl_style(len(pr_rows))))

# ═══════ PAGES 4-5: 84 Scenario Results ═══════
story.append(PageBreak())
story.append(P('<b>4. 84 Scenario Results</b>', sH1))
story.append(HRFlowable(width='100%', thickness=1, color=BORDER, spaceAfter=10))
story.append(P(
    'Each cell shows ROI (%) and HKD gain/loss for your HKD {:.2f}M equity investment. '
    'Green = positive, yellow = modest, red = loss.'.format(PM['eq_hkd']/1e6), sBody))

FXS = [13.0, 15.0, 17.0, 19.5, 22.0, 25.0, 28.0]
PAS = [-0.03, -0.01, 0.01, 0.03]

for hold_t in [5, 7, 10]:
    story.append(P(f'<b>4.{[5,7,10].index(hold_t)+1} Holding: {hold_t} Years</b>', sH2))
    hdr = [P('Prop \\ FX', sTH)] + [P(f'{fx:.1f}', sTH) for fx in FXS]
    rows = [hdr]
    for pa in PAS:
        row = [P(f'{pa*100:+.0f}%/yr', sTC)]
        for fx in FXS:
            s = next(x for x in SC if x['fx']==fx and abs(x['pa']-pa)<0.001 and x['t']==hold_t)
            roi = s['roi']; g = s['gain']
            clr = colors.white if roi < 0 or roi > 100 else TEXT_PRIMARY
            cs = ParagraphStyle('cc', parent=sTC, textColor=clr)
            row.append(P(f'{roi:+.0f}%<br/>{g/1e4:+.0f}k', cs))
        rows.append(row)
    
    cw = [W*0.13] + [W*0.124]*7
    tbl = Table(rows, colWidths=cw)
    sc = [
        ('BACKGROUND', (0, 0), (-1, 0), HEADER_FILL),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('GRID', (0, 0), (-1, -1), 0.3, BORDER),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        ('LEFTPADDING', (0, 0), (-1, -1), 2),
        ('RIGHTPADDING', (0, 0), (-1, -1), 2),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, TABLE_STRIPE]),
    ]
    for i, pa in enumerate(PAS):
        for j, fx in enumerate(FXS):
            s = next(x for x in SC if x['fx']==fx and abs(x['pa']-pa)<0.001 and x['t']==hold_t)
            if s['roi'] >= 50: bg = colors.HexColor('#e8f5e9')
            elif s['roi'] >= 0: bg = colors.HexColor('#fff8e1')
            else: bg = colors.HexColor('#fde8e8')
            sc.append(('BACKGROUND', (j+1, i+1), (j+1, i+1), bg))
    tbl.setStyle(TableStyle(sc))
    story.append(tbl)
    story.append(Spacer(1, 6))

# Heatmap
story.append(PageBreak())
story.append(P('<b>4.4 Visual: 10-Year ROI Heatmap</b>', sH2))
story.append(P(
    'Exchange rate (horizontal) dominates the outcome. Even with falling property prices, a weaker JPY at exit '
    'can produce strong positive returns. The red zone (top-left) only occurs when JPY strengthens significantly '
    'AND property falls simultaneously - a rare combination historically.', sBody))
img_path = f'{OUT}/chart_heatmap.png'
if os.path.exists(img_path):
    story.append(Image(img_path, width=W, height=W*0.38))

# ═══════ PAGE 6-7: 30-Year Historical Summary (IMPROVED) ═══════
story.append(PageBreak())
story.append(P('<b>5. Historical Evidence: 30-Year Summary</b>', sH1))
story.append(HRFlowable(width='100%', thickness=1, color=BORDER, spaceAfter=10))

story.append(P(
    'We analyzed every rolling 10-year window from 1995 to 2025 (16 periods total) to identify the actual worst, '
    'average, and best outcomes that historically occurred. By applying those exact FX and property changes to our model, '
    'we can show what your HKD {:.2f}M investment would have returned under real historical conditions.'.format(PM['eq_hkd']/1e6), sBody))

# History chart
img_hist = f'{OUT}/chart_history.png'
if os.path.exists(img_hist):
    story.append(Image(img_hist, width=W, height=W*0.42))
story.append(Spacer(1, 6))

# 30-year cumulative
story.append(P('<b>5.1 30-Year Cumulative Changes</b>', sH2))
h30 = [
    [P('Metric', sTH), P('1995 Level', sTH), P('2025 Level', sTH), P('30yr Change', sTH)],
    [P('JPY/HKD Rate', sTL), P('733', sTC), P(f'{149.67*7.80:.0f}', sTC), P(f'{PM["fx_30yr_pct"]:+.1f}%', sTC)],
    [P('Residential Property (2015=100)', sTL), P('145.0', sTC), P('136.0', sTC), P(f'{PM["pr_30yr_pct"]:+.1f}%', sTC)],
]
story.append(Table(h30, colWidths=[W*0.35, W*0.20, W*0.20, W*0.25]).setStyle(tbl_style(len(h30))))

story.append(Spacer(1, 8))
story.append(P(
    'Over 30 years, JPY/HKD rose from 733 to 1,167 (+59.2%), meaning JPY weakened substantially against HKD. '
    'For HKD investors, this long-term JPY weakening trend is a powerful tailwind: when you sell Japanese assets '
    'and convert back to HKD, each yen is worth more HKD than when you invested. '
    'Property prices nationally declined -6.2% over the same period, but urban Osaka/Tokyo significantly outperformed '
    'the national average, with cumulative gains of 30-40% in prime areas since 2012.', sBody))

# Summary chart
story.append(PageBreak())
story.append(P('<b>5.2 Historical 10-Year Scenarios: Visual Summary</b>', sH2))
story.append(P(
    'The left chart shows the actual 10-year FX and property changes from historical data (worst, average, best). '
    'The right chart translates those changes into your specific investment return, measured in both ROI% and HKD.', sBody))
img_sum = f'{OUT}/chart_summary.png'
if os.path.exists(img_sum):
    story.append(Image(img_sum, width=W, height=W*0.40))

# ═══════ KEY TABLE: 3-Scenario Summary ═══════
story.append(Spacer(1, 10))
story.append(P('<b>5.3 Your Investment: 3 Historical Scenarios (10-Year Holding)</b>', sH2))
story.append(P(
    'The table below applies the exact historical 10-year changes to your HKD {:.2f}M equity investment. '
    'This shows what you would have actually earned or lost if you had invested under those conditions.'.format(PM['eq_hkd']/1e6), sBody))

hw = HI['worst']; ha = HI['avg']; hb = HI['best']

# Big impact table
sc3 = [
    [P('', sTH), P('Worst Case', sTH), P('Average Case', sTH), P('Best Case', sTH)],
    [P('<b>Historical Period (FX)</b>', sTL),
     P(f'{PM["fx_worst10_yr"]}', sTC),
     P('Average of 16 periods', sTC),
     P(f'{PM["fx_best10_yr"]}', sTC)],
    [P('<b>Historical Period (Property)</b>', sTL),
     P(f'{PM["pr_worst10_yr"]}', sTC),
     P('Average of 16 periods', sTC),
     P(f'{PM["pr_best10_yr"]}', sTC)],
    [P('<b>FX 10-Year Change</b>', sTL),
     P(f'{hw["fx_pct"]:+.1f}%', ParagraphStyle('rw', parent=sTC, textColor=SEM_ERROR)),
     P(f'{ha["fx_pct"]:+.1f}%', ParagraphStyle('ra', parent=sTC, textColor=SEM_WARNING)),
     P(f'{hb["fx_pct"]:+.1f}%', ParagraphStyle('rb', parent=sTC, textColor=SEM_SUCCESS))],
    [P('<b>Property 10-Year Change</b>', sTL),
     P(f'{hw["pr_pct"]:+.1f}%', ParagraphStyle('pw', parent=sTC, textColor=SEM_ERROR)),
     P(f'{ha["pr_pct"]:+.1f}%', ParagraphStyle('pa', parent=sTC, textColor=SEM_WARNING)),
     P(f'{hb["pr_pct"]:+.1f}%', ParagraphStyle('pb', parent=sTC, textColor=SEM_SUCCESS))],
    [P('<b>Exit Property Value</b>', sTL),
     P(f'JPY {hw["ev"]/1e6:.1f}M', sTC),
     P(f'JPY {ha["ev"]/1e6:.1f}M', sTC),
     P(f'JPY {hb["ev"]/1e6:.1f}M', sTC)],
    [P('<b>Outstanding Loan at Exit</b>', sTL),
     P(f'JPY {hw["bl"]/1e6:.1f}M', sTC),
     P(f'JPY {ha["bl"]/1e6:.1f}M', sTC),
     P(f'JPY {hb["bl"]/1e6:.1f}M', sTC)],
    [P('<b>Net Exit Proceeds (JPY)</b>', sTL),
     P(f'JPY {hw["ne"]/1e6:.1f}M', sTC),
     P(f'JPY {ha["ne"]/1e6:.1f}M', sTC),
     P(f'JPY {hb["ne"]/1e6:.1f}M', sTC)],
    [P('<b>Accumulated Rental (10yr)</b>', sTL),
     P(f'JPY {hw["ar"]/1e6:.1f}M', sTC),
     P(f'JPY {ha["ar"]/1e6:.1f}M', sTC),
     P(f'JPY {hb["ar"]/1e6:.1f}M', sTC)],
    [P('<b>Total Return (HKD)</b>', sTL),
     P(f'HKD {hw["th"]/1e4:.1f}M', ParagraphStyle('tw', parent=sTC, textColor=SEM_ERROR)),
     P(f'HKD {ha["th"]/1e4:.1f}M', ParagraphStyle('ta', parent=sTC, textColor=SEM_WARNING)),
     P(f'HKD {hb["th"]/1e4:.1f}M', ParagraphStyle('tb', parent=sTC, textColor=SEM_SUCCESS))],
    [P('<b>ROI on Equity</b>', sTL),
     P(f'<b>{hw["roi"]:+.1f}%</b>', ParagraphStyle('r1', parent=sTC, textColor=SEM_ERROR, fontSize=10)),
     P(f'<b>{ha["roi"]:+.1f}%</b>', ParagraphStyle('r2', parent=sTC, textColor=SEM_WARNING, fontSize=10)),
     P(f'<b>{hb["roi"]:+.1f}%</b>', ParagraphStyle('r3', parent=sTC, textColor=SEM_SUCCESS, fontSize=10))],
    [P('<b>HKD Gain / Loss</b>', sTL),
     P(f'<b>{hw["gain"]/1e4:+.0f} wan</b>', ParagraphStyle('g1', parent=sTC, textColor=SEM_ERROR, fontSize=10)),
     P(f'<b>{ha["gain"]/1e4:+.0f} wan</b>', ParagraphStyle('g2', parent=sTC, textColor=SEM_WARNING, fontSize=10)),
     P(f'<b>{hb["gain"]/1e4:+.0f} wan</b>', ParagraphStyle('g3', parent=sTC, textColor=SEM_SUCCESS, fontSize=10))],
]

cw3 = [W*0.28, W*0.24, W*0.24, W*0.24]
t3 = Table(sc3, colWidths=cw3)
t3_style = tbl_style(len(sc3))
# Color the column headers
t3_style.add('BACKGROUND', (1, 0), (1, 0), SEM_ERROR)
t3_style.add('BACKGROUND', (2, 0), (2, 0), SEM_WARNING)
t3_style.add('BACKGROUND', (3, 0), (3, 0), SEM_SUCCESS)
t3.setStyle(t3_style)
story.append(t3)

story.append(Spacer(1, 10))
story.append(P(
    '<b>Key insight:</b> Even in the worst historical 10-year period (JPY weakening 64.7% + property falling 40.0%), '
    'the loss is -30.7% (-HKD {:.0f} wan), cushioned by JPY {:.1f}M accumulated positive rental income. '
    'The average scenario returns +{:.1f}% (+HKD {:.0f} wan), nearly doubling your equity. '
    'The best scenario delivers +{:.1f}% (+HKD {:.0f} wan), a 4x return on your original investment.'.format(
        abs(hw['gain']/1e4), hw['ar']/1e6, ha['roi'], ha['gain']/1e4, hb['roi'], hb['gain']/1e4), sBody))

# ═══════ PAGE 8: Risk Scorecard ═══════
story.append(PageBreak())
story.append(P('<b>6. Risk Scorecard</b>', sH1))
story.append(HRFlowable(width='100%', thickness=1, color=BORDER, spaceAfter=10))

risk = [
    [P('Risk Category', sTH), P('Rating', sTH), P('Assessment', sTH)],
    [P('<b>FX Risk</b>', sTL),
     P('MEDIUM', ParagraphStyle('rm', parent=sTC, textColor=SEM_WARNING)),
     P('30yr trend: JPY weakened 59% vs HKD (favorable). Short-term: BOJ at 0.75% may strengthen JPY. '
       'Medium-term fiscal pressure favors HKD investors. Tested across 7 exit rates.', sTL)],
    [P('<b>Property Value Risk</b>', sTL),
     P('LOW-MED', ParagraphStyle('rp', parent=sTC, textColor=SEM_SUCCESS)),
     P('Osaka urban recovery strong since 2012. Foreign investment at record levels. '
       'Expo 2025 infrastructure supports growth. National decline masks urban outperformance.', sTL)],
    [P('<b>Liquidity Risk</b>', sTL),
     P('LOW', ParagraphStyle('rl', parent=sTC, textColor=SEM_SUCCESS)),
     P('Urban Osaka: 2-4 months to sell. No capital controls. FEFTA (April 2026) adds admin steps only.', sTL)],
    [P('<b>Policy Risk</b>', sTL),
     P('MEDIUM', ParagraphStyle('r2', parent=sTC, textColor=SEM_WARNING)),
     P('FEFTA filing from April 2026. BOJ rate increases possible. No active property tax reform proposals.', sTL)],
    [P('<b>Rental Income Risk</b>', sTL),
     P('LOW', ParagraphStyle('r3', parent=sTC, textColor=SEM_SUCCESS)),
     P('Osaka vacancy <5%. 6% yield conservative. Even -20% rent cut still positive cashflow after mortgage.', sTL)],
]
story.append(Table(risk, colWidths=[W*0.16, W*0.10, W*0.74]).setStyle(tbl_style(len(risk))))

story.append(Spacer(1, 12))
story.append(P('<b>Statistical Summary (All 84 Scenarios)</b>', sH2))
all_rois = [s['roi'] for s in SC]
all_gains = [s['gain'] for s in SC]
neg = sum(1 for r in all_rois if r < 0)
pos = sum(1 for r in all_rois if r >= 0)
sr = sorted(all_rois)
sg = sorted(all_gains)

stats = [
    [P('Statistic', sTH), P('ROI (%)', sTH), P('HKD Gain/Loss', sTH)],
    [P('Minimum (Worst)', sTL), P(f'{sr[0]:+.1f}%', sTC), P(f'{sg[0]/1e4:+.0f} wan', sTC)],
    [P('25th Percentile', sTL), P(f'{sr[len(sr)//4]:+.1f}%', sTC), P(f'{sg[len(sg)//4]/1e4:+.0f} wan', sTC)],
    [P('Median', sTL), P(f'{sr[len(sr)//2]:+.1f}%', sTC), P(f'{sg[len(sg)//2]/1e4:+.0f} wan', sTC)],
    [P('75th Percentile', sTL), P(f'{sr[3*len(sr)//4]:+.1f}%', sTC), P(f'{sg[3*len(sg)//4]/1e4:+.0f} wan', sTC)],
    [P('Maximum (Best)', sTL), P(f'{sr[-1]:+.1f}%', sTC), P(f'{sg[-1]/1e4:+.0f} wan', sTC)],
    [P('Positive Scenarios', sTL), P(f'{pos}/84 ({pos/84*100:.0f}%)', sTC), P('', sTC)],
    [P('Negative Scenarios', sTL), P(f'{neg}/84 ({neg/84*100:.0f}%)', sTC), P('', sTC)],
]
story.append(Table(stats, colWidths=[W*0.30, W*0.35, W*0.35]).setStyle(tbl_style(len(stats))))

story.append(Spacer(1, 12))
story.append(P('<b>Bottom Line</b>', sH2))
story.append(P(
    '{:.0f}% of 84 scenarios produce positive returns. Historical average scenario: +{:.1f}% ROI. '
    'Worst historical 10-year: -{:.1f}% (contained by positive cashflow). '
    'The key risk is short-term JPY strength from BOJ tightening; investors with 7-10 year horizons '
    'are well-positioned to capture rental income and FX tailwinds.'.format(
        pos/84*100, ha['roi'], abs(hw['roi'])), sBody))

doc.build(story)
print(f"Body PDF: {PDF_PATH}")
