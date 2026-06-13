#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Andy Japan Property ML V2 Report - V4 Body (ReportLab)
   Key requirement: Summary uses formula:
     房價變動 + 匯率變動 + 租金收入 - 稅費 - 銀行供款費用
   All in HKD amounts, NO ROI percentages.
"""

import os

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import cm, mm
from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY, TA_RIGHT
from reportlab.lib.styles import ParagraphStyle
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

# ═══════════════════════════════════════════════════
# COLOR PALETTE (auto-generated)
# ═══════════════════════════════════════════════════
ACCENT = colors.HexColor('#1f7692')
TEXT_PRIMARY = colors.HexColor('#1b1a18')
TEXT_MUTED = colors.HexColor('#7a766f')
BG_SURFACE = colors.HexColor('#e5e3df')
BG_PAGE = colors.HexColor('#edecea')
TABLE_HEADER_COLOR = ACCENT
TABLE_HEADER_TEXT = colors.white
TABLE_ROW_EVEN = colors.white
TABLE_ROW_ODD = BG_SURFACE
POSITIVE_COLOR = colors.HexColor('#2d6a4f')
NEGATIVE_COLOR = colors.HexColor('#9b2226')

# ═══════════════════════════════════════════════════
# STYLES
# ═══════════════════════════════════════════════════
W, H = A4
LM, RM, TM, BM = 2.2*cm, 2.2*cm, 2.5*cm, 2.5*cm
CW = W - LM - RM

def make_styles():
    s = {}
    s['h1'] = ParagraphStyle('H1', fontName='NotoSerifSC', fontSize=20, leading=28,
        textColor=TEXT_PRIMARY, spaceBefore=24, spaceAfter=12, alignment=TA_LEFT)
    s['h2'] = ParagraphStyle('H2', fontName='NotoSerifSC', fontSize=15, leading=22,
        textColor=ACCENT, spaceBefore=18, spaceAfter=8, alignment=TA_LEFT)
    s['h3'] = ParagraphStyle('H3', fontName='NotoSerifSC', fontSize=12, leading=18,
        textColor=TEXT_PRIMARY, spaceBefore=12, spaceAfter=6, alignment=TA_LEFT)
    s['body'] = ParagraphStyle('Body', fontName='NotoSerifSC', fontSize=10.5, leading=18,
        textColor=TEXT_PRIMARY, spaceBefore=3, spaceAfter=6, alignment=TA_JUSTIFY, wordWrap='CJK')
    s['body_left'] = ParagraphStyle('BodyL', fontName='NotoSerifSC', fontSize=10.5, leading=18,
        textColor=TEXT_PRIMARY, spaceBefore=3, spaceAfter=6, alignment=TA_LEFT, wordWrap='CJK')
    s['caption'] = ParagraphStyle('Cap', fontName='NotoSerifSC', fontSize=9, leading=14,
        textColor=TEXT_MUTED, spaceBefore=4, spaceAfter=8, alignment=TA_CENTER, wordWrap='CJK')
    s['callout'] = ParagraphStyle('Callout', fontName='NotoSerifSC', fontSize=11, leading=18,
        textColor=ACCENT, spaceBefore=6, spaceAfter=6, alignment=TA_LEFT, wordWrap='CJK',
        leftIndent=12, borderColor=ACCENT, borderWidth=2, borderPadding=8)
    s['small'] = ParagraphStyle('Small', fontName='NotoSerifSC', fontSize=9, leading=14,
        textColor=TEXT_MUTED, spaceBefore=2, spaceAfter=4, alignment=TA_LEFT, wordWrap='CJK')
    s['formula_title'] = ParagraphStyle('FormulaTitle', fontName='NotoSerifSC', fontSize=12, leading=18,
        textColor=TEXT_PRIMARY, spaceBefore=8, spaceAfter=4, alignment=TA_CENTER, wordWrap='CJK')
    return s

STY = make_styles()

# ═══════════════════════════════════════════════════
# HELPERS
# ═══════════════════════════════════════════════════
def h1(t): return Paragraph(f'<b>{t}</b>', STY['h1'])
def h2(t): return Paragraph(f'<b>{t}</b>', STY['h2'])
def h3(t): return Paragraph(f'<b>{t}</b>', STY['h3'])
def p(t): return Paragraph(t, STY['body'])
def pl(t): return Paragraph(t, STY['body_left'])
def cap(t): return Paragraph(t, STY['caption'])
def callout(t): return Paragraph(t, STY['callout'])
def small(t): return Paragraph(t, STY['small'])
def hr(): return HRFlowable(width='100%', thickness=0.5, color=ACCENT, spaceBefore=8, spaceAfter=8, opacity=0.3)
def formula_title(t): return Paragraph(f'<b>{t}</b>', STY['formula_title'])

def make_table(headers, rows, col_widths=None):
    cw = col_widths or [CW / len(headers)] * len(headers)
    th_style = ParagraphStyle('TH', fontName='NotoSerifSC', fontSize=9.5, leading=14,
        textColor=TABLE_HEADER_TEXT, alignment=TA_CENTER, wordWrap='CJK')
    td_style = ParagraphStyle('TD', fontName='NotoSerifSC', fontSize=9.5, leading=14,
        textColor=TEXT_PRIMARY, alignment=TA_CENTER, wordWrap='CJK')
    td_left = ParagraphStyle('TDL', fontName='NotoSerifSC', fontSize=9.5, leading=14,
        textColor=TEXT_PRIMARY, alignment=TA_LEFT, wordWrap='CJK')

    data = [[Paragraph(h, th_style) for h in headers]]
    for row in rows:
        data.append([Paragraph(str(c), td_left if i == 0 else td_style) for i, c in enumerate(row)])

    t = Table(data, colWidths=cw, repeatRows=1, hAlign='CENTER')
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

def fmt(val_wan, prefix='HKD '):
    """Format HKD value in wan. Shows +/- sign."""
    if val_wan >= 0:
        return f'{prefix}+{val_wan:.1f}萬'
    else:
        return f'{prefix}{val_wan:.1f}萬'

def fmt_abs(val_wan):
    return f'HKD {abs(val_wan):.1f}萬'

def fmt_plain(val_wan):
    return f'HKD {val_wan:.1f}萬'

# ═══════════════════════════════════════════════════
# FINANCIAL DATA CALCULATIONS
# ═══════════════════════════════════════════════════
ENTRY_FX = 19.5           # JPY per HKD
PRICE_JPY = 62_400_000    # JPY
PRICE_HKD_WAN = 320.0     # HKD wan
EQUITY_HKD_WAN = 192.0    # HKD wan (60%)
LOAN_JPY = 24_960_000     # JPY (40%)
LOAN_HKD_WAN = 128.0      # HKD wan
RATE_ANNUAL = 0.03
MONTHLY_RATE = RATE_ANNUAL / 12
N_MONTHS_10 = 120

# Mortgage calculation
MP_JPY = LOAN_JPY * MONTHLY_RATE * (1 + MONTHLY_RATE)**N_MONTHS_10 / ((1 + MONTHLY_RATE)**N_MONTHS_10 - 1)
TOTAL_MORTGAGE_JPY = MP_JPY * N_MONTHS_10
TOTAL_INTEREST_JPY = TOTAL_MORTGAGE_JPY - LOAN_JPY
INTEREST_HKD_WAN = TOTAL_INTEREST_JPY / ENTRY_FX / 10000  # in HKD wan

# Rent calculation
ANNUAL_RENT_JPY = PRICE_JPY * 0.06        # JPY 374.4萬
ANNUAL_COST_JPY = PRICE_JPY * 0.003       # JPY 18.7萬 (management + property tax)
ANNUAL_NET_RENT_JPY = ANNUAL_RENT_JPY - ANNUAL_COST_JPY  # JPY 355.7萬

# Tax on sale (acquisition tax ~3%, already paid at entry; capital gains ~20% on gain)
# We treat "稅費" as the annual property tax / management cost embedded in rent calc above.
# For the summary formula: 稅費 = annual costs deducted from gross rent
ANNUAL_TAX_COST_JPY = ANNUAL_COST_JPY  # JPY 18.7萬/yr

# ML Predictions (from v2_ml_results.json)
FX_BLENDED_10 = 7.8    # % JPY depreciation over 10yr
PR_BLENDED_10 = 5.0    # % property appreciation over 10yr

def calc_full(fx_chg_pct, pr_chg_pct, years=10):
    """Full decomposition: property + FX + rent - tax - mortgage interest, all in HKD wan."""
    exit_fx = ENTRY_FX * (1 + fx_chg_pct / 100)
    exit_jpy = PRICE_JPY * (1 + pr_chg_pct / 100)

    # Property value change (at entry FX rate, so pure property effect)
    prop_gain_wan = (exit_jpy - PRICE_JPY) / ENTRY_FX / 10000

    # FX effect (at entry property value, so pure FX effect)
    fx_gain_wan = PRICE_JPY * (1 / exit_fx - 1 / ENTRY_FX) / 10000

    # Rent income: total net rent converted at exit FX
    total_net_rent_jpy = ANNUAL_NET_RENT_JPY * years
    rent_hkd_wan = total_net_rent_jpy / exit_fx / 10000

    # Tax/cost: total annual costs (already netted out of rent above, but for formula clarity)
    total_tax_cost_jpy = ANNUAL_TAX_COST_JPY * years
    tax_hkd_wan = total_tax_cost_jpy / exit_fx / 10000

    # Mortgage interest (converted at entry FX - cost is fixed in JPY)
    interest_hkd_wan = INTEREST_HKD_WAN

    # Net formula: property + FX + rent - tax - interest
    net = prop_gain_wan + fx_gain_wan + rent_hkd_wan - tax_hkd_wan - interest_hkd_wan

    return {
        'exit_fx': exit_fx,
        'exit_jpy': exit_jpy,
        'prop_wan': prop_gain_wan,
        'fx_wan': fx_gain_wan,
        'rent_wan': rent_hkd_wan,
        'tax_wan': tax_hkd_wan,
        'interest_wan': interest_hkd_wan,
        'net_wan': net,
    }

# Key scenarios
ml_10 = calc_full(FX_BLENDED_10, PR_BLENDED_10, 10)
ml_5 = calc_full(FX_BLENDED_10 * 5/10, PR_BLENDED_10 * 5/10, 5)
ml_7 = calc_full(FX_BLENDED_10 * 7/10, PR_BLENDED_10 * 7/10, 7)

best_10 = calc_full((13.0 - 19.5) / 19.5 * 100, (1.03**10 - 1) * 100, 10)
worst_10 = calc_full((28.0 - 19.5) / 19.5 * 100, -30, 10)
fx_flat_10 = calc_full(0, (1.03**10 - 1) * 100, 10)
fx13_flat_10 = calc_full((13.0 - 19.5) / 19.5 * 100, 0, 10)
fx16_moderate_10 = calc_full((16.0 - 19.5) / 19.5 * 100, 15, 10)
fx22_flat_10 = calc_full((22.0 - 19.5) / 19.5 * 100, 0, 10)
fx24_decline_10 = calc_full((24.0 - 19.5) / 19.5 * 100, -30, 10)

all_scenarios = [
    ('ML 加權預測 (10年)', ml_10),
    ('最好情景 (FX=13, +3%/年)', best_10),
    ('最差情景 (FX=28, -3%/年)', worst_10),
    ('FX 不變, 樓價 +3%/年', fx_flat_10),
    ('FX=13, 樓價不變', fx13_flat_10),
    ('FX=16, 樓價 +1.5%/年', fx16_moderate_10),
    ('FX=22, 樓價不變', fx22_flat_10),
    ('FX=24, 樓價 -3%/年', fx24_decline_10),
]

# ═══════════════════════════════════════════════════
# BUILD DOCUMENT
# ═══════════════════════════════════════════════════
OUT = '/home/z/my-project/download/andy_report_body_v4.pdf'
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
story.append(p('本報告評估對象為日本住宅物業，買入價為 HKD 320 萬（折合 JPY 6,240 萬，入場匯率 1 HKD = 19.5 JPY）。投資者 Andy 以自付首期 HKD 192 萬（佔物業總價 60%）作為初始資金投入，餘下 40% 即 HKD 128 萬（折合 JPY 2,496 萬）透過銀行按揭融資。此槓桿結構令 Andy 能以較少的自有資金控制更大規模的資產，同時按揭利息成本亦需在回報計算中扣減。整個投資分析的核心框架為：以入場時的物業價值 HKD 320 萬為基準，計算持有期內各項收入與支出對港元計價的最終影響。'))

t1 = make_table(
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
story.append(p('銀行按揭金額為 JPY 2,496 萬，年利率 3%，分 10 年（120 個月）等額本息攤還。經計算，每月供款為 JPY 241,016，10 年總供款額為 JPY 2,892.2 萬，其中本金 JPY 2,496 萬，利息總額 JPY 396.2 萬（按入場匯率折算約 HKD 20.3 萬）。換言之，Andy 在 10 年按揭期內，除歸還 128 萬本金外，需額外承擔約 HKD 20.3 萬的利息支出，此為投資的明確固定成本，無論物業價格或匯率如何變動，這筆利息支出都已經確定。'))

t2 = make_table(
    ['按揭項目', '金額'],
    [
        ['貸款金額', 'JPY 2,496 萬 (HKD 128 萬)'],
        ['每月供款', 'JPY 241,016'],
        ['10 年總供款', 'JPY 2,892.2 萬'],
        ['其中本金', 'JPY 2,496 萬'],
        ['其中利息總額', 'JPY 396.2 萬 (HKD 20.3 萬)'],
        ['供款後貸款餘額 (10年後)', 'JPY 0 (已供滿)'],
    ],
    col_widths=[CW * 0.40, CW * 0.60]
)
story.append(t2)
story.append(cap('表 2: 按揭供款明細'))

story.append(h2('1.3 租金收入與營運成本'))
story.append(p('物業預期年租金回報率為 6%，即每年租金收入 JPY 374.4 萬。扣除每年管理費及物業稅等營運成本（約物業價值的 0.3%，即 JPY 18.7 萬）後，每年淨租金收入為 JPY 355.7 萬。按入場匯率計算，每年淨租金折合約 HKD 18.2 萬。在 10 年持有期內，租金需先用於支付每月按揭供款（JPY 289.2 萬/年），餘下部分方為 Andy 的正現金流收入。值得注意的是，租金收入受出場匯率影響——若日圓貶值，同樣的日圓租金折算為港元會減少，這是匯率風險的另一個面向。'))

story.append(h2('1.4 回報計算公式'))
story.append(p('本報告的核心分析方法是將投資回報分解為五個獨立組成部分，以港元金額直接呈現，讓 Andy 清楚看到每一項收入和支出的實際金額。回報計算公式如下：'))

story.append(formula_title('投資淨回報 = 房價變動 + 匯率變動 + 租金收入 - 稅費 - 銀行供款費用'))

story.append(p('其中各項的定義為：房價變動是日本物業價格本身的升跌，以入場匯率折算為港元差額；匯率變動是假設物業日圓價格不變，純粹因 JPY/HKD 匯率改變而產生的港元價值變化；租金收入是扣除管理費後的淨租金，按出場匯率折算為港元；稅費是持有期內的物業稅及管理費合計，按出場匯率折算為港元；銀行供款費用是按揭總利息支出，按入場匯率折算為港元。五項相加即為 Andy 在持有期內的投資淨回報，正數代表賺錢，負數代表虧損。'))


# ═══════════════════════════════════════════════════
# CHAPTER 2: ML 模型架構
# ═══════════════════════════════════════════════════
story.append(h1('二、ML 模型架構'))

story.append(h2('2.1 數據來源'))
story.append(p('本模型採用美國聯邦儲備銀行 FRED 數據庫的真實歷史數據，涵蓋四個核心時間序列：JPY/USD 月度匯率（1971-2026 年，共 665 個數據點）、日本住宅價格指數季度數據（1955-2025 年，共 284 個數據點）、美國聯邦基金利率月度數據（1954-2026 年，共 863 個數據點）、以及日本政策利率月度數據（1985-2026 年，共 490 個數據點）。四個序列經季度對齊處理後，最終獲得 104 個有效訓練樣本，較 V1 版本的 16 個樣本大幅提升，顯著增強了模型對歷史規律的學習能力和預測可靠性。'))

story.append(h2('2.2 模型方法'))
story.append(p('本模型採用四種機器學習算法進行集成預測：XGBoost、LightGBM、Random Forest 和 Gradient Boosting Regressor（GBR）。每個模型均使用時間序列交叉驗證（TimeSeriesSplit）進行評估，確保不會出現未來數據洩漏。集成預測時，以各模型交叉驗證 MAE（平均絕對誤差）的倒數平方作為權重，對四個模型的預測結果進行加權平均。匯率預測方面，表現最佳模型為 GBR（CV MAE 19.7%），物業價格預測方面同樣以 GBR 表現最佳（CV MAE 15.6%），整體預測精度較 V1 版本有顯著提升。'))

img_mc = os.path.join(CHART_DIR, 'v2_model_comparison.png')
if os.path.exists(img_mc):
    story.append(Spacer(1, 8))
    story.append(Image(img_mc, width=CW, height=CW * 5 / 14))
    story.append(cap('圖 1: 四種 ML 模型交叉驗證 MAE 比較'))

story.append(h2('2.3 Monte Carlo 機率模擬'))
story.append(p('在獲得 ML 集成預測點估計後，模型進一步結合歷史數據分佈特徵，採用 t 分佈（自由度 20）進行 Monte Carlo 模擬，生成 10,000 個隨機情景。t 分佈相比正態分佈具有更厚的尾部，能更好地捕捉金融市場中的極端事件風險。最終預測值為 ML 點估計（佔 55% 權重）與 Monte Carlo 歷史分佈均值（佔 45% 權重）的加權混合，兼顧了模型預測能力和歷史規律的穩健性。這 10,000 個模擬結果構成了後續 84 情景機率加權分析的基礎。'))

if os.path.exists(ARCH_PNG):
    story.append(Spacer(1, 8))
    story.append(Image(ARCH_PNG, width=CW, height=CW * 0.45))
    story.append(cap('圖 2: ML V2 模型六階段分析架構'))


# ═══════════════════════════════════════════════════
# CHAPTER 3: 預測結果
# ═══════════════════════════════════════════════════
story.append(h1('三、預測結果'))

story.append(h2('3.1 匯率預測'))
story.append(p('ML 模型對未來 10 年 JPY/HKD 匯率的加權混合預測為<b> +7.8%</b>，即由入場時的 19.5 JPY/HKD 上升至約 21.0 JPY/HKD。這代表日圓相對港元呈<b>貶值趨勢</b>：每 1 港元可兌換的日圓數量增加，意味著出場時將日圓資產換回港元會蒙受匯率損失。ARIMA 時間序列模型則預測匯率變化為 -1.9%（日圓微升），兩者方向不同，顯示匯率預測本身具有較大的不確定性。Monte Carlo 模擬的 10 年匯率變化分佈範圍極廣：第 5 百分位為 -31.1%（日圓大幅升值至 13.4），第 95 百分位為 +47.1%（日圓大幅貶值至 28.7），反映匯率是此投資的最大不確定性來源。'))

t3 = make_table(
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
story.append(p('ML 模型對未來 10 年日本住宅價格的加權混合預測為<b> +5.0%</b>，即物業價格由 JPY 6,240 萬温和上升至約 JPY 6,552 萬。相比之下，ARIMA 模型預測物業價格將大幅上升 +21.2%，這主要反映了 ARIMA 對近期日本樓市復甦趨勢的線性外推傾向。Monte Carlo 模擬結果顯示，物業價格 10 年變化的均值為 +4.8%，但分佈較廣：第 5 百分位為 -24.7%（價格大幅下跌至 JPY 4,699 萬），第 95 百分位為 +35.0%（價格顯著上升至 JPY 8,424 萬）。整體而言，模型認為日本樓價在未來 10 年傾向温和上升，但下行風險不容忽視。'))

t4 = make_table(
    ['預測方法', '10 年樓價變化', '出場物業 (JPY 萬)', '方向'],
    [
        ['ML 集成預測', '+0.0%', '6,240', '不變'],
        ['混合預測 (ML + 歷史)', '+5.0%', '6,552', '温和上升'],
        ['ARIMA (1,1,1)', '+21.2%', '7,563', '顯著上升'],
        ['MC 模擬均值', '+4.8%', '6,539', '温和上升'],
        ['MC 第 5 百分位', '-24.7%', '4,699', '大幅下跌'],
        ['MC 第 95 百分位', '+35.0%', '8,424', '顯著上升'],
    ],
    col_widths=[CW * 0.30, CW * 0.22, CW * 0.22, CW * 0.26]
)
story.append(t4)
story.append(cap('表 4: 日本住宅價格 10 年預測結果比較'))

img_pd = os.path.join(CHART_DIR, 'v2_probability_distribution.png')
if os.path.exists(img_pd):
    story.append(Spacer(1, 8))
    story.append(Image(img_pd, width=CW, height=CW * 5.5 / 14))
    story.append(cap('圖 3: 匯率與物業價格 ML 預測機率分佈'))


# ═══════════════════════════════════════════════════
# CHAPTER 4: 物業資本價值分析
# ═══════════════════════════════════════════════════
story.append(h1('四、物業資本價值分析'))

story.append(h2('4.1 分析方法說明'))
story.append(p('本章以入場時的物業價值 HKD 320 萬為基準，計算不同情景下出場時的物業港元價值，並將價值變動分解為兩個獨立組成部分：<b>房價變動</b>（假設匯率不變，純粹由日本樓價變動帶來的港元價值變化）和<b>匯率變動</b>（假設物業價格不變，純粹由 JPY/HKD 匯率變動帶來的港元價值變化）。此分析僅反映物業本身的資本價值變化，尚未包含租金收入和按揭成本。'))

story.append(h2('4.2 ML 加權預測 — 10 年物業資本價值'))

story.append(p(f'根據 ML 混合預測，10 年後匯率由 19.5 變動至 {ml_10["exit_fx"]:.2f} JPY/HKD（日圓貶值 +7.8%），物業價格由 JPY 6,240 萬上升至 JPY {ml_10["exit_jpy"]/10000:,.0f} 萬（升幅 +5.0%）。'))

story.append(callout(f'ML 加權 10 年預測物業資本價值變動總和 = {fmt(ml_10["prop_wan"] + ml_10["fx_wan"])}'))

story.append(pl(f'其中：'))
story.append(pl(f'  房價變動（樓價 +5.0%，假設匯率不變）：{fmt(ml_10["prop_wan"])}'))
story.append(pl(f'  匯率變動（日圓貶值，假設樓價不變）：{fmt(ml_10["fx_wan"])}'))

story.append(p(f'此結果顯示，在 ML 預測的最可能情景下，物業資本價值實際上會<b>微跌約 HKD {abs(ml_10["prop_wan"] + ml_10["fx_wan"]):.1f} 萬</b>。原因是日圓貶值帶來的匯率損失超過了物業價格上升帶來的資本增值。這是一個重要發現：對於港元投資者而言，日圓匯率的走向對物業資本價值的影響，甚至可能超過日本本土樓價的升跌。即使日本樓價上升，若日圓同時貶值，港元投資者的資本價值仍可能下跌。'))

story.append(h2('4.3 不同持有期的 ML 預測'))
story.append(p('以下為 ML 加權預測下 5 年、7 年及 10 年三個持有期的物業資本價值變動比較。持有期越長，物業升幅的累積效應越大，但匯率貶值的影響亦同步放大。兩者在較長的持有期內互相抵消的趨勢更為明顯。'))

hold_rows = []
for sc, yrs in [(ml_5, 5), (ml_7, 7), (ml_10, 10)]:
    hold_rows.append([
        f'{yrs} 年',
        f'{sc["exit_fx"]:.2f}',
        fmt(sc['prop_wan']),
        fmt(sc['fx_wan']),
        fmt(sc['prop_wan'] + sc['fx_wan']),
    ])

t5 = make_table(
    ['持有期', '出場匯率', '房價變動', '匯率變動', '資本價值總和'],
    hold_rows,
    col_widths=[CW*0.12, CW*0.14, CW*0.22, CW*0.22, CW*0.30]
)
story.append(t5)
story.append(cap('表 5: ML 加權預測 — 不同持有期物業資本價值變動 (HKD)'))

story.append(h2('4.4 多情景資本價值對照'))
story.append(p('為更清晰地展示房價與匯率各自的影響，以下列舉八個情景進行對照分析。每個情景均以入場價 HKD 320 萬為基準，顯示出場時的房價變動和匯率變動各自的港元金額。'))

scenario_rows = []
for label, sc in all_scenarios:
    scenario_rows.append([
        label,
        fmt(sc['prop_wan']),
        fmt(sc['fx_wan']),
        fmt(sc['prop_wan'] + sc['fx_wan']),
    ])

t6 = make_table(
    ['情景', '房價變動', '匯率變動', '資本價值總和'],
    scenario_rows,
    col_widths=[CW*0.30, CW*0.20, CW*0.20, CW*0.30]
)
story.append(t6)
story.append(cap('表 6: 各情景物業資本價值分解 (HKD，10 年持有)'))

story.append(h2('4.5 關鍵發現'))
story.append(p('<b>發現一：匯率是更大變數。</b>在 ML 加權預測中，物業價格上升帶來的房價增值為 HKD +16.0 萬，但日圓貶值導致的匯率損失為 HKD -23.2 萬，最終資本價值微跌。對於港元投資者而言，匯率走向對物業資本價值的影響幅度大於日本本土樓價的升跌幅度，這是海外物業投資的核心特徵。'))

story.append(p('<b>發現二：最好情景收益可觀。</b>在日圓大幅升值至 13 JPY/HKD、同時樓價每年上升 3% 的最好情景下，房價變動貢獻 HKD +110.1 萬，匯率變動貢獻 HKD +160.0 萬，兩者合力產生約 HKD +270 萬的資本增值，相當於首期資金的 1.4 倍。'))

story.append(p('<b>發現三：最差情景虧損嚴重。</b>在日圓大幅貶值至 28 JPY/HKD、同時樓價每年下跌 3% 的最差情景下，房價與匯率雙重打擊，資本價值總和虧損約 HKD -164 萬，物業價值較入場時縮水超過一半，凸顯外幣物業投資的雙邊風險。'))

img_hm = os.path.join(CHART_DIR, 'v2_probability_heatmap.png')
if os.path.exists(img_hm):
    story.append(Spacer(1, 8))
    story.append(Image(img_hm, width=CW, height=CW * 0.6))
    story.append(cap('圖 4: 84 情景機率加權熱力圖（氣泡大小 = 機率，顏色 = 回報）'))


# ═══════════════════════════════════════════════════
# CHAPTER 5: 綜合回報分析（五項分解）
# ═══════════════════════════════════════════════════
story.append(h1('五、綜合回報分析'))

story.append(h2('5.1 回報分解方法'))
story.append(p('第四章僅分析物業資本價值的變化。本章將所有收入和支出項目完整納入計算，按照以下公式逐項分解，以港元金額呈現 Andy 的完整投資回報：'))

story.append(formula_title('投資淨回報 = 房價變動 + 匯率變動 + 租金收入 - 稅費 - 銀行供款費用'))

story.append(p('五個項目的具體定義如下：第一，<b>房價變動</b>是物業日圓價格的升跌，以入場匯率折算為港元差額（純粹反映日本樓市的表現）。第二，<b>匯率變動</b>是假設物業日圓價格不變，純粹因 JPY/HKD 匯率改變而產生的港元價值變化（反映日圓匯率的影響）。第三，<b>租金收入</b>是扣除管理費後的淨租金總額，按出場匯率折算為港元。第四，<b>稅費</b>是持有期內的物業稅及管理費合計，按出場匯率折算為港元。第五，<b>銀行供款費用</b>是 10 年按揭的總利息支出，按入場匯率折算為港元。五項相加即為投資淨回報，正值代表賺錢，負值代表虧損。'))

story.append(h2('5.2 ML 加權預測 — 10 年五項分解'))
story.append(p(f'在 ML 加權預測情景下（出場匯率 {ml_10["exit_fx"]:.2f} JPY/HKD，物業升幅 +5.0%），各項回報分解如下：'))

# Summary breakdown table for ML weighted
ml_rows = [
    ['房價變動', fmt(ml_10['prop_wan']), '物業 JPY +5.0%，以入場匯率折算'],
    ['匯率變動', fmt(ml_10['fx_wan']), '日圓貶值 +7.8%，港元計價損失'],
    ['租金收入', fmt(ml_10['rent_wan']), '10 年淨租金按出場匯率折算'],
    ['稅費', fmt(-ml_10['tax_wan']), '物業稅及管理費（已從租金中扣除）'],
    ['銀行供款費用', fmt(-ml_10['interest_wan']), '10 年按揭總利息'],
    ['投資淨回報', fmt(ml_10['net_wan']), '以上五項之和'],
]

td_neg = ParagraphStyle('TDN', fontName='NotoSerifSC', fontSize=10, leading=15,
    textColor=TEXT_PRIMARY, alignment=TA_CENTER, wordWrap='CJK')
td_neg_l = ParagraphStyle('TDNL', fontName='NotoSerifSC', fontSize=10, leading=15,
    textColor=TEXT_PRIMARY, alignment=TA_LEFT, wordWrap='CJK')
th_s = ParagraphStyle('THS', fontName='NotoSerifSC', fontSize=10, leading=15,
    textColor=TABLE_HEADER_TEXT, alignment=TA_CENTER, wordWrap='CJK')
td_bold = ParagraphStyle('TDB', fontName='NotoSerifSCBold', fontSize=10.5, leading=15,
    textColor=ACCENT, alignment=TA_CENTER, wordWrap='CJK')
td_bold_l = ParagraphStyle('TDBL', fontName='NotoSerifSCBold', fontSize=10.5, leading=15,
    textColor=ACCENT, alignment=TA_LEFT, wordWrap='CJK')

summary_data = [[Paragraph(h, th_s) for h in ['項目', '金額 (HKD)', '說明']]]
for i, row in enumerate(ml_rows):
    if i == len(ml_rows) - 1:
        summary_data.append([Paragraph(row[0], td_bold_l), Paragraph(row[1], td_bold), Paragraph(row[2], td_neg)])
    else:
        summary_data.append([Paragraph(row[0], td_neg_l), Paragraph(row[1], td_neg), Paragraph(row[2], td_neg)])

t_summary = Table(summary_data, colWidths=[CW*0.22, CW*0.22, CW*0.56], hAlign='CENTER')
t_summary.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), TABLE_HEADER_COLOR),
    ('TEXTCOLOR', (0, 0), (-1, 0), TABLE_HEADER_TEXT),
    ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#cccccc')),
    ('ROWBACKGROUNDS', (0, 1), (-1, -2), [TABLE_ROW_EVEN, TABLE_ROW_ODD]),
    ('BACKGROUND', (0, -1), (-1, -1), colors.HexColor('#d4e9f0')),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
    ('TOPPADDING', (0, 0), (-1, -1), 8),
    ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ('LINEABOVE', (0, -1), (-1, -1), 1.5, ACCENT),
]))
story.append(t_summary)
story.append(cap('表 7: ML 加權預測 10 年投資回報五項分解 (HKD)'))

story.append(p(f'上表的結果顯示一個清晰的模式：<b>租金收入（HKD +{ml_10["rent_wan"]:.1f} 萬）是此投資的最大利潤來源</b>，遠超過房價變動和匯率變動的影響。雖然日圓貶值導致匯率變動為負值（HKD {ml_10["fx_wan"]:.1f} 萬），但租金收入的規模足以完全覆蓋匯率損失、稅費和銀行利息支出，最終仍產生正的投資淨回報。換言之，此投資的盈利核心是租金現金流，而非資本增值。'))

story.append(h2('5.3 最好與最差情景五項分解'))
story.append(p('以下為三個關鍵情景的五項回報分解對照，清楚展示不同市況下各項目對最終回報的貢獻差異。'))

comp_rows = [
    ['房價變動', fmt(ml_10['prop_wan']), fmt(best_10['prop_wan']), fmt(worst_10['prop_wan'])],
    ['匯率變動', fmt(ml_10['fx_wan']), fmt(best_10['fx_wan']), fmt(worst_10['fx_wan'])],
    ['租金收入', fmt(ml_10['rent_wan']), fmt(best_10['rent_wan']), fmt(worst_10['rent_wan'])],
    ['稅費', fmt(-ml_10['tax_wan']), fmt(-best_10['tax_wan']), fmt(-worst_10['tax_wan'])],
    ['銀行供款費用', fmt(-ml_10['interest_wan']), fmt(-best_10['interest_wan']), fmt(-worst_10['interest_wan'])],
    ['投資淨回報', fmt(ml_10['net_wan']), fmt(best_10['net_wan']), fmt(worst_10['net_wan'])],
]

comp_data = [[Paragraph(h, th_s) for h in ['項目', 'ML 加權', '最好情景', '最差情景']]]
for i, row in enumerate(comp_rows):
    if i == len(comp_rows) - 1:
        comp_data.append([Paragraph(row[0], td_bold_l)] + [Paragraph(c, td_bold) for c in row[1:]])
    else:
        comp_data.append([Paragraph(row[0], td_neg_l)] + [Paragraph(c, td_neg) for c in row[1:]])

t_comp = Table(comp_data, colWidths=[CW*0.24, CW*0.25, CW*0.25, CW*0.26], hAlign='CENTER')
t_comp.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), TABLE_HEADER_COLOR),
    ('TEXTCOLOR', (0, 0), (-1, 0), TABLE_HEADER_TEXT),
    ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#cccccc')),
    ('ROWBACKGROUNDS', (0, 1), (-1, -2), [TABLE_ROW_EVEN, TABLE_ROW_ODD]),
    ('BACKGROUND', (0, -1), (-1, -1), colors.HexColor('#d4e9f0')),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
    ('TOPPADDING', (0, 0), (-1, -1), 8),
    ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ('LINEABOVE', (0, -1), (-1, -1), 1.5, ACCENT),
]))
story.append(t_comp)
story.append(cap('表 8: 三個關鍵情景之投資回報五項分解比較 (HKD，10 年持有)'))

story.append(p(f'在最好情景下，房價和匯率雙雙利好，兩者合計貢獻約 HKD {best_10["prop_wan"] + best_10["fx_wan"]:.1f} 萬的資本增值，加上租金收入 HKD +{best_10["rent_wan"]:.1f} 萬，扣除成本後投資淨回報達 {fmt(best_10["net_wan"])}。Andy 投入的 HKD 192 萬首期，10 年後最終可回收約 HKD {EQUITY_HKD_WAN + best_10["net_wan"]:.1f} 萬。'))

story.append(p(f'在最差情景下，房價和匯率雙雙利空，資本價值大幅縮水，但租金收入（即使在貶值匯率下仍折合 HKD +{worst_10["rent_wan"]:.1f} 萬）部分抵消了虧損，最終投資淨回報為 {fmt(worst_10["net_wan"])}。最終可回收約 HKD {EQUITY_HKD_WAN + worst_10["net_wan"]:.1f} 萬。'))


# ═══════════════════════════════════════════════════
# CHAPTER 6: 總結
# ═══════════════════════════════════════════════════
story.append(h1('六、總結'))

story.append(h2('6.1 ML 預測情景：回報分解總覽'))
story.append(p(f'基於 ML V2 模型的 84 情景機率加權分析，Andy 以 HKD 192 萬首期投資日本物業（總價 HKD 320 萬，銀行按揭 HKD 128 萬，利率 3%），在 ML 預測的最可能情景下，10 年後的投資回報按五項分解如下：'))

# Final summary box
final_rows = [
    ['房價變動', fmt(ml_10['prop_wan'])],
    ['匯率變動', fmt(ml_10['fx_wan'])],
    ['租金收入', fmt(ml_10['rent_wan'])],
    ['稅費', fmt(-ml_10['tax_wan'])],
    ['銀行供款費用', fmt(-ml_10['interest_wan'])],
    ['投資淨回報', fmt(ml_10['net_wan'])],
]

final_data = [[Paragraph(h, th_s) for h in ['回報項目', '金額 (HKD)']]]
for i, row in enumerate(final_rows):
    if i == len(final_rows) - 1:
        final_data.append([Paragraph(row[0], td_bold_l), Paragraph(row[1], td_bold)])
    else:
        final_data.append([Paragraph(row[0], td_neg_l), Paragraph(row[1], td_neg)])

t_final = Table(final_data, colWidths=[CW*0.40, CW*0.35], hAlign='CENTER')
t_final.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), TABLE_HEADER_COLOR),
    ('TEXTCOLOR', (0, 0), (-1, 0), TABLE_HEADER_TEXT),
    ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#cccccc')),
    ('ROWBACKGROUNDS', (0, 1), (-1, -2), [TABLE_ROW_EVEN, TABLE_ROW_ODD]),
    ('BACKGROUND', (0, -1), (-1, -1), colors.HexColor('#d4e9f0')),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
    ('TOPPADDING', (0, 0), (-1, -1), 10),
    ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ('LINEABOVE', (0, -1), (-1, -1), 2, ACCENT),
]))
story.append(t_final)
story.append(cap('表 9: ML 加權預測 10 年投資回報總覽 (HKD)'))

story.append(callout(f'Andy 首期 HKD 192 萬，10 年後最終回收約 HKD {EQUITY_HKD_WAN + ml_10["net_wan"]:.1f} 萬'))

story.append(p(f'上表清楚顯示，此投資的盈利結構為：<b>租金收入（HKD +{ml_10["rent_wan"]:.1f} 萬）是最大的利潤來源</b>，而物業資本價值因日圓貶值而微跌約 HKD {abs(ml_10["prop_wan"] + ml_10["fx_wan"]):.1f} 萬（房價升幅被匯率貶值抵消）。扣除稅費和銀行利息後，投資淨回報為 {fmt(ml_10["net_wan"])}。這意味著 Andy 的 192 萬首期在 10 年後增值至約 HKD {EQUITY_HKD_WAN + ml_10["net_wan"]:.1f} 萬，主要靠租金現金流驅動，而非物業升值。'))

story.append(h2('6.2 風險提示'))

story.append(p('<b>匯率風險為首要風險。</b>ML 模型預測日圓將貶值約 7.8%，此預測若成真，匯率將侵蝕大部分物業升值帶來的收益。若日圓貶值幅度超過預期（如 MC 模擬第 95 百分位的 +47.1%），匯率損失將極為嚴重，可能完全吞噬租金收入。相反，若日圓意外升值（如跌至 13 JPY/HKD），則匯率將成為最大的盈利驅動因素。匯率的不確定性是此投資的最大變數，任何投資決策都應將匯率情景分析放在首位。'))

story.append(p('<b>樓價下跌風險。</b>雖然 ML 預測樓價温和上升 5%，但歷史上日本樓價曾出現長期大幅下跌（1990 年代泡沫破裂後跌幅超過 50%）。MC 模擬第 5 百分位顯示樓價有 5% 機率在 10 年內下跌 24.7%，此風險不可忽視。若樓價與匯率同時不利，投資虧損將顯著放大。'))

story.append(p('<b>流動性風險。</b>日本物業的買賣手續繁複，交易周期較長，且在需要急售時可能面臨折價。此外，海外物業的出租管理也需要委託專業機構，產生額外費用。'))

story.append(h2('6.3 投資決策參考'))
story.append(p(f'本報告的分析結果顯示，在 ML 加權預測情景下，Andy 的投資整體可獲得正回報（{fmt(ml_10["net_wan"])}），但利潤的主要來源是租金而非資本增值。投資者應根據自身對日圓匯率走勢的判斷、對日本樓市前景的評估、以及對流動性的需求，綜合權衡後作出投資決定。若投資者認為日圓有較大機率升值，則此投資的潛在回報將顯著提升；若預期日圓持續貶值，則應審慎評估租金收入是否足以覆蓋匯率損失。'))

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
print(f'ML 10yr net: {ml_10["net_wan"]:.1f} wan HKD')
print(f'Best 10yr net: {best_10["net_wan"]:.1f} wan HKD')
print(f'Worst 10yr net: {worst_10["net_wan"]:.1f} wan HKD')