'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Target,
  Package,
  MessageSquare,
  ChevronRight,
  ChevronDown,
  Copy,
  Check,
  RotateCcw,
  ArrowRight,
  AlertTriangle,
  Shield,
  Lightbulb,
  Building2,
  User,
} from 'lucide-react';
import {
  clientTypes,
  products,
  talkTracksByScenario,
  talkTracksByType,
  objectionHandlers,
  getDifficultyColor,
  getDifficultyDot,
  getClientTypeByCode,
  getProductsForType,
  getTypeColor,
  type ClientTypeCode,
  type Difficulty,
  type ClientType,
} from '@/lib/handbook-data';

// ─── Tab Definitions ───
const tabs = [
  { key: 'identify', label: '識別', icon: Search },
  { key: 'strategy', label: '攻略', icon: Target },
  { key: 'products', label: '產品', icon: Package },
  { key: 'talks', label: '話術', icon: MessageSquare },
] as const;

type TabKey = (typeof tabs)[number]['key'];

// ─── Difficulty Badge ───
function DifficultyBadge({ difficulty }: { difficulty: Difficulty }) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${getDifficultyColor(difficulty)}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${getDifficultyDot(difficulty)}`} />
      {difficulty}級
    </span>
  );
}

// ─── Client Type Badge ───
function ClientTypeBadge({ code }: { code: ClientTypeCode }) {
  const ct = getClientTypeByCode(code);
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${getTypeColor(code)}`}>
      {code} {ct.name}
    </span>
  );
}

// ─── Copy Button ───
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [text]);

  return (
    <button
      onClick={handleCopy}
      className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all min-h-[36px] ${
        copied
          ? 'bg-green-100 text-green-700 border border-green-200'
          : 'bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200 active:scale-95'
      }`}
    >
      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
      {copied ? '已複製' : '複製'}
    </button>
  );
}

// ─── Tab 1: 識別 (Client Type Identifier) ───
function IdentifyTab({ onViewStrategy }: { onViewStrategy: (code: ClientTypeCode) => void }) {
  const [step, setStep] = useState(0);
  const [category, setCategory] = useState<'機構' | '個人' | null>(null);
  const [result, setResult] = useState<ClientType | null>(null);

  const handleCategorySelect = (cat: '機構' | '個人') => {
    setCategory(cat);
    setStep(1);
  };

  const handleSubTypeSelect = (code: ClientTypeCode) => {
    setResult(getClientTypeByCode(code));
    setStep(2);
  };

  const handleReset = () => {
    setStep(0);
    setCategory(null);
    setResult(null);
  };

  const institutionTypes = clientTypes.filter(c => c.category === '機構');
  const individualTypes = clientTypes.filter(c => c.category === '個人');
  const currentTypes = category === '機構' ? institutionTypes : individualTypes;

  return (
    <div className="tab-content-enter px-4 py-4 space-y-4">
      {/* Progress Indicator */}
      <div className="flex items-center gap-2 mb-2">
        {[0, 1, 2].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                step > s
                  ? 'bg-teal-600 text-white'
                  : step === s
                  ? 'bg-teal-100 text-teal-700 border-2 border-teal-500'
                  : 'bg-slate-100 text-slate-400'
              }`}
            >
              {step > s ? '✓' : s + 1}
            </div>
            {s < 2 && (
              <div
                className={`w-8 h-0.5 transition-all ${
                  step > s ? 'bg-teal-500' : 'bg-slate-200'
                }`}
              />
            )}
          </div>
        ))}
        <span className="text-xs text-slate-500 ml-2">
          {step === 0 ? '選擇類別' : step === 1 ? '細分類型' : '查看結果'}
        </span>
      </div>

      <AnimatePresence mode="wait">
        {/* Step 0: Category Selection */}
        {step === 0 && (
          <motion.div
            key="step0"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-teal-100 flex items-center justify-center">
                  <Search className="w-4 h-4 text-teal-600" />
                </div>
                <h3 className="font-semibold text-slate-800">客戶類別識別</h3>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed">
                這位客戶是以<strong>機構/公司</strong>身份，還是以<strong>個人</strong>身份進行諮詢？
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleCategorySelect('機構')}
                className="card-press bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:border-teal-300 hover:shadow-md transition-all text-left"
              >
                <div className="w-12 h-12 rounded-xl bg-teal-100 flex items-center justify-center mb-3">
                  <Building2 className="w-6 h-6 text-teal-600" />
                </div>
                <div className="font-semibold text-slate-800 text-base">機構</div>
                <div className="text-xs text-slate-500 mt-1">公司/實體客戶</div>
                <div className="flex items-center gap-1 mt-3 text-xs text-teal-600 font-medium">
                  A1-A3 <ChevronRight className="w-3 h-3" />
                </div>
              </button>

              <button
                onClick={() => handleCategorySelect('個人')}
                className="card-press bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:border-teal-300 hover:shadow-md transition-all text-left"
              >
                <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center mb-3">
                  <User className="w-6 h-6 text-purple-600" />
                </div>
                <div className="font-semibold text-slate-800 text-base">個人</div>
                <div className="text-xs text-slate-500 mt-1">高淨值個人客戶</div>
                <div className="flex items-center gap-1 mt-3 text-xs text-purple-600 font-medium">
                  B1-B3 <ChevronRight className="w-3 h-3" />
                </div>
              </button>
            </div>
          </motion.div>
        )}

        {/* Step 1: Sub-type Selection */}
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="space-y-3"
          >
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${category === '機構' ? 'bg-teal-100 text-teal-700' : 'bg-purple-100 text-purple-700'}`}>
                  {category}
                </span>
                <span className="text-sm text-slate-500">已選擇</span>
              </div>
              <p className="text-sm text-slate-600">
                {category === '機構'
                  ? '這家公司是準備上市、已經上市，還是跨境經營？'
                  : '這位客戶是財富創造者、繼承者，還是跨境高淨值人士？'}
              </p>
            </div>

            {currentTypes.map((ct) => (
              <button
                key={ct.code}
                onClick={() => handleSubTypeSelect(ct.code)}
                className="card-press w-full bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:border-teal-300 hover:shadow-md transition-all text-left"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm ${
                        ct.code.startsWith('A')
                          ? 'bg-teal-100 text-teal-700'
                          : 'bg-purple-100 text-purple-700'
                      }`}
                    >
                      {ct.code}
                    </div>
                    <div>
                      <div className="font-semibold text-slate-800">{ct.name}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{ct.entryAngle}</div>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400" />
                </div>
              </button>
            ))}

            <button
              onClick={handleReset}
              className="w-full py-3 text-sm text-slate-500 hover:text-slate-700 flex items-center justify-center gap-1"
            >
              <RotateCcw className="w-4 h-4" />
              重新選擇
            </button>
          </motion.div>
        )}

        {/* Step 2: Result */}
        {step === 2 && result && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            <div className="bg-white rounded-xl border-2 border-teal-200 p-5 shadow-md">
              <div className="flex items-center gap-3 mb-4">
                <div
                  className={`w-14 h-14 rounded-xl flex items-center justify-center font-bold text-lg ${
                    result.code.startsWith('A')
                      ? 'bg-teal-100 text-teal-700'
                      : 'bg-purple-100 text-purple-700'
                  }`}
                >
                  {result.code}
                </div>
                <div>
                  <div className="font-bold text-lg text-slate-800">{result.name}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${result.category === '機構' ? 'bg-teal-100 text-teal-700' : 'bg-purple-100 text-purple-700'}`}>
                      {result.category}
                    </span>
                    <DifficultyBadge difficulty={result.difficulty} />
                  </div>
                </div>
              </div>

              {/* Core Needs */}
              <div className="mb-4">
                <h4 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-1">
                  <Lightbulb className="w-4 h-4 text-amber-500" />
                  核心需求
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {result.coreNeeds.map((need) => (
                    <span
                      key={need}
                      className="px-2 py-1 rounded-lg text-xs bg-slate-100 text-slate-700 border border-slate-200"
                    >
                      {need}
                    </span>
                  ))}
                </div>
              </div>

              {/* Entry Angle */}
              <div className="mb-4">
                <h4 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-1">
                  <ArrowRight className="w-4 h-4 text-teal-500" />
                  切入角度
                </h4>
                <p className="text-sm text-slate-600 bg-teal-50 rounded-lg p-3 border border-teal-100">
                  「{result.entryAngle}」
                </p>
              </div>

              {/* Difficulty */}
              <div className="mb-4">
                <h4 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-1">
                  <Shield className="w-4 h-4 text-slate-500" />
                  開拓難度
                </h4>
                <DifficultyBadge difficulty={result.difficulty} />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => onViewStrategy(result.code)}
                className="flex-1 py-3 rounded-xl bg-teal-600 text-white font-semibold text-sm shadow-md hover:bg-teal-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2 min-h-[44px]"
              >
                <Target className="w-4 h-4" />
                查看攻略
              </button>
              <button
                onClick={handleReset}
                className="py-3 px-5 rounded-xl bg-white border border-slate-200 text-slate-600 font-medium text-sm hover:bg-slate-50 active:scale-[0.98] transition-all flex items-center justify-center gap-2 min-h-[44px]"
              >
                <RotateCcw className="w-4 h-4" />
                重測
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Tab 2: 攻略 (Client Strategy Cards) ───
function StrategyTab({ highlightedType }: { highlightedType: ClientTypeCode | null }) {
  const [manuallyExpanded, setManuallyExpanded] = useState<ClientTypeCode | null>(null);
  const expanded = manuallyExpanded ?? highlightedType;

  const toggleExpand = (code: ClientTypeCode) => {
    setManuallyExpanded(manuallyExpanded === code ? null : code);
  };

  return (
    <div className="tab-content-enter px-4 py-4 space-y-3">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-lg font-bold text-slate-800">客戶攻略卡片</h2>
        <span className="text-xs text-slate-500">6 類客戶</span>
      </div>

      <div className="space-y-3">
        {clientTypes.map((ct) => {
          const isExpanded = expanded === ct.code;
          const relatedProducts = getProductsForType(ct.code);

          return (
            <motion.div
              key={ct.code}
              layout
              className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden"
            >
              {/* Card Header - Always visible */}
              <button
                onClick={() => toggleExpand(ct.code)}
                className="w-full p-4 text-left hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-11 h-11 rounded-lg flex items-center justify-center font-bold text-sm ${
                        ct.code.startsWith('A')
                          ? 'bg-teal-100 text-teal-700'
                          : 'bg-purple-100 text-purple-700'
                      }`}
                    >
                      {ct.code}
                    </div>
                    <div>
                      <div className="font-semibold text-slate-800">{ct.name}</div>
                      <div className="text-xs text-slate-500">{ct.category}客戶</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <DifficultyBadge difficulty={ct.difficulty} />
                    <motion.div
                      animate={{ rotate: isExpanded ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ChevronDown className="w-5 h-5 text-slate-400" />
                    </motion.div>
                  </div>
                </div>
              </button>

              {/* Expanded Content */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 space-y-4 border-t border-slate-100 pt-3">
                      {/* Profile */}
                      <div>
                        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                          客戶畫像
                        </h4>
                        <p className="text-sm text-slate-700 leading-relaxed">{ct.profile}</p>
                      </div>

                      {/* Core Needs with Products */}
                      <div>
                        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                          核心需求 × 產品推薦
                        </h4>
                        <div className="bg-slate-50 rounded-lg overflow-hidden border border-slate-100">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="bg-slate-100">
                                <th className="text-left py-2 px-3 text-xs font-medium text-slate-600">需求</th>
                                <th className="text-left py-2 px-3 text-xs font-medium text-slate-600">推薦產品</th>
                                <th className="text-center py-2 px-3 text-xs font-medium text-slate-600">難度</th>
                              </tr>
                            </thead>
                            <tbody>
                              {ct.coreNeeds.map((need) => {
                                const matchingProduct = relatedProducts.find(p => p.name === need || need.includes(p.name) || p.name.includes(need));
                                return (
                                  <tr key={need} className="border-t border-slate-100">
                                    <td className="py-2 px-3 text-slate-700">{need}</td>
                                    <td className="py-2 px-3 text-teal-600 font-medium">
                                      {matchingProduct ? matchingProduct.name : need}
                                    </td>
                                    <td className="py-2 px-3 text-center">
                                      {matchingProduct ? (
                                        <DifficultyBadge difficulty={matchingProduct.difficulty} />
                                      ) : (
                                        <span className="text-xs text-slate-400">—</span>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Entry Angle */}
                      <div>
                        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                          切入角度
                        </h4>
                        <p className="text-sm text-teal-700 font-medium bg-teal-50 rounded-lg p-3 border border-teal-100">
                          「{ct.entryAngle}」
                        </p>
                      </div>

                      {/* Talk Track Example */}
                      <div>
                        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                          開場話術示例
                        </h4>
                        <p className="text-sm text-slate-700 bg-amber-50 rounded-lg p-3 border border-amber-100 leading-relaxed">
                          「{ct.talkTrackExample}」
                        </p>
                      </div>

                      {/* Red Flags */}
                      <div>
                        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                          注意事項
                        </h4>
                        <div className="space-y-1.5">
                          {ct.redFlags.map((flag) => (
                            <div
                              key={flag}
                              className="flex items-start gap-2 text-sm text-slate-600"
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                              {flag}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Tab 3: 產品 (Product Mapping Matrix) ───
function ProductsTab() {
  const [selectedType, setSelectedType] = useState<ClientTypeCode | null>(null);

  const filteredProducts = selectedType
    ? products.filter(p => p.applicableTypes.includes(selectedType))
    : products;

  const allTypeCodes: ClientTypeCode[] = ['A1', 'A2', 'A3', 'B1', 'B2', 'B3'];

  return (
    <div className="tab-content-enter px-4 py-4 space-y-4">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-lg font-bold text-slate-800">產品對照矩陣</h2>
        <span className="text-xs text-slate-500">12 項產品</span>
      </div>

      {/* Client Type Filter Chips */}
      <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm">
        <p className="text-xs text-slate-500 mb-2">按客戶類型篩選：</p>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedType(null)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all min-h-[36px] ${
              selectedType === null
                ? 'bg-teal-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            全部
          </button>
          {allTypeCodes.map((code) => {
            const ct = getClientTypeByCode(code);
            return (
              <button
                key={code}
                onClick={() => setSelectedType(selectedType === code ? null : code)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all min-h-[36px] ${
                  selectedType === code
                    ? code.startsWith('A')
                      ? 'bg-teal-600 text-white shadow-sm'
                      : 'bg-purple-600 text-white shadow-sm'
                    : code.startsWith('A')
                    ? 'bg-teal-50 text-teal-700 hover:bg-teal-100'
                    : 'bg-purple-50 text-purple-700 hover:bg-purple-100'
                }`}
              >
                {code} {ct.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Type Info */}
      {selectedType && (
        <div className="bg-teal-50 rounded-xl p-3 border border-teal-100">
          <div className="flex items-center gap-2">
            <ClientTypeBadge code={selectedType} />
            <span className="text-sm text-teal-700">
              適用 {filteredProducts.length} 項產品
            </span>
          </div>
          <p className="text-xs text-teal-600 mt-1">
            切入角度：「{getClientTypeByCode(selectedType).entryAngle}」
          </p>
        </div>
      )}

      {/* Product List */}
      <div className="space-y-2">
        {filteredProducts.map((product) => (
          <div
            key={product.id}
            className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm"
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-slate-800">{product.name}</h3>
              <DifficultyBadge difficulty={product.difficulty} />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {product.applicableTypes.map((code) => (
                <span
                  key={code}
                  className={`px-2 py-0.5 rounded-full text-xs font-medium border ${
                    selectedType === code
                      ? 'bg-teal-600 text-white border-teal-600'
                      : getTypeColor(code)
                  }`}
                >
                  {code}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Matrix View (compact) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-3 border-b border-slate-100">
          <h3 className="font-semibold text-sm text-slate-700">完整對照表</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50">
                <th className="sticky left-0 bg-slate-50 py-2 px-2 text-left font-medium text-slate-600 min-w-[100px]">
                  產品
                </th>
                {allTypeCodes.map((code) => (
                  <th
                    key={code}
                    className={`py-2 px-2 text-center font-medium min-w-[44px] ${
                      selectedType === code ? 'text-teal-700' : 'text-slate-600'
                    }`}
                  >
                    {code}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id} className="border-t border-slate-100">
                  <td className="sticky left-0 bg-white py-1.5 px-2 text-slate-700 font-medium">
                    {product.name}
                  </td>
                  {allTypeCodes.map((code) => (
                    <td key={code} className="py-1.5 px-2 text-center">
                      {product.applicableTypes.includes(code) ? (
                        <span
                          className={`inline-block w-5 h-5 rounded-full text-white text-[10px] leading-5 ${
                            product.difficulty === '入門'
                              ? 'bg-green-500'
                              : product.difficulty === '進階'
                              ? 'bg-amber-500'
                              : 'bg-red-500'
                          }`}
                        >
                          ✓
                        </span>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-2 border-t border-slate-100 flex items-center gap-3 justify-center">
          <span className="flex items-center gap-1 text-xs text-slate-500">
            <span className="w-3 h-3 rounded-full bg-green-500 inline-block" /> 入門
          </span>
          <span className="flex items-center gap-1 text-xs text-slate-500">
            <span className="w-3 h-3 rounded-full bg-amber-500 inline-block" /> 進階
          </span>
          <span className="flex items-center gap-1 text-xs text-slate-500">
            <span className="w-3 h-3 rounded-full bg-red-500 inline-block" /> 專家
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Tab 4: 話術 (Talk Track Library) ───
function TalksTab() {
  const [activeSection, setActiveSection] = useState<'scenario' | 'type' | 'objection'>('scenario');

  return (
    <div className="tab-content-enter px-4 py-4 space-y-4">
      <h2 className="text-lg font-bold text-slate-800">話術庫</h2>

      {/* Section Tabs */}
      <div className="flex bg-slate-100 rounded-lg p-1">
        {[
          { key: 'scenario' as const, label: '按場景', icon: '🎭' },
          { key: 'type' as const, label: '按客型', icon: '👥' },
          { key: 'objection' as const, label: '異議處理', icon: '🛡️' },
        ].map((section) => (
          <button
            key={section.key}
            onClick={() => setActiveSection(section.key)}
            className={`flex-1 py-2 px-2 rounded-md text-sm font-medium transition-all min-h-[40px] flex items-center justify-center gap-1 ${
              activeSection === section.key
                ? 'bg-white text-slate-800 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <span className="text-sm">{section.icon}</span>
            <span>{section.label}</span>
          </button>
        ))}
      </div>

      {/* By Scenario */}
      {activeSection === 'scenario' && (
        <div className="space-y-3">
          {talkTracksByScenario.map((track) => (
            <div
              key={track.scenario}
              className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{track.icon}</span>
                  <h3 className="font-semibold text-slate-800">{track.label}</h3>
                </div>
                <CopyButton text={track.script} />
              </div>
              <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 rounded-lg p-3 border border-slate-100">
                「{track.script}」
              </p>
            </div>
          ))}
        </div>
      )}

      {/* By Client Type */}
      {activeSection === 'type' && (
        <div className="space-y-3">
          {talkTracksByType.map((track) => (
            <div
              key={track.typeCode}
              className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <ClientTypeBadge code={track.typeCode} />
                  <span className="text-sm text-slate-500">{track.typeName}</span>
                </div>
                <CopyButton text={track.script} />
              </div>
              <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 rounded-lg p-3 border border-slate-100">
                「{track.script}」
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Objection Handler */}
      {activeSection === 'objection' && (
        <div className="space-y-3">
          <div className="bg-amber-50 rounded-xl p-3 border border-amber-100">
            <p className="text-xs text-amber-700 flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" />
              遇到異議不要慌，用專業回應贏得信任
            </p>
          </div>
          {objectionHandlers.map((item, idx) => (
            <div
              key={idx}
              className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden"
            >
              {/* Objection */}
              <div className="p-4 border-b border-slate-100">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-6 h-6 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-xs font-bold">
                    {idx + 1}
                  </span>
                  <span className="text-xs font-medium text-red-600 uppercase tracking-wide">
                    客戶異議
                  </span>
                </div>
                <p className="text-sm font-medium text-slate-800">
                  「{item.objection}」
                </p>
              </div>
              {/* Response */}
              <div className="p-4 bg-green-50/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-green-600 uppercase tracking-wide">
                    建議回應
                  </span>
                  <CopyButton text={item.response} />
                </div>
                <p className="text-sm text-slate-700 leading-relaxed">
                  「{item.response}」
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main App ───
export default function PZCHandbookApp() {
  const [activeTab, setActiveTab] = useState<TabKey>('identify');
  const [highlightedType, setHighlightedType] = useState<ClientTypeCode | null>(null);

  const handleViewStrategy = (code: ClientTypeCode) => {
    setHighlightedType(code);
    setActiveTab('strategy');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafb]">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
        <div className="px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-slate-800">
              <span className="text-teal-600">PZC</span> 客戶開拓手冊
            </h1>
            <p className="text-[10px] text-slate-500 tracking-wider">口袋教練 — 家族辦公室專業認可證書</p>
          </div>
          <div className="w-9 h-9 rounded-lg bg-teal-600 flex items-center justify-center">
            <span className="text-white text-sm font-bold">P</span>
          </div>
        </div>
      </header>

      {/* Content Area */}
      <main className="flex-1 pb-20 overflow-y-auto">
        <AnimatePresence mode="wait">
          {activeTab === 'identify' && (
            <motion.div
              key="identify"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <IdentifyTab onViewStrategy={handleViewStrategy} />
            </motion.div>
          )}
          {activeTab === 'strategy' && (
            <motion.div
              key="strategy"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <StrategyTab highlightedType={highlightedType} />
            </motion.div>
          )}
          {activeTab === 'products' && (
            <motion.div
              key="products"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <ProductsTab />
            </motion.div>
          )}
          {activeTab === 'talks' && (
            <motion.div
              key="talks"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <TalksTab />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 safe-area-bottom shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
        <div className="flex">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => {
                  setActiveTab(tab.key);
                  if (tab.key !== 'strategy') setHighlightedType(null);
                }}
                className={`flex-1 py-2 flex flex-col items-center justify-center gap-0.5 transition-all min-h-[56px] ${
                  isActive
                    ? 'text-teal-600'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <div className="relative">
                  <Icon className={`w-5 h-5 transition-all ${isActive ? 'scale-110' : ''}`} />
                  {isActive && (
                    <motion.div
                      layoutId="navIndicator"
                      className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-teal-600"
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  )}
                </div>
                <span className={`text-[11px] font-medium ${isActive ? 'font-semibold' : ''}`}>
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
