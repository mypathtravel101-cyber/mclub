'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { fetchWithAuth } from '@/lib/api-helpers';
import { cn } from '@/lib/utils';
import { Edit, Plus, Check, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

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
  status: string;
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

function formatPrice(amount: number, currency: string) {
  return new Intl.NumberFormat('zh-HK', {
    style: 'currency',
    currency: currency || 'HKD',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<Product>>({});

  useEffect(() => {
    let cancelled = false;
    fetchWithAuth('/api/products').then((data) => {
      if (!cancelled) setProducts(data);
    });
    return () => { cancelled = true; };
  }, []);

  const refreshProducts = () => {
    fetchWithAuth('/api/products').then(setProducts);
  };

  const startEdit = (product: Product) => {
    setEditingId(product.id);
    setEditData({ ...product });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditData({});
  };

  const saveEdit = async () => {
    if (!editingId) return;
    await fetchWithAuth('/api/products', {
      method: 'PUT',
      body: JSON.stringify(editData),
    });
    cancelEdit();
    refreshProducts();
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
        <Button className="bg-amber-600 hover:bg-amber-700">
          <Plus className="mr-2 h-4 w-4" />
          新增產品
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {products.map((product) => (
          <Card
            key={product.id}
            className={cn(
              'transition-all hover:shadow-md',
              editingId === product.id && 'ring-2 ring-amber-500'
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
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() =>
                      editingId === product.id ? cancelEdit() : startEdit(product)
                    }
                  >
                    {editingId === product.id ? (
                      <X className="h-3.5 w-3.5" />
                    ) : (
                      <Edit className="h-3.5 w-3.5" />
                    )}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {editingId === product.id ? (
                <div className="space-y-2">
                  <Input
                    value={editData.commissionRate || 0}
                    type="number"
                    onChange={(e) =>
                      setEditData({
                        ...editData,
                        commissionRate: parseFloat(e.target.value),
                      })
                    }
                    className="h-8 text-sm"
                    placeholder="佣金比例 %"
                  />
                  <Input
                    value={editData.priceMin || 0}
                    type="number"
                    onChange={(e) =>
                      setEditData({
                        ...editData,
                        priceMin: parseFloat(e.target.value),
                      })
                    }
                    className="h-8 text-sm"
                    placeholder="最低價格"
                  />
                  <Input
                    value={editData.priceMax || 0}
                    type="number"
                    onChange={(e) =>
                      setEditData({
                        ...editData,
                        priceMax: parseFloat(e.target.value),
                      })
                    }
                    className="h-8 text-sm"
                    placeholder="最高價格"
                  />
                  <div className="flex gap-1">
                    <Button size="sm" className="h-7 flex-1 bg-amber-600 hover:bg-amber-700" onClick={saveEdit}>
                      <Check className="mr-1 h-3 w-3" />
                      保存
                    </Button>
                    <Button size="sm" variant="outline" className="h-7 flex-1" onClick={cancelEdit}>
                      取消
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="line-clamp-2 text-xs text-muted-foreground leading-relaxed">
                    {product.description}
                  </p>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">價格範圍</span>
                      <span className="font-medium">
                        {formatPrice(product.priceMin, product.currency)} -{' '}
                        {formatPrice(product.priceMax, product.currency)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">佣金比例</span>
                      <span className="font-medium text-amber-600">
                        {product.commissionRate}%
                      </span>
                    </div>
                  </div>
                  <Badge
                    variant={product.status === 'active' ? 'default' : 'secondary'}
                    className="w-full justify-center"
                  >
                    {product.status === 'active' ? '營運中' : '已停用'}
                  </Badge>
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
