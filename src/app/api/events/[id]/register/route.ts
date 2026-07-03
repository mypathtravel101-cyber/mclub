import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const registerSchema = z.object({
  name: z.string().min(1, '請輸入姓名').max(100),
  email: z.string().email('請輸入有效的電郵地址').max(200).transform((v) => v.toLowerCase()),
  phone: z.string().max(50).nullable().optional(),
  guests: z.number().int().min(0).max(20).default(0),
  notes: z.string().max(1000).nullable().optional(),
});

/**
 * Public registration endpoint — NO AUTH REQUIRED.
 *
 * Called by the public registration page at /events/[id]/register.
 * Creates an EventRegistration record and returns confirmation data.
 *
 * Validates:
 *   - Event exists, is upcoming or ongoing
 *   - Sufficient capacity (1 + guests seats)
 *   - No duplicate email per event
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Parse & validate body
    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: '請求格式錯誤' }, { status: 400 });
    }

    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      const msg = parsed.error.issues?.[0]?.message || '表單驗證失敗';
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    const { name, email, phone, guests, notes } = parsed.data;
    const requestedSeats = 1 + guests;

    // Verify event exists and is still open
    const event = await db.event.findUnique({
      where: { id },
      select: { id: true, title: true, maxAttendees: true, status: true },
    });

    if (!event) {
      return NextResponse.json({ error: '活動不存在' }, { status: 404 });
    }

    if (event.status === 'completed' || event.status === 'cancelled') {
      return NextResponse.json({ error: '活動已結束或已取消' }, { status: 410 });
    }

    // Check duplicate email
    const existing = await db.eventRegistration.findUnique({
      where: { eventId_email: { eventId: id, email } },
    });

    if (existing) {
      if (existing.status === 'cancelled') {
        // Re-activate cancelled registration + ensure customer linked
        const customer = await db.customer.upsert({
          where: { email },
          update: {},
          create: { name, email, phone, status: 'prospect' },
        });
        const updated = await db.eventRegistration.update({
          where: { id: existing.id },
          data: { name, phone, guests, notes, status: 'registered', customerId: customer.id },
        });
        return NextResponse.json({
          id: updated.id,
          eventTitle: event.title,
          name: updated.name,
          email: updated.email,
          guests: updated.guests,
          status: updated.status,
        });
      }
      return NextResponse.json(
        { error: '此電郵地址已報名此活動' },
        { status: 409 }
      );
    }

    // Check capacity
    const [participantCount, registrations] = await Promise.all([
      db.eventParticipant.count({
        where: { eventId: id, status: { not: 'cancelled' } },
      }),
      db.eventRegistration.findMany({
        where: { eventId: id, status: { not: 'cancelled' } },
        select: { guests: true },
      }),
    ]);

    const usedSeats =
      participantCount +
      registrations.reduce((sum, r) => sum + 1 + r.guests, 0);
    const available = event.maxAttendees - usedSeats;

    if (requestedSeats > available) {
      return NextResponse.json(
        {
          error: `名額不足。剩餘 ${available} 個座位，您嘗試預留 ${requestedSeats} 個。`,
          available,
          requested: requestedSeats,
        },
        { status: 409 }
      );
    }

    // Create Customer (upsert by email) and link to registration
    const customer = await db.customer.upsert({
      where: { email },
      update: {},
      create: { name, email, phone, status: 'prospect' },
    });

    const registration = await db.eventRegistration.create({
      data: {
        eventId: id,
        name,
        email,
        phone,
        guests,
        notes,
        status: 'registered',
        customerId: customer.id,
      },
    });

    return NextResponse.json({
      id: registration.id,
      eventTitle: event.title,
      name: registration.name,
      email: registration.email,
      guests: registration.guests,
      status: registration.status,
    });
  } catch (e) {
    console.error('[POST /api/events/[id]/register]', e);
    return NextResponse.json({ error: '報名失敗' }, { status: 500 });
  }
}