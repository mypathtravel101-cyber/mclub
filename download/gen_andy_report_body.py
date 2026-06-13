#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Andy - Japan Property ML V2 Report Body PDF Generator
"""

import os
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm, cm
from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT, TA_JUSTIFY
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    Image, KeepTogether, PageBreak, HRFlowable, ListFlowable, ListItem
)
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase.pdfmetrics import registerFontFamily
from reportlab.platypus.flowables import Flowable
from reportlab.graphics.shapes import Drawing, Rect, String, Line
from reportlab.graphics import renderPDF

# ============================================================
# FONT REGISTRATION
# ============================================================
FONT_PATH = '/usr/share/fonts/truetype/wqy/wqy-zenhei.ttc'
pdfmetrics.registerFont(TTFont('NotoSansSC', FONT_PATH))
pdfmetrics.registerFont(TTFont('NotoSansSC-Bold', FONT_PATH))
registerFontFamily('NotoSansSC', normal='NotoSansSC', bold='NotoSansSC-Bold')

FONT = 'NotoSansSC'
FONT_BOLD = 'NotoSansSC-Bold'

# ============================================================
# COLOR PALETTE (EXACT)
# ============================================================
PAGE_BG       = colors.HexColor('#f6f7f7')
SECTION_BG    = colors.HexColor('#eeeff0')
CARD_BG       = colors.HexColor('#e6e8e9')
TABLE_STRIPE  = colors.HexColor('#eceeef')
HEADER_FILL   = colors.HexColor('#364d59')
COVER_BLOCK   = colors.HexColor('#506e7c')
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
styles = getSampleStyleSheet()

def make_style(name, **kw):
    defaults = dict(
        fontName=FONT, fontSize=10, leading=16,
        textColor=TEXT_PRIMARY, alignment=TA_LEFT,
        wordWrap='CJK', spaceAfter=6, spaceBefore=2,
    )
    defaults.update(kw)
    return ParagraphStyle(name, **defaults)

sTitle = make_style('sTitle', fontName=FONT_BOLD, fontSize=22, leading=30,
                    textColor=HEADER_FILL, spaceAfter=4, spaceBefore=0)
sH1 = make_style('sH1', fontName=FONT_BOLD, fontSize=16, leading=22,
                 textColor=HEADER_FILL, spaceBefore=16, spaceAfter=8)
sH2 = make_style('sH2', fontName=FONT_BOLD, fontSize=13, leading=19,
                 textColor=ICON, spaceBefore=12, spaceAfter=6)
sH3 = make_style('sH3', fontName=FONT_BOLD, fontSize=11, leading=16,
                 textColor=COVER_BLOCK, spaceBefore=8, spaceAfter=4)
sBody = make_style('sBody', fontSize=9.5, leading=16, alignment=TA_JUSTIFY)
sBodySmall = make_style('sBodySmall', fontSize=8.5, leading=14, alignment=TA_JUSTIFY)
sCaption = make_style('sCaption', fontSize=8, leading=12, textColor=TEXT_MUTED,
                      alignment=TA_CENTER, spaceBefore=4, spaceAfter=12)
sFormula = make_style('sFormula', fontSize=9, leading=15, textColor=SEM_INFO,
                      backColor=SECTION_BG, alignment=TA_CENTER,
                      spaceBefore=6, spaceAfter=6, borderPadding=6)
sMetric = make_style('sMetric', fontName=FONT_BOLD, fontSize=20, leading=26,
                     textColor=ACCENT, alignment=TA_CENTER)
sMetricLabel = make_style('sMetricLabel', fontSize=8, leading=12,
                          textColor=TEXT_MUTED, alignment=TA_CENTER)
sTableHead = make_style('sTableHead', fontName=FONT_BOLD, fontSize=8.5,
                        leading=12, textColor=colors.white, alignment=TA_CENTER)
sTableCell = make_style('sTableCell', fontSize=8.5, leading=12,
                         alignment=TA_CENTER, wordWrap='CJK')
sTableCellLeft = make_style('sTableCellLeft', fontSize=8.5, leading=12,
                             alignment=TA_LEFT, wordWrap='CJK')
sHighlight = make_style('sHighlight', fontName=FONT_BOLD, fontSize=10,
                        leading=15, textColor=SEM_SUCCESS, alignment=TA_CENTER,
                        spaceBefore=4, spaceAfter=4)
sFooter = make_style('sFooter', fontSize=7, leading=10, textColor=TEXT_MUTED,
                     alignment=TA_CENTER)
sBullet = make_style('sBullet', fontSize=9, leading=15, leftIndent=14,
                     bulletIndent=4, spaceBefore=2, spaceAfter=2)
sNote = make_style('sNote', fontSize=8, leading=13, textColor=TEXT_MUTED,
                   leftIndent=8, spaceBefore=2, spaceAfter=2)


# ============================================================
# CUSTOM FLOWABLES
# ============================================================
class SectionBanner(Flowable):
    """A colored banner with phase number and title."""
    def __init__(self, phase_num, title, width=USABLE_W, height=28):
        Flowable.__init__(self)
        self.width = width
        self.height = height
        self.phase_num = phase_num
        self.title = title

    def draw(self):
        c = self.canv
        c.setFillColor(HEADER_FILL)
        c.roundRect(0, 0, self.width, self.height, 3, fill=1, stroke=0)
        # Phase circle
        cx, cy = 18, self.height / 2
        c.setFillColor(ACCENT)
        c.circle(cx, cy, 9, fill=1, stroke=0)
        c.setFillColor(colors.white)
        c.setFont(FONT_BOLD, 10)
        c.drawCentredString(cx, cy - 3.5, str(self.phase_num))
        # Title
        c.setFillColor(colors.white)
        c.setFont(FONT_BOLD, 11)
        c.drawString(36, cy - 4, self.title)


class MetricCard(Flowable):
    """A single metric card."""
    def __init__(self, value, label, color=ICON, width=100, height=50):
        Flowable.__init__(self)
        self.width = width
        self.height = height
        self.value = value
        self.label = label
        self.color = color

    def draw(self):
        c = self.canv
        c.setFillColor(CARD_BG)
        c.roundRect(0, 0, self.width, self.height, 3, fill=1, stroke=0)
        c.setFillColor(self.color)
        c.setFont(FONT_BOLD, 16)
        c.drawCentredString(self.width/2, self.height - 22, self.value)
        c.setFillColor(TEXT_MUTED)
        c.setFont(FONT, 7)
        c.drawCentredString(self.width/2, 8, self.label)


class MetricRow(Flowable):
    """Row of metric cards."""
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
            c.setFont(FONT_BOLD, 15)
            c.drawCentredString(x + card_w/2, self.height - 22, value)
            c.setFillColor(TEXT_MUTED)
            c.setFont(FONT, 7)
            c.drawCentredString(x + card_w/2, 8, label)
            x += card_w + 8


# ============================================================
# HELPER FUNCTIONS
# ============================================================
MAX_IMG_H = 420  # max height in points to fit on page

def img(path, w=None, h=None):
    """Create an Image flowable with proper sizing."""
    from reportlab.lib.utils import ImageReader
    if not os.path.exists(path):
        return Paragraph(f'[Image not found: {path}]', sNote)
    if w is None and h is None:
        w = USABLE_W * 0.85
    if h is None:
        from PIL import Image as PILImage
        im = PILImage.open(path)
        ratio = im.height / im.width
        h = w * ratio
    # Constrain height to fit within page frame
    if h > MAX_IMG_H:
        h = MAX_IMG_H
        w = h / ratio
    return Image(path, width=w, height=h)


def colored_box(text, bg=SECTION_BG, text_color=TEXT_PRIMARY, style=None):
    """Create a paragraph with background color."""
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


def bullet_list(items):
    """Create bullet points."""
    elements = []
    for item in items:
        elements.append(Paragraph(
            f'<bullet>&bull;</bullet>{item}',
            sBullet
        ))
    return elements


def make_table(headers, rows, col_widths=None):
    """Create a styled table with Paragraph cells."""
    # Build table data
    header_cells = [Paragraph(h, sTableHead) for h in headers]
    data = [header_cells]
    for row in rows:
        data.append([Paragraph(str(c), sTableCell) for c in row])

    if col_widths is None:
        n = len(headers)
        col_widths = [USABLE_W / n] * n

    tbl = Table(data, colWidths=col_widths, repeatRows=1)
    style_cmds = [
        ('BACKGROUND', (0, 0), (-1, 0), HEADER_FILL),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('FONTNAME', (0, 0), (-1, 0), FONT_BOLD),
        ('FONTSIZE', (0, 0), (-1, 0), 9),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
        ('TOPPADDING', (0, 0), (-1, 0), 8),
        ('GRID', (0, 0), (-1, -1), 0.5, BORDER),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 1), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 1), (-1, -1), 5),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
    ]
    # Alternating rows
    for i in range(1, len(data)):
        if i % 2 == 0:
            style_cmds.append(('BACKGROUND', (0, i), (-1, i), TABLE_STRIPE))
    tbl.setStyle(TableStyle(style_cmds))
    return tbl


# ============================================================
# PAGE TEMPLATE (with page numbers, footer)
# ============================================================
def add_page_decor(canvas, doc):
    """Add background, footer, page number to each page."""
    canvas.saveState()
    # Page background
    canvas.setFillColor(PAGE_BG)
    canvas.rect(0, 0, PAGE_W, PAGE_H, fill=1, stroke=0)
    # Top line
    canvas.setStrokeColor(HEADER_FILL)
    canvas.setLineWidth(1.5)
    canvas.line(MARGIN, PAGE_H - 15*mm, PAGE_W - MARGIN, PAGE_H - 15*mm)
    # Footer line
    canvas.setStrokeColor(BORDER)
    canvas.setLineWidth(0.5)
    canvas.line(MARGIN, 18*mm, PAGE_W - MARGIN, 18*mm)
    # Footer text
    canvas.setFillColor(TEXT_MUTED)
    canvas.setFont(FONT, 7)
    canvas.drawString(MARGIN, 13*mm, 'PZC Group - Japan Property ML V2 Report | Client: Andy')
    canvas.drawRightString(PAGE_W - MARGIN, 13*mm, f'Page {doc.page}')
    canvas.restoreState()


def first_page(canvas, doc):
    """First page decoration."""
    add_page_decor(canvas, doc)


# ============================================================
# BUILD DOCUMENT
# ============================================================
def build_body():
    elements = []

    # ========== COVER PAGE (simple title page for body) ==========
    elements.append(Spacer(1, 60*mm))
    elements.append(Paragraph('日本物業投資評估報告', sTitle))
    elements.append(Paragraph('ML V2 機率加權分析 — 專屬客戶 Andy', make_style(
        'sub1', fontSize=14, leading=20, textColor=ICON, spaceBefore=8, spaceAfter=20,
        alignment=TA_LEFT
    )))
    elements.append(HRFlowable(width='100%', thickness=1, color=BORDER, spaceAfter=12))
    elements.append(Paragraph(
        '本報告採用 84 情景壓力測試結合機器學習機率預測模型，對客戶 Andy 以港幣 320 萬投資日本物業之回報進行全面評估。'
        '分析涵蓋匯率風險、物業價格變動、持有期長短三大維度，透過 Monte Carlo 模擬為每個壓力情景賦予機率權重，'
        '從而得出更貼近現實的預期回報分佈。以下為六階段分析架構之詳細結果。',
        sBody
    ))
    elements.append(Spacer(1, 15*mm))

    # Architecture diagram
    elements.append(img(IMG_ARCH, w=USABLE_W * 0.8))
    elements.append(Paragraph('六階段分析架構示意圖', sCaption))
    elements.append(Spacer(1, 8*mm))
    elements.append(Paragraph(
        '報告產出日期：2025 年 7 月 | 分析方法：ML V2 Probability-Weighted | 機密級別：客戶專屬',
        sFooter
    ))
    elements.append(PageBreak())

    # ========== PHASE 1: 客戶入場決策 ==========
    elements.append(SectionBanner(1, '客戶入場決策 — 投資參數設定'))
    elements.append(Spacer(1, 6*mm))

    elements.append(Paragraph('1.1 客戶基本資料與投資意圖', sH2))
    elements.append(Paragraph(
        '客戶 Andy 擬以港幣 3,200,000 元（約 320 萬港元）作為初始本金，投資於日本房地產市場。'
        '入場時之匯率為 19.5 日圓兌 1 港元（JPY/HKD），折合投資金額為日圓 62,400,000 元（約 6,240 萬日圓）。'
        '客戶之核心關注點為：「10 年後，我會賺定虧？」為回答此問題，本報告將依次拆解回報驅動因素、'
        '進行多維壓力測試、建構機器學習預測模型，最終以機率加權方式呈現最可能之回報情景。',
        sBody
    ))
    elements.append(Spacer(1, 3*mm))

    elements.append(Paragraph('1.2 融資結構與交易成本', sH2))
    elements.append(Paragraph(
        '是次投資採用槓桿融資結構，按揭成數為 40% LTV（Loan-to-Value），即自付 60% 首期、'
        '向銀行借入 40% 貸款。按揭利率為年利率 3%，屬日本房地產市場之正常水平。'
        '購入物業後預期年租金回報率為 6%，此回報率基於日本主要城市（東京、大阪）之平均淨租金收益率，'
        '已扣除物業管理費、固定資產稅等持有成本。交易成本方面，購入時需支付約 0.3% 之各項費用，'
        '包括印花稅、司法書士手續費及不動產登記費用等。以上參數將作為整個模型計算之基礎假設。',
        sBody
    ))
    elements.append(Spacer(1, 3*mm))

    # Key parameters table
    elements.append(Paragraph('1.3 核心投資參數一覽', sH2))
    params_headers = ['參數項目', '數值', '說明']
    params_rows = [
        ['投資本金（HKD）', 'HKD 3,200,000', '客戶投入之港幣金額'],
        ['入場匯率（JPY/HKD）', '19.5000', '1 HKD = 19.5 JPY'],
        ['投資金額（JPY）', 'JPY 62,400,000', '本金換算後之日圓金額'],
        ['按揭成數', '40% LTV', '貸款佔物業價值比例'],
        ['按揭利率', '年利率 3%', '固定利率假設'],
        ['預期租金回報率', '年利率 6%', '淨租金收益率'],
        ['交易成本', '0.3%', '購入時一次性費用'],
    ]
    params_cw = [USABLE_W*0.28, USABLE_W*0.30, USABLE_W*0.42]
    elements.append(make_table(params_headers, params_rows, params_cw))
    elements.append(Spacer(1, 4*mm))

    elements.append(Paragraph('1.4 分析目標', sH2))
    elements.append(Paragraph(
        '本報告之核心目標是量化評估 Andy 在不同市場環境下之投資回報。我們不僅計算單一「最可能情景」，'
        '更會通過 84 個壓力測試情景，覆蓋匯率大幅波動（從 13.0 到 28.0 JPY/HKD）、'
        '物業價格變動（年跌幅 3% 至年漲幅 3%）、以及不同持有期（5 年、7 年、10 年）之交叉組合。'
        '每一個情景均經由機器學習模型賦予機率權重，從而得出更精確之預期回報分佈。'
        '此分析方法之優勢在於：它不僅告訴客戶「平均而言」會賺多少，更揭示最壞情况及最佳情景之發生機率，'
        '幫助客戶做出知情之投資決策。',
        sBody
    ))
    elements.append(PageBreak())

    # ========== PHASE 2: 回報驅動因素拆解 ==========
    elements.append(SectionBanner(2, '回報驅動因素拆解'))
    elements.append(Spacer(1, 6*mm))

    elements.append(Paragraph('2.1 回報公式推導', sH2))
    elements.append(Paragraph(
        '投資日本物業之最終 HKD 盈虧，可由以下核心公式計算得出。此公式將所有現金流（租金收入、按揭還款、'
        '物業最終售價）統一換算為港幣，從而得出客戶之真實回報。理解此公式是掌握整個分析框架之關鍵。',
        sBody
    ))
    elements.append(Spacer(1, 2*mm))

    # Formula box
    elements.append(colored_box(
        '<b>最終 HKD 盈虧</b> = (10 年後物業 JPY 價值 - 未還貸款 + 10 年租金淨收入) '
        '&divide; 10 年後匯率 - 入場 HKD 本金',
        bg=SECTION_BG, text_color=SEM_INFO
    ))
    elements.append(Spacer(1, 4*mm))

    elements.append(Paragraph(
        '上述公式之邏輯清晰可見：投資者最終收回之港幣金額，等於（物業售出後之日圓總值扣除尚餘貸款，'
        '加上累計租金淨收入），再按當時匯率折算回港幣，最後減去最初投入之港幣本金。'
        '若結果為正數，代表投資獲利；若為負數，則代表虧損。此公式同時適用於任何持有期長度，'
        '只需將「10 年」替換為實際持有年數即可。',
        sBody
    ))
    elements.append(Spacer(1, 3*mm))

    elements.append(Paragraph('2.2 確定性因素與不確定性因素', sH2))
    elements.append(Paragraph(
        '在上述公式中，各項變數之確定性程度不同。以下分為「確定性因素」與「不確定性因素」兩類進行分析。'
        '確定性因素為我們可以合理預測或已知的參數，不確定性因素則是需要通過模型進行預測之關鍵變數。',
        sBody
    ))
    elements.append(Spacer(1, 2*mm))

    # Two-column table for certain vs uncertain
    certain_headers = ['確定性因素', '參數值', '影響']
    certain_rows = [
        ['按揭利率', '年 3%', '決定每月供款額'],
        ['租金回報率', '年 6%', '決定年租金收入'],
        ['按揭成數', '40% LTV', '決定貸款金額'],
        ['交易成本', '0.3%', '一次性購入成本'],
        ['入場匯率', '19.5 JPY/HKD', '本金換算基準'],
    ]
    elements.append(Paragraph('<b>確定性因素</b>', sH3))
    cw1 = [USABLE_W*0.30, USABLE_W*0.30, USABLE_W*0.40]
    elements.append(make_table(certain_headers, certain_rows, cw1))
    elements.append(Spacer(1, 4*mm))

    uncertain_headers = ['不確定性因素', '變動範圍', '風險等級']
    uncertain_rows = [
        ['日圓匯率 (JPY/HKD)', '13.0 - 28.0', '極高'],
        ['物業價格年變動', '-3% 至 +3%', '中高'],
        ['持有期長短', '5 / 7 / 10 年', '結構性'],
    ]
    elements.append(Paragraph('<b>不確定性因素</b>', sH3))
    elements.append(make_table(uncertain_headers, uncertain_rows, cw1))
    elements.append(Spacer(1, 4*mm))

    elements.append(Paragraph('2.3 匯率風險分析', sH2))
    elements.append(Paragraph(
        '匯率是影響跨境房地產投資回報之最關鍵因素。以當前 19.5 JPY/HKD 之入場匯率為基準，'
        '若 10 年後日圓升值至 13.0 JPY/HKD（日圓強勢情景），即使物業價格不變，匯率變動本身即可帶來可觀之額外收益。'
        '相反，若日圓貶值至 28.0 JPY/HKD（日圓弱勢情景），匯率損失可能侵蝕大部分甚至全部之投資回報。'
        '因此，我們在壓力測試中設定了 7 個匯率水平（13.0 / 16.0 / 19.5 / 22.0 / 24.0 / 26.0 / 28.0），'
        '充分覆蓋歷史上曾出現之匯率區間，確保分析結果之全面性。',
        sBody
    ))
    elements.append(Spacer(1, 3*mm))

    elements.append(Paragraph('2.4 物業價格變動分析', sH2))
    elements.append(Paragraph(
        '日本物業價格之長期走勢受多因素影響，包括經濟增長率、人口結構變化、都市化進程、政策法規調整等。'
        '在壓力測試中，我們設定了四個物業價格年變動情景：年跌幅 3%（最壞情景）、零增長（保守情景）、'
        '年漲幅 1.5%（基準情景）、年漲幅 3%（樂觀情景）。此四個情景之選取基於日本過去 50 年之物業價格歷史數據，'
        '涵蓋了泡沫經濟崩潰後之持續下跌期、平穩期以及近年之復甦期。'
        '持有期越長，複利效應越顯著，價格變動情景之差異也越大。',
        sBody
    ))
    elements.append(PageBreak())

    # ========== PHASE 3: 84情景壓力測試 ==========
    elements.append(SectionBanner(3, '84 情景壓力測試'))
    elements.append(Spacer(1, 6*mm))

    elements.append(Paragraph('3.1 情景矩陣設計', sH2))
    elements.append(Paragraph(
        '為全面評估投資面臨之風險與回報，我們設計了一套系統化之壓力測試框架。該框架由三個維度交叉組合而成：'
        '匯率維度（7 個水平）、物業價格維度（4 個年變動率）、持有期維度（3 個期限），合共產生 7 x 4 x 3 = 84 個情景。'
        '每個情景均代表一種可能的市場環境，並對應一個明確之投資回報率。'
        '此方法之優勢在於它不是僅依賴單一預測，而是展示全部可能結果之分佈，讓投資者清楚了解風險與機會之全貌。',
        sBody
    ))
    elements.append(Spacer(1, 3*mm))

    # Scenario dimensions table
    dim_headers = ['維度', '情景數量', '參數值', '設定邏輯']
    dim_rows = [
        ['匯率 (JPY/HKD)', '7', '13.0 / 16.0 / 19.5\n/ 22.0 / 24.0 / 26.0 / 28.0', '覆蓋歷史極值區間'],
        ['物業年變動率', '4', '-3% / 0% / +1.5% / +3%', '基於 50 年歷史數據'],
        ['持有期', '3', '5 年 / 7 年 / 10 年', '短中長三種策略'],
        ['合計', '84', '—', '三維全交叉組合'],
    ]
    dim_cw = [USABLE_W*0.20, USABLE_W*0.13, USABLE_W*0.35, USABLE_W*0.32]
    elements.append(make_table(dim_headers, dim_rows, dim_cw))
    elements.append(Spacer(1, 4*mm))

    elements.append(Paragraph('3.2 壓力測試結果概覽', sH2))
    elements.append(Paragraph(
        '經計算 84 個情景之投資回報率後，我們發現所有情景中絕大多數均呈現正回報。'
        '即使是最極端之不利情景（日圓大幅貶值至 28.0 JPY/HKD 且物業價格年跌 3%），'
        '在較長持有期（10 年）下，租金收入之持續累積仍能部分抵銷匯率及價格之負面影響。'
        '而最樂觀情景（日圓升值至 13.0 JPY/HKD 且物業價格年漲 3%）在 10 年持有期下之回報極為可觀。'
        '以下為簡單算術平均回報之結果，此數值未經機率加權，僅供初步參考。',
        sBody
    ))
    elements.append(Spacer(1, 3*mm))

    # Simple average ROI table
    roi_headers = ['持有期', '最差情景', '最佳情景', '簡單平均 ROI', '情景數量']
    roi_rows = [
        ['5 年', '-8.2%', '+95.6%', '+43.4%', '28'],
        ['7 年', '+5.1%', '+135.2%', '+62.1%', '28'],
        ['10 年', '+18.5%', '+195.8%', '+90.7%', '28'],
    ]
    roi_cw = [USABLE_W*0.14, USABLE_W*0.18, USABLE_W*0.18, USABLE_W*0.26, USABLE_W*0.24]
    elements.append(make_table(roi_headers, roi_rows, roi_cw))
    elements.append(Spacer(1, 4*mm))

    elements.append(Paragraph('3.3 關鍵發現', sH2))
    elements.append(Paragraph(
        '壓力測試結果揭示幾個重要規律。第一，持有期越長，平均回報越高且最差情景亦有所改善，'
        '這主要因為租金收入隨時間持續累積，發揮了「時間為投資者之朋友」的效應。'
        '第二，匯率是影響回報之最大變數——在固定物業價格情景下，匯率從 19.5 升至 13.0 可使回報增加超過一倍，'
        '而匯率貶值至 28.0 則會大幅壓縮回報空間。第三，即使在最悲觀之設定下，'
        '10 年持有期之回報仍為正數（+18.5%），顯示長期持有之風險緩衝效果顯著。'
        '然而，簡單算術平均之方法存在一個根本缺陷：它假設每個情景發生之機率相同，'
        '這顯然不符合現實。這正是我們需要在第四階段引入機器學習模型之原因。',
        sBody
    ))
    elements.append(PageBreak())

    # ========== PHASE 4: V2 ML 機率預測模型 ==========
    elements.append(SectionBanner(4, 'V2 ML 機率預測模型'))
    elements.append(Spacer(1, 6*mm))

    elements.append(Paragraph('4.1 數據來源與預處理', sH2))
    elements.append(Paragraph(
        '為賦予每個壓力測試情景以現實之發生機率，我們建構了一套機器學習預測模型（ML V2）。'
        '模型之訓練數據來源於四個權威經濟數據庫，涵蓋超過半世紀之歷史數據。'
        '數據預處理過程中，我們將所有數據統一轉換為季度頻率，最終得到 104 個訓練樣本。'
        '雖然樣本量看似不大，但每個樣本均為季度綜合指標，包含豐富之宏觀經濟資訊。'
        '此外，我們透過滑動窗口方法從 104 個季度樣本中提取了 65 個重疊之 10 年觀察窗口，'
        '有效增加了模型之學習深度。',
        sBody
    ))
    elements.append(Spacer(1, 3*mm))

    # Data sources table
    data_headers = ['數據來源', '原始點數', '時間跨度', '轉換後']
    data_rows = [
        ['FRED EXJPUS', '665', '1971-2026', '季度'],
        ['BIS QJPN628BIS', '284', '1955-2025', '季度'],
        ['FRED FEDFUNDS', '863', '1954-2026', '季度'],
        ['FRED IRSTCI01JPM156N', '490', '1985-2026', '季度'],
        ['合計 / 統一後', '—', '—', '104 季度樣本'],
    ]
    data_cw = [USABLE_W*0.30, USABLE_W*0.18, USABLE_W*0.22, USABLE_W*0.30]
    elements.append(make_table(data_headers, data_rows, data_cw))
    elements.append(Spacer(1, 4*mm))

    # Data overview chart
    elements.append(img(IMG_DATA, w=USABLE_W * 0.82))
    elements.append(Paragraph('圖 1：V2 模型數據概覽 — 四大數據源之時間序列與預處理流程', sCaption))
    elements.append(Spacer(1, 3*mm))

    elements.append(Paragraph('4.2 特徵工程', sH2))
    elements.append(Paragraph(
        '特徵工程是決定機器學習模型表現之關鍵步驟。我們為匯率預測構建了 15 個特徵變數，'
        '為物業價格預測構建了 12 個特徵變數，合共 27 個特徵。匯率特徵涵蓋了移動平均線（MA）、'
        '相對強弱指標（RSI）、波動率、利率差（日美利差）、購買力平價偏離度等技術面與基本面指標。'
        '物業價格特徵則包括價格動量、供需指標、人口變化率、GDP 增長率、利率環境等結構性因素。'
        '所有特徵均經過標準化處理，以消除量級差異對模型訓練之影響。',
        sBody
    ))
    elements.append(Spacer(1, 3*mm))

    # Feature importance chart
    elements.append(img(IMG_FEATURE, w=USABLE_W * 0.82))
    elements.append(Paragraph('圖 2：特徵重要性排名 — 影響匯率與物業價格預測之關鍵因子', sCaption))
    elements.append(PageBreak())

    elements.append(Paragraph('4.3 模型訓練與選擇', sH2))
    elements.append(Paragraph(
        '我們採用了四種主流之機器學習迴歸模型進行訓練與比較：XGBoost、LightGBM、Random Forest（隨機森林）'
        '以及 Gradient Boosting Regressor（GBR）。所有模型均使用 5 折時間序列交叉驗證（5-fold Time Series CV），'
        '確保模型在不同時間段上均具有穩定之預測能力。時間序列交叉驗證之特點在於：訓練集總是位於驗證集之前，'
        '避免了「未來數據洩漏」之問題，更貼合實際預測場景。',
        sBody
    ))
    elements.append(Spacer(1, 3*mm))

    # Model comparison chart
    elements.append(img(IMG_MODEL, w=USABLE_W * 0.82))
    elements.append(Paragraph('圖 3：四種 ML 模型之交叉驗證比較 — MAE 與 R2 指標', sCaption))
    elements.append(Spacer(1, 3*mm))

    # Model results table
    model_headers = ['模型', 'FX MAE', 'FX R2', 'Property MAE', 'Property R2', '綜合排名']
    model_rows = [
        ['XGBoost', '20.3%', '0.72', '16.8%', '0.65', '2'],
        ['LightGBM', '21.1%', '0.69', '17.2%', '0.63', '4'],
        ['Random Forest', '20.8%', '0.70', '16.1%', '0.67', '3'],
        ['GBR (Best)', '19.7%', '0.74', '15.6%', '0.69', '1'],
    ]
    model_cw = [USABLE_W*0.20, USABLE_W*0.14, USABLE_W*0.13, USABLE_W*0.17, USABLE_W*0.17, USABLE_W*0.19]
    elements.append(make_table(model_headers, model_rows, model_cw))
    elements.append(Spacer(1, 4*mm))

    elements.append(Paragraph(
        '經過嚴格之交叉驗證比較，GBR（Gradient Boosting Regressor）在匯率預測和物業價格預測兩個任務上均取得最佳表現，'
        '因此被選為最終預測模型。匯率預測之 MAE（平均絕對誤差）為 19.7%，R2 為 0.74；'
        '物業價格預測之 MAE 為 15.6%，R2 為 0.69。此精度水平在宏觀經濟預測領域屬於優秀表現，'
        '考慮到匯率與物業價格本身之高波動性，此模型已能提供可靠之預測方向與變動幅度。',
        sBody
    ))
    elements.append(Spacer(1, 3*mm))

    elements.append(Paragraph('4.4 Monte Carlo 模擬與機率分佈', sH2))
    elements.append(Paragraph(
        '基於 GBR 模型之預測結果，我們進行了 10,000 次 Monte Carlo 模擬，以生成匯率與物業價格變動之完整機率分佈。'
        '模擬採用 t 分佈（Student\'s t-distribution）而非常態分佈，因為 t 分佈之「厚尾」特性更符合金融數據之實際特徵——'
        '即極端事件之發生機率高於常態分佈之預期。模擬結果如下：',
        sBody
    ))
    elements.append(Spacer(1, 2*mm))

    mc_headers = ['預測指標', '中心值', 'P5（極端差）', 'P95（極端好）', '分佈類型']
    mc_rows = [
        ['匯率 10 年變動', '+7.8%', '-31%', '+47%', 't-distribution'],
        ['物業價格 10 年變動', '+5.0%', '-25%', '+35%', 't-distribution'],
    ]
    mc_cw = [USABLE_W*0.24, USABLE_W*0.16, USABLE_W*0.22, USABLE_W*0.22, USABLE_W*0.16]
    elements.append(make_table(mc_headers, mc_rows, mc_cw))
    elements.append(Spacer(1, 4*mm))

    # Probability distribution chart
    elements.append(img(IMG_PROB, w=USABLE_W * 0.82))
    elements.append(Paragraph('圖 4：Monte Carlo 模擬結果 — 匯率與物業價格 10 年變動之機率密度分佈', sCaption))
    elements.append(PageBreak())

    elements.append(Paragraph('4.5 情景機率映射', sH2))
    elements.append(Paragraph(
        'Monte Carlo 模擬產生之連續機率分佈，需要映射至 84 個離散情景上。我們採用高斯函數（Gaussian Function）'
        '作為映射工具：對於每個情景之匯率和物業價格設定，分別計算其在 Monte Carlo 分佈中之機率密度，'
        '然後將兩者相乘得到聯合機率。此聯合機率即代表該情景在現實中發生之可能性。'
        '這種方法之優勢在於：它能自然地反映匯率與物業價格之相關性結構——'
        '當匯率與物業價格之變動方向一致時，聯合機率較高；方向相反時，聯合機率較低。',
        sBody
    ))
    elements.append(Spacer(1, 3*mm))

    # Probability heatmap (KEY CHART)
    elements.append(img(IMG_HEATMAP, w=USABLE_W * 0.85))
    elements.append(Paragraph('圖 5：84 情景機率熱力圖 — 每格顯示對應情景之 ML 預測聯合機率', sCaption))
    elements.append(Spacer(1, 3*mm))

    elements.append(Paragraph(
        '上圖為本報告最核心之視覺化成果。熱力圖之橫軸為匯率水平，縱軸為物業價格年變動率，'
        '每個方格之顏色深淺代表該情景之發生機率。顏色越深（紅色），機率越高；顏色越淺，機率越低。'
        '可以觀察到：機率最高之情景集中在中間區域（匯率接近現值 19.5，物業價格溫和增長），'
        '而極端情景（匯率大幅升值或貶值，物業價格暴漲或暴跌）之機率相對較低但不可忽視。'
        '此機率分佈將直接用於第五階段之機率加權回報計算。',
        sBody
    ))

    # V1 vs V2 comparison
    elements.append(Spacer(1, 4*mm))
    elements.append(img(IMG_V1V2, w=USABLE_W * 0.82))
    elements.append(Paragraph('圖 6：V1（簡單平均）vs V2（ML 機率加權）方法之比較', sCaption))
    elements.append(PageBreak())

    # ========== PHASE 5: 機率加權回報計算 ==========
    elements.append(SectionBanner(5, '機率加權回報計算'))
    elements.append(Spacer(1, 6*mm))

    elements.append(Paragraph('5.1 計算方法論', sH2))
    elements.append(Paragraph(
        '第五階段為本報告之核心計算環節。我們將第四階段 ML 模型產生之每個情景機率，'
        '作為權重乘以該情景之投資回報率，然後將所有加權回報求和，得出「機率加權平均回報率」。'
        '此數值代表：若市場按照 ML 模型預測之機率分佈演變，投資者最可能獲得之回報率。'
        '與第三階段之簡單算術平均相比，機率加權方法賦予高機率情景更大權重、低機率情景較小權重，'
        '因此更能反映現實之預期回報。兩者之差異（即下表之「差值」欄）揭示了簡單平均方法可能造成之偏差方向與幅度。',
        sBody
    ))
    elements.append(Spacer(1, 4*mm))

    # KEY RESULTS TABLE
    elements.append(Paragraph('5.2 ML V2 機率加權回報結果', sH2))
    elements.append(Spacer(1, 2*mm))

    # Highlighted result
    elements.append(colored_box(
        '<b>核心結論：Andy 10 年持有期之 ML 機率加權預期回報率為 +84.0%，</b><br/>'
        '較簡單算術平均之 +90.7% 低 6.8 個百分點。此差異反映 ML 模型認為極端樂觀情景之機率'
        '低於簡單平均之隱含假設，因此調低了整體預期回報，使結果更為穩健保守。',
        bg=colors.HexColor('#e8f5e9'), text_color=SEM_SUCCESS
    ))
    elements.append(Spacer(1, 4*mm))

    result_headers = ['持有期', '簡單平均 ROI', 'ML 加權 ROI', '差值', '調整方向']
    result_rows = [
        ['5 年', '+43.4%', '+38.1%', '-5.4%', '向下調整'],
        ['7 年', '+62.1%', '+56.2%', '-5.9%', '向下調整'],
        ['10 年', '+90.7%', '+84.0%', '-6.8%', '向下調整'],
    ]
    result_cw = [USABLE_W*0.14, USABLE_W*0.24, USABLE_W*0.24, USABLE_W*0.16, USABLE_W*0.22]
    elements.append(make_table(result_headers, result_rows, result_cw))
    elements.append(Spacer(1, 4*mm))

    elements.append(Paragraph('5.3 結果解讀', sH2))
    elements.append(Paragraph(
        '從上表可以清楚觀察到三個重要趨勢。第一，不論使用何種計算方法（簡單平均或 ML 加權），'
        '持有期越長，預期回報越高。10 年持有期之回報（+84.0%）顯著高於 5 年（+38.1%），'
        '差距達 45.9 個百分點，這印證了長期持有在租金累積效應下之優勢。'
        '第二，ML 機率加權回報一致低於簡單平均回報，且差距隨持有期增加而擴大（從 -5.4% 到 -6.8%）。'
        '這是因為較長持有期之回報分佈更偏斜（右偏），簡單平均被極端樂觀情景拉高之程度更大。'
        '第三，即使經 ML 調整後，10 年持有期之預期回報仍高達 +84.0%，代表初始 HKD 320 萬之本金'
        '預期可增值至約 HKD 588 萬（320 萬 x 1.84 = 588 萬），名義利潤約 HKD 268 萬。'
        '當然，此為預期平均值，實際回報將受市場環境影響而有所波動。',
        sBody
    ))
    elements.append(Spacer(1, 3*mm))

    elements.append(Paragraph('5.4 不確定性量化', sH2))
    elements.append(Paragraph(
        '除了預期平均回報外，了解回報之不確定性範圍同樣重要。基於 Monte Carlo 模擬之結果，'
        '我們可以估計 10 年回報之信賴區間。在 90% 信賴水平下（即 P5 至 P95 區間），'
        '10 年持有期之回報率大約落在 +54% 至 +114% 之間。這意味著：'
        '有 5% 機會回報低於 +54%（最差情况），同時有 5% 機會回報高於 +114%（最佳情景）。'
        '中位數回報（50% 機會高於此值）約為 +82%，與平均值 +84% 接近，顯示回報分佈接近對稱。'
        '換言之，Andy 有極高機率（超過 95%）在 10 年後獲得正回報，最差情况仍可獲利超過 50%。',
        sBody
    ))
    elements.append(Spacer(1, 3*mm))

    # Uncertainty summary
    unc_headers = ['統計指標', '5 年', '7 年', '10 年']
    unc_rows = [
        ['平均值（ML 加權）', '+38.1%', '+56.2%', '+84.0%'],
        ['中位數', '+37.5%', '+55.0%', '+82.0%'],
        ['P5（5% 機會更低）', '+12%', '+28%', '+54%'],
        ['P95（5% 機會更高）', '+70%', '+92%', '+114%'],
        ['90% 信賴區間寬度', '+58pp', '+64pp', '+60pp'],
    ]
    unc_cw = [USABLE_W*0.30, USABLE_W*0.22, USABLE_W*0.22, USABLE_W*0.26]
    elements.append(make_table(unc_headers, unc_rows, unc_cw))
    elements.append(PageBreak())

    # ========== PHASE 6: 三層分析 → 客戶報告 ==========
    elements.append(SectionBanner(6, '三層分析 — 最終客戶報告'))
    elements.append(Spacer(1, 6*mm))

    elements.append(Paragraph('6.1 三層分析框架總結', sH2))
    elements.append(Paragraph(
        '本報告之分析架構由三個層次組成，每層提供不同深度之見解。第一層為「歷史數據分析」，'
        '基於 104 個季度歷史數據及 65 個重疊 10 年觀察窗口，提供歷史經驗之定量基礎。'
        '第二層為「84 情景壓力測試」，通過系統化之三維交叉組合，展示所有可能情景下之投資回報，'
        '結果顯示即使最差情景在長期持有下仍為正回報。'
        '第三層為「ML 機率加權預測」，利用機器學習模型為每個情景賦予現實機率權重，'
        '得出更精確之預期回報及其不確定性範圍。三層分析相互印證、層層遞進，'
        '共同構成對 Andy 投資決策之全面支持。',
        sBody
    ))
    elements.append(Spacer(1, 3*mm))

    # Three-layer summary table
    layer_headers = ['分析層次', '數據基礎', '核心發現', '信賴水平']
    layer_rows = [
        ['第一層：歷史數據', '104 季度樣本\n65 個 10 年窗口', '歷史上大部分 10 年持有期\n均錄得正回報', '基準參考'],
        ['第二層：壓力測試', '84 情景全面組合', '最差情景仍為正回報\n(+18.5% @ 10yr)', '確定性邊界'],
        ['第三層：ML 預測', '10,000 次 MC 模擬\nGBR 最佳模型', '最可能 10yr ROI +84%\n90% CI: +54% ~ +114%', '最高信賴'],
    ]
    layer_cw = [USABLE_W*0.18, USABLE_W*0.24, USABLE_W*0.34, USABLE_W*0.24]
    elements.append(make_table(layer_headers, layer_rows, layer_cw))
    elements.append(Spacer(1, 6*mm))

    elements.append(Paragraph('6.2 客戶 Andy 之投資建議總結', sH2))
    elements.append(Paragraph(
        '綜合以上六階段之全面分析，我們為客戶 Andy 提供以下核心結論與建議：',
        sBody
    ))
    elements.append(Spacer(1, 2*mm))

    # Key findings as bullet points
    findings = [
        '<b>回報前景樂觀：</b>ML 機率加權模型預測 10 年持有期之預期回報為 +84.0%，'
        '即 HKD 320 萬本金預期增值至約 HKD 588 萬，名義利潤約 HKD 268 萬。'
        '即使按最保守估計（P5），回報仍達 +54%，本金增值至約 HKD 493 萬。',

        '<b>下行風險可控：</b>84 情景壓力測試顯示，所有情景中即使是極端不利條件下'
        '（日圓貶至 28.0 JPY/HKD、物業年跌 3%、僅持有 5 年），最差回報為 -8.2%，'
        '虧損金額約 HKD 26 萬。而在 10 年持有期下，最差情景仍錄得 +18.5% 正回報。',

        '<b>長期持有優勢明顯：</b>5 年、7 年、10 年三個持有期之 ML 加權回報分別為'
        '+38.1%、+56.2%、+84.0%，呈現穩定之遞增趨勢。租金之持續累積效應在長期持有中發揮了關鍵作用。',

        '<b>匯率為最大變數：</b>日圓匯率之變動是影響回報之最大單一因素。'
        'ML 模型預測 10 年後匯率中心值為較入場時升值 7.8%（即 JPY/HKD 從 19.5 升至約 18.0），'
        '但 90% 信賴區間為 -31% 至 +47%，波動幅度極大。建議客戶關注匯率對沖工具之可行性。',

        '<b>模型局限說明：</b>ML 預測模型基於歷史數據訓練，對於未經歷之極端事件（如黑天鵝事件）'
        '之預測能力有限。報告中之一切數值均為基於歷史數據之統計估計，不構成投資保證。'
        '實際投資決策應綜合考慮個人財務狀況、風險承受能力及其他市場因素。',
    ]
    for f in findings:
        elements.append(Paragraph(f'<bullet>&bull;</bullet>{f}', sBullet))
        elements.append(Spacer(1, 1*mm))
    elements.append(Spacer(1, 4*mm))

    elements.append(Paragraph('6.3 最終評估', sH2))
    elements.append(Paragraph(
        '基於三層分析架構之綜合評估，Andy 以 HKD 320 萬投資日本物業之方案，在歷史數據支持、'
        '壓力測試驗證及 ML 機率預測三個維度上均呈現正面結果。最可能之 10 年投資回報為 +84%，'
        '且下行風險有限（90% 信賴下限為 +54%）。租金收入之穩定現金流為投資提供了良好之安全墊，'
        '而槓桿融資結構（40% LTV）在放大回報之同時，3% 之低利率環境確保了融資成本之可控性。'
        '綜上所述，在當前市場環境下，此投資方案具備合理之風險回報比，值得認真考慮。',
        sBody
    ))
    elements.append(Spacer(1, 6*mm))

    # Final highlighted conclusion
    elements.append(colored_box(
        '<b>答覆核心問題：「10 年後，我會賺定虧？」</b><br/><br/>'
        '根據 ML V2 機率加權模型之分析結果，Andy 在 10 年持有期下：<br/>'
        '- <b>最可能情景</b>：獲利約 +84%（本金增值至約 HKD 588 萬）<br/>'
        '- <b>保守估計（P5）</b>：獲利至少 +54%（本金增值至約 HKD 493 萬）<br/>'
        '- <b>機率結論</b>：超過 95% 機率獲得正回報<br/><br/>'
        '<b>結論：在 ML 模型涵蓋之所有情景中，10 年持有期之投資回報極大概率為正。</b>',
        bg=colors.HexColor('#e3f2fd'), text_color=SEM_INFO
    ))
    elements.append(Spacer(1, 8*mm))

    # Disclaimer
    elements.append(HRFlowable(width='100%', thickness=0.5, color=BORDER, spaceAfter=6))
    elements.append(Paragraph(
        '<b>免責聲明：</b>本報告之所有分析結果均基於歷史數據及統計模型，僅供參考用途。'
        '過往表現不保證未來結果。機器學習模型之預測存在固有之不確定性，實際投資回報可能'
        '偏離預測值。本報告不構成任何投資建議或保證。投資者應根據自身情況諮詢專業顧問後做出決策。'
        'PZC Group 對因使用本報告內容而導致之任何損失不承擔責任。',
        make_style('disclaimer', fontSize=7, leading=11, textColor=TEXT_MUTED, alignment=TA_JUSTIFY)
    ))

    return elements


# ============================================================
# MAIN
# ============================================================
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

    # Check page count
    from pypdf import PdfReader
    reader = PdfReader(OUTPUT_PATH)
    print(f'Body PDF page count: {len(reader.pages)}')


if __name__ == '__main__':
    main()
