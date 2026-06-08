#!/usr/bin/env python3
"""MCLUB CRM System Framework - PDF Report Generator"""

import os, sys, hashlib
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import inch, cm
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak, KeepTogether, CondPageBreak, Image
)
from reportlab.platypus.tableofcontents import TableOfContents
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase.pdfmetrics import registerFontFamily

# ━━ Color Palette (cascade) ━━
PAGE_BG       = colors.HexColor('#f5f4f3')
SECTION_BG    = colors.HexColor('#eae9e6')
CARD_BG       = colors.HexColor('#edece8')
TABLE_STRIPE  = colors.HexColor('#ededeb')
HEADER_FILL   = colors.HexColor('#776c4b')
COVER_BLOCK   = colors.HexColor('#706649')
BORDER        = colors.HexColor('#d0cbbe')
ICON          = colors.HexColor('#7d6b35')
ACCENT        = colors.HexColor('#2f8cab')
ACCENT_2      = colors.HexColor('#3ab13a')
TEXT_PRIMARY   = colors.HexColor('#232220')
TEXT_MUTED     = colors.HexColor('#89867f')
SEM_SUCCESS   = colors.HexColor('#42965e')
SEM_WARNING   = colors.HexColor('#a28244')
SEM_ERROR     = colors.HexColor('#884a44')
SEM_INFO      = colors.HexColor('#456a8e')

TABLE_HEADER_COLOR = ACCENT
TABLE_HEADER_TEXT  = colors.white
TABLE_ROW_EVEN     = colors.white
TABLE_ROW_ODD      = TABLE_STRIPE

# ━━ Font Registration ━━
pdfmetrics.registerFont(TTFont('NotoSerifSC', '/usr/share/fonts/truetype/noto-serif-sc/NotoSerifSC-Bold.ttf'))
pdfmetrics.registerFont(TTFont('NotoSerifSCRegular', '/usr/share/fonts/truetype/noto-serif-sc/NotoSerifSC-Regular.ttf'))
pdfmetrics.registerFont(TTFont('SarasaMonoSC', '/usr/share/fonts/truetype/chinese/SarasaMonoSC-Regular.ttf'))
pdfmetrics.registerFont(TTFont('SarasaMonoSCBold', '/usr/share/fonts/truetype/chinese/SarasaMonoSC-Bold.ttf'))
pdfmetrics.registerFont(TTFont('WenQuanYi', '/usr/share/fonts/truetype/wqy/wqy-zenhei.ttc'))
pdfmetrics.registerFont(TTFont('DejaVuSans', '/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf'))

registerFontFamily('NotoSerifSC', normal='NotoSerifSCRegular', bold='NotoSerifSC')
registerFontFamily('SarasaMonoSC', normal='SarasaMonoSC', bold='SarasaMonoSCBold')
registerFontFamily('WenQuanYi', normal='WenQuanYi', bold='WenQuanYi')
registerFontFamily('DejaVuSans', normal='DejaVuSans', bold='DejaVuSans')

# Install font fallback for mixed CJK/Latin
PDF_SKILL_DIR = "/home/z/my-project/skills/pdf"
_scripts = os.path.join(PDF_SKILL_DIR, "scripts")
if _scripts not in sys.path:
    sys.path.insert(0, _scripts)
from pdf import install_font_fallback
install_font_fallback()

# ━━ Page Setup ━━
PAGE_W, PAGE_H = A4
LEFT_MARGIN = 1.0 * inch
RIGHT_MARGIN = 1.0 * inch
TOP_MARGIN = 0.8 * inch
BOTTOM_MARGIN = 0.8 * inch
AVAILABLE_WIDTH = PAGE_W - LEFT_MARGIN - RIGHT_MARGIN

# ━━ Styles ━━
styles = getSampleStyleSheet()

h1_style = ParagraphStyle(
    name='H1Custom', fontName='NotoSerifSC', fontSize=20, leading=28,
    textColor=ACCENT, spaceBefore=18, spaceAfter=12, wordWrap='CJK'
)
h2_style = ParagraphStyle(
    name='H2Custom', fontName='NotoSerifSC', fontSize=15, leading=22,
    textColor=HEADER_FILL, spaceBefore=14, spaceAfter=8, wordWrap='CJK'
)
h3_style = ParagraphStyle(
    name='H3Custom', fontName='NotoSerifSC', fontSize=12, leading=18,
    textColor=TEXT_PRIMARY, spaceBefore=10, spaceAfter=6, wordWrap='CJK'
)
body_style = ParagraphStyle(
    name='BodyCustom', fontName='WenQuanYi', fontSize=10.5, leading=18,
    textColor=TEXT_PRIMARY, alignment=TA_LEFT, wordWrap='CJK',
    spaceBefore=0, spaceAfter=6, firstLineIndent=21
)
body_no_indent = ParagraphStyle(
    name='BodyNoIndent', fontName='WenQuanYi', fontSize=10.5, leading=18,
    textColor=TEXT_PRIMARY, alignment=TA_LEFT, wordWrap='CJK',
    spaceBefore=0, spaceAfter=6
)
bullet_style = ParagraphStyle(
    name='BulletCustom', fontName='WenQuanYi', fontSize=10.5, leading=18,
    textColor=TEXT_PRIMARY, alignment=TA_LEFT, wordWrap='CJK',
    leftIndent=24, spaceBefore=2, spaceAfter=2
)
code_style = ParagraphStyle(
    name='CodeCustom', fontName='SarasaMonoSC', fontSize=9, leading=14,
    textColor=TEXT_MUTED, alignment=TA_LEFT, wordWrap='CJK',
    leftIndent=12, spaceBefore=4, spaceAfter=4,
    backColor=colors.HexColor('#f5f5f3')
)
caption_style = ParagraphStyle(
    name='CaptionCustom', fontName='WenQuanYi', fontSize=9, leading=14,
    textColor=TEXT_MUTED, alignment=TA_CENTER, wordWrap='CJK',
    spaceBefore=3, spaceAfter=6
)
toc_h1_style = ParagraphStyle(
    name='TOCH1', fontName='NotoSerifSC', fontSize=13, leftIndent=20, leading=22
)
toc_h2_style = ParagraphStyle(
    name='TOCH2', fontName='WenQuanYi', fontSize=11, leftIndent=40, leading=18
)
# Table styles
th_style = ParagraphStyle(
    name='THStyle', fontName='WenQuanYi', fontSize=10, leading=15,
    textColor=colors.white, alignment=TA_CENTER, wordWrap='CJK'
)
td_style = ParagraphStyle(
    name='TDStyle', fontName='WenQuanYi', fontSize=10, leading=15,
    textColor=TEXT_PRIMARY, alignment=TA_LEFT, wordWrap='CJK'
)
td_center = ParagraphStyle(
    name='TDCenter', fontName='WenQuanYi', fontSize=10, leading=15,
    textColor=TEXT_PRIMARY, alignment=TA_CENTER, wordWrap='CJK'
)

# ━━ Orphan Prevention ━━
H1_ORPHAN_THRESHOLD = (PAGE_H - TOP_MARGIN - BOTTOM_MARGIN) * 0.15

# ━━ TocDocTemplate ━━
class TocDocTemplate(SimpleDocTemplate):
    def afterFlowable(self, flowable):
        if hasattr(flowable, 'bookmark_name'):
            level = getattr(flowable, 'bookmark_level', 0)
            text = getattr(flowable, 'bookmark_text', '')
            key = getattr(flowable, 'bookmark_key', '')
            self.notify('TOCEntry', (level, text, self.page, key))

def add_heading(text, style, level=0):
    key = 'h_%s' % hashlib.md5(text.encode()).hexdigest()[:8]
    p = Paragraph('<a name="%s"/><b>%s</b>' % (key, text), style)
    p.bookmark_name = text
    p.bookmark_level = level
    p.bookmark_text = text
    p.bookmark_key = key
    return p

def add_major_section(text, style):
    return [
        CondPageBreak(H1_ORPHAN_THRESHOLD),
        add_heading(text, style, level=0),
    ]

def make_table(data, col_ratios, caption_text=None):
    """Create a styled table with proportional column widths."""
    col_widths = [r * AVAILABLE_WIDTH for r in col_ratios]
    # Wrap all cells in Paragraph
    wrapped = []
    for i, row in enumerate(data):
        wrapped_row = []
        for cell in row:
            if isinstance(cell, Paragraph):
                wrapped_row.append(cell)
            elif i == 0:
                wrapped_row.append(Paragraph('<b>%s</b>' % cell, th_style))
            else:
                wrapped_row.append(Paragraph(str(cell), td_style))
        wrapped.append(wrapped_row)

    t = Table(wrapped, colWidths=col_widths, hAlign='CENTER')
    style_cmds = [
        ('BACKGROUND', (0, 0), (-1, 0), TABLE_HEADER_COLOR),
        ('TEXTCOLOR', (0, 0), (-1, 0), TABLE_HEADER_TEXT),
        ('GRID', (0, 0), (-1, -1), 0.5, BORDER),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ]
    for row_idx in range(1, len(wrapped)):
        bg = TABLE_ROW_ODD if row_idx % 2 == 0 else TABLE_ROW_EVEN
        style_cmds.append(('BACKGROUND', (0, row_idx), (-1, row_idx), bg))
    t.setStyle(TableStyle(style_cmds))

    elements = [Spacer(1, 18), t]
    if caption_text:
        elements.append(Spacer(1, 6))
        elements.append(Paragraph(caption_text, caption_style))
    elements.append(Spacer(1, 18))
    return elements

def make_code_block(lines):
    """Create a code block from list of strings."""
    text = '<br/>'.join(lines)
    return Paragraph(text, code_style)

# ━━ Build Story ━━
story = []

# --- TOC ---
story.append(Paragraph('<b>Table of Contents</b>', ParagraphStyle(
    name='TOCTitle', fontName='NotoSerifSC', fontSize=22, leading=30,
    textColor=ACCENT, spaceBefore=12, spaceAfter=18, alignment=TA_CENTER
)))
toc = TableOfContents()
toc.levelStyles = [toc_h1_style, toc_h2_style]
story.append(toc)
story.append(PageBreak())

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# SECTION 1: System Overview
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
story.extend(add_major_section('System Overview', h1_style))

story.append(Paragraph(
    'MCLUB CRM (Customer Relationship Management) system is a multi-role family office CRM platform designed and developed for Park Zeman Group. The system integrates client management, order settlement (also known as revenue sharing or commission splitting), commission tracking, and event management into a unified digital platform. It serves as the operational backbone for the MCLUB brand, enabling efficient coordination among staff, SME partners, agents, and end users.',
    body_style
))
story.append(Paragraph(
    'The platform is built on a modern technology stack featuring Next.js 16 with React 19 on the frontend, Prisma ORM with SQLite on the backend, and Bun as the JavaScript runtime. The system is deployed behind a Caddy reverse proxy and managed via PM2 process manager, ensuring high availability and smooth operation. The entire application follows a full-stack TypeScript architecture, enabling type safety from database schema to UI components.',
    body_style
))
story.append(Paragraph(
    'At its core, the MCLUB CRM implements a sophisticated multi-tenant role-based access control system with four distinct user roles: MCLUB Staff (platform administrators), SME Owners (business partners who list products), Agents (referral partners who earn commissions), and End Users (customers who purchase products and attend events). Each role has a tailored dashboard and feature set, ensuring that users only see relevant information and can perform actions appropriate to their permission level.',
    body_style
))

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# SECTION 2: Technology Stack
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
story.extend(add_major_section('Technology Stack', h1_style))

story.append(Paragraph(
    'The MCLUB CRM system leverages a carefully selected technology stack that balances developer productivity, performance, and maintainability. Each technology choice was made to support the specific requirements of a multi-role CRM system with real-time data operations, complex business logic for revenue sharing, and a responsive user interface.',
    body_style
))

tech_data = [
    ['Layer', 'Technology', 'Purpose'],
    ['Frontend Framework', 'Next.js 16 + React 19', 'Server-side rendering, API routes, routing'],
    ['UI Components', 'shadcn/ui + Radix UI', 'Accessible, customizable component library'],
    ['Styling', 'Tailwind CSS 4', 'Utility-first CSS framework for rapid UI development'],
    ['State Management', 'Zustand', 'Lightweight client-side state management'],
    ['Data Visualization', 'Recharts', 'Chart library for dashboards and reports'],
    ['API Layer', 'Next.js App Router', 'RESTful API endpoints with route handlers'],
    ['ORM', 'Prisma v6', 'Type-safe database access and schema management'],
    ['Database', 'SQLite', 'Lightweight embedded database for data persistence'],
    ['Runtime', 'Bun', 'High-performance JavaScript/TypeScript runtime'],
    ['Process Manager', 'PM2', 'Production process management and monitoring'],
    ['Reverse Proxy', 'Caddy (port 81)', 'Automatic HTTPS, reverse proxy to port 3000'],
    ['Icons', 'Lucide Icons', 'Consistent icon set across the application'],
]
story.extend(make_table(tech_data, [0.22, 0.33, 0.45], 'Table 1: Technology Stack Overview'))

story.append(Paragraph(
    'The choice of Next.js 16 as the full-stack framework provides significant advantages: server-side rendering for fast initial page loads, built-in API routes that eliminate the need for a separate backend service, and the App Router for intuitive file-based routing. Combined with Prisma ORM, the system achieves end-to-end type safety from database queries to React component props, reducing runtime errors and improving developer confidence during feature development.',
    body_style
))

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# SECTION 3: Data Models
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
story.extend(add_major_section('Data Models', h1_style))

story.append(Paragraph(
    'The MCLUB CRM system is built on nine core data models defined in the Prisma schema. These models form the foundation of the entire application, representing the key business entities and their relationships. The data model design follows a relational approach with clear foreign key references, ensuring data integrity and enabling complex queries across related entities.',
    body_style
))

story.append(add_heading('Core Models and Relationships', h2_style))

model_data = [
    ['Model', 'Description', 'Key Relationships'],
    ['User', 'System users with 4 role types', 'User creates Clients, User places Orders'],
    ['Client', 'SME/Agent client records', 'Client has TimelineEvents, belongs to User'],
    ['Product', 'Products listed by SME Owners', 'Product appears in Orders'],
    ['Order', 'Purchase orders with settlement', 'Order links to User, Product, and Client'],
    ['Commission', 'Agent commission tracking', 'Commission belongs to Agent (User)'],
    ['ClubEvent', 'Events with lifecycle management', 'Event has Attendees, Tasks, BudgetItems'],
    ['EventAttendee', 'RSVP and check-in records', 'Attendee belongs to ClubEvent and User'],
    ['EventTask', 'Event task management', 'Task belongs to ClubEvent'],
    ['EventBudgetItem', 'Event budget line items', 'BudgetItem belongs to ClubEvent'],
    ['TimelineEvent', 'Client activity timeline log', 'TimelineEvent belongs to Client'],
]
story.extend(make_table(model_data, [0.18, 0.37, 0.45], 'Table 2: Core Data Models'))

story.append(add_heading('User Role System', h2_style))

story.append(Paragraph(
    'The User model implements a role-based access control system with four distinct roles, each with specific capabilities and access permissions. This design ensures that every user interacts with the system through a role-appropriate lens, preventing unauthorized access while maintaining operational efficiency.',
    body_style
))

role_data = [
    ['Role', 'Email', 'Primary Capabilities'],
    ['MCLUB_STAFF', 'kenneth@parkzeman.com', 'Full admin: clients, orders, products, commissions, events, settlement'],
    ['SME_OWNER', 'calvin@mclub.com', 'Product listing, income tracking, client management'],
    ['AGENT', 'agent@mclub.com', 'Client referrals, commission management'],
    ['END_USER', 'user@mclub.com', 'Purchase history, event registration'],
]
story.extend(make_table(role_data, [0.17, 0.30, 0.53], 'Table 3: User Roles and Permissions'))

story.append(Paragraph(
    'Each role has a dedicated dashboard that surfaces the most relevant metrics and actions. MCLUB Staff users see a comprehensive overview of all system activity, including pending settlements, event RSVPs, and commission payouts. SME Owners focus on product performance and revenue metrics, while Agents track their referral pipeline and earned commissions. End Users have a simplified view showing their purchase history and upcoming events.',
    body_style
))

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# SECTION 4: API Architecture
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
story.extend(add_major_section('API Architecture', h1_style))

story.append(Paragraph(
    'The MCLUB CRM backend is implemented as a set of Next.js App Router API route handlers. Each route follows RESTful conventions with role-based access control middleware that validates the authenticated user before processing any request. The API layer handles all business logic, data validation, and database operations through Prisma ORM.',
    body_style
))

story.append(add_heading('Authentication Endpoints', h2_style))

auth_data = [
    ['Endpoint', 'Method', 'Description'],
    ['/api/auth/login', 'POST', 'User authentication with email and password, returns JWT token'],
    ['/api/auth/profile', 'GET', 'Retrieve current authenticated user profile and role'],
]
story.extend(make_table(auth_data, [0.30, 0.12, 0.58], 'Table 4: Authentication API'))

story.append(add_heading('Dashboard Endpoint', h2_style))

story.append(Paragraph(
    'The dashboard API endpoint provides role-specific aggregated data for each user type. When a user accesses their dashboard, the system queries and computes relevant metrics based on the user role, returning tailored statistics such as total clients, revenue figures, commission totals, or upcoming events. This design eliminates the need for multiple dashboard API calls, reducing frontend complexity and improving page load performance.',
    body_style
))

dash_data = [
    ['Endpoint', 'Method', 'Description'],
    ['/api/dashboard/[role]', 'GET', 'Returns role-based dashboard data (aggregated metrics)'],
]
story.extend(make_table(dash_data, [0.30, 0.12, 0.58], 'Table 5: Dashboard API'))

story.append(add_heading('Core Business Endpoints', h2_style))

biz_data = [
    ['Endpoint', 'Methods', 'Key Features'],
    ['/api/clients', 'GET, POST, PUT, DELETE', 'CRUD for client records with membership tier tracking'],
    ['/api/orders', 'GET, POST, PUT, DELETE', 'CRUD for orders, includes settlement (revenue sharing) operation'],
    ['/api/products', 'GET, POST, PUT, DELETE', 'CRUD for product catalog managed by SME Owners'],
    ['/api/commissions', 'GET, POST, PUT, DELETE', 'CRUD for agent commission records and payout tracking'],
    ['/api/events', 'GET, POST, PUT, DELETE', 'CRUD plus RSVP, check-in, tasks, and budget management'],
]
story.extend(make_table(biz_data, [0.22, 0.22, 0.56], 'Table 6: Core Business API Endpoints'))

story.append(Paragraph(
    'The API layer implements comprehensive error handling with consistent response formats. All mutation endpoints validate input data against schema constraints before processing, and the system maintains an audit trail through the TimelineEvent model, which automatically records significant client interactions. The settlement operation on the Orders endpoint is particularly critical, as it triggers the revenue distribution logic that splits order payments among agents, SME owners, and the MCLUB platform according to predefined percentage allocations.',
    body_style
))

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# SECTION 5: Frontend Architecture
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
story.extend(add_major_section('Frontend Architecture', h1_style))

story.append(Paragraph(
    'The MCLUB CRM frontend follows a role-based routing architecture where each user type has its own route prefix and dedicated set of pages. This approach provides clear separation of concerns and ensures that the UI can be tailored precisely to each role workflow. The application uses Next.js App Router with layout components that enforce role-specific navigation and sidebar menus.',
    body_style
))

story.append(add_heading('MCLUB Staff Routes', h2_style))

mclub_routes = [
    ['Route', 'Description'],
    ['/mclub-admin/dashboard', 'Admin dashboard with system-wide metrics and KPIs'],
    ['/mclub-admin/clients', 'Client management with search, filter, and CRUD operations'],
    ['/mclub-admin/orders', 'Order management with settlement workflow'],
    ['/mclub-admin/products', 'Product catalog management across all SME partners'],
    ['/mclub-admin/commissions', 'Commission tracking and payout management'],
    ['/mclub-admin/events/*', 'Event management with lifecycle controls'],
]
story.extend(make_table(mclub_routes, [0.38, 0.62], 'Table 7: MCLUB Staff Frontend Routes'))

story.append(add_heading('SME Owner Routes', h2_style))

sme_routes = [
    ['Route', 'Description'],
    ['/sme-owner/dashboard', 'SME dashboard with revenue and product performance metrics'],
    ['/sme-owner/products', 'Product management for SME listings'],
    ['/sme-owner/orders', 'Order tracking for SME products'],
]
story.extend(make_table(sme_routes, [0.38, 0.62], 'Table 8: SME Owner Frontend Routes'))

story.append(add_heading('Agent Routes', h2_style))

agent_routes = [
    ['Route', 'Description'],
    ['/agent/dashboard', 'Agent dashboard with referral pipeline and commission summary'],
    ['/agent/clients', 'Client referral management'],
    ['/agent/commissions', 'Commission view and payout history'],
]
story.extend(make_table(agent_routes, [0.38, 0.62], 'Table 9: Agent Frontend Routes'))

story.append(add_heading('End User Routes', h2_style))

user_routes = [
    ['Route', 'Description'],
    ['/user/dashboard', 'User dashboard with purchase history and event calendar'],
    ['/user/orders', 'Purchase history and order details'],
    ['/user/events', 'Event listing with RSVP functionality'],
]
story.extend(make_table(user_routes, [0.38, 0.62], 'Table 10: End User Frontend Routes'))

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# SECTION 6: Core Business Flows
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
story.extend(add_major_section('Core Business Flows', h1_style))

story.append(Paragraph(
    'The MCLUB CRM system implements several interconnected business processes that form the operational backbone of the platform. Understanding these flows is essential for grasping how the system creates value for all stakeholders and ensures transparent, automated revenue distribution.',
    body_style
))

story.append(add_heading('Settlement (Revenue Sharing) Flow', h2_style))

story.append(Paragraph(
    'The settlement flow is the most critical business process in the MCLUB CRM system. It implements an automated revenue sharing mechanism that distributes order payments among three parties: the Agent who referred the client, the SME Owner who provides the product, and the MCLUB platform itself. This multi-party distribution ensures that every transaction is transparently tracked and that all stakeholders receive their entitled share without manual intervention.',
    body_style
))

story.append(Paragraph(
    'The flow begins when an Agent refers a client to the platform. The client then purchases a product listed by an SME Owner, generating an Order record. Once the order is confirmed, the settlement process is triggered, which calculates the distribution based on predefined percentage allocations. The Agent receives their commission percentage, the SME Owner receives their revenue share, and the MCLUB platform retains its service fee. All distributions are recorded in the Commission model for audit and reporting purposes.',
    body_style
))

settle_data = [
    ['Step', 'Actor', 'Action', 'System Effect'],
    ['1', 'Agent', 'Refers a client to MCLUB', 'Client record linked to Agent'],
    ['2', 'End User', 'Purchases a product', 'Order record created with status Pending'],
    ['3', 'MCLUB Staff', 'Confirms the order', 'Order status changes to Confirmed'],
    ['4', 'System', 'Executes settlement', 'Revenue split calculated and recorded'],
    ['5', 'System', 'Distributes shares', 'Agent commission, SME revenue, MCLUB fee allocated'],
]
story.extend(make_table(settle_data, [0.08, 0.14, 0.30, 0.48], 'Table 11: Settlement Flow Steps'))

story.append(add_heading('Event Lifecycle Flow', h2_style))

story.append(Paragraph(
    'The event management module implements a complete lifecycle for club events, from initial drafting through to completion. Each event progresses through five distinct states, with specific actions available at each stage. This structured approach ensures that events are properly planned, promoted, and executed, with full traceability of attendee engagement.',
    body_style
))

event_data = [
    ['State', 'Description', 'Available Actions'],
    ['DRAFT', 'Event is being planned, not visible to users', 'Edit details, add tasks and budget items'],
    ['PUBLISHED', 'Event is live and visible to all users', 'Users can view event details and RSVP'],
    ['RSVP', 'Registration phase is active', 'Attendees confirm attendance, track RSVP count'],
    ['CHECKIN', 'Event is happening, check-in is active', 'Staff can check in attendees, track attendance'],
    ['COMPLETED', 'Event has concluded', 'View attendance report, budget actuals, feedback'],
]
story.extend(make_table(event_data, [0.15, 0.38, 0.47], 'Table 12: Event Lifecycle States'))

story.append(Paragraph(
    'The event lifecycle is managed through dedicated API endpoints that enforce state transition rules. For example, an event cannot be moved to the CHECKIN state without first passing through the PUBLISHED and RSVP states. Similarly, budget items and tasks can only be modified while the event is in DRAFT status, preventing unauthorized changes after publication. The EventAttendee model tracks both RSVP and check-in timestamps, providing a complete audit trail of attendee engagement.',
    body_style
))

story.append(add_heading('Membership Tier Progression', h2_style))

story.append(Paragraph(
    'The MCLUB CRM implements a membership tier system that rewards client loyalty and engagement. Clients progress through a series of membership levels, each offering enhanced benefits and privileges. The progression from Plan A through Plan C to Full Member status is tracked in the Client model, with the system automatically updating tier status based on predefined criteria such as purchase volume, event attendance, and engagement duration.',
    body_style
))

tier_data = [
    ['Tier', 'Level', 'Typical Qualifications'],
    ['Plan A', 'Entry Level', 'New clients who have completed initial registration'],
    ['Plan B', 'Intermediate', 'Clients with qualifying purchase history and engagement'],
    ['Plan C', 'Advanced', 'Long-term clients with sustained activity and referrals'],
    ['Full Member', 'Premium', 'Top-tier clients with significant contribution and loyalty'],
]
story.extend(make_table(tier_data, [0.15, 0.18, 0.67], 'Table 13: Membership Tier Progression'))

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# SECTION 7: Infrastructure & Deployment
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
story.extend(add_major_section('Infrastructure and Deployment', h1_style))

story.append(Paragraph(
    'The MCLUB CRM system is deployed on a streamlined infrastructure stack designed for reliability, ease of maintenance, and cost efficiency. The deployment architecture follows a single-server model with a reverse proxy, which is appropriate for the current scale of operations and can be extended to a multi-server architecture as the platform grows.',
    body_style
))

story.append(add_heading('Deployment Architecture', h2_style))

story.append(Paragraph(
    'The production deployment follows a straightforward request flow: incoming HTTPS requests from the internet are received by Caddy on port 81, which handles SSL termination and reverse proxies requests to the Next.js application running on port 3000. The Next.js application processes requests through its API routes and server-side rendering pipeline, communicating with the SQLite database for data persistence. The entire application process is managed by PM2, which provides automatic restarts, log management, and monitoring capabilities.',
    body_style
))

infra_data = [
    ['Component', 'Technology', 'Configuration'],
    ['Reverse Proxy', 'Caddy', 'Port 81, SSL termination, proxy to localhost:3000'],
    ['Application Server', 'Next.js', 'Port 3000, SSR + API routes'],
    ['Runtime', 'Bun', 'High-performance JS/TS runtime'],
    ['Process Manager', 'PM2', 'Auto-restart, log management, monitoring'],
    ['Database', 'SQLite', 'Embedded database, file-based storage'],
    ['Version Control', 'GitHub', 'Repository: mypathtravel101-cyber/mclub'],
]
story.extend(make_table(infra_data, [0.22, 0.18, 0.60], 'Table 14: Infrastructure Components'))

story.append(add_heading('Access Information', h2_style))

access_data = [
    ['Item', 'Value'],
    ['Preview URL', 'https://preview-chat-cfbf9474-2db8-4ba4-8247-31eed109e08e.space-z.ai/'],
    ['GitHub Repository', 'https://github.com/mypathtravel101-cyber/mclub'],
    ['Project Directory', '/home/z/my-project/'],
    ['Default Password', 'demo123 (all demo accounts)'],
]
story.extend(make_table(access_data, [0.25, 0.75], 'Table 15: Access Information'))

story.append(Paragraph(
    'The single-server architecture provides simplicity in deployment and maintenance while maintaining sufficient performance for the current user base. The SQLite database eliminates the need for a separate database server, reducing operational overhead. PM2 ensures that the application remains available through automatic process restarts in case of failures, and its monitoring capabilities allow operators to track memory usage, CPU utilization, and request handling in real time.',
    body_style
))

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# SECTION 8: Data Model Relationship Diagram
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
story.extend(add_major_section('Data Model Relationships', h1_style))

story.append(Paragraph(
    'The following table summarizes the key relationships between data models in the MCLUB CRM system. Understanding these relationships is essential for developers working on the codebase, as they define how data flows through the system and which models must be queried together for common operations.',
    body_style
))

rel_data = [
    ['Source Model', 'Relationship', 'Target Model', 'Cardinality'],
    ['User', 'creates', 'Client', 'One-to-Many'],
    ['User', 'places', 'Order', 'One-to-Many'],
    ['Product', 'included in', 'Order', 'One-to-Many'],
    ['Agent (User)', 'earns', 'Commission', 'One-to-Many'],
    ['ClubEvent', 'has', 'EventAttendee', 'One-to-Many'],
    ['ClubEvent', 'has', 'EventTask', 'One-to-Many'],
    ['ClubEvent', 'has', 'EventBudgetItem', 'One-to-Many'],
    ['Client', 'has', 'TimelineEvent', 'One-to-Many'],
]
story.extend(make_table(rel_data, [0.22, 0.18, 0.32, 0.28], 'Table 16: Data Model Relationships'))

story.append(Paragraph(
    'The relationship structure reveals that the User model is central to the system, serving as the parent entity for Clients, Orders, and Commissions through different role-based access patterns. The ClubEvent model is another hub, aggregating attendee records, task assignments, and budget line items. The TimelineEvent model provides a chronological activity log for each client, enabling staff and agents to track all interactions and maintain a complete client history.',
    body_style
))

# ━━ Build Document ━━
OUTPUT_PATH = '/home/z/my-project/download/MCLUB_CRM_Framework.pdf'
BODY_PATH = '/home/z/my-project/download/MCLUB_CRM_Framework_body.pdf'

doc = TocDocTemplate(
    BODY_PATH,
    pagesize=A4,
    leftMargin=LEFT_MARGIN,
    rightMargin=RIGHT_MARGIN,
    topMargin=TOP_MARGIN,
    bottomMargin=BOTTOM_MARGIN,
    title='MCLUB CRM System Framework',
    author='Z.ai',
    creator='Z.ai',
)

doc.multiBuild(story)
print(f"Body PDF generated: {BODY_PATH}")
