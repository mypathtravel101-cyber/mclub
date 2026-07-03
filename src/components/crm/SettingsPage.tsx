'use client';

import { useAppStore } from '@/store/app';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Package, DollarSign, Users, Lock, Download, Bell, Shield } from 'lucide-react';
import { useEffect, useState } from 'react';
import { fetchWithAuth } from '@/lib/api-helpers';
import { cn } from '@/lib/utils';

interface DashboardSummary {
  totalOrders: number;
  totalCustomers: number;
  totalProducts: number;
  totalRevenue: number;
  totalCommission: number;
  revenueByProduct: { id: string; name: string; emoji: string; revenue: number }[];
}

const ROLE_LABELS: Record<string, string> = {
  admin: '管理員',
  director: '總監',
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
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifs: true,
    orderNotifs: true,
    commissionNotifs: true,
    eventNotifs: true,
  });

  useEffect(() => {
    let cancelled = false;
    fetchWithAuth('/api/dashboard').then((d) => {
      if (!cancelled) setStats(d);
    }).catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const handleChangePassword = async () => {
    setPasswordMsg(null);
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordMsg({ type: 'error', text: '新密碼兩次輸入不一致' });
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      setPasswordMsg({ type: 'error', text: '新密碼至少需要6個字符' });
      return;
    }

    setPasswordLoading(true);
    try {
      await fetchWithAuth('/api/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });
      setPasswordMsg({ type: 'success', text: '密碼已成功更新' });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (e: unknown) {
      const error = e as Error;
      setPasswordMsg({ type: 'error', text: error.message || '密碼更新失敗' });
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleExport = async (type: string) => {
    try {
      const token = localStorage.getItem('mclub_crm_token');
      const res = await fetch(`/api/export?type=${type}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('匯出失敗');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mclub_${type}_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e: unknown) {
      const error = e as Error;
      alert(error.message || '匯出失敗');
    }
  };

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

      {/* Change Password */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-amber-600" />
            <CardTitle className="text-lg">更改密碼</CardTitle>
          </div>
          <CardDescription>定期更改密碼以確保帳戶安全</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">目前密碼</label>
            <Input
              type="password"
              value={passwordForm.currentPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
              placeholder="輸入目前密碼"
              autoComplete="current-password"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">新密碼</label>
              <Input
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                placeholder="至少6個字符"
                autoComplete="new-password"
              />
            </div>
            <div>
              <label className="text-sm font-medium">確認新密碼</label>
              <Input
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                placeholder="再次輸入新密碼"
                autoComplete="new-password"
              />
            </div>
          </div>
          {passwordMsg && (
            <p className={cn('text-sm', passwordMsg.type === 'success' ? 'text-green-600' : 'text-red-500')}>
              {passwordMsg.text}
            </p>
          )}
          <Button
            className="bg-amber-600 hover:bg-amber-700"
            onClick={handleChangePassword}
            disabled={passwordLoading || !passwordForm.currentPassword || !passwordForm.newPassword}
          >
            {passwordLoading ? '更新中...' : '更新密碼'}
          </Button>
        </CardContent>
      </Card>

      {/* Data Export */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Download className="h-5 w-5 text-amber-600" />
            <CardTitle className="text-lg">資料匯出</CardTitle>
          </div>
          <CardDescription>匯出系統資料為 CSV 格式</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-3">
            <Button variant="outline" className="justify-start gap-2" onClick={() => handleExport('customers')}>
              <Users className="h-4 w-4" />
              匯出客戶資料
            </Button>
            <Button variant="outline" className="justify-start gap-2" onClick={() => handleExport('orders')}>
              <Package className="h-4 w-4" />
              匯出訂單資料
            </Button>
            <Button variant="outline" className="justify-start gap-2" onClick={() => handleExport('commissions')}>
              <DollarSign className="h-4 w-4" />
              匯出佣金資料
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-amber-600" />
            <CardTitle className="text-lg">通知設定</CardTitle>
          </div>
          <CardDescription>管理通知偏好</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            { key: 'orderNotifs' as const, label: '訂單通知', desc: '當有新訂單或訂單狀態更新時通知' },
            { key: 'commissionNotifs' as const, label: '佣金通知', desc: '當佣金狀態變更時通知' },
            { key: 'eventNotifs' as const, label: '活動通知', desc: '當有新活動或活動提醒時通知' },
            { key: 'emailNotifs' as const, label: '電郵通知', desc: '同步發送電郵通知（即將推出）' },
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="text-sm font-medium">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
              <button
                className={cn(
                  'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                  notificationSettings[item.key] ? 'bg-amber-600' : 'bg-muted'
                )}
                onClick={() => setNotificationSettings({ ...notificationSettings, [item.key]: !notificationSettings[item.key] })}
              >
                <span
                  className={cn(
                    'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                    notificationSettings[item.key] ? 'translate-x-6' : 'translate-x-1'
                  )}
                />
              </button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* System overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-amber-600" />
            <CardTitle className="text-lg">系統概覽</CardTitle>
          </div>
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
                key={p.id}
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
            <span>MCLUB CRM v3.0</span>
            <span>&copy; 2026 MCLUB — MyPath Club</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
