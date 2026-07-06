'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { type RiskModelOutput } from '@/lib/risk-model';
import {
  Shield,
  BarChart3,
  ArrowLeft,
  Brain,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  TrendingDown,
  Wallet,
  Building2,
  Receipt,
  Coins,
  Target,
  Award,
  Scale,
} from 'lucide-react';
import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { type ScenarioResult } from '@/lib/risk-model';

interface ResultsDashboardProps {
  result: RiskModelOutput;
  onBack: () => void;
}

function ConfidenceGauge({ probPositive }: { probPositive: number }) {
  const percentage = Math.round(probPositive);
  const circumference = 2 * Math.PI * 40;
  const filled = (percentage / 100) * circumference;

  return (
    <div className="flex items-start gap-4 w-full">
      {/* Gauge circle */}
      <div className="flex flex-col items-center shrink-0">
        <div className="relative w-24 h-24">
          <svg className="w-24 h-24 -rotate-90" viewBox="0 0 96 96">
            <circle cx="48" cy="48" r="40" fill="none" stroke="#e5e7eb" strokeWidth="8" />
            <circle
              cx="48" cy="48" r="40" fill="none"
              stroke={percentage >= 80 ? '#16a34a' : percentage >= 50 ? '#d97706' : '#dc2626'}
              strokeWidth="8"
              strokeDasharray={`${filled} ${circumference}`}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xl font-bold text-gray-900">{percentage}%</span>
          </div>
        </div>
        <p className="text-xs font-bold text-gray-800 mt-1 text-center">正回報機率</p>
      </div>
      {/* Explanation */}
      <div className="flex-1 pt-1">
        <p className="text-xs font-bold text-gray-800 mb-1.5">正回報機率是甚麼？</p>
        <p className="text-[11px] text-gray-600 leading-relaxed">
          在 42 個情景中（7 種匯率 × 6 種樓價變化），根據 ML 機率加權計算，投資者最終獲得<strong className="text-green-700">正淨回報</strong>（即賺錢）的總概率為 <strong className="text-gray-900">{percentage}%</strong>。
        </p>
        <p className="text-[11px] text-gray-600 leading-relaxed mt-1">
          換言之，有 <strong className="text-gray-900">{100 - percentage}%</strong> 的加權概率會出現虧損。此指標綜合考慮了匯率波動及樓價升跌的各種可能性。
        </p>
      </div>
    </div>
  );
}

function TrafficLightLayer({
  color,
  icon,
  title,
  status,
  detail,
}: {
  color: 'blue' | 'amber' | 'purple';
  icon: React.ReactNode;
  title: string;
  status: 'pass' | 'warn' | 'strong';
  detail: string;
}) {
  const colorMap = {
    blue: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', badge: 'bg-blue-100 text-blue-700' },
    amber: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', badge: 'bg-amber-100 text-amber-700' },
    purple: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700', badge: 'bg-purple-100 text-purple-700' },
  };
  const c = colorMap[color];
  const statusLabel = status === 'pass' ? '通過' : status === 'strong' ? '強力' : '注意';

  return (
    <div className={cn('rounded-xl p-4 border', c.bg, c.border)}>
      <div className="flex items-center gap-3">
        <div className={cn('w-10 h-10 rounded-full flex items-center justify-center', c.badge)}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className={cn('text-sm font-semibold', c.text)}>{title}</p>
            <Badge className={cn('text-[10px]', c.badge)}>{statusLabel}</Badge>
          </div>
          <p className="text-xs text-gray-600 mt-0.5">{detail}</p>
        </div>
        {status === 'pass' || status === 'strong' ? (
          <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
        ) : (
          <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />
        )}
      </div>
    </div>
  );
}

/**
 * BellCurve — SVG-based probability distribution visualization
 * Shows a smooth Gaussian curve fitted to the ML-weighted scenario ROI distribution,
 * with green/red shading for positive/negative return zones, actual scenario dots,
 * and key percentile markers.
 */
function BellCurve({
  scenarios,
  meanROI,
  probPositive,
}: {
  scenarios: ScenarioResult[];
  meanROI: number;
  probPositive: number;
}) {
  // Compute weighted mean and std
  const stats = useMemo(() => {
    const totalProb = scenarios.reduce((s, sc) => s + sc.probability, 0);
    const mean = scenarios.reduce((s, sc) => s + sc.roi * sc.probability, 0) / totalProb;
    const variance = scenarios.reduce((s, sc) => s + sc.probability * Math.pow(sc.roi - mean, 2), 0) / totalProb;
    const std = Math.sqrt(Math.max(variance, 1));
    return { mean, std };
  }, [scenarios]);

  // Gaussian PDF
  const gaussian = (x: number, mu: number, sigma: number) =>
    (1 / (sigma * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * Math.pow((x - mu) / sigma, 2));

  // Generate curve points
  const curveData = useMemo(() => {
    const { mean, std } = stats;
    const xMin = mean - 4 * std;
    const xMax = mean + 4 * std;
    const steps = 120;
    const dx = (xMax - xMin) / steps;
    const points: { x: number; y: number }[] = [];
    for (let i = 0; i <= steps; i++) {
      const x = xMin + i * dx;
      points.push({ x, y: gaussian(x, mean, std) });
    }
    return { points, xMin, xMax, dx, yMax: gaussian(mean, mean, std) };
  }, [stats]);

  // Percentile calculations (weighted CDF)
  const percentiles = useMemo(() => {
    const sorted = [...scenarios].sort((a, b) => a.roi - b.roi);
    let cumProb = 0;
    const result: Record<number, number> = {};
    for (const s of sorted) {
      cumProb += s.probability;
      if (result[5] === undefined && cumProb >= 0.05) result[5] = s.roi;
      if (result[25] === undefined && cumProb >= 0.25) result[25] = s.roi;
      if (result[50] === undefined && cumProb >= 0.50) result[50] = s.roi;
      if (result[75] === undefined && cumProb >= 0.75) result[75] = s.roi;
      if (result[95] === undefined && cumProb >= 0.95) result[95] = s.roi;
    }
    return result;
  }, [scenarios]);

  // SVG dimensions
  const W = 340;
  const H = 200;
  const padL = 45;
  const padR = 15;
  const padT = 15;
  const padB = 38;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;

  const { points, xMin, xMax, yMax } = curveData;

  // Map data coords to SVG
  const toSVGX = (x: number) => padL + ((x - xMin) / (xMax - xMin)) * plotW;
  const toSVGY = (y: number) => padT + plotH - (y / yMax) * plotH * 0.92;

  // ROI=0 line position
  const zeroX = toSVGX(0);

  // Build path strings
  const curvePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${toSVGX(p.x).toFixed(1)},${toSVGY(p.y).toFixed(1)}`).join(' ');

  // Build filled areas (positive = green, negative = red)
  const buildArea = (fromX: number, toX: number) => {
    const subset = points.filter(p => p.x >= fromX && p.x <= toX);
    if (subset.length < 2) return '';
    const firstSVGX = toSVGX(subset[0].x);
    const lastSVGX = toSVGX(subset[subset.length - 1].x);
    const baselineY = toSVGY(0);
    const d = subset.map((p, i) => `${i === 0 ? 'M' : 'L'}${toSVGX(p.x).toFixed(1)},${toSVGY(p.y).toFixed(1)}`).join(' ');
    return `${d} L${lastSVGX.toFixed(1)},${baselineY.toFixed(1)} L${firstSVGX.toFixed(1)},${baselineY.toFixed(1)} Z`;
  };

  const negativeArea = buildArea(xMin, Math.min(0, xMax));
  const positiveArea = buildArea(Math.max(0, xMin), xMax);

  // X-axis ticks
  const tickStep = stats.std >= 40 ? 40 : stats.std >= 20 ? 20 : stats.std >= 10 ? 10 : 5;
  const xTicks: number[] = [];
  for (let t = Math.ceil(xMin / tickStep) * tickStep; t <= xMax; t += tickStep) {
    xTicks.push(Math.round(t));
  }

  // Scenario dots — aggregate by ROI (since multiple scenarios may have same ROI)
  const scenarioDots = useMemo(() => {
    const roiMap = new Map<number, { roi: number; prob: number; netGainHKD: number }>();
    for (const s of scenarios) {
      const key = Math.round(s.roi * 10) / 10;
      const existing = roiMap.get(key);
      if (existing) {
        existing.prob += s.probability;
      } else {
        roiMap.set(key, { roi: s.roi, prob: s.probability, netGainHKD: s.netGainHKD });
      }
    }
    return Array.from(roiMap.values());
  }, [scenarios]);

  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ maxHeight: 240 }}>
        {/* Grid lines */}
        {xTicks.map(t => (
          <line key={t} x1={toSVGX(t)} y1={padT} x2={toSVGX(t)} y2={padT + plotH} stroke="#e5e7eb" strokeWidth={0.5} />
        ))}

        {/* Negative area (red) */}
        {negativeArea && <path d={negativeArea} fill="#fecaca" fillOpacity={0.6} />}

        {/* Positive area (green) */}
        {positiveArea && <path d={positiveArea} fill="#bbf7d0" fillOpacity={0.6} />}

        {/* Zero line */}
        {zeroX >= padL && zeroX <= padL + plotW && (
          <line x1={zeroX} y1={padT} x2={zeroX} y2={padT + plotH} stroke="#6b7280" strokeWidth={1} strokeDasharray="4,3" />
        )}

        {/* Bell curve line */}
        <path d={curvePath} fill="none" stroke="#7c3aed" strokeWidth={2.5} strokeLinejoin="round" />

        {/* Mean line */}
        <line x1={toSVGX(stats.mean)} y1={padT} x2={toSVGX(stats.mean)} y2={padT + plotH} stroke="#7c3aed" strokeWidth={1.5} strokeDasharray="6,3" />

        {/* Percentile lines (P5, P95) */}
        {[5, 95].map(p => percentiles[p] !== undefined && (
          <line key={p} x1={toSVGX(percentiles[p])} y1={padT} x2={toSVGX(percentiles[p])} y2={padT + plotH} stroke="#f59e0b" strokeWidth={1} strokeDasharray="3,3" />
        ))}

        {/* Scenario dots (actual probabilities) */}
        {scenarioDots.map((dot, i) => {
          const dotY = gaussian(dot.roi, stats.mean, stats.std);
          return (
            <circle
              key={i}
              cx={toSVGX(dot.roi)}
              cy={toSVGY(dotY)}
              r={Math.max(2.5, Math.min(6, dot.prob * 200))}
              fill={dot.roi >= 0 ? '#16a34a' : '#dc2626'}
              fillOpacity={0.7}
              stroke="white"
              strokeWidth={1}
            />
          );
        })}

        {/* X-axis */}
        <line x1={padL} y1={padT + plotH} x2={padL + plotW} y2={padT + plotH} stroke="#9ca3af" strokeWidth={1} />

        {/* X-axis ticks & labels */}
        {xTicks.map(t => (
          <g key={t}>
            <line x1={toSVGX(t)} y1={padT + plotH} x2={toSVGX(t)} y2={padT + plotH + 4} stroke="#9ca3af" strokeWidth={1} />
            <text x={toSVGX(t)} y={padT + plotH + 14} textAnchor="middle" fontSize={8} fill="#6b7280">
              {t}%
            </text>
          </g>
        ))}

        {/* Y-axis label */}
        <text x={padL - 8} y={padT + plotH / 2} textAnchor="middle" fontSize={7} fill="#9ca3af" transform={`rotate(-90,${padL - 8},${padT + plotH / 2})`}>
          Probability Density
        </text>

        {/* ROI label */}
        <text x={padL + plotW / 2} y={H - 2} textAnchor="middle" fontSize={8} fill="#6b7280">
          投資回報率 ROI (%)
        </text>

        {/* Legend markers */}
        {/* Mean marker */}
        <circle cx={padL + 4} cy={padT + 5} r={3} fill="#7c3aed" />
        <text x={padL + 10} y={padT + 8} fontSize={7} fill="#7c3aed" fontWeight="bold">
          ML 加權均值 {stats.mean.toFixed(1)}%
        </text>

        {/* P5/P95 markers */}
        {percentiles[5] !== undefined && (
          <>
            <line x1={padL + 2} y1={padT + 17} x2={padL + 8} y2={padT + 17} stroke="#f59e0b" strokeWidth={1.5} strokeDasharray="3,2" />
            <text x={padL + 12} y={padT + 20} fontSize={6.5} fill="#d97706">
              P5 {percentiles[5].toFixed(1)}%  |  P95 {percentiles[95]?.toFixed(1)}%
            </text>
          </>
        )}
      </svg>

      {/* Stats summary below chart */}
      <div className="grid grid-cols-3 gap-2 mt-2">
        <div className="bg-red-50 border border-red-200 rounded-lg px-2 py-1.5 text-center">
          <p className="text-[10px] text-red-600 font-semibold">虧損區間</p>
          <p className="text-sm font-black text-red-700">{(100 - probPositive).toFixed(1)}%</p>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-lg px-2 py-1.5 text-center">
          <p className="text-[10px] text-purple-600 font-semibold">ML 加權均值</p>
          <p className="text-sm font-black text-purple-700">{meanROI >= 0 ? '+' : ''}{meanROI}%</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg px-2 py-1.5 text-center">
          <p className="text-[10px] text-green-600 font-semibold">盈利區間</p>
          <p className="text-sm font-black text-green-700">{probPositive.toFixed(1)}%</p>
        </div>
      </div>
    </div>
  );
}

export function ResultsDashboard({ result, onBack }: ResultsDashboardProps) {
  const { summary, mlPredictions, scenarios } = result;
  const [showAllScenarios, setShowAllScenarios] = useState(false);
  const [scenarioSort, setScenarioSort] = useState<'probability' | 'value'>('value');

  // Get scenarios for selected holding period
  const filtered = scenarios
    .filter((s) => s.holdingYears === summary.holdingPeriod);

  // Re-normalize probabilities within selected holding period so they sum to 100%
  const filteredTotalProb = filtered.reduce((sum, s) => sum + s.probability, 0);
  const renormalized = filtered.map((s) => ({
    ...s,
    probability: s.probability / filteredTotalProb,
  }));

  // ── 3 Key Scenarios ──
  // 1) Highest probability
  const highestProbScenario = [...renormalized].sort((a, b) => b.probability - a.probability)[0];
  // 2) Highest return (best net gain)
  const highestReturnScenario = [...renormalized].sort((a, b) => b.netGainHKD - a.netGainHKD)[0];
  // 3) ML-weighted average (composite from summary, not a single scenario)

  const sortedForList = [...renormalized].sort((a, b) => {
    if (scenarioSort === 'probability') return b.probability - a.probability;
    return b.netGainHKD - a.netGainHKD;
  });

  const topScenarios = showAllScenarios ? sortedForList : sortedForList.slice(0, 5);

  const formatWan = (amount: number) => {
    const wan = amount / 10000;
    const abs = Math.abs(wan);
    const sign = amount >= 0 ? '' : '-';
    if (abs >= 10000) {
      return `${sign}${(abs / 10000).toFixed(1)}億`;
    }
    if (abs >= 1) {
      return `${sign}${abs.toFixed(0)}萬`;
    }
    return `${sign}${(abs * 10000 / 1000).toFixed(0)}千`;
  };

  const formatHKDFull = (amount: number) => {
    const abs = Math.abs(amount);
    const sign = amount >= 0 ? '+' : '-';
    if (abs >= 100000000) {
      return `${sign}${(abs / 100000000).toFixed(2)}億`;
    }
    if (abs >= 10000) {
      return `${sign}${(abs / 10000).toFixed(0)}萬`;
    }
    return `${sign}${abs.toLocaleString()}`;
  };

  const formatJPY = (amount: number) => {
    if (amount >= 10000000) {
      return `${(amount / 10000000).toFixed(1)}千萬`;
    }
    if (amount >= 10000) {
      return `${(amount / 10000).toFixed(0)}萬`;
    }
    return amount.toLocaleString();
  };

  // Derive key numbers
  const currentPriceHKD = summary.propertyValueHKD;
  const futurePriceHKD = summary.expectedEndValueHKD;
  const netReturnHKD = summary.expectedNetGainHKD;
  const totalRentHKD = summary.totalRentHKD;
  const totalCostsHKD = summary.totalCostsHKD;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-lg border-b border-gray-200 px-4 py-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-base text-gray-900">日本物業投資回報分析</p>
            <p className="text-xs text-gray-500">持有 {summary.holdingPeriod} 年 · 84 情景壓力測試 · ML V2 機率加權</p>
          </div>
          <Shield className="h-5 w-5 text-amber-600" />
        </div>
      </div>

      <div className="px-4 py-4 space-y-4 pb-8">
        {/* Property Summary — Compact */}
        <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">物業價值</p>
              <p className="text-lg font-bold text-gray-900">
                ¥{formatJPY(summary.propertyValueJPY)} <span className="text-sm font-medium text-gray-500">({formatWan(summary.propertyValueHKD)} HKD)</span>
              </p>
              <p className="text-[10px] text-gray-400 mt-0.5">
                自付 ¥{formatJPY(summary.equityJPY)} + 貸款 ¥{formatJPY(summary.loanAmountJPY)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">持有 {summary.holdingPeriod} 年</p>
              <p className={cn(
                'text-xl font-black',
                netReturnHKD >= 0 ? 'text-green-700' : 'text-red-700'
              )}>
                {netReturnHKD >= 0 ? '+' : ''}{formatHKDFull(netReturnHKD)}
              </p>
              <p className="text-xs font-semibold text-gray-600">
                ROI {summary.mlWeightedROI >= 0 ? '+' : ''}{summary.mlWeightedROI}% · ML 加權
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-100">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-[10px] text-gray-600">物業升值 {formatHKDFull(futurePriceHKD - currentPriceHKD)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              <span className="text-[10px] text-gray-600">租金 +{formatWan(totalRentHKD)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-red-400" />
              <span className="text-[10px] text-gray-600">成本 -{formatWan(totalCostsHKD)}</span>
            </div>
          </div>
        </div>

        {/* Three-Layer Analysis — Expanded */}
        <div className="space-y-3">
          <p className="text-sm font-semibold text-gray-800 px-1">三層分析摘要</p>

          {/* Layer 1: Historical Data Validation */}
          <div className="rounded-xl border bg-blue-50 border-blue-200 p-4 space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <BarChart3 className="h-5 w-5 text-blue-700" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-blue-700">第一層：歷史數據驗證</p>
                  <Badge className="text-[10px] bg-blue-100 text-blue-700">通過</Badge>
                </div>
                <p className="text-xs text-gray-600 mt-0.5">104 季度樣本 · 65 個重疊 10 年窗口</p>
              </div>
              <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
            </div>
            <div className="ml-13 bg-white/60 rounded-lg p-3 space-y-1.5 border border-blue-100">
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">簡單平均 ROI</span>
                <span className={cn('font-bold', summary.simpleAvgROI >= 0 ? 'text-green-700' : 'text-red-700')}>
                  {summary.simpleAvgROI >= 0 ? '+' : ''}{summary.simpleAvgROI}%
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">最佳情景 ROI</span>
                <span className="font-bold text-green-700">+{summary.bestCaseROI}%</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">最差情景 ROI</span>
                <span className={cn('font-bold', summary.worstCaseROI >= 0 ? 'text-green-700' : 'text-red-700')}>
                  {summary.worstCaseROI >= 0 ? '+' : ''}{summary.worstCaseROI}%
                </span>
              </div>
            </div>
          </div>

          {/* Layer 2: 84 Scenario Stress Test */}
          <div className={cn('rounded-xl border p-4 space-y-2', summary.worstCaseROI > 0 ? 'bg-amber-50 border-amber-200' : 'bg-amber-50 border-red-300')}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-amber-700" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-amber-700">第二層：84 情景壓力測試</p>
                  <Badge className={cn('text-[10px]', summary.worstCaseROI > 0 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700')}>
                    {summary.worstCaseROI > 0 ? '通過' : '注意'}
                  </Badge>
                </div>
                <p className="text-xs text-gray-600 mt-0.5">7 匯率 × 4 物價 × 3 年期 = 84 組合</p>
              </div>
              {summary.worstCaseROI > 0 ? (
                <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />
              )}
            </div>
            <div className="ml-13 bg-white/60 rounded-lg p-3 space-y-1.5 border border-amber-100">
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">最差情景淨損</span>
                <span className={cn('font-bold', summary.worstCaseNetGainHKD >= 0 ? 'text-green-700' : 'text-red-700')}>
                  {formatHKDFull(summary.worstCaseNetGainHKD)} HKD
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">最差情景 ROI</span>
                <span className={cn('font-bold', summary.worstCaseROI >= 0 ? 'text-green-700' : 'text-red-700')}>
                  {summary.worstCaseROI >= 0 ? '+' : ''}{summary.worstCaseROI}%
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">最佳情景收益</span>
                <span className="font-bold text-green-700">
                  {formatHKDFull(summary.bestCaseNetGainHKD)} HKD (+{summary.bestCaseROI}%)
                </span>
              </div>
            </div>
          </div>

          {/* Layer 3: ML Probability Weighting */}
          <div className="rounded-xl border bg-purple-50 border-purple-200 p-4 space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                <Brain className="h-5 w-5 text-purple-700" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-purple-700">第三層：ML 機率加權</p>
                  <Badge className="text-[10px] bg-purple-100 text-purple-700">強力</Badge>
                </div>
                <p className="text-xs text-gray-600 mt-0.5">4 模型集成 + Monte Carlo 機率分佈</p>
              </div>
              <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
            </div>
            <div className="ml-13 bg-white/60 rounded-lg p-3 space-y-1.5 border border-purple-100">
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">ML 加權預期收益</span>
                <span className={cn('font-bold', summary.expectedNetGainHKD >= 0 ? 'text-green-700' : 'text-red-700')}>
                  {formatHKDFull(summary.expectedNetGainHKD)} HKD
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">ML 加權 ROI</span>
                <span className={cn('font-bold', summary.mlWeightedROI >= 0 ? 'text-green-700' : 'text-red-700')}>
                  {summary.mlWeightedROI >= 0 ? '+' : ''}{summary.mlWeightedROI}%
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">正回報機率</span>
                <span className="font-bold text-purple-700">{summary.probPositiveReturn}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Three Key Scenarios */}
        <div className="space-y-3">
          <p className="text-sm font-semibold text-gray-800 px-1">三大核心情景</p>

          {/* 1) Highest Return — DEFAULT FIRST */}
          <div className="rounded-xl border-2 border-emerald-300 bg-emerald-50 overflow-hidden">
            <div className="bg-emerald-600 px-4 py-1.5 flex items-center gap-2">
              <Award className="h-4 w-4 text-white" />
              <p className="text-xs font-bold text-white">最高回報情景</p>
              <Badge className="ml-auto bg-emerald-200 text-emerald-800 text-[10px] h-5">
                機率 {(highestReturnScenario.probability * 100).toFixed(1)}%
              </Badge>
            </div>
            <div className="px-4 py-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                    FX {highestReturnScenario.fx}
                  </span>
                  <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                    物價 {highestReturnScenario.priceChangeAnnual > 0 ? '+' : ''}{highestReturnScenario.priceChangeAnnual}%/年
                  </span>
                </div>
              </div>
              {/* Breakdown */}
              <div className="space-y-1.5">
                {(() => {
                  // Investor cash flow breakdown (mathematically consistent with netGainHKD)
                  // netGainHKD = saleProceeds + rentalSurplus - principal
                  const saleProceedsHKD = (highestReturnScenario.propertyEndValueJPY - highestReturnScenario.remainingLoanJPY) / highestReturnScenario.fx;
                  const rentalSurplusHKD = highestReturnScenario.netGainHKD - saleProceedsHKD + summary.propertyValueHKD;
                  return (
                    <>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center">
                            <Building2 className="h-3 w-3 text-emerald-700" />
                          </div>
                          <span className="text-xs text-gray-600">出售物業所得</span>
                        </div>
                        <span className={cn('text-sm font-bold', saleProceedsHKD >= 0 ? 'text-green-700' : 'text-red-700')}>
                          {formatHKDFull(saleProceedsHKD)} HKD
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center">
                            <Coins className="h-3 w-3 text-emerald-700" />
                          </div>
                          <span className="text-xs text-gray-600">租金淨收入（扣按揭+管理+稅）</span>
                        </div>
                        <span className={cn('text-sm font-bold', rentalSurplusHKD >= 0 ? 'text-blue-700' : 'text-red-600')}>
                          {rentalSurplusHKD >= 0 ? '+' : ''}{formatHKDFull(rentalSurplusHKD)} HKD
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center">
                            <Receipt className="h-3 w-3 text-emerald-700" />
                          </div>
                          <span className="text-xs text-gray-600">投資本金（自付）</span>
                        </div>
                        <span className="text-sm font-bold text-gray-700">
                          -{formatWan(summary.equityHKD)}
                        </span>
                      </div>
                      <div className="border-t border-emerald-200 pt-1.5 mt-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-5 h-5 rounded-full bg-emerald-200 flex items-center justify-center">
                              <Wallet className="h-3 w-3 text-emerald-800" />
                            </div>
                            <span className="text-xs font-bold text-gray-700">淨收益</span>
                          </div>
                          <div className="text-right">
                            <span className={cn(
                              'text-lg font-black',
                              highestReturnScenario.netGainHKD >= 0 ? 'text-green-700' : 'text-red-700'
                            )}>
                              {formatHKDFull(highestReturnScenario.netGainHKD)} HKD
                            </span>
                            <p className="text-[10px] font-semibold text-gray-600">
                              ROI {highestReturnScenario.roi >= 0 ? '+' : ''}{highestReturnScenario.roi.toFixed(1)}%
                            </p>
                          </div>
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
          </div>

          {/* 2) Highest Probability */}
          <div className="rounded-xl border-2 border-purple-300 bg-purple-50 overflow-hidden">
            <div className="bg-purple-500 px-4 py-1.5 flex items-center gap-2">
              <Target className="h-4 w-4 text-white" />
              <p className="text-xs font-bold text-white">最高機率情景</p>
              <Badge className="ml-auto bg-purple-200 text-purple-800 text-[10px] h-5">
                機率 {(highestProbScenario.probability * 100).toFixed(1)}%
              </Badge>
            </div>
            <div className="px-4 py-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-purple-800 bg-purple-100 px-2 py-0.5 rounded">
                    FX {highestProbScenario.fx}
                  </span>
                  <span className="text-xs font-bold text-purple-800 bg-purple-100 px-2 py-0.5 rounded">
                    物價 {highestProbScenario.priceChangeAnnual > 0 ? '+' : ''}{highestProbScenario.priceChangeAnnual}%/年
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-600">預期淨收益</p>
                <div className="text-right">
                  <span className={cn(
                    'text-lg font-black',
                    highestProbScenario.netGainHKD >= 0 ? 'text-green-700' : 'text-red-700'
                  )}>
                    {formatHKDFull(highestProbScenario.netGainHKD)} HKD
                  </span>
                  <p className="text-[10px] font-semibold text-gray-600">
                    ROI {highestProbScenario.roi >= 0 ? '+' : ''}{highestProbScenario.roi.toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 3) ML-Weighted Average */}
          <div className="rounded-xl border-2 border-blue-300 bg-blue-50 overflow-hidden">
            <div className="bg-blue-600 px-4 py-1.5 flex items-center gap-2">
              <Scale className="h-4 w-4 text-white" />
              <p className="text-xs font-bold text-white">ML 加權平均回報</p>
              <Badge className="ml-auto bg-blue-200 text-blue-800 text-[10px] h-5">
                84 情景加權
              </Badge>
            </div>
            <div className="px-4 py-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-blue-800 bg-blue-100 px-2 py-0.5 rounded">
                    ML 加權預期
                  </span>
                  <span className="text-xs text-gray-600">
                    正回報機率 {summary.probPositiveReturn}%
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-600">預期淨收益</p>
                <div className="text-right">
                  <span className={cn(
                    'text-lg font-black',
                    summary.expectedNetGainHKD >= 0 ? 'text-green-700' : 'text-red-700'
                  )}>
                    {formatHKDFull(summary.expectedNetGainHKD)} HKD
                  </span>
                  <p className="text-[10px] font-semibold text-gray-600">
                    ROI {summary.mlWeightedROI >= 0 ? '+' : ''}{summary.mlWeightedROI}%
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bell Curve — ROI Probability Distribution */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Brain className="h-4 w-4 text-purple-600" />
              投資回報機率分佈（Bell Curve）
            </CardTitle>
          </CardHeader>
          <CardContent>
            <BellCurve scenarios={renormalized} meanROI={summary.mlWeightedROI} probPositive={summary.probPositiveReturn} />
          </CardContent>
        </Card>

        {/* ML Prediction Distribution — Factor Level */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Brain className="h-4 w-4 text-purple-600" />
              ML 預測分佈 (10 年)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-gray-600">匯率 10 年變化</span>
                <span className="font-bold text-gray-900">{mlPredictions.fx10yrChange.mean > 0 ? '+' : ''}{mlPredictions.fx10yrChange.mean}%</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-purple-500 rounded-full" style={{ width: `${Math.min(100, Math.max(10, 50 + mlPredictions.fx10yrChange.mean))}%` }} />
              </div>
              <div className="flex justify-between text-[10px] text-gray-500">
                <span>P5: {mlPredictions.fx10yrChange.p5}%</span>
                <span>P50: {mlPredictions.fx10yrChange.p50}%</span>
                <span>P95: +{mlPredictions.fx10yrChange.p95}%</span>
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-gray-600">物價 10 年變化</span>
                <span className="font-bold text-gray-900">{mlPredictions.property10yrChange.mean > 0 ? '+' : ''}{mlPredictions.property10yrChange.mean}%</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-amber-500 rounded-full" style={{ width: `${Math.min(100, Math.max(10, 50 + mlPredictions.property10yrChange.mean))}%` }} />
              </div>
              <div className="flex justify-between text-[10px] text-gray-500">
                <span>P5: {mlPredictions.property10yrChange.p5}%</span>
                <span>P50: {mlPredictions.property10yrChange.p50}%</span>
                <span>P95: +{mlPredictions.property10yrChange.p95}%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Scenario Explorer */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-sm">
                <BarChart3 className="h-4 w-4 text-amber-600" />
                84 情景明細
              </CardTitle>
              <div className="flex gap-1">
                <Button
                  variant={scenarioSort === 'probability' ? 'default' : 'outline'}
                  size="sm"
                  className={cn('text-xs h-7', scenarioSort === 'probability' && 'bg-amber-600')}
                  onClick={() => setScenarioSort('probability')}
                >
                  機率排序
                </Button>
                <Button
                  variant={scenarioSort === 'value' ? 'default' : 'outline'}
                  size="sm"
                  className={cn('text-xs h-7', scenarioSort === 'value' && 'bg-amber-600')}
                  onClick={() => setScenarioSort('value')}
                >
                  金額排序
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {topScenarios.map((s, i) => (
                <div
                  key={`${s.fx}-${s.priceChangeAnnual}`}
                  className={cn(
                    'flex items-center gap-3 p-3 rounded-lg border',
                    s.netGainHKD >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                  )}
                >
                  <div className="text-xs text-gray-500 w-6 text-right">{i + 1}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-gray-800">FX {s.fx}</span>
                      <span className="text-xs text-gray-500">×</span>
                      <span className="text-xs font-bold text-gray-800">物價 {s.priceChangeAnnual > 0 ? '+' : ''}{s.priceChangeAnnual}%/年</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-[10px] h-4 px-1 text-gray-600">
                        機率 {(s.probability * 100).toFixed(1)}%
                      </Badge>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={cn('text-sm font-bold', s.netGainHKD >= 0 ? 'text-green-700' : 'text-red-700')}>
                      {formatHKDFull(s.netGainHKD)} HKD
                    </p>
                    <p className="text-[10px] font-semibold text-gray-600">ROI {s.roi >= 0 ? '+' : ''}{s.roi.toFixed(1)}%</p>
                  </div>
                </div>
              ))}
            </div>
            {filtered.length > 5 && (
              <Button
                variant="ghost"
                className="w-full mt-2 text-amber-700 font-semibold"
                onClick={() => setShowAllScenarios(!showAllScenarios)}
              >
                {showAllScenarios ? (
                  <>收起 <ChevronUp className="h-4 w-4 ml-1" /></>
                ) : (
                  <>查看全部 {filtered.length} 個情景 <ChevronDown className="h-4 w-4 ml-1" /></>
                )}
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Disclaimer */}
        <div className="bg-gray-100 rounded-xl p-4 text-center">
          <p className="text-xs text-gray-600 leading-relaxed">
            ⚠️ 本模型僅供參考，不構成投資建議。過往數據不代表未來表現。
            投資有風險，請諮詢專業顧問後再做決定。
          </p>
        </div>
      </div>
    </div>
  );
}
