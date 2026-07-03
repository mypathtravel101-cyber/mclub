'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { fetchWithAuth } from '@/lib/api-helpers';
import { cn } from '@/lib/utils';
import { ArrowLeft, ChevronRight, Save, X, FileDown, ShoppingCart } from 'lucide-react';
import { useAppStore } from '@/store/app';

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
  attachmentUrl: string | null;
  status: string;
  children?: Product[];
}

const CATEGORY_COLORS: Record<string, string> = {
  investment: 'bg-blue-100 text-blue-800',
  immigration: 'bg-green-100 text-green-800',
  fund: 'bg-purple-100 text-purple-800',
  trust: 'bg-amber-100 text-amber-800',
  corporate: 'bg-cyan-100 text-cyan-800',
  technology: 'bg-rose-100 text-rose-800',
  legal: 'bg-red-100 text-red-800',
  education: 'bg-indigo-100 text-indigo-800',
  'legal-hk-divorce': 'bg-red-100 text-red-800',
  'legal-cn-divorce': 'bg-orange-100 text-orange-800',
  'legal-cn-options': 'bg-yellow-100 text-yellow-800',
  'legal-extra': 'bg-pink-100 text-pink-800',
  'legal-extract': 'bg-fuchsia-100 text-fuchsia-800',
  'legal-represent': 'bg-violet-100 text-violet-800',
  'legal-criminal': 'bg-rose-100 text-rose-800',
};

const CATEGORY_LABELS: Record<string, string> = {
  investment: '投資',
  immigration: '移民',
  fund: '基金',
  trust: '信託',
  corporate: '企業服務',
  technology: '科技',
  legal: '法律',
  education: '教育',
  'legal-hk-divorce': '香港離婚收費表',
  'legal-cn-divorce': '中港離婚收費表',
  'legal-cn-options': '中港離婚附加選項',
  'legal-extra': '離婚服務額外收費',
  'legal-extract': '離婚服務遺項式收費',
  'legal-represent': '律師代表費用收費表',
  'legal-criminal': '刑事案件',
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
  'legal-hk-divorce': 'border-l-red-500',
  'legal-cn-divorce': 'border-l-orange-500',
  'legal-cn-options': 'border-l-yellow-500',
  'legal-extra': 'border-l-pink-500',
  'legal-extract': 'border-l-fuchsia-500',
  'legal-represent': 'border-l-violet-500',
  'legal-criminal': 'border-l-rose-500',
};

// Ordered category keys for legal sub-categories (controls display order)
const LEGAL_CATEGORY_ORDER = [
  'legal-hk-divorce',
  'legal-cn-divorce',
  'legal-cn-options',
  'legal-extra',
  'legal-extract',
  'legal-represent',
  'legal-criminal',
];

function formatPrice(amount: number, currency: string) {
  return new Intl.NumberFormat('zh-HK', {
    style: 'currency',
    currency: currency || 'HKD',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function SubProductsPage() {
  const { selectedProductId, setCurrentPage, setSelectedProductId, setPreselectedProductId, user } = useAppStore();
  const isAdmin = user?.role === 'admin';
  const [parentProduct, setParentProduct] = useState<Product | null>(null);
  const [subProducts, setSubProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<{
    priceMin: number;
    priceMax: number;
    commissionFixed: number;
    commissionRate: number;
    description: string;
  } | null>(null);

  useEffect(() => {
    if (!selectedProductId) return;
    let cancelled = false;

    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch parent product
        const parentRes = await fetchWithAuth(`/api/products/${selectedProductId}`);
        const parentData = parentRes.data !== undefined ? parentRes.data : parentRes;
        if (!cancelled && parentData) {
          setParentProduct(parentData);
        }

        // Fetch sub-products (children)
        const childrenRes = await fetchWithAuth(`/api/products?limit=100&parentId=${selectedProductId}`);
        const childrenData = childrenRes.data !== undefined ? childrenRes.data : childrenRes;
        if (!cancelled) {
          setSubProducts(Array.isArray(childrenData) ? childrenData : []);
        }
      } catch (err) {
        console.error('Failed to fetch products:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchData();
    return () => { cancelled = true; };
  }, [selectedProductId]);

  const handleBack = () => {
    setSelectedProductId(null);
    setCurrentPage('products');
  };

  const handleSubProductClick = (product: Product) => {
    setSelectedProductId(product.id);
    setCurrentPage('product-detail');
  };

  const handleNewOrder = (product: Product) => {
    setPreselectedProductId(product.id);
    setCurrentPage('orders');
  };

  const startEdit = (product: Product) => {
    setEditingId(product.id);
    setEditData({
      priceMin: product.priceMin,
      priceMax: product.priceMax,
      commissionFixed: product.commissionFixed,
      commissionRate: product.commissionRate,
      description: product.description,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditData(null);
  };

  const saveEdit = async (productId: string) => {
    if (!editData) return;
    try {
      await fetchWithAuth('/api/products', {
        method: 'PUT',
        body: JSON.stringify({ id: productId, ...editData }),
      });
      // Refresh sub-products
      const childrenRes = await fetchWithAuth(`/api/products?limit=100&parentId=${selectedProductId}`);
      const childrenData = childrenRes.data !== undefined ? childrenRes.data : childrenRes;
      setSubProducts(Array.isArray(childrenData) ? childrenData : []);
      setEditingId(null);
      setEditData(null);
    } catch (err) {
      console.error('Failed to update product:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-200 border-t-amber-600" />
      </div>
    );
  }

  if (!parentProduct) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={handleBack}>
          <ArrowLeft className="mr-2 h-4 w-4" /> 返回產品管理
        </Button>
        <p className="text-muted-foreground">找不到產品資料</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with back button */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={handleBack} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          返回產品管理
        </Button>
      </div>

      {/* Parent product info banner */}
      <Card className={cn(
        'border-l-4',
        CATEGORY_ACCENT[parentProduct.category] || 'border-l-gray-400',
      )}>
        <CardContent className="py-5">
          <div className="flex items-center gap-4">
            <span className="text-4xl">{parentProduct.emoji}</span>
            <div className="flex-1">
              <h1 className="text-2xl font-bold">{parentProduct.name}</h1>
              <p className="text-muted-foreground text-sm">{parentProduct.nameEn}</p>
              <p className="text-sm mt-1">{parentProduct.description}</p>
            </div>
            <div className="text-right">
              <Badge variant="outline" className={cn('text-xs', CATEGORY_COLORS[parentProduct.category])}>
                {CATEGORY_LABELS[parentProduct.category]}
              </Badge>
              <div className="mt-2 text-sm font-medium">
                {subProducts.length} 項子產品
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sub-products grid */}
      <div>
        <h2 className="text-lg font-semibold mb-4">子產品列表</h2>
        {parentProduct.category === 'legal' ? (
          // Group by legal sub-categories with section headers
          (() => {
            const grouped = subProducts.reduce<Record<string, Product[]>>((acc, p) => {
              const cat = p.category || 'legal';
              if (!acc[cat]) acc[cat] = [];
              acc[cat].push(p);
              return acc;
            }, {});
            const orderedKeys = Object.keys(grouped).sort((a, b) => {
              const ia = LEGAL_CATEGORY_ORDER.indexOf(a);
              const ib = LEGAL_CATEGORY_ORDER.indexOf(b);
              if (ia !== -1 && ib !== -1) return ia - ib;
              if (ia !== -1) return -1;
              if (ib !== -1) return 1;
              return a.localeCompare(b);
            });
            return orderedKeys.map((catKey) => (
              <div key={catKey} className="mb-8">
                <div className="flex items-center gap-3 mb-3">
                  <div className={cn('h-1 w-6 rounded-full', {
                    'bg-red-500': catKey === 'legal-hk-divorce',
                    'bg-orange-500': catKey === 'legal-cn-divorce',
                    'bg-yellow-500': catKey === 'legal-cn-options',
                    'bg-pink-500': catKey === 'legal-extra',
                    'bg-fuchsia-500': catKey === 'legal-extract',
                    'bg-violet-500': catKey === 'legal-represent',
                    'bg-rose-500': catKey === 'legal-criminal',
                    'bg-gray-500': !LEGAL_CATEGORY_ORDER.includes(catKey),
                  })} />
                  <h3 className="text-base font-semibold text-foreground">
                    {CATEGORY_LABELS[catKey] || catKey}
                  </h3>
                  <Badge variant="outline" className={cn('text-[10px]', CATEGORY_COLORS[catKey])}>
                    {grouped[catKey].length} 項
                  </Badge>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {grouped[catKey].map((product) => {
                    const isEditing = editingId === product.id;
                    return (
                      <Card
                        key={product.id}
                        className={cn(
                          'transition-all border-l-4',
                          CATEGORY_ACCENT[product.category] || 'border-l-gray-400',
                          isEditing ? 'ring-2 ring-amber-400 shadow-lg' : 'hover:shadow-md',
                        )}
                      >
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-2xl">{product.emoji}</span>
                              <div>
                                <CardTitle className="text-base">{product.name}</CardTitle>
                                <p className="text-xs text-muted-foreground">{product.nameEn}</p>
                              </div>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {isEditing ? (
                            <>
                              <div>
                                <label className="text-xs text-muted-foreground">描述</label>
                                <Textarea
                                  value={editData?.description || ''}
                                  onChange={(e) => setEditData(prev => prev ? { ...prev, description: e.target.value } : null)}
                                  rows={2}
                                  className="mt-1 text-xs"
                                />
                              </div>
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <label className="text-xs text-muted-foreground">最低價格</label>
                                  <Input
                                    type="number"
                                    value={editData?.priceMin || 0}
                                    onChange={(e) => setEditData(prev => prev ? { ...prev, priceMin: parseFloat(e.target.value) || 0 } : null)}
                                    className="mt-1 text-xs"
                                  />
                                </div>
                                <div>
                                  <label className="text-xs text-muted-foreground">最高價格</label>
                                  <Input
                                    type="number"
                                    value={editData?.priceMax || 0}
                                    onChange={(e) => setEditData(prev => prev ? { ...prev, priceMax: parseFloat(e.target.value) || 0 } : null)}
                                    className="mt-1 text-xs"
                                  />
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <label className="text-xs text-muted-foreground">Director 佣金 (HKD)</label>
                                  <Input
                                    type="number"
                                    value={editData?.commissionFixed || 0}
                                    onChange={(e) => setEditData(prev => prev ? { ...prev, commissionFixed: parseFloat(e.target.value) || 0 } : null)}
                                    className="mt-1 text-xs"
                                  />
                                </div>
                                <div>
                                  <label className="text-xs text-muted-foreground">佣金比例 %</label>
                                  <Input
                                    type="number"
                                    value={editData?.commissionRate || 0}
                                    onChange={(e) => setEditData(prev => prev ? { ...prev, commissionRate: parseFloat(e.target.value) || 0 } : null)}
                                    className="mt-1 text-xs"
                                  />
                                </div>
                              </div>
                              <div className="flex gap-2 pt-1">
                                <Button
                                  size="sm"
                                  className="flex-1 bg-amber-600 hover:bg-amber-700"
                                  onClick={(e) => { e.stopPropagation(); saveEdit(product.id); }}
                                >
                                  <Save className="mr-1 h-3.5 w-3.5" />
                                  儲存
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="flex-1"
                                  onClick={(e) => { e.stopPropagation(); cancelEdit(); }}
                                >
                                  <X className="mr-1 h-3.5 w-3.5" />
                                  取消
                                </Button>
                              </div>
                            </>
                          ) : (
                            <>
                              <p className="line-clamp-2 text-xs text-muted-foreground leading-relaxed">
                                {product.description}
                              </p>
                              <div className="space-y-1 text-xs">
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">價格</span>
                                  <span className="font-medium">
                                    {formatPrice(product.priceMin, product.currency)}
                                    {product.priceMin !== product.priceMax && (
                                      <> - {formatPrice(product.priceMax, product.currency)}</>
                                    )}
                                  </span>
                                </div>
                                {product.commissionFixed > 0 ? (
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">Director 佣金</span>
                                    <span className="font-medium text-green-600">
                                      HK${product.commissionFixed.toLocaleString()}
                                    </span>
                                  </div>
                                ) : product.commissionRate > 0 ? (
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">Director 佣金</span>
                                    <span className="font-medium text-amber-600">
                                      {product.commissionRate}%
                                    </span>
                                  </div>
                                ) : product.commissionNegotiable ? (
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">Director 佣金</span>
                                    <span className="font-medium text-muted-foreground">
                                      另議
                                    </span>
                                  </div>
                                ) : null}
                              </div>
                              <div className="flex items-center justify-between pt-1">
                                <Badge variant={product.status === 'active' ? 'default' : 'secondary'}>
                                  {product.status === 'active' ? '營運中' : '已停用'}
                                </Badge>
                                <div className="flex gap-1">
                                  {product.attachmentUrl && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="text-xs text-green-600 hover:text-green-700 hover:bg-green-50"
                                      onClick={(e) => { e.stopPropagation(); window.open(product.attachmentUrl!, '_blank'); }}
                                    >
                                      <FileDown className="mr-1 h-3.5 w-3.5" />
                                      PDF
                                    </Button>
                                  )}
                                  {isAdmin && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="text-xs text-muted-foreground hover:text-amber-600"
                                      onClick={(e) => { e.stopPropagation(); startEdit(product); }}
                                    >
                                      編輯
                                    </Button>
                                  )}
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-xs text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                                    onClick={(e) => { e.stopPropagation(); handleNewOrder(product); }}
                                  >
                                    <ShoppingCart className="mr-1 h-3.5 w-3.5" />
                                    新增訂單
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-xs text-muted-foreground hover:text-blue-600"
                                    onClick={(e) => { e.stopPropagation(); handleSubProductClick(product); }}
                                  >
                                    詳情
                                    <ChevronRight className="ml-0.5 h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              </div>
                            </>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            ));
          })()
        ) : (
          // Default flat grid for non-legal products
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {subProducts.map((product) => {
              const isEditing = editingId === product.id;
              return (
                <Card
                  key={product.id}
                  className={cn(
                    'transition-all border-l-4',
                    CATEGORY_ACCENT[product.category] || 'border-l-gray-400',
                    isEditing ? 'ring-2 ring-amber-400 shadow-lg' : 'hover:shadow-md',
                  )}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{product.emoji}</span>
                        <div>
                          <CardTitle className="text-base">{product.name}</CardTitle>
                          <p className="text-xs text-muted-foreground">{product.nameEn}</p>
                        </div>
                      </div>
                      <Badge
                        variant="outline"
                        className={cn('text-[10px]', CATEGORY_COLORS[product.category])}
                      >
                        {CATEGORY_LABELS[product.category]}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {isEditing ? (
                      <>
                        <div>
                          <label className="text-xs text-muted-foreground">描述</label>
                          <Textarea
                            value={editData?.description || ''}
                            onChange={(e) => setEditData(prev => prev ? { ...prev, description: e.target.value } : null)}
                            rows={2}
                            className="mt-1 text-xs"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs text-muted-foreground">最低價格</label>
                            <Input
                              type="number"
                              value={editData?.priceMin || 0}
                              onChange={(e) => setEditData(prev => prev ? { ...prev, priceMin: parseFloat(e.target.value) || 0 } : null)}
                              className="mt-1 text-xs"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-muted-foreground">最高價格</label>
                            <Input
                              type="number"
                              value={editData?.priceMax || 0}
                              onChange={(e) => setEditData(prev => prev ? { ...prev, priceMax: parseFloat(e.target.value) || 0 } : null)}
                              className="mt-1 text-xs"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs text-muted-foreground">Director 佣金 (HKD)</label>
                            <Input
                              type="number"
                              value={editData?.commissionFixed || 0}
                              onChange={(e) => setEditData(prev => prev ? { ...prev, commissionFixed: parseFloat(e.target.value) || 0 } : null)}
                              className="mt-1 text-xs"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-muted-foreground">佣金比例 %</label>
                            <Input
                              type="number"
                              value={editData?.commissionRate || 0}
                              onChange={(e) => setEditData(prev => prev ? { ...prev, commissionRate: parseFloat(e.target.value) || 0 } : null)}
                              className="mt-1 text-xs"
                            />
                          </div>
                        </div>
                        <div className="flex gap-2 pt-1">
                          <Button
                            size="sm"
                            className="flex-1 bg-amber-600 hover:bg-amber-700"
                            onClick={(e) => { e.stopPropagation(); saveEdit(product.id); }}
                          >
                            <Save className="mr-1 h-3.5 w-3.5" />
                            儲存
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1"
                            onClick={(e) => { e.stopPropagation(); cancelEdit(); }}
                          >
                            <X className="mr-1 h-3.5 w-3.5" />
                            取消
                          </Button>
                        </div>
                      </>
                    ) : (
                      <>
                        <p className="line-clamp-2 text-xs text-muted-foreground leading-relaxed">
                          {product.description}
                        </p>
                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">價格</span>
                            <span className="font-medium">
                              {formatPrice(product.priceMin, product.currency)}
                              {product.priceMin !== product.priceMax && (
                                <> - {formatPrice(product.priceMax, product.currency)}</>
                              )}
                            </span>
                          </div>
                          {product.commissionFixed > 0 ? (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Director 佣金</span>
                              <span className="font-medium text-green-600">
                                HK${product.commissionFixed.toLocaleString()}
                              </span>
                            </div>
                          ) : product.commissionRate > 0 ? (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Director 佣金</span>
                              <span className="font-medium text-amber-600">
                                {product.commissionRate}%
                              </span>
                            </div>
                          ) : product.commissionNegotiable ? (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Director 佣金</span>
                              <span className="font-medium text-muted-foreground">
                                另議
                              </span>
                            </div>
                          ) : null}
                        </div>
                        <div className="flex items-center justify-between pt-1">
                          <Badge variant={product.status === 'active' ? 'default' : 'secondary'}>
                            {product.status === 'active' ? '營運中' : '已停用'}
                          </Badge>
                          <div className="flex gap-1">
                            {product.attachmentUrl && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-xs text-green-600 hover:text-green-700 hover:bg-green-50"
                                onClick={(e) => { e.stopPropagation(); window.open(product.attachmentUrl!, '_blank'); }}
                              >
                                <FileDown className="mr-1 h-3.5 w-3.5" />
                                PDF
                              </Button>
                            )}
                            {isAdmin && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-xs text-muted-foreground hover:text-amber-600"
                                onClick={(e) => { e.stopPropagation(); startEdit(product); }}
                              >
                                編輯
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-xs text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                              onClick={(e) => { e.stopPropagation(); handleNewOrder(product); }}
                            >
                              <ShoppingCart className="mr-1 h-3.5 w-3.5" />
                              新增訂單
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-xs text-muted-foreground hover:text-blue-600"
                              onClick={(e) => { e.stopPropagation(); handleSubProductClick(product); }}
                            >
                              詳情
                              <ChevronRight className="ml-0.5 h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {subProducts.length === 0 && !loading && (
        <div className="text-center py-12 text-muted-foreground">
          此產品暫無子產品
        </div>
      )}
    </div>
  );
}
