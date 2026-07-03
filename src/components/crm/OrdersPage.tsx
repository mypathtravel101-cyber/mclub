'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
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
import { useToast } from '@/hooks/use-toast';
import { Plus, ChevronRight, X, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Pagination } from '@/components/crm/Pagination';
import { useAppStore } from '@/store/app';

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

interface Product {
  id: string;
  name: string;
  nameEn: string;
  emoji: string;
  description: string;
  descriptionEn: string;
  category: string;
  priceMin: number;
  priceMax: number;
  currency: string;
  commissionRate: number;
  commissionFixed: number;
  commissionNegotiable: boolean;
  parentId: string | null;
  status: string;
  children?: Product[];
}

interface DirectorOption {
  id: string;
  name: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  investment: '投資',
  immigration: '移民',
  fund: '基金',
  trust: '信託',
  corporate: '企業服務',
  technology: '科技',
  legal: '法律',
  education: '教育',
};

const CATEGORY_COLORS: Record<string, string> = {
  investment: 'bg-blue-100 text-blue-800 border-blue-200',
  immigration: 'bg-green-100 text-green-800 border-green-200',
  fund: 'bg-purple-100 text-purple-800 border-purple-200',
  trust: 'bg-amber-100 text-amber-800 border-amber-200',
  corporate: 'bg-cyan-100 text-cyan-800 border-cyan-200',
  technology: 'bg-rose-100 text-rose-800 border-rose-200',
  legal: 'bg-red-100 text-red-800 border-red-200',
  education: 'bg-indigo-100 text-indigo-800 border-indigo-200',
};

const CATEGORY_ACCENT: Record<string, string> = {
  investment: 'border-l-blue-500',
  immigration: 'border-l-green-500',
  fund: 'border-l-purple-500',
  trust: 'border-l-amber-500',
  corporate: 'border-l-cyan-500',
  technology: 'border-l-rose-500',
  legal: 'border-l-red-500',
  education: 'border-l-indigo-500',
};

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  prospect: { label: '潛在客戶', color: 'bg-slate-100 text-slate-800' },
  following_up: { label: '跟進中', color: 'bg-sky-100 text-sky-800' },
  quoted: { label: '已報價', color: 'bg-violet-100 text-violet-800' },
  confirmed: { label: '已確認', color: 'bg-amber-100 text-amber-800' },
  pending: { label: '待處理', color: 'bg-yellow-100 text-yellow-800' },
  processing: { label: '處理中', color: 'bg-blue-100 text-blue-800' },
  completed: { label: '已完成', color: 'bg-green-100 text-green-800' },
  cancelled: { label: '已取消', color: 'bg-red-100 text-red-800' },
};

const SALE_STATUS_OPTIONS = [
  { value: 'prospect', label: '潛在客戶' },
  { value: 'following_up', label: '跟進中' },
  { value: 'quoted', label: '已報價' },
  { value: 'confirmed', label: '已確認' },
  { value: 'pending', label: '待處理' },
  { value: 'processing', label: '處理中' },
  { value: 'completed', label: '已完成' },
  { value: 'cancelled', label: '已取消' },
];

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat('zh-HK', {
    style: 'currency',
    currency: currency || 'HKD',
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatPrice(amount: number, currency: string) {
  return new Intl.NumberFormat('zh-HK', {
    style: 'currency',
    currency: currency || 'HKD',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function OrdersPage() {
  const { toast } = useToast();
  const { user, preselectedProductId, setPreselectedProductId } = useAppStore();
  const isDirector = user?.role === 'director';
  const [orders, setOrders] = useState<Order[]>([]);
  const [parentProducts, setParentProducts] = useState<Product[]>([]);
  const [directors, setDirectors] = useState<DirectorOption[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [open, setOpen] = useState(false);
  const [productsLoaded, setProductsLoaded] = useState(false);

  // New order form state
  const [clientName, setClientName] = useState('');
  const [selectedDirectorId, setSelectedDirectorId] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [enteredAmount, setEnteredAmount] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  const [orderStatus, setOrderStatus] = useState('prospect');
  const [subProducts, setSubProducts] = useState<Product[]>([]);
  const [loadingSubProducts, setLoadingSubProducts] = useState(false);

  // Selected product details for display
  const selectedProduct = selectedCategoryId
    ? parentProducts.find(p => p.id === selectedCategoryId) ||
      subProducts.find(p => p.id === selectedProductId)
    : null;

  const currentSubProduct = selectedProductId
    ? subProducts.find(p => p.id === selectedProductId)
    : null;

  const loadOrders = useCallback(async () => {
    const params = new URLSearchParams({ page: String(page), limit: '10' });
    if (statusFilter && statusFilter !== 'all') params.set('status', statusFilter);
    const res = await fetchWithAuth(`/api/orders?${params}`);
    setOrders(res.data);
    setTotalPages(res.pagination.totalPages);
    setTotal(res.pagination.total);
  }, [page, statusFilter]);

  useEffect(() => {
    let cancelled = false;

    // Load orders separately
    fetchWithAuth(`/api/orders?page=${page}&limit=10${statusFilter !== 'all' ? `&status=${statusFilter}` : ''}`)
      .then((ordersRes) => {
        if (!cancelled) {
          setOrders(ordersRes.data || []);
          if (ordersRes.pagination) {
            setTotalPages(ordersRes.pagination.totalPages);
            setTotal(ordersRes.pagination.total);
          }
        }
      })
      .catch((err) => { console.error('Failed to fetch orders:', err); });

    // Load products separately
    fetchWithAuth('/api/products?limit=100&parentId=null')
      .then((productsRes) => {
        if (!cancelled) {
          const pData = productsRes.data || productsRes;
          setParentProducts(Array.isArray(pData) ? pData : []);
          setProductsLoaded(true);
        }
      })
      .catch((err) => {
        console.error('Failed to fetch products:', err);
        setProductsLoaded(true);
      });

    // Load directors separately
    fetchWithAuth('/api/users?role=director,admin')
      .then((directorsRes) => {
        if (!cancelled) {
          setDirectors(Array.isArray(directorsRes) ? directorsRes : directorsRes.data || []);
        }
      })
      .catch((err) => { console.error('Failed to fetch directors:', err); });

    // Auto-fill director if logged in as director
    if (user?.role === 'director' && user?.id) {
      setSelectedDirectorId(user.id);
    }

    return () => { cancelled = true; };
  }, [page, statusFilter, user?.role, user?.id]);

  // Load sub-products when a category is selected
  useEffect(() => {
    if (!selectedCategoryId || !open) return;
    const parent = parentProducts.find(p => p.id === selectedCategoryId);
    if (parent && parent.children && parent.children.length > 0) {
      setSubProducts(parent.children);
      return;
    }
    // Fetch from API if children not loaded
    setLoadingSubProducts(true);
    fetchWithAuth(`/api/products?limit=100&parentId=${selectedCategoryId}`)
      .then((res) => {
        const data = res.data || res;
        setSubProducts(Array.isArray(data) ? data : []);
      })
      .catch(() => setSubProducts([]))
      .finally(() => setLoadingSubProducts(false));
  }, [selectedCategoryId, open, parentProducts]);

  // Handle preselected product from SubProductsPage navigation
  useEffect(() => {
    if (!preselectedProductId || !productsLoaded) return;

    // Find the parent of this sub-product
    const findParentAndSelect = async () => {
      // First check if it's a parent product itself
      const asParent = parentProducts.find(p => p.id === preselectedProductId);
      if (asParent) {
        setSelectedCategoryId(asParent.id);
        // Pre-fill price from parent product
        if (asParent.priceMin > 0) {
          setEnteredAmount(String(asParent.priceMin));
        }
        setOpen(true);
        setPreselectedProductId(null);
        return;
      }

      // It's a sub-product - fetch its details to find parent
      try {
        const productRes = await fetchWithAuth(`/api/products/${preselectedProductId}`);
        const productData = productRes.data || productRes;
        if (productData && productData.parentId) {
          setSelectedCategoryId(productData.parentId);
          // Need to load sub-products first, then select the specific one
          const childrenRes = await fetchWithAuth(`/api/products?limit=100&parentId=${productData.parentId}`);
          const childrenData = childrenRes.data || childrenRes;
          const children = Array.isArray(childrenData) ? childrenData : [];
          setSubProducts(children);
          setSelectedProductId(preselectedProductId);
          // Pre-fill price from sub-product
          if (productData.priceMin > 0) {
            setEnteredAmount(String(productData.priceMin));
          }
        } else if (productData) {
          setSelectedCategoryId(productData.id);
          // Pre-fill price from parent product (no sub-products case)
          if (productData.priceMin > 0) {
            setEnteredAmount(String(productData.priceMin));
          }
        }
        setOpen(true);
      } catch (err) {
        console.error('Failed to find parent product:', err);
      }
      setPreselectedProductId(null);
    };

    findParentAndSelect();
  }, [preselectedProductId, productsLoaded, parentProducts, setPreselectedProductId]);

  const resetForm = () => {
    setClientName('');
    setSelectedCategoryId(null);
    setSelectedProductId(null);
    setEnteredAmount('');
    setOrderNotes('');
    setOrderStatus('prospect');
    setSubProducts([]);
    if (user?.role === 'director' && user?.id) {
      setSelectedDirectorId(user.id);
    } else {
      setSelectedDirectorId('');
    }
  };

  const handleAdd = async () => {
    try {
      // First, find or create the customer by name
      let customerId = '';
      const customersRes = await fetchWithAuth('/api/customers?limit=9999');
      const existingCustomers = customersRes.data || customersRes;
      const existing = Array.isArray(existingCustomers)
        ? existingCustomers.find((c: { name: string }) => c.name === clientName)
        : null;

      if (existing) {
        customerId = existing.id;
      } else {
        // Create new customer
        const newCustomer = await fetchWithAuth('/api/customers', {
          method: 'POST',
          body: JSON.stringify({
            name: clientName,
            email: '',
            phone: '',
            status: 'active',
          }),
        });
        customerId = newCustomer.id;
      }

      const productId = selectedProductId || selectedCategoryId;
      if (!productId) {
        toast({ title: '請選擇產品', variant: 'destructive' });
        return;
      }

      await fetchWithAuth('/api/orders', {
        method: 'POST',
        body: JSON.stringify({
          customerId,
          productId,
          agentId: selectedDirectorId,
          amount: parseFloat(enteredAmount),
          status: orderStatus,
          currency: 'HKD',
          notes: orderNotes,
        }),
      });
      setOpen(false);
      resetForm();
      loadOrders();
      toast({ title: '訂單已建立', description: '新訂單已成功建立' });
    } catch (e: unknown) {
      const error = e as Error;
      toast({ title: '建立失敗', description: error.message, variant: 'destructive' });
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      await fetchWithAuth('/api/orders', {
        method: 'PUT',
        body: JSON.stringify({ id, status }),
      });
      loadOrders();
      toast({ title: '狀態已更新' });
    } catch (e: unknown) {
      const error = e as Error;
      toast({ title: '更新失敗', description: error.message, variant: 'destructive' });
    }
  };

  const handleCategorySelect = (productId: string) => {
    if (selectedCategoryId === productId) {
      // Deselect
      setSelectedCategoryId(null);
      setSelectedProductId(null);
      setSubProducts([]);
      setEnteredAmount('');
      return;
    }
    setSelectedCategoryId(productId);
    setSelectedProductId(null);
    // Auto-fill price only when category has no sub-products
    const product = parentProducts.find(p => p.id === productId);
    const hasChildren = product && product.children && product.children.length > 0;
    if (!hasChildren && product && product.priceMin > 0) {
      setEnteredAmount(String(product.priceMin));
    } else {
      setEnteredAmount('');
    }
  };

  const handleSubProductSelect = (subId: string) => {
    setSelectedProductId(subId);
    // Pre-fill price range midpoint or min
    const sub = subProducts.find(p => p.id === subId);
    if (sub) {
      setEnteredAmount(String(sub.priceMin || ''));
    }
  };

  // Determine if the selected category has sub-products
  const selectedParent = parentProducts.find(p => p.id === selectedCategoryId);
  const hasSubProducts = subProducts.length > 0;
  const canSubmit = clientName && selectedCategoryId && enteredAmount && selectedDirectorId &&
    (hasSubProducts ? selectedProductId : true);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">訂單管理</h1>
          <p className="text-muted-foreground">追蹤所有產品訂單狀態</p>
        </div>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (v) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="bg-amber-600 hover:bg-amber-700">
              <Plus className="mr-2 h-4 w-4" />
              新增訂單
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>新增訂單</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              {/* Step 1: Client, Director & Sale Status */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">客戶、總監及銷售狀態</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium">客戶名稱 *</label>
                    <Input
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      placeholder="輸入客戶名稱"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">負責總監 *</label>
                    {isDirector && user ? (
                      <div className="flex items-center gap-2 mt-1 h-10 px-3 rounded-md border bg-muted/50">
                        <span className="font-medium">{user.name}</span>
                        <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-700 border-amber-300">總監</Badge>
                      </div>
                    ) : (
                      <Select value={selectedDirectorId} onValueChange={setSelectedDirectorId}>
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="選擇總監" />
                        </SelectTrigger>
                        <SelectContent>
                          {directors.map((d) => (
                            <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                  <div>
                    <label className="text-sm font-medium">銷售狀態 *</label>
                    <Select value={orderStatus} onValueChange={setOrderStatus}>
                      <SelectTrigger className={cn('mt-1', orderStatus === 'completed' && 'font-bold text-red-600')}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SALE_STATUS_OPTIONS.map((s) => (
                          <SelectItem key={s.value} value={s.value}>
                            <span className={s.value === 'completed' ? 'font-bold text-red-600' : ''}>{s.label}</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Step 2: Product Category Selection */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">選擇產品類別</h3>
                {!productsLoaded ? (
                  <div className="flex justify-center py-8">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-amber-200 border-t-amber-600" />
                  </div>
                ) : parentProducts.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">無法載入產品資料，請重新整理頁面</p>
                ) : (
                <div className="grid grid-cols-2 gap-3">
                  {parentProducts.map((product) => {
                    const isSelected = selectedCategoryId === product.id;
                    const isComingSoon = product.status === 'coming_soon';
                    return (
                      <Card
                        key={product.id}
                        className={cn(
                          'cursor-pointer transition-all border-l-4 relative',
                          CATEGORY_ACCENT[product.category] || 'border-l-gray-400',
                          isSelected
                            ? 'ring-2 ring-amber-400 shadow-md bg-amber-50/50'
                            : 'hover:shadow-md',
                          isComingSoon && 'opacity-60',
                        )}
                        onClick={() => !isComingSoon && handleCategorySelect(product.id)}
                      >
                        {isSelected && (
                          <div className="absolute top-2 right-2">
                            <div className="h-5 w-5 rounded-full bg-amber-500 flex items-center justify-center">
                              <Check className="h-3 w-3 text-white" />
                            </div>
                          </div>
                        )}
                        <CardContent className="p-3">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{product.emoji}</span>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">{product.name}</p>
                              <p className="text-[10px] text-muted-foreground truncate">{product.nameEn}</p>
                            </div>
                          </div>
                          <div className="mt-1.5 flex items-center gap-2">
                            <Badge variant="outline" className={cn('text-[9px]', CATEGORY_COLORS[product.category])}>
                              {CATEGORY_LABELS[product.category]}
                            </Badge>
                            {isComingSoon ? (
                              <span className="text-[10px] text-amber-600 font-medium">即將推出</span>
                            ) : product.priceMin > 0 ? (
                              <span className="text-[10px] text-muted-foreground">
                                {formatPrice(product.priceMin, product.currency)}
                                {product.priceMin !== product.priceMax && (
                                  <> - {formatPrice(product.priceMax, product.currency)}</>
                                )}
                              </span>
                            ) : null}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
                )}
              </div>

              {/* Step 3: Sub-product Selection (if applicable) */}
              {selectedCategoryId && hasSubProducts && (
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                    選擇具體產品
                    <span className="ml-2 text-amber-600 font-normal normal-case">
                      {selectedParent?.emoji} {selectedParent?.name} 有 {subProducts.length} 項子產品
                    </span>
                  </h3>
                  {loadingSubProducts ? (
                    <div className="flex justify-center py-4">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-amber-200 border-t-amber-600" />
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {subProducts.map((sub) => {
                        const isSelected = selectedProductId === sub.id;
                        return (
                          <Card
                            key={sub.id}
                            className={cn(
                              'cursor-pointer transition-all',
                              isSelected
                                ? 'ring-2 ring-amber-400 bg-amber-50/50'
                                : 'hover:shadow-sm',
                            )}
                            onClick={() => handleSubProductSelect(sub.id)}
                          >
                            <CardContent className="flex items-center justify-between p-3">
                              <div className="flex items-center gap-3">
                                <span className="text-lg">{sub.emoji}</span>
                                <div>
                                  <p className="font-medium text-sm">{sub.name}</p>
                                  <p className="text-[10px] text-muted-foreground">{sub.nameEn}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <div className="text-right">
                                  <p className="text-sm font-medium">
                                    {formatPrice(sub.priceMin, sub.currency)}
                                    {sub.priceMin !== sub.priceMax && (
                                      <> - {formatPrice(sub.priceMax, sub.currency)}</>
                                    )}
                                  </p>
                                  {sub.commissionFixed > 0 ? (
                                    <p className="text-[10px] text-green-600">佣金: HK${sub.commissionFixed.toLocaleString()}</p>
                                  ) : sub.commissionRate > 0 ? (
                                    <p className="text-[10px] text-amber-600">佣金: {sub.commissionRate}%</p>
                                  ) : sub.commissionNegotiable ? (
                                    <p className="text-[10px] text-muted-foreground">佣金: 另議</p>
                                  ) : null}
                                </div>
                                {isSelected && (
                                  <div className="h-6 w-6 rounded-full bg-amber-500 flex items-center justify-center">
                                    <Check className="h-3.5 w-3.5 text-white" />
                                  </div>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Step 4: Price & Notes */}
              {selectedCategoryId && (!hasSubProducts || selectedProductId) && (
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">訂單金額及備註</h3>
                  <div className="bg-muted/30 rounded-lg p-4 space-y-3">
                    {/* Selected product summary */}
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-lg">{currentSubProduct?.emoji || selectedParent?.emoji}</span>
                      <span className="font-medium">{currentSubProduct?.name || selectedParent?.name}</span>
                      {currentSubProduct && (
                        <Badge variant="outline" className={cn('text-[9px]', CATEGORY_COLORS[currentSubProduct.category])}>
                          {CATEGORY_LABELS[currentSubProduct.category]}
                        </Badge>
                      )}
                    </div>
                    {(currentSubProduct || selectedParent) && (
                      <p className="text-xs text-muted-foreground">
                        建議價格: {formatPrice(
                          currentSubProduct?.priceMin || selectedParent?.priceMin || 0,
                          currentSubProduct?.currency || selectedParent?.currency || 'HKD'
                        )}
                        {(currentSubProduct?.priceMin !== currentSubProduct?.priceMax ||
                          (!currentSubProduct && selectedParent?.priceMin !== selectedParent?.priceMax)) && (
                          <> - {formatPrice(
                            currentSubProduct?.priceMax || selectedParent?.priceMax || 0,
                            currentSubProduct?.currency || selectedParent?.currency || 'HKD'
                          )}</>
                        )}
                      </p>
                    )}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium">訂單金額 (HKD) *</label>
                        <Input
                          type="number"
                          value={enteredAmount}
                          onChange={(e) => setEnteredAmount(e.target.value)}
                          placeholder="輸入金額"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">備註</label>
                        <Input
                          value={orderNotes}
                          onChange={(e) => setOrderNotes(e.target.value)}
                          placeholder="訂單備註"
                          className="mt-1"
                        />
                      </div>
                    </div>
                    {/* Commission preview */}
                    {enteredAmount && (currentSubProduct || selectedParent) && (() => {
                      const p = currentSubProduct || selectedParent;
                      if (!p) return null;
                      const amount = parseFloat(enteredAmount);
                      if (!amount || amount <= 0) return null;
                      let commission = 0;
                      let commissionLabel = '';
                      if (p.commissionFixed > 0) {
                        commission = p.commissionFixed;
                        commissionLabel = `固定 HK$${commission.toLocaleString()}`;
                      } else if (p.commissionRate > 0) {
                        commission = amount * (p.commissionRate / 100);
                        commissionLabel = `${p.commissionRate}% = HK$${Math.round(commission).toLocaleString()}`;
                      } else if (p.commissionNegotiable) {
                        commissionLabel = '另議';
                      }
                      return commissionLabel ? (
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-muted-foreground">預計佣金</span>
                          <span className={commission > 0 ? 'font-medium text-amber-600' : 'text-muted-foreground'}>
                            {commissionLabel}
                          </span>
                        </div>
                      ) : null;
                    })()}
                  </div>
                </div>
              )}

              {/* Submit */}
              <Button
                onClick={handleAdd}
                className="w-full bg-amber-600 hover:bg-amber-700"
                disabled={!canSubmit}
              >
                確認新增
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Status filter */}
      <div className="flex gap-2">
        {[
          { value: 'all', label: '全部' },
          { value: 'prospect', label: '潛在客戶' },
          { value: 'following_up', label: '跟進中' },
          { value: 'quoted', label: '已報價' },
          { value: 'confirmed', label: '已確認' },
          { value: 'pending', label: '待處理' },
          { value: 'processing', label: '處理中' },
          { value: 'completed', label: '已完成' },
          { value: 'cancelled', label: '已取消' },
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
                      {o.product.name} · 總監: {o.agent.name}
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
                        {SALE_STATUS_OPTIONS.map((s) => (
                          <SelectItem key={s.value} value={s.value}>
                            <span className={s.value === 'completed' ? 'font-bold text-red-600' : ''}>{s.label}</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
    </div>
  );
}
