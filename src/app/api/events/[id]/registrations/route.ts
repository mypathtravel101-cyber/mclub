import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';

/**
 * List all registrations for an event — director/admin only.
 *
 * Returns registrations sorted by createdAt ascending (oldest first),
 * so the director sees the order in which clients signed up.
 *
 * Each registration includes:
 *   - id, name, email, phone, guests, notes, status, createdAt
 *   - seats: computed as (1 + guests) for display convenience
 *
 * Also returns a summary object with totals by status.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    const { id } = await params;

    // Verify event exists (return 404 if not, so the director gets a clear error
    // rather than an empty list that looks like the event has no registrations)
    const event = await db.event.findUnique({
      where: { id },
      select: { id: true, title: true, maxAttendees: true },
    });

    if (!event) {
      return NextResponse.json({ error: '活動不存在' }, { status: 404 });
    }

    const registrations = await db.eventRegistration.findMany({
      where: { eventId: id },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        guests: true,
        notes: true,
        status: true,
        createdAt: true,
      },
    });

    // Compute summary
    const summary = {
      total: registrations.length,
      registered: registrations.filter((r) => r.status === 'registered').length,
      attended: registrations.filter((r) => r.status === 'attended').length,
      cancelled: registrations.filter((r) => r.status === 'cancelled').length,
      seatsTaken: registrations
        .filter((r) => r.status !== 'cancelled')
        .reduce((sum, r) => sum + 1 + r.guests, 0),
      maxAttendees: event.maxAttendees,
    };

    // Add computed `seats` field to each registration for frontend convenience
    const enriched = registrations.map((r) => ({
      ...r,
      seats: 1 + r.guests,
    }));

    return NextResponse.json({
      eventTitle: event.title,
      registrations: enriched,
      summary,
    });
  } catch (e) {
    console.error('[GET /api/events/[id]/registrations]', e);
    return NextResponse.json({ error: '讀取報名名單失敗' }, { status: 500 });
  }
}
