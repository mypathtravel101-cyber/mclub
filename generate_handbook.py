#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
PZC 家族辦公室專業認可證書畢業生客戶開拓手冊
PDF Generation Script - ReportLab
"""

import os, sys, hashlib
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import inch, cm, mm
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak, KeepTogether, CondPageBreak
)
from reportlab.platypus.tableofcontents import TableOfContents
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase.pdfmetrics import registerFontFamily

# ━━ Color Palette (auto-generated) ━━
ACCENT       = colors.HexColor('#27728b')
TEXT_PRIMARY  = colors.HexColor('#1e1c1b')
TEXT_MUTED    = colors.HexColor('#7d7871')
BG_SURFACE   = colors.HexColor('#e0ddd8')
BG_PAGE      = colors.HexColor('#f5f4f3')

TABLE_HEADER_COLOR = ACCENT
TABLE_HEADER_TEXT  = colors.white
TABLE_ROW_EVEN     = colors.white
TABLE_ROW_ODD      = BG_SURFACE

# ━━ Font Registration ━━
pdfmetrics.registerFont(TTFont('NotoSerifSC', '/usr/share/fonts/truetype/noto-serif-sc/NotoSerifSC-Regular.ttf'))
pdfmetrics.registerFont(TTFont('NotoSerifSCBold', '/usr/share/fonts/truetype/noto-serif-sc/NotoSerifSC-Bold.ttf'))
pdfmetrics.registerFont(TTFont('SarasaMonoSC', '/usr/share/fonts/truetype/chinese/SarasaMonoSC-Regular.ttf'))
pdfmetrics.registerFont(TTFont('SarasaMonoSCBold', '/usr/share/fonts/truetype/chinese/SarasaMonoSC-Bold.ttf'))
pdfmetrics.registerFont(TTFont('DejaVuSans', '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'))
pdfmetrics.registerFont(TTFont('DejaVuSansBold', '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'))
pdfmetrics.registerFont(TTFont('DejaVuSansMono', '/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf'))

registerFontFamily('NotoSerifSC', normal='NotoSerifSC', bold='NotoSerifSCBold')
registerFontFamily('SarasaMonoSC', normal='SarasaMonoSC', bold='SarasaMonoSCBold')
registerFontFamily('DejaVuSans', normal='DejaVuSans', bold='DejaVuSansBold')

# Install font fallback for mixed CJK/Latin
sys.path.insert(0, os.path.join(os.path.expanduser('~/.openclaw/workspace/skills/pdf'), 'scripts'))
try:
    from pdf import install_font_fallback
    install_font_fallback()
except Exception:
    pass

# ━━ Page Setup ━━
PAGE_W, PAGE_H = A4
LEFT_MARGIN = 1.0 * inch
RIGHT_MARGIN = 1.0 * inch
TOP_MARGIN = 0.8 * inch
BOTTOM_MARGIN = 0.8 * inch
AVAILABLE_W = PAGE_W - LEFT_MARGIN - RIGHT_MARGIN

# ━━ Styles ━━
styles = {}

styles['h1'] = ParagraphStyle(
    name='H1', fontName='NotoSerifSC', fontSize=20, leading=30,
    textColor=ACCENT, spaceBefore=18, spaceAfter=12, wordWrap='CJK'
)
styles['h2'] = ParagraphStyle(
    name='H2', fontName='NotoSerifSC', fontSize=16, leading=24,
    textColor=ACCENT, spaceBefore=14, spaceAfter=8, wordWrap='CJK'
)
styles['h3'] = ParagraphStyle(
    name='H3', fontName='NotoSerifSC', fontSize=13, leading=20,
    textColor=TEXT_PRIMARY, spaceBefore=10, spaceAfter=6, wordWrap='CJK'
)
styles['body'] = ParagraphStyle(
    name='Body', fontName='NotoSerifSC', fontSize=10.5, leading=18,
    textColor=TEXT_PRIMARY, alignment=TA_LEFT, firstLineIndent=21,
    wordWrap='CJK', spaceBefore=0, spaceAfter=6
)
styles['body_no_indent'] = ParagraphStyle(
    name='BodyNoIndent', fontName='NotoSerifSC', fontSize=10.5, leading=18,
    textColor=TEXT_PRIMARY, alignment=TA_LEFT, wordWrap='CJK',
    spaceBefore=0, spaceAfter=6
)
styles['bullet'] = ParagraphStyle(
    name='Bullet', fontName='NotoSerifSC', fontSize=10.5, leading=18,
    textColor=TEXT_PRIMARY, alignment=TA_LEFT, leftIndent=24,
    bulletIndent=12, wordWrap='CJK', spaceBefore=2, spaceAfter=2
)
styles['callout'] = ParagraphStyle(
    name='Callout', fontName='NotoSerifSC', fontSize=11, leading=19,
    textColor=ACCENT, alignment=TA_LEFT, leftIndent=20,
    borderColor=ACCENT, borderWidth=0, borderPadding=0,
    wordWrap='CJK', spaceBefore=6, spaceAfter=6
)
styles['table_header'] = ParagraphStyle(
    name='TableHeader', fontName='NotoSerifSC', fontSize=10, leading=15,
    textColor=TABLE_HEADER_TEXT, alignment=TA_CENTER, wordWrap='CJK'
)
styles['table_header_center'] = ParagraphStyle(
    name='TableHeaderCenter', fontName='NotoSerifSC', fontSize=10, leading=15,
    textColor=TABLE_HEADER_TEXT, alignment=TA_CENTER, wordWrap='CJK'
)
styles['table_cell'] = ParagraphStyle(
    name='TableCell', fontName='NotoSerifSC', fontSize=9.5, leading=15,
    textColor=TEXT_PRIMARY, alignment=TA_LEFT, wordWrap='CJK',
    leftIndent=2, rightIndent=2
)
styles['table_cell_center'] = ParagraphStyle(
    name='TableCellCenter', fontName='NotoSerifSC', fontSize=9.5, leading=15,
    textColor=TEXT_PRIMARY, alignment=TA_CENTER, wordWrap='CJK'
)
styles['caption'] = ParagraphStyle(
    name='Caption', fontName='NotoSerifSC', fontSize=9, leading=14,
    textColor=TEXT_MUTED, alignment=TA_CENTER, wordWrap='CJK',
    spaceBefore=3, spaceAfter=6
)
styles['toc_h1'] = ParagraphStyle(
    name='TOCH1', fontName='NotoSerifSC', fontSize=13, leftIndent=20,
    leading=22, wordWrap='CJK'
)
styles['toc_h2'] = ParagraphStyle(
    name='TOCH2', fontName='NotoSerifSC', fontSize=11, leftIndent=40,
    leading=18, wordWrap='CJK'
)
styles['quote'] = ParagraphStyle(
    name='Quote', fontName='NotoSerifSC', fontSize=11, leading=19,
    textColor=ACCENT, alignment=TA_LEFT, leftIndent=30,
    rightIndent=20, wordWrap='CJK', spaceBefore=8, spaceAfter=8
)

# ━━ Helper Functions ━━

def P(text, style_key='body'):
    return Paragraph(text, styles[style_key])

def H1(text):
    return Paragraph(f'<b>{text}</b>', styles['h1'])

def H2(text):
    return Paragraph(f'<b>{text}</b>', styles['h2'])

def H3(text):
    return Paragraph(f'<b>{text}</b>', styles['h3'])

def make_table(data, col_ratios=None, caption=None):
    """Create a styled table with proper widths."""
    if col_ratios:
        col_widths = [r * AVAILABLE_W for r in col_ratios]
    else:
        col_widths = None
    
    t = Table(data, colWidths=col_widths, hAlign='CENTER')
    
    style_cmds = [
        ('BACKGROUND', (0, 0), (-1, 0), TABLE_HEADER_COLOR),
        ('TEXTCOLOR', (0, 0), (-1, 0), TABLE_HEADER_TEXT),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('GRID', (0, 0), (-1, -1), 0.5, TEXT_MUTED),
    ]
    for i in range(1, len(data)):
        bg = TABLE_ROW_EVEN if i % 2 == 1 else TABLE_ROW_ODD
        style_cmds.append(('BACKGROUND', (0, i), (-1, i), bg))
    
    t.setStyle(TableStyle(style_cmds))
    
    elements = [Spacer(1, 18), t]
    if caption:
        elements.append(Spacer(1, 6))
        elements.append(P(caption, 'caption'))
    elements.append(Spacer(1, 18))
    return elements

def add_heading(text, style_key, level=0):
    key = 'h_%s' % hashlib.md5(text.encode()).hexdigest()[:8]
    p = Paragraph('<a name="%s"/><b>%s</b>' % (key, text), styles[style_key])
    p.bookmark_name = text
    p.bookmark_level = level
    p.bookmark_text = text
    p.bookmark_key = key
    return p

H1_ORPHAN_THRESHOLD = (PAGE_H - TOP_MARGIN - BOTTOM_MARGIN) * 0.15

def add_major_section(text):
    return [
        CondPageBreak(H1_ORPHAN_THRESHOLD),
        add_heading(text, 'h1', level=0),
    ]

# ━━ TocDocTemplate ━━
class TocDocTemplate(SimpleDocTemplate):
    def afterFlowable(self, flowable):
        if hasattr(flowable, 'bookmark_name'):
            level = getattr(flowable, 'bookmark_level', 0)
            text = getattr(flowable, 'bookmark_text', '')
            key = getattr(flowable, 'bookmark_key', '')
            self.notify('TOCEntry', (level, text, self.page, key))

# ━━ Build Story ━━
story = []

# --- TOC ---
toc = TableOfContents()
toc.levelStyles = [styles['toc_h1'], styles['toc_h2']]
story.append(Paragraph('<b>目  錄</b>', ParagraphStyle(
    name='TOCTitle', fontName='NotoSerifSC', fontSize=22, leading=32,
    textColor=ACCENT, alignment=TA_CENTER, spaceBefore=40, spaceAfter=30
)))
story.append(toc)
story.append(PageBreak())

# ═══════════════════════════════════════════
# 第一章：手冊使用指南
# ═══════════════════════════════════════════
story.extend(add_major_section('第一章  手冊使用指南'))

story.append(H2('1.1  本手冊是甚麼'))
story.append(P(
    '本手冊是專為「家族辦公室專業認可證書」（PZC）課程畢業生而設計的實戰工具。'
    '它不是一本理論教科書，而是一本讓你在面對潛在客戶時不再猶豫、不再無所適從的行動指南。'
    '每一位新畢業生在完成課程後，最常面對的困境是：「我知道產品，但我不懂得如何開口。」'
    '這本手冊正是為了解決這個問題而存在——它把複雜的客戶開拓過程，轉化為可執行的步驟和可直接使用的話術，'
    '讓你能夠帶著信心走近每一位潛在客戶。'
))
story.append(P(
    '手冊的核心設計理念是「口袋教練」——就像一位資深導師站在你身旁，告訴你接下來該說甚麼、'
    '該推薦哪個產品、該如何回應客戶的反對意見。每一個章節都圍繞一個實戰場景而設計，'
    '你可以按需要翻查，也可以從頭到尾通讀一遍，建立完整的客戶開拓思維框架。'
))

story.append(H2('1.2  如何使用本手冊'))
story.append(P(
    '本手冊採用「問題導向」的結構設計，你可以根據自己當前面對的場景，直接翻到對應章節：'
))
story.append(P('第一步：識別客戶類型 → 翻閱第二章，快速判斷你的潛在客戶屬於哪個類型', 'bullet'))
story.append(P('第二步：深入了解客戶需求 → 翻閱第三章或第四章，掌握該類型客戶的核心需求與切入角度', 'bullet'))
story.append(P('第三步：配對產品方案 → 翻閱第五章，找到最適合該客戶的產品組合', 'bullet'))
story.append(P('第四步：準備開口話術 → 翻閱第六章，選擇適合場景的開場白', 'bullet'))
story.append(P('第五步：處理反對意見 → 翻閱第七章，預先準備應對策略', 'bullet'))
story.append(P('第六步：判斷是否需要升級 → 翻閱第八章，識別紅旗信號，適時尋求導師協助', 'bullet'))
story.append(P(
    '建議你在首次接觸客戶前，至少完整閱讀一次第二至第五章，建立整體概念；'
    '之後在實戰中可按需要翻查第六至第八章的具體話術和應對策略。每次與客戶會面後，'
    '回顧手冊中對應的章節，反思哪些地方可以做得更好，這樣才能不斷進步。'
))

story.append(H2('1.3  核心原則：手冊是教練，不是資料庫'))
story.append(P(
    '一般 CRM 系統是記錄工具——它告訴你「發生了甚麼」。但本手冊是教練工具——它告訴你「應該做甚麼」。'
    '兩者的根本分別在於：資料庫是被動的，需要你主動去查詢和判斷；而教練是主動的，'
    '它會根據你輸入的客戶資訊，直接告訴你應該從哪個角度切入、推薦哪些產品、用甚麼話術開場。'
))
story.append(P(
    '這意味著你在使用本手冊時，不需要自己做大量分析判斷。你只需要準確識別客戶的類型，'
    '手冊就會為你提供後續所有步驟的指引。當然，隨着你經驗的積累，你會逐漸發展出自己的判斷力和風格，'
    '但在此之前，請信任手冊的建議，按步就班地執行，這是最快建立信心的方法。'
))

# ═══════════════════════════════════════════
# 第二章：客戶類型識別速查
# ═══════════════════════════════════════════
story.extend(add_major_section('第二章  客戶類型識別速查'))

story.append(H2('2.1  兩大客戶陣營'))
story.append(P(
    '我們的目標客戶來自中國內地，分為兩大陣營：機構客戶和個人客戶。'
    '機構客戶的切入點是「企業問題」——他們來解決上市、稅務、架構等問題；'
    '個人客戶的切入點是「財富需求」——他們來尋求財富保全、遺產規劃、稅務策略等方案。'
    '兩類客戶的溝通方式、產品配對和跟進策略完全不同，因此準確識別是第一步，也是最重要的一步。'
))

# Two-camp overview table
data = [
    [P('<b>維度</b>', 'table_header'), P('<b>機構客戶</b>', 'table_header'), P('<b>個人客戶</b>', 'table_header')],
    [P('核心驅動', 'table_cell'), P('企業發展需求（IPO、融資、稅務優化）', 'table_cell'), P('個人及家庭財富需求（保全、傳承、稅務）', 'table_cell')],
    [P('決策模式', 'table_cell'), P('理性、流程化、需多方審批', 'table_cell'), P('感性与理性並重、個人/家族決策', 'table_cell')],
    [P('接觸週期', 'table_cell'), P('長週期（3-12個月）', 'table_cell'), P('中週期（1-6個月）', 'table_cell')],
    [P('切入角度', 'table_cell'), P('從「問題」切入，不是從「產品」切入', 'table_cell'), P('從「人生階段需求」切入', 'table_cell')],
    [P('溝通風格', 'table_cell'), P('專業、數據驅動、方案導向', 'table_cell'), P('共情、故事驅動、關係導向', 'table_cell')],
    [P('產品形態', 'table_cell'), P('嵌入在解決方案中的產品組合', 'table_cell'), P('直接推薦的產品或服務', 'table_cell')],
]
story.extend(make_table(data, [0.15, 0.425, 0.425], '表一：機構客戶與個人客戶對比'))

story.append(H2('2.2  機構客戶三大型（A1-A3）'))
story.append(P(
    '機構客戶可進一步細分為三種類型，每種類型的需求和切入角度都不一樣。'
    '準確識別子類型，能讓你在第一次接觸時就說出客戶最關心的問題，建立專業信任感。'
))

data = [
    [P('<b>類型</b>', 'table_header'), P('<b>特徵</b>', 'table_header'), P('<b>核心需求</b>', 'table_header'), P('<b>切入角度</b>', 'table_header')],
    [P('A1 擬上市企業', 'table_cell_center'), P('內地企業，計劃在香港上市；已有一定規模和盈利能力', 'table_cell'), P('Pre-IPO 重組、股權架構、合規諮詢', 'table_cell'), P('「香港上市需要全方位規劃」', 'table_cell')],
    [P('A2 已上市企業', 'table_cell_center'), P('已在香港或境外上市；關注上市後的財富管理', 'table_cell'), P('股份質押融資、鎖定期規劃、分紅策略', 'table_cell'), P('「上市後的財富保護同樣重要」', 'table_cell')],
    [P('A3 跨境企業', 'table_cell_center'), P('同時在內地和香港有業務；關注跨境稅務和資金流動', 'table_cell'), P('跨境稅務規劃、雙幣種對沖、實體重組', 'table_cell'), P('「兩地經營需要兩地保護」', 'table_cell')],
]
story.extend(make_table(data, [0.12, 0.26, 0.30, 0.32], '表二：機構客戶子類型'))

story.append(H2('2.3  個人客戶三大型（B1-B3）'))
story.append(P(
    '個人客戶同樣分為三種類型。我們服務的對象是高淨值及超高淨值人士，'
    '他們的資產規模通常在數千萬至數億人民幣以上。每種類型客戶最關心的問題不同，'
    '你必須在初次接觸時就能準確捕捉他們的核心訴求，才能建立有效的溝通。'
))

data = [
    [P('<b>類型</b>', 'table_header'), P('<b>特徵</b>', 'table_header'), P('<b>核心需求</b>', 'table_header'), P('<b>切入角度</b>', 'table_header')],
    [P('B1 創一代', 'table_cell_center'), P('第一代財富創造者；企業家或高管；50-70歲；仍在經營業務', 'table_cell'), P('財富保全、資產隔離、家族信託', 'table_cell'), P('「辛苦打嘅江山，點樣守住？」', 'table_cell')],
    [P('B2 繼承者', 'table_cell_center'), P('第二代或繼承人；30-50歲；可能未完全接手家族業務', 'table_cell'), P('遺產規劃、身份規劃、婚前協議保障', 'table_cell'), P('「承接財富需要承接智慧」', 'table_cell')],
    [P('B3 跨境高淨值', 'table_cell_center'), P('同時在內地和香港有資產；關注稅務合規和資金流動', 'table_cell'), P('CRS 合規、雙重徵稅規避、跨境資金通道', 'table_cell'), P('「兩地資產需要兩地策略」', 'table_cell')],
]
story.extend(make_table(data, [0.12, 0.26, 0.30, 0.32], '表三：個人客戶子類型'))

story.append(H2('2.4  關鍵洞察：機構與個人需求的重疊'))
story.append(P(
    '在實際業務中，你會發現很多客戶同時具有機構和個人兩種需求。特別是創一代（B1），'
    '他們往往同時是企業的控股股東——他們既需要為企業做 IPO 規劃（A1），'
    '又需要為個人財富做資產隔離和傳承規劃（B1）。這意味着一個客戶可能帶來兩條業務線的機會。'
))
story.append(P(
    '當你識別到這種「雙重需求」時，應該在筆記中同時標記兩個類型，並在後續跟進中分別從兩個角度提供方案。'
    '不過要注意：不要在第一次接觸時就同時推銷兩條線，這會讓客戶感到壓力。'
    '應該先從客戶目前最迫切的需求入手，建立信任後再自然地過渡到第二條線。'
    '例如，先幫客戶解決 IPO 的股權架構問題，再在合適的時機提出個人資產隔離的建議。'
))

# ═══════════════════════════════════════════
# 第三章：機構客戶攻略
# ═══════════════════════════════════════════
story.extend(add_major_section('第三章  機構客戶攻略'))

story.append(H2('3.1  A1 擬上市企業'))
story.append(H3('客戶畫像'))
story.append(P(
    'A1 類型客戶通常是內地民營企業的創始人或核心決策者，企業年營業額在數億至數十億人民幣之間，'
    '已有穩定的盈利能力和清晰的商業模式。他們正考慮或已啟動香港上市計劃，'
    '但往往對香港資本市場的規則和流程缺乏深入了解。這類客戶最焦慮的是：上市過程中會遇到哪些陷阱？'
    '如何最大程度保護自己的股權和控制權？上市後的稅務負擔如何優化？'
))

story.append(H3('需求深度分析'))
data = [
    [P('<b>需求層面</b>', 'table_header'), P('<b>具體需求</b>', 'table_header'), P('<b>你的價值</b>', 'table_header')],
    [P('股權架構', 'table_cell'), P('上市前股權重組、離岸架構搭建、控股公司設計', 'table_cell'), P('提供專業的股權架構建議，連接法律和稅務團隊', 'table_cell')],
    [P('稅務規劃', 'table_cell'), P('上市過程中的稅務成本優化、跨境稅務合規', 'table_cell'), P('幫助客戶預估稅務影響，推薦合規的稅務優化方案', 'table_cell')],
    [P('資產隔離', 'table_cell'), P('將個人資產與企業風險隔離、家族信託設立', 'table_cell'), P('解釋資產隔離的重要性，推薦信託和保險架構方案', 'table_cell')],
    [P('跨境資金', 'table_cell'), P('IPO 募集資金的跨境回流、外匯管理合規', 'table_cell'), P('協調跨境金融服務，提供資金通道解決方案', 'table_cell')],
]
story.extend(make_table(data, [0.15, 0.40, 0.45], '表四：A1 擬上市企業需求分析'))

story.append(H3('切入話術'))
story.append(P(
    '面對 A1 客戶，你的開場不應該從產品開始，而應該從「問題」開始。'
    '這類客戶不是來買保險的，他們是來解決上市過程中遇到的架構和稅務問題的。'
    '以下是幾個經過驗證的切入話術：', 'body_no_indent'
))
story.append(P('"王總，知道您正在考慮香港上市，其實上市前最關鍵的不是招股書，而是股權架構和稅務安排。'
    '很多企業在這一步沒有提前規劃，後來多交了幾千萬的稅。"', 'quote'))
story.append(P('"李董，香港上市的好處不只是融資，更重要的是通過合規的架構安排，'
    '讓您的個人資產和企業風險徹底隔離。這一步做對了，等於給家族財富上了一道保險。"', 'quote'))

story.append(H2('3.2  A2 已上市企業'))
story.append(H3('客戶畫像'))
story.append(P(
    'A2 類型客戶是已經在香港或境外上市的企業實控人。他們的企業已經完成了 IPO，'
    '正面臨上市後的一系列新問題：鎖定期結束後如何減持？如何通過股份質押獲得流動資金而不失去控制權？'
    '上市公司的分紅如何合理分配和規劃？這類客戶往往被各種金融機構爭相拜訪，'
    '因此你需要提供更有深度的洞察才能引起他們的興趣。'
))

story.append(H3('切入話術'))
story.append(P(
    '"張總，公司上市後很多人都在關注股價，但其實更重要的是——上市創造的財富如何保護？'
    '我們看到不少上市公司的實控人，在鎖定期後沒有做好財富隔離，結果市場波動直接影響了家族資產。"', 'quote'))

story.append(H2('3.3  A3 跨境企業'))
story.append(H3('客戶畫像'))
story.append(P(
    'A3 類型客戶的企業同時在內地和香港（甚至其他地區）有實體經營，面臨複雜的跨境稅務、'
    '資金流動和外匯管理問題。他們可能不是上市公司，但業務規模和資金量都很大。'
    '這類客戶最關心的是：如何在合規的前提下，實現跨境資金的高效流動？'
    '如何避免兩地重複徵稅？如何優化企業的跨境架構？'
))

story.append(H3('切入話術'))
story.append(P(
    '"陳總，兩地經營最大的挑戰不是業務，而是稅務和資金。很多跨境企業每年因為沒有做好稅務規劃，'
    '多交了數百萬甚至數千萬的稅。更重要的是，兩地的外匯管理政策經常變化，不及時調整可能會面臨合規風險。"',
    'quote'))

# ═══════════════════════════════════════════
# 第四章：個人客戶攻略
# ═══════════════════════════════════════════
story.extend(add_major_section('第四章  個人客戶攻略'))

story.append(H2('4.1  B1 創一代'))
story.append(H3('客戶畫像'))
story.append(P(
    '創一代是家族辦公室最核心的服務對象。他們通常在50-70歲之間，花了二三十年時間打造出自己的事業王國，'
    '如今擁有數千萬至數十億的個人資產。但他們面臨一個共同的焦慮：如何確保辛苦積累的財富不會因為'
    '商業風險、法律糾紛或家族內爭而流失？如何將財富平穩地傳承給下一代？'
    '這類客戶往往非常務實，不喜歡空泛的理論，更看重具體的可執行方案。'
))

story.append(H3('核心需求與產品配對'))
data = [
    [P('<b>核心需求</b>', 'table_header'), P('<b>對應產品/服務</b>', 'table_header'), P('<b>溝通要點</b>', 'table_header')],
    [P('財富保全', 'table_cell'), P('大額壽險、資產隔離架構、離岸信託', 'table_cell'), P('強調「守住」比「增值」更重要', 'table_cell')],
    [P('資產隔離', 'table_cell'), P('家族信託、保險金信託、離岸公司', 'table_cell'), P('強調個人資產與企業風險分離的必要性', 'table_cell')],
    [P('稅務策略', 'table_cell'), P('跨境稅務規劃、CRS 合規方案', 'table_cell'), P('強調合規前提下的稅務優化', 'table_cell')],
    [P('遺產規劃', 'table_cell'), P('遺囑+信託組合、保險受益人安排', 'table_cell'), P('強調有序傳承避免家族糾紛', 'table_cell')],
    [P('跨境配置', 'table_cell'), P('離岸資產配置、多幣種投資', 'table_cell'), P('強調分散風險和匯率對沖', 'table_cell')],
]
story.extend(make_table(data, [0.15, 0.40, 0.45], '表五：B1 創一代核心需求與產品配對'))

story.append(H3('切入話術'))
story.append(P(
    '"王老闆，您用三十年打拼出這份家業，但有沒有想過——如果有一天企業遇到困難，'
    '債權人追上門，您個人的房子、存款會不會也被牽連？其實有很多合法的方式可以把個人資產和企業風險隔離開來，'
    '讓您打下的江山永遠屬於您和您的家人。"', 'quote'))

story.append(H2('4.2  B2 繼承者'))
story.append(H3('客戶畫像'))
story.append(P(
    '繼承者通常是30-50歲的第二代，他們可能已經繼承了部分家族資產，或者正在準備接班。'
    '與創一代不同，繼承者面臨的核心問題不是「如何創造財富」，而是「如何承接和保護財富」。'
    '他們可能對家族業務有興趣也可能沒有，可能與兄弟姐妹之間存在潛在的繼承糾紛，'
    '也可能正在考慮婚前財產保護。這類客戶往往更注重隱私和個人自由，'
    '需要你用更細膩的方式去溝通。'
))

story.append(H3('切入話術'))
story.append(P(
    '"陳先生，很多人只關注如何賺錢，但其實承接財富也是一門學問。我們見過不少案例，'
    '第二代因為沒有做好傳承規劃，結果家族資產在繼承過程中縮水了三成甚至更多。'
    '提前做好規劃，不只是保護資產，更是保護家人之間的關係。"', 'quote'))

story.append(H2('4.3  B3 跨境高淨值'))
story.append(H3('客戶畫像'))
story.append(P(
    '跨境高淨值客戶是同時在內地和香港（可能還有其他地區）擁有資產的個人。'
    '他們可能是經常往返兩地的企業家、已取得香港身份的內地人士、或子女在海外留學的家長。'
    '他們最關心的問題是：兩地的稅務如何合規申報？資產如何跨境合法流動？'
    'CRS（共同申報準則）對他們的資產透明度有何影響？這類客戶對合規性極度敏感，'
    '你必須展現出專業的跨境知識才能贏得他們的信任。'
))

story.append(H3('切入話術'))
story.append(P(
    '"林太，現在很多內地朋友在香港有資產，但未必知道 CRS 已經讓兩地的金融賬戶資訊自動交換了。'
    '如果沒有做好合規申報，可能面臨補稅甚至罰款的風險。我們可以幫您做一個全面的合規體檢，'
    '確保您的跨境資產佈局既合法又高效。"', 'quote'))

# ═══════════════════════════════════════════
# 第五章：產品配對地圖
# ═══════════════════════════════════════════
story.extend(add_major_section('第五章  產品配對地圖'))

story.append(H2('5.1  產品配對總覽矩陣'))
story.append(P(
    '以下矩陣是整本手冊的核心大腦——每一位新客戶都可以根據其類型，在矩陣中快速找到對應的產品和服務。'
    '當你識別出客戶類型後，只需在對應行中找到標記的產品，即可準備推薦方案。'
    '雙重標記（如 B1 行中的多個產品）表示該類型客戶通常需要組合方案，而非單一產品。'
))

# Product mapping matrix
data = [
    [P('<b>產品/服務</b>', 'table_header'),
     P('<b>A1</b>', 'table_header_center'),
     P('<b>A2</b>', 'table_header_center'),
     P('<b>A3</b>', 'table_header_center'),
     P('<b>B1</b>', 'table_header_center'),
     P('<b>B2</b>', 'table_header_center'),
     P('<b>B3</b>', 'table_header_center')],
    [P('Pre-IPO 重組', 'table_cell'), P('/', 'table_cell_center'), P('', 'table_cell_center'), P('', 'table_cell_center'), P('', 'table_cell_center'), P('', 'table_cell_center'), P('', 'table_cell_center')],
    [P('股權架構設計', 'table_cell'), P('/', 'table_cell_center'), P('', 'table_cell_center'), P('', 'table_cell_center'), P('', 'table_cell_center'), P('', 'table_cell_center'), P('', 'table_cell_center')],
    [P('資產隔離架構', 'table_cell'), P('/', 'table_cell_center'), P('/', 'table_cell_center'), P('', 'table_cell_center'), P('/', 'table_cell_center'), P('', 'table_cell_center'), P('', 'table_cell_center')],
    [P('稅務策略', 'table_cell'), P('/', 'table_cell_center'), P('/', 'table_cell_center'), P('/', 'table_cell_center'), P('/', 'table_cell_center'), P('', 'table_cell_center'), P('/', 'table_cell_center')],
    [P('跨境配置', 'table_cell'), P('/', 'table_cell_center'), P('', 'table_cell_center'), P('/', 'table_cell_center'), P('/', 'table_cell_center'), P('', 'table_cell_center'), P('/', 'table_cell_center')],
    [P('家族信託', 'table_cell'), P('', 'table_cell_center'), P('/', 'table_cell_center'), P('', 'table_cell_center'), P('/', 'table_cell_center'), P('/', 'table_cell_center'), P('', 'table_cell_center')],
    [P('遺產規劃', 'table_cell'), P('', 'table_cell_center'), P('', 'table_cell_center'), P('', 'table_cell_center'), P('/', 'table_cell_center'), P('/', 'table_cell_center'), P('/', 'table_cell_center')],
    [P('大額壽險', 'table_cell'), P('', 'table_cell_center'), P('', 'table_cell_center'), P('', 'table_cell_center'), P('/', 'table_cell_center'), P('/', 'table_cell_center'), P('', 'table_cell_center')],
    [P('保險金信託', 'table_cell'), P('', 'table_cell_center'), P('', 'table_cell_center'), P('', 'table_cell_center'), P('/', 'table_cell_center'), P('/', 'table_cell_center'), P('', 'table_cell_center')],
    [P('CRS 合規', 'table_cell'), P('', 'table_cell_center'), P('', 'table_cell_center'), P('/', 'table_cell_center'), P('', 'table_cell_center'), P('', 'table_cell_center'), P('/', 'table_cell_center')],
    [P('身份規劃', 'table_cell'), P('', 'table_cell_center'), P('', 'table_cell_center'), P('', 'table_cell_center'), P('', 'table_cell_center'), P('/', 'table_cell_center'), P('/', 'table_cell_center')],
    [P('股份質押融資', 'table_cell'), P('', 'table_cell_center'), P('/', 'table_cell_center'), P('', 'table_cell_center'), P('', 'table_cell_center'), P('', 'table_cell_center'), P('', 'table_cell_center')],
]
story.extend(make_table(data, [0.28, 0.12, 0.12, 0.12, 0.12, 0.12, 0.12], '表六：產品-客戶類型配對矩陣（/ 表示適用）'))

story.append(H2('5.2  如何使用配對矩陣'))
story.append(P(
    '使用配對矩陣的方法很簡單：首先，根據第二章的方法識別客戶類型（A1-A3 或 B1-B3）；'
    '然後，在矩陣中找到對應的列，所有標記了「/」的行就是適合該客戶的產品或服務。'
    '需要注意的是，矩陣中的標記表示「該類型客戶通常需要此產品」，但具體推薦順序應根據客戶的實際情況調整。'
))
story.append(P(
    '一般來說，你應該從客戶最迫切的需求開始推薦，而不是一次性推薦所有標記的產品。'
    '例如，B1 創一代客戶的矩陣行有多個標記，但你在首次接觸時應該聚焦在他最焦慮的問題上——'
    '通常是資產隔離或財富保全，然後在後續跟進中逐步引入其他產品。'
    '每次推薦新產品時，都要回到客戶的原始需求，說明這個產品如何回應他的具體擔憂。'
))

story.append(H2('5.3  產品難度分級'))
story.append(P(
    '並非所有產品都適合新畢業生獨立推薦。我們將產品按推薦難度分為三個等級，'
    '幫助你判斷何時可以獨立處理，何時需要導師協助。'
))

data = [
    [P('<b>難度等級</b>', 'table_header'), P('<b>產品/服務</b>', 'table_header'), P('<b>畢業生指引</b>', 'table_header')],
    [P('入門級', 'table_cell_center'), P('大額壽險、稅務策略諮詢、CRS 合規體檢', 'table_cell'), P('新畢業生首3個月可獨立推薦——需求明確、容易開口、成交相對快', 'table_cell')],
    [P('進階級', 'table_cell_center'), P('家族信託、遺產規劃、保險金信託、身份規劃', 'table_cell'), P('累積一定經驗後推薦——需要更深入的需求分析能力', 'table_cell')],
    [P('專家級', 'table_cell_center'), P('Pre-IPO 重組、股權架構設計、跨境配置、股份質押融資', 'table_cell'), P('需導師陪同或轉介——門檻高但回報大', 'table_cell')],
]
story.extend(make_table(data, [0.12, 0.40, 0.48], '表七：產品難度分級'))

# ═══════════════════════════════════════════
# 第六章：開口話術庫
# ═══════════════════════════════════════════
story.extend(add_major_section('第六章  開口話術庫'))

story.append(H2('6.1  為甚麼話術如此重要'))
story.append(P(
    '新畢業生面對的最大敵人不是競爭對手，不是產品知識不足，而是猶豫。'
    '「我不知道點開口」、「我怕講錯嘢」、「我唔知佢想要咩」——這三句話是每一位新人的心聲。'
    '話術庫的設計目的，就是消除這種猶豫。當你手上有經過驗證的開場白，'
    '你不需要在見客前臨場發揮，只需要根據客戶類型選擇對應的話術，稍作個人化調整即可使用。'
    '記住：話術不是讓你照本宣科，而是給你一個安全的起點，讓你在熟悉之後逐漸發展出自己的風格。'
))

story.append(H2('6.2  按場景分類的話術'))

story.append(H3('場景一：介紹人引薦'))
story.append(P(
    '這是最高成功率的開場方式。當有共同認識的人引薦時，你已經有了信任基礎。'
    '話術重點是迅速建立專業形象，同時尊重介紹人的面子。'
))
story.append(P(
    '"王總您好，我是 [介紹人] 推薦的 [你的名字]，專注服務內地企業家在香港的財富規劃。'
    '[介紹人] 提到您最近在考慮 [客戶關注的事項]，我剛好幫幾位類似情況的客戶做過方案，'
    '想跟您簡單分享一下經驗，不知道方便嗎？"', 'quote'))

story.append(H3('場景二：研討會/活動後跟進'))
story.append(P(
    '參加行業活動後跟進是獲取高質量線索的重要渠道。話術重點是喚起客戶對活動的記憶，'
    '並迅速過渡到你能提供的價值。'
))
story.append(P(
    '"王總，前天在 [活動名稱] 上跟您聊得很開心。您提到的那個 [客戶關注的問題]，'
    '我回來後整理了一份資料，裏面有幾個很實用的建議。方便的話，我發給您看看？"', 'quote'))

story.append(H3('場景三：首次冷接觸'))
story.append(P(
    '冷接觸是最困難但也最鍛鍊人的方式。關鍵是在30秒內讓對方覺得「這個人可能對我有用」。'
    '不要推銷產品，而是提出一個對方可能感興趣的問題或洞察。'
))
story.append(P(
    '"王總您好，我是 [公司名] 的 [你的名字]。我注意到 [具體觀察：比如近期公司動態、行業新聞]，'
    '很多類似情況的企業家都在關注 [相關議題]，我們最近剛幫一位客戶做了相關的規劃，效果很不錯。'
    '不知道您對這方面有沒有興趣了解一下？"', 'quote'))

story.append(H3('場景四：轉介紹請求'))
story.append(P(
    '每次成功服務客戶後，都是請求轉介紹的最佳時機。話術要自然，不要讓客戶感到壓力。'
))
story.append(P(
    '"王總，很高興方案幫到您。其實像您這樣有遠見的企業家，身邊肯定也有朋友在考慮類似的問題。'
    '如果方便的話，您可不可以介紹一兩位讓我認識？我保證會像服務您一樣用心。"', 'quote'))

story.append(H2('6.3  按客戶類型的專屬開場'))

data = [
    [P('<b>客戶類型</b>', 'table_header'), P('<b>開場白範例</b>', 'table_header'), P('<b>注意事項</b>', 'table_header')],
    [P('A1 擬上市', 'table_cell'), P('「聽說貴公司正在準備香港上市，恭喜！上市前有幾個關鍵的架構決定，做對了可以省很多稅，做錯了可能影響整個上市進程。」', 'table_cell'), P('聚焦「上市前」的緊迫性，客戶會感到時間壓力而願意聆聽', 'table_cell')],
    [P('A2 已上市', 'table_cell'), P('「公司上市後，您個人最大的資產就是股份。有沒有想過，如何讓這些股份不只是帳面財富，而是真正為您和家族服務？」', 'table_cell'), P('聚焦「帳面財富 vs 實際掌控」的落差', 'table_cell')],
    [P('A3 跨境', 'table_cell'), P('「兩地經營的企業最怕的不是業務風險，而是稅務和合規風險。最近政策變化很快，您有沒有做過最新的合規體檢？」', 'table_cell'), P('聚焦「政策變化」製造即時性', 'table_cell')],
    [P('B1 創一代', 'table_cell'), P('「您用半輩子打下的江山，最怕的不是賺不到錢，而是守不住。有很多合法的方式可以讓您的資產和企業風險徹底分開。」', 'table_cell'), P('聚焦「守住」的焦慮，情感共鳴', 'table_cell')],
    [P('B2 繼承者', 'table_cell'), P('「承接財富需要承接智慧。我們見過很多第二代因為沒有提前規劃，結果在繼承過程中資產大幅縮水。其實提前做好安排，這些都是可以避免的。」', 'table_cell'), P('聚焦「縮水風險」，理性但不失溫度', 'table_cell')],
    [P('B3 跨境個人', 'table_cell'), P('「您在兩地都有資產，但 CRS 之後，兩地的金融資訊已經自動交換了。如果沒有做好合規規劃，可能面臨補稅甚至罰款的風險。」', 'table_cell'), P('聚焦「CRS 合規」的急迫性', 'table_cell')],
]
story.extend(make_table(data, [0.12, 0.48, 0.40], '表八：按客戶類型的專屬開場白'))

# ═══════════════════════════════════════════
# 第七章：反對處理攻略
# ═══════════════════════════════════════════
story.extend(add_major_section('第七章  反對處理攻略'))

story.append(H2('7.1  反對不是拒絕，而是問題'))
story.append(P(
    '很多新畢業生聽到客戶的反對意見就會感到沮喪，甚至放棄跟進。但事實上，'
    '客戶提出反對恰恰說明他在認真考慮你的建議——如果他完全不感興趣，'
    '他根本不會花時間跟你說「不」。每一個反對意見背後都隱藏着一個未被滿足的需求或一個未被解答的疑慮。'
    '你的任務不是「說服」客戶，而是「理解」他的疑慮，然後提供讓他安心的答案。'
))

story.append(H2('7.2  常見反對意見與應對策略'))

data = [
    [P('<b>反對意見</b>', 'table_header'), P('<b>背後的疑慮</b>', 'table_header'), P('<b>建議回應</b>', 'table_header')],
    [P('「我已經有理財顧問了」', 'table_cell'), P('不想破壞現有關係；不覺得你有額外價值', 'table_cell'), P('「完全理解，我們不是要取代您的顧問。家族辦公室的服務跟一般理財不同，專注在財富架構層面，跟現有的投資管理是互補的。」', 'table_cell')],
    [P('「我不需要這些服務」', 'table_cell'), P('不了解家族辦公室的價值；覺得自己目前的安排已經夠好', 'table_cell'), P('「很多企業家一開始也這樣想。但當他們了解到資產隔離可以保護個人財產不受企業風險影響時，都覺得這是一個值得了解的選項。」', 'table_cell')],
    [P('「讓我想想再說」', 'table_cell'), P('猶豫不決；需要更多時間消化資訊；可能還有未表達的疑慮', 'table_cell'), P('「當然，這些決定確實需要時間考慮。不如我先發一份簡單的案例給您參考，您看完後我們再聊？這樣您做決定時也有更多依據。」', 'table_cell')],
    [P('「收費太貴了」', 'table_cell'), P('不確定價值是否匹配價格；可能在比較其他供應商', 'table_cell'), P('「我理解您的顧慮。其實我們的服務不是費用，而是投資——一個好的架構規劃，通常第一年就能為您省回數倍於服務費的稅務成本。」', 'table_cell')],
    [P('「我年紀還輕，不急」', 'table_cell'), P('覺得傳承規劃是老年人的事；不了解提前規劃的複利效應', 'table_cell'), P('「其實越早規劃，選擇越多、成本越低。很多工具一旦錯過了設立的最佳時機，後來要補救的費用可能是現在的數倍。」', 'table_cell')],
    [P('「我不方便透露資產情況」', 'table_cell'), P('擔心隱私洩露；對你還不夠信任', 'table_cell'), P('「完全理解，隱私保護是我們服務的底線。我們有嚴格的保密協議，所有資訊只用於為您制定方案。第一次溝通不需要提供具體數字，我們可以從大方向聊起。」', 'table_cell')],
]
story.extend(make_table(data, [0.15, 0.28, 0.57], '表九：常見反對意見與應對策略'))

story.append(H2('7.3  反對處理的通用原則'))
story.append(P(
    '第一，永遠不要與客戶對抗。當客戶提出反對時，先認可他的感受（「我理解您的顧慮」），'
    '然後再提供你的視角。對抗只會讓客戶更加防備，而認可可以讓對話繼續。'
))
story.append(P(
    '第二，用問題代替陳述。當你不確定客戶反對的真正原因時，不要猜測，直接問：'
    '「您最主要的擔心是甚麼？是成本方面，還是對服務效果不確定？」開放式問題可以幫助你找到真正的癥結。'
))
story.append(P(
    '第三，用具體案例代替抽象承諾。「我們可以幫您省稅」遠不如「我們上個月幫一位深圳的製造業客戶，'
    '通過合規的架構調整，第一年就省了約八百萬的稅」來得有說服力。隨時準備2-3個真實案例，'
    '當然要確保客戶隱私得到保護，不要透露可識別身份的資訊。'
))
story.append(P(
    '第四，知道何時停止。如果客戶連續三次表示不感興趣，尊重他的決定，留下聯繫方式，'
    '然後在3-6個月後以軟性方式重新接觸（比如分享一篇他可能感興趣的文章）。'
    '強行推銷只會破壞關係，而溫和的持續跟進可能在未來收穫回報。'
))

# ═══════════════════════════════════════════
# 第八章：紅旗與升級機制
# ═══════════════════════════════════════════
story.extend(add_major_section('第八章  紅旗與升級機制'))

story.append(H2('8.1  甚麼是紅旗'))
story.append(P(
    '紅旗是指在客戶開拓過程中出現的警示信號，表示你應該暫停獨立處理，'
    '轉而尋求導師或合規團隊的協助。紅旗不是失敗的標誌，而是保護機制——'
    '它保護你、保護客戶、也保護公司。新畢業生最常犯的錯誤不是「做錯了甚麼」，'
    '而是「沒有在應該求助的時候求助」。記住：及時升級不是能力的不足，而是專業的體現。'
))

story.append(H2('8.2  紅旗清單'))

data = [
    [P('<b>紅旗類別</b>', 'table_header'), P('<b>具體信號</b>', 'table_header'), P('<b>應採取的行動</b>', 'table_header')],
    [P('合規風險', 'table_cell'), P('客戶要求不合法的操作；涉及洗錢或資金來源不明的情況；客戶表示不願意做 KYC', 'table_cell'), P('立即停止對話，向合規團隊報告。不要試圖自行判斷或處理', 'table_cell')],
    [P('超出能力範圍', 'table_cell'), P('客戶提出的問題你無法回答；涉及你尚未掌握的產品或法規；客戶要求的法律或稅務意見', 'table_cell'), P('誠實告知客戶你需要確認細節，承諾在指定時間內回覆，然後向導師請教', 'table_cell')],
    [P('超高金額交易', 'table_cell'), P('涉及金額超過你的授權限額；需要跨部門協調的複雜交易', 'table_cell'), P('向導師報告，請求共同處理或轉介', 'table_cell')],
    [P('客戶情緒波動', 'table_cell'), P('客戶表現出焦慮、憤怒或恐慌；客戶正面臨緊急的法律或財務危機', 'table_cell'), P('不要在客戶情緒激動時推銷產品，先安撫情緒，再請導師介入評估', 'table_cell')],
    [P('利益衝突', 'table_cell'), P('客戶與公司或你個人有潛在利益衝突；客戶同時是你的親友', 'table_cell'), P('向合規團隊披露，遵循利益衝突申報流程', 'table_cell')],
]
story.extend(make_table(data, [0.13, 0.44, 0.43], '表十：紅旗清單與應對行動'))

story.append(H2('8.3  升級流程'))
story.append(P(
    '當你識別到紅旗信號後，請按照以下流程進行升級處理。升級不是推卸責任，'
    '而是確保客戶獲得最專業的服務，同時保護你自己在合規框架內操作。'
    '每一個升級步驟都應該及時記錄，以便日後追溯和學習。'
))

data = [
    [P('<b>步驟</b>', 'table_header'), P('<b>行動</b>', 'table_header'), P('<b>時間要求</b>', 'table_header')],
    [P('1. 識別紅旗', 'table_cell_center'), P('根據上述清單判斷是否出現紅旗信號', 'table_cell'), P('即時', 'table_cell_center')],
    [P('2. 暫停推進', 'table_cell_center'), P('停止向客戶承諾任何方案或時間表', 'table_cell'), P('即時', 'table_cell_center')],
    [P('3. 內部記錄', 'table_cell_center'), P('記錄紅旗信號的具體情況和你的判斷', 'table_cell'), P('24小時內', 'table_cell_center')],
    [P('4. 聯繫導師', 'table_cell_center'), P('向你的指定導師報告情況，聽取建議', 'table_cell'), P('24小時內', 'table_cell_center')],
    [P('5. 合規申報', 'table_cell_center'), P('如涉及合規風險，向合規團隊正式申報', 'table_cell'), P('48小時內', 'table_cell_center')],
    [P('6. 跟進回覆', 'table_cell_center'), P('向客戶回覆處理結果或後續安排', 'table_cell'), P('視情況而定', 'table_cell_center')],
]
story.extend(make_table(data, [0.12, 0.55, 0.33], '表十一：升級流程'))

story.append(H2('8.4  導師支援機制'))
story.append(P(
    '每位新畢業生都會被分配一位導師。導師的角色不是監督你，而是支持你。'
    '在以下情況下，你應該主動聯繫導師：遇到紅旗信號時、面對超出自己能力範圍的客戶需求時、'
    '連續兩週未能成功約見新客戶時、對任何合規問題有疑問時。'
    '導師會根據情況提供電話指導、陪同會面或轉介至專業團隊。'
    '請記住，導師也曾經是新人，他們完全理解你面對的壓力和困惑。'
    '主動求助不是弱點，而是成長的加速器——越早求助，學得越快。'
))

# ━━ Build Document ━━
OUTPUT_DIR = '/home/z/my-project/download'
os.makedirs(OUTPUT_DIR, exist_ok=True)
BODY_PDF = os.path.join(OUTPUT_DIR, 'pzc_handbook_body.pdf')

doc = TocDocTemplate(
    BODY_PDF,
    pagesize=A4,
    leftMargin=LEFT_MARGIN,
    rightMargin=RIGHT_MARGIN,
    topMargin=TOP_MARGIN,
    bottomMargin=BOTTOM_MARGIN,
    title='PZC 家族辦公室專業認可證書畢業生客戶開拓手冊',
    author='Z.ai',
    creator='Z.ai',
)

doc.multiBuild(story)
print(f"Body PDF generated: {BODY_PDF}")
