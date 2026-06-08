import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserAuth } from '@/lib/auth-helpers';

export const dynamic = 'force-dynamic';

// Demo FX rates and daily changes
const DEMO_RATES: Record<string, { rate: number; change: number }> = {
  'USD/HKD': { rate: 7.82, change: -0.12 },
  'USD/RMB': { rate: 7.25, change: 0.08 },
  'USD/JPY': { rate: 155.5, change: -1.23 },
  'HKD/RMB': { rate: 0.927, change: 0.05 },
  'HKD/JPY': { rate: 19.89, change: -0.45 },
  'RMB/JPY': { rate: 21.45, change: -0.67 },
};

// Demo portfolio data for different users
const DEMO_PORTFOLIO: Record<string, { currency: string; amount: number; productName: string }[]> = {
  default: [
    { currency: 'HKD', amount: 5000000, productName: '香港物業' },
    { currency: 'USD', amount: 200000, productName: 'NPC基金' },
    { currency: 'JPY', amount: 50000000, productName: '日本物業' },
    { currency: 'RMB', amount: 3000000, productName: 'VFK健康產品' },
  ],
};

function getRateToHKD(currency: string): number {
  switch (currency) {
    case 'HKD': return 1;
    case 'USD': return 7.82;
    case 'RMB': return 7.82 / 7.25 * 0.927 / 0.927; // HKD/RMB rate
    case 'JPY': return 7.82 / 155.5;
    default: return 1;
  }
}

function getDailyChange(currency: string): number {
  switch (currency) {
    case 'HKD': return 0;
    case 'USD': return -0.12;
    case 'RMB': return 0.08;
    case 'JPY': return -1.23;
    default: return 0;
  }
}

export async function GET(req: NextRequest) {
  const auth = getUserAuth(req);
  if (!auth) return NextResponse.json({ error: '未授權' }, { status: 401 });

  try {
    const userId = auth.userId;

    // Get user's alerts
    const alerts = await db.currencyAlert.findMany({
      where: { userId, status: 'ACTIVE' },
      orderBy: { createdAt: 'desc' },
    });

    // Get user's stress tests
    const recentTests = await db.fXStressTest.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 3,
    });

    // Build portfolio
    const portfolioItems = DEMO_PORTFOLIO.default;
    let totalValueHKD = 0;
    let totalDailyChange = 0;

    const assetCards = portfolioItems.map(item => {
      const rate = getRateToHKD(item.currency);
      const valueHKD = item.amount * rate;
      const dailyChange = getDailyChange(item.currency);
      const dailyImpact = valueHKD * (dailyChange / 100);

      totalValueHKD += valueHKD;
      totalDailyChange += dailyImpact;

      return {
        currency: item.currency,
        amount: item.amount,
        productName: item.productName,
        valueHKD: Math.round(valueHKD),
        dailyChange,
        dailyImpact: Math.round(dailyImpact),
        rate: item.currency === 'HKD' ? 1 : DEMO_RATES[`${item.currency}/HKD`]?.rate || rate,
      };
    });

    // Check triggered alerts
    const triggeredAlerts = alerts.filter(a => a.status === 'TRIGGERED');

    return NextResponse.json({
      portfolio: assetCards,
      totalValueHKD: Math.round(totalValueHKD),
      totalDailyChange: Math.round(totalDailyChange),
      dailyChangePercent: ((totalDailyChange / totalValueHKD) * 100).toFixed(2),
      baseCurrency: 'HKD',
      alerts: {
        active: alerts.filter(a => a.status === 'ACTIVE').length,
        triggered: triggeredAlerts.length,
        items: alerts,
      },
      recentTests,
      rates: DEMO_RATES,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
