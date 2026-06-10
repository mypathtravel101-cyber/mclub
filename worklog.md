---
Task ID: 1
Agent: full-stack-developer
Task: Update MCLUB CRM product lineup

Work Log:
- Cloned repo from GitHub: https://github.com/mypathtravel101-cyber/mclub.git → /home/z/my-project/mclub-repo
- Explored codebase: GitHub repo is a workspace (skills, download, upload dirs). The actual CRM code needed to be built at /home/z/my-project/src/
- Found VFK references in: download/generate_overview.js, download/generate_cert.js, download/generate_cert_proposal.js, and JSON snapshot files

Changes Made:

1. **prisma/schema.prisma** — Complete rewrite
   - Defined 7 models: User, Product, Customer, Order, Commission, Event, EventParticipant, Notification
   - Product model includes fields for emoji, category, price range, commission rate
   - NO VFK健康產品 in the schema

2. **src/lib/seed.ts** — New file (seed data)
   - Created 8 products (NO VFK, 2 new products added):
     1. 🏘️ 日本物業投資 (investment, JPY, 3% commission)
     2. 🇸🇹 聖多美公民計劃 (immigration, USD, 10% commission)
     3. 📈 NPC基金 (fund, HKD, 5% commission)
     4. 🏦 家族信託 (trust, HKD, 8% commission)
     5. 📋 公司秘書服務 (corporate, HKD, 15% commission)
     6. 📱 MyPath AI (technology, HKD, 20% commission)
     7. ⚖️ 香港法律服務 (legal, HKD, 12% commission) — NEW
     8. 🎓 家族辦公室專業認可證書課程 (education, HKD, 18% commission) — NEW
   - Sample orders include references to the new products (香港法律服務, 家族辦公室專業認可證書課程)
   - Sample notifications include reference to the new certification course

3. **src/app/api/products/route.ts** — New API route (GET, POST, PUT)
4. **src/app/api/customers/route.ts** — New API route (GET, POST, PUT)
5. **src/app/api/orders/route.ts** — New API route (GET, POST, PUT)
6. **src/app/api/commissions/route.ts** — New API route (GET, PUT)
7. **src/app/api/events/route.ts** — New API route (GET, POST, PUT)
8. **src/app/api/dashboard/route.ts** — New API route (GET)
9. **src/app/api/auth/route.ts** — New API route (POST)
10. **src/app/api/notifications/route.ts** — New API route (GET, PUT)

11. **src/store/app.ts** — New Zustand store for app state
12. **src/lib/api-helpers.ts** — New utility for authenticated API calls
13. **src/lib/db.ts** — Updated Prisma client config

14. **src/app/page.tsx** — Complete CRM frontend (login, sidebar navigation, all pages)
15. **src/components/crm/LoginPage.tsx** — Login page with quick-login buttons
16. **src/components/crm/Sidebar.tsx** — Navigation sidebar with all CRM sections
17. **src/components/crm/DashboardPage.tsx** — Dashboard with KPIs, revenue by product
18. **src/components/crm/ProductsPage.tsx** — Products grid with edit capability
19. **src/components/crm/CustomersPage.tsx** — Customer list with search, add dialog
20. **src/components/crm/OrdersPage.tsx** — Order management with status updates
21. **src/components/crm/CommissionsPage.tsx** — Commission tracking with approve/pay workflow
22. **src/components/crm/EventsPage.tsx** — Events cards with type badges
23. **src/components/crm/NotificationsPage.tsx** — Notification center with read/unread
24. **src/components/crm/SettingsPage.tsx** — Settings page with product lineup display

25. **download/generate_overview.js** — Removed VFK健康食品, replaced with 8-product MCLUB lineup. Updated flow arrows and bottom tagline.
26. **download/generate_cert.js** — Replaced "VFK 健康財富產品知識" module with "MCLUB 產品組合知識" referencing all 8 products
27. **download/generate_cert_proposal.js** — Replaced all VFK references (10+ instances) with "MCLUB 產品組合服務" and "MCLUB 多元產品組合"
28. **mclub-repo/download/generate_overview.js** — Synced copy
29. **mclub-repo/download/generate_cert.js** — Synced copy
30. **mclub-repo/download/generate_cert_proposal.js** — Synced copy

Stage Summary:
- Modified/Created 30 files total
- Key source files: prisma/schema.prisma, src/lib/seed.ts, src/app/page.tsx
- All API routes: src/app/api/{products,customers,orders,commissions,events,dashboard,auth,notifications}/route.ts
- All CRM components: src/components/crm/{LoginPage,Sidebar,DashboardPage,ProductsPage,CustomersPage,OrdersPage,CommissionsPage,EventsPage,NotificationsPage,SettingsPage}.tsx
- Download scripts updated: generate_overview.js, generate_cert.js, generate_cert_proposal.js
- Database seeded with 8 products, 4 users, 5 customers, 7 orders, 3 events
- Lint passes with zero errors in src/

---
Task ID: 2
Agent: full-stack-developer
Task: Add "Group Notice" (群組公告) feature to MCLUB CRM

Work Log:
- Read all existing source files to understand code patterns (schema, page.tsx, Sidebar, Dashboard, EventsPage, NotificationsPage, api-helpers, store, seed, API routes)
- Followed existing patterns: shadcn/ui components, fetchWithAuth, cn() utility, dark card styling, amber accent colors

Changes Made:

1. **prisma/schema.prisma** — Added Notice model
   - Fields: id, title, content, category (announcement/urgent/policy), targetRoles (comma-separated), authorId (→User), isPinned, isActive, createdAt, updatedAt
   - Added `notices Notice[]` relation to User model
   - Ran `bunx prisma@6 db push` to sync schema

2. **src/app/api/notices/route.ts** — New API route (CRUD)
   - GET: List active notices, filter by user role (non-admin only sees targeted), pinned first then by date desc, supports `?limit=N`
   - POST: Create notice (admin only, verifies admin role), auto-creates Notification records for all targeted users
   - PATCH: Update notice (admin only, verifies admin role)
   - DELETE: Soft-delete notice by setting isActive=false (admin only)

3. **src/components/crm/NoticesPage.tsx** — New frontend component
   - Notice list with expandable cards (click to expand/collapse content)
   - Pinned notices at top with gold Pin icon and amber left border
   - Category badges: 公告(announcement/blue), 緊急(urgent/red), 政策(policy/amber)
   - Target role tags with role-specific colors (admin/sme/agent/client)
   - Admin actions: create, edit, pin/unpin, delete buttons
   - Non-admin users: view-only with expand/collapse
   - "New Notice" Dialog: title, content (Textarea), category Select, target roles Checkboxes
   - Empty state: "暫無公告"
   - Follows existing EventsPage pattern

4. **src/store/app.ts** — Added 'notices' to Page type union

5. **src/components/crm/Sidebar.tsx** — Added "📢 公告" nav item
   - Placed between "活動管理" and "通知中心"
   - Uses Megaphone icon from lucide-react
   - Visible to all roles (no role-based filtering)

6. **src/app/page.tsx** — Updated for notices page
   - Imported NoticesPage component
   - Added 'notices': '📢 群組公告' to PAGE_TITLES
   - Added case 'notices' → NoticesPage() in PageContent switch

7. **src/components/crm/DashboardPage.tsx** — Added "最新公告" section
   - Fetches 3 most recent notices via API
   - Shows pinned notices with amber left border
   - Displays title, category badge, content preview (line-clamp-1), date
   - "查看全部" button navigates to notices page
   - Empty state when no notices exist

8. **src/lib/seed.ts** — Added 3 sample notices
   - "MCLUB系統維護通知" (announcement, pinned, all roles)
   - "緊急：佣金發放流程變更" (urgent, admin/sme/agent)
   - "2025年第三季度KPI調整" (policy, admin/sme/agent)
   - Added db.notice.deleteMany() to cleanup
   - Updated seed completion log

9. **Notification Integration** — Built into API POST handler
   - When admin creates a notice, Notification records are auto-created for all users matching targetRoles
   - Urgent notices create 'warning' type notifications; others create 'info' type
   - Author is excluded from receiving their own notification

Stage Summary:
- Created 2 new files: src/app/api/notices/route.ts, src/components/crm/NoticesPage.tsx
- Modified 7 files: prisma/schema.prisma, src/store/app.ts, src/components/crm/Sidebar.tsx, src/app/page.tsx, src/components/crm/DashboardPage.tsx, src/lib/seed.ts
- All lint errors in modified src/ files resolved (pre-existing errors in download/ and ui/carousel.tsx remain unchanged)
