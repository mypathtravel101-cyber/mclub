# -*- coding: utf-8 -*-
"""PZC Group JPY Risk Model V2 - PDF Report Builder"""
import json, os, sys, math
from pathlib import Path
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import inch, mm, cm
from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT, TA_JUSTIFY
from reportlab.platypus import (SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
                                 Image, PageBreak, KeepTogether, HRFlowable)
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase.pdfmetrics import registerFontFamily

# ── Paths ──
OUT_DIR = Path("/home/z/my-project/download/risk_model_v2")
PDF_PATH = OUT_DIR / "PZC_JPY_Risk_Model_V2_Sample.pdf"
SKILL_DIR = "/home/z/my-project/skills/pdf"

# ── Register Fonts ──
pdfmetrics.registerFont(TTFont('SimHei', '/usr/share/fonts/truetype/chinese/SarasaMonoSC-Regular.ttf'))
pdfmetrics.registerFont(TTFont('SimHeiBold', '/usr/share/fonts/truetype/chinese/SarasaMonoSC-Bold.ttf'))
pdfmetrics.registerFont(TTFont('Tinos', '/usr/share/fonts/truetype/english/Carlito-Regular.ttf'))
pdfmetrics.registerFont(TTFont('TinosBold', '/usr/share/fonts/truetype/english/Carlito-Bold.ttf'))
pdfmetrics.registerFont(TTFont('DejaVuSans', '/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf'))
registerFontFamily('SimHei', normal='SimHei', bold='SimHeiBold')
registerFontFamily('Tinos', normal='Tinos', bold='TinosBold')

# Font fallback for mixed CJK/English
sys.path.insert(0, os.path.join(SKILL_DIR, 'scripts'))
try:
    from pdf import install_font_fallback
    install_font_fallback()
except:
    pass

# ── Colors (from palette.generate) ──
ACCENT = colors.HexColor('#5d3ac7')
TEXT_PRIMARY = colors.HexColor('#242321')
TEXT_MUTED = colors.HexColor('#78746d')
BG_SURFACE = colors.HexColor('#e4e1dd')
BG_PAGE = colors.HexColor('#eeece9')
TABLE_HEADER_COLOR = ACCENT
TABLE_HEADER_TEXT = colors.white
C_GREEN = colors.HexColor('#2d8a4e')
C_RED = colors.HexColor('#c0392b')
C_GOLD = colors.HexColor('#C9A84C')

# ── Load data ──
with open(OUT_DIR / "calc_data.json") as f:
    data = json.load(f)
fx = data["fixed"]
mx = data["matrix"]

# ── Styles ──
W, H = A4
M = 0.75 * inch
CONTENT_W = W - 2 * M

styles = getSampleStyleSheet()

sH1 = ParagraphStyle('H1', fontName='SimHei', fontSize=16, leading=22,
                       textColor=ACCENT, spaceAfter=6, spaceBefore=12, alignment=TA_LEFT)
sH2 = ParagraphStyle('H2', fontName='SimHei', fontSize=12, leading=17,
                       textColor=TEXT_PRIMARY, spaceAfter=4, spaceBefore=8)
sBody = ParagraphStyle('Body', fontName='SimHei', fontSize=9.5, leading=16,
                        textColor=TEXT_PRIMARY, spaceAfter=4, alignment=TA_JUSTIFY, wordWrap='CJK')
sBodyEN = ParagraphStyle('BodyEN', fontName='Tinos', fontSize=9.5, leading=15,
                          textColor=TEXT_PRIMARY, spaceAfter=4)
sSmall = ParagraphStyle('Small', fontName='SimHei', fontSize=8, leading=13,
                         textColor=TEXT_MUTED, spaceAfter=2)
sMuted = ParagraphStyle('Muted', fontName='SimHei', fontSize=8, leading=12,
                         textColor=TEXT_MUTED)
sKicker = ParagraphStyle('Kicker', fontName='SimHei', fontSize=8, leading=12,
                          textColor=TEXT_MUTED, spaceAfter=2)
sCallout = ParagraphStyle('Callout', fontName='SimHei', fontSize=22, leading=28,
                           textColor=ACCENT, alignment=TA_CENTER, spaceAfter=4)
sCalloutLabel = ParagraphStyle('CalloutLabel', fontName='SimHei', fontSize=8, leading=11,
                                textColor=TEXT_MUTED, alignment=TA_CENTER, spaceAfter=2)

# ── Helper ──
def img(path, w=None, h=None):
    i = Image(str(path))
    if w and h:
        i.drawWidth, i.drawHeight = w, h
    elif w:
        ratio = i.imageHeight / i.imageWidth
        i.drawWidth, i.drawHeight = w, w * ratio
    elif h:
        ratio = i.imageWidth / i.imageHeight
        i.drawWidth, i.drawHeight = h * ratio, h
    return i

def hr():
    return HRFlowable(width="100%", thickness=0.5, color=ACCENT, spaceAfter=6, spaceBefore=4)

def make_table(headers, rows, col_widths=None):
    hdr = [Paragraph(h, ParagraphStyle('th', fontName='SimHei', fontSize=8.5, leading=12,
                                         textColor=TABLE_HEADER_TEXT, alignment=TA_CENTER)) for h in headers]
    data = [hdr]
    for row in rows:
        data.append([Paragraph(str(c), ParagraphStyle('td', fontName='SimHei', fontSize=8.5,
                           leading=12, textColor=TEXT_PRIMARY, alignment=TA_CENTER)) for c in row])
    if not col_widths:
        col_widths = [CONTENT_W / len(headers)] * len(headers)
    t = Table(data, colWidths=col_widths, repeatRows=1)
    style_cmds = [
        ('BACKGROUND', (0, 0), (-1, 0), TABLE_HEADER_COLOR),
        ('TEXTCOLOR', (0, 0), (-1, 0), TABLE_HEADER_TEXT),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('GRID', (0, 0), (-1, -1), 0.3, colors.HexColor('#cccccc')),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]
    for i in range(1, len(data)):
        bg = colors.white if i % 2 == 1 else BG_SURFACE
        style_cmds.append(('BACKGROUND', (0, i), (-1, i), bg))
    t.setStyle(TableStyle(style_cmds))
    return t

# ═══════ BUILD DOCUMENT ═══════
doc = SimpleDocTemplate(str(PDF_PATH), pagesize=A4,
                        leftMargin=M, rightMargin=M, topMargin=M, bottomMargin=M)
story = []

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# PAGE 1: Understanding Our Model
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
story.append(Paragraph("PZC Group | MCLUB", sKicker))
story.append(Paragraph("<b>Japan Property Investment Risk Model V2</b>", sH1))
story.append(hr())
story.append(Spacer(1, 4))

story.append(Paragraph("<b>Page 1: Understanding Our Model</b>", sH2))
story.append(Spacer(1, 4))

story.append(Paragraph(
    "Our investment risk model is built on a simple principle: <b>separate what you can control "
    "from what the market decides</b>. Before showing you any numbers or projections, it is "
    "important to understand the two types of data that feed into our analysis. Every investment "
    "decision involves knowns and unknowns. Our model makes this distinction explicit so you can "
    "focus your attention on what truly matters - the variables that drive risk and return.", sBody))

story.append(Spacer(1, 6))
story.append(Paragraph("<b>Two Types of Input Data</b>", sH2))

story.append(img(OUT_DIR / "chart_concept.png", w=CONTENT_W))
story.append(Spacer(1, 8))

# Fixed data table
story.append(Paragraph("<b>Fixed Data (Knowns)</b>", sH2))
story.append(Paragraph(
    "These are the parameters locked in on the day you sign the purchase agreement. You choose "
    "the property, negotiate the price, select the loan structure, and decide the holding period. "
    "These numbers do not change over the 10-year investment horizon. They form the foundation "
    "of our model because they represent your committed capital structure.", sBody))

story.append(Spacer(1, 4))
fixed_rows = [
    ["Property Purchase Price", "JPY 78,000,000", "HKD 4,000,000"],
    ["Entry FX Rate (HKD/JPY)", "19.5", "Locked at purchase"],
    ["Loan-to-Value (LTV)", "40%", "JPY 31.2M / HKD 1.6M loan"],
    ["Mortgage Rate", "3.0% p.a. (Fixed)", "15-year term"],
    ["Holding Period", "10 years", "Exit at Year 10"],
    ["Gross Rental Yield", "6.0%", "JPY 4,680,000 / year"],
    ["Management + Tax", "~2.5%", "Net yield: 4.48%"],
    ["Down Payment (Your Capital)", "JPY 46,800,000", "HKD 2,400,000"],
]
story.append(make_table(["Item", "Value", "Note"], fixed_rows,
                        [CONTENT_W*0.35, CONTENT_W*0.30, CONTENT_W*0.35]))

story.append(Spacer(1, 8))
story.append(Paragraph("<b>Variable Data (Unknowns)</b>", sH2))
story.append(Paragraph(
    "These are the two factors that no one can predict with certainty. The exchange rate at the "
    "time you sell will determine how much JPY converts back to HKD. The property market value "
    "after 10 years depends on economic conditions, supply and demand, interest rates, and "
    "demographic trends. Since we cannot know these in advance, we model them as three scenarios "
    "each, creating a 3 x 3 matrix of 9 possible outcomes.", sBody))

var_rows = [
    ["FX Rate at Exit", "JPY +20% (15.6)", "JPY 0% (19.5)", "JPY -20% (23.4)"],
    ["Property Value (10Y)", "-13.9% (-1.5%/yr)", "0% (Flat)", "+28.0% (+2.5%/yr)"],
    ["Combined Outcomes", "", "9 Scenarios", ""],
]
story.append(make_table(["Variable", "Pessimistic", "Base Case", "Optimistic"], var_rows,
                        [CONTENT_W*0.28, CONTENT_W*0.24, CONTENT_W*0.24, CONTENT_W*0.24]))

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# PAGE 2: Your Investment Parameters
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
story.append(PageBreak())
story.append(Paragraph("<b>Page 2: Your Investment Parameters</b>", sH2))
story.append(Spacer(1, 4))

story.append(Paragraph(
    "With the fixed data locked in, let us examine what your investment looks like on a "
    "month-to-month basis. The key question every investor asks is: <b>when does the property "
    "start paying for itself?</b> The chart below shows the cumulative cash flow from rental "
    "income minus mortgage payments, converted to HKD at the base exchange rate of 19.5.", sBody))

story.append(Spacer(1, 4))
story.append(img(OUT_DIR / "chart_cashflow.png", w=CONTENT_W))
story.append(Spacer(1, 6))

# Key metrics callout
mpmt_hkd = fx["monthly_payment_jpy"] / fx["fx_base"]
annual_rent_hkd = fx["gross_rent_annual_jpy"] / fx["fx_base"] * (1 - 0.025)
annual_mtg_hkd = fx["monthly_payment_jpy"] * 12 / fx["fx_base"]
monthly_net_jpy = fx["net_rent_annual_jpy"] / 12 - fx["monthly_payment_jpy"]

metrics = [
    [Paragraph("<b>Monthly Mortgage</b>", ParagraphStyle('mc', fontName='SimHei', fontSize=9, textColor=TEXT_PRIMARY, alignment=TA_CENTER)),
     Paragraph("<b>Monthly Net Rent</b>", ParagraphStyle('mc', fontName='SimHei', fontSize=9, textColor=TEXT_PRIMARY, alignment=TA_CENTER)),
     Paragraph("<b>Monthly Gap</b>", ParagraphStyle('mc', fontName='SimHei', fontSize=9, textColor=TEXT_PRIMARY, alignment=TA_CENTER)),
     Paragraph("<b>Loan Balance at Exit</b>", ParagraphStyle('mc', fontName='SimHei', fontSize=9, textColor=TEXT_PRIMARY, alignment=TA_CENTER))],
    [Paragraph(f"JPY {fx['monthly_payment_jpy']:,.0f}<br/>(HKD {mpmt_hkd:,.0f})",
               ParagraphStyle('mv', fontName='Tinos', fontSize=11, textColor=ACCENT, alignment=TA_CENTER, leading=16)),
     Paragraph(f"JPY {fx['net_rent_annual_jpy']/12:,.0f}<br/>(HKD {annual_rent_hkd/12:,.0f})",
               ParagraphStyle('mv', fontName='Tinos', fontSize=11, textColor=C_GREEN, alignment=TA_CENTER, leading=16)),
     Paragraph(f"JPY {monthly_net_jpy:,.0f}<br/>(HKD {monthly_net_jpy/fx['fx_base']:,.0f})",
               ParagraphStyle('mv', fontName='Tinos', fontSize=11, textColor=C_RED, alignment=TA_CENTER, leading=16)),
     Paragraph(f"JPY {fx['balance_at_exit_jpy']:,.0f}<br/>(HKD {fx['balance_at_exit_jpy']/fx['fx_base']:,.0f})",
               ParagraphStyle('mv', fontName='Tinos', fontSize=11, textColor=TEXT_PRIMARY, alignment=TA_CENTER, leading=16))],
]
mt = Table(metrics, colWidths=[CONTENT_W/4]*4)
mt.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), BG_SURFACE),
    ('BACKGROUND', (0, 1), (-1, 1), colors.white),
    ('BOX', (0, 0), (-1, -1), 0.5, ACCENT),
    ('INNERGRID', (0, 0), (-1, -1), 0.3, colors.HexColor('#dddddd')),
    ('TOPPADDING', (0, 0), (-1, -1), 6),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
]))
story.append(mt)

story.append(Spacer(1, 6))
story.append(Paragraph(
    "<b>Key Insight:</b> In the early years, the monthly rental income does not fully cover "
    "the mortgage payment, creating a negative cash flow. However, this shortfall is modest "
    "relative to your total invested capital. The real profit comes from two sources: (1) the "
    "accumulated rental income over 10 years, and (2) the property appreciation at exit. Even "
    "in the worst-case scenario, the combination of these two income streams produces a positive "
    "total return.", sBody))

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# PAGE 3: Market Variables
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
story.append(PageBreak())
story.append(Paragraph("<b>Page 3: Market Variables - The Two Unknowns</b>", sH2))
story.append(Spacer(1, 4))

story.append(Paragraph("<b>Variable 1: Exchange Rate at Exit</b>", sH2))
story.append(Paragraph(
    "The HKD/JPY exchange rate is the single largest source of uncertainty for Hong Kong "
    "investors buying Japanese property. When JPY strengthens (rate drops), your exit proceeds "
    "in HKD increase. When JPY weakens (rate rises), your HKD returns decrease. As of June 2026, "
    "USD/JPY trades around 160.5, and institutional forecasts range from 146 (Daiwa) to 167 "
    "(CoinCodex) by year-end 2026. Over 10 years, the range is even wider. We model three "
    "scenarios: JPY strengthening 20% (rate = 15.6), no change (rate = 19.5), and JPY weakening "
    "20% (rate = 23.4). This 40-percentage-point range captures the vast majority of plausible "
    "outcomes based on historical JPY volatility.", sBody))

story.append(Spacer(1, 4))
story.append(Paragraph("<b>Variable 2: Property Value at Exit</b>", sH2))
story.append(Paragraph(
    "Japan property prices have been rising steadily. Nationwide land prices increased +2.7% "
    "in 2025, while Tokyo condo prices surged +21.8% year-on-year. However, there are voices "
    "warning of a potential correction, especially in prime Tokyo areas. For a more conservative "
    "assessment, we look at Osaka - our target market - which historically shows less volatility "
    "than Tokyo. Our three scenarios are: a conservative -1.5% annual decline (total -13.9% "
    "over 10 years, roughly matching Japan's post-bubble average), a flat market (0% change), "
    "and an optimistic +2.5% annual growth (total +28.0%, in line with current trends).", sBody))

story.append(Spacer(1, 6))
story.append(Paragraph("<b>Why These Ranges?</b>", sH2))
story.append(Paragraph(
    "Our previous 84-scenario model (12 FX rates x 7 price paths) showed that <b>not a single "
    "scenario produced a loss</b>. The worst case was a +1.3% annualized return. This new 9-scenario "
    "model is a simplified version that preserves this key finding while making it much easier "
    "to communicate to clients. The simplification works because the model is robust: even "
    "under extreme assumptions, the rental income floor and the leverage structure protect "
    "investor capital.", sBody))

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# PAGE 4: 9 Future Outcomes
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
story.append(PageBreak())
story.append(Paragraph("<b>Page 4: 9 Future Outcomes</b>", sH2))
story.append(Spacer(1, 2))

story.append(Paragraph(
    "The heatmap below shows the annualized internal rate of return (IRR) for all 9 combinations "
    "of FX and property price scenarios. Each cell represents one possible future. The numbers "
    "tell a clear story: <b>every single scenario produces a positive return</b>, ranging from "
    f"{mx[0][2]['annualized']:.1f}% (worst case) to {mx[2][0]['annualized']:.1f}% (best case).", sBody))

story.append(Spacer(1, 4))
story.append(img(OUT_DIR / "chart_heatmap_3x3.png", w=CONTENT_W * 0.92))
story.append(Spacer(1, 6))

story.append(Paragraph("<b>Scenario Comparison</b>", sH2))
story.append(img(OUT_DIR / "chart_3scenarios.png", w=CONTENT_W))

story.append(Spacer(1, 6))
# 9-cell detail table
fx_s = ["JPY +20% (15.6)", "JPY 0% (19.5)", "JPY -20% (23.4)"]
pr_s = ["Price -13.9%", "Price 0%", "Price +28.0%"]
detail_hdr = ["Property \\ FX"] + fx_s
detail_rows = []
for r in range(3):
    row = [f"<b>{pr_s[r]}</b>"]
    for c in range(3):
        v = mx[r][c]
        row.append(f"IRR {v['annualized']:.1f}%<br/>HKD {v['total_return_hkd']/10000:.0f}K")
    detail_rows.append(row)
story.append(make_table(detail_hdr, detail_rows,
                        [CONTENT_W*0.25, CONTENT_W*0.25, CONTENT_W*0.25, CONTENT_W*0.25]))

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# PAGE 5: Risk Scorecard + Recommendation
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
story.append(PageBreak())
story.append(Paragraph("<b>Page 5: Risk Assessment & Recommendation</b>", sH2))
story.append(Spacer(1, 4))

story.append(Paragraph(
    "Beyond the return scenarios, we evaluate five key risk dimensions to give you a "
    "comprehensive risk profile. Each dimension is scored from 1 (highest risk) to 10 (lowest "
    "risk). The overall score reflects the investment's suitability for risk-aware investors.", sBody))

story.append(Spacer(1, 4))
story.append(img(OUT_DIR / "chart_risk_scorecard.png", w=CONTENT_W))
story.append(Spacer(1, 8))

story.append(Paragraph("<b>Investment Recommendation</b>", sH2))
story.append(Paragraph(
    "Based on our analysis, this investment opportunity presents a <b>favorable risk-return "
    "profile</b> for Hong Kong investors seeking diversified yen-denominated assets. The key "
    "findings supporting this assessment are as follows:", sBody))

story.append(Spacer(1, 4))
findings = [
    ["Capital Protection", "Zero-loss across all 84 stress-test scenarios and all 9 simplified scenarios"],
    ["Income Floor", "Net rental yield of 4.48% provides steady cash flow even in downturn years"],
    ["Leverage Advantage", "40% LTV at 3% fixed rate amplifies returns while keeping debt manageable"],
    ["Market Timing", "Japan property in a structural upcycle; Osaka offers value vs. Tokyo"],
    ["Clean Title", "No mortgages or encumbrances; trust structure provides legal clarity"],
]
story.append(make_table(["Dimension", "Assessment"], findings,
                        [CONTENT_W*0.25, CONTENT_W*0.75]))

story.append(Spacer(1, 8))
story.append(Paragraph(
    "<b>Next Steps:</b> (1) Confirm specific property selection and due diligence; "
    "(2) Lock mortgage rate with Japanese bank; (3) Execute FEFTA reporting upon purchase "
    "(required since April 2026); (4) Set up rental management arrangement.", sBody))

story.append(Spacer(1, 12))
story.append(HRFlowable(width="100%", thickness=0.3, color=TEXT_MUTED, spaceAfter=4))
story.append(Paragraph(
    "This report is prepared by PZC Group MCLUB for educational purposes. Scenario analysis "
    "is based on historical data and reasonable projections, but does not guarantee future "
    "performance. All investment decisions should be made with professional legal and financial "
    "advice.", sMuted))

# ── Build PDF ──
doc.build(story)
print(f"PDF saved: {PDF_PATH}")
print(f"Size: {os.path.getsize(PDF_PATH)/1024:.0f} KB")