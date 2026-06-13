#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Andy Japan Property ML V2 Report - Body (ReportLab)
   Key change: All returns shown as HKD amounts (property + FX decomposition), NOT ROI.
"""

import os, sys
# Skip install_font_fallback - NotoSerifSC covers CJK+Latin

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import cm, mm
from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY, TA_RIGHT
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    Image, PageBreak, KeepTogether, HRFlowable
)
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase.pdfmetrics import registerFontFamily

# ═══════════════════════════════════════════════════
# FONTS
# ═══════════════════════════════════════════════════
pdfmetrics.registerFont(TTFont('NotoSerifSC', '/usr/share/fonts/truetype/noto-serif-sc/NotoSerifSC-Regular.ttf'))
pdfmetrics.registerFont(TTFont('NotoSerifSCBold', '/usr/share/fonts/truetype/noto-serif-sc/NotoSerifSC-Bold.ttf'))
pdfmetrics.registerFont(TTFont('WenQuanYi', '/usr/share/fonts/truetype/wqy/wqy-zenhei.ttc', subfontIndex=0))
pdfmetrics.registerFont(TTFont('DejaVuSans', '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'))
registerFontFamily('NotoSerifSC', normal='NotoSerifSC', bold='NotoSerifSCBold')
registerFontFamily('WenQuanYi', normal='WenQuanYi', bold='WenQuanYi')
registerFontFamily('DejaVuSans', normal='DejaVuSans', bold='DejaVuSans')
# Register lowercase aliases for fallback compatibility
pdfmetrics.registerFont(TTFont('notosanssc', '/usr/share/fonts/truetype/noto-serif-sc/NotoSerifSC-Regular.ttf'))

# ═══════════════════════════════════════════════════
# PALETTE
# ═══════════════════════════════════════════════════
ACCENT = colors.HexColor('#26728b')
TEXT_PRIMARY = colors.HexColor('#211f1d')
TEXT_MUTED = colors.HexColor('#807b73')
BG_SURFACE = colors.HexColor('#e3ded8')
BG_PAGE = colors.HexColor('#edebe8')
TABLE_HEADER_COLOR = ACCENT
TABLE_HEADER_TEXT = colors.white
TABLE_ROW_EVEN = colors.white
TABLE_ROW_ODD = BG_SURFACE

# ═══════════════════════════════════════════════════
# STYLES
# ═══════════════════════════════════════════════════
W, H = A4
LM, RM, TM, BM = 2.2*cm, 2.2*cm, 2.5*cm, 2.5*cm
CW = W - LM - RM  # content width

def make_styles():
    s = {}
    s['h1'] = ParagraphStyle('H1', fontName='NotoSerifSC', fontSize=20, leading=28,
        textColor=TEXT_PRIMARY, spaceBefore=24, spaceAfter=12, alignment=TA_LEFT)
    s['h2'] = ParagraphStyle('H2', fontName='NotoSerifSC', fontSize=15, leading=22,
        textColor=ACCENT, spaceBefore=18, spaceAfter=8, alignment=TA_LEFT)
    s['h3'] = ParagraphStyle('H3', fontName='NotoSerifSC', fontSize=12, leading=18,
        textColor=TEXT_PRIMARY, spaceBefore=12, spaceAfter=6, alignment=TA_LEFT)
    s['body'] = ParagraphStyle('Body', fontName='NotoSansSC', fontSize=10.5, leading=18,
        textColor=TEXT_PRIMARY, spaceBefore=3, spaceAfter=6, alignment=TA_JUSTIFY, wordWrap='CJK')
    s['body_left'] = ParagraphStyle('BodyL', fontName='NotoSansSC', fontSize=10.5, leading=18,
        textColor=TEXT_PRIMARY, spaceBefore=3, spaceAfter=6, alignment=TA_LEFT, wordWrap='CJK')
    s['caption'] = ParagraphStyle('Cap', fontName='NotoSansSC', fontSize=9, leading=14,
        textColor=TEXT_MUTED, spaceBefore=4, spaceAfter=8, alignment=TA_CENTER, wordWrap='CJK')
    s['callout'] = ParagraphStyle('Callout', fontName='NotoSansSC', fontSize=11, leading=18,
        textColor=ACCENT, spaceBefore=6, spaceAfter=6, alignment=TA_LEFT, wordWrap='CJK',
        leftIndent=12, borderColor=ACCENT, borderWidth=2, borderPadding=8)
    s['small'] = ParagraphStyle('Small', fontName='NotoSansSC', fontSize=9, leading=14,
        textColor=TEXT_MUTED, spaceBefore=2, spaceAfter=4, alignment=TA_LEFT, wordWrap='CJK')
    return s

STY = make_styles()

# ═══════════════════════════════════════════════════
# HELPER FUNCTIONS
# ═══════════════════════════════════════════════════
def h1(t): return Paragraph(f'<b>{t}</b>', STY['h1'])
def h2(t): return Paragraph(f'<b>{t}</b>', STY['h2'])
def h3(t): return Paragraph(f'<b>{t}</b>', STY['h3'])
def p(t): return Paragraph(t, STY['body'])
def pl(t): return Paragraph(t, STY['body_left'])
def cap(t): return Paragraph(t, STY['caption'])
def callout(t): return Paragraph(t, STY['callout'])
def small(t): return Paragraph(t, STY['small'])
def hr(): return HRFlowable(width='100%', thickness=0.5, color=colors.HexColor('#26728b'), spaceBefore=8, spaceAfter=8, opacity=0.3)

def make_table(headers, rows, col_widths=None):
    """Create a styled table. Headers = list of strings, rows = list of list of strings."""
    cw = col_widths or [CW / len(headers)] * len(headers)
    th_style = ParagraphStyle('TH', fontName='NotoSerifSC', fontSize=9.5, leading=14, textColor=TABLE_HEADER_TEXT, alignment=TA_CENTER, wordWrap='CJK')
    td_style = ParagraphStyle('TD', fontName='NotoSansSC', fontSize=9.5, leading=14, textColor=TEXT_PRIMARY, alignment=TA_CENTER, wordWrap='CJK')
    td_left = ParagraphStyle('TDL', fontName='NotoSansSC', fontSize=9.5, leading=14, textColor=TEXT_PRIMARY, alignment=TA_LEFT, wordWrap='CJK')

    data = [[Paragraph(h, th_style) for h in headers]]
    for row in rows:
        data.append([Paragraph(str(c), td_left if i == 0 else td_style) for i, c in enumerate(row)])

    t = Table(data, colWidths=cw, repeatRows=1)
    style_cmds = [
        ('BACKGROUND', (0, 0), (-1, 0), TABLE_HEADER_COLOR),
        ('TEXTCOLOR', (0, 0), (-1, 0), TABLE_HEADER_TEXT),
        ('FONTNAME', (0, 0), (-1, 0), 'NotoSerifSC'),
        ('FONTSIZE', (0, 0), (-1, 0), 9.5),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
        ('TOPPADDING', (0, 0), (-1, 0), 8),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#cccccc')),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [TABLE_ROW_EVEN, TABLE_ROW_ODD]),
    ]
    t.setStyle(TableStyle(style_cmds))
    return t

def make_table_left_first(headers, rows, col_widths=None):
    """Same as make_table but first column is left-aligned."""
    return make_table(headers, rows, col_widths)

def fmt_hkd(val_wan):
    """Format HKD value in wan (10,000). val_wan is the number in wan units."""
    if val_wan >= 0:
        return f'HKD +{val_wan:.1f}萬'
    else:
        return f'HKD {val_wan:.1f}萬'

def fmt_hkd_abs(val_wan):
    return f'HKD {val_wan:.1f}萬'

# ═══════════════════════════════════════════════════
# DATA CALCULATIONS
# ═══════════════════════════════════════════════════
ENTRY_FX = 19.5
PRICE_JPY = 62_400_000
PRICE_HKD_WAN = 320.0
EQUITY_HKD_WAN = 192.0
LOAN_JPY = 24_960_000
LOAN_HKD_WAN = 128.0
RATE_ANNUAL = 0.03
MONTHLY_RATE = RATE_ANNUAL / 12
N_MONTHS_10 = 120
MP_JPY = LOAN_JPY * MONTHLY_RATE * (1 + MONTHLY_RATE)**N_MONTHS_10 / ((1 + MONTHLY_RATE)**N_MONTHS_10 - 1)
TOTAL_MORTGAGE_JPY = MP_JPY * N_MONTHS_10
TOTAL_INTEREST_JPY = TOTAL_MORTGAGE_JPY - LOAN_JPY
INTEREST_HKD = TOTAL_INTEREST_JPY / ENTRY_FX
ANNUAL_RENT_JPY = PRICE_JPY * 0.06
ANNUAL_COST_JPY = PRICE_JPY * 0.003
ANNUAL_NET_RENT_JPY = ANNUAL_RENT_JPY - ANNUAL_COST_JPY

# ML predictions (from v2_ml_results.json)
FX_BLENDED_10 = 7.8   # % change in JPY/HKD (JPY depreciation)
PR_BLENDED_10 = 5.0   # % property appreciation

def calc_decomposition(fx_chg_pct, pr_chg_pct, label=""):
    """Calculate property + FX decomposition in HKD wan."""
    exit_fx = ENTRY_FX * (1 + fx_chg_pct / 100)
    exit_jpy = PRICE_JPY * (1 + pr_chg_pct / 100)
    exit_hkd = exit_jpy / exit_fx
    entry_hkd = PRICE_JPY / ENTRY_FX  # = 320万
    # Property component (at entry FX)
    prop_gain = (exit_jpy - PRICE_JPY) / ENTRY_FX / 10000  # in wan
    # FX component (at entry property value)
    fx_gain = PRICE_JPY * (1 / exit_fx - 1 / ENTRY_FX) / 10000
    # Interaction
    interaction = (exit_jpy - PRICE_JPY) * (1 / exit_fx - 1 / ENTRY_FX) / 10000
    # Total
    total = exit_hkd / 10000 - PRICE_HKD_WAN
    return {
        'label': label,
        'exit_fx': exit_fx,
        'exit_jpy': exit_jpy,
        'exit_hkd_wan': exit_hkd / 10000,
        'prop_wan': prop_gain,
        'fx_wan': fx_gain,
        'interaction_wan': interaction,
        'total_wan': total,
    }

# Key scenarios
scenarios = [
    calc_decomposition(FX_BLENDED_10, PR_BLENDED_10, "ML 加權預測 (10年)"),
    calc_decomposition((13.0 - 19.5) / 19.5 * 100, (1.03**10 - 1) * 100, "最好情景 (FX=13, +3%/年, 10年)"),
    calc_decomposition((28.0 - 19.5) / 19.5 * 100, -30, "最差情景 (FX=28, -3%/年, 10年)"),
    calc_decomposition(0, (1.03**10 - 1) * 100, "FX 不變, 樓價 +3%/年 (10年)"),
    calc_decomposition((13.0 - 19.5) / 19.5 * 100, 0, "FX=13, 樓價不變 (10年)"),
    calc_decomposition((16.0 - 19.5) / 19.5 * 100, 15, "FX=16, 樓價 +1.5%/年 (10年)"),
    calc_decomposition((22.0 - 19.5) / 19.5 * 100, 0, "FX=22, 樓價不變 (10年)"),
    calc_decomposition((24.0 - 19.5) / 19.5 * 100, -30, "FX=24, 樓價 -3%/年 (10年)"),
]

# 5yr and 7yr ML predictions (linear approximation)
fx_5yr = FX_BLENDED_10 * 5 / 10
pr_5yr = PR_BLENDED_10 * 5 / 10
fx_7yr = FX_BLENDED_10 * 7 / 10
pr_7yr = PR_BLENDED_10 * 7 / 10

sc_5yr = calc_decomposition(fx_5yr, pr_5yr, "ML 加權預測 (5年)")
sc_7yr = calc_decomposition(fx_7yr, pr_7yr, "ML 加權預測 (7年)")

# Rent income in HKD for each scenario
def calc_rent_hkd(exit_fx, years):
    total_rent_jpy = ANNUAL_NET_RENT_JPY * years
    return total_rent_jpy / exit_fx / 10000  # in wan

# ═══════════════════════════════════════════════════
# BUILD DOCUMENT
# ═══════════════════════════════════════════════════
OUT = '/home/z/my-project/download/andy_report_body_v3.pdf'
CHART_DIR = '/home/z/my-project/download/ml_charts'
ARCH_PNG = '/home/z/my-project/download/model_architecture.png'

doc = SimpleDocTemplate(
    OUT, pagesize=A4,
    leftMargin=LM, rightMargin=RM, topMargin=TM, bottomMargin=BM
)

story = []

# ═══════════════════════════════════════════════════
# CHAPTER 1: 投資概述
# ═══════════════════════════════════════════════════
story.append(h1('一、投資概述'))

story.append(h2('1.1 物業基本資料'))
story.append(p('本報告評估對象為日本住宅物業，買入價為 HKD 320 萬（折合 JPY 6,240 萬，入場匯率 1 HKD = 19.5 JPY）。投資者 Andy 以自付首期 HKD 192 萬（佔物業總價 60%）作為初始資金投入，餘下 40% 即 HKD 128 萬（折合 JPY 2,496 萬）透過銀行按揭融資。此槓桿結構令 Andy 能以較少的自有資金控制更大規模的資產，同時按揭利息成本亦需在回報計算中扣減。'))

# Key params table
t1 = make_table_left_first(
    ['項目', '金額 / 參數'],
    [
        ['物業總價', 'HKD 320 萬 (JPY 6,240 萬)'],
        ['Andy 自付首期 (60%)', 'HKD 192 萬'],
        ['銀行按揭 (40% LTV)', 'HKD 128 萬 (JPY 2,496 萬)'],
        ['按揭利率', '每年 3%'],
        ['按揭年期', '10 年 (120 個月)'],
        ['入場匯率 (JPY/HKD)', '19.5'],
        ['預期年租金回報率', '6% (扣管理費後淨約 5.7%)'],
    ],
    col_widths=[CW * 0.40, CW * 0.60]
)
story.append(t1)
story.append(cap('表 1: 物業投資基本參數'))

story.append(h2('1.2 按揭供款詳情'))
story.append(p('銀行按揭金額為 JPY 2,496 萬，年利率 3%，分 10 年（120 個月）攤還。經計算，每月供款為 JPY 241,016，10 年總供款 JPY 2,892.2 萬，其中本金 JPY 2,496 萬，利息總額 JPY 396.2 萬（折合入場匯率約 HKD 20.3 萬）。換言之，Andy 在 10 年按揭期內，除歸還本金外，需額外承擔約 HKD 20.3 萬的利息支出，此為投資的明確成本。'))

t2 = make_table_left_first(
    ['按揭項目', '金額'],
    [
        ['貸款金額', 'JPY 2,496 萬 (HKD 128 萬)'],
        ['每月供款', 'JPY 241,016'],
        ['10 年總供款', 'JPY 2,892.2 萬'],
        ['其中利息總額', 'JPY 396.2 萬 (HKD 20.3 萬)'],
        ['供款後貸款餘額 (10年)', 'JPY 0 (已供滿)'],
    ],
    col_widths=[CW * 0.40, CW * 0.60]
)
story.append(t2)
story.append(cap('表 2: 按揭供款明細'))

story.append(h2('1.3 租金收入與營運成本'))
story.append(p('物業預期年租金回報率為 6%，即每年租金收入 JPY 374.4 萬。扣除每年管理費及物業稅等營運成本（約物業價值的 0.3%，即 JPY 18.7 萬）後，每年淨租金收入為 JPY 355.7 萬。需要注意的是，實際收取的租金需先用於支付每月按揭供款（JPY 24.1 萬/月 = JPY 289.2 萬/年），餘下部分方為 Andy 的正現金流收入。在 10 年持有期內，扣減按揭後的每年淨現金流為 JPY 66.5 萬（正現金流），顯示租金收入足以覆蓋按揭支出而有盈餘。'))

story.append(h2('1.4 入場與出場價值對比框架'))
story.append(p('本報告的核心分析框架是比較物業在入場時與出場時的資本價值差異，並將此差異分解為兩個獨立驅動因素：<b>物業價格變動</b>和<b>匯率變動</b>。入場時，物業價值為 JPY 6,240 萬，按 19.5 JPY/HKD 的匯率計算，等於 HKD 320 萬。出場時，物業的 JPY 價值取決於日本樓價的升跌，而折算為 HKD 的金額則同時受匯率影響。因此，Andy 最終收回的港元金額，是這兩個因素共同作用的結果，而非單一因素所能決定。'))


# ═══════════════════════════════════════════════════
# CHAPTER 2: ML 模型架構
# ═══════════════════════════════════════════════════
story.append(h1('二、ML 模型架構'))

story.append(h2('2.1 數據來源'))
story.append(p('本模型採用美國聯邦儲備銀行 FRED 數據庫的真實歷史數據，包括四個核心時間序列：JPY/USD 月度匯率（1971-2026 年，共 665 個數據點，代碼 EXJPUS）、日本住宅價格指數季度數據（1955-2025 年，共 284 個數據點，代碼 QJPN628BIS）、美國聯邦基金利率月度數據（1954-2026 年，共 863 個數據點，代碼 FEDFUNDS）、以及日本政策利率月度數據（1985-2026 年，共 490 個數據點，代碼 IRSTCI01JPM156N）。數據經季度對齊處理後，最終獲得 104 個有效訓練樣本，較 V1 版本的 16 個年度估計數據大幅提升，顯著增強了模型的學習能力和預測可靠性。'))

story.append(h2('2.2 模型方法'))
story.append(p('本模型採用四種機器學習算法進行集成預測，分別為 XGBoost、LightGBM、Random Forest 和 Gradient Boosting Regressor（GBR）。每個模型均使用時間序列交叉驗證（TimeSeriesSplit）進行評估，以確保不會出現未來數據洩漏的問題。集成預測時，以各模型交叉驗證 MAE（平均絕對誤差）的倒數平方作為權重，對四個模型的預測結果進行加權平均。匯率預測方面，表現最佳模型為 GBR（CV MAE 19.7%），物業價格預測方面同樣以 GBR 表現最佳（CV MAE 15.6%）。'))

# Model comparison chart
img_mc = os.path.join(CHART_DIR, 'v2_model_comparison.png')
if os.path.exists(img_mc):
    story.append(Spacer(1, 8))
    story.append(Image(img_mc, width=CW, height=CW * 5 / 14))
    story.append(cap('圖 1: 四種 ML 模型交叉驗證 MAE 比較'))

story.append(h2('2.3 Monte Carlo 機率模擬'))
story.append(p('在獲得 ML 集成預測點估計後，模型進一步結合歷史數據分佈特徵，採用 t 分佈（自由度 20）進行 Monte Carlo 模擬，生成 10,000 個隨機情景。t 分佈相比正態分佈具有更厚的尾部，能更好地捕捉金融市場中的極端事件風險。最終預測值為 ML 點估計（佔 55% 權重）與歷史分佈均值（佔 45% 權重）的加權混合，兼顧了模型預測能力和歷史規律。這 10,000 個模擬結果構成了後續 84 情景機率加權的基礎。'))

# Architecture image
if os.path.exists(ARCH_PNG):
    story.append(Spacer(1, 8))
    story.append(Image(ARCH_PNG, width=CW, height=CW * 0.45))
    story.append(cap('圖 2: ML V2 模型六階段分析架構'))


# ═══════════════════════════════════════════════════
# CHAPTER 3: 預測結果
# ═══════════════════════════════════════════════════
story.append(h1('三、預測結果'))

story.append(h2('3.1 匯率預測'))
story.append(p('ML 模型對未來 10 年 JPY/HKD 匯率的加權混合預測為<b> +7.8%</b>，即由入場時的 19.5 JPY/HKD 上升至約 21.0 JPY/HKD。這代表日圓相對港元呈<b>貶值趨勢</b>：每 1 港元可兌換的日圓數量增加，意味著出場時將日圓資產換回港元會蒙受匯率損失。ARIMA 時間序列模型則預測匯率變化為 -1.9%（日圓微升），兩者方向不同，顯示匯率預測本身具有較大的不確定性。Monte Carlo 模擬的 10 年匯率變化分佈為：均值 +7.6%，中位數 +7.6%，第 5 百分位 -31.1%，第 95 百分位 +47.1%。'))

t3 = make_table_left_first(
    ['預測方法', '10 年匯率變化', '出場 JPY/HKD', '方向'],
    [
        ['ML 集成預測', '+0.2%', '19.54', '基本不變'],
        ['混合預測 (ML + 歷史)', '+7.8%', '21.02', '日圓貶值'],
        ['ARIMA (1,1,1)', '-1.9%', '19.13', '日圓微升'],
        ['MC 模擬均值', '+7.6%', '20.98', '日圓貶值'],
        ['MC 第 5 百分位', '-31.1%', '13.43', '日圓大幅升值'],
        ['MC 第 95 百分位', '+47.1%', '28.68', '日圓大幅貶值'],
    ],
    col_widths=[CW * 0.30, CW * 0.22, CW * 0.22, CW * 0.26]
)
story.append(t3)
story.append(cap('表 3: JPY/HKD 匯率 10 年預測結果比較'))

story.append(h2('3.2 物業價格預測'))
story.append(p('ML 模型對未來 10 年日本住宅價格的加權混合預測為<b> +5.0%</b>，即物業價格由 JPY 6,240 萬温和上升至約 JPY 6,552 萬。相比之下，ARIMA 模型預測物業價格將大幅上升 +21.2%，這主要反映了 ARIMA 對近期日本樓市復甦趨勢的線性外推。Monte Carlo 模擬結果顯示，物業價格 10 年變化的均值為 +4.8%，但分佈較廣：第 5 百分位為 -24.7%（價格大幅下跌），第 95 百分位為 +35.0%（價格顯著上升）。'))

t4 = make_table_left_first(
    ['預測方法', '10 年物業價格變化', '出場物業 (JPY 萬)', '方向'],
    [
        ['ML 集成預測', '+0.0%', '6,240', '不變'],
        ['混合預測 (ML + 歷史)', '+5.0%', '6,552', '溫和上升'],
        ['ARIMA (1,1,1)', '+21.2%', '7,563', '顯著上升'],
        ['MC 模擬均值', '+4.8%', '6,539', '溫和上升'],
        ['MC 第 5 百分位', '-24.7%', '4,699', '大幅下跌'],
        ['MC 第 95 百分位', '+35.0%', '8,424', '顯著上升'],
    ],
    col_widths=[CW * 0.30, CW * 0.22, CW * 0.22, CW * 0.26]
)
story.append(t4)
story.append(cap('表 4: 日本住宅價格 10 年預測結果比較'))

# Probability distribution chart
img_pd = os.path.join(CHART_DIR, 'v2_probability_distribution.png')
if os.path.exists(img_pd):
    story.append(Spacer(1, 8))
    story.append(Image(img_pd, width=CW, height=CW * 5.5 / 14))
    story.append(cap('圖 3: 匯率與物業價格 ML 預測機率分佈'))



# ═══════════════════════════════════════════════════
# CHAPTER 4: 物業資本價值分析 (KEY CHAPTER)
# ═══════════════════════════════════════════════════
story.append(h1('四、物業資本價值分析'))

story.append(h2('4.1 分析方法說明'))
story.append(p('本章以入場時的物業價值 HKD 320 萬為基準，計算不同情景下出場時的物業 HKD 價值，並將價值變動分解為兩個獨立組成部分：<b>物業升幅</b>（假設匯率不變，純粹由日本樓價變動帶來的 HKD 價值變化）和<b>匯率影響</b>（假設物業價格不變，純粹由 JPY/HKD 匯率變動帶來的 HKD 價值變化）。兩者相加再加上一個微小的交叉效應，即為物業資本價值的總變動金額。此分析未扣減按揭利息支出，亦未加入租金收入，純粹反映物業本身資本價值的變化。'))

story.append(h2('4.2 ML 加權預測 — 10 年物業資本價值'))

ml = scenarios[0]
story.append(p(f'根據 ML 混合預測，10 年後匯率由 19.5 變動至 {ml["exit_fx"]:.2f} JPY/HKD（日圓貶值 +7.8%），物業價格由 JPY 6,240 萬上升至 JPY {ml["exit_jpy"]/10000:,.0f} 萬（升幅 +5.0%）。折算為港元後，出場物業價值約為 HKD {ml["exit_hkd_wan"]:.1f} 萬，較入場價 HKD 320 萬變動 {ml["total_wan"]:+.1f} 萬。'))

story.append(callout(f'ML 加權 10 年預測：物業資本價值變動總和 = {fmt_hkd(ml["total_wan"])}'))

story.append(pl(f'其中：'))
story.append(pl(f'  物業升幅（樓價 +5.0%，假設匯率不變）：{fmt_hkd(ml["prop_wan"])}'))
story.append(pl(f'  匯率影響（日圓貶值，假設樓價不變）：{fmt_hkd(ml["fx_wan"])}'))
story.append(pl(f'  交叉效應：{fmt_hkd(ml["interaction_wan"])}'))

story.append(p(f'此結果顯示，在 ML 預測的最可能情景下，單純的物業資本價值實際上會<b>微跌約 HKD {abs(ml["total_wan"]):.1f} 萬</b>。原因是日圓貶值帶來的匯率損失（HKD {abs(ml["fx_wan"]):.1f} 萬）超過了物業價格上升帶來的資本增值（HKD {ml["prop_wan"]:.1f} 萬）。這是一個重要發現：在日圓貶值環境下，即使日本樓價上升，港元投資者的物業資本價值仍可能下跌。'))

story.append(h2('4.3 不同持有期的 ML 預測'))
story.append(p('以下為 ML 加權預測下 5 年、7 年及 10 年三個持有期的物業資本價值變動比較。持有期越長，物業升幅的累積效應越大，但匯率貶值的影響亦同步放大。'))

hold_rows = []
for sc, yrs in [(sc_5yr, 5), (sc_7yr, 7), (scenarios[0], 10)]:
    hold_rows.append([
        f'{yrs} 年',
        f'{sc["exit_fx"]:.2f}',
        f'{sc["exit_hkd_wan"]:.1f}',
        fmt_hkd(sc["prop_wan"]),
        fmt_hkd(sc["fx_wan"]),
        fmt_hkd(sc["total_wan"]),
    ])

t5 = make_table_left_first(
    ['持有期', '出場匯率', '出場價值', '物業升幅', '匯率影響', '總和'],
    hold_rows,
    col_widths=[CW*0.12, CW*0.14, CW*0.16, CW*0.18, CW*0.18, CW*0.22]
)
story.append(t5)
story.append(cap('表 5: ML 加權預測 — 不同持有期物業資本價值變動 (HKD)'))

story.append(h2('4.4 情景對照 — 物業與匯率的獨立影響'))
story.append(p('為更清晰地展示物業價格與匯率各自的影響，以下列舉多個情景進行對照分析。每個情景均以入場價 HKD 320 萬為基準，顯示出場時的物業 HKD 價值及其組成部分。'))

scenario_rows = []
for sc in scenarios:
    scenario_rows.append([
        sc['label'],
        fmt_hkd_abs(sc['exit_hkd_wan']),
        fmt_hkd(sc['prop_wan']),
        fmt_hkd(sc['fx_wan']),
        fmt_hkd(sc['total_wan']),
    ])

t6 = make_table_left_first(
    ['情景', '出場價值', '物業升幅', '匯率影響', '總和'],
    scenario_rows,
    col_widths=[CW*0.28, CW*0.16, CW*0.18, CW*0.18, CW*0.20]
)
story.append(t6)
story.append(cap('表 6: 各情景物業資本價值分解 (HKD，10 年持有)'))

story.append(h2('4.5 關鍵發現'))
story.append(p('<b>發現一：匯率是更大變數。</b>在 ML 加權預測中，物業價格上升帶來 +HKD 16 萬的資本增值，但日圓貶值導致 -HKD 23.2 萬的匯率損失，最終物業資本價值微跌。這說明對於港元投資者而言，日圓匯率的走向對物業資本價值的影響，甚至可能超過日本本土樓價的升跌。'))

story.append(p('<b>發現二：最好情景收益可觀。</b>在日圓大幅升值至 13 JPY/HKD、同時樓價每年上升 3% 的最好情景下，物業出場價值高達 HKD 645.1 萬，總變動為 +HKD 325.1 萬。其中匯率貢獻 +HKD 160 萬，物業升幅貢獻 +HKD 110.1 萬，交叉效應 +HKD 55 萬。這相當於 Andy 的 192 萬首期資金在物業資本價值上增長了約 1.7 倍。'))

story.append(p('<b>發現三：最差情景虧損嚴重。</b>在日圓大幅貶值至 28 JPY/HKD、同時樓價每年下跌 3% 的最差情景下，物業出場價值僅 HKD 156 萬，總虧損達 -HKD 164 萬。物業貶值與匯率貶值雙重打擊，物業價值較入場時縮水超過一半，凸顯外幣物業投資的雙邊風險。'))

# Heatmap chart
img_hm = os.path.join(CHART_DIR, 'v2_probability_heatmap.png')
if os.path.exists(img_hm):
    story.append(Spacer(1, 8))
    story.append(Image(img_hm, width=CW, height=CW * 0.6))
    story.append(cap('圖 4: 84 情景機率加權熱力圖（氣泡大小 = 機率，顏色 = 回報）'))


# ═══════════════════════════════════════════════════
# CHAPTER 5: 綜合回報分析（含租金與按揭）
# ═══════════════════════════════════════════════════
story.append(h1('五、綜合回報分析'))

story.append(h2('5.1 完整回報構成'))
story.append(p('第四章的物業資本價值分析僅反映資產本身的價值變化，未包含租金收入和按揭成本。本章將所有因素綜合計算，給出 Andy 的完整投資回報。完整回報由三個部分組成：第一部分是物業資本價值變動（即第四章的物業+匯率總和），第二部分是租金淨收入（扣除管理費，按出場匯率折算為 HKD），第三部分是按揭利息支出（作為成本扣減）。最終的淨回報 = 物業資本價值變動 + 租金收入 - 按揭利息。'))

story.append(h2('5.2 ML 加權綜合回報 — 10 年'))
ml = scenarios[0]
rent_hkd_10 = calc_rent_hkd(ml['exit_fx'], 10)

story.append(p(f'在 ML 加權預測情景下（匯率 21.02 JPY/HKD，物業 +5.0%）：'))
story.append(pl(f'  物業資本價值變動：{fmt_hkd(ml["total_wan"])}'))
story.append(pl(f'  10 年租金淨收入（扣管理費）：JPY 3,556.8 萬 = HKD {rent_hkd_10:.1f} 萬'))
story.append(pl(f'  按揭利息支出：JPY 396.2 萬 = HKD {INTEREST_HKD/10000:.1f} 萬'))
net_10 = ml["total_wan"] + rent_hkd_10 - INTEREST_HKD / 10000
story.append(pl(f'  綜合淨回報：{fmt_hkd(net_10)}'))
story.append(pl(f'  最終回收總額：HKD {EQUITY_HKD_WAN + net_10:.1f} 萬'))

story.append(callout(f'ML 加權 10 年綜合淨回報：{fmt_hkd(net_10)}（含物業、匯率、租金、按揭利息）'))

story.append(p(f'可以看到，雖然物業資本價值因日圓貶值而微跌 {abs(ml["total_wan"]):.1f} 萬，但 10 年累積的租金淨收入（HKD {rent_hkd_10:.1f} 萬）遠超按揭利息成本（HKD {INTEREST_HKD/10000:.1f} 萬），使整體投資仍能獲得正回報。租金收入是此投資的核心收益來源，其金額遠大於物業資本價值的變動。'))

story.append(h2('5.3 最好與最差情景綜合回報'))
best = scenarios[1]
worst = scenarios[2]
rent_best = calc_rent_hkd(best['exit_fx'], 10)
rent_worst = calc_rent_hkd(worst['exit_fx'], 10)
net_best = best["total_wan"] + rent_best - INTEREST_HKD / 10000
net_worst = worst["total_wan"] + rent_worst - INTEREST_HKD / 10000

t7 = make_table_left_first(
    ['項目', 'ML 加權', '最好情景', '最差情景'],
    [
        ['出場匯率 (JPY/HKD)', f'{ml["exit_fx"]:.2f}', f'{best["exit_fx"]:.2f}', f'{worst["exit_fx"]:.2f}'],
        ['物業資本價值變動', fmt_hkd(ml["total_wan"]), fmt_hkd(best["total_wan"]), fmt_hkd(worst["total_wan"])],
        ['10 年租金淨收入', fmt_hkd(rent_hkd_10), fmt_hkd(rent_best), fmt_hkd(rent_worst)],
        ['按揭利息支出', f'HKD -{INTEREST_HKD/10000:.1f}萬', f'HKD -{INTEREST_HKD/10000:.1f}萬', f'HKD -{INTEREST_HKD/10000:.1f}萬'],
        ['綜合淨回報', fmt_hkd(net_10), fmt_hkd(net_best), fmt_hkd(net_worst)],
        ['最終回收總額', fmt_hkd_abs(EQUITY_HKD_WAN + net_10), fmt_hkd_abs(EQUITY_HKD_WAN + net_best), fmt_hkd_abs(EQUITY_HKD_WAN + net_worst)],
    ],
    col_widths=[CW * 0.28, CW * 0.24, CW * 0.24, CW * 0.24]
)
story.append(t7)
story.append(cap('表 7: 三個關鍵情景之綜合回報比較 (HKD，10 年持有)'))

story.append(p(f'在最好情景下，Andy 投入的 HKD 192 萬首期，10 年後可回收 HKD {EQUITY_HKD_WAN + net_best:.1f} 萬，綜合淨回報達 {fmt_hkd(net_best)}。物業資本價值的大幅增長（日圓升值 + 樓價上升）加上可觀的租金收入，構成強勁的雙引擎回報。'))

story.append(p(f'在最差情景下，綜合淨回報為 {fmt_hkd(net_worst)}，最終回收 HKD {EQUITY_HKD_WAN + net_worst:.1f} 萬。雖然物業資本價值大幅縮水，但租金收入（即使在貶值匯率下仍折合 HKD {rent_worst:.1f} 萬）部分抵消了虧損，最終回報並非最差情景下資本價值變動的那麼極端。'))


# ═══════════════════════════════════════════════════
# CHAPTER 6: 總結
# ═══════════════════════════════════════════════════
story.append(h1('六、總結'))

story.append(h2('6.1 核心結論'))
story.append(p(f'基於 ML V2 模型的 84 情景機率加權分析，Andy 以 HKD 192 萬首期投資日本物業（總價 HKD 320 萬，銀行按揭 HKD 128 萬，利率 3%），在 ML 預測的最可能情景下，10 年後的綜合淨回報約為 {fmt_hkd(net_10)}，最終可回收約 HKD {EQUITY_HKD_WAN + net_10:.1f} 萬。'))

story.append(p('此回報的結構值得關注：<b>租金收入是主要利潤來源</b>（HKD {:.1f} 萬），而非物業資本價值變動。事實上，在 ML 預測的日圓貶值環境下，物業資本價值本身微跌約 HKD {:.1f} 萬。投資的盈利完全依賴租金收入對沖匯率損失和按揭利息後仍有盈餘。'.format(rent_hkd_10, abs(ml["total_wan"]))))

story.append(h2('6.2 風險提示'))
story.append(p('<b>匯率風險為首要風險。</b>ML 模型預測日圓將貶值約 7.8%，此預測若成真，匯率將侵蝕大部分物業升值帶來的收益。若日圓貶值幅度超過預期（如 MC 模擬第 95 百分位的 +47.1%），匯率損失將極為嚴重。相反，若日圓意外升值（如跌至 13 JPY/HKD），則匯率將成為最大的盈利驅動因素。匯率的不確定性是此投資的最大變數。'))

story.append(p('<b>樓價下跌風險。</b>雖然 ML 預測樓價溫和上升 5%，但歷史上日本樓價曾出現長期大幅下跌（1990 年代泡沫破裂後跌幅超過 50%）。MC 模擬第 5 百分位顯示樓價有 5% 機率在 10 年內下跌 24.7%，此風險不可忽視。'))

story.append(p('<b>流動性風險。</b>日本物業的買賣手續繁複，交易周期較長，且在需要急售時可能面臨折價。此外，海外物業的出租管理也需要委託專業機構，產生額外費用。'))

story.append(h2('6.3 投資決策參考'))
story.append(p(f'本報告的分析結果顯示，在 ML 加權預測情景下，Andy 的投資整體可獲得正回報（{fmt_hkd(net_10)}），但利潤的主要來源是租金而非資本增值。投資者應根據自身對日圓匯率走勢的判斷、對日本樓市前景的評估、以及對流動性的需求，綜合權衡後作出投資決定。若投資者認為日圓有較大機率升值，則此投資的潛在回報將顯著提升；若預期日圓持續貶值，則應審慎評估租金收入是否足以覆蓋匯率損失。'))

# V1 vs V2 comparison chart
img_v1 = os.path.join(CHART_DIR, 'v2_v1_comparison.png')
if os.path.exists(img_v1):
    story.append(Spacer(1, 8))
    story.append(Image(img_v1, width=CW, height=CW * 0.6))
    story.append(cap('圖 5: V1 (年度估計數據) vs V2 (FRED 真實季度數據) 模型比較'))

# Feature importance chart
img_fi = os.path.join(CHART_DIR, 'v2_feature_importance.png')
if os.path.exists(img_fi):
    story.append(Spacer(1, 8))
    story.append(Image(img_fi, width=CW, height=CW * 5 / 14))
    story.append(cap('圖 6: ML 模型特徵重要性'))


# ═══════════════════════════════════════════════════
# BUILD PDF
# ═══════════════════════════════════════════════════
doc.build(story)
print(f'Body PDF generated: {OUT}')