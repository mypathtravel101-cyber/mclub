import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

// Simple hash for demo
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return hash.toString(36);
}

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    
    if (!email || !password) {
      return NextResponse.json({ error: '請輸入電郵和密碼' }, { status: 400 });
    }

    const user = await db.user.findUnique({ where: { email } });
    
    if (!user || user.password !== simpleHash(password)) {
      return NextResponse.json({ error: '電郵或密碼錯誤' }, { status: 401 });
    }

    // Don't return password
    const { password: _, ...safeUser } = user;
    return NextResponse.json({ user: safeUser });
  } catch (error) {
    return NextResponse.json({ error: '登入失敗' }, { status: 500 });
  }
}
