---
Task ID: fx-risk-mvp
Agent: full-stack-developer
Task: Implement FX Risk Modelling Service MVP

Work Log:
- Read and analyzed existing codebase: prisma schema, page.tsx (~1300 lines SPA), types.ts, seed route, auth-helpers, db config
- Updated Prisma schema (prisma/schema.prisma):
  - Added 3 new enums: StressScenario, AlertStatus, HedgingStatus
  - Added 4 new models: FXStressTest, CurrencyAlert, HedgingMatch, CurrencyRate
  - Added 3 new relations to User model: stressTests, currencyAlerts, hedgingMatches
  - Added hedgingMatches relation to FXStressTest model
  - Ran `npx prisma db push` successfully - database synced
- Updated TypeScript types (src/components/mclub/types.ts):
  - Added FX Risk types: StressScenario, AlertStatus, HedgingStatus
  - Added interfaces: FXStressTest, CurrencyAlert, HedgingMatch, CurrencyRate, PortfolioItem, StressTestResult, StressTestResults
- Created 8 API route files:
  - src/app/api/fx/rates/route.ts — GET current exchange rates (hardcoded demo)
  - src/app/api/fx/dashboard/route.ts — GET multi-currency dashboard data
  - src/app/api/fx/stress-test/route.ts — GET list + POST create stress test
  - src/app/api/fx/stress-test/[id]/route.ts — GET single stress test detail
  - src/app/api/fx/hedging/route.ts — GET list + POST create hedging request
  - src/app/api/fx/hedging/[id]/route.ts — PATCH status + DELETE
  - src/app/api/fx/alerts/route.ts — GET list + POST create alert
  - src/app/api/fx/alerts/[id]/route.ts — PATCH status + DELETE
  - All routes use getUserAuth for authentication, db for data, force-dynamic
- Updated seed data (src/app/api/seed/route.ts):
  - Added 3 CurrencyRate entries (USD/HKD, USD/JPY, USD/RMB)
  - Added 2 FXStressTest entries for demo users
  - Added 3 CurrencyAlert entries (JPY/HKD down 5%, USD/RMB down 3%, JPY/USD down 10%)
  - Added 2 HedgingMatch entries (one PENDING, one MATCHED)
- Updated frontend (src/app/page.tsx):
  - Added FX Risk type definitions (AlertStatus, HedgingStatus, FXStressTest, CurrencyAlert, HedgingMatch, CurrencyRate)
  - Added FX nav item (💱 FX風險) to all 4 role menus
  - Added `case 'fx': return <FXRisk user={user} />;` to renderContent switch
  - Created FXRisk component with 4 tabs:
    1. Dashboard Tab (儀表板): total asset value, daily FX impact, multi-currency positions, triggered alerts
    2. Stress Test Tab (壓力測試): portfolio selection, 3 scenario cards (5%/15%/30%), per-currency breakdown, historical records
    3. Hedging Tab (對沖方案): create hedging request form, matched provider details, status management
    4. Alerts Tab (匯率預警): create alert form, toggle/dismiss alerts, direction/threshold config
  - Added FX-specific helper constants: fxStatusLabel, fxStatusClass, hedgingStatusLabel, hedgingStatusClass, hedgingTypeLabel, currencyIcon
- Ran lint check - only pre-existing errors remain (carousel.tsx, use-mobile.ts, and existing page.tsx useEffect patterns)
- Committed and pushed to main branch

Stage Summary:
- Successfully implemented full FX Risk Modelling Service MVP with 4 core features
- All 4 roles (MCLUB_STAFF, SME_OWNER, AGENT, END_USER) can access the FX Risk module
- Backend: 8 API routes with full CRUD operations, hardcoded demo FX rates
- Frontend: FXRisk component with 4 interactive sub-views using existing mclub-card styling
- Database: 4 new Prisma models with proper relations, seed data for demo
- Stress test calculation: 3 scenarios (5%/15%/30%) with per-currency loss breakdown
- Code pushed to: https://github.com/mypathtravel101-cyber/mclub.git (main branch)
