#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Andy - Japan Property ML V2 Report (Rebuild v3)
All returns shown as HKD amounts only. No ROI%.
"""

import os, json
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    Image, PageBreak, HRFlowable
)
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase.pdfmetrics import registerFontFamily
from reportlab.platypus.flowables import Flowable

# ============================================================
# FONT
# ============================================================
FONT_PATH = '/usr/share/fonts/truetype/wqy/wqy-zenhei.ttc'
pdfmetrics.registerFont(TTFont('NotoSansSC', FONT_PATH))
pdfmetrics.registerFont(TTFont('NotoSansSC-Bold', FONT_PATH))
registerFontFamily('NotoSansSC', normal='NotoSansSC', bold='NotoSansSC-Bold')
FONT = 'NotoSansSC'
FONT_BOLD = 'NotoSansSC-Bold'

# ============================================================
# COLORS
# ============================================================
PAGE_BG       = colors.HexColor('#f6f7f7')
SECTION_BG    = colors.HexColor('#eeeff0')
CARD_BG       = colors.HexColor('#e6e8e9')
TABLE_STRIPE  = colors.HexColor('#eceeef')
HEADER_FILL   = colors.HexColor('#364d59')
BORDER        = colors.HexColor('#b9c3c8')
ICON          = colors.HexColor('#3b6a81')
ACCENT        = colors.HexColor('#c72f49')
TEXT_PRIMARY   = colors.HexColor('#232627')
TEXT_MUTED     = colors.HexColor('#7c8386')
SEM_SUCCESS   = colors.HexColor('#397d50')
SEM_ERROR     = colors.HexColor('#954d47')
SEM_INFO      = colors.HexColor('#4d769e')

# ============================================================
# PATHS
# ============================================================
BASE_DIR = '/home/z/my-project/download'
CHART_DIR = os.path.join(BASE_DIR, 'ml_charts')
OUTPUT_PATH = os.path.join(BASE_DIR, 'andy_report_body.pdf')
IMG_ARCH     = os.path.join(BASE_DIR, 'model_architecture.png')
IMG_DATA     = os.path.join(CHART_DIR, 'v2_data_overview.png')
IMG_MODEL    = os.path.join(CHART_DIR, 'v2_model_comparison.png')
IMG_PROB     = os.path.join(CHART_DIR, 'v2_probability_distribution.png')
IMG_HEATMAP  = os.path.join(CHART_DIR, 'v2_probability_heatmap.png')
IMG_V1V2     = os.path.join(CHART_DIR, 'v2_v1_comparison.png')
IMG_FEATURE  = os.path.join(CHART_DIR, 'v2_feature_importance.png')

PAGE_W, PAGE_H = A4
MARGIN = 25 * mm
USABLE_W = PAGE_W - 2 * MARGIN

# ============================================================
# STYLES
# ============================================================
def S(name, **kw):
    d = dict(fontName=FONT, fontSize=10, leading=16,
             textColor=TEXT_PRIMARY, alignment=TA_LEFT,
             wordWrap='CJK', spaceAfter=6, spaceBefore=2)
    d.update(kw)
    return ParagraphStyle(name, **d)

sTitle = S('sTitle', fontName=FONT_BOLD, fontSize=20, leading=28, textColor=HEADER_FILL, spaceAfter=4)
sH2 = S('sH2', fontName=FONT_BOLD, fontSize=12, leading=18, textColor=ICON, spaceBefore=10, spaceAfter=5)
sBody = S('sBody', fontSize=9.5, leading=16, alignment=TA_JUSTIFY)
sCaption = S('sCaption', fontSize=8, leading=12, textColor=TEXT_MUTED, alignment=TA_CENTER, spaceBefore=4, spaceAfter=10)
sFormula = S('sFormula', fontSize=9, leading=15, textColor=SEM_INFO, backColor=SECTION_BG, alignment=TA_CENTER, spaceBefore=6, spaceAfter=6, borderPadding=6)
sTH = S('sTH', fontName=FONT_BOLD, fontSize=8.5, leading=12, textColor=colors.white, alignment=TA_CENTER)
sTC = S('sTC', fontSize=8.5, leading=12, alignment=TA_CENTER, wordWrap='CJK')
sBullet = S('sBullet', fontSize=9, leading=15, leftIndent=14, bulletIndent=4, spaceBefore=2, spaceAfter=2)
sNote = S('sNote', fontSize=8, leading=13, textColor=TEXT_MUTED, leftIndent=8)
sFooter = S('sFooter', fontSize=7, leading=10, textColor=TEXT_MUTED, alignment=TA_CENTER)

# ============================================================
# CUSTOM FLOWABLES
# ============================================================
class SectionBanner(Flowable):
    def __init__(self, num, title, width=USABLE_W, height=28):
        Flowable.__init__(self)
        self.width = width
        self.height = height
        self.num = num
        self.title = title
    def draw(self):
        c = self.canv
        c.setFillColor(HEADER_FILL)
        c.roundRect(0, 0, self.width, self.height, 3, fill=1, stroke=0)
        cx, cy = 18, self.height / 2
        c.setFillColor(ACCENT)
        c.circle(cx, cy, 9, fill=1, stroke=0)
        c.setFillColor(colors.white)
        c.setFont(FONT_BOLD, 10)
        c.drawCentredString(cx, cy - 3.5, str(self.num))
        c.setFont(FONT_BOLD, 11)
        c.drawString(36, cy - 4, self.title)


class MetricRow(Flowable):
    def __init__(self, metrics, width=USABLE_W):
        Flowable.__init__(self)
        self.width = width
        n = len(metrics)
        gap = 8
        card_w = (width - (n-1)*gap) / n
        self.height = 52
        self.metrics = [(v, l, c, card_w) for v, l, c in metrics]
    def draw(self):
        c = self.canv
        x = 0
        for value, label, color, card_w in self.metrics:
            c.setFillColor(CARD_BG)
            c.roundRect(x, 0, card_w, self.height, 3, fill=1, stroke=0)
            c.setFillColor(color)
            c.setFont(FONT_BOLD, 14)
            c.drawCentredString(x + card_w/2, self.height - 22, value)
            c.setFillColor(TEXT_MUTED)
            c.setFont(FONT, 7)
            c.drawCentredString(x + card_w/2, 8, label)
            x += card_w + 8

# ============================================================
# HELPERS
# ============================================================
MAX_IMG_H = 390

def img(path, w=None):
    if not os.path.exists(path):
        return Paragraph(f'[Image not found: {os.path.basename(path)}]', sNote)
    if w is None:
        w = USABLE_W * 0.85
    from PIL import Image as PILImage
    im = PILImage.open(path)
    ratio = im.height / im.width
    h = w * ratio
    if h > MAX_IMG_H:
        h = MAX_IMG_H
        w = h / ratio
    return Image(path, width=w, height=h)

def box(text, bg=SECTION_BG, text_color=TEXT_PRIMARY, style=None):
    if style is None:
        style = sBody
    p = Paragraph(text, style)
    tbl = Table([[p]], colWidths=[USABLE_W])
    tbl.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), bg),
        ('BOX', (0,0), (-1,-1), 0.5, BORDER),
        ('TOPPADDING', (0,0), (-1,-1), 8),
        ('BOTTOMPADDING', (0,0), (-1,-1), 8),
        ('LEFTPADDING', (0,0), (-1,-1), 10),
        ('RIGHTPADDING', (0,0), (-1,-1), 10),
    ]))
    return tbl

def make_table(headers, rows, cw=None):
    hdr = [Paragraph(h, sTH) for h in headers]
    data = [hdr]
    for r in rows:
        data.append([Paragraph(str(c), sTC) for c in r])
    if cw is None:
        cw = [USABLE_W / len(headers)] * len(headers)
    tbl = Table(data, colWidths=cw, repeatRows=1)
    cmds = [
        ('BACKGROUND', (0,0), (-1,0), HEADER_FILL),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('FONTNAME', (0,0), (-1,0), FONT_BOLD),
        ('FONTSIZE', (0,0), (-1,0), 9),
        ('BOTTOMPADDING', (0,0), (-1,0), 8),
        ('TOPPADDING', (0,0), (-1,0), 8),
        ('GRID', (0,0), (-1,-1), 0.5, BORDER),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('TOPPADDING', (0,1), (-1,-1), 5),
        ('BOTTOMPADDING', (0,1), (-1,-1), 5),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
    ]
    for i in range(1, len(data)):
        if i % 2 == 0:
            cmds.append(('BACKGROUND', (0,i), (-1,i), TABLE_STRIPE))
    tbl.setStyle(TableStyle(cmds))
    return tbl

# ============================================================
# PAGE DECORATION
# ============================================================
def add_page_decor(canvas, doc):
    canvas.saveState()
    canvas.setFillColor(PAGE_BG)
    canvas.rect(0, 0, PAGE_W, PAGE_H, fill=1, stroke=0)
    canvas.setStrokeColor(HEADER_FILL)
    canvas.setLineWidth(1.5)
    canvas.line(MARGIN, PAGE_H - 15*mm, PAGE_W - MARGIN, PAGE_H - 15*mm)
    canvas.setFillColor(TEXT_MUTED)
    canvas.setFont(FONT, 7)
    canvas.drawString(MARGIN, 10*mm, 'PZC Group  |  客戶專屬  |  機密文件')
    canvas.drawRightString(PAGE_W - MARGIN, 10*mm, f'第 {doc.page} 頁')
    canvas.restoreState()

def first_page(canvas, doc):
    add_page_decor(canvas, doc)

# ============================================================
# BUILD
# ============================================================
def build_body():
    elements = []

    # ---- TITLE ----
    elements.append(Spacer(1, 25*mm))
    elements.append(Paragraph('日本物業投資評估報告', sTitle))
    elements.append(Paragraph('ML V2 機率加權分析 — 專屬客戶 Andy', S('sub1', fontSize=13,
        leading=18, textColor=ICON, spaceBefore=6, spaceAfter=16, alignment=TA_LEFT)))
    elements.append(HRFlowable(width='100%', thickness=1, color=BORDER, spaceAfter=12))
    elements.append(Paragraph(
        '本報告採用 84 情景壓力測試結合機器學習機率預測模型，對客戶 Andy 以港幣 320 萬'
        '（物業總價）透過銀行按揭（40% LTV）投資日本大阪物業之回報進行全面評估。'
        '分析涵蓋匯率風險、物業價格變動、持有期長短三大維度，透過 Monte Carlo 模擬為每個'
        '壓力情景賦予機率權重，從而得出更貼近現實之預期回報分佈。'
        '所有回報金額均已扣減按揭利息及供款，反映 Andy 之真實淨回報。',
        sBody
    ))
    elements.append(Spacer(1, 12*mm))
    elements.append(img(IMG_ARCH, w=USABLE_W * 0.78))
    elements.append(Paragraph('六階段分析架構示意圖', sCaption))
    elements.append(Spacer(1, 6*mm))
    elements.append(Paragraph(
        '報告產出日期：2025 年 7 月  |  分析方法：ML V2 Probability-Weighted  |  機密級別：客戶專屬',
        sFooter
    ))
    elements.append(PageBreak())

    # ================================================================
    # CH1
    # ================================================================
    elements.append(SectionBanner(1, '客戶入場決策 — 投資參數設定'))
    elements.append(Spacer(1, 5*mm))

    elements.append(Paragraph('1.1 客戶基本資料與投資意圖', sH2))
    elements.append(Paragraph(
        '客戶 Andy 擬購買日本大阪物業，物業總價為港幣 3,200,000 元（約 320 萬港元），'
        '折合日圓 62,400,000 元（約 6,240 萬日圓，入場匯率 19.5 JPY/HKD）。'
        'Andy 並非以全款購買，而是向銀行申請按揭貸款：按揭成數為 40% LTV，'
        '即向銀行借入物業價值之 40%（約 HKD 128 萬 / JPY 2,496 萬），'
        '自付 60% 首期（約 HKD 192 萬 / JPY 3,744 萬）。按揭年利率為 3%，'
        '屬日本房地產市場之正常水平。客戶之核心問題為：「10 年後，我會賺定虧？」'
        '為回答此問題，本報告依次拆解回報驅動因素、進行 84 情景壓力測試、'
        '建構機器學習預測模型，最終以機率加權方式呈現最可能之回報金額。',
        sBody
    ))
    elements.append(Spacer(1, 3*mm))

    elements.append(Paragraph('1.2 融資結構與貸款條件', sH2))
    elements.append(Paragraph(
        '是次投資之融資結構為 Andy 帶來兩方面嘅影響。一方面，槓桿放大咗回報——'
        '因為 Andy 只需投入 192 萬首期即可控制價值 320 萬之物業，若物業升值，'
        '利潤會高於無槓桿情況。另一方面，按揭貸款產生利息支出，構成固定之融資成本，'
        '需要由租金收入及最終物業出售價值來覆蓋。以下為詳細之貸款條件及 10 年供款計劃。',
        sBody
    ))
    elements.append(Spacer(1, 2*mm))

    params_h = ['參數項目', '數值', '說明']
    params_r = [
        ['物業總價', 'HKD 3,200,000（320 萬）', '日本大阪物業購買價格'],
        ['自付首期（60%）', 'HKD 1,920,000（192 萬）', 'Andy 實際投入之本金'],
        ['銀行按揭（40% LTV）', 'HKD 1,280,000（128 萬）', '向銀行借入之貸款'],
        ['按揭年利率', '3%', '固定利率假設'],
        ['預期年租金回報率', '6%', '基於大阪市場淨租金收益率'],
        ['每年持有成本', '物業價值之 0.3%', '管理費、固定資產稅等'],
        ['買入交易成本', '物業價值之 0.3%', '印花稅、登記費等（一次性）'],
        ['入場匯率', '19.5 JPY/HKD', '1 港元 = 19.5 日圓'],
    ]
    params_cw = [USABLE_W*0.26, USABLE_W*0.34, USABLE_W*0.40]
    elements.append(make_table(params_h, params_r, params_cw))
    elements.append(Spacer(1, 4*mm))

    # --- 1.3 按揭供款明細 ---
    elements.append(Paragraph('1.3 按揭供款明細與利息成本', sH2))
    elements.append(Paragraph(
        '以下為 Andy 之 10 年按揭供款詳細計算。基於等額本息還款方式，'
        '貸款金額為 JPY 24,960,000（HKD 128 萬），年利率 3%，還款期 10 年（120 個月）。'
        '每月供款包含本金及利息兩部分，前期供款以利息佔比較大，後期則以本金為主。'
        '至第 10 年末，貸款將全數還清，剩餘貸款餘額為零。',
        sBody
    ))
    elements.append(Spacer(1, 2*mm))

    mtg_h = ['項目', '金額（JPY）', '金額（HKD）', '備註']
    mtg_r = [
        ['貸款本金', '24,960,000', '1,280,000', '物業價值之 40%'],
        ['每月供款', '241,016', '12,362', '等額本息'],
        ['每年供款（12 個月）', '2,892,187', '148,318', '租金需優先覆蓋此金額'],
        ['10 年總供款', '28,921,874', '1,483,173', '本金 + 利息總和'],
        ['其中：償還本金', '24,960,000', '1,280,000', '與貸款金額相同'],
        ['其中：利息支出', '3,961,874', '203,173', '10 年累計利息成本'],
        ['10 年後剩餘貸款', '0', '0', '10 年期貸款已全數還清'],
    ]
    mtg_cw = [USABLE_W*0.24, USABLE_W*0.24, USABLE_W*0.22, USABLE_W*0.30]
    elements.append(make_table(mtg_h, mtg_r, mtg_cw))
    elements.append(Spacer(1, 3*mm))
    elements.append(box(
        '重點提示：Andy 在 10 年內需要向銀行支付總計約 JPY 2,892 萬之供款，'
        '其中 JPY 249.6 萬為償還貸款本金，JPY 396 萬為利息支出。'
        '即 10 年按揭利息總額約 HKD 20.3 萬。'
        '此筆利息支出已在所有回報計算中扣除，本報告所有金額均為扣減按揭費用後之淨回報。',
        bg=colors.HexColor('#fff3e0'), text_color=colors.HexColor('#e65100')
    ))
    elements.append(Spacer(1, 4*mm))

    # --- 1.4 年度現金流 ---
    elements.append(Paragraph('1.4 年度現金流結構', sH2))
    elements.append(Paragraph(
        '以下展示 Andy 在持有物業期間每年之現金流結構，清楚顯示租金收入、持有成本及按揭供款之關係。'
        '若每年現金流為正，表示租金收入足以覆蓋所有支出；若為負，則 Andy 需要自掏腰包補貼差額。',
        sBody
    ))
    elements.append(Spacer(1, 2*mm))

    cf_h = ['現金流項目', '每年金額（JPY）', '每年金額（HKD）', '性質']
    cf_r = [
        ['租金收入（6%）', '+ 3,744,000', '+ 192,000', '流入'],
        ['持有成本（0.3%）', '- 187,200', '- 9,600', '流出'],
        ['按揭供款（12 個月）', '- 2,892,187', '- 148,318', '流出'],
        ['每年淨現金流', '+ 664,613', '+ 34,082', '淨流入（正）'],
    ]
    cf_cw = [USABLE_W*0.26, USABLE_W*0.24, USABLE_W*0.24, USABLE_W*0.26]
    elements.append(make_table(cf_h, cf_r, cf_cw))
    elements.append(Spacer(1, 3*mm))
    elements.append(Paragraph(
        '如上表所示，即使扣減持有成本及按揭供款後，Andy 每年仍可獲得約 JPY 66.5 萬'
        '（約 HKD 3.4 萬）之正現金流。這意味着物業之租金收入足以覆蓋所有經營成本及按揭供款，'
        'Andy 無需額外注入資金維持物業。此穩定之正向現金流為投資提供了堅實之安全基礎，'
        '即使物業價格暫時下跌，只要租金收入持續，投資者亦不會面臨資金壓力。'
        '10 年累計之淨現金流為約 HKD 340.8 萬。',
        sBody
    ))
    elements.append(Spacer(1, 3*mm))

    elements.append(Paragraph('1.5 分析目標', sH2))
    elements.append(Paragraph(
        '本報告之核心目標是量化評估 Andy 在不同市場環境下之投資回報金額，'
        '且所有金額均為扣減按揭利息及供款後之淨回報。'
        '我們通過 84 個壓力測試情景，覆蓋匯率波動（從 13.0 到 28.0 JPY/HKD）、'
        '物業價格變動（年跌幅 3% 至年漲幅 3%）、以及不同持有期（5 年、7 年、10 年）之交叉組合。'
        '每一個情景均經由機器學習模型賦予機率權重，從而得出更精確之預期回報金額分佈。',
        sBody
    ))
    elements.append(PageBreak())

    # ================================================================
    # CH2
    # ================================================================
    elements.append(SectionBanner(2, '回報驅動因素拆解'))
    elements.append(Spacer(1, 5*mm))

    elements.append(Paragraph('2.1 確定因素與不確定因素', sH2))
    elements.append(Paragraph(
        '投資回報可拆分為兩大類因素。確定因素是指在入場時已經知道或可以精確計算之項目，'
        '包括租金收入（每年 6% 回報率）及貸款供款（40% LTV、3% 年利率、10 年等額本息）。'
        '這兩項在整個持有期間保持穩定，可以精確預測。'
        '不確定因素則是無法事先確定之變數，主要為匯率變化（JPY/HKD）及物業價格變幅。'
        '這兩個因素將決定投資之最終盈虧——匯率升跌直接影響日圓資產換算回港幣之金額，'
        '而物業價格則決定資產本身之升值或貶值幅度。以下公式將所有因素整合為最終回報計算。',
        sBody
    ))
    elements.append(Spacer(1, 3*mm))

    elements.append(Paragraph('2.2 核心回報公式', sH2))
    elements.append(Paragraph(
        '投資日本物業之最終 HKD 盈虧，可由以下核心公式計算。此公式將所有現金流（租金收入、'
        '持有成本、按揭供款、物業最終售價）統一處理，最終扣減銀行貸款餘額後換算為港幣，'
        '從而得出 Andy 之真實淨回報。',
        sBody
    ))
    elements.append(Spacer(1, 2*mm))
    elements.append(Paragraph(
        '<b>最終 HKD 盈虧</b> =（10 年後物業 JPY 價值 - 未還貸款 + 10 年租金淨收入）'
        '&divide; 10 年後匯率 - 入場 HKD 首期本金',
        sFormula
    ))
    elements.append(Spacer(1, 2*mm))
    elements.append(Paragraph(
        '其中「10 年租金淨收入」已扣減每年持有成本及按揭供款，'
        '即：每年淨現金流 = 租金收入 - 持有成本 - 按揭供款。'
        '「未還貸款」為 10 年後尚餘之銀行貸款餘額（在此案例中為零，因 10 年期貸款已全數還清）。',
        sBody
    ))
    elements.append(Spacer(1, 3*mm))

    # Formula breakdown
    f_h = ['公式組成部分', '說明', '基準情景金額']
    f_r = [
        ['10 年後物業 JPY 價值', '物業總價 x (1 + 年變幅)^10', 'JPY 62,400,000'],
        ['未還貸款', '10 年末之貸款餘額', 'JPY 0（已還清）'],
        ['10 年租金淨收入', '(租金 - 成本 - 供款) x 10', 'JPY 6,646,126'],
        ['合計 JPY 回收', '物業淨值 + 累計現金流', 'JPY 69,046,126'],
        ['換算 HKD', '合計 JPY &divide; 出場匯率', 'HKD 3,540,827'],
        ['扣減首期本金', '入場時自付金額', '- HKD 1,920,000'],
        ['最終利潤', '回收 HKD - 首期 HKD', 'HKD 1,620,827'],
    ]
    f_cw = [USABLE_W*0.26, USABLE_W*0.40, USABLE_W*0.34]
    elements.append(make_table(f_h, f_r, f_cw))
    elements.append(Spacer(1, 3*mm))
    elements.append(Paragraph(
        '上表展示基準情景（匯率不變 19.5、物業價格不變）下之回報計算過程。'
        '即使物業價格完全沒有升值，單靠租金收入在扣減所有成本及按揭供款後，'
        'Andy 仍可獲得約 HKD 162 萬之利潤（已扣減按揭利息 HKD 20.3 萬）。'
        '這說明在此融資結構下，租金收入是回報之核心驅動力，'
        '而匯率與物業價格則決定利潤之上下波動幅度。',
        sBody
    ))
    elements.append(Spacer(1, 3*mm))

    elements.append(Paragraph('2.3 匯率變動之影響', sH2))
    elements.append(Paragraph(
        '匯率是影響回報之最大單一變數。入場時 1 HKD = 19.5 JPY，'
        '若 10 年後日圓升值（數字變小，如 13.0），Andy 換回之港幣會更多；'
        '若日圓貶值（數字變大，如 28.0），換回之港幣則會減少。'
        '在壓力測試中，我們設定了 7 個匯率水平，從 13.0（日圓大幅升值）到 28.0（日圓大幅貶值），'
        '均勻覆蓋各種可能情景。',
        sBody
    ))
    elements.append(Spacer(1, 3*mm))

    elements.append(Paragraph('2.4 物業價格變動之影響', sH2))
    elements.append(Paragraph(
        '日本物業價格之長期走勢受經濟增長率、人口結構、都市化進程、政策法規等多因素影響。'
        '在壓力測試中，我們設定了四個物業價格年變動情景：年跌幅 3%（最壞情景）、'
        '零增長（保守情景）、年漲幅 1.5%（基準情景）、年漲幅 3%（樂觀情景）。'
        '此四個情景之選取基於日本過去數十年之物業價格歷史數據。'
        '需要特別指出的是，日本在 1990 年代經歷了嚴重的物業泡沫破裂，'
        '但近年在大阪、東京等主要都市之物業價格已呈現穩定復甦趨勢，'
        '因此年跌幅 3% 之情景已經是非常保守之假設。',
        sBody
    ))
    elements.append(PageBreak())

    # ================================================================
    # CH3
    # ================================================================
    elements.append(SectionBanner(3, '84 情景壓力測試'))
    elements.append(Spacer(1, 5*mm))

    elements.append(Paragraph('3.1 情景矩陣設定', sH2))
    elements.append(Paragraph(
        '將匯率（7 個水平）、物業價格年變幅（4 個等級）、持有年期（3 個期限）'
        '進行三維交叉組合，共產生 7 x 4 x 3 = 84 個獨立情景。'
        '每個情景均使用第 2 章之核心公式計算確定性利潤及港幣回 收金額。'
        '在 V1 版本中，每個情景之機率被假設為均等（約 1/28），'
        '這顯然不符合現實——極端情景之發生機率應遠低於中間情景。'
        'V2 版本透過 ML 模型為每個情景賦予基於歷史數據之實際機率，這將在第 4、5 章詳述。',
        sBody
    ))
    elements.append(Spacer(1, 2*mm))

    sc_h = ['維度', '設定值', '數量', '覆蓋範圍']
    sc_r = [
        ['匯率（JPY/HKD）', '13.0 / 16.0 / 19.5 / 22.0\n/ 24.0 / 26.0 / 28.0', '7', '大幅升值 → 大幅貶值'],
        ['物業價格年變幅', '-3% / 0% / +1.5% / +3%', '4', '年跌 3% → 年漲 3%'],
        ['持有年期', '5 年 / 7 年 / 10 年', '3', '中短期 → 長期'],
        ['合計情景數', '7 x 4 x 3', '84', '全面壓力測試'],
    ]
    sc_cw = [USABLE_W*0.22, USABLE_W*0.36, USABLE_W*0.12, USABLE_W*0.30]
    elements.append(make_table(sc_h, sc_r, sc_cw))
    elements.append(Spacer(1, 4*mm))

    elements.append(Paragraph('3.2 壓力測試結果概覽', sH2))
    elements.append(Paragraph(
        '以下為 84 個情景之壓力測試關鍵數據。所有金額均為扣減按揭供款及利息後之淨利潤，'
        '計算基礎為 Andy 之首期本金 HKD 192 萬。在最極端之不利情景下'
        '（日圓貶至 28.0 JPY/HKD 且物業價格年跌 3%），'
        '若僅持有 5 年，最大虧損約 HKD 33 萬。'
        '然而在同一匯率及樓價條件下，若延長至 10 年持有期，'
        '累積之租金淨收入足以抵消匯率及物業貶值之影響，轉為小幅虧損約 HKD 4 萬。'
        '這顯示長期持有之強大防禦能力。而在最樂觀情景下'
        '（日圓升值至 13.0 JPY/HKD 且物業年漲 3%），'
        '10 年利潤可高達約 HKD 504 萬，充分展示槓桿投資之潛在收益。',
        sBody
    ))
    elements.append(Spacer(1, 3*mm))

    elements.append(MetricRow([
        ('HKD -33萬', '最差 5 年虧損', SEM_ERROR),
        ('HKD +161萬', 'ML 加權 10 年利潤', SEM_SUCCESS),
        ('HKD +504萬', '最樂觀 10 年利潤', SEM_SUCCESS),
        ('HKD -4萬', '最差 10 年虧損', SEM_INFO),
    ]))
    elements.append(Spacer(1, 6*mm))
    elements.append(Paragraph(
        '壓力測試揭示幾個重要規律。第一，持有期越長，最差情景之利潤越好，'
        '這是因為租金累積效應在長期持有中能夠抵消資產價格下跌之影響。'
        '第二，匯率是影響回報之最大變數——在固定物業價格情景下，'
        '匯率從 19.5 升至 13.0 可使利潤增加超過一倍，而貶至 28.0 則大幅壓縮利潤。'
        '第三，84 個 10 年情景中，絕大部分情景均錄得正利潤，'
        '這為 Andy 之投資提供了強有力之底部支撐。不過，壓力測試之局限在於'
        '每個情景之機率被視為均等，這不符合現實情況——極端情景之發生機率應遠低於接近現狀之情景。'
        '這正是下一章 ML 機率預測模型要解決之問題。',
        sBody
    ))
    elements.append(PageBreak())

    # ================================================================
    # CH4
    # ================================================================
    elements.append(SectionBanner(4, 'V2 ML 機率預測模型'))
    elements.append(Spacer(1, 5*mm))

    elements.append(Paragraph('4.1 數據來源與特徵工程', sH2))
    elements.append(Paragraph(
        'V2 模型之核心改進在於引入真實宏觀經濟數據進行預測。'
        '我們從 FRED（美國聯邦儲備經濟數據）及 BIS（國際清算銀行）拉取了四組官方數據，'
        '涵蓋超過半世紀之歷史記錄。所有數據統一轉為季度頻率進行對齊，'
        '最終得到 104 個季度訓練樣本。在每個時間點上，我們計算了 15 個匯率特徵'
        '（涵蓋移動平均線、動量指標、波動率、均值回歸信號、利率差等技術及基本面因子）'
        '及 12 個物業價格特徵（涵蓋價格動量、供需指標、人口變化率、GDP 增長率等結構性因素），'
        '合共 27 個特徵變數。',
        sBody
    ))
    elements.append(Spacer(1, 2*mm))

    data_h = ['數據來源', '指標', '頻率', '數據量']
    data_r = [
        ['FRED EXJPUS', 'JPY/USD 匯率', '月度', '665 點（1971-2026）'],
        ['BIS QJPN628BIS', '日本住宅價格指數', '季度', '284 點（1955-2025）'],
        ['FRED FEDFUNDS', '美國聯邦基金利率', '月度', '863 點（1954-2026）'],
        ['FRED IRSTCI01JPM156N', '日本政策利率', '月度', '490 點（1985-2026）'],
    ]
    data_cw = [USABLE_W*0.26, USABLE_W*0.30, USABLE_W*0.14, USABLE_W*0.30]
    elements.append(make_table(data_h, data_r, data_cw))
    elements.append(Spacer(1, 3*mm))

    elements.append(img(IMG_DATA))
    elements.append(Paragraph('圖 1：V2 數據總覽 — 匯率與物業價格歷史走勢', sCaption))

    elements.append(Paragraph('4.2 模型訓練與比較', sH2))
    elements.append(Paragraph(
        '我們訓練了四個主流梯度提升模型（XGBoost、LightGBM、Random Forest、GBR），'
        '採用 5-fold 時序交叉驗證確保評估之可靠性。時序交叉驗證之特點是訓練集始終在測試集之前，'
        '避免未來數據洩露至訓練過程中。'
        '評估指標採用 MAE（平均絕對誤差）——即預測值與實際值之平均偏差幅度。'
        '經過嚴格比較，GBR（Gradient Boosting Regressor）'
        '在匯率和物業價格兩個預測任務上均取得最佳表現：匯率 MAE 19.7%，物業價格 MAE 15.6%。'
        '考慮到匯率與物業價格本身之高波動性，此精度在宏觀經濟預測領域屬於優秀水平。',
        sBody
    ))
    elements.append(Spacer(1, 2*mm))

    elements.append(img(IMG_MODEL))
    elements.append(Paragraph('圖 2：四個模型之交叉驗證 MAE 比較', sCaption))

    elements.append(img(IMG_FEATURE))
    elements.append(Paragraph('圖 3：特徵重要性排名 — 影響匯率與物業價格預測之關鍵因子', sCaption))

    elements.append(Paragraph('4.3 Monte Carlo 模擬與機率分佈', sH2))
    elements.append(Paragraph(
        '基於 GBR 模型之預測結果，我們進行了 10,000 次 Monte Carlo 模擬，'
        '以生成匯率與物業價格 10 年變動之完整機率分佈。'
        '模擬採用 t-分佈（而非常態分佈）以捕捉金融市場之「厚尾」特徵——'
        '即極端事件之發生機率高於常態分佈之預期。這是一個重要之模型選擇，'
        '因為金融市場歷史上多次出現「黑天鵝」事件，如 2008 年金融海嘯及 2020 年疫情衝擊，'
        '常態分佈往往低估此類極端事件之機率。',
        sBody
    ))
    elements.append(Spacer(1, 2*mm))

    mc_h = ['預測指標', '10 年變化預測', 'P5（保守）', 'P95（樂觀）', '分佈類型']
    mc_r = [
        ['匯率（JPY/HKD）', '+7.8%', '-31%', '+47%', 't-分佈（厚尾）'],
        ['物業價格', '+5.0%', '-25%', '+35%', 't-分佈（厚尾）'],
    ]
    mc_cw = [USABLE_W*0.22, USABLE_W*0.22, USABLE_W*0.18, USABLE_W*0.18, USABLE_W*0.20]
    elements.append(make_table(mc_h, mc_r, mc_cw))
    elements.append(Spacer(1, 3*mm))

    elements.append(img(IMG_PROB))
    elements.append(Paragraph('圖 4：Monte Carlo 模擬 — 匯率與物業價格 10 年變動之機率密度分佈', sCaption))

    elements.append(Paragraph('4.4 機率映射：從 ML 分佈到 84 情景', sH2))
    elements.append(Paragraph(
        'Monte Carlo 模擬產生的是連續之機率分佈，而壓力測試是離散之 84 個固定情景。'
        '我們需要一個「橋樑」將兩者連接起來。具體方法是：對於每個壓力情景之匯率和物業價格設定，'
        '分別計算其在 Monte Carlo 分佈中之機率密度（使用高斯函數），'
        '然後將兩個機率密度相乘得到聯合機率。這種方法之優勢在於能自然反映匯率與物業價格之相關性——'
        '當兩者變動方向一致時，聯合機率較高；方向相反時，聯合機率較低。'
        '例如，匯率 22.0 + 樓價年漲 3% 之聯合機率約為 5.7%，'
        '而匯率 28.0 + 樓價年跌 3%（極端不利）之聯合機率僅約 0.3%，'
        '差距近 20 倍。這正是 ML 加權與簡單均等機率之根本差異。',
        sBody
    ))

    elements.append(img(IMG_HEATMAP))
    elements.append(Paragraph('圖 5：84 情景機率熱力圖 — 機率加權後之利潤分佈', sCaption))
    elements.append(PageBreak())

    # ================================================================
    # CH5
    # ================================================================
    elements.append(SectionBanner(5, '機率加權回報計算'))
    elements.append(Spacer(1, 5*mm))

    elements.append(Paragraph('5.1 ML 加權 vs 簡單平均', sH2))
    elements.append(Paragraph(
        '將第 4 章得到之 ML 機率權重取代 V1 之均等機率，對 84 個情景做加權平均，'
        '即可得到 ML 機率加權之預期利潤。以下表格清楚展示兩種計算方法之差異。'
        'ML 加權利潤一致低於簡單平均利潤，這是因為 ML 模型壓低了極端情景（特別是極端樂觀情景）之機率，'
        '使其不再佔據過大比重。這實際上是一個更保守、更貼近現實之估計。'
        '所有金額均為扣減按揭利息（10 年共約 HKD 20.3 萬）後之淨利潤。',
        sBody
    ))
    elements.append(Spacer(1, 2*mm))

    wr_h = ['持有年期', '簡單平均利潤', 'ML 加權利潤', '差異']
    wr_r = [
        ['5 年', 'HKD 833,280（約 83 萬）', 'HKD 731,520（約 73 萬）', 'HKD -101,760'],
        ['7 年', 'HKD 1,192,320（約 119 萬）', 'HKD 1,079,040（約 108 萬）', 'HKD -113,280'],
        ['10 年', 'HKD 1,741,440（約 174 萬）', 'HKD 1,612,800（約 161 萬）', 'HKD -128,640'],
    ]
    wr_cw = [USABLE_W*0.14, USABLE_W*0.30, USABLE_W*0.30, USABLE_W*0.26]
    elements.append(make_table(wr_h, wr_r, wr_cw))
    elements.append(Spacer(1, 4*mm))

    elements.append(Paragraph('5.2 回報分析', sH2))
    elements.append(Paragraph(
        '從上表可以觀察到三個重要趨勢。第一，持有期越長，預期利潤越高。'
        '10 年持有期之 ML 加權利潤（約 HKD 161 萬）顯著高於 5 年（約 HKD 73 萬），'
        '差距達 HKD 88 萬，這印證了長期持有在租金累積效應下之優勢。'
        '第二，ML 機率加權利潤一致低於簡單平均利潤，且差距隨持有期增加而擴大。'
        '這是因為較長持有期之利潤分佈更偏斜，簡單平均被極端樂觀情景拉高之程度更大。'
        '第三，10 年 ML 加權預期利潤約 HKD 161 萬，'
        '即 Andy 之 HKD 192 萬首期本金預期可回收約 HKD 353 萬。'
        '此數字已扣減全部按揭利息（10 年共約 HKD 20.3 萬）及按揭本金償還。'
        '當然，此為預期平均值，實際利潤將受市場環境影響而有所波動。',
        sBody
    ))
    elements.append(Spacer(1, 3*mm))

    elements.append(Paragraph('5.3 不確定性量化', sH2))
    elements.append(Paragraph(
        '除了預期平均利潤外，了解利潤之不確定性範圍同樣重要。'
        '基於 Monte Carlo 模擬之結果，我們可以估計 10 年利潤之信賴區間。'
        '在 90% 信賴水平下（即 P5 至 P95 區間），10 年持有期之利潤'
        '大約落在 HKD 104 萬至 HKD 219 萬之間。換言之，有 5% 機會利潤低於 HKD 104 萬，'
        '同時有 5% 機會利潤高於 HKD 219 萬。'
        '中位數利潤約為 HKD 157 萬，與平均值 HKD 161 萬接近，顯示利潤分佈接近對稱。'
        'Andy 有極高機會（超過 95%）在 10 年後獲得正利潤。',
        sBody
    ))
    elements.append(Spacer(1, 2*mm))

    unc_h = ['統計指標', '5 年', '7 年', '10 年']
    unc_r = [
        ['ML 加權平均利潤', 'HKD 73 萬', 'HKD 108 萬', 'HKD 161 萬'],
        ['中位數利潤', 'HKD 72 萬', 'HKD 106 萬', 'HKD 157 萬'],
        ['P5（5% 機會更低）', 'HKD 23 萬', 'HKD 54 萬', 'HKD 104 萬'],
        ['P95（5% 機會更高）', 'HKD 134 萬', 'HKD 177 萬', 'HKD 219 萬'],
    ]
    unc_cw = [USABLE_W*0.30, USABLE_W*0.22, USABLE_W*0.22, USABLE_W*0.26]
    elements.append(make_table(unc_h, unc_r, unc_cw))
    elements.append(Spacer(1, 4*mm))

    elements.append(Paragraph('5.4 10 年持有期利潤明細', sH2))
    elements.append(Paragraph(
        '以下將 10 年持有期之利潤轉換為具體之港幣金額，所有數字均以 Andy 之首期本金'
        'HKD 192 萬為計算基礎，且已扣減所有按揭利息（HKD 20.3 萬）及供款。',
        sBody
    ))
    elements.append(Spacer(1, 2*mm))

    amt_h = ['情景', '首期本金', '預期回收', '淨利潤']
    amt_r = [
        ['ML 加權平均', 'HKD 1,920,000', 'HKD 3,532,800（約 353 萬）', 'HKD 1,612,800（約 161 萬）'],
        ['保守估計（P5）', 'HKD 1,920,000', 'HKD 2,956,800（約 296 萬）', 'HKD 1,036,800（約 104 萬）'],
        ['中位數（P50）', 'HKD 1,920,000', 'HKD 3,494,400（約 349 萬）', 'HKD 1,574,400（約 157 萬）'],
        ['樂觀估計（P95）', 'HKD 1,920,000', 'HKD 4,108,800（約 411 萬）', 'HKD 2,188,800（約 219 萬）'],
    ]
    amt_cw = [USABLE_W*0.20, USABLE_W*0.22, USABLE_W*0.30, USABLE_W*0.28]
    elements.append(make_table(amt_h, amt_r, amt_cw))
    elements.append(Spacer(1, 3*mm))
    elements.append(Paragraph(
        '上述金額均為扣減按揭費用後之淨數字。在計算過程中已扣除：'
        '（一）10 年按揭利息共約 HKD 20.3 萬；（二）10 年按揭本金償還 HKD 128 萬'
        '（此為償還銀行貸款，非額外成本）；（三）每年持有成本共約 HKD 9.6 萬/年 x 10 年 = HKD 96 萬。'
        'Andy 之最終回收金額包含兩部分：物業出售後之淨值（售價減去剩餘貸款）'
        '加上 10 年累計之淨現金流（租金收入減去成本及供款）。',
        sBody
    ))

    elements.append(img(IMG_V1V2))
    elements.append(Paragraph('圖 6：V1 vs V2 模型改進對比', sCaption))
    elements.append(PageBreak())

    # ================================================================
    # CH6
    # ================================================================
    elements.append(SectionBanner(6, '三層分析 — 最終客戶報告'))
    elements.append(Spacer(1, 5*mm))

    elements.append(Paragraph('6.1 三層分析框架總結', sH2))
    elements.append(Paragraph(
        '本報告之分析架構由三個層次組成，每層提供不同深度之見解。'
        '第一層為「歷史數據分析」，基於 104 個季度歷史數據及 65 個重疊 10 年觀察窗口，'
        '提供歷史經驗之定量基礎——回答「過去發生過嗎？」。'
        '第二層為「84 情景壓力測試」，通過系統化之三維交叉組合展示所有可能情景下之投資利潤，'
        '結果顯示即使最差情景在長期持有下之虧損非常有限——回答「最壞情況會點？」。'
        '第三層為「ML 機率加權預測」，利用機器學習模型為每個情景賦予現實機率權重，'
        '得出更精確之預期利潤及其不確定性範圍——回答「邊個情景最可能？」。'
        '三層分析相互印證、層層遞進，共同構成對 Andy 投資決策之全面支持。',
        sBody
    ))
    elements.append(Spacer(1, 3*mm))

    layer_h = ['分析層次', '數據基礎', '核心發現', '信賴水平']
    layer_r = [
        ['第一層：歷史數據', '104 季度樣本\n65 個 10 年窗口', '歷史上大部分 10 年持有期\n均錄得正利潤', '基準參考'],
        ['第二層：壓力測試', '84 情景全面組合', '最差 10 年僅虧 HKD 4 萬\n絕大部分情景為正利潤', '確定性邊界'],
        ['第三層：ML 預測', '10,000 次 MC 模擬\nGBR 最佳模型', '最可能 10 年利潤 HKD 161 萬\n90% CI: HKD 104 萬 ~ 219 萬', '最高信賴'],
    ]
    layer_cw = [USABLE_W*0.18, USABLE_W*0.24, USABLE_W*0.34, USABLE_W*0.24]
    elements.append(make_table(layer_h, layer_r, layer_cw))
    elements.append(Spacer(1, 5*mm))

    elements.append(Paragraph('6.2 客戶 Andy 之投資建議總結', sH2))
    elements.append(Paragraph(
        '綜合以上六階段之全面分析，我們為客戶 Andy 提供以下核心結論與建議：',
        sBody
    ))
    elements.append(Spacer(1, 2*mm))

    findings = [
        '<b>利潤前景樂觀：</b>Andy 透過銀行按揭購買日本大阪物業（總價 HKD 320 萬，'
        '40% LTV，年利率 3%），自付 HKD 192 萬首期本金。'
        'ML 機率加權模型預測 10 年持有期之預期淨利潤約 HKD 161 萬'
        '（已扣減 10 年按揭利息約 HKD 20.3 萬），'
        '即首期 HKD 192 萬預期回收約 HKD 353 萬。'
        '即使按最保守估計（P5），淨利潤仍約 HKD 104 萬，回收約 HKD 296 萬。',

        '<b>下行風險可控：</b>84 情景壓力測試顯示，所有情景中即使是極端不利條件下'
        '（日圓貶至 28.0 JPY/HKD、物業年跌 3%、僅持有 5 年），最大虧損約 HKD 33 萬。'
        '而在 10 年持有期下，最差情景僅虧損約 HKD 4 萬。',

        '<b>現金流自我持續：</b>扣除按揭供款、利息及持有成本後，'
        'Andy 每年仍可獲得約 HKD 3.4 萬之正現金流（JPY 66.5 萬）。'
        '這意味着物業租金足以覆蓋所有支出，Andy 無需額外注資維持物業。'
        '10 年累計淨現金流約 HKD 340.8 萬。',

        '<b>長期持有優勢明顯：</b>5 年、7 年、10 年三個持有期之 ML 加權淨利潤分別為'
        '約 HKD 73 萬、HKD 108 萬、HKD 161 萬，呈現穩定之遞增趨勢。'
        '租金之持續累積效應在長期持有中發揮了關鍵作用。',

        '<b>匯率為最大變數：</b>日圓匯率之變動是影響利潤之最大單一因素。'
        'ML 模型預測 10 年後匯率中心值為較入場時變動約 +7.8%，'
        '但 90% 信賴區間為 -31% 至 +47%，波動幅度極大。建議 Andy 關注匯率對沖工具之可行性。',

        '<b>模型局限說明：</b>ML 預測模型基於歷史數據訓練，對於未經歷之極端事件之預測能力有限。'
        '報告中之一切金額均為基於歷史數據之統計估計，不構成投資保證。'
        '實際投資決策應綜合考慮個人財務狀況、風險承受能力及其他市場因素。',
    ]
    for f in findings:
        elements.append(Paragraph(f'<bullet>&bull;</bullet>{f}', sBullet))
        elements.append(Spacer(1, 1*mm))
    elements.append(Spacer(1, 4*mm))

    elements.append(Paragraph('6.3 最終評估', sH2))
    elements.append(Paragraph(
        '基於三層分析架構之綜合評估，Andy 透過銀行按揭購入日本大阪物業'
        '（總價 HKD 320 萬，自付 60% 首期即 HKD 192 萬，向銀行借入 40% 按揭貸款即 HKD 128 萬，'
        '年利率 3%）之方案，在歷史數據支持、壓力測試驗證及 ML 機率預測三個維度上均呈現正面結果。'
        '最可能之 10 年投資淨利潤約 HKD 161 萬（已扣減按揭利息約 HKD 20.3 萬），'
        '且下行風險有限（90% 信賴下限為 HKD 104 萬淨利潤）。租金收入之穩定現金流為投資提供了良好之安全墊，'
        '每年租金在扣減所有成本及按揭供款後仍為正數。'
        '而槓桿融資結構（40% LTV）在放大利潤之同時，3% 之低利率環境確保了融資成本之可控性。'
        '綜上所述，在當前市場環境下，此按揭投資方案具備合理之風險回報比，值得認真考慮。',
        sBody
    ))
    elements.append(Spacer(1, 5*mm))

    # --- Final conclusion ---
    elements.append(box(
        '<b>答覆核心問題：「10 年後，我會賺定虧？」</b><br/><br/>'
        'Andy 透過銀行按揭購入大阪物業（總價 HKD 320 萬，自付首期 HKD 192 萬，40% LTV，利率 3%），'
        '在 10 年持有期下（所有金額均已扣減按揭利息 HKD 20.3 萬及供款）：<br/>'
        '- <b>最可能情景</b>：淨利潤約 HKD 161 萬（首期 192 萬 → 回收約 353 萬）<br/>'
        '- <b>保守估計（P5）</b>：淨利潤至少 HKD 104 萬（首期 192 萬 → 回收約 296 萬）<br/>'
        '- <b>樂觀估計（P95）</b>：淨利潤可達 HKD 219 萬（首期 192 萬 → 回收約 411 萬）<br/>'
        '- <b>機率結論</b>：超過 95% 機率獲得正利潤<br/><br/>'
        '<b>結論：Andy 以銀行按揭方式投資，在 ML 模型涵蓋之所有情景中，'
        '10 年持有期之投資淨利潤極大概率為正。</b>',
        bg=colors.HexColor('#e3f2fd'), text_color=SEM_INFO
    ))
    elements.append(Spacer(1, 6*mm))

    # Disclaimer
    elements.append(HRFlowable(width='100%', thickness=0.5, color=BORDER, spaceAfter=6))
    elements.append(Paragraph(
        '<b>免責聲明：</b>本報告之所有分析結果均基於歷史數據及統計模型，僅供參考用途。'
        '過往表現不保證未來結果。機器學習模型之預測存在固有之不確定性，實際投資回報可能'
        '偏離預測值。本報告不構成任何投資建議或保證。投資者應根據自身情況諮詢專業顧問後做出決策。'
        'PZC Group 對因使用本報告內容而導致之任何損失不承擔責任。',
        S('disclaimer', fontSize=7, leading=11, textColor=TEXT_MUTED, alignment=TA_JUSTIFY)
    ))

    return elements


def main():
    doc = SimpleDocTemplate(
        OUTPUT_PATH,
        pagesize=A4,
        leftMargin=MARGIN,
        rightMargin=MARGIN,
        topMargin=20*mm,
        bottomMargin=20*mm,
        title='日本物業投資評估報告',
        author='PZC Group',
        subject='ML V2 機率加權分析 - 客戶Andy',
    )
    elements = build_body()
    doc.build(elements, onFirstPage=first_page, onLaterPages=add_page_decor)
    print(f'Body PDF generated: {OUTPUT_PATH}')
    from pypdf import PdfReader
    reader = PdfReader(OUTPUT_PATH)
    print(f'Body PDF page count: {len(reader.pages)}')


if __name__ == '__main__':
    main()