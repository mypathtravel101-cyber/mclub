'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { fetchWithAuth } from '@/lib/api-helpers';
import { cn } from '@/lib/utils';
import { Plus, ChevronRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useAppStore } from '@/store/app';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

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
  investment: 'bg-blue-100 text-blue-800',
  immigration: 'bg-green-100 text-green-800',
  fund: 'bg-purple-100 text-purple-800',
  trust: 'bg-amber-100 text-amber-800',
  corporate: 'bg-cyan-100 text-cyan-800',
  technology: 'bg-rose-100 text-rose-800',
  legal: 'bg-red-100 text-red-800',
  education: 'bg-indigo-100 text-indigo-800',
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

function formatPrice(amount: number, currency: string) {
  return new Intl.NumberFormat('zh-HK', {
    style: 'currency',
    currency: currency || 'HKD',
    maximumFractionDigits: 0,
  }).format(amount);
}

const emptyNewProduct = {
  name: '',
  nameEn: '',
  emoji: '📦',
  description: '',
  descriptionEn: '',
  category: 'investment',
  priceMin: 0,
  priceMax: 0,
  currency: 'HKD',
  commissionRate: 0,
  status: 'active' as const,
};

export function ProductsPage() {
  const { setCurrentPage, setSelectedProductId, user } = useAppStore();
  const isAdmin = user?.role === 'admin';
  const [products, setProducts] = useState<Product[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [newProduct, setNewProduct] = useState({ ...emptyNewProduct });

  useEffect(() => {
    let cancelled = false;
    // Only fetch parent products (parentId=null)
    fetchWithAuth('/api/products?limit=100&parentId=null').then((res) => {
      if (!cancelled) {
        const data = res.data !== undefined ? res.data : res;
        setProducts(Array.isArray(data) ? data : []);
      }
    });
    return () => { cancelled = true; };
  }, []);

  const refreshProducts = () => {
    fetchWithAuth('/api/products?limit=100&parentId=null').then((res) => {
      const data = res.data !== undefined ? res.data : res;
      setProducts(Array.isArray(data) ? data : []);
    });
  };

  const handleCreateProduct = async () => {
    if (!newProduct.name || !newProduct.nameEn) return;
    await fetchWithAuth('/api/products', {
      method: 'POST',
      body: JSON.stringify(newProduct),
    });
    setCreateOpen(false);
    setNewProduct({ ...emptyNewProduct });
    refreshProducts();
  };

  const handleCardClick = (product: Product) => {
    setSelectedProductId(product.id);
    // If product has children, navigate to sub-products page; otherwise go to detail
    const childCount = product.children?.length ?? 0;
    if (childCount > 0) {
      setCurrentPage('sub-products');
    } else {
      setCurrentPage('product-detail');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">產品管理</h1>
          <p className="text-muted-foreground">
            管理 MCLUB {products.length} 項產品及服務
          </p>
        </div>
        {isAdmin && (
          <Button className="bg-amber-600 hover:bg-amber-700" onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            新增產品
          </Button>
        )}
      </div>

      {/* Create Product Dialog */}
      <Dialog open={createOpen} onOpenChange={(v) => { if (!v) setNewProduct({ ...emptyNewProduct }); setCreateOpen(v); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>新增產品</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">產品名稱 (中文) *</label>
                <Input
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                  placeholder="產品名稱"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Product Name (EN) *</label>
                <Input
                  value={newProduct.nameEn}
                  onChange={(e) => setNewProduct({ ...newProduct, nameEn: e.target.value })}
                  placeholder="Product name"
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium">Emoji</label>
                <Input
                  value={newProduct.emoji}
                  onChange={(e) => setNewProduct({ ...newProduct, emoji: e.target.value })}
                  placeholder="📦"
                />
              </div>
              <div>
                <label className="text-sm font-medium">分類</label>
                <Select value={newProduct.category} onValueChange={(v) => setNewProduct({ ...newProduct, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">貨幣</label>
                <Select value={newProduct.currency} onValueChange={(v) => setNewProduct({ ...newProduct, currency: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="HKD">HKD</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="RMB">RMB</SelectItem>
                    <SelectItem value="JPY">JPY</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">描述 (中文) *</label>
              <Textarea
                value={newProduct.description}
                onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                placeholder="產品描述"
                rows={2}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Description (EN) *</label>
              <Textarea
                value={newProduct.descriptionEn}
                onChange={(e) => setNewProduct({ ...newProduct, descriptionEn: e.target.value })}
                placeholder="Product description"
                rows={2}
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium">最低價格</label>
                <Input
                  type="number"
                  value={newProduct.priceMin}
                  onChange={(e) => setNewProduct({ ...newProduct, priceMin: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">最高價格</label>
                <Input
                  type="number"
                  value={newProduct.priceMax}
                  onChange={(e) => setNewProduct({ ...newProduct, priceMax: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">佣金比例 %</label>
                <Input
                  type="number"
                  value={newProduct.commissionRate}
                  onChange={(e) => setNewProduct({ ...newProduct, commissionRate: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>
            <Button
              onClick={handleCreateProduct}
              className="w-full bg-amber-600 hover:bg-amber-700"
              disabled={!newProduct.name || !newProduct.nameEn || !newProduct.description}
            >
              確認新增
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Product Cards Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {products.map((product) => {
          const childCount = product.children?.length ?? 0;
          return (
            <Card
              key={product.id}
              className={cn(
                'cursor-pointer transition-all hover:shadow-md border-l-4',
                CATEGORY_ACCENT[product.category] || 'border-l-gray-400',
              )}
              onClick={() => handleCardClick(product)}
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
                  <div className="flex gap-1">
                    <Badge
                      variant="outline"
                      className={cn(
                        'text-[10px]',
                        CATEGORY_COLORS[product.category]
                      )}
                    >
                      {CATEGORY_LABELS[product.category]}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="line-clamp-2 text-xs text-muted-foreground leading-relaxed">
                  {product.description}
                </p>
                {product.status === 'coming_soon' ? (
                  <div className="flex items-center justify-center py-3">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-4 py-1.5 text-sm font-semibold text-amber-700">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      即將推出
                    </span>
                  </div>
                ) : (
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">價格範圍</span>
                      <span className="font-medium">
                        {formatPrice(product.priceMin, product.currency)}
                        {product.priceMin !== product.priceMax && (
                          <> - {formatPrice(product.priceMax, product.currency)}</>
                        )}
                      </span>
                    </div>
                    {/* Commission is displayed in sub-product page */}
                  </div>
                )}
                <div className="flex items-center justify-between">
                  {product.status === 'coming_soon' ? (
                    <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300">
                      即將推出
                    </Badge>
                  ) : (
                    <Badge
                      variant={product.status === 'active' ? 'default' : 'secondary'}
                    >
                      {product.status === 'active' ? '營運中' : '已停用'}
                    </Badge>
                  )}
                  {childCount > 0 ? (
                    <span className="flex items-center gap-1 text-xs font-medium text-amber-600">
                      {childCount} 項子產品
                      <ChevronRight className="h-3.5 w-3.5" />
                    </span>
                  ) : (
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
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
