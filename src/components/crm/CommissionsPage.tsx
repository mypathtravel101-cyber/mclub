'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { fetchWithAuth } from '@/lib/api-helpers';
import { CheckCircle, Clock, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Commission {
  id: string;
  amount: number;
  currency: string;
  status: string;
  paidAt: string | null;
  createdAt: string;
  agent: { id: string; name: string };
  order: {
    id: string;
    customer: { name: string };
    product: { name: string; emoji: string };
  } | null;
}

const STATUS_MAP: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending: {
    label: '待審批',
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    icon: <Clock className="h-3.5 w-3.5" />,
  },
  approved: {
    label: '已審批',
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: <CheckCircle className="h-3.5 w-3.5" />,
  },
  paid: {
    label: '已支付',
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: <CheckCircle className="h-3.5 w-3.5" />,
  },
};

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat('zh-HK', {
    style: 'currency',
    currency: currency || 'HKD',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function CommissionsPage() {
  const [commissions, setCommissions] = useState<Commission[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetchWithAuth('/api/commissions').then((d) => {
      if (!cancelled) setCommissions(d);
    });
    return () => { cancelled = true; };
  }, []);

  const refreshCommissions = () => {
    fetchWithAuth('/api/commissions').then(setCommissions);
  };

  const totalPaid = commissions
    .filter((c) => c.status === 'paid')
    .reduce((s, c) => s + c.amount, 0);
  const totalPending = commissions
    .filter((c) => c.status === 'pending')
    .reduce((s, c) => s + c.amount, 0);

  const approveCommission = async (id: string) => {
    await fetchWithAuth('/api/commissions', {
      method: 'PUT',
      body: JSON.stringify({ id, status: 'approved' }),
    });
    refreshCommissions();
  };

  const payCommission = async (id: string) => {
    await fetchWithAuth('/api/commissions', {
      method: 'PUT',
      body: JSON.stringify({ id, status: 'paid', paidAt: new Date().toISOString() }),
    });
    refreshCommissions();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">佣金管理</h1>
        <p className="text-muted-foreground">追蹤及管理代理佣金</p>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="rounded-lg bg-green-50 p-3 text-green-600">
              <CheckCircle className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">已支付佣金總額</p>
              <p className="text-2xl font-bold">{formatCurrency(totalPaid, 'HKD')}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="rounded-lg bg-yellow-50 p-3 text-yellow-600">
              <Clock className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">待處理佣金總額</p>
              <p className="text-2xl font-bold">{formatCurrency(totalPending, 'HKD')}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Commission list */}
      <div className="space-y-3">
        {commissions.map((c) => {
          const status = STATUS_MAP[c.status] || STATUS_MAP.pending;
          return (
            <Card key={c.id} className="hover:shadow-sm transition-shadow">
              <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  <div className="rounded-lg bg-amber-50 p-2">
                    <DollarSign className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{c.agent.name}</p>
                      <Badge variant="outline" className={cn('text-[10px]', status.color)}>
                        {status.icon}
                        {status.label}
                      </Badge>
                    </div>
                    {c.order && (
                      <p className="text-sm text-muted-foreground">
                        {c.order.product.emoji} {c.order.product.name} — {c.order.customer.name}
                      </p>
                    )}
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {new Date(c.createdAt).toLocaleDateString('zh-HK')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <p className="text-lg font-bold">{formatCurrency(c.amount, c.currency)}</p>
                  {c.status === 'pending' && (
                    <Button
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700"
                      onClick={() => approveCommission(c.id)}
                    >
                      審批
                    </Button>
                  )}
                  {c.status === 'approved' && (
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                      onClick={() => payCommission(c.id)}
                    >
                      支付
                    </Button>
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
