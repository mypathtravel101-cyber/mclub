import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

/**
 * Public event info endpoint — NO AUTH REQUIRED.
 *
 * Used by the public registration page at /events/[id]/register so that
 * external clients can view event details (title, date, location, poster,
 * remaining capacity) without logging in.
 *
 * Only upcoming / ongoing events are exposed publicly. Completed or
 * cancelled events return 404 to avoid leaking past event info.
 *
 * Capacity is reported as:
 *   - registered: total seats taken = sum of (1 + guests) for each active registration
 *                 + count of internal EventParticipant records
 *   - maxAttendees: the event's hard cap
 *   - available: max(0, maxAttendees - registered)
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const event = await db.event.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        description: true,
        type: true,
        date: true,
        location: true,
        maxAttendees: true,
        imageUrl: true,
        status: true,
      },
    });

    if (!event) {
      return NextResponse.json({ error: '活動不存在' }, { status: 404 });
    }

    // Don't expose completed/cancelled events publicly
    if (event.status === 'completed' || event.status === 'cancelled') {
      return NextResponse.json({ error: '活動已結束或已取消' }, { status: 404 });
    }

    // Compute current seat usage.
    // Internal participants (directors/admins) each take 1 seat.
    // Guest registrations take (1 + guests) seats, but only those with
    // status !== 'cancelled' count toward capacity.
    const [participantCount, registrations] = await Promise.all([
      db.eventParticipant.count({
        where: { eventId: id, status: { not: 'cancelled' } },
      }),
      db.eventRegistration.findMany({
        where: { eventId: id, status: { not: 'cancelled' } },
        select: { guests: true },
      }),
    ]);

    const guestSeats = registrations.reduce((sum, r) => sum + 1 + r.guests, 0);
    const registered = participantCount + guestSeats;
    const available = Math.max(0, event.maxAttendees - registered);
    const isFull = available === 0;

    return NextResponse.json({
      ...event,
      registered,
      available,
      isFull,
    });
  } catch {
    return NextResponse.json({ error: '讀取活動資訊失敗' }, { status: 500 });
  }
}
