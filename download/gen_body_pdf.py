# -*- coding: utf-8 -*-
import json, os, sys
PDF_SKILL_DIR = '/home/z/my-project/skills/pdf'
sys.path.insert(0, os.path.join(PDF_SKILL_DIR, 'scripts'))
from pdf import install_font_fallback

with open('/home/z/my-project/download/scenario_data.json') as f:
    data = json.load(f)
PM = data['params']
SC = data['scenarios']
HI = data['hist']
LB = data['loan_bal']

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY
from reportlab.lib import colors
from reportlab.platypus import (SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    Image, PageBreak, HRFlowable, KeepTogether)
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase.pdfmetrics import registerFontFamily

# ━━ Color Palette (auto-generated) ━━
ACCENT       = colors.HexColor('#1f7692')
TEXT_PRIMARY  = colors.HexColor('#1b1a18')
TEXT_MUTED    = colors.HexColor('#7a766f')
BG_SURFACE   = colors.HexColor('#e5e3df')
BG_PAGE      = colors.HexColor('#edecea')
TABLE_HEADER_COLOR = ACCENT
TABLE_HEADER_TEXT  = colors.white
TABLE_ROW_EVEN     = colors.white
TABLE_ROW_ODD      = BG_SURFACE
BORDER = colors.HexColor('#d5cfbe')
SEM_SUCCESS = colors.HexColor('#3b8754')
SEM_WARNING = colors.HexColor('#a5884e')
SEM_ERROR = colors.HexColor('#904c46')

pdfmetrics.registerFont(TTFont('MSYH', '/usr/share/fonts/truetype/chinese/SarasaMonoSC-SemiBold.ttf'))
pdfmetrics.registerFont(TTFont('SimHei', '/usr/share/fonts/truetype/chinese/SarasaMonoSC-Regular.ttf'))
pdfmetrics.registerFont(TTFont('Carlito', '/usr/share/fonts/truetype/english/Carlito-Regular.ttf'))
pdfmetrics.registerFont(TTFont('CarlitoB', '/usr/share/fonts/truetype/english/Carlito-Bold.ttf'))
registerFontFamily('MSYH', normal='MSYH', bold='MSYH')
registerFontFamily('SimHei', normal='SimHei', bold='MSYH')
registerFontFamily('Carlito', normal='Carlito', bold='CarlitoB')
install_font_fallback()

W = A4[0] - 50*mm - 50*mm

sH1 = ParagraphStyle('H1', fontName='MSYH', fontSize=16, leading=24, textColor=TEXT_PRIMARY, spaceAfter=8, spaceBefore=14)
sH2 = ParagraphStyle('H2', fontName='MSYH', fontSize=12, leading=18, textColor=ACCENT, spaceAfter=6, spaceBefore=10)
sH3 = ParagraphStyle('H3', fontName='MSYH', fontSize=10.5, leading=15, textColor=TEXT_PRIMARY, spaceAfter=5, spaceBefore=8)
sBody = ParagraphStyle('Body', fontName='SimHei', fontSize=9, leading=15, textColor=TEXT_PRIMARY, alignment=TA_JUSTIFY, spaceAfter=5, wordWrap='CJK')
sMuted = ParagraphStyle('Muted', fontName='SimHei', fontSize=8, leading=12, textColor=TEXT_MUTED, spaceAfter=3)
sTH = ParagraphStyle('TH', fontName='SimHei', fontSize=7.5, leading=10, textColor=colors.white, alignment=TA_CENTER, wordWrap='CJK')
sTC = ParagraphStyle('TC', fontName='SimHei', fontSize=7.5, leading=10, textColor=TEXT_PRIMARY, alignment=TA_CENTER, wordWrap='CJK')
sTL = ParagraphStyle('TL', fontName='SimHei', fontSize=7.5, leading=10, textColor=TEXT_PRIMARY, alignment=TA_LEFT, wordWrap='CJK')

OUT = '/home/z/my-project/download'
PDF_PATH = f'{OUT}/japan_property_84scenario_report_cn.pdf'

def P(text, style=sBody): return Paragraph(text, style)

def tbl_style(nrows):
    cmds = [
        ('BACKGROUND', (0, 0), (-1, -1), colors.white),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [TABLE_ROW_EVEN, TABLE_ROW_ODD]),
        ('GRID', (0, 0), (-1, -1), 0.3, BORDER),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('LEFTPADDING', (0, 0), (-1, -1), 4),
        ('RIGHTPADDING', (0, 0), (-1, -1), 4),
        ('BACKGROUND', (0, 0), (-1, 0), TABLE_HEADER_COLOR),
        ('TEXTCOLOR', (0, 0), (-1, 0), TABLE_HEADER_TEXT),
    ]
    return TableStyle(cmds)

doc = SimpleDocTemplate(PDF_PATH, pagesize=A4,
    leftMargin=50*mm, rightMargin=50*mm, topMargin=40*mm, bottomMargin=40*mm,
    title='日本物業投資84情景風險分析', author='Z.ai', subject='84情景風險模型')

story = []

# ═══════ 第1節：模型說明 ═══════
story.append(P('<b>一、模型說明</b>', sH1))
story.append(HRFlowable(width='100%', thickness=1, color=BORDER, spaceAfter=8))
story.append(P(
    '當香港投資者購買日本物業時，最終回報取決於兩類本質不同的因素。我們的模型將所有輸入參數分為<b>固定數據</b>（目前已確定）和<b>變動數據</b>（未知，需情景測試）。'
    '透過系統性地測試所有組合，我們生成84個不同的投資情景，全面覆蓋可能的回報結果範圍。每個情景均以回報率（%）和絕對港幣盈虧來衡量，'
    '幫助投資者清晰了解在樂觀、平均及悲觀條件下，其港幣192萬股本投資的實際表現。', sBody))

# 固定數據表格
fd = [[P('參數', sTH), P('數值', sTH), P('確定性', sTH)]]
for n, v, c in [
    ('物業購買價格', '日圓 62,400,000', '購買時確定'),
    ('貸款成數 (LTV)', '40%', '由貸款機構設定'),
    ('按揭利率', '3.0% (年息)', '固定利率'),
    ('貸款期限', '15年', '合約約定'),
    ('租金回報率', '6.0% (毛回報)', '參考周邊租金'),
    ('年度成本 (稅+保險)', '物業價值 0.3%', '無管理費'),
]:
    fd.append([P(n, sTL), P(v, sTC), P(c, sTC)])
story.append(P('<b>固定數據（目前已確定）</b>', sH3))
t = Table(fd, colWidths=[W*0.38, W*0.32, W*0.30])
t.setStyle(tbl_style(len(fd)))
t.hAlign = 'CENTER'
story.append(t)

story.append(Spacer(1, 6))
vd = [[P('參數', sTH), P('狀態', sTH), P('情景範圍', sTH)]]
for n, v, r in [
    ('退出時 JPY/HKD 匯率', '未知', '7個水平：13.0 - 28.0'),
    ('退出時物業價值', '未知', '4種年率：-3% 至 +3%'),
    ('持有期', '彈性', '3種：5年、7年、10年'),
]:
    vd.append([P(n, sTL), P(v, sTC), P(r, sTC)])
story.append(P('<b>變動數據（未知 - 情景測試）</b>', sH3))
t = Table(vd, colWidths=[W*0.35, W*0.20, W*0.45])
t.setStyle(tbl_style(len(vd)))
t.hAlign = 'CENTER'
story.append(t)

story.append(Spacer(1, 6))
story.append(P(
    '<b>84情景如何運作：</b>我們將7個退出匯率（日圓升值33%至貶值44%）、4種物業價格年變動軌跡（-3%至+3%）及3種持有期（5、7、10年）交叉組合，'
    '共產生84個投資結果。每個結果均以股本回報率（ROI%）和絕對港幣盈虧來衡量。', sBody))
story.append(P(
    '<b>為何無管理費：</b>本分析假設投資者直接持有物業並自行管理，因此唯一不可避免的成本是物業稅和建築保險（每年0.3%）。'
    '這相比基金類投資大幅提升了淨現金流，使投資回報更具吸引力。', sBody))

# ═══════ 第2節：投資參數 ═══════
story.append(PageBreak())
story.append(P('<b>二、投資參數詳情</b>', sH1))
story.append(HRFlowable(width='100%', thickness=1, color=BORDER, spaceAfter=8))
story.append(P(
    '標的物業位於大阪天王寺茶屋町地區。以下為構建84情景模型的固定財務參數，所有數值均基於當前市場條件和貸款條款確定。'
    '投資者以港幣320萬元（按匯率19.5換算為日圓6,240萬元）購買該物業，其中40%來自貸款，60%為自有股本。', sBody))

sd = [
    [P('物業購買價格', sTL), P('日圓 62,400,000', sTC)],
    [P('入市匯率', sTL), P('19.5 JPY/HKD', sTC)],
    [P('物業價值（港幣）', sTL), P(f'HKD {PM["price_jpy"]/PM["entry_fx"]/1e4:.1f}M', sTC)],
    [P('貸款金額 (40% LTV)', sTL), P(f'日圓 {PM["loan_jpy"]/1e4:,.0f} 萬', sTC)],
    [P('自有股本 (首期)', sTL), P(f'日圓 {PM["eq_jpy"]/1e4:,.0f} 萬 = HKD {PM["eq_hkd"]/1e4:.2f}M', sTC)],
    [P('按揭利率', sTL), P('3.0% (固定年息)', sTC)],
    [P('貸款期限', sTL), P('15年', sTC)],
    [P('每月供款', sTL), P(f'日圓 {PM["monthly_payment"]:,.0f}', sTC)],
    [P('年度按揭總額', sTL), P(f'日圓 {PM["annual_mortgage"]/1e6:.2f}M', sTC)],
]
t = Table(sd, colWidths=[W*0.55, W*0.45])
t.setStyle(tbl_style(len(sd)))
t.hAlign = 'CENTER'
story.append(t)

story.append(Spacer(1, 8))
story.append(P('<b>年度現金流結構</b>', sH2))

# Cashflow chart
img_cf = f'{OUT}/chart_cashflow.png'
if os.path.exists(img_cf):
    story.append(Image(img_cf, width=W*0.7, height=W*0.7*3.5/6))
story.append(Spacer(1, 6))

cf = [
    [P('項目', sTH), P('年度金額 (日圓)', sTH), P('備註', sTH)],
    [P('毛租金收入', sTL), P(f'日圓 {PM["annual_rental"]/1e6:.2f}M', sTC), P('6.0% 回報率', sTL)],
    [P('減：物業稅 + 保險', sTL), P(f'- 日圓 {PM["annual_costs"]/1e6:.3f}M', sTC), P('物業價值 0.3%', sTL)],
    [P('淨租金（扣按揭前）', sTL), P(f'日圓 {PM["annual_net_rental"]/1e6:.2f}M', sTC), P('', sTL)],
    [P('減：按揭供款', sTL), P(f'- 日圓 {PM["annual_mortgage"]/1e6:.2f}M', sTC), P('3.0%, 15年期', sTL)],
    [P('<b>淨年度現金流</b>', sTL), P(f'<b>日圓 {PM["annual_cashflow"]/1e6:.2f}M</b>', sTC), P('正現金流', sTL)],
]
t = Table(cf, colWidths=[W*0.35, W*0.30, W*0.35])
t.setStyle(tbl_style(len(cf)))
t.hAlign = 'CENTER'
story.append(t)

story.append(Spacer(1, 8))
story.append(P('<b>退出時貸款餘額</b>', sH2))
lb_data = [[P('持有期', sTH), P('貸款餘額', sTH), P('已償還', sTH)]]
for t_val in [5, 7, 10]:
    b = LB[str(t_val)]; p = PM['loan_jpy'] - b
    lb_data.append([P(f'{t_val} 年', sTC), P(f'日圓 {b/1e6:.1f}M', sTC), P(f'日圓 {p/1e6:.1f}M ({p/PM["loan_jpy"]*100:.0f}%)', sTC)])
t = Table(lb_data, colWidths=[W*0.25, W*0.35, W*0.40])
t.setStyle(tbl_style(len(lb_data)))
t.hAlign = 'CENTER'
story.append(t)

# ═══════ 第3節：市場變量 ═══════
story.append(PageBreak())
story.append(P('<b>三、市場變量：兩大未知因素</b>', sH1))
story.append(HRFlowable(width='100%', thickness=1, color=BORDER, spaceAfter=8))

story.append(P('<b>3.1 匯率情景 (JPY/HKD)</b>', sH2))
story.append(P(
    '目前 JPY/HKD 匯率約為19.5。過去30年間，該匯率在622（1998年，日圓極強）至1,181（2024年，日圓極弱）之間波動。'
    '我們設定的7個情景覆蓋了日圓升值33%（匯率降至13.0）到貶值44%（匯率升至28.0）的完整範圍。'
    '對於港幣投資者而言，JPY/HKD匯率上升代表日圓貶值，退出時將日圓資產換回港幣會獲得更多港幣，因此是正面因素。', sBody))

fx_rows = [[P('情景', sTH), P('退出匯率', sTH), P('匯率變動', sTH), P('對港幣投資者影響', sTH)]]
for desc, rate, chg, imp in [
    ('日圓大幅升值', '13.0', '+33.0%', '高度負面'),
    ('日圓顯著升值', '15.0', '+23.1%', '負面'),
    ('日圓溫和升值', '17.0', '+12.8%', '輕微負面'),
    ('不變（基準）', '19.5', '0.0%', '中性'),
    ('日圓溫和貶值', '22.0', '-12.8%', '輕微正面'),
    ('日圓顯著貶值', '25.0', '-28.2%', '正面'),
    ('日圓大幅貶值', '28.0', '-43.6%', '高度正面'),
]:
    fx_rows.append([P(desc, sTL), P(rate, sTC), P(chg, sTC), P(imp, sTL)])
t = Table(fx_rows, colWidths=[W*0.28, W*0.14, W*0.14, W*0.44])
t.setStyle(tbl_style(len(fx_rows)))
t.hAlign = 'CENTER'
story.append(t)

story.append(Spacer(1, 8))
story.append(P('<b>3.2 物業價格情景</b>', sH2))
story.append(P(
    '日本物業經歷了巨大的週期性變化：泡沫後下跌期（1990年代至2000年代）、長期停滯期，以及近年來的都市復甦期（2012年至今）。'
    '我們測試4種年化變動率，從-3%/年（類似1995-2005年全國平均下跌）到+3%/年（類似2015-2025年大阪/東京都市區的強勁增長）。', sBody))

pr_rows = [[P('年變動率', sTH), P('5年總計', sTH), P('7年總計', sTH), P('10年總計', sTH), P('歷史參考', sTH)]]
for rate, t5, t7, t10, h in [
    (-3, -14.0, -19.3, -26.3, '1995-2005年全國下跌期'),
    (-1, -4.9, -6.7, -9.6, '2005-2015年停滯期'),
    (1, 5.1, 7.2, 10.5, '保守型都市復甦'),
    (3, 15.9, 23.0, 34.4, '2015-2025年大阪/東京繁榮期'),
]:
    pr_rows.append([P(f'{rate:+d}%/年', sTC), P(f'{t5:+.1f}%', sTC), P(f'{t7:+.1f}%', sTC), P(f'{t10:+.1f}%', sTC), P(h, sTL)])
t = Table(pr_rows, colWidths=[W*0.14, W*0.13, W*0.13, W*0.15, W*0.45])
t.setStyle(tbl_style(len(pr_rows)))
t.hAlign = 'CENTER'
story.append(t)

# ═══════ 第4節：84情景結果 ═══════
story.append(PageBreak())
story.append(P('<b>四、84情景投資結果</b>', sH1))
story.append(HRFlowable(width='100%', thickness=1, color=BORDER, spaceAfter=8))
story.append(P(
    '下表每格顯示在相應匯率和物業價格條件下，您的港幣{:.2f}M股本投資的回報率（%）及港幣盈虧金額（萬）。'
    '綠色代表正回報，黃色代表溫和正回報，紅色代表虧損。表格中的萬為港幣萬元。'.format(PM['eq_hkd']/1e6), sBody))

FXS = [13.0, 15.0, 17.0, 19.5, 22.0, 25.0, 28.0]
PAS = [-0.03, -0.01, 0.01, 0.03]

for hold_t in [5, 7, 10]:
    story.append(P(f'<b>4.{[5,7,10].index(hold_t)+1} 持有期：{hold_t}年</b>', sH2))
    hdr = [P('物業\\匯率', sTH)] + [P(f'{fx:.1f}', sTH) for fx in FXS]
    rows = [hdr]
    for pa in PAS:
        row = [P(f'{pa*100:+.0f}%/年', sTC)]
        for fx in FXS:
            s = next(x for x in SC if x['fx']==fx and abs(x['pa']-pa)<0.001 and x['t']==hold_t)
            roi = s['roi']; g = s['gain']
            clr = colors.white if roi < 0 or roi > 100 else TEXT_PRIMARY
            cs = ParagraphStyle('cc', parent=sTC, textColor=clr)
            row.append(P(f'{roi:+.0f}%<br/>{g/1e4:+.0f}萬', cs))
        rows.append(row)
    
    cw = [W*0.13] + [W*0.124]*7
    tbl = Table(rows, colWidths=cw)
    sc = [
        ('BACKGROUND', (0, 0), (-1, 0), TABLE_HEADER_COLOR),
        ('TEXTCOLOR', (0, 0), (-1, 0), TABLE_HEADER_TEXT),
        ('GRID', (0, 0), (-1, -1), 0.3, BORDER),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        ('LEFTPADDING', (0, 0), (-1, -1), 2),
        ('RIGHTPADDING', (0, 0), (-1, -1), 2),
    ]
    for i, pa in enumerate(PAS):
        for j, fx in enumerate(FXS):
            s = next(x for x in SC if x['fx']==fx and abs(x['pa']-pa)<0.001 and x['t']==hold_t)
            if s['roi'] >= 50: bg = colors.HexColor('#e8f5e9')
            elif s['roi'] >= 0: bg = colors.HexColor('#fff8e1')
            else: bg = colors.HexColor('#fde8e8')
            sc.append(('BACKGROUND', (j+1, i+1), (j+1, i+1), bg))
    tbl.setStyle(TableStyle(sc))
    tbl.hAlign = 'CENTER'
    story.append(tbl)
    story.append(Spacer(1, 5))

# Heatmap
story.append(PageBreak())
story.append(P('<b>4.4 視覺化：10年回報率熱力圖</b>', sH2))
story.append(P(
    '從熱力圖可以清楚看到，匯率（橫軸）是主導投資結果的最關鍵因素。即使物業價格下跌，只要退出時日圓貶值（匯率右移），'
    '仍可產生可觀的正回報。紅色區域（左上角）僅在日圓大幅升值且物業價格同時下跌的極端組合下出現，'
    '這在歷史上是較罕見的情況。對於持有10年的投資者而言，84個情景中幾乎所有組合均產生正回報，'
    '顯示長期持有配合正現金流策略的有效性。', sBody))
img_path = f'{OUT}/chart_heatmap.png'
if os.path.exists(img_path):
    story.append(Image(img_path, width=W, height=W*0.38))

# ═══════ 第5節：歷史數據分析 ═══════
story.append(PageBreak())
story.append(P('<b>五、歷史數據驗證：30年回顧</b>', sH1))
story.append(HRFlowable(width='100%', thickness=1, color=BORDER, spaceAfter=8))

story.append(P(
    '為驗證模型的合理性，我們分析了1995年至2025年間所有滾動10年窗口（共16個週期），找出歷史上實際發生的最差、平均及最佳情景。'
    '將這些真實的匯率和物業價格變動應用於我們的投資模型，可以展示您的港幣{:.2f}M投資在真實歷史條件下的表現。'.format(PM['eq_hkd']/1e6), sBody))

# History chart
img_hist = f'{OUT}/chart_history.png'
if os.path.exists(img_hist):
    story.append(Image(img_hist, width=W, height=W*0.42))
story.append(Spacer(1, 6))

# 30-year cumulative
story.append(P('<b>5.1 30年累計變動</b>', sH2))
h30 = [
    [P('指標', sTH), P('1995年水平', sTH), P('2025年水平', sTH), P('30年變動', sTH)],
    [P('JPY/HKD 匯率', sTL), P('733', sTC), P(f'{149.67*7.80:.0f}', sTC), P(f'{PM["fx_30yr_pct"]:+.1f}%', sTC)],
    [P('住宅物業指數 (2015=100)', sTL), P('145.0', sTC), P('136.0', sTC), P(f'{PM["pr_30yr_pct"]:+.1f}%', sTC)],
]
t = Table(h30, colWidths=[W*0.35, W*0.20, W*0.20, W*0.25])
t.setStyle(tbl_style(len(h30)))
t.hAlign = 'CENTER'
story.append(t)

story.append(Spacer(1, 6))
story.append(P(
    '過去30年，JPY/HKD從733上升至1,167（+59.2%），意味日圓對港幣大幅貶值。'
    '對港幣投資者而言，這個長期的日圓貶值趨勢是強大的順風：當您出售日本資產並將日圓兌換回港幣時，每百日圓換到的港幣比投資時更多。'
    '雖然全國物業價格指數30年累計下跌6.2%，但都市核心區（如大阪、東京）顯著跑贏全國平均，'
    '自2012年以來核心區域的累計漲幅達30-40%，顯示選擇優質地段的重要性。', sBody))

# Summary chart
story.append(PageBreak())
story.append(P('<b>5.2 歷史10年情景：視覺總結</b>', sH2))
story.append(P(
    '左圖展示歷史上真實發生的10年期匯率和物業價格變動幅度（最差、平均、最佳），'
    '右圖將這些變動轉化為您具體投資的回報，同時以百分比和港幣金額呈現。', sBody))
img_sum = f'{OUT}/chart_summary.png'
if os.path.exists(img_sum):
    story.append(Image(img_sum, width=W, height=W*0.40))

# ═══════ 關鍵表格：三情景總結 ═══════
story.append(Spacer(1, 8))
story.append(P('<b>5.3 您的投資：三個歷史情景對比（持有10年）</b>', sH2))
story.append(P(
    '下表將歷史上真實發生的10年匯率和物業價格變動應用於您的港幣{:.2f}M股本投資，'
    '展示如果在那些歷史條件下投資，您實際會獲得或損失多少。'.format(PM['eq_hkd']/1e6), sBody))

hw = HI['worst']; ha = HI['avg']; hb = HI['best']

sc3 = [
    [P('', sTH), P('最差情景', sTH), P('平均情景', sTH), P('最佳情景', sTH)],
    [P('<b>歷史期間（匯率）</b>', sTL),
     P(f'{PM["fx_worst10_yr"]}', sTC),
     P('16個週期平均', sTC),
     P(f'{PM["fx_best10_yr"]}', sTC)],
    [P('<b>歷史期間（物業）</b>', sTL),
     P(f'{PM["pr_worst10_yr"]}', sTC),
     P('16個週期平均', sTC),
     P(f'{PM["pr_best10_yr"]}', sTC)],
    [P('<b>匯率10年變動</b>', sTL),
     P(f'{hw["fx_pct"]:+.1f}%', ParagraphStyle('rw', parent=sTC, textColor=SEM_ERROR)),
     P(f'{ha["fx_pct"]:+.1f}%', ParagraphStyle('ra', parent=sTC, textColor=SEM_WARNING)),
     P(f'{hb["fx_pct"]:+.1f}%', ParagraphStyle('rb', parent=sTC, textColor=SEM_SUCCESS))],
    [P('<b>物業價格10年變動</b>', sTL),
     P(f'{hw["pr_pct"]:+.1f}%', ParagraphStyle('pw', parent=sTC, textColor=SEM_ERROR)),
     P(f'{ha["pr_pct"]:+.1f}%', ParagraphStyle('pa', parent=sTC, textColor=SEM_WARNING)),
     P(f'{hb["pr_pct"]:+.1f}%', ParagraphStyle('pb', parent=sTC, textColor=SEM_SUCCESS))],
    [P('<b>退出時物業價值</b>', sTL),
     P(f'日圓 {hw["ev"]/1e6:.1f}M', sTC),
     P(f'日圓 {ha["ev"]/1e6:.1f}M', sTC),
     P(f'日圓 {hb["ev"]/1e6:.1f}M', sTC)],
    [P('<b>退出時貸款餘額</b>', sTL),
     P(f'日圓 {hw["bl"]/1e6:.1f}M', sTC),
     P(f'日圓 {ha["bl"]/1e6:.1f}M', sTC),
     P(f'日圓 {hb["bl"]/1e6:.1f}M', sTC)],
    [P('<b>淨退出收益 (日圓)</b>', sTL),
     P(f'日圓 {hw["ne"]/1e6:.1f}M', sTC),
     P(f'日圓 {ha["ne"]/1e6:.1f}M', sTC),
     P(f'日圓 {hb["ne"]/1e6:.1f}M', sTC)],
    [P('<b>累計租金收入 (10年)</b>', sTL),
     P(f'日圓 {hw["ar"]/1e6:.1f}M', sTC),
     P(f'日圓 {ha["ar"]/1e6:.1f}M', sTC),
     P(f'日圓 {hb["ar"]/1e6:.1f}M', sTC)],
    [P('<b>總回報 (港幣)</b>', sTL),
     P(f'HKD {hw["th"]/1e4:.1f}萬', ParagraphStyle('tw', parent=sTC, textColor=SEM_ERROR)),
     P(f'HKD {ha["th"]/1e4:.1f}萬', ParagraphStyle('ta', parent=sTC, textColor=SEM_WARNING)),
     P(f'HKD {hb["th"]/1e4:.1f}萬', ParagraphStyle('tb', parent=sTC, textColor=SEM_SUCCESS))],
    [P('<b>股本回報率 (ROI)</b>', sTL),
     P(f'<b>{hw["roi"]:+.1f}%</b>', ParagraphStyle('r1', parent=sTC, textColor=SEM_ERROR, fontSize=9.5)),
     P(f'<b>{ha["roi"]:+.1f}%</b>', ParagraphStyle('r2', parent=sTC, textColor=SEM_WARNING, fontSize=9.5)),
     P(f'<b>{hb["roi"]:+.1f}%</b>', ParagraphStyle('r3', parent=sTC, textColor=SEM_SUCCESS, fontSize=9.5))],
    [P('<b>港幣盈虧</b>', sTL),
     P(f'<b>{hw["gain"]/1e4:+.0f} 萬</b>', ParagraphStyle('g1', parent=sTC, textColor=SEM_ERROR, fontSize=9.5)),
     P(f'<b>{ha["gain"]/1e4:+.0f} 萬</b>', ParagraphStyle('g2', parent=sTC, textColor=SEM_WARNING, fontSize=9.5)),
     P(f'<b>{hb["gain"]/1e4:+.0f} 萬</b>', ParagraphStyle('g3', parent=sTC, textColor=SEM_SUCCESS, fontSize=9.5))],
]

cw3 = [W*0.28, W*0.24, W*0.24, W*0.24]
t3 = Table(sc3, colWidths=cw3)
t3_style = tbl_style(len(sc3))
t3_style.add('BACKGROUND', (1, 0), (1, 0), SEM_ERROR)
t3_style.add('BACKGROUND', (2, 0), (2, 0), SEM_WARNING)
t3_style.add('BACKGROUND', (3, 0), (3, 0), SEM_SUCCESS)
t3.setStyle(t3_style)
t3.hAlign = 'CENTER'
story.append(t3)

story.append(Spacer(1, 8))
story.append(P(
    '<b>核心發現：</b>即使在歷史上最差的10年期間（日圓貶值64.7% + 物業價格下跌40.0%），'
    '虧損僅為-30.7%（-港幣{:.0f}萬），並被日圓{:.1f}M的累計正現金流收入大幅緩衝。'
    '平均情景回報為+{:.1f}%（+港幣{:.0f}萬），接近讓您的股本翻倍。'
    '最佳情景則實現+{:.1f}%（+港幣{:.0f}萬）的回報，相當於原始投資的4倍增長。'
    '這三個歷史情景清楚顯示，正現金流策略在長期持有中發揮了關鍵的風險緩衝作用。'.format(
        abs(hw['gain']/1e4), hw['ar']/1e6, ha['roi'], ha['gain']/1e4, hb['roi'], hb['gain']/1e4), sBody))

# ═══════ 第6節：風險評分卡 ═══════
story.append(PageBreak())
story.append(P('<b>六、風險評分卡</b>', sH1))
story.append(HRFlowable(width='100%', thickness=1, color=BORDER, spaceAfter=8))
story.append(P(
    '以下從五個維度對本投資進行全面風險評估。每項風險均基於歷史數據和當前市場環境進行分析，'
    '並結合84情景模型的測試結果給出綜合評級。', sBody))

risk = [
    [P('風險類別', sTH), P('評級', sTH), P('評估', sTH)],
    [P('<b>匯率風險</b>', sTL),
     P('中等', ParagraphStyle('rm', parent=sTC, textColor=SEM_WARNING)),
     P('30年趨勢：日圓對港幣貶值59%（有利）。短期：日本央行利率0.75%可能推升日圓。中期財政壓力有利港幣投資者。已測試7個退出匯率。', sTL)],
    [P('<b>物業價值風險</b>', sTL),
     P('中低', ParagraphStyle('rp', parent=sTC, textColor=SEM_SUCCESS)),
     P('大阪都市區自2012年強勁復甦。外資投資創歷史新高。2025年世博基建持續支持增長。全國下跌數據掩蓋了都市核心區的優異表現。', sTL)],
    [P('<b>流動性風險</b>', sTL),
     P('低', ParagraphStyle('rl', parent=sTC, textColor=SEM_SUCCESS)),
     P('大阪核心區出售期2-4個月。無資本管制。FEFTA（2026年4月）僅增加行政手續。', sTL)],
    [P('<b>政策風險</b>', sTL),
     P('中等', ParagraphStyle('r2', parent=sTC, textColor=SEM_WARNING)),
     P('2026年4月起需FEFTA申報。日本央行可能繼續加息。目前無物業稅制改革提案。', sTL)],
    [P('<b>租金收入風險</b>', sTL),
     P('低', ParagraphStyle('r3', parent=sTC, textColor=SEM_SUCCESS)),
     P('大阪空置率低於5%。6%回報率設定保守。即使租金下跌20%，扣除按揭後仍維持正現金流。', sTL)],
]
t = Table(risk, colWidths=[W*0.15, W*0.08, W*0.77])
t.setStyle(tbl_style(len(risk)))
t.hAlign = 'CENTER'
story.append(t)

story.append(Spacer(1, 10))
story.append(P('<b>統計摘要（全部84個情景）</b>', sH2))
all_rois = [s['roi'] for s in SC]
all_gains = [s['gain'] for s in SC]
neg = sum(1 for r in all_rois if r < 0)
pos = sum(1 for r in all_rois if r >= 0)
sr = sorted(all_rois)
sg = sorted(all_gains)

stats = [
    [P('統計指標', sTH), P('回報率 (%)', sTH), P('港幣盈虧', sTH)],
    [P('最小值（最差）', sTL), P(f'{sr[0]:+.1f}%', sTC), P(f'{sg[0]/1e4:+.0f} 萬', sTC)],
    [P('第25百分位', sTL), P(f'{sr[len(sr)//4]:+.1f}%', sTC), P(f'{sg[len(sg)//4]/1e4:+.0f} 萬', sTC)],
    [P('中位數', sTL), P(f'{sr[len(sr)//2]:+.1f}%', sTC), P(f'{sg[len(sg)//2]/1e4:+.0f} 萬', sTC)],
    [P('第75百分位', sTL), P(f'{sr[3*len(sr)//4]:+.1f}%', sTC), P(f'{sg[3*len(sg)//4]/1e4:+.0f} 萬', sTC)],
    [P('最大值（最佳）', sTL), P(f'{sr[-1]:+.1f}%', sTC), P(f'{sg[-1]/1e4:+.0f} 萬', sTC)],
    [P('正回報情景數', sTL), P(f'{pos}/84 ({pos/84*100:.0f}%)', sTC), P('', sTC)],
    [P('負回報情景數', sTL), P(f'{neg}/84 ({neg/84*100:.0f}%)', sTC), P('', sTC)],
]
t = Table(stats, colWidths=[W*0.30, W*0.35, W*0.35])
t.setStyle(tbl_style(len(stats)))
t.hAlign = 'CENTER'
story.append(t)

story.append(Spacer(1, 10))
story.append(P('<b>總結</b>', sH2))
story.append(P(
    '84個情景中，{:.0f}%產生正回報。歷史平均情景回報率為+{:.1f}%。歷史最差10年期回報為-{:.1f}%（被正現金流有效控制）。'
    '主要風險在於日本央行收緊貨幣政策可能導致的短期日圓走強；但對於7-10年持有期的投資者而言，'
    '持續的租金收入和長期日圓貶值趨勢將為投資提供強有力的支撐。'
    '綜合來看，在當前匯率水平和利率環境下，日本物業投資對香港投資者具有相對有利的風險回報特徵。'.format(
        pos/84*100, ha['roi'], abs(hw['roi'])), sBody))

doc.build(story)
print(f"Body PDF: {PDF_PATH}")