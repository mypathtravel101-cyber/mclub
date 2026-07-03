'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { fetchWithAuth } from '@/lib/api-helpers';
import { useAppStore } from '@/store/app';
import { Plus, Search, Mail, Phone, Building, UserCircle, CalendarDays, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Pagination } from '@/components/crm/Pagination';
import { useToast } from '@/hooks/use-toast';

interface Customer {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  nationality: string | null;
  status: string;
  createdAt: string;
  referrer: { id: string; name: string } | null;
  orders: {
    id: string;
    status: string;
    product: { id: string; name: string; emoji: string };
    agent: { id: string; name: string };
  }[];
  eventRegistrations: {
    id: string;
    status: string;
    guests: number;
    event: { id: string; title: string; date: string; type: string };
  }[];
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

export function CustomersPage() {
  const { setCurrentPage, setSelectedCustomerId, user } = useAppStore();
  const { toast } = useToast();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    nationality: '',
    status: 'prospect',
  });

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // Reset to page 1 on search
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams({ page: String(page), limit: '10' });
    if (debouncedSearch) params.set('search', debouncedSearch);

    fetchWithAuth(`/api/customers?${params}`).then((res) => {
      if (!cancelled) {
        setCustomers(res.data);
        setTotalPages(res.pagination.totalPages);
        setTotal(res.pagination.total);
      }
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [page, debouncedSearch]);

  const isAdmin = user?.role === 'admin';

  const handleDelete = async (customerId: string, customerName: string) => {
    if (!isAdmin) return;
    const confirmed = window.confirm(
      `確定要刪除客戶「${customerName}」嗎？\n\n此操作無法復原，所有相關的訂單及佣金紀錄也會一併刪除。`  
    );
    if (!confirmed) return;

    try {
      await fetchWithAuth(`/api/customers/${customerId}`, { method: 'DELETE' });
      setCustomers((prev) => prev.filter((c) => c.id !== customerId));
      toast({ title: '客戶已刪除', description: `「${customerName}」已成功刪除` });
    } catch (e: unknown) {
      const msg = (e as Error).message || '';
      if (msg.includes('不存在')) {
        setCustomers((prev) => prev.filter((c) => c.id !== customerId));
        toast({ title: '客戶已不存在', description: `「${customerName}」已被移除` });
      } else {
        toast({ title: '刪除失敗', description: msg || '請稍後再試', variant: 'destructive' });
      }
    }
  };

  const refreshCustomers = () => {
    const params = new URLSearchParams({ page: String(page), limit: '10' });
    if (debouncedSearch) params.set('search', debouncedSearch);
    fetchWithAuth(`/api/customers?${params}`).then((res) => {
      setCustomers(res.data);
      setTotalPages(res.pagination.totalPages);
      setTotal(res.pagination.total);
    });
  };

  const handleAdd = async () => {
    await fetchWithAuth('/api/customers', {
      method: 'POST',
      body: JSON.stringify(form),
    });
    setOpen(false);
    setForm({ name: '', email: '', phone: '', company: '', nationality: '', status: 'prospect' });
    refreshCustomers();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">客戶管理</h1>
          <p className="text-muted-foreground">管理所有客戶資料及聯繫方式</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-amber-600 hover:bg-amber-700">
              <Plus className="mr-2 h-4 w-4" />
              新增客戶
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>新增客戶</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">姓名 *</label>
                  <Input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="客戶姓名"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">國籍</label>
                  <Input
                    value={form.nationality}
                    onChange={(e) => setForm({ ...form, nationality: e.target.value })}
                    placeholder="HK / CN / TW"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">電郵</label>
                  <Input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="email@example.com"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">電話</label>
                  <Input
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="+852 XXXX XXXX"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">公司</label>
                  <Input
                    value={form.company}
                    onChange={(e) => setForm({ ...form, company: e.target.value })}
                    placeholder="公司名稱"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">狀態</label>
                  <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">活躍</SelectItem>
                      <SelectItem value="prospect">潛在客戶</SelectItem>
                      <SelectItem value="inactive">非活躍</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={handleAdd} className="w-full bg-amber-600 hover:bg-amber-700" disabled={!form.name}>
                確認新增
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="搜尋客戶..."
          className="pl-9"
        />
      </div>

      {/* Customer list */}
      <div className="space-y-3">
        {customers.map((c) => (
          <Card key={c.id} className="hover:shadow-sm transition-shadow cursor-pointer" onClick={() => { setSelectedCustomerId(c.id); setCurrentPage('customer-detail'); }}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-amber-700 font-bold text-sm">
                    {c.name.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{c.name}</p>
                      <Badge variant="outline" className={cn('text-[10px]', STATUS_COLORS[c.status])}>
                        {STATUS_LABELS[c.status]}
                      </Badge>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      {c.email && (
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {c.email}
                        </span>
                      )}
                      {c.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {c.phone}
                        </span>
                      )}
                      {c.company && (
                        <span className="flex items-center gap-1">
                          <Building className="h-3 w-3" />
                          {c.company}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-right text-xs text-muted-foreground">
                  {c.referrer && <p>推薦人: {c.referrer.name}</p>}
                  <p>{new Date(c.createdAt).toLocaleDateString('zh-HK')}</p>
                </div>
                {isAdmin && (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(c.id, c.name); }}
                    className="ml-3 p-1.5 rounded-lg text-muted-foreground hover:text-red-600 hover:bg-red-50 transition-colors shrink-0"
                    title="刪除客戶"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
              {/* Serving director & product info */}
              {(c.orders.length > 0 || c.eventRegistrations.length > 0) && (
                <div className="mt-3 pt-3 border-t border-dashed">
                  <div className="flex flex-wrap gap-2">
                    {c.orders.slice(0, 3).map((o) => (
                      <div key={o.id} className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200 px-2.5 py-1 text-xs">
                        <span>{o.product.emoji}</span>
                        <span className="text-muted-foreground">{o.product.name}</span>
                        <span className="text-amber-300">|</span>
                        <span className="flex items-center gap-0.5 text-amber-700 font-medium">
                          <UserCircle className="h-3 w-3" />
                          {o.agent?.name || '未指派'}
                        </span>
                      </div>
                    ))}
                    {c.eventRegistrations.slice(0, 3).map((er) => (
                      <div key={er.id} className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 border border-blue-200 px-2.5 py-1 text-xs">
                        <CalendarDays className="h-3 w-3 text-blue-600" />
                        <span className="text-blue-800 font-medium">{er.event.title}</span>
                        <span className="text-blue-300">|</span>
                        <span className="text-blue-600">
                          {new Date(er.event.date).toLocaleDateString('zh-HK', { month: 'short', day: 'numeric' })}
                          {er.guests > 0 && ` +${er.guests}人`}
                        </span>
                      </div>
                    ))}
                    {(c.orders.length + c.eventRegistrations.length > 3) && (
                      <span className="inline-flex items-center rounded-full bg-gray-50 border border-gray-200 px-2.5 py-1 text-xs text-muted-foreground">
                        +{c.orders.length + c.eventRegistrations.length - 3} 更多
                      </span>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
        {customers.length === 0 && (
          <div className="py-12 text-center text-muted-foreground">
            未找到匹配的客戶
          </div>
        )}
      </div>

      {/* Pagination */}
      <Pagination
        page={page}
        totalPages={totalPages}
        total={total}
        limit={10}
        onPageChange={setPage}
      />
    </div>
  );
}
