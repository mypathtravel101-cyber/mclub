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
