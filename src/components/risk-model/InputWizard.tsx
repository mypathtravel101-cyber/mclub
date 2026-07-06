'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronRight, ChevronLeft, JapaneseYen, TrendingUp, Shield, Calculator, Home } from 'lucide-react';
import { cn } from '@/lib/utils';
import { type Property } from '@/components/risk-model/PropertySelector';

export interface RiskModelFormInput {
  principalHKD: number;
  entryFX: number;
  ltv: number;
  mortgageRate: number;
  mortgageTermYears: number;
  rentalYield: number;
  holdingCostRate: number;
  transactionCostRate: number;
  purchaseCostRate: number;
  holdingPeriod: number;
}

interface InputWizardProps {
  input: RiskModelFormInput;
  setInput: (input: RiskModelFormInput) => void;
  onCalculate: () => void;
  selectedProperty?: Property | null;
  onChangeProperty?: () => void;
}

const STEPS = [
  { title: '物業基本資料', icon: JapaneseYen, subtitle: 'Property Basics' },
  { title: '財務條件', icon: Calculator, subtitle: 'Financial Terms' },
  { title: '持有參數', icon: TrendingUp, subtitle: 'Holding Parameters' },
  { title: '確認計算', icon: Shield, subtitle: 'Confirm & Run' },
];

export function InputWizard({ input, setInput, onCalculate, selectedProperty, onChangeProperty }: InputWizardProps) {
  const [step, setStep] = useState(0);

  const updateField = (field: keyof RiskModelFormInput, value: number) => {
    const updated = { ...input, [field]: value };
    // Keep principalHKD in sync with equityJPY / entryFX
    if (field === 'entryFX') {
      updated.principalHKD = Math.round((input.principalHKD * input.entryFX) / value);
    }
    setInput(updated);
  };

  const equityJPY = input.principalHKD * input.entryFX;
  const propertyJPY = equityJPY / (1 - input.ltv / 100); // With LTV leverage

  const canProceed = () => {
    switch (step) {
      case 0: return input.principalHKD > 0 && input.entryFX > 0;
      case 1: return input.ltv >= 0 && input.mortgageRate >= 0 && input.rentalYield >= 0;
      case 2: return input.holdingPeriod > 0;
      case 3: return true;
      default: return false;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-lg border-b border-amber-100 px-4 py-3">
        <div className="flex items-center gap-2">
          <Shield className="h-6 w-6 text-amber-600" />
          <span className="font-bold text-lg">iBanker</span>
          <span className="text-xs text-muted-foreground bg-amber-100 px-2 py-0.5 rounded-full">Risk Model</span>
        </div>
        {/* Selected property banner */}
        {selectedProperty && (
          <div
            className="mt-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 flex items-center gap-2 cursor-pointer active:bg-amber-100"
            onClick={onChangeProperty}
          >
            <Home className="h-4 w-4 text-amber-600 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-amber-800 truncate">{selectedProperty.name}</p>
              <p className="text-[10px] text-amber-600">¥{selectedProperty.priceWan}萬 · {selectedProperty.city} · 點擊更換</p>
            </div>
          </div>
        )}
      </div>

      {/* Progress Bar */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-center justify-between mb-2">
          {STEPS.map((s, i) => (
            <div key={i} className="flex items-center gap-1">
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all',
                  i < step ? 'bg-amber-600 text-white' :
                  i === step ? 'bg-amber-500 text-white ring-4 ring-amber-200' :
                  'bg-gray-200 text-gray-500'
                )}
              >
                {i < step ? '✓' : i + 1}
              </div>
              {i < STEPS.length - 1 && (
                <div className={cn('w-6 h-0.5 mx-1', i < step ? 'bg-amber-600' : 'bg-gray-200')} />
              )}
            </div>
          ))}
        </div>
        <p className="text-sm text-muted-foreground">
          步驟 {step + 1}/4 — {STEPS[step].title}
        </p>
      </div>

      {/* Step Content */}
      <div className="flex-1 px-4 py-4">
        {step === 0 && (
          <div className="space-y-5 animate-in slide-in-from-right-5 duration-300">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <JapaneseYen className="h-5 w-5 text-amber-600" />
                  物業基本資料
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Property Value in JPY */}
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">物業價值</p>
                  <p className="text-2xl font-bold text-gray-900">
                    ¥{Math.round(equityJPY).toLocaleString()}
                  </p>
                </div>

                {/* FX Rate */}
                <div className="space-y-2">
                  <Label htmlFor="entryFX">入場匯率</Label>
                  <Input
                    id="entryFX"
                    type="number"
                    step="0.1"
                    value={input.entryFX || ''}
                    onChange={(e) => updateField('entryFX', Number(e.target.value))}
                    placeholder="19.5"
                    className="text-lg font-semibold"
                  />
                  <p className="text-xs text-muted-foreground">1 HKD = {input.entryFX} JPY</p>
                </div>

                {/* Property Value in HKD */}
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">投入本金</p>
                  <p className="text-2xl font-bold text-amber-900">
                    HKD {Math.round(equityJPY / input.entryFX).toLocaleString()}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-5 animate-in slide-in-from-right-5 duration-300">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Calculator className="h-5 w-5 text-amber-600" />
                  財務條件
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>按揭成數 (LTV %)</Label>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min={0}
                      max={80}
                      step={5}
                      value={input.ltv}
                      onChange={(e) => updateField('ltv', Number(e.target.value))}
                      className="flex-1 accent-amber-600"
                    />
                    <span className="text-lg font-bold w-12 text-right">{input.ltv}%</span>
                  </div>
                  <p className="text-xs text-muted-foreground">日本物業外國人最高約 50-70%</p>
                </div>

                <div className="space-y-2">
                  <Label>按揭利率 (%/年)</Label>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min={0}
                      max={8}
                      step={0.1}
                      value={input.mortgageRate}
                      onChange={(e) => updateField('mortgageRate', Number(e.target.value))}
                      className="flex-1 accent-amber-600"
                    />
                    <span className="text-lg font-bold w-12 text-right">{input.mortgageRate}%</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>年租金回報率 (%)</Label>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min={0}
                      max={10}
                      step={0.5}
                      value={input.rentalYield}
                      onChange={(e) => updateField('rentalYield', Number(e.target.value))}
                      className="flex-1 accent-amber-600"
                    />
                    <span className="text-lg font-bold w-12 text-right">{input.rentalYield}%</span>
                  </div>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-1">
                  <p className="text-sm text-amber-700 font-medium">貸款概覽</p>
                  <p className="text-xs text-amber-800">物業總值：¥{Math.round(propertyJPY).toLocaleString()}</p>
                  <p className="text-xs text-amber-800">貸款金額：¥{Math.round(propertyJPY * input.ltv / 100).toLocaleString()} ({input.ltv}%)</p>
                  <p className="text-xs text-amber-800">自付金額：¥{Math.round(propertyJPY * (100 - input.ltv) / 100).toLocaleString()} ({100 - input.ltv}%)</p>
                  <p className="text-xs text-amber-800">年租金收入：¥{Math.round(propertyJPY * input.rentalYield / 100).toLocaleString()}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5 animate-in slide-in-from-right-5 duration-300">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <TrendingUp className="h-5 w-5 text-amber-600" />
                  持有參數
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>持有年期</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {[5, 7, 10].map((yr) => (
                      <Button
                        key={yr}
                        variant={input.holdingPeriod === yr ? 'default' : 'outline'}
                        className={cn(
                          'h-14 text-lg font-bold',
                          input.holdingPeriod === yr && 'bg-amber-600 hover:bg-amber-700'
                        )}
                        onClick={() => updateField('holdingPeriod', yr)}
                      >
                        {yr} 年
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>每年持有成本率 (%)</Label>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min={0}
                      max={3}
                      step={0.1}
                      value={input.holdingCostRate}
                      onChange={(e) => updateField('holdingCostRate', Number(e.target.value))}
                      className="flex-1 accent-amber-600"
                    />
                    <span className="text-lg font-bold w-12 text-right">{input.holdingCostRate}%</span>
                  </div>
                  <p className="text-xs text-muted-foreground">管理費、修繕費等（預設 0.3%）</p>
                </div>

                <div className="space-y-2">
                  <Label>每年稅務成本 (%)</Label>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min={0}
                      max={3}
                      step={0.1}
                      value={input.transactionCostRate}
                      onChange={(e) => updateField('transactionCostRate', Number(e.target.value))}
                      className="flex-1 accent-amber-600"
                    />
                    <span className="text-lg font-bold w-12 text-right">{input.transactionCostRate}%</span>
                  </div>
                  <p className="text-xs text-muted-foreground">固定資產稅、都市計劃稅等（預設 0.3%）</p>
                </div>

                <div className="space-y-2">
                  <Label>買入成本 (%)</Label>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min={0}
                      max={5}
                      step={0.1}
                      value={input.purchaseCostRate}
                      onChange={(e) => updateField('purchaseCostRate', Number(e.target.value))}
                      className="flex-1 accent-amber-600"
                    />
                    <span className="text-lg font-bold w-12 text-right">{input.purchaseCostRate}%</span>
                  </div>
                  <p className="text-xs text-muted-foreground">一次性買入成本（預設 0.3%）</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-5 animate-in slide-in-from-right-5 duration-300">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Shield className="h-5 w-5 text-amber-600" />
                  確認投資參數
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                  <p className="text-sm font-semibold text-gray-700">物業基本</p>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">物業價值</span>
                    <span className="font-medium">¥{Math.round(propertyJPY).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">入場匯率</span>
                    <span className="font-medium">1 HKD = {input.entryFX} JPY</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">投入本金</span>
                    <span className="font-medium">HKD {Math.round(equityJPY / input.entryFX).toLocaleString()}</span>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                  <p className="text-sm font-semibold text-gray-700">財務條件</p>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">按揭成數</span>
                    <span className="font-medium">{input.ltv}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">按揭利率</span>
                    <span className="font-medium">{input.mortgageRate}%/年</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">租金回報</span>
                    <span className="font-medium">{input.rentalYield}%/年</span>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                  <p className="text-sm font-semibold text-gray-700">持有參數</p>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">持有年期</span>
                    <span className="font-medium">{input.holdingPeriod} 年</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">持有成本</span>
                    <span className="font-medium">{input.holdingCostRate}%/年</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">稅務成本</span>
                    <span className="font-medium">{input.transactionCostRate}%/年</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">買入成本</span>
                    <span className="font-medium">{input.purchaseCostRate}%（一次性）</span>
                  </div>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <p className="text-sm text-amber-700 font-medium mb-2">將進行三層分析：</p>
                  <div className="space-y-1">
                    <p className="text-xs text-amber-800">🔵 歷史數據驗證 — 104 季度樣本</p>
                    <p className="text-xs text-amber-800">🟠 84 情景壓力測試 — 7×4×3 極端組合</p>
                    <p className="text-xs text-amber-800">🟣 ML 機率加權 — 4 模型集成 + Monte Carlo</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="sticky bottom-0 bg-white border-t border-gray-200 px-4 py-3 flex items-center gap-3 safe-area-bottom">
        {step > 0 && (
          <Button
            variant="outline"
            className="flex-1 h-12"
            onClick={() => setStep(step - 1)}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            上一步
          </Button>
        )}
        {step < 3 ? (
          <Button
            className="flex-1 h-12 bg-amber-600 hover:bg-amber-700"
            disabled={!canProceed()}
            onClick={() => setStep(step + 1)}
          >
            下一步
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        ) : (
          <Button
            className="flex-1 h-12 bg-amber-600 hover:bg-amber-700 text-base font-bold"
            onClick={onCalculate}
          >
            <Shield className="h-5 w-5 mr-2" />
            開始風險分析
          </Button>
        )}
      </div>
    </div>
  );
}
