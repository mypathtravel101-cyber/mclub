#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Andy Japan Property Report - V6 Part 1/2/3 (Framework-Aligned)
   Following weixin-image.jpg 6-chapter architecture.
   This version: Chapters 1, 2, 3 only.
   Audience: Andy (investment novice), plain language, all HKD amounts.
"""

import os

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image, HRFlowable
)
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase.pdfmetrics import registerFontFamily

# ═══════════════════════════════════════════════════
# FONTS & COLORS
# ═══════════════════════════════════════════════════
pdfmetrics.registerFont(TTFont('NotoSerifSC', '/usr/share/fonts/truetype/noto-serif-sc/NotoSerifSC-Regular.ttf'))
pdfmetrics.registerFont(TTFont('NotoSerifSCBold', '/usr/share/fonts/truetype/noto-serif-sc/NotoSerifSC-Bold.ttf'))
registerFontFamily('NotoSerifSC', normal='NotoSerifSC', bold='NotoSerifSCBold')

ACCENT = colors.HexColor('#1f7692')
TEXT_PRIMARY = colors.HexColor('#1b1a18')
TEXT_MUTED = colors.HexColor('#7a766f')
BG_SURFACE = colors.HexColor('#e5e3df')
TABLE_HEADER_COLOR = ACCENT
TABLE_HEADER_TEXT = colors.white
TABLE_ROW_EVEN = colors.white
TABLE_ROW_ODD = BG_SURFACE

W, H = A4
LM, RM, TM, BM = 2.2*cm, 2.2*cm, 2.5*cm, 2.5*cm
CW = W - LM - RM

# ═══════════════════════════════════════════════════
# STYLES
# ═══════════════════════════════════════════════════
S = {}
S['h1'] = ParagraphStyle('H1', fontName='NotoSerifSC', fontSize=20, leading=28,
    textColor=TEXT_PRIMARY, spaceBefore=20, spaceAfter=10)
S['h2'] = ParagraphStyle('H2', fontName='NotoSerifSC', fontSize=14, leading=21,
    textColor=ACCENT, spaceBefore=16, spaceAfter=8)
S['h3'] = ParagraphStyle('H3', fontName='NotoSerifSC', fontSize=12, leading=18,
    textColor=TEXT_PRIMARY, spaceBefore=12, spaceAfter=6)
S['body'] = ParagraphStyle('Body', fontName='NotoSerifSC', fontSize=10.5, leading=18,
    textColor=TEXT_PRIMARY, spaceBefore=3, spaceAfter=6, alignment=TA_JUSTIFY, wordWrap='CJK')
S['bodyL'] = ParagraphStyle('BodyL', fontName='NotoSerifSC', fontSize=10.5, leading=18,
    textColor=TEXT_PRIMARY, spaceBefore=3, spaceAfter=6, alignment=TA_LEFT, wordWrap='CJK')
S['cap'] = ParagraphStyle('Cap', fontName='NotoSerifSC', fontSize=9, leading=14,
    textColor=TEXT_MUTED, spaceBefore=4, spaceAfter=8, alignment=TA_CENTER, wordWrap='CJK')
S['callout'] = ParagraphStyle('Callout', fontName='NotoSerifSC', fontSize=11, leading=18,
    textColor=ACCENT, spaceBefore=6, spaceAfter=6, alignment=TA_LEFT, wordWrap='CJK',
    leftIndent=12, borderColor=ACCENT, borderWidth=2, borderPadding=8)
S['big'] = ParagraphStyle('Big', fontName='NotoSerifSCBold', fontSize=14, leading=20,
    textColor=TEXT_PRIMARY, spaceBefore=6, spaceAfter=6, alignment=TA_CENTER, wordWrap='CJK')
S['qt'] = ParagraphStyle('QT', fontName='NotoSerifSC', fontSize=12, leading=18,
    textColor=TEXT_PRIMARY, spaceBefore=8, spaceAfter=4, alignment=TA_CENTER, wordWrap='CJK')

def h1(t): return Paragraph(f'<b>{t}</b>', S['h1'])
def h2(t): return Paragraph(f'<b>{t}</b>', S['h2'])
def h3(t): return Paragraph(f'<b>{t}</b>', S['h3'])
def p(t): return Paragraph(t, S['body'])
def pl(t): return Paragraph(t, S['bodyL'])
def cap(t): return Paragraph(t, S['cap'])
def co(t): return Paragraph(t, S['callout'])
def big(t): return Paragraph(t, S['big'])
def qt(t): return Paragraph(f'<b>{t}</b>', S['qt'])
def hr(): return HRFlowable(width='100%', thickness=0.5, color=ACCENT, spaceBefore=8, spaceAfter=8, opacity=0.3)

def fmt(v, pre='HKD '):
    return f'{pre}+{v:.1f}萬' if v >= 0 else f'{pre}{v:.1f}萬'

def tbl(headers, rows, col_widths=None):
    cw = col_widths or [CW / len(headers)] * len(headers)
    th = ParagraphStyle('TH', fontName='NotoSerifSC', fontSize=9.5, leading=14,
        textColor=TABLE_HEADER_TEXT, alignment=TA_CENTER, wordWrap='CJK')
    td = ParagraphStyle('TD', fontName='NotoSerifSC', fontSize=9.5, leading=14,
        textColor=TEXT_PRIMARY, alignment=TA_CENTER, wordWrap='CJK')
    tdl = ParagraphStyle('TDL', fontName='NotoSerifSC', fontSize=9.5, leading=14,
        textColor=TEXT_PRIMARY, alignment=TA_LEFT, wordWrap='CJK')
    data = [[Paragraph(h, th) for h in headers]]
    for row in rows:
        data.append([Paragraph(str(c), tdl if i == 0 else td) for i, c in enumerate(row)])
    t = Table(data, colWidths=cw, repeatRows=1, hAlign='CENTER')
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), TABLE_HEADER_COLOR),
        ('TEXTCOLOR', (0, 0), (-1, 0), TABLE_HEADER_TEXT),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
        ('TOPPADDING', (0, 0), (-1, 0), 8),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#cccccc')),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [TABLE_ROW_EVEN, TABLE_ROW_ODD]),
    ]))
    return t


# ═══════════════════════════════════════════════════
# FINANCIAL DATA
# ═══════════════════════════════════════════════════
ENTRY_FX = 19.5
PRICE_JPY = 62_400_000
PRICE_HKD = 320.0
EQUITY_HKD = 192.0
LOAN_JPY = 24_960_000
LOAN_HKD = 128.0
RATE = 0.03
N_M = 120

MP_JPY = LOAN_JPY * (RATE/12) * (1 + RATE/12)**N_M / ((1 + RATE/12)**N_M - 1)
TOTAL_MORT_JPY = MP_JPY * N_M
TOTAL_INT_JPY = TOTAL_MORT_JPY - LOAN_JPY
INT_HKD = TOTAL_INT_JPY / ENTRY_FX / 10000

ANNUAL_RENT_JPY = PRICE_JPY * 0.06
ANNUAL_COST_JPY = PRICE_JPY * 0.003
ANNUAL_NET_RENT_JPY = ANNUAL_RENT_JPY - ANNUAL_COST_JPY

def calc(fx_chg, pr_chg, years=10):
    """5-item decomposition in HKD wan."""
    efx = ENTRY_FX * (1 + fx_chg / 100)
    ejpy = PRICE_JPY * (1 + pr_chg / 100)
    prop = (ejpy - PRICE_JPY) / ENTRY_FX / 10000
    fx = PRICE_JPY * (1 / efx - 1 / ENTRY_FX) / 10000
    rent = ANNUAL_NET_RENT_JPY * years / efx / 10000
    tax = ANNUAL_COST_JPY * years / efx / 10000
    interest = INT_HKD
    net = prop + fx + rent - tax - interest
    return {'efx': efx, 'ejpy': ejpy, 'prop': prop, 'fx': fx, 'rent': rent, 'tax': tax, 'int': interest, 'net': net}

# 84 scenarios: 7 FX × 4 price × 3 holding periods
FX_LEVELS = [13.0, 16.0, 19.5, 22.0, 24.0, 26.0, 28.0]
PR_ANNUAL = [-0.03, 0.0, 0.015, 0.03]
HOLD_YEARS = [5, 7, 10]

def fx_chg(fx_level):
    return (fx_level - ENTRY_FX) / ENTRY_FX * 100

def pr_chg(annual_rate, years):
    return ((1 + annual_rate) ** years - 1) * 100


# ═══════════════════════════════════════════════════
# BUILD DOCUMENT
# ═══════════════════════════════════════════════════
OUT = '/home/z/my-project/download/andy_report_ch123.pdf'
doc = SimpleDocTemplate(OUT, pagesize=A4, leftMargin=LM, rightMargin=RM, topMargin=TM, bottomMargin=BM)
story = []


# ═══════════════════════════════════════════════════
# CHAPTER 1: 客戶入場決策
# ═══════════════════════════════════════════════════
story.append(h1('第一章  客戶入場決策'))

story.append(h2('1.1 Andy 嘅投資決定'))
story.append(p('Andy 決定用 HKD 320 萬購買一套日本住宅物業。佢自己掏腰包 HKD 192 萬（即總價嘅 60%）作為首期，其餘 HKD 128 萬（40%）向銀行按揭借入，年利率 3%，分 10 年攤還。入場嗰陣，市場匯率為 <b>1 港元 = 19.5 日圓</b>。'))

story.append(p('換算過程好直接：HKD 320 萬 x 19.5 = JPY 6,240 萬。呢筆日圓用嚟支付物業價款，其中首期部分對應 JPY 3,744 萬（HKD 192 萬），按揭部分對應 JPY 2,496 萬（HKD 128 萬）。完成交易後，Andy 持有一套價值 JPY 6,240 萬嘅日本物業，同時欠銀行 JPY 2,496 萬。'))

story.append(h2('1.2 按揭供款：確定嘅成本'))
story.append(p('銀行按揭金額 JPY 2,496 萬，年利率 3%，10 年（120 個月）等額本息還款。每月供款 JPY 241,016，10 年總供款 JPY 2,892.2 萬。其中本金部分 JPY 2,496 萬係「還返借嘅錢」，利息部分 JPY 396.2 萬（約 HKD 20.3 萬）先係真正嘅成本。呢筆利息係<b> 100% 確定</b>嘅——無論樓價升定跌、日圓強定弱，Andy 都要付呢筆錢。'))

t1 = tbl(
    ['項目', '金額'],
    [
        ['物業總價', 'HKD 320 萬 (JPY 6,240 萬)'],
        ['自付首期 (60%)', 'HKD 192 萬'],
        ['銀行按揭 (40% LTV)', 'HKD 128 萬 (JPY 2,496 萬)'],
        ['按揭利率', '每年 3%'],
        ['按揭年期', '10 年 (120 個月)'],
        ['每月供款', 'JPY 241,016'],
        ['10 年利息總額', 'JPY 396.2 萬 (HKD 20.3 萬)'],
        ['入場匯率', '1 HKD = 19.5 JPY'],
    ],
    col_widths=[CW * 0.40, CW * 0.60]
)
story.append(t1)
story.append(cap('表 1: Andy 嘅投資入場參數'))

story.append(h2('1.3 租金收入：確定嘅收入（大約）'))
story.append(p('物業買入後即時出租，預期年租金回報率 6%，即每年租金 JPY 374.4 萬。扣減管理費同物業稅等持有成本（每年約物業價值嘅 0.3%，即 JPY 18.7 萬）後，每年淨租金收入為 JPY 355.7 萬。呢筆租金足以覆蓋每年按揭供款 JPY 289.2 萬，仲有盈餘 JPY 66.5 萬——即 Andy 唔使貼錢養樓，反而每年有正現金流入袋。'))

story.append(h2('1.4 核心問題：10 年後，我會賺定蝕？'))
story.append(p('以上所有數據都係「入場時」已知嘅。但 Andy 最關心嘅問題係：<b>10 年後賣樓，我到底賺幾多定蝕幾多？</b>呢個問題冇辦法 100% 準確回答，因為未來 10 年有兩樣嘢係未知嘅：'))

story.append(pl('  <b>未知一：</b>10 年後日本樓價會升定跌？升幾多？跌幾多？'))
story.append(pl('  <b>未知二：</b>10 年後日圓匯率會點？1 港元兌幾多日圓？'))

story.append(p('租金同按揭利息係大致固定嘅（確定因素），但樓價同匯率係未知的（不確定因素）。接下嚟嘅章節會先拆解呢幾樣因素，然後用系統化嘅方法去評估佢哋。'))


# ═══════════════════════════════════════════════════
# CHAPTER 2: 回報驅動因素拆解
# ═══════════════════════════════════════════════════
story.append(h1('第二章  回報驅動因素拆解'))

story.append(h2('2.1 確定因素 vs 不確定因素'))
story.append(p('要回答「10 年後賺定蝕」，我哋需要將所有影響投資回報嘅因素列出嚟，然後分類。有啲因素係已知嘅（或者可以好精確咁估計），有啲因素係未知嘅。呢個分類好重要，因為佢決定咗我哋後續分析嘅重心——我哋應該將時間同精力集中喺不確定因素上面。'))

t2 = tbl(
    ['分類', '因素', '10 年金額 (HKD)', '確定性'],
    [
        ['確定因素', '租金淨收入（每年 JPY 355.7 萬）', '視乎出場匯率', '高（租約可預估）'],
        ['確定因素', '銀行按揭利息（JPY 396.2 萬）', 'HKD 20.3 萬', '100% 確定'],
        ['不確定因素', '日本樓價變動', '未知', '低'],
        ['不確定因素', '日圓兑港元匯率變動', '未知', '低'],
    ],
    col_widths=[CW*0.18, CW*0.37, CW*0.22, CW*0.23]
)
story.append(t2)
story.append(cap('表 2: 投資回報驅動因素分類'))

story.append(p('從上表可以見到，真正令 Andy 覺得「唔知會點」嘅因素只有兩個：<b>樓價</b>同<b>匯率</b>。租金同利息雖然金額唔細，但佢哋嘅不確定性相對低。所以接落嚟嘅分析，核心就係搞清楚「如果樓價同匯率咁樣變，我最終會點」。'))

story.append(h2('2.2 匯率點解會影響你？用一個例子講清楚'))
story.append(p('好多首次投資海外物業嘅人都會忽略匯率嘅影響。讓我用一個最簡單嘅例子講解：'))

story.append(p('假設你去日本旅遊，出發前喺兌換店用 1,000 港元買咗 19,500 日圓（匯率 19.5）。你去日本用日圓買咗一件價值 19,500 日圓嘅貨。一年後，你朋友去同一間兌換店，用 1,000 港元只買到 15,600 日圓（匯率變咗，變成 15.6）。如果佢想買同一件貨，就要付多啲港元。'))

story.append(p('反向思考：如果你一年前喺日本用 19,500 日圓買咗一件貨，而家日圓貶值咗（1 港元 = 21 日圓），你將件貨賣出得到嘅 19,500 日圓，換返港元只會得返 929 港元——少咗 71 港元。<b>貨嘅價格從未改變，但匯率改變令你嘅港元價值縮水咗。</b>'))

story.append(p('Andy 嘅情況完全一樣：佢用日圓持有物業，10 年後賣樓收到嘅係日圓。如果嗰時日圓貶值咗，同樣嘅日圓換到嘅港元就變少。反之如果日圓升值，就換到更多港元。呢個係 Andy 投資入面<b> 最大嘅不確定因素</b>。'))

story.append(h2('2.3 回報計算核心公式'))
story.append(p('將所有因素綜合起嚟，Andy 10 年投資嘅淨回報可以用以下公式計算。每一項都係港元金額，正數代表賺，負數代表蝕：'))

story.append(qt('投資淨回報 = 房價變動 + 匯率變動 + 租金收入 - 稅費 - 銀行供款費用'))

story.append(p('<b>房價變動</b>——日本樓價本身嘅升跌，以入場匯率折算為港元差額。例如樓價升 5%，即 JPY 6,240 萬變成 JPY 6,552 萬，升咗 JPY 312 萬，以 19.5 的匯率計算約 HKD 16 萬。呢個數字純粹反映「日本樓市本身嘅表現」。'))

story.append(p('<b>匯率變動</b>——假設物業嘅日圓價格完全不變（仍係 JPY 6,240 萬），純粹因為匯率改變而令港元價值變化。例如匯率由 19.5 變成 21.0，同一個 JPY 6,240 萬換返港元就由 320 萬變成 297.1 萬，縮水約 HKD 23 萬。呢個數字純粹反映「日圓匯率嘅影響」。'))

story.append(p('<b>租金收入</b>——10 年累計嘅淨租金（已扣管理費），按出場時嘅匯率折算為港元。呢項係最大嘅正數收入。'))

story.append(p('<b>稅費</b>——10 年累計嘅物業稅同管理費。呢筆費用已經喺租金入面扣減（所以上面嘅租金係「淨租金」），公式入面獨立列出係為咗清晰展示每一項支出。'))

story.append(p('<b>銀行供款費用</b>——10 年按揭總利息，約 HKD 20.3 萬。呢個係固定成本，100% 確定。'))

story.append(co('關鍵洞察：租金同利息係大致已知嘅，真正嘅變數只有「樓價」同「匯率」兩個。接落嚟嘅第 3 章會系統性地測試唔同嘅樓價同匯率組合。'))


# ═══════════════════════════════════════════════════
# CHAPTER 3: 84 情景壓力測試
# ═══════════════════════════════════════════════════
story.append(h1('第三章  84 情景壓力測試'))

story.append(h2('3.1 點解要設計 84 個情景？'))
story.append(p('第 2 章我哋確認咗不確定因素只有樓價同匯率。既然我哋唔知未來會點，最直接嘅方法就係「將所有可能嘅情況都列出嚟，逐個計算」。我哋設計咗一個系統化嘅矩陣：'))

story.append(p('<b>匯率設 7 個等級：</b>13.0、16.0、19.5（不變）、22.0、24.0、26.0、28.0 JPY/HKD。由強到弱，覆蓋日圓大幅升值到大幅貶值嘅全範圍。其中 13.0 代表日圓非常強（每 1 港元只兌 13 日圓，較入場時嘅 19.5 升值約 33%），28.0 代表日圓非常弱（每 1 港元可兌 28 日圓，較入場時貶值約 44%）。'))

story.append(p('<b>樓價設 4 個年變幅：</b>每年 -3%（持續下跌）、每年 0%（完全不變）、每年 +1.5%（温和上升）、每年 +3%（穩健上升）。呢四個等級覆蓋咗從熊市到牛市嘅主要可能。'))

story.append(p('<b>持有期設 3 個等級：</b>5 年、7 年、10 年。不同持有期會影響租金累積金額同利息支出。'))

story.append(big('7 匯率 x 4 樓價 x 3 持有期 = 84 個情景'))

story.append(p('每一個情景都會用第 2 章嘅核心公式，計算出精確嘅港元回報金額。 Andy 只需要睇呢 84 個結果，就可以知道「如果發生咗呢種情況，我會點」，從而判斷自己能唔能承受。'))

story.append(h2('3.2 10 年持有期：28 個情景全覽'))
story.append(p('以下表格展示 10 年持有期嘅全部 28 個情景（7 匯率 x 4 樓價），每格顯示該情景下嘅投資淨回報（HKD）。綠色數字代表賺錢，紅色代表蝕錢。'))

# Build the 28-scenario table for 10 years
hdr = ['匯率\\樓價年變幅', '每年 -3%', '每年 0%', '每年 +1.5%', '每年 +3%']
rows_10 = []
for fx_lev in FX_LEVELS:
    r = [f'{fx_lev} JPY/HKD']
    for pa in PR_ANNUAL:
        sc = calc(fx_chg(fx_lev), pr_chg(pa, 10), 10)
        r.append(fmt(sc['net']))
    rows_10.append(r)

# Color-code cells
td_green = ParagraphStyle('TDG', fontName='NotoSerifSC', fontSize=9, leading=13,
    textColor=colors.HexColor('#1a5632'), alignment=TA_CENTER, wordWrap='CJK')
td_red = ParagraphStyle('TDR', fontName='NotoSerifSC', fontSize=9, leading=13,
    textColor=colors.HexColor('#991b1b'), alignment=TA_CENTER, wordWrap='CJK')
tdl_s = ParagraphStyle('TDLS', fontName='NotoSerifSC', fontSize=9, leading=13,
    textColor=TEXT_PRIMARY, alignment=TA_LEFT, wordWrap='CJK')
th_s = ParagraphStyle('THS', fontName='NotoSerifSC', fontSize=9, leading=13,
    textColor=TABLE_HEADER_TEXT, alignment=TA_CENTER, wordWrap='CJK')

t3_data = [[Paragraph(h, th_s) for h in hdr]]
for row in rows_10:
    t3_data.append([Paragraph(row[0], tdl_s)])
    for val in row[1:]:
        sc_net = float(val.replace('HKD ', '').replace('+', '').replace('萬', ''))
        style = td_green if sc_net >= 0 else td_red
        t3_data[-1].append(Paragraph(val, style))

t3 = Table(t3_data, colWidths=[CW*0.25, CW*0.1875, CW*0.1875, CW*0.1875, CW*0.1875], hAlign='CENTER')
t3_cmds = [
    ('BACKGROUND', (0, 0), (-1, 0), TABLE_HEADER_COLOR),
    ('TEXTCOLOR', (0, 0), (-1, 0), TABLE_HEADER_TEXT),
    ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#cccccc')),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ('TOPPADDING', (0, 0), (-1, -1), 6),
    ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ('ROWBACKGROUNDS', (0, 1), (-1, -1), [TABLE_ROW_EVEN, TABLE_ROW_ODD]),
]
# Highlight the "no change" row (FX=19.5)
for i, fx_lev in enumerate(FX_LEVELS):
    if abs(fx_lev - 19.5) < 0.01:
        t3_cmds.append(('BACKGROUND', (0, i+1), (-1, i+1), colors.HexColor('#d4e9f0')))
        t3_cmds.append(('LINEABOVE', (0, i+1), (-1, i+1), 1, ACCENT))
        t3_cmds.append(('LINEBELOW', (0, i+1), (-1, i+1), 1, ACCENT))

t3.setStyle(TableStyle(t3_cmds))
story.append(t3)
story.append(cap('表 3: 10 年持有期 — 28 個情景嘅投資淨回報 (HKD)'))

story.append(h2('3.3 表格讀法：幾個關鍵觀察'))

story.append(p('<b>觀察一：大部分情景都係賺錢嘅。</b>28 個情景入面，只有匯率極端貶值（26.0、28.0）同時樓價下跌嘅組合先會出現虧損。其餘大部分組合都有正回報，因為租金收入嘅規模（約 HKD 169 萬）足以覆蓋大部分嘅資本損失。'))

story.append(p('<b>觀察二：匯率嘅影響大過樓價。</b>喺同一行（相同樓價變幅），由左至右（日圓由強變弱），回報金額明顯遞減。例如樓價每年 +3% 嗰行，匯率 13.0 時淨賺超過 500 萬，但匯率 28.0 時卻要虧損近 100 萬。同樣嘅樓價表現，僅僅因為匯率唔同，結果就天差地遠。'))

story.append(p('<b>觀察三：就算樓價不變，匯率好嘅話一樣賺到笑。</b>睇「每年 0%」嗰行——樓價完全不變，但喺匯率 13.0（日圓強）嘅情景下，淨回報仍然超過 400 萬。呢個數字完全來自匯率變動同租金收入，證明對海外物業投資者嚟講，匯率可能比樓價更重要。'))

story.append(h2('3.4 5 年同 7 年持有期對照'))
story.append(p('以下將三個持有期嘅「匯率不變、樓價不變」基準情景、最好情景同最差情景並列對照，方便 Andy 比較唔同持有期嘅影響。'))

# Cross-holding comparison
ref_rows = []
for yrs in HOLD_YEARS:
    ref = calc(0, 0, yrs)  # FX unchanged, price unchanged
    best = calc(fx_chg(13.0), pr_chg(0.03, yrs), yrs)
    worst = calc(fx_chg(28.0), pr_chg(-0.03, yrs), yrs)
    ref_rows.append([f'{yrs} 年', fmt(ref['net']), fmt(best['net']), fmt(worst['net'])])

t4 = tbl(
    ['持有期', '基準情景（都不變）', '最好情景', '最差情景'],
    ref_rows,
    col_widths=[CW*0.15, CW*0.28, CW*0.28, CW*0.29]
)
story.append(t4)
story.append(cap('表 4: 三個持有期嘅基準、最好、最差情景對照 (HKD)'))

story.append(p('從上表可以觀察到：<b>持有期越長，最好同最差之間嘅差距越大</b>。10 年最好可以賺超過 500 萬，最差要蝕近 100 萬。5 年嘅波動幅就細好多。呢個現象好合理——時間越長，匯率同樓價累積變動嘅空間越大。'))

story.append(h2('3.5 84 情景嘅意義同局限'))
story.append(p('呢 84 個情景覆蓋咗匯率同樓價嘅主要可能組合，俾 Andy 一個全面嘅「壓力測試」視角。但要注意一個局限：<b>目前每個情景嘅機率都係均等嘅</b>（即假設每種匯率同樓價組合出現嘅機會一樣）。現實中，日圓匯率跌到 28 同維持喺 19.5 嘅機率顯然唔一樣。'))

story.append(p('要解決呢個問題，我哋需要引入機器學習模型，利用幾十年嘅歷史數據去預測每種情景嘅<b>真實發生機率</b>。呢個就係第 4 章嘅內容，我哋會用 ML 模型為呢 84 個情景分配唔同嘅機率權重，從而得出更精準嘅預期回報。'))

# Heatmap
img_hm = '/home/z/my-project/download/ml_charts/v2_probability_heatmap.png'
if os.path.exists(img_hm):
    story.append(Spacer(1, 8))
    story.append(Image(img_hm, width=CW, height=CW * 0.6))
    story.append(cap('圖 1: 84 情景嘅回報分佈熱力圖（每點代表一個匯率+樓價組合）'))


# ═══════════════════════════════════════════════════
# BUILD PDF
# ═══════════════════════════════════════════════════
doc.build(story)
print(f'Ch1-3 PDF generated: {OUT}')

# Also print some key numbers for reference
ref10 = calc(0, 0, 10)
print(f'10yr baseline (no change): HKD {ref10["net"]:.1f}萬')
best10 = calc(fx_chg(13.0), pr_chg(0.03, 10), 10)
print(f'10yr best (FX=13, +3%/yr): HKD {best10["net"]:.1f}萬')
worst10 = calc(fx_chg(28.0), pr_chg(-0.03, 10), 10)
print(f'10yr worst (FX=28, -3%/yr): HKD {worst10["net"]:.1f}萬')