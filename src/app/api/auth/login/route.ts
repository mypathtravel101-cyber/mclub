import { db } from '@/lib/db';
import { comparePassword, signToken } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: '請輸入電郵和密碼' }, { status: 400 });
    }

    const user = await db.user.findUnique({ where: { email } });

    if (!user) {
      return NextResponse.json({ error: '電郵或密碼錯誤' }, { status: 401 });
    }

    const valid = await comparePassword(password, user.password);
    if (!valid) {
      return NextResponse.json({ error: '電郵或密碼錯誤' }, { status: 401 });
    }

    // Generate JWT token
    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    });

    // Don't return password
    const { password: _, ...safeUser } = user;
    return NextResponse.json({ user: safeUser, token });
  } catch (error) {
    return NextResponse.json({ error: '登入失敗' }, { status: 500 });
  }
}
