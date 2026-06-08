import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserAuth } from '@/lib/auth-helpers';

export const dynamic = 'force-dynamic';

// List alerts
export async function GET(req: NextRequest) {
  const auth = getUserAuth(req);
  if (!auth) return NextResponse.json({ error: '未授權' }, { status: 401 });

  try {
    const alerts = await db.currencyAlert.findMany({
      where: { userId: auth.userId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ alerts });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Create alert
export async function POST(req: NextRequest) {
  const auth = getUserAuth(req);
  if (!auth) return NextResponse.json({ error: '未授權' }, { status: 401 });

  try {
    const body = await req.json();
    const { fromCurrency, toCurrency, threshold, direction } = body;

    if (!fromCurrency || !toCurrency || !threshold) {
      return NextResponse.json({ error: '請填寫所有必填欄位' }, { status: 400 });
    }

    const alert = await db.currencyAlert.create({
      data: {
        userId: auth.userId,
        fromCurrency,
        toCurrency,
        threshold: parseFloat(threshold),
        direction: direction || 'down',
      },
    });

    return NextResponse.json({ alert });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
