'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { fetchWithAuth } from '@/lib/api-helpers';
import { useAppStore } from '@/store/app';
import {
  Package,
  Users,
  ShoppingCart,
  DollarSign,
  TrendingUp,
  Calendar,
  ArrowUpRight,
  Megaphone,
  Pin,
  ChevronRight,
  UserCheck,
  CheckCircle,
  Clock,
  CalendarDays,
  MapPin,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface DashboardData {
  isDirector?: boolean;
  totalOrders: number;
  totalCustomers: number;
  totalProducts?: number;
  totalEvents?: number;
  totalRevenue: number;
  totalCommission: number;
  pendingCommission: number;
  paidCommission?: number;
  approvedCommission?: number;
  orderStats: { status: string; _count: number }[];
  recentOrders: {
    id: string;
    amount: number;
    currency: string;
    status: string;
    createdAt: string;
    customer: { name: string };
    product: { name: string; emoji: string };
    agent: { name: string };
  }[];
  revenueByProduct: {
    id: string;
    name: string;
    emoji: string;
    revenue: number;
  }[];
  weeklyData: { label: string; orders: number; revenue: number }[];
  monthlyData: { label: string; orders: number; revenue: number }[];
}

interface NoticeItem {
  id: string;
  title: string;
  content: string;
  category: string;
  isPinned: boolean;
  createdAt: string;
}

interface UpcomingEvent {
  id: string;
  title: string;
  type: string;
  date: string;
  location: string | null;
  maxAttendees: number;
  totalAttendees: number;
}

const CATEGORY_COLORS: Record<string, string> = {
  announcement: 'bg-blue-100 text-blue-800',
  urgent: 'bg-red-100 text-red-800',
  policy: 'bg-amber-100 text-amber-800',
};

const CATEGORY_LABELS: Record<string, string> = {
  announcement: '公告',
  urgent: '緊急',
  policy: '政策',
};

const EVENT_TYPE_LABELS: Record<string, string> = {
  seminar: '研討會',
  webinar: '網絡研討會',
  meeting: '會議',
  training: '培訓',
};

const EVENT_TYPE_COLORS: Record<string, string> = {
  seminar: 'bg-blue-100 text-blue-800',
  webinar: 'bg-purple-100 text-purple-800',
  meeting: 'bg-green-100 text-green-800',
  training: 'bg-amber-100 text-amber-800',
};

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat('zh-HK', {
    style: 'currency',
    currency: currency || 'HKD',
    maximumFractionDigits: 0,
  }).format(amount);
}

const STATUS_COLORS: Record<string, string> = {
  prospect: 'bg-slate-100 text-slate-800',
  following_up: 'bg-cyan-100 text-cyan-800',
  quoted: 'bg-indigo-100 text-indigo-800',
  confirmed: 'bg-violet-100 text-violet-800',
  pending: 'bg-yellow-100 text-yellow-800',
  processing: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

const STATUS_LABELS: Record<string, string> = {
  prospect: '潛在客戶',
  following_up: '跟進中',
  quoted: '已報價',
  confirmed: '已確認',
  pending: '待處理',
  processing: '處理中',
  completed: '已完成',
  cancelled: '已取消',
};

// Custom tooltip for recharts
function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name: string; color: string }>; label?: string }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="rounded-lg border bg-card px-3 py-2 shadow-md text-sm">
      <p className="font-medium mb-1">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="text-muted-foreground">{p.name}:</span>
          <span className="font-medium">
            {p.name === '總銷售產品累積金額' ? formatCurrency(p.value, 'HKD') : p.value}
          </span>
        </div>
      ))}
    </div>
  );
}

export function DashboardPage() {
  const { user, setCurrentPage } = useAppStore();
  const [data, setData] = useState<DashboardData | null>(null);
  const [recentNotices, setRecentNotices] = useState<NoticeItem[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<UpcomingEvent[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetchWithAuth('/api/dashboard').then((d) => {
      if (!cancelled) setData(d);
    }).catch(() => {
      if (!cancelled) setData(null);
    });
    // Fetch recent notices (server gets role from JWT)
    fetchWithAuth('/api/notices?limit=3').then((notices) => {
      if (!cancelled) setRecentNotices(Array.isArray(notices) ? notices : []);
    }).catch(() => {
      if (!cancelled) setRecentNotices([]);
    });
    // Fetch upcoming events
    fetchWithAuth('/api/events?status=upcoming&limit=50').then((res) => {
      if (!cancelled) {
        const d = res.data || res;
        setUpcomingEvents(Array.isArray(d) ? d : []);
      }
    }).catch(() => {
      if (!cancelled) setUpcomingEvents([]);
    });
    return () => { cancelled = true; };
  }, [user?.id]);

  if (!data) {
    return <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[...Array(4)].map((_, i) => <Card key={i} className="animate-pulse"><CardContent className="p-6"><div className="h-4 w-24 rounded bg-muted" /><div className="mt-2 h-8 w-16 rounded bg-muted" /></CardContent></Card>)}</div>;
  }

  // Prepare chart data with formatted labels
  const weeklyChartData = (data.weeklyData || []).map(d => ({
    ...d,
    總銷售產品累積金額: d.revenue,
    訂單: d.orders,
  }));

  const monthlyChartData = (data.monthlyData || []).map(d => ({
    ...d,
    總銷售產品累積金額: d.revenue,
    訂單: d.orders,
  }));

  // ── Director Dashboard ──
  if (data.isDirector) {
    const directorStatCards = [
      { label: '我的訂單', value: data.totalOrders, icon: <ShoppingCart className="h-4 w-4" />, color: 'text-blue-600 bg-blue-50' },
      { label: '我的客戶', value: data.totalCustomers, icon: <Users className="h-4 w-4" />, color: 'text-green-600 bg-green-50' },
      { label: '總銷售產品累積金額', value: formatCurrency(data.totalRevenue, 'HKD'), icon: <TrendingUp className="h-4 w-4" />, color: 'text-emerald-600 bg-emerald-50' },
      { label: '總佣金', value: formatCurrency(data.totalCommission, 'HKD'), icon: <DollarSign className="h-4 w-4" />, color: 'text-amber-600 bg-amber-50' },
    ];

    const directorCommissionCards = [
      { label: '已支付佣金', value: formatCurrency(data.paidCommission || 0, 'HKD'), icon: <CheckCircle className="h-4 w-4" />, color: 'text-green-600 bg-green-50' },
      { label: '已審批佣金', value: formatCurrency(data.approvedCommission || 0, 'HKD'), icon: <UserCheck className="h-4 w-4" />, color: 'text-blue-600 bg-blue-50' },
      { label: '待審批佣金', value: formatCurrency(data.pendingCommission, 'HKD'), icon: <Clock className="h-4 w-4" />, color: 'text-orange-600 bg-orange-50' },
    ];

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">我的儀表板</h1>
          <p className="text-muted-foreground">{user?.name} 的業務概覽</p>
        </div>

        {/* Upcoming Events — top of dashboard */}
        {upcomingEvents.length > 0 && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-blue-600" />
                <CardTitle className="text-lg">即將舉辦的活動</CardTitle>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-blue-600 hover:text-blue-700"
                onClick={() => setCurrentPage('events')}
              >
                查看全部
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {upcomingEvents.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).map((ev) => (
                  <div
                    key={ev.id}
                    className="flex items-center justify-between rounded-lg border border-l-4 border-l-blue-400 bg-blue-50/50 p-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Calendar className="h-4 w-4 text-blue-500 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{ev.title}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                          <span>{new Date(ev.date).toLocaleString('zh-HK', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                          {ev.location && <><MapPin className="h-3 w-3" /> <span>{ev.location}</span></>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-muted-foreground">{ev.totalAttendees ?? 0}/{ev.maxAttendees} 人</span>
                      <Badge variant="outline" className={cn('text-[10px]', EVENT_TYPE_COLORS[ev.type])}>
                        {EVENT_TYPE_LABELS[ev.type]}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Latest Notices section */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <Megaphone className="h-5 w-5 text-amber-600" />
              <CardTitle className="text-lg">最新公告</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-amber-600 hover:text-amber-700"
              onClick={() => setCurrentPage('notices')}
            >
              查看全部
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>

            {/* Notices */}
            {recentNotices.length > 0 ? (
              <div className="space-y-3">
                {recentNotices.map((notice) => (
                  <div
                    key={notice.id}
                    className={cn(
                      'flex items-start justify-between rounded-lg border p-3',
                      notice.isPinned && 'border-l-4 border-l-amber-500'
                    )}
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      {notice.isPinned && (
                        <Pin className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                      )}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium truncate">{notice.title}</p>
                          <Badge
                            variant="outline"
                            className={cn('text-[10px] shrink-0', CATEGORY_COLORS[notice.category])}
                          >
                            {CATEGORY_LABELS[notice.category]}
                          </Badge>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground line-clamp-1">
                          {notice.content}
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] text-muted-foreground shrink-0 ml-3">
                      {new Date(notice.createdAt).toLocaleDateString('zh-HK')}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                <Megaphone className="h-8 w-8 mx-auto mb-2 opacity-20" />
                <p className="text-sm">暫無公告</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Director stat cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {directorStatCards.map((s) => (
            <Card key={s.label}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">{s.label}</p>
                  <div className={cn('rounded-lg p-2', s.color)}>{s.icon}</div>
                </div>
                <p className="mt-2 text-2xl font-bold">{s.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Director commission cards */}
        <div className="grid gap-4 sm:grid-cols-3">
          {directorCommissionCards.map((s) => (
            <Card key={s.label}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">{s.label}</p>
                  <div className={cn('rounded-lg p-2', s.color)}>{s.icon}</div>
                </div>
                <p className="mt-2 text-2xl font-bold">{s.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Weekly & Monthly Performance Charts */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-500" />
                每週業績
              </CardTitle>
            </CardHeader>
            <CardContent>
              {weeklyChartData.some(d => d.revenue > 0 || d.orders > 0) ? (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={weeklyChartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                    <YAxis yAxisId="revenue" orientation="left" tick={{ fontSize: 11 }} tickFormatter={(v: number) => v >= 1000 ? `${(v/1000).toFixed(0)}K` : String(v)} />
                    <YAxis yAxisId="orders" orientation="right" tick={{ fontSize: 11 }} />
                    <Tooltip content={<ChartTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar yAxisId="revenue" dataKey="總銷售產品累積金額" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={20} />
                    <Bar yAxisId="orders" dataKey="訂單" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[260px] text-muted-foreground">
                  <p className="text-sm">暫無每週數據</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="h-5 w-5 text-amber-500" />
                每月業績
              </CardTitle>
            </CardHeader>
            <CardContent>
              {monthlyChartData.some(d => d.revenue > 0 || d.orders > 0) ? (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={monthlyChartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                    <YAxis yAxisId="revenue" orientation="left" tick={{ fontSize: 11 }} tickFormatter={(v: number) => v >= 1000 ? `${(v/1000).toFixed(0)}K` : String(v)} />
                    <YAxis yAxisId="orders" orientation="right" tick={{ fontSize: 11 }} />
                    <Tooltip content={<ChartTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar yAxisId="revenue" dataKey="總銷售產品累積金額" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={24} />
                    <Bar yAxisId="orders" dataKey="訂單" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={24} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[260px] text-muted-foreground">
                  <p className="text-sm">暫無每月數據</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* My product revenue */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">我的產品收入分佈</CardTitle>
            </CardHeader>
            <CardContent>
              {data.revenueByProduct.length > 0 ? (
                <div className="space-y-3">
                  {data.revenueByProduct.map((p) => {
                    const maxRevenue = Math.max(...data.revenueByProduct.map((r) => r.revenue), 1);
                    const pct = (p.revenue / maxRevenue) * 100;
                    return (
                      <div key={p.id}>
                        <div className="mb-1 flex items-center justify-between text-sm">
                          <span>
                            {p.emoji} {p.name}
                          </span>
                          <span className="font-medium">{formatCurrency(p.revenue, 'HKD')}</span>
                        </div>
                        <div className="h-2 rounded-full bg-muted">
                          <div
                            className="h-2 rounded-full bg-blue-500 transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-8 text-center text-muted-foreground">
                  <Package className="h-8 w-8 mx-auto mb-2 opacity-20" />
                  <p className="text-sm">暫無產品收入數據</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* My recent orders */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">我的最近訂單</CardTitle>
            </CardHeader>
            <CardContent>
              {data.recentOrders.length > 0 ? (
                <div className="space-y-3">
                  {data.recentOrders.map((o) => (
                    <div
                      key={o.id}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{o.product.emoji}</span>
                        <div>
                          <p className="text-sm font-medium">{o.customer.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {o.product.name}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          {formatCurrency(o.amount, o.currency)}
                        </p>
                        <span
                          className={cn(
                            'inline-block rounded-full px-2 py-0.5 text-[10px] font-medium',
                            STATUS_COLORS[o.status] || 'bg-muted'
                          )}
                        >
                          {STATUS_LABELS[o.status] || o.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-muted-foreground">
                  <ShoppingCart className="h-8 w-8 mx-auto mb-2 opacity-20" />
                  <p className="text-sm">暫無訂單</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

      </div>
    );
  }

  // ── Admin Dashboard ──
  // NOTE: Layout reorganized — stat cards now render BEFORE the
  // Latest Notices card so KPIs are visible without scrolling.
  const statCards = [
    { label: '總訂單', value: data.totalOrders, icon: <ShoppingCart className="h-4 w-4" />, color: 'text-blue-600 bg-blue-50' },
    { label: '總客戶', value: data.totalCustomers, icon: <Users className="h-4 w-4" />, color: 'text-green-600 bg-green-50' },
    { label: '活躍產品', value: data.totalProducts || 0, icon: <Package className="h-4 w-4" />, color: 'text-purple-600 bg-purple-50' },
    { label: '即將舉辦活動', value: data.totalEvents || 0, icon: <Calendar className="h-4 w-4" />, color: 'text-amber-600 bg-amber-50' },
  ];

  const revenueCards = [
    { label: '總銷售產品累積金額', value: formatCurrency(data.totalRevenue, 'HKD'), icon: <TrendingUp className="h-4 w-4" />, color: 'text-emerald-600 bg-emerald-50' },
    { label: '已付佣金', value: formatCurrency(data.totalCommission, 'HKD'), icon: <DollarSign className="h-4 w-4" />, color: 'text-amber-600 bg-amber-50' },
    { label: '待付佣金', value: formatCurrency(data.pendingCommission, 'HKD'), icon: <ArrowUpRight className="h-4 w-4" />, color: 'text-orange-600 bg-orange-50' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">儀表板</h1>
        <p className="text-muted-foreground">MCLUB 業務概覽</p>
      </div>

      {/* Upcoming Events — top of dashboard */}
      {upcomingEvents.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-lg">即將舉辦的活動</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-blue-600 hover:text-blue-700"
              onClick={() => setCurrentPage('events')}
            >
              查看全部
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcomingEvents.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).map((ev) => (
                <div
                  key={ev.id}
                  className="flex items-center justify-between rounded-lg border border-l-4 border-l-blue-400 bg-blue-50/50 p-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Calendar className="h-4 w-4 text-blue-500 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{ev.title}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                        <span>{new Date(ev.date).toLocaleString('zh-HK', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                        {ev.location && <><MapPin className="h-3 w-3" /> <span>{ev.location}</span></>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-muted-foreground">{ev.totalAttendees ?? 0}/{ev.maxAttendees} 人</span>
                    <Badge variant="outline" className={cn('text-[10px]', EVENT_TYPE_COLORS[ev.type])}>
                      {EVENT_TYPE_LABELS[ev.type]}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Latest Notices section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <Megaphone className="h-5 w-5 text-amber-600" />
            <CardTitle className="text-lg">最新公告</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-amber-600 hover:text-amber-700"
            onClick={() => setCurrentPage('notices')}
          >
            查看全部
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>

          {/* Notices */}
          {recentNotices.length > 0 ? (
            <div className="space-y-3">
              {recentNotices.map((notice) => (
                <div
                  key={notice.id}
                  className={cn(
                    'flex items-start justify-between rounded-lg border p-3',
                    notice.isPinned && 'border-l-4 border-l-amber-500'
                  )}
                >
                  <div className="flex items-start gap-3 min-w-0">
                    {notice.isPinned && (
                      <Pin className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium truncate">{notice.title}</p>
                        <Badge
                          variant="outline"
                          className={cn('text-[10px] shrink-0', CATEGORY_COLORS[notice.category])}
                        >
                          {CATEGORY_LABELS[notice.category]}
                        </Badge>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground line-clamp-1">
                        {notice.content}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] text-muted-foreground shrink-0 ml-3">
                    {new Date(notice.createdAt).toLocaleDateString('zh-HK')}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              <Megaphone className="h-8 w-8 mx-auto mb-2 opacity-20" />
              <p className="text-sm">暫無公告</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((s) => (
          <Card key={s.label}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">{s.label}</p>
                <div className={cn('rounded-lg p-2', s.color)}>{s.icon}</div>
              </div>
              <p className="mt-2 text-3xl font-bold">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Revenue cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        {revenueCards.map((s) => (
          <Card key={s.label}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">{s.label}</p>
                <div className={cn('rounded-lg p-2', s.color)}>{s.icon}</div>
              </div>
              <p className="mt-2 text-2xl font-bold">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Weekly & Monthly Performance Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-500" />
              每週業績
            </CardTitle>
          </CardHeader>
          <CardContent>
            {weeklyChartData.some(d => d.revenue > 0 || d.orders > 0) ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={weeklyChartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="revenue" orientation="left" tick={{ fontSize: 11 }} tickFormatter={(v: number) => v >= 1000 ? `${(v/1000).toFixed(0)}K` : String(v)} />
                  <YAxis yAxisId="orders" orientation="right" tick={{ fontSize: 11 }} />
                  <Tooltip content={<ChartTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar yAxisId="revenue" dataKey="總銷售產品累積金額" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={20} />
                  <Bar yAxisId="orders" dataKey="訂單" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[280px] text-muted-foreground">
                <p className="text-sm">暫無每週數據</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5 text-amber-500" />
              每月業績
            </CardTitle>
          </CardHeader>
          <CardContent>
            {monthlyChartData.some(d => d.revenue > 0 || d.orders > 0) ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={monthlyChartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="revenue" orientation="left" tick={{ fontSize: 11 }} tickFormatter={(v: number) => v >= 1000 ? `${(v/1000).toFixed(0)}K` : String(v)} />
                  <YAxis yAxisId="orders" orientation="right" tick={{ fontSize: 11 }} />
                  <Tooltip content={<ChartTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar yAxisId="revenue" dataKey="總銷售產品累積金額" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={24} />
                  <Bar yAxisId="orders" dataKey="訂單" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={24} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[280px] text-muted-foreground">
                <p className="text-sm">暫無每月數據</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Revenue by product */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">產品收入分佈</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.revenueByProduct.map((p) => {
                const maxRevenue = Math.max(...data.revenueByProduct.map((r) => r.revenue), 1);
                const pct = (p.revenue / maxRevenue) * 100;
                return (
                  <div key={p.id}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span>
                        {p.emoji} {p.name}
                      </span>
                      <span className="font-medium">{formatCurrency(p.revenue, 'HKD')}</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted">
                      <div
                        className="h-2 rounded-full bg-amber-500 transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Recent orders */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">最近訂單</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.recentOrders.map((o) => (
                <div
                  key={o.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{o.product.emoji}</span>
                    <div>
                      <p className="text-sm font-medium">{o.customer.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {o.product.name} · {o.agent.name}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">
                      {formatCurrency(o.amount, o.currency)}
                    </p>
                    <span
                      className={cn(
                        'inline-block rounded-full px-2 py-0.5 text-[10px] font-medium',
                        STATUS_COLORS[o.status] || 'bg-muted'
                      )}
                    >
                      {STATUS_LABELS[o.status] || o.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

    </div>
  );
}
