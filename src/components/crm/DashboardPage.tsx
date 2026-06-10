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
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface DashboardData {
  totalOrders: number;
  totalCustomers: number;
  totalProducts: number;
  totalEvents: number;
  totalRevenue: number;
  totalCommission: number;
  pendingCommission: number;
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
    name: string;
    emoji: string;
    revenue: number;
  }[];
}

interface NoticeItem {
  id: string;
  title: string;
  content: string;
  category: string;
  isPinned: boolean;
  createdAt: string;
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

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat('zh-HK', {
    style: 'currency',
    currency: currency || 'HKD',
    maximumFractionDigits: 0,
  }).format(amount);
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  processing: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

export function DashboardPage() {
  const { user, setCurrentPage } = useAppStore();
  const [data, setData] = useState<DashboardData | null>(null);
  const [recentNotices, setRecentNotices] = useState<NoticeItem[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetchWithAuth('/api/dashboard').then((d) => {
      if (!cancelled) setData(d);
    });
    // Fetch recent notices
    fetchWithAuth(`/api/notices?role=${user?.role || ''}&limit=3`).then((notices) => {
      if (!cancelled) setRecentNotices(notices);
    });
    return () => { cancelled = true; };
  }, [user]);

  if (!data) {
    return <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[...Array(4)].map((_, i) => <Card key={i} className="animate-pulse"><CardContent className="p-6"><div className="h-4 w-24 rounded bg-muted" /><div className="mt-2 h-8 w-16 rounded bg-muted" /></CardContent></Card>)}</div>;
  }

  const statCards = [
    { label: '總訂單', value: data.totalOrders, icon: <ShoppingCart className="h-4 w-4" />, color: 'text-blue-600 bg-blue-50' },
    { label: '總客戶', value: data.totalCustomers, icon: <Users className="h-4 w-4" />, color: 'text-green-600 bg-green-50' },
    { label: '活躍產品', value: data.totalProducts, icon: <Package className="h-4 w-4" />, color: 'text-purple-600 bg-purple-50' },
    { label: '即將舉辦活動', value: data.totalEvents, icon: <Calendar className="h-4 w-4" />, color: 'text-amber-600 bg-amber-50' },
  ];

  const revenueCards = [
    { label: '總收入', value: formatCurrency(data.totalRevenue, 'HKD'), icon: <TrendingUp className="h-4 w-4" />, color: 'text-emerald-600 bg-emerald-50' },
    { label: '已付佣金', value: formatCurrency(data.totalCommission, 'HKD'), icon: <DollarSign className="h-4 w-4" />, color: 'text-amber-600 bg-amber-50' },
    { label: '待付佣金', value: formatCurrency(data.pendingCommission, 'HKD'), icon: <ArrowUpRight className="h-4 w-4" />, color: 'text-orange-600 bg-orange-50' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">儀表板</h1>
        <p className="text-muted-foreground">MCLUB 業務概覽</p>
      </div>

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
                  <div key={p.name}>
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
                      {o.status === 'pending'
                        ? '待處理'
                        : o.status === 'processing'
                          ? '處理中'
                          : o.status === 'completed'
                            ? '已完成'
                            : '已取消'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

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
    </div>
  );
}
