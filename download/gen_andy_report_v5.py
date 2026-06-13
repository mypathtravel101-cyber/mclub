#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Andy Japan Property ML V2 Report - V5 (Novice-Friendly Rewrite)
   Audience: Andy, investment novice
   Tone: Conversational, plain language, analogy-driven
   Structure: Conclusion-first, then explain WHY
   Summary formula: 房價變動 + 匯率變動 + 租金收入 - 稅費 - 銀行供款費用 (all HKD)
"""

import os

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import cm, mm
from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY, TA_RIGHT
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    Image, KeepTogether, HRFlowable
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
registerFontFamily('NotoSerifSC', normal='NotoSerifSC', bold='NotoSerifSCBold')

# ═══════════════════════════════════════════════════
# COLOR PALETTE
# ═══════════════════════════════════════════════════
ACCENT = colors.HexColor('#1f7692')
TEXT_PRIMARY = colors.HexColor('#1b1a18')
TEXT_MUTED = colors.HexColor('#7a766f')
BG_SURFACE = colors.HexColor('#e5e3df')
TABLE_HEADER_COLOR = ACCENT
TABLE_HEADER_TEXT = colors.white
TABLE_ROW_EVEN = colors.white
TABLE_ROW_ODD = BG_SURFACE

# ═══════════════════════════════════════════════════
# STYLES
# ═══════════════════════════════════════════════════
W, H = A4
LM, RM, TM, BM = 2.2*cm, 2.2*cm, 2.5*cm, 2.5*cm
CW = W - LM - RM

def make_styles():
    s = {}
    s['h1'] = ParagraphStyle('H1', fontName='NotoSerifSC', fontSize=20, leading=28,
        textColor=TEXT_PRIMARY, spaceBefore=20, spaceAfter=10, alignment=TA_LEFT)
    s['h2'] = ParagraphStyle('H2', fontName='NotoSerifSC', fontSize=14, leading=21,
        textColor=ACCENT, spaceBefore=16, spaceAfter=8, alignment=TA_LEFT)
    s['h3'] = ParagraphStyle('H3', fontName='NotoSerifSC', fontSize=12, leading=18,
        textColor=TEXT_PRIMARY, spaceBefore=10, spaceAfter=6, alignment=TA_LEFT)
    s['body'] = ParagraphStyle('Body', fontName='NotoSerifSC', fontSize=10.5, leading=18,
        textColor=TEXT_PRIMARY, spaceBefore=3, spaceAfter=6, alignment=TA_JUSTIFY, wordWrap='CJK')
    s['body_left'] = ParagraphStyle('BodyL', fontName='NotoSerifSC', fontSize=10.5, leading=18,
        textColor=TEXT_PRIMARY, spaceBefore=3, spaceAfter=6, alignment=TA_LEFT, wordWrap='CJK')
    s['caption'] = ParagraphStyle('Cap', fontName='NotoSerifSC', fontSize=9, leading=14,
        textColor=TEXT_MUTED, spaceBefore=4, spaceAfter=8, alignment=TA_CENTER, wordWrap='CJK')
    s['callout'] = ParagraphStyle('Callout', fontName='NotoSerifSC', fontSize=11, leading=18,
        textColor=ACCENT, spaceBefore=6, spaceAfter=6, alignment=TA_LEFT, wordWrap='CJK',
        leftIndent=12, borderColor=ACCENT, borderWidth=2, borderPadding=8)
    s['big_num'] = ParagraphStyle('BigNum', fontName='NotoSerifSCBold', fontSize=28, leading=36,
        textColor=ACCENT, spaceBefore=8, spaceAfter=4, alignment=TA_CENTER, wordWrap='CJK')
    s['small'] = ParagraphStyle('Small', fontName='NotoSerifSC', fontSize=9, leading=14,
        textColor=TEXT_MUTED, spaceBefore=2, spaceAfter=4, alignment=TA_LEFT, wordWrap='CJK')
    s['q_title'] = ParagraphStyle('QTitle', fontName='NotoSerifSC', fontSize=12, leading=18,
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
def big_num(t): return Paragraph(t, STY['big_num'])
def q_title(t): return Paragraph(f'<b>{t}</b>', STY['q_title'])
def small(t): return Paragraph(t, STY['small'])

def fmt(val, prefix='HKD '):
    if val >= 0:
        return f'{prefix}+{val:.1f}萬'
    else:
        return f'{prefix}{val:.1f}萬'

def make_table(headers, rows, col_widths=None):
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

def make_summary_table(rows, col_widths=None):
    """Special summary table with highlighted last row."""
    cw = col_widths or [CW * 0.24, CW * 0.24, CW * 0.52]
    th = ParagraphStyle('TH', fontName='NotoSerifSC', fontSize=10, leading=15,
        textColor=TABLE_HEADER_TEXT, alignment=TA_CENTER, wordWrap='CJK')
    td = ParagraphStyle('TD', fontName='NotoSerifSC', fontSize=10, leading=15,
        textColor=TEXT_PRIMARY, alignment=TA_CENTER, wordWrap='CJK')
    tdl = ParagraphStyle('TDL', fontName='NotoSerifSC', fontSize=10, leading=15,
        textColor=TEXT_PRIMARY, alignment=TA_LEFT, wordWrap='CJK')
    tdb = ParagraphStyle('TDB', fontName='NotoSerifSCBold', fontSize=10.5, leading=15,
        textColor=ACCENT, alignment=TA_CENTER, wordWrap='CJK')
    tdbl = ParagraphStyle('TDBL', fontName='NotoSerifSCBold', fontSize=10.5, leading=15,
        textColor=ACCENT, alignment=TA_LEFT, wordWrap='CJK')

    data = [[Paragraph(h, th) for h in ['項目', '金額 (HKD)', '白話解釋']]]
    for i, (label, amount, explain) in enumerate(rows):
        is_last = (i == len(rows) - 1)
        if is_last:
            data.append([Paragraph(label, tdbl), Paragraph(amount, tdb), Paragraph(explain, tdl)])
        else:
            data.append([Paragraph(label, tdl), Paragraph(amount, td), Paragraph(explain, tdl)])

    t = Table(data, colWidths=cw, hAlign='CENTER')
    cmds = [
        ('BACKGROUND', (0, 0), (-1, 0), TABLE_HEADER_COLOR),
        ('TEXTCOLOR', (0, 0), (-1, 0), TABLE_HEADER_TEXT),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#cccccc')),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('BACKGROUND', (0, -1), (-1, -1), colors.HexColor('#d4e9f0')),
        ('LINEABOVE', (0, -1), (-1, -1), 1.5, ACCENT),
    ]
    if len(rows) > 2:
        cmds.append(('ROWBACKGROUNDS', (0, 1), (-1, -2), [TABLE_ROW_EVEN, TABLE_ROW_ODD]))
    t.setStyle(TableStyle(cmds))
    return t


# ═══════════════════════════════════════════════════
# FINANCIAL DATA
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
INTEREST_HKD_WAN = TOTAL_INTEREST_JPY / ENTRY_FX / 10000

ANNUAL_RENT_JPY = PRICE_JPY * 0.06
ANNUAL_COST_JPY = PRICE_JPY * 0.003
ANNUAL_NET_RENT_JPY = ANNUAL_RENT_JPY - ANNUAL_COST_JPY

FX_BLENDED_10 = 7.8
PR_BLENDED_10 = 5.0

def calc_full(fx_chg_pct, pr_chg_pct, years=10):
    exit_fx = ENTRY_FX * (1 + fx_chg_pct / 100)
    exit_jpy = PRICE_JPY * (1 + pr_chg_pct / 100)
    prop_wan = (exit_jpy - PRICE_JPY) / ENTRY_FX / 10000
    fx_wan = PRICE_JPY * (1 / exit_fx - 1 / ENTRY_FX) / 10000
    total_net_rent_jpy = ANNUAL_NET_RENT_JPY * years
    rent_wan = total_net_rent_jpy / exit_fx / 10000
    total_tax_jpy = ANNUAL_COST_JPY * years
    tax_wan = total_tax_jpy / exit_fx / 10000
    interest_wan = INTEREST_HKD_WAN
    net = prop_wan + fx_wan + rent_wan - tax_wan - interest_wan
    return {
        'exit_fx': exit_fx, 'exit_jpy': exit_jpy,
        'prop_wan': prop_wan, 'fx_wan': fx_wan,
        'rent_wan': rent_wan, 'tax_wan': tax_wan,
        'interest_wan': interest_wan, 'net_wan': net,
    }

ml_10 = calc_full(FX_BLENDED_10, PR_BLENDED_10, 10)
best_10 = calc_full((13.0 - 19.5) / 19.5 * 100, (1.03**10 - 1) * 100, 10)
worst_10 = calc_full((28.0 - 19.5) / 19.5 * 100, -30, 10)
ml_5 = calc_full(FX_BLENDED_10 * 5/10, PR_BLENDED_10 * 5/10, 5)
ml_7 = calc_full(FX_BLENDED_10 * 7/10, PR_BLENDED_10 * 7/10, 7)


# ═══════════════════════════════════════════════════
# BUILD DOCUMENT
# ═══════════════════════════════════════════════════
OUT = '/home/z/my-project/download/andy_report_body_v5.pdf'
CHART_DIR = '/home/z/my-project/download/ml_charts'
ARCH_PNG = '/home/z/my-project/download/model_architecture.png'

doc = SimpleDocTemplate(OUT, pagesize=A4,
    leftMargin=LM, rightMargin=RM, topMargin=TM, bottomMargin=BM)

story = []

# ═══════════════════════════════════════════════════
# CHAPTER 1: 一句話結論（寫喺最前面）
# ═══════════════════════════════════════════════════
story.append(h1('一、Andy，呢份報告同你有咩關係？'))

story.append(p('你考慮用 HKD 192 萬首期，買一套日本物業，總價 HKD 320 萬（其餘 HKD 128 萬向銀行借，利率 3%，分 10 年還）。你最大嘅疑問應該係：<b>10 年之後，我嘅 192 萬會變成幾多？</b>'))

story.append(p('呢份報告用咗一個電腦預測模型（機器學習），分析咗幾十年嘅日本樓價同匯率數據，去估計 10 年後最可能發生嘅情況。以下係結果嘅核心數字。'))

story.append(h2('1.1 最可能嘅結果（機器預測）'))
story.append(p('根據模型預測，如果你持有呢套物業 10 年，你嘅投資回報可以拆成五個部分：'))

story.append(q_title('投資淨回報 = 房價變動 + 匯率變動 + 租金收入 - 稅費 - 銀行供款費用'))

story.append(make_summary_table([
    ('房價變動', fmt(ml_10['prop_wan']),
     '日本樓價預計升 5%，賺約 16 萬'),
    ('匯率變動', fmt(ml_10['fx_wan']),
     '日圓預計貶值 7.8%，蝕約 23 萬'),
    ('租金收入', fmt(ml_10['rent_wan']),
     '10 年收到嘅淨租金，扣管理費後'),
    ('稅費', fmt(-ml_10['tax_wan']),
     '10 年物業稅同管理費合計'),
    ('銀行供款費用', fmt(-ml_10['interest_wan']),
     '10 年按揭利息總額'),
    ('投資淨回報', fmt(ml_10['net_wan']),
     '以上全部加埋，就係你淨賺幾多'),
]))
story.append(cap('表 1: ML 預測 10 年投資回報五項分解'))

story.append(big_num(f'最可能結果：10 年後淨賺 HKD {ml_10["net_wan"]:.1f} 萬'))
story.append(p(f'你嘅 192 萬首期，10 年後預計變成約 <b>HKD {EQUITY_HKD_WAN + ml_10["net_wan"]:.1f} 萬</b>。'))

story.append(h2('1.2 最好同最差嘅情況'))
story.append(p('當然，未來唔可以 100% 準確預測。以下係如果市場向好或者向差時嘅結果：'))

t_range = make_table(
    ['情景', '投資淨回報', '192 萬變成'],
    [
        ['最可能', fmt(ml_10['net_wan']), f'HKD {EQUITY_HKD_WAN + ml_10["net_wan"]:.1f} 萬'],
        ['最好（日圓升值 + 樓價升）', fmt(best_10['net_wan']), f'HKD {EQUITY_HKD_WAN + best_10["net_wan"]:.1f} 萬'],
        ['最差（日圓貶值 + 樓價跌）', fmt(worst_10['net_wan']), f'HKD {EQUITY_HKD_WAN + worst_10["net_wan"]:.1f} 萬'],
    ],
    col_widths=[CW*0.38, CW*0.28, CW*0.34]
)
story.append(t_range)
story.append(cap('表 2: 三種情景下嘅投資結果'))

story.append(p('最好情況下，你嘅 192 萬可以變成超過 700 萬；最差情況下，可能得返唔夠 100 萬。差距咁大，係因為<b>匯率</b>呢個最大嘅不確定因素。之後嘅章節會用最簡單嘅語言，逐樣解釋俾你聽。'))


# ═══════════════════════════════════════════════════
# CHAPTER 2: 你的投資點樣運作
# ═══════════════════════════════════════════════════
story.append(h1('二、你的投資點樣運作？'))

story.append(h2('2.1 第一步：換錢買樓'))
story.append(p('你用港元買日本物業，過程好簡單但好重要：你將港元換成日圓，然後用日圓買樓。入場嗰陣，匯率係 <b>1 港元 = 19.5 日圓</b>。即係話，你嘅 HKD 320 萬可以換到 6,240 萬日圓（320 萬 x 19.5 = 6,240 萬），用嚟買呢套物業。'))

story.append(p('你嘅 320 萬入面，192 萬係你自己嘅錢（首期），128 萬係向銀行借嘅（按揭）。銀行按揭年利率 3%，分 10 年（120 個月）每月定額還款。每月要還 JPY 241,016（約 HKD 12,360），10 年總共還 JPY 2,892.2 萬，其中本金 2,496 萬，利息 396.2 萬（約 HKD 20.3 萬）。'))

story.append(h2('2.2 第二步：收租還銀行'))
story.append(p('物業買咗之後，你會將佢租出去。預期年租金回報率係 6%，即每年收租 JPY 374.4 萬（約 HKD 19.2 萬）。扣減管理費同物業稅之後（每年約 JPY 18.7 萬），每年淨收租 JPY 355.7 萬。'))

story.append(p('租金收入要優先用嚟還銀行按揭。每年按揭供款約 JPY 289.2 萬，扣減之後，你每年仲有約 JPY 66.5 萬嘅正現金流（即租金收入大過供款，你唔使貼錢養樓）。呢一點好重要——代表呢個投資喺現金流層面係自給自足嘅。'))

story.append(h2('2.3 第三步：10 年後賣樓換返港紙'))
story.append(p('呢步係最關鍵、亦係最大風險所在。10 年後你賣樓，收到嘅係<b>日圓</b>，但你要將日圓換返<b>港元</b>先算數。如果嗰陣匯率變咗，同樣嘅日圓金額，換到嘅港元就會唔同。'))

story.append(p('舉個簡單例子：假設你而家有 19,500 日圓，按入場匯率（1 港元 = 19.5 日圓）可以換到 1,000 港元。但如果 10 年後日圓貶值咗，變成 1 港元 = 21 日圓，咁同樣 19,500 日圓就只可以換到 929 港元。你乜嘢都冇做錯，但就少咗 71 港元——呢個就係<b>匯率風險</b>。'))

story.append(p('反過嚟講，如果日圓升值咗（例如 1 港元 = 16 日圓），19,500 日圓就可以換到 1,219 港元，你無端白淨賺多 219 港元。所以<b>匯率變動可以令你賺多啲，亦可以令你蝕多啲</b>，完全獨立於物業本身嘅價格升跌。'))


# ═══════════════════════════════════════════════════
# CHAPTER 3: 你的錢從邊度嚟、花喺邊度
# ═══════════════════════════════════════════════════
story.append(h1('三、你的錢從邊度嚟、花喺邊度？'))

story.append(p('呢章會將你 10 年投資嘅每一筆收入同支出，逐樣拆開嚟講。最後將所有項目加埋，就係你嘅投資淨回報。計算公式好簡單：'))

story.append(q_title('淨回報 = 房價變動 + 匯率變動 + 租金收入 - 稅費 - 銀行供款費用'))

story.append(h2('3.1 房價變動：日本樓市本身嘅升跌'))
story.append(p(f'呢項係最直接嘅——如果日本樓價升，你嘅物業就值更多錢；如果跌，就值少啲。機器學習模型預測，未來 10 年日本住宅物業價格會温和上升約 5%，即物業由 JPY 6,240 萬升至約 JPY 6,552 萬。以入場匯率計算，呢個升幅折合約 <b>HKD {ml_10["prop_wan"]:.1f} 萬</b>。'))

story.append(p('不過要注意，呢度只係計算咗「日本樓價本身升咗幾多」，仲未計匯率影響。你可以想像成：你喺日本有個資產升值咗 5%，但呢個升值係用日圓計嘅，最終要轉返港元先算數。'))

story.append(h2('3.2 匯率變動：日圓匯率對你嘅影響'))
story.append(p(f'呢項係好多初次投資海外物業嘅人最容易忽視嘅風險。模型預測未來 10 年日圓會貶值約 7.8%，即由 1 港元 = 19.5 日圓，變成 1 港元 = 21.0 日圓。日圓貶值代表「日圓唔值錢咗」，同樣嘅日圓資產換返港元會變少。'))

story.append(p(f'對你嘅實際影響係：<b>HKD {ml_10["fx_wan"]:.1f} 萬</b>嘅虧損。即係話，即使物業嘅日圓價格完全冇變，單純因為日圓貶值，你嘅物業以港元計就已經縮水咗呢個數。呢個數字甚至大過房價升幅（+16.0 萬），所以兩者加埋，單睇物業資本價值嘅話，你其實係微跌嘅。'))

story.append(callout('重點：對海外物業投資者嚟講，匯率風險往往大過物業本身嘅價格風險。'))

story.append(h2('3.3 租金收入：你最大嘅利潤來源'))
story.append(p(f'呢項係呢個投資最大嘅利潤來源。10 年入面，你每年收租扣減管理費後淨收 JPY 355.7 萬。按出場匯率（21.0 JPY/HKD）折算，10 年租金總收入折合約 <b>HKD {ml_10["rent_wan"]:.1f} 萬</b>。'))

story.append(p(f'呢個數字遠超過房價變動（+{ml_10["prop_wan"]:.1f} 萬）同匯率變動（{ml_10["fx_wan"]:.1f} 萬）嘅影響。換言之，<b>你嘅利潤主要係嚟自收租，而唔係嚟自物業升值</b>。即使物業資本價值因匯率而微跌，租金收入嘅規模足以覆蓋所有損失而有盈餘。呢一點係決定呢個投資值唔值得做嘅核心因素。'))

story.append(h2('3.4 稅費同管理費'))
story.append(p(f'持有物業期間，每年需要支付物業稅同管理費，合計約物業價值嘅 0.3%，即每年 JPY 18.7 萬。10 年合計 JPY 187 萬，按出場匯率折合約 <b>HKD {ml_10["tax_wan"]:.1f} 萬</b>。呢筆費用已經喺上面嘅租金收入入面扣減（所以我哋講嘅租金係「淨租金」），但喺公式入面獨立列出，係為咗清晰展示每一項支出。'))

story.append(h2('3.5 銀行供款費用（按揭利息）'))
story.append(p(f'你向銀行借咗 HKD 128 萬（JPY 2,496 萬），年利率 3%，10 年等額本息還款。10 年總共還咗 JPY 2,892.2 萬，其中本金 2,496 萬係「還返你自己借嘅錢」，真正嘅成本係利息部分：JPY 396.2 萬，折合約 <b>HKD {ml_10["interest_wan"]:.1f} 萬</b>。'))

story.append(p('呢筆利息係固定嘅——無論樓價升定跌、日圓強定弱，你都實實在在要俾呢筆錢畀銀行。所以呢個係一個確定嘅成本，唔涉及任何預測不確定性。'))


# ═══════════════════════════════════════════════════
# CHAPTER 4: 機器預測點樣運作（簡單版）
# ═══════════════════════════════════════════════════
story.append(h1('四、呢啲數字點樣嚟嘅？'))

story.append(h2('4.1 乜嘢係機器學習預測？'))
story.append(p('你可能會問：點解唔係人去預測，而係用電腦？原因好簡單：我哋用嘅係美國聯邦儲備銀行嘅真實歷史數據，包括超過 50 年嘅日元匯率同日本樓價紀錄。人腦冇辦法同時分析幾千個數據點之間嘅複雜關係，但電腦可以。'))

story.append(p('具體嚟講，我哋用咗四種機器學習方法（XGBoost、LightGBM、Random Forest、Gradient Boosting），就好似請咗四位專家，每位用自己嘅方法去分析數據，然後將四位專家嘅預測結果加權平均（預測越準確嘅專家，佢嘅意見佔越重嘅比重）。呢個方法比單獨依賴任何一位專家都要穩定。'))

story.append(h2('4.2 數據來源'))
story.append(p('所有數據均來自 FRED（美國聯邦儲備銀行數據庫），呢個係全球最權威嘅經濟數據來源之一。具體包括：日元兌美元匯率（1971 年至今，665 個月度數據點）、日本住宅價格指數（1955 年至今，284 個季度數據點）、美國同日本嘅利率數據。經過處理後，最終用咗 104 個有效訓練樣本。'))

story.append(h2('4.3 機率模擬：唔只一個答案'))
story.append(p('現實世界唔係只得一種可能。所以我哋用咗「Monte Carlo 模擬」方法，用電腦隨機生成 10,000 個唔同嘅未來情景，計算每個情景下嘅投資回報。然後用統計方法分析呢 10,000 個結果嘅分佈，得出「最可能」、「最好」、「最差」等情景。你可以將呢個過程想像成玩 10,000 次模擬遊戲，睇吓平均落嚟會點。'))

img_arch = ARCH_PNG
if os.path.exists(img_arch):
    story.append(Spacer(1, 8))
    story.append(Image(img_arch, width=CW, height=CW * 0.45))
    story.append(cap('圖 1: 整個預測分析嘅六個步驟'))

img_mc = os.path.join(CHART_DIR, 'v2_model_comparison.png')
if os.path.exists(img_mc):
    story.append(Spacer(1, 8))
    story.append(Image(img_mc, width=CW, height=CW * 5 / 14))
    story.append(cap('圖 2: 四種預測模型嘅準確度比較（數字越低越準）'))


# ═══════════════════════════════════════════════════
# CHAPTER 5: 如果市場變化呢？
# ═══════════════════════════════════════════════════
story.append(h1('五、如果市場變化呢？'))

story.append(p('第一章俾咗你「最可能」嘅結果，但現實往往唔跟預測走。呢章會展示幾個唔同嘅情景，睇吓喺唔同嘅市場環境下，你嘅投資會點。'))

story.append(h2('5.1 最好情景：日圓升值 + 樓價上升'))
story.append(p(f'如果未來 10 年日圓大幅升值（由 19.5 升到 13 JPY/HKD），同時日本樓價每年上升 3%，咁就係最好嘅情況。日圓升值代表你嘅日圓資產換返港元會變多，再加上樓價本身都升咗，兩個利好因素疊加。'))

story.append(make_summary_table([
    ('房價變動', fmt(best_10['prop_wan']),
     '樓價每年 +3%，10 年累計升幅'),
    ('匯率變動', fmt(best_10['fx_wan']),
     '日圓大幅升值，換返港紙賺大錢'),
    ('租金收入', fmt(best_10['rent_wan']),
     '日圓強，租金折算港元更多'),
    ('稅費', fmt(-best_10['tax_wan']),
     '物業稅同管理費'),
    ('銀行供款費用', fmt(-best_10['interest_wan']),
     '按揭利息（固定成本）'),
    ('投資淨回報', fmt(best_10['net_wan']),
     '首期 192 萬變成超過 700 萬'),
]))

story.append(h2('5.2 最差情景：日圓貶值 + 樓價下跌'))
story.append(p(f'如果日圓大幅貶值（由 19.5 跌到 28 JPY/HKD），同時樓價每年下跌 3%，就係最差嘅情況。日圓貶值令你嘅資產換返港元大幅縮水，樓價下跌更加劇。不過即使係呢個極端情況，租金收入仍然提供咗一定嘅緩衝作用。'))

story.append(make_summary_table([
    ('房價變動', fmt(worst_10['prop_wan']),
     '樓價每年 -3%，10 年累計跌幅'),
    ('匯率變動', fmt(worst_10['fx_wan']),
     '日圓大幅貶值，匯率損失嚴重'),
    ('租金收入', fmt(worst_10['rent_wan']),
     '日圓弱，租金折算港元變少，但仍有收入'),
    ('稅費', fmt(-worst_10['tax_wan']),
     '物業稅同管理費'),
    ('銀行供款費用', fmt(-worst_10['interest_wan']),
     '按揭利息（固定成本）'),
    ('投資淨回報', fmt(worst_10['net_wan']),
     '192 萬跌到唔夢 100 萬'),
]))

story.append(h2('5.3 情景對照總覽'))
story.append(p('下表將幾個關鍵情景嘅五項回報並列對照，方便你直接比較唔同市場環境下嘅差異。你可以清楚睇到，<b>租金收入喺所有情景下都係最大嘅正數項目</b>，而匯率變動則係變化最大嘅項目。'))

comp_rows = [
    ['房價變動', fmt(ml_10['prop_wan']), fmt(best_10['prop_wan']), fmt(worst_10['prop_wan'])],
    ['匯率變動', fmt(ml_10['fx_wan']), fmt(best_10['fx_wan']), fmt(worst_10['fx_wan'])],
    ['租金收入', fmt(ml_10['rent_wan']), fmt(best_10['rent_wan']), fmt(worst_10['rent_wan'])],
    ['稅費', fmt(-ml_10['tax_wan']), fmt(-best_10['tax_wan']), fmt(-worst_10['tax_wan'])],
    ['銀行供款費用', fmt(-ml_10['interest_wan']), fmt(-best_10['interest_wan']), fmt(-worst_10['interest_wan'])],
    ['投資淨回報', fmt(ml_10['net_wan']), fmt(best_10['net_wan']), fmt(worst_10['net_wan'])],
]
th_s = ParagraphStyle('THS', fontName='NotoSerifSC', fontSize=9.5, leading=14,
    textColor=TABLE_HEADER_TEXT, alignment=TA_CENTER, wordWrap='CJK')
td_s = ParagraphStyle('TDS', fontName='NotoSerifSC', fontSize=9.5, leading=14,
    textColor=TEXT_PRIMARY, alignment=TA_CENTER, wordWrap='CJK')
tdl_s = ParagraphStyle('TDLS', fontName='NotoSerifSC', fontSize=9.5, leading=14,
    textColor=TEXT_PRIMARY, alignment=TA_LEFT, wordWrap='CJK')
tdb_s = ParagraphStyle('TDBS', fontName='NotoSerifSCBold', fontSize=10, leading=14,
    textColor=ACCENT, alignment=TA_CENTER, wordWrap='CJK')
tdbl_s = ParagraphStyle('TDBLS', fontName='NotoSerifSCBold', fontSize=10, leading=14,
    textColor=ACCENT, alignment=TA_LEFT, wordWrap='CJK')

comp_data = [[Paragraph(h, th_s) for h in ['項目', '最可能', '最好', '最差']]]
for i, row in enumerate(comp_rows):
    is_last = (i == len(comp_rows) - 1)
    if is_last:
        comp_data.append([Paragraph(row[0], tdbl_s)] + [Paragraph(c, tdb_s) for c in row[1:]])
    else:
        comp_data.append([Paragraph(row[0], tdl_s)] + [Paragraph(c, td_s) for c in row[1:]])

t_comp = Table(comp_data, colWidths=[CW*0.24, CW*0.25, CW*0.25, CW*0.26], hAlign='CENTER')
t_comp.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), TABLE_HEADER_COLOR),
    ('TEXTCOLOR', (0, 0), (-1, 0), TABLE_HEADER_TEXT),
    ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#cccccc')),
    ('ROWBACKGROUNDS', (0, 1), (-1, -2), [TABLE_ROW_EVEN, TABLE_ROW_ODD]),
    ('BACKGROUND', (0, -1), (-1, -1), colors.HexColor('#d4e9f0')),
    ('LINEABOVE', (0, -1), (-1, -1), 1.5, ACCENT),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
    ('TOPPADDING', (0, 0), (-1, -1), 8),
    ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
]))
story.append(t_comp)
story.append(cap('表 3: 三種情景投資回報五項分解對照 (HKD)'))

# Heatmap
img_hm = os.path.join(CHART_DIR, 'v2_probability_heatmap.png')
if os.path.exists(img_hm):
    story.append(Spacer(1, 8))
    story.append(Image(img_hm, width=CW, height=CW * 0.6))
    story.append(cap('圖 3: 84 種情景嘅機率分佈（每點代表一種匯率+樓價組合）'))


# ═══════════════════════════════════════════════════
# CHAPTER 6: 你應該點做？
# ═══════════════════════════════════════════════════
story.append(h1('六、你應該點做？'))

story.append(h2('6.1 呢個投資啱唔啱你？'))
story.append(p(f'根據以上分析，呢個投資喺最可能嘅情況下可以帶來 HKD {ml_10["net_wan"]:.1f} 萬嘅淨回報，但你要問自己以下幾個問題：'))

story.append(p('<b>你信唔信日圓會貶值？</b>模型預測日圓 10 年貶值約 7.8%。如果你個人認為日圓將來會升值（例如你覺得日本經濟會強勢復甦），呢個投資嘅回報會比模型預測更好。相反，如果你認為日圓會繼續弱，你就要接受物業資本價值可能微跌，只能靠租金回本。'))

story.append(p('<b>你需唔需要短期用錢？</b>日本物業唔係股票，唔可以幾日就賣出。買賣手續繁複，交易周期長，急售可能要折價。如果你預期 10 年內可能需要動用呢筆錢，海外物業可能唔適合你。'))

story.append(p('<b>你對租金收入嘅依賴程度？</b>呢個投資嘅利潤核心係租金，但租客可能會空置、欠租，或者租約續約時租金下跌。雖然模型假設 6% 租金回報率，實際上可能會有波動。'))

story.append(h2('6.2 三個核心風險'))
story.append(p('<b>風險一：匯率風險（最大）。</b>日圓匯率係呢個投資最大嘅變數。模型預測的 7.8% 貶值幅度唔算極端，但歷史上日圓曾在短期內波動超過 30%。如果日圓貶值幅度遠超預期，你嘅損失會顯著增加。簡單講：日圓強你就賺多啲，日圓弱你就賺少啲甚至蝕。'))

story.append(p('<b>風險二：樓價下跌風險。</b>雖然模型預測樓價温和上升 5%，但歷史上日本樓價曾經出現過長期大幅下跌——1990 年代泡沫破裂後，日本樓價跌超過 50%，花咗幾十年都未完全恢復。模型嘅模擬顯示，有 5% 機率樓價在 10 年內下跌超過 24%。'))

story.append(p('<b>風險三：流動性風險。</b>海外物業唔容易快速變現。日本物業買賣涉及大量文件、公證、稅務手續，從決定賣到收到錢，可能要幾個月甚至更長時間。如果你需要緊急資金，可能要接受低於市場價嘅價格才能脫手。'))

story.append(h2('6.3 最終回報總覽'))

story.append(make_summary_table([
    ('房價變動', fmt(ml_10['prop_wan']),
     '日本樓價預計升 5%'),
    ('匯率變動', fmt(ml_10['fx_wan']),
     '日圓預計貶值 7.8%'),
    ('租金收入', fmt(ml_10['rent_wan']),
     '10 年淨租金（最大利潤來源）'),
    ('稅費', fmt(-ml_10['tax_wan']),
     '10 年物業稅同管理費'),
    ('銀行供款費用', fmt(-ml_10['interest_wan']),
     '10 年按揭利息'),
    ('投資淨回報', fmt(ml_10['net_wan']),
     f'192 萬首期 → 約 HKD {EQUITY_HKD_WAN + ml_10["net_wan"]:.1f} 萬'),
]))

story.append(callout(f'結論：最可能情況下，Andy 嘅 192 萬首期喺 10 年後變成約 HKD {EQUITY_HKD_WAN + ml_10["net_wan"]:.1f} 萬，主要靠租金收入驅動。'))


# ═══════════════════════════════════════════════════
# BUILD PDF
# ═══════════════════════════════════════════════════
doc.build(story)
print(f'V5 Body PDF generated: {OUT}')
print(f'ML 10yr net: HKD {ml_10["net_wan"]:.1f}萬')
print(f'Best 10yr net: HKD {best_10["net_wan"]:.1f}萬')
print(f'Worst 10yr net: HKD {worst_10["net_wan"]:.1f}萬')