import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { requireAuth, requireRole } from '@/lib/auth-helpers';
import { parsePagination, paginatedResponse, getSkipTake } from '@/lib/pagination';
import { cleanupPastEvents } from '@/lib/event-cleanup';
import { z } from 'zod';

export async function GET(request: Request) {
  try {
    const auth = requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    // Auto-cleanup past events on every list fetch.
    // This is a lazy, soft-failing sweep — if cleanup fails, listing still works.
    // Returns count of deleted events (logged, not surfaced to user).
    const deletedCount = await cleanupPastEvents();
    if (deletedCount > 0) {
      console.log(`[Events] Auto-deleted ${deletedCount} past events on GET /api/events`);
    }

    const params = parsePagination(new URL(request.url).searchParams);
    const { skip, take } = getSkipTake(params);

    // Filter by status
    const status = new URL(request.url).searchParams.get('status');
    const where: Record<string, unknown> = {};
    if (status) where.status = status;

    // For upcoming events, sort ascending (soonest first) so the dashboard's
    // ?status=upcoming&limit=5 fetch returns the next 5 events chronologically.
    // For all other cases (past/completed/all), keep descending (most recent first).
    const orderBy = status === 'upcoming' ? { date: 'asc' as const } : { date: 'desc' as const };

    const [events, total] = await Promise.all([
      db.event.findMany({
        where,
        orderBy,
        skip,
        take,
        include: {
          participants: {
            include: { user: { select: { id: true, name: true } } },
          },
          _count: { select: { participants: true } },
        },
      }),
      db.event.count({ where }),
    ]);

    // Enrich each event with totalAttendees = internal participants + public registrations (non-cancelled)
    const eventIds = events.map(e => e.id);
    const registrationCounts = await db.eventRegistration.groupBy({
      by: ['eventId'],
      where: { eventId: { in: eventIds }, status: { not: 'cancelled' } },
      _sum: { guests: true },
      _count: true,
    });
    const regMap = Object.fromEntries(
      registrationCounts.map(r => [
        r.eventId,
        r._count + (r._sum.guests || 0), // each registration = 1 person + guests
      ])
    );

    const enriched = events.map(e => ({
      ...e,
      totalAttendees: (e._count.participants) + (regMap[e.id] || 0),
    }));

    return NextResponse.json(paginatedResponse(enriched, total, params));
  } catch {
    return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 });
  }
}

const eventSchema = z.object({
  title: z.string().min(1, '活動名稱不能為空'),
  description: z.string().optional(),
  type: z.enum(['seminar', 'webinar', 'meeting', 'training']).default('seminar'),
  // Date must be a valid ISO string AND must be in the future.
  // The frontend date picker already enforces min=now, but defense-in-depth
  // at the API layer blocks direct API calls (curl, scripts, buggy clients)
  // from creating events in the past — which would otherwise be invisible
  // on the calendar (auto-cleanup deletes past events after 30 days).
  date: z
    .string()
    .min(1, '請選擇日期')
    .refine((val) => {
      const d = new Date(val);
      return !isNaN(d.getTime()) && d.getTime() > Date.now();
    }, '活動時間必須為目前時間之後'),
  location: z.string().optional(),
  maxAttendees: z.number().int().min(1).default(50),
  imageUrl: z.string().nullable().optional(),
  status: z.enum(['upcoming', 'ongoing', 'completed', 'cancelled']).default('upcoming'),
});

export async function POST(request: Request) {
  try {
    const auth = requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    // Both admin and director can create events (per Sidebar role config)
    const roleCheck = requireRole(auth, 'admin', 'director');
    if (roleCheck instanceof NextResponse) return roleCheck;

    const body = await request.json();
    const parsed = eventSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || '輸入格式錯誤' },
        { status: 400 }
      );
    }

    const event = await db.event.create({
      data: {
        ...parsed.data,
        date: new Date(parsed.data.date),
      },
    });

    // Create notifications for all directors and admins
    const targetUsers = await db.user.findMany({
      where: { role: { in: ['admin', 'director'] } },
      select: { id: true },
    });

    const eventTypeLabel: Record<string, string> = {
      seminar: '研討會',
      webinar: '網絡研討會',
      meeting: '會議',
      training: '培訓',
    };

    for (const targetUser of targetUsers) {
      await db.notification.create({
        data: {
          userId: targetUser.id,
          title: `📅 新活動：${eventTypeLabel[parsed.data.type] || '活動'}`,
          message: parsed.data.title,
          type: 'info',
        },
      });
    }

    return NextResponse.json(event, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to create event' }, { status: 500 });
  }
}

const eventUpdateSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  type: z.enum(['seminar', 'webinar', 'meeting', 'training']).optional(),
  date: z.string().optional(),
  location: z.string().optional(),
  maxAttendees: z.number().int().min(1).optional(),
  imageUrl: z.string().nullable().optional(),
  status: z.enum(['upcoming', 'ongoing', 'completed', 'cancelled']).optional(),
});

export async function PUT(request: Request) {
  try {
    const auth = requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    const body = await request.json();
    const parsed = eventUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || '輸入格式錯誤' },
        { status: 400 }
      );
    }

    const { id, ...data } = parsed.data;
    if (data.date) {
      data.date = new Date(data.date) as unknown as string;
    }

    const event = await db.event.update({ where: { id }, data });
    return NextResponse.json(event);
  } catch {
    return NextResponse.json({ error: 'Failed to update event' }, { status: 500 });
  }
}
