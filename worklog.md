# MCLUB CRM Project Worklog

## Task 1: Rebuild MCLUB CRM Project (2026-06-04)

### Summary
Successfully rebuilt the MCLUB CRM project from `/tmp/my-project-new/` to `/home/z/my-project/`, resolving persistent SQLite database connection issues.

### What was done:
1. **Initialized fullstack dev environment** - Ran the init-fullstack script
2. **Copied all source code** - From `/tmp/my-project-new/src/` including:
   - `src/app/page.tsx` (main SPA with login, sidebar, dashboard, clients, orders, products, commissions)
   - `src/app/api/` (all API routes: auth, dashboard, clients, orders, products, commissions, seed)
   - `src/lib/db.ts` (Prisma client)
   - `src/lib/auth-helpers.ts` (auth helper)
   - `src/components/mclub/` (api.ts, types.ts)
   - `src/components/ui/` (all shadcn/ui components)
3. **Copied Prisma schema and database** - `prisma/schema.prisma` and `prisma/dev.db` (with existing seed data)
4. **Fixed DATABASE_URL** - Set to `file:///home/z/my-project/prisma/dev.db?connection_limit=1` in `.env`
5. **Fixed SQLite connection issue** - The environment variable `DATABASE_URL` was being overridden by the shell environment to point to `db/custom.db`. Fixed by updating `src/lib/db.ts` to compute the absolute path using `process.cwd()` when the environment URL doesn't point to the correct database.
6. **Frontend infinite loop bug** - Already fixed in source code with `dashboardLoadedRef` pattern. Verified the fix is in place.
7. **Dashboard API route** - Already running queries sequentially (not in parallel/transaction) to avoid SQLite concurrent access issues.
8. **Updated next.config.ts** - Added CORS headers and `allowedDevOrigins`
9. **No middleware.ts** - Confirmed no middleware.ts exists (would crash Next.js 16)
10. **Generated Prisma client** and pushed schema to database
11. **Started dev server** on port 3000 via `.zscripts/dev.sh`

### Key fix - db.ts:
The environment had `DATABASE_URL=file:/home/z/my-project/db/custom.db` set externally, which overrides the `.env` file. Updated `db.ts` to detect when the environment URL doesn't point to `prisma/dev.db` and compute the correct path using `path.join(process.cwd(), 'prisma', 'dev.db')`.

### Verified API endpoints:
- `POST /api/seed` → Returns `{"message":"數據已初始化","count":7}`
- `POST /api/auth/login` → Returns user data for all 4 test accounts
- `GET /api/dashboard?userId=...&userRole=MCLUB_STAFF` → Returns dashboard data (5 clients, 6 orders, 7 products)
- `GET /api/clients`, `/api/orders`, `/api/products`, `/api/commissions` → All working

### Test accounts verified:
- kenneth@parkzeman.com / demo123 (MCLUB_STAFF) ✓
- calvin@mclub.com / demo123 (SME_OWNER) ✓
- agent@mclub.com / demo123 (AGENT) ✓
- user@mclub.com / demo123 (END_USER) ✓

### Server status:
Running on port 3000 via `.zscripts/dev.sh` (PID 4115+)

---

## Task 2: Add Event Management (活動管理) Feature (2026-06-04)

**Task ID:** events-feature

### Summary
Added a complete "活動管理" (Event Management) feature to the MCLUB CRM, including database models, API routes, frontend UI component, seed data, and sidebar navigation for all roles.

### What was done:

1. **Updated Prisma Schema** (`prisma/schema.prisma`):
   - Added `EventStatus` enum (DRAFT, PUBLISHED, CANCELLED, COMPLETED)
   - Added `RSVPStatus` enum (PENDING, CONFIRMED, DECLINED, CHECKED_IN)
   - Added `ClubEvent` model with fields: title, description, venue, eventDate, endDate, status, maxAttendees, isPublic, fee, currency, createdBy
   - Added `RSVP` model with fields: eventId, userId, status, notes, guests, and unique constraint on [eventId, userId]
   - Added `organizedEvents` and `eventRSVPs` relations to the User model

2. **Ran Prisma migration** - `npx prisma db push` to sync schema with database

3. **Created API Routes**:
   - `GET/POST /api/events` - List events (role-filtered) and create new events (MCLUB_STAFF only)
   - `PATCH/DELETE /api/events/[id]` - Update event status and delete events (MCLUB_STAFF only)
   - `POST /api/events/[id]/rsvp` - RSVP to an event (upsert pattern, capacity check)

4. **Updated Frontend** (`src/app/page.tsx`):
   - Added `EventStatus`, `RSVPStatus`, `ClubEvent`, `RSVP` type definitions
   - Added `eventStatusLabel`, `eventStatusClass`, `rsvpStatusLabel` status helpers
   - Added `events` menu item to all 4 role menus in Sidebar (MCLUB_STAFF: 活動管理, others: 活動)
   - Added `EventList` component with:
     - Event list view with status badges, date, venue, attendee count, fee
     - Event detail view with full info, RSVP actions for non-admin, admin management actions, attendee list
     - Create event form (MCLUB_STAFF only) with title, description, venue, dates, capacity, fee, status
     - RSVP functionality (confirm/decline) for non-admin users
     - Admin actions: publish, complete, cancel, delete events
   - Added `case 'events': return <EventList user={user} />;` to renderContent switch

5. **Updated Seed Script** (`src/app/api/seed/route.ts`):
   - Added 3 sample events: MCLUB 2026 夏季投資論壇, 日本物業投資說明會, VFK健康產品體驗日
   - Added 4 sample RSVPs across the events

6. **Database reset and reseed** - Fresh database with all event data

### Verified API endpoints:
- `GET /api/events?userId=...&userRole=MCLUB_STAFF` → Returns 3 events with all RSVPs
- `GET /api/events?userId=...&userRole=AGENT` → Returns 2 PUBLISHED events with own RSVPs
- `GET /api/events?userId=...&userRole=END_USER` → Returns 2 PUBLISHED events
- `POST /api/events/[id]/rsvp` → Upsert RSVP with capacity check
- `PATCH /api/events/[id]` → Update event status (MCLUB_STAFF only)
- `DELETE /api/events/[id]` → Delete event and its RSVPs (MCLUB_STAFF only)

### Seed data created:
- 3 ClubEvents (2 PUBLISHED, 1 DRAFT)
- 4 RSVPs (3 CONFIRMED, 1 PENDING)

### Server status:
Running on port 3000 via `.zscripts/dev.sh`
