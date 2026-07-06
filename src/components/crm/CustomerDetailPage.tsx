'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { fetchWithAuth } from '@/lib/api-helpers';
import {
  ArrowLeft,
  Mail,
  Phone,
  Building,
  Globe,
  ShoppingCart,
  DollarSign,
  CheckCircle,
  Clock,
  Pencil,
  X,
  Save,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface CustomerDetail {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  nationality: string | null;
  age: number | null;
  gender: string | null;
  background: string | null;
  education: string | null;
  occupation: string | null;
  status: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  referrer: { id: string; name: string; email: string } | null;
  orders: {
    id: string;
    amount: number;
    currency: string;
    commission: number;
    status: string;
    notes: string | null;
    createdAt: string;
    product: { id: string; name: string; emoji: string; category: string };
    agent: { id: string; name: string };
    commissions: { id: string; amount: number; status: string; createdAt: string }[];
  }[];
  _stats: {
    totalOrders: number;
    totalSpent: number;
    totalCommission: number;
    pendingOrders: number;
    completedOrders: number;
  };
}

const STATUS_LABELS: Record<string, string> = {
  active: '活躍',
  inactive: '非活躍',
  prospect: '潛在客戶',
};

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-100 text-green-800',
  inactive: 'bg-gray-100 text-gray-800',
  prospect: 'bg-blue-100 text-blue-800',
};

const ORDER_STATUS_MAP: Record<string, { label: string; color: string }> = {
  pending: { label: '待處理', color: 'bg-yellow-100 text-yellow-800' },
  processing: { label: '處理中', color: 'bg-blue-100 text-blue-800' },
  completed: { label: '已完成', color: 'bg-green-100 text-green-800' },
  cancelled: { label: '已取消', color: 'bg-red-100 text-red-800' },
};

const GENDER_LABELS: Record<string, string> = {
  male: '男',
  female: '女',
  other: '其他',
};

const EDUCATION_LABELS: Record<string, string> = {
  high_school: '中學',
  bachelor: '學士',
  master: '碩士',
  doctorate: '博士',
  other: '其他',
};

function formatCurrency(amount: number, currency: string = 'HKD') {
  return new Intl.NumberFormat('zh-HK', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

interface CustomerDetailPageProps {
  customerId: string;
  onBack: () => void;
}

export function CustomerDetailPage({ customerId, onBack }: CustomerDetailPageProps) {
  const [customer, setCustomer] = useState<CustomerDetail | null>(null);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<CustomerDetail>>({});

  useEffect(() => {
    let cancelled = false;
    fetchWithAuth(`/api/customers/${customerId}`).then((data) => {
      if (!cancelled) {
        setCustomer(data);
        setEditForm({
          name: data.name,
          email: data.email || '',
          phone: data.phone || '',
          company: data.company || '',
          nationality: data.nationality || '',
          age: data.age != null ? String(data.age) : '',
          gender: data.gender || '',
          background: data.background || '',
          education: data.education || '',
          occupation: data.occupation || '',
          notes: data.notes || '',
        });
      }
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [customerId]);

  if (!customer) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 rounded bg-muted" />
          <div className="h-40 rounded-lg bg-muted" />
          <div className="h-60 rounded-lg bg-muted" />
        </div>
      </div>
    );
  }

  const handleSave = async () => {
    await fetchWithAuth(`/api/customers/${customerId}`, {
      method: 'PUT',
      body: JSON.stringify({
        name: editForm.name,
        email: editForm.email || null,
        phone: editForm.phone || null,
        company: editForm.company || null,
        nationality: editForm.nationality || null,
        age: editForm.age ? parseInt(editForm.age as string, 10) : null,
        gender: editForm.gender || null,
        background: editForm.background || null,
        education: editForm.education || null,
        occupation: editForm.occupation || null,
        notes: editForm.notes || null,
      }),
    });
    setEditing(false);
    // Refresh
    const data = await fetchWithAuth(`/api/customers/${customerId}`);
    setCustomer(data);
  };

  const statCards = [
    { label: '總訂單', value: customer._stats.totalOrders, icon: <ShoppingCart className="h-4 w-4" />, color: 'text-blue-600 bg-blue-50' },
    { label: '總消費', value: formatCurrency(customer._stats.totalSpent), icon: <DollarSign className="h-4 w-4" />, color: 'text-emerald-600 bg-emerald-50' },
    { label: '已完成', value: customer._stats.completedOrders, icon: <CheckCircle className="h-4 w-4" />, color: 'text-green-600 bg-green-50' },
    { label: '待處理', value: customer._stats.pendingOrders, icon: <Clock className="h-4 w-4" />, color: 'text-amber-600 bg-amber-50' },
  ];

  return (
    <div className="space-y-6">
      {/* Back button + header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{customer.name}</h1>
            <p className="text-muted-foreground">客戶詳情</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={cn('text-xs', STATUS_COLORS[customer.status])}>
            {STATUS_LABELS[customer.status]}
          </Badge>
          {editing ? (
            <div className="flex gap-1">
              <Button size="sm" className="bg-amber-600 hover:bg-amber-700" onClick={handleSave}>
                <Save className="mr-1 h-3.5 w-3.5" /> 保存
              </Button>
              <Button size="sm" variant="outline" onClick={() => setEditing(false)}>
                <X className="mr-1 h-3.5 w-3.5" /> 取消
              </Button>
            </div>
          ) : (
            <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
              <Pencil className="mr-1 h-3.5 w-3.5" /> 編輯
            </Button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">{s.label}</p>
                <div className={cn('rounded-lg p-2', s.color)}>{s.icon}</div>
              </div>
              <p className="mt-1 text-xl font-bold">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Contact info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">聯繫資料</CardTitle>
        </CardHeader>
        <CardContent>
          {editing ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium">姓名</label>
                <Input value={editForm.name || ''} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
              </div>
              <div>
                <label className="text-sm font-medium">電郵</label>
                <Input value={editForm.email || ''} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} />
              </div>
              <div>
                <label className="text-sm font-medium">電話</label>
                <Input value={editForm.phone || ''} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} />
              </div>
              <div>
                <label className="text-sm font-medium">公司</label>
                <Input value={editForm.company || ''} onChange={(e) => setEditForm({ ...editForm, company: e.target.value })} />
              </div>
              <div>
                <label className="text-sm font-medium">國籍</label>
                <Input value={editForm.nationality || ''} onChange={(e) => setEditForm({ ...editForm, nationality: e.target.value })} />
              </div>
              <div>
                <label className="text-sm font-medium">年齡</label>
                <Input type="number" value={editForm.age || ''} onChange={(e) => setEditForm({ ...editForm, age: e.target.value })} />
              </div>
              <div>
                <label className="text-sm font-medium">性別</label>
                <Select value={editForm.gender || ''} onValueChange={(v) => setEditForm({ ...editForm, gender: v })}>
                  <SelectTrigger><SelectValue placeholder="選擇" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">男</SelectItem>
                    <SelectItem value="female">女</SelectItem>
                    <SelectItem value="other">其他</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">學歷</label>
                <Select value={editForm.education || ''} onValueChange={(v) => setEditForm({ ...editForm, education: v })}>
                  <SelectTrigger><SelectValue placeholder="選擇" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high_school">中學</SelectItem>
                    <SelectItem value="bachelor">學士</SelectItem>
                    <SelectItem value="master">碩士</SelectItem>
                    <SelectItem value="doctorate">博士</SelectItem>
                    <SelectItem value="other">其他</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">職業</label>
                <Input value={editForm.occupation || ''} onChange={(e) => setEditForm({ ...editForm, occupation: e.target.value })} />
              </div>
              <div>
                <label className="text-sm font-medium">備註</label>
                <Input value={editForm.notes || ''} onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })} />
              </div>
              <div className="sm:col-span-2">
                <label className="text-sm font-medium">背景資料</label>
                <Input value={editForm.background || ''} onChange={(e) => setEditForm({ ...editForm, background: e.target.value })} placeholder="客戶背景、投資經驗、特殊需求等" />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                {customer.email && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{customer.email}</span>
                  </div>
                )}
                {customer.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{customer.phone}</span>
                  </div>
                )}
                {customer.company && (
                  <div className="flex items-center gap-2 text-sm">
                    <Building className="h-4 w-4 text-muted-foreground" />
                    <span>{customer.company}</span>
                  </div>
                )}
                {customer.nationality && (
                  <div className="flex items-center gap-2 text-sm">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <span>{customer.nationality}</span>
                  </div>
                )}
                {customer.age != null && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">年齡:</span>
                    <span>{customer.age} 歲</span>
                  </div>
                )}
                {customer.gender && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">性別:</span>
                    <span>{GENDER_LABELS[customer.gender] || customer.gender}</span>
                  </div>
                )}
                {customer.education && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">學歷:</span>
                    <span>{EDUCATION_LABELS[customer.education] || customer.education}</span>
                  </div>
                )}
                {customer.occupation && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">職業:</span>
                    <span>{customer.occupation}</span>
                  </div>
                )}
                {customer.referrer && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">推薦人:</span>
                    <span>{customer.referrer.name} ({customer.referrer.email})</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>加入日期: {new Date(customer.createdAt).toLocaleDateString('zh-HK')}</span>
                </div>
              </div>
              {customer.background && (
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="text-xs text-muted-foreground mb-1">背景資料</p>
                  <p className="text-sm">{customer.background}</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Order history */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">訂單記錄</CardTitle>
        </CardHeader>
        <CardContent>
          {customer.orders.length > 0 ? (
            <div className="space-y-3">
              {customer.orders.map((order) => {
                const status = ORDER_STATUS_MAP[order.status] || ORDER_STATUS_MAP.pending;
                return (
                  <div
                    key={order.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{order.product.emoji}</span>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium">{order.product.name}</p>
                          <Badge variant="outline" className={cn('text-[10px]', status.color)}>
                            {status.label}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          總監: {order.agent.name} · {new Date(order.createdAt).toLocaleDateString('zh-HK')}
                        </p>
                        {order.notes && (
                          <p className="mt-0.5 text-xs text-muted-foreground">{order.notes}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{formatCurrency(order.amount, order.currency)}</p>
                      <p className="text-xs text-amber-600">佣金: {formatCurrency(order.commission, order.currency)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              <ShoppingCart className="h-8 w-8 mx-auto mb-2 opacity-20" />
              <p className="text-sm">暫無訂單記錄</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
