#!/usr/bin/env python3
"""Generate MCLUB CRM Framework Documentation PDF"""

import os
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import inch, mm, cm
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY, TA_RIGHT
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak, Image, KeepTogether, HRFlowable
)
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase.pdfmetrics import registerFontFamily
from pypdf import PdfReader, PdfWriter, Transformation

# ── Fonts ──
# NotoSansSC variable font not supported by ReportLab, skip
pdfmetrics.registerFont(TTFont('SarasaMonoSC', '/usr/share/fonts/truetype/chinese/SarasaMonoSC-Regular.ttf'))
pdfmetrics.registerFont(TTFont('SarasaMonoSCBold', '/usr/share/fonts/truetype/chinese/SarasaMonoSC-Bold.ttf'))
pdfmetrics.registerFont(TTFont('NotoSerifSC', '/usr/share/fonts/truetype/noto-serif-sc/NotoSerifSC-Regular.ttf'))
pdfmetrics.registerFont(TTFont('NotoSerifSCBold', '/usr/share/fonts/truetype/noto-serif-sc/NotoSerifSC-Bold.ttf'))
pdfmetrics.registerFont(TTFont('WenQuanYi', '/usr/share/fonts/truetype/wqy/wqy-zenhei.ttc'))
pdfmetrics.registerFont(TTFont('DejaVuSans', '/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf'))
# NotoSansSC skipped
registerFontFamily('SarasaMonoSC', normal='SarasaMonoSC', bold='SarasaMonoSCBold')
registerFontFamily('NotoSerifSC', normal='NotoSerifSC', bold='NotoSerifSCBold')
registerFontFamily('WenQuanYi', normal='WenQuanYi', bold='WenQuanYi')

# ── Palette ──
ACCENT       = colors.HexColor('#5125d3')
TEXT_PRIMARY  = colors.HexColor('#222426')
TEXT_MUTED    = colors.HexColor('#767b83')
BG_SURFACE   = colors.HexColor('#dee1e6')
BG_PAGE      = colors.HexColor('#e9ebed')

TABLE_HEADER_COLOR = ACCENT
TABLE_HEADER_TEXT  = colors.white
TABLE_ROW_EVEN     = colors.white
TABLE_ROW_ODD      = BG_SURFACE

# ── Output ──
OUTPUT_DIR = '/home/z/my-project/download'
BODY_PDF = os.path.join(OUTPUT_DIR, 'mclub_crm_framework_body.pdf')
FINAL_PDF = os.path.join(OUTPUT_DIR, 'MCLUB_CRM_Framework.pdf')

PAGE_W, PAGE_H = A4
LEFT_MARGIN = 60
RIGHT_MARGIN = 60
TOP_MARGIN = 50
BOTTOM_MARGIN = 50
CONTENT_W = PAGE_W - LEFT_MARGIN - RIGHT_MARGIN

# ── Styles ──
styles = getSampleStyleSheet()

h1_style = ParagraphStyle(
    'H1Custom', fontName='SarasaMonoSCBold', fontSize=22, leading=30,
    textColor=ACCENT, spaceAfter=12, spaceBefore=24, alignment=TA_LEFT
)
h2_style = ParagraphStyle(
    'H2Custom', fontName='SarasaMonoSCBold', fontSize=16, leading=22,
    textColor=TEXT_PRIMARY, spaceAfter=8, spaceBefore=18, alignment=TA_LEFT
)
h3_style = ParagraphStyle(
    'H3Custom', fontName='SarasaMonoSCBold', fontSize=13, leading=18,
    textColor=TEXT_PRIMARY, spaceAfter=6, spaceBefore=12, alignment=TA_LEFT
)
body_style = ParagraphStyle(
    'BodyCustom', fontName='WenQuanYi', fontSize=10.5, leading=18,
    textColor=TEXT_PRIMARY, spaceAfter=6, alignment=TA_JUSTIFY,
    wordWrap='CJK'
)
body_en = ParagraphStyle(
    'BodyEN', fontName='NotoSerifSC', fontSize=10.5, leading=18,
    textColor=TEXT_PRIMARY, spaceAfter=6, alignment=TA_JUSTIFY
)
muted_style = ParagraphStyle(
    'MutedCustom', fontName='WenQuanYi', fontSize=9, leading=14,
    textColor=TEXT_MUTED, spaceAfter=4, alignment=TA_LEFT
)
code_style = ParagraphStyle(
    'CodeCustom', fontName='DejaVuSans', fontSize=9, leading=14,
    textColor=colors.HexColor('#333333'), spaceAfter=4, alignment=TA_LEFT,
    leftIndent=12, backColor=colors.HexColor('#f4f4f6')
)
caption_style = ParagraphStyle(
    'CaptionCustom', fontName='WenQuanYi', fontSize=9, leading=13,
    textColor=TEXT_MUTED, spaceAfter=4, alignment=TA_LEFT
)

def make_table(data, col_widths=None, has_header=True):
    """Create a styled table."""
    if col_widths is None:
        col_widths = [CONTENT_W / len(data[0])] * len(data[0])
    t = Table(data, colWidths=col_widths, repeatRows=1 if has_header else 0)
    style_cmds = [
        ('FONTNAME', (0, 0), (-1, -1), 'WenQuanYi'),
        ('FONTSIZE', (0, 0), (-1, -1), 9.5),
        ('LEADING', (0, 0), (-1, -1), 15),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#cccccc')),
    ]
    if has_header:
        style_cmds += [
            ('BACKGROUND', (0, 0), (-1, 0), TABLE_HEADER_COLOR),
            ('TEXTCOLOR', (0, 0), (-1, 0), TABLE_HEADER_TEXT),
            ('FONTNAME', (0, 0), (-1, 0), 'SarasaMonoSCBold'),
            ('FONTSIZE', (0, 0), (-1, 0), 10),
        ]
        for i in range(1, len(data)):
            bg = TABLE_ROW_EVEN if i % 2 == 1 else TABLE_ROW_ODD
            style_cmds.append(('BACKGROUND', (0, i), (-1, i), bg))
    t.setStyle(TableStyle(style_cmds))
    t.hAlign = 'CENTER'
    return t

# ── Build Story ──
story = []

# ─── Section 1: System Overview ───
story.append(Paragraph('1. System Overview', h1_style))
story.append(Spacer(1, 6))
story.append(Paragraph(
    'MCLUB CRM (Customer Relationship Management System) is a comprehensive business management platform designed for Park Zeman Chase Limited, a Hong Kong-registered family office. The system serves as the digital backbone for managing client relationships, product offerings, order processing, commission distribution, and event coordination across four distinct user roles. Built with modern web technologies, the CRM provides role-based dashboards, real-time data analytics, and automated commission calculations to streamline the operations of a multi-stakeholder family office ecosystem.',
    body_style
))
story.append(Spacer(1, 4))
story.append(Paragraph(
    'The system architecture follows a three-tier model: a React-based frontend layer for interactive user interfaces, a Next.js API route layer for business logic and data processing, and a SQLite database layer managed through Prisma ORM for persistent data storage. This architecture ensures clear separation of concerns, rapid development cycles, and the ability to scale individual components as the business grows. The entire application runs as a single Next.js 16 deployment, leveraging server-side rendering for optimal performance and SEO capabilities while maintaining the flexibility of a client-side SPA for interactive dashboard features.',
    body_style
))
story.append(Spacer(1, 4))
story.append(Paragraph(
    'At its core, the MCLUB CRM implements a four-role access control model that mirrors the real-world organizational structure of the family office. MCLUB staff members have full administrative access to all data and operations, SME owners manage their product portfolios and track revenue, agents handle client relationships and monitor commissions, and end users interact with their purchase history and membership benefits. Each role sees a tailored dashboard with relevant metrics, navigation options, and action buttons, ensuring that users only access information pertinent to their responsibilities.',
    body_style
))

# ─── Section 2: Technology Stack ───
story.append(Spacer(1, 12))
story.append(Paragraph('2. Technology Stack', h1_style))
story.append(Spacer(1, 6))
story.append(Paragraph(
    'The MCLUB CRM is built on a carefully selected technology stack that prioritizes developer productivity, runtime performance, and long-term maintainability. Each technology choice was made to address specific requirements of the family office domain, from handling multi-currency financial data to supporting Chinese-English bilingual interfaces. The following table provides a comprehensive overview of every technology component and its role within the system.',
    body_style
))
story.append(Spacer(1, 8))

stack_data = [
    ['Layer', 'Technology', 'Version', 'Purpose'],
    ['Framework', 'Next.js', '16.1.1', 'Full-stack React framework with SSR/API routes'],
    ['UI Library', 'React', '19.0', 'Component-based UI with hooks and concurrent features'],
    ['Styling', 'Tailwind CSS', '4.x', 'Utility-first CSS with custom design tokens'],
    ['Components', 'shadcn/ui + Radix UI', 'Latest', 'Accessible, composable UI primitives'],
    ['Charts', 'Recharts', '2.15', 'Responsive data visualization components'],
    ['Animation', 'Framer Motion', '12.x', 'Declarative animation and gesture handling'],
    ['State', 'Zustand', '5.x', 'Lightweight global state management'],
    ['Forms', 'React Hook Form + Zod', '7.6 / 4.0', 'Performant form validation with schema types'],
    ['ORM', 'Prisma', '6.11', 'Type-safe database access with migrations'],
    ['Database', 'SQLite', '3.x', 'Embedded relational database (dev.db)'],
    ['Runtime', 'Bun', '1.x', 'Fast JavaScript/TypeScript runtime'],
    ['Language', 'TypeScript', '5.x', 'Static type checking for reliability'],
    ['Process', 'PM2', 'Latest', 'Production process manager with auto-restart'],
    ['Proxy', 'Caddy', '2.x', 'Reverse proxy with automatic HTTPS'],
    ['VCS', 'GitHub', '-', 'Source control and CI/CD pipeline'],
]
story.append(make_table(stack_data, col_widths=[70, 130, 60, CONTENT_W - 260]))
story.append(Spacer(1, 6))
story.append(Paragraph(
    'Table 1: Complete technology stack overview for the MCLUB CRM system.',
    caption_style
))

# ─── Section 3: Architecture Layers ───
story.append(Spacer(1, 12))
story.append(Paragraph('3. Architecture Layers', h1_style))
story.append(Spacer(1, 6))
story.append(Paragraph(
    'The MCLUB CRM follows a layered architecture pattern where each layer has clearly defined responsibilities and communication boundaries. This separation ensures that changes to one layer do not cascade unpredictably through the system, enabling independent testing, optimization, and replacement of components. The three primary layers are the Presentation Layer (frontend), the Business Logic Layer (API routes), and the Data Access Layer (Prisma ORM + SQLite). Cross-cutting concerns such as authentication, authorization, and error handling are implemented as middleware and utility functions that span across layers.',
    body_style
))

# 3.1 Presentation Layer
story.append(Paragraph('3.1 Presentation Layer (Frontend)', h2_style))
story.append(Paragraph(
    'The presentation layer is implemented as a single-page application (SPA) within Next.js, using a monolithic page.tsx component that dynamically renders different views based on the authenticated user role. The UI features a responsive sidebar navigation for desktop and a bottom navigation bar for mobile devices, ensuring seamless access across all screen sizes. The design system follows a dark theme with gold accent colors (#D4AF37), reflecting the premium positioning of the family office brand. Key UI components include stat cards for KPI visualization, data tables with status badges, modal dialogs for data entry, and a timeline component for tracking client interactions over time.',
    body_style
))
story.append(Spacer(1, 4))
story.append(Paragraph(
    'The frontend handles client-side routing through a custom state-based navigation system rather than Next.js file-based routing, which simplifies the role-based view switching mechanism. Each role sees a different set of navigation items: MCLUB_STAFF has access to six modules (Overview, Clients, Orders, Products, Commissions, Events), while END_USER sees a simplified four-module interface (Overview, My Products, Events, Membership Level). The presentation layer communicates with the API layer through a centralized apiFetch utility function that appends authentication parameters and handles timeout management with a 15-second abort controller.',
    body_style
))

# 3.2 Business Logic Layer
story.append(Paragraph('3.2 Business Logic Layer (API Routes)', h2_style))
story.append(Paragraph(
    'The business logic layer is implemented through Next.js API route handlers, organized under the /api directory with RESTful conventions. Each route handler is responsible for input validation, authorization checks, data transformation, and orchestration of database operations. A critical design decision was the implementation of sequential query execution in the dashboard API to prevent SQLite concurrent access crashes, as SQLite supports only one writer at a time. The API layer also handles complex business rules such as automatic commission calculation during order settlement, RSVP management for events, and timeline event generation for client activity tracking.',
    body_style
))
story.append(Spacer(1, 4))
story.append(Paragraph(
    'Authentication is handled through a simple email/password mechanism with bcrypt password hashing. The current implementation uses query parameter-based user identification (userId and userRole appended to API requests) rather than session-based or JWT-based authentication, which is appropriate for the demo phase but would need to be upgraded to a proper session management system for production deployment. The API follows a consistent response format with error objects containing descriptive messages and data objects containing the requested resources, making it straightforward for the frontend to handle both success and failure cases uniformly.',
    body_style
))

# 3.3 Data Access Layer
story.append(Paragraph('3.3 Data Access Layer (Prisma ORM)', h2_style))
story.append(Paragraph(
    'The data access layer uses Prisma ORM to provide type-safe database interactions with automatic TypeScript type generation from the schema definition. The Prisma schema defines ten models with comprehensive relationship mappings, including self-referential User relations for the referral system and cascading deletes for event-related entities. The database connection uses SQLite with a connection limit of one (connection_limit=1) to prevent concurrent write errors inherent to SQLite architecture. The Prisma client is instantiated as a singleton through the db.ts utility module, preventing connection pool exhaustion in development mode where hot-reloading can create multiple client instances.',
    body_style
))

# ─── Section 4: User Roles & Permissions ───
story.append(Spacer(1, 12))
story.append(Paragraph('4. User Roles and Permissions', h1_style))
story.append(Spacer(1, 6))
story.append(Paragraph(
    'The MCLUB CRM implements a role-based access control (RBAC) system with four distinct user roles, each corresponding to a specific stakeholder in the family office ecosystem. The role hierarchy flows from MCLUB_STAFF (full access) down to END_USER (self-service access), with each role having precisely scoped permissions that limit data visibility and action capabilities to only what is necessary for that stakeholder type. This principle of least privilege ensures data security while maintaining operational efficiency.',
    body_style
))
story.append(Spacer(1, 8))

role_data = [
    ['Role', 'Description', 'Dashboard Modules', 'Key Permissions'],
    ['MCLUB_STAFF', 'Internal staff with full admin access', 'Overview, Clients, Orders, Products, Commissions, Events',
     'View all data, manage all records, settle orders, manage events, create users'],
    ['SME_OWNER', 'Product provider / business owner', 'Overview, My Products, Orders, Income, Events',
     'View own products, track related orders, view own commissions'],
    ['AGENT', 'Business development agent / broker', 'Overview, My Clients, Commissions, Products, Events',
     'Manage referred clients, track own commissions, view product info'],
    ['END_USER', 'Final customer / member', 'Overview, My Products, Events, Membership Level',
     'View own orders, RSVP to events, view membership status'],
]
story.append(make_table(role_data, col_widths=[75, 130, 140, CONTENT_W - 345]))
story.append(Spacer(1, 6))
story.append(Paragraph(
    'Table 2: User role definitions with dashboard modules and permission scope.',
    caption_style
))

story.append(Spacer(1, 8))
story.append(Paragraph('4.1 Demo Accounts', h2_style))
story.append(Paragraph(
    'The system ships with four pre-configured demo accounts, one for each user role, allowing immediate exploration of all interface variations. These accounts are seeded automatically when a user first attempts to log in, triggered by a POST request to the /api/seed endpoint. All demo accounts share the password "demo123" for convenience during the demonstration phase. The following table lists each account with its associated role and primary use case for testing purposes.',
    body_style
))
story.append(Spacer(1, 6))

demo_data = [
    ['Email', 'Role', 'Name', 'Purpose'],
    ['kenneth@parkzeman.com', 'MCLUB_STAFF', 'Kenneth', 'Full admin testing and data management'],
    ['calvin@mclub.com', 'SME_OWNER', 'Calvin', 'Product provider revenue tracking'],
    ['agent@mclub.com', 'AGENT', 'Agent', 'Client management and commission tracking'],
    ['user@mclub.com', 'END_USER', 'User', 'Customer purchase and membership experience'],
]
story.append(make_table(demo_data, col_widths=[120, 90, 60, CONTENT_W - 270]))

# ─── Section 5: Database Schema ───
story.append(Spacer(1, 12))
story.append(Paragraph('5. Database Schema', h1_style))
story.append(Spacer(1, 6))
story.append(Paragraph(
    'The MCLUB CRM database consists of ten Prisma models organized into two logical groups: core business models and event management models. The schema uses SQLite as the underlying database engine with CUID-based primary keys for all entities. Relationships are enforced at the Prisma level through foreign key constraints, with cascade delete rules applied to event-related child entities (tasks, budget items) to maintain referential integrity when events are removed. The following sections detail each model group with their fields, relationships, and business constraints.',
    body_style
))

# 5.1 Core Business Models
story.append(Paragraph('5.1 Core Business Models', h2_style))
story.append(Paragraph(
    'The core business models form the transactional backbone of the CRM system. The User model serves as the central entity, connecting to Clients through the agent relationship, to Products through the SME owner relationship, and to Commissions through the recipient relationship. The Order model acts as the nexus connecting Products, Clients, Users, and Commissions in a single transaction record. This interconnected design enables comprehensive revenue tracking from initial client referral through to final commission settlement, providing complete audit trails for all financial activities within the platform.',
    body_style
))
story.append(Spacer(1, 6))

core_data = [
    ['Model', 'Key Fields', 'Relationships', 'Business Purpose'],
    ['User', 'email, name, role, password, phone, avatar, referredById',
     'Self-referral, OwnedProducts, AgentClients, Orders, Commissions, Events, RSVPs, Tasks',
     'Central identity with role-based access and referral tracking'],
    ['Client', 'name, phone, email, source, memberLevel, totalSpent',
     'Agent (User), Orders, TimelineEvents',
     'Customer record with LTV tracking and member tier'],
    ['Product', 'name, category, description, keyPoints, minInvestment, commissionRules',
     'SME Owner (User), Orders',
     'Investment product catalog with commission structure'],
    ['Order', 'status, amount, currency, notes, commissionSettled',
     'Product, EndUser (User), Client, Agent (User), Commissions, TimelineEvents',
     'Transaction record with settlement tracking'],
    ['Commission', 'role, amount, status',
     'Order, Recipient (User)',
     'Revenue share tracking per recipient and role'],
]
story.append(make_table(core_data, col_widths=[55, 140, 130, CONTENT_W - 325]))
story.append(Spacer(1, 6))
story.append(Paragraph(
    'Table 3: Core business models with fields, relationships, and business purposes.',
    caption_style
))

# 5.2 Event Management Models
story.append(Spacer(1, 8))
story.append(Paragraph('5.2 Event Management Models', h2_style))
story.append(Paragraph(
    'The event management module was added as a significant feature extension to the core CRM, enabling MCLUB staff to organize networking events, seminars, dinners, workshops, and celebrations. The ClubEvent model serves as the parent entity with three child models (RSVP, EventTask, EventBudgetItem) connected through foreign keys with cascade delete rules. This design ensures that when an event is deleted, all associated RSVPs, tasks, and budget items are automatically cleaned up, preventing orphaned records. The RSVP model enforces a unique constraint on the (eventId, userId) pair, ensuring that each user can only RSVP once per event.',
    body_style
))
story.append(Spacer(1, 6))

event_data = [
    ['Model', 'Key Fields', 'Relationships', 'Business Purpose'],
    ['ClubEvent', 'title, description, category, venue, eventDate, status, maxAttendees, fee, sponsor',
     'CreatedBy (User), RSVPs, Tasks, BudgetItems',
     'Event coordination with capacity and fee management'],
    ['RSVP', 'status (PENDING/CONFIRMED/DECLINED/CHECKED_IN), guests, notes',
     'ClubEvent, User',
     'Attendance tracking with check-in workflow'],
    ['EventTask', 'title, status (TODO/IN_PROGRESS/DONE), priority, dueDate',
     'ClubEvent, Assignee (User)',
     'Event preparation task delegation and tracking'],
    ['EventBudgetItem', 'category, description, estimatedCost, actualCost',
     'ClubEvent',
     'Event budget planning with estimate vs actual tracking'],
    ['TimelineEvent', 'eventType, title, description',
     'Client, Order (optional), CreatedBy (User)',
     'Client activity history for CRM timeline view'],
]
story.append(make_table(event_data, col_widths=[75, 145, 105, CONTENT_W - 325]))
story.append(Spacer(1, 6))
story.append(Paragraph(
    'Table 4: Event management models with fields, relationships, and business purposes.',
    caption_style
))

# ─── Section 6: API Routes ───
story.append(Spacer(1, 12))
story.append(Paragraph('6. API Routes', h1_style))
story.append(Spacer(1, 6))
story.append(Paragraph(
    'The MCLUB CRM exposes a comprehensive RESTful API through Next.js route handlers, organized into eight functional groups. All endpoints accept and return JSON payloads, with authentication context provided through userId and userRole query parameters. The API follows REST conventions where GET requests retrieve resources, POST creates new resources, PATCH updates existing resources, and DELETE removes resources. The following table provides a complete reference of all available API endpoints, their HTTP methods, supported operations, and the roles that can access each endpoint.',
    body_style
))
story.append(Spacer(1, 8))

api_data = [
    ['Endpoint Group', 'Routes', 'Methods', 'Operations'],
    ['Authentication', '/api/auth/login, /api/auth/me', 'POST, GET', 'Login with email/password, get current user'],
    ['Dashboard', '/api/dashboard/[role]', 'GET', 'Role-specific KPI metrics and summary data'],
    ['Clients', '/api/clients, /api/clients/[id], /api/clients/[id]/timeline', 'GET, POST, PATCH',
     'CRUD operations + timeline event management'],
    ['Orders', '/api/orders, /api/orders/[id], /api/orders/[id]/settle', 'GET, POST, PATCH',
     'Order management + commission settlement'],
    ['Products', '/api/products', 'GET, POST', 'Product catalog with commission rules'],
    ['Commissions', '/api/commissions', 'GET', 'Commission records filtered by user role'],
    ['Users', '/api/users, /api/seed', 'GET, POST', 'User management + database seeding'],
    ['Events (v1)', '/api/events, /api/events/[id], /api/events/[id]/rsvp, .../checkin, .../tasks, .../budget',
     'GET, POST, PATCH, DELETE', 'Full event lifecycle: create, RSVP, check-in, tasks, budget'],
    ['Events (v2)', '/api/e, /api/e/[id], /api/e/[id]/rsvp, .../checkin, .../tasks, .../budget',
     'GET, POST, PATCH, DELETE', 'Refactored event API (shorter paths, same functionality)'],
]
story.append(make_table(api_data, col_widths=[80, 175, 70, CONTENT_W - 325]))
story.append(Spacer(1, 6))
story.append(Paragraph(
    'Table 5: Complete API route reference with endpoint groups, methods, and operations.',
    caption_style
))

# ─── Section 7: Business Flows ───
story.append(Spacer(1, 12))
story.append(Paragraph('7. Core Business Flows', h1_style))
story.append(Spacer(1, 6))

# 7.1 Order & Commission Flow
story.append(Paragraph('7.1 Order and Commission Settlement Flow', h2_style))
story.append(Paragraph(
    'The primary revenue flow in the MCLUB CRM follows a four-stage lifecycle: order creation, confirmation, completion, and settlement. When an agent refers a client to purchase a product, a new order is created with PENDING status. MCLUB staff then confirms the order, moving it to IN_PROGRESS. Upon service delivery, the order is marked COMPLETED. The final stage, settlement, triggers automatic commission calculation based on the product commission rules, distributing revenue shares to the agent, SME owner, and MCLUB according to the predefined percentage splits stored in the commissionRules JSON field of the Product model.',
    body_style
))
story.append(Spacer(1, 4))
story.append(Paragraph(
    'The commission calculation algorithm parses the JSON commission rules for the associated product, which specify three rates: agentRate (the percentage allocated to the referring agent), smeRate (the percentage allocated to the product provider/SME owner), and mclubRate (the percentage retained by MCLUB). These rates are applied to the order amount to generate individual Commission records for each recipient. Each commission record tracks its own status (PENDING or PAID), enabling the finance team to manage payout timing independently for each stakeholder. The order status is then advanced to SETTLED, and the commissionSettled flag is set to true, preventing duplicate settlement operations.',
    body_style
))

# 7.2 Event Management Flow
story.append(Paragraph('7.2 Event Management Flow', h2_style))
story.append(Paragraph(
    'The event management module implements a complete event lifecycle from initial draft creation through to post-event completion. Events begin in DRAFT status, allowing MCLUB staff to configure all details including venue, capacity limits, registration fees, sponsorship information, and contact persons before publishing. Once published (PUBLISHED status), the event becomes visible to other user roles who can RSVP. The RSVP workflow supports four states: PENDING (initial signup), CONFIRMED (organizer approval), DECLINED (rejection), and CHECKED_IN (day-of-event attendance confirmation). The system enforces a maximum attendee constraint when specified, and tracks the number of guests each RSVP includes.',
    body_style
))
story.append(Spacer(1, 4))
story.append(Paragraph(
    'Parallel to the RSVP workflow, each event supports a task management system for event preparation. Tasks are assigned to specific users with priority levels (low, medium, high) and due dates, progressing through TODO, IN_PROGRESS, and DONE statuses. Additionally, a budget management module enables cost planning with estimated versus actual cost tracking across seven standard categories: venue, catering, decoration, AV, marketing, staff, and other. This comprehensive approach ensures that event organizers have full visibility into both the logistical preparations and financial commitments associated with each event, supporting the high-touch service expectations of the family office clientele.',
    body_style
))

# 7.3 Membership Progression
story.append(Paragraph('7.3 Membership Level Progression', h2_style))
story.append(Paragraph(
    'The CRM implements a four-tier membership system that segments clients by their engagement level and investment capacity. The entry-level Plan A provides basic access to the platform and product catalog. Plan B offers enhanced services with broader product access and priority event invitations. Plan C represents the premium tier with exclusive investment opportunities and personalized service. The highest tier, FULL membership, grants unrestricted access to all MCLUB services and events. Client progression through membership levels is tracked through the memberLevel enum field on the Client model, with the totalSpent field providing a quantitative basis for upgrade decisions. The timeline event system records membership changes, creating an audit trail of client lifecycle milestones.',
    body_style
))

# ─── Section 8: Infrastructure ───
story.append(Spacer(1, 12))
story.append(Paragraph('8. Infrastructure and Deployment', h1_style))
story.append(Spacer(1, 6))

# 8.1 Server Stack
story.append(Paragraph('8.1 Server Stack', h2_style))
story.append(Paragraph(
    'The MCLUB CRM runs on a Linux-based server with the following infrastructure stack. The Next.js application runs in development mode on port 3000, managed by PM2 (Process Manager 2) which provides automatic restart on crashes, log management, and process monitoring. PM2 is configured to use the Bun runtime rather than Node.js, taking advantage of Bun significantly faster startup times and improved performance for TypeScript execution. The process is registered under the name "mclub-crm" in PM2, enabling straightforward management commands for status checks, restarts, and log viewing.',
    body_style
))
story.append(Spacer(1, 4))
story.append(Paragraph(
    'Caddy serves as the reverse proxy layer, forwarding requests from port 81 to the Next.js application on port 3000. Caddy was chosen for its automatic HTTPS certificate provisioning through Let Encrypt, minimal configuration requirements, and HTTP/2 support out of the box. The current configuration serves the application on the internal network, with the preview URL https://preview-chat-cfbf9474-2db8-4ba4-8247-31eed109e08e.space-z.ai/ providing external access through the Space-Z platform reverse proxy infrastructure. The source code is maintained in a GitHub repository at https://github.com/mypathtravel101-cyber/mclub, enabling version control, collaborative development, and automated deployment workflows.',
    body_style
))

# 8.2 CORS & Security
story.append(Paragraph('8.2 CORS and Security Configuration', h2_style))
story.append(Paragraph(
    'Cross-origin resource sharing (CORS) is configured through the Next.js next.config.ts headers function, which adds appropriate Access-Control-Allow-Origin headers for the preview domain. This configuration was necessary because the preview URL and the application server run on different origins, causing browsers to block API requests without proper CORS headers. The allowedDevOrigins configuration in next.config.ts also includes the preview domain to enable hot module replacement during development. It is important to note that the Next.js middleware.ts file was deliberately removed from the project, as it caused server crashes with Next.js 16 due to incompatibilities with the new App Router architecture. All cross-origin and authentication concerns that would typically be handled in middleware are instead managed through the next.config.ts headers configuration and the API route handler authentication logic.',
    body_style
))

# 8.3 Data Persistence
story.append(Paragraph('8.3 Data Persistence', h2_style))
story.append(Paragraph(
    'The application uses SQLite as its database engine, with the database file stored at prisma/dev.db. The DATABASE_URL environment variable is configured with a connection limit of one (file:./dev.db?connection_limit=1) to prevent concurrent write errors that are inherent to SQLite single-writer architecture. This limitation was discovered during development when the dashboard API attempted to execute multiple Prisma queries concurrently, resulting in SQLITE_BUSY errors. The fix involved reordering all dashboard queries to execute sequentially rather than in parallel, trading some performance for data integrity. For production deployment, migrating to PostgreSQL or MySQL would eliminate this concurrency limitation while preserving the Prisma ORM abstraction layer, requiring only a connection string change and database migration.',
    body_style
))

# ─── Section 9: Known Issues ───
story.append(Spacer(1, 12))
story.append(Paragraph('9. Known Limitations and Future Enhancements', h1_style))
story.append(Spacer(1, 6))
story.append(Paragraph(
    'The current implementation of the MCLUB CRM has several known limitations that should be addressed before production deployment. First, the authentication system uses query parameter-based user identification rather than secure session tokens or JWT, which exposes user IDs in server logs and browser history. Second, the SQLite database imposes a single-writer concurrency constraint that limits the system ability to handle simultaneous write operations from multiple users. Third, the frontend is implemented as a single large page.tsx component rather than a modular component architecture, making it difficult to maintain and test individual UI modules independently.',
    body_style
))
story.append(Spacer(1, 4))
story.append(Paragraph(
    'Future enhancements planned for the system include: implementing proper JWT-based authentication with HTTP-only cookies; migrating to PostgreSQL for production-grade concurrent access support; refactoring the frontend into separate page components per role using Next.js App Router file-based routing; adding real-time notifications via WebSocket for order status changes and event RSVP updates; implementing a full audit log system for regulatory compliance; adding multi-language support with next-intl for English and Chinese interfaces; and integrating with external payment gateways for automated order processing. The custom domain deployment to mclub.space-z.ai remains a platform-side configuration task that requires Space-Z infrastructure team assistance to complete.',
    body_style
))

# ── Build ──
doc = SimpleDocTemplate(
    BODY_PDF,
    pagesize=A4,
    leftMargin=LEFT_MARGIN,
    rightMargin=RIGHT_MARGIN,
    topMargin=TOP_MARGIN,
    bottomMargin=BOTTOM_MARGIN,
    title='MCLUB CRM Framework',
    author='Z.ai',
    subject='MCLUB CRM System Architecture and Framework Documentation',
)
doc.build(story)
print(f'Body PDF: {BODY_PDF}')

# ── Cover HTML ──
cover_html_path = os.path.join(OUTPUT_DIR, 'mclub_cover.html')
cover_html = '''<!DOCTYPE html>
<html lang="zh-Hant">
<head>
<meta charset="UTF-8">
<style>
@page { size: 794px 1123px; margin: 0; }
* { margin: 0; padding: 0; box-sizing: border-box; }
html, body { width: 794px; height: 1123px; }
.cover {
  width: 794px; height: 1123px; position: relative; overflow: hidden;
  background: linear-gradient(160deg, #0f172a 0%, #1e293b 40%, #1e3a5f 100%);
  font-family: -apple-system, BlinkMacSystemFont, 'PingFang SC', 'Microsoft YaHei', sans-serif;
  color: white;
}
.layer0 { position: absolute; inset: 0; }
.layer1 { position: absolute; inset: 0; overflow: hidden; clip-path: inset(0); }
.layer2 { position: absolute; inset: 0; }
.layer3 { position: absolute; inset: 0; }

/* Geometric accents */
.accent-line-1 {
  position: absolute; top: 120px; left: 60px;
  width: 80px; height: 3px;
  background: linear-gradient(90deg, #5125d3, transparent);
}
.accent-line-2 {
  position: absolute; bottom: 180px; right: 60px;
  width: 200px; height: 2px;
  background: linear-gradient(90deg, transparent, rgba(81,37,211,0.4));
}
.accent-circle {
  position: absolute; top: -100px; right: -100px;
  width: 400px; height: 400px; border-radius: 50%;
  border: 1px solid rgba(81,37,211,0.15);
}
.accent-circle-2 {
  position: absolute; bottom: -50px; left: -80px;
  width: 300px; height: 300px; border-radius: 50%;
  border: 1px solid rgba(81,37,211,0.1);
}

.kicker {
  position: absolute; top: 140px; left: 60px;
  font-size: 14px; letter-spacing: 3px; text-transform: uppercase;
  color: rgba(255,255,255,0.5);
}
.hero-title {
  position: absolute; top: 180px; left: 60px;
  font-size: 48px; font-weight: 800; line-height: 1.15;
  max-width: 600px;
}
.hero-title .accent { color: #5125d3; }
.meta-line {
  position: absolute; top: 340px; left: 60px;
  font-size: 18px; color: rgba(255,255,255,0.65);
  font-weight: 300;
}
.summary-box {
  position: absolute; top: 410px; left: 60px; right: 60px;
  padding: 24px;
  background: rgba(255,255,255,0.05);
  border-left: 3px solid #5125d3;
  border-radius: 0 8px 8px 0;
}
.summary-box p {
  font-size: 14px; line-height: 1.7;
  color: rgba(255,255,255,0.7);
}
.footer-left {
  position: absolute; bottom: 60px; left: 60px;
  font-size: 12px; color: rgba(255,255,255,0.35);
  letter-spacing: 1px; text-transform: uppercase;
}
.footer-right {
  position: absolute; bottom: 60px; right: 60px;
  font-size: 12px; color: rgba(255,255,255,0.35);
}
</style>
</head>
<body>
<div class="cover">
  <div class="layer0"></div>
  <div class="layer1">
    <div class="accent-circle"></div>
    <div class="accent-circle-2"></div>
  </div>
  <div class="layer2">
    <div class="accent-line-1"></div>
    <div class="accent-line-2"></div>
  </div>
  <div class="layer3">
    <div class="kicker">System Architecture Documentation</div>
    <div class="hero-title">MCLUB <span class="accent">CRM</span><br/>Framework</div>
    <div class="meta-line">Park Zeman Chase Family Office</div>
    <div class="summary-box">
      <p>Complete technical reference for the MCLUB CRM system, covering the three-layer architecture (Presentation, Business Logic, Data Access), four-role access control model, ten database models, eight API route groups, and core business flows including order settlement, event management, and membership progression.</p>
    </div>
    <div class="footer-left">Confidential</div>
    <div class="footer-right">2026</div>
  </div>
</div>
</body>
</html>'''
with open(cover_html_path, 'w', encoding='utf-8') as f:
    f.write(cover_html)
print(f'Cover HTML: {cover_html_path}')
