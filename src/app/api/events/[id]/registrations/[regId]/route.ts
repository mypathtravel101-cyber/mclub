import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import { z } from 'zod';

/**
 * Update a single registration's status — director/admin only.
 *
 * Used by the "Check in" / "Cancel" / "Undo check-in" buttons on the
 * registrations list dialog.
 *
 * Allowed status transitions (no state machine enforced — any director
 * can set any status, similar to how order status works in this CRM):
 *   - registered → attended (check-in)
 *   - attended → registered (undo check-in)
 *   - registered/attended → cancelled (cancel)
 *   - cancelled → registered (revive)
 *
 * Body: { status: 'registered' | 'attended' | 'cancelled' }
 */
const updateSchema = z.object({
  status: z.enum(['registered', 'attended', 'cancelled']),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; regId: string }> }
) {
  try {
    const auth = requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    const { id, regId } = await params;

    // Verify the registration exists and belongs to this event
    const existing = await db.eventRegistration.findUnique({
      where: { id: regId },
      select: { id: true, eventId: true, name: true, status: true },
    });

    if (!existing || existing.eventId !== id) {
      return NextResponse.json({ error: '報名紀錄不存在' }, { status: 404 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: '請求格式錯誤' }, { status: 400 });
    }

    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || '輸入格式錯誤' },
        { status: 400 }
      );
    }

    const updated = await db.eventRegistration.update({
      where: { id: regId },
      data: { status: parsed.data.status },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        guests: true,
        notes: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(updated);
  } catch (e) {
    console.error('[PATCH /api/events/[id]/registrations/[regId]]', e);
    return NextResponse.json({ error: '更新報名狀態失敗' }, { status: 500 });
  }
}
