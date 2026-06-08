import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserAuth } from '@/lib/auth-helpers';

export const dynamic = 'force-dynamic';

// List hedging matches
export async function GET(req: NextRequest) {
  const auth = getUserAuth(req);
  if (!auth) return NextResponse.json({ error: '未授權' }, { status: 401 });

  try {
    const matches = await db.hedgingMatch.findMany({
      where: { userId: auth.userId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ hedgingMatches: matches });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Create hedging match request
export async function POST(req: NextRequest) {
  const auth = getUserAuth(req);
  if (!auth) return NextResponse.json({ error: '未授權' }, { status: 401 });

  try {
    const body = await req.json();
    const { hedgingType, fromCurrency, toCurrency, amount, stressTestId, notes } = body;

    if (!hedgingType || !fromCurrency || !toCurrency || !amount) {
      return NextResponse.json({ error: '請填寫所有必填欄位' }, { status: 400 });
    }

    // Auto-match with demo provider
    const demoProviders = [
      { name: '匯豐銀行', type: 'bank', contact: '+852-2233-3322' },
      { name: '中銀香港', type: 'bank', contact: '+852-2853-3322' },
      { name: '渣打銀行', type: 'bank', contact: '+852-2886-8888' },
    ];
    const provider = demoProviders[Math.floor(Math.random() * demoProviders.length)];

    const match = await db.hedgingMatch.create({
      data: {
        userId: auth.userId,
        stressTestId: stressTestId || null,
        hedgingType,
        fromCurrency,
        toCurrency,
        amount: parseFloat(amount),
        status: 'PENDING',
        matchedProvider: JSON.stringify(provider),
        quote: JSON.stringify({
          rate: fromCurrency === 'USD' && toCurrency === 'HKD' ? 7.82 :
                fromCurrency === 'JPY' && toCurrency === 'HKD' ? 0.0503 :
                fromCurrency === 'RMB' && toCurrency === 'HKD' ? 1.075 : 1,
          fee: parseFloat(amount) * 0.001,
          expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        }),
        commissionRate: 0.5,
        commissionAmount: parseFloat(amount) * 0.005,
        notes: notes || null,
      },
    });

    return NextResponse.json({ hedgingMatch: match });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
