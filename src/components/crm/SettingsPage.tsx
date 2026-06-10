'use client';

import { useAppStore } from '@/store/app';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Package, DollarSign, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { fetchWithAuth } from '@/lib/api-helpers';

interface DashboardSummary {
  totalOrders: number;
  totalCustomers: number;
  totalProducts: number;
  totalRevenue: number;
  totalCommission: number;
  revenueByProduct: { name: string; emoji: string; revenue: number }[];
}

const ROLE_LABELS: Record<string, string> = {
  admin: '管理員',
  agent: '代理',
  sme: 'SME負責人',
};

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('zh-HK', {
    style: 'currency',
    currency: 'HKD',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function SettingsPage() {
  const { user } = useAppStore();
  const [stats, setStats] = useState<DashboardSummary | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchWithAuth('/api/dashboard').then((d) => {
      if (!cancelled) setStats(d);
    });
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">系統設定</h1>
        <p className="text-muted-foreground">帳戶資料及系統資訊</p>
      </div>

      {/* User profile */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">帳戶資料</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 bg-amber-100">
              <AvatarFallback className="text-amber-700 text-xl font-bold">
                {user?.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <p className="text-xl font-bold">{user?.name}</p>
              <p className="text-muted-foreground">{user?.email}</p>
              <Badge variant="outline">
                {ROLE_LABELS[user?.role || ''] || user?.role}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System overview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">系統概覽</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="flex items-center gap-3 rounded-lg border p-4">
              <div className="rounded-lg bg-amber-50 p-2 text-amber-600">
                <Package className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">產品總數</p>
                <p className="text-xl font-bold">{stats?.totalProducts || 0}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg border p-4">
              <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">客戶總數</p>
                <p className="text-xl font-bold">{stats?.totalCustomers || 0}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg border p-4">
              <div className="rounded-lg bg-green-50 p-2 text-green-600">
                <DollarSign className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">總收入</p>
                <p className="text-xl font-bold">{formatCurrency(stats?.totalRevenue || 0)}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* MCLUB Product Lineup */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">MCLUB 產品線</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {stats?.revenueByProduct.map((p) => (
              <div
                key={p.name}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">{p.emoji}</span>
                  <span className="text-sm font-medium">{p.name}</span>
                </div>
                <span className="text-sm font-medium">{formatCurrency(p.revenue)}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Version info */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>MCLUB CRM v2.0</span>
            <span>© 2025 MCLUB — MyPath Club</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
