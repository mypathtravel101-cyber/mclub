#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Andy Japan Property ML V2 Report V4 — Rebuilt from scratch.
   Summary formula: 房價回報 + 匯率回報 + 租金回報 - 稅費 - 銀行供款費用
   All amounts in HKD. No ROI percentages.
"""

import os, numpy as np
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    Image, KeepTogether, HRFlowable
)
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase.pdfmetrics import registerFontFamily

# ═════════════════ FONTS ═════════════════
pdfmetrics.registerFont(TTFont('NotoSerifSC', '/usr/share/fonts/truetype/noto-serif-sc/NotoSerifSC-Regular.ttf'))
pdfmetrics.registerFont(TTFont('NotoSerifSCBold', '/usr/share/fonts/truetype/noto-serif-sc/NotoSerifSC-Bold.ttf'))
pdfmetrics.registerFont(TTFont('notosanssc', '/usr/share/fonts/truetype/noto-serif-sc/NotoSerifSC-Regular.ttf'))
pdfmetrics.registerFont(TTFont('DejaVuSans', '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'))
registerFontFamily('NotoSerifSC', normal='NotoSerifSC', bold='NotoSerifSCBold')
registerFontFamily('DejaVuSans', normal='DejaVuSans', bold='DejaVuSans')

# ═════════════════ PALETTE ═════════════════
ACCENT       = colors.HexColor('#26728b')
TEXT_PRIMARY  = colors.HexColor('#211f1d')
TEXT_MUTED    = colors.HexColor('#807b73')
BG_SURFACE   = colors.HexColor('#e3ded8')
TH_COLOR     = ACCENT
TH_TEXT      = colors.white
ROW_EVEN     = colors.white
ROW_ODD      = BG_SURFACE

# ═════════════════ STYLES ═════════════════
W, H = A4
LM = RM = TM = BM = 2.2*cm
CW = W - LM - RM

def S(name, font='NotoSerifSC', size=10.5, leading=18, color=TEXT_PRIMARY,
       align=TA_JUSTIFY, spaceBefore=3, spaceAfter=6, firstIndent=0, leftIndent=0,
       borderColor=None, borderWidth=0, borderPadding=0):
    kw = dict(fontName=font, fontSize=size, leading=leading, textColor=color,
              alignment=align, spaceBefore=spaceBefore, spaceAfter=spaceAfter,
              firstLineIndent=firstIndent, leftIndent=leftIndent,
              wordWrap='CJK')
    if borderColor:
        kw['borderColor'] = borderColor
        kw['borderWidth'] = borderWidth
        kw['borderPadding'] = borderPadding
    return ParagraphStyle(name, **kw)

h1 = lambda t: Paragraph(f'<b>{t}</b>', S('h1', size=20, leading=28, spaceBefore=22, spaceAfter=10, align=TA_LEFT))
h2 = lambda t: Paragraph(f'<b>{t}</b>', S('h2', size=14, leading=20, color=ACCENT, spaceBefore=16, spaceAfter=6, align=TA_LEFT))
p  = lambda t: Paragraph(t, S('p', align=TA_JUSTIFY))
pl = lambda t: Paragraph(t, S('pl', align=TA_LEFT))
cap = lambda t: Paragraph(t, S('cap', size=9, leading=13, color=TEXT_MUTED, align=TA_CENTER, spaceBefore=4, spaceAfter=8))
cal= lambda t: Paragraph(t, S('cal', size=11, leading=18, color=ACCENT, leftIndent=12, borderColor=ACCENT, borderWidth=2, borderPadding=8))
hr  = lambda: HRFlowable(width='100%', thickness=0.5, color=colors.HexColor('#26728b'), spaceBefore=6, spaceAfter=6, opacity=0.3)

def tbl(headers, rows, cw=None, align_map=None):
    """Build a styled table. align_map: list of TA_LEFT/TA_CENTER per column."""
    cw = cw or [CW / len(headers)] * len(headers)
    am = align_map or [TA_LEFT] + [TA_CENTER] * (len(headers) - 1)
    ths = S('_th', font='NotoSerifSC', size=9, leading=13, color=TH_TEXT, align=TA_CENTER)
    tds = [S(f'_td{i}', font='NotoSerifSC', size=9, leading=13, align=am[i]) for i in range(len(headers))]
    data = [[Paragraph(h, ths) for h in headers]]
    for r in rows:
        data.append([Paragraph(str(c), tds[i]) for i, c in enumerate(r)])
    t = Table(data, colWidths=cw, repeatRows=1)
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), TH_COLOR),
        ('TEXTCOLOR', (0,0), (-1,0), TH_TEXT),
        ('FONTSIZE', (0,0), (-1,0), 9),
        ('BOTTOMPADDING', (0,0), (-1,0), 7),
        ('TOPPADDING', (0,0), (-1,0), 7),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#cccccc')),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [ROW_EVEN, ROW_ODD]),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    return t

# ═════════════════ CALCULATIONS ═════════════════
ENTRY_FX   = 19.5
PRICE_JPY  = 62_400_000
PRICE_HKD  = 320.0       # wan
EQUITY_HKD = 192.0       # wan
LOAN_JPY   = 24_960_000
LOAN_HKD   = 128.0       # wan
RATE       = 0.03
NM         = 120
MR         = RATE / 12
MP_JPY     = LOAN_JPY * MR * (1+MR)**NM / ((1+MR)**NM - 1)
TOTAL_MORT_JPY = MP_JPY * NM
INTEREST_JPY   = TOTAL_MORT_JPY - LOAN_JPY
INTEREST_HKD   = INTEREST_JPY / ENTRY_FX / 10000  # in wan
MORT_TOTAL_HKD = TOTAL_MORT_JPY / ENTRY_FX / 10000

ANNUAL_RENT_GROSS  = PRICE_JPY * 0.06   # JPY
ANNUAL_COST        = PRICE_JPY * 0.003   # JPY
ANNUAL_RENT_NET    = ANNUAL_RENT_GROSS - ANNUAL_COST

# ML predictions
FX_BL = 7.8   # % JPY/HKD change (depreciation)
PR_BL = 5.0   # % property change

def calc(exit_fx, pr_chg_pct, years=10):
    """Full decomposition: returns dict with all HKD wan amounts."""
    exit_jpy = PRICE_JPY * (1 + pr_chg_pct / 100)
    exit_hkd_wan = exit_jpy / exit_fx / 10000

    # 1. Property gain (at entry FX): how much JPY price went up, in HKD
    prop_gain = (exit_jpy - PRICE_JPY) / ENTRY_FX / 10000
    # 2. FX gain: how much FX change on FULL exit property value
    fx_gain = exit_jpy * (1/exit_fx - 1/ENTRY_FX) / 10000
    # 3. Property + FX total
    prop_fx_total = prop_gain + fx_gain  # should equal exit_hkd_wan - PRICE_HKD

    # 4. Gross rent
    gross_rent = ANNUAL_RENT_GROSS * years / exit_fx / 10000
    # 5. Taxes/fees
    taxes = ANNUAL_COST * years / exit_fx / 10000
    # 6. Mortgage interest
    interest = INTEREST_HKD  # constant, at entry FX

    # 7. Net return
    net = prop_gain + fx_gain + gross_rent - taxes - interest

    return {
        'exit_fx': exit_fx, 'exit_jpy': exit_jpy, 'exit_hkd': exit_hkd_wan,
        'prop': prop_gain, 'fx': fx_gain, 'prop_fx': prop_fx_total,
        'rent': gross_rent, 'tax': taxes, 'interest': interest,
        'net': net,
        'total_received': exit_hkd_wan + (gross_rent - taxes),
        'profit': net,  # same as net for this formula
    }

# Key scenarios
ml10 = calc(ENTRY_FX * 1.078, PR_BL, 10)  # ML blended
best = calc(13.0, (1.03**10 - 1)*100, 10)
worst = calc(28.0, (0.97**10 - 1)*100, 10)
mid1  = calc(16.0, 15, 10)   # FX=16, +1.5%/yr
mid2  = calc(22.0, 0, 10)    # FX=22, flat
scenarios_list = [
    ('ML 加權預測', ml10),
    ('最好情景 (FX=13, +3%/年)', best),
    ('情景: FX=16, +1.5%/年', mid1),
    ('情景: FX=22, 樓價不變', mid2),
    ('最差情景 (FX=28, -3%/年)', worst),
]

# ═════════════════ BUILD DOCUMENT ═════════════════
OUT = '/home/z/my-project/download/andy_report_body_v4.pdf'
CHART = '/home/z/my-project/download/ml_charts'
ARCH  = '/home/z/my-project/download/model_architecture.png'

doc = SimpleDocTemplate(OUT, pagesize=A4, leftMargin=LM, rightMargin=RM, topMargin=TM, bottomMargin=BM)
story = []

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# CHAPTER 1: 投資概述
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
story.append(h1('一、投資概述'))
story.append(p('本報告評估客戶 Andy 投資日本住宅物業的回報前景。物業買入總價為 HKD 320 萬（折合 JPY 6,240 萬，入場匯率 1 HKD = 19.5 JPY）。Andy 自付首期 HKD 192 萬（佔 60%），餘下 HKD 128 萬（40%）透過銀行按揭融資，年利率 3%，分 10 年（120 個月）攤還。本報告所有投資回報均以實際港元金額呈現，不使用 ROI 百分比。'))

story.append(h2('1.1 物業與按揭參數'))
story.append(tbl(
    ['項目', '金額 / 參數'],
    [
        ['物業總價', 'HKD 320 萬 (JPY 6,240 萬)'],
        ['Andy 自付首期 (60%)', 'HKD 192 萬'],
        ['銀行按揭 (40% LTV)', 'HKD 128 萬 (JPY 2,496 萬)'],
        ['按揭利率', '每年 3%'],
        ['按揭年期', '10 年 (120 個月)'],
        ['每月供款', 'JPY 241,016'],
        ['10 年供款總額', 'JPY 2,892.2 萬 (HKD 148.3 萬)'],
        ['其中利息', 'JPY 396.2 萬 (HKD 20.3 萬)'],
        ['入場匯率 (JPY/HKD)', '19.5'],
    ],
    cw=[CW*0.40, CW*0.60]
))
story.append(cap('表 1: 投資基本參數'))

story.append(h2('1.2 租金收入與營運成本'))
story.append(p('物業預期年租金回報率為 6%，即每年租金收入 JPY 374.4 萬。扣除管理費及物業稅等營運成本（約物業價值的 0.3%，每年 JPY 18.7 萬）後，每年淨租金收入為 JPY 355.7 萬。扣除每年按揭供款 JPY 289.2 萬後，每年正現金流約 JPY 66.5 萬，顯示租金收入足以覆蓋按揭支出。'))

story.append(h2('1.3 回報計算框架'))
story.append(p('本報告的回報計算採用以下公式，所有金額均以港元（HKD）呈現：'))
story.append(cal('<b>淨回報 = 房價回報 + 匯率回報 + 租金回報 - 稅費 - 銀行供款利息</b>'))
story.append(pl('其中各項定義如下：'))
story.append(pl('  <b>房價回報</b>：物業價格升跌帶來的港元金額變動（以入場匯率計算 JPY 差額再折算 HKD）'))
story.append(pl('  <b>匯率回報</b>：匯率變動對出場物業價值的港元影響'))
story.append(pl('  <b>租金回報</b>：10 年租金毛收入（以出場匯率折算 HKD）'))
story.append(pl('  <b>稅費</b>：10 年管理費及物業稅（以出場匯率折算 HKD）'))
story.append(pl('  <b>銀行供款利息</b>：10 年按揭利息總額（以入場匯率折算 HKD，本金償還不屬投資成本）'))


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# CHAPTER 2: ML 模型架構
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
story.append(h1('二、ML 模型架構'))

story.append(h2('2.1 數據來源'))
story.append(p('本模型採用美國聯邦儲備銀行 FRED 數據庫的四組真實歷史時間序列數據：JPY/USD 月度匯率（1971 至 2026 年，共 665 個數據點）、日本住宅價格指數季度數據（1955 至 2025 年，共 284 個數據點）、美國聯邦基金利率月度數據（1954 至 2026 年，共 863 個數據點），以及日本政策利率月度數據（1985 至 2026 年，共 490 個數據點）。所有數據經季度對齊處理後，最終獲得 104 個有效訓練樣本，較 V1 版本的 16 個年度估計數據大幅提升。'))

story.append(h2('2.2 四模型集成學習'))
story.append(p('模型採用 XGBoost、LightGBM、Random Forest 和 Gradient Boosting Regressor（GBR）四種算法進行集成預測，以各模型交叉驗證 MAE 的倒數平方作為權重進行加權平均。匯率預測方面，GBR 表現最佳（CV MAE 19.7%），物業價格預測方面同樣以 GBR 領先（CV MAE 15.6%）。模型使用時間序列交叉驗證確保無未來數據洩漏。'))

img = os.path.join(CHART, 'v2_model_comparison.png')
if os.path.exists(img):
    story.append(Image(img, width=CW, height=CW*5/14))
    story.append(cap('圖 1: 四種 ML 模型交叉驗證 MAE 比較'))

story.append(h2('2.3 Monte Carlo 機率模擬'))
story.append(p('在 ML 集成預測基礎上，模型結合歷史數據分佈，採用 t 分佈（自由度 20）進行 10,000 次 Monte Carlo 隨機模擬，生成機率分佈。最終混合預測值為 ML 點估計（55% 權重）與歷史分佈均值（45% 權重）的加權結果。這 10,000 個模擬結果用於對 84 種匯率與樓價情景進行機率加權，形成後續分析基礎。'))

if os.path.exists(ARCH):
    story.append(Image(ARCH, width=CW, height=CW*0.45))
    story.append(cap('圖 2: ML V2 模型六階段分析架構'))


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# CHAPTER 3: 預測結果
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
story.append(h1('三、預測結果'))

story.append(h2('3.1 匯率預測'))
story.append(p('ML 模型對未來 10 年 JPY/HKD 匯率的混合預測為 <b>+7.8%</b>，即由 19.5 上升至約 21.0 JPY/HKD。這代表<b>日圓相對港元貶值</b>：出場時每 1 港元可兌換更多日圓，將日圓資產換回港元時會蒙受匯率損失。ARIMA 模型則預測匯率微跌 -1.9%（日圓微升），兩者方向不同，顯示匯率預測本身具有較大不確定性。Monte Carlo 分佈範圍為第 5 至第 95 百分位：-31.1% 至 +47.1%。'))

story.append(tbl(
    ['預測方法', '10 年匯率變化', '出場 JPY/HKD', '方向'],
    [
        ['ML 混合預測', '+7.8%', '21.02', '日圓貶值'],
        ['ARIMA (1,1,1)', '-1.9%', '19.13', '日圓微升'],
        ['MC 模擬均值', '+7.6%', '20.98', '日圓貶值'],
        ['MC 第 5 百分位', '-31.1%', '13.43', '日圓大幅升值'],
        ['MC 第 95 百分位', '+47.1%', '28.68', '日圓大幅貶值'],
    ],
    cw=[CW*0.28, CW*0.22, CW*0.22, CW*0.28]
))
story.append(cap('表 2: JPY/HKD 匯率 10 年預測比較'))

story.append(h2('3.2 物業價格預測'))
story.append(p('ML 模型對 10 年日本住宅價格的混合預測為 <b>+5.0%</b>，即由 JPY 6,240 萬溫和上升至約 JPY 6,552 萬。ARIMA 預測為 +21.2%，反映對近期復甦趨勢的線性外推。Monte Carlo 分佈範圍為 -24.7% 至 +35.0%，顯示樓價走勢存在相當大的不確定性。'))

story.append(tbl(
    ['預測方法', '10 年樓價變化', '出場價格 (JPY 萬)', '方向'],
    [
        ['ML 混合預測', '+5.0%', '6,552', '溫和上升'],
        ['ARIMA (1,1,1)', '+21.2%', '7,563', '顯著上升'],
        ['MC 模擬均值', '+4.8%', '6,539', '溫和上升'],
        ['MC 第 5 百分位', '-24.7%', '4,699', '大幅下跌'],
        ['MC 第 95 百分位', '+35.0%', '8,424', '顯著上升'],
    ],
    cw=[CW*0.28, CW*0.22, CW*0.22, CW*0.28]
))
story.append(cap('表 3: 日本住宅價格 10 年預測比較'))

img = os.path.join(CHART, 'v2_probability_distribution.png')
if os.path.exists(img):
    story.append(Image(img, width=CW, height=CW*5.5/14))
    story.append(cap('圖 3: 匯率與物業價格 ML 預測機率分佈'))


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# CHAPTER 4: 物業資本價值分解
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
story.append(h1('四、物業資本價值分解'))

story.append(h2('4.1 分解方法'))
story.append(p('本章將物業出場時的港元價值與入場價值（HKD 320 萬）的差異，分解為兩個獨立驅動因素。<b>房價回報</b>計算物業 JPY 價格的升跌，以入場匯率折算為 HKD，模擬「假設匯率不變」時的價值變動。<b>匯率回報</b>計算出場時的匯率與入場匯率的差異對整筆物業 JPY 價值的影響，模擬「假設物業價格不變」時的匯率損益。兩者相加即為物業資本價值的總變動金額，此分析未包含租金收入及任何成本扣減。'))

story.append(h2('4.2 ML 加權預測（10 年）'))
m = ml10
story.append(p(f'ML 預測 10 年後匯率為 {m["exit_fx"]:.2f} JPY/HKD（日圓貶值 7.8%），物業價格升 5.0% 至 JPY {m["exit_jpy"]/10000:,.0f} 萬。折算港元後，出場物業價值約 HKD {m["exit_hkd"]:.1f} 萬，較入場 HKD 320 萬變動 {m["prop_fx"]:+.1f} 萬。'))
story.append(pl(f'  房價回報（物業 +5.0%，假設匯率不變）：HKD {m["prop"]:+.1f} 萬'))
story.append(pl(f'  匯率回報（日圓貶值，假設物業不變）：HKD {m["fx"]:+.1f} 萬'))
story.append(pl(f'  物業資本價值總變動：HKD {m["prop_fx"]:+.1f} 萬'))
story.append(p(f'結果顯示，在 ML 預測的最可能情景下，<b>日圓貶值的匯率損失（HKD {abs(m["fx"]):.1f} 萬）超過了物業升值的資本增益（HKD {m["prop"]:.1f} 萬）</b>，導致物業資本價值整體微跌。這說明對港元投資者而言，日圓匯率走向是比日本本土樓價更關鍵的變數。'))

story.append(h2('4.3 多情景物業資本價值對照'))
story.append(p('下表列出五個關鍵情景的物業資本價值分解，均以入場價 HKD 320 萬為基準。可以清楚看到，匯率對最終價值的影響往往大於物業價格本身的升跌。'))

rows = []
for label, s in scenarios_list:
    rows.append([label, f'{s["exit_hkd"]:.1f}',
                  f'{s["prop"]:+.1f}', f'{s["fx"]:+.1f}', f'{s["prop_fx"]:+.1f}'])
story.append(tbl(
    ['情景', '出場價值\n(HKD 萬)', '房價回報\n(HKD 萬)', '匯率回報\n(HKD 萬)', '總變動\n(HKD 萬)'],
    rows,
    cw=[CW*0.28, CW*0.17, CW*0.17, CW*0.17, CW*0.17]
))
story.append(cap('表 4: 各情景物業資本價值分解（10 年持有，HKD）'))

story.append(p(f'<b>最好情景</b>（日圓升值至 13 JPY/HKD，樓價每年 +3%）：物業出場價值高達 HKD {best["exit_hkd"]:.1f} 萬，其中匯率貢獻 HKD {best["fx"]:+.1f} 萬，房價貢獻 HKD {best["prop"]:+.1f} 萬，合共增值 HKD {best["prop_fx"]:+.1f} 萬。'))
story.append(p(f'<b>最差情景</b>（日圓貶值至 28 JPY/HKD，樓價每年 -3%）：出場價值僅 HKD {worst["exit_hkd"]:.1f} 萬，匯率與物業雙重貶值，合共損失 HKD {worst["prop_fx"]:+.1f} 萬。'))

img = os.path.join(CHART, 'v2_probability_heatmap.png')
if os.path.exists(img):
    story.append(Image(img, width=CW, height=CW*0.58))
    story.append(cap('圖 4: 84 情景機率加權熱力圖'))


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# CHAPTER 5: 綜合回報分析
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
story.append(h1('五、綜合回報分析'))

story.append(h2('5.1 完整回報公式'))
story.append(p('第四章的物業資本價值分析僅反映資產本身的價值變化。本章加入租金收入、稅費及按揭利息，計算 Andy 的完整投資回報。所有項目均以 HKD 呈現。'))

story.append(h2('5.2 ML 加權綜合回報（10 年）'))
m = ml10
story.append(tbl(
    ['回報項目', '金額 (HKD 萬)', '說明'],
    [
        ['房價回報', f'{m["prop"]:+.1f}', '物業升值 5.0%，以入場匯率折算'],
        ['匯率回報', f'{m["fx"]:+.1f}', '日圓貶值 7.8%，對出場物業價值的影響'],
        ['租金回報（10 年毛額）', f'{m["rent"]:+.1f}', f'年租金 JPY 374.4 萬，以出場匯率 {m["exit_fx"]:.1f} 折算'],
        ['減：稅費及管理費', f'{m["tax"]:+.1f}', '年費 JPY 18.7 萬，以出場匯率折算'],
        ['減：銀行按揭利息', f'{m["interest"]:+.1f}', '10 年利息 JPY 396.2 萬，以入場匯率折算'],
        ['淨回報', f'{m["net"]:+.1f}', '以上五項之總和'],
    ],
    cw=[CW*0.30, CW*0.20, CW*0.50],
    align_map=[TA_LEFT, TA_CENTER, TA_LEFT]
))
story.append(cap('表 5: ML 加權 10 年綜合回報明細 (HKD)'))

story.append(cal(f'ML 加權 10 年淨回報：HKD {m["net"]:+.1f} 萬'))

story.append(p(f'雖然物業資本價值因日圓貶值而微跌 HKD {abs(m["prop_fx"]):.1f} 萬，但 10 年累積的租金毛收入（HKD {m["rent"]:.1f} 萬）遠超按揭利息（HKD {m["interest"]:.1f} 萬）及稅費（HKD {m["tax"]:.1f} 萬），使整體投資仍獲得 HKD {m["net"]:.1f} 萬的淨回報。<b>租金是此投資的核心收益來源</b>，其金額遠大於物業資本價值的變動。'))

story.append(h2('5.3 五情景綜合回報對照'))
rows2 = []
for label, s in scenarios_list:
    rows2.append([label, f'{s["prop"]:+.1f}', f'{s["fx"]:+.1f}',
                   f'{s["rent"]:.1f}', f'{s["tax"]:.1f}', f'{s["interest"]:.1f}',
                   f'{s["net"]:+.1f}'])
story.append(tbl(
    ['情景', '房價', '匯率', '租金', '稅費', '利息', '淨回報'],
    rows2,
    cw=[CW*0.22, CW*0.11, CW*0.11, CW*0.13, CW*0.11, CW*0.11, CW*0.15]
))
story.append(cap('表 6: 五情景綜合回報分解 (HKD 萬，10 年持有)'))

story.append(p(f'在 ML 加權預測下，Andy 投入 HKD 192 萬，10 年後可獲得淨回報 HKD {ml10["net"]:.1f} 萬。在最好情景下，淨回報高達 HKD {best["net"]:.1f} 萬，主要受惠於日圓大幅升值帶來的匯率收益及高租金收入。在最差情景下，淨回報為 HKD {worst["net"]:.1f} 萬，雖然物業資本價值大幅縮水，但租金收入部分抵消了虧損。'))


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# CHAPTER 6: 總結
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
story.append(h1('六、總結'))

story.append(h2('6.1 ML 加權預測總結'))
story.append(p(f'基於 ML V2 模型的 84 情景機率加權分析，Andy 以 HKD 192 萬首期投資日本住宅物業（總價 HKD 320 萬，銀行按揭 HKD 128 萬，利率 3%，10 年期），在最可能的情景下，投資回報構成如下：'))

# Final summary table
story.append(tbl(
    ['項目', 'HKD 金額'],
    [
        ['房價回報（物業 +5.0%）', f'HKD {ml10["prop"]:+.1f} 萬'],
        ['匯率回報（日圓貶值 7.8%）', f'HKD {ml10["fx"]:+.1f} 萬'],
        ['租金回報（10 年毛額）', f'HKD {ml10["rent"]:+.1f} 萬'],
        ['減：稅費及管理費', f'HKD -{ml10["tax"]:.1f} 萬'],
        ['減：銀行按揭利息（10 年）', f'HKD -{ml10["interest"]:.1f} 萬'],
        ['淨回報', f'HKD {ml10["net"]:+.1f} 萬'],
    ],
    cw=[CW*0.55, CW*0.45],
    align_map=[TA_LEFT, TA_CENTER]
))
story.append(cap('表 7: ML 加權 10 年投資回報總結'))

story.append(p(f'Andy 投入 HKD 192 萬，預計 10 年後可獲得淨回報 HKD {ml10["net"]:+.1f} 萬。<b>租金收入是此投資的最大利潤來源</b>（HKD {ml10["rent"]:.1f} 萬毛額），而物業資本價值因日圓貶值而微跌（HKD {ml10["prop_fx"]:+.1f} 萬）。按揭利息成本為 HKD {ml10["interest"]:.1f} 萬，稅費為 HKD {ml10["tax"]:.1f} 萬。'))

story.append(h2('6.2 風險提示'))
story.append(p(f'<b>匯率風險為首要風險。</b>ML 預測日圓貶值約 7.8%，匯率損失（HKD {abs(ml10["fx"]):.1f} 萬）超過了物業升值的收益（HKD {ml10["prop"]:.1f} 萬）。若日圓貶值幅度超出預期（MC 第 95 百分位為 +47.1%），損失將極為嚴重。反過來，若日圓意外升值（如跌至 13 JPY/HKD），匯率將成為最大的盈利驅動因素（最好情景匯率收益 HKD {best["fx"]:+.1f} 萬）。'))
story.append(p('<b>樓價下跌風險。</b>雖然 ML 預測溫和上升 5%，但歷史上日本樓市曾出現長期大幅下跌（1990 年代泡沫破裂後跌幅超過 50%）。MC 模擬第 5 百分位顯示有 5% 機率在 10 年內下跌 24.7%，此尾部風險不可忽視。'))
story.append(p('<b>流動性風險。</b>日本物業買賣手續繁複、交易周期長，海外出租需委託管理機構並產生額外費用。'))

story.append(h2('6.3 最好與最差情景'))
story.append(p(f'<b>最好情景</b>（日圓升值至 13 JPY/HKD，樓價每年 +3%）：淨回報 HKD {best["net"]:+.1f} 萬，其中匯率貢獻 HKD {best["fx"]:+.1f} 萬，房價貢獻 HKD {best["prop"]:+.1f} 萬，租金 HKD {best["rent"]:.1f} 萬。Andy 的 192 萬首期在此情景下增長顯著。'))
story.append(p(f'<b>最差情景</b>（日圓貶值至 28 JPY/HKD，樓價每年 -3%）：淨回報 HKD {worst["net"]:+.1f} 萬。物業資本價值縮水 HKD {worst["prop_fx"]:+.1f} 萬，但租金收入（HKD {worst["rent"]:.1f} 萬）部分抵消了虧損。'))

# Charts
img = os.path.join(CHART, 'v2_v1_comparison.png')
if os.path.exists(img):
    story.append(Spacer(1, 8))
    story.append(Image(img, width=CW, height=CW*0.58))
    story.append(cap('圖 5: V1 (年度估計數據) vs V2 (FRED 真實季度數據)'))

img = os.path.join(CHART, 'v2_feature_importance.png')
if os.path.exists(img):
    story.append(Image(img, width=CW, height=CW*5/14))
    story.append(cap('圖 6: ML 模型特徵重要性'))


# ═════════════════ BUILD ═════════════════
doc.build(story)
print(f'Body PDF: {OUT}')