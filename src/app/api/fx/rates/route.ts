import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

// Hardcoded demo FX rates
const DEMO_RATES: Record<string, number> = {
  'USD/HKD': 7.82,
  'USD/RMB': 7.25,
  'USD/JPY': 155.5,
  'HKD/RMB': 0.927,
  'HKD/JPY': 19.89,
  'RMB/JPY': 21.45,
  'USD/USD': 1,
  'HKD/HKD': 1,
  'RMB/RMB': 1,
  'JPY/JPY': 1,
};

export async function GET(req: NextRequest) {
  try {
    // Try to get rates from DB first
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dbRates = await db.currencyRate.findMany({
      where: { date: today },
    });

    if (dbRates.length > 0) {
      const rates: Record<string, number> = {};
      for (const r of dbRates) {
        rates[`${r.fromCurrency}/${r.toCurrency}`] = r.rate;
      }
      return NextResponse.json({ rates, source: 'db', date: today.toISOString() });
    }

    // Return hardcoded demo rates
    return NextResponse.json({ rates: DEMO_RATES, source: 'demo', date: new Date().toISOString() });
  } catch (error: any) {
    return NextResponse.json({ rates: DEMO_RATES, source: 'demo', date: new Date().toISOString() });
  }
}
