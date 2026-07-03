'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { fetchWithAuth } from '@/lib/api-helpers';
import { ArrowLeft, Edit, Check, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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

function formatHKD(amount: number, currency: string) {
  return new Intl.NumberFormat('zh-HK', {
    style: 'currency',
    currency: currency || 'HKD',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function ProductDetailPage() {
  const { selectedProductId, setCurrentPage, user } = useAppStore();
  const isAdmin = user?.role === 'admin';
  const [product, setProduct] = useState<Product | null>(null);
  const [subProducts, setSubProducts] = useState<Product[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<Product>>({});

  useEffect(() => {
    if (!selectedProductId) return;
    let cancelled = false;

    // Fetch parent product
    fetchWithAuth(`/api/products?limit=100`).then((res) => {
      if (cancelled) return;
      const data = res.data !== undefined ? res.data : res;
      const allProducts = Array.isArray(data) ? data : [];
      const parent = allProducts.find((p: Product) => p.id === selectedProductId);
      if (parent) {
        setProduct(parent);
        // Use children from include if available, otherwise fetch
        if (parent.children && parent.children.length > 0) {
          setSubProducts(parent.children);
        } else {
          // Fetch children via API
          fetchWithAuth(`/api/products?limit=100&parentId=${parent.id}`).then((res2) => {
            if (cancelled) return;
            const data2 = res2.data !== undefined ? res2.data : res2;
            setSubProducts(Array.isArray(data2) ? data2 : []);
          });
        }
      }
    });

    return () => { cancelled = true; };
  }, [selectedProductId]);

  const refreshSubProducts = () => {
    if (!product) return;
    fetchWithAuth(`/api/products?limit=100`).then((res) => {
      const data = res.data !== undefined ? res.data : res;
      const allProducts = Array.isArray(data) ? data : [];
      const parent = allProducts.find((p: Product) => p.id === product.id);
      if (parent?.children) {
        setSubProducts(parent.children);
      }
    });
  };

  const startEdit = (subProduct: Product) => {
    setEditingId(subProduct.id);
    setEditData({ ...subProduct });
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
    refreshSubProducts();
  };

  if (!product) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-200 border-t-amber-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with back button */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentPage('products')}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          返回產品管理
        </Button>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <span className="text-3xl">{product.emoji}</span>
            {product.name}
          </h1>
          <p className="text-muted-foreground">{product.nameEn}</p>
        </div>
      </div>

      {/* Parent product info card */}
      <Card className="border-l-4 border-l-amber-500">
        <CardContent className="py-5">
          <p className="text-sm text-muted-foreground leading-relaxed">{product.description}</p>
          <div className="flex items-center gap-4 mt-3 text-sm">
            <Badge variant="outline" className="bg-green-100 text-green-800">
              {CATEGORY_LABELS[product.category]}
            </Badge>
            <span>價格：{formatHKD(product.priceMin, product.currency)}
              {product.priceMin !== product.priceMax && <> - {formatHKD(product.priceMax, product.currency)}</>}
            </span>
            {product.commissionFixed > 0 ? (
              <span className="text-green-600 font-medium">固定佣金 {formatHKD(product.commissionFixed, product.currency)}</span>
            ) : product.commissionRate > 0 ? (
              <span className="text-amber-600 font-medium">佣金 {product.commissionRate}%</span>
            ) : product.commissionNegotiable ? (
              <span className="text-muted-foreground font-medium">Director 佣金另議</span>
            ) : null}
          </div>
        </CardContent>
      </Card>

      {/* Sub-products section */}
      <div>
        <h2 className="text-lg font-semibold mb-3">
          子產品列表
          <span className="ml-2 text-sm font-normal text-muted-foreground">
            ({subProducts.length} 項)
          </span>
        </h2>

        {subProducts.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              此產品暫無子產品
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {subProducts.map((subProduct) => (
              <Card
                key={subProduct.id}
                className="transition-all hover:shadow-md border-l-4 border-l-green-400"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{subProduct.emoji}</span>
                      <div>
                        <CardTitle className="text-base leading-tight">
                          {subProduct.name}
                        </CardTitle>
                        <p className="text-xs text-muted-foreground mt-1">
                          {subProduct.nameEn}
                        </p>
                      </div>
                    </div>
                    {isAdmin && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() =>
                          editingId === subProduct.id ? cancelEdit() : startEdit(subProduct)
                        }
                      >
                        {editingId === subProduct.id ? (
                          <X className="h-3.5 w-3.5" />
                        ) : (
                          <Edit className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {editingId === subProduct.id ? (
                    <div className="space-y-2">
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">價格 (HKD)</label>
                        <Input
                          value={editData.priceMin || 0}
                          type="number"
                          onChange={(e) =>
                            setEditData({
                              ...editData,
                              priceMin: parseFloat(e.target.value),
                              priceMax: parseFloat(e.target.value),
                            })
                          }
                          className="h-8 text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">固定佣金 (HKD)</label>
                        <Input
                          value={editData.commissionFixed || 0}
                          type="number"
                          onChange={(e) =>
                            setEditData({
                              ...editData,
                              commissionFixed: parseFloat(e.target.value),
                            })
                          }
                          className="h-8 text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">描述</label>
                        <Textarea
                          value={editData.description || ''}
                          onChange={(e) =>
                            setEditData({ ...editData, description: e.target.value })
                          }
                          className="text-sm"
                          rows={2}
                        />
                      </div>
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
                        {subProduct.description}
                      </p>
                      <div className="space-y-1.5 text-xs">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">價格</span>
                          <span className="font-semibold text-sm">
                            {formatHKD(subProduct.priceMin, subProduct.currency)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">固定佣金</span>
                          <span className="font-semibold text-sm text-green-600">
                            {subProduct.commissionFixed ? formatHKD(subProduct.commissionFixed, subProduct.currency) : '—'}
                          </span>
                        </div>
                      </div>
                      <Badge
                        variant={subProduct.status === 'active' ? 'default' : 'secondary'}
                        className="w-full justify-center"
                      >
                        {subProduct.status === 'active' ? '營運中' : '已停用'}
                      </Badge>
                    </>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
