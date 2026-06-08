import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserAuth } from '@/lib/auth-helpers';

export const dynamic = 'force-dynamic';

// Demo FX rates for conversion
const FX_RATES_TO_HKD: Record<string, number> = {
  HKD: 1,
  USD: 7.82,
  RMB: 0.927 / 1 * 7.82 / 7.25, // ~1.0
  JPY: 7.82 / 155.5, // ~0.0503
};

// Simplified: 1 RMB = 1.075 HKD, 1 JPY = 0.0503 HKD
const CORRECT_RATES: Record<string, number> = {
  HKD: 1,
  USD: 7.82,
  RMB: 1.075,
  JPY: 0.0503,
};

// Stress scenario percentages
const SCENARIOS = {
  mild: 0.05,     // 5%
  moderate: 0.15, // 15%
  extreme: 0.30,  // 30%
};

// List stress tests
export async function GET(req: NextRequest) {
  const auth = getUserAuth(req);
  if (!auth) return NextResponse.json({ error: '未授權' }, { status: 401 });

  try {
    const tests = await db.fXStressTest.findMany({
      where: { userId: auth.userId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ stressTests: tests });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Create stress test
export async function POST(req: NextRequest) {
  const auth = getUserAuth(req);
  if (!auth) return NextResponse.json({ error: '未授權' }, { status: 401 });

  try {
    const body = await req.json();
    const { portfolio, baseCurrency = 'HKD' } = body;

    if (!portfolio || !Array.isArray(portfolio) || portfolio.length === 0) {
      return NextResponse.json({ error: '請選擇至少一項資產' }, { status: 400 });
    }

    // Calculate total asset value in base currency
    let totalAssetValue = 0;
    const enrichedPortfolio = portfolio.map((item: any) => {
      const rate = CORRECT_RATES[item.currency] || 1;
      const valueInBase = item.amount * rate;
      totalAssetValue += valueInBase;
      return {
        ...item,
        valueInBase: Math.round(valueInBase),
        rate,
      };
    });

    // Calculate weights
    for (const item of enrichedPortfolio) {
      item.weight = totalAssetValue > 0 ? item.valueInBase / totalAssetValue : 0;
    }

    // Calculate stress scenarios
    const results: Record<string, any> = {};

    for (const [scenarioName, pct] of Object.entries(SCENARIOS)) {
      let totalLoss = 0;
      const items: { currency: string; loss: number; percent: number }[] = [];

      for (const item of enrichedPortfolio) {
        if (item.currency === baseCurrency) continue; // Base currency not affected
        const loss = item.valueInBase * pct;
        totalLoss += loss;
        items.push({
          currency: item.currency,
          loss: Math.round(loss),
          percent: Math.round(pct * 100),
        });
      }

      results[scenarioName] = {
        totalLoss: Math.round(totalLoss),
        lossPercent: totalAssetValue > 0 ? ((totalLoss / totalAssetValue) * 100).toFixed(1) : '0',
        items,
      };
    }

    const maxLossAmount = Math.max(
      results.mild.totalLoss,
      results.moderate.totalLoss,
      results.extreme.totalLoss,
    );

    // Save to DB
    const stressTest = await db.fXStressTest.create({
      data: {
        userId: auth.userId,
        portfolio: JSON.stringify(enrichedPortfolio),
        baseCurrency,
        results: JSON.stringify(results),
        totalAssetValue: Math.round(totalAssetValue),
        maxLossAmount,
      },
    });

    return NextResponse.json({ stressTest, results });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
