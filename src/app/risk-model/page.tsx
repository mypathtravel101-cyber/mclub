'use client';

import { useState, useSyncExternalStore, useEffect } from 'react';
import { InputWizard, type RiskModelFormInput } from '@/components/risk-model/InputWizard';
import { ResultsDashboard } from '@/components/risk-model/ResultsDashboard';
import { PropertySelector, type Property } from '@/components/risk-model/PropertySelector';
import { runRiskModel, type RiskModelOutput } from '@/lib/risk-model';
import { Shield, Loader2, Home, Lock, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type AppView = 'password' | 'landing' | 'property-select' | 'input' | 'loading' | 'results';

const CORRECT_PASSWORD = 'admin123';
const SESSION_KEY = 'risk_model_auth';

// Hydration-safe hook: returns false on server, true on client after mount
const emptySubscribe = () => () => {};
function useHydrated() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}

export default function RiskModelApp() {
  const mounted = useHydrated();
  const [view, setView] = useState<AppView>('password');
  const [result, setResult] = useState<RiskModelOutput | null>(null);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  // Restore session on mount
  useEffect(() => {
    if (sessionStorage.getItem(SESSION_KEY) === '1') {
      setView('landing');
    }
  }, []);

  const handlePasswordSubmit = () => {
    if (password === CORRECT_PASSWORD) {
      sessionStorage.setItem(SESSION_KEY, '1');
      setPasswordError('');
      setView('landing');
    } else {
      setPasswordError('密碼錯誤，請重試');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handlePasswordSubmit();
  };
  const [input, setInput] = useState<RiskModelFormInput>({
    principalHKD: 3200000,
    entryFX: 19.5,
    ltv: 40,
    mortgageRate: 3,
    mortgageTermYears: 35,
    rentalYield: 6,
    holdingCostRate: 0.3,
    transactionCostRate: 0.3,
    purchaseCostRate: 0.3,
    holdingPeriod: 10,
  });

  const handlePropertySelect = (property: Property) => {
    setSelectedProperty(property);

    // Auto-fill from property data
    const priceJPY = property.priceWan * 10000;
    const entryFX = input.entryFX || 19.5;
    const principalHKD = Math.round(priceJPY * (1 - input.ltv / 100) / entryFX);

    setInput({
      ...input,
      principalHKD,
      rentalYield: property.rentalYield || input.rentalYield,
    });
    setView('input');
  };

  const handleManualInput = () => {
    setSelectedProperty(null);
    setView('input');
  };

  const handleCalculate = async () => {
    setView('loading');

    await new Promise((resolve) => setTimeout(resolve, 800));

    const modelResult = runRiskModel({
      ...input,
      propertyPriceJPY: 0,
    });

    setResult(modelResult);
    setView('results');
  };

  const handleBackToProperties = () => {
    setView('property-select');
    setResult(null);
  };

  const handleBackToInput = () => {
    setView('input');
    setResult(null);
  };

  // Password gate
  if (view === 'password') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white flex flex-col items-center justify-center px-6">
        <div className="w-20 h-20 rounded-2xl bg-amber-100 flex items-center justify-center mb-6">
          <Lock className="h-10 w-10 text-amber-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">日本物業風險評估</h1>
        <p className="text-sm text-muted-foreground text-center mb-8">請輸入密碼以繼續</p>
        <div className="w-full max-w-sm space-y-4">
          <div className="relative">
            <Input
              type={showPassword ? 'text' : 'password'}
              placeholder="輸入密碼"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setPasswordError(''); }}
              onKeyDown={handleKeyDown}
              className="h-12 text-base pr-10"
              autoFocus
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {passwordError && (
            <p className="text-sm text-red-500 text-center">{passwordError}</p>
          )}
          <Button
            className="w-full h-12 bg-amber-600 hover:bg-amber-700 text-base font-bold"
            onClick={handlePasswordSubmit}
            disabled={!password}
          >
            <Lock className="h-4 w-4 mr-2" />
            進入系統
          </Button>
        </div>
      </div>
    );
  }

  if (view === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white flex flex-col items-center justify-center px-6">
        <div className="relative">
          <div className="w-24 h-24 rounded-full border-4 border-amber-200 border-t-amber-600 animate-spin" />
          <Shield className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-8 w-8 text-amber-600" />
        </div>
        <p className="mt-6 text-lg font-semibold text-gray-700">正在計算風險分析...</p>
        <p className="mt-2 text-sm text-muted-foreground">84 情景壓力測試 + ML 機率加權</p>
        <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="h-3 w-3 animate-spin" />
          <span>三層分析進行中</span>
        </div>
      </div>
    );
  }

  if (view === 'results' && result) {
    return <ResultsDashboard result={result} onBack={handleBackToInput} />;
  }

  if (view === 'property-select') {
    return (
      <PropertySelector
        onSelect={handlePropertySelect}
        onBack={() => setView('landing')}
      />
    );
  }

  if (view === 'input') {
    return (
      <InputWizard
        input={input}
        setInput={setInput}
        onCalculate={handleCalculate}
        selectedProperty={selectedProperty}
        onChangeProperty={handleBackToProperties}
      />
    );
  }

  // Show loading screen until React hydrates on the client
  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white flex flex-col items-center justify-center px-6">
        <div className="relative">
          <div className="w-16 h-16 rounded-full border-4 border-amber-200 border-t-amber-600 animate-spin" />
          <Shield className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-6 w-6 text-amber-600" />
        </div>
        <p className="mt-4 text-sm text-muted-foreground">載入中...</p>
      </div>
    );
  }

  // Default: Landing page
  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-lg border-b border-amber-100 px-4 py-3">
        <div className="flex items-center gap-2">
          <Shield className="h-6 w-6 text-amber-600" />
          <span className="font-bold text-lg">iBanker</span>
          <span className="text-xs text-muted-foreground bg-amber-100 px-2 py-0.5 rounded-full">Risk Model</span>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-8">
        <div className="w-20 h-20 rounded-2xl bg-amber-100 flex items-center justify-center mb-6">
          <Home className="h-10 w-10 text-amber-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">日本物業風險評估</h1>
        <p className="text-sm text-muted-foreground text-center mb-8 leading-relaxed">
          84 情景壓力測試 + ML V2 機率加權<br />
          即時計算投資回報與風險
        </p>

        {/* Main action: Select property */}
        <Button
          className="w-full max-w-sm h-14 bg-amber-600 hover:bg-amber-700 text-base font-bold mb-3"
          onClick={() => setView('property-select')}
        >
          <Home className="h-5 w-5 mr-2" />
          選擇物件
        </Button>

        {/* Alternative: Manual input */}
        <Button
          variant="outline"
          className="w-full max-w-sm h-12 text-sm"
          onClick={handleManualInput}
        >
          手動輸入參數
        </Button>

        <p className="text-xs text-muted-foreground mt-4 text-center">
          選擇物件將自動填入價格及回報率
        </p>
      </div>
    </div>
  );
}
