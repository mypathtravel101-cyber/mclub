// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireRole } from '@/lib/auth-helpers';
import { z } from 'zod';

// PATCH /api/events/[id] — admin or director can update
const eventPatchSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  type: z.enum(['seminar', 'webinar', 'meeting', 'training']).optional(),
  date: z.string().optional(),
  location: z.string().nullable().optional(),
  maxAttendees: z.number().int().min(1).optional(),
  imageUrl: z.string().nullable().optional(),
  status: z.enum(['upcoming', 'ongoing', 'completed', 'cancelled']).optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = requireAuth(req);
    if (auth instanceof NextResponse) return auth;

    // Both admin and director can edit events (matches Sidebar.tsx role config)
    const roleCheck = requireRole(auth, 'admin', 'director');
    if (roleCheck instanceof NextResponse) return roleCheck;

    const { id } = await params;
    const body = await req.json();
    const parsed = eventPatchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || '輸入格式錯誤' },
        { status: 400 }
      );
    }

    const data: Record<string, unknown> = { ...parsed.data };
    if (parsed.data.date) {
      data.date = new Date(parsed.data.date);
    }

    const event = await db.event.update({
      where: { id },
      data,
    });

    return NextResponse.json(event);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : '更新活動失敗';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// DELETE /api/events/[id] — admin or director can delete
// (Sidebar shows events for both roles; both roles can create events,
// so both should be able to remove unauthorized/test events they created)
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = requireAuth(req);
    if (auth instanceof NextResponse) return auth;

    const roleCheck = requireRole(auth, 'admin', 'director');
    if (roleCheck instanceof NextResponse) return roleCheck;

    const { id } = await params;

    // Verify event exists first (return 404 if not, gives cleaner UX)
    const existing = await db.event.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: '活動不存在' }, { status: 404 });
    }

    // Delete in dependency order: registrations, participants, then event
    await db.eventRegistration.deleteMany({ where: { eventId: id } });
    await db.eventParticipant.deleteMany({ where: { eventId: id } });
    await db.event.delete({ where: { id } });

    return NextResponse.json({ message: '活動已刪除', id });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : '刪除活動失敗';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
