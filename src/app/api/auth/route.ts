import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { compare } from 'bcrypt';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();
    const user = await db.user.findUnique({ where: { email } });

    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const valid = await compare(password, user.password);
    if (!valid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const safeUser = { id: user.id, email: user.email, name: user.name, role: user.role };
    return NextResponse.json(safeUser);
  } catch {
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}
