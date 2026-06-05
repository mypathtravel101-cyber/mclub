'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

// ── Types ──
type UserRole = 'MCLUB_STAFF' | 'SME_OWNER' | 'AGENT' | 'END_USER';
type OrderStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'SETTLED';
type MemberLevel = 'PLAN_A' | 'PLAN_B' | 'PLAN_C' | 'FULL';

interface User { id: string; email: string; name: string; phone?: string; role: UserRole; avatar?: string; }
interface Product { id: string; name: string; category: string; description: string; keyPoints: string; minInvestment?: string; icon?: string; color?: string; commissionRules?: string; smeOwnerId: string; smeOwner?: { name: string }; }
interface Client { id: string; name: string; phone?: string; email?: string; source?: string; memberLevel: MemberLevel; agentId: string; totalSpent: number; agent?: { id: string; name: string }; orders?: Order[]; timelineEvents?: TimelineEvent[]; }
interface Order { id: string; productId: string; endUserId: string; clientId: string; agentId?: string; status: OrderStatus; amount: number; currency: string; notes?: string; commissionSettled: boolean; product?: Product; client?: { name: string; memberLevel?: string }; endUser?: { name: string }; commissions?: Commission[]; }
interface Commission { id: string; orderId: string; recipientId: string; role: UserRole; amount: number; status: 'PENDING' | 'PAID'; order?: { product?: { name: string; icon: string }; client?: { name: string } }; recipient?: { name: string; role: string }; }
interface TimelineEvent { id: string; clientId: string; orderId?: string; eventType: string; title: string; description?: string; createdById?: string; createdBy?: { name: string }; createdAt: string; }

type EventStatus = 'DRAFT' | 'PUBLISHED' | 'CANCELLED' | 'COMPLETED';
type RSVPStatus = 'PENDING' | 'CONFIRMED' | 'DECLINED' | 'CHECKED_IN';
type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE';
interface ClubEvent { id: string; title: string; description?: string; category?: string; venue?: string; eventDate: string; endDate?: string; status: EventStatus; maxAttendees?: number; isPublic: boolean; fee: number; currency: string; coverImage?: string; contactPerson?: string; sponsor?: string; createdById: string; createdBy?: { id: string; name: string; role: string }; rsvps?: RSVP[]; tasks?: EventTask[]; budgetItems?: EventBudgetItem[]; _count?: { rsvps: number; tasks: number; budgetItems: number }; }
interface RSVP { id: string; eventId: string; userId: string; status: RSVPStatus; notes?: string; guests: number; user?: { id: string; name: string; email?: string; role?: string }; }
interface EventTask { id: string; eventId: string; title: string; description?: string; status: TaskStatus; dueDate?: string; priority: string; assigneeId?: string; assignee?: { id: string; name: string; role?: string }; createdAt: string; }
interface EventBudgetItem { id: string; eventId: string; category: string; description: string; estimatedCost: number; actualCost?: number; }

// ── API Helper ──
const API_BASE = '/api';

function appendAuthParams(path: string, user: User | null): string {
  if (!user) return path;
  const sep = path.includes('?') ? '&' : '?';
  return `${path}${sep}userId=${encodeURIComponent(user.id)}&userRole=${encodeURIComponent(user.role)}`;
}

async function apiFetch(path: string, user: User | null, opts?: RequestInit) {
  const authPath = appendAuthParams(path, user);
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000); // 15s timeout
  try {
    const res = await fetch(`${API_BASE}${authPath}`, { ...opts, signal: controller.signal, headers: { ...headers, ...(opts?.headers as Record<string, string> || {}) } });
    return res.json();
  } finally {
    clearTimeout(timeout);
  }
}

// ── Status helpers ──
const statusLabel: Record<OrderStatus, string> = { PENDING: '待確認', IN_PROGRESS: '進行中', COMPLETED: '已完成', SETTLED: '已分帳' };
const statusClass: Record<OrderStatus, string> = { PENDING: 'status-pending', IN_PROGRESS: 'status-in_progress', COMPLETED: 'status-completed', SETTLED: 'status-settled' };
const memberLabel: Record<MemberLevel, string> = { PLAN_A: 'Plan A 入門', PLAN_B: 'Plan B 進階', PLAN_C: 'Plan C 高端', FULL: 'MCLUB全會員' };
const roleLabel: Record<UserRole, string> = { MCLUB_STAFF: 'MCLUB Admin', SME_OWNER: 'SME老闆', AGENT: 'Agent經紀', END_USER: '客戶' };
const eventStatusLabel: Record<EventStatus, string> = { DRAFT: '草稿', PUBLISHED: '已發佈', CANCELLED: '已取消', COMPLETED: '已完成' };
const eventStatusClass: Record<EventStatus, string> = { DRAFT: 'status-pending', PUBLISHED: 'status-completed', CANCELLED: 'status-pending', COMPLETED: 'status-settled' };
const rsvpStatusLabel: Record<RSVPStatus, string> = { PENDING: '待確認', CONFIRMED: '已確認', DECLINED: '已拒絕', CHECKED_IN: '已簽到' };
const taskStatusLabel: Record<TaskStatus, string> = { TODO: '待辦', IN_PROGRESS: '進行中', DONE: '已完成' };
const taskStatusClass: Record<TaskStatus, string> = { TODO: 'status-pending', IN_PROGRESS: 'status-in_progress', DONE: 'status-completed' };
const priorityLabel: Record<string, string> = { high: '高', medium: '中', low: '低' };
const priorityColor: Record<string, string> = { high: 'text-red-400', medium: 'text-yellow-400', low: 'text-green-400' };
const budgetCategoryLabel: Record<string, string> = { venue: '場地', catering: '餐飲', decoration: '佈置', av: '影音', marketing: '宣傳', staff: '人員', other: '其他' };
const eventCategoryLabel: Record<string, string> = { networking: '交流', seminar: '研討會', dinner: '晚宴', workshop: '工作坊', celebration: '慶典' };

function rsvpStatusClass(s: RSVPStatus): string {
  return s === 'CONFIRMED' || s === 'CHECKED_IN' ? 'status-completed' : s === 'DECLINED' ? 'status-pending' : 'status-in_progress';
}

function eventStatusBadge(s: EventStatus): string {
  return 'text-xs px-2 py-0.5 rounded-full ' + eventStatusClass[s];
}

function orderStatusBadge(s: OrderStatus): string {
  return 'text-xs px-2 py-0.5 rounded-full ' + statusClass[s];
}

// ── Login Page ──
function LoginPage({ onLogin }: { onLogin: (user: User) => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      // Seed first
      await fetch(`${API_BASE}/seed`, { method: 'POST' });
      const res = await fetch(`${API_BASE}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
      const data = await res.json();
      if (data.error) { setError(data.error); } else { onLogin(data.user); }
    } catch { setError('連線失敗'); }
    setLoading(false);
  };

  const demoAccounts = [
    { email: 'kenneth@parkzeman.com', label: 'MCLUB Admin', icon: '👤' },
    { email: 'calvin@mclub.com', label: 'SME老闆', icon: '🏢' },
    { email: 'agent@mclub.com', label: 'Agent經紀', icon: '🤝' },
    { email: 'user@mclub.com', label: '客戶', icon: '🎯' },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(135deg, #0f1923 0%, #1a2330 50%, #0f1923 100%)' }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gold mb-2">MCLUB</h1>
          <p className="text-[#8899aa] text-sm">百盛家族辦公室 · 客戶關係管理系統</p>
        </div>
        <div className="mclub-card">
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm text-[#8899aa] mb-1">電郵地址</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full p-3 text-sm" placeholder="輸入電郵" required />
            </div>
            <div>
              <label className="block text-sm text-[#8899aa] mb-1">密碼</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full p-3 text-sm" placeholder="輸入密碼" required />
            </div>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <button type="submit" disabled={loading} className="w-full p-3 rounded-lg font-bold text-black" style={{ background: 'var(--gold)' }}>
              {loading ? '登入中...' : '登入'}
            </button>
          </form>
          <div className="mt-6 pt-4 border-t border-[#2a3a4e]">
            <p className="text-xs text-[#5a6a7a] mb-3">示範帳號（密碼：demo123）</p>
            <div className="grid grid-cols-2 gap-2">
              {demoAccounts.map(a => (
                <button key={a.email} onClick={() => { setEmail(a.email); setPassword('demo123'); }}
                  className="p-2 rounded-lg text-xs text-left hover:bg-[#1f2b3d] border border-[#2a3a4e] transition-colors">
                  <span className="mr-1">{a.icon}</span>{a.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Sidebar Nav ──
function Sidebar({ current, onChange, role, onLogout }: { current: string; onChange: (v: string) => void; role: UserRole; onLogout: () => void }) {
  const menus: Record<UserRole, { key: string; label: string; icon: string }[]> = {
    MCLUB_STAFF: [
      { key: 'overview', label: '總覽', icon: '📊' }, { key: 'clients', label: '客戶', icon: '👥' },
      { key: 'orders', label: '訂單', icon: '📋' }, { key: 'products', label: '產品', icon: '📦' },
      { key: 'commissions', label: '佣金', icon: '💰' }, { key: 'events', label: '活動', icon: '🎉' },
    ],
    SME_OWNER: [
      { key: 'overview', label: '總覽', icon: '📊' }, { key: 'products', label: '產品', icon: '📦' },
      { key: 'orders', label: '訂單', icon: '📋' }, { key: 'commissions', label: '收入', icon: '💰' },
      { key: 'events', label: '活動', icon: '🎉' },
    ],
    AGENT: [
      { key: 'overview', label: '總覽', icon: '📊' }, { key: 'clients', label: '客戶', icon: '👥' },
      { key: 'commissions', label: '佣金', icon: '💰' }, { key: 'products', label: '產品', icon: '📦' },
      { key: 'events', label: '活動', icon: '🎉' },
    ],
    END_USER: [
      { key: 'overview', label: '總覽', icon: '📊' }, { key: 'orders', label: '產品', icon: '📦' },
      { key: 'events', label: '活動', icon: '🎉' }, { key: 'profile', label: '會員', icon: '⭐' },
    ],
  };
  const items = menus[role] || [];
  const itemCount = items.length;

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden md:flex flex-col w-56 border-r border-[#2a3a4e] min-h-screen">
        <div className="p-4 border-b border-[#2a3a4e]">
          <h2 className="text-gold font-bold text-lg">MCLUB</h2>
          <p className="text-[10px] text-[#5a6a7a]">百盛家族辦公室</p>
        </div>
        <nav className="flex-1 p-2 space-y-1">
          {items.map(item => (
            <button key={item.key} onClick={() => onChange(item.key)}
              className={`w-full text-left px-3 py-2.5 rounded-lg text-sm flex items-center gap-2 transition-colors ${current === item.key ? 'nav-active' : 'hover:bg-[#1f2b3d] text-[#8899aa]'}`}>
              <span>{item.icon}</span>{item.label}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-[#2a3a4e]">
          <button onClick={onLogout} className="text-[#5a6a7a] text-sm hover:text-red-400 transition-colors">← 登出</button>
        </div>
      </div>
      {/* Mobile bottom nav — show ALL items with compact layout */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[#1a2330] border-t border-[#2a3a4e] flex z-50 safe-area-pb">
        {items.map(item => (
          <button key={item.key} onClick={() => onChange(item.key)}
            className={`flex-1 py-2 text-center ${itemCount > 5 ? 'text-[10px]' : 'text-xs'} ${current === item.key ? 'text-gold' : 'text-[#5a6a7a]'}`}>
            <div className={itemCount > 5 ? 'text-base' : 'text-lg'}>{item.icon}</div>
            <div className="truncate leading-tight">{item.label}</div>
          </button>
        ))}
      </div>
    </>
  );
}

// ── Stat Card ──
function StatCard({ label, value, sub, gold }: { label: string; value: string | number; sub?: string; gold?: boolean }) {
  return (
    <div className="mclub-card">
      <p className="text-xs text-[#5a6a7a] mb-1">{label}</p>
      <p className={`text-2xl font-bold ${gold ? 'text-gold' : ''}`}>{value}</p>
      {sub && <p className="text-xs text-[#5a6a7a] mt-1">{sub}</p>}
    </div>
  );
}

// ── Overview Dashboard ──
function OverviewDashboard({ user, data, error, loading, onRetry, onNavigate }: { user: User; data: any; error: boolean; loading: boolean; onRetry: () => void; onNavigate: (v: string) => void }) {
  if (error) return (
    <div className="p-8 text-center">
      <p className="text-red-400 mb-2">載入失敗</p>
      <p className="text-xs text-[#5a6a7a] mb-4">請檢查網絡連接後重試</p>
      <button onClick={onRetry} className="px-4 py-2 rounded-lg text-sm font-bold text-black" style={{ background: 'var(--gold)' }}>重試</button>
    </div>
  );
  if (!data) return (
    <div className="p-8 text-center">
      <div className="inline-block w-6 h-6 border-2 border-gold border-t-transparent rounded-full animate-spin mb-3"></div>
      <p className="text-[#5a6a7a] text-sm">載入中...</p>
    </div>
  );
  const fmt = (n: number) => n?.toLocaleString() || '0';

  if (user.role === 'MCLUB_STAFF') {
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-bold">總覽</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="總客戶數" value={data.totalClients} />
          <StatCard label="總訂單數" value={data.totalOrders} sub={`待確認 ${data.pendingOrders}`} />
          <StatCard label="總營收" value={`HK$${fmt(data.totalRevenue)}`} gold />
          <StatCard label="已完成/已分帳" value={`${data.completedOrders} / ${data.settledOrders}`} />
        </div>
        <div className="mclub-card">
          <h3 className="font-bold mb-4">產品銷售概覽</h3>
          <div className="space-y-3">
            {(data.products || []).map((p: any) => (
              <div key={p.id} className="flex items-center justify-between py-2 border-b border-[#2a3a4e] last:border-0">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{p.icon}</span>
                  <span className="text-sm">{p.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-[#5a6a7a]">SME: {p.smeOwner?.name}</span>
                  <span className="text-sm font-bold text-gold">{p._count?.orders || 0} 單</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="mclub-card">
          <h3 className="font-bold mb-4">Agent業績排名</h3>
          {(data.agents || []).map((a: any, i: number) => (
            <div key={a.id} className="flex items-center justify-between py-2 border-b border-[#2a3a4e] last:border-0">
              <span className="text-sm">#{i + 1} {a.name}</span>
              <span className="text-sm text-gold">{a._count?.clients || 0} 客戶</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (user.role === 'SME_OWNER') {
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-bold">總覽</h2>
        <div className="grid grid-cols-2 gap-4">
          <StatCard label="我的收入" value={`HK$${fmt(data.myCommissions)}`} gold />
          <StatCard label="待發放" value={`HK$${fmt(data.myPendingCommissions)}`} />
        </div>
        <div className="mclub-card">
          <h3 className="font-bold mb-4">最近訂單</h3>
          {(data.smeProductOrders || []).map((o: any) => (
            <div key={o.id} className="flex items-center justify-between py-2 border-b border-[#2a3a4e] last:border-0">
              <div>
                <span className="text-sm">{o.product?.icon} {o.product?.name}</span>
                <span className="text-xs text-[#5a6a7a] ml-2">— {o.client?.name}</span>
              </div>
              <span className={orderStatusBadge(o.status)}>{statusLabel[o.status]}</span>
            </div>
          ))}
          {(!data.smeProductOrders || data.smeProductOrders.length === 0) && <p className="text-[#5a6a7a] text-sm">暫無訂單</p>}
        </div>
      </div>
    );
  }

  if (user.role === 'AGENT') {
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-bold">總覽</h2>
        <div className="grid grid-cols-2 gap-4">
          <StatCard label="我的佣金" value={`HK$${fmt(data.myCommissions)}`} gold />
          <StatCard label="待發放" value={`HK$${fmt(data.myPendingCommissions)}`} />
          <StatCard label="我的客戶" value={data.totalClients} />
          <StatCard label="總訂單" value={data.totalOrders} />
        </div>
        <div className="mclub-card">
          <h3 className="font-bold mb-4">我的客戶</h3>
          {(data.myClients || []).map((c: any) => (
            <div key={c.id} className="flex items-center justify-between py-2 border-b border-[#2a3a4e] last:border-0">
              <div>
                <span className="text-sm font-medium">{c.name}</span>
                <span className="text-xs text-[#5a6a7a] ml-2">{memberLabel[c.memberLevel as MemberLevel]}</span>
              </div>
              <div className="text-xs text-gold">{c.orders?.length || 0} 訂單</div>
            </div>
          ))}
        </div>
        <button onClick={() => onNavigate('clients')} className="w-full p-3 rounded-lg border border-[#2a3a4e] text-sm text-[#8899aa] hover:text-gold hover:border-gold transition-colors">
          查看所有客戶 →
        </button>
      </div>
    );
  }

  // END_USER
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">歡迎，{user.name}</h2>
      <div className="mclub-card">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-[#2a3a4e] flex items-center justify-center text-xl">👤</div>
          <div>
            <p className="font-bold">{user.name}</p>
            <p className="text-xs text-[#5a6a7a]">{user.email}</p>
          </div>
        </div>
      </div>
      <div className="mclub-card">
        <h3 className="font-bold mb-4">我的購買記錄</h3>
        {(data.myOrders || []).map((o: any) => (
          <div key={o.id} className="flex items-center justify-between py-2 border-b border-[#2a3a4e] last:border-0">
            <div className="flex items-center gap-2">
              <span>{o.product?.icon}</span>
              <span className="text-sm">{o.product?.name}</span>
            </div>
            <span className={orderStatusBadge(o.status)}>{statusLabel[o.status]}</span>
          </div>
        ))}
        {(!data.myOrders || data.myOrders.length === 0) && <p className="text-[#5a6a7a] text-sm">暫無購買記錄</p>}
      </div>
      <div className="mclub-card">
        <h3 className="font-bold mb-2">升級推薦</h3>
        <p className="text-sm text-[#8899aa]">您的Agent會為您推薦適合的升級方案，敬請期待！</p>
      </div>
    </div>
  );
}

// ── Client List ──
function ClientList({ user }: { user: User }) {
  const [clients, setClients] = useState<Client[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [clientDetail, setClientDetail] = useState<any>(null);
  const [newClient, setNewClient] = useState({ name: '', phone: '', email: '', source: '', memberLevel: 'PLAN_A' as MemberLevel });

  const loadClients = useCallback(async () => {
    const res = await apiFetch('/clients', user);
    if (res.clients) setClients(res.clients);
  }, [user]);

  // Load clients on mount
  useEffect(() => {
    loadClients();
  }, [loadClients]);

  const loadDetail = async (id: string) => {
    setSelected(id);
    const res = await apiFetch(`/clients/${id}`, user);
    if (res.client) setClientDetail(res.client);
  };

  const addClient = async () => {
    if (!newClient.name) return;
    await apiFetch('/clients', user, { method: 'POST', body: JSON.stringify(newClient) });
    setShowAdd(false);
    setNewClient({ name: '', phone: '', email: '', source: '', memberLevel: 'PLAN_A' });
    loadClients();
  };

  if (selected && clientDetail) {
    return (
      <div className="space-y-4">
        <button onClick={() => { setSelected(null); setClientDetail(null); }} className="text-sm text-gold hover:underline">← 返回客戶列表</button>
        <div className="mclub-card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold">{clientDetail.name}</h3>
              <p className="text-xs text-[#5a6a7a]">{clientDetail.phone} · {clientDetail.email}</p>
            </div>
            <span className="text-xs px-2 py-1 rounded-full bg-[#2a3a4e] text-gold">{memberLabel[clientDetail.memberLevel as MemberLevel]}</span>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><span className="text-[#5a6a7a]">來源：</span>{clientDetail.source || '-'}</div>
            <div><span className="text-[#5a6a7a]">Agent：</span>{clientDetail.agent?.name || '-'}</div>
            <div><span className="text-[#5a6a7a]">總消費：</span><span className="text-gold">HK${clientDetail.totalSpent?.toLocaleString()}</span></div>
            <div><span className="text-[#5a6a7a]">訂單數：</span>{clientDetail.orders?.length || 0}</div>
          </div>
        </div>

        <div className="mclub-card">
          <h4 className="font-bold mb-4">📋 客戶Timeline</h4>
          <div className="relative pl-8 space-y-4">
            <div className="timeline-line" />
            {(clientDetail.timelineEvents || []).map((e: TimelineEvent) => (
              <div key={e.id} className="relative">
                <div className="timeline-dot" />
                <div className="ml-4">
                  <p className="text-sm font-medium">{e.title}</p>
                  {e.description && <p className="text-xs text-[#8899aa]">{e.description}</p>}
                  <p className="text-[10px] text-[#5a6a7a]">{new Date(e.createdAt).toLocaleDateString('zh-HK')} {e.createdBy?.name && `— ${e.createdBy.name}`}</p>
                </div>
              </div>
            ))}
            {(!clientDetail.timelineEvents || clientDetail.timelineEvents.length === 0) && <p className="text-[#5a6a7a] text-sm">暫無記錄</p>}
          </div>
        </div>

        <div className="mclub-card">
          <h4 className="font-bold mb-3">📝 訂單記錄</h4>
          {(clientDetail.orders || []).map((o: Order) => (
            <div key={o.id} className="flex items-center justify-between py-2 border-b border-[#2a3a4e] last:border-0">
              <div className="flex items-center gap-2">
                <span>{o.product?.icon}</span>
                <span className="text-sm">{o.product?.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gold">{o.currency === 'USD' ? 'US$' : 'HK$'}{o.amount.toLocaleString()}</span>
                <span className={orderStatusBadge(o.status)}>{statusLabel[o.status]}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">客戶管理</h2>
        {(user.role === 'MCLUB_STAFF' || user.role === 'AGENT') && (
          <button onClick={() => setShowAdd(!showAdd)} className="px-4 py-2 rounded-lg text-sm font-bold text-black" style={{ background: 'var(--gold)' }}>
            + 新增客戶
          </button>
        )}
      </div>
      {showAdd && (
        <div className="mclub-card space-y-3">
          <input placeholder="姓名 *" value={newClient.name} onChange={e => setNewClient({ ...newClient, name: e.target.value })} className="w-full p-2 text-sm" />
          <input placeholder="電話" value={newClient.phone} onChange={e => setNewClient({ ...newClient, phone: e.target.value })} className="w-full p-2 text-sm" />
          <input placeholder="電郵" value={newClient.email} onChange={e => setNewClient({ ...newClient, email: e.target.value })} className="w-full p-2 text-sm" />
          <select value={newClient.memberLevel} onChange={e => setNewClient({ ...newClient, memberLevel: e.target.value as MemberLevel })} className="w-full p-2 text-sm">
            <option value="PLAN_A">Plan A 入門</option><option value="PLAN_B">Plan B 進階</option><option value="PLAN_C">Plan C 高端</option>
          </select>
          <button onClick={addClient} className="px-4 py-2 rounded-lg text-sm font-bold text-black" style={{ background: 'var(--gold)' }}>確認新增</button>
        </div>
      )}
      <div className="space-y-2">
        {clients.map(c => (
          <div key={c.id} onClick={() => loadDetail(c.id)} className="mclub-card mclub-card-hover cursor-pointer flex items-center justify-between">
            <div>
              <span className="font-medium">{c.name}</span>
              <span className="text-xs text-[#5a6a7a] ml-2">{c.phone || ''}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs px-2 py-0.5 rounded-full bg-[#2a3a4e] text-[#8899aa]">{memberLabel[c.memberLevel]}</span>
              <span className="text-xs text-gold">HK${c.totalSpent?.toLocaleString()}</span>
            </div>
          </div>
        ))}
        {clients.length === 0 && <p className="text-[#5a6a7a] text-sm text-center py-8">暫無客戶</p>}
      </div>
    </div>
  );
}

// ── Order List ──
function OrderList({ user }: { user: User }) {
  const [orders, setOrders] = useState<Order[]>([]);

  const loadOrders = useCallback(async () => {
    const res = await apiFetch('/orders', user);
    if (res.orders) setOrders(res.orders);
  }, [user]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const updateStatus = async (id: string, status: OrderStatus) => {
    await apiFetch(`/orders/${id}`, user, { method: 'PATCH', body: JSON.stringify({ status }) });
    loadOrders();
  };

  const settleOrder = async (id: string) => {
    if (!confirm('確認分帳？此操作將自動計算佣金。')) return;
    const res = await apiFetch(`/orders/${id}/settle`, user, { method: 'POST' });
    if (res.message) alert(res.message);
    loadOrders();
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">訂單管理</h2>
      <div className="space-y-3">
        {orders.map(o => (
          <div key={o.id} className="mclub-card">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-lg">{o.product?.icon}</span>
                <span className="font-medium text-sm">{o.product?.name}</span>
              </div>
              <span className={orderStatusBadge(o.status)}>{statusLabel[o.status]}</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs text-[#8899aa] mb-2">
              <div>客戶：{o.client?.name || '-'}</div>
              <div>金額：<span className="text-gold font-bold">{o.currency === 'USD' ? 'US$' : 'HK$'}{o.amount.toLocaleString()}</span></div>
            </div>
            {user.role === 'MCLUB_STAFF' && (
              <div className="flex gap-2 mt-2">
                {o.status === 'PENDING' && <button onClick={() => updateStatus(o.id, 'IN_PROGRESS')} className="px-3 py-1 rounded text-xs bg-blue-900 text-blue-300 hover:bg-blue-800">確認 → 進行中</button>}
                {o.status === 'IN_PROGRESS' && <button onClick={() => updateStatus(o.id, 'COMPLETED')} className="px-3 py-1 rounded text-xs bg-green-900 text-green-300 hover:bg-green-800">完成 → 已完成</button>}
                {o.status === 'COMPLETED' && !o.commissionSettled && <button onClick={() => settleOrder(o.id)} className="px-3 py-1 rounded text-xs font-bold text-black" style={{ background: 'var(--gold)' }}>💰 分帳</button>}
              </div>
            )}
          </div>
        ))}
        {orders.length === 0 && <p className="text-[#5a6a7a] text-sm text-center py-8">暫無訂單</p>}
      </div>
    </div>
  );
}

// ── Product List ──
function ProductList({ user }: { user: User }) {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    apiFetch('/products', user).then(res => { if (res.products) setProducts(res.products); });
  }, [user]);

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">產品資訊</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {products.map(p => {
          let rules = { agentRate: 0, smeRate: 0, mclubRate: 0 };
          try { rules = JSON.parse(p.commissionRules || '{}'); } catch {}
          return (
            <div key={p.id} className="mclub-card">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xl" style={{ background: p.color || '#2a3a4e' }}>{p.icon}</div>
                <div>
                  <h3 className="font-bold text-sm">{p.name}</h3>
                  <p className="text-xs text-[#5a6a7a]">{p.category} {p.smeOwner && `· ${p.smeOwner.name}`}</p>
                </div>
              </div>
              <p className="text-xs text-[#8899aa] mb-2">{p.description}</p>
              {p.minInvestment && <p className="text-xs text-gold mb-2">入場：{p.minInvestment}</p>}
              {(user.role === 'MCLUB_STAFF' || user.role === 'AGENT') && (
                <div className="flex gap-2 text-[10px] text-[#5a6a7a]">
                  <span>Agent: {rules.agentRate}%</span>
                  <span>SME: {rules.smeRate}%</span>
                  <span>MCLUB: {rules.mclubRate}%</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Commission List ──
function CommissionList({ user }: { user: User }) {
  const [commissions, setCommissions] = useState<Commission[]>([]);

  useEffect(() => {
    apiFetch('/commissions', user).then(res => { if (res.commissions) setCommissions(res.commissions); });
  }, [user]);

  const total = commissions.reduce((s, c) => s + c.amount, 0);
  const paid = commissions.filter(c => c.status === 'PAID').reduce((s, c) => s + c.amount, 0);

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">{user.role === 'MCLUB_STAFF' ? '佣金管理' : '我的收入'}</h2>
      <div className="grid grid-cols-2 gap-4">
        <StatCard label="總計" value={`HK$${total.toLocaleString()}`} gold />
        <StatCard label="已發放" value={`HK$${paid.toLocaleString()}`} />
      </div>
      <div className="space-y-2">
        {commissions.map(c => (
          <div key={c.id} className="mclub-card flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">{c.order?.product?.icon} {c.order?.product?.name}</p>
              <p className="text-xs text-[#5a6a7a]">客戶：{c.order?.client?.name || '-'} {user.role === 'MCLUB_STAFF' && `· ${c.recipient?.name} (${roleLabel[c.recipient?.role as UserRole] || c.role})`}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-gold">HK${c.amount.toLocaleString()}</p>
              <span className={`text-xs px-2 py-0.5 rounded-full ${c.status === 'PAID' ? 'status-completed' : 'status-pending'}`}>{c.status === 'PAID' ? '已發放' : '待發放'}</span>
            </div>
          </div>
        ))}
        {commissions.length === 0 && <p className="text-[#5a6a7a] text-sm text-center py-8">暫無佣金記錄</p>}
      </div>
    </div>
  );
}

// ── Event List (Enhanced) ──
function EventList({ user }: { user: User }) {
  const [events, setEvents] = useState<ClubEvent[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<ClubEvent | null>(null);
  const [detailTab, setDetailTab] = useState<'details' | 'tasks' | 'budget' | 'attendees'>('details');
  const [newEvent, setNewEvent] = useState({ title: '', description: '', category: 'networking', venue: '', eventDate: '', endDate: '', maxAttendees: '', isPublic: true, fee: '', contactPerson: '', sponsor: '', status: 'DRAFT' as EventStatus });
  const [newTask, setNewTask] = useState({ title: '', description: '', priority: 'medium', dueDate: '', assigneeId: '' });
  const [showAddTask, setShowAddTask] = useState(false);
  const [newBudgetItem, setNewBudgetItem] = useState({ category: 'venue', description: '', estimatedCost: '', actualCost: '' });
  const [showAddBudget, setShowAddBudget] = useState(false);

  const loadEvents = async () => {
    const res = await apiFetch('/e', user);
    if (res.events) setEvents(res.events);
  };

  useEffect(() => { loadEvents(); }, [user]);

  const createEvent = async () => {
    if (!newEvent.title || !newEvent.eventDate) return;
    await apiFetch('/e', user, {
      method: 'POST',
      body: JSON.stringify({
        ...newEvent,
        maxAttendees: newEvent.maxAttendees ? parseInt(newEvent.maxAttendees) : null,
        fee: newEvent.fee ? parseFloat(newEvent.fee) : 0,
      }),
    });
    setShowCreate(false);
    setNewEvent({ title: '', description: '', category: 'networking', venue: '', eventDate: '', endDate: '', maxAttendees: '', isPublic: true, fee: '', contactPerson: '', sponsor: '', status: 'DRAFT' });
    loadEvents();
  };

  const rsvpToEvent = async (eventId: string, status: RSVPStatus) => {
    await apiFetch(`/e/${eventId}/rsvp`, user, { method: 'POST', body: JSON.stringify({ status }) });
    loadEvents();
  };

  const updateEventStatus = async (eventId: string, status: EventStatus) => {
    await apiFetch(`/e/${eventId}`, user, { method: 'PATCH', body: JSON.stringify({ status }) });
    loadEvents();
  };

  const deleteEvent = async (eventId: string) => {
    if (!confirm('確認刪除此活動？')) return;
    await apiFetch(`/e/${eventId}`, user, { method: 'DELETE' });
    loadEvents();
  };

  // Task operations
  const addTask = async () => {
    if (!selectedEvent || !newTask.title) return;
    await apiFetch(`/e/${selectedEvent.id}/tasks`, user, {
      method: 'POST',
      body: JSON.stringify({ ...newTask, dueDate: newTask.dueDate || null, assigneeId: newTask.assigneeId || null }),
    });
    setShowAddTask(false);
    setNewTask({ title: '', description: '', priority: 'medium', dueDate: '', assigneeId: '' });
    loadEvents();
    // Refresh selected event
    const fresh = await apiFetch('/e', user);
    if (fresh.events) {
      setEvents(fresh.events);
      const updated = fresh.events.find((ev: ClubEvent) => ev.id === selectedEvent.id);
      if (updated) setSelectedEvent(updated);
    }
  };

  const updateTaskStatus = async (eventId: string, taskId: string, status: TaskStatus) => {
    await apiFetch(`/e/${eventId}/tasks/${taskId}`, user, { method: 'PATCH', body: JSON.stringify({ status }) });
    loadEvents();
    const fresh = await apiFetch('/e', user);
    if (fresh.events) {
      setEvents(fresh.events);
      const updated = fresh.events.find((ev: ClubEvent) => ev.id === selectedEvent?.id);
      if (updated) setSelectedEvent(updated);
    }
  };

  const deleteTask = async (eventId: string, taskId: string) => {
    await apiFetch(`/e/${eventId}/tasks/${taskId}`, user, { method: 'DELETE' });
    loadEvents();
    const fresh = await apiFetch('/e', user);
    if (fresh.events) {
      setEvents(fresh.events);
      const updated = fresh.events.find((ev: ClubEvent) => ev.id === selectedEvent?.id);
      if (updated) setSelectedEvent(updated);
    }
  };

  // Budget operations
  const addBudgetItem = async () => {
    if (!selectedEvent || !newBudgetItem.description) return;
    await apiFetch(`/e/${selectedEvent.id}/budget`, user, {
      method: 'POST',
      body: JSON.stringify({
        ...newBudgetItem,
        estimatedCost: parseFloat(newBudgetItem.estimatedCost) || 0,
        actualCost: newBudgetItem.actualCost ? parseFloat(newBudgetItem.actualCost) : null,
      }),
    });
    setShowAddBudget(false);
    setNewBudgetItem({ category: 'venue', description: '', estimatedCost: '', actualCost: '' });
    const fresh = await apiFetch('/e', user);
    if (fresh.events) {
      setEvents(fresh.events);
      const updated = fresh.events.find((ev: ClubEvent) => ev.id === selectedEvent.id);
      if (updated) setSelectedEvent(updated);
    }
  };

  const deleteBudgetItem = async (eventId: string, budgetId: string) => {
    await apiFetch(`/e/${eventId}/budget/${budgetId}`, user, { method: 'DELETE' });
    const fresh = await apiFetch('/e', user);
    if (fresh.events) {
      setEvents(fresh.events);
      const updated = fresh.events.find((ev: ClubEvent) => ev.id === selectedEvent?.id);
      if (updated) setSelectedEvent(updated);
    }
  };

  // Check-in attendee
  const checkInAttendee = async (eventId: string, rsvpId: string, checkIn: boolean) => {
    await apiFetch(`/e/${eventId}/checkin`, user, { method: 'POST', body: JSON.stringify({ rsvpId, checkIn }) });
    const fresh = await apiFetch('/e', user);
    if (fresh.events) {
      setEvents(fresh.events);
      const updated = fresh.events.find((ev: ClubEvent) => ev.id === selectedEvent?.id);
      if (updated) setSelectedEvent(updated);
    }
  };

  const selectEvent = (e: ClubEvent) => {
    setSelectedEvent(e);
    setDetailTab('details');
  };

  // ── Event Detail View (with Tabs) ──
  if (selectedEvent) {
    const e = selectedEvent;
    const myRsvp = e.rsvps?.find(r => r.userId === user.id);
    const confirmedCount = e.rsvps?.filter(r => r.status === 'CONFIRMED' || r.status === 'CHECKED_IN').length || 0;
    const checkedInCount = e.rsvps?.filter(r => r.status === 'CHECKED_IN').length || 0;
    const fmtDate = (d: string) => new Date(d).toLocaleDateString('zh-HK', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    const tasks = e.tasks || [];
    const doneTasks = tasks.filter(t => t.status === 'DONE').length;
    const budgetItems = e.budgetItems || [];
    const totalEstimated = budgetItems.reduce((s, b) => s + b.estimatedCost, 0);
    const totalActual = budgetItems.reduce((s, b) => s + (b.actualCost || 0), 0);

    const tabs = [
      { key: 'details' as const, label: '詳情', icon: '📋' },
      { key: 'tasks' as const, label: `任務 (${doneTasks}/${tasks.length})`, icon: '✅' },
      { key: 'budget' as const, label: '預算', icon: '💰' },
      { key: 'attendees' as const, label: `出席 (${confirmedCount})`, icon: '👥' },
    ];

    return (
      <div className="space-y-4">
        <button onClick={() => setSelectedEvent(null)} className="text-sm text-gold hover:underline">← 返回活動列表</button>

        {/* Event Header */}
        <div className="mclub-card">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold">🎉 {e.title}</h3>
              {e.category && <span className="text-xs px-2 py-0.5 rounded-full bg-[#2a3a4e] text-[#8899aa]">{eventCategoryLabel[e.category] || e.category}</span>}
            </div>
            <span className={eventStatusBadge(e.status)}>{eventStatusLabel[e.status]}</span>
          </div>

          {/* Quick Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div className="bg-[#0f1923] rounded-lg p-2">
              <span className="text-[#5a6a7a]">出席</span>
              <p className="font-bold text-sm">{confirmedCount}{e.maxAttendees ? `/${e.maxAttendees}` : ''}</p>
            </div>
            <div className="bg-[#0f1923] rounded-lg p-2">
              <span className="text-[#5a6a7a]">已簽到</span>
              <p className="font-bold text-sm text-green-400">{checkedInCount}</p>
            </div>
            <div className="bg-[#0f1923] rounded-lg p-2">
              <span className="text-[#5a6a7a]">任務完成</span>
              <p className="font-bold text-sm">{doneTasks}/{tasks.length}</p>
            </div>
            <div className="bg-[#0f1923] rounded-lg p-2">
              <span className="text-[#5a6a7a]">預算</span>
              <p className="font-bold text-sm text-gold">HK${totalEstimated.toLocaleString()}</p>
            </div>
          </div>

          {/* Admin action buttons */}
          {user.role === 'MCLUB_STAFF' && (
            <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-[#2a3a4e]">
              {e.status === 'DRAFT' && <button onClick={() => updateEventStatus(e.id, 'PUBLISHED')} className="px-3 py-1 rounded text-xs bg-green-900 text-green-300 hover:bg-green-800">發佈活動</button>}
              {e.status === 'PUBLISHED' && <button onClick={() => updateEventStatus(e.id, 'COMPLETED')} className="px-3 py-1 rounded text-xs bg-blue-900 text-blue-300 hover:bg-blue-800">標記完成</button>}
              {e.status === 'PUBLISHED' && <button onClick={() => updateEventStatus(e.id, 'CANCELLED')} className="px-3 py-1 rounded text-xs bg-orange-900 text-orange-300 hover:bg-orange-800">取消活動</button>}
              <button onClick={() => deleteEvent(e.id)} className="px-3 py-1 rounded text-xs bg-red-900 text-red-300 hover:bg-red-800">刪除活動</button>
            </div>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-1 bg-[#1a2330] rounded-lg p-1">
          {tabs.map(tab => (
            <button key={tab.key} onClick={() => setDetailTab(tab.key)}
              className={`flex-1 px-3 py-2 rounded-md text-xs font-medium transition-colors ${detailTab === tab.key ? 'bg-[#2a3a4e] text-gold' : 'text-[#8899aa] hover:text-white'}`}>
              <span className="mr-1">{tab.icon}</span>{tab.label}
            </button>
          ))}
        </div>

        {/* RSVP Actions for non-admin (shown on Details tab) */}
        {detailTab === 'details' && user.role !== 'MCLUB_STAFF' && e.status === 'PUBLISHED' && (
          <div className="mclub-card">
            <h4 className="font-bold mb-3">我的報名狀態</h4>
            {myRsvp ? (
              <div className="flex items-center justify-between">
                <span className={'text-xs px-2 py-1 rounded-full ' + rsvpStatusClass(myRsvp.status)}>
                  {rsvpStatusLabel[myRsvp.status]}
                </span>
                {myRsvp.status !== 'CHECKED_IN' && (
                  <div className="flex gap-2">
                    <button onClick={() => rsvpToEvent(e.id, 'CONFIRMED')} className="px-3 py-1 rounded text-xs bg-green-900 text-green-300 hover:bg-green-800">確認出席</button>
                    <button onClick={() => rsvpToEvent(e.id, 'DECLINED')} className="px-3 py-1 rounded text-xs bg-red-900 text-red-300 hover:bg-red-800">取消出席</button>
                  </div>
                )}
              </div>
            ) : (
              <button onClick={() => rsvpToEvent(e.id, 'CONFIRMED')} className="px-4 py-2 rounded-lg text-sm font-bold text-black" style={{ background: 'var(--gold)' }}>立即報名</button>
            )}
          </div>
        )}

        {/* Tab Content: Details */}
        {detailTab === 'details' && (
          <div className="mclub-card">
            <div className="space-y-2 text-sm">
              <div><span className="text-[#5a6a7a]">日期：</span>{fmtDate(e.eventDate)}</div>
              {e.endDate && <div><span className="text-[#5a6a7a]">結束：</span>{fmtDate(e.endDate)}</div>}
              {e.venue && <div><span className="text-[#5a6a7a]">地點：</span>{e.venue}</div>}
              {e.description && <div><span className="text-[#5a6a7a]">描述：</span><span className="whitespace-pre-wrap">{e.description}</span></div>}
              {e.fee > 0 && <div><span className="text-[#5a6a7a]">費用：</span><span className="text-gold">{e.currency === 'USD' ? 'US$' : 'HK$'}{e.fee.toLocaleString()}</span></div>}
              {e.contactPerson && <div><span className="text-[#5a6a7a]">聯絡人：</span>{e.contactPerson}</div>}
              {e.sponsor && <div><span className="text-[#5a6a7a]">贊助商：</span>{e.sponsor}</div>}
              <div><span className="text-[#5a6a7a]">創建者：</span>{e.createdBy?.name}</div>
            </div>
          </div>
        )}

        {/* Tab Content: Tasks */}
        {detailTab === 'tasks' && (
          <div className="space-y-3">
            {user.role === 'MCLUB_STAFF' && (
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm">活動任務</h3>
                <button onClick={() => setShowAddTask(!showAddTask)} className="px-3 py-1.5 rounded-lg text-xs font-bold text-black" style={{ background: 'var(--gold)' }}>
                  + 新增任務
                </button>
              </div>
            )}
            {showAddTask && (
              <div className="mclub-card space-y-3">
                <input placeholder="任務名稱 *" value={newTask.title} onChange={e => setNewTask({ ...newTask, title: e.target.value })} className="w-full p-2 text-sm" />
                <input placeholder="任務描述" value={newTask.description} onChange={e => setNewTask({ ...newTask, description: e.target.value })} className="w-full p-2 text-sm" />
                <div className="grid grid-cols-2 gap-2">
                  <select value={newTask.priority} onChange={e => setNewTask({ ...newTask, priority: e.target.value })} className="w-full p-2 text-sm">
                    <option value="high">高優先</option><option value="medium">中優先</option><option value="low">低優先</option>
                  </select>
                  <input type="date" value={newTask.dueDate} onChange={e => setNewTask({ ...newTask, dueDate: e.target.value })} className="w-full p-2 text-sm" placeholder="截止日期" />
                </div>
                <div className="flex gap-2">
                  <button onClick={addTask} className="px-4 py-2 rounded-lg text-sm font-bold text-black" style={{ background: 'var(--gold)' }}>確認</button>
                  <button onClick={() => setShowAddTask(false)} className="px-4 py-2 rounded-lg text-sm text-[#8899aa] border border-[#2a3a4e]">取消</button>
                </div>
              </div>
            )}
            {/* Task progress bar */}
            {tasks.length > 0 && (
              <div className="mclub-card">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-[#5a6a7a]">任務進度</span>
                  <span className="text-xs font-bold">{doneTasks}/{tasks.length} 完成</span>
                </div>
                <div className="w-full bg-[#0f1923] rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full transition-all" style={{ width: `${tasks.length > 0 ? (doneTasks / tasks.length) * 100 : 0}%` }}></div>
                </div>
              </div>
            )}
            {tasks.map(t => (
              <div key={t.id} className="mclub-card">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-2 flex-1">
                    {user.role === 'MCLUB_STAFF' && (
                      <button onClick={() => updateTaskStatus(e.id, t.id, t.status === 'DONE' ? 'TODO' : 'DONE')}
                        className={`mt-0.5 w-5 h-5 rounded border flex-shrink-0 flex items-center justify-center text-xs ${t.status === 'DONE' ? 'bg-green-600 border-green-600 text-white' : 'border-[#5a6a7a] hover:border-gold'}`}>
                        {t.status === 'DONE' && '✓'}
                      </button>
                    )}
                    <div className="flex-1">
                      <p className={`text-sm font-medium ${t.status === 'DONE' ? 'line-through text-[#5a6a7a]' : ''}`}>{t.title}</p>
                      {t.description && <p className="text-xs text-[#8899aa] mt-1">{t.description}</p>}
                      <div className="flex items-center gap-3 mt-2 text-xs">
                        <span className={'px-1.5 py-0.5 rounded ' + taskStatusClass[t.status]}>{taskStatusLabel[t.status]}</span>
                        <span className={priorityColor[t.priority] || ''}>● {priorityLabel[t.priority] || t.priority}</span>
                        {t.dueDate && <span className="text-[#5a6a7a]">截止：{new Date(t.dueDate).toLocaleDateString('zh-HK')}</span>}
                        {t.assignee && <span className="text-[#5a6a7a]">負責：{t.assignee.name}</span>}
                      </div>
                    </div>
                  </div>
                  {user.role === 'MCLUB_STAFF' && t.status !== 'DONE' && (
                    <div className="flex gap-1 ml-2">
                      {t.status === 'TODO' && <button onClick={() => updateTaskStatus(e.id, t.id, 'IN_PROGRESS')} className="px-2 py-1 rounded text-[10px] bg-blue-900 text-blue-300">開始</button>}
                      {t.status === 'IN_PROGRESS' && <button onClick={() => updateTaskStatus(e.id, t.id, 'DONE')} className="px-2 py-1 rounded text-[10px] bg-green-900 text-green-300">完成</button>}
                      <button onClick={() => deleteTask(e.id, t.id)} className="px-2 py-1 rounded text-[10px] bg-red-900 text-red-300">刪除</button>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {tasks.length === 0 && <p className="text-[#5a6a7a] text-sm text-center py-8">暫無任務，點擊「新增任務」開始規劃</p>}
          </div>
        )}

        {/* Tab Content: Budget */}
        {detailTab === 'budget' && (
          <div className="space-y-3">
            {user.role === 'MCLUB_STAFF' && (
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm">活動預算</h3>
                <button onClick={() => setShowAddBudget(!showAddBudget)} className="px-3 py-1.5 rounded-lg text-xs font-bold text-black" style={{ background: 'var(--gold)' }}>
                  + 新增預算項目
                </button>
              </div>
            )}
            {/* Budget Summary */}
            <div className="grid grid-cols-2 gap-3">
              <StatCard label="預估總額" value={`HK$${totalEstimated.toLocaleString()}`} gold />
              <StatCard label="實際支出" value={`HK$${totalActual.toLocaleString()}`} sub={totalEstimated > 0 ? `佔預算 ${Math.round((totalActual / totalEstimated) * 100)}%` : undefined} />
            </div>
            {totalEstimated > 0 && (
              <div className="mclub-card">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-[#5a6a7a]">預算使用率</span>
                  <span className={`text-xs font-bold ${totalActual > totalEstimated ? 'text-red-400' : 'text-green-400'}`}>{Math.round((totalActual / totalEstimated) * 100)}%</span>
                </div>
                <div className="w-full bg-[#0f1923] rounded-full h-2">
                  <div className={`h-2 rounded-full transition-all ${totalActual > totalEstimated ? 'bg-red-500' : 'bg-gold'}`} style={{ width: `${Math.min((totalActual / totalEstimated) * 100, 100)}%` }}></div>
                </div>
              </div>
            )}
            {showAddBudget && (
              <div className="mclub-card space-y-3">
                <select value={newBudgetItem.category} onChange={e => setNewBudgetItem({ ...newBudgetItem, category: e.target.value })} className="w-full p-2 text-sm">
                  <option value="venue">場地</option><option value="catering">餐飲</option><option value="decoration">佈置</option>
                  <option value="av">影音</option><option value="marketing">宣傳</option><option value="staff">人員</option><option value="other">其他</option>
                </select>
                <input placeholder="項目描述 *" value={newBudgetItem.description} onChange={e => setNewBudgetItem({ ...newBudgetItem, description: e.target.value })} className="w-full p-2 text-sm" />
                <div className="grid grid-cols-2 gap-2">
                  <input placeholder="預估金額 (HKD)" type="number" value={newBudgetItem.estimatedCost} onChange={e => setNewBudgetItem({ ...newBudgetItem, estimatedCost: e.target.value })} className="w-full p-2 text-sm" />
                  <input placeholder="實際金額 (HKD)" type="number" value={newBudgetItem.actualCost} onChange={e => setNewBudgetItem({ ...newBudgetItem, actualCost: e.target.value })} className="w-full p-2 text-sm" />
                </div>
                <div className="flex gap-2">
                  <button onClick={addBudgetItem} className="px-4 py-2 rounded-lg text-sm font-bold text-black" style={{ background: 'var(--gold)' }}>確認</button>
                  <button onClick={() => setShowAddBudget(false)} className="px-4 py-2 rounded-lg text-sm text-[#8899aa] border border-[#2a3a4e]">取消</button>
                </div>
              </div>
            )}
            {budgetItems.map(b => (
              <div key={b.id} className="mclub-card">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-[#2a3a4e] text-[#8899aa]">{budgetCategoryLabel[b.category] || b.category}</span>
                      <span className="text-sm font-medium">{b.description}</span>
                    </div>
                    <div className="flex items-center gap-4 text-xs">
                      <span className="text-[#5a6a7a]">預估：<span className="text-gold font-bold">HK${b.estimatedCost.toLocaleString()}</span></span>
                      {b.actualCost != null && (
                        <span className="text-[#5a6a7a]">實際：<span className={b.actualCost > b.estimatedCost ? 'text-red-400' : 'text-green-400'}>HK${b.actualCost.toLocaleString()}</span></span>
                      )}
                    </div>
                  </div>
                  {user.role === 'MCLUB_STAFF' && (
                    <button onClick={() => deleteBudgetItem(e.id, b.id)} className="ml-2 px-2 py-1 rounded text-xs bg-red-900 text-red-300 hover:bg-red-800">刪除</button>
                  )}
                </div>
              </div>
            ))}
            {budgetItems.length === 0 && <p className="text-[#5a6a7a] text-sm text-center py-8">暫無預算項目，點擊「新增預算項目」開始規劃</p>}
          </div>
        )}

        {/* Tab Content: Attendees */}
        {detailTab === 'attendees' && (
          <div className="space-y-3">
            {user.role !== 'MCLUB_STAFF' && e.status === 'PUBLISHED' && (
              <div className="mclub-card">
                <h4 className="font-bold mb-3">我的報名狀態</h4>
                {myRsvp ? (
                  <div className="flex items-center justify-between">
                    <span className={'text-xs px-2 py-1 rounded-full ' + rsvpStatusClass(myRsvp.status)}>
                      {rsvpStatusLabel[myRsvp.status]}
                    </span>
                    {myRsvp.status !== 'CHECKED_IN' && (
                      <div className="flex gap-2">
                        <button onClick={() => rsvpToEvent(e.id, 'CONFIRMED')} className="px-3 py-1 rounded text-xs bg-green-900 text-green-300 hover:bg-green-800">確認出席</button>
                        <button onClick={() => rsvpToEvent(e.id, 'DECLINED')} className="px-3 py-1 rounded text-xs bg-red-900 text-red-300 hover:bg-red-800">取消出席</button>
                      </div>
                    )}
                  </div>
                ) : (
                  <button onClick={() => rsvpToEvent(e.id, 'CONFIRMED')} className="px-4 py-2 rounded-lg text-sm font-bold text-black" style={{ background: 'var(--gold)' }}>立即報名</button>
                )}
              </div>
            )}
            {/* Attendee stats */}
            <div className="grid grid-cols-3 gap-3">
              <StatCard label="已確認" value={confirmedCount} />
              <StatCard label="已簽到" value={checkedInCount} gold />
              <StatCard label="待確認" value={e.rsvps?.filter(r => r.status === 'PENDING').length || 0} />
            </div>
            {/* Attendee list for MCLUB_STAFF */}
            {user.role === 'MCLUB_STAFF' && e.rsvps && e.rsvps.length > 0 && (
              <div className="space-y-2">
                {e.rsvps.map(r => (
                  <div key={r.id} className="mclub-card">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#2a3a4e] flex items-center justify-center text-sm">
                          {r.user?.name?.charAt(0) || '?'}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{r.user?.name}</p>
                          <div className="flex items-center gap-2 text-xs text-[#5a6a7a]">
                            <span>{rsvpStatusLabel[r.status]}</span>
                            {r.guests > 0 && <span>+{r.guests}賓客</span>}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={'text-xs px-2 py-0.5 rounded-full ' + rsvpStatusClass(r.status)}>
                          {rsvpStatusLabel[r.status]}
                        </span>
                        {user.role === 'MCLUB_STAFF' && r.status === 'CONFIRMED' && (
                          <button onClick={() => checkInAttendee(e.id, r.id, true)} className="px-2 py-1 rounded text-[10px] bg-green-900 text-green-300 hover:bg-green-800">簽到</button>
                        )}
                        {user.role === 'MCLUB_STAFF' && r.status === 'CHECKED_IN' && (
                          <button onClick={() => checkInAttendee(e.id, r.id, false)} className="px-2 py-1 rounded text-[10px] bg-orange-900 text-orange-300 hover:bg-orange-800">取消簽到</button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {(!e.rsvps || e.rsvps.length === 0) && <p className="text-[#5a6a7a] text-sm text-center py-8">暫無報名</p>}
          </div>
        )}
      </div>
    );
  }

  // ── Event List View ──
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">活動管理</h2>
        {user.role === 'MCLUB_STAFF' && (
          <button onClick={() => setShowCreate(!showCreate)} className="px-4 py-2 rounded-lg text-sm font-bold text-black" style={{ background: 'var(--gold)' }}>
            + 新增活動
          </button>
        )}
      </div>

      {showCreate && (
        <div className="mclub-card space-y-3">
          <input placeholder="活動名稱 *" value={newEvent.title} onChange={e => setNewEvent({ ...newEvent, title: e.target.value })} className="w-full p-2 text-sm" />
          <textarea placeholder="活動描述" value={newEvent.description} onChange={e => setNewEvent({ ...newEvent, description: e.target.value })} className="w-full p-2 text-sm" rows={2} />
          <div className="grid grid-cols-2 gap-2">
            <select value={newEvent.category} onChange={e => setNewEvent({ ...newEvent, category: e.target.value })} className="w-full p-2 text-sm">
              <option value="networking">交流活動</option><option value="seminar">研討會</option><option value="dinner">晚宴</option>
              <option value="workshop">工作坊</option><option value="celebration">慶典</option>
            </select>
            <input placeholder="地點" value={newEvent.venue} onChange={e => setNewEvent({ ...newEvent, venue: e.target.value })} className="w-full p-2 text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs text-[#5a6a7a] mb-1">開始日期 *</label>
              <input type="datetime-local" value={newEvent.eventDate} onChange={e => setNewEvent({ ...newEvent, eventDate: e.target.value })} className="w-full p-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs text-[#5a6a7a] mb-1">結束日期</label>
              <input type="datetime-local" value={newEvent.endDate} onChange={e => setNewEvent({ ...newEvent, endDate: e.target.value })} className="w-full p-2 text-sm" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <input placeholder="最大人數" type="number" value={newEvent.maxAttendees} onChange={e => setNewEvent({ ...newEvent, maxAttendees: e.target.value })} className="w-full p-2 text-sm" />
            <input placeholder="費用 (HKD)" type="number" value={newEvent.fee} onChange={e => setNewEvent({ ...newEvent, fee: e.target.value })} className="w-full p-2 text-sm" />
            <input placeholder="聯絡人" value={newEvent.contactPerson} onChange={e => setNewEvent({ ...newEvent, contactPerson: e.target.value })} className="w-full p-2 text-sm" />
          </div>
          <input placeholder="贊助商" value={newEvent.sponsor} onChange={e => setNewEvent({ ...newEvent, sponsor: e.target.value })} className="w-full p-2 text-sm" />
          <select value={newEvent.status} onChange={e => setNewEvent({ ...newEvent, status: e.target.value as EventStatus })} className="w-full p-2 text-sm">
            <option value="DRAFT">草稿</option>
            <option value="PUBLISHED">直接發佈</option>
          </select>
          <div className="flex gap-2">
            <button onClick={createEvent} className="px-4 py-2 rounded-lg text-sm font-bold text-black" style={{ background: 'var(--gold)' }}>確認新增</button>
            <button onClick={() => setShowCreate(false)} className="px-4 py-2 rounded-lg text-sm text-[#8899aa] border border-[#2a3a4e]">取消</button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {events.map(e => {
          const fmtDate = (d: string) => new Date(d).toLocaleDateString('zh-HK', { month: 'short', day: 'numeric' });
          const myRsvp = e.rsvps?.find(r => r.userId === user.id);
          const confirmedCount = e.rsvps?.filter(r => r.status === 'CONFIRMED' || r.status === 'CHECKED_IN').length || 0;
          const tasks = e.tasks || [];
          const doneTasks = tasks.filter(t => t.status === 'DONE').length;
          const budgetItems = e.budgetItems || [];
          const totalBudget = budgetItems.reduce((s, b) => s + b.estimatedCost, 0);

          return (
            <div key={e.id} onClick={() => selectEvent(e)} className="mclub-card mclub-card-hover cursor-pointer">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm">🎉 {e.title}</h3>
                  {e.category && <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#2a3a4e] text-[#8899aa]">{eventCategoryLabel[e.category] || e.category}</span>}
                </div>
                <span className={eventStatusBadge(e.status)}>{eventStatusLabel[e.status]}</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-[#8899aa]">
                <span>{fmtDate(e.eventDate)}</span>
                {e.venue && <span>{e.venue}</span>}
                <span>👥 {confirmedCount}{e.maxAttendees ? '/' + e.maxAttendees : ''}</span>
                {user.role === 'MCLUB_STAFF' && tasks.length > 0 && <span>✅ {doneTasks}/{tasks.length}</span>}
                {user.role === 'MCLUB_STAFF' && totalBudget > 0 && <span className="text-gold">💰 {'HK$' + totalBudget.toLocaleString()}</span>}
              </div>
              {myRsvp && (
                <div className="mt-2 pt-2 border-t border-[#2a3a4e]">
                  <span className={'text-xs px-2 py-0.5 rounded-full ' + rsvpStatusClass(myRsvp.status)}>
                    我的狀態：{rsvpStatusLabel[myRsvp.status]}
                  </span>
                </div>
              )}
            </div>
          );
        })}
        {events.length === 0 && <p className="text-[#5a6a7a] text-sm text-center py-8">暫無活動</p>}
      </div>
    </div>
  );
}

// ── Member Profile (End User) ──
function MemberProfile({ user }: { user: User }) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">會員等級</h2>
      <div className="mclub-card text-center py-8">
        <div className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center text-3xl" style={{ background: 'linear-gradient(135deg, #d4af37, #b8962e)' }}>👑</div>
        <h3 className="text-xl font-bold text-gold mb-1">{user.name}</h3>
        <p className="text-sm text-[#8899aa] mb-4">{user.email}</p>
        <p className="text-xs text-[#5a6a7a]">升級方案將由您的Agent為您推薦</p>
      </div>
      <div className="mclub-card">
        <h4 className="font-bold mb-3">會員升級路徑</h4>
        <div className="space-y-2">
          {(['Plan A 入門', 'Plan B 進階', 'Plan C 高端', 'MCLUB全會員'] as const).map((label, i) => (
            <div key={i} className="flex items-center gap-3 py-2 border-b border-[#2a3a4e] last:border-0">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? 'bg-gold/20 text-gold' : 'bg-[#2a3a4e] text-[#5a6a7a]'}`}>{i + 1}</div>
              <span className={`text-sm ${i === 0 ? 'text-gold' : 'text-[#8899aa]'}`}>{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Main App ──
export default function Home() {
  const [user, setUser] = useState<User | null>(() => {
    if (typeof window === 'undefined') return null;
    try { const saved = localStorage.getItem('mclub_user'); return saved ? JSON.parse(saved) : null; } catch { return null; }
  });
  const [currentNav, setCurrentNav] = useState('overview');
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [dashboardError, setDashboardError] = useState(false);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const dashboardLoadedRef = useRef(false);

  const loadDashboard = useCallback(async () => {
    if (!user) return;
    setDashboardError(false);
    setDashboardLoading(true);
    try {
      const res = await apiFetch('/dashboard', user);
      if (res.error) {
        setDashboardError(true);
      } else {
        setDashboardData(res);
      }
    } catch {
      setDashboardError(true);
    } finally {
      setDashboardLoading(false);
    }
  }, [user]);

  // Load dashboard on login (only once per login)
  useEffect(() => {
    if (user) {
      localStorage.setItem('mclub_user', JSON.stringify(user));
      if (!dashboardLoadedRef.current) {
        dashboardLoadedRef.current = true;
        loadDashboard();
      }
    }
  }, [user, loadDashboard]);

  // Navigate between tabs
  const handleNavChange = useCallback((nav: string) => {
    setCurrentNav(nav);
  }, []);

  const handleLogin = (u: User) => { setUser(u); setCurrentNav('overview'); dashboardLoadedRef.current = false; };
  const handleLogout = () => { setUser(null); localStorage.removeItem('mclub_user'); setDashboardData(null); dashboardLoadedRef.current = false; };

  if (!user) return <LoginPage onLogin={handleLogin} />;

  const renderContent = () => {
    switch (currentNav) {
      case 'overview': return <OverviewDashboard user={user} data={dashboardData} error={dashboardError} loading={dashboardLoading} onRetry={loadDashboard} onNavigate={handleNavChange} />;
      case 'clients': return <ClientList user={user} />;
      case 'orders': return <OrderList user={user} />;
      case 'products': return <ProductList user={user} />;
      case 'commissions': return <CommissionList user={user} />;
      case 'events': return <EventList user={user} />;
      case 'profile': return <MemberProfile user={user} />;
      default: return <OverviewDashboard user={user} data={dashboardData} error={dashboardError} loading={dashboardLoading} onRetry={loadDashboard} onNavigate={handleNavChange} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <Sidebar current={currentNav} onChange={handleNavChange} role={user.role} onLogout={handleLogout} />
      <main className="flex-1 p-4 md:p-6 pb-24 md:pb-6 max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-xs text-[#5a6a7a]">{roleLabel[user.role]}</p>
            <p className="font-bold">{user.name}</p>
          </div>
          <button onClick={handleLogout} className="md:hidden text-xs text-[#5a6a7a]">登出</button>
        </div>
        {renderContent()}
      </main>
    </div>
  );
}
