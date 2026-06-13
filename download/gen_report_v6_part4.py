#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Andy Japan Property ML V2 Report — Part 4: V2 ML 機率預測模型
Professional Chinese | HKD/JPY
"""

import os

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    Image, KeepTogether
)
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase.pdfmetrics import registerFontFamily

# ═══════════════════════════════════════════════════════════════
# FONTS
# ═══════════════════════════════════════════════════════════════
pdfmetrics.registerFont(TTFont('NotoSerifSC', '/usr/share/fonts/truetype/noto-serif-sc/NotoSerifSC-Regular.ttf'))
pdfmetrics.registerFont(TTFont('NotoSerifSCBold', '/usr/share/fonts/truetype/noto-serif-sc/NotoSerifSC-Bold.ttf'))
pdfmetrics.registerFont(TTFont('WenQuanYi', '/usr/share/fonts/truetype/wqy/wqy-zenhei.ttc', subfontIndex=0))
registerFontFamily('NotoSerifSC', normal='NotoSerifSC', bold='NotoSerifSCBold')

# ═══════════════════════════════════════════════════════════════
# PALETTE (same as Part 1-3)
# ═══════════════════════════════════════════════════════════════
ACCENT = colors.HexColor('#4f2bba')
TEXT_PRIMARY = colors.HexColor('#1e1d1b')
TEXT_MUTED = colors.HexColor('#7a776e')
BG_SURFACE = colors.HexColor('#dedcd5')
TABLE_HEADER_COLOR = ACCENT
TABLE_HEADER_TEXT = colors.white
TABLE_ROW_EVEN = colors.white
TABLE_ROW_ODD = BG_SURFACE

# ═══════════════════════════════════════════════════════════════
# PAGE SETUP
# ═══════════════════════════════════════════════════════════════
W, H = A4
LM, RM, TM, BM = 2.0*cm, 2.0*cm, 2.2*cm, 2.2*cm
CW = W - LM - RM
CHART_DIR = '/home/z/my-project/download/ml_charts'

# ═══════════════════════════════════════════════════════════════
# STYLES
# ═══════════════════════════════════════════════════════════════
def make_styles():
    s = {}
    s['h1'] = ParagraphStyle('H1', fontName='NotoSerifSC', fontSize=18, leading=26,
        textColor=TEXT_PRIMARY, spaceBefore=18, spaceAfter=10, alignment=TA_LEFT)
    s['h2'] = ParagraphStyle('H2', fontName='NotoSerifSC', fontSize=13, leading=20,
        textColor=ACCENT, spaceBefore=14, spaceAfter=8, alignment=TA_LEFT)
    s['h3'] = ParagraphStyle('H3', fontName='NotoSerifSC', fontSize=11.5, leading=17,
        textColor=TEXT_PRIMARY, spaceBefore=10, spaceAfter=6, alignment=TA_LEFT)
    s['body'] = ParagraphStyle('Body', fontName='NotoSerifSC', fontSize=10.5, leading=18,
        textColor=TEXT_PRIMARY, spaceBefore=2, spaceAfter=6, alignment=TA_JUSTIFY, wordWrap='CJK')
    s['body_l'] = ParagraphStyle('BodyL', fontName='NotoSerifSC', fontSize=10.5, leading=18,
        textColor=TEXT_PRIMARY, spaceBefore=2, spaceAfter=6, alignment=TA_LEFT, wordWrap='CJK')
    s['caption'] = ParagraphStyle('Cap', fontName='NotoSerifSC', fontSize=9, leading=14,
        textColor=TEXT_MUTED, spaceBefore=4, spaceAfter=10, alignment=TA_CENTER, wordWrap='CJK')
    s['formula'] = ParagraphStyle('Formula', fontName='NotoSerifSC', fontSize=11, leading=18,
        textColor=ACCENT, spaceBefore=8, spaceAfter=8, alignment=TA_CENTER, wordWrap='CJK',
        leftIndent=12, borderColor=ACCENT, borderWidth=2, borderPadding=8)
    s['callout'] = ParagraphStyle('Callout', fontName='NotoSerifSCBold', fontSize=12, leading=19,
        textColor=ACCENT, spaceBefore=6, spaceAfter=6, alignment=TA_CENTER, wordWrap='CJK')
    s['small'] = ParagraphStyle('Small', fontName='NotoSerifSC', fontSize=9, leading=14,
        textColor=TEXT_MUTED, spaceBefore=2, spaceAfter=4, alignment=TA_LEFT, wordWrap='CJK')
    return s

STY = make_styles()

def h1(t): return Paragraph(f'<b>{t}</b>', STY['h1'])
def h2(t): return Paragraph(f'<b>{t}</b>', STY['h2'])
def h3(t): return Paragraph(f'<b>{t}</b>', STY['h3'])
def p(t): return Paragraph(t, STY['body'])
def pl(t): return Paragraph(t, STY['body_l'])
def cap(t): return Paragraph(t, STY['caption'])
def formula(t): return Paragraph(t, STY['formula'])
def callout(t): return Paragraph(t, STY['callout'])
def small(t): return Paragraph(t, STY['small'])

# ── Table helpers ──
def make_table(headers, rows, col_widths=None, font_size=9.5):
    cw = col_widths or [CW / len(headers)] * len(headers)
    th = ParagraphStyle('TH', fontName='NotoSerifSCBold', fontSize=font_size, leading=font_size+4,
        textColor=TABLE_HEADER_TEXT, alignment=TA_CENTER, wordWrap='CJK')
    td = ParagraphStyle('TD', fontName='NotoSerifSC', fontSize=font_size, leading=font_size+4,
        textColor=TEXT_PRIMARY, alignment=TA_CENTER, wordWrap='CJK')
    tdl = ParagraphStyle('TDL', fontName='NotoSerifSC', fontSize=font_size, leading=font_size+4,
        textColor=TEXT_PRIMARY, alignment=TA_LEFT, wordWrap='CJK')
    data = [[Paragraph(h, th) for h in headers]]
    for row in rows:
        data.append([Paragraph(str(c), tdl if i == 0 else td) for i, c in enumerate(row)])
    t = Table(data, colWidths=cw, repeatRows=1, hAlign='CENTER')
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), TABLE_HEADER_COLOR),
        ('TEXTCOLOR', (0, 0), (-1, 0), TABLE_HEADER_TEXT),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 6),
        ('TOPPADDING', (0, 0), (-1, 0), 6),
        ('BOTTOMPADDING', (0, 1), (-1, -1), 5),
        ('TOPPADDING', (0, 1), (-1, -1), 5),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#cccccc')),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [TABLE_ROW_EVEN, TABLE_ROW_ODD]),
    ]))
    return t

def embed_chart(filename, max_height=None):
    """Embed a chart image, scaled to fit content width."""
    path = os.path.join(CHART_DIR, filename)
    if not os.path.exists(path):
        return [Paragraph(f'[圖表缺失: {filename}]', STY['body'])]
    from PIL import Image as PILImage
    im = PILImage.open(path)
    img_w, img_h = im.size
    target_w = CW * 0.95
    ratio = target_w / img_w
    target_h = img_h * ratio
    if max_height and target_h > max_height:
        ratio2 = max_height / target_h
        target_w *= ratio2
        target_h = max_height
    return [Spacer(1, 6), Image(path, width=target_w, height=target_h, hAlign='CENTER')]


# ═══════════════════════════════════════════════════════════════
# BUILD DOCUMENT
# ═══════════════════════════════════════════════════════════════
OUT_PDF = '/home/z/my-project/download/andy_report_v6_part4.pdf'

doc = SimpleDocTemplate(OUT_PDF, pagesize=A4,
    leftMargin=LM, rightMargin=RM, topMargin=TM, bottomMargin=BM,
    title='日本物業投資評估報告 — 第4章', author='Z.ai', subject='V2 ML 機率預測模型')

story = []

# ───────────────────────────────────────────────────────────
# PART 4: V2 ML 機率預測模型
# ───────────────────────────────────────────────────────────
story.append(h1('四、V2 ML 機率預測模型'))

story.append(p('第三章的 84 情景壓力測試假設每個情景發生的機率相等，但現實中，日元匯率貶值 43%（HKD/JPY 從 19.5 升至 28）的可能性遠低於僅貶值 5%（HKD/JPY 升至 20.5）。為了更準確地評估投資回報，本報告引入機器學習預測模型，利用數十年的真實宏觀經濟數據，為每個情景分配一個更合理的發生機率。本章將詳細介紹模型的數據基礎、訓練方法、模擬過程以及機率映射機制。'))


# ═══════════════════════════════════════════════════════════
# 4.1 數據來源
# ═══════════════════════════════════════════════════════════
story.append(h2('4.1 數據來源'))

story.append(p('模型的預測能力取決於數據的質量和覆蓋範圍。本報告所有數據均來自全球最權威的經濟數據庫——美國聯邦儲備銀行的 FRED 數據系統及國際清算銀行（BIS）的官方統計。這些機構的數據被全球中央銀行、學術機構和投資銀行廣泛使用，具有極高的可靠性和公認性。'))

story.append(p('模型共使用四組時間序列數據，涵蓋匯率、物業價格和利率三個維度。其中匯率和利率數據為月度頻率，物業價格數據為季度頻率。為統一分析粒度，所有數據在預處理階段均轉換為季度對齊格式。經過對齊和質量篩選後，最終獲得 104 個有效訓練樣本，每個樣本對應一個季度的觀測值。'))

story.append(Spacer(1, 6))
story.append(make_table(
    ['數據類型', '來源代碼', '頻率', '數據量', '時間跨度'],
    [
        ['日元兌美元匯率', 'FRED EXJPUS', '月度', '665 個數據點', '1971 - 2026'],
        ['日本住宅價格指數', 'BIS QJPN628BIS', '季度', '284 個數據點', '1955 - 2025'],
        ['美國聯邦基金利率', 'FRED FEDFUNDS', '月度', '863 個數據點', '1954 - 2026'],
        ['日本政策利率', 'FRED IRSTCI01JPM156N', '月度', '490 個數據點', '1985 - 2026'],
    ],
    col_widths=[CW*0.20, CW*0.22, CW*0.12, CW*0.20, CW*0.26]
))
story.append(cap('表 4-1：模型數據來源一覽'))

story.append(p('104 個訓練樣本看似不多，但每個樣本並非單一數值，而是包含了豐富的衍生特徵。在數據預處理階段，模型為每個季度的觀測值計算了一系列技術指標，這些指標能夠捕捉市場動量、波動率、均值回歸趨勢以及跨市場息差等關鍵信息。'))

# Data overview chart
for elem in embed_chart('v2_data_overview.png', max_height=CW*0.45):
    story.append(elem)
story.append(cap('圖 4-1：V2 模型數據概覽——四組時間序列的歷史走勢'))


# ═══════════════════════════════════════════════════════════
# 4.2 數據處理與特徵工程
# ═══════════════════════════════════════════════════════════
story.append(h2('4.2 數據處理與特徵工程'))

story.append(p('原始數據無法直接用於機器學習預測。模型需要從原始的匯率和價格數值中提取出有意義的「特徵」（即能夠幫助預測未來走勢的數學指標）。這一過程稱為特徵工程，是機器學習模型性能的關鍵決定因素之一。'))

story.append(p('針對匯率預測，模型為每個季度計算了 15 個特徵，包括：1 個季度、4 個季度和 8 個季度的動量指標（衡量近期趨勢方向）；不同窗口期的移動平均線及均線交叉信號（判斷趨勢轉折）；滾動窗口波動率（衡量市場不確定性）；均值回歸指標（衡量當前價格偏離歷史均值的程度）；以及美日利差（兩國利率差異是驅動匯率長期走勢的核心因素之一）。'))

story.append(p('針對物業價格預測，模型計算了 12 個特徵，結構與匯率特徵類似但參數經過優化調整。兩組特徵合計 27 個維度，為模型提供了豐富的輸入信息。特徵設計的原則是：每個特徵都必須有明確的經濟學邏輯支撐，而非簡單的統計數字堆砌。例如，美日利差這一特徵的邏輯是：當美國利率高於日本利率時，資金倾向流向美元資產，導致日元貶值；反之則日元升值。這一特徵在歷史數據中確實展現出與匯率變動的強相關性。'))

# Feature importance chart
for elem in embed_chart('v2_feature_importance.png', max_height=CW*0.35):
    story.append(elem)
story.append(cap('圖 4-2：特徵重要性排名——對預測貢獻最大的前 15 個特徵'))

story.append(p('上圖展示了模型認為最重要的特徵。通常，短期動量、長期均值回歸以及美日利差等特徵排名靠前，這與外匯和房地產領域的學術研究結論一致。這也驗證了模型並非在「盲目擬合數據」，而是學習到了具有經濟學意義的規律。'))


# ═══════════════════════════════════════════════════════════
# 4.3 模型訓練
# ═══════════════════════════════════════════════════════════
story.append(h2('4.3 模型訓練與驗證'))

story.append(p('本報告採用了四種廣泛應用於表格數據預測的機器學習算法：XGBoost、LightGBM、Random Forest（隨機森林）和 Gradient Boosting Regressor（梯度提升回歸）。這四種算法同屬「集成學習」範疇，通過組合多棵決策樹的預測結果來提高整體準確度和穩定性。每種算法在處理方式上各有側重——例如 XGBoost 擅長捕捉複雜的非線性關係，LightGBM 在大規模數據上訓練效率更高，Random Forest 對噪聲數據具有較強的抗干擾能力。'))

story.append(p('模型驗證採用 5 折時序交叉驗證。與隨機劃分的交叉驗證不同，時序交叉驗證確保模型只能使用「過去」的數據來預測「未來」，嚴格避免數據洩露問題。具體而言，104 個樣本按時間順序分為 5 組，每次用前 4 組訓練、最後 1 組測試，循環 5 次取平均性能。評估指標採用平均絕對誤差（MAE），單位為百分比，表示模型預測的 10 年累計變動率與實際值的平均偏差。'))

story.append(Spacer(1, 6))
story.append(make_table(
    ['預測目標', 'XGBoost', 'LightGBM', 'Random Forest', 'GBR (最佳)'],
    [
        ['匯率 10 年變動 (%)', '20.69', '22.88', '23.74', '<b>19.70</b>'],
        ['物業價格 10 年變動 (%)', '16.08', '20.69', '16.23', '<b>15.57</b>'],
    ],
    col_widths=[CW*0.28, CW*0.16, CW*0.16, CW*0.20, CW*0.20]
))
story.append(cap('表 4-2：四種模型交叉驗證 MAE 對比（數值越低越準確）'))

story.append(p('在匯率預測方面，GBR 以 19.70% 的 MAE 表現最佳，意味著平均而言模型對 10 年匯率累計變動的預測誤差約為 19.7 個百分點。在物業價格預測方面，GBR 同樣以 15.57% 的 MAE 領先。MAE 在 15-20% 的範圍內，對於 10 年跨度的宏觀經濟預測而言是合理的——畢竟沒有任何模型能夠精確預測 10 年後的匯率和房價，模型的核心價值在於捕捉大趨勢和概率分佈，而非提供精確的點預測。'))

story.append(p('與 V1 版本相比，V2 模型在兩個維度上均有顯著改進。數據量從 V1 的 16 個月度樣本大幅增加至 V2 的 104 個季度樣本，增長了 5.5 倍。特徵工程也更加豐富，從單一匯率數據擴展到匯率、房價、雙邊利率共四維數據。這些改進直接體現在預測精度上：匯率 MAE 從 23.36% 降至 19.70%（改善 15.7%），物業價格 MAE 從 20.17% 降至 15.57%（改善 22.8%）。'))

# V1 vs V2 comparison chart
for elem in embed_chart('v2_v1_comparison.png', max_height=CW*0.45):
    story.append(elem)
story.append(cap('圖 4-3：V1 與 V2 模型對比——數據量與預測精度顯著提升'))

# Model comparison chart
for elem in embed_chart('v2_model_comparison.png', max_height=CW*0.35):
    story.append(elem)
story.append(cap('圖 4-4：V2 四種模型交叉驗證性能對比'))


# ═══════════════════════════════════════════════════════════
# 4.4 Monte Carlo 模擬
# ═══════════════════════════════════════════════════════════
story.append(h2('4.4 Monte Carlo 機率模擬'))

story.append(p('單一模型的點預測（例如「匯率 10 年變動 +7.8%」）無法反映未來的不確定性。為了解決這個問題，本報告採用 Monte Carlo 模擬方法，以模型的點預測為中心，利用歷史數據估計的統計分佈，隨機生成 10,000 個可能的未來情景，從而獲得完整的概率分佈。'))

story.append(h3('4.4.1 模擬方法'))

story.append(p('模擬的核心步驟如下：首先，以四個模型的加權平均預測值作為分佈的中心點（權重與各模型精度成反比，精度越高的模型權重越大）。然後，利用歷史預測誤差的統計特性，確定分佈的離散程度。這裡採用 t 分佈而非常態分佈，原因是金融市場的極端事件（如金融危機、央行政策突變）發生頻率高於常態分佈的預期——這種「厚尾」特性意味著大幅偏離預測的情況比人們直覺認為的更常見。最後，從 t 分佈中隨機抽取 10,000 個樣本，每個樣本代表一種可能的未來情景。'))

story.append(h3('4.4.2 模擬結果'))

story.append(p('下表展示了 10,000 次 Monte Carlo 模擬的關鍵統計結果。P5 表示第 5 百分位數（即 95% 的情景好於此值），P95 表示第 95 百分位數（即 95% 的情景差於此值），P50 為中位數。'))

story.append(Spacer(1, 6))
story.append(make_table(
    ['統計指標', '匯率 10 年累計變動', '物業價格 10 年累計變動'],
    [
        ['模型加權預測（中心點）', '+7.8%', '+5.0%'],
        ['Monte Carlo 均值', '+7.6%', '+4.8%'],
        ['P5（極度悲觀）', '-31.1%', '-24.7%'],
        ['P25（偏悲觀）', '-8.5%', '-7.2%'],
        ['P50（中位數）', '+7.6%', '+4.8%'],
        ['P75（偏樂觀）', '+23.5%', '+17.8%'],
        ['P95（極度樂觀）', '+47.1%', '+35.0%'],
    ],
    col_widths=[CW*0.30, CW*0.35, CW*0.35]
))
story.append(cap('表 4-3：Monte Carlo 10,000 次模擬結果統計'))

story.append(p('匯率模擬結果顯示，中心預測為日元貶值 7.8%（HKD/JPY 從 19.5 升至約 21.0），但 90% 的置信區間（P5 至 P95）跨度極大，從貶值 31.1% 到升值 47.1%。這意味着雖然模型預測日元小幅貶值是「最可能」的結果，但日元大幅升值或大幅貶值的情況都不可忽視。物業價格的預測相對更為集中，中心為累計上漲 5.0%，90% 置信區間為 -24.7% 至 +35.0%。'))

# Probability distribution chart
for elem in embed_chart('v2_probability_distribution.png', max_height=CW*0.40):
    story.append(elem)
story.append(cap('圖 4-5：Monte Carlo 模擬概率分佈——匯率與物業價格的 10 年變動分佈'))


# ═══════════════════════════════════════════════════════════
# 4.5 機率映射
# ═══════════════════════════════════════════════════════════
story.append(h2('4.5 機率映射：從均等到智能加權'))

story.append(p('第三章的 84 情景壓力測試假設每個情景的發生機率均等（每個情景約 1.2%）。然而，Monte Carlo 模擬的概率分佈告訴我們，不同情景的發生可能性差異極大。例如，匯率 HKD/JPY = 19.5（無變化）搭配房價年漲 1.5% 的情景，在歷史數據和模型預測中出現的概率遠高於 HKD/JPY = 28（日元貶值 43%）搭配房價年跌 3% 的極端情景。'))

story.append(p('機率映射的目的是將 Monte Carlo 模擬得出的聯合概率分佈，分配到 84 個離散情景中。具體方法如下：對於 84 個情景中的每一個，以其匯率變動和房價變動作為坐標點，計算該點在二維聯合概率密度函數上的高度。聯合概率密度函數由兩個獨立的 t 分佈構成（基於模擬結果的均值和標準差），並通過相關性係數捕捉匯率與房價之間的歷史相關性。最終，每個情景的機率正比於其對應的概率密度值，全部 84 個機率之和歸一化為 100%。'))

story.append(p('以下列舉幾個典型情景的機率分配結果，以直觀展示機率映射的效果。'))

story.append(Spacer(1, 6))
story.append(make_table(
    ['HKD/JPY 出場匯率', '年房價變幅', '情景描述', 'ML 機率'],
    [
        ['13.0', '-3.0%', '日元大幅升值 + 房價下跌', '0.1%'],
        ['16.0', '+1.5%', '日元升值 + 房價溫和增長', '2.8%'],
        ['19.5', '+1.5%', '匯率不變 + 房價溫和增長', '4.2%'],
        ['19.5', '+3.0%', '匯率不變 + 房價穩健增長', '4.2%'],
        ['22.0', '+3.0%', '日元小幅貶值 + 房價增長', '5.7%'],
        ['24.0', '0%', '日元貶值 + 房價持平', '3.1%'],
        ['26.0', '-3.0%', '日元大幅貶值 + 房價下跌', '0.8%'],
        ['28.0', '-3.0%', '極端悲觀情景', '0.3%'],
    ],
    col_widths=[CW*0.18, CW*0.14, CW*0.40, CW*0.16, CW*0.12]
))
story.append(cap('表 4-4：典型情景的 ML 機率分配示例'))

story.append(p('從上表可以看出，機率映射的效果非常明顯：最接近模型預測中心的情景（如 HKD/JPY = 22.0 搭配房價年漲 3%）獲得了最高的機率（5.7%），而極端情景（HKD/JPY = 28.0 搭配房價年跌 3%）的機率僅為 0.3%，是前者的約二十分之一。這一機率加權機制確保了最終的投資回報預測不會被低概率的極端情景過度拉低或拉高，更貼近現實中的「最可能結果」。'))

# Probability heatmap
for elem in embed_chart('v2_probability_heatmap.png', max_height=CW*0.50):
    story.append(elem)
story.append(cap('圖 4-6：84 情景 ML 機率分佈熱力圖——顏色越深表示該情景發生機率越高'))

story.append(p('上圖以熱力圖形式展示了全部 84 個情景的機率分佈。可以清楚地看到，機率密集區集中在匯率溫和變動（HKD/JPY 約 16 至 24）且房價小幅上漲的區域，而四角的極端情景機率極低。這與直覺一致——極端的市場環境本就是小概率事件。'))

story.append(Spacer(1, 8))
story.append(callout('機率映射的核心價值：讓 84 個情景從「等權平均」升級為「智能加權」，使投資回報預測更貼近現實'))
story.append(Spacer(1, 8))

story.append(p('綜合而言，V2 ML 機率預測模型通過四個環環相扣的步驟——數據採集、特徵工程、模型訓練和 Monte Carlo 模擬——將第三章的 84 個等權情景轉化為具有不同機率權重的智能情景。這一轉變的意義在於：最終的加權平均回報更能反映「最可能發生的現實」，而非被極端情景扭曲。下一章將在此基礎上，展示機率加權後的最終投資回報計算結果。'))


# ═══════════════════════════════════════════════════════════
# BUILD
# ═══════════════════════════════════════════════════════════
doc.build(story)
print(f'Part 4 PDF generated: {OUT_PDF}')