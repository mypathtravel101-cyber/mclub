# Work Log - Tasks 7, 8, 9, 10, 11

## Feature 7: Order Creation Flow (➕ 新增訂單)
- Added "+ 新增訂單" button to OrderList (only for MCLUB_STAFF and AGENT roles)
- Created form with: Product selection (fetch from /api/products), Client selection (fetch from /api/clients), Amount (auto-fill from product's minInvestment), Currency (HKD/USD/RMB/JPY), Agent (auto-filled for AGENT, dropdown for MCLUB_STAFF), Notes (textarea)
- Updated /api/orders/route.ts:
  - Enhanced GET to include agent, product.smeOwner, commissions, timelineEvents relations
  - Updated POST to handle endUserId creation, auto-set agentId for AGENT role, return full order with relations
- Updated /api/orders/[id]/route.ts:
  - Added GET endpoint for single order detail with full relations (product with smeOwner, agent, commissions, timelineEvents)

## Feature 8: Product CRUD (📦 產品管理)
- Added "+ 新增產品" button for MCLUB_STAFF and SME_OWNER
- Full create form with: Name, Category (保險/投資/移民/教育/醫療/其他), Description, Key Points (comma-separated → JSON), Min Investment, Icon (emoji), Color (color picker), Commission Rules (Agent/SME/MCLUB %), SME Owner (dropdown for MCLUB_STAFF)
- Edit mode: same form pre-filled when clicking ✏️ button
- Delete with confirmation when clicking 🗑️ button
- Ownership check: SME_OWNER can only edit/delete their own products
- Updated /api/products/route.ts with POST, PATCH, DELETE handlers

## Feature 9: Client Notes & Follow-up (📝 客戶備註)
- Added "📝 新增備註" button above timeline section in client detail view
- Note form with: Event Type (備註/跟進/升級/狀態變更), Title, Description
- Added "📞 快速跟進" button that auto-creates a follow-up timeline event
- Posts to /api/clients/[id]/timeline
- After submission, refreshes client detail to show new timeline entry
- Updated /api/clients/[id]/timeline/route.ts to return event with createdBy relation
- Enhanced timeline display with event type badges (🛒 購買, ⬆️ 升級, 📞 跟進, 📝 備註, 🔄 狀態變更)

## Feature 10: Enhanced Overview Dashboard with Mini Charts
- Added analyticsData state to main App component
- Load analytics data alongside dashboard data in loadDashboard()
- MCLUB_STAFF: Added revenue sparkline (last 6 months) and mini order status donut chart
- AGENT: Added commission trend sparkline
- SME_OWNER: Added revenue trend sparkline
- All charts use Recharts with 120px height, dark theme tooltips
- Updated OverviewDashboard props to accept analyticsData

## Feature 11: Order Detail View with Commission Preview
- Clicking an order card navigates to detail view (with ← 返回訂單列表 button)
- Order detail shows: Full order info (product, client, amount, status, dates, notes), Agent info
- Commission Preview section: Shows commission split based on product's commission rules
  - Agent gets agentRate% of amount, SME gets smeRate%, MCLUB gets mclubRate%
  - Each recipient shown with name and calculated amount
- If commissionSettled, shows actual Commission records with PAID/PENDING status
- Order Timeline: Shows all timeline events for the order
- Status action buttons available inline for MCLUB_STAFF
