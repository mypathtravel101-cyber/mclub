'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Target,
  Package,
  MessageSquare,
  ShieldAlert,
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
  Zap,
  Link2,
  BookOpen,
  Star,
  TrendingUp,
} from 'lucide-react';
import {
  clientTypes,
  products,
  talkTracksByScenario,
  talkTracksByType,
  objectionHandlers,
  objectionPrinciples,
  redFlags,
  getDifficultyColor,
  getDifficultyDot,
  getDifficultyBg,
  getClientTypeByCode,
  getProductsForType,
  getTypeColor,
  getTypeSolidBg,
  getDualNeeds,
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
  { key: 'alerts', label: '紅旗', icon: ShieldAlert },
] as const;

type TabKey = (typeof tabs)[number]['key'];

// ─── Difficulty Badge ───
function DifficultyBadge({ difficulty, size = 'sm' }: { difficulty: Difficulty; size?: 'sm' | 'lg' }) {
  const sizeClasses = size === 'lg' ? 'px-3 py-1 text-sm' : 'px-2 py-0.5 text-xs';
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-medium border ${sizeClasses} ${getDifficultyColor(difficulty)}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${getDifficultyDot(difficulty)}`} />
      {difficulty}級
    </span>
  );
}

// ─── Client Type Badge ───
function ClientTypeBadge({ code, size = 'sm' }: { code: ClientTypeCode; size?: 'sm' | 'lg' }) {
  const ct = getClientTypeByCode(code);
  const sizeClasses = size === 'lg' ? 'px-3 py-1 text-sm' : 'px-2 py-0.5 text-xs';
  return (
    <span className={`inline-flex items-center rounded-full font-semibold border ${sizeClasses} ${getTypeColor(code)}`}>
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
          ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
          : 'bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200 active:scale-95'
      }`}
    >
      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
      {copied ? '已複製' : '複製'}
    </button>
  );
}

// ─── Section Header ───
function SectionHeader({ icon: Icon, title, subtitle }: { icon: React.ElementType; title: string; subtitle?: string }) {
  return (
    <div className="flex items-center justify-between mb-1">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-teal-100 flex items-center justify-center">
          <Icon className="w-4 h-4 text-teal-600" />
        </div>
        <h2 className="text-lg font-bold text-slate-800">{title}</h2>
      </div>
      {subtitle && <span className="text-xs text-slate-500">{subtitle}</span>}
    </div>
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
  const dualNeeds = result ? getDualNeeds(result.code) : [];

  return (
    <div className="px-4 py-4 space-y-4">
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
              <div className={`w-8 h-0.5 transition-all ${step > s ? 'bg-teal-500' : 'bg-slate-200'}`} />
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
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <Search className="w-5 h-5 text-teal-600" />
                <h3 className="font-semibold text-slate-800">客戶類別識別</h3>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed">
                這位客戶是以<strong>機構/公司</strong>身份，還是以<strong>個人</strong>身份進行諮詢？
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleCategorySelect('機構')}
                className="card-press bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:border-teal-300 hover:shadow-md transition-all text-left group"
              >
                <div className="w-14 h-14 rounded-xl bg-teal-100 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                  <Building2 className="w-7 h-7 text-teal-600" />
                </div>
                <div className="font-bold text-slate-800 text-lg">機構</div>
                <div className="text-xs text-slate-500 mt-1">公司/實體客戶</div>
                <div className="flex items-center gap-1 mt-3 text-xs text-teal-600 font-medium">
                  A1-A3 <ChevronRight className="w-3 h-3" />
                </div>
              </button>

              <button
                onClick={() => handleCategorySelect('個人')}
                className="card-press bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:border-violet-300 hover:shadow-md transition-all text-left group"
              >
                <div className="w-14 h-14 rounded-xl bg-violet-100 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                  <User className="w-7 h-7 text-violet-600" />
                </div>
                <div className="font-bold text-slate-800 text-lg">個人</div>
                <div className="text-xs text-slate-500 mt-1">高淨值個人客戶</div>
                <div className="flex items-center gap-1 mt-3 text-xs text-violet-600 font-medium">
                  B1-B3 <ChevronRight className="w-3 h-3" />
                </div>
              </button>
            </div>

            {/* Quick Tip */}
            <div className="bg-amber-50 rounded-xl p-3 border border-amber-100">
              <div className="flex items-start gap-2">
                <Lightbulb className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                <p className="text-xs text-amber-700 leading-relaxed">
                  <strong>小貼士：</strong>很多創一代（B1）同時是企業控股股東，可能同時具有機構（A1）和個人（B1）雙重需求！
                </p>
              </div>
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
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${category === '機構' ? 'bg-teal-100 text-teal-700' : 'bg-violet-100 text-violet-700'}`}>
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
                className="card-press w-full bg-white rounded-2xl border border-slate-200 p-4 shadow-sm hover:border-teal-300 hover:shadow-md transition-all text-left"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-sm ${
                        ct.code.startsWith('A')
                          ? 'bg-teal-100 text-teal-700'
                          : 'bg-violet-100 text-violet-700'
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
            <div className="bg-white rounded-2xl border-2 border-teal-200 p-5 shadow-md">
              <div className="flex items-center gap-3 mb-4">
                <div
                  className={`w-16 h-16 rounded-2xl flex items-center justify-center font-bold text-xl ${
                    result.code.startsWith('A')
                      ? 'bg-teal-100 text-teal-700'
                      : 'bg-violet-100 text-violet-700'
                  }`}
                >
                  {result.code}
                </div>
                <div>
                  <div className="font-bold text-xl text-slate-800">{result.name}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${result.category === '機構' ? 'bg-teal-100 text-teal-700' : 'bg-violet-100 text-violet-700'}`}>
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
                <p className="text-sm text-slate-600 bg-teal-50 rounded-xl p-3 border border-teal-100">
                  「{result.entryAngle}」
                </p>
              </div>

              {/* Dual Need Alert */}
              {dualNeeds.length > 0 && (
                <div className="bg-amber-50 rounded-xl p-3 border border-amber-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Link2 className="w-4 h-4 text-amber-600" />
                    <span className="text-sm font-semibold text-amber-700">雙重需求探測</span>
                  </div>
                  {dualNeeds.map((dn, i) => (
                    <div key={i} className="text-xs text-amber-700 leading-relaxed mb-1 last:mb-0">
                      <strong>{dn.primary} ↔ {dn.secondary}</strong>：{dn.reason}
                    </div>
                  ))}
                  {result.dualNeedHint && (
                    <p className="text-xs text-amber-600 mt-2 italic">{result.dualNeedHint}</p>
                  )}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => onViewStrategy(result.code)}
                className="flex-1 py-3 rounded-xl bg-teal-600 text-white font-semibold text-sm shadow-md hover:bg-teal-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2 min-h-[48px]"
              >
                <Target className="w-4 h-4" />
                查看攻略
              </button>
              <button
                onClick={handleReset}
                className="py-3 px-5 rounded-xl bg-white border border-slate-200 text-slate-600 font-medium text-sm hover:bg-slate-50 active:scale-[0.98] transition-all flex items-center justify-center gap-2 min-h-[48px]"
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
  const contentRef = useRef<HTMLDivElement>(null);

  const toggleExpand = (code: ClientTypeCode) => {
    setManuallyExpanded(manuallyExpanded === code ? null : code);
  };

  useEffect(() => {
    if (highlightedType && contentRef.current) {
      contentRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [highlightedType]);

  return (
    <div ref={contentRef} className="px-4 py-4 space-y-3">
      <SectionHeader icon={Target} title="客戶攻略卡片" subtitle="6 類客戶" />

      <div className="space-y-3">
        {clientTypes.map((ct) => {
          const isExpanded = expanded === ct.code;
          const relatedProducts = getProductsForType(ct.code);
          const dualNeeds = getDualNeeds(ct.code);

          return (
            <motion.div
              key={ct.code}
              layout
              className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
            >
              {/* Card Header */}
              <button
                onClick={() => toggleExpand(ct.code)}
                className="w-full p-4 text-left hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-sm ${
                        ct.code.startsWith('A')
                          ? 'bg-teal-100 text-teal-700'
                          : 'bg-violet-100 text-violet-700'
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
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 space-y-4 border-t border-slate-100 pt-3">
                      {/* Profile */}
                      <div>
                        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 flex items-center gap-1">
                          <BookOpen className="w-3.5 h-3.5" />
                          客戶畫像
                        </h4>
                        <p className="text-sm text-slate-700 leading-relaxed">{ct.profile}</p>
                      </div>

                      {/* Entry Angle */}
                      <div>
                        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 flex items-center gap-1">
                          <ArrowRight className="w-3.5 h-3.5" />
                          切入角度
                        </h4>
                        <p className="text-sm text-teal-700 font-medium bg-teal-50 rounded-xl p-3 border border-teal-100">
                          「{ct.entryAngle}」
                        </p>
                      </div>

                      {/* Needs Detail Table */}
                      <div>
                        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-1">
                          <Star className="w-3.5 h-3.5" />
                          核心需求 × 產品推薦
                        </h4>
                        <div className="space-y-2">
                          {ct.needsDetail.map((nd) => {
                            const matchingProduct = relatedProducts.find(p =>
                              nd.need.includes(p.name) || p.name.includes(nd.need) || nd.products.includes(p.name)
                            );
                            return (
                              <div key={nd.need} className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-sm font-medium text-slate-800">{nd.need}</span>
                                  {matchingProduct && <DifficultyBadge difficulty={matchingProduct.difficulty} />}
                                </div>
                                <p className="text-xs text-teal-600 font-medium mb-1">{nd.products}</p>
                                <p className="text-xs text-slate-500">{nd.talkingPoint}</p>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Talk Track Example */}
                      <div>
                        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 flex items-center gap-1">
                          <MessageSquare className="w-3.5 h-3.5" />
                          開場話術示例
                        </h4>
                        <div className="bg-amber-50 rounded-xl p-3 border border-amber-100">
                          <p className="text-sm text-slate-700 leading-relaxed">「{ct.talkTrackExample}」</p>
                          <div className="mt-2 flex justify-end">
                            <CopyButton text={ct.talkTrackExample} />
                          </div>
                        </div>
                      </div>

                      {/* Dual Need Alert */}
                      {dualNeeds.length > 0 && (
                        <div>
                          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 flex items-center gap-1">
                            <Link2 className="w-3.5 h-3.5" />
                            雙重需求提示
                          </h4>
                          <div className="bg-amber-50 rounded-xl p-3 border border-amber-200">
                            {dualNeeds.map((dn, i) => (
                              <div key={i} className="mb-2 last:mb-0">
                                <div className="flex items-center gap-1 text-xs font-semibold text-amber-700">
                                  <span>{dn.primary}</span>
                                  <span>↔</span>
                                  <span>{dn.secondary}</span>
                                </div>
                                <p className="text-xs text-amber-600 mt-0.5">{dn.strategy}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Red Flags */}
                      <div>
                        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          注意事項
                        </h4>
                        <div className="space-y-1.5">
                          {ct.redFlags.map((flag) => (
                            <div key={flag} className="flex items-start gap-2 text-sm text-slate-600">
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

  const difficultyGroups = [
    { level: '入門' as Difficulty, label: '入門級', desc: '新畢業生首3個月可獨立推薦', color: 'emerald' },
    { level: '進階' as Difficulty, label: '進階級', desc: '累積經驗後推薦', color: 'amber' },
    { level: '專家' as Difficulty, label: '專家級', desc: '需導師陪同或轉介', color: 'red' },
  ];

  return (
    <div className="px-4 py-4 space-y-4">
      <SectionHeader icon={Package} title="產品對照矩陣" subtitle="12 項產品" />

      {/* Client Type Filter */}
      <div className="bg-white rounded-2xl border border-slate-200 p-3 shadow-sm">
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
                    ? getTypeSolidBg(code)
                    : getTypeColor(code)
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
            <ClientTypeBadge code={selectedType} size="lg" />
          </div>
          <p className="text-sm text-teal-700 mt-2">
            適用 <strong>{filteredProducts.length}</strong> 項產品 · 切入：「{getClientTypeByCode(selectedType).entryAngle}」
          </p>
        </div>
      )}

      {/* Products by Difficulty Group */}
      <div className="space-y-4">
        {difficultyGroups.map((group) => {
          const groupProducts = filteredProducts.filter(p => p.difficulty === group.level);
          if (groupProducts.length === 0) return null;
          return (
            <div key={group.level}>
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-2 h-2 rounded-full ${getDifficultyDot(group.level)}`} />
                <span className="text-sm font-semibold text-slate-700">{group.label}</span>
                <span className="text-xs text-slate-400">— {group.desc}</span>
              </div>
              <div className="space-y-2">
                {groupProducts.map((product) => (
                  <div
                    key={product.id}
                    className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-slate-800">{product.name}</h3>
                      <DifficultyBadge difficulty={product.difficulty} />
                    </div>
                    <p className="text-xs text-slate-500 mb-2">{product.description}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {product.applicableTypes.map((code) => (
                        <span
                          key={code}
                          className={`px-2 py-0.5 rounded-full text-xs font-medium border ${
                            selectedType === code
                              ? getTypeSolidBg(code)
                              : getTypeColor(code)
                          }`}
                        >
                          {code}
                        </span>
                      ))}
                    </div>
                    <p className="text-xs text-slate-400 mt-2 italic">{product.graduateGuide}</p>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Matrix View (compact) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-3 border-b border-slate-100">
          <h3 className="font-semibold text-sm text-slate-700 flex items-center gap-1">
            <TrendingUp className="w-4 h-4 text-teal-500" />
            完整對照表
          </h3>
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
                          className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-white text-[10px] leading-5 ${getDifficultyBg(product.difficulty)}`}
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
            <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" /> 入門
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
    <div className="px-4 py-4 space-y-4">
      <SectionHeader icon={MessageSquare} title="話術庫" />

      {/* Section Tabs */}
      <div className="flex bg-slate-100 rounded-xl p-1">
        {[
          { key: 'scenario' as const, label: '按場景', icon: '🎭' },
          { key: 'type' as const, label: '按客型', icon: '👥' },
          { key: 'objection' as const, label: '異議處理', icon: '🛡️' },
        ].map((section) => (
          <button
            key={section.key}
            onClick={() => setActiveSection(section.key)}
            className={`flex-1 py-2.5 px-2 rounded-lg text-sm font-medium transition-all min-h-[40px] flex items-center justify-center gap-1 ${
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
              className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{track.icon}</span>
                  <h3 className="font-semibold text-slate-800">{track.label}</h3>
                </div>
                <CopyButton text={track.script} />
              </div>
              <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 rounded-xl p-3 border border-slate-100">
                「{track.script}」
              </p>
              <div className="mt-2 flex items-start gap-1.5">
                <Lightbulb className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" />
                <p className="text-xs text-slate-500">{track.tip}</p>
              </div>
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
              className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <ClientTypeBadge code={track.typeCode} size="lg" />
                </div>
                <CopyButton text={track.script} />
              </div>
              <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 rounded-xl p-3 border border-slate-100">
                「{track.script}」
              </p>
              <div className="mt-2 flex items-start gap-1.5">
                <Lightbulb className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" />
                <p className="text-xs text-slate-500">{track.tip}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Objection Handler */}
      {activeSection === 'objection' && (
        <div className="space-y-3">
          {/* Principle Banner */}
          <div className="bg-gradient-to-r from-teal-50 to-violet-50 rounded-xl p-3 border border-teal-100">
            <p className="text-xs text-teal-700 font-semibold mb-1 flex items-center gap-1">
              <Shield className="w-3.5 h-3.5" />
              處理異議四大原則
            </p>
            <div className="space-y-1">
              {objectionPrinciples.map((p, i) => (
                <div key={i} className="flex items-start gap-1.5 text-xs text-slate-600">
                  <span className="font-semibold text-teal-600 shrink-0">{i + 1}.</span>
                  <span><strong>{p.principle}</strong> — {p.detail}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-amber-50 rounded-xl p-3 border border-amber-100">
            <p className="text-xs text-amber-700 flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" />
              遇到異議不要慌，用專業回應贏得信任
            </p>
          </div>

          {objectionHandlers.map((item, idx) => (
            <div
              key={idx}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
            >
              {/* Objection */}
              <div className="p-4 border-b border-slate-100">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-7 h-7 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-xs font-bold">
                    {idx + 1}
                  </span>
                  <span className="text-xs font-medium text-red-600 uppercase tracking-wide">
                    客戶異議
                  </span>
                </div>
                <p className="text-sm font-medium text-slate-800">
                  「{item.objection}」
                </p>
                <p className="text-xs text-slate-500 mt-1 italic">
                  背後疑慮：{item.hiddenConcern}
                </p>
              </div>
              {/* Response */}
              <div className="p-4 bg-emerald-50/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-emerald-600 uppercase tracking-wide">
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

// ─── Tab 5: 紅旗 (Red Flags & Escalation) ───
function AlertsTab() {
  const [expandedFlag, setExpandedFlag] = useState<number | null>(null);

  return (
    <div className="px-4 py-4 space-y-4">
      <SectionHeader icon={ShieldAlert} title="紅旗與升級機制" />

      {/* Intro Card */}
      <div className="bg-gradient-to-br from-red-50 to-amber-50 rounded-2xl p-4 border border-red-100">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 mb-1">甚麼是紅旗？</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              紅旗是客戶開拓過程中的警示信號，表示你應該暫停獨立處理，尋求導師或合規團隊協助。
              <strong>及時升級不是能力不足，而是專業的體現。</strong>
            </p>
          </div>
        </div>
      </div>

      {/* Red Flag List */}
      <div className="space-y-3">
        {redFlags.map((flag, idx) => (
          <div
            key={idx}
            className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
          >
            <button
              onClick={() => setExpandedFlag(expandedFlag === idx ? null : idx)}
              className="w-full p-4 text-left hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{flag.icon}</span>
                  <div>
                    <div className="font-semibold text-slate-800">{flag.category}</div>
                    <div className="text-xs text-slate-500 mt-0.5 line-clamp-1">{flag.signal}</div>
                  </div>
                </div>
                <motion.div
                  animate={{ rotate: expandedFlag === idx ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown className="w-5 h-5 text-slate-400" />
                </motion.div>
              </div>
            </button>

            <AnimatePresence>
              {expandedFlag === idx && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="px-4 pb-4 border-t border-slate-100 pt-3 space-y-3">
                    <div>
                      <h4 className="text-xs font-semibold text-red-600 uppercase tracking-wide mb-1">
                        具體信號
                      </h4>
                      <p className="text-sm text-slate-700 leading-relaxed">{flag.signal}</p>
                    </div>
                    <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-100">
                      <h4 className="text-xs font-semibold text-emerald-600 uppercase tracking-wide mb-1 flex items-center gap-1">
                        <Shield className="w-3.5 h-3.5" />
                        應採取的行動
                      </h4>
                      <p className="text-sm text-slate-700 leading-relaxed">{flag.action}</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>

      {/* Escalation Guide */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
        <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
          <Zap className="w-5 h-5 text-amber-500" />
          升級流程
        </h3>
        <div className="space-y-3">
          {[
            { step: '1', title: '識別紅旗', desc: '注意客戶行為和要求中的警示信號' },
            { step: '2', title: '暫停行動', desc: '不要繼續推進，不要自行判斷' },
            { step: '3', title: '記錄詳情', desc: '記下具體情況和你的觀察' },
            { step: '4', title: '聯繫導師', desc: '盡快向你的導師或合規團隊報告' },
            { step: '5', title: '等待指示', desc: '在獲得指導前，不要對客戶做出任何承諾' },
          ].map((item) => (
            <div key={item.step} className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center text-xs font-bold shrink-0">
                {item.step}
              </div>
              <div>
                <div className="text-sm font-medium text-slate-800">{item.title}</div>
                <div className="text-xs text-slate-500">{item.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Core Principle Reminder */}
      <div className="bg-teal-50 rounded-2xl p-4 border border-teal-100">
        <div className="flex items-center gap-2 mb-2">
          <Shield className="w-5 h-5 text-teal-600" />
          <h3 className="font-bold text-teal-800">記住</h3>
        </div>
        <p className="text-sm text-teal-700 leading-relaxed">
          新畢業生最常犯的錯誤不是「做錯了甚麼」，而是「沒有在應該求助的時候求助」。
          紅旗不是失敗的標誌，而是保護機制——它保護你、保護客戶、也保護公司。
        </p>
      </div>
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
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-slate-800">
              <span className="text-teal-600">PZC</span> 客戶開拓手冊
            </h1>
            <p className="text-[10px] text-slate-500 tracking-wider">口袋教練 — 家族辦公室專業認可證書</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center shadow-md">
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
          {activeTab === 'alerts' && (
            <motion.div
              key="alerts"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <AlertsTab />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-slate-200 safe-area-bottom shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
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
