export type UserRole = 'MCLUB_STAFF' | 'SME_OWNER' | 'AGENT' | 'END_USER';
export type OrderStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'SETTLED';
export type MemberLevel = 'PLAN_A' | 'PLAN_B' | 'PLAN_C' | 'FULL';
export type CommissionStatus = 'PENDING' | 'PAID';

export interface User {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  role: UserRole;
  avatar: string | null;
  referredById: string | null;
  referredBy?: { id: string; name: string } | null;
  ownedProducts?: { id: string; name: string }[];
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  description: string;
  keyPoints: string;
  minInvestment: string | null;
  smeOwnerId: string;
  commissionRules: string;
  icon: string | null;
  color: string | null;
  smeOwner?: { id: string; name: string };
  orderCount?: number;
}

export interface Client {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  source: string | null;
  memberLevel: MemberLevel;
  notes: string | null;
  agentId: string;
  agent?: { id: string; name: string };
  totalSpent: number;
  orders?: OrderWithProduct[];
  timelineEvents?: TimelineEvent[];
  createdAt: string;
}

export interface Order {
  id: string;
  productId: string;
  endUserId: string;
  clientId: string;
  agentId: string | null;
  status: OrderStatus;
  amount: number;
  currency: string;
  notes: string | null;
  commissionSettled: boolean;
  product?: { id: string; name: string; icon: string | null; color: string | null };
  endUser?: { id: string; name: string };
  client?: { id: string; name: string; memberLevel?: MemberLevel };
  agent?: { id: string; name: string };
  createdAt: string;
}

export type OrderWithProduct = Order;

export interface Commission {
  id: string;
  orderId: string;
  recipientId: string;
  role: UserRole;
  amount: number;
  status: CommissionStatus;
  order?: {
    id: string;
    product?: { id: string; name: string; icon: string | null };
    client?: { id: string; name: string };
  };
  recipient?: { id: string; name: string; role: UserRole };
  createdAt: string;
}

export interface TimelineEvent {
  id: string;
  clientId: string;
  orderId: string | null;
  eventType: string;
  title: string;
  description: string | null;
  createdById: string | null;
  createdBy?: { id: string; name: string } | null;
  order?: { id: string; amount: number; status: string } | null;
  createdAt: string;
}

export type ViewId = string;

export interface NavItem {
  id: ViewId;
  label: string;
  icon: string;
}

export const MCLUB_NAV: NavItem[] = [
  { id: 'overview', label: '總覽', icon: 'LayoutDashboard' },
  { id: 'clients', label: '客戶管理', icon: 'Users' },
  { id: 'orders', label: '訂單管理', icon: 'FileText' },
  { id: 'products', label: '產品管理', icon: 'Package' },
  { id: 'users', label: '用戶管理', icon: 'UserCog' },
  { id: 'commissions', label: '佣金管理', icon: 'Coins' },
];

export const SME_NAV: NavItem[] = [
  { id: 'overview', label: '總覽', icon: 'LayoutDashboard' },
  { id: 'products', label: '我的產品', icon: 'Package' },
  { id: 'orders', label: '訂單', icon: 'FileText' },
  { id: 'commissions', label: '收入', icon: 'Coins' },
];

export const AGENT_NAV: NavItem[] = [
  { id: 'overview', label: '總覽', icon: 'LayoutDashboard' },
  { id: 'clients', label: '我的客戶', icon: 'Users' },
  { id: 'commissions', label: '佣金', icon: 'Coins' },
  { id: 'products', label: '產品資訊', icon: 'Package' },
];

export const ENDUSER_NAV: NavItem[] = [
  { id: 'overview', label: '總覽', icon: 'LayoutDashboard' },
  { id: 'products', label: '我的產品', icon: 'Package' },
  { id: 'membership', label: '會員等級', icon: 'Crown' },
];

export function getNavForRole(role: UserRole): NavItem[] {
  switch (role) {
    case 'MCLUB_STAFF': return MCLUB_NAV;
    case 'SME_OWNER': return SME_NAV;
    case 'AGENT': return AGENT_NAV;
    case 'END_USER': return ENDUSER_NAV;
  }
}

export const STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: '待確認',
  IN_PROGRESS: '進行中',
  COMPLETED: '已完成',
  SETTLED: '已分帳',
};

export const MEMBER_LABELS: Record<MemberLevel, string> = {
  PLAN_A: 'Plan A',
  PLAN_B: 'Plan B',
  PLAN_C: 'Plan C',
  FULL: 'FULL',
};

export const ROLE_LABELS: Record<UserRole, string> = {
  MCLUB_STAFF: 'MCLUB Admin',
  SME_OWNER: 'SME老闆',
  AGENT: 'Agent',
  END_USER: 'End User',
};

export const EVENT_TYPE_ICONS: Record<string, string> = {
  purchase: '🛒',
  upgrade: '⬆️',
  followup: '📞',
  note: '📝',
  status_change: '🔄',
};

// ── FX Risk Modelling Types ──

export type StressScenario = 'MILD' | 'MODERATE' | 'EXTREME';
export type AlertStatus = 'ACTIVE' | 'TRIGGERED' | 'DISMISSED';
export type HedgingStatus = 'PENDING' | 'MATCHED' | 'COMPLETED' | 'CANCELLED';

export interface FXStressTest {
  id: string;
  userId: string;
  portfolio: string; // JSON string
  baseCurrency: string;
  results: string; // JSON string
  totalAssetValue: number;
  maxLossAmount: number;
  reportUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CurrencyAlert {
  id: string;
  userId: string;
  fromCurrency: string;
  toCurrency: string;
  threshold: number;
  direction: string;
  status: AlertStatus;
  triggeredAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface HedgingMatch {
  id: string;
  userId: string;
  stressTestId: string | null;
  hedgingType: string;
  fromCurrency: string;
  toCurrency: string;
  amount: number;
  status: HedgingStatus;
  matchedProvider: string | null; // JSON string
  quote: string | null; // JSON string
  commissionRate: number;
  commissionAmount: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CurrencyRate {
  id: string;
  fromCurrency: string;
  toCurrency: string;
  rate: number;
  source: string;
  date: string;
}

export interface PortfolioItem {
  productId: string;
  productName: string;
  currency: string;
  amount: number;
  weight: number;
}

export interface StressTestResult {
  totalLoss: number;
  items: { currency: string; loss: number; percent: number }[];
}

export interface StressTestResults {
  mild: StressTestResult;
  moderate: StressTestResult;
  extreme: StressTestResult;
}
