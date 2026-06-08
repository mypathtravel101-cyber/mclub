# Task 3, 4, 5 - CSV Export, Enhanced Profile, Global Search

## Agent: full-stack-developer
## Date: 2026-03-04

### Work Summary

Implemented three features for the MCLUB CRM:

#### Feature 3: CSV Export
- **Backend**: Created `/api/export/route.ts` - GET endpoint with `type=clients|orders|commissions` query param
  - Role-based filtering (agents see own clients/orders, SME sees their product orders, end users see their orders)
  - BOM (`\uFEFF`) for Excel UTF-8 compatibility
  - Proper CSV headers in Traditional Chinese
  - `Content-Type: text/csv; charset=utf-8` and `Content-Disposition` headers
  - `export const dynamic = 'force-dynamic'`
- **Frontend**: Added "📥 匯出CSV" buttons to ClientList, OrderList, and CommissionList components
  - ClientList: only visible for MCLUB_STAFF and AGENT roles
  - OrderList and CommissionList: visible for all roles
  - Uses blob download pattern

#### Feature 4: Enhanced User Profile & Settings
- **Backend**: Created `/api/users/[id]/route.ts` - GET user profile + PATCH update profile
  - Only allow users to update their own profile (userId check)
  - Updates name, phone, avatar fields
- **Backend**: Created `/api/auth/change-password/route.ts` - POST change password
  - Validates current password, requires 6+ char new password
  - Uses same simpleHash as login route
- **Frontend**: Replaced `MemberProfile` with `EnhancedProfile` component
  - Tab 1: 個人資料 - Avatar (initials fallback), editable name/phone, read-only email/role, save button
  - Tab 2: 帳戶設定 - Change password section, language preference (display only), notification toggle switches
- **Sidebar**: Added `{ key: 'profile', label: '設定', icon: '⚙️' }` to MCLUB_STAFF, SME_OWNER, AGENT menus
  - Changed END_USER's profile entry from `會員 ⭐` to `設定 ⚙️`

#### Feature 5: Global Search
- **Backend**: Created `/api/search/route.ts` - GET endpoint with `q` query param
  - Searches across Clients (name, phone, email), Orders (product name, client name), Events (title, venue)
  - Role-based filtering applies
  - Limits each category to 5 results
  - `export const dynamic = 'force-dynamic'`
- **Frontend**: Added search bar to Home component header
  - Search icon 🔍 on left, input field, clear button
  - Debounced 300ms search
  - Results dropdown with 3 sections: 👥 客戶, 📋 訂單, 🎉 活動
  - Clickable results navigate to relevant section
  - "無搜尋結果" when empty
  - Closes on click outside or Escape key
  - Responsive (full width on mobile via flex-1, fixed max width on desktop)

### Files Changed
- `/src/app/api/export/route.ts` (new)
- `/src/app/api/users/[id]/route.ts` (new)
- `/src/app/api/auth/change-password/route.ts` (new)
- `/src/app/api/search/route.ts` (new)
- `/src/app/page.tsx` (modified - added EnhancedProfile, search UI, export buttons, profile nav items)

### Lint Status
- All lint errors are pre-existing (useEffect patterns). No new errors introduced.
