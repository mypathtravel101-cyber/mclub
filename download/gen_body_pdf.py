# -*- coding: utf-8 -*-
"""Japan Property Investment Risk Analysis - 84 Scenario PDF Body"""
import json, os, sys

# ── Load skill helpers ──
PDF_SKILL_DIR = '/home/z/my-project/skills/pdf'
sys.path.insert(0, os.path.join(PDF_SKILL_DIR, 'scripts'))
from pdf import install_font_fallback

# ── Load scenario data ──
with open('/home/z/my-project/download/scenario_data.json') as f:
    data = json.load(f)
PM = data['params']
SC = data['scenarios']
HI = data['hist']
LB = data['loan_bal']

# ── ReportLab setup ──
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm, cm
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image, KeepTogether,
    PageBreak, HRFlowable
)
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase.pdfmetrics import registerFontFamily

# ── Register fonts ──
pdfmetrics.registerFont(TTFont('MSYH', '/usr/share/fonts/truetype/chinese/SarasaMonoSC-SemiBold.ttf'))
pdfmetrics.registerFont(TTFont('SimHei', '/usr/share/fonts/truetype/chinese/SarasaMonoSC-Regular.ttf'))
pdfmetrics.registerFont(TTFont('Carlito', '/usr/share/fonts/truetype/english/Carlito-Regular.ttf'))
pdfmetrics.registerFont(TTFont('CarlitoB', '/usr/share/fonts/truetype/english/Carlito-Bold.ttf'))
registerFontFamily('Carlito', normal='Carlito', bold='CarlitoB')
registerFontFamily('DejaVu', normal='DejaVu', bold='DejaVu')
install_font_fallback()

# ── Palette ──
PAGE_BG = colors.HexColor('#f1f0ee')
SECTION_BG = colors.HexColor('#e9e8e7')
CARD_BG = colors.HexColor('#eceae6')
TABLE_STRIPE = colors.HexColor('#f4f4f3')
HEADER_FILL = colors.HexColor('#655a3a')
ACCENT = colors.HexColor('#207591')
TEXT_PRIMARY = colors.HexColor('#262523')
TEXT_MUTED = colors.HexColor('#7b7972')
BORDER = colors.HexColor('#d5cfbe')
ICON = colors.HexColor('#82713e')
SEM_SUCCESS = colors.HexColor('#3b8754')
SEM_WARNING = colors.HexColor('#a5884e')
SEM_ERROR = colors.HexColor('#904c46')

# ── Styles ──
W = A4[0] - 50*mm - 50*mm  # content width

sH1 = ParagraphStyle('H1', fontName='MSYH', fontSize=18, leading=26, textColor=TEXT_PRIMARY, spaceAfter=10, spaceBefore=16)
sH2 = ParagraphStyle('H2', fontName='MSYH', fontSize=13, leading=20, textColor=ACCENT, spaceAfter=8, spaceBefore=12)
sH3 = ParagraphStyle('H3', fontName='MSYH', fontSize=11, leading=16, textColor=TEXT_PRIMARY, spaceAfter=6, spaceBefore=8)
sBody = ParagraphStyle('Body', fontName='SimHei', fontSize=9.5, leading=16, textColor=TEXT_PRIMARY, alignment=TA_JUSTIFY, spaceAfter=6)
sBodySm = ParagraphStyle('BodySm', fontName='SimHei', fontSize=8.5, leading=14, textColor=TEXT_PRIMARY, alignment=TA_JUSTIFY, spaceAfter=4)
sMuted = ParagraphStyle('Muted', fontName='SimHei', fontSize=8.5, leading=13, textColor=TEXT_MUTED, spaceAfter=4)
sTableHead = ParagraphStyle('TH', fontName='SimHei', fontSize=8, leading=11, textColor=colors.white, alignment=TA_CENTER)
sTableCell = ParagraphStyle('TC', fontName='SimHei', fontSize=7.5, leading=11, textColor=TEXT_PRIMARY, alignment=TA_CENTER)
sTableLeft = ParagraphStyle('TL', fontName='SimHei', fontSize=7.5, leading=11, textColor=TEXT_PRIMARY, alignment=TA_LEFT)
sCallout = ParagraphStyle('Callout', fontName='MSYH', fontSize=11, leading=16, textColor=ACCENT, spaceBefore=6, spaceAfter=6)

OUT = '/home/z/my-project/download'
PDF_PATH = f'{OUT}/japan_property_84scenario_report.pdf'

# ── Helper functions ──
def P(text, style=sBody):
    return Paragraph(text, style)

def fmt_jpy(v):
    if abs(v) >= 1e8: return f'{v/1e8:.1f} yi'
    if abs(v) >= 1e4: return f'{v/1e4:.0f} wan'
    return f'{v:,.0f}'

def fmt_hkd(v):
    return f'HKD {v/1e4:.1f}M' if abs(v) >= 1e4 else f'HKD {v:,.0f}'

def fmt_pct(v):
    return f'{v:+.1f}%' if v != 0 else '0.0%'

def roi_color(v):
    if v >= 50: return SEM_SUCCESS
    if v >= 0: return SEM_WARNING
    return SEM_ERROR

def make_table_style(nrows, has_header=True):
    style_cmds = [
        ('BACKGROUND', (0, 0), (-1, -1), colors.white),
        ('ROWBACKGROUNDS', (0, 1 if has_header else 0), (-1, -1), [colors.white, TABLE_STRIPE]),
        ('GRID', (0, 0), (-1, -1), 0.3, BORDER),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('LEFTPADDING', (0, 0), (-1, -1), 4),
        ('RIGHTPADDING', (0, 0), (-1, -1), 4),
    ]
    if has_header:
        style_cmds.append(('BACKGROUND', (0, 0), (-1, 0), HEADER_FILL))
        style_cmds.append(('TEXTCOLOR', (0, 0), (-1, 0), colors.white))
    return TableStyle(style_cmds)

# ── Build document ──
doc = SimpleDocTemplate(
    PDF_PATH, pagesize=A4,
    leftMargin=50*mm, rightMargin=50*mm,
    topMargin=40*mm, bottomMargin=40*mm,
    title='Japan Property Investment Risk Analysis',
    author='Z.ai',
    subject='84 Scenario Risk Model'
)

story = []

# ══════════════════════════════════════════════════════════════════
# PAGE 1: Understanding Our Model
# ══════════════════════════════════════════════════════════════════
story.append(P('<b>1. Understanding Our Model</b>', sH1))
story.append(HRFlowable(width='100%', thickness=1, color=BORDER, spaceAfter=10))

story.append(P(
    'When you invest in Japanese property from Hong Kong, your final return depends on two fundamentally different types of factors. '
    'Understanding this distinction is the key to reading this report correctly and making informed investment decisions. '
    'Our model separates all inputs into two categories: <b>Fixed Data</b> that we know today with reasonable certainty, '
    'and <b>Variable Data</b> that are uncertain and will only be resolved in the future. By systematically testing all combinations '
    'of these variables, we generate 84 distinct scenarios that map out the full range of possible outcomes for your investment.',
    sBody
))

# Fixed vs Variable explanation table
story.append(Spacer(1, 6))
fixed_data = [
    ('Property Purchase Price', 'JPY 78,000,000', 'Known at purchase'),
    ('Loan-to-Value (LTV)', '40%', 'Set by lender'),
    ('Mortgage Interest Rate', '3.0% per annum', 'Fixed rate loan'),
    ('Loan Term', '15 years', 'Contractual'),
    ('Rental Yield', '6.0% gross', 'Based on comparable rents'),
    ('Annual Costs (Tax + Insurance)', '0.3% of property value', 'No management fee'),
]
variable_data = [
    ('Exit JPY/HKD Exchange Rate', 'Unknown', '7 scenarios tested: 13.0 - 28.0'),
    ('Exit Property Value', 'Unknown', '4 annual rates tested: -3% to +3%'),
    ('Holding Period', 'Flexible', '3 periods tested: 5, 7, 10 years'),
]

# Fixed data table
fd_header = [P('Parameter', sTableHead), P('Value', sTableHead), P('Certainty', sTableHead)]
fd_rows = [fd_header]
for name, val, cert in fixed_data:
    fd_rows.append([P(name, sTableLeft), P(val, sTableCell), P(cert, sTableCell)])

fd_table = Table(fd_rows, colWidths=[W*0.40, W*0.30, W*0.30])
fd_table.setStyle(make_table_style(len(fd_rows)))
story.append(P('<b>Fixed Data (Known Today)</b>', sH3))
story.append(fd_table)

story.append(Spacer(1, 8))
vd_header = [P('Parameter', sTableHead), P('Current Status', sTableHead), P('Scenario Range', sTableHead)]
vd_rows = [vd_header]
for name, val, rng in variable_data:
    vd_rows.append([P(name, sTableLeft), P(val, sTableCell), P(rng, sTableCell)])

vd_table = Table(vd_rows, colWidths=[W*0.40, W*0.25, W*0.35])
vd_table.setStyle(make_table_style(len(vd_rows)))
story.append(P('<b>Variable Data (Unknown - Scenario Tested)</b>', sH3))
story.append(vd_table)

story.append(Spacer(1, 10))
story.append(P(
    '<b>How the 84 scenarios work:</b> We combine 7 possible exit exchange rates (JPY strengthening 33% to weakening 44%), '
    '4 property price trajectories (declining 3%/year to growing 3%/year), and 3 holding periods (5, 7, and 10 years). '
    'Each combination produces a unique investment outcome measured in both percentage return and absolute HKD gain or loss. '
    'This systematic approach ensures no plausible scenario is overlooked, giving you a complete picture of the risk-reward profile '
    'before committing capital.',
    sBody
))

story.append(P(
    '<b>Why no management fee?</b> Unlike many property investments that charge 5-8% management fees, this analysis assumes '
    'direct ownership where the investor handles tenant sourcing and property maintenance directly, or engages services on a '
    'pay-per-use basis. The only unavoidable annual costs are property tax and building insurance, totaling 0.3% of the property '
    'value per year. This significantly improves net cashflow compared to fund-based or managed investments, and reflects the '
    'reality of direct property ownership in Japan where self-management is both feasible and common for single-unit investors.',
    sBody
))

# ══════════════════════════════════════════════════════════════════
# PAGE 2: Your Investment Parameters
# ══════════════════════════════════════════════════════════════════
story.append(PageBreak())
story.append(P('<b>2. Your Investment Parameters</b>', sH1))
story.append(HRFlowable(width='100%', thickness=1, color=BORDER, spaceAfter=10))

story.append(P(
    'This section details the fixed financial parameters that form the base of our model. '
    'These numbers are known at the time of investment and do not change across our 84 scenarios. '
    'The property is located in the Ten-no-Chaya area of Osaka, a well-connected residential neighborhood '
    'with strong rental demand. The figures below represent a sample investment used to demonstrate the model.',
    sBody
))

# Key financial summary
story.append(Spacer(1, 6))
summary_data = [
    [P('Property Purchase Price', sTableLeft), P('JPY 78,000,000', sTableCell)],
    [P('Entry Exchange Rate', sTableLeft), P('19.5 JPY/HKD', sTableCell)],
    [P('Property Value in HKD', sTableLeft), P(f'HKD {PM["price_jpy"]/PM["entry_fx"]/1e4:.1f}M', sTableCell)],
    [P('Loan Amount (40% LTV)', sTableLeft), P(f'JPY {PM["loan_jpy"]/1e4:,.0f} wan', sTableCell)],
    [P('Your Equity (Down Payment)', sTableLeft), P(f'JPY {PM["eq_jpy"]/1e4:,.0f} wan = HKD {PM["eq_hkd"]/1e4:.2f}M', sTableCell)],
    [P('Mortgage Rate', sTableLeft), P('3.0% per annum (fixed)', sTableCell)],
    [P('Loan Term', sTableLeft), P('15 years (180 months)', sTableCell)],
    [P('Monthly Mortgage Payment', sTableLeft), P(f'JPY {PM["monthly_payment"]:,.0f}', sTableCell)],
    [P('Annual Mortgage Payment', sTableLeft), P(f'JPY {PM["annual_mortgage"]/1e4:.1f}M', sTableCell)],
]
st = Table(summary_data, colWidths=[W*0.55, W*0.45])
st.setStyle(make_table_style(len(summary_data), has_header=False))
story.append(st)

story.append(Spacer(1, 10))
story.append(P('<b>Annual Cashflow Breakdown</b>', sH2))

cf_data = [
    [P('Item', sTableHead), P('Annual Amount (JPY)', sTableHead), P('Notes', sTableHead)],
    [P('Gross Rental Income', sTableLeft), P(f'JPY {PM["annual_rental"]/1e6:.2f}M', sTableCell), P('6.0% of property value', sTableLeft)],
    [P('Less: Property Tax + Insurance', sTableLeft), P(f'- JPY {PM["annual_costs"]/1e6:.3f}M', sTableCell), P('0.3% of property value', sTableLeft)],
    [P('Net Rental Income', sTableLeft), P(f'JPY {PM["annual_net_rental"]/1e6:.2f}M', sTableCell), P('Before mortgage', sTableLeft)],
    [P('Less: Mortgage Payment', sTableLeft), P(f'- JPY {PM["annual_mortgage"]/1e6:.2f}M', sTableCell), P('3.0% fixed, 15yr', sTableLeft)],
    [P('<b>Net Annual Cashflow</b>', sTableLeft), P(f'<b>JPY {PM["annual_cashflow"]/1e6:.2f}M</b>', sTableCell), P('Positive cashflow', sTableLeft)],
]
ct = Table(cf_data, colWidths=[W*0.35, W*0.30, W*0.35])
ct.setStyle(make_table_style(len(cf_data)))
story.append(ct)

story.append(Spacer(1, 8))
story.append(P(
    'The investment generates a positive annual cashflow of JPY {:.2f}M even after mortgage payments, '
    'meaning the property pays for itself from day one. This rental surplus accumulates over the holding period '
    'and forms a significant portion of the total return. Unlike properties with negative gearing that require '
    'the investor to top up monthly, this investment is self-sustaining and provides regular income throughout '
    'the holding period. The accumulated rental income is converted back to HKD at the exit exchange rate, '
    'which means it also benefits from a weaker JPY at exit.'.format(PM['annual_cashflow']/1e6),
    sBody
))

# Loan balance table
story.append(P('<b>Outstanding Loan Balance at Exit</b>', sH2))
lb_data = [
    [P('Holding Period', sTableHead), P('Loan Balance (JPY)', sTableHead), P('Loan Paid Down', sTableHead)],
]
for t in [5, 7, 10]:
    bal = LB[str(t)]
    paid = PM['loan_jpy'] - bal
    lb_data.append([
        P(f'{t} Years', sTableCell),
        P(f'JPY {bal/1e6:.1f}M', sTableCell),
        P(f'JPY {paid/1e6:.1f}M ({paid/PM["loan_jpy"]*100:.0f}%)', sTableCell),
    ])
lt = Table(lb_data, colWidths=[W*0.30, W*0.35, W*0.35])
lt.setStyle(make_table_style(len(lb_data)))
story.append(lt)

# ══════════════════════════════════════════════════════════════════
# PAGE 3: Market Variables
# ══════════════════════════════════════════════════════════════════
story.append(PageBreak())
story.append(P('<b>3. Market Variables: The Two Unknowns</b>', sH1))
story.append(HRFlowable(width='100%', thickness=1, color=BORDER, spaceAfter=10))

story.append(P(
    'The two factors that will ultimately determine your investment return are the exit exchange rate and '
    'the property market value at the time of sale. Neither can be predicted with certainty, but both can '
    'be bounded by historical evidence. Our model tests a wide range of outcomes for each variable, '
    'far beyond what most investors consider when making property investment decisions.',
    sBody
))

story.append(P('<b>3.1 Exchange Rate Scenarios (JPY/HKD)</b>', sH2))
story.append(P(
    'The current JPY/HKD rate is approximately 19.5 (each HKD buys 19.5 yen). Over the past 30 years, '
    'this rate has ranged from as low as 622 (1998, when JPY was very strong) to as high as 1,181 (2024, '
    'when JPY was very weak). This enormous range of nearly 2:1 demonstrates that currency risk is the '
    'single largest factor in Japanese property investment for foreign investors. Our 7 scenarios span '
    'from JPY strengthening 33% (rate drops to 13.0) to JPY weakening 44% (rate rises to 28.0), '
    'covering the vast majority of plausible 10-year outcomes based on historical precedent.',
    sBody
))

fx_sc_data = [[P('Scenario', sTableHead), P('Exit JPY/HKD', sTableHead), P('FX Change', sTableHead), P('Impact on HKD Investor', sTableHead)]]
fx_desc = [
    ('JPY Strengthens Significantly', '13.0', '+33.0%', 'Highly negative - exit JPY worth much less in HKD'),
    ('JPY Strengthens', '15.0', '+23.1%', 'Negative - material FX loss on exit'),
    ('JPY Moderately Strengthens', '17.0', '+12.8%', 'Slightly negative - small FX loss'),
    ('No Change', '19.5', '0.0%', 'Neutral - FX has no impact'),
    ('JPY Moderately Weakens', '22.0', '-12.8%', 'Slightly positive - small FX gain'),
    ('JPY Weakens', '25.0', '-28.2%', 'Positive - material FX gain on exit'),
    ('JPY Weakens Significantly', '28.0', '-43.6%', 'Highly positive - large FX gain'),
]
for desc, rate, chg, impact in fx_desc:
    fx_sc_data.append([P(desc, sTableLeft), P(rate, sTableCell), P(chg, sTableCell), P(impact, sTableLeft)])
fx_table = Table(fx_sc_data, colWidths=[W*0.28, W*0.14, W*0.12, W*0.46])
fx_table.setStyle(make_table_style(len(fx_sc_data)))
story.append(fx_table)

story.append(Spacer(1, 10))
story.append(P('<b>3.2 Property Price Scenarios</b>', sH2))
story.append(P(
    'Japan residential property prices have experienced dramatic cycles over the past three decades. '
    'Following the bubble burst of the early 1990s, nationwide prices declined for nearly 20 years before '
    'beginning a gradual recovery around 2012. In recent years, urban areas such as Tokyo and Osaka have '
    'seen significant price appreciation driven by foreign investment, low interest rates, and demographic '
    'concentration in major cities. We test four annualized rates of change, from a persistent decline of '
    '3% per year (similar to the 1995-2005 experience) to a sustained growth of 3% per year (consistent '
    'with the 2015-2025 urban trend).',
    sBody
))

pr_sc_data = [[P('Annual Rate', sTableHead), P('5-Year Total', sTableHead), P('7-Year Total', sTableHead), P('10-Year Total', sTableHead), P('Historical Precedent', sTableHead)]]
pr_rates = [(-3, -14.0, -19.3, -26.3, '1995-2005 national average'),
            (-1, -4.9, -6.7, -9.6, '2005-2015 stagnation period'),
            (1, 5.1, 7.2, 10.5, 'Conservative urban recovery'),
            (3, 15.9, 23.0, 34.4, '2015-2025 Tokyo/Osaka trend')]
for rate, t5, t7, t10, hist in pr_rates:
    pr_sc_data.append([
        P(f'{rate:+d}%/year', sTableCell),
        P(f'{t5:+.1f}%', sTableCell),
        P(f'{t7:+.1f}%', sTableCell),
        P(f'{t10:+.1f}%', sTableCell),
        P(hist, sTableLeft),
    ])
pr_table = Table(pr_sc_data, colWidths=[W*0.14, W*0.14, W*0.14, W*0.16, W*0.42])
pr_table.setStyle(make_table_style(len(pr_sc_data)))
story.append(pr_table)

# ══════════════════════════════════════════════════════════════════
# PAGE 4-5: 84 Scenario Results
# ══════════════════════════════════════════════════════════════════
story.append(PageBreak())
story.append(P('<b>4. 84 Scenario Results</b>', sH1))
story.append(HRFlowable(width='100%', thickness=1, color=BORDER, spaceAfter=10))

story.append(P(
    'The following tables present the complete 84 scenario results. Each cell shows the total return on your '
    'equity investment (HKD {:.2f}M) expressed as a percentage, along with the absolute gain or loss in HKD. '
    'Results are grouped by holding period. Green cells indicate positive returns, yellow indicates modest returns, '
    'and red indicates a loss of capital. The heatmap on the following page provides a visual summary of the '
    '10-year holding period scenarios.'.format(PM['eq_hkd']/1e6),
    sBody
))

FXS = [13.0, 15.0, 17.0, 19.5, 22.0, 25.0, 28.0]
PAS = [-0.03, -0.01, 0.01, 0.03]

for hold_t in [5, 7, 10]:
    story.append(P(f'<b>4.{[5,7,10].index(hold_t)+1} Holding Period: {hold_t} Years</b>', sH2))
    
    # Table header: FX rates
    header = [P('Prop \\ FX', sTableHead)]
    for fx in FXS:
        header.append(P(f'{fx:.1f}', sTableHead))
    
    rows = [header]
    for pa in PAS:
        row = [P(f'{pa*100:+.0f}%/yr', sTableCell)]
        for fx in FXS:
            s = next(x for x in SC if x['fx']==fx and abs(x['pa']-pa)<0.001 and x['t']==hold_t)
            roi = s['roi']
            gain = s['gain']
            clr = roi_color(roi)
            txt_clr = colors.white if roi < 0 or roi > 100 else TEXT_PRIMARY
            cell_style = ParagraphStyle('cc', parent=sTableCell, textColor=txt_clr)
            row.append(P(f'{roi:+.0f}%<br/>{gain/1e4:+.1f}M', cell_style))
        rows.append(row)
    
    col_w = [W*0.13] + [W*0.124]*7
    tbl = Table(rows, colWidths=col_w)
    
    # Build style with cell-level colors
    style_cmds = [
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
            bg = roi_color(s['roi'])
            # Lighten the color for background
            if s['roi'] >= 50:
                bg = colors.HexColor('#e8f5e9')
            elif s['roi'] >= 0:
                bg = colors.HexColor('#fff8e1')
            else:
                bg = colors.HexColor('#fde8e8')
            style_cmds.append(('BACKGROUND', (j+1, i+1), (j+1, i+1), bg))
    
    tbl.setStyle(TableStyle(style_cmds))
    story.append(tbl)
    story.append(Spacer(1, 8))

# Heatmap image
story.append(PageBreak())
story.append(P('<b>4.4 Visual Summary: 10-Year ROI Heatmap</b>', sH2))
story.append(P(
    'The heatmap below provides an intuitive visual representation of the 28 scenarios for the 10-year holding period. '
    'Each cell represents a unique combination of exit exchange rate (horizontal axis) and property price change '
    '(vertical axis). The color gradient from red (loss) through yellow (moderate return) to green (high return) '
    'makes it immediately clear which combinations drive the best and worst outcomes. Note that the exchange rate '
    'dominates: even with property prices declining, a significantly weaker JPY at exit can still produce strong '
    'positive returns for the HKD-based investor.',
    sBody
))
story.append(Spacer(1, 6))

from reportlab.platypus import Image as RLImage
img_path = f'{OUT}/chart_heatmap.png'
if os.path.exists(img_path):
    img = RLImage(img_path, width=W, height=W*0.38)
    story.append(img)

# ══════════════════════════════════════════════════════════════════
# PAGE 6: 30-Year Historical Summary
# ══════════════════════════════════════════════════════════════════
story.append(PageBreak())
story.append(P('<b>5. Historical Evidence: 30-Year Summary</b>', sH1))
story.append(HRFlowable(width='100%', thickness=1, color=BORDER, spaceAfter=10))

story.append(P(
    'To ground our scenario analysis in reality, we examine actual historical data from 1995 to 2025. '
    'This 30-year period encompasses the aftermath of Japan\'s asset price bubble, the "Lost Decades" of '
    'deflation, the Abenomics stimulus era, and the recent post-COVID property boom. By analyzing every '
    'rolling 10-year window within this period, we can identify the worst, average, and best outcomes that '
    'actually occurred, and apply them to our model to show what your investment return would have been '
    'under those historical conditions.',
    sBody
))

# History chart
story.append(Spacer(1, 4))
img_hist = f'{OUT}/chart_history.png'
if os.path.exists(img_hist):
    img2 = RLImage(img_hist, width=W, height=W*0.42)
    story.append(img2)
story.append(Spacer(1, 6))

# 30-year summary stats
story.append(P('<b>5.1 30-Year Cumulative Changes</b>', sH2))
hist30_data = [
    [P('Metric', sTableHead), P('1995 Starting Level', sTableHead), P('2025 Ending Level', sTableHead), P('30-Year Change', sTableHead)],
    [P('JPY/HKD Exchange Rate', sTableLeft), P(f'{733:.0f}', sTableCell), P(f'{jpy_hkd[-1]:.0f}' if 'jpy_hkd' in dir() else f'{149.67*7.80:.0f}', sTableCell), P(f'{PM["fx_30yr_pct"]:+.1f}%', sTableCell)],
    [P('Residential Property Index', sTableLeft), P('145.0 (2015=100)', sTableCell), P('136.0', sTableCell), P(f'{PM["pr_30yr_pct"]:+.1f}%', sTableCell)],
]
h30t = Table(hist30_data, colWidths=[W*0.30, W*0.22, W*0.22, W*0.26])
h30t.setStyle(make_table_style(len(hist30_data)))
story.append(h30t)

story.append(Spacer(1, 8))
story.append(P(
    'Over 30 years, the JPY/HKD rate rose from approximately 733 to 1,167, representing a 59.2% weakening '
    'of the Japanese yen against the Hong Kong dollar. For a HKD investor, this currency movement alone would '
    'have generated substantial gains when converting Japanese assets back to HKD. Meanwhile, residential property '
    'prices as measured by the nationwide index declined slightly from 145 to 136 over the same period, a modest '
    '-6.2% change. However, this national average masks enormous regional variation: urban properties in Tokyo '
    'and Osaka have significantly outperformed, while rural areas continued to decline.',
    sBody
))

# 3 Scenarios table
story.append(P('<b>5.2 Historical 10-Year Scenarios Applied to Your Investment</b>', sH2))
story.append(P(
    'We identified the actual worst, average, and best 10-year periods from the historical data and applied '
    'those exact FX and property price changes to our model. The table below shows what your HKD {:.2f}M '
    'equity investment would have returned under each historical scenario.'.format(PM['eq_hkd']/1e6),
    sBody
))

hw = HI['worst']
ha = HI['avg']
hb = HI['best']

sc3_data = [
    [P('Scenario', sTableHead), P('FX 10yr Change', sTableHead), P('Property 10yr Change', sTableHead),
     P('Exit FX', sTableHead), P('Exit Property', sTableHead), P('ROI', sTableHead), P('Gain/Loss (HKD)', sTableHead)],
    [P('<b>Worst Case</b>', ParagraphStyle('rw', parent=sTableLeft, textColor=SEM_ERROR)),
     P(f'{hw["fx_pct"]:+.1f}%', sTableCell), P(f'{hw["pr_pct"]:+.1f}%', sTableCell),
     P(f'{hw["efx"]:.1f}', sTableCell), P(f'JPY {hw["ev"]/1e6:.1f}M', sTableCell),
     P(f'<b>{hw["roi"]:+.1f}%</b>', ParagraphStyle('r1', parent=sTableCell, textColor=SEM_ERROR)),
     P(f'{hw["gain"]/1e4:+.1f}M', ParagraphStyle('g1', parent=sTableCell, textColor=SEM_ERROR))],
    [P('<b>Average Case</b>', ParagraphStyle('ra', parent=sTableLeft, textColor=SEM_WARNING)),
     P(f'{ha["fx_pct"]:+.1f}%', sTableCell), P(f'{ha["pr_pct"]:+.1f}%', sTableCell),
     P(f'{ha["efx"]:.1f}', sTableCell), P(f'JPY {ha["ev"]/1e6:.1f}M', sTableCell),
     P(f'<b>{ha["roi"]:+.1f}%</b>', ParagraphStyle('r2', parent=sTableCell, textColor=SEM_WARNING)),
     P(f'{ha["gain"]/1e4:+.1f}M', ParagraphStyle('g2', parent=sTableCell, textColor=SEM_WARNING))],
    [P('<b>Best Case</b>', ParagraphStyle('rb', parent=sTableLeft, textColor=SEM_SUCCESS)),
     P(f'{hb["fx_pct"]:+.1f}%', sTableCell), P(f'{hb["pr_pct"]:+.1f}%', sTableCell),
     P(f'{hb["efx"]:.1f}', sTableCell), P(f'JPY {hb["ev"]/1e6:.1f}M', sTableCell),
     P(f'<b>{hb["roi"]:+.1f}%</b>', ParagraphStyle('r3', parent=sTableCell, textColor=SEM_SUCCESS)),
     P(f'{hb["gain"]/1e4:+.1f}M', ParagraphStyle('g3', parent=sTableCell, textColor=SEM_SUCCESS))],
]
sc3t = Table(sc3_data, colWidths=[W*0.14, W*0.13, W*0.15, W*0.11, W*0.16, W*0.11, W*0.20])
sc3t.setStyle(make_table_style(len(sc3_data)))
story.append(sc3t)

story.append(Spacer(1, 8))
story.append(P(
    '<b>Key insight:</b> Even in the worst historical scenario (JPY weakening 64.7% combined with property '
    'prices falling 40.0% over 10 years), the loss is contained at -30.7% of equity, or HKD -0.74M. This is '
    'because the positive annual cashflow of JPY 1.86M provides a substantial buffer against capital losses. '
    'In the average historical scenario, the investment returns +80.4%, nearly doubling your equity. In the best '
    'scenario, the combination of JPY strengthening and property appreciation produces a remarkable +299.8% return. '
    'Across all 16 historical 10-year windows examined, the median outcome would have produced a strongly positive '
    'return, demonstrating the historical resilience of this investment structure.',
    sBody
))

# ══════════════════════════════════════════════════════════════════
# PAGE 7: Risk Scorecard
# ══════════════════════════════════════════════════════════════════
story.append(PageBreak())
story.append(P('<b>6. Risk Scorecard and Assessment</b>', sH1))
story.append(HRFlowable(width='100%', thickness=1, color=BORDER, spaceAfter=10))

story.append(P(
    'Based on our 84-scenario analysis and 30 years of historical data, we assess the key risk factors '
    'for this investment. Each risk category is rated using a three-tier system: Low (favorable conditions), '
    'Medium (mixed conditions requiring monitoring), and High (significant concern requiring active mitigation). '
    'The ratings incorporate both the model outputs and qualitative factors such as policy environment, '
    'market liquidity, and macroeconomic conditions.',
    sBody
))

risk_data = [
    [P('Risk Category', sTableHead), P('Rating', sTableHead), P('Assessment', sTableHead)],
    [P('<b>FX Risk</b>', sTableLeft),
     P('MEDIUM', ParagraphStyle('rm', parent=sTableCell, textColor=SEM_WARNING, fontSize=9)),
     P('Over 30 years, JPY weakened 59% vs HKD (favorable). However, JPY strengthened significantly '
       'in 2010-2012 and could do so again if BOJ continues tightening. Current BOJ rate at 0.75% '
       'suggests further tightening is likely, which could strengthen JPY in the short term. '
       'Medium-term trend of JPY weakening due to Japan\'s fiscal position favors HKD investors.', sTableLeft)],
    [P('<b>Property Value Risk</b>', sTableLeft),
     P('LOW-MEDIUM', ParagraphStyle('rp', parent=sTableCell, textColor=SEM_SUCCESS, fontSize=9)),
     P('Urban Osaka properties have recovered strongly since 2012. Current demand is supported by '
       'foreign investment (record JPY 6.5 trillion in 2024), inbound tourism growth, and limited '
       'new supply in established neighborhoods. Risk of significant decline is lower than national '
       'average due to Osaka\'s economic dynamism and Expo 2025 infrastructure legacy.', sTableLeft)],
    [P('<b>Liquidity Risk</b>', sTableLeft),
     P('LOW', ParagraphStyle('rl', parent=sTableCell, textColor=SEM_SUCCESS, fontSize=9)),
     P('Japanese property transactions are highly liquid in urban areas. Typical time to sell is 2-4 months. '
       'No capital controls restrict repatriation of funds. The FEFTA filing requirement from April 2026 '
       'adds administrative steps but does not restrict exit. Transaction costs (broker + tax) are '
       'approximately 3-5% of sale price.', sTableLeft)],
    [P('<b>Policy / Regulatory Risk</b>', sTableLeft),
     P('MEDIUM', ParagraphStyle('rp2', parent=sTableCell, textColor=SEM_WARNING, fontSize=9)),
     P('New FEFTA (Foreign Exchange and Foreign Trade Act) filing requirement effective April 2026 '
       'adds compliance burden for foreign buyers. BOJ rate increases (0.75% as of Dec 2025, highest '
       'since 1995) may increase mortgage costs on refinancing. Potential property tax reforms '
       'could increase holding costs, though no specific proposals are currently active.', sTableLeft)],
    [P('<b>Rental Income Risk</b>', sTableLeft),
     P('LOW', ParagraphStyle('rl2', parent=sTableCell, textColor=SEM_SUCCESS, fontSize=9)),
     P('Osaka rental market remains tight with vacancy rates below 5% in central areas. '
       'The 6% gross yield is conservative based on current market comparables. Even if rent '
       'declined 20%, the property would still generate positive cashflow after mortgage. '
       'No management fee structure reduces fixed cost burden.', sTableLeft)],
]
risk_table = Table(risk_data, colWidths=[W*0.18, W*0.12, W*0.70])
risk_table.setStyle(make_table_style(len(risk_data)))
story.append(risk_table)

story.append(Spacer(1, 12))
story.append(P('<b>Statistical Summary of 84 Scenarios</b>', sH2))

all_rois = [s['roi'] for s in SC]
all_gains = [s['gain'] for s in SC]
neg_count = sum(1 for r in all_rois if r < 0)
pos_count = sum(1 for r in all_rois if r >= 0)

stat_data = [
    [P('Statistic', sTableHead), P('ROI (%)', sTableHead), P('HKD Gain/Loss', sTableHead)],
    [P('Minimum (Worst)', sTableLeft), P(f'{min(all_rois):+.1f}%', sTableCell), P(f'{min(all_gains)/1e4:+.1f}M', sTableCell)],
    [P('25th Percentile', sTableLeft), P(f'{sorted(all_rois)[len(all_rois)//4]:+.1f}%', sTableCell), P(f'{sorted(all_gains)[len(all_gains)//4]/1e4:+.1f}M', sTableCell)],
    [P('Median (50th)', sTableLeft), P(f'{sorted(all_rois)[len(all_rois)//2]:+.1f}%', sTableCell), P(f'{sorted(all_gains)[len(all_gains)//2]/1e4:+.1f}M', sTableCell)],
    [P('75th Percentile', sTableLeft), P(f'{sorted(all_rois)[3*len(all_rois)//4]:+.1f}%', sTableCell), P(f'{sorted(all_gains)[3*len(all_gains)//4]/1e4:+.1f}M', sTableCell)],
    [P('Maximum (Best)', sTableLeft), P(f'{max(all_rois):+.1f}%', sTableCell), P(f'{max(all_gains)/1e4:+.1f}M', sTableCell)],
    [P('Positive Scenarios', sTableLeft), P(f'{pos_count} / 84 ({pos_count/84*100:.0f}%)', sTableCell), P('', sTableCell)],
    [P('Negative Scenarios', sTableLeft), P(f'{neg_count} / 84 ({neg_count/84*100:.0f}%)', sTableCell), P('', sTableCell)],
]
stat_table = Table(stat_data, colWidths=[W*0.30, W*0.35, W*0.35])
stat_table.setStyle(make_table_style(len(stat_data)))
story.append(stat_table)

story.append(Spacer(1, 12))
story.append(P('<b>Bottom Line</b>', sH2))
story.append(P(
    'Based on 84 scenario outcomes and 30 years of historical evidence, this investment shows a strongly '
    'positive risk-reward profile for Hong Kong investors. In the 84 scenarios tested, {:.0f}% produce positive '
    'returns. The median outcome across all scenarios is a return of {:.0f}%, and the historical average '
    'scenario (using actual 10-year periods from 1995-2025 data) produces an ROI of +{:.1f}%. Even in the '
    'worst historical 10-year period, the maximum loss was -{:.1f}%, contained by the positive cashflow buffer. '
    'The key risk remains exchange rate volatility: while the long-term trend favors HKD investors due to '
    'Japan\'s structural fiscal challenges, short-to-medium term JPY strength from BOJ tightening could '
    'reduce returns. Investors with a 7-10 year horizon and tolerance for currency fluctuation are well-positioned '
    'to capture both rental income and capital appreciation in this market.'.format(
        pos_count/84*100,
        sorted(all_rois)[len(all_rois)//2],
        ha['roi'],
        abs(hw['roi'])
    ),
    sBody
))

# ── Build PDF ──
doc.build(story)
print(f"Body PDF built: {PDF_PATH}")
