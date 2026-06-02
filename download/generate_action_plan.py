import sys, os
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import inch, cm, mm
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, 
    PageBreak, KeepTogether
)
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase.pdfmetrics import registerFontFamily

# Font Registration
pdfmetrics.registerFont(TTFont('SarasaMonoSC', '/usr/share/fonts/truetype/chinese/SarasaMonoSC-Regular.ttf'))
pdfmetrics.registerFont(TTFont('SarasaMonoSCBold', '/usr/share/fonts/truetype/chinese/SarasaMonoSC-Bold.ttf'))
pdfmetrics.registerFont(TTFont('LiberationSans', '/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf'))
pdfmetrics.registerFont(TTFont("DejaVuSans", '/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf'))
registerFontFamily('SarasaMonoSC', normal='SarasaMonoSC', bold='SarasaMonoSCBold')
registerFontFamily('LiberationSans', normal='LiberationSans', bold='LiberationSans')
registerFontFamily('DejaVuSans', normal='DejaVuSans', bold='DejaVuSans')

sys.path.insert(0, '/home/z/my-project/skills/pdf/scripts')
from pdf import install_font_fallback
install_font_fallback()

# Color Palette
ACCENT       = colors.HexColor('#542fc3')
TEXT_PRIMARY  = colors.HexColor('#232220')
TEXT_MUTED    = colors.HexColor('#827e75')
BG_SURFACE   = colors.HexColor('#e2ded8')
BG_PAGE      = colors.HexColor('#f4f3f2')

# Page Setup
page_w, page_h = A4
left_m = right_m = 1.0 * inch
top_m = bottom_m = 0.8 * inch
available_w = page_w - left_m - right_m

# Styles
CN = 'SarasaMonoSC'

title_style = ParagraphStyle(name='Title', fontName=CN, fontSize=24, leading=32, alignment=TA_CENTER, textColor=ACCENT, spaceBefore=6, spaceAfter=6)
subtitle_style = ParagraphStyle(name='Subtitle', fontName=CN, fontSize=13, leading=20, alignment=TA_CENTER, textColor=TEXT_MUTED, spaceBefore=0, spaceAfter=12, wordWrap='CJK')
h1_style = ParagraphStyle(name='H1', fontName=CN, fontSize=18, leading=26, textColor=ACCENT, spaceBefore=18, spaceAfter=10, wordWrap='CJK')
h2_style = ParagraphStyle(name='H2', fontName=CN, fontSize=14, leading=22, textColor=TEXT_PRIMARY, spaceBefore=14, spaceAfter=8, wordWrap='CJK')
h3_style = ParagraphStyle(name='H3', fontName=CN, fontSize=12, leading=18, textColor=ACCENT, spaceBefore=10, spaceAfter=6, wordWrap='CJK')
body_style = ParagraphStyle(name='Body', fontName=CN, fontSize=10.5, leading=18, alignment=TA_LEFT, textColor=TEXT_PRIMARY, wordWrap='CJK', spaceBefore=2, spaceAfter=4, firstLineIndent=21)
bullet_style = ParagraphStyle(name='Bullet', fontName=CN, fontSize=10.5, leading=17, alignment=TA_LEFT, textColor=TEXT_PRIMARY, wordWrap='CJK', leftIndent=20, spaceBefore=1, spaceAfter=1, bulletIndent=8)
header_cell_style = ParagraphStyle(name='HeaderCell', fontName=CN, fontSize=9.5, leading=14, alignment=TA_CENTER, textColor=colors.white, wordWrap='CJK')
cell_style = ParagraphStyle(name='Cell', fontName=CN, fontSize=9, leading=13, alignment=TA_CENTER, textColor=TEXT_PRIMARY, wordWrap='CJK')
cell_left_style = ParagraphStyle(name='CellLeft', fontName=CN, fontSize=9, leading=13, alignment=TA_LEFT, textColor=TEXT_PRIMARY, wordWrap='CJK')
caption_style = ParagraphStyle(name='Caption', fontName=CN, fontSize=9, leading=14, alignment=TA_CENTER, textColor=TEXT_MUTED, wordWrap='CJK', spaceBefore=3, spaceAfter=6)

def P(text, style=body_style):
    return Paragraph(text, style)
def H1(text):
    return Paragraph('<b>{}</b>'.format(text), h1_style)
def H2(text):
    return Paragraph('<b>{}</b>'.format(text), h2_style)
def H3(text):
    return Paragraph('<b>{}</b>'.format(text), h3_style)
def Bullet(text):
    return Paragraph('- ' + text, bullet_style)

def make_table(headers, rows, col_ratios=None):
    header_row = [Paragraph('<b>{}</b>'.format(h), header_cell_style) for h in headers]
    data = [header_row]
    for row in rows:
        data.append([Paragraph(str(c), cell_left_style) if i == 0 else Paragraph(str(c), cell_style) for i, c in enumerate(row)])
    if col_ratios:
        col_widths = [r * available_w for r in col_ratios]
    else:
        col_widths = [available_w / len(headers)] * len(headers)
    t = Table(data, colWidths=col_widths, hAlign='CENTER')
    style_cmds = [
        ('BACKGROUND', (0, 0), (-1, 0), ACCENT),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('GRID', (0, 0), (-1, -1), 0.5, TEXT_MUTED),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('LEFTPADDING', (0, 0), (-1, -1), 5),
        ('RIGHTPADDING', (0, 0), (-1, -1), 5),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]
    for i in range(1, len(data)):
        bg = colors.white if i % 2 == 1 else BG_SURFACE
        style_cmds.append(('BACKGROUND', (0, i), (-1, i), bg))
    t.setStyle(TableStyle(style_cmds))
    return t

# Build Document
output_path = '/home/z/my-project/download/MCLUB_Action_Plan_June2026.pdf'
doc = SimpleDocTemplate(output_path, pagesize=A4, leftMargin=left_m, rightMargin=right_m, topMargin=top_m, bottomMargin=bottom_m, title='MCLUB Action Plan - June 2026', author='Z.ai', creator='Z.ai')

story = []

# Title
story.append(Spacer(1, 30))
story.append(P('<b>MCLUB June 2026 Action Plan</b>', title_style))
story.append(P('百盛家族辦公室 2026年6月行動計劃', subtitle_style))
story.append(Spacer(1, 6))
story.append(P('PZC Group | MCLUB Family Office | Period: June 2 - June 30, 2026', subtitle_style))
story.append(Spacer(1, 18))

# Overview
story.append(H1('Overview'))
story.append(P('本行動計劃涵蓋2026年6月MCLUB四大核心任務，按週分解執行。四項任務分別為：(1) Beta CRM流動系統開發、(2) 短影片內容排期、(3) 保險經紀培訓會議、(4) 產品佣金率確認。每項任務均設有明確的里程碑和交付物，確保月底前全面完成。'))
story.append(Spacer(1, 6))

# Master Timeline
story.append(H2('Master Timeline'))
story.append(make_table(
    ['Week', 'Date', 'CRM System', 'Video Content', 'Broker Training', 'Commission Rate'],
    [
        ['W1', 'Jun 2-8', 'Requirements & Design', 'Content Planning', 'Broker Identification', 'Data Collection'],
        ['W2', 'Jun 9-15', 'Core Development', 'Filming Batch 1', 'Session 1 Meetings', 'Draft Rate Card'],
        ['W3', 'Jun 16-22', 'Testing & Iteration', 'Filming Batch 2 + Edit', 'Session 2 Meetings', 'Internal Review'],
        ['W4', 'Jun 23-30', 'Beta Launch', 'Publish & Schedule', 'Session 3 Seminars', 'Final Confirmation'],
    ],
    [0.07, 0.12, 0.22, 0.22, 0.22, 0.15]
))
story.append(P('Table 1: Master Timeline Overview', caption_style))
story.append(Spacer(1, 18))

# TASK 1: CRM
story.append(H1('Task 1: Beta CRM Mobile System'))
story.append(P('為MCLUB分銷商、內部員工和代理商建立Beta版CRM流動系統。系統需支援三種用戶角色，整合產品目錄、佣金追蹤、客戶管理和業績報表等核心功能。作為MCLUB會員制漏斗策略的技術基礎，CRM系統將成為由淺入深推進基金銷售的關鍵工具。'))
story.append(Spacer(1, 6))

story.append(H2('1.1 User Roles & Access'))
story.append(make_table(
    ['Role', 'Access Level', 'Key Functions', 'Priority'],
    [
        ['Distributor', 'Tier 3', 'Product catalog, commission tracking, lead submission, marketing materials', 'High'],
        ['Internal Staff', 'Tier 1 (Full)', 'All products, approve commission, reports, user management, pipeline tracking', 'Critical'],
        ['Agent', 'Tier 2', 'Assigned products, client tracking, commission view, seminar scheduling, training', 'High'],
    ],
    [0.15, 0.15, 0.55, 0.10]
))
story.append(P('Table 2: CRM User Roles', caption_style))
story.append(Spacer(1, 6))

story.append(H2('1.2 Weekly Breakdown'))
for week, title, bullets in [
    ('W1', 'Week 1 (Jun 2-8): Requirements & Design', [
        'Define functional requirements for all 3 user roles',
        'Design database schema: users, products, commissions, clients, leads, events',
        'Create wireframes for mobile UI (iOS + Android via React Native or Flutter)',
        'Map all 10 MCLUB products into product catalog structure',
        'Define commission calculation rules for self/agent/distributor tiers',
        'Deliverable: PRD document + wireframes + database schema'
    ]),
    ('W2', 'Week 2 (Jun 9-15): Core Development', [
        'Build authentication & role-based access control system',
        'Develop product catalog module with all 10 products',
        'Build commission tracking engine (3-tier rate structure)',
        'Develop client management & lead submission workflow',
        'Build basic dashboard for each user role',
        'Deliverable: Working alpha with core modules functional'
    ]),
    ('W3', 'Week 3 (Jun 16-22): Testing & Iteration', [
        'Internal QA testing with 3-5 staff members across all roles',
        'Fix critical bugs and UI issues',
        'Add reporting module (sales pipeline, commission summary, client activity)',
        'Integrate notification system (new leads, commission updates, event reminders)',
        'Performance optimization and security review',
        'Deliverable: Release candidate (RC1) ready for beta testing'
    ]),
    ('W4', 'Week 4 (Jun 23-30): Beta Launch & Onboarding', [
        'Deploy to staging environment for final review',
        'Onboard first batch of distributors and agents (10-15 users)',
        'Conduct onboarding training sessions (2 sessions, 1 hour each)',
        'Collect feedback and log issues for v1.1 iteration',
        'Document known issues and workarounds',
        'Deliverable: Beta system live with initial user base'
    ]),
]:
    story.append(H3(title))
    for b in bullets:
        story.append(Bullet(b))
story.append(Spacer(1, 18))

# TASK 2: Video Content
story.append(H1('Task 2: Short Video Content Schedule'))
story.append(P('制定跨平台短影片內容排期，覆蓋YouTube、B站、抖音、知乎和小紅書五大平台。需要與MCLUB內部不同產品和服務團隊協調，確保內容專業、合規且具吸引力。影片內容定位為「專業、客觀、有用」，以教育和資訊分享為主調，避免直接銷售語言。'))
story.append(Spacer(1, 6))

story.append(H2('2.1 Platform Strategy'))
story.append(make_table(
    ['Platform', 'Target Audience', 'Content Format', 'Frequency', 'Lead Product'],
    [
        ['YouTube', 'HK + International HNWI', 'Long-form (5-15 min)', '1/week', 'Trust, NPC Fund'],
        ['B站', 'Mainland professionals', 'Mid-form (3-8 min)', '2/week', 'Japan Property, AI'],
        ['抖音', 'Mass market', 'Short (30-90 sec)', '3-5/week', 'Japan Property, Health'],
        ['知乎', 'Educated professionals', 'Text + video (2-5 min)', '1/week', 'Trust, CRS, Tax'],
        ['小紅書', 'Female HNWI, lifestyle', 'Short (30-60 sec)', '2-3/week', 'Japan travel, Property'],
    ],
    [0.12, 0.20, 0.22, 0.14, 0.22]
))
story.append(P('Table 3: Platform Strategy', caption_style))
story.append(Spacer(1, 6))

story.append(H2('2.2 Weekly Content Plan'))
for week, title, bullets in [
    ('W1', 'Week 1: Planning & Coordination', [
        'Identify internal content owners for each product line',
        'Schedule filming sessions with product heads (Kenneth, Calvin, Damon)',
        'Create content briefs for first 10 videos',
        'Set up accounts and optimize profiles on all 5 platforms',
        'Deliverable: Content calendar + filming schedule + account setup complete'
    ]),
    ('W2', 'Week 2: Filming Batch 1 (Japan Property + Trust)', [
        'Film 3 Japan property videos (market overview, ROI data, visa pathway)',
        'Film 2 Trust & family office videos (why HK trust, CRS 2.0)',
        'Film 1 NPC Fund overview video',
        'Edit and review all Batch 1 content',
        'Deliverable: 6 edited videos ready for publishing'
    ]),
    ('W3', 'Week 3: Filming Batch 2 (Health + Secretary + AI)', [
        'Film 2 VFK health product videos (clinical evidence, Plan A/B/C)',
        'Film 2 Company Secretary service videos (compliance, SME financing)',
        'Film 2 MyPath AI concierge videos (demo, Japan travel tips)',
        'Publish Batch 1 videos across platforms with SEO-optimized titles',
        'Deliverable: 6 more videos + Batch 1 live on all platforms'
    ]),
    ('W4', 'Week 4: Publishing & Scheduling', [
        'Publish Batch 2 videos across all platforms',
        'Schedule content for July (auto-publish queue)',
        'Analyze first-week performance metrics',
        'Adjust content strategy based on data',
        'Deliverable: All June content published + July content scheduled'
    ]),
]:
    story.append(H3(title))
    for b in bullets:
        story.append(Bullet(b))

story.append(Spacer(1, 6))
story.append(H2('2.3 Internal Coordination Matrix'))
story.append(make_table(
    ['Product/Service', 'Content Owner', 'Video Topics', 'Filming Date'],
    [
        ['Japan Property', 'Kenneth + Japan Team', 'Market overview, ROI, visa, Osaka walkthrough', 'Jun 10-11'],
        ['HK Trust & Family Office', 'Kenneth Mak', 'Why HK trust, CRS 2.0, wealth structure', 'Jun 12'],
        ['NPC Fund', 'Kenneth + Jone Portman', 'Fund overview, portfolio, dual return, SFC', 'Jun 13'],
        ['VFK Health Products', 'Calvin Chu', 'Clinical evidence, Plan A/B/C, opportunity', 'Jun 17-18'],
        ['Company Secretary', 'Damon Lewis', 'Compliance, SME financing, BUD fund', 'Jun 19'],
        ['MyPath AI Concierge', 'MyPath Team', 'App demo, Japan travel tips, O2O2O', 'Jun 20'],
        ['Sao Tome Citizenship', 'Kenneth Mak', 'Non-CRS, passport benefits, Dubai bundle', 'Jun 24'],
    ],
    [0.20, 0.18, 0.40, 0.14]
))
story.append(P('Table 4: Internal Coordination Matrix', caption_style))
story.append(Spacer(1, 18))

# TASK 3: Broker Training
story.append(H1('Task 3: Insurance Broker Training Sessions'))
story.append(P('與保險經紀合作進行三層培訓會議，採用由淺入深的漏斗式推進策略。Session 1向經紀負責人介紹產品，爭取內部培訓機會；Session 2向團隊領袖深入介紹並確認佣金率，爭取客戶研討會機會；Session 3直接面向客戶舉辦研討會。'))
story.append(Spacer(1, 6))

story.append(H2('3.1 Three-Session Model'))
story.append(make_table(
    ['Session', 'Audience', 'Objective', 'Key Content', 'Target Outcome'],
    [
        ['Session 1', 'Broker Head', 'Get internal training access', 'MCLUB overview, product highlights, commission teaser, partnership value', 'Signed LOI for internal training'],
        ['Session 2', 'Team Leaders', 'Confirm commission, get client seminar access', 'Deep product dive, ROI, case studies, commission structure, marketing support', 'Commission confirmed + seminar scheduled'],
        ['Session 3', 'Clients', 'Direct client conversion', 'Investment seminar, Q&A, success stories, exclusive offers, on-site consultation', 'Signed LOI / deposit from clients'],
    ],
    [0.10, 0.12, 0.18, 0.34, 0.20]
))
story.append(P('Table 5: Three-Session Training Model', caption_style))
story.append(Spacer(1, 6))

story.append(H2('3.2 Broker Pipeline - June Schedule'))
story.append(make_table(
    ['Broker Partner', 'Session 1', 'Session 2', 'Session 3', 'Product Focus'],
    [
        ['Broker A (Priority 1)', 'Jun 9-10', 'Jun 16-17', 'Jun 25', 'Japan Property + Trust'],
        ['Broker B (Priority 2)', 'Jun 11-12', 'Jun 18-19', 'Jun 27', 'NPC Fund + Trust'],
        ['Broker C (Priority 3)', 'Jun 13', 'Jun 20', 'Jun 30', 'Health + Secretary'],
        ['Broker D (Pipeline)', 'Jun 24', 'Jul', 'Jul', 'TBD'],
    ],
    [0.20, 0.14, 0.14, 0.12, 0.30]
))
story.append(P('Table 6: Broker Training Pipeline', caption_style))
story.append(Spacer(1, 6))

story.append(H2('3.3 Session Preparation Checklist'))
story.append(H3('Session 1 Preparation'))
for b in ['Prepare MCLUB overview deck (20 slides max)', 'Print product summary cards for all 10 products', 'Prepare commission teaser (range only)', 'Bring partnership agreement template', 'Prepare success stories / case studies (anonymized)']:
    story.append(Bullet(b))

story.append(H3('Session 2 Preparation'))
for b in ['Prepare detailed product presentations for focus products', 'Prepare FULL commission rate card (must be confirmed before this session)', 'Prepare marketing support package overview', 'Bring client seminar proposal (venue, agenda, co-branding)', 'Prepare ROI calculator for client-facing scenarios']:
    story.append(Bullet(b))

story.append(H3('Session 3 Preparation'))
for b in ['Book venue (MCLUB TST Clubhouse or hotel meeting room)', 'Prepare client-facing seminar materials', 'Arrange product demonstration (MyPath AI, trust structure diagram)', 'Prepare exclusive offers for attendees', 'Assign staff for on-site consultation and lead capture']:
    story.append(Bullet(b))
story.append(Spacer(1, 18))

# TASK 4: Commission Rate
story.append(H1('Task 4: Commission Rate Confirmation'))
story.append(P('確認所有MCLUB產品的三層佣金結構：自有銷售（Self）、代理商（Agent）和分銷商（Distributor）。佣金率必須在6月15日前完成草案，確保Session 2培訓會議時可以向團隊領袖提供明確的佣金方案。這是推進保險經紀合作的關鍵前提。'))
story.append(Spacer(1, 6))

story.append(H2('4.1 Three-Tier Commission Structure'))
story.append(make_table(
    ['Tier', 'Definition', 'Typical Rate Range', 'Payment Timing'],
    [
        ['Self', 'MCLUB direct sales', 'Highest margin (full commission pool)', 'Upon deal completion'],
        ['Agent', 'Independent agent referring clients', 'Moderate (30-50% of pool)', 'Monthly settlement'],
        ['Distributor', 'Organizations with sales teams', 'Lower per-unit + volume bonus (20-40%)', 'Quarterly settlement'],
    ],
    [0.12, 0.28, 0.32, 0.20]
))
story.append(P('Table 7: Three-Tier Commission Structure', caption_style))
story.append(Spacer(1, 6))

story.append(H2('4.2 Product Commission Rate Card (To Be Confirmed)'))
story.append(make_table(
    ['Product', 'Self', 'Agent', 'Distributor', 'Basis'],
    [
        ['1. Core Business', 'TBD', 'TBD', 'TBD', 'Membership fee %'],
        ['2. Japan Property', 'TBD', 'TBD', 'TBD', 'Property value %'],
        ['3. Trust & Family Office', 'TBD', 'TBD', 'TBD', 'Setup fee %'],
        ['4. NPC Fund', 'TBD', 'TBD', 'TBD', 'AUM / subscription %'],
        ['5. MyPath AI', 'TBD', 'TBD', 'TBD', 'App subscription %'],
        ['6. Health Products', 'TBD', 'TBD', 'TBD', 'Product price %'],
        ['7. Bonus Plan (4-Level)', 'TBD', 'TBD', 'TBD', 'BV-based %'],
        ['8. Sao Tome Citizenship', 'TBD', 'TBD', 'TBD', 'Investment amount %'],
        ['9. Company Secretary', 'TBD', 'TBD', 'TBD', 'Service fee %'],
    ],
    [0.28, 0.12, 0.12, 0.16, 0.22]
))
story.append(P('Table 8: Product Commission Rate Card (Draft)', caption_style))
story.append(Spacer(1, 6))

story.append(H2('4.3 Rate Confirmation Timeline'))
story.append(make_table(
    ['Date', 'Action', 'Responsible', 'Deliverable'],
    [
        ['Jun 2-4', 'Collect all product cost structures and margin data', 'Kenneth + Product Heads', 'Cost structure spreadsheet'],
        ['Jun 5-6', 'Draft initial rate card with 3 tiers', 'Kenneth + Finance', 'Draft rate card v0.1'],
        ['Jun 9-10', 'Internal review with legal and compliance', 'Kenneth + Legal', 'Compliance-cleared v0.2'],
        ['Jun 11-13', 'Negotiate and finalize with key partners', 'Kenneth', 'Rate card v1.0 confirmed'],
        ['Jun 15', 'Final sign-off and CRM integration', 'Kenneth', 'Approved rate card + CRM update'],
        ['Jun 16+', 'Apply in Session 2 broker meetings', 'All sales team', 'Commission confirmed with brokers'],
    ],
    [0.12, 0.35, 0.22, 0.25]
))
story.append(P('Table 9: Rate Confirmation Timeline', caption_style))
story.append(Spacer(1, 18))

# KPIs
story.append(H1('June KPI Targets'))
story.append(make_table(
    ['Task', 'KPI', 'Target', 'Measurement'],
    [
        ['CRM System', 'Beta launch', 'Jun 30', 'System live with 10+ beta users'],
        ['CRM System', 'User roles functional', '3/3 roles', 'Distributor + Agent + Staff all operational'],
        ['CRM System', 'Commission engine', 'All 9 products', 'Rate card integrated and calculating'],
        ['Video Content', 'Videos produced', '12+ videos', '6 Batch 1 + 6 Batch 2 edited'],
        ['Video Content', 'Videos published', '8+ videos', 'Published across 5 platforms'],
        ['Video Content', 'Platform accounts', '5/5 active', 'All accounts set up with profiles'],
        ['Broker Training', 'Session 1 completed', '3+ brokers', 'At least 3 brokers through Session 1'],
        ['Broker Training', 'Session 2 completed', '2+ brokers', 'At least 2 through Session 2'],
        ['Broker Training', 'Session 3 completed', '1+ broker', 'At least 1 client seminar held'],
        ['Commission Rate', 'Rate card v1.0', 'By Jun 15', 'All 9 products with 3-tier rates'],
        ['Commission Rate', 'CRM integration', 'By Jun 16', 'Rate card live in CRM system'],
    ],
    [0.16, 0.22, 0.16, 0.38]
))
story.append(P('Table 10: June KPI Targets', caption_style))
story.append(Spacer(1, 18))

# Key Risks
story.append(H1('Key Risks & Mitigations'))
story.append(make_table(
    ['Risk', 'Impact', 'Probability', 'Mitigation'],
    [
        ['CRM development delays', 'High', 'Medium', 'Prioritize MVP only; defer advanced reporting to v1.1'],
        ['Product heads unavailable for filming', 'Medium', 'High', 'Book filming 2 weeks ahead; prepare backup content'],
        ['Broker Session 1 fails to convert', 'High', 'Medium', 'Target 4+ brokers to ensure pipeline; offer trial membership'],
        ['Commission rate not finalized by Jun 15', 'Critical', 'Medium', 'Escalate to Kenneth; start legal review in parallel with drafting'],
        ['Platform account approval delays', 'Low', 'Medium', 'Set up all accounts in Week 1; use personal accounts as backup'],
        ['Low video engagement on new accounts', 'Medium', 'High', 'SEO optimization; leverage broker networks; consider paid promotion'],
    ],
    [0.28, 0.10, 0.12, 0.42]
))
story.append(P('Table 11: Key Risks & Mitigations', caption_style))

# Build
doc.build(story)
print("PDF generated: " + output_path)
