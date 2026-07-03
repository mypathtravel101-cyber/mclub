'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { fetchWithAuth } from '@/lib/api-helpers';
import { useToast } from '@/hooks/use-toast';
import { useAppStore } from '@/store/app';
import { CheckCircle, Clock, DollarSign, Pencil } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Pagination } from '@/components/crm/Pagination';

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
    status: string;
    customer: { name: string };
    product: { name: string; emoji: string; commissionNegotiable?: boolean };
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
  const { toast } = useToast();
  const { user: currentUser } = useAppStore();
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [totalPaid, setTotalPaid] = useState(0);
  const [totalPending, setTotalPending] = useState(0);

  // Dialog state for approving with manual commission entry
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [selectedCommission, setSelectedCommission] = useState<Commission | null>(null);
  const [editAmount, setEditAmount] = useState<string>('');
  const [approveSaving, setApproveSaving] = useState(false);
  const [approveError, setApproveError] = useState('');

  // Dialog state for editing commission amount
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editCommission, setEditCommission] = useState<Commission | null>(null);
  const [editAmountValue, setEditAmountValue] = useState<string>('');
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState('');

  const isAdmin = currentUser?.role === 'admin';

  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams({ page: String(page), limit: '10' });
    if (statusFilter !== 'all') params.set('status', statusFilter);

    fetchWithAuth(`/api/commissions?${params}`).then((res) => {
      if (!cancelled) {
        setCommissions(res.data);
        setTotalPages(res.pagination.totalPages);
        setTotal(res.pagination.total);
        if (res.totals) {
          setTotalPaid(res.totals.paid || 0);
          setTotalPending(res.totals.pending || 0);
        }
      }
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [page, statusFilter]);

  const refreshCommissions = () => {
    const params = new URLSearchParams({ page: String(page), limit: '10' });
    if (statusFilter !== 'all') params.set('status', statusFilter);

    fetchWithAuth(`/api/commissions?${params}`).then((res) => {
      setCommissions(res.data);
      setTotalPages(res.pagination.totalPages);
      setTotal(res.pagination.total);
      if (res.totals) {
        setTotalPaid(res.totals.paid || 0);
        setTotalPending(res.totals.pending || 0);
      }
    });
  };

  // Open approve dialog with pre-filled amount
  const openApproveDialog = (c: Commission) => {
    setSelectedCommission(c);
    setEditAmount(String(c.amount));
    setApproveError('');
    setApproveDialogOpen(true);
  };

  // Approve commission with (possibly edited) amount
  const handleApprove = async () => {
    if (!selectedCommission) return;
    const amount = parseFloat(editAmount);
    if (isNaN(amount) || amount <= 0) {
      setApproveError('請輸入有效的佣金金額（大於0）');
      return;
    }
    setApproveSaving(true);
    setApproveError('');
    try {
      await fetchWithAuth('/api/commissions', {
        method: 'PUT',
        body: JSON.stringify({
          id: selectedCommission.id,
          amount,
          status: 'approved',
        }),
      });
      setApproveDialogOpen(false);
      refreshCommissions();
      toast({ title: '佣金已審批' });
    } catch (e: unknown) {
      const error = e as Error;
      setApproveError(error.message || '審批失敗');
    } finally {
      setApproveSaving(false);
    }
  };

  // Open edit amount dialog
  const openEditDialog = (c: Commission) => {
    setEditCommission(c);
    setEditAmountValue(String(c.amount));
    setEditError('');
    setEditDialogOpen(true);
  };

  // Save edited amount only
  const handleSaveAmount = async () => {
    if (!editCommission) return;
    const amount = parseFloat(editAmountValue);
    if (isNaN(amount) || amount <= 0) {
      setEditError('請輸入有效的佣金金額（大於0）');
      return;
    }
    setEditSaving(true);
    setEditError('');
    try {
      await fetchWithAuth('/api/commissions', {
        method: 'PUT',
        body: JSON.stringify({ id: editCommission.id, amount }),
      });
      setEditDialogOpen(false);
      refreshCommissions();
      toast({ title: '佣金金額已更新' });
    } catch (e: unknown) {
      const error = e as Error;
      setEditError(error.message || '更新失敗');
    } finally {
      setEditSaving(false);
    }
  };

  const payCommission = async (id: string) => {
    try {
      await fetchWithAuth('/api/commissions', {
        method: 'PUT',
        body: JSON.stringify({ id, status: 'paid' }),
      });
      refreshCommissions();
      toast({ title: '佣金已支付' });
    } catch (e: unknown) {
      const error = e as Error;
      toast({ title: '支付失敗', description: error.message, variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">佣金管理</h1>
        <p className="text-muted-foreground">追蹤及管理總監佣金</p>
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

      {/* Status filter */}
      <div className="flex gap-2">
        {[
          { value: 'all', label: '全部' },
          { value: 'pending', label: '待審批' },
          { value: 'approved', label: '已審批' },
          { value: 'paid', label: '已支付' },
        ].map((s) => (
          <Button
            key={s.value}
            variant={statusFilter === s.value ? 'default' : 'outline'}
            size="sm"
            className={statusFilter === s.value ? 'bg-amber-600 hover:bg-amber-700' : ''}
            onClick={() => { setStatusFilter(s.value); setPage(1); }}
          >
            {s.label}
          </Button>
        ))}
      </div>

      {/* Commission list */}
      <div className="space-y-3">
        {commissions.map((c) => {
          const status = STATUS_MAP[c.status] || STATUS_MAP.pending;
          const isNegotiable = c.order?.product?.commissionNegotiable;
          const showZeroWarning = c.amount === 0;
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
                      {isNegotiable && (
                        <Badge variant="outline" className="text-[10px] bg-purple-50 text-purple-700 border-purple-200">
                          另議
                        </Badge>
                      )}
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
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    {showZeroWarning && isAdmin && c.status !== 'paid' ? (
                      <div>
                        <p className="text-lg font-bold text-red-500">{formatCurrency(c.amount, c.currency)}</p>
                        <p className="text-[10px] text-red-400">請設定佣金金額</p>
                      </div>
                    ) : (
                      <p className="text-lg font-bold">{formatCurrency(c.amount, c.currency)}</p>
                    )}
                  </div>

                  {/* Edit amount button - admin only, for pending/approved commissions */}
                  {isAdmin && c.status !== 'paid' && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-amber-600 hover:text-amber-700"
                      title="修改佣金"
                      onClick={() => openEditDialog(c)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  )}

                  {/* Approve button - only when order is completed */}
                  {c.status === 'pending' && c.order?.status === 'completed' && isAdmin && (
                    <Button
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700"
                      onClick={() => openApproveDialog(c)}
                    >
                      審批
                    </Button>
                  )}

                  {/* Order not completed badge */}
                  {c.status === 'pending' && c.order?.status !== 'completed' && (
                    <Badge variant="outline" className="text-[10px] bg-gray-50 text-gray-500 border-gray-200">
                      訂單未完成
                    </Badge>
                  )}

                  {/* Pay button */}
                  {c.status === 'approved' && isAdmin && (
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

      {/* Pagination */}
      <Pagination
        page={page}
        totalPages={totalPages}
        total={total}
        limit={10}
        onPageChange={setPage}
      />

      {/* Approve Commission Dialog with amount input */}
      <Dialog open={approveDialogOpen} onOpenChange={(v) => { if (!v) { setApproveError(''); setSelectedCommission(null); } setApproveDialogOpen(v); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>審批佣金</DialogTitle>
            <DialogDescription>確認及設定佣金金額後審批</DialogDescription>
          </DialogHeader>
          {selectedCommission && (
            <div className="space-y-4">
              <div className="rounded-lg bg-muted p-3 space-y-1">
                <p className="text-sm">
                  <span className="text-muted-foreground">總監：</span>
                  <span className="font-medium">{selectedCommission.agent.name}</span>
                </p>
                {selectedCommission.order && (
                  <p className="text-sm">
                    <span className="text-muted-foreground">產品：</span>
                    <span className="font-medium">{selectedCommission.order.product.emoji} {selectedCommission.order.product.name}</span>
                  </p>
                )}
                {selectedCommission.order && (
                  <p className="text-sm">
                    <span className="text-muted-foreground">客戶：</span>
                    <span className="font-medium">{selectedCommission.order.customer.name}</span>
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">佣金金額 (HKD) *</label>
                <Input
                  type="number"
                  min="0"
                  step="1"
                  value={editAmount}
                  onChange={(e) => setEditAmount(e.target.value)}
                  placeholder="輸入佣金金額"
                />
                <p className="text-xs text-muted-foreground">
                  {selectedCommission.amount === 0
                    ? '此產品佣金為「另議」，請輸入商定的佣金金額'
                    : '如需調整佣金金額，請直接修改'}
                </p>
              </div>
              {approveError && <p className="text-sm text-red-500">{approveError}</p>}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveDialogOpen(false)} disabled={approveSaving}>取消</Button>
            <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleApprove} disabled={approveSaving}>
              {approveSaving ? '處理中...' : '確認審批'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Commission Amount Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={(v) => { if (!v) { setEditError(''); setEditCommission(null); } setEditDialogOpen(v); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>修改佣金金額</DialogTitle>
            <DialogDescription>手動設定此筆佣金的金額</DialogDescription>
          </DialogHeader>
          {editCommission && (
            <div className="space-y-4">
              <div className="rounded-lg bg-muted p-3 space-y-1">
                <p className="text-sm">
                  <span className="text-muted-foreground">總監：</span>
                  <span className="font-medium">{editCommission.agent.name}</span>
                </p>
                {editCommission.order && (
                  <p className="text-sm">
                    <span className="text-muted-foreground">產品：</span>
                    <span className="font-medium">{editCommission.order.product.emoji} {editCommission.order.product.name}</span>
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">佣金金額 (HKD) *</label>
                <Input
                  type="number"
                  min="0"
                  step="1"
                  value={editAmountValue}
                  onChange={(e) => setEditAmountValue(e.target.value)}
                  placeholder="輸入佣金金額"
                />
                <p className="text-xs text-muted-foreground">
                  修改後的金額將在審批時使用
                </p>
              </div>
              {editError && <p className="text-sm text-red-500">{editError}</p>}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)} disabled={editSaving}>取消</Button>
            <Button className="bg-amber-600 hover:bg-amber-700" onClick={handleSaveAmount} disabled={editSaving}>
              {editSaving ? '儲存中...' : '儲存金額'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
