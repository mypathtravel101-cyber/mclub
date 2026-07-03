'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, MapPin, Building2, ArrowLeft, JapaneseYen, Home, ChevronRight, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import properties from '@/lib/properties.json';

export interface Property {
  id: string;
  name: string;
  address: string;
  city: string;
  type: string;
  status: string;
  landArea: string | null;
  buildingArea: string | null;
  floors: string | null;
  rooms?: string | null;
  priceWan: number;
  rentalYield: number | null;
  availability: string;
}

const CITY_ICONS: Record<string, string> = {
  '大阪': '🏯',
  '東京': '🗼',
  '福岡': '🌸',
  '長野/北海道': '⛷️',
};

const CITY_FILTERS = ['全部', '大阪', '東京', '福岡', '長野/北海道'];

interface PropertySelectorProps {
  onSelect: (property: Property) => void;
  onBack: () => void;
}

export function PropertySelector({ onSelect, onBack }: PropertySelectorProps) {
  const [search, setSearch] = useState('');
  const [cityFilter, setCityFilter] = useState('全部');
  const [sortBy, setSortBy] = useState<'city' | 'price-asc' | 'price-desc'>('city');

  const filtered = useMemo(() => {
    let list = properties as Property[];

    // City filter
    if (cityFilter !== '全部') {
      list = list.filter((p) => p.city === cityFilter);
    }

    // Search
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.address.toLowerCase().includes(q) ||
          p.city.includes(q) ||
          p.type.includes(q)
      );
    }

    // Sort
    if (sortBy === 'price-asc') {
      list = [...list].sort((a, b) => a.priceWan - b.priceWan);
    } else if (sortBy === 'price-desc') {
      list = [...list].sort((a, b) => b.priceWan - a.priceWan);
    } else {
      list = [...list].sort((a, b) => a.city.localeCompare(b.city));
    }

    return list;
  }, [search, cityFilter, sortBy]);

  const formatPrice = (wan: number) => {
    if (wan >= 10000) {
      return `${(wan / 10000).toFixed(1)}億`;
    }
    return `${wan}萬`;
  };

  // Group by city for display
  const grouped = useMemo(() => {
    const groups: Record<string, Property[]> = {};
    for (const p of filtered) {
      if (!groups[p.city]) groups[p.city] = [];
      groups[p.city].push(p);
    }
    return groups;
  }, [filtered]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-lg border-b border-amber-100">
        <div className="px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-base">選擇物件</p>
            <p className="text-xs text-muted-foreground">共 {filtered.length} 個物件</p>
          </div>
          <Shield className="h-5 w-5 text-amber-600" />
        </div>

        {/* Search */}
        <div className="px-4 pb-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="搜尋物件名稱、地址..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-10 bg-white"
            />
          </div>
        </div>

        {/* City filters */}
        <div className="px-4 pb-2 flex gap-2 overflow-x-auto no-scrollbar">
          {CITY_FILTERS.map((city) => (
            <Button
              key={city}
              variant={cityFilter === city ? 'default' : 'outline'}
              size="sm"
              className={cn(
                'shrink-0 text-xs h-8',
                cityFilter === city && 'bg-amber-600 hover:bg-amber-700'
              )}
              onClick={() => setCityFilter(city)}
            >
              {city === '全部' ? '🏢' : CITY_ICONS[city]} {city}
            </Button>
          ))}
        </div>

        {/* Sort */}
        <div className="px-4 pb-2 flex gap-2">
          <Button
            variant={sortBy === 'city' ? 'secondary' : 'ghost'}
            size="sm"
            className="text-xs h-7"
            onClick={() => setSortBy('city')}
          >
            按地區
          </Button>
          <Button
            variant={sortBy === 'price-asc' ? 'secondary' : 'ghost'}
            size="sm"
            className="text-xs h-7"
            onClick={() => setSortBy('price-asc')}
          >
            價格 ↑
          </Button>
          <Button
            variant={sortBy === 'price-desc' ? 'secondary' : 'ghost'}
            size="sm"
            className="text-xs h-7"
            onClick={() => setSortBy('price-desc')}
          >
            價格 ↓
          </Button>
        </div>
      </div>

      {/* Property List */}
      <div className="flex-1 px-4 py-2 pb-6">
        {filtered.length === 0 ? (
          <div className="text-center py-12">
            <Home className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">沒有找到匹配的物件</p>
          </div>
        ) : sortBy === 'city' ? (
          // Grouped by city
          Object.entries(grouped).map(([city, props]) => (
            <div key={city} className="mb-4">
              <div className="flex items-center gap-2 mb-2 px-1">
                <span className="text-base">{CITY_ICONS[city] || '🏠'}</span>
                <span className="text-sm font-semibold text-gray-700">{city}</span>
                <span className="text-xs text-muted-foreground">({props.length})</span>
              </div>
              <div className="space-y-2">
                {props.map((p) => (
                  <PropertyCard key={p.id} property={p} onSelect={onSelect} formatPrice={formatPrice} />
                ))}
              </div>
            </div>
          ))
        ) : (
          // Flat list sorted by price
          <div className="space-y-2">
            {filtered.map((p) => (
              <PropertyCard key={p.id} property={p} onSelect={onSelect} formatPrice={formatPrice} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function PropertyCard({
  property,
  onSelect,
  formatPrice,
}: {
  property: Property;
  onSelect: (p: Property) => void;
  formatPrice: (wan: number) => string;
}) {
  const isSold = property.availability?.includes('已售');
  const hasPrice = property.priceWan != null && property.priceWan > 0;
  const isUnderConstruction = property.status === '施工中' || property.status === '未' || property.availability === '在建' || property.availability === '待建';
  const isAvailable = !isSold && hasPrice;

  return (
    <Card
      className={cn(
        'transition-all active:scale-[0.98]',
        isAvailable ? 'cursor-pointer hover:border-amber-300 hover:shadow-md' : 'opacity-70 cursor-not-allowed'
      )}
      onClick={() => isAvailable && onSelect(property)}
    >
      <CardContent className="p-3">
        <div className="flex items-start gap-3">
          <div className={cn(
            'w-10 h-10 rounded-lg flex items-center justify-center shrink-0',
            isSold ? 'bg-gray-100' : isUnderConstruction ? 'bg-blue-100' : 'bg-amber-100'
          )}>
            <Building2 className={cn(
              'h-5 w-5',
              isSold ? 'text-gray-400' : isUnderConstruction ? 'text-blue-500' : 'text-amber-700'
            )} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-semibold text-sm truncate">{property.name}</p>
              {isSold && (
                <Badge variant="secondary" className="text-[10px] h-4 px-1 bg-red-100 text-red-600">已售</Badge>
              )}
              {isUnderConstruction && !isSold && (
                <Badge variant="secondary" className="text-[10px] h-4 px-1 bg-blue-100 text-blue-600">施工中</Badge>
              )}
              {!hasPrice && !isSold && !isUnderConstruction && (
                <Badge variant="secondary" className="text-[10px] h-4 px-1 bg-yellow-100 text-yellow-700">價格待定</Badge>
              )}
              {property.status && !isUnderConstruction && property.status !== '现房' && property.status !== '期房' && (
                <Badge variant="outline" className="text-[10px] h-4 px-1">
                  {property.status}
                </Badge>
              )}
            </div>
            {property.address && (
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5 truncate">
                <MapPin className="h-3 w-3 shrink-0" />
                {property.address}
              </p>
            )}
            <div className="flex items-center gap-3 mt-1.5">
              {hasPrice ? (
                <span className="text-xs flex items-center gap-1">
                  <JapaneseYen className="h-3 w-3 text-amber-600" />
                  <span className="font-bold text-amber-700">¥{formatPrice(property.priceWan)}</span>
                </span>
              ) : (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <JapaneseYen className="h-3 w-3" />
                  <span>價格待定</span>
                </span>
              )}
              {property.rentalYield && (
                <span className="text-xs text-green-600 font-medium">
                  回報 {property.rentalYield}%
                </span>
              )}
              {property.buildingArea && (
                <span className="text-xs text-muted-foreground">
                  {property.buildingArea}㎡
                </span>
              )}
            </div>
          </div>
          {isAvailable && <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />}
        </div>
      </CardContent>
    </Card>
  );
}
