'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { fetchWithAuth } from '@/lib/api-helpers';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Order {
  id: string;
  amount: number;
  currency: string;
  commission: number;
  status: string;
  notes: string | null;
  createdAt: string;
  customer: { id: string; name: string };
  product: { id: string; name: string; emoji: string };
  agent: { id: string; name: string };
}

interface ProductOption {
  id: string;
  name: string;
  emoji: string;
}

interface CustomerOption {
  id: string;
  name: string;
}

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  pending: { label: '待處理', color: 'bg-yellow-100 text-yellow-800' },
  processing: { label: '處理中', color: 'bg-blue-100 text-blue-800' },
  completed: { label: '已完成', color: 'bg-green-100 text-green-800' },
  cancelled: { label: '已取消', color: 'bg-red-100 text-red-800' },
};

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat('zh-HK', {
    style: 'currency',
    currency: currency || 'HKD',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    customerId: '',
    productId: '',
    agentId: '',
    amount: '',
    notes: '',
  });

  const loadAllData = async () => {
    const [ordersData, productsData, customersData] = await Promise.all([
      fetchWithAuth('/api/orders'),
      fetchWithAuth('/api/products'),
      fetchWithAuth('/api/customers'),
    ]);
    return { ordersData, productsData, customersData };
  };

  useEffect(() => {
    let cancelled = false;
    loadAllData().then(({ ordersData, productsData, customersData }) => {
      if (!cancelled) {
        setOrders(ordersData);
        setProducts(productsData);
        setCustomers(customersData);
      }
    });
    return () => { cancelled = true; };
  }, []);

  const refreshData = () => {
    loadAllData().then(({ ordersData, productsData, customersData }) => {
      setOrders(ordersData);
      setProducts(productsData);
      setCustomers(customersData);
    });
  };

  const handleAdd = async () => {
    await fetchWithAuth('/api/orders', {
      method: 'POST',
      body: JSON.stringify({
        ...form,
        amount: parseFloat(form.amount),
        status: 'pending',
        currency: 'HKD',
      }),
    });
    setOpen(false);
    setForm({ customerId: '', productId: '', agentId: '', amount: '', notes: '' });
    refreshData();
  };

  const updateStatus = async (id: string, status: string) => {
    await fetchWithAuth('/api/orders', {
      method: 'PUT',
      body: JSON.stringify({ id, status }),
    });
    refreshData();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">訂單管理</h1>
          <p className="text-muted-foreground">追蹤所有產品訂單狀態</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-amber-600 hover:bg-amber-700">
              <Plus className="mr-2 h-4 w-4" />
              新增訂單
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>新增訂單</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">客戶 *</label>
                  <Select value={form.customerId} onValueChange={(v) => setForm({ ...form, customerId: v })}>
                    <SelectTrigger><SelectValue placeholder="選擇客戶" /></SelectTrigger>
                    <SelectContent>
                      {customers.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">產品 *</label>
                  <Select value={form.productId} onValueChange={(v) => setForm({ ...form, productId: v })}>
                    <SelectTrigger><SelectValue placeholder="選擇產品" /></SelectTrigger>
                    <SelectContent>
                      {products.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.emoji} {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">金額 (HKD) *</label>
                <Input
                  type="number"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  placeholder="0"
                />
              </div>
              <div>
                <label className="text-sm font-medium">備註</label>
                <Input
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="訂單備註"
                />
              </div>
              <Button
                onClick={handleAdd}
                className="w-full bg-amber-600 hover:bg-amber-700"
                disabled={!form.customerId || !form.productId || !form.amount}
              >
                確認新增
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Orders list */}
      <div className="space-y-3">
        {orders.map((o) => {
          const status = STATUS_MAP[o.status] || STATUS_MAP.pending;
          return (
            <Card key={o.id} className="hover:shadow-sm transition-shadow">
              <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  <span className="text-2xl">{o.product.emoji}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{o.customer.name}</p>
                      <Badge variant="outline" className={cn('text-[10px]', status.color)}>
                        {status.label}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {o.product.name} · 代理: {o.agent.name}
                    </p>
                    {o.notes && (
                      <p className="mt-0.5 text-xs text-muted-foreground">{o.notes}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="font-medium">{formatCurrency(o.amount, o.currency)}</p>
                    <p className="text-xs text-amber-600">
                      佣金: {formatCurrency(o.commission, o.currency)}
                    </p>
                  </div>
                  {o.status !== 'completed' && o.status !== 'cancelled' && (
                    <Select onValueChange={(v) => updateStatus(o.id, v)}>
                      <SelectTrigger className="w-28 h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">待處理</SelectItem>
                        <SelectItem value="processing">處理中</SelectItem>
                        <SelectItem value="completed">已完成</SelectItem>
                        <SelectItem value="cancelled">已取消</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
